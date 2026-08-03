(function () {
  function csvCell(value) { return `"${String(value || '').replace(/"/g, '""').replace(/\s+/g, ' ').trim()}"`; }
  function exportCurrentView() {
    const tables = Array.from(document.querySelectorAll('#panel-body table')).filter(table => table.offsetParent !== null);
    if (!tables.length) {
      alert('This page does not currently contain a table to export.');
      return;
    }
    const rows = [];
    tables.forEach((table, tableIndex) => {
      if (tableIndex) rows.push([]);
      table.querySelectorAll('tr').forEach(row => rows.push(Array.from(row.querySelectorAll('th,td')).map(cell => cell.innerText)));
    });
    const csv = `\uFEFF${rows.map(row => row.map(csvCell).join(',')).join('\r\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const title = document.getElementById('panel-title')?.textContent || 'farmer-report';
    link.href = url;
    link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
  window.FarmSenseDashboardExport = { exportCurrentView };
})();
