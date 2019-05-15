
const database = 'SmartTerrarium';
const tableName = 'measurements';
const r = require('rethinkdbdash')({
  db: database,
  servers: [{
    host: 'localhost',
    port: 28015
  }]
});

module.exports = function getAllMeasurements() {
  return r.table(tableName).orderBy({index: 'date'});
}