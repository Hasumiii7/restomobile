<script setup lang="ts">
import { useMejaStore } from '@/stores/meja'
import type { Meja } from '@/stores/meja'
import { onMounted, reactive, ref } from 'vue'
import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue'

const mejaStore = useMejaStore()
const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const showDeleteConfirm = ref(false)
const deletingMeja = ref<Meja | null>(null)
const errorMsg = ref('')

// Theme handling
const theme = ref('dark')

function applyTheme() {
  document.documentElement.setAttribute('data-theme', theme.value)
  localStorage.setItem('theme', theme.value)
}

const form = reactive({
  nomor_meja: '',
  kapasitas: 1,
  is_tersedia: true,
})

onMounted(() => {
  mejaStore.fetchMeja()
  const saved = localStorage.getItem('theme')
  if (saved) theme.value = saved
  else theme.value = 'dark'
  applyTheme()
})

function openTambah() {
  isEditing.value = false
  editingId.value = null
  form.nomor_meja = ''
  form.kapasitas = 1
  form.is_tersedia = true
  errorMsg.value = ''
  showModal.value = true
}

function openEdit(meja: Meja) {
  isEditing.value = true
  editingId.value = meja.id
  form.nomor_meja = meja.nomor_meja
  form.kapasitas = meja.kapasitas
  form.is_tersedia = meja.is_tersedia
  errorMsg.value = ''
  showModal.value = true
}

async function handleSubmit() {
  const sameName = mejaStore.mejaList.find(
    (m) =>
      m.nomor_meja.toLowerCase().trim() === form.nomor_meja.toLowerCase().trim() &&
      m.id !== editingId.value,
  )
  if (sameName) {
    errorMsg.value = 'Nomor meja sudah ada'
    return
  }

  if (isEditing.value && editingId.value !== null) {
    await mejaStore.updateMeja(editingId.value, { ...form })
  } else {
    await mejaStore.tambahMeja({ ...form })
  }
  showModal.value = false
}

function confirmDelete(meja: Meja) {
  deletingMeja.value = meja
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingMeja.value) return
  await mejaStore.deleteMeja(deletingMeja.value.id)
  showDeleteConfirm.value = false
  deletingMeja.value = null
}
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Manajemen Meja</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="header-row">
        <div class="theme-group">
          <label for="theme-select">Tema</label>
          <select id="theme-select" v-model="theme" @change="applyTheme">
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="sunset">Sunset</option>
          </select>
        </div>
        <ion-button @click="openTambah">Tambah Meja</ion-button>
      </div>

      <div v-if="mejaStore.isLoading" class="state-box">Loading meja...</div>
      <div v-else-if="mejaStore.mejaList.length === 0" class="state-box">Belum ada data meja.</div>
      <div v-else class="card-grid">
        <article v-for="meja in mejaStore.mejaList" :key="meja.id" class="card">
          <h3>{{ meja.nomor_meja }}</h3>
          <p>Kapasitas: {{ meja.kapasitas }}</p>
          <p>Status: {{ meja.is_tersedia ? 'Tersedia' : 'Terisi' }}</p>
          <div class="actions">
            <button class="btn-edit" @click="openEdit(meja)">Edit</button>
            <button class="btn-delete" @click="confirmDelete(meja)">Hapus</button>
          </div>
        </article>
      </div>

      <div v-if="showModal" class="modal-overlay">
        <div class="modal">
          <h3>{{ isEditing ? 'Edit Meja' : 'Tambah Meja' }}</h3>
          <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
          <input v-model="form.nomor_meja" placeholder="Nomor meja" />
          <input v-model.number="form.kapasitas" type="number" min="1" placeholder="Kapasitas" />
          <select v-model="form.is_tersedia">
            <option :value="true">Tersedia</option>
            <option :value="false">Terisi</option>
          </select>
          <div class="modal-actions">
            <button @click="showModal = false">Batal</button>
            <button @click="handleSubmit">Simpan</button>
          </div>
        </div>
      </div>

      <div v-if="showDeleteConfirm" class="modal-overlay">
        <div class="modal">
          <h3>Hapus Meja</h3>
          <p>Yakin hapus meja <strong>{{ deletingMeja?.nomor_meja }}</strong>?</p>
          <div class="modal-actions">
            <button @click="showDeleteConfirm = false">Batal</button>
            <button class="btn-delete" @click="handleDelete">Ya, Hapus</button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.header-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}
.state-box {
  padding: 0.9rem;
  border-radius: 10px;
  border: 1px dashed var(--color-border);
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 0.75rem;
}
.card {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 0.85rem;
}
.card h3 {
  margin: 0 0 0.5rem;
}
.actions {
  display: flex;
  gap: 0.4rem;
}
.btn-edit,
.btn-delete {
  border: none;
  border-radius: 8px;
  padding: 0.35rem 0.6rem;
  color: var(--color-text);
}
.btn-edit {
  background-color: #34c42f;
}
.btn-delete {
  background: var(--color-danger);
}
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--overlay-bg);
}
.modal {
  width: min(430px, 92vw);
  background: var(--color-modal-bg);
  border-radius: 12px;
  padding: 1rem;
  display: grid;
  gap: 0.55rem;
}
.modal input,
.modal select {
  width: 100%;
  padding: 0.55rem 0.65rem;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-input-bg);
  color: var(--color-text);
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
.error {
  color: var(--color-error);
}

.theme-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-right: auto;
}
.theme-group label {
  font-size: 0.9rem;
}
.theme-group select {
  padding: 0.35rem 0.45rem;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-input-bg);
  color: var(--color-text);
}
</style>
