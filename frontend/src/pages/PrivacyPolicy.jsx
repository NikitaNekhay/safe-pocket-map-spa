import React from 'react'
import { useTranslation } from 'react-i18next'

export default function PrivacyPolicy() {
  const { t } = useTranslation()
  return (
    <section>
      <h2 className="text-2xl font-semibold">{t('privacy_title', 'Privacy Policy')}</h2>
      <p className="mt-4">{t('privacy_text', 'This is the privacy policy placeholder.')}</p>
    </section>
  )
}
