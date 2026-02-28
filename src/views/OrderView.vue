<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useOrderStore, formatRupiahBigNumber } from '@/stores/order'
import type { OrderBase, StatusOrder } from '@/stores/order'
import { useMejaStore } from '@/stores/meja'
import { useStaffStore } from '@/stores/staff'
import { useMenuStore } from '@/stores/menu'
import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue'

const orderStore = useOrderStore()
const mejaStore = useMejaStore()
const staffStore = useStaffStore()
const menuStore = useMenuStore()

const query = ref('')
const statusFilter = ref<'all' | string>('all')
const tipeFilter = ref<'all' | string>('all')
const statusOptions = ['menunggu', 'diproses', 'selesai', 'dibatalkan']
const tipeOptions = ['dine_in', 'takeaway']

const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const showDeleteConfirm = ref(false)
const deletingOrder = ref<OrderBase | null>(null)
const formError = ref('')
const statusActionError = ref('')
const submitLoading = ref(false)
const deleteLoading = ref(false)

const form = reactive<{
  meja_id: number
  waiter_id: number
  tipe_order: 'dine_in' | 'takeaway'
  items: Array<{ menu_id: number; jumlah: number; catatan: string }>
}>({
  meja_id: 0,
  waiter_id: 0,
  tipe_order: 'dine_in',
  items: [],
})

onMounted(async () => {
  await Promise.all([
    orderStore.fetchOrders(),
    mejaStore.fetchMeja(),
    staffStore.fetchStaff(),
    menuStore.fetchMenu(),
  ])
})

onUnmounted(() => {
  orderStore.clearSelectedOrder()
})

const filteredOrders = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return orderStore.orderList.filter((order) => {
    const matchKeyword =
      !keyword ||
      order.order_number.toLowerCase().includes(keyword) ||
      (order.meja?.nomor_meja ?? '').toLowerCase().includes(keyword) ||
      (order.waiter?.nama ?? '').toLowerCase().includes(keyword)
    const matchStatus = statusFilter.value === 'all' || order.status === statusFilter.value
    const matchTipe = tipeFilter.value === 'all' || order.tipe_order === tipeFilter.value
    return matchKeyword && matchStatus && matchTipe
  })
})

const waiterOptions = computed(() =>
  staffStore.staffList.filter((staff) => ['waiter', 'pelayan'].includes(staff.jabatan)),
)

const allowedStatusTransitions = computed(() => {
  const status = orderStore.selectedOrder?.status
  if (!status) return []
  return orderStore.getAllowedStatusTransitions(status)
})

function resetFilter() {
  query.value = ''
  statusFilter.value = 'all'
  tipeFilter.value = 'all'
}

function formatTipeOrderLabel(tipe: string) {
  if (tipe === 'dine_in') return 'Dine In'
  if (tipe === 'takeaway' || tipe === 'take_away') return 'Take Away'
  return tipe
}

function formatDate(dateValue: string | null) {
  if (!dateValue) return '-'
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

async function openDetail(order: OrderBase) {
  orderStore.setSelectedFromList(order)
  await orderStore.fetchOrderById(order.id)
}

function openTambah() {
  isEditing.value = false
  editingId.value = null
  form.meja_id = mejaStore.mejaList[0]?.id ?? 0
  form.waiter_id = waiterOptions.value[0]?.id ?? 0
  form.tipe_order = 'dine_in'
  form.items = [{ menu_id: menuStore.menuList[0]?.id ?? 0, jumlah: 1, catatan: '' }]
  formError.value = ''
  showModal.value = true
}

function openEdit(order: OrderBase) {
  isEditing.value = true
  editingId.value = order.id
  form.meja_id = order.meja_id
  form.waiter_id = order.waiter_id
  form.tipe_order = (order.tipe_order as 'dine_in' | 'takeaway') ?? 'dine_in'
  form.items = []
  formError.value = ''
  showModal.value = true
}

function addItemRow() {
  form.items.push({ menu_id: menuStore.menuList[0]?.id ?? 0, jumlah: 1, catatan: '' })
}

function removeItemRow(index: number) {
  if (form.items.length <= 1) return
  form.items.splice(index, 1)
}

async function submitForm() {
  if (!form.meja_id || !form.waiter_id || !form.tipe_order) {
    formError.value = 'Meja, waiter, dan tipe order wajib diisi.'
    return
  }
  if (!isEditing.value) {
    if (form.items.length === 0) {
      formError.value = 'Minimal harus ada 1 item order.'
      return
    }
    if (form.items.some((item) => !item.menu_id || item.jumlah <= 0)) {
      formError.value = 'Semua item wajib pilih menu dan jumlah > 0.'
      return
    }
  }

  formError.value = ''
  submitLoading.value = true
  try {
    if (isEditing.value && editingId.value !== null) {
      await orderStore.editOrder(editingId.value, {
        meja_id: form.meja_id,
        waiter_id: form.waiter_id,
        tipe_order: form.tipe_order,
      })
      if (orderStore.selectedOrder?.id === editingId.value) await orderStore.fetchOrderById(editingId.value)
    } else {
      await orderStore.tambahOrder({
        meja_id: form.meja_id,
        waiter_id: form.waiter_id,
        tipe_order: form.tipe_order,
        items: form.items.map((item) => ({
          menu_id: item.menu_id,
          jumlah: item.jumlah,
          catatan: item.catatan?.trim() || undefined,
        })),
        status: 'menunggu',
      })
    }
    showModal.value = false
  } catch (error: any) {
    formError.value = error?.message ?? 'Gagal menyimpan order.'
  } finally {
    submitLoading.value = false
  }
}

function confirmDelete(order: OrderBase) {
  deletingOrder.value = order
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingOrder.value) return
  deleteLoading.value = true
  try {
    await orderStore.deleteOrder(deletingOrder.value.id)
    showDeleteConfirm.value = false
    deletingOrder.value = null
  } finally {
    deleteLoading.value = false
  }
}

