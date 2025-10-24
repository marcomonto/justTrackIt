import axios from 'axios'
import type { User, RegisterDto, LoginDto, AuthResponse } from '@/types/auth'

const API_URL = 'http://localhost:3000/api/auth'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for cookies!
})

export const authApi = {
  register: async (data: RegisterDto): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/register', data)
    return response.data
  },

  login: async (data: LoginDto): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/login', data)
    return response.data
  },

  logout: async (): Promise<void> => {
    await api.post('/logout')
  },

  getMe: async (): Promise<AuthResponse> => {
    const response = await api.get<AuthResponse>('/me')
    return response.data
  },
}
