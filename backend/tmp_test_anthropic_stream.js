require('dotenv').config({ path: require('path').resolve(__dirname, '.env') })
const fetch = globalThis.fetch || require('node-fetch')

const key = process.env.CLAUDE_API_KEY
const base = (process.env.CLAUDE_API_URL || 'https://api.anthropic.com').replace(/\/$/, '')

async function run() {
  const url = `${base}/v1/responses`
  const body = { model: process.env.CLAUDE_MODEL || 'claude-4.6', input: 'stream test', stream: true }
  console.log('Posting to', url)
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key }, body: JSON.stringify(body) })
  console.log('Status', res.status)
  if (!res.body) { console.log('No body in response'); return }
  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      process.stdout.write('[ANTHROPIC CHUNK] ' + chunk)
    }
    console.log('\n[ANTHROPIC STREAM END]')
  } catch (e) {
    console.error('Error reading anthropic stream:', e)
  }
}

run().catch(e => { console.error(e); process.exit(1) })