async function changeStatus(nextStatus: StatusOrder) {
  if (!orderStore.selectedOrder) return
  statusActionError.value = ''
  const success = await orderStore.updateOrderStatus(orderStore.selectedOrder.id, nextStatus)
  if (!success) statusActionError.value = 'Gagal update status order.'
}
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Orders</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="header-row">
        <ion-button @click="openTambah">Tambah Order</ion-button>
      </div>

      <div class="toolbar">
        <input v-model="query" type="text" placeholder="Cari order..." />
        <select v-model="statusFilter">
          <option value="all">Semua Status</option>
          <option v-for="status in statusOptions" :key="status" :value="status">{{ status }}</option>
        </select>
        <select v-model="tipeFilter">
          <option value="all">Semua Tipe</option>
          <option v-for="tipe in tipeOptions" :key="tipe" :value="tipe">{{ formatTipeOrderLabel(tipe) }}</option>
        </select>
        <button @click="resetFilter">Reset</button>
      </div>

      <div class="content-grid">
        <section class="list-box">
          <div v-if="orderStore.isLoading" class="state-box">Memuat data order...</div>
          <div v-else-if="filteredOrders.length === 0" class="state-box">Tidak ada data order.</div>
          <article v-for="order in filteredOrders" :key="order.id" class="card">
            <h3>{{ order.order_number }}</h3>
            <p>Status: {{ order.status }}</p>
            <p>Meja: {{ order.meja?.nomor_meja ?? '-' }}</p>
            <p>Waiter: {{ order.waiter?.nama ?? '-' }}</p>
            <p>Tipe: {{ formatTipeOrderLabel(order.tipe_order) }}</p>
            <p>Total: {{ formatRupiahBigNumber(order.total_harga) }}</p>
            <div class="actions">
              <button @click="openDetail(order)">Detail</button>
              <button class="btn-edit" @click="openEdit(order)">Edit</button>
              <button class="btn-delete" @click="confirmDelete(order)">Hapus</button>
            </div>
          </article>
        </section>

        <aside class="detail-box">
          <div v-if="orderStore.isDetailLoading" class="state-box">Memuat detail...</div>
          <template v-else-if="orderStore.selectedOrder">
            <h3>{{ orderStore.selectedOrder.order_number }}</h3>
            <p>Status: {{ orderStore.selectedOrder.status }}</p>
            <p>Dibuat: {{ formatDate(orderStore.selectedOrder.created_at) }}</p>
            <p>Selesai: {{ formatDate(orderStore.selectedOrder.waktu_selesai) }}</p>

            <h4>Status Action</h4>
            <div class="actions">
              <button v-for="nextStatus in allowedStatusTransitions" :key="nextStatus" @click="changeStatus(nextStatus)">
                {{ nextStatus }}
              </button>
            </div>
            <p v-if="statusActionError" class="error">{{ statusActionError }}</p>
          </template>
          <div v-else class="state-box">Pilih order untuk melihat detail.</div>
        </aside>
      </div>

      <div v-if="showModal" class="modal-overlay">
        <div class="modal">
          <h3>{{ isEditing ? 'Edit Order' : 'Tambah Order' }}</h3>
          <p v-if="formError" class="error">{{ formError }}</p>
          <select v-model.number="form.meja_id">
            <option disabled :value="0">Pilih meja</option>
            <option v-for="meja in mejaStore.mejaList" :key="meja.id" :value="meja.id">{{ meja.nomor_meja }}</option>
          </select>
          <select v-model.number="form.waiter_id">
            <option disabled :value="0">Pilih waiter</option>
            <option v-for="waiter in waiterOptions" :key="waiter.id" :value="waiter.id">{{ waiter.nama }}</option>
          </select>
          <select v-model="form.tipe_order">
            <option value="dine_in">Dine In</option>
            <option value="takeaway">Take Away</option>
          </select>

          <div v-if="!isEditing" class="items-box">
            <div class="items-head">
              <strong>Items</strong>
              <button @click="addItemRow">+ Item</button>
            </div>
            <div v-for="(item, index) in form.items" :key="index" class="item-row">
              <select v-model.number="item.menu_id">
                <option disabled :value="0">Pilih menu</option>
                <option v-for="menu in menuStore.menuList" :key="menu.id" :value="menu.id">
                  {{ menu.nama }} (Rp {{ menu.harga }})
                </option>
              </select>
              <input v-model.number="item.jumlah" type="number" min="1" placeholder="Qty" />
              <input v-model="item.catatan" type="text" placeholder="Catatan" />
              <button class="btn-delete" :disabled="form.items.length <= 1" @click="removeItemRow(index)">X</button>
            </div>
          </div>

          <div class="modal-actions">
            <button @click="showModal = false">Batal</button>
            <button @click="submitForm">{{ submitLoading ? 'Menyimpan...' : 'Simpan' }}</button>
          </div>
        </div>
      </div>

      <div v-if="showDeleteConfirm" class="modal-overlay">
        <div class="modal">
          <h3>Hapus Order</h3>
          <p>Yakin hapus order <strong>{{ deletingOrder?.order_number }}</strong>?</p>
          <div class="modal-actions">
            <button @click="showDeleteConfirm = false">Batal</button>
            <button class="btn-delete" @click="handleDelete">{{ deleteLoading ? 'Menghapus...' : 'Hapus' }}</button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
