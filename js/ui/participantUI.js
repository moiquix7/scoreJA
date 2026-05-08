// ========== PARTICIPANT UI ==========
const emojis = ['⭐','🦁','🦅','🐺','🔥','💎','🌟','🎯','🏅','⚡','🛡️','🌊','🏔️','🌿','🎖️','👑','🚀','🙏','📖','🕊️','💪','🌈','🎵','❤️','✝️','📯','🕯️','🫒','🍇','☀️'];

let selectedEmoji = '';
let editSelectedEmoji = '';

function renderEmojiPicker() {
  document.getElementById('emojiPicker').innerHTML = emojis.map(e =>
    `<span onclick="selectEmoji(this, '${e}')" ${selectedEmoji === e ? 'class="selected"' : ''}>${e}</span>`
  ).join('');
}

function renderEditEmojiPicker() {
  document.getElementById('editEmojiPicker').innerHTML = emojis.map(e =>
    `<span onclick="selectEditEmoji(this, '${e}')" ${editSelectedEmoji === e ? 'class="selected"' : ''}>${e}</span>`
  ).join('');
}

function selectEmoji(el, emoji) {
  document.querySelectorAll('#emojiPicker span').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  selectedEmoji = emoji;
}

function selectEditEmoji(el, emoji) {
  document.querySelectorAll('#editEmojiPicker span').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  editSelectedEmoji = emoji;
}

function toggleLogoType() {
  const type = document.querySelector('input[name="logoType"]:checked').value;
  document.getElementById('emojiSection').style.display = type === 'emoji' ? '' : 'none';
  document.getElementById('imageSection').style.display = type === 'image' ? '' : 'none';
}

function toggleEditLogoType() {
  const type = document.querySelector('input[name="editLogoType"]:checked').value;
  document.getElementById('editEmojiSection').style.display = type === 'emoji' ? '' : 'none';
  document.getElementById('editImageSection').style.display = type === 'image' ? '' : 'none';
}

function renderParticipants() {
  const el = document.getElementById('participantList');
  if (!participants.length) { el.innerHTML = '<div class="empty-state">No hay participantes registrados.</div>'; return; }
  el.innerHTML = `<table>
    <tr><th>#</th><th>Logo</th><th>Nombre</th><th>Acciones</th></tr>
    ${participants.map((p, i) => `<tr>
      <td>${i + 1}</td>
      <td>${logoHTML(p)}</td>
      <td>${esc(p.name)}</td>
      <td><div class="action-btns">
        <button class="btn btn-edit" onclick="editParticipant(${p.id})">✏️</button>
        <button class="btn btn-danger" onclick="removeParticipant(${p.id})">✕</button>
      </div></td>
    </tr>`).join('')}
  </table>`;
}
