let elasticsearch = require('elasticsearch')

let client = new elasticsearch.Client({
  // hosts: ['47.95.28.173:9200', '47.95.35.153:9200', '101.201.211.142:9200'],
  hosts: [
    {
      host: '47.95.28.173',
      auth: 'elastic:VcaSlt20171011',
      protocol: 'http',
      port: 9200
    },
    {
      host: '47.95.35.153',
      auth: 'elastic:VcaSlt20171011',
      protocol: 'http',
      port: 9200
    },
    {
      host: '101.201.211.142',
      auth: 'elastic:VcaSlt20171011',
      protocol: 'http',
      port: 9200
    }
  ]
})

client.ping({
  requestTimeout: 1000
}, (error) => {
  if (error) {
    console.log(error)
    console.trace('elasticsearch cluster is down!')
  } else {
    console.log('All is well')
  }
})

module.exports.client = client
