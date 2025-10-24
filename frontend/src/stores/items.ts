import { defineStore } from 'pinia'
import { ref } from 'vue'
import { itemsApi } from '@/services/itemsApi'
import type { Item, CreateItemDto, UpdateItemDto } from '@/types/item'

export const useItemsStore = defineStore('items', () => {
  const items = ref<Item[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchItems = async (filter?: string) => {
    loading.value = true
    error.value = null
    try {
      items.value = await itemsApi.getAll(filter)
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Errore durante il caricamento degli items'
      console.error('Error fetching items:', e)
    } finally {
      loading.value = false
    }
  }

  const addItem = async (item: CreateItemDto) => {
    loading.value = true
    error.value = null
    try {
      const newItem = await itemsApi.create(item)
      items.value.unshift(newItem)
      return newItem
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Errore durante la creazione dell\'item'
      console.error('Error creating item:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  const updateItem = async (id: number, item: UpdateItemDto) => {
    loading.value = true
    error.value = null
    try {
      const updatedItem = await itemsApi.update(id, item)
      const index = items.value.findIndex((i) => i.id === id)
      if (index !== -1) {
        items.value[index] = updatedItem
      }
      return updatedItem
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Errore durante l\'aggiornamento dell\'item'
      console.error('Error updating item:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  const deleteItem = async (id: number) => {
    loading.value = true
    error.value = null
    try {
      await itemsApi.delete(id)
      items.value = items.value.filter((i) => i.id !== id)
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Errore durante l\'eliminazione dell\'item'
      console.error('Error deleting item:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    loading,
    error,
    fetchItems,
    addItem,
    updateItem,
    deleteItem,
  }
})
