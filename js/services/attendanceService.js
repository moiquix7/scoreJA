// ========== ATTENDANCE SERVICE ==========
let attendanceData = {}; // { memberId: true/false }
let attendanceCurrentDate = '';
let attendanceCurrentType = '';
let attendanceHistory = [];

const ATTENDANCE_TYPE_LABELS = {
  JA: 'JA',
  EscuelaSabatica: 'Escuela Sabática'
};

function getAttendanceTypeLabel(type) {
  return ATTENDANCE_TYPE_LABELS[type] || type || '';
}

function getAttendanceCurrentType() {
  const typeSelect = document.getElementById('attendanceType');
  return typeSelect ? typeSelect.value : '';
}

function getAttendanceNode(date, type) {
  return 'ja_attendance/' + date + '/' + type;
}

function isLegacyAttendanceData(dateData) {
  return dateData && typeof dateData === 'object'
    && Object.values(dateData).some(v => typeof v === 'boolean');
}

function setAttendanceTypeIfNeeded(date) {
  const typeSelect = document.getElementById('attendanceType');
  if (!typeSelect || typeSelect.value) return Promise.resolve(typeSelect ? typeSelect.value : '');

  return db.ref('ja_attendance/' + date).once('value').then(snap => {
    const dateData = snap.val() || {};
    let resolvedType = '';
    const hasLegacyMembers = isLegacyAttendanceData(dateData);

    if (hasLegacyMembers) {
      resolvedType = 'JA';
    } else if (dateData && typeof dateData === 'object') {
      const typedKeys = Object.keys(dateData).filter(k => {
        const item = dateData[k];
        return item && typeof item === 'object' && item.members && typeof item.members === 'object';
      });
      if (typedKeys.length === 1) resolvedType = typedKeys[0];
    }

    if (resolvedType) typeSelect.value = resolvedType;
    return typeSelect.value;
  }).catch(() => typeSelect.value);
}

function loadAttendance(date) {
  if (!date) return;
  attendanceCurrentDate = date;
  setAttendanceTypeIfNeeded(date).then(() => {
    attendanceCurrentType = getAttendanceCurrentType();

    if (!attendanceCurrentType) {
      attendanceData = {};
      filterAttendanceByGP();
      return;
    }

    db.ref(getAttendanceNode(date, attendanceCurrentType)).once('value').then(snap => {
    const raw = snap.val() || {};
    attendanceData = (raw && typeof raw === 'object' && raw.members && typeof raw.members === 'object')
      ? raw.members
      : {};

    if (!Object.keys(attendanceData).length) {
      db.ref('ja_attendance/' + date).once('value').then(dateSnap => {
        const legacy = dateSnap.val();
        const hasLegacyMembers = isLegacyAttendanceData(legacy);
        if (attendanceCurrentType === 'JA' && hasLegacyMembers) {
          attendanceData = legacy;
        }
        filterAttendanceByGP();
      });
      return;
    }
    filterAttendanceByGP();
    });
  });
}

function toggleAttendance(memberId, isPresent) {
  if (!attendanceCurrentDate) return alert('Selecciona una fecha.');
  if (!attendanceCurrentType) {
    alert('Selecciona el tipo de evento (JA o Escuela Sabática) para registrar asistencia.');
    filterAttendanceByGP();
    return;
  }

  attendanceData[memberId] = isPresent;
  const statusEl = document.getElementById('att-status-' + memberId);
  if (statusEl) {
    statusEl.textContent = isPresent ? 'Puntual' : 'Retrasado';
    statusEl.style.color = isPresent ? 'var(--relacion)' : 'var(--danger)';
  }

  // Save to Firebase
  const attendanceNode = db.ref(getAttendanceNode(attendanceCurrentDate, attendanceCurrentType));
  attendanceNode.update({ evento: attendanceCurrentType })
    .then(() => attendanceNode.child('members/' + memberId).set(isPresent))
    .then(() => loadAttendanceHistory())
    .catch(err => console.error('Error guardando asistencia:', err));

  // Update summary
  updateAttendanceSummary(getFilteredAttendanceMembers().filteredMembers);
}

