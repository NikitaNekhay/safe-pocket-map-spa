require('dotenv').config({ path: require('path').resolve(__dirname, '.env') })
const { appendToSheet } = require('./services/googleSheetsService')

;(async () => {
  try {
    await appendToSheet(['Test name','test@example.com','+100','http://cv','30','motivation','remote'])
    console.log('appendToSheet completed')
  } catch (e) {
    console.error('appendToSheet error:', e)
    if (e && e.stack) console.error(e.stack)
  }
})()
