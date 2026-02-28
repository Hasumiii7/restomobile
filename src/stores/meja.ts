import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'

export interface Meja {
    id: number
    nomor_meja: string
    kapasitas: number
    is_tersedia: boolean
}

export const useMejaStore = defineStore('meja', () => {
    const mejaList = ref<Meja[]>([])
    const isLoading = ref(false)

    async function fetchMeja() {
        isLoading.value = true
        try {
            const response = await api.get('/meja')
            mejaList.value = response.data
        } catch (error) {
            console.error('Error fetching meja:', error)
        } finally {
            isLoading.value = false
        }
    }

    async function tambahMeja(data: { nomor_meja: string, kapasitas: number, is_tersedia: boolean }) {
        try {
            const response = await api.post('/meja', {
                nomor_meja: data.nomor_meja,
                kapasitas: data.kapasitas,
                is_tersedia: data.is_tersedia,
            })
            mejaList.value.push(response.data)
        } catch (error) {
            console.error('Error adding meja:', error)
        }
    }

    async function updateMeja(id: number, data: { nomor_meja?: string, kapasitas?: number, is_tersedia?: boolean }) {
        try {
            const response = await api.patch('/meja/' + id, data)
            const index = mejaList.value.findIndex(m => m.id === id)
            if (index !== -1) {
                mejaList.value[index] = response.data
            }
        } catch (error) {
            console.error('Error updating meja:', error)
        }
    }

    async function deleteMeja(id: number) {
        try {
            await api.delete('/meja/' + id)
            mejaList.value = mejaList.value.filter(m => m.id !== id)
        } catch (error) {
            console.error('Error deleting meja:', error)
        }
    }

    return {
        mejaList,
        isLoading,
        fetchMeja,
        tambahMeja,
        updateMeja,
        deleteMeja
    }
})