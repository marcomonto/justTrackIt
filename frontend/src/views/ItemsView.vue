<template>
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <header class="border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-black">JUST TRACK IT</h1>
            <p class="text-gray-600 mt-1">Ciao, {{ authStore.user?.name }}</p>
          </div>
          <button
            @click="handleLogout"
            class="px-4 py-2 text-sm text-gray-600 hover:text-black transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

    <!-- Actions Bar -->
    <div class="border-b border-gray-200 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            @click="showAddModal = true"
            class="w-full sm:w-auto bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition"
          >
            + Aggiungi Item
          </button>

          <select
            v-model="filter"
            @change="loadItems"
            class="w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          >
            <option value="">Tutti gli items</option>
            <option value="to_buy">Da Comprare</option>
            <option value="wishlist">Wishlist</option>
            <option value="purchased">Acquistati</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Items Grid -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="itemsStore.loading" class="text-center py-12">
        <p class="text-gray-600">Caricamento...</p>
      </div>

      <div v-else-if="itemsStore.error" class="text-center py-12">
        <p class="text-red-600">{{ itemsStore.error }}</p>
      </div>

      <div v-else-if="itemsStore.items.length === 0" class="text-center py-12">
        <p class="text-gray-600">Nessun item trovato. Aggiungine uno!</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div
          v-for="item in itemsStore.items"
          :key="item.id"
          class="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer"
        >
          <!-- Image -->
          <div class="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              :alt="item.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="text-gray-400 text-4xl">📦</div>
          </div>

          <!-- Content -->
          <div class="p-4">
            <div class="flex justify-between items-start mb-2">
              <h3 class="font-semibold text-black group-hover:underline">{{ item.name }}</h3>
              <span
                :class="[
                  'text-xs px-2 py-1 rounded-full font-medium',
                  item.status === 'to_buy' ? 'bg-orange-100 text-orange-800' : '',
                  item.status === 'wishlist' ? 'bg-blue-100 text-blue-800' : '',
                  item.status === 'purchased' ? 'bg-green-100 text-green-800' : '',
                ]"
              >
                {{ statusLabel(item.status) }}
              </span>
            </div>

            <p v-if="item.description" class="text-sm text-gray-600 mb-2 line-clamp-2">
              {{ item.description }}
            </p>

            <p v-if="item.price" class="text-lg font-bold text-black mb-3">
              €{{ item.price.toFixed(2) }}
            </p>

            <div class="flex gap-2">
              <a
                v-if="item.link"
                :href="item.link"
                target="_blank"
                class="flex-1 text-center bg-gray-100 text-black px-3 py-2 rounded text-sm font-medium hover:bg-gray-200 transition"
              >
                Apri Link
              </a>
              <button
                @click="deleteItemHandler(item.id)"
                class="px-3 py-2 bg-red-50 text-red-600 rounded text-sm font-medium hover:bg-red-100 transition"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add Item Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click="closeModal"
    >
      <div
        class="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <h2 class="text-2xl font-bold text-black mb-6">Traccia Nuovo Prodotto</h2>
        <form @submit.prevent="addItemHandler" class="space-y-4">
          <!-- URL Input -->
          <div>
            <label class="block text-sm font-medium text-gray-900 mb-1">
              URL Prodotto * <span class="text-xs text-gray-500">(Amazon, eBay, ecc.)</span>
            </label>
            <input
              v-model="productUrl"
              type="url"
              required
              placeholder="https://www.amazon.it/..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <!-- Loading Preview -->
          <div v-if="isLoadingPreview" class="text-center py-4">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            <p class="text-sm text-gray-600 mt-2">Caricamento preview...</p>
          </div>

          <!-- Preview Error -->
          <div v-if="previewError" class="bg-red-50 border border-red-200 rounded-lg p-3">
            <p class="text-sm text-red-600">{{ previewError }}</p>
          </div>

          <!-- Preview Result -->
          <div v-if="preview" class="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <div class="flex items-start gap-3">
              <img
                v-if="preview.product.imageUrl"
                :src="preview.product.imageUrl"
                alt="Product preview"
                class="w-20 h-20 object-cover rounded"
              />
              <div class="flex-1">
                <p class="text-xs text-gray-500">{{ preview.store.name }}</p>
                <p class="font-medium text-black">{{ preview.product.title || 'Prodotto senza titolo' }}</p>
                <p class="text-lg font-bold text-black">
                  {{ preview.product.price.toFixed(2) }} {{ preview.product.currency }}
                </p>
                <span
                  v-if="preview.product.isAvailable"
                  class="inline-block text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full"
                >
                  Disponibile
                </span>
                <span
                  v-else
                  class="inline-block text-xs px-2 py-1 bg-red-100 text-red-800 rounded-full"
                >
                  Non disponibile
                </span>
              </div>
            </div>
          </div>

          <!-- Custom Name (Optional) -->
          <div v-if="preview">
            <label class="block text-sm font-medium text-gray-900 mb-1">
              Nome personalizzato <span class="text-xs text-gray-500">(opzionale)</span>
            </label>
            <input
              v-model="customName"
              type="text"
              :placeholder="preview.product.title || 'Lascia vuoto per usare il titolo rilevato'"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <!-- Target Price (Optional) -->
          <div v-if="preview">
            <label class="block text-sm font-medium text-gray-900 mb-1">
              Prezzo target <span class="text-xs text-gray-500">(opzionale - per alert)</span>
            </label>
            <input
              v-model.number="targetPrice"
              type="number"
              step="0.01"
              :placeholder="`Es: ${(preview.product.price * 0.9).toFixed(2)}`"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <!-- Notes (Optional) -->
          <div v-if="preview">
            <label class="block text-sm font-medium text-gray-900 mb-1">Note</label>
            <textarea
              v-model="notes"
              rows="2"
              placeholder="Aggiungi note..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent resize-none"
            ></textarea>
          </div>

          <div class="flex gap-3 pt-4">
            <button
              type="submit"
              :disabled="!preview || isLoadingPreview"
              class="flex-1 bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Salva e Traccia
            </button>
            <button
              type="button"
              @click="closeModal"
              class="flex-1 bg-gray-100 text-black py-3 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useItemsStore } from '@/stores/items'
