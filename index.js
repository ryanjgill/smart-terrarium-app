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
const getAllMeasurements = require('./database/getAllMeasurements')
var misterWaterLevel = 0,
  drainWaterLevel = 0,
  lastReading
    
// new five.Board({ port: "/dev/cu.usbmodem14601", repl: false }).on("ready", function() {
//   console.log('Johnny-Five up, Board Ready!')

//   // Initialize water level sensors using proximity sensors
//   let misterWaterLevelSensor = new five.Proximity({ controller: "HCSR04", pin: "A0" })
//   let drainWaterLevelSensor = new five.Proximity({ controller: "HCSR04", pin: "A1" })

//   misterWaterLevelSensor.on('change', function() {
//     misterWaterLevel = this.cm
//   })

//   drainWaterLevelSensor.on('change', function() {
//     drainWaterLevel = this.cm
//   })

//   // setInterval(function () { 
//   //   console.log(`${drainWaterLevel}cm : ${misterWaterLevel}cm`)
//   // }, 1000)
// })

app.use(cors());

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

app.get('/measurements', (req, res, next) => {
  getAllMeasurements()
  .then(results => {
    let temp = results.reduce((measurements, m, index) => {
      if (index % 10 === 0) { measurements.push(m) }
      return measurements;
    }, [])
    res.json(temp)
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
    temperature: body.temperature,
    misterWaterLevel,
    drainWaterLevel
  }

  lastReading = reading

  console.log(lastReading)
  //io.sockets.emit('reading', reading)
  saveMeasurement(lastReading)
    .then(results => {
      lastSaveTime = new Date().getTime()
      res.sendStatus(200)
      console.log('Reading saved.')
      next()
    })
    .catch(error => {
      console.log(error)
      res.sendStatus(500)
      next()
    })
})

server.listen(PORT, () => console.log(`API listening on ${serverIP}`))