import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ItemsView from '../views/ItemsView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import StoresView from '../views/StoresView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'items',
      component: ItemsView,
      meta: { requiresAuth: true },
    },
    {
      path: '/stores',
      name: 'stores',
      component: StoresView,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresGuest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { requiresGuest: true },
    },
  ],
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Check authentication status
  if (!authStore.user) {
    try {
      await authStore.checkAuth()
    } catch (e) {
      // User not authenticated
    }
  }

  // Protect routes that require authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
    return
  }

  // Redirect authenticated users away from login/register
  if (to.meta.requiresGuest && authStore.isAuthenticated) {
    next('/')
    return
  }

  next()
})

export default router
