async function loadUsers() {
  showTableLoading('usersTable', 5);
  try {
    const users = await apiGet('/api/auth/users');
    renderUsers(users);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function renderUsers(users) {
  const tbody = document.getElementById('usersTable');
  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">
      <div class="empty-icon">&#128100;</div>
      <p>${t('common.no_data')}</p>
    </td></tr>`;
    return;
  }

  const roleLabels = { admin: t('auth.role_admin'), operator: t('auth.role_operator'), user: t('auth.role_user') };
  const roleBadges = { admin: 'badge-role-admin', operator: 'badge-role-operator', user: 'badge-role-user' };
  const currentUser = getUser();

  tbody.innerHTML = users.map(u => `
    <tr>
      <td><code>${esc(u.username)}</code></td>
      <td><strong>${esc(u.full_name)}</strong></td>
      <td><span class="badge ${roleBadges[u.role] || ''}">${roleLabels[u.role] || esc(u.role)}</span></td>
      <td>${u.is_active
        ? `<span class="badge badge-active">${t('common.active')}</span>`
        : `<span class="badge badge-overdue">${t('common.inactive')}</span>`}</td>
      <td class="actions">
        <button class="btn btn-outline btn-sm btn-icon" onclick="editUser(${u.id})" title="${t('common.edit')}">&#9998;</button>
        ${u.id !== currentUser.id ? `<button class="btn btn-danger btn-sm btn-icon" onclick="deleteUser(${u.id})" title="${t('common.delete')}">&#128465;</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function openAddUser() {
  document.getElementById('userForm').reset();
  document.getElementById('userId').value = '';
  document.getElementById('userDialogTitle').textContent = t('user.add');
  document.getElementById('password').required = true;
  document.getElementById('passwordHint').style.display = 'none';
  document.getElementById('userDialog').showModal();
}

async function editUser(id) {
  try {
    const users = await apiGet('/api/auth/users');
    const user = users.find(u => u.id === id);
    if (!user) { showToast('User not found', 'error'); return; }

    document.getElementById('userId').value = user.id;
    document.getElementById('username').value = user.username;
    document.getElementById('fullName').value = user.full_name;
    document.getElementById('role').value = user.role;
    document.getElementById('password').value = '';
    document.getElementById('password').required = false;
    document.getElementById('passwordHint').style.display = '';
    document.getElementById('userDialogTitle').textContent = t('user.edit');
    document.getElementById('userDialog').showModal();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function saveUser(e) {
  e.preventDefault();
  const id = document.getElementById('userId').value;
  const data = {
    username: document.getElementById('username').value,
    full_name: document.getElementById('fullName').value,
    role: document.getElementById('role').value,
  };
  const pw = document.getElementById('password').value;
  if (pw) data.password = pw;

  try {
    if (id) {
      await apiPut(`/api/auth/users/${id}`, data);
      showToast(t('user.updated'));
    } else {
      if (!pw) { showToast(t('user.password') + ' required', 'error'); return; }
      await apiPost('/api/auth/users', data);
      showToast(t('user.added'));
    }
    document.getElementById('userDialog').close();
    loadUsers();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function deleteUser(id) {
  const currentUser = getUser();
  if (currentUser && currentUser.id === id) {
    showToast(t('user.cannot_delete_self'), 'error');
    return;
  }
  const ok = await showConfirm(t('common.confirm_delete'));
  if (!ok) return;
  try {
    await apiDelete(`/api/auth/users/${id}`);
    showToast(t('user.deleted'));
    loadUsers();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await i18nReady;
  if (!initAuth()) return;
  if (!hasRole('admin')) {
    window.location.href = '/index.html';
    return;
  }
  loadUsers();
  document.getElementById('userForm')?.addEventListener('submit', saveUser);
});
