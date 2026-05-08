// ========== RANKING UI ==========
function renderRanking() {
  const el = document.getElementById('rankingList');
  if (!participants.length) { el.innerHTML = '<div class="empty-state">No hay participantes.</div>'; return; }

  const data = participants.map(p => {
    const m = activities.filter(a => a.type === 'Mision').reduce((s, a) => s + (points[p.id + '-' + a.id] || 0), 0);
    const c = activities.filter(a => a.type === 'Comunion').reduce((s, a) => s + (points[p.id + '-' + a.id] || 0), 0);
    const r = activities.filter(a => a.type === 'Relacion').reduce((s, a) => s + (points[p.id + '-' + a.id] || 0), 0);
    return { ...p, mision: m, comunion: c, relacion: r, total: m + c + r };
  }).sort((a, b) => b.total - a.total);

  const max = Math.max(data[0]?.total || 1, 1);

  el.innerHTML = data.map((p, i) => {
    const posClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i + 1);
    const pct = (p.total / max * 100).toFixed(1);
    return `<div class="ranking-item">
      <div class="ranking-pos ${posClass}">${medal}</div>
      <div style="font-size:1.8rem;">${p.logoType === 'image' ? `<img src="${p.logo}" class="img-preview" style="width:42px;height:42px;">` : p.logo}</div>
      <div class="ranking-info">
        <div class="ranking-name">${esc(p.name)}</div>
        <div class="ranking-bar-bg"><div class="ranking-bar" style="width:${pct}%;background:${getBarColor(p.name)}"></div></div>
        <div class="ranking-details">
          <span><span class="color-dot dot-mision"></span> ${p.mision}</span>
          <span><span class="color-dot dot-comunion"></span> ${p.comunion}</span>
          <span><span class="color-dot dot-relacion"></span> ${p.relacion}</span>
        </div>
      </div>
      <div class="ranking-total">${p.total}</div>
    </div>`;
  }).join('');
}
