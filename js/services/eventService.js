// ========== EVENTS SERVICE ==========
function saveEvents() {
  return db.ref('ja_eventos').set(eventos).catch(err => {
    console.error('Error guardando eventos en Firebase:', err);
    alert('⚠️ No se pudieron guardar los eventos.');
    throw err;
  });
}

function refreshEventsDependents() {
  renderEventos();
  if (typeof refreshAttendanceEventTypes === 'function') refreshAttendanceEventTypes();
}

function addEvent() {
  const name = document.getElementById('eventName').value.trim();
  const description = document.getElementById('eventDescription').value.trim();
  if (!name) return alert('Ingresa el nombre del evento.');

  eventos.push({ id: uid(), name, description });
  saveEvents().then(() => {
    refreshEventsDependents();
    document.getElementById('eventName').value = '';
    document.getElementById('eventDescription').value = '';
  });
}

function removeEvent(id) {
  const usedInAttendance = attendanceHistory.some(item => String(item.type) === String(id));
  if (usedInAttendance && !confirm('Este evento tiene registros de asistencia. ¿Eliminar de todos modos?')) return;
  if (!usedInAttendance && !confirm('¿Eliminar este evento?')) return;

  eventos = eventos.filter(e => String(e.id) !== String(id));
  saveEvents().then(refreshEventsDependents);
}

function editEvent(id) {
  const event = eventos.find(e => String(e.id) === String(id));
  if (!event) return;
  document.getElementById('editEventId').value = event.id;
  document.getElementById('editEventName').value = event.name || '';
  document.getElementById('editEventDescription').value = event.description || '';
  openModal('modalEditEvent');
}

function saveEditEvent() {
  const id = document.getElementById('editEventId').value;
  const name = document.getElementById('editEventName').value.trim();
  const description = document.getElementById('editEventDescription').value.trim();
  if (!name) return alert('El nombre del evento no puede estar vacío.');

  const event = eventos.find(e => String(e.id) === String(id));
  if (!event) return;
  event.name = name;
  event.description = description;
  saveEvents().then(() => {
    refreshEventsDependents();
    closeModal('modalEditEvent');
  });
}
