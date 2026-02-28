import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'
import type { Kategori } from './kategori'

export interface Menu {
    id: number
    nama: string
    harga: number
    current_stok: number
    is_tersedia: boolean
    kategori: Kategori
}

export const useMenuStore = defineStore('menu', () => {
    const menuList = ref<Menu[]>([])
    const isLoading = ref(false)

    async function fetchMenu() {
        isLoading.value = true
        try {
            const response = await api.get('/menu')
            menuList.value = response.data
        } catch (error) {
            console.error('Error fetching menu:', error)
        } finally {
            isLoading.value = false
        }
    }

    async function tambahMenu(data: Omit<Menu, 'id' | 'kategori'> & { kategori_id: number }) {
        try {
            const response = await api.post('/menu', {
                nama: data.nama,
                harga: data.harga,
                current_stok: data.current_stok,
                is_tersedia: data.is_tersedia,
                kategori_id: data.kategori_id,
            })
            menuList.value.push(response.data)
        } catch (error) {
            console.error('Error adding menu:', error)
        }
    }

    async function editMenu(id: number, data: Partial<Omit<Menu, 'id' | 'kategori'> & { kategori_id: number }>) {
        try {
            const response = await api.patch('/menu/' + id, data)
            const index = menuList.value.findIndex(m => m.id === id)
            if (index !== -1) {
                menuList.value[index] = response.data
            }
        } catch (error) {
            console.error('Error editing menu:', error)
        }
    }

    async function deleteMenu(id: number) {
        try {
            await api.delete('/menu/' + id)
            menuList.value = menuList.value.filter(m => m.id !== id)
        } catch (error) {
            console.error('Error deleting menu:', error)
            throw error
        }
    }

    return {
        menuList,
        isLoading,
        fetchMenu,
        tambahMenu,
        editMenu,
        deleteMenu
    }
})
