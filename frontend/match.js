// match.js - Workflow 2: view a scorecard, or enter one for a scheduled match.
menu('match.html');

const matchId = new URLSearchParams(location.search).get('id');
const HOW_OUT = ['not out', 'bowled', 'caught', 'lbw', 'run out', 'stumped'];
let data;   // { match, batting, bowling, players }

async function loadMatch() {
  if (!matchId) return;
  data = await api(`/api/matches/${matchId}`);
  const m = data.match;

  document.getElementById('header').innerHTML =
    `<h2>${esc(m.team1)} v ${esc(m.team2)}</h2>` +
    `<p>Round ${m.round_no} &middot; ${esc(m.match_date)} &middot; Venue: ${esc(m.venue)} &middot; Status: <b>${esc(m.status)}</b></p>` +
    (m.status === 'COMPLETED'
      ? `<p>${esc(m.team1)} ${esc(m.team1_score)} &nbsp; v &nbsp; ${esc(m.team2)} ${esc(m.team2_score)} &nbsp; Winner: <b>${esc(m.winner || 'Tie')}</b></p>`
      : '');

  if (m.status === 'COMPLETED') showScorecard();
  else showEntryForm();
}

function showScorecard() {
  const m = data.match;
  let html = '';
  [[m.team1_id, m.team1], [m.team2_id, m.team2]].forEach(([teamId, code]) => {
    html += `<h3>${esc(code)} batting</h3>` +
      makeTable(data.batting.filter((b) => b.team_id === teamId),
        [['full_name', 'Batter'], ['how_out', 'How out'], ['runs', 'Runs'], ['balls', 'Balls'], ['fours', '4s'], ['sixes', '6s']]);
    // the other team's bowlers bowled to this team
    html += `<h3>Bowling (against ${esc(code)})</h3>` +
      makeTable(data.bowling.filter((b) => b.team_id !== teamId),
        [['full_name', 'Bowler'], ['overs', 'Overs'], ['runs_conceded', 'Runs'], ['wickets', 'Wickets']]);
  });
  document.getElementById('card').innerHTML = html;
}

// ---------- entry form (only for SCHEDULED matches) ----------
function showEntryForm() {
  document.getElementById('card').innerHTML = '<p>This match has no result yet. Fill in the scorecard below.</p>';
  const m = data.match;
  const box = document.getElementById('entry');
  box.style.display = 'block';

  let html = '<h3>Enter scorecard</h3><p>Batting: leave <b>Runs</b> empty for players who did not bat. Bowling: 5 rows per team.</p>';
  [[m.team1_id, m.team1, m.team2_id], [m.team2_id, m.team2, m.team1_id]].forEach(([teamId, code, oppId], k) => {
    html += `<h3>${esc(code)} innings</h3>` +
      `Extras <input id="extras${k}" type="number" min="0" value="0" style="width:60px">` +
      '<table><tr><th>Batter</th><th>Runs</th><th>Balls</th><th>4s</th><th>6s</th><th>How out</th></tr>';
    data.players.filter((p) => p.team_id === teamId).forEach((p) => {
      html += `<tr class="bat${k}" data-player="${p.player_id}"><td>${esc(p.full_name)}</td>` +
        '<td><input type="number" min="0" class="runs" style="width:60px"></td>' +
        '<td><input type="number" min="0" class="balls" style="width:60px"></td>' +
        '<td><input type="number" min="0" class="fours" style="width:50px"></td>' +
        '<td><input type="number" min="0" class="sixes" style="width:50px"></td>' +
        `<td><select class="how">${HOW_OUT.map((h) => `<option>${h}</option>`).join('')}</select></td></tr>`;
    });
    html += '</table>';

    html += `<p><b>Bowlers of the other side</b> (bowling to ${esc(code)})</p><table>` +
      '<tr><th>Bowler</th><th>Overs</th><th>Runs conceded</th><th>Wickets</th></tr>';
    const options = data.players.filter((p) => p.team_id === oppId)
      .map((p) => `<option value="${p.player_id}">${esc(p.full_name)}</option>`).join('');
    for (let i = 0; i < 5; i++) {
      html += `<tr class="bowl${k}"><td><select class="bplayer">${options}</select></td>` +
        '<td><input type="number" min="0" step="0.1" class="overs" style="width:60px" value="4"></td>' +
        '<td><input type="number" min="0" class="rc" style="width:60px"></td>' +
        '<td><input type="number" min="0" max="10" class="wk" style="width:60px" value="0"></td></tr>';
    }
    html += '</table>';
  });
  html += '<p><button onclick="submitResult()">Save scorecard</button></p>';
  box.innerHTML = html;
}

function readInnings(k) {
  const batting = [];
  document.querySelectorAll(`tr.bat${k}`).forEach((row) => {
    const runs = row.querySelector('.runs').value;
    if (runs === '') return;                        // did not bat
    batting.push({
      player_id: Number(row.dataset.player), runs: Number(runs),
      balls: Number(row.querySelector('.balls').value || 0),
      fours: Number(row.querySelector('.fours').value || 0),
      sixes: Number(row.querySelector('.sixes').value || 0),
      how_out: row.querySelector('.how').value,
    });
  });
  const bowling = [];
  document.querySelectorAll(`tr.bowl${k}`).forEach((row) => {
    if (row.querySelector('.rc').value === '') return;   // skip unused rows
    bowling.push({
      player_id: Number(row.querySelector('.bplayer').value),
      overs: Number(row.querySelector('.overs').value),
      runs_conceded: Number(row.querySelector('.rc').value),
      wickets: Number(row.querySelector('.wk').value),
    });
  });
  return { batting, bowling };
}

async function submitResult() {
  const a = readInnings(0), b = readInnings(1);
  try {
    // one request = one database transaction (all cards + COMPLETE_MATCH)
    await api(`/api/matches/${matchId}/result`, 'POST', {
      team1_extras: Number(document.getElementById('extras0').value),
      team2_extras: Number(document.getElementById('extras1').value),
      batting: a.batting.concat(b.batting),
      bowling: a.bowling.concat(b.bowling),
    });
    showMsg('Scorecard saved and result recorded');
    document.getElementById('entry').style.display = 'none';
    loadMatch();
  } catch (e) { showMsg(e.message, false); }   // e.g. trigger error: batter not in this match
}

loadMatch().catch((e) => showMsg(e.message, false));
