// reports.js - Workflow 3: points table and leaders (queries Q1-Q5).
menu('reports.html');

async function loadReports() {
  const id = document.getElementById('tSelect').value;
  if (!id) return;
  try {
    const base = `/api/reports/${id}`;
    document.getElementById('standings').innerHTML = makeTable(await api(`${base}/standings`),
      [['pos', 'Pos'], ['short_code', 'Team'], ['played', 'P'], ['won', 'W'], ['tied', 'T'], ['lost', 'L'], ['points', 'Pts']]);
    document.getElementById('runs').innerHTML = makeTable(await api(`${base}/run-scorers`),
      [['rnk', '#'], ['full_name', 'Player'], ['short_code', 'Team'], ['innings', 'Inns'], ['runs', 'Runs'], ['highest', 'HS']]);
    document.getElementById('wickets').innerHTML = makeTable(await api(`${base}/wicket-leaders`),
      [['full_name', 'Bowler'], ['wickets', 'Wickets'], ['runs_conceded', 'Runs conceded']]);
    document.getElementById('totals').innerHTML = makeTable(await api(`${base}/highest-totals`),
      [['rn', '#'], ['team', 'Team'], ['score', 'Score'], ['match_date', 'Date'], ['venue_name', 'Venue']]);
    document.getElementById('ever').innerHTML = makeTable(await api(`${base}/ever-present`),
      [['full_name', 'Batter'], ['short_code', 'Team']]);
  } catch (e) { showMsg(e.message, false); }
}

(async () => {
  const tournaments = await api('/api/tournaments');
  fillSelect(document.getElementById('tSelect'), tournaments, 'tournament_id', 'tournament_name');
  loadReports();
})();
