<script setup lang="ts">

import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute, useRouter } from 'vue-router'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuButton,
  IonMenuToggle,
  IonPage,
  IonSplitPane,
  IonTitle,
  IonToolbar,
  IonRouterOutlet
} from '@ionic/vue'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Orders', to: '/orders' },
  { label: 'Payment', to: '/payment' },
  { label: 'Menu', to: '/menu' },
  { label: 'Tables', to: '/meja' },
  { label: 'Staff', to: '/staff' },
  { label: 'User', to: '/user' },
  { label: 'Kategori', to: '/kategori' },
]

const currentTitle = computed(() => {
  return navItems.find((item) => isActive(item.to))?.label ?? 'Admin'
})

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

async function handleLogout() {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <ion-page>
    <ion-split-pane content-id="main-content">
      <ion-menu content-id="main-content" type="overlay">
        <ion-header>
          <ion-toolbar>
            <ion-title>Savor Eats</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list>
            <ion-menu-toggle v-for="item in navItems" :key="item.to" :auto-hide="false">
              <ion-item
                button
                lines="none"
                :router-link="item.to"
                router-direction="root"
                :class="{ active: isActive(item.to) }"
              >
                <ion-label>{{ item.label }}</ion-label>
              </ion-item>
            </ion-menu-toggle>
          </ion-list>
          <div class="menu-footer">
            <span>Welcome, {{ authStore.userName }}</span>
            <ion-button color="danger" size="small" expand="block" @click="handleLogout">
              Logout
            </ion-button>
          </div>
        </ion-content>
      </ion-menu>

      <div class="ion-page" id="main-content">
        <router-view />
      </div>
    </ion-split-pane>
  </ion-page>
</template>

<style scoped>
.main-content {
  min-height: 100vh;
  background: var(--ion-color-step-50, #0f0f1d);
}

ion-menu ion-item {
  --background: transparent;
  --color: #b7bdd8;
  margin: 2px 8px;
  border-radius: 10px;
}

ion-menu ion-item.active {
  --background: rgba(103, 116, 255, 0.18);
  --color: #e7ebff;
  border-left: 3px solid #7080ff;
}

.menu-footer {
  padding: 1rem;
  display: grid;
  gap: 0.6rem;
  color: #c2c8e6;
  font-size: 0.85rem;
}
</style>
