var client = require('../elastic-config/config').client
var express = require('express')
var router = express.Router()
var dateFormat = require('dateformat')

router.get('/', function (req, res) {
  const currentDate = new Date().getTime()
  let randomStartDate = currentDate - Math.round(2 * 24 * 60 * 60 * 1000 * Math.random())
  client.search({
    index: 'sltlog_bf_request_log-*',
    body: {
      'size': 0,
      '_source': {
        'excludes': []
      },
      'aggs': {
        '2': {
          'date_range': {
            'field': 'request_time',
            'ranges': [
              {
                'from': randomStartDate,
                'to': 'now'
              }
            ]
          }
        }
      }
    }
  }).then(result => {
    let date = dateFormat(randomStartDate, 'yyyy-mm-dd HH:MM:ss')
    res.send({result, date})
  }).catch(err => {
    console.log(err)
  })
})

module.exports = router
