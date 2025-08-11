// =======================
// Accessible Accordion (with fallback)
// =======================
document.querySelectorAll('.accordion-section').forEach((section) => {
  const panel = section.querySelector('ul');
  if (!panel) return;

  // Prefer the ARIA button if present, else fall back to H2
  const btn = section.querySelector('.accordion-trigger') || section.querySelector('h2');
  const hasAriaButton = btn && btn.classList && btn.classList.contains('accordion-trigger');

  const key = 'accordion:' + (section.dataset.section || '');

  // Restore state
  const saved = localStorage.getItem(key);
  const shouldOpen = saved === 'open';

  if (hasAriaButton) {
    // ARIA/hidden model
    panel.hidden = !shouldOpen;
    btn.setAttribute('aria-expanded', String(shouldOpen));

    btn.addEventListener('click', () => {
      const nowOpen = panel.hidden;       // if hidden, we are about to open
      panel.hidden = !nowOpen;
      btn.setAttribute('aria-expanded', String(nowOpen));
      localStorage.setItem(key, nowOpen ? 'open' : 'closed');
    });
  } else {
    // Legacy class-toggling model (H2 clickable)
    if (shouldOpen) section.classList.add('open');

    btn.addEventListener('click', () => {
      section.classList.toggle('open');
      localStorage.setItem(key, section.classList.contains('open') ? 'open' : 'closed');
    });
  }
});

// Open a section if URL hash matches its data-section (e.g. ...#delivery)
const hash = decodeURIComponent(location.hash.replace('#', ''));
if (hash) {
  const section = document.querySelector(`.accordion-section[data-section="${hash}"]`);
  if (section) {
    const panel = section.querySelector('ul');
    const btn = section.querySelector('.accordion-trigger');
    if (panel) {
      // ARIA model
      if (btn) {
        panel.hidden = false;
        btn.setAttribute('aria-expanded', 'true');
      }
      // Legacy model
      section.classList.add('open');

      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      localStorage.setItem('accordion:' + hash, 'open');
    }
  }
}
