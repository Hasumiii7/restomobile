<script setup lang="ts">
import { onMounted } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue'

const dashboardStore = useDashboardStore()

onMounted(() => {
  dashboardStore.fetchDashboardData()
})
</script>

<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Dashboard</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div v-if="dashboardStore.isLoading" class="loading">Loading...</div>

      <div v-else-if="dashboardStore.dashboardData" class="stats-grid">
        <div class="stat-card">
          <h3>Order Hari Ini</h3>
          <p class="stat-number">{{ dashboardStore.dashboardData.total_order_hari_ini }}</p>
        </div>

        <div class="stat-card">
          <h3>Pendapatan Hari Ini</h3>
          <p class="stat-number">
            Rp
            {{
              Number(dashboardStore.dashboardData.total_pendapatan_hari_ini).toLocaleString('id-ID')
            }}
          </p>
        </div>

        <div class="stat-card">
          <h3>Meja</h3>
          <p class="stat-number">
            {{ dashboardStore.dashboardData.meja_terisi }} / {{ dashboardStore.dashboardData.total_meja }}
          </p>
          <span class="stat-label">Terisi / Total</span>
        </div>

        <div class="stat-card">
          <h3>Status Order</h3>
          <div class="status-grid">
            <div class="status-item">
              <span>Menunggu</span>
              <strong>{{ dashboardStore.dashboardData.order_status.menunggu }}</strong>
            </div>
            <div class="status-item">
              <span>Diproses</span>
              <strong>{{ dashboardStore.dashboardData.order_status.diproses }}</strong>
            </div>
            <div class="status-item">
              <span>Selesai</span>
              <strong>{{ dashboardStore.dashboardData.order_status.selesai }}</strong>
            </div>
            <div class="status-item">
              <span>Dibatalkan</span>
              <strong>{{ dashboardStore.dashboardData.order_status.dibatalkan }}</strong>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.loading {
  text-align: center;
  padding: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(1, minmax(0, 1fr));
  gap: 1rem;
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.stat-card {
  background: #00500d;
  border-radius: 12px;
  padding: 1.2rem;
  border: 1px solid #a6ff00;
}

.stat-card h3 {
  margin: 0 0 0.5rem;
  color: #9999bb;
  font-size: 0.8rem;
  text-transform: uppercase;
}

.stat-number {
  margin: 0;
  color: #f0f0f0;
  font-size: 1.4rem;
  font-weight: 700;
}

.stat-label {
  color: #8888aa;
  font-size: 0.75rem;
}

.status-grid {
  display: grid;
  gap: 0.45rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
  color: #9999bb;
  font-size: 0.85rem;
}

.status-item strong {
  color: #f0f0f0;
}
</style>
