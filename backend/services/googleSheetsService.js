const { google } = require('googleapis')
const fs = require('fs')
const path = require('path')

const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
const GOOGLE_PRIVATE_KEY_B64 = process.env.GOOGLE_PRIVATE_KEY_B64
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'SPM_Jobs_Applications'
const GOOGLE_SERVICE_ACCOUNT_FILE = process.env.GOOGLE_SERVICE_ACCOUNT_FILE
const GOOGLE_APPS_SCRIPT_URL = process.env.GOOGLE_APPS_SCRIPT_URL
const GOOGLE_OAUTH_CLIENT_ID = process.env.GOOGLE_OAUTH_CLIENT_ID
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_SECRET
const GOOGLE_OAUTH_REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI
const GOOGLE_OAUTH_REFRESH_TOKEN = process.env.GOOGLE_OAUTH_REFRESH_TOKEN

function loadServiceAccountFromFile() {
  try {
    if (!GOOGLE_SERVICE_ACCOUNT_FILE) return null
    const p = path.resolve(__dirname, '..', GOOGLE_SERVICE_ACCOUNT_FILE)
    if (!fs.existsSync(p)) return null
    const raw = fs.readFileSync(p, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed
  } catch (e) {
    console.error('Failed to load service account file:', e)
    return null
  }
}

function getPrivateKey() {
  // 1. If a service account JSON file is provided, use its private_key
  const fileObj = loadServiceAccountFromFile()
  if (fileObj && fileObj.private_key) return fileObj.private_key

  // 2. If GOOGLE_PRIVATE_KEY_B64 provided and it's a base64-encoded JSON, decode and read private_key
  if (GOOGLE_PRIVATE_KEY_B64) {
    try {
      const decoded = Buffer.from(GOOGLE_PRIVATE_KEY_B64, 'base64').toString('utf8')
      try {
        const parsed = JSON.parse(decoded)
        if (parsed.private_key) return parsed.private_key
      } catch (e) {
        // Not JSON — assume decoded is the PEM key
        return decoded
      }
    } catch (e) {
      console.error('Failed to decode GOOGLE_PRIVATE_KEY_B64:', e)
    }
  }

  // 3. Fallback to GOOGLE_PRIVATE_KEY env (support escaped newlines)
  if (GOOGLE_PRIVATE_KEY) {
    return GOOGLE_PRIVATE_KEY.includes('\\n') ? GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : GOOGLE_PRIVATE_KEY
  }

  return null
}

async function appendToSheet(values) {
  // In test mode, short-circuit and return success so tests don't require Google
  if (process.env.NODE_ENV === 'test' || process.env.FORCE_GOOGLE_MOCK === 'true') {
    console.log('appendToSheet: running in test/mock mode, skipping actual Google append')
    return true
  }

  // Preferred approach: post to a Google Apps Script webapp that writes to the sheet.
  if (GOOGLE_APPS_SCRIPT_URL) {
    console.log('appendToSheet: using Google Apps Script endpoint', GOOGLE_APPS_SCRIPT_URL)
    try {
      const resp = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values })
      })
      const text = await resp.text()
      console.log('appendToSheet: apps script response status', resp.status, 'body:', text)
      if (!resp.ok) throw new Error('Apps Script responded ' + resp.status)
      return true
    } catch (e) {
      console.error('appendToSheet: Apps Script append failed:', e && e.message ? e.message : e)
      throw e
    }
  }

  // Fallback: try service account JWT (kept for compatibility). This may fail on
  // hosts with OpenSSL provider limitations.
  // If OAuth2 credentials + refresh token are provided, prefer OAuth2 flow.
  if (GOOGLE_OAUTH_CLIENT_ID && GOOGLE_OAUTH_CLIENT_SECRET && GOOGLE_OAUTH_REFRESH_TOKEN) {
    console.log('appendToSheet: using OAuth2 with refresh token')
    let oAuth2Client
    try {
      oAuth2Client = new google.auth.OAuth2(GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI)
      oAuth2Client.setCredentials({ refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN })
      const sheets = google.sheets({ version: 'v4', auth: oAuth2Client })
      const range = `${SHEET_NAME}!A:G`
      const resource = { values: [values] }
      await sheets.spreadsheets.values.append({
        spreadsheetId: GOOGLE_SHEET_ID,
        range,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource
      })
      return true
    } catch (e) {
      const msg = e && e.message ? e.message : String(e)
      console.error('Google Sheets append failed (OAuth2):', msg)
      // If the range couldn't be parsed (sheet name might not exist), retry without sheet name
      if (msg.includes('Unable to parse range')) {
        try {
          console.log('Retrying append with generic range A:G')
          const sheets2 = google.sheets({ version: 'v4', auth: oAuth2Client })
          await sheets2.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: 'A:G',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [values] }
          })
          return true
        } catch (e2) {
          console.error('Retry append failed:', e2 && e2.message ? e2.message : e2)
          throw e2
        }
      }
      throw e
    }
  }
  const fileCreds = loadServiceAccountFromFile()
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || (fileCreds && fileCreds.client_email)
  if (!clientEmail || !GOOGLE_SHEET_ID) {
    throw new Error('Google Sheets not configured: missing client email or sheet id')
  }

  const privateKey = getPrivateKey()
  if (!privateKey) {
    throw new Error('Google private key not set')
  }

  const jwtClient = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  })

  const range = `${SHEET_NAME}!A:G`
  const resource = { values: [values] }

  try {
    await jwtClient.authorize()
    const sheets = google.sheets({ version: 'v4', auth: jwtClient })
    await sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_SHEET_ID,
      range,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource
    })
    return true
  } catch (e) {
    console.error('Google Sheets append failed (JWT):', e && e.message ? e.message : e)
    throw e
  }
}

