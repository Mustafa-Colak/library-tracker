let currentPage = 1;

async function loadMembers(page = 1) {
  currentPage = page;
  const search = document.getElementById('searchInput')?.value || '';
  const type = document.getElementById('typeFilter')?.value || '';
  let path = `/api/members?page=${page}&limit=20`;
  if (search) path += `&search=${encodeURIComponent(search)}`;
  if (type) path += `&type=${encodeURIComponent(type)}`;

  showTableLoading('membersTable', 7);
  try {
    const data = await apiGet(path);
    renderMembers(data.items);
    renderPagination(document.getElementById('pagination'), data, 'loadMembers');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function renderMembers(members) {
  const tbody = document.getElementById('membersTable');
  if (!members.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">
      <div class="empty-icon">&#128101;</div>
      <p>${t('common.no_data')}</p>
    </td></tr>`;
    return;
  }
  const typeLabels = { student: t('member.student'), teacher: t('member.teacher'), staff: t('member.staff') };
  const typeBadges = { student: 'badge-student', teacher: 'badge-teacher', staff: 'badge-staff' };

  tbody.innerHTML = members.map(m => `
    <tr>
      <td><code>${esc(m.member_no)}</code></td>
      <td><strong>${esc(m.name)} ${esc(m.surname)}</strong></td>
      <td><span class="badge ${typeBadges[m.member_type]}">${typeLabels[m.member_type] || esc(m.member_type)}</span></td>
      <td>${esc(m.class_grade) || '<span class="text-muted">-</span>'}</td>
      <td>${esc(m.email) || '<span class="text-muted">-</span>'}</td>
      <td>${esc(m.phone) || '<span class="text-muted">-</span>'}</td>
      <td class="actions">
        ${hasRole('admin','operator') ? `<button class="btn btn-outline btn-sm btn-icon" onclick="editMember(${m.id})" title="${t('common.edit')}">&#9998;</button>` : ''}
        ${hasRole('admin') ? `<button class="btn btn-danger btn-sm btn-icon" onclick="deleteMember(${m.id})" title="${t('common.delete')}">&#128465;</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function openAddMember() {
  document.getElementById('memberForm').reset();
  document.getElementById('memberId').value = '';
  document.getElementById('memberDialogTitle').textContent = t('member.add');
  document.getElementById('memberDialog').showModal();
}

async function editMember(id) {
  try {
    const m = await apiGet(`/api/members/${id}`);
    document.getElementById('memberId').value = m.id;
    document.getElementById('memberNo').value = m.member_no;
    document.getElementById('name').value = m.name;
    document.getElementById('surname').value = m.surname;
    document.getElementById('memberType').value = m.member_type;
    document.getElementById('classGrade').value = m.class_grade || '';
    document.getElementById('email').value = m.email || '';
    document.getElementById('phone').value = m.phone || '';
    document.getElementById('memberDialogTitle').textContent = t('member.edit');
    document.getElementById('memberDialog').showModal();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function saveMember(e) {
  e.preventDefault();
  const id = document.getElementById('memberId').value;
  const data = {
    member_no: document.getElementById('memberNo').value,
    name: document.getElementById('name').value,
    surname: document.getElementById('surname').value,
    member_type: document.getElementById('memberType').value,
    class_grade: document.getElementById('classGrade').value || null,
    email: document.getElementById('email').value || null,
    phone: document.getElementById('phone').value || null,
  };

  try {
    if (id) {
      await apiPut(`/api/members/${id}`, data);
      showToast(t('member.updated'));
    } else {
      await apiPost('/api/members', data);
      showToast(t('member.added'));
    }
    document.getElementById('memberDialog').close();
    loadMembers(currentPage);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function deleteMember(id) {
  const ok = await showConfirm(t('common.confirm_delete'));
  if (!ok) return;
  try {
    await apiDelete(`/api/members/${id}`);
    showToast(t('member.deleted'));
    loadMembers(currentPage);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function searchMembers() {
  loadMembers(1);
}

document.addEventListener('DOMContentLoaded', async () => {
  await i18nReady;
  if (!initAuth()) return;
  loadMembers();
  document.getElementById('memberForm')?.addEventListener('submit', saveMember);
});
