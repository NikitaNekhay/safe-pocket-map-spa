import React from 'react'
import { useTranslation } from 'react-i18next'

export default function Cookies() {
  const { t } = useTranslation()
  return (
    <section>
      <h2 className="text-2xl font-semibold">{t('cookies_title', 'Cookies')}</h2>
      <p className="mt-4">{t('cookies_text', 'This site uses cookies to improve experience.')}</p>
    </section>
  )
}
