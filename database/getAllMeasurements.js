const config = require('./../config')
const database = 'SmartTerrarium'
const tableName = 'measurements'
const r = require('rethinkdbdash')({
  db: database,
  servers: [{
    host: config.databaseIp,
    port: 28015
  }]
})

module.exports = function getAllMeasurements() {
  return r.table(tableName).orderBy({index: 'date'})
}

/* Other Queries */
// r.db("SmartTerrarium").table("measurements").sample(1000).orderBy(r.desc('date'))
