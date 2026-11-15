// routes/integrity.js - Workflow 4: integrity lab.
// Each test runs ONE invalid statement. The database must reject it.
// We show Oracle's error, then ROLLBACK so nothing is ever changed.
// (Same eight tests as db/04_integrity_demo.sql, using the seed data.)
const express = require('express');
const db = require('../db');
const router = express.Router();

const TESTS = [
  { title: 'A team playing itself', expect: 'ORA-02290 (CHECK ck_match_teams)',
    sql: `INSERT INTO cricket_match (tournament_id, round_no, match_date, team1_id, team2_id)
          VALUES (2, 1, DATE '2026-12-01', 3, 3)` },
  { title: 'A team not registered in the tournament', expect: 'ORA-02291 (composite FOREIGN KEY fk_match_team2)',
    sql: `INSERT INTO cricket_match (tournament_id, round_no, match_date, team1_id, team2_id)
          VALUES (2, 1, DATE '2026-12-01', 1, 5)` },
  { title: 'The same pairing scheduled twice', expect: 'ORA-00001 (UNIQUE uq_match_pair)',
    sql: `INSERT INTO cricket_match (tournament_id, round_no, match_date, team1_id, team2_id)
          VALUES (1, 9, DATE '2026-08-30', 1, 2)` },
  { title: 'Boundary runs larger than the score', expect: 'ORA-02290 (CHECK ck_bat_boundary)',
    sql: `INSERT INTO batting (match_id, player_id, runs, balls, fours, sixes, how_out)
          VALUES (1, 15, 10, 8, 5, 0, 'bowled')` },
  { title: 'A batter from a team not in the match', expect: 'ORA-20010 (TRIGGER trg_batting_team_check)',
    sql: `INSERT INTO batting (match_id, player_id, runs, balls, fours, sixes, how_out)
          VALUES (1, 31, 12, 10, 1, 0, 'caught')` },
  { title: 'Generating fixtures twice', expect: 'ORA-20001 (PROCEDURE generate_fixtures)',
    sql: `BEGIN generate_fixtures(1); END;` },
  { title: 'Recording a result twice', expect: 'ORA-20030 (PROCEDURE complete_match)',
    sql: `BEGIN complete_match(1); END;` },
  { title: 'Deleting a team that has history', expect: 'ORA-02292 (FOREIGN KEY - child records found)',
    sql: `DELETE FROM team WHERE team_id = 1` },
];

// List the tests (so the page can show them)
router.get('/', (req, res) => {
  res.json(TESTS.map((t, i) => ({ n: i + 1, title: t.title, expect: t.expect, sql: t.sql })));
});

// Run test number n
router.post('/:n', async (req, res) => {
  const test = TESTS[Number(req.params.n) - 1];
  if (!test) return res.status(404).json({ error: 'No such test' });

  const conn = await db.getConnection();
  try {
    await conn.execute(test.sql);
    // If we get here the database did NOT reject it
    res.json({ rejected: false, message: 'The statement was accepted (unexpected). It has been rolled back.' });
  } catch (err) {
    res.json({ rejected: true, oracle_error: String(err.message).split('\n')[0],
               message: db.friendlyError(err) });
  } finally {
    await conn.rollback();           // never keep anything from the lab
    await conn.close();
  }
});

module.exports = router;
