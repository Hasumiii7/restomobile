import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'

export interface User {
  id: number
  username: string
  email: string
  role: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)
  const userName = computed(() => user.value?.username ?? '')

  async function login(username: string, password: string) {
    const formData = new URLSearchParams()
    formData.append('grant_type', 'password')
    formData.append('username', username)
    formData.append('password', password)
    formData.append('scope', '')
    formData.append('client_id', '')
    formData.append('client_secret', '')

    const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.detail || 'Login failed')
  }

  const data = await response.json()

  token.value = data.access_token
  localStorage.setItem('token', data.access_token)

  await fetchUser()

  }

  async function logout() {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore logout errors
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
    }
  }

  async function fetchUser() {
    try {
      const response = await api.get('/user/profile')
      user.value = response.data
    } catch {
      logout()
    }
  }

  return { user, token, isAuthenticated, userName, login, logout, fetchUser }
})
