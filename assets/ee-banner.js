// mobile menu toggle. listener is on document so it keeps working when the editor re-renders the section
document.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-ee-menu-toggle]');
    if (!toggle) return;

    const topbar = toggle.closest('.ee-banner__topbar');
    const isOpen = topbar.classList.toggle('is-open');

    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
});