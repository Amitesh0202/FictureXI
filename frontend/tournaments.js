// tournaments.js - Workflow 1: create tournament, register teams, generate fixtures.
menu('index.html');

async function loadTournaments() {
  const rows = await api('/api/tournaments');
  document.getElementById('tournamentList').innerHTML = makeTable(rows, [
    ['tournament_id', 'ID'], ['tournament_name', 'Name'], ['start_date', 'Start'], ['end_date', 'End'],
    ['days_between_rounds', 'Days between rounds'], ['teams', 'Teams'], ['matches', 'Matches']]);
  const select = document.getElementById('tSelect');
  const keep = select.value;
  fillSelect(select, rows, 'tournament_id', 'tournament_name');
  if (keep) select.value = keep;
  loadTournament();
}

async function loadTournament() {
  const id = document.getElementById('tSelect').value;
  if (!id) return;
  const teams = await api(`/api/tournaments/${id}/teams`);
  document.getElementById('registered').textContent = teams.map((t) => t.short_code).join(', ') || 'none yet';
  loadFixtures(id);
}

async function loadFixtures(id) {
  const rows = await api(`/api/tournaments/${id}/fixtures`);
  rows.forEach((r) => {
    r.score = r.status === 'COMPLETED' ? `${r.team1_score} v ${r.team2_score}` : '';
    r.link = `<a href="match.html?id=${r.match_id}">open</a>`;
  });
  // makeTable escapes text, so build this one with a link column by hand
  const head = '<tr><th>Round</th><th>Date</th><th>Match</th><th>Venue</th><th>Status</th><th>Score</th><th>Winner</th><th></th></tr>';
  const body = rows.map((r) =>
    `<tr><td>${r.round_no}</td><td>${esc(r.match_date)}</td><td>${esc(r.team1)} v ${esc(r.team2)}</td>` +
    `<td>${esc(r.venue)}</td><td>${esc(r.status)}</td><td>${esc(r.score)}</td><td>${esc(r.winner || '')}</td>` +
    `<td>${r.link}</td></tr>`).join('');
  document.getElementById('fixtures').innerHTML = rows.length ? `<table>${head}${body}</table>` : '<p>No fixtures yet.</p>';
}

async function createTournament() {
  try {
    await api('/api/tournaments', 'POST', {
      tournament_name: document.getElementById('tName').value,
      start_date: document.getElementById('tStart').value,
      end_date: document.getElementById('tEnd').value,
      days_between_rounds: Number(document.getElementById('tGap').value),
    });
    showMsg('Tournament created');
    loadTournaments();
  } catch (e) { showMsg(e.message, false); }
}

async function registerTeam() {
  const id = document.getElementById('tSelect').value;
  try {
    await api(`/api/tournaments/${id}/teams`, 'POST', { team_id: document.getElementById('teamSelect').value });
    showMsg('Team registered');
    loadTournaments();
  } catch (e) { showMsg(e.message, false); }
}

async function generateFixtures() {
  const id = document.getElementById('tSelect').value;
  try {
    await api(`/api/tournaments/${id}/fixtures`, 'POST');
    showMsg('Fixtures generated');
    loadTournaments();
  } catch (e) { showMsg(e.message, false); }   // e.g. "Fixtures already generated for this tournament"
}

(async () => {
  fillSelect(document.getElementById('teamSelect'), await api('/api/teams'), 'team_id', 'team_name');
  await loadTournaments();
})().catch((e) => showMsg(e.message, false));
