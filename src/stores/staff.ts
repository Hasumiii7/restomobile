import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'

export interface Staff {
    id: number
    nama: string
    jabatan: 'manager' | 'waiter' | 'koki' | 'pelayan'
    status: 'aktif' | 'tidak_aktif'
    user_id: number
}

export const useStaffStore = defineStore('staff', () => {
    const staffList = ref<Staff[]>([])
    const isLoading = ref(false)

    async function fetchStaff() {
        isLoading.value = true
        try {
            const response = await api.get('/pegawai')
            staffList.value = response.data
        } catch (error) {
            console.error('Error fetching staff:', error)
        } finally {
            isLoading.value = false
        }
    }

    async function tambahStaff(data: Omit<Staff, 'id'>) {
        try {
            const response = await api.post('/pegawai', {
                nama: data.nama,
                jabatan: data.jabatan,
                status: data.status,
                user_id: data.user_id
            })
            staffList.value.push(response.data)
        } catch (error) {
            console.error('Error adding staff:', error)
        }
    }

    async function editStaff(id: number, data: Omit<Staff, 'id'>) {
        try {
            const response = await api.patch('/pegawai/' + id, {
                nama: data.nama,
                jabatan: data.jabatan,
                status: data.status,
                user_id: data.user_id
            })
            const index = staffList.value.findIndex(s => s.id === id)
            if (index !== -1) {
                staffList.value[index] = response.data
            }
        } catch (error) {
            console.error('Error editing staff:', error)
        }
    }

    async function deleteStaff(id: number) {
        try {
            await api.delete('/pegawai/' + id)
            staffList.value = staffList.value.filter(s => s.id !== id)
        } catch (error) {
            console.error('Error deleting staff:', error)
            throw error
        }
    }

    return {
        staffList,
        isLoading,
        fetchStaff,
        tambahStaff,
        editStaff,
        deleteStaff
    }
})