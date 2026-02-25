import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Home from './pages/Home'
import Jobs from './pages/Jobs'
import Chat from './pages/Chat'
import Navbar from './components/Navbar'
import PrivacyPolicy from './pages/PrivacyPolicy'
import Cookies from './pages/Cookies'
import Backlog from './pages/Backlog'
import Media from './pages/Media'
import Documentation from './pages/Documentation'
import UseCases from './pages/UseCases'

export default function App() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main className="p-6 container mx-auto">
        <h1 className="sr-only">{t('title')}</h1>
        <Routes>
          {/* non-prefixed routes */}
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/documents/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/documents/cookies" element={<Cookies />} />
          <Route path="/backlog" element={<Backlog />} />
          <Route path="/media" element={<Media />} />
          <Route path="/documentation" element={<Documentation />} />
          <Route path="/use-cases" element={<UseCases />} />

          {/* language-prefixed routes: /:lng/... */}
          <Route path="/:lng/" element={<Home />} />
          <Route path="/:lng/jobs" element={<Jobs />} />
          <Route path="/:lng/documents/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/:lng/documents/cookies" element={<Cookies />} />
          <Route path="/:lng/backlog" element={<Backlog />} />
          <Route path="/:lng/media" element={<Media />} />
          <Route path="/:lng/documentation" element={<Documentation />} />
          <Route path="/:lng/use-cases" element={<UseCases />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/:lng/chat" element={<Chat />} />
        </Routes>
      </main>
      <footer className="p-4 text-center text-sm text-slate-500">© SPM</footer>
    </div>
  )
}
