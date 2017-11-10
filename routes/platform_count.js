var client = require('../elastic-config/config').client
var express = require('express')
var router = express.Router()

router.get('/', function (req, res) {
  client.search({
    index: 'ssp_ggw',
    type: 'log',
    body: {
      'size': 0,
      'aggs': {
        'ptcount': {
          'cardinality': {
            'field': 'media_channel_id'
          }
        },
        'mediaCount': {
          'cardinality': {
            'field': 'media_id'
          }
        }
      }
    }
  }, function (err, data) {
    if (err) {
      res.send('查询错误' + err)
      return
    }
    let result = {
      code: 200,
      data: {},
      msg: 'success'
    }
    // data.aggregations.ptcount.buckets.forEach(function (item) {
    result.data.platform_count = data.aggregations.ptcount.value
    result.data.media_count = data.aggregations.mediaCount.value
    res.send(result)
  })
})
module.exports = router
