const { sendPrompt, streamPrompt } = require('../services/claudeService')

function badRequest(res, message) {
  return res.status(400).json({ success: false, error: 'bad_request', message })
}

exports.chat = async (req, res) => {
  try {
    const prompt = (req.body && req.body.prompt) || req.query.prompt || ''
    if (!prompt) return badRequest(res, 'prompt required')

    const result = await sendPrompt({ prompt, messages: req.body.messages || [] })
    return res.json({ success: true, response: result })
  } catch (e) {
    console.error('AI chat error', e)
    return res.status(500).json({ success: false, error: 'ai_error', detail: e.message })
  }
}

// SSE stream endpoint: GET /api/ai/stream?prompt=...
exports.streamChat = async (req, res) => {
  try {
    const prompt = req.query.prompt || ''
    if (!prompt) return badRequest(res, 'prompt required')

    // set headers for SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive'
    })
    // structured SSE framing: start -> progress* -> done | error
    // Provide `retry` hint, per-event `id`, heartbeat comments, and client-close handling.
    const streamId = Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36)
    let seq = 0
    let closed = false

    // send SSE retry hint and disable proxy buffering
    try { res.write('retry: 3000\n') } catch (_) {}
    res.setHeader('X-Accel-Buffering', 'no')

    // send heartbeat comments every 15s to keep connection alive through proxies
    const heartbeat = setInterval(() => {
      try {
        if (closed) return
        res.write(': heartbeat\n\n')
        if (typeof res.flush === 'function') try { res.flush() } catch (_) {}
      } catch (_) {}
    }, 15000)

    // handle client disconnect
    req.on('close', () => {
      closed = true
      clearInterval(heartbeat)
    })

    // helper to send an event with JSON payload and per-event id
    function sendEvent(event, obj) {
      if (closed) return
      seq += 1
      const payload = JSON.stringify(Object.assign({ streamId, seq }, obj || {}))
      try {
        res.write(`id: ${seq}\n`)
        res.write(`event: ${event}\n`)
        res.write(`data: ${payload}\n\n`)
        if (typeof res.flush === 'function') try { res.flush() } catch (_) {}
      } catch (e) {
        // swallow write errors
      }
    }

    // announce stream start and an initial progress
    sendEvent('start', { prompt })
    sendEvent('progress', { text: 'Initializing AI stream...' })

    // safety idle timer: if no progress within `idleMs` ms, send offline fallback and close
    const idleMs = Number(process.env.STREAM_IDLE_MS || 8000)
    let idleTimer = setTimeout(() => {
      if (closed) return
      sendEvent('progress', { text: 'AI stream unavailable — using offline fallback.' })
      sendEvent('done', {})
      closed = true
      clearInterval(heartbeat)
      try { res.end() } catch(_) {}
    }, idleMs)
    function resetIdle() { try { clearTimeout(idleTimer) } catch(_){}; idleTimer = setTimeout(() => { if (closed) return; sendEvent('progress', { text: 'AI stream unavailable — using offline fallback.' }); sendEvent('done', {}); closed = true; clearInterval(heartbeat); try { res.end() } catch(_){ } }, idleMs) }

    const onChunk = (chunk) => {
      resetIdle()
      sendEvent('progress', { text: String(chunk) })
    }

    const onDone = () => {
      try { clearTimeout(idleTimer) } catch(_){ }
      clearInterval(heartbeat)
      sendEvent('done', {})
      closed = true
      try { res.end() } catch (_) {}
    }

    const onError = (err) => {
      try { clearTimeout(idleTimer) } catch(_){ }
      clearInterval(heartbeat)
      sendEvent('error', { code: 'ai_error', message: err && err.message ? err.message : String(err) })
      closed = true
      try { res.end() } catch (_) {}
    }

    // streamPrompt will call onChunk for partial content
    await streamPrompt({ prompt, onChunk, onDone, onError })
  } catch (e) {
    console.error('AI stream error', e)
    try { res.status(500).json({ success: false, error: 'ai_error', detail: e.message }) } catch(_){}
  }
}