function changeAttendanceEventType() {
  const dateInput = document.getElementById('attendanceDate');
  attendanceCurrentType = getAttendanceCurrentType();
  if (dateInput && dateInput.value) {
    loadAttendance(dateInput.value);
  } else {
    attendanceData = {};
    filterAttendanceByGP();
  }
}

function computeMostPunctualMember(data) {
  const counts = {};
  Object.keys(data).forEach(date => {
    const dateData = data[date];
    if (!dateData || typeof dateData !== 'object') return;
    const isLegacy = isLegacyAttendanceData(dateData);
    if (isLegacy) {
      Object.keys(dateData).forEach(memberId => {
        if (dateData[memberId] === true) {
          counts[memberId] = (counts[memberId] || 0) + 1;
        }
      });
    } else {
      Object.keys(dateData).forEach(type => {
        const typeData = dateData[type];
        if (!typeData || typeof typeData !== 'object') return;
        const membersData = (typeData.members && typeof typeData.members === 'object')
          ? typeData.members
          : null;
        if (!membersData) return;
        Object.keys(membersData).forEach(memberId => {
          if (membersData[memberId] === true) {
            counts[memberId] = (counts[memberId] || 0) + 1;
          }
        });
      });
    }
  });
  let bestId = null;
  let bestCount = 0;
  // In case of a tie, the first member encountered wins (Object.keys insertion order)
  Object.keys(counts).forEach(memberId => {
    if (counts[memberId] > bestCount) {
      bestCount = counts[memberId];
      bestId = memberId;
    }
  });
  return bestCount > 0 ? { memberId: bestId, count: bestCount } : null;
}

function loadAttendanceHistory() {
  db.ref('ja_attendance').once('value').then(snap => {
    const data = snap.val() || {};
    const entries = [];

    Object.keys(data).forEach(date => {
      const dateData = data[date];
      if (!dateData || typeof dateData !== 'object') return;

      const isLegacy = isLegacyAttendanceData(dateData);
      if (isLegacy) {
        const membersData = dateData;
        entries.push({
          key: date + '__JA',
          date,
          type: 'JA',
          label: getAttendanceTypeLabel('JA'),
          total: Object.keys(membersData).length
        });
      }

      Object.keys(dateData).forEach(type => {
        const typeData = dateData[type];
        if (!typeData || typeof typeData !== 'object') return;
        const membersData = (typeData.members && typeof typeData.members === 'object')
          ? typeData.members
          : null;
        if (!membersData) return;
        const eventType = typeData.evento || type;
        entries.push({
          key: date + '__' + type,
          date,
          type: type,
          label: getAttendanceTypeLabel(eventType),
          total: Object.keys(membersData).length
        });
      });
    });

    const entriesByKey = {};
    entries.forEach(entry => { entriesByKey[entry.key] = entry; });
    const uniqueEntries = Object.values(entriesByKey);

    uniqueEntries.sort((a, b) => {
      if (a.date === b.date) return a.label.localeCompare(b.label, 'es');
      return a.date < b.date ? 1 : -1;
    });

    attendanceHistory = uniqueEntries;
    renderAttendanceHistory();
    const mostPunctual = computeMostPunctualMember(data);
    renderMostPunctualMember(mostPunctual);
  }).catch(err => console.error('Error cargando historial de asistencia:', err));
}

function selectAttendanceHistory(date, type) {
  const dateInput = document.getElementById('attendanceDate');
  const typeInput = document.getElementById('attendanceType');
  if (dateInput) dateInput.value = date;
  if (typeInput) typeInput.value = type;
  attendanceCurrentDate = date;
  attendanceCurrentType = type;
  loadAttendance(date);
}
