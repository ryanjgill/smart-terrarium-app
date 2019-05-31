const config = require('./../config.json')
const database = 'SmartTerrarium'
const tableName = 'measurements'
const r = require('rethinkdbdash')({
  db: database,
  servers: [{
    host: '192.168.86.132',
    port: 28015
  }]
})

module.exports = function getAllMeasurements() {
  return r.table(tableName).orderBy({index: r.asc('date')})
}

/* Other Queries */
// r.db("SmartTerrarium").table("measurements").sample(1000).orderBy(r.desc('date'))
