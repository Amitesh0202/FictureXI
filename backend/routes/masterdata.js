// routes/masterdata.js - teams, players and venues: add, edit, delete, search.
// Deleting something that has history (e.g. a team with players or matches)
// is refused by the FOREIGN KEYs (ORA-02292) - we just show Oracle's message.
const express = require('express');
const db = require('../db');
const router = express.Router();

const fail = (res, err) => res.status(400).json({ error: db.friendlyError(err) });

/* ---------------- TEAMS ---------------- */
router.get('/teams', async (req, res) => {
  try {
    res.json(await db.select(
      `SELECT t.team_id, t.team_name, t.short_code,
              (SELECT COUNT(*) FROM player p WHERE p.team_id = t.team_id) AS players
         FROM team t ORDER BY t.team_name`));
  } catch (err) { fail(res, err); }
});

router.post('/teams', async (req, res) => {
  try {
    await db.execute(`INSERT INTO team (team_name, short_code) VALUES (:n, :c)`,
      { n: req.body.team_name, c: req.body.short_code });
    res.json({ ok: true });
  } catch (err) { fail(res, err); }
});

router.put('/teams/:id', async (req, res) => {
  try {
    await db.execute(`UPDATE team SET team_name = :n, short_code = :c WHERE team_id = :id`,
      { n: req.body.team_name, c: req.body.short_code, id: req.params.id });
    res.json({ ok: true });
  } catch (err) { fail(res, err); }
});

router.delete('/teams/:id', async (req, res) => {
  try {
    await db.execute(`DELETE FROM team WHERE team_id = :id`, { id: req.params.id });
    res.json({ ok: true });
  } catch (err) { fail(res, err); }
});

/* ---------------- PLAYERS ---------------- */
// Optional filters: ?team_id=1  and  ?search=khan  (search is case-insensitive)
router.get('/players', async (req, res) => {
  try {
    res.json(await db.select(
      `SELECT p.player_id, p.full_name, p.player_role, p.team_id, t.short_code AS team
         FROM player p JOIN team t ON t.team_id = p.team_id
        WHERE (:team IS NULL OR p.team_id = :team)
          AND (:q IS NULL OR UPPER(p.full_name) LIKE '%' || UPPER(:q) || '%')
        ORDER BY t.short_code, p.player_id`,
      { team: req.query.team_id || null, q: req.query.search || null }));
  } catch (err) { fail(res, err); }
});

// Player profile: details plus career batting and bowling totals (LEFT JOINs keep players with no matches)
router.get('/players/:id', async (req, res) => {
  try {
    const rows = await db.select(
      `SELECT p.player_id, p.full_name, p.player_role, t.team_name,
              (SELECT COUNT(*)            FROM batting b WHERE b.player_id = p.player_id) AS innings,
              (SELECT NVL(SUM(b.runs),0)  FROM batting b WHERE b.player_id = p.player_id) AS runs,
              (SELECT NVL(SUM(w.wickets),0) FROM bowling w WHERE w.player_id = p.player_id) AS wickets
         FROM player p JOIN team t ON t.team_id = p.team_id
        WHERE p.player_id = :id`, { id: req.params.id });
    if (rows.length === 0) return res.status(404).json({ error: 'Player not found' });
    res.json(rows[0]);
  } catch (err) { fail(res, err); }
});

router.post('/players', async (req, res) => {
  try {
    await db.execute(
      `INSERT INTO player (full_name, player_role, team_id) VALUES (:n, :r, :t)`,
      { n: req.body.full_name, r: req.body.player_role, t: req.body.team_id });
    res.json({ ok: true });
  } catch (err) { fail(res, err); }
});

router.put('/players/:id', async (req, res) => {
  try {
    await db.execute(
      `UPDATE player SET full_name = :n, player_role = :r, team_id = :t WHERE player_id = :id`,
      { n: req.body.full_name, r: req.body.player_role, t: req.body.team_id, id: req.params.id });
    res.json({ ok: true });
  } catch (err) { fail(res, err); }
});

router.delete('/players/:id', async (req, res) => {
  try {
    await db.execute(`DELETE FROM player WHERE player_id = :id`, { id: req.params.id });
    res.json({ ok: true });
  } catch (err) { fail(res, err); }
});

/* ---------------- VENUES ---------------- */
router.get('/venues', async (req, res) => {
  try {
    res.json(await db.select(
      `SELECT venue_id, venue_name, city, country, capacity FROM venue ORDER BY venue_name`));
  } catch (err) { fail(res, err); }
});

router.post('/venues', async (req, res) => {
  const b = req.body;
  try {
    await db.execute(
      `INSERT INTO venue (venue_name, city, country, capacity) VALUES (:n, :c, :k, :cap)`,
      { n: b.venue_name, c: b.city, k: b.country, cap: b.capacity || null });
    res.json({ ok: true });
  } catch (err) { fail(res, err); }
});

router.delete('/venues/:id', async (req, res) => {
  try {
    await db.execute(`DELETE FROM venue WHERE venue_id = :id`, { id: req.params.id });
    res.json({ ok: true });
  } catch (err) { fail(res, err); }
});

module.exports = router;
