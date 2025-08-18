/* =========================================================
   1) Checkboxes: αποθήκευση/restore στο localStorage
   ========================================================= */
(function persistCheckboxes(){
  const boxes = document.querySelectorAll('input[type="checkbox"][data-id]');
  boxes.forEach((box) => {
    const id = box.dataset.id;

    // Restore
    if (localStorage.getItem(id) === 'true') {
      box.checked = true;
    }

    // Save on change
    box.addEventListener('change', () => {
      localStorage.setItem(id, box.checked ? 'true' : 'false');
      // ενημέρωση reading list (αν υπάρχει)
      if (typeof window.updateReadingList === 'function') {
        window.updateReadingList();
      }
    });
  });
})();


/* =========================================================
   2) Accordion: toggle με αποθήκευση κατά κατηγορία
   - Χρησιμοποιεί .accordion-section και <h2>
   ========================================================= */
(function accordionWithMemory(){
  document.querySelectorAll('.accordion-section h2').forEach((h2) => {
    const section = h2.parentElement;
    const key = 'accordion:' + (section.dataset.section || h2.textContent.trim());

    // Restore last state
    const saved = localStorage.getItem(key);
    if (saved === 'open') section.classList.add('open');

    // Toggle + save
    h2.addEventListener('click', () => {
      section.classList.toggle('open');
      localStorage.setItem(key, section.classList.contains('open') ? 'open' : 'closed');
    });
  });
})();


/* =========================================================
   3) Reading List (FAB + Drawer)
   - Συγκεντρώνει όλα τα τσεκαρισμένα
   - Αντιγραφή / Κοινή χρήση / Καθαρισμός
   ========================================================= */
