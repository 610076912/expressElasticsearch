var client = require('../elastic-config/config').client
var express = require('express')
var router = express.Router()
const tools = require('../components/creat-dayarr')

router.get('/', function (req, res) {
  const timeRange = req.query.time_range
})

module.exports = router
