// ========== POINTS SERVICE ==========
function savePoints() {
  const actId = document.getElementById('assignActivity').value;
  if (!actId) return alert('Selecciona una actividad.');

  // Final validation before save
  let hasError = false;
  participants.forEach(p => {
    const key = p.id + '-' + actId;
    const input = document.getElementById('pv-' + key);
    if (input) {
      let val = parseInt(input.value);
      if (isNaN(val) || val < 0) {
        val = 0;
        input.value = 0;
        input.classList.add('invalid');
        setTimeout(() => input.classList.remove('invalid'), 400);
        hasError = true;
      }
      if (editModeKeys.has(key)) {
        // Edit mode: replace the stored value with the typed total
        points[key] = val;
      } else {
        // Normal mode: add the typed delta to the previously saved value
        points[key] = (savedPoints[key] || 0) + val;
      }
    }
  });

  if (hasError) {
    alert('⚠️ Se corrigieron valores negativos o inválidos a 0.');
  }

  save();
  savedPoints = { ...points }; // update persisted snapshot
  editModeKeys.clear(); // exit any edit mode after saving
  renderAssignTable(); // refresh inputs back to delta=0 and update Editar states
  renderSummary();
  renderRanking();
  alert('✅ Puntos guardados correctamente.');
}

function clearAllPoints() {
  const actId = document.getElementById('assignActivity').value;
  if (!actId) return alert('Selecciona una actividad.');
  if (!confirm('¿Estás seguro de que deseas limpiar todos los puntos de esta actividad? Esta acción no se puede deshacer.')) return;

  participants.forEach(p => {
    const key = p.id + '-' + actId;
    points[key] = 0;
    savedPoints[key] = 0;
  });
  editModeKeys.clear();
  save();
  renderAssignTable();
  renderSummary();
  renderRanking();
}

function changePoints(pId, aId, delta) {
  const key = pId + '-' + aId;
  const input = document.getElementById('pv-' + key);
  if (!input) return;
  if (editModeKeys.has(key)) {
    // Edit mode: input shows total; adjust total directly
    let total = (parseInt(input.value) || 0) + delta;
    if (total < 0) total = 0;
    points[key] = total;
    input.value = total;
  } else {
    // Normal mode: input shows delta to add; adjust delta
    let currentDelta = parseInt(input.value) || 0;
    let newDelta = currentDelta + delta;
    if (newDelta < 0) newDelta = 0;
    points[key] = Math.max(0, (savedPoints[key] || 0) + newDelta);
    input.value = newDelta;
  }
}

function onPointsInput(pId, aId) {
  const key = pId + '-' + aId;
  const input = document.getElementById('pv-' + key);
  let raw = input.value;

  // Allow empty while typing
  if (raw === '') return;

  let val = parseInt(raw);

  // Validate: not a number or negative
  if (isNaN(val) || val < 0) {
    input.classList.add('invalid');
    setTimeout(() => input.classList.remove('invalid'), 400);
    val = 0;
    input.value = 0;
  }

  if (editModeKeys.has(key)) {
    points[key] = val; // edit mode: val is the new total
  } else {
    points[key] = (savedPoints[key] || 0) + val; // normal mode: val is the delta
  }
}

function onPointsBlur(pId, aId) {
  const key = pId + '-' + aId;
  const input = document.getElementById('pv-' + key);
  let val = parseInt(input.value);

  if (isNaN(val) || val < 0) val = 0;

  if (editModeKeys.has(key)) {
    points[key] = val;
  } else {
    points[key] = (savedPoints[key] || 0) + val;
  }
  input.value = val;
  input.classList.remove('invalid');
}

function onPointsKeydown(e, pId, aId) {
  // Block minus sign and 'e'
  if (e.key === '-' || e.key === 'e' || e.key === 'E' || e.key === '+') {
    e.preventDefault();
    const input = document.getElementById('pv-' + pId + '-' + aId);
    input.classList.add('invalid');
    setTimeout(() => input.classList.remove('invalid'), 400);
  }
}

function enterEditMode(pId, aId) {
  const key = pId + '-' + aId;
  if (!(key in savedPoints)) return;

  // Capture current input values for all participants before re-rendering
  participants.forEach(p => {
    const k = p.id + '-' + aId;
    const input = document.getElementById('pv-' + k);
    if (input && k !== key) {
      let val = parseInt(input.value) || 0;
      if (editModeKeys.has(k)) {
        points[k] = val;
      } else {
        points[k] = (savedPoints[k] || 0) + val;
      }
    }
  });

  editModeKeys.add(key);
  renderAssignTable();

  // Restore non-editing participants' delta values in their inputs
  participants.forEach(p => {
    const k = p.id + '-' + aId;
    if (k !== key && !editModeKeys.has(k)) {
      const input = document.getElementById('pv-' + k);
      if (input) {
        const delta = (points[k] || 0) - (savedPoints[k] || 0);
        input.value = Math.max(0, delta);
      }
    }
  });
}
