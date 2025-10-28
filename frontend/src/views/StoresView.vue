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

      <!-- Search Bar -->
      <div class="mb-6">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('stores.searchPlaceholder')"
            class="w-full px-4 py-3 pl-11 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all"
          />
          <svg
            class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <p v-if="searchQuery && filteredStores.length > 0" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {{ $t('stores.resultsFound', { count: filteredStores.length }) }}
        </p>
        <p v-else-if="searchQuery && filteredStores.length === 0" class="mt-2 text-sm text-red-600 dark:text-red-400">
          {{ $t('stores.noResultsFound') }}
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
        v-for="store in filteredStores"
        :key="store.id"
        class="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden border-l-4 cursor-pointer"
        :style="{ borderLeftColor: store.brandColor || '#E5E7EB' }"
        @click="openStoreWebsite(store)"
      >
        <div class="p-6 flex flex-col items-center justify-center text-center">
          <!-- Store Logo -->
          <div
            v-if="store.logoUrl"
            class="w-24 h-24 flex items-center justify-center bg-white rounded-lg p-3 mb-4"
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
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { storesApi, type Store } from '@/services/storesApi'
import Navbar from '@/components/Navbar.vue'

const { t } = useI18n()
const stores = ref<Store[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const searchQuery = ref('')

/**
 * Calculate string similarity ratio using a fuzzy matching algorithm
 * similar to Python's SequenceMatcher.ratio()
 * Returns a value between 0 and 1, where 1 is a perfect match
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  const s1 = str1.toLowerCase()
  const s2 = str2.toLowerCase()

  // Exact match
  if (s1 === s2) return 1.0

  // Check if one string contains the other
  if (s2.includes(s1)) {
    // Boost score for substring matches, especially if at the start
    const index = s2.indexOf(s1)
    if (index === 0) return 0.95 // Starts with query
    return 0.85 // Contains query
  }

  // Calculate Levenshtein distance
  const matrix: number[][] = []
  const len1 = s1.length
  const len2 = s2.length

  // Initialize matrix with proper dimensions
  for (let i = 0; i <= len1; i++) {
    matrix[i] = []
    for (let j = 0; j <= len2; j++) {
      if (i === 0) {
        matrix[i]![j] = j
      } else if (j === 0) {
        matrix[i]![j] = i
      } else {
        matrix[i]![j] = 0
      }
    }
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,      // deletion
        matrix[i]![j - 1]! + 1,      // insertion
        matrix[i - 1]![j - 1]! + cost // substitution
      )
    }
  }

  const distance = matrix[len1]![len2]!
  const maxLength = Math.max(len1, len2)

  // Convert distance to similarity ratio (similar to SequenceMatcher.ratio())
  return maxLength === 0 ? 1.0 : (maxLength - distance) / maxLength
}

/**
 * Filter stores based on search query using fuzzy matching
 */
const filteredStores = computed(() => {
  if (!searchQuery.value.trim()) {
    return stores.value
  }

  const query = searchQuery.value.trim()
  const threshold = 0.5 // Minimum similarity score to include result

  return stores.value
    .map(store => ({
      store,
      similarity: calculateSimilarity(query, store.name)
    }))
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .map(item => item.store)
})

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