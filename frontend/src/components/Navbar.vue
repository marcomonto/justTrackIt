<template>
  <header class="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-black">JUST TRACK IT</h1>
          <p class="text-gray-600 mt-1 text-sm sm:text-base">Ciao, {{ authStore.user?.name }}</p>
        </div>

        <!-- Desktop Menu -->
        <div class="hidden md:flex items-center gap-6">
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
            class="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            Logout
          </button>
        </div>

        <!-- Mobile Menu Button -->
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          aria-label="Menu"
        >
          <svg
            v-if="!mobileMenuOpen"
            class="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <svg
            v-else
            class="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Mobile Menu -->
      <div
        v-if="mobileMenuOpen"
        class="md:hidden mt-4 pt-4 border-t border-gray-200 space-y-3"
      >
        <router-link
          to="/"
          @click="mobileMenuOpen = false"
          class="block px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          :class="
            $route.name === 'items'
              ? 'bg-black text-white'
              : 'text-gray-700 hover:bg-gray-100'
          "
        >
          I Miei Item
        </router-link>
        <router-link
          to="/stores"
          @click="mobileMenuOpen = false"
          class="block px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          :class="
            $route.name === 'stores'
              ? 'bg-black text-white'
              : 'text-gray-700 hover:bg-gray-100'
          "
        >
          Store Disponibili
        </router-link>
        <button
          @click="handleLogout"
          class="w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
        >
          Logout
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const mobileMenuOpen = ref(false)

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
  mobileMenuOpen.value = false
}
</script>