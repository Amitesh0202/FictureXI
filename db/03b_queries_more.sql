-- FixtureXI : queries Q4-Q5.  In SQL*Plus first run:
--   VARIABLE tid NUMBER
--   EXEC :tid := 1

-- Q4  Three highest team totals (view + CTE + ROW_NUMBER)
WITH ranked AS (
  SELECT s.match_id, s.team_id, s.total_runs, s.wickets,
         ROW_NUMBER() OVER (ORDER BY s.total_runs DESC) AS rn
    FROM v_team_score s JOIN cricket_match m ON m.match_id = s.match_id
   WHERE m.tournament_id = :tid
)
SELECT r.rn, t.short_code AS team, r.total_runs || '/' || r.wickets AS score,
       m.match_date, v.venue_name
  FROM ranked r
  JOIN team t          ON t.team_id  = r.team_id
  JOIN cricket_match m ON m.match_id = r.match_id
  LEFT JOIN venue v    ON v.venue_id = m.venue_id
 WHERE r.rn <= 3
 ORDER BY r.rn;

-- Q5  Ever-present batters: batted in EVERY completed match of their team
--     (relational division with double NOT EXISTS)
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
 ORDER BY t.short_code, p.full_name;
