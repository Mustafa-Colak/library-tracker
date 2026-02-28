// Auth token management
function getToken() {
  return localStorage.getItem('auth_token');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('auth_user'));
  } catch { return null; }
}

function saveAuth(data) {
  localStorage.setItem('auth_token', data.access_token);
  localStorage.setItem('auth_user', JSON.stringify(data.user));
}

function clearAuth() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

function logout() {
  clearAuth();
  window.location.href = '/login.html';
}

// Redirect to login if not authenticated
function requireAuth() {
  if (!getToken()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

// Check if current user has one of the given roles
function hasRole(...roles) {
  const user = getUser();
  return user && roles.includes(user.role);
}

// Hide/show elements based on data-role attribute
function applyRoleVisibility() {
  const user = getUser();
  if (!user) return;
  document.querySelectorAll('[data-role]').forEach(el => {
    const roles = el.getAttribute('data-role').split(',').map(r => r.trim());
    el.style.display = roles.includes(user.role) ? '' : 'none';
  });
}

// Render user info in sidebar
function renderUserInfo() {
  const user = getUser();
  const container = document.getElementById('userInfo');
  if (!container || !user) return;

  const roleLabels = { admin: t('auth.role_admin'), operator: t('auth.role_operator'), user: t('auth.role_user') };
  const roleBadge = { admin: 'badge-role-admin', operator: 'badge-role-operator', user: 'badge-role-user' };

  container.innerHTML = `
    <div class="sidebar-user-info">
      <div class="sidebar-user-avatar">${esc(user.full_name.charAt(0).toUpperCase())}</div>
      <div class="sidebar-user-details">
        <div class="sidebar-user-name">${esc(user.full_name)}</div>
        <span class="badge ${roleBadge[user.role] || 'badge-role-user'}">${roleLabels[user.role] || user.role}</span>
      </div>
    </div>
    <button class="btn-logout" onclick="logout()" title="${t('auth.logout')}">&#x23FB;</button>
  `;
}

// Init auth on every page (except login)
function initAuth() {
  if (!requireAuth()) return false;
  renderUserInfo();
  applyRoleVisibility();
  return true;
}

// Re-render user info when language changes
if (typeof onLanguageChange === 'function') {
  onLanguageChange(() => renderUserInfo());
}

window.getToken = getToken;
window.getUser = getUser;
window.saveAuth = saveAuth;
window.clearAuth = clearAuth;
window.logout = logout;
window.requireAuth = requireAuth;
window.hasRole = hasRole;
window.applyRoleVisibility = applyRoleVisibility;
window.renderUserInfo = renderUserInfo;
window.initAuth = initAuth;
