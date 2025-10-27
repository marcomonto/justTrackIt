<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <Navbar />

    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">Store Disponibili</h1>
        <p class="text-gray-600 dark:text-gray-400">
          Ecco tutti gli store supportati dalla nostra piattaforma per il tracking dei prezzi
        </p>
      </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
      <p>{{ error }}</p>
    </div>

    <!-- Stores Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="store in stores"
        :key="store.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border-l-4"
        :style="{ borderLeftColor: store.brandColor || '#E5E7EB' }"
      >
        <div class="p-6 flex flex-col items-center justify-center text-center">
          <!-- Store Logo -->
          <div
            v-if="store.logoUrl"
            class="w-24 h-24 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4"
          >
            <img
              :src="store.logoUrl"
              :alt="store.name"
              class="max-w-full max-h-full object-contain"
              @error="handleImageError"
            />
          </div>
          <div
            v-else
            class="w-24 h-24 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-lg mb-4"
          >
            <span class="text-4xl font-bold text-gray-400 dark:text-gray-500">
              {{ store.name.charAt(0) }}
            </span>
          </div>

          <!-- Store Name -->
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">{{ store.name }}</h2>
        </div>
      </div>
    </div>

      <!-- Empty State -->
      <div
        v-if="!loading && !error && stores.length === 0"
        class="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg"
      >
        <p class="text-gray-600 dark:text-gray-400">Nessuno store disponibile al momento.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storesApi, type Store } from '@/services/storesApi'
import Navbar from '@/components/Navbar.vue'

const stores = ref<Store[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const fetchStores = async () => {
  try {
    loading.value = true
    error.value = null
    stores.value = await storesApi.getAll(true) // Get only active stores
  } catch (err) {
    console.error('Error fetching stores:', err)
    error.value = 'Errore nel caricamento degli store. Riprova più tardi.'
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.style.display = 'none'
}

onMounted(() => {
  fetchStores()
})
</script>