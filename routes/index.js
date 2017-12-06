var client = require('../elastic-config/config').client
var express = require('express')
var router = express.Router()
const tools = require('../components/creat-dayarr')
var dateFormat = require('dateformat')

router.get('/', function (req, res) {
  const platFormId = req.query.platform_id
  let timeRange = null
  if (req.query.time_range) {
    timeRange = JSON.parse(req.query.time_range)
  }
  if (!platFormId) {
    res.send({code: 400, data: '', msg: 'platform_id字段错误'})
    return
  }
  if (timeRange && timeRange.length !== 2) {
    res.send({code: 400, data: '', msg: 'time_range 必须为包含两位时间对象的数组。'})
    return
  }
  if (!timeRange) {
    timeRange = ['now-1w/w', 'now']
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
                    {'range': {'request_time': {'from': timeRange[0], 'to': timeRange[1]}}}
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
                    {'range': {'request_time': {'from': timeRange[0], 'to': timeRange[1]}}}
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
                    {'range': {'request_time': {'from': timeRange[0], 'to': timeRange[1]}}}
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
    // res.send(data)
    let bgCount = data[0].aggregations.bgCount.buckets.length !== 0 ? data[0].aggregations.bgCount.buckets[0].doc_count : 0
    let playCount = data[1].aggregations.playCount.buckets.length !== 0 ? data[1].aggregations.playCount.buckets[0].doc_count : 0
    let clickCount = data[2].aggregations.clickCount.buckets.length !== 0 ? data[2].aggregations.clickCount.buckets[0].doc_count : 0
    let resData = {
      code: 200,
      data: {
        bgCount,
        playCount,
        clickCount,
        pjbg: bgCount === 0 ? 0 : bgCount / playCount,
        pjclick: clickCount === 0 ? 0 : clickCount / bgCount
      },
      msg: 'success'
    }
    res.send(resData)
  }).catch(err => {
    // console.log(err)
    res.send(err)
  })
})

// 折线图
router.get('/chart', function (req, res) {
  const platFormId = req.query.platform_id
  let timeRange = null
  if (req.query.time_range) {
    timeRange = JSON.parse(req.query.time_range)
  } else {
    // 默认最近一周
    let end = new Date().getTime()
    let start = new Date().setHours(0, 0, 0, 0)
    start = new Date().setTime(start - 3600 * 1000 * 24 * 6)
    timeRange = [start, end]
  }
  let dayArr = tools.creatDateArr(timeRange)
  // let timeRange = JSON.parse(req.query.time_range)
  // (req.query.time_range)
  // console.log(platFormId)
  if (!platFormId) {
    res.send({code: 400, data: '', msg: 'platform_id字段错误'})
    return
  }
  if (timeRange && timeRange.length !== 2) {
    res.send({code: 400, data: '', msg: 'time_range 必须为包含两位时间对象的数组。'})
    return
  }
  Promise.all([
    client.search({
      index: 'sltlog_adseat_request_log*',
      body: {
        'size': 0,
        '_source': {
          'excludes': []
        },
        'query': {
          'bool': {
            'must': [
              {
                'match_all': {}
              },
              {
                'match_phrase': {
                  'media_channel_id': {
                    'query': platFormId
                  }
                }
              },
              {
                'range': {
                  'request_time': {
                    'from': timeRange[0],
                    'to': timeRange[1]
                  }
                }
              }
            ]
          }
        },
        'aggs': {
          'aggsArr': {
            'date_histogram': {
              'field': 'request_time',
              'interval': '1d',
              'min_doc_count': 1
            }
          }
        }
      }
    }),
    client.search({
      index: 'sltlog_ad_bg_log*',
      body: {
        'size': 0,
        '_source': {
          'excludes': []
        },
        'query': {
          'bool': {
            'must': [
              {
                'match_all': {}
              },
              {
                'match_phrase': {
                  'media_channel_id': {
                    'query': platFormId
                  }
                }
              },
              {
                'range': {
                  'request_time': {
                    'from': timeRange[0],
                    'to': timeRange[1]
                  }
                }
              }
            ]
          }
        },
        'aggs': {
          'aggsArr': {
            'date_histogram': {
              'field': 'request_time',
              'interval': '1d',
              'min_doc_count': 1
            }
          }
        }
      }
    }),
    client.search({
      index: 'sltlog_ad_click_log*',
      body: {
        'size': 0,
        '_source': {
          'excludes': []
        },
        'query': {
          'bool': {
            'must': [
              {
                'match_all': {}
              },
              {
                'match_phrase': {
                  'media_channel_id': {
                    'query': platFormId
                  }
                }
              },
              {
                'range': {
                  'request_time': {
                    'from': timeRange[0],
                    'to': timeRange[1]
                  }
                }
              }
            ]
          }
        },
        'aggs': {
          'aggsArr': {
            'date_histogram': {
              'field': 'request_time',
              'interval': '1d',
              'min_doc_count': 1
            }
          }
        }
      }
    })
  ]).then(data => {
    data[0].aggregations.aggsArr.buckets.forEach(item => {
      item.play_count = item.doc_count ? item.doc_count : 0
      item.day_time = dateFormat(item.key_as_string, 'isoDate')
      data[1].aggregations.aggsArr.buckets.forEach(pItem => {
        if (item.key === pItem.key) {
          item.bg_count = pItem.doc_count ? pItem.doc_count : 0
          // item.play_count = item.doc_count ? item.doc_count : 0
          // item.day_time = item.key_as_string
          item.pjbg = item.bg_count === 0 ? 0 : item.bg_count / item.play_count
        }
      })
      data[2].aggregations.aggsArr.buckets.forEach(cItem => {
        if (item.key === cItem.key) {
          item.click_count = cItem.doc_count ? cItem.doc_count : 0
          item.pjclick = item.click_count === 0 ? 0 : item.click_count / item.bg_count
        }
      })
      delete item.key
      delete item.key_as_string
      delete item.doc_count
    })
    dayArr.forEach(day => {
      data[0].aggregations.aggsArr.buckets.forEach(ir => {
        if (day.day_time === ir.day_time) {
          day.play_count = ir.play_count ? ir.play_count : 0
          day.bg_count = ir.bg_count ? ir.bg_count : 0
          day.pjbg = ir.pjbg ? ir.pjbg : 0
          day.click_count = ir.click_count ? ir.click_count : 0
          day.pjclick = ir.pjclick ? ir.pjclick : 0
        }
      })
    })
    const resArr = {code: 200, data: dayArr, msg: 'success'}
    res.send(resArr)
  }).catch(err => {
    const resArr = {code: 300, data: err, msg: 'error'}
    res.send(resArr)
  })
})

module.exports = router
