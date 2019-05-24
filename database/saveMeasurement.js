const config = require('./../config.json')
const database = 'SmartTerrarium'
const defaultTable = 'measurements'
const r = require('rethinkdbdash')({
  db: database,
  servers: [{
    host: '192.168.86.132',
    port: 28015
  }]
})

module.exports = function saveMeasurement(measurement, _tableName) {
  let tableName = _tableName ? _tableName : defaultTable
  return r.table(tableName).insert(measurement)
}