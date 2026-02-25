const express = require('express')
const router = express.Router()
const { chat, streamChat } = require('../controllers/aiController')

router.post('/chat', chat)
router.get('/stream', streamChat)

module.exports = router