(function readingListDrawer(){
  const fab = document.getElementById('fab-my-list');
  const overlay = document.getElementById('drawer-overlay');
  const drawer = document.getElementById('reading-drawer');
  const closeBtn = document.getElementById('drawer-close');
  const listEl = document.getElementById('reading-list');
  const fabCount = document.getElementById('fab-count');
  const drawerCount = document.getElementById('drawer-count');
  const copyBtn = document.getElementById('list-copy');
  const shareBtn = document.getElementById('list-share');
  const clearBtn = document.getElementById('list-clear');

  if (!fab || !drawer || !listEl) {
    // Δεν υπάρχει UI για reading list — απλώς βγες
    return;
  }

  function getAllItems(){
    const items = [];
    document.querySelectorAll('.accordion-section ul li').forEach(li => {
      const box = li.querySelector('input[type="checkbox"][data-id]');
      const label = li.querySelector('label');
      const link = li.querySelector('a[href]');
      if (!box || !label) return;
      const section = li.closest('.accordion-section');
      const category = section ? (section.querySelector('h2')?.textContent.trim() || '') : '';
      items.push({
        id: box.dataset.id,
        name: label.textContent.trim(),
        href: link ? link.getAttribute('href') : null,
        category
      });
    });
    return items;
  }

  function getCheckedIds(){
    const ids = [];
    document.querySelectorAll('input[type="checkbox"][data-id]').forEach(box => {
      if (localStorage.getItem(box.dataset.id) === 'true' || box.checked) {
        ids.push(box.dataset.id);
      }
    });
    return ids;
  }

  function render(){
    const all = getAllItems();
    const checked = new Set(getCheckedIds());
    const selected = all.filter(x => checked.has(x.id));

    // Counters
    const n = selected.length;
    fabCount.textContent = n;
    drawerCount.textContent = n;

    // FAB ορατό μόνο όταν υπάρχει κάτι
    fab.style.display = n ? '' : 'none';

    // Build list
    listEl.innerHTML = '';
    selected.forEach(item => {
      const li = document.createElement('li');

      const left = document.createElement('div');
      const name = document.createElement('span');
      name.className = 'place';
      name.textContent = item.name;

      const cat = document.createElement('span');
      cat.className = 'category';
      cat.textContent = ` - ${item.category}`;

      left.append(name, cat);

      const right = document.createElement('div');
      right.className = 'actions';

      if (item.href){
        const a = document.createElement('a');
        a.href = item.href; a.target = '_blank'; a.rel = 'noopener';
        a.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" width="26" height="26" 
                fill="currentColor" aria-label="Χάρτης">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 
                      9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
            </svg>
          `;        
        right.appendChild(a);
      }

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" width="25" height="25" 
            fill="currentColor" aria-label="Αφαίρεση">
          <path d="M9 3v1H4v2h16V4h-5V3H9zm1 5v9h2V8h-2zm4 0v9h2V8h-2z"/>
        </svg>
      `;
      removeBtn.style.background = 'none';
      removeBtn.style.border = 'none';
      removeBtn.style.cursor = 'pointer';
      removeBtn.style.color = 'var(--muted)'; // παίρνει muted χρώμα

      removeBtn.addEventListener('click', () => {
        localStorage.setItem(item.id, 'false');
        const original = document.querySelector(`input[type="checkbox"][data-id="${item.id}"]`);
        if (original) original.checked = false;
        render();
      });
      right.appendChild(removeBtn);

      li.append(left, right);
      listEl.appendChild(li);
    });

    // Εμφάνιση/απόκρυψη κουμπιού επαναφοράς, αν υπάρχει
    if (restoreBtn) {
      const hasSnapshot = localStorage.getItem('myList:hasSnapshot') === 'true';
      restoreBtn.style.display = hasSnapshot ? '' : 'none';
    }
  }

  // Ανοίγω/κλείνω drawer
  function openDrawer(){
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.hidden = false;
    fab.setAttribute('aria-expanded', 'true');
  }
  function closeDrawer(){
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    overlay.hidden = true;
    fab.setAttribute('aria-expanded', 'false');
  }

  // Events ανοιγοκλεισίματος
  fab.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('open');
    isOpen ? closeDrawer() : openDrawer();
  });
  closeBtn?.addEventListener('click', closeDrawer);
  overlay?.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  // Actions
  copyBtn?.addEventListener('click', async () => {
    const all = getAllItems();
    const checked = new Set(getCheckedIds());
    const selected = all.filter(x => checked.has(x.id));
    const text = selected.map(x => `• ${x.name}${x.href ? ` → ${x.href}` : ''}`).join('\n') || '— (κενό) —';
    try{
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'Αντιγράφηκε';
      setTimeout(() => copyBtn.textContent = 'Αντιγραφή', 1800);
    }catch{
      alert('Δεν μπόρεσα να αντιγράψω. Δοκίμασε Ctrl/Cmd + C.');
    }
  });

  shareBtn?.addEventListener('click', async () => {
    const ids = getCheckedIds();
    const url = new URL(location.href);
    ids.length ? url.searchParams.set('saved', ids.join(',')) : url.searchParams.delete('saved');
    const shareUrl = url.toString();

    if (navigator.share){
      try { await navigator.share({ title: 'Η λίστα μου – Κέρκυρα', url: shareUrl }); }
      catch { /* ακυρώθηκε */ }
    } else {
      try{
        await navigator.clipboard.writeText(shareUrl);
        shareBtn.textContent = 'Αντιγράφηκε ο σύνδεσμος';
        setTimeout(() => shareBtn.textContent = 'Κοινή χρήση', 1500);
      }catch{
        prompt('Αντιγράψτε τον σύνδεσμο:', shareUrl);
      }
    }
  });

  clearBtn?.addEventListener('click', () => {
    if (!confirm('Σίγουρα να καθαρίσω τη λίστα;')) return;
    document.querySelectorAll('input[type="checkbox"][data-id]').forEach(box => {
      localStorage.setItem(box.dataset.id, 'false');
      box.checked = false;
    });
    render();
  });

  // Κάνε τη render διαθέσιμη global ώστε να την καλούμε από αλλού
  window.updateReadingList = render;

  // Αρχικό render + ανανέωση όταν αλλάζουν checkbox
  render();
  document.querySelectorAll('input[type="checkbox"][data-id]').forEach(box => {
    box.addEventListener('change', render);
  });
})();




