const express = require('express')
const app = express()
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const ip = require('ip')
const PORT = 3030;
const serverIP = `${ip.address()}:${PORT}`
const path = require('path')
const bodyParser = require('body-parser')
const five = require("johnny-five");
const ports = [
  { id: "A", port: "/dev/cu.usbmodem149201", repl: false }
  //{ id: "B", port: "usbmodem149101", repl: false }
];

var misterWaterLevel, drainWaterLevel, lastReading;
    
new five.Boards(ports).on("ready", function() {
  // |this| is an array-like object containing references
  // to each initialized board.
  this.each(function(board) {

    // Initialize an Led instance on pin 13 of
    // each initialized board and strobe it.
    // new five.Led({ pin: 13, board }).strobe();

    // Initialize water level sensors using proximity sensors
    let misterWaterLevelSensor = new five.Proximity({ pin: 2, board, freq: 100 })
    let drainWaterLevelSensor = new five.Proximity({ pin: 3, board, freq: 100 })

    misterWaterLevelSensor.on('data', function(val) {
      misterWaterLevel = this.cm;
    });

    drainWaterLevelSensor.on('data', function(val) {
      drainWaterLevel = this.cm;
    });

    // setInterval(function () { 
    //   console.log(`${drainWaterLevel}cm : ${misterWaterLevel}cm`)
    // }, 1000)
  });
});
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static(path.join(__dirname, 'public')))
app.set('views', path.join(__dirname, 'views'))

// route for main dashboard
app.get('/', (req, res, next) => {
  res.render('index')
  next()
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
    rig_name: body.rig_name
  }

  lastReading = reading

  console.log(lastReading);
  res.sendStatus(200)
  next()

  //io.sockets.emit('reading', reading)

  // if (new Date().getTime() - lastSaveTime > SAVE_DELAY) {
  //   r.table('temperatures').insert(reading).run()
  //     .then(function(result) {
  //       lastSaveTime = new Date().getTime()
  //       res.sendStatus(200)
  //       console.log('Reading saved.')
  //       next()
  //     })
  //     .catch(err => {
  //       console.log(err)
  //       res.sendStatus(500)
  //       next()
  //     });
  // } else {
  //   res.sendStatus(200)
  //   next()
  // }
})

server.listen(PORT, () => console.log(`API listening on ${serverIP}`))