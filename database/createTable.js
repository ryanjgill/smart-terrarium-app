const config = require('./../config')
const database = 'SmartTerrarium'
var r = require('rethinkdbdash')({
  db: database,
  servers: [{
    host: config.databaseIp,
    port: 28015
  }]
})

const tableName = 'users'; // 'measurements' as well

r.tableCreate(tableName).then(results => {
  console.log(`${tableName} created!`)
  process.exit()
}).catch(error => {
  if (error.msg.indexOf('already exists.') > -1) {
    console.log(`${tableName} already exists.`)
    process.exit()
  }
  console.log(error)
  process.exit()
})