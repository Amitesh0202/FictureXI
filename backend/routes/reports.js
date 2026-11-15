// routes/reports.js - Workflow 3: the five report queries (same SQL as db/03_queries.sql).
// Each one takes the tournament id as the bind variable :tid.
const express = require('express');
const db = require('../db');
const router = express.Router();

// Run one query for the tournament in the URL and send back the rows
function report(path, sql) {
  router.get(path, async (req, res) => {
    try {
      res.json(await db.select(sql, { tid: req.params.id }));
    } catch (err) { res.status(400).json({ error: db.friendlyError(err) }); }
  });
}

// Q1 Points table: CTE with UNION ALL, conditional aggregation, RANK()
report('/:id/standings', `
  WITH sides AS (
    SELECT team1_id AS team_id, winner_id FROM cricket_match
     WHERE tournament_id = :tid AND status = 'COMPLETED'
    UNION ALL
    SELECT team2_id, winner_id FROM cricket_match
     WHERE tournament_id = :tid AND status = 'COMPLETED'
  ), tally AS (
    SELECT t.short_code,
           COUNT(*)                                                  AS played,
           SUM(CASE WHEN s.winner_id = s.team_id THEN 1 ELSE 0 END)  AS won,
           SUM(CASE WHEN s.winner_id IS NULL THEN 1 ELSE 0 END)      AS tied,
           SUM(CASE WHEN s.winner_id <> s.team_id THEN 1 ELSE 0 END) AS lost
      FROM sides s JOIN team t ON t.team_id = s.team_id
     GROUP BY t.team_id, t.short_code
  )
  SELECT RANK() OVER (ORDER BY 2 * won + tied DESC, won DESC) AS pos,
         short_code, played, won, tied, lost, 2 * won + tied AS points
    FROM tally
   ORDER BY pos, short_code`);

// Q2 Top 10 run scorers: 4-table join, GROUP BY, window function
report('/:id/run-scorers', `
  SELECT p.full_name, t.short_code, COUNT(*) AS innings,
         SUM(b.runs) AS runs, MAX(b.runs) AS highest,
         RANK() OVER (ORDER BY SUM(b.runs) DESC) AS rnk
    FROM batting b
    JOIN player p        ON p.player_id = b.player_id
    JOIN team t          ON t.team_id   = p.team_id
    JOIN cricket_match m ON m.match_id  = b.match_id
   WHERE m.tournament_id = :tid
   GROUP BY p.player_id, p.full_name, t.short_code
   ORDER BY runs DESC
   FETCH FIRST 10 ROWS ONLY`);

// Q3 Bowlers with more wickets than the tournament average: nested subquery in HAVING
report('/:id/wicket-leaders', `
  SELECT p.full_name, SUM(w.wickets) AS wickets, SUM(w.runs_conceded) AS runs_conceded
    FROM bowling w
    JOIN player p        ON p.player_id = w.player_id
    JOIN cricket_match m ON m.match_id  = w.match_id
   WHERE m.tournament_id = :tid
   GROUP BY p.player_id, p.full_name
  HAVING SUM(w.wickets) > (SELECT AVG(x.wk)
                             FROM (SELECT SUM(w2.wickets) AS wk
                                     FROM bowling w2
                                     JOIN cricket_match m2 ON m2.match_id = w2.match_id
                                    WHERE m2.tournament_id = :tid
                                    GROUP BY w2.player_id) x)
   ORDER BY wickets DESC`);

// Q4 Three highest team totals: view + CTE + ROW_NUMBER()
report('/:id/highest-totals', `
  WITH ranked AS (
    SELECT s.match_id, s.team_id, s.total_runs, s.wickets,
           ROW_NUMBER() OVER (ORDER BY s.total_runs DESC) AS rn
      FROM v_team_score s JOIN cricket_match m ON m.match_id = s.match_id
     WHERE m.tournament_id = :tid
  )
  SELECT r.rn, t.short_code AS team, r.total_runs || '/' || r.wickets AS score,
         TO_CHAR(m.match_date, 'YYYY-MM-DD') AS match_date, v.venue_name
    FROM ranked r
    JOIN team t          ON t.team_id  = r.team_id
    JOIN cricket_match m ON m.match_id = r.match_id
    LEFT JOIN venue v    ON v.venue_id = m.venue_id
   WHERE r.rn <= 3
   ORDER BY r.rn`);

// Q5 Ever-present batters: batted in EVERY completed match of their team (double NOT EXISTS)
report('/:id/ever-present', `
  SELECT p.full_name, t.short_code
    FROM player p
    JOIN team t ON t.team_id = p.team_id
   WHERE EXISTS (SELECT 1 FROM cricket_match m
                  WHERE m.tournament_id = :tid AND m.status = 'COMPLETED'
                    AND p.team_id IN (m.team1_id, m.team2_id))
     AND NOT EXISTS (
           SELECT 1 FROM cricket_match m
            WHERE m.tournament_id = :tid AND m.status = 'COMPLETED'
              AND p.team_id IN (m.team1_id, m.team2_id)
              AND NOT EXISTS (SELECT 1 FROM batting b
                               WHERE b.match_id = m.match_id AND b.player_id = p.player_id))
   ORDER BY t.short_code, p.full_name`);

module.exports = router;
