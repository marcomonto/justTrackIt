<template>
  <header class="border-b border-gray-200 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-black">JUST TRACK IT</h1>
          <p class="text-gray-600 mt-1">Ciao, {{ authStore.user?.name }}</p>
        </div>

        <div class="flex items-center gap-6">
          <!-- Navigation Links -->
          <nav class="flex items-center gap-4">
            <router-link
              to="/"
              class="text-sm font-medium transition-colors"
              :class="
                $route.name === 'items'
                  ? 'text-black'
                  : 'text-gray-600 hover:text-black'
              "
            >
              I Miei Item
            </router-link>
            <router-link
              to="/stores"
              class="text-sm font-medium transition-colors"
              :class="
                $route.name === 'stores'
                  ? 'text-black'
                  : 'text-gray-600 hover:text-black'
              "
            >
              Store Disponibili
            </router-link>
          </nav>

          <!-- Logout Button -->
          <button
            @click="handleLogout"
            class="px-4 py-2 text-sm text-gray-600 hover:text-black transition"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>