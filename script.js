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
