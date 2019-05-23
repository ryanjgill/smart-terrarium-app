const config = require('./../config.json')
const database = 'test3'
var r = require('rethinkdbdash')({
  db: database,
  servers: [{
    host: '192.168.86.132',
    port: 28015
  }]
})


r.dbCreate(database).then(results => {
  r.dbList()
    .then(dbs => {
      console.log(`${database} created!`)
      process.exit()
    })
}).catch(error => {
  if (error.msg.indexOf('already exists.') > -1) {
    console.log(`${database} already exists.`)
    process.exit()
  }
  console.log(error)
  process.exit()
})