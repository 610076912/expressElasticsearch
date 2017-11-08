let elasticsearch = require('elasticsearch')

let client = new elasticsearch.Client({
  host: 'http://elastic:changeme@47.95.28.173:9200'
})

client.ping({
  requestTimeout: 1000
}, (error) => {
  if (error) {
    console.trace('elasticsearch cluster is down!')
  } else {
    console.log('All is well')
  }
})

module.exports.client = client
