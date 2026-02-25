import React, { useEffect, useState, useRef } from 'react'
import axios from '../services/api'
import { useSearchParams } from 'react-router-dom'

export default function Chat() {
  const [searchParams] = useSearchParams()
  const initial = searchParams.get('prompt') || ''
  const [messages, setMessages] = useState(initial ? [{ role: 'user', text: initial }] : [])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streaming, setStreaming] = useState(false)
  const esRef = useRef(null)

  useEffect(()=>{
    if (initial) {
      startStream(initial)
    }
    return () => { if (esRef.current) esRef.current.close() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function pushMessage(msg) {
    setMessages(prev => prev.concat(msg))
  }

  function startStream(prompt) {
    // open SSE connection to server stream
    if (esRef.current) esRef.current.close()
    const url = `/api/ai/stream?prompt=${encodeURIComponent(prompt)}`
    const es = new EventSource(url)
    esRef.current = es
    setStreaming(true)

    let buffer = ''
    es.onmessage = (ev) => {
      // SSE data contains escaped \n sequences, restore
      const data = ev.data.replace(/\\n/g, '\n')
      buffer += data
      // update assistant last message (streaming)
      setMessages(prev => {
        const copy = prev.slice()
        // if last is assistant streaming, replace; else push
        if (copy.length && copy[copy.length-1].role === 'assistant' && copy[copy.length-1].streaming) {
          copy[copy.length-1].text = buffer
        } else {
          copy.push({ role: 'assistant', text: buffer, streaming: true })
        }
        return copy
      })
    }

    es.addEventListener('done', () => {
      // finalize streaming message
      setMessages(prev => prev.map(m => m.streaming ? { role: m.role, text: m.text } : m))
      setStreaming(false)
      if (esRef.current) esRef.current.close()
      esRef.current = null
    })

    es.addEventListener('error', (e) => {
      pushMessage({ role: 'assistant', text: 'Error during streaming.' })
      setStreaming(false)
      try { es.close() } catch(_){}
      esRef.current = null
    })
  }

  async function submit(e) {
    e.preventDefault()
    if (!input.trim()) return
    const text = input.trim()
    pushMessage({ role: 'user', text })
    setInput('')
    startStream(text)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold">Chat Assistant</h2>

      <div className="mt-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role==='user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block p-3 rounded ${m.role==='user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-900'}`}>
              {m.text}
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={submit} className="mt-6 flex gap-2 items-center">
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Send a message..." className="flex-1 p-3 border rounded-md" />
        <button className="px-4 bg-blue-600 text-white rounded-md" disabled={streaming}>{streaming ? 'Streaming...' : 'Send'}</button>
        {streaming && (
          <div className="ml-3 animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" aria-hidden="true"></div>
        )}
      </form>
    </div>
  )
}
