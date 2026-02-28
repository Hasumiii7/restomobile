import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'

export type TipeOrder = 'dine_in' | 'takeaway' | 'delivery' | string
export type StatusOrder = 'menunggu' | 'diproses' | 'selesai' | 'dibatalkan' | string
export const ORDER_STATUS_TRANSITIONS: Record<string, StatusOrder[]> = {
  menunggu: ['diproses', 'dibatalkan'],
  diproses: ['selesai', 'dibatalkan'],
  selesai: [],
  dibatalkan: [],
}

export interface OrderMeja {
  id: number
  nomor_meja: string
  kapasitas: number
}

export interface OrderWaiter {
  id: number
  nama: string
  jabatan: string
}

export interface OrderItem {
  id?: number | null
  menu_id?: number | null
  menu_name: string
  qty: number
  harga: string
  subtotal: string
  catatan?: string | null
  raw?: Record<string, unknown>
}

export interface OrderPayment {
  id: number
  method: string
  amount: string
  paid_at: string
}

export interface OrderBase {
  id: number
  order_number: string
  meja_id: number
  waiter_id: number
  tipe_order: TipeOrder
  status: StatusOrder
  total_harga: string
  created_at: string
  waktu_selesai: string | null
  meja: OrderMeja | null
  waiter: OrderWaiter | null
}

export interface OrderDetail extends OrderBase {
  items: OrderItem[]
  payment: OrderPayment | null
}

export interface CreateOrderPayload {
  meja_id: number
  waiter_id: number
  tipe_order: TipeOrder
  items: Array<{
    menu_id: number
    jumlah: number
    catatan?: string
  }>
  status?: StatusOrder
}

export interface UpdateOrderPayload {
  meja_id?: number
  waiter_id?: number
  tipe_order?: TipeOrder
  status?: StatusOrder
}

interface ApiOrderBase extends Omit<OrderBase, 'total_harga'> {
  total_harga: string | number
}

interface ApiOrderDetail extends ApiOrderBase {
  items?: unknown
  order_items?: unknown
  payment?: {
    id: number
    method: string
    amount: string | number
    paid_at: string
  } | null
}

function sanitizeBigNumber(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '0'
  const raw = String(value).trim()
  if (!raw) return '0'

  const sign = raw.startsWith('-') ? '-' : ''
  const withoutSign = raw.replace(/^[+-]/, '')
  const [integerRaw, decimalRaw] = withoutSign.split('.')
  const integer = (integerRaw || '0').replace(/^0+(?=\d)/, '')
  const decimal = decimalRaw?.replace(/0+$/, '')

  return decimal && decimal.length > 0 ? `${sign}${integer}.${decimal}` : `${sign}${integer}`
}

function toOrderBase(order: ApiOrderBase): OrderBase {
  return {
    ...order,
    total_harga: sanitizeBigNumber(order.total_harga),
    waktu_selesai: order.waktu_selesai ?? null,
    meja: order.meja ?? null,
    waiter: order.waiter ?? null,
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object') {
    return value as Record<string, unknown>
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>
      }
    } catch {
      // Ignore invalid JSON-like strings.
    }
  }

  return {}
}

