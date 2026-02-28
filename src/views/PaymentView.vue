<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { usePaymentStore, formatRupiahBigNumber } from '@/stores/payment'
import type { Payment, PaymentMethod } from '@/stores/payment'
import { useOrderStore } from '@/stores/order'
import type { OrderBase } from '@/stores/order'
import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue'

const paymentStore = usePaymentStore()
const orderStore = useOrderStore()

const methodOptions: PaymentMethod[] = ['cash', 'qris', 'debit', 'kredit']
const methodLabel: Record<string, string> = {
  cash: 'Cash',
  qris: 'QRIS',
  debit: 'Debit',
  kredit: 'Kredit',
}

const showModal = ref(false)
const isEditing = ref(false)
const editingPayment = ref<Payment | null>(null)
const showDeleteConfirm = ref(false)
const deletingPayment = ref<Payment | null>(null)
const errorMsg = ref('')
const isSubmitting = ref(false)
const isDeleting = ref(false)

const form = reactive({
  order_id: 0,
  amount: '',
  method: 'cash' as PaymentMethod,
  paid_at: '',
})

onMounted(async () => {
  await Promise.all([paymentStore.fetchPayments(), orderStore.fetchOrders()])
})

const orderById = computed(() => {
  const map = new Map<number, OrderBase>()
  for (const order of orderStore.orderList) map.set(order.id, order)
  return map
})

const unpaidOrders = computed(() => {
  const paidOrderIds = new Set(paymentStore.paymentsList.map((payment) => payment.order_id))
  return orderStore.orderList.filter((order) => !paidOrderIds.has(order.id) && order.status !== 'dibatalkan')
})

const selectableOrders = computed(() => {
  if (!isEditing.value || !editingPayment.value) return unpaidOrders.value
  const currentOrder = orderById.value.get(editingPayment.value.order_id)
  if (!currentOrder) return unpaidOrders.value
  const exists = unpaidOrders.value.some((order) => order.id === currentOrder.id)
  return exists ? unpaidOrders.value : [currentOrder, ...unpaidOrders.value]
})

function orderLabel(order: OrderBase) {
  const meja = order.meja?.nomor_meja ?? '-'
  return `${order.order_number} - Meja ${meja}`
}

function openTambah() {
  isEditing.value = false
  editingPayment.value = null
  form.order_id = selectableOrders.value[0]?.id ?? 0
  form.amount = ''
  form.method = 'cash'
  form.paid_at = ''
  errorMsg.value = ''
  showModal.value = true
}

function toInputDateTime(dateValue: string) {
  if (!dateValue) return ''
  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60 * 1000)
  return local.toISOString().slice(0, 16)
}

function openEdit(payment: Payment) {
  isEditing.value = true
  editingPayment.value = payment
  form.order_id = payment.order_id
  form.amount = payment.amount
  form.method = (payment.method as PaymentMethod) ?? 'cash'
  form.paid_at = toInputDateTime(payment.paid_at)
  errorMsg.value = ''
  showModal.value = true
}

function confirmDelete(payment: Payment) {
  deletingPayment.value = payment
  showDeleteConfirm.value = true
}

function toIsoDateTime(value: string) {
  if (!value) return new Date().toISOString()
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString()
  return parsed.toISOString()
}

