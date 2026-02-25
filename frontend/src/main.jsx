import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import './i18n'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)

// URL canonicalization: ensure first path segment is supported language
try {
  const supported = ['en','fr','es','ar']
  const path = window.location.pathname
  const parts = path.split('/').filter(Boolean)
  if (!supported.includes(parts[0])) {
    const lang = window.localStorage.getItem('spm_lang') || (navigator.language||'en').slice(0,2) || 'en'
    const chosen = supported.includes(lang) ? lang : 'en'
    const newPath = '/' + [chosen].concat(parts).join('/') + window.location.search
    window.history.replaceState({}, '', newPath)
  }
} catch (e) {}

// Ensure initial dir/lang applied when app boots
import i18n from './i18n'
try {
  document.documentElement.lang = i18n.language
  document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
} catch (e) {}