/* ===== BASE ===== */


.header-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}

/* ===== TOOLBAR ===== */
.toolbar {
  display: grid;
  grid-template-columns: 1fr 160px 160px auto;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.toolbar input,
.toolbar select,
.toolbar button {
  padding: 0.6rem 0.8rem;
  border-radius: 12px;
  border: 1px solid #dfeee3;
  background-color: #00500d;
  color: #ffffff;
  font-size: 0.9rem;
}

.toolbar button {
  background: #00500d;
  color: white;
  font-weight: 500;
  transition: 0.3s ease;
}

.toolbar button:hover {
  background: #0a7a1a;
}

/* ===== GRID ===== */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 0.9fr;
  gap: 1rem;
}

/* ===== BOX ===== */
.list-box,
.detail-box {

  border-radius: 16px;
  padding: 1rem;
  border: 1px solid #dfeee3;
  box-shadow: 0 4px 12px rgba(0, 80, 13, 0.05);
}

/* ===== CARD ===== */
.card {
  border-radius: 14px;
  padding: 0.9rem;
  margin-bottom: 0.7rem;
  background-color: #243d21;
  border: 1px solid #e3f3e7;
  transition: 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 14px rgba(0, 80, 13, 0.08);
}

.card h3 {
  margin: 0 0 0.4rem;
  color: #ffffff;
}

/* ===== BUTTONS ===== */
.actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.actions button {
  border: none;
  border-radius: 10px;
  padding: 0.4rem 0.7rem;
  color: white;
  background: #00500d;
  font-size: 0.8rem;
  transition: 0.3s ease;
}

.actions button:hover {
  background: #0a7a1a;
}

.btn-edit {
  background: #18a558 !important;
}

.btn-delete {
  background: #c0392b !important;
}

/* ===== STATE BOX ===== */
.state-box {
  padding: 1rem;
  border-radius: 12px;
 
  border: 1px dashed #cde7d4;
  text-align: center;
  color: #cbffd5;
}

/* ===== MODAL ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 80, 13, 0.2);
}

.modal {
  width: min(680px, 94vw);
  
  border-radius: 20px;
  padding: 1.2rem;
  display: grid;
  gap: 0.7rem;
  box-shadow: 0 10px 25px rgba(0, 80, 13, 0.15);
}

.modal input,
.modal select {
  padding: 0.6rem 0.8rem;
  border-radius: 12px;
  border: 1px solid #dfeee3;
  
  color: #1f2d1f;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}

.modal-actions button {
  border-radius: 12px;
  padding: 0.5rem 1rem;
  border: none;
  background: #00500d;
  color: white;
  transition: 0.3s ease;
}

.modal-actions button:hover {
  background: #0a7a1a;
}

.error {
  color: #c0392b;
  font-size: 0.85rem;
}

/* ===== MOBILE RESPONSIVE ===== */
@media (max-width: 1100px) {
  .toolbar {
    grid-template-columns: 1fr;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .item-row {
    grid-template-columns: 1fr;
  }
}
</style>