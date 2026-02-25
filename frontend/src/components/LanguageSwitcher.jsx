import React from 'react'
import i18n from '../i18n'

const langs = [
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'es', label: 'ES' },
  { code: 'ar', label: 'AR' }
]

export default function LanguageSwitcher() {
  const change = (lng) => {
    i18n.changeLanguage(lng)
    try { localStorage.setItem('spm_lang', lng) } catch (e) {}
    // update URL path to include language prefix (simple behavior)
    try {
      const url = new URL(window.location.href)
      const parts = url.pathname.split('/').filter(Boolean)
      if (parts[0] !== lng) {
        const newPath = '/' + [lng].concat(parts).join('/') + url.search
        window.history.pushState({}, '', newPath)
      }
    } catch (e) {}
  }

  const current = i18n.language || 'en'

  return (
    <div className="inline-flex items-center space-x-2">
      {langs.map(l => (
        <button key={l.code} onClick={() => change(l.code)} className={"px-2 py-1 rounded " + (current===l.code? 'bg-slate-200' : '')}>
          {l.label}
        </button>
      ))}
    </div>
  )
}

