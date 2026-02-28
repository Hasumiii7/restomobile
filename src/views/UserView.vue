<script setup lang="ts">
import { useUserStore } from '@/stores/user'
import type { User } from '@/stores/user'
import { onMounted, ref, reactive } from 'vue'
import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue'

const userStore = useUserStore()

const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const errorMsg = ref('')
const showDeleteConfirm = ref(false)
const deletingUser = ref<User | null>(null)
const deleteError = ref('')

const form = reactive({
  username: '',
  email: '',
  password: '',
  role: '' as 'admin' | 'user' | 'pegawai' | '',
})

onMounted(() => {
  userStore.fetchUser()
})

function openTambah() {
  editingId.value = null
  isEditing.value = false
  form.username = ''
  form.email = ''
  form.password = ''
  form.role = ''
  errorMsg.value = ''
  showModal.value = true
}

function openEdit(user: User) {
  editingId.value = user.id
  isEditing.value = true
  form.username = user.username
  form.email = user.email
  form.password = ''
  form.role = user.role
  errorMsg.value = ''
  showModal.value = true
}

function confirmDelete(user: User) {
  deletingUser.value = user
  deleteError.value = ''
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingUser.value) return
  try {
    await userStore.deleteUser(deletingUser.value.id)
    showDeleteConfirm.value = false
    deletingUser.value = null
  } catch (error: any) {
    deleteError.value = error.message || 'Gagal menghapus user.'
  }
}

async function handleSubmit() {
  const sameName = userStore.userList.find(
    (u) => u.username.toLowerCase().trim() === form.username.toLowerCase().trim() && u.id !== editingId.value,
  )
  if (sameName) {
    errorMsg.value = 'Username sudah ada'
    return
  }

  const sameEmail = userStore.userList.find((u) => u.email === form.email && u.id !== editingId.value)
  if (sameEmail) {
    errorMsg.value = 'Email sudah ada'
    return
  }

  if (isEditing.value && editingId.value !== null) {
    await userStore.editUser(editingId.value, {
      username: form.username,
      email: form.email,
      password: form.password,
      role: form.role as 'admin' | 'user' | 'pegawai',
    })
  } else {
    await userStore.tambahUser({
      username: form.username,
      email: form.email,
      password: form.password,
      role: form.role as 'admin' | 'user' | 'pegawai',
    })
  }
  showModal.value = false
}
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Manajemen User</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="header-row">
        <ion-button @click="openTambah">Tambah User</ion-button>
      </div>

      <div v-if="userStore.isLoading" class="state-box">Loading user...</div>
      <div v-else-if="userStore.userList.length === 0" class="state-box">Belum ada data user.</div>
      <div v-else class="table-wrapper">
        <table class="basic-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in userStore.userList" :key="user.id">
              <td>{{ user.id }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.role }}</td>
              <td class="actions">
                <button class="btn-edit" @click="openEdit(user)">Edit</button>
                <button class="btn-delete" @click="confirmDelete(user)">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="showModal" class="modal-overlay">
        <div class="modal">
          <h3>{{ isEditing ? 'Edit User' : 'Tambah User' }}</h3>
          <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
          <input v-model="form.username" type="text" placeholder="Username" />
          <input v-model="form.email" type="email" placeholder="Email" />
          <input v-model="form.password" type="password" placeholder="Password" />
          <select v-model="form.role">
            <option value="" disabled>Pilih role</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
            <option value="pegawai">Pegawai</option>
          </select>
          <div class="modal-actions">
            <button @click="showModal = false">Batal</button>
            <button @click="handleSubmit">Simpan</button>
          </div>
        </div>
      </div>

      <div v-if="showDeleteConfirm" class="modal-overlay">
        <div class="modal">
          <h3>Hapus User</h3>
          <p>Yakin hapus user <strong>{{ deletingUser?.username }}</strong>?</p>
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
