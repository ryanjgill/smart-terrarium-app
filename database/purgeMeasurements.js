const moment = require('moment')
const config = require('./../config.json')
const saveMeasurement = require('./saveMeasurement')
const database = 'SmartTerrarium'
const timeBetweenMeasurements = (1000 * 60 * 5)

const tableName = 'measurements'
const r = require('rethinkdbdash')({
  db: database,
  servers: [{
    host: '192.168.86.132',
    port: 28015
  }]
})

function purgeMeasurements() {
  r.table(tableName)
    .orderBy({index: 'date'})
    //.limit(1000)
    .then(results => {
      let previousDate = new Date(2019, 1, 1)
      results.forEach((m, i) => {
        //if (i > 1000) { return }
        let timeDifference = moment(m.date).valueOf() - moment(previousDate).valueOf()
        //console.log(timeDifference);

        if (timeDifference > (timeBetweenMeasurements)) {
          saveMeasurement(m, 'purgedMeasurements')
            .then(r => { })
            .catch(error => { console.log(error) })
          //console.log(m)
          previousDate = m.date
        }
      })
    })
}

purgeMeasurements()