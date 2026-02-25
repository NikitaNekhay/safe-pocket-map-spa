import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ChatPrompt() {
  const [prompt, setPrompt] = useState('')
  const navigate = useNavigate()

  const go = (e) => {
    e.preventDefault()
    if (!prompt.trim()) return
    // send user to chat page with prompt as query param
    const encoded = encodeURIComponent(prompt.trim())
    navigate(`/chat?prompt=${encoded}`)
  }

  return (
    <form onSubmit={go} className="mt-8 flex justify-center">
      <input value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Ask the assistant about SPM..." className="w-full max-w-xl p-3 border rounded-l-md" />
      <button className="px-4 bg-blue-600 text-white rounded-r-md">Open Chat</button>
    </form>
  )
}
