// ========== MEMBER UI ==========
function populateMemberGPSelect() {
  const options = participants.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  const defaultOption = '<option value="">Seleccionar GP</option>';
  ['memberGp', 'editMemberGp'].forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    const currentValue = select.value;
    select.innerHTML = defaultOption + options;
    if (participants.some(p => String(p.id) === String(currentValue))) {
      select.value = String(currentValue);
    }
  });
}

function renderMembers() {
  const el = document.getElementById('memberList');
  if (!members.length) { el.innerHTML = '<div class="empty-state">No hay miembros registrados.</div>'; return; }
  el.innerHTML = `<table>
    <tr><th>#</th><th>Nombre</th><th>Apellido</th><th>GP</th><th>Acciones</th></tr>
    ${members.map((m, i) => {
      const gp = participants.find(p => p.id === m.gpId);
      const gpName = gp ? gp.name : (m.gpName || 'GP no disponible');
      return `<tr>
        <td>${i + 1}</td>
        <td>${esc(m.nombre || '')}</td>
        <td>${esc(m.apellido || '')}</td>
        <td>${esc(gpName)}</td>
        <td><div class="action-btns">
          <button class="btn btn-edit" onclick="editMember(${m.id})">✏️</button>
          <button class="btn btn-danger" onclick="removeMember(${m.id})">✕</button>
        </div></td>
      </tr>`;
    }).join('')}
  </table>`;
}
