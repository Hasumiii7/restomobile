import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'

export interface DashboardData {
    total_order_hari_ini: number
  total_pendapatan_hari_ini: string
  total_order_selesai_hari_ini: number
  total_order_dibatalkan_hari_ini: number
  total_meja: number
  meja_terisi: number
  meja_tersedia: number
  order_status: {
    menunggu: number
    diproses: number
    selesai: number
    dibatalkan: number
  }
  menu_populer: any[]
  pendapatan_7_hari: any[]
}

export const useDashboardStore = defineStore('dashboard', () => {
    const dashboardData = ref<DashboardData | null>(null)
    const isLoading = ref(false)

    async function fetchDashboardData() {
        isLoading.value = true
        try {
            const response = await api.get('/dashboard/summary')
            dashboardData.value = response.data
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error)
        } finally {
            isLoading.value = false
        }
    }

    return {
        dashboardData,
        isLoading,
        fetchDashboardData,
    }
})