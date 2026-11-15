-- FixtureXI : triggers.  Run after 01_schema.sql
-- A CHECK constraint cannot look at another table, so the rule
-- "a card's player must belong to one of the two teams in the match"
-- needs a trigger.

CREATE OR REPLACE TRIGGER trg_batting_team_check
BEFORE INSERT OR UPDATE OF match_id, player_id ON batting
FOR EACH ROW
DECLARE v_ok NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_ok
    FROM cricket_match m JOIN player p ON p.player_id = :NEW.player_id
   WHERE m.match_id = :NEW.match_id AND p.team_id IN (m.team1_id, m.team2_id);
  IF v_ok = 0 THEN
    RAISE_APPLICATION_ERROR(-20010, 'Batter does not belong to either team of this match');
  END IF;
END;
/

CREATE OR REPLACE TRIGGER trg_bowling_team_check
BEFORE INSERT OR UPDATE OF match_id, player_id ON bowling
FOR EACH ROW
DECLARE v_ok NUMBER;
BEGIN
  SELECT COUNT(*) INTO v_ok
    FROM cricket_match m JOIN player p ON p.player_id = :NEW.player_id
   WHERE m.match_id = :NEW.match_id AND p.team_id IN (m.team1_id, m.team2_id);
  IF v_ok = 0 THEN
    RAISE_APPLICATION_ERROR(-20011, 'Bowler does not belong to either team of this match');
  END IF;
END;
/
