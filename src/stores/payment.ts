import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'

export type PaymentMethod = 'cash' | 'qris' | 'debit' | 'kredit'

export interface Payment {
    id: number
    order_id: number
    amount: string
    method: PaymentMethod | string
    paid_at: string
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

export function formatRupiahBigNumber(value: string): string {
  const [integerPart = '0', decimal] = sanitizeBigNumber(value).split('.')
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return decimal ? `Rp ${grouped},${decimal}` : `Rp ${grouped}`
}

function normalizePayment(payment: Payment): Payment {
  return {
    ...payment,
    amount: sanitizeBigNumber(payment.amount),
  }
}

export const usePaymentStore = defineStore('payment', () => {
    const paymentsList = ref<Payment[]>([])
    const isLoading = ref(false)

    async function fetchPayments() {
        isLoading.value = true
        try {
            const response = await api.get<Payment[]>('/payment')
            paymentsList.value = response.data.map(normalizePayment)
        } catch (error) {
            console.error('Failed to fetch payments:', error)
        } finally {
            isLoading.value = false
        }
    }

    async function tambahPayments(data: Omit<Payment, 'id'>) {
        try {
            const response = await api.post<Payment>('/payment', {
                order_id: data.order_id,
                amount: sanitizeBigNumber(data.amount),
                method: data.method,
                paid_at: data.paid_at
            })
            paymentsList.value.push(normalizePayment(response.data))
        } catch (error) {
            console.error('Failed to add payment:', error)
            throw error
        }
    }

    async function editPayments(id: number, data: Omit<Payment, 'id'>) {
        try {
            const response = await api.patch<Payment>('/payment/' + id, {
                order_id: data.order_id,
                amount: sanitizeBigNumber(data.amount),
                method: data.method,
                paid_at: data.paid_at
            })
            const index = paymentsList.value.findIndex(payment => payment.id === id)
            if (index !== -1) {
                paymentsList.value[index] = normalizePayment(response.data)
            }
        } catch (error) {
            console.error('Failed to edit payment:', error)
            throw error
        }
    }

    async function deletePayments(id: number) {
        try {
            await api.delete('/payment/' + id)
            paymentsList.value = paymentsList.value.filter(p => p.id !== id)
        } catch (error) {
            console.error('Failed to delete payment:', error)
            throw error
        }
    }

    return {
        paymentsList,
        isLoading,
        fetchPayments,
        tambahPayments,
        editPayments,
        deletePayments
    }
})