async function handleSubmit() {
  if (!form.order_id || !form.amount || !form.method) {
    errorMsg.value = 'Order, amount, dan metode wajib diisi.'
    return
  }

  isSubmitting.value = true
  errorMsg.value = ''

  const payload = {
    order_id: form.order_id,
    amount: form.amount,
    method: form.method,
    paid_at: toIsoDateTime(form.paid_at),
  }

  try {
    if (isEditing.value && editingPayment.value) {
      await paymentStore.editPayments(editingPayment.value.id, payload)
    } else {
      await paymentStore.tambahPayments(payload)
    }
    showModal.value = false
  } catch (error: any) {
    errorMsg.value = error?.message ?? 'Gagal menyimpan pembayaran.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleDelete() {
  if (!deletingPayment.value) return
  isDeleting.value = true
  try {
    await paymentStore.deletePayments(deletingPayment.value.id)
    showDeleteConfirm.value = false
    deletingPayment.value = null
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Payments</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="header-row">
        <ion-button @click="openTambah">Tambah Payment</ion-button>
      </div>

      <div v-if="paymentStore.isLoading" class="state-box">Memuat data pembayaran...</div>
      <div v-else-if="paymentStore.paymentsList.length === 0" class="state-box">Belum ada pembayaran.</div>
      <div v-else class="card-grid">
        <article v-for="payment in paymentStore.paymentsList" :key="payment.id" class="card">
          <h3>{{ orderById.get(payment.order_id)?.order_number ?? `Order #${payment.order_id}` }}</h3>
          <p>Metode: {{ methodLabel[payment.method] ?? payment.method }}</p>
          <p>Jumlah: {{ formatRupiahBigNumber(payment.amount) }}</p>
          <p>Paid At: {{ new Date(payment.paid_at).toLocaleString('id-ID') }}</p>
          <div class="actions">
            <button class="btn-edit" @click="openEdit(payment)">Edit</button>
            <button class="btn-delete" @click="confirmDelete(payment)">Hapus</button>
          </div>
        </article>
      </div>

      <div v-if="showModal" class="modal-overlay">
        <div class="modal">
          <h3>{{ isEditing ? 'Edit Payment' : 'Tambah Payment' }}</h3>
          <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
          <select v-model.number="form.order_id">
            <option disabled :value="0">Pilih order</option>
            <option v-for="order in selectableOrders" :key="order.id" :value="order.id">
              {{ orderLabel(order) }}
            </option>
          </select>
          <input v-model="form.amount" type="number" min="0" placeholder="Amount" />
          <select v-model="form.method">
            <option v-for="method in methodOptions" :key="method" :value="method">
              {{ methodLabel[method] }}
            </option>
          </select>
          <input v-model="form.paid_at" type="datetime-local" />
          <div class="modal-actions">
            <button @click="showModal = false">Batal</button>
            <button @click="handleSubmit">{{ isSubmitting ? 'Menyimpan...' : 'Simpan' }}</button>
          </div>
        </div>
      </div>

      <div v-if="showDeleteConfirm" class="modal-overlay">
        <div class="modal">
          <h3>Hapus Payment</h3>
          <p>Yakin hapus payment untuk order <strong>#{{ deletingPayment?.order_id }}</strong>?</p>
          <div class="modal-actions">
            <button @click="showDeleteConfirm = false">Batal</button>
            <button class="btn-delete" @click="handleDelete">
              {{ isDeleting ? 'Menghapus...' : 'Ya, Hapus' }}
            </button>
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

/* ===== STATE ===== */
.state-box {
  padding: 1rem;
  border-radius: 12px;
 
  border: 1px dashed #cde7d4;
  text-align: center;
  color: #00500d;
}

/* ===== CARD GRID ===== */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}

/* ===== CARD ===== */
.card {
  
  border-radius: 16px;
  padding: 1rem;
  border: 1px solid #dfeee3;
  box-shadow: 0 4px 12px rgba(0, 80, 13, 0.05);
  transition: 0.25s ease;
}

.card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 18px rgba(0, 80, 13, 0.08);
}

.card h3 {
  margin: 0 0 0.5rem;
  color: #dcffe2;
}

/* ===== ACTION BUTTONS ===== */
.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.btn-edit,
.btn-delete {
  border: none;
  border-radius: 10px;
  padding: 0.4rem 0.75rem;
  color: #ffffff;
  font-size: 0.8rem;
  transition: 0.3s ease;
}

.btn-edit {
  background: #18a558;
}

.btn-edit:hover {
  background: #14914a;
}

.btn-delete {
  background: #c0392b;
}

.btn-delete:hover {
  background: #a93226;
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
  width: min(450px, 92vw);
  
  border-radius: 20px;
  padding: 1.2rem;
  display: grid;
  gap: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 80, 13, 0.15);
}

.modal h3 {
  margin: 0;
  color: #00500d;
}

/* ===== INPUT ===== */
.modal input,
.modal select {
  width: 100%;
  padding: 0.6rem 0.8rem;
  border-radius: 12px;
  border: 1px solid #dfeee3;
  
  color: #1f2d1f;
  font-size: 0.9rem;
  transition: 0.3s ease;
}

.modal input:focus,
.modal select:focus {
  outline: none;
  border-color: #00500d;
  box-shadow: 0 0 0 2px rgba(0, 80, 13, 0.15);
}

/* ===== MODAL ACTIONS ===== */
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
  color: #ffffff;
  transition: 0.3s ease;
}

.modal-actions button:hover {
  background: #0a7a1a;
}

/* ===== ERROR ===== */
.error {
  color: #c0392b;
  font-size: 0.85rem;
}

</style>