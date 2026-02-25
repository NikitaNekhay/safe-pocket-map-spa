require('dotenv').config({ path: require('path').resolve(__dirname, '.env') })
const fetch = globalThis.fetch || require('node-fetch')

const key = process.env.CLAUDE_API_KEY
const model = process.env.CLAUDE_MODEL || 'claude-4.6'
const base = (process.env.CLAUDE_API_URL || 'https://api.anthropic.com').replace(/\/$/, '')

async function tryResponses() {
  const url = `${base}/v1/responses`
  const body = { model, input: 'test ping' }
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key }, body: JSON.stringify(body) })
    const text = await res.text()
    console.log('RESPONSES', res.status, text)
  } catch (e) {
    console.error('RESPONSES ERR', e)
  }
}

async function tryComplete() {
  const url = `${base}/v1/complete`
  const body = { model, prompt: 'test ping' }
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': key }, body: JSON.stringify(body) })
    const text = await res.text()
    console.log('COMPLETE', res.status, text)
  } catch (e) {
    console.error('COMPLETE ERR', e)
  }
}

;(async () => {
  console.log('Testing Anthropic endpoints with', base)
  await tryResponses()
  await tryComplete()
})()
