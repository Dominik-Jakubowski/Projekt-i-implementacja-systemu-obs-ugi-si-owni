const sql = require('mssql');
const { getDatabaseConfig } = require('../config/database');

let poolPromise;

function connectToDatabase() {
  if (!poolPromise) {
    poolPromise = sql.connect(getDatabaseConfig());
  }

  return poolPromise;
}

async function getPool() {
  return connectToDatabase();
}

module.exports = {
  sql,
  connectToDatabase,
  getPool,
};
