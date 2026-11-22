// ========== ATTENDANCE SERVICE ==========
let attendanceData = {}; // { memberId: true/false }
let attendanceCheckins = {}; // { memberId: timestamp (ms) del registro de asistencia }
let attendanceCurrentDate = '';
let attendanceCurrentType = '';
let attendanceHistory = [];
let attendanceShowOnlyPresent = false;

function setAttendanceShowOnlyPresent(value) {
  attendanceShowOnlyPresent = value === true;
}

function getAttendanceShowOnlyPresent() {
  return attendanceShowOnlyPresent === true;
}

function normalizeAttendanceTypeToken(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function getEventByTypeIdentifier(type) {
  const key = String(type || '');
  const keyNorm = normalizeAttendanceTypeToken(key);
  return eventos.find(e =>
    String(e.id) === key ||
    normalizeAttendanceTypeToken(e.name) === keyNorm
  ) || null;
}

function getAttendanceTypeLabel(type) {
  const event = getEventByTypeIdentifier(type);
  if (event) return event.name;
  const normalized = normalizeAttendanceTypeToken(type);
  if (normalized === 'escuelasabatica') return 'Escuela Sabática';
  if (normalized === 'ja') return 'JA';
  return type || '';
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
  const typeInput = document.getElementById('attendanceType');
  if (!typeInput || typeInput.value) return Promise.resolve(typeInput ? typeInput.value : '');

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

    if (resolvedType) {
      if (typeof selectAttendanceEventType === 'function') {
        selectAttendanceEventType(resolvedType, getAttendanceTypeLabel(resolvedType), true);
      } else {
        typeInput.value = resolvedType;
      }
    }
    return typeInput.value;
  }).catch(() => typeInput.value);
}

