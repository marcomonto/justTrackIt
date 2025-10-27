import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Locale } from '@/i18n'

export const useLocaleStore = defineStore('locale', () => {
  const currentLocale = ref<Locale>('it')

  const initLocale = () => {
    const savedLocale = localStorage.getItem('locale') as Locale
    if (savedLocale && (savedLocale === 'it' || savedLocale === 'en')) {
      currentLocale.value = savedLocale
    }
  }

  const setLocale = (newLocale: Locale) => {
    currentLocale.value = newLocale
    localStorage.setItem('locale', newLocale)
    // The i18n locale will be updated directly in the component
  }

  return {
    currentLocale,
    initLocale,
    setLocale
  }
})
