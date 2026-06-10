// ========== NAVIGATION ==========
function showSection(name, btn) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  document.getElementById('sec-' + name).classList.add('active');
  if (btn) btn.classList.add('active');
  if (name === 'asignar') { populateAssignSelect(); renderAssignTable(); renderSummary(); }
  if (name === 'ranking') renderRanking();
  if (name === 'veractividades') renderVerActividades();
  if (name === 'eventos') renderEventos();
  if (name === 'secretaria') { populateMemberGPSelect(); renderMembers(); }
  if (name === 'asistencia') renderAsistencia();
}

// ========== MODALS ==========
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
