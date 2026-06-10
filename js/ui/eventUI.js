// ========== EVENTS UI ==========
function renderEventos() {
  const el = document.getElementById('eventList');
  if (!el) return;
  if (!eventos.length) {
    el.innerHTML = '<div class="empty-state">No hay eventos registrados.</div>';
    return;
  }
  el.innerHTML = `<table>
    <tr><th>Nombre</th><th>Descripción</th><th>Acciones</th></tr>
    ${eventos.map(e => `<tr>
      <td>${esc(e.name || '')}</td>
      <td>${esc(e.description || '')}</td>
      <td><div class="action-btns">
        <button class="btn btn-edit" onclick="editEventFromEncoded('${encodeURIComponent(String(e.id))}')">Editar</button>
        <button class="btn btn-danger" onclick="removeEventFromEncoded('${encodeURIComponent(String(e.id))}')">Eliminar</button>
      </div></td>
    </tr>`).join('')}
  </table>`;
}

function editEventFromEncoded(encodedId) {
  editEvent(decodeURIComponent(encodedId));
}

function removeEventFromEncoded(encodedId) {
  removeEvent(decodeURIComponent(encodedId));
}
