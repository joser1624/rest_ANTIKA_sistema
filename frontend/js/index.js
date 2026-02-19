
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
