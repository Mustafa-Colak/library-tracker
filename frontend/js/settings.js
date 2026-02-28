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

// --- Tab Switching ---

function switchSettingsTab(tabId) {
  document.querySelectorAll('.settings-tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.settings-tabs button').forEach(btn => btn.classList.remove('active'));
  const panel = document.getElementById(tabId);
  if (panel) panel.classList.add('active');
  const btn = document.querySelector(`.settings-tabs button[data-tab="${tabId}"]`);
  if (btn) btn.classList.add('active');
  localStorage.setItem('settingsTab', tabId);
}

function switchMetadataTab(type) {
  document.querySelectorAll('.metadata-tab-panel').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.metadata-tabs button').forEach(btn => btn.classList.remove('active'));
  const panel = document.getElementById('metaPanel_' + type);
  if (panel) panel.classList.add('active');
  const btn = document.querySelector(`.metadata-tabs button[data-meta-tab="${type}"]`);
  if (btn) btn.classList.add('active');
  localStorage.setItem('metadataTab', type);
}

// --- Metadata CRUD ---

const META_INPUT_MAP = {
  authors: 'addAuthorInput',
  publishers: 'addPublisherInput',
  categories: 'addCategoryInput',
};

const META_LIST_MAP = {
  authors: 'authorsList',
  publishers: 'publishersList',
  categories: 'categoriesList',
};

// Client-side cache for filtering
const metadataCache = { authors: [], publishers: [], categories: [] };

async function loadMetadata(type) {
  try {
    const items = await apiGet('/api/metadata/' + type);
    metadataCache[type] = items;
    // Clear search on reload
    const searchInput = document.getElementById(type + 'Search');
    if (searchInput) searchInput.value = '';
    renderMetadata(type, items);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function renderMetadata(type, items) {
  const tbody = document.getElementById(META_LIST_MAP[type]);
  const countEl = document.getElementById(type + 'Count');
  if (!tbody) return;

  // Update count
  const total = metadataCache[type].length;
  if (countEl) {
    countEl.textContent = items.length === total
      ? `(${total})`
      : `(${items.length}/${total})`;
  }

  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="2" style="color:var(--gray-400);text-align:center;">${t('common.no_data')}</td></tr>`;
    return;
  }
  tbody.innerHTML = items.map(item => `
    <tr id="meta-${type}-${item.id}">
      <td><span class="meta-name" ondblclick="startEditMetadata('${type}', ${item.id}, this)">${esc(item.name)}</span></td>
      <td style="text-align:right;">
        <button class="btn btn-outline btn-sm" onclick="startEditMetadata('${type}', ${item.id}, this.closest('tr').querySelector('.meta-name'))" title="${t('common.edit')}">&#9998;</button>
        <button class="btn btn-danger btn-sm" onclick="deleteMetadataItem('${type}', ${item.id})" title="${t('common.delete')}">&#128465;</button>
      </td>
    </tr>
  `).join('');
}

function filterMetadata(type) {
  const query = (document.getElementById(type + 'Search')?.value || '').toLowerCase().trim();
  const items = query
    ? metadataCache[type].filter(item => item.name.toLowerCase().includes(query))
    : metadataCache[type];
  renderMetadata(type, items);
}

function loadAllMetadata() {
  loadMetadata('authors');
  loadMetadata('publishers');
  loadMetadata('categories');
}

async function addMetadataItem(type) {
  const input = document.getElementById(META_INPUT_MAP[type]);
  const name = input.value.trim();
  if (!name) return;
  try {
    await apiPost('/api/metadata/' + type, { name });
    showToast(t('metadata.added'));
    input.value = '';
    loadMetadata(type);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function startEditMetadata(type, id, spanEl) {
  if (spanEl.querySelector('input')) return;
  const oldName = spanEl.textContent;
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'edit-input';
  input.value = oldName;
  spanEl.textContent = '';
  spanEl.appendChild(input);
  input.focus();
  input.select();

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEditMetadata(type, id, input.value.trim(), spanEl, oldName);
    } else if (e.key === 'Escape') {
      spanEl.textContent = oldName;
    }
  });
  input.addEventListener('blur', () => {
    setTimeout(() => {
      if (spanEl.querySelector('input')) {
        spanEl.textContent = oldName;
      }
    }, 150);
  });
}

async function saveEditMetadata(type, id, newName, spanEl, oldName) {
  if (!newName || newName === oldName) {
    spanEl.textContent = oldName;
    return;
  }
  try {
    await apiPut(`/api/metadata/${type}/${id}`, { name: newName });
    showToast(t('metadata.updated'));
    loadMetadata(type);
  } catch (e) {
    showToast(e.message, 'error');
    spanEl.textContent = oldName;
  }
}

async function deleteMetadataItem(type, id) {
  const ok = await showConfirm(t('common.confirm_delete'));
  if (!ok) return;
  try {
    await apiDelete(`/api/metadata/${type}/${id}`);
    showToast(t('metadata.deleted'));
    loadMetadata(type);
  } catch (e) {
    showToast(e.message, 'error');
  }
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

    const isLast = data.backups.length === 1;
    tbody.innerHTML = data.backups.map(b => `
      <tr>
        <td>${esc(b.filename)}</td>
        <td>${formatFileSize(b.size)}</td>
        <td>${new Date(b.created_at).toLocaleString()}</td>
        <td class="backup-actions">
          <button class="btn btn-outline btn-sm" onclick="downloadBackup('${esc(b.filename)}')" title="${t('backup.download')}">&#11015;</button>
          <button class="btn btn-danger btn-sm" onclick="deleteBackup('${esc(b.filename)}')" title="${isLast ? t('backup.cannot_delete_last') : t('common.delete')}" ${isLast ? 'disabled' : ''}>&#128465;</button>
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
    const msg = e.message?.includes('last backup') ? t('backup.cannot_delete_last') : e.message;
    showToast(msg, 'error');
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
  loadAllMetadata();
  document.getElementById('passwordForm')?.addEventListener('submit', changePassword);

  // Restore last active tabs
  const savedTab = localStorage.getItem('settingsTab');
  if (savedTab) switchSettingsTab(savedTab);
  const savedMetaTab = localStorage.getItem('metadataTab');
  if (savedMetaTab) switchMetadataTab(savedMetaTab);

  // Re-render metadata on language change
  onLanguageChange(() => loadAllMetadata());

  // Allow Enter to add metadata items
  document.querySelectorAll('.metadata-add-row input').forEach(input => {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        input.closest('.metadata-add-row').querySelector('button').click();
      }
    });
  });
});
