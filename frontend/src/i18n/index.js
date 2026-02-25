import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import fr from './locales/fr.json'
import es from './locales/es.json'
import ar from './locales/ar.json'

const resources = {
  en: { common: en },
  fr: { common: fr },
  es: { common: es },
  ar: { common: ar }
}

const supported = ['en', 'fr', 'es', 'ar']

function detectInitialLanguage() {
  // 1. try URL path: /{lng}/...
  try {
    const p = typeof window !== 'undefined' ? window.location.pathname : ''
    const seg = p.split('/').filter(Boolean)[0]
    if (seg && supported.includes(seg)) return seg
  } catch (e) {}

  // 2. localStorage
  try {
    const stored = localStorage.getItem('spm_lang')
    if (stored && supported.includes(stored)) return stored
  } catch (e) {}

  // 3. navigator
  try {
    const nav = (navigator.language || navigator.userLanguage || '').slice(0,2)
    if (nav && supported.includes(nav)) return nav
  } catch (e) {}

  return 'en'
}

const initialLang = detectInitialLanguage()

i18n.use(initReactI18next).init({
  resources,
  lng: initialLang,
  fallbackLng: 'en',
  ns: ['common'],
  defaultNS: 'common',
  interpolation: { escapeValue: false }
})

// Update document language and direction on change
function applyLang(lng) {
  try {
    document.documentElement.lang = lng
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'
  } catch (e) {
    // server-side or test env
  }
}

applyLang(initialLang)
i18n.on('languageChanged', (lng) => {
  applyLang(lng)
  try { localStorage.setItem('spm_lang', lng) } catch(e) {}
  // update URL to include language prefix if not present
  try {
    const url = new URL(window.location.href)
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts[0] !== lng) {
      // prepend language
      const newPath = '/' + [lng].concat(parts).join('/') + url.search
      window.history.replaceState({}, '', newPath)
    }
  } catch (e) {}
})

export default i18n
