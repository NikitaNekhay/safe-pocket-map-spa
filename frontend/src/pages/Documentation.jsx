import React from 'react'
import { useTranslation } from 'react-i18next'

export default function Documentation() {
  const { t } = useTranslation()
  return (
    <section>
      <h2 className="text-2xl font-semibold">{t('documentation_title', 'Documentation')}</h2>
      <p className="mt-4">{t('documentation_text', 'Documentation for how SPM will work.')}</p>
    </section>
  )
}
