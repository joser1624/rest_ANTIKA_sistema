
// Header scroll effect
window.addEventListener('scroll', () => {
  document.getElementById('header-outer').classList.toggle('scrolled', window.scrollY > 60);
});

// Tab switching
function showTab(id, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + id).classList.add('active');
  btn.classList.add('active');
}

// Mobile menu
function toggleMenu() {
  document.getElementById('main-nav').classList.toggle('open');
}
function closeMenu() {
  document.getElementById('main-nav').classList.remove('open');
}

// ═══════════════════════════════════════════════════════════════
// CLIENT-SERVER ARCHITECTURE
// ═══════════════════════════════════════════════════════════════
// Frontend: Static HTML served by Live Server (port 5500)
// Backend: API + Admin Panel served by Node.js (port 3000)
// 
// Configuration:
// - API_BASE: Backend API endpoint
// - BACKEND_URL: Full URL to backend for redirects
// ═══════════════════════════════════════════════════════════════

// Configure these based on your setup
const API_BASE = 'http://localhost:3000/api';
const BACKEND_URL = 'http://localhost:3000';
const FRONTEND_URL = 'http://127.0.0.1:5500';

const ROLES = { 1: 'Administrador', 2: 'Cocinero', 3: 'Mozo', 4: 'Cliente' };
const ROLE_SECTIONS = {
  1: 'administracion',  // Admin → goes to admin panel (all sections)
  2: 'cocineros',       // Cocinero → goes to cocina section
  3: 'mozos',           // Mozo → goes to sala section
};

// Get current user from localStorage
function getCurrentUser() {
  try {
    const data = localStorage.getItem('antika_user');
    return data ? JSON.parse(data) : null;
  } catch { return null; }
}

// Save user to localStorage
function saveUser(user) {
  localStorage.setItem('antika_user', JSON.stringify(user));
}

// Remove user from localStorage
function clearUser() {
  localStorage.removeItem('antika_user');
}

// Open login modal
function openLoginModal() {
  const overlay = document.getElementById('loginOverlay');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  // Focus email field after animation
  setTimeout(() => document.getElementById('loginEmail').focus(), 350);
}

// Close login modal
function closeLoginModal(e) {
  if (e && e.target !== e.currentTarget) return;
  const overlay = document.getElementById('loginOverlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  // Reset form
  document.getElementById('loginForm').reset();
  document.getElementById('loginError').style.display = 'none';
}

// Toggle password visibility
function togglePassword() {
  const input = document.getElementById('loginPassword');
  const btn = input.nextElementSibling;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

// Handle login form submission
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorEl = document.getElementById('loginError');
  const submitBtn = document.getElementById('loginSubmitBtn');
  const submitText = submitBtn.querySelector('.login-submit-text');
  const spinner = submitBtn.querySelector('.login-spinner');

  // Show loading
  submitBtn.disabled = true;
  submitText.textContent = 'Verificando...';
  spinner.style.display = 'inline-block';
  errorEl.style.display = 'none';

  try {
    const res = await fetch(`${API_BASE}/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Error al iniciar sesión');
    }

    // Save user session
    saveUser(data);
    closeLoginModal();
    updateUIForUser(data);

    // Redirect to BACKEND admin panel (not frontend)
    // This ensures we go to the server-rendered admin page
    const section = ROLE_SECTIONS[data.rol];
    if (section) {
      window.location.href = `${BACKEND_URL}/admin?section=${section}`;
    }

  } catch (err) {
    errorEl.textContent = err.message || 'Credenciales inválidas';
    errorEl.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitText.textContent = 'Ingresar';
    spinner.style.display = 'none';
  }
}

// Update UI based on logged-in user
function updateUIForUser(user) {
  const loginBtn = document.getElementById('nav-login-btn');
  const userInfo = document.getElementById('nav-user-info');
  const panelLink = document.getElementById('nav-panel-link');

  if (user) {
    // Hide login button, show user info
    loginBtn.style.display = 'none';
    userInfo.style.display = 'block';

    // Set user info
    const initials = user.nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    document.getElementById('navUserAvatar').textContent = initials;
    document.getElementById('navUserName').textContent = user.nombre.split(' ')[0];
    document.getElementById('dropdownRole').textContent = ROLES[user.rol] || 'Usuario';

    // Show panel link
    panelLink.style.display = 'block';
    const section = ROLE_SECTIONS[user.rol];
    if (section) {
      const adminUrl = `${BACKEND_URL}/admin?section=${section}`;
      panelLink.querySelector('a').href = adminUrl;
      document.getElementById('dropdownPanelLink').href = adminUrl;
    }

    // Set panel link text based on role
    const panelNames = { 1: '🏢 Panel Admin', 2: '👨‍🍳 Panel Cocina', 3: '🤵 Panel Sala' };
    document.getElementById('dropdownPanelLink').textContent = panelNames[user.rol] || '🏢 Mi Panel';
  } else {
    // Show login button, hide user info
    loginBtn.style.display = 'block';
    userInfo.style.display = 'none';
    panelLink.style.display = 'none';
  }
}

// Toggle user dropdown
function toggleUserDropdown(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('userDropdown');
  dropdown.classList.toggle('active');
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown && !e.target.closest('#nav-user-info')) {
    dropdown.classList.remove('active');
  }
});

// Logout
function logoutUser() {
  clearUser();
  updateUIForUser(null);
  document.getElementById('userDropdown').classList.remove('active');
}

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLoginModal();
  }
});

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const user = getCurrentUser();
  if (user) {
    updateUIForUser(user);
  }
});