function asNumber(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function findFirstValueByKeys(
  source: unknown,
  keys: string[],
  maxDepth = 3,
): unknown {
  if (!source || typeof source !== 'object' || maxDepth < 0) return undefined
  const record = source as Record<string, unknown>
  const targetKeys = keys.map((key) => key.toLowerCase())

  for (const [key, value] of Object.entries(record)) {
    if (targetKeys.includes(key.toLowerCase())) {
      return value
    }
  }

  if (maxDepth === 0) return undefined

  for (const value of Object.values(record)) {
    if (value && typeof value === 'object') {
      const nested = findFirstValueByKeys(value, keys, maxDepth - 1)
      if (nested !== undefined) return nested
    }
  }

  return undefined
}

function pickMenuName(record: Record<string, unknown>): string {
  const explicitName = findFirstValueByKeys(record, [
    'menu_name',
    'nama_menu',
    'menu_nama',
    'nama',
    'name',
  ])

  const text = typeof explicitName === 'string' ? explicitName.trim() : String(explicitName ?? '').trim()
  return text || 'Item'
}

function pickQty(record: Record<string, unknown>): number {
  const explicitQty = findFirstValueByKeys(record, ['qty', 'quantity', 'jumlah', 'count'])
  return asNumber(explicitQty)
}

function pickPrice(record: Record<string, unknown>): string {
  const explicitPrice = findFirstValueByKeys(record, [
    'harga_at_time',
    'harga',
    'price',
    'harga_satuan',
    'unit_price',
    'unitPrice',
  ])
  return sanitizeBigNumber(explicitPrice as string | number | null | undefined)
}

function pickSubtotal(record: Record<string, unknown>, qty: number, price: string): string {
  const explicitSubtotal = findFirstValueByKeys(record, [
    'subtotal',
    'total_harga',
    'total',
    'line_total',
    'lineTotal',
    'amount',
  ])

  if (explicitSubtotal !== undefined) {
    return sanitizeBigNumber(explicitSubtotal as string | number | null | undefined)
  }

  return sanitizeBigNumber(qty * asNumber(price))
}

function normalizeOrderItem(rawItem: unknown): OrderItem {
  const record = asRecord(rawItem)
  const menuRecord = asRecord(
    record.menu ?? record.menu_item ?? record.item_menu ?? record.menuData ?? record.menu_detail,
  )

  const qty = pickQty(record)
  const harga = sanitizeBigNumber(
    (record.harga_at_time as string | number | undefined) ??
      (record.harga as string | number | undefined) ??
      (menuRecord.harga as string | number | undefined) ??
      pickPrice(record),
  )
  const subtotal = pickSubtotal(record, qty, harga)
  const idValue = asNumber(record.id) || asNumber(findFirstValueByKeys(record, ['id']))
  const menuIdValue =
    asNumber(record.menu_id) ||
    asNumber(menuRecord.id) ||
    asNumber(findFirstValueByKeys(record, ['menu_id', 'id_menu', 'menuId']))

  return {
    id: idValue || null,
    menu_id: menuIdValue || null,
    menu_name: String(record.nama_menu ?? menuRecord.nama ?? pickMenuName(record)),
    qty,
    harga,
    subtotal,
    catatan:
      (record.catatan as string | undefined) ??
      (record.notes as string | undefined) ??
      (record.note as string | undefined) ??
      null,
    raw: record,
  }
}

function extractOrderItems(order: ApiOrderDetail): OrderItem[] {
  const orderRecord = order as unknown as Record<string, unknown>
  const rawItems =
    order.items ??
    order.order_items ??
    orderRecord.orderItems ??
    orderRecord.detail ??
    orderRecord.order_detail

  if (Array.isArray(rawItems)) {
    return rawItems.map(normalizeOrderItem)
  }

  if (typeof rawItems === 'string') {
    try {
      const parsed = JSON.parse(rawItems) as unknown
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeOrderItem)
      }
      if (parsed && typeof parsed === 'object') {
        const parsedRecord = parsed as Record<string, unknown>
        const parsedNested = parsedRecord.items ?? parsedRecord.data
        if (Array.isArray(parsedNested)) {
          return parsedNested.map(normalizeOrderItem)
        }
      }
    } catch {
      // Ignore invalid JSON strings.
    }
  }

  if (rawItems && typeof rawItems === 'object') {
    const record = rawItems as Record<string, unknown>
    const nested = record.items ?? record.data
    if (Array.isArray(nested)) {
      return nested.map(normalizeOrderItem)
    }
  }

  return []
}

function toOrderDetail(order: ApiOrderDetail): OrderDetail {
  return {
    ...toOrderBase(order),
    items: extractOrderItems(order),
    payment: order.payment
      ? {
          ...order.payment,
          amount: sanitizeBigNumber(order.payment.amount),
        }
      : null,
  }
}

