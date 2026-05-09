// ========== MEMBER UI ==========
const MEMBERS_PAGE_SIZE = 10;
let memberListNameFilter = '';
let memberListCurrentPage = 1;
let memberReportNameFilter = '';
let memberReportCurrentPage = 1;

function normalizeMemberSearch(value) {
  return String(value || '').toLowerCase().trim();
}

function memberMatchesName(m, nameFilter) {
  if (!nameFilter) return true;
  const fullName = `${m.nombre || ''} ${m.apellido || ''}`.toLowerCase();
  return fullName.includes(nameFilter);
}

function paginateMembers(items, currentPage) {
  const totalPages = Math.max(1, Math.ceil(items.length / MEMBERS_PAGE_SIZE));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const start = (safePage - 1) * MEMBERS_PAGE_SIZE;
  return {
    safePage,
    totalPages,
    pageItems: items.slice(start, start + MEMBERS_PAGE_SIZE),
    startIndex: start
  };
}

function getSafePageHandler(pageChangeHandler) {
  const allowedHandlers = ['changeMemberListPage', 'changeMemberReportPage'];
  return allowedHandlers.includes(pageChangeHandler) ? pageChangeHandler : 'changeMemberListPage';
}

function buildMembersPaginationHTML(currentPage, totalPages, pageChangeHandler) {
  if (totalPages <= 1) return '';
  const safeHandler = getSafePageHandler(pageChangeHandler);
  const pages = Array.from({ length: totalPages }, (_, i) => {
    const page = i + 1;
    const activeClass = page === currentPage ? ' active' : '';
    return `<button class="pagination-btn${activeClass}" onclick="${safeHandler}(${page})">${page}</button>`;
  }).join('');
  return `<div class="table-pagination">
    <button class="pagination-btn" onclick="${safeHandler}(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Anterior</button>
    <div class="pagination-pages">${pages}</div>
    <button class="pagination-btn" onclick="${safeHandler}(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Siguiente</button>
  </div>`;
}

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
  refreshMemberReportGPFilter();
}

function renderMembers() {
  const el = document.getElementById('memberList');
  const nameInput = document.getElementById('memberNameFilter');
  if (nameInput) {
    memberListNameFilter = normalizeMemberSearch(nameInput.value);
  }
  if (!members.length) {
    el.innerHTML = '<div class="empty-state">No hay miembros registrados.</div>';
    renderMemberReportTable();
    return;
  }

  const filtered = members.filter(m => memberMatchesName(m, memberListNameFilter));
  if (!filtered.length) {
    el.innerHTML = '<div class="empty-state">No hay miembros para la búsqueda ingresada.</div>';
    renderMemberReportTable();
    return;
  }

  const pagination = paginateMembers(filtered, memberListCurrentPage);
  memberListCurrentPage = pagination.safePage;

  el.innerHTML = `<table>
    <tr><th>#</th><th>Nombre</th><th>Apellido</th><th>GP</th><th>Acciones</th></tr>
    ${pagination.pageItems.map((m, i) => {
      const gp = participants.find(p => p.id === m.gpId);
      const gpName = gp ? gp.name : (m.gpName || 'GP no disponible');
      return `<tr>
        <td>${pagination.startIndex + i + 1}</td>
        <td>${esc(m.nombre || '')}</td>
        <td>${esc(m.apellido || '')}</td>
        <td>${esc(gpName)}</td>
        <td><div class="action-btns">
          <button class="btn btn-edit" onclick="editMember(${m.id})">✏️</button>
          <button class="btn btn-danger" onclick="removeMember(${m.id})">✕</button>
        </div></td>
      </tr>`;
    }).join('')}
  </table>
  ${buildMembersPaginationHTML(pagination.safePage, pagination.totalPages, 'changeMemberListPage')}`;
  renderMemberReportTable();
}

function filterMemberListByName() {
  const input = document.getElementById('memberNameFilter');
  memberListNameFilter = normalizeMemberSearch(input ? input.value : '');
  memberListCurrentPage = 1;
  renderMembers();
}