async function appendAndVerify(values) {
  // append values and verify by a unique sentinel appended in column H
  const sentinel = `${Date.now()}-${Math.random().toString(36).slice(2,8)}`
  const row = values.concat(sentinel)

  // Use same append logic but ensure we include sentinel
  // Try Apps Script first
  if (process.env.NODE_ENV === 'test' || process.env.FORCE_GOOGLE_MOCK === 'true') {
    console.log('appendAndVerify: test/mock mode, skipping actual Google append and assuming success')
    return true
  }

  if (GOOGLE_APPS_SCRIPT_URL) {
    console.log('appendAndVerify: posting to Apps Script endpoint for append')
    const resp = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: row })
    })
    if (!resp.ok) throw new Error('Apps Script append failed')
    // fall through to verification using Sheets API if possible
  }

  // Prefer OAuth2 for verification if available
  if (GOOGLE_OAUTH_CLIENT_ID && GOOGLE_OAUTH_CLIENT_SECRET && GOOGLE_OAUTH_REFRESH_TOKEN) {
    const oAuth2Client = new google.auth.OAuth2(GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET, GOOGLE_OAUTH_REDIRECT_URI)
    oAuth2Client.setCredentials({ refresh_token: GOOGLE_OAUTH_REFRESH_TOKEN })
    const sheets = google.sheets({ version: 'v4', auth: oAuth2Client })
    // append and verify with fallback ranges if sheet name parsing fails
    try {
      await sheets.spreadsheets.values.append({
        spreadsheetId: GOOGLE_SHEET_ID,
        range: `${SHEET_NAME}!A:H`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: { values: [row] }
      })
      const getRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: `${SHEET_NAME}!A:H` })
      const vals = (getRes.data && getRes.data.values) || []
      for (const r of vals) {
        if (r[r.length-1] === sentinel) return true
      }
      return false
    } catch (e) {
      const msg = e && e.message ? e.message : String(e)
      console.error('appendAndVerify OAuth2 attempt failed:', msg)
      if (msg.includes('Unable to parse range')) {
        // retry append using wider append range A:G (some sheets reject sheet-name ranges)
        try {
          console.log('appendAndVerify: retrying append with generic range A:G')
          await sheets.spreadsheets.values.append({
            spreadsheetId: GOOGLE_SHEET_ID,
            range: 'A:G',
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            resource: { values: [row] }
          })

          // try reading back with A:H to find sentinel; if that fails, fall back to A:G
          try {
            const getRes2 = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'A:H' })
            const vals2 = (getRes2.data && getRes2.data.values) || []
            for (const r of vals2) if (r[r.length-1] === sentinel) return true
            return false
          } catch (e3) {
            console.log('appendAndVerify: A:H get failed, trying A:G get', e3 && e3.message)
            const getRes3 = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: 'A:G' })
            const vals3 = (getRes3.data && getRes3.data.values) || []
            for (const r of vals3) {
              if (r[r.length-1] === sentinel) return true
              // also check across the row for the sentinel anywhere
              if (r.includes(sentinel)) return true
            }
            return false
          }
        } catch (e2) {
          console.error('appendAndVerify OAuth2 retry failed:', e2 && e2.message ? e2.message : e2)
          throw e2
        }
      }
      throw e
    }
  }

  // Fallback to JWT if available
  const fileCreds = loadServiceAccountFromFile()
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL || (fileCreds && fileCreds.client_email)
  if (!clientEmail || !GOOGLE_SHEET_ID) throw new Error('Google Sheets not configured: missing client email or sheet id')
  const privateKey = getPrivateKey()
  if (!privateKey) throw new Error('Google private key not set')

  const jwtClient = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  })
  await jwtClient.authorize()
  const sheets = google.sheets({ version: 'v4', auth: jwtClient })
  await sheets.spreadsheets.values.append({
    spreadsheetId: GOOGLE_SHEET_ID,
    range: `${SHEET_NAME}!A:H`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: [row] }
  })
  const getRes = await sheets.spreadsheets.values.get({ spreadsheetId: GOOGLE_SHEET_ID, range: `${SHEET_NAME}!A:H` })
  const vals = (getRes.data && getRes.data.values) || []
  for (const r of vals) {
    if (r[r.length-1] === sentinel) return true
  }
  return false
}

module.exports = { appendToSheet, appendAndVerify }
