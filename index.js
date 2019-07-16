const express = require('express')
const cors = require('cors')
const app = express()
const server = require('http').createServer(app)
const io = require('socket.io')(server)
const ip = require('ip')
const PORT = 3030
const serverIP = `${ip.address()}:${PORT}`
const path = require('path')
const bodyParser = require('body-parser')
const five = require("johnny-five")
const saveMeasurement = require('./database/saveMeasurement')
const getSampleMeasurements = require('./database/getSampleMeasurements')
const getSparklines = require('./database/getSparklines')
const emptyMisterLevel = 30
const emptyDrainLevel = 23
var misterWaterLevel = 0,
  drainWaterLevel = 0,
  lastReading,
  lastSaveTime,
  misterRelayValue,
  lightsRelayValue

new five.Board({ repl: false }).on("ready", function() {
  console.log('Johnny-Five up, Board Ready!')

  // Initialize water level sensors using proximity sensors
  let misterWaterLevelSensor = new five.Proximity({ controller: "HCSR04", pin: "A0" })
  let drainWaterLevelSensor = new five.Proximity({ controller: "HCSR04", pin: "A1" })

  const lightsRelay = new five.Relay(2)
  const misterRelay = new five.Relay(3)

  // start off with the lights and mister off
  // relay is active low
  lightsRelay.on()
  misterRelay.on()
  lightsRelayValue = false
  misterRelayValue = false

  misterWaterLevelSensor.on('change', function() {
    let level = Math.round((emptyMisterLevel - this.cm + 1) / emptyMisterLevel * 100)
    misterWaterLevel = level > 0 ? level : 0
  })

  drainWaterLevelSensor.on('change', function() {
    let level =  Math.round((emptyDrainLevel - this.cm + 1) / emptyDrainLevel * 100)
    drainWaterLevel = level > 0 ? level : 0
  })

  io.on('connection', function(socket){
    socket.on('toggleMister', function(value){
      // relay is active low
      if (!value) {
        misterRelay.on()
      } else {
        misterRelay.off()
      }
      misterRelayValue = value
      socket.emit('misterValue', value);
    })

    socket.on('toggleLights', function(value){
      // relay is active low
      if (!value) {
        lightsRelay.on()
      } else {
        lightsRelay.off()
      }
      lightsRelayValue = value
      socket.emit('lightsValue', value);
    })

    // emit current values
    socket.emit('misterValue', misterRelayValue);
    socket.emit('lightsValue', lightsRelayValue);
  })


  app.use(cors())

  app.use(bodyParser.urlencoded({
    extended: true
  }))

  app.use(express.static(path.join(__dirname, 'public')))
  app.set('views', path.join(__dirname, 'views'))

  // route for main dashboard
  app.get('/', (req, res, next) => {
    res.render('index')
    next()
  })

  // get last measurement
  app.get('/measurement', (req, res, next) => {
    res.json(lastReading || {})
    next()
  })

  app.get('/measurements', (req, res, next) => {
    getSampleMeasurements()
    .then(results => {
      let temp = results.reduce((measurements, m, index) => {
        if (index % 10 === 0) { measurements.push(m) }
        return measurements
      }, [])

      if (lastReading) {
        results.push(lastReading);
      }
      res.json(temp)
      next()
    })
    .catch(err => {
      console.log(err)
      next()
    })
  })

  app.get('/sparklines', (req, res, next) => {
    getSparklines()
    .then(results => {
      if (lastReading) {
        results.push(lastReading);
      }

      res.json(results)
      next()
    })
    .catch(err => {
      console.log(err)
      next()
    })
  })

  // POST temperatures
  app.post('/temperatures', (req, res, next) => {
    let body = JSON.parse(JSON.stringify(req.body))
    let reading = {
      date: new Date(),
      probeA: body.probeA,
      probeB: body.probeB,
      probeC: body.probeC,
      probeD: body.probeD,
      probeE: body.probeE,
      rig_name: body.rig_name,
      uvIndex: body.uvIndex,
      humidity: body.humidity,
      soilMoisture: body.soilMoisture,
      temperature: body.temperature,
      misterWaterLevel,
      drainWaterLevel
    }

    lastReading = reading

    //console.log(lastReading)
    //io.sockets.emit('reading', reading)

    res.sendStatus(200)
    next()
  })

  // Toggle Mister
  app.post('/toggleMister', (req, res, next) => {
    // mister relay is active low
    if (misterRelayValue === true) {
      misterRelay.on()
      misterRelayValue = false
    } else {
      misterRelay.off()
      misterRelayValue = true
    }
    io.sockets.emit('misterValue', misterRelayValue);
    res.sendStatus(200)
    next()
  })

  // Toggle Lights
  app.post('/toggleLights', (req, res, next) => {
    // lights relay is active low
    if (lightsRelayValue === true) {
      lightsRelay.on()
      lightsRelayValue = false
      
    } else {
      lightsRelay.off()
      lightsRelayValue = true
    }
    io.sockets.emit('lightsValue', lightsRelayValue);
    res.sendStatus(200)
    next()
  })

  setInterval(() => {
    if (!lastReading) { return }

    saveMeasurement(lastReading)
      .then(results => {
        lastSaveTime = new Date().getTime()
        console.log('Reading saved.')
      })
      .catch(error => {
        console.log(error)
      })
  }, (1000 * 60))

})

server.listen(PORT, () => console.log(`API listening on ${serverIP}`))