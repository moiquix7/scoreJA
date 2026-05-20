// ========== ATTENDANCE UI ==========
function normalizeAttendanceSearchText(value) {
  return String(value || '').toLowerCase().trim();
}

function attendanceMemberMatchesName(member, nameFilter) {
  if (!nameFilter) return true;
  const fullName = `${member.nombre || ''} ${member.apellido || ''}`.trim().toLowerCase();
  return fullName.includes(nameFilter);
}

function renderMostPunctualMember(result) {
  const wrap = document.getElementById('mostPunctualWrap');
  if (!wrap) return;
  if (!result || !result.memberId) {
    wrap.innerHTML = '<div class="empty-state">No hay datos de asistencia suficientes.</div>';
    return;
  }
  const member = members.find(m => String(m.id) === String(result.memberId));
  if (!member) {
    wrap.innerHTML = '<div class="empty-state">No hay datos de asistencia suficientes.</div>';
    return;
  }
  const gp = participants.find(p => p.id === member.gpId);
  const gpName = gp ? gp.name : (member.gpName || 'Sin GP');
  wrap.innerHTML = `<div class="most-punctual-badge">
    <div class="most-punctual-icon">⭐</div>
    <div class="most-punctual-info">
      <div class="most-punctual-name">${esc((member.nombre || '') + ' ' + (member.apellido || ''))}</div>
      <div class="most-punctual-gp">${esc(gpName)}</div>
      <div class="most-punctual-count">${result.count} asistencia${result.count !== 1 ? 's' : ''} puntual${result.count !== 1 ? 'es' : ''}</div>
    </div>
  </div>`;
}

function renderAsistencia() {
  // Set default date to today if not set
  const dateInput = document.getElementById('attendanceDate');
  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }
  const typeInput = document.getElementById('attendanceType');

  attendanceCurrentDate = dateInput.value;
  attendanceCurrentType = typeInput ? typeInput.value : '';

  // Populate GP filter
  const gpFilter = document.getElementById('attendanceGPFilter');
  const prevVal = gpFilter.value;
  gpFilter.innerHTML = '<option value="">Todos</option>' +
    participants.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  if (prevVal) gpFilter.value = prevVal;

  loadAttendanceHistory();
  loadAttendance(attendanceCurrentDate);
}

function getFilteredAttendanceMembers() {
  const gpFilter = document.getElementById('attendanceGPFilter');
  const gpId = gpFilter ? gpFilter.value : '';
  const hasGpFilter = !!gpId;
  const nameInput = document.getElementById('attendanceNameFilter');
  const nameFilter = normalizeAttendanceSearchText(nameInput ? nameInput.value : '');
  const gpFiltered = gpId
    ? members.filter(m => String(m.gpId) === String(gpId))
    : members.slice();
  return {
    filteredMembers: gpFiltered.filter(m => attendanceMemberMatchesName(m, nameFilter)),
    hasNameFilter: !!nameFilter,
    hasGpFilter
  };
}

function applyAttendanceFilters() {
  const { filteredMembers, hasNameFilter, hasGpFilter } = getFilteredAttendanceMembers();

  const wrap = document.getElementById('attendanceTableWrap');
  if (!attendanceCurrentType) {
    wrap.innerHTML = '<p style="color:var(--muted);text-align:center;padding:1rem;">Selecciona el tipo de evento para ver el control de asistencia.</p>';
    updateAttendanceSummary([]);
    return;
  }

  if (filteredMembers.length === 0) {
    wrap.innerHTML = `<p style="color:var(--muted);text-align:center;padding:1rem;">${
      hasNameFilter || hasGpFilter
        ? 'No hay miembros que coincidan con los filtros seleccionados.'
        : 'No hay miembros registrados.'
    }</p>`;
    updateAttendanceSummary(filteredMembers);
    return;
  }

  wrap.innerHTML = `<table>
    <tr><th>Miembro</th><th>GP</th><th>Asistencia</th><th>Estado</th></tr>
    ${filteredMembers.map(m => {
      const gp = participants.find(p => p.id === m.gpId);
      const gpName = gp ? gp.name : (m.gpName || 'Sin GP');
      const present = !!attendanceData[m.id];
      return `<tr id="att-row-${m.id}">
        <td>${esc((m.nombre || '') + ' ' + (m.apellido || ''))}</td>
        <td>${esc(gpName)}</td>
        <td>
          <label class="toggle-switch">
            <input type="checkbox" aria-label="Marcar asistencia de ${esc((m.nombre || '') + ' ' + (m.apellido || ''))}" ${present ? 'checked' : ''} onchange="toggleAttendance(${m.id}, this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </td>
        <td id="att-status-${m.id}" style="font-weight:700;color:${present ? 'var(--relacion)' : 'var(--danger)'};">
          ${present ? 'Puntual' : 'Retrasado'}
        </td>
      </tr>`;
    }).join('')}
  </table>`;

  updateAttendanceSummary(filteredMembers);
}

