async function loadBranding() {
  try {
    const data = await apiGet('/api/settings/branding');
    document.getElementById('orgName').value = data.org_name || '';

    const preview = document.getElementById('logoPreview');
    const deleteBtn = document.getElementById('deleteLogo');

    if (data.logo_url) {
      preview.innerHTML = `<img src="${esc(data.logo_url)}?t=${Date.now()}" alt="Logo">`;
      deleteBtn.style.display = '';
    } else {
      preview.innerHTML = '<span class="empty-logo">&#128247;</span>';
      deleteBtn.style.display = 'none';
    }
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function saveOrgName() {
  const orgName = document.getElementById('orgName').value.trim();
  try {
    await apiPut('/api/settings/branding', { org_name: orgName });
    showToast(t('settings.saved'));
    // Update sidebar logo text if org name is set
    updateAppName(orgName);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function uploadLogo() {
  const fileInput = document.getElementById('logoFile');
  const file = fileInput.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const token = getToken();
    const res = await fetch(API_BASE + '/api/settings/branding/logo', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Upload failed');
    }
    showToast(t('settings.logo_uploaded'));
    loadBranding();
  } catch (e) {
    showToast(e.message, 'error');
  }
  fileInput.value = '';
}

async function deleteLogo() {
  const ok = await showConfirm(t('common.confirm_delete'));
  if (!ok) return;
  try {
    await apiDelete('/api/settings/branding/logo');
    showToast(t('settings.logo_deleted'));
    loadBranding();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function changePassword(e) {
  e.preventDefault();
  const current = document.getElementById('currentPassword').value;
  const newPw = document.getElementById('newPassword').value;

  try {
    await apiPut('/api/auth/me/password', {
      current_password: current,
      new_password: newPw,
    });
    showToast(t('auth.password_changed'));
    document.getElementById('passwordForm').reset();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function updateAppName(orgName) {
  const el = document.querySelector('[data-i18n="app.name"]');
  if (el && orgName) el.textContent = orgName;
}

// --- Backup Management ---

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function loadBackups() {
  try {
    const data = await apiGet('/api/system/backups');
    const tbody = document.getElementById('backupList');
    const table = document.getElementById('backupTable');
    const noMsg = document.getElementById('noBackups');

    if (!data.backups || data.backups.length === 0) {
      table.style.display = 'none';
      noMsg.style.display = '';
      return;
    }

    table.style.display = '';
    noMsg.style.display = 'none';

    tbody.innerHTML = data.backups.map(b => `
      <tr>
        <td>${esc(b.filename)}</td>
        <td>${formatFileSize(b.size)}</td>
        <td>${new Date(b.created_at).toLocaleString()}</td>
        <td class="backup-actions">
          <button class="btn btn-outline btn-sm" onclick="downloadBackup('${esc(b.filename)}')" title="${t('backup.download')}">&#11015;</button>
          <button class="btn btn-danger btn-sm" onclick="deleteBackup('${esc(b.filename)}')" title="${t('common.delete')}">&#128465;</button>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function createBackup() {
  const btn = document.getElementById('btnCreateBackup');
  btn.disabled = true;
  try {
    await apiPost('/api/system/backups');
    showToast(t('backup.created'));
    loadBackups();
  } catch (e) {
    showToast(e.message, 'error');
  } finally {
    btn.disabled = false;
  }
}

function downloadBackup(filename) {
  const token = getToken();
  fetch(API_BASE + `/api/system/backups/${encodeURIComponent(filename)}/download`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
    .then(res => {
      if (!res.ok) throw new Error('Download failed');
      return res.blob();
    })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch(e => showToast(e.message, 'error'));
}

async function deleteBackup(filename) {
  const ok = await showConfirm(t('backup.confirm_delete'));
  if (!ok) return;
  try {
    await apiDelete(`/api/system/backups/${encodeURIComponent(filename)}`);
    showToast(t('backup.deleted'));
    loadBackups();
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
  loadBranding();
  loadBackups();
  document.getElementById('passwordForm')?.addEventListener('submit', changePassword);
});
