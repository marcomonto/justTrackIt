<template>
  <div class="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900 px-4">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="text-4xl font-bold text-center text-black dark:text-white">{{ $t('common.appName') }}</h2>
        <p class="mt-2 text-center text-gray-600 dark:text-gray-400">{{ $t('auth.register.title') }}</p>
      </div>

      <form @submit.prevent="handleRegister" class="mt-8 space-y-6">
        <div v-if="authStore.error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded">
          {{ authStore.error }}
        </div>

        <div class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-900 dark:text-gray-100">{{ $t('auth.register.name') }}</label>
            <input
              id="name"
              v-model="formData.name"
              type="text"
              required
              class="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition placeholder:text-gray-400 dark:placeholder:text-gray-500"
              :placeholder="$t('auth.register.namePlaceholder')"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-900 dark:text-gray-100">{{ $t('auth.register.email') }}</label>
            <input
              id="email"
              v-model="formData.email"
              type="email"
              required
              class="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition placeholder:text-gray-400 dark:placeholder:text-gray-500"
              :placeholder="$t('auth.register.emailPlaceholder')"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-900 dark:text-gray-100">{{ $t('auth.register.password') }}</label>
            <input
              id="password"
              v-model="formData.password"
              type="password"
              required
              minlength="6"
              class="mt-1 block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent transition placeholder:text-gray-400 dark:placeholder:text-gray-500"
              :placeholder="$t('auth.register.passwordPlaceholder')"
            />
          </div>
        </div>

        <button
          type="submit"
          :disabled="authStore.loading"
          class="w-full bg-black dark:bg-white text-white dark:text-black py-3 px-4 rounded-lg font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ authStore.loading ? $t('common.loading') : $t('auth.register.registerButton') }}
        </button>

        <p class="text-center text-sm text-gray-600 dark:text-gray-400">
          {{ $t('auth.register.hasAccount') }}
          <router-link to="/login" class="font-medium text-black dark:text-white hover:underline">
            {{ $t('auth.register.login') }}
          </router-link>
        </p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const formData = ref({
  name: '',
  email: '',
  password: '',
})

const handleRegister = async () => {
  try {
    await authStore.register(formData.value)
    router.push('/')
  } catch (e) {
    console.error('Registration failed:', e)
  }
}
</script>
