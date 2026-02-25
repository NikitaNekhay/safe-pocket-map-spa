import React from 'react'
import { Link } from 'react-router-dom'
import LanguageSwitcher from './LanguageSwitcher'
import i18n from '../i18n'

export default function Navbar() {
  const lang = (i18n && i18n.language) ? i18n.language : 'en'
  const prefix = lang ? `/${lang}` : ''

  return (
    <header className="border-b p-4">
      <nav className="container mx-auto flex justify-between items-center">
        <div className="font-bold">Safe Pocket Map</div>
        <div className="flex items-center gap-6">
          <div className="space-x-4">
            <Link to={`${prefix}/`}>Home</Link>
            <Link to={`${prefix}/backlog`}>Backlog</Link>
            <Link to={`${prefix}/media`}>Media</Link>
            <Link to={`${prefix}/documentation`}>Documentation</Link>
            <Link to={`${prefix}/use-cases`}>Use cases</Link>
            <Link to={`${prefix}/jobs`}>Jobs</Link>
          </div>
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  )
}
