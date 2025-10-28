<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <Navbar />

    <div class="container mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">{{ $t('stores.title') }}</h1>
        <p class="text-gray-600 dark:text-gray-400">
          {{ $t('stores.subtitle') }}
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
        class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border-l-4 cursor-pointer"
        :style="{ borderLeftColor: store.brandColor || '#E5E7EB' }"
        @click="openStoreWebsite(store)"
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
        <p class="text-gray-600 dark:text-gray-400">{{ $t('stores.noStores') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storesApi, type Store } from '@/services/storesApi'
import Navbar from '@/components/Navbar.vue'

const { t } = useI18n()
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
    error.value = t('stores.errorLoading')
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

// Map browser locale to domain TLD
const getLocaleTLD = (): string => {
  const locale = navigator.language.toLowerCase()

  // Map of locale codes to TLDs
  const localeToTLD: Record<string, string> = {
    'it': 'it',
    'it-it': 'it',
    'it-ch': 'it',
    'en-us': 'com',
    'en': 'com',
    'en-gb': 'co.uk',
    'en-au': 'com.au',
    'en-ca': 'ca',
    'de': 'de',
    'de-de': 'de',
    'de-at': 'de',
    'de-ch': 'de',
    'fr': 'fr',
    'fr-fr': 'fr',
    'fr-be': 'fr',
    'fr-ch': 'fr',
    'es': 'es',
    'es-es': 'es',
    'es-mx': 'com.mx',
    'pt': 'com.br',
    'pt-br': 'com.br',
    'pt-pt': 'pt',
    'nl': 'nl',
    'nl-nl': 'nl',
    'nl-be': 'nl',
    'pl': 'pl',
    'pl-pl': 'pl',
    'ja': 'co.jp',
    'ja-jp': 'co.jp',
    'zh': 'cn',
    'zh-cn': 'cn',
  }

  // Try exact match first, then language code only
  const languageCode = locale.split('-')[0]
  return localeToTLD[locale] || (languageCode ? localeToTLD[languageCode] : undefined) || 'com'
}

const resolveDomainWildcard = (domain: string): string => {
  // If domain contains wildcard *, replace with locale-appropriate TLD
  if (domain.includes('*')) {
    const tld = getLocaleTLD()
    return domain.replace('*', tld)
  }
  return domain
}

const openStoreWebsite = (store: Store) => {
  if (store.domain) {
    // Resolve wildcard if present
    const resolvedDomain = resolveDomainWildcard(store.domain)

    // Ensure the URL has a protocol
    const url = resolvedDomain.startsWith('http') ? resolvedDomain : `https://${resolvedDomain}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

onMounted(() => {
  fetchStores()
})
</script>