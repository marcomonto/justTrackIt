<template>
  <div class="min-h-screen bg-white dark:bg-gray-900">
    <!-- Header -->
    <Navbar />

    <!-- Actions Bar -->
    <div class="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-center">
          <button
            @click="showAddModal = true"
            class="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition"
          >
            + Aggiungi Item
          </button>
        </div>
      </div>
    </div>

    <!-- Items Grid -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div v-if="itemsStore.loading" class="text-center py-12">
        <p class="text-gray-600 dark:text-gray-400">Caricamento...</p>
      </div>

      <div v-else-if="itemsStore.error" class="text-center py-12">
        <p class="text-red-600 dark:text-red-400">{{ itemsStore.error }}</p>
      </div>

      <div v-else-if="itemsStore.items.length === 0" class="text-center py-12">
        <p class="text-gray-600 dark:text-gray-400">Nessun item trovato. Aggiungine uno!</p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <div
          v-for="item in itemsStore.items"
          :key="item.id"
          @click="openDetailModal(item)"
          class="group bg-white dark:bg-gray-800 border-2 rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
          :style="{
            borderColor: item.store?.brandColor || '#E5E7EB',
            '--brand-color': item.store?.brandColor || '#E5E7EB'
          }"
        >
          <!-- Image -->
          <div class="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              v-if="item.imageUrl"
              :src="item.imageUrl"
              :alt="item.name"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="text-gray-400 dark:text-gray-500 text-4xl">📦</div>
          </div>

          <!-- Content -->
          <div class="p-4 flex flex-col flex-1">
            <!-- Store Logo and Status -->
            <div class="flex justify-between items-start mb-3">
              <div class="flex items-center gap-2">
                <div v-if="item.store?.logoUrl" class="bg-white dark:bg-white px-2 py-1 rounded">
                  <img
                    :src="item.store.logoUrl"
                    :alt="item.store.name"
                    class="h-4 w-auto object-contain"
                    :title="item.store.name"
                  />
                </div>
                <span v-else-if="item.store?.name" class="text-xs text-gray-500 dark:text-gray-400">
                  {{ item.store.name }}
                </span>
              </div>
              <span
                :class="[
                  'text-xs px-2 py-1 rounded-full font-medium',
                  item.status === 'to_buy' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' : '',
                  item.status === 'wishlist' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' : '',
                  item.status === 'purchased' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : '',
                ]"
              >
                {{ statusLabel(item.status) }}
              </span>
            </div>

            <!-- Product Name -->
            <h3 class="font-semibold text-black dark:text-white group-hover:underline mb-2 line-clamp-2">{{ item.name }}</h3>

            <p v-if="item.description" class="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
              {{ item.description }}
            </p>

            <div class="flex items-center justify-between mb-3 mt-auto">
              <p v-if="item.currentPrice" class="text-lg font-bold text-black dark:text-white">
                {{ item.currentPrice.toFixed(2) }} {{ item.currency }}
              </p>
              <span
                v-if="item.currentPrice"
                class="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full font-medium"
              >
                Disponibile
              </span>
              <span
                v-else
                class="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-full font-medium"
              >
                Non disponibile
              </span>
            </div>

            <div class="flex gap-2">
              <a
                v-if="item.productUrl"
                :href="item.productUrl"
                target="_blank"
                @click.stop
                class="flex-1 text-center bg-gray-100 dark:bg-gray-700 text-black dark:text-white px-3 py-2 rounded text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
              >
                Apri Link
              </a>
              <button
                @click.stop="deleteItemHandler(item.id)"
                class="px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/40 transition"
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
      class="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
      @click="!isSaving && closeModal()"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <h2 class="text-2xl font-bold text-black dark:text-white mb-6">Traccia Nuovo Prodotto</h2>
        <form @submit.prevent="addItemHandler" class="space-y-4">
          <!-- URL Input -->
          <div>
            <label class="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              URL Prodotto * <span class="text-xs text-gray-500 dark:text-gray-400">(Amazon, eBay, ecc.)</span>
            </label>
            <input
              v-model="productUrl"
              type="url"
              required
              placeholder="https://www.amazon.it/..."
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          <!-- Loading Preview -->
          <div v-if="isLoadingPreview" class="text-center py-4">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white"></div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">Caricamento preview...</p>
          </div>

          <!-- Preview Error -->
          <div v-if="previewError" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p class="text-sm text-red-600 dark:text-red-400">{{ previewError }}</p>
          </div>

          <!-- Preview Result -->
          <div v-if="preview" class="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
            <div class="flex items-start gap-3">
              <img
                v-if="preview.product.imageUrl"
                :src="preview.product.imageUrl"
                alt="Product preview"
                class="w-20 h-20 object-cover rounded"
              />
              <div class="flex-1">
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ preview.store.name }}</p>
                <p class="font-medium text-black dark:text-white">{{ preview.product.title || 'Prodotto senza titolo' }}</p>
                <p class="text-lg font-bold text-black dark:text-white">
                  {{ preview.product.price.toFixed(2) }} {{ preview.product.currency }}
                </p>
                <span
                  v-if="preview.product.isAvailable"
                  class="inline-block text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-full"
                >
                  Disponibile
                </span>
                <span
                  v-else
                  class="inline-block text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded-full"
                >
                  Non disponibile
                </span>
              </div>
            </div>
          </div>

          <!-- Custom Name (Optional) -->
          <div v-if="preview">
            <label class="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Nome personalizzato <span class="text-xs text-gray-500 dark:text-gray-400">(opzionale)</span>
            </label>
            <input
              v-model="customName"
              type="text"
              :placeholder="preview.product.title || 'Lascia vuoto per usare il titolo rilevato'"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          <!-- Target Price (Optional) -->
          <div v-if="preview">
            <label class="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              Prezzo target <span class="text-xs text-gray-500 dark:text-gray-400">(opzionale - per alert)</span>
            </label>
            <input
              v-model.number="targetPrice"
              type="number"
              step="0.01"
              :placeholder="`Es: ${(preview.product.price * 0.9).toFixed(2)}`"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          <!-- Notes (Optional) -->
          <div v-if="preview">
            <label class="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Note</label>
            <textarea
              v-model="notes"
              rows="2"
              placeholder="Aggiungi note..."
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent resize-none placeholder:text-gray-400 dark:placeholder:text-gray-500"
            ></textarea>
          </div>

          <div class="flex gap-3 pt-4">
            <button
              type="submit"
              :disabled="!preview || isLoadingPreview || isSaving"
              class="flex-1 bg-black dark:bg-white text-white dark:text-black py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <div v-if="isSaving" class="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white dark:border-black"></div>
              <span>{{ isSaving ? 'Salvataggio...' : 'Salva e Traccia' }}</span>
            </button>
            <button
              type="button"
              @click="closeModal"
              :disabled="isSaving"
              class="flex-1 bg-gray-100 dark:bg-gray-700 text-black dark:text-white py-3 rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Detail Item Modal -->
    <div
      v-if="showDetailModal && selectedItem"
      class="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
      @click="closeDetailModal"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <!-- Header with Store Logo -->
        <div class="flex justify-between items-start mb-6">
          <div class="flex items-center gap-3">
            <div v-if="selectedItem.store?.logoUrl" class="bg-white dark:bg-white px-3 py-2 rounded">
              <img
                :src="selectedItem.store.logoUrl"
                :alt="selectedItem.store.name"
                class="h-8 w-auto object-contain"
              />
            </div>
            <div>
              <h2 class="text-2xl font-bold text-black dark:text-white">{{ selectedItem.name }}</h2>
              <p v-if="selectedItem.store?.name" class="text-sm text-gray-500 dark:text-gray-400">
                {{ selectedItem.store.name }}
              </p>
            </div>
          </div>
          <button
            @click="closeDetailModal"
            class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>

        <!-- Product Image -->
        <div v-if="selectedItem.imageUrl" class="mb-6">
          <img
            :src="selectedItem.imageUrl"
            :alt="selectedItem.name"
            class="w-full max-h-96 object-contain rounded-lg bg-gray-50 dark:bg-gray-700"
          />
        </div>

        <!-- Details Grid -->
        <div class="space-y-4">
          <!-- Price and Availability -->
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Prezzo Attuale</p>
              <p class="text-2xl font-bold text-black dark:text-white">
                {{ selectedItem.currentPrice?.toFixed(2) || 'N/A' }} {{ selectedItem.currency }}
              </p>
            </div>
            <span
              :class="[
                'text-sm px-3 py-1.5 rounded-full font-medium',
                selectedItem.currentPrice ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
              ]"
            >
              {{ selectedItem.currentPrice ? 'Disponibile' : 'Non disponibile' }}
            </span>
          </div>

          <!-- Target Price -->
          <div v-if="selectedItem.targetPrice" class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Prezzo Target</p>
            <p class="text-xl font-bold text-blue-900 dark:text-blue-400">
              {{ selectedItem.targetPrice.toFixed(2) }} {{ selectedItem.currency }}
            </p>
            <p v-if="selectedItem.currentPrice && selectedItem.currentPrice <= selectedItem.targetPrice" class="text-sm text-green-600 dark:text-green-400 mt-2">
              ✓ Prezzo target raggiunto!
            </p>
          </div>

          <!-- Description -->
          <div v-if="selectedItem.description">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Descrizione</p>
            <p class="text-gray-600 dark:text-gray-400">{{ selectedItem.description }}</p>
          </div>

          <!-- Notes -->
          <div v-if="selectedItem.notes">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Note</p>
            <p class="text-gray-600 dark:text-gray-400">{{ selectedItem.notes }}</p>
          </div>

          <!-- SKU -->
          <div v-if="selectedItem.sku" class="flex items-center gap-2">
            <p class="text-sm text-gray-600 dark:text-gray-400">SKU:</p>
            <p class="text-sm font-mono text-gray-900 dark:text-gray-100">{{ selectedItem.sku }}</p>
          </div>

          <!-- Tracking Status -->
          <div class="flex items-center gap-2">
            <p class="text-sm text-gray-600 dark:text-gray-400">Stato:</p>
            <span
              :class="[
                'text-xs px-2 py-1 rounded-full font-medium',
                selectedItem.status === 'tracking' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : '',
                selectedItem.status === 'paused' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' : '',
                selectedItem.status === 'purchased' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400' : '',
              ]"
            >
              {{ statusLabel(selectedItem.status) }}
            </span>
          </div>

          <!-- Last Checked -->
          <div v-if="selectedItem.lastCheckedAt" class="text-sm text-gray-500 dark:text-gray-400">
            Ultimo controllo: {{ new Date(selectedItem.lastCheckedAt).toLocaleString('it-IT') }}
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <a
            :href="selectedItem.productUrl"
            target="_blank"
            class="flex-1 text-center bg-black dark:bg-white text-white dark:text-black px-4 py-3 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition"
          >
            Vai al Prodotto
          </a>
          <button
            @click="closeDetailModal"
            class="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-black dark:text-white rounded-lg font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      title="Elimina Item"
      message="Questa azione non può essere annullata."
      confirm-text="Elimina"
      cancel-text="Annulla"
      variant="danger"
      @confirm="confirmDelete"
    >
      <!-- Item Preview in Dialog -->
      <div v-if="itemToDeleteData" class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
        <div class="flex items-center gap-3">
          <div class="w-16 h-16 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
            <img
              v-if="itemToDeleteData.imageUrl"
              :src="itemToDeleteData.imageUrl"
              :alt="itemToDeleteData.name"
              class="w-full h-full object-cover"
            />
            <div v-else class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-2xl">
              📦
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-gray-900 dark:text-white truncate">{{ itemToDeleteData.name }}</p>
            <p v-if="itemToDeleteData.currentPrice" class="text-sm text-gray-600 dark:text-gray-400">
              {{ itemToDeleteData.currentPrice.toFixed(2) }} {{ itemToDeleteData.currency }}
            </p>
            <p v-if="itemToDeleteData.store?.name" class="text-xs text-gray-500 dark:text-gray-400">
              {{ itemToDeleteData.store.name }}
            </p>
          </div>
        </div>
      </div>
    </ConfirmDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useItemsStore } from '@/stores/items'
