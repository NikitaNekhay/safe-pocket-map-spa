const CLAUDE_API_URL = (process.env.CLAUDE_API_URL || 'https://api.anthropic.com').replace(/\/$/, '')
const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_API_URL = (process.env.OPENAI_API_URL || 'https://api.openai.com').replace(/\/$/, '')

function makeAnthropicBody(prompt) {
  // Use Anthropic Responses API shape
  return {
    model: process.env.CLAUDE_MODEL || 'claude-2.1',
    input: prompt,
    max_tokens_to_sample: 1000,
    temperature: 0.2
  }
}

async function sendPrompt({ prompt, messages = [] }) {
  if (!CLAUDE_API_KEY) {
    console.log('CLAUDE API not configured, returning mock response for prompt:', prompt)
    return { text: `Mock reply: received prompt -> ${prompt}` }
  }
  try {
    const body = makeAnthropicBody(prompt)
  const url = `${CLAUDE_API_URL}/v1/responses`

  // Try a couple of header styles: Authorization Bearer, then x-api-key only.
  const headerVariants = [
    { Authorization: `Bearer ${CLAUDE_API_KEY}` },
    { 'x-api-key': CLAUDE_API_KEY }
  ]

  let res = null
  let lastErr = null
  for (const hdrs of headerVariants) {
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' }, hdrs),
        body: JSON.stringify(body)
      })
    } catch (e) {
      lastErr = e
      continue
    }
    if (res && res.ok) break
    // if 404 try next header variant; else capture body and throw after trying variants
    const txt = await res.text().catch(() => null)
    lastErr = new Error(`Upstream response ${res.status} ${txt}`)
    if (res.status === 404) continue
    break
  }
  if (!res || !res.ok) {
    // final attempt: legacy /v1/complete
    try {
      const legacyUrl = `${CLAUDE_API_URL}/v1/complete`
      const legacyBody = { model: body.model, prompt: prompt, max_tokens: 1000, temperature: body.temperature }
      const r2 = await fetch(legacyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY },
        body: JSON.stringify(legacyBody)
      })
      if (!r2.ok) {
        const t2 = await r2.text().catch(() => null)
        throw new Error(`Upstream legacy response ${r2.status} ${t2}`)
      }
      const data2 = await r2.json().catch(async () => ({ text: await r2.text() }))
      if (data2 && data2.completion) return { text: data2.completion }
      if (data2 && data2.text) return { text: data2.text }
      return { text: JSON.stringify(data2) }
    } catch (e2) {
      throw lastErr || e2
    }
  }

    const data = await res.json().catch(async () => {
    const t = await res.text()
    return { text: t }
  })

  // Response normalization: modern Anthropic returns `output[0].content[0].text` or `output_text`
  if (data.output && Array.isArray(data.output) && data.output.length > 0) {
    // attempt to find text content
    const first = data.output[0]
    if (first.content && Array.isArray(first.content)) {
      const textParts = first.content.filter(c => c.type === 'output_text').map(c => c.text)
      if (textParts.length) return { text: textParts.join('\n') }
    }
  }
  if (data.output_text) return { text: data.output_text }
  if (data.completion) return { text: data.completion }
  if (data.text) return { text: data.text }
  return { text: JSON.stringify(data) }
  } catch (e) {
    const msg = String(e && e.message)
    if (/credit|balance|insufficient/i.test(msg) || process.env.FORCE_CLAUDE_MOCK === 'true') {
      console.warn('Anthropic unavailable, returning mock response:', msg)
      return { text: `Anthropic unavailable (${msg}). Mock reply for: ${prompt}` }
    }
    throw e
  }
}

