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
  if (n.includes('heroes de fe')) return '#ef4444';
  if (n.includes('portadores de luz')) return '#f59e0b';
  if (n.includes('leones de juda')) return '#22c55e';
  return 'linear-gradient(90deg, var(--mision), var(--relacion))';
}

function sanitizeFilename(text) {
  return String(text || 'archivo').toLowerCase().replace(/[^a-z0-9]+/g, '_');
}
