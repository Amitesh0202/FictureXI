-- FixtureXI : constraint / trigger / procedure demo (run after 05_seed.sql).
-- Every statement below is REJECTED; the expected error is in the comment.
-- Seed facts used: tournament 1 is complete (teams 1-8); match 1 is team 1 v team 8;
-- tournament 2 has teams 1-4 and no fixtures yet; players 1-15 belong to team 1.

-- 1. A team playing itself                       -> ORA-02290 ck_match_teams
INSERT INTO cricket_match (tournament_id, round_no, match_date, team1_id, team2_id)
VALUES (2, 1, DATE '2026-12-01', 3, 3);

-- 2. A team not registered in the tournament     -> ORA-02291 fk_match_team2
INSERT INTO cricket_match (tournament_id, round_no, match_date, team1_id, team2_id)
VALUES (2, 1, DATE '2026-12-01', 1, 5);

-- 3. The same pairing scheduled twice            -> ORA-00001 uq_match_pair
INSERT INTO cricket_match (tournament_id, round_no, match_date, team1_id, team2_id)
VALUES (1, 9, DATE '2026-08-30', 1, 2);

-- 4. Boundary runs larger than the score         -> ORA-02290 ck_bat_boundary
INSERT INTO batting (match_id, player_id, runs, balls, fours, sixes, how_out)
VALUES (1, 15, 10, 8, 5, 0, 'bowled');

-- 5. A batter from a team not in the match       -> ORA-20010 (trigger)
INSERT INTO batting (match_id, player_id, runs, balls, fours, sixes, how_out)
VALUES (1, 31, 12, 10, 1, 0, 'caught');

-- 6. Generating fixtures twice                   -> ORA-20001 (procedure)
BEGIN generate_fixtures(1); END;
/

-- 7. Recording a result twice                    -> ORA-20030 (procedure)
BEGIN complete_match(1); END;
/

-- 8. Deleting a team that has history            -> ORA-02292 (child records found)
DELETE FROM team WHERE team_id = 1;

ROLLBACK;
