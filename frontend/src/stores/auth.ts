import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi } from '@/services/authApi'
import type { User, RegisterDto, LoginDto } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const isAuthenticated = ref(false)

  const register = async (data: RegisterDto) => {
    loading.value = true
    error.value = null
    try {
      const response = await authApi.register(data)
      user.value = response.user
      isAuthenticated.value = true
      return response.user
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Errore durante la registrazione'
      throw e
    } finally {
      loading.value = false
    }
  }

  const login = async (data: LoginDto) => {
    loading.value = true
    error.value = null
    try {
      const response = await authApi.login(data)
      user.value = response.user
      isAuthenticated.value = true
      return response.user
    } catch (e: any) {
      error.value = e.response?.data?.message || 'Errore durante il login'
      throw e
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    loading.value = true
    try {
      await authApi.logout()
      user.value = null
      isAuthenticated.value = false
    } catch (e: any) {
      console.error('Error during logout:', e)
    } finally {
      loading.value = false
    }
  }

  const checkAuth = async () => {
    try {
      const response = await authApi.getMe()
      user.value = response.user
      isAuthenticated.value = true
    } catch (e) {
      user.value = null
      isAuthenticated.value = false
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    register,
    login,
    logout,
    checkAuth,
  }
})
