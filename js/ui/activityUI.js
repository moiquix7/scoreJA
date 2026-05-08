// ========== ACTIVITY UI ==========
function renderActivities() {
  const el = document.getElementById('activityList');
  if (!activities.length) { el.innerHTML = '<div class="empty-state">No hay actividades registradas.</div>'; return; }
  el.innerHTML = `<table>
    <tr><th>#</th><th>Actividad</th><th>Pts</th><th>Tipo</th><th>Acciones</th></tr>
    ${activities.map((a, i) => `<tr>
      <td>${i + 1}</td>
      <td>${esc(a.name)}</td>
      <td style="text-align:center;">${a.pts !== undefined ? a.pts : ''}</td>
      <td><span class="badge badge-${a.type.toLowerCase()}">${a.type}</span></td>
      <td><div class="action-btns">
        <button class="btn btn-edit" onclick="editActivity(${a.id})">✏️</button>
        <button class="btn btn-danger" onclick="removeActivity(${a.id})">✕</button>
      </div></td>
    </tr>`).join('')}
  </table>`;
}
