<script setup lang="ts">
import { useStaffStore } from '@/stores/staff'
import type { Staff } from '@/stores/staff'
import { ref, reactive, onMounted } from 'vue'
import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue'

const staffStore = useStaffStore()

const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const errorMsg = ref('')
const showDeleteConfirm = ref(false)
const deletingStaff = ref<Staff | null>(null)
const deleteError = ref('')

const form = reactive({
  nama: '',
  jabatan: '' as '' | 'manager' | 'waiter' | 'koki' | 'pelayan',
  status: '' as '' | 'aktif' | 'tidak_aktif',
  user_id: 0,
})

onMounted(() => {
  staffStore.fetchStaff()
})

function openTambah() {
  editingId.value = null
  isEditing.value = false
  form.nama = ''
  form.jabatan = ''
  form.status = ''
  form.user_id = 0
  errorMsg.value = ''
  showModal.value = true
}

function openEdit(staff: Staff) {
  editingId.value = staff.id
  isEditing.value = true
  form.nama = staff.nama
  form.jabatan = staff.jabatan
  form.status = staff.status
  form.user_id = staff.user_id
  errorMsg.value = ''
  showModal.value = true
}

function confirmDelete(staff: Staff) {
  deletingStaff.value = staff
  deleteError.value = ''
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingStaff.value) return
  try {
    await staffStore.deleteStaff(deletingStaff.value.id)
    showDeleteConfirm.value = false
    deletingStaff.value = null
  } catch (error: any) {
    deleteError.value = error.message || 'Gagal menghapus staff.'
  }
}

async function handleSubmit() {
  const sameName = staffStore.staffList.find(
    (s) => s.nama.toLowerCase().trim() === form.nama.toLowerCase().trim() && s.id !== editingId.value,
  )
  if (sameName) {
    errorMsg.value = 'Nama staff sudah ada'
    return
  }
  if (!form.nama || !form.jabatan || !form.status) {
    errorMsg.value = 'Mohon lengkapi semua data'
    return
  }
  errorMsg.value = ''

  if (isEditing.value && editingId.value !== null) {
    await staffStore.editStaff(editingId.value, {
      nama: form.nama,
      jabatan: form.jabatan as 'manager' | 'waiter' | 'koki' | 'pelayan',
      status: form.status as 'aktif' | 'tidak_aktif',
      user_id: form.user_id,
    })
  } else {
    await staffStore.tambahStaff({
      nama: form.nama,
      jabatan: form.jabatan as 'manager' | 'waiter' | 'koki' | 'pelayan',
      status: form.status as 'aktif' | 'tidak_aktif',
      user_id: form.user_id,
    })
  }
  showModal.value = false
}
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Staff Management</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="header-row">
        <ion-button @click="openTambah">Tambah Staff</ion-button>
      </div>

      <div v-if="staffStore.isLoading" class="state-box">Loading staff...</div>
      <div v-else-if="staffStore.staffList.length === 0" class="state-box">Belum ada staff.</div>
      <div v-else class="table-wrapper">
        <table class="basic-table">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Jabatan</th>
              <th>Status</th>
              <th>User ID</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="staff in staffStore.staffList" :key="staff.id">
              <td>{{ staff.nama }}</td>
              <td>{{ staff.jabatan }}</td>
              <td>{{ staff.status }}</td>
              <td>{{ staff.user_id }}</td>
              <td class="actions">
                <button class="btn-edit" @click="openEdit(staff)">Edit</button>
                <button class="btn-delete" @click="confirmDelete(staff)">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="showModal" class="modal-overlay">
        <div class="modal">
          <h3>{{ isEditing ? 'Edit Staff' : 'Tambah Staff' }}</h3>
          <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
          <input v-model="form.nama" placeholder="Nama" />
          <select v-model="form.jabatan">
            <option disabled value="">Pilih jabatan</option>
            <option value="manager">Manager</option>
            <option value="waiter">Waiter</option>
            <option value="koki">Koki</option>
            <option value="pelayan">Pelayan</option>
          </select>
          <select v-model="form.status">
            <option disabled value="">Pilih status</option>
            <option value="aktif">Aktif</option>
            <option value="tidak_aktif">Tidak aktif</option>
          </select>
          <input v-model.number="form.user_id" type="number" min="0" placeholder="User ID" />
          <div class="modal-actions">
            <button @click="showModal = false">Batal</button>
            <button @click="handleSubmit">Simpan</button>
          </div>
        </div>
      </div>

      <div v-if="showDeleteConfirm" class="modal-overlay">
        <div class="modal">
          <h3>Hapus Staff</h3>
          <p>Yakin hapus <strong>{{ deletingStaff?.nama }}</strong>?</p>
          <p v-if="deleteError" class="error">{{ deleteError }}</p>
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
  border: 1px dashed #3b3f63;
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
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.45);
}
.modal {
  width: min(430px, 92vw);
  background: #1f1f36;
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
  border: 1px solid #3b3f63;
  background: #151528;
  color: #fff;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
.error {
  color: #ff8080;
}
</style>
