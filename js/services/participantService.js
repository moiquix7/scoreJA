// ========== PARTICIPANTS SERVICE ==========
function addParticipant() {
  const name = document.getElementById('participantName').value.trim();
  if (!name) return alert('Ingresa un nombre para el participante.');
  const type = document.querySelector('input[name="logoType"]:checked').value;
  if (type === 'emoji') {
    if (!selectedEmoji) return alert('Selecciona un emoji.');
    participants.push({ id: uid(), name, logo: selectedEmoji, logoType: 'emoji' });
    save(); renderParticipants(); populateMemberGPSelect(); renderMembers();
    document.getElementById('participantName').value = '';
    selectedEmoji = ''; renderEmojiPicker();
  } else {
    const file = document.getElementById('participantImage').files[0];
    if (!file) return alert('Selecciona una imagen.');
    const reader = new FileReader();
    reader.onload = function(e) {
      participants.push({ id: uid(), name, logo: e.target.result, logoType: 'image' });
      save(); renderParticipants(); populateMemberGPSelect(); renderMembers();
      document.getElementById('participantName').value = '';
      document.getElementById('participantImage').value = '';
    };
    reader.readAsDataURL(file);
  }
}

function removeParticipant(id) {
  if (!confirm('¿Eliminar este participante y todos sus puntos?')) return;
  participants = participants.filter(p => p.id !== id);
  Object.keys(points).forEach(k => { if (k.startsWith(id + '-')) delete points[k]; });
  save(); renderParticipants(); populateMemberGPSelect(); renderMembers();
}

function editParticipant(id) {
  const p = participants.find(x => x.id === id);
  if (!p) return;
  document.getElementById('editParticipantId').value = id;
  document.getElementById('editParticipantName').value = p.name;
  if (p.logoType === 'image') {
    document.querySelector('input[name="editLogoType"][value="image"]').checked = true;
  } else {
    document.querySelector('input[name="editLogoType"][value="emoji"]').checked = true;
  }
  toggleEditLogoType();
  editSelectedEmoji = p.logoType === 'emoji' ? p.logo : '';
  renderEditEmojiPicker();
  document.getElementById('editParticipantImage').value = '';
  openModal('modalEditParticipant');
}

function saveEditParticipant() {
  const id = parseInt(document.getElementById('editParticipantId').value);
  const name = document.getElementById('editParticipantName').value.trim();
  if (!name) return alert('El nombre no puede estar vacío.');
  const p = participants.find(x => x.id === id);
  if (!p) return;
  p.name = name;
  const type = document.querySelector('input[name="editLogoType"]:checked').value;
  if (type === 'emoji') {
    if (editSelectedEmoji) { p.logo = editSelectedEmoji; p.logoType = 'emoji'; }
    save(); renderParticipants(); populateMemberGPSelect(); renderMembers(); closeModal('modalEditParticipant');
  } else {
    const file = document.getElementById('editParticipantImage').files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(e) {
        p.logo = e.target.result; p.logoType = 'image';
        save(); renderParticipants(); populateMemberGPSelect(); renderMembers(); closeModal('modalEditParticipant');
      };
      reader.readAsDataURL(file);
    } else {
      save(); renderParticipants(); populateMemberGPSelect(); renderMembers(); closeModal('modalEditParticipant');
    }
  }
}
