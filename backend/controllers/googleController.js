const { google } = require('googleapis')
require('dotenv').config()

exports.getAuthUrl = (req, res) => {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const redirect = process.env.GOOGLE_OAUTH_REDIRECT_URI
  if (!clientId || !redirect) return res.status(400).json({ error: 'missing_config', message: 'Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_REDIRECT_URI in .env' })
  const oauth2Client = new google.auth.OAuth2(clientId, process.env.GOOGLE_OAUTH_CLIENT_SECRET, redirect)
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/spreadsheets']
  })
  return res.json({ url })
}

exports.handleCallback = async (req, res) => {
  const code = req.query.code
  if (!code) return res.status(400).send('Missing code param')
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
  const redirect = process.env.GOOGLE_OAUTH_REDIRECT_URI
  if (!clientId || !clientSecret || !redirect) return res.status(400).send('OAuth client not configured')
  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirect)
    const { tokens } = await oauth2Client.getToken(code)
    // Return tokens (including refresh_token) so user can paste into .env
    return res.json({ tokens })
  } catch (e) {
    console.error('OAuth callback error:', e)
    return res.status(500).json({ error: 'exchange_failed', message: e && e.message ? e.message : String(e) })
  }
}
