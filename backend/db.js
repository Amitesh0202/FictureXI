// db.js - the only file that talks to Oracle directly.
// Every route uses these helpers. All values go in as BIND VARIABLES (:name),
// never pasted into the SQL text, so SQL injection is not possible.
const oracledb = require('oracledb');

oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;   // rows come back as objects

let pool;

// Create a small connection pool once, when the server starts.
async function init() {
  pool = await oracledb.createPool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECT,
    poolMin: 1,
    poolMax: 5,
  });
}

// Oracle gives column names in UPPER case; the frontend wants lower case.
function lowerKeys(row) {
  const out = {};
  for (const k of Object.keys(row)) out[k.toLowerCase()] = row[k];
  return out;
}

// SELECT: returns an array of rows.
async function select(sql, binds = {}) {
  const conn = await pool.getConnection();
  try {
    const result = await conn.execute(sql, binds);
    return result.rows.map(lowerKeys);
  } finally {
    await conn.close();
  }
}

// Single INSERT / UPDATE / DELETE: commits automatically if it works.
async function execute(sql, binds = {}) {
  const conn = await pool.getConnection();
  try {
    return await conn.execute(sql, binds, { autoCommit: true });
  } finally {
    await conn.close();
  }
}

// Several statements as ONE transaction.
// fn(conn) runs the statements; if anything throws, everything is rolled back.
async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    await conn.close();
  }
}

// Borrow a raw connection (caller must close it). Used by the integrity lab.
function getConnection() {
  return pool.getConnection();
}

// Turn an Oracle error into a short readable message for the user.
// Example input: "ORA-02291: integrity constraint (FIXTUREXI.FK_MATCH_TEAM2) violated - parent key not found"
function friendlyError(err) {
  const msg = String(err.message || err);
  const constraint = (msg.match(/\(([^)]+)\)/) || [])[1] || '';
  if (msg.includes('ORA-00001')) return 'Duplicate value rejected (UNIQUE / PRIMARY KEY): ' + constraint;
  if (msg.includes('ORA-02290')) return 'Rule rejected (CHECK constraint): ' + constraint;
  if (msg.includes('ORA-02291')) return 'Related record not found (FOREIGN KEY): ' + constraint;
  if (msg.includes('ORA-02292')) return 'Cannot delete: other records still use it (FOREIGN KEY): ' + constraint;
  if (msg.includes('ORA-01400')) return 'A required value is missing (NOT NULL)';
  const custom = msg.match(/ORA-200\d\d: (.*)/);     // our own RAISE_APPLICATION_ERROR messages
  if (custom) return custom[1].split('\n')[0];
  return msg.split('\n')[0];
}

module.exports = { init, select, execute, withTransaction, getConnection, friendlyError };