import { useAuthStore } from '@/stores/auth'
import { trackedItemsApi } from '@/services/trackedItemsApi'
import { useDebounce } from '@/composables/useDebounce'
import type { PreviewItemResponse } from '@/types/tracked-item'

const router = useRouter()
const itemsStore = useItemsStore()
const authStore = useAuthStore()
const filter = ref('')
const showAddModal = ref(false)

// Preview state
const productUrl = ref('')
const customName = ref('')
const targetPrice = ref<number | undefined>()
const notes = ref('')
const preview = ref<PreviewItemResponse | null>(null)
const isLoadingPreview = ref(false)
const previewError = ref('')

// Debounce URL input
const debouncedUrl = useDebounce(productUrl, 800)

// Watch debounced URL for preview
watch(debouncedUrl, async (url) => {
  if (!url || url.length < 10) {
    preview.value = null
    previewError.value = ''
    return
  }

  // Basic URL validation
  try {
    new URL(url)
  } catch {
    preview.value = null
    previewError.value = 'URL non valido'
    return
  }

  // Fetch preview
  isLoadingPreview.value = true
  previewError.value = ''
  try {
    preview.value = await trackedItemsApi.preview({ productUrl: url })
  } catch (error: any) {
    console.error('Preview failed:', error)
    previewError.value = error.response?.data?.message || 'Impossibile caricare il prodotto. Store non supportato o URL non valido.'
    preview.value = null
  } finally {
    isLoadingPreview.value = false
  }
})

const loadItems = () => {
  itemsStore.fetchItems(filter.value || undefined)
}

const addItemHandler = async () => {
  if (!preview.value) return

  try {
    await trackedItemsApi.create({
      productUrl: productUrl.value,
      name: customName.value || undefined,
      targetPrice: targetPrice.value,
      notes: notes.value || undefined,
    })

    // Reload items
    loadItems()

    // Close and reset modal
    closeModal()
  } catch (error: any) {
    console.error('Failed to add item:', error)
    previewError.value = error.response?.data?.message || 'Errore nel salvataggio del prodotto'
  }
}

const closeModal = () => {
  showAddModal.value = false
  productUrl.value = ''
  customName.value = ''
  targetPrice.value = undefined
  notes.value = ''
  preview.value = null
  previewError.value = ''
}

const deleteItemHandler = async (id: number) => {
  if (confirm('Sei sicuro di voler eliminare questo item?')) {
    await itemsStore.deleteItem(id)
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const statusLabel = (status: string) => {
  const labels: Record<string, string> = {
    to_buy: 'Da Comprare',
    wishlist: 'Wishlist',
    purchased: 'Acquistato',
    tracking: 'In Tracking',
    paused: 'Pausato',
  }
  return labels[status] || status
}

onMounted(async () => {
  await authStore.checkAuth()
  if (!authStore.isAuthenticated) {
    router.push('/login')
    return
  }
  loadItems()
})
</script>
