var client = require('../elastic-config/config').client
var express = require('express')
var router = express.Router()

router.get('/', function (req, res) {
  /*
  * @param platform_id 平台id
  * @param time_range 时间间隔
  * @param page_num 页数（默认为第一页）
  * */
  // 每页10条数据
  const pageCount = 10
  // 总条目数
  let total = 0
  let bgArr = []
  const platFormId = req.query.platform_id
  let pageNum = req.query.page_num * 1

  if (pageNum && typeof pageNum !== 'number') {
    res.send({code: 400, data: '', msg: 'page_num错误'})
  } else if (!pageNum) {
    pageNum = 1
  }

  let timeRange = null
  if (req.query.time_range) {
    timeRange = JSON.parse(req.query.time_range)
  }
  const mediaName = req.query.media_name
  if (!platFormId) {
    res.send({code: 400, data: '', msg: 'platform_id字段错误'})
    return
  }
  if (timeRange && timeRange.length !== 2) {
    console.log(timeRange)
    res.send({code: 400, data: '', msg: 'time_range 必须为包含两位时间对象的数组。'})
    return
  }
  if (!timeRange) {
    timeRange = ['now-1w/w', 'now']
  }
  client.search({
    index: 'sltlog_adseat_request_log-*',
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
        'mediaId': {
          'terms': {
            'field': 'video_id.keyword',
            'size': 10000
          }
        }
      }
    }
  }).then(data => {
    let videoIdArr = []
    let resArrName = []
    // res.send(data)
    bgArr = data.aggregations.mediaId.buckets.slice((pageNum - 1) * pageCount, (pageNum * pageCount))
    // res.send(bgArr)
    total = data.aggregations.mediaId.buckets.length
    bgArr.forEach(item => {
      videoIdArr.push(item.key)
    })
    // console.log(bgArr)
    // res.send(videoIdArr)
    Promise.all(
      [
        // 第一个根据videoId查mediaId和mediaName
        // 第二个查曝光量
        // 第三个查点击量
        client.search({
          index: 'sltlog_ssp_adseat',
          body: {
            'size': 0,
            '_source': ['media_name', 'media_id'],
            'query': {
              'constant_score': {
                'filter': {
                  'terms': {
                    'video_id.keyword': videoIdArr
                  }
                }
              }
            },
            'aggs': {
              'mediaInfo': {
                'terms': {
                  'field': 'video_id.keyword'
                },
                'aggs': {
                  'mediaName': {
                    'top_hits': {
                      '_source': ['media_name', 'media_id'],
                      'size': 1
                    }
                  }
                }
              }
            }
          }
        }),
        client.search({
          index: 'sltlog_ad_bg_log*',
          body: {
            'size': 0,
            'query': {
              'constant_score': {
                'filter': {
                  'bool': {
                    'must': [
                      {'terms': {'video_id.keyword': videoIdArr}},
                      {'range': {'request_time': {'from': timeRange[0], 'to': timeRange[1]}}}
                    ]
                  }
                }
              }
            },
            'aggs': {
              'mediaInfo': {
                'terms': {
                  'field': 'video_id.keyword'
                }
              }
            }
          }
        }),
        client.search({
          index: 'sltlog_ad_click_log*',
          body: {
            'size': 0,
            'query': {
              'constant_score': {
                'filter': {
                  'bool': {
                    'must': [
                      {'terms': {'video_id.keyword': videoIdArr}},
                      {'range': {'request_time': {'from': timeRange[0], 'to': timeRange[1]}}}
                    ]
                  }
                }
              }
            },
            'aggs': {
              'mediaInfo': {
                'terms': {
                  'field': 'video_id.keyword'
                }
              }
            }
          }
        })
      ]
    ).then(data => {
      // let resultArr = []
      bgArr.forEach(item => {
        // 将根据video查询到的视频名称和mediaId循环填入结果数据
        data[0].aggregations.mediaInfo.buckets.forEach(mItem => {
          if (item.key === mItem.key) {
            // resultArr.push({
            //   media_id: mItem.mediaName.hits.hits[0]._source.media_id,
            //   media_name: mItem.mediaName.hits.hits[0]._source.media_name,
            //   play_count: item.doc_count,
            //   video_id: item.key
            // })
            item.media_id = mItem.mediaName.hits.hits[0]._source.media_id
            item.media_name = mItem.mediaName.hits.hits[0]._source.media_name
            item.playCount = item.doc_count
            item.video_id = item.key
          }
        })

        data[1].aggregations.mediaInfo.buckets.forEach(pItem => {
          if (item.video_id === pItem.key) {
            item.bg_count = pItem.doc_count
            item.pjbg = item.bg_count / item.playCount
          }
        })
        data[2].aggregations.mediaInfo.buckets.forEach(cItem => {
          if (item.video_id === cItem.key) {
            item.click_count = cItem.doc_count
            item.pjclick = item.click_count / item.bg_count
          }
        })
        if (mediaName) {
          if (item.media_name === mediaName) {
            resArrName.push(item)
          }
        }
        delete item['key']
        delete item['doc_count']
        // resultArr.forEach(rItem => {
        //   data[1].aggregations.mediaInfo.buckets.forEach(pItem => {
        //     if (rItem.video_id === pItem.key) {
        //       rItem.bg_count = pItem.doc_count
        //       rItem.pjbg = rItem.bg_count / rItem.bg_count
        //     }
        //   })
        //   data[2].aggregations.mediaInfo.buckets.forEach(cItem => {
        //     rItem.click_count = cItem.doc_count
        //     rItem.pjclick = rItem.click_count / rItem.bg_count
        //   })
        //   if (mediaName) {
        //     if (rItem.media_name === mediaName) {
        //       resArrName.push(rItem)
        //     }
        //   }
        // })
      })
      let resData = {code: 200, data: '', totalPage: total, msg: 'success'}
      resData.data = mediaName ? resArrName : bgArr
      res.send(resData)
    })
  }).catch(err => {
    res.send(err)
  })
})
module.exports = router