// Stream prompt from upstream and call hooks for chunks
async function streamPrompt({ prompt, onChunk, onDone, onError }) {
  if (!CLAUDE_API_KEY) {
    const mock = `Mock streaming reply for: ${prompt}`
    for (let i = 0; i < mock.length; i += 40) {
      await new Promise(r => setTimeout(r, 50))
      onChunk(mock.slice(i, i+40))
    }
    onDone()
    return
  }

  // Use Responses API with stream=true which returns an event stream
  const url = `${CLAUDE_API_URL}/v1/responses`
  const body = Object.assign(makeAnthropicBody(prompt), { stream: true })

  // helper: fetch with timeout and AbortController
  async function fetchWithTimeout(url, options = {}, timeout = 15000) {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeout)
    try {
      const res = await fetch(url, Object.assign({}, options, { signal: controller.signal }))
      return res
    } finally {
      clearTimeout(id)
    }
  }

  // Try a couple of times to fetch the stream; on network errors we'll fallback
  let res
  try {
    res = await fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE_API_KEY,
        'Authorization': `Bearer ${CLAUDE_API_KEY}`
      },
      body: JSON.stringify(body)
    }, 15000)
  } catch (e) {
    // network/connectivity/timeout error — surface for logs then handle below
    const msg = String(e && e.message)
    // treat as upstream failure so fallback to mock when appropriate
    if (/timeout|headers timeout|headerstimeout|ConnectTimeout|UND_ERR_CONNECT_TIMEOUT|UND_ERR_HEADERS_TIMEOUT|HeadersTimeoutError|aborted/i.test(msg) || process.env.FORCE_CLAUDE_MOCK === 'true') {
      const fallback = `Anthropic network error (${msg}). Falling back to mock response.`
      for (let i = 0; i < fallback.length; i += 40) {
        await new Promise(r => setTimeout(r, 40))
        onChunk(fallback.slice(i, i+40))
      }
      onDone()
      return
    }
    throw e
  }

  // If upstream doesn't support Responses streaming (404) or doesn't return an
  // event-stream content-type, attempt legacy /v1/complete streaming fallback.
  if (!res.ok || !(res.headers.get('content-type') || '').includes('event-stream')) {
    const status = res.status
    const txt = await res.text().catch(() => null)
    if (status === 404) {
      // try legacy streaming
      try {
        const legacyUrl = `${CLAUDE_API_URL}/v1/complete?stream=true`
        const legacyBody = { model: body.model, prompt, max_tokens: 1000, temperature: body.temperature }
        const r2 = await fetchWithTimeout(legacyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': CLAUDE_API_KEY },
          body: JSON.stringify(legacyBody)
        }, 15000)
        if (!r2.ok) {
          const t2 = await r2.text().catch(() => null)
          console.warn('claudeService: legacy stream returned non-ok', r2.status, t2)
          // try OpenAI fallback before surfacing error
          if (OPENAI_API_KEY) {
            console.log('claudeService: attempting OpenAI fallback (legacy branch)')
            try { await tryOpenAIStream(prompt, { onChunk, onDone, onError }); return } catch (e) { console.warn('OpenAI fallback failed', e && e.message) }
          }
          console.warn('claudeService: calling onError for legacy stream failure')
          if (typeof onError === 'function') {
            onError(new Error(`Upstream legacy stream ${r2.status} ${t2}`))
            return
          }
          throw new Error(`Upstream legacy stream ${r2.status} ${t2}`)
        }
        // replace res with legacy stream response
        res = r2
      } catch (e) {
        console.warn('claudeService: error while attempting legacy stream', e && e.message)
        // try OpenAI fallback first
        if (OPENAI_API_KEY) {
          console.log('claudeService: attempting OpenAI fallback (legacy catch)')
          try { await tryOpenAIStream(prompt, { onChunk, onDone, onError }); return } catch (e2) { console.warn('OpenAI fallback failed', e2 && e2.message) }
        }
        console.warn('claudeService: calling onError for legacy overall failure')
        if (typeof onError === 'function') {
          onError(new Error(`Upstream response ${status} ${txt}; legacy attempt: ${e.message}`))
          return
        }
        throw new Error(`Upstream response ${status} ${txt}; legacy attempt: ${e.message}`)
      }
    } else {
      // try OpenAI fallback first
      console.warn('claudeService: Responses API non-ok', status, txt)
      if (OPENAI_API_KEY) {
        console.log('claudeService: attempting OpenAI fallback (responses non-ok)')
        try { await tryOpenAIStream(prompt, { onChunk, onDone, onError }); return } catch (e) { console.warn('OpenAI fallback failed', e && e.message) }
      }
      console.warn('claudeService: calling onError for responses failure')
      if (typeof onError === 'function') {
        onError(new Error(`Upstream response ${status} ${txt}`))
        return
      }
      throw new Error(`Upstream response ${status} ${txt}`)
    }
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')

  // Anthropic Responses API streams SSE-style `data: {...}` chunks separated by
  // blank lines. We'll accumulate text and split on double-newline boundaries,
  // parse JSON from `data: ` lines and extract text deltas when present.
  let buf = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })

      // split into events separated by double newline
      const parts = buf.split(/\r?\n\r?\n/)
      // keep last partial chunk in buffer
      buf = parts.pop() || ''

      for (const part of parts) {
        // each part may contain multiple lines; find lines starting with 'data:'
        const lines = part.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
        for (const line of lines) {
          if (!line.startsWith('data:')) continue
          const raw = line.replace(/^data:\s*/, '')
          if (!raw) continue
          if (raw === '[DONE]' || raw === '[done]') {
            // upstream finished
            onDone()
            return
          }

          let parsed = null
          try {
            parsed = JSON.parse(raw)
          } catch (e) {
            // not JSON, send raw chunk through
            onChunk(raw)
            continue
          }

          // Try several heuristics to extract text
          try {
            // Responses API: parsed.output[0].content -> array of objects
            if (parsed.output && Array.isArray(parsed.output) && parsed.output.length) {
              const first = parsed.output[0]
              if (first.content && Array.isArray(first.content)) {
                const texts = first.content.filter(c => c.type === 'output_text').map(c => c.text)
                if (texts.length) {
                  onChunk(texts.join('\n'))
                  continue
                }
              }
            }

            // Some streams have a `delta` or `event` field with nested content
            if (parsed.delta && parsed.delta.content && Array.isArray(parsed.delta.content)) {
              const texts = parsed.delta.content.filter(c => c.type === 'output_text').map(c => c.text)
              if (texts.length) { onChunk(texts.join('\n')); continue }
            }

            // older shapes
            if (parsed.output_text) { onChunk(parsed.output_text); continue }
            if (parsed.completion) { onChunk(parsed.completion); continue }
            if (parsed.text) { onChunk(parsed.text); continue }

            // fallback: send JSON string
            onChunk(JSON.stringify(parsed))
          } catch (e) {
            // if anything goes wrong extracting, forward raw
            onChunk(raw)
          }
        }
      }
    }

    // flush any leftover buffer (non-SSE servers may stream raw text)
    if (buf && buf.trim()) onChunk(buf)
    onDone()
  } catch (e) {
    // If upstream indicates billing/credit issues, fall back to a mock stream
    const msg = String(e && e.message)
    if (/credit|balance|insufficient/i.test(msg) || process.env.FORCE_CLAUDE_MOCK === 'true') {
      const fallback = `Anthropic unavailable (${msg}). Falling back to mock response.`
      for (let i = 0; i < fallback.length; i += 40) {
        await new Promise(r => setTimeout(r, 40))
        onChunk(fallback.slice(i, i+40))
      }
      onDone()
      return
    }
    // If OpenAI key present, try OpenAI streaming as a fallback
    if (OPENAI_API_KEY) {
      try {
        await tryOpenAIStream(prompt, { onChunk, onDone, onError })
        return
      } catch (e2) {
        // continue to call onError for the original error if OpenAI attempt fails
      }
    }
    onError(e)
  }
}

