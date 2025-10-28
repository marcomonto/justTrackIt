<template>
  <header class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-50 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-3">
          <img src="/justTrackItLogo.png" alt="Just Track It Logo" class="h-20 sm:h-12 w-auto" />
          <h1 class="text-2xl sm:text-3xl font-bold text-black dark:text-white">{{ $t('common.appName') }}</h1>
        </div>

        <!-- Desktop Menu -->
        <div class="hidden md:flex items-center gap-6">
          <!-- Navigation Links -->
          <nav class="flex items-center gap-4">
            <router-link
              to="/"
              class="flex items-center gap-2 text-sm font-medium transition-colors"
              :class="
                $route.name === 'items'
                  ? 'text-black dark:text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'
              "
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              {{ $t('nav.myItems') }}
            </router-link>
            <router-link
              to="/stores"
              class="flex items-center gap-2 text-sm font-medium transition-colors"
              :class="
                $route.name === 'stores'
                  ? 'text-black dark:text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white'
              "
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
              </svg>
              {{ $t('nav.stores') }}
            </router-link>
          </nav>

          <!-- User Menu Dropdown -->
          <div class="relative">
            <button
              @click="desktopMenuOpen = !desktopMenuOpen"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="User menu"
            >
              <svg class="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
              </svg>
            </button>

            <!-- Dropdown Menu -->
            <div
              v-if="desktopMenuOpen"
              class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50"
            >
              <!-- Theme Toggle -->
              <button
                @click="themeStore.toggleTheme()"
                class="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <span>{{ themeStore.theme === 'light' ? $t('nav.darkMode') : $t('nav.lightMode') }}</span>
                <svg
                  v-if="themeStore.theme === 'light'"
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
                </svg>
                <svg
                  v-else
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
                </svg>
              </button>

              <!-- Language Selector -->
              <div class="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{{ $t('nav.language') }}</span>
                <div class="flex items-center gap-1 mt-2">
                  <button
                    @click="switchLocale('it')"
                    :class="[
                      'flex-1 px-2 py-1 rounded text-xl transition',
                      localeStore.currentLocale === 'it'
                        ? 'bg-gray-200 dark:bg-gray-700'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    ]"
                    aria-label="Italian"
                  >
                    🇮🇹
                  </button>
                  <button
                    @click="switchLocale('en')"
                    :class="[
                      'flex-1 px-2 py-1 rounded text-xl transition',
                      localeStore.currentLocale === 'en'
                        ? 'bg-gray-200 dark:bg-gray-700'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                    ]"
                    aria-label="English"
                  >
                    🇬🇧
                  </button>
                </div>
              </div>

              <!-- Logout -->
              <button
                @click="handleLogout"
                class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition border-t border-gray-200 dark:border-gray-700"
              >
                {{ $t('nav.logout') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Mobile Menu Button -->
        <button
          @click="mobileMenuOpen = !mobileMenuOpen"
          class="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          aria-label="Menu"
        >
          <svg
            v-if="!mobileMenuOpen"
            class="w-6 h-6 text-gray-700 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
          <svg
            v-else
            class="w-6 h-6 text-gray-700 dark:text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Mobile Menu -->
      <div
        v-if="mobileMenuOpen"
        class="md:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3"
      >
        <router-link
          to="/"
          @click="mobileMenuOpen = false"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          :class="
            $route.name === 'items'
              ? 'bg-black dark:bg-white text-white dark:text-black'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          "
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
          </svg>
          {{ $t('nav.myItems') }}
        </router-link>
        <router-link
          to="/stores"
          @click="mobileMenuOpen = false"
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
          :class="
            $route.name === 'stores'
              ? 'bg-black dark:bg-white text-white dark:text-black'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          "
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/>
          </svg>
          {{ $t('nav.stores') }}
        </router-link>
        <button
          @click="themeStore.toggleTheme()"
          class="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
        >
          <span>{{ themeStore.theme === 'light' ? $t('nav.darkMode') : $t('nav.lightMode') }}</span>
          <svg
            v-if="themeStore.theme === 'light'"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/>
          </svg>
          <svg
            v-else
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/>
          </svg>
        </button>
        <div class="flex items-center gap-2 px-4">
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('nav.language') }}:</span>
          <div class="flex items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
            <button
              @click="switchLocale('it')"
              :class="[
                'px-2 py-1 rounded text-xl transition',
                localeStore.currentLocale === 'it'
                  ? 'bg-gray-200 dark:bg-gray-700'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              ]"
              aria-label="Italian"
            >
              🇮🇹
            </button>
            <button
              @click="switchLocale('en')"
              :class="[
                'px-2 py-1 rounded text-xl transition',
                localeStore.currentLocale === 'en'
                  ? 'bg-gray-200 dark:bg-gray-700'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800'
              ]"
              aria-label="English"
            >
              🇬🇧
            </button>
          </div>
        </div>
        <button
          @click="handleLogout"
          class="w-full text-left px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
        >
          {{ $t('nav.logout') }}
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useLocaleStore } from '@/stores/locale'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore()
const themeStore = useThemeStore()
const localeStore = useLocaleStore()
const router = useRouter()
const mobileMenuOpen = ref(false)
const desktopMenuOpen = ref(false)
const { locale } = useI18n()

// Initialize locale
localeStore.initLocale()
locale.value = localeStore.currentLocale

const switchLocale = (newLocale: 'it' | 'en') => {
  localeStore.setLocale(newLocale)
  locale.value = newLocale
}

const handleLogout = async () => {
  await authStore.logout()
  router.push('/login')
  mobileMenuOpen.value = false
  desktopMenuOpen.value = false
}

// Close desktop menu when clicking outside
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (desktopMenuOpen.value && !target.closest('.relative')) {
      desktopMenuOpen.value = false
    }
  })
}
</script>