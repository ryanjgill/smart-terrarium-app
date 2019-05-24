const saveMeasurement = require('./saveMeasurement')
const database = 'SmartTerrarium'

const r = require('rethinkdbdash')({
  db: database,
  servers: [{
    host: '192.168.86.132',
    port: 28015
  }]
})

function copyTable() {
  r.table('purgedMeasurements')
    .orderBy({index: 'date'})
    .then(results => {
      results.forEach((m, i) => {
        saveMeasurement(m, 'measurements')
            .then(r => { })
            .catch(error => { console.log(error) })
      })
    })
}

copyTable()