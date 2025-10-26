import axios from 'axios'

const API_URL = 'http://localhost:3000'

export interface Store {
  id: string
  name: string
  domain: string
  logoUrl?: string
  brandColor?: string
  isActive: boolean
  scrapeType: string
  minDelayMs: number
  createdAt: string
  updatedAt: string
}

export const storesApi = {
  async getAll(activeOnly = true): Promise<Store[]> {
    const response = await axios.get(`${API_URL}/stores`, {
      params: { activeOnly: activeOnly.toString() }
    })
    return response.data
  },

  async getById(id: string): Promise<Store> {
    const response = await axios.get(`${API_URL}/stores/${id}`)
    return response.data
  }
}