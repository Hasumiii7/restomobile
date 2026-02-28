import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'

export interface Kategori {
    id: number
    nama: string
}

export const useKategoriStore = defineStore('kategori', () => {
    const kategoriList = ref<Kategori[]>([])
    const isLoading = ref(false)

    async function fetchKategori() {
        isLoading.value = true
        try {
            const response = await api.get('/kategori-menu')
            kategoriList.value = response.data
        } catch (error) {
            console.error('Error fetching kategori:', error)
        } finally {
            isLoading.value = false
        }
    }

    async function tambahKategori(data: Omit<Kategori, 'id'>) {
        try {
            const response = await api.post('/kategori-menu', {
                nama: data.nama
            })
            kategoriList.value.push(response.data)
        } catch (error) {
            console.error('Error adding kategori:', error)
        }
    }

    async function editKategori(id: number, data: Omit<Kategori, 'id'>) {
        try {
            const response = await api.patch('/kategori-menu/' + id, {
                nama: data.nama
            })
            const index = kategoriList.value.findIndex(k => k.id === id)
            if (index !== -1) {
                kategoriList.value[index] = response.data
            }
        } catch (error) {
            console.error('Error editing kategori:', error)
        }
    }

    async function deleteKategori(id: number) {
        try {
            await api.delete('/kategori-menu/' + id)
            kategoriList.value = kategoriList.value.filter(k => k.id !== id)
        } catch (error) {
            console.error('Error deleting kategori:', error)
            throw error
        }
    }

    return {
        kategoriList,
        isLoading,
        fetchKategori,
        tambahKategori,
        editKategori,
        deleteKategori
    }
})