// ========== ATTENDANCE UI ==========
function normalizeAttendanceSearchText(value) {
  return String(value || '').toLowerCase().trim();
}

function attendanceMemberMatchesName(member, nameFilter) {
  if (!nameFilter) return true;
  const fullName = `${member.nombre || ''} ${member.apellido || ''}`.trim().toLowerCase();
  return fullName.includes(nameFilter);
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
  const groups = participants.map(p => ({
    id: p.id,
    name: p.name,
    members: members.filter(m => String(m.gpId) === String(p.id))
  })).filter(g => g.members.length > 0);

  if (!groups.length) return alert('No hay miembros registrados para imprimir asistencia.');

  // Fetch all attendance data from Firebase for all dates
  db.ref('ja_attendance').once('value').then(snap => {
    const allData = snap.val() || {};

    // Build punctual member sets per type: { JA: { memberId: Set(dates) }, EscuelaSabatica: { memberId: Set(dates) } }
    const punctualByType = { JA: {}, EscuelaSabatica: {} };

    Object.keys(allData).forEach(date => {
      const dateData = allData[date];
      if (!dateData || typeof dateData !== 'object') return;

      // Handle legacy data (direct member booleans = JA)
      const isLegacy = isLegacyAttendanceData(dateData);
      if (isLegacy) {
        Object.keys(dateData).forEach(memberId => {
          if (dateData[memberId] === true) {
            if (!punctualByType.JA[memberId]) punctualByType.JA[memberId] = new Set();
            punctualByType.JA[memberId].add(date);
          }
        });
      }

      // Handle typed data
      ['JA', 'EscuelaSabatica'].forEach(type => {
        const typeData = dateData[type];
        if (!typeData || typeof typeData !== 'object') return;
        const membersData = (typeData.members && typeof typeData.members === 'object')
          ? typeData.members
          : null;
        if (!membersData) return;
        Object.keys(membersData).forEach(memberId => {
          if (membersData[memberId] === true) {
            if (!punctualByType[type][memberId]) punctualByType[type][memberId] = new Set();
            punctualByType[type][memberId].add(date);
          }
        });
      });
    });

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Manejo de Puntos - JA Vinto Central', 14, 15);
    doc.setFontSize(10);
    doc.text('Reporte de Asistencia por Grupo - Solo Puntuales (Todas las fechas)', 14, 22);
    doc.text('Fecha de generación: ' + new Date().toLocaleString('es-BO'), 14, 28);

    let y = 36;

    const categories = [
      { key: 'EscuelaSabatica', label: 'Escuela Sabática' },
      { key: 'JA', label: 'JA' }
    ];

    categories.forEach((cat, catIndex) => {
      const punctualMembers = punctualByType[cat.key];

      if (catIndex > 0) {
        if (y > 250) {
          doc.addPage();
          y = 20;
        }
        y += 4;
      }

      doc.setFontSize(14);
      doc.setTextColor(99, 102, 241);
      doc.text('📌 ' + cat.label, 14, y);
      doc.setTextColor(0, 0, 0);
      y += 8;

      let catTotal = 0;
      let catTotalPunctualEvents = 0;
      let groupsWithPunctualMembers = 0;

      groups.forEach(group => {
        // Filter only punctual members in this group for this category
        const punctualInGroup = group.members.filter(m => (punctualMembers[String(m.id)]?.size || 0) > 0);

        if (punctualInGroup.length === 0) return;
        groupsWithPunctualMembers += 1;

        if (y > 260) {
          doc.addPage();
          y = 20;
        }

        doc.setFontSize(11);
        doc.text('GP: ' + group.name, 14, y);
        y += 3;

        const rows = punctualInGroup.map(m => {
          const datesSet = punctualMembers[String(m.id)];
          const dates = datesSet ? Array.from(datesSet).sort() : [];
          return [m.nombre || '', m.apellido || '', String(dates.length), dates.join(', ')];
        });

        catTotal += punctualInGroup.length;
        const groupPunctualEvents = rows.reduce((sum, row) => {
          const [, , punctualCount] = row;
          return sum + Number(punctualCount);
        }, 0);
        catTotalPunctualEvents += groupPunctualEvents;

        doc.autoTable({
          startY: y + 2,
          head: [['Nombre', 'Apellido', 'Veces Puntual', 'Fechas']],
          body: rows,
          styles: { fontSize: 8, cellPadding: 2.5 },
          headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
          alternateRowStyles: { fillColor: [241, 245, 249] },
          columnStyles: {
            3: { cellWidth: 60 }
          }
        });

        y = doc.lastAutoTable.finalY + 6;
        doc.setFontSize(10);
        doc.text(`Resumen ${group.name}: ${punctualInGroup.length} miembros puntuales / ${groupPunctualEvents} puntualidades`, 14, y);
        y += 8;
      });

      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(11);
      doc.text(`Total ${cat.label}: ${catTotal} miembros puntuales / ${catTotalPunctualEvents} puntualidades en ${groupsWithPunctualMembers} GP`, 14, y);
      y += 6;
    });

    doc.save('asistencia_puntuales_todas_fechas.pdf');
  }).catch(err => {
    console.error('Error generando reporte de asistencia:', err);
    alert('Error al generar el reporte. Revisa la consola para más detalles.');
  });
}
