const API_BASE = '';

// XSS protection - escape HTML entities
function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function api(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const headers = { 'Content-Type': 'application/json' };

  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = { headers, ...options };
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }
  const res = await fetch(url, config);

  // On 401, clear auth and redirect to login
  if (res.status === 401) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    if (!window.location.pathname.includes('login.html')) {
      window.location.href = '/login.html';
    }
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function apiGet(path) { return api(path); }
function apiPost(path, body) { return api(path, { method: 'POST', body }); }
function apiPut(path, body) { return api(path, { method: 'PUT', body }); }
function apiDelete(path) { return api(path, { method: 'DELETE' }); }

// Toast notifications
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${esc(message)}</span><button class="toast-close" onclick="this.parentElement.remove()">&times;</button>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Custom confirm dialog (replaces browser confirm)
function showConfirm(message) {
  return new Promise(resolve => {
    let dialog = document.getElementById('confirmDialog');
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.id = 'confirmDialog';
      dialog.innerHTML = `
        <div class="dialog-header">
          <h2 data-i18n="common.confirm_title">${t ? t('common.confirm_title') || 'Confirm' : 'Confirm'}</h2>
          <button class="dialog-close" id="confirmClose">&times;</button>
        </div>
        <div class="dialog-body"><p id="confirmMessage"></p></div>
        <div class="dialog-footer">
          <button class="btn btn-outline" id="confirmNo">${t ? t('common.cancel') || 'Cancel' : 'Cancel'}</button>
          <button class="btn btn-danger" id="confirmYes">${t ? t('common.confirm_yes') || 'Yes' : 'Yes'}</button>
        </div>`;
      document.body.appendChild(dialog);
    }
    document.getElementById('confirmMessage').textContent = message;
    const close = (val) => { dialog.close(); resolve(val); };
    document.getElementById('confirmYes').onclick = () => close(true);
    document.getElementById('confirmNo').onclick = () => close(false);
    document.getElementById('confirmClose').onclick = () => close(false);
    dialog.onclose = () => resolve(false);
    dialog.showModal();
  });
}

// Loading skeleton for tables
function showTableLoading(tbodyId, colSpan) {
  const tbody = document.getElementById(tbodyId);
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="${colSpan}" class="loading-state">
    <div class="spinner"></div><p>${t ? t('common.loading') || 'Loading...' : 'Loading...'}</p>
  </td></tr>`;
}

// Pagination helper
function renderPagination(container, data, loadFn) {
  const totalPages = Math.ceil(data.total / data.limit);
  if (totalPages <= 1) { container.innerHTML = ''; return; }

  let html = '';
  html += `<button onclick="${loadFn}(${data.page - 1})" ${data.page <= 1 ? 'disabled' : ''}>&laquo;</button>`;

  const maxVisible = 5;
  let start = Math.max(1, data.page - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

  if (start > 1) html += `<button onclick="${loadFn}(1)">1</button><span class="page-dots">...</span>`;
  for (let i = start; i <= end; i++) {
    html += `<button class="${i === data.page ? 'active' : ''}" onclick="${loadFn}(${i})">${i}</button>`;
  }
  if (end < totalPages) html += `<span class="page-dots">...</span><button onclick="${loadFn}(${totalPages})">${totalPages}</button>`;

  html += `<button onclick="${loadFn}(${data.page + 1})" ${data.page >= totalPages ? 'disabled' : ''}>&raquo;</button>`;
  html += `<span class="page-info">${data.page} / ${totalPages}</span>`;
  container.innerHTML = html;
}

// Mobile sidebar toggle
function toggleSidebar() {
  document.querySelector('.sidebar')?.classList.toggle('sidebar-open');
  document.querySelector('.sidebar-overlay')?.classList.toggle('active');
}

// Close sidebar when clicking overlay
document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('.sidebar-overlay')) {
    const overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.onclick = toggleSidebar;
    document.body.appendChild(overlay);
  }
});