function filterAttendanceByGP() {
  applyAttendanceFilters();
}

function filterAttendanceByName() {
  applyAttendanceFilters();
}

function updateAttendanceSummary(filteredMembers) {
  const total = filteredMembers.length;
  const present = filteredMembers.filter(m => !!attendanceData[m.id]).length;
  const absent = total - present;
  document.getElementById('att-total').textContent = total;
  document.getElementById('att-present').textContent = present;
  document.getElementById('att-absent').textContent = absent;
}

function renderAttendanceHistory() {
  const wrap = document.getElementById('attendanceHistoryWrap');
  if (!wrap) return;
  if (!attendanceHistory.length) {
    wrap.innerHTML = '<div class="empty-state">No hay historial de asistencia registrado.</div>';
    return;
  }

  wrap.innerHTML = `<table>
    <tr><th>Fecha</th><th>Tipo de Evento</th><th>Registros</th><th>Acción</th></tr>
    ${attendanceHistory.map(item => {
      const dateKey = encodeURIComponent(item.date);
      const typeKey = encodeURIComponent(item.type);
      return `<tr>
      <td>${esc(item.date)}</td>
      <td>${esc(item.label)}</td>
      <td>${item.total}</td>
      <td><button class="btn btn-edit" onclick="selectAttendanceHistoryFromEncoded('${dateKey}','${typeKey}')">Cargar</button></td>
    </tr>`;
    }).join('')}
  </table>`;
}

function selectAttendanceHistoryFromEncoded(encodedDate, encodedType) {
  selectAttendanceHistory(decodeURIComponent(encodedDate), decodeURIComponent(encodedType));
}

function printAttendanceByGroupPDF() {
  const dateInput = document.getElementById('attendanceDate');
  const date = dateInput ? dateInput.value : '';
  const type = document.getElementById('attendanceType').value;
  if (!date || !type) return alert('Selecciona fecha y tipo de evento.');

  const groups = participants.map(p => ({
    id: p.id,
    name: p.name,
    members: members.filter(m => String(m.gpId) === String(p.id))
  })).filter(g => g.members.length > 0);

  if (!groups.length) return alert('No hay miembros registrados para imprimir asistencia.');

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Manejo de Puntos - JA Vinto Central', 14, 15);
  doc.setFontSize(10);
  doc.text('Reporte de Asistencia por Grupo', 14, 22);
  doc.text('Fecha: ' + date, 14, 28);
  doc.text('Tipo de evento: ' + getAttendanceTypeLabel(type), 14, 34);

  let y = 40;
  let totalPresent = 0;
  let totalAbsent = 0;

  groups.forEach(group => {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.text('GP: ' + group.name, 14, y);
    y += 3;

    const rows = group.members.map(m => {
      const present = !!attendanceData[m.id];
      return [m.nombre || '', m.apellido || '', present ? 'Puntual ✅' : 'Retrasado ❌'];
    });

    const groupPresent = rows.filter(r => r[2].includes('Puntual')).length;
    const groupAbsent = rows.length - groupPresent;
    totalPresent += groupPresent;
    totalAbsent += groupAbsent;

    doc.autoTable({
      startY: y + 2,
      head: [['Nombre', 'Apellido', 'Estado']],
      body: rows,
      styles: { fontSize: 9, cellPadding: 2.8 },
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [241, 245, 249] }
    });

    y = doc.lastAutoTable.finalY + 6;
    doc.setFontSize(10);
    doc.text(`Resumen ${group.name}: Puntuales ${groupPresent} | Retrasado ${groupAbsent}`, 14, y);
    y += 8;
  });

  if (y > 270) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(11);
  doc.text(`Total general: Puntuales ${totalPresent} | Retrasados ${totalAbsent} | Total ${totalPresent + totalAbsent}`, 14, y);

  doc.save(`asistencia_${sanitizeFilename(date)}_${sanitizeFilename(type)}.pdf`);
}
