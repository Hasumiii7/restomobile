<script setup lang="ts">
import { useKategoriStore } from '@/stores/kategori'
import type { Kategori } from '@/stores/kategori'
import { onMounted, reactive, ref } from 'vue'
import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue'

const kategoriStore = useKategoriStore()

onMounted(() => {
  kategoriStore.fetchKategori()
})

const isEditing = ref(false)
const showModal = ref(false)
const editingId = ref<number | null>(null)
const errorMsg = ref('')
const showDeleteConfirm = ref(false)
const deletingKategori = ref<Kategori | null>(null)
const deleteError = ref('')

const form = reactive<Kategori>({
  id: 0,
  nama: '',
})

function openTambah() {
  editingId.value = null
  isEditing.value = false
  form.id = 0
  form.nama = ''
  errorMsg.value = ''
  showModal.value = true
}

function openEdit(kategori: Kategori) {
  editingId.value = kategori.id
  isEditing.value = true
  form.id = kategori.id
  form.nama = kategori.nama
  errorMsg.value = ''
  showModal.value = true
}

function confirmDelete(kategori: Kategori) {
  deletingKategori.value = kategori
  deleteError.value = ''
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingKategori.value) return
  try {
    await kategoriStore.deleteKategori(deletingKategori.value.id)
    showDeleteConfirm.value = false
    deletingKategori.value = null
  } catch (error: any) {
    deleteError.value = error.message || 'Gagal menghapus kategori'
  }
}

async function handleSubmit() {
  const sameName = kategoriStore.kategoriList.find(
    (k) => k.nama.toLowerCase().trim() === form.nama.toLowerCase().trim() && k.id !== editingId.value,
  )
  if (sameName) {
    errorMsg.value = 'Nama kategori sudah ada'
    return
  }

  if (isEditing.value && editingId.value !== null) {
    await kategoriStore.editKategori(editingId.value, { nama: form.nama })
  } else {
    await kategoriStore.tambahKategori({ nama: form.nama })
  }
  showModal.value = false
}
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Manajemen Kategori</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="page-header">
        <ion-button @click="openTambah">Tambah Kategori</ion-button>
      </div>

      <div v-if="kategoriStore.isLoading" class="state-box">Loading kategori...</div>
      <div v-else-if="kategoriStore.kategoriList.length === 0" class="state-box">Belum ada kategori.</div>
      <div v-else class="table-wrapper">
        <table class="basic-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>ID</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="kategori in kategoriStore.kategoriList" :key="kategori.id">
              <td>{{ kategori.nama }}</td>
              <td>{{ kategori.id }}</td>
              <td class="actions">
                <button class="btn-edit" @click="openEdit(kategori)">Edit</button>
                <button class="btn-delete" @click="confirmDelete(kategori)">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="showModal" class="modal-overlay">
        <div class="modal">
          <h3>{{ isEditing ? 'Edit Kategori' : 'Tambah Kategori' }}</h3>
          <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
          <input v-model="form.nama" placeholder="Nama kategori" />
          <div class="modal-actions">
            <button @click="showModal = false">Batal</button>
            <button @click="handleSubmit">Simpan</button>
          </div>
        </div>
      </div>

      <div v-if="showDeleteConfirm" class="modal-overlay">
        <div class="modal">
          <h3>Konfirmasi Hapus</h3>
          <p>Yakin hapus <strong>{{ deletingKategori?.nama }}</strong>?</p>
          <p v-if="deleteError" class="error">{{ deleteError }}</p>
          <div class="modal-actions">
            <button @click="showDeleteConfirm = false">Batal</button>
            <button class="btn-delete" @click="handleDelete">Hapus</button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.page-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 1rem;
}
.state-box {
  padding: 0.9rem;
  border: 1px dashed #3b3f63;
  border-radius: 10px;
}
.table-wrapper {
  overflow: auto;
}
.basic-table {
  width: 100%;
  border-collapse: collapse;
}
.basic-table th,
.basic-table td {
  padding: 0.7rem;
  border-bottom: 1px solid #2a2a4a;
  text-align: left;
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
  color: #fff;
}
.btn-edit {
  background: #34c42f;
}
.btn-delete {
  background: #c04a4a;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
}
.modal {
  width: min(420px, 92vw);
  background: #1f1f36;
  border-radius: 12px;
  padding: 1rem;
}
.modal input {
  width: 100%;
  padding: 0.55rem 0.65rem;
  border-radius: 8px;
  border: 1px solid #3b3f63;
  background: #151528;
  color: #fff;
}
.modal-actions {
  margin-top: 0.8rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
.error {
  color: #ff8080;
}
</style>
