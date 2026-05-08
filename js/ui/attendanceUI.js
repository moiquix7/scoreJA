// ========== ATTENDANCE UI ==========
function renderAsistencia() {
  // Set default date to today if not set
  const dateInput = document.getElementById('attendanceDate');
  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }
  attendanceCurrentDate = dateInput.value;

  // Populate GP filter
  const gpFilter = document.getElementById('attendanceGPFilter');
  const prevVal = gpFilter.value;
  gpFilter.innerHTML = '<option value="">Todos</option>' +
    participants.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  if (prevVal) gpFilter.value = prevVal;

  loadAttendance(attendanceCurrentDate);
}

function filterAttendanceByGP() {
  const gpId = document.getElementById('attendanceGPFilter').value;
  const filtered = gpId
    ? members.filter(m => String(m.gpId) === String(gpId))
    : members.slice();

  const wrap = document.getElementById('attendanceTableWrap');
  if (filtered.length === 0) {
    wrap.innerHTML = '<p style="color:var(--muted);text-align:center;padding:1rem;">No hay miembros registrados.</p>';
    updateAttendanceSummary(filtered);
    return;
  }

  wrap.innerHTML = `<table>
    <tr><th>Miembro</th><th>GP</th><th>Asistencia</th><th>Estado</th></tr>
    ${filtered.map(m => {
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
          ${present ? 'Presente' : 'Ausente'}
        </td>
      </tr>`;
    }).join('')}
  </table>`;

  updateAttendanceSummary(filtered);
}

function updateAttendanceSummary(filteredMembers) {
  const total = filteredMembers.length;
  const present = filteredMembers.filter(m => !!attendanceData[m.id]).length;
  const absent = total - present;
  document.getElementById('att-total').textContent = total;
  document.getElementById('att-present').textContent = present;
  document.getElementById('att-absent').textContent = absent;
}
