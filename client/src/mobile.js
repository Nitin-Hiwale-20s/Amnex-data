// Mobile helper: copies each column heading onto the cells under it (data-label),
// so on a phone the CSS can show every table row as a small card instead of a wide table.
function label(table) {
  const heads = [...table.querySelectorAll('thead th')].map(th => th.textContent.trim());
  if (!heads.length) return;
  table.querySelectorAll('tbody tr').forEach(tr => {
    let col = 0;
    [...tr.children].forEach(td => {
      const span = td.colSpan || 1;
      if (span > 1) td.dataset.full = '1';          // "No data" / total rows
      else td.dataset.label = heads[col] || '';
      col += span;
    });
  });
}

export function initMobileTables() {
  const root = document.getElementById('root');
  if (!root) return;
  let queued = false;
  const run = () => { queued = false; root.querySelectorAll('.tbl table').forEach(label); };
  new MutationObserver(() => { if (!queued) { queued = true; requestAnimationFrame(run); } })
    .observe(root, { childList: true, subtree: true });
  run();
}