function changeMemberListPage(page) {
  memberListCurrentPage = page;
  renderMembers();
}

function refreshMemberReportGPFilter() {
  const select = document.getElementById('memberReportGpFilter');
  if (!select) return;
  const prevVal = select.value;
  select.innerHTML = '<option value="">Todos</option>' +
    participants.map(p => `<option value="${p.id}">${esc(p.name)}</option>`).join('');
  if (prevVal === '' || participants.some(p => String(p.id) === String(prevVal))) {
    select.value = prevVal;
  }
  renderMemberReportTable();
}

function getFilteredMembersForReport() {
  const filterEl = document.getElementById('memberReportGpFilter');
  const gpId = filterEl ? filterEl.value : '';
  const nameInput = document.getElementById('memberReportNameFilter');
  memberReportNameFilter = normalizeMemberSearch(nameInput ? nameInput.value : '');
  const gpFiltered = gpId
    ? members.filter(m => String(m.gpId) === String(gpId))
    : members.slice();
  return gpFiltered.filter(m => memberMatchesName(m, memberReportNameFilter));
}

function filterMemberReportByGP() {
  memberReportCurrentPage = 1;
  renderMemberReportTable();
}

function filterMemberReportByName() {
  const input = document.getElementById('memberReportNameFilter');
  memberReportNameFilter = normalizeMemberSearch(input ? input.value : '');
  memberReportCurrentPage = 1;
  renderMemberReportTable();
}

function renderMemberReportTable() {
  const wrap = document.getElementById('memberReportTableWrap');
  if (!wrap) return;

  const filtered = getFilteredMembersForReport();
  if (!filtered.length) {
    wrap.innerHTML = '<div class="empty-state">No hay miembros para el filtro seleccionado.</div>';
    return;
  }

  const pagination = paginateMembers(filtered, memberReportCurrentPage);
  memberReportCurrentPage = pagination.safePage;

  wrap.innerHTML = `<table>
    <tr><th>#</th><th>Nombre</th><th>Apellido</th><th>GP</th></tr>
    ${pagination.pageItems.map((m, i) => {
      const gp = participants.find(p => p.id === m.gpId);
      const gpName = gp ? gp.name : (m.gpName || 'GP no disponible');
      return `<tr>
        <td>${pagination.startIndex + i + 1}</td>
        <td>${esc(m.nombre || '')}</td>
        <td>${esc(m.apellido || '')}</td>
        <td>${esc(gpName)}</td>
      </tr>`;
    }).join('')}
  </table>
  ${buildMembersPaginationHTML(pagination.safePage, pagination.totalPages, 'changeMemberReportPage')}`;
}

function changeMemberReportPage(page) {
  memberReportCurrentPage = page;
  renderMemberReportTable();
}

function printMembersReportPDF() {
  const filtered = getFilteredMembersForReport();
  if (!filtered.length) return alert('No hay miembros para imprimir.');

  const filterEl = document.getElementById('memberReportGpFilter');
  const gpId = filterEl ? filterEl.value : '';
  const gp = participants.find(p => String(p.id) === String(gpId));
  const groupLabel = gp ? gp.name : 'Todos los grupos';

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text('Manejo de Puntos - JA Vinto Central', 14, 15);
  doc.setFontSize(10);
  doc.text('Reporte de Miembros', 14, 22);
  doc.text('Grupo: ' + groupLabel, 14, 28);
  doc.text('Fecha de generación: ' + new Date().toLocaleString('es-BO'), 14, 34);

  doc.autoTable({
    startY: 40,
    head: [['#', 'Nombre', 'Apellido', 'GP']],
    body: filtered.map((m, i) => {
      const memberGp = participants.find(p => p.id === m.gpId);
      const gpName = memberGp ? memberGp.name : (m.gpName || 'GP no disponible');
      return [String(i + 1), m.nombre || '', m.apellido || '', gpName];
    }),
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [241, 245, 249] }
  });

  const safeGroup = sanitizeFilename(groupLabel);
  doc.save('reporte_miembros_' + safeGroup + '.pdf');
}
