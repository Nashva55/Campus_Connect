(function () {
  const auth = window.CampusConnectAuth;

  if (!auth) {
    return;
  }

  const token = auth.getToken();
  const role = auth.getRole();

  if (!token) {
    return;
  }

  function getLogoutTarget() {
    return role === 'admin' ? 'instructor-login.html' : 'login.html';
  }

  function handleLogout() {
    auth.clearSession();
    window.location.href = getLogoutTarget();
  }

  const navLinks = document.querySelector('.nav-links');
  if (navLinks && !navLinks.querySelector('.nav-logout-btn')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'nav-logout-btn';
    button.textContent = 'Logout';
    button.setAttribute('aria-label', 'Logout');
    button.addEventListener('click', handleLogout);
    navLinks.appendChild(button);
  }

  const adminBrand = document.querySelector('.admin-brand');
  if (adminBrand && !adminBrand.querySelector('.admin-logout-btn')) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'admin-logout-btn';
    button.textContent = 'Logout';
    button.addEventListener('click', handleLogout);
    adminBrand.appendChild(button);
  }
})();
