// ========== ATTENDANCE SERVICE ==========
let attendanceData = {}; // { memberId: true/false }
let attendanceCurrentDate = '';

function loadAttendance(date) {
  if (!date) return;
  attendanceCurrentDate = date;
  db.ref('ja_attendance/' + date).once('value').then(snap => {
    attendanceData = snap.val() || {};
    filterAttendanceByGP();
  });
}

function toggleAttendance(memberId, isPresent) {
  attendanceData[memberId] = isPresent;
  const statusEl = document.getElementById('att-status-' + memberId);
  if (statusEl) {
    statusEl.textContent = isPresent ? 'Presente' : 'Ausente';
    statusEl.style.color = isPresent ? 'var(--relacion)' : 'var(--danger)';
  }
  // Save to Firebase
  db.ref('ja_attendance/' + attendanceCurrentDate + '/' + memberId).set(isPresent)
    .catch(err => console.error('Error guardando asistencia:', err));

  // Update summary
  const gpId = document.getElementById('attendanceGPFilter').value;
  const filtered = gpId
    ? members.filter(m => String(m.gpId) === String(gpId))
    : members.slice();
  updateAttendanceSummary(filtered);
}
