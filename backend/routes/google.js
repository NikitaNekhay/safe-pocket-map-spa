const express = require('express')
const router = express.Router()
const { getAuthUrl, handleCallback } = require('../controllers/googleController')

router.get('/auth/url', getAuthUrl)
router.get('/auth/callback', handleCallback)

module.exports = router
