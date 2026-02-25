import React, { useState } from 'react'
import axios from '../services/api'

export default function Jobs() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', cv: '', age: '', motivation: '', location: '' })
  const [status, setStatus] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('/api/jobs/apply', form)
      setStatus('sent')
    } catch (err) {
      setStatus('error')
    }
  }

  return (
    <section>
      <h2 className="text-2xl font-semibold">Jobs</h2>
      <form onSubmit={submit} className="mt-4 space-y-2 max-w-md">
        <input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="Name" className="w-full" />
        <input value={form.email} onChange={e=>setForm({...form, email: e.target.value})} placeholder="Email" className="w-full" />
        <input value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} placeholder="Phone" className="w-full" />
        <input value={form.cv} onChange={e=>setForm({...form, cv: e.target.value})} placeholder="CV (link or text)" className="w-full" />
        <input value={form.age} onChange={e=>setForm({...form, age: e.target.value})} placeholder="Age" className="w-full" />
        <textarea value={form.motivation} onChange={e=>setForm({...form, motivation: e.target.value})} placeholder="Motivation" className="w-full" />
        <input value={form.location} onChange={e=>setForm({...form, location: e.target.value})} placeholder="Location" className="w-full" />
        <button className="px-4 py-2 bg-blue-600 text-white">Apply</button>
      </form>
      {status === 'sent' && <p className="mt-2 text-green-600">Application sent.</p>}
      {status === 'error' && <p className="mt-2 text-red-600">Error sending application.</p>}
    </section>
  )
}
