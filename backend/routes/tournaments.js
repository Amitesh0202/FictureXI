// routes/tournaments.js - Workflow 1: register teams and generate fixtures.
const express = require('express');
const db = require('../db');
const router = express.Router();

// List tournaments with how many teams and matches each has
router.get('/', async (req, res) => {
  try {
    const rows = await db.select(
      `SELECT t.tournament_id, t.tournament_name,
              TO_CHAR(t.start_date, 'YYYY-MM-DD') AS start_date,
              TO_CHAR(t.end_date, 'YYYY-MM-DD')   AS end_date,
              t.days_between_rounds,
              (SELECT COUNT(*) FROM tournament_team tt WHERE tt.tournament_id = t.tournament_id) AS teams,
              (SELECT COUNT(*) FROM cricket_match m WHERE m.tournament_id = t.tournament_id)     AS matches
         FROM tournament t
        ORDER BY t.tournament_id`);
    res.json(rows);
  } catch (err) { res.status(400).json({ error: db.friendlyError(err) }); }
});

// Create a tournament (CHECK constraints reject bad dates)
router.post('/', async (req, res) => {
  const b = req.body;
  try {
    await db.execute(
      `INSERT INTO tournament (tournament_name, start_date, end_date, days_between_rounds)
       VALUES (:name, TO_DATE(:s, 'YYYY-MM-DD'), TO_DATE(:e, 'YYYY-MM-DD'), :gap)`,
      { name: b.tournament_name, s: b.start_date, e: b.end_date, gap: b.days_between_rounds || 1 });
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: db.friendlyError(err) }); }
});

// Teams registered in one tournament
router.get('/:id/teams', async (req, res) => {
  try {
    const rows = await db.select(
      `SELECT t.team_id, t.team_name, t.short_code
         FROM tournament_team tt JOIN team t ON t.team_id = tt.team_id
        WHERE tt.tournament_id = :id ORDER BY t.team_name`, { id: req.params.id });
    res.json(rows);
  } catch (err) { res.status(400).json({ error: db.friendlyError(err) }); }
});

// Register a team (composite primary key stops registering the same team twice)
router.post('/:id/teams', async (req, res) => {
  try {
    await db.execute(
      `INSERT INTO tournament_team (tournament_id, team_id) VALUES (:id, :team)`,
      { id: req.params.id, team: req.body.team_id });
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: db.friendlyError(err) }); }
});

// Generate the whole fixture list by calling the stored procedure.
// The procedure inserts many rows; they are saved together (commit) or not at all (rollback).
router.post('/:id/fixtures', async (req, res) => {
  try {
    await db.withTransaction(async (conn) => {
      await conn.execute(`BEGIN generate_fixtures(:id); END;`, { id: req.params.id });
    });
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: db.friendlyError(err) }); }
});

// Fixture list (reads the view V_FIXTURE_LIST)
router.get('/:id/fixtures', async (req, res) => {
  try {
    const rows = await db.select(
      `SELECT match_id, round_no, TO_CHAR(match_date, 'YYYY-MM-DD') AS match_date,
              status, venue, team1, team2, team1_score, team2_score, winner
         FROM v_fixture_list
        WHERE tournament_id = :id
        ORDER BY round_no, match_id`, { id: req.params.id });
    res.json(rows);
  } catch (err) { res.status(400).json({ error: db.friendlyError(err) }); }
});

module.exports = router;
