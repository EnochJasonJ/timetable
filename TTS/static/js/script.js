// ============================================================
// Timetable Management System — Client-Side JavaScript
// ============================================================

document.addEventListener('DOMContentLoaded', function () {

  // ── Sidebar Toggle (Mobile) ──────────────────────────────
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('open');
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  }

  if (hamburgerBtn) hamburgerBtn.addEventListener('click', openSidebar);
  if (overlay) overlay.addEventListener('click', closeSidebar);

  // ── Active Nav Link ──────────────────────────────────────
  document.querySelectorAll('.sidebar-nav a').forEach(link => {
    if (link.getAttribute('href') === window.location.pathname) {
      link.classList.add('active');
    }
  });

  // ── Theme Toggle ─────────────────────────────────────────
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;

  // Load saved theme
  const savedTheme = localStorage.getItem('tms-theme') || 'light';
  html.setAttribute('data-theme', savedTheme);
  updateThemeButton(savedTheme);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('tms-theme', next);
      updateThemeButton(next);
    });
  }

  function updateThemeButton(theme) {
    if (!themeToggle) return;
    const icon = themeToggle.querySelector('i');
    const label = themeToggle.querySelector('span');
    if (theme === 'dark') {
      icon.className = 'bi bi-sun-fill';
      label.textContent = 'Light Mode';
    } else {
      icon.className = 'bi bi-moon-fill';
      label.textContent = 'Dark Mode';
    }
  }

  // ── Auto-dismiss Messages ────────────────────────────────
  document.querySelectorAll('.message-alert').forEach(msg => {
    setTimeout(() => {
      msg.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      msg.style.opacity = '0';
      msg.style.transform = 'translateY(-8px)';
      setTimeout(() => msg.remove(), 400);
    }, 5000);
  });

  // ── Confirmation Dialogs ─────────────────────────────────
  // Already handled with onclick="return confirm(...)" in templates

  // ── Filter Bar: Auto-submit on change ────────────────────
  // Already handled with onchange="this.form.submit()" in templates

  // ── Print Handler ────────────────────────────────────────
  // Uses native window.print() triggered by print buttons

});