var client = require('../elastic-config/config').client
var express = require('express')
var router = express.Router()

router.get('/', function (req, res) {
  const platFormId = req.query.platform_id
  const timeRange = req.query.time_range
  console.log(platFormId)
  if (!platFormId) {
    res.send({code: 400, data: '', msg: 'platform_id字段错误'})
    return
  }
  let queryTimeRange = 'now-1w'
  switch (timeRange) {
    case 2:
      queryTimeRange = 'now-1M'
      break
    case 3:
      queryTimeRange = 'now-3M'
      break
    default:
      queryTimeRange = 'now-7d'
  }
  Promise.all(
    [
      // 第一个查询广告曝光量
      client.search({
        index: 'sltlog_ad_bg_log*',
        body: {
          'size': 0,
          'query': {
            'constant_score': {
              'filter': {
                'bool': {
                  'must': [
                    {'term': {'media_channel_id.keyword': platFormId}},
                    {'range': {'request_time': {'from': queryTimeRange, 'to': 'now'}}}
                  ]
                }
              }
            }
          },
          'aggs': {
            'bgCount': {
              'terms': {
                'field': 'media_channel_id.keyword'
              }
            }
          }
        }
      }),
      // 第二个查询视频播放次数
      client.search({
        index: 'sltlog_adseat_request_log*',
        body: {
          'size': 0,
          'query': {
            'constant_score': {
              'filter': {
                'bool': {
                  'must': [
                    {'term': {'media_channel_id.keyword': platFormId}},
                    {'range': {'request_time': {'from': queryTimeRange, 'to': 'now'}}}
                  ]
                }
              }
            }
          },
          'aggs': {
            'playCount': {
              'terms': {
                'field': 'media_channel_id.keyword'
              }
            }
          }
        }
      }),
      // 第三个查询点击量
      client.search({
        index: 'sltlog_ad_click_log*',
        body: {
          'size': 0,
          'query': {
            'constant_score': {
              'filter': {
                'bool': {
                  'must': [
                    {'term': {'media_channel_id.keyword': platFormId}},
                    {'range': {'request_time': {'from': queryTimeRange, 'to': 'now'}}}
                  ]
                }
              }
            }
          },
          'aggs': {
            'clickCount': {
              'terms': {
                'field': 'media_channel_id.keyword'
              }
            }
          }
        }
      })
    ]
  ).then(data => {
    // console.log(data)
    let bgCount = data[0].aggregations.bgCount.buckets[0].doc_count
    let playCount = data[1].aggregations.playCount.buckets[0].doc_count
    let clickCount = data[2].aggregations.clickCount.buckets[0].doc_count
    console.log(bgCount, playCount, clickCount)
    let resData = {
      code: 200,
      data: {
        bgCount,
        playCount,
        clickCount,
        pjbg: bgCount / playCount,
        pjclick: clickCount / bgCount
      },
      msg: 'success'
    }
    res.send(resData)
  }).catch(err => {
    console.log(err)
    res.send(err)
  })
})
// test
module.exports = router
