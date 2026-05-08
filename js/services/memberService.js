// ========== MEMBERS SERVICE ==========
function addMember() {
  const nombre = document.getElementById('memberNombre').value.trim();
  const apellido = document.getElementById('memberApellido').value.trim();
  const gpId = document.getElementById('memberGp').value;
  if (!nombre || !apellido || !gpId) return alert('Completa nombre, apellido y GP.');
  const gp = participants.find(p => String(p.id) === gpId);
  if (!gp) return alert('Selecciona un GP válido.');
  members.push({ id: uid(), nombre, apellido, gpId: gp.id, gpName: gp.name });
  save();
  renderMembers();
  document.getElementById('memberNombre').value = '';
  document.getElementById('memberApellido').value = '';
  document.getElementById('memberGp').value = '';
}

function removeMember(id) {
  if (!confirm('¿Eliminar este miembro?')) return;
  members = members.filter(m => m.id !== id);
  save();
  renderMembers();
}

function editMember(id) {
  const m = members.find(x => x.id === id);
  if (!m) return;
  populateMemberGPSelect();
  document.getElementById('editMemberId').value = id;
  document.getElementById('editMemberNombre').value = m.nombre || '';
  document.getElementById('editMemberApellido').value = m.apellido || '';
  document.getElementById('editMemberGp').value = String(m.gpId || '');
  openModal('modalEditMember');
}

function saveEditMember() {
  const id = parseInt(document.getElementById('editMemberId').value, 10);
  const nombre = document.getElementById('editMemberNombre').value.trim();
  const apellido = document.getElementById('editMemberApellido').value.trim();
  const gpId = document.getElementById('editMemberGp').value;
  if (!nombre || !apellido || !gpId) return alert('Completa nombre, apellido y GP.');
  const gp = participants.find(p => String(p.id) === gpId);
  if (!gp) return alert('Selecciona un GP válido.');
  const m = members.find(x => x.id === id);
  if (!m) return;
  m.nombre = nombre;
  m.apellido = apellido;
  m.gpId = gp.id;
  m.gpName = gp.name;
  save();
  renderMembers();
  closeModal('modalEditMember');
}
