// ========== ACTIVITIES SERVICE ==========
function addActivity() {
  const name = document.getElementById('activityName').value.trim();
  const type = document.getElementById('activityType').value;
  const pts = parseInt(document.getElementById('activityPts').value, 10);

  if (!name) return alert('Ingresa un nombre para la actividad.');
  if (isNaN(pts) || pts < 0) return alert('Ingresa un valor válido en Pts.');
  activities.push({ id: uid(), name, type, pts });
  save(); renderActivities();
  document.getElementById('activityName').value = '';
}

function removeActivity(id) {
  if (!confirm('¿Eliminar esta actividad y sus puntos asociados?')) return;
  activities = activities.filter(a => a.id !== id);
  Object.keys(points).forEach(k => { if (k.endsWith('-' + id)) delete points[k]; });
  save(); renderActivities();
}

function editActivity(id) {
  const a = activities.find(x => x.id === id);
  if (!a) return;
  document.getElementById('editActivityId').value = id;
  document.getElementById('editActivityName').value = a.name;
  document.getElementById('editActivityPts').value = a.pts !== undefined ? a.pts : '';
  document.getElementById('editActivityType').value = a.type;
  openModal('modalEditActivity');
}

function saveEditActivity() {
  const id = parseInt(document.getElementById('editActivityId').value);
  const name = document.getElementById('editActivityName').value.trim();
  const pts = parseInt(document.getElementById('editActivityPts').value, 10);
  const type = document.getElementById('editActivityType').value;

  if (!name) return alert('El nombre no puede estar vacío.');
  if (isNaN(pts) || pts < 0) return alert('Ingresa un valor válido en Pts.');

  const a = activities.find(x => x.id === id);
  if (!a) return;
  a.name = name; a.type = type; a.pts = pts;
  save(); renderActivities(); closeModal('modalEditActivity');
}
