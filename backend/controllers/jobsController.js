const { appendToSheet } = require('../services/googleSheetsService')

function validate(body) {
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) return 'Name required'
  if (!body.email || typeof body.email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(body.email)) return 'Valid email required'
  if (body.phone && typeof body.phone !== 'string') return 'Phone must be a string'
  if (body.age && isNaN(Number(body.age))) return 'Age must be a number'
  return null
}

exports.apply = async (req, res) => {
  console.log('[jobs.apply] received request at', new Date().toISOString())
  console.log('[jobs.apply] payload:', JSON.stringify(req.body))
  const err = validate(req.body)
  if (err) return res.status(400).json({ success: false, error: 'validation', message: err })

  try {
    // Append to Google Sheets (stubbed if env not provided)
    // Order: name, email, phone, cv, age, motivation, location
    const { appendAndVerify } = require('../services/googleSheetsService')
    const ok = await appendAndVerify([
      req.body.name || '',
      req.body.email || '',
      req.body.phone || '',
      req.body.cv || '',
      req.body.age || '',
      req.body.motivation || '',
      req.body.location || ''
    ])
    console.log('[jobs.apply] appendAndVerify result:', ok)
    if (!ok) return res.status(500).json({ success: false, error: 'verification_failed', message: 'Could not verify row in Google Sheet' })
    return res.json({ success: true })
  } catch (e) {
    console.error('jobs.apply error:', e && e.stack ? e.stack : e)
    return res.status(500).json({ error: 'internal', message: e && e.message ? e.message : String(e) })
  }
}
