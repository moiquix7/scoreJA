// ========== POINTS UI ==========
let _closeAssignTimeout = null;

function populateAssignSelect() {
  const hiddenInput = document.getElementById('assignActivity');
  const currentId = hiddenInput ? hiddenInput.value : '';
  // If the currently selected activity was removed, clear the selection
  if (currentId && !activities.find(a => String(a.id) === currentId)) {
    hiddenInput.value = '';
    const searchInput = document.getElementById('assignActivitySearch');
    if (searchInput) searchInput.value = '';
    renderAssignTable();
  }
  // Refresh dropdown items in case it is open
  const dropdown = document.getElementById('assignActivityDropdown');
  if (dropdown && dropdown.classList.contains('open')) {
    renderAssignDropdown(document.getElementById('assignActivitySearch').value);
  }
}

function renderAssignDropdown(query) {
  const dropdown = document.getElementById('assignActivityDropdown');
  const filtered = query
    ? activities.filter(a =>
        a.name.toLowerCase().includes(query.toLowerCase()) ||
        a.type.toLowerCase().includes(query.toLowerCase()))
    : activities;
  if (!filtered.length) {
    dropdown.innerHTML = '<div class="searchable-dropdown-empty">No se encontraron actividades</div>';
    return;
  }
  const currentId = document.getElementById('assignActivity').value;
  dropdown.innerHTML = filtered.map(a =>
    `<div class="searchable-dropdown-item${String(a.id) === currentId ? ' selected-item' : ''}"
          data-id="${a.id}"
          data-label="${esc(a.name)} (${a.type})"
          onmousedown="selectAssignActivity(${a.id}, this.dataset.label)">
       ${esc(a.name)} - <span class="badge badge-${a.type.toLowerCase()}">${a.type}</span>
     </div>`
  ).join('');
}

function filterAssignActivities() {
  const query = document.getElementById('assignActivitySearch').value;
  // Clear the hidden selection when the user types
  document.getElementById('assignActivity').value = '';
  renderAssignDropdown(query);
  document.getElementById('assignActivityDropdown').classList.add('open');
}

function openAssignDropdown() {
  if (_closeAssignTimeout) { clearTimeout(_closeAssignTimeout); _closeAssignTimeout = null; }
  renderAssignDropdown(document.getElementById('assignActivitySearch').value);
  document.getElementById('assignActivityDropdown').classList.add('open');
}

function scheduleCloseAssignDropdown() {
  _closeAssignTimeout = setTimeout(() => {
    document.getElementById('assignActivityDropdown').classList.remove('open');
    _closeAssignTimeout = null;
  }, 150);
}

function selectAssignActivity(id, label) {
  if (_closeAssignTimeout) { clearTimeout(_closeAssignTimeout); _closeAssignTimeout = null; }
  document.getElementById('assignActivity').value = id;
  document.getElementById('assignActivitySearch').value = label;
  document.getElementById('assignActivityDropdown').classList.remove('open');
  renderAssignTable();
}

function clearAssignActivity() {
  document.getElementById('assignActivity').value = '';
  document.getElementById('assignActivitySearch').value = '';
  document.getElementById('assignActivityDropdown').classList.remove('open');
  renderAssignTable();
}

function renderAssignTable() {
  const wrap = document.getElementById('assignTableWrap');
  const actId = document.getElementById('assignActivity').value;

  if (!participants.length || !actId) {
    wrap.innerHTML = '<div class="empty-state">Selecciona una actividad y asegúrate de tener participantes registrados.</div>';
    return;
  }

  const act = activities.find(a => a.id == actId);
  if (!act) { wrap.innerHTML = ''; return; }

  const colorClass = act.type.toLowerCase();
  wrap.innerHTML = `<table>
    <tr>
      <th>Participante</th>
      <th class="th-${colorClass}" style="text-align:center;">${esc(act.name)} <span class="badge badge-${colorClass}">${act.type}</span> ${act.pts !== undefined ? esc(act.pts)+' Pts'  : ''}</th>
    </tr>
    ${participants.map(p => {
      const key = p.id + '-' + act.id;
      const isEditing = editModeKeys.has(key);
      const hasSaved = key in savedPoints;
      const savedVal = savedPoints[key] || 0;
      // In edit mode show the saved value (to replace); in normal mode show 0 (delta to add)
      const inputVal = isEditing ? savedVal : 0;
      const editBtnDisabled = hasSaved ? '' : 'disabled';
      const editBtnClass = isEditing ? 'btn-warning' : 'btn-edit';
      const editBtnLabel = isEditing ? '✏️ Editando' : '✏️ Editar';
      const stepLabel = isEditing ? 'reemplazar total' : `+${STEP} pts (sumar)`;
      const savedLabel = hasSaved ? `<div class="step-label" style="color:var(--muted);">guardado: ${savedVal}</div>` : '';
      return `<tr>
        <td>${logoHTML(p)} ${esc(p.name)}</td>
        <td>
          <div class="points-stepper">
            <button class="stepper-btn minus" onclick="changePoints(${p.id},${act.id},-${STEP})">−</button>
            <div>
              <input type="number"
                     class="points-input-stepper"
                     id="pv-${key}"
                     value="${inputVal}"
                     min="0"
                     style="color:var(--${colorClass})"
                     oninput="onPointsInput(${p.id},${act.id})"
                     onblur="onPointsBlur(${p.id},${act.id})"
                     onkeydown="onPointsKeydown(event,${p.id},${act.id})">
              <div class="step-label">${stepLabel}</div>
              ${savedLabel}
            </div>
            <button class="stepper-btn plus" onclick="changePoints(${p.id},${act.id},${STEP})">+</button>
          </div>
          <div style="text-align:center;margin-top:0.4rem;">
            <button class="btn ${editBtnClass}" style="font-size:0.75rem;padding:0.3rem 0.7rem;" onclick="enterEditMode(${p.id},${act.id})" ${editBtnDisabled}>${editBtnLabel}</button>
          </div>
        </td>
      </tr>`;
    }).join('')}
  </table>`;
}

function renderSummary() {
  const wrap = document.getElementById('summaryTableWrap');
  if (!participants.length) { wrap.innerHTML = '<div class="empty-state">No hay datos.</div>'; return; }

  function getTypeTotal(pId, type) {
    return activities.filter(a => a.type === type).reduce((sum, a) => sum + (points[pId + '-' + a.id] || 0), 0);
  }

  wrap.innerHTML = `<table>
    <tr>
      <th>GP</th>
      <th class="th-mision" style="text-align:center;">🚀 Misión</th>
      <th class="th-comunion" style="text-align:center;">🙏 Comunión</th>
      <th class="th-relacion" style="text-align:center;">🤝 Relación</th>
      <th style="text-align:center;">Total</th>
    </tr>
    ${participants.map(p => {
      const m = getTypeTotal(p.id, 'Mision');
      const c = getTypeTotal(p.id, 'Comunion');
      const r = getTypeTotal(p.id, 'Relacion');
      return `<tr>
        <td>${logoHTML(p)} ${esc(p.name)}</td>
        <td style="text-align:center;color:var(--mision);font-weight:700;">${m}</td>
        <td style="text-align:center;color:var(--comunion);font-weight:700;">${c}</td>
        <td style="text-align:center;color:var(--relacion);font-weight:700;">${r}</td>
        <td style="text-align:center;font-weight:900;">${m + c + r}</td>
      </tr>`;
    }).join('')}
  </table>`;
}
