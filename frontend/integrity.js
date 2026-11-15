// integrity.js - Workflow 4: run invalid operations and show how the database rejects them.
menu('integrity.html');

async function loadTests() {
  const tests = await api('/api/integrity-lab');
  document.getElementById('tests').innerHTML = tests.map((t) =>
    `<div style="border-bottom:1px solid #ddd; padding:8px 0">
       <b>${t.n}. ${esc(t.title)}</b><br>
       <code>${esc(t.sql.replace(/\s+/g, ' '))}</code><br>
       Expected: ${esc(t.expect)}<br>
       <button class="small" onclick="runTest(${t.n})">Run</button>
       <span id="result${t.n}"></span>
     </div>`).join('');
}

async function runTest(n) {
  const out = document.getElementById('result' + n);
  out.textContent = 'running...';
  try {
    const r = await api(`/api/integrity-lab/${n}`, 'POST');
    out.innerHTML = r.rejected
      ? `<b style="color:#1a7f37">REJECTED</b> - ${esc(r.oracle_error)}`
      : `<b style="color:#a12a2a">NOT REJECTED</b> - ${esc(r.message)}`;
  } catch (e) { out.textContent = e.message; }
}

loadTests().catch((e) => showMsg(e.message, false));
