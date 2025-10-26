import axios from 'axios'
import type {
  TrackedItem,
  PreviewItemDto,
  PreviewItemResponse,
  CreateTrackedItemDto,
  UpdateTrackedItemDto,
} from '@/types/tracked-item'

const API_URL = 'http://localhost:3000/api/items'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

export const trackedItemsApi = {
  // Preview item without saving
  preview: async (dto: PreviewItemDto): Promise<PreviewItemResponse> => {
    const response = await api.post<PreviewItemResponse>('/preview', dto)
    return response.data
  },

  // Get all tracked items
  getAll: async (filter?: 'tracking' | 'paused' | 'purchased'): Promise<TrackedItem[]> => {
    const response = await api.get<TrackedItem[]>('/tracked', {
      params: filter ? { filter } : {},
    })
    return response.data
  },

  // Get one tracked item
  getOne: async (id: string): Promise<TrackedItem> => {
    const response = await api.get<TrackedItem>(`/tracked/${id}`)
    return response.data
  },

  // Create tracked item
  create: async (dto: CreateTrackedItemDto): Promise<TrackedItem> => {
    const response = await api.post<TrackedItem>('/tracked', dto)
    return response.data
  },

  // Update tracked item
  update: async (id: string, dto: UpdateTrackedItemDto): Promise<TrackedItem> => {
    const response = await api.patch<TrackedItem>(`/tracked/${id}`, dto)
    return response.data
  },

  // Delete tracked item
  delete: async (id: string): Promise<void> => {
    await api.delete(`/tracked/${id}`)
  },

  // Refresh price
  refreshPrice: async (id: string): Promise<TrackedItem> => {
    const response = await api.post<TrackedItem>(`/tracked/${id}/refresh`)
    return response.data
  },

  // Get price history
  getPriceHistory: async (id: string): Promise<any[]> => {
    const response = await api.get(`/tracked/${id}/history`)
    return response.data
  },

  // Get stats
  getStats: async (): Promise<any> => {
    const response = await api.get('/tracked/stats')
    return response.data
  },
}
