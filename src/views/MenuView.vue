<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useMenuStore } from '@/stores/menu'
import type { Menu } from '@/stores/menu'
import { useKategoriStore } from '@/stores/kategori'
import { IonButton, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue'

const menuStore = useMenuStore()
const kategoriStore = useKategoriStore()

const showModal = ref(false)
const isEditing = ref(false)
const editingId = ref<number | null>(null)
const errorMsg = ref('')
const deleteError = ref('')
const showDeleteConfirm = ref(false)
const deletingMenu = ref<Menu | null>(null)

const form = reactive({
  nama: '',
  harga: 0,
  current_stok: 0,
  is_tersedia: false,
  kategori_id: 0,
})

onMounted(() => {
  menuStore.fetchMenu()
  kategoriStore.fetchKategori()
})

function openTambah() {
  editingId.value = null
  isEditing.value = false
  form.nama = ''
  form.harga = 0
  form.current_stok = 0
  form.is_tersedia = false
  form.kategori_id = 0
  errorMsg.value = ''
  showModal.value = true
}

function openEdit(menu: Menu) {
  editingId.value = menu.id
  isEditing.value = true
  form.nama = menu.nama
  form.harga = menu.harga
  form.current_stok = menu.current_stok
  form.is_tersedia = menu.is_tersedia
  form.kategori_id = menu.kategori.id
  errorMsg.value = ''
  showModal.value = true
}

function confirmDelete(menu: Menu) {
  deletingMenu.value = menu
  deleteError.value = ''
  showDeleteConfirm.value = true
}

async function handleDelete() {
  if (!deletingMenu.value) return
  try {
    await menuStore.deleteMenu(deletingMenu.value.id)
    showDeleteConfirm.value = false
    deletingMenu.value = null
  } catch (error: any) {
    deleteError.value = error.message || 'Gagal menghapus menu.'
  }
}

async function handleSubmit() {
  const sameName = menuStore.menuList.find(
    (m) => m.nama.toLowerCase().trim() === form.nama.toLowerCase().trim() && m.id !== editingId.value,
  )
  if (sameName) {
    errorMsg.value = 'Nama menu sudah ada'
    return
  }
  if (!form.nama || form.harga < 0 || form.current_stok < 0 || form.kategori_id === 0) {
    errorMsg.value = 'Mohon lengkapi semua data dengan benar'
    return
  }
  errorMsg.value = ''

  if (isEditing.value && editingId.value !== null) {
    await menuStore.editMenu(editingId.value, { ...form })
  } else {
    await menuStore.tambahMenu({ ...form })
  }
  showModal.value = false
}
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Menu</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="header-row">
        <ion-button @click="openTambah">Tambah Menu</ion-button>
      </div>

      <div v-if="menuStore.isLoading" class="state-box">Memuat data menu...</div>
      <div v-else-if="menuStore.menuList.length === 0" class="state-box">Belum ada menu.</div>
      <div v-else class="card-grid">
        <article v-for="menu in menuStore.menuList" :key="menu.id" class="card">
          <h3>{{ menu.nama }}</h3>
          <p>Harga: Rp {{ menu.harga }}</p>
          <p>Stok: {{ menu.current_stok }}</p>
          <p>Kategori: {{ menu.kategori.nama }}</p>
          <p>Status: {{ menu.is_tersedia ? 'Tersedia' : 'Tidak tersedia' }}</p>
          <div class="actions">
            <button class="btn-edit" @click="openEdit(menu)">Edit</button>
            <button class="btn-delete" @click="confirmDelete(menu)">Hapus</button>
          </div>
        </article>
      </div>

      <div v-if="showModal" class="modal-overlay">
        <div class="modal">
          <h3>{{ isEditing ? 'Edit Menu' : 'Tambah Menu' }}</h3>
          <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
          <input v-model="form.nama" placeholder="Nama menu" />
          <input v-model.number="form.harga" type="number" min="0" placeholder="Harga" />
          <input v-model.number="form.current_stok" type="number" min="0" placeholder="Stok" />
          <select v-model.number="form.kategori_id">
            <option disabled :value="0">Pilih kategori</option>
            <option v-for="kategori in kategoriStore.kategoriList" :key="kategori.id" :value="kategori.id">
              {{ kategori.nama }}
            </option>
          </select>
          <select v-model="form.is_tersedia">
            <option :value="true">Tersedia</option>
            <option :value="false">Tidak tersedia</option>
          </select>
          <div class="modal-actions">
            <button @click="showModal = false">Batal</button>
            <button @click="handleSubmit">Simpan</button>
          </div>
        </div>
      </div>

      <div v-if="showDeleteConfirm" class="modal-overlay">
        <div class="modal">
          <h3>Hapus Menu</h3>
          <p>Yakin hapus <strong>{{ deletingMenu?.nama }}</strong>?</p>
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
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 0.75rem;
}
.card {
  border: 1px solid #2a2a4a;
  border-radius: 12px;
  padding: 0.85rem;
}
.card h3 {
  margin: 0 0 0.45rem;
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
  background: #1f3620;
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
