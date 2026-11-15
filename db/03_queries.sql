-- FixtureXI : queries Q1-Q3 (Q4-Q5 are in 03b_queries_more.sql).  In SQL*Plus first run:
--   VARIABLE tid NUMBER
--   EXEC :tid := 1

-- Q1  Points table (UNION ALL in a CTE, conditional aggregation, RANK)
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
 ORDER BY pos, short_code;

-- Q2  Top 10 run scorers (4-table join, GROUP BY, window function)
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
 FETCH FIRST 10 ROWS ONLY;

-- Q3  Bowlers with more wickets than the tournament average (nested subquery in HAVING)
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
 ORDER BY wickets DESC;
