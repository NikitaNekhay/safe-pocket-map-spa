require('dotenv').config({ path: require('path').resolve(__dirname, '.env') })
const fetch = globalThis.fetch || require('node-fetch')

async function run() {
  const url = 'http://localhost:3000/api/ai/stream?prompt=Hello%20stream%20test'
  console.log('Requesting', url)
  const res = await fetch(url)
  console.log('Status', res.status)
  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      process.stdout.write('[BACKEND CHUNK] ' + chunk)
    }
    console.log('\n[BACKEND STREAM END]')
  } catch (e) {
    console.error('Error reading backend stream:', e)
  }
}

run().catch(e => { console.error(e); process.exit(1) })
