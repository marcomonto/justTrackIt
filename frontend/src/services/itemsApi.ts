import axios from 'axios'
import type { Item, CreateItemDto, UpdateItemDto } from '@/types/item'

const API_URL = 'http://localhost:3000/api/items'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies!
})

export const itemsApi = {
  getAll: async (filter?: string): Promise<Item[]> => {
    const response = await api.get<Item[]>('/', {
      params: filter ? { filter } : {},
    })
    return response.data
  },

  getOne: async (id: number): Promise<Item> => {
    const response = await api.get<Item>(`/${id}`)
    return response.data
  },

  create: async (item: CreateItemDto): Promise<Item> => {
    const response = await api.post<Item>('/', item)
    return response.data
  },

  update: async (id: number, item: UpdateItemDto): Promise<Item> => {
    const response = await api.patch<Item>(`/${id}`, item)
    return response.data
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/${id}`)
  },

  getStats: async (): Promise<any> => {
    const response = await api.get('/stats')
    return response.data
  },
}
