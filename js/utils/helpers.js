// ========== UTILS ==========
let idCounter = Date.now();
const uid = () => ++idCounter;

function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

function logoHTML(p) {
  return p.logoType === 'image'
    ? `<img src="${p.logo}" class="img-preview">`
    : `<span class="participant-avatar">${p.logo}</span>`;
}

function getBarColor(name) {
  const n = name.toLowerCase().trim();
  if (n.includes('heroes de fe')) return '#f10909';
  if (n.includes('portadores de luz')) return '#e6f513';
  if (n.includes('leones de judá')) return '#0e9740';
  // Varones (senior) → azul claro
  if (n.includes('varones (senior)')) return '#2f6fe4';
  // Damas (senior) → palo de rosa
  if (n.includes('damas (senior)')) return '#d98695';
  return n;
}

function sanitizeFilename(text) {
  return String(text || 'archivo').toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

// Formats an ISO date string into a readable local date/time (dd/mm/yyyy hh:mm)
function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

