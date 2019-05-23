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

module.exports = function saveMeasurement(measurement) {
  return r.table(tableName).insert(measurement)
}