function loadAttendance(date, showOnlyPresent) {
  if (!date) return;
  setAttendanceShowOnlyPresent(typeof showOnlyPresent === 'boolean' ? showOnlyPresent : false);
  attendanceCurrentDate = date;
  setAttendanceTypeIfNeeded(date).then(() => {
    attendanceCurrentType = getAttendanceCurrentType();

    if (!attendanceCurrentType) {
      attendanceData = {};
      attendanceCheckins = {};
      filterAttendanceByGP();
      return;
    }

    db.ref(getAttendanceNode(date, attendanceCurrentType)).once('value').then(snap => {
    const raw = snap.val() || {};
    attendanceData = (raw && typeof raw === 'object' && raw.members && typeof raw.members === 'object')
      ? raw.members
      : {};
    attendanceCheckins = (raw && typeof raw === 'object' && raw.checkins && typeof raw.checkins === 'object')
      ? raw.checkins
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
    alert('Selecciona un evento. Si no hay eventos, créalos en la sección Eventos.');
    filterAttendanceByGP();
    return;
  }

  attendanceData[memberId] = isPresent;
  // Registrar fecha y hora al marcar presente; limpiar al desmarcar
  const checkinTime = isPresent ? Date.now() : null;
  if (isPresent) {
    attendanceCheckins[memberId] = checkinTime;
  } else {
    delete attendanceCheckins[memberId];
  }
  const statusEl = document.getElementById('att-status-' + memberId);
  if (statusEl) {
    statusEl.textContent = isPresent ? 'Puntual' : 'Retrasado';
    statusEl.style.color = isPresent ? 'var(--relacion)' : 'var(--danger)';
  }

  // Save to Firebase
  const attendanceNode = db.ref(getAttendanceNode(attendanceCurrentDate, attendanceCurrentType));
  attendanceNode.update({ evento: attendanceCurrentType })
    .then(() => attendanceNode.update({
      ['members/' + memberId]: isPresent,
      ['checkins/' + memberId]: checkinTime
    }))
    .then(() => loadAttendanceHistory())
    .catch(err => console.error('Error guardando asistencia:', err));

  // Refresh table and summary
  applyAttendanceFilters();
}

function changeAttendanceEventType() {
  const dateInput = document.getElementById('attendanceDate');
  attendanceCurrentType = getAttendanceCurrentType();
  if (dateInput && dateInput.value) {
    loadAttendance(dateInput.value);
  } else {
    attendanceData = {};
    attendanceCheckins = {};
    filterAttendanceByGP();
  }
}

function formatAttendanceCheckin(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

function formatAttendanceCheckinTime(timestamp) {
  if (!timestamp) return '';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Recorre TODOS los registros de asistencia (todas las fechas y todos los eventos)
// y devuelve los miembros con más registros puntuales.
// Orden: más registros puntuales → menos registros con retraso → hora promedio de registro más temprana → nombre.
function computeTopPunctualMembers(data, limit) {
  const max = typeof limit === 'number' && limit > 0 ? limit : 3;
  const stats = {}; // { memberId: { punctual, late, records:Set, checkinMinutes:[] } }
  const ensureStats = memberId => {
    if (!stats[memberId]) stats[memberId] = { punctual: 0, late: 0, records: new Set(), checkinMinutes: [] };
    return stats[memberId];
  };
  const addRecord = (memberId, recordKey, isPresent, checkin) => {
    const st = ensureStats(memberId);
    if (st.records.has(recordKey)) return; // evita contar dos veces el mismo evento/fecha
    st.records.add(recordKey);
    if (isPresent) {
      st.punctual += 1;
      const d = checkin ? new Date(checkin) : null;
      if (d && !isNaN(d.getTime())) st.checkinMinutes.push(d.getHours() * 60 + d.getMinutes());
    } else {
      st.late += 1;
    }
  };

  Object.keys(data || {}).forEach(date => {
    const dateData = data[date];
    if (!dateData || typeof dateData !== 'object') return;

    // Datos legacy: { memberId: boolean } directamente bajo la fecha (evento JA)
    if (isLegacyAttendanceData(dateData)) {
      const typeKey = String((getEventByTypeIdentifier('JA') || {}).id || 'JA');
      Object.keys(dateData).forEach(memberId => {
        if (typeof dateData[memberId] !== 'boolean') return;
        addRecord(memberId, date + '__' + typeKey, dateData[memberId] === true, null);
      });
    }

    // Datos por tipo de evento: { tipo: { evento, members:{}, checkins:{} } }
    Object.keys(dateData).forEach(type => {
      const typeData = dateData[type];
      if (!typeData || typeof typeData !== 'object') return;
      const membersData = (typeData.members && typeof typeData.members === 'object') ? typeData.members : null;
      if (!membersData) return;
      const checkinsData = (typeData.checkins && typeof typeData.checkins === 'object') ? typeData.checkins : {};
      const event = getEventByTypeIdentifier(typeData.evento || type) || getEventByTypeIdentifier(type);
      const typeKey = event ? String(event.id) : type;
      Object.keys(membersData).forEach(memberId => {
        if (typeof membersData[memberId] !== 'boolean') return;
        addRecord(memberId, date + '__' + typeKey, membersData[memberId] === true, checkinsData[memberId]);
      });
    });
  });

  const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  return Object.keys(stats)
    .map(memberId => {
      const member = members.find(m => String(m.id) === String(memberId));
      const st = stats[memberId];
      return {
        memberId,
        member,
        punctual: st.punctual,
        late: st.late,
        total: st.records.size,
        avgCheckinMinutes: avg(st.checkinMinutes)
      };
    })
    .filter(r => r.member && r.punctual > 0)
    .sort((a, b) => {
      if (b.punctual !== a.punctual) return b.punctual - a.punctual;
      if (a.late !== b.late) return a.late - b.late;
      const aAvg = a.avgCheckinMinutes === null ? Infinity : a.avgCheckinMinutes;
      const bAvg = b.avgCheckinMinutes === null ? Infinity : b.avgCheckinMinutes;
      if (aAvg !== bAvg) return aAvg - bAvg;
      const aName = `${a.member.nombre || ''} ${a.member.apellido || ''}`.trim();
      const bName = `${b.member.nombre || ''} ${b.member.apellido || ''}`.trim();
      return aName.localeCompare(bName, 'es');
    })
    .slice(0, max);
}

function loadTopPunctualMembers(limit) {
  return db.ref('ja_attendance').once('value')
    .then(snap => computeTopPunctualMembers(snap.val() || {}, limit));
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
  }).catch(err => console.error('Error cargando historial de asistencia:', err));
}

function selectAttendanceHistory(date, type) {
  const dateInput = document.getElementById('attendanceDate');
  if (dateInput) dateInput.value = date;
  if (typeof selectAttendanceEventType === 'function') {
    selectAttendanceEventType(type, getAttendanceTypeLabel(type), true);
  } else {
    const typeInput = document.getElementById('attendanceType');
    if (typeInput) typeInput.value = type;
  }
  attendanceCurrentDate = date;
  attendanceCurrentType = type;
  loadAttendance(date, true);
}
