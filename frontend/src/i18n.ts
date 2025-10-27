import { createI18n } from 'vue-i18n'
import it from './locales/it.json'
import en from './locales/en.json'

export type Locale = 'it' | 'en'

// Get saved locale or default to Italian
const savedLocale = (localStorage.getItem('locale') as Locale) || 'it'

const i18n = createI18n({
  legacy: false, // Use Composition API
  locale: savedLocale,
  fallbackLocale: 'it',
  messages: {
    it,
    en
  },
  globalInjection: true
})

export default i18n
