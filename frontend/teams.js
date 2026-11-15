// teams.js - master data: teams, players, venues (add / edit / delete / search).
menu('teams.html');

let teamList = [];

/* ---------------- TEAMS ---------------- */
async function loadTeams() {
  teamList = await api('/api/teams');
  const rows = teamList.map((t) =>
    `<tr><td>${t.team_id}</td><td>${esc(t.team_name)}</td><td>${esc(t.short_code)}</td><td>${t.players}</td>` +
    `<td><button class="small" onclick="editTeam(${t.team_id}, '${esc(t.team_name).replace(/'/g, '')}', '${esc(t.short_code)}')">Edit</button> ` +
    `<button class="small danger" onclick="deleteTeam(${t.team_id})">Delete</button></td></tr>`).join('');
  document.getElementById('teams').innerHTML =
    `<table><tr><th>ID</th><th>Name</th><th>Code</th><th>Players</th><th></th></tr>${rows}</table>`;
  fillSelect(document.getElementById('filterTeam'), teamList, 'team_id', 'short_code', 'All teams');
  fillSelect(document.getElementById('pTeam'), teamList, 'team_id', 'short_code');
}

async function addTeam() {
  try {
    await api('/api/teams', 'POST', {
      team_name: document.getElementById('teamName').value,
      short_code: document.getElementById('teamCode').value.toUpperCase() });
    showMsg('Team added'); loadTeams();
  } catch (e) { showMsg(e.message, false); }
}

async function editTeam(id, name, code) {
  const newName = prompt('Team name', name);
  const newCode = prompt('Short code', code);
  if (!newName || !newCode) return;
  try {
    await api(`/api/teams/${id}`, 'PUT', { team_name: newName, short_code: newCode.toUpperCase() });
    showMsg('Team updated'); loadTeams();
  } catch (e) { showMsg(e.message, false); }
}

async function deleteTeam(id) {
  if (!confirm('Delete this team?')) return;
  try {
    await api(`/api/teams/${id}`, 'DELETE');
    showMsg('Team deleted'); loadTeams();
  } catch (e) { showMsg(e.message, false); }   // teams with players/matches are refused by the FOREIGN KEYs
}

/* ---------------- PLAYERS ---------------- */
async function loadPlayers() {
  const team = document.getElementById('filterTeam').value;
  const q = document.getElementById('search').value;
  const rows = await api(`/api/players?team_id=${encodeURIComponent(team)}&search=${encodeURIComponent(q)}`);
  const html = rows.map((p) =>
    `<tr><td>${p.player_id}</td><td>${esc(p.full_name)}</td><td>${esc(p.player_role)}</td><td>${esc(p.team)}</td>` +
    `<td><button class="small" onclick="showProfile(${p.player_id})">Profile</button> ` +
    `<button class="small" onclick="editPlayer(${p.player_id}, ${p.team_id})">Change role</button> ` +
    `<button class="small danger" onclick="deletePlayer(${p.player_id})">Delete</button></td></tr>`).join('');
  document.getElementById('players').innerHTML =
    `<table><tr><th>ID</th><th>Name</th><th>Role</th><th>Team</th><th></th></tr>${html}</table>`;
}

async function showProfile(id) {
  const p = await api(`/api/players/${id}`);
  document.getElementById('profile').innerHTML =
    `<b>${esc(p.full_name)}</b> (${esc(p.team_name)}, ${esc(p.player_role)}) - innings: ${p.innings}, runs: ${p.runs}, wickets: ${p.wickets}`;
}

async function addPlayer() {
  try {
    await api('/api/players', 'POST', {
      full_name: document.getElementById('pName').value,
      player_role: document.getElementById('pRole').value,
      team_id: document.getElementById('pTeam').value });
    showMsg('Player added'); loadPlayers(); loadTeams();
  } catch (e) { showMsg(e.message, false); }
}

async function editPlayer(id, teamId) {
  const role = prompt('New role (BATTER, BOWLER, ALLROUNDER, KEEPER)');
  if (!role) return;
  const current = (await api(`/api/players/${id}`));
  try {
    await api(`/api/players/${id}`, 'PUT', { full_name: current.full_name, player_role: role.toUpperCase(), team_id: teamId });
    showMsg('Player updated'); loadPlayers();
  } catch (e) { showMsg(e.message, false); }   // an invalid role is rejected by CHECK ck_player_role
}

async function deletePlayer(id) {
  if (!confirm('Delete this player?')) return;
  try {
    await api(`/api/players/${id}`, 'DELETE');
    showMsg('Player deleted'); loadPlayers(); loadTeams();
  } catch (e) { showMsg(e.message, false); }   // players with scorecards are refused
}

/* ---------------- VENUES ---------------- */
async function loadVenues() {
  const rows = await api('/api/venues');
  const html = rows.map((v) =>
    `<tr><td>${v.venue_id}</td><td>${esc(v.venue_name)}</td><td>${esc(v.city)}</td><td>${esc(v.country)}</td>` +
    `<td>${esc(v.capacity ?? '')}</td><td><button class="small danger" onclick="deleteVenue(${v.venue_id})">Delete</button></td></tr>`).join('');
  document.getElementById('venues').innerHTML =
    `<table><tr><th>ID</th><th>Name</th><th>City</th><th>Country</th><th>Capacity</th><th></th></tr>${html}</table>`;
}

async function addVenue() {
  try {
    await api('/api/venues', 'POST', {
      venue_name: document.getElementById('vName').value, city: document.getElementById('vCity').value,
      country: document.getElementById('vCountry').value, capacity: document.getElementById('vCap').value || null });
    showMsg('Venue added'); loadVenues();
  } catch (e) { showMsg(e.message, false); }
}

async function deleteVenue(id) {
  if (!confirm('Delete this venue?')) return;
  try {
    await api(`/api/venues/${id}`, 'DELETE');
    showMsg('Venue deleted'); loadVenues();
  } catch (e) { showMsg(e.message, false); }   // venues used by matches are refused
}

loadTeams().then(loadPlayers);
loadVenues();
