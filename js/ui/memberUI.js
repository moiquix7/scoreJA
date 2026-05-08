// ========== MEMBER UI ==========
function populateMemberGPSelect() {
  const options = participants.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  const defaultOption = '<option value="">Seleccionar GP</option>';
  ['memberGp', 'editMemberGp'].forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = defaultOption + options;
    if (participants.some(p => String(p.id) === String(currentValue))) {
      select.value = String(currentValue);
    }
  });
  refreshMemberReportGPFilter();
}

function renderMembers() {
  const el = document.getElementById('memberList');
  if (!members.length) {
    el.innerHTML = '<div class="empty-state">No hay miembros registrados.</div>';
    renderMemberReportTable();
    return;
  }
  el.innerHTML = `<table>
    <tr><th>#</th><th>Nombre</th><th>Apellido</th><th>GP</th><th>Acciones</th></tr>
    ${members.map((m, i) => {
      const gp = participants.find(p => p.id === m.gpId);
      const gpName = gp ? gp.name : (m.gpName || 'GP no disponible');
      return `<tr>
        <td>${i + 1}</td>
        <td>${esc(m.nombre || '')}</td>
        <td>${esc(m.apellido || '')}</td>
        <td>${esc(gpName)}</td>
        <td><div class="action-btns">
          <button class="btn btn-edit" onclick="editMember(${m.id})">✏️</button>
          <button class="btn btn-danger" onclick="removeMember(${m.id})">✕</button>
        </div></td>
      </tr>`;
    }).join('')}
  </table>`;
  renderMemberReportTable();
}

function refreshMemberReportGPFilter() {
  const select = document.getElementById('memberReportGpFilter');
  if (!select) return;
  const prevVal = select.value;
  select.innerHTML = '<option value="">Todos</option>' +
    participants.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  if (prevVal === '' || participants.some(p => String(p.id) === String(prevVal))) {
    select.value = prevVal;
  }
  renderMemberReportTable();
}

function getFilteredMembersForReport() {
  const filterEl = document.getElementById('memberReportGpFilter');
  const gpId = filterEl ? filterEl.value : '';
  return gpId
    ? members.filter(m => String(m.gpId) === String(gpId))
    : members.slice();
}

function filterMemberReportByGP() {
  renderMemberReportTable();
}

function renderMemberReportTable() {
  const wrap = document.getElementById('memberReportTableWrap');
  if (!wrap) return;

  const filtered = getFilteredMembersForReport();
  if (!filtered.length) {
    wrap.innerHTML = '<div class="empty-state">No hay miembros para el filtro seleccionado.</div>';
    return;
  }

  wrap.innerHTML = `<table>
    <tr><th>#</th><th>Nombre</th><th>Apellido</th><th>GP</th></tr>
    ${filtered.map((m, i) => {
      const gp = participants.find(p => p.id === m.gpId);
      const gpName = gp ? gp.name : (m.gpName || 'GP no disponible');
      return `<tr>
        <td>${i + 1}</td>
        <td>${esc(m.nombre || '')}</td>
        <td>${esc(m.apellido || '')}</td>
        <td>${esc(gpName)}</td>
      </tr>`;
    }).join('')}
  </table>`;
}

function printMembersReportPDF() {
  const filtered = getFilteredMembersForReport();
  if (!filtered.length) return alert('No hay miembros para imprimir.');

  const filterEl = document.getElementById('memberReportGpFilter');
  const gpId = filterEl ? filterEl.value : '';
  const gp = participants.find(p => String(p.id) === String(gpId));
  const groupLabel = gp ? gp.name : 'Todos los grupos';

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Manejo de Puntos - JA Vinto Central', 14, 15);
  doc.setFontSize(10);
  doc.text('Reporte de Miembros', 14, 22);
  doc.text('Grupo: ' + groupLabel, 14, 28);
  doc.text('Fecha de generación: ' + new Date().toLocaleString('es-BO'), 14, 34);

  doc.autoTable({
    startY: 40,
    head: [['#', 'Nombre', 'Apellido', 'GP']],
    body: filtered.map((m, i) => {
      const memberGp = participants.find(p => p.id === m.gpId);
      const gpName = memberGp ? memberGp.name : (m.gpName || 'GP no disponible');
      return [String(i + 1), m.nombre || '', m.apellido || '', gpName];
    }),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 245, 249] }
  });

  const safeGroup = groupLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  doc.save('reporte_miembros_' + safeGroup + '.pdf');
}