export function formatRupiahBigNumber(value: string): string {
  const [integerPart = '0', decimal] = sanitizeBigNumber(value).split('.')
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return decimal ? `Rp ${grouped},${decimal}` : `Rp ${grouped}`
}

export const useOrderStore = defineStore('order', () => {
  const orderList = ref<OrderBase[]>([])
  const selectedOrder = ref<OrderDetail | null>(null)
  const isLoading = ref(false)
  const isDetailLoading = ref(false)
  const detailError = ref('')
  const isStatusUpdating = ref(false)

  async function fetchOrders() {
    isLoading.value = true
    try {
      const response = await api.get<ApiOrderBase[]>('/order')
      orderList.value = response.data.map(toOrderBase)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchOrderById(id: number) {
    isDetailLoading.value = true
    detailError.value = ''
    try {
      const response = await api.get<ApiOrderDetail>(`/order/${id}`)
      selectedOrder.value = toOrderDetail(response.data)
      return selectedOrder.value
    } catch (error) {
      console.error('Error fetching order detail:', error)
      detailError.value = 'Gagal memuat detail order.'
      return null
    } finally {
      isDetailLoading.value = false
    }
  }

  async function tambahOrder(data: CreateOrderPayload) {
    try {
      const response = await api.post<ApiOrderBase>('/order', data)
      const normalized = toOrderBase(response.data)
      orderList.value.unshift(normalized)
      return normalized
    } catch (error) {
      console.error('Error adding order:', error)
      throw error
    }
  }

  async function editOrder(id: number, data: UpdateOrderPayload) {
    try {
      const response = await api.patch<ApiOrderBase>(`/order/${id}`, data)
      const normalized = toOrderBase(response.data)
      upsertOrder(normalized)

      if (selectedOrder.value?.id === id) {
        selectedOrder.value = {
          ...selectedOrder.value,
          ...normalized,
        }
      }

      return normalized
    } catch (error) {
      console.error('Error updating order:', error)
      throw error
    }
  }

  async function deleteOrder(id: number) {
    try {
      await api.delete(`/order/${id}`)
      orderList.value = orderList.value.filter((order) => order.id !== id)
      if (selectedOrder.value?.id === id) {
        clearSelectedOrder()
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      throw error
    }
  }

  function upsertOrder(data: ApiOrderBase | OrderBase) {
    const normalized = toOrderBase(data as ApiOrderBase)
    const index = orderList.value.findIndex(order => order.id === normalized.id)

    if (index === -1) {
      orderList.value.unshift(normalized)
      return
    }

    orderList.value[index] = normalized
  }

  function clearSelectedOrder() {
    selectedOrder.value = null
    detailError.value = ''
  }

  function setSelectedFromList(order: OrderBase) {
    selectedOrder.value = {
      ...order,
      items: [],
      payment: null,
    }
    detailError.value = ''
  }

  function getAllowedStatusTransitions(currentStatus: StatusOrder): StatusOrder[] {
    return ORDER_STATUS_TRANSITIONS[currentStatus] ?? []
  }

  async function updateOrderStatus(id: number, nextStatus: StatusOrder) {
    const currentStatus = selectedOrder.value?.id === id ? selectedOrder.value.status : undefined
    const allowed = currentStatus ? getAllowedStatusTransitions(currentStatus) : undefined

    if (allowed && !allowed.includes(nextStatus)) {
      throw new Error(`Transisi status tidak valid: ${currentStatus} -> ${nextStatus}`)
    }

    isStatusUpdating.value = true
    try {
      await editOrder(id, { status: nextStatus })
      await fetchOrderById(id)
      return true
    } catch (error) {
      console.error('Error updating order status:', error)
      return false
    } finally {
      isStatusUpdating.value = false
    }
  }

  return {
    orderList,
    selectedOrder,
    isLoading,
    isDetailLoading,
    detailError,
    isStatusUpdating,
    fetchOrders,
    fetchOrderById,
    tambahOrder,
    editOrder,
    deleteOrder,
    updateOrderStatus,
    getAllowedStatusTransitions,
    upsertOrder,
    setSelectedFromList,
    clearSelectedOrder,
  }
})
