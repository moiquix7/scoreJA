// ========== VER ACTIVIDADES UI ==========
function renderVerActividades() {
  const wrap = document.getElementById('verActividadesTableWrap');
  // Ocultar las actividades que contengan el texto "senior", el resto se muestran
  const visibleActivities = activities.filter(a => !(a.name || '').toLowerCase().includes('senior'));
  // Ocultar los participantes que contengan el texto "senior", el resto se muestran
  const visibleParticipants = participants.filter(p => !(p.name || '').toLowerCase().includes('senior'));
  if (!visibleActivities.length || !visibleParticipants.length) {
    wrap.innerHTML = '<div class="empty-state">No hay actividades o GP registrados.</div>';
    return;
  }

  let html = `<table id="verActividadesTable">
    <tr>
      <th>Actividad</th>
      <th>Tipo</th>
      ${visibleParticipants.map(p => `<th style="text-align:center;">${logoHTML(p)}<br>${esc(p.name)}</th>`).join('')}
    </tr>
    ${visibleActivities.map(a => {
      const cells = visibleParticipants.map(p => {
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
      ${visibleParticipants.map(p => {
        const total = visibleActivities.reduce((sum, a) => sum + (points[p.id + '-' + a.id] || 0), 0);
        return `<td style="text-align:center;font-weight:900;">${total}</td>`;
      }).join('')}
    </tr>
  </table>`;

  wrap.innerHTML = html;
}

function printActivitiesTable() {
  const { jsPDF } = window.jspdf;
  // Ocultar las actividades y participantes que contengan el texto "senior"
  const visibleActivities = activities.filter(a => !(a.name || '').toLowerCase().includes('senior'));
  const visibleParticipants = participants.filter(p => !(p.name || '').toLowerCase().includes('senior'));
  const doc = new jsPDF({ orientation: visibleParticipants.length > 4 ? 'landscape' : 'portrait' });

  doc.setFontSize(16);
  doc.text('Manejo de Puntos - JA Vinto Central', 14, 15);
  doc.setFontSize(10);
  doc.text('Reporte de Actividades y Puntos', 14, 22);
  doc.text('Fecha: ' + new Date().toLocaleDateString('es-BO'), 14, 28);

  const headers = ['Actividad', 'Tipo', ...visibleParticipants.map(p => p.name)];

  const body = visibleActivities.map(a => {
    const row = [a.name, a.type];
    visibleParticipants.forEach(p => {
      row.push((points[p.id + '-' + a.id] || 0).toString());
    });
    return row;
  });

  const totalRow = ['TOTAL', ''];
  visibleParticipants.forEach(p => {
    const total = visibleActivities.reduce((sum, a) => sum + (points[p.id + '-' + a.id] || 0), 0);
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
