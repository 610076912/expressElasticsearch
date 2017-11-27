var client = require('../elastic-config/config').client
var express = require('express')
var router = express.Router()

router.get('/', function (req, res) {
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
                    'query': '1014'
                  }
                }
              },
              {
                'range': {
                  'request_time': {
                    'gte': 1511625600000,
                    'lte': 1512230399999,
                    'format': 'epoch_millis'
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
                    'query': '1014'
                  }
                }
              },
              {
                'range': {
                  'request_time': {
                    'gte': 1511625600000,
                    'lte': 1512230399999,
                    'format': 'epoch_millis'
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
                    'query': '1014'
                  }
                }
              },
              {
                'range': {
                  'request_time': {
                    'gte': 1511625600000,
                    'lte': 1512230399999,
                    'format': 'epoch_millis'
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
      data[1].aggregations.aggsArr.buckets.forEach(pItem => {
        if (item.key === pItem.key) {
          item.bg_count = pItem.doc_count
          item.play_count = item.doc_count
          item.day_time = item.key_as_string
          item.pjbg = item.bg_count / item.play_count
        }
      })
      data[2].aggregations.aggsArr.buckets.forEach(cItem => {
        if (item.key === cItem.key) {
          item.click_count = cItem.doc_count
          item.pjclick = item.click_count / item.bg_count
        }
      })
      delete item.key
      delete item.key_as_string
      delete item.doc_count
    })
    res.send(data[0])
  })
})

module.exports = router
