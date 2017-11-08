const express = require('express')
const client = require('../elastic-config/config').client

const router = express.Router()

router.get('/', function (req, res) {
  client.search({
    index: 'ssp_ggw',
    type: 'log',
    body: {
      size: 0,
      aggs: {
        'allAdlIST': {
          terms: {
            field: 'media_episode_id'
          },
          aggs: {
            'mediaCount': {
              terms: {
                field: 'media_channel_id'
              }
            }
          }
        },
        'platForm': {
          terms: {
            field: 'media_channel_id'
          }
        }
      }
    }
  }, function (err, data) {
    if (err) {
      res.send('查询失败' + err)
      return
    }
    res.send(data)
  })
})

module.exports = router
