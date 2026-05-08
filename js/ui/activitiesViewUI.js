// ========== VER ACTIVIDADES UI ==========
function renderVerActividades() {
  const wrap = document.getElementById('verActividadesTableWrap');
  if (!activities.length || !participants.length) {
    wrap.innerHTML = '<div class="empty-state">No hay actividades o participantes registrados.</div>';
    return;
  }

  let html = `<table id="verActividadesTable">
    <tr>
      <th>Actividad</th>
      <th>Tipo</th>
      ${participants.map(p => `<th style="text-align:center;">${logoHTML(p)}<br>${esc(p.name)}</th>`).join('')}
    </tr>
    ${activities.map(a => {
      const cells = participants.map(p => {
        const val = points[p.id + '-' + a.id] || 0;
        return `<td style="text-align:center;font-weight:700;color:var(--${a.type.toLowerCase()})">${val}</td>`;
      }).join('');
      return `<tr>
        <td>${esc(a.name)}</td>
        <td><span class="badge badge-${a.type.toLowerCase()}">${a.type}</span></td>
        ${cells}
      </tr>`;
    }).join('')}
    <tr style="border-top:2px solid var(--border);">
      <td colspan="2" style="font-weight:900;">TOTAL</td>
      ${participants.map(p => {
        const total = activities.reduce((sum, a) => sum + (points[p.id + '-' + a.id] || 0), 0);
        return `<td style="text-align:center;font-weight:900;">${total}</td>`;
      }).join('')}
    </tr>
  </table>`;

  wrap.innerHTML = html;
}

function printActivitiesTable() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: participants.length > 4 ? 'landscape' : 'portrait' });

  doc.setFontSize(16);
  doc.text('Manejo de Puntos - JA Vinto Central', 14, 15);
  doc.setFontSize(10);
  doc.text('Reporte de Actividades y Puntos', 14, 22);
  doc.text('Fecha: ' + new Date().toLocaleDateString('es-BO'), 14, 28);

  const headers = ['Actividad', 'Tipo', ...participants.map(p => p.name)];

  const body = activities.map(a => {
    const row = [a.name, a.type];
    participants.forEach(p => {
      row.push((points[p.id + '-' + a.id] || 0).toString());
    });
    return row;
  });

  const totalRow = ['TOTAL', ''];
  participants.forEach(p => {
    const total = activities.reduce((sum, a) => sum + (points[p.id + '-' + a.id] || 0), 0);
    totalRow.push(total.toString());
  });
  body.push(totalRow);

  doc.autoTable({
    head: [headers],
    body: body,
    startY: 33,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 245, 249] },
    columnStyles: { 0: { fontStyle: 'bold' } }
  });

  doc.save('puntos_ja_vinto_central.pdf');
}
