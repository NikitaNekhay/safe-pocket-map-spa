const express = require('express')
const router = express.Router()
const { apply } = require('../controllers/jobsController')

router.post('/apply', apply)

module.exports = router
