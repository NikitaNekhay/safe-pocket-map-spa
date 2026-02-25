require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')

const jobsRouter = require('./routes/jobs')
const aiRouter = require('./routes/ai')
const googleRouter = require('./routes/google')

const app = express()
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use(bodyParser.json())

app.use('/api/jobs', jobsRouter)
app.use('/api/ai', aiRouter)
app.use('/api/google', googleRouter)

const port = process.env.PORT || 3000

if (require.main === module) {
	app.listen(port, () => console.log(`Backend listening on ${port}`))
}

module.exports = app
