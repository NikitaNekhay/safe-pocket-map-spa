import React from 'react'
import { useTranslation } from 'react-i18next'

export default function UseCases() {
  const { t } = useTranslation()
  return (
    <section>
      <h2 className="text-2xl font-semibold">{t('usecases_title', 'Use Cases')}</h2>
      <ul className="mt-4 list-disc pl-6">
        <li>{t('usecase_citizen', 'Local citizen navigation')}</li>
        <li>{t('usecase_ngo', 'NGO data planning')}</li>
        <li>{t('usecase_travel', 'Travel safety')}</li>
      </ul>
    </section>
  )
}
