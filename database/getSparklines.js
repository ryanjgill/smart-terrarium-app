
const database = 'SmartTerrarium';
const tableName = 'measurements';
const r = require('rethinkdbdash')({
  db: database,
  servers: [{
    host: 'localhost',
    port: 28015
  }]
});

module.exports = function getSparklines() {
  return r.table(tableName).orderBy({index: r.desc('date')}).limit(500);
}