// Attempt OpenAI streaming (chat completions) as a fallback provider
async function tryOpenAIStream(prompt, { onChunk, onDone, onError }) {
  const url = `${OPENAI_API_URL}/v1/chat/completions`
  const body = { model: process.env.OPENAI_MODEL || 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], stream: true }
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_API_KEY}` }, body: JSON.stringify(body) })
  if (!res.ok) {
    const t = await res.text().catch(() => null)
    throw new Error(`OpenAI fallback failed ${res.status} ${t}`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buf = ''
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const parts = buf.split(/\r?\n\r?\n/)
      buf = parts.pop() || ''
      for (const part of parts) {
        const lines = part.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
        for (const line of lines) {
          if (line === 'data: [DONE]' || line === 'data: [done]') { onDone(); return }
          if (!line.startsWith('data:')) continue
          const raw = line.replace(/^data:\s*/, '')
          if (!raw) continue
          let parsed = null
          try { parsed = JSON.parse(raw) } catch (_) { onChunk(raw); continue }
          // OpenAI streaming chunk heuristics
          try {
            if (parsed.choices && parsed.choices.length) {
              const c = parsed.choices[0]
              // delta-based chat stream
              if (c.delta && typeof c.delta === 'object') {
                const text = c.delta.content || c.delta.message || c.delta.text
                if (text) { onChunk(text); continue }
              }
              // older style
              if (c.text) { onChunk(c.text); continue }
              if (c.delta && c.delta.role) continue
            }
          } catch (e) {
            onChunk(raw)
          }
        }
      }
    }
    if (buf && buf.trim()) onChunk(buf)
    onDone()
  } catch (e) {
    if (typeof onError === 'function') onError(e)
    else throw e
  }
}

module.exports = { sendPrompt, streamPrompt }
