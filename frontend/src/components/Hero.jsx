import React from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Hero() {
  const { t } = useTranslation()

  return (
    <section className="rounded-lg p-8 bg-gradient-to-r from-sky-50 to-white border">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">{t('title', 'Safe Pocket Map')}</h1>
        <p className="mt-4 text-slate-600 text-lg">{t('hero_sub', 'A public landing SPA explaining the future safety map product and roadmap.')}</p>

        <div className="mt-8 flex justify-center gap-4">
          <Link to="/jobs" className="px-6 py-3 bg-blue-600 text-white rounded-md">{t('cta_jobs', 'See jobs')}</Link>
          <Link to="/documentation" className="px-6 py-3 border rounded-md">{t('cta_docs', 'Read documentation')}</Link>
        </div>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="p-4">
            <h4 className="font-semibold">Privacy-first</h4>
            <p className="text-sm text-slate-600">No personal tracking, public summaries only.</p>
          </div>
          <div className="p-4">
            <h4 className="font-semibold">Open roadmap</h4>
            <p className="text-sm text-slate-600">Transparent phases and public backlog.</p>
          </div>
          <div className="p-4">
            <h4 className="font-semibold">Community-driven</h4>
            <p className="text-sm text-slate-600">Contribute, suggest, and apply for roles.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
