// server.js - starts the web server.
// Browser  <->  Express routes (this folder)  <->  Oracle (db.js)
// The routes contain NO business rules: the rules live in the database
// (constraints, triggers, procedures) and Oracle's error is passed back.
require('dotenv').config();
const path = require('path');
const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));   // serves the web pages

app.use('/api/tournaments', require('./routes/tournaments'));   // Amitesh
app.use('/api', require('./routes/masterdata'));                // Arvind  (teams, players, venues)
app.use('/api/matches', require('./routes/matches'));           // Harshil
app.use('/api/integrity-lab', require('./routes/integrity'));   // Tanuj
app.use('/api/reports', require('./routes/reports'));           // Eshwar

const port = process.env.PORT || 3000;
db.init()
  .then(() => app.listen(port, () => console.log('FixtureXI running at http://localhost:' + port)))
  .catch((err) => { console.error('Could not connect to Oracle:', err.message); process.exit(1); });
