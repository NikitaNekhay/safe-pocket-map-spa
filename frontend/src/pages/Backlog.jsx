import React from 'react'
import { useTranslation } from 'react-i18next'

export default function Backlog() {
  const { t } = useTranslation()
  return (
    <section>
      <h2 className="text-2xl font-semibold">{t('backlog_title', 'Backlog')}</h2>
      <ul className="mt-4 list-disc pl-6">
        <li>Phase 1: Repository setup</li>
        <li>Phase 2: Frontend core</li>
        <li>Phase 3: Backend integration</li>
      </ul>
    </section>
  )
}
