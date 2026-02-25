import React from 'react'
import Hero from '../components/Hero'
import ChatPrompt from '../components/ChatPrompt'

export default function Home() {
  return (
    <div className="space-y-12">
      <Hero />
      <ChatPrompt />

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold">Product</h3>
          <p className="mt-2 text-sm text-slate-600">Explain the future map product, heatmaps, and safety scoring.</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold">Backlog</h3>
          <p className="mt-2 text-sm text-slate-600">Public roadmap and upcoming milestones.</p>
        </div>
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold">Jobs</h3>
          <p className="mt-2 text-sm text-slate-600">Open roles and how to apply — remote friendly.</p>
        </div>
      </section>

      <section className="p-6 bg-slate-50 rounded-lg">
        <h3 className="text-lg font-semibold">Get involved</h3>
        <p className="mt-2 text-sm text-slate-600">Subscribe for updates or check the documentation for integration ideas.</p>
      </section>
    </div>
  )
}
