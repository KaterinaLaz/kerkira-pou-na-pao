// Επιλέγει όλα τα checkboxes με data-id
document.querySelectorAll('input[type="checkbox"]').forEach((box) => {
  const id = box.dataset.id;

  // Αν έχει αποθηκευτεί κάτι στο localStorage, φόρτωσέ το
  if (localStorage.getItem(id) === 'true') {
    box.checked = true;
  }

  // Όταν αλλάζει η κατάσταση (check/uncheck), αποθηκεύεται
  box.addEventListener('change', () => {
    localStorage.setItem(id, box.checked);
  });
});



// --- Accordion toggle ---
document.querySelectorAll('.accordion-section h2').forEach((h2) => {
  const section = h2.parentElement;
  const key = 'accordion:openSection'; // single key for all

  // Restore last open section
  const savedSection = localStorage.getItem(key);
  if (savedSection && section.dataset.section === savedSection) {
    section.classList.add('open');
  }

  h2.addEventListener('click', () => {
    const isOpen = section.classList.contains('open');

    // Close all sections
    document.querySelectorAll('.accordion-section').forEach(sec => sec.classList.remove('open'));

    if (!isOpen) {
      section.classList.add('open');
      localStorage.setItem(key, section.dataset.section);
    } else {
      localStorage.removeItem(key);
    }
  });
});


// Optional: open a section if URL has a hash matching data-section
// e.g. ...#delivery
const hash = decodeURIComponent(location.hash.replace('#',''));
if (hash){
  const target = document.querySelector(`.accordion-section[data-section="${hash}"]`);
  if (target){
    target.classList.add('open');
    target.scrollIntoView({behavior:'smooth', block:'start'});
  }
}
