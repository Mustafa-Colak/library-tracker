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

document.addEventListener('DOMContentLoaded', async () => {
  await i18nReady;
  if (!initAuth()) return;
  if (!hasRole('admin')) {
    window.location.href = '/index.html';
    return;
  }
  loadBranding();
  document.getElementById('passwordForm')?.addEventListener('submit', changePassword);
});
