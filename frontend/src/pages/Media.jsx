import React from 'react'
import { useTranslation } from 'react-i18next'

export default function Media() {
  const { t } = useTranslation()
  return (
    <section>
      <h2 className="text-2xl font-semibold">{t('media_title', 'Media')}</h2>
      <p className="mt-4">{t('media_text', 'Media mentions and press kit placeholder.')}</p>
    </section>
  )
}
