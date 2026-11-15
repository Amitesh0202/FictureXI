// routes/matches.js - Workflow 2: open a scorecard and record a result.
const express = require('express');
const db = require('../db');
const router = express.Router();

// One match: header (from the view), batting card, bowling card, and both squads
router.get('/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const head = await db.select(
      `SELECT f.match_id, f.tournament_id, f.round_no, TO_CHAR(f.match_date, 'YYYY-MM-DD') AS match_date,
              f.status, f.venue, f.team1, f.team2, f.team1_score, f.team2_score, f.winner,
              m.team1_id, m.team2_id, m.team1_extras, m.team2_extras
         FROM v_fixture_list f JOIN cricket_match m ON m.match_id = f.match_id
        WHERE f.match_id = :id`, { id });
    if (head.length === 0) return res.status(404).json({ error: 'Match not found' });

    const batting = await db.select(
      `SELECT p.team_id, p.full_name, b.runs, b.balls, b.fours, b.sixes, b.how_out
         FROM batting b JOIN player p ON p.player_id = b.player_id
        WHERE b.match_id = :id ORDER BY p.team_id, p.player_id`, { id });

    const bowling = await db.select(
      `SELECT p.team_id, p.full_name, w.overs, w.runs_conceded, w.wickets
         FROM bowling w JOIN player p ON p.player_id = w.player_id
        WHERE w.match_id = :id ORDER BY p.team_id, p.player_id`, { id });

    // squads of the two teams (used by the entry form)
    const players = await db.select(
      `SELECT p.player_id, p.full_name, p.player_role, p.team_id
         FROM player p
        WHERE p.team_id IN (:t1, :t2)
        ORDER BY p.team_id, p.player_id`, { t1: head[0].team1_id, t2: head[0].team2_id });

    res.json({ match: head[0], batting, bowling, players });
  } catch (err) { res.status(400).json({ error: db.friendlyError(err) }); }
});

// Choose the venue for a match
router.put('/:id/venue', async (req, res) => {
  try {
    await db.execute(`UPDATE cricket_match SET venue_id = :v WHERE match_id = :id`,
      { v: req.body.venue_id || null, id: req.params.id });
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: db.friendlyError(err) }); }
});

// Record a scorecard. ONE transaction:
//   1. save extras   2. insert all batting rows   3. insert all bowling rows
//   4. call COMPLETE_MATCH (sets winner)   -> then COMMIT
// If anything fails (a trigger, a CHECK, the procedure...) we ROLLBACK TO the
// savepoint and nothing is saved.
router.post('/:id/result', async (req, res) => {
  const id = req.params.id;
  const { team1_extras = 0, team2_extras = 0, batting = [], bowling = [] } = req.body;
  try {
    await db.withTransaction(async (conn) => {
      await conn.execute('SAVEPOINT before_result');
      try {
        await conn.execute(
          `UPDATE cricket_match SET team1_extras = :e1, team2_extras = :e2 WHERE match_id = :id`,
          { e1: team1_extras, e2: team2_extras, id });

        for (const b of batting) {
          await conn.execute(
            `INSERT INTO batting (match_id, player_id, runs, balls, fours, sixes, how_out)
             VALUES (:m, :p, :runs, :balls, :fours, :sixes, :how)`,
            { m: id, p: b.player_id, runs: b.runs, balls: b.balls || 0,
              fours: b.fours || 0, sixes: b.sixes || 0, how: b.how_out || 'not out' });
        }
        for (const w of bowling) {
          await conn.execute(
            `INSERT INTO bowling (match_id, player_id, overs, runs_conceded, wickets)
             VALUES (:m, :p, :overs, :rc, :wk)`,
            { m: id, p: w.player_id, overs: w.overs, rc: w.runs_conceded, wk: w.wickets });
        }
        await conn.execute(`BEGIN complete_match(:id); END;`, { id });
      } catch (err) {
        await conn.execute('ROLLBACK TO SAVEPOINT before_result');
        throw err;                       // withTransaction then rolls back and reports
      }
    });
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: db.friendlyError(err) }); }
});

module.exports = router;
