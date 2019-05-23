const config = require('./../config.json')
const database = 'SmartTerrarium'
const r = require('rethinkdbdash')({
  db: database,
  servers: [{
    host: '192.168.86.132',
    port: 28015
  }]
})

const tableName = 'test'

const testSave = () => {
  r.table(tableName)
    .insert({
      date: r.now(),
      drainWaterLevel: Math.round(Math.random() * 1000 / 10),
      humidity: Math.round(Math.random() * 1000 / 10),
      misterWaterLevel: Math.round(Math.random() * 1000 / 10),
      name: 'Curie',
      soilMoisture: Math.round(Math.random() * 1000 / 10),
      temperature: Math.round(Math.random() * 1000 / 10),
      uvIndex: Math.round(Math.random() * 100 / 10)
    })
    .then(results => console.log(results))
    .catch(error => console.log(error))
}

setInterval(function () {
  testSave()
}, 1000)
