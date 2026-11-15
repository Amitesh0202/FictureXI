// common.js - small helpers shared by every page.

// Call the backend. Returns the JSON, or throws an Error with the server's message.
async function api(url, method = 'GET', body) {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Show a green (ok) or red (error) message box at the top of the page.
function showMsg(text, ok = true) {
  const box = document.getElementById('msg');
  box.textContent = text;
  box.className = ok ? 'ok' : 'err';
}

// Make text safe to put inside HTML.
function esc(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

// Build an HTML table. cols = [['key', 'Heading'], ...]
function makeTable(rows, cols) {
  if (!rows.length) return '<p>No data.</p>';
  const head = cols.map((c) => `<th>${c[1]}</th>`).join('');
  const body = rows.map((r) => '<tr>' + cols.map((c) => `<td>${esc(r[c[0]])}</td>`).join('') + '</tr>').join('');
  return `<table><tr>${head}</tr>${body}</table>`;
}

// Fill a <select> with options. items = rows, value/label = column names.
function fillSelect(select, items, value, label, blank) {
  let html = blank ? `<option value="">${blank}</option>` : '';
  html += items.map((i) => `<option value="${esc(i[value])}">${esc(i[label])}</option>`).join('');
  select.innerHTML = html;
}

// Top menu on every page.
function menu(active) {
  const pages = [['index.html', 'Tournaments'], ['match.html', 'Scorecard'], ['teams.html', 'Teams & Players'],
                 ['reports.html', 'Reports'], ['integrity.html', 'Integrity Lab']];
  document.body.insertAdjacentHTML('afterbegin',
    '<header><b>FixtureXI</b> &nbsp; ' +
    pages.map((p) => `<a href="${p[0]}" class="${p[0] === active ? 'active' : ''}">${p[1]}</a>`).join('') +
    '</header>');
}
