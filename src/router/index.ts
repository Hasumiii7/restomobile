import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import MejaView from '@/views/MejaView.vue'
import UserView from '@/views/UserView.vue'
import LoginView from '@/views/LoginView.vue'
import { useAuthStore } from '@/stores/auth'
import AdminLayout from '@/components/AdminLayout.vue'
import StaffView from '@/views/StaffView.vue'
import KategoriView from '@/views/KategoriView.vue'
import MenuView from '@/views/MenuView.vue'
import OrderView from '@/views/OrderView.vue'
import PaymentView from '@/views/PaymentView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/',
      component: AdminLayout,
      children: [
        {
          path: '',
          name: 'home',
          component: DashboardView,
        },
        {
          path: 'meja',
          name: 'meja',
          component: MejaView,
        },
        {
          path: 'user',
          name: 'user',
          component: UserView,
        },
        {
          path: 'staff',
          name: 'staff',
          component: StaffView,
        },
        {
          path: 'kategori',
          name: 'kategori',
          component: KategoriView,
        },
        {
          path: 'menu',
          name: 'menu',
          component: MenuView,
        },
        {
          path: 'orders',
          name: 'orders',
          component: OrderView,
        },
        {
          path: 'payment',
          name: 'payment',
          component: PaymentView,
        }
      ]
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const token = localStorage.getItem('token')

  if (to.name !== 'login' && !token) {
    next({ name: 'login' })
  } else if (to.name === 'login' && token) {
    next({ name: 'home' })
  } else {
    if (token) {
      try {
        const authStore = useAuthStore()
        if (!authStore.user) {
          await authStore.fetchUser()
        }
      } catch (e) {
        localStorage.removeItem('token') // token invalid, buang saja
        next({ name: 'login' })
        return
      }
    }
    next()
  }
})

export default router
