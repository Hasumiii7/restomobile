import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'

export interface User {
    id: number
    username: string
    email: string
    role: 'admin' | 'user' | 'pegawai'
    password: string
}

export const useUserStore = defineStore('user', () => {
    const userList = ref<User[]>([])
    const isLoading = ref(false)

    async function fetchUser() {
        isLoading.value = true
        try {
            const response = await api.get('/user')
            userList.value = response.data
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            isLoading.value = false
        }
    }

    async function tambahUser(data: Omit<User, 'id'>) {
        try {
            const response = await api.post('/user', {
                username: data.username,
                email: data.email,
                role: data.role,
                password: data.password
            })
            userList.value.push(response.data)
        } catch (error) {
            console.error('Error adding user:', error)
        }
    }

    async function editUser(id: number, data: Omit<User, 'id'>) {
        try {
            // Hanya kirim password kalau diisi (bukan kosong)
            const payload: any = {
                username: data.username,
                email: data.email,
                role: data.role,
            }
            if (data.password) {
                payload.password = data.password
            }

            const response = await api.patch('/user/' + id, payload)
            const index = userList.value.findIndex(u => u.id === id)
            if (index !== -1) {
                userList.value[index] = response.data
            }
        } catch (error) {
            console.error('Error editing user:', error)
        }
    }

    async function deleteUser(id: number) {
        try {
            await api.delete('/user/' + id)
            userList.value = userList.value.filter(u => u.id !== id)
        } catch (error) {
            console.error('Error deleting user:', error)
            throw error  // Lempar error ke View supaya bisa ditampilkan
        }
    }

    return {
        userList,
        isLoading,
        fetchUser,
        tambahUser,
        editUser,
        deleteUser
    }
})