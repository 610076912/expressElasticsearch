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
          'terms': {
            'field': 'media_channel_id'
          },
          'aggs': {
            'mediaCount': {
              'terms': {
                'field': 'media_id'
              }
            },
            'platName': {
              top_hits: {
                '_source': 'platform_name',
                'size': 1
              }
            }
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
      data: [],
      msg: 'success'
    }
    data.aggregations.ptcount.buckets.forEach(function (item) {
      result.data.push({
        platform_id: item.key,
        ad_count: item.doc_count,
        media_count: item.mediaCount.buckets.length,
        platform_name: item.platName.hits.hits[0]._source.platform_name
      })
    })
    res.send(data)
  })
})
// test
module.exports = router