import { useAuthStore } from '@/stores/auth'
import { trackedItemsApi } from '@/services/trackedItemsApi'
import { useDebounce } from '@/composables/useDebounce'
import type { PreviewItemResponse, TrackedItem } from '@/types/tracked-item'
import Navbar from '@/components/Navbar.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'

const router = useRouter()
const itemsStore = useItemsStore()
const authStore = useAuthStore()
const showAddModal = ref(false)

// Detail modal state
const showDetailModal = ref(false)
const selectedItem = ref<TrackedItem | null>(null)

// Delete confirmation state
const showDeleteDialog = ref(false)
const itemToDelete = ref<string | null>(null)

// Get item data for delete confirmation
const itemToDeleteData = computed(() => {
  if (!itemToDelete.value) return null
  return itemsStore.items.find(item => item.id === itemToDelete.value) || null
})

// Preview state
const productUrl = ref('')
const customName = ref('')
const targetPrice = ref<number | undefined>()
const notes = ref('')
const preview = ref<PreviewItemResponse | null>(null)
const isLoadingPreview = ref(false)
const isSaving = ref(false)
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
  itemsStore.fetchItems()
}

const addItemHandler = async () => {
  if (!preview.value || isSaving.value) return

  isSaving.value = true
  previewError.value = ''

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
  } finally {
    isSaving.value = false
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
  isSaving.value = false
}

const deleteItemHandler = (id: string) => {
  itemToDelete.value = id
  showDeleteDialog.value = true
}

const confirmDelete = async () => {
  if (itemToDelete.value) {
    await itemsStore.deleteItem(itemToDelete.value)
    itemToDelete.value = null
  }
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
}

const openDetailModal = (item: TrackedItem) => {
  selectedItem.value = item
  showDetailModal.value = true
}

const closeDetailModal = () => {
  showDetailModal.value = false
  selectedItem.value = null
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
