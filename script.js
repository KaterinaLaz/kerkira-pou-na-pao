// =============== tiny utils ===============
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// fire a global event so components can react without tight coupling
const emit = (name, detail = {}) => document.dispatchEvent(new CustomEvent(name, { detail }));

// =============== Checkboxes ===============
class Checkboxes {
  constructor() {
    this.boxes = $$('input[type="checkbox"][data-id]');
  }
  restore() {
    this.boxes.forEach(box => {
      const id = box.dataset.id;
      if (localStorage.getItem(id) === 'true') box.checked = true;
    });
  }
  bind() {
    this.boxes.forEach(box => {
      const id = box.dataset.id;
      box.addEventListener('change', () => {
        localStorage.setItem(id, box.checked ? 'true' : 'false');
        emit('list:updated'); // notify others
      });
    });
  }
  init() {
    this.restore();
    this.bind();
  }
}

// =============== Accordion (with memory) ===============
class Accordion {
  constructor() {
    this.headers = $$('.accordion-section h2');
  }
  restore() {
    this.headers.forEach(h2 => {
      const section = h2.parentElement;
      const key = 'accordion:' + (section.dataset.section || h2.textContent.trim());
      if (localStorage.getItem(key) === 'open') section.classList.add('open');
    });
  }
  bind() {
    this.headers.forEach(h2 => {
      const section = h2.parentElement;
      const key = 'accordion:' + (section.dataset.section || h2.textContent.trim());
      h2.addEventListener('click', () => {
        section.classList.toggle('open');
        localStorage.setItem(key, section.classList.contains('open') ? 'open' : 'closed');
      });
    });
  }
  init() {
    this.restore();
    this.bind();
  }
}

// =============== Reading List (drawer) ===============
class ReadingList {
  constructor() {
    this.fab = $('#fab-my-list');
    this.overlay = $('#drawer-overlay');
    this.drawer = $('#reading-drawer');
    this.closeBtn = $('#drawer-close');
    this.listEl = $('#reading-list');
    this.fabCount = $('#fab-count');
    this.drawerCount = $('#drawer-count');
    this.shareBtn = $('#list-share');
    this.clearBtn = $('#list-clear');
    

    // public shim to stay compatible with existing code
    window.updateReadingList = () => this.render();
  }


  getAllItems() {
    const items = [];
    $$('.accordion-section ul li').forEach(li => {
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

  getCheckedIds() {
    const ids = [];
    $$('input[type="checkbox"][data-id]').forEach(box => {
      if (localStorage.getItem(box.dataset.id) === 'true' || box.checked) ids.push(box.dataset.id);
    });
    return ids;
  }

  render() {
    const all = this.getAllItems();
    const checked = new Set(this.getCheckedIds());
    const selected = all.filter(x => checked.has(x.id));

    // counts + FAB visibility
    const n = selected.length;
    if (this.fabCount) this.fabCount.textContent = n;
    if (this.drawerCount) this.drawerCount.textContent = n;
    if (this.fab) this.fab.style.display = n ? '' : 'none';

    // build list
    this.listEl.innerHTML = '';
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

      if (item.href) {
        const a = document.createElement('a');
        a.href = item.href; a.target = '_blank'; a.rel = 'noopener';
        a.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
               width="26" height="26" fill="currentColor" aria-label="Χάρτης">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 
                    9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"/>
          </svg>`;
        right.appendChild(a);
      }

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
             width="25" height="25" fill="currentColor" aria-label="Αφαίρεση">
          <path d="M9 3v1H4v2h16V4h-5V3H9zm1 5v9h2V8h-2zm4 0v9h2V8h-2z"/>
        </svg>`;
      removeBtn.style.background = 'none';
      removeBtn.style.border = 'none';
      removeBtn.style.cursor = 'pointer';
      removeBtn.style.color = 'var(--muted)';

      removeBtn.addEventListener('click', () => {
        localStorage.setItem(item.id, 'false');
        const original = document.querySelector(`input[type="checkbox"][data-id="${item.id}"]`);
        if (original) original.checked = false;
        this.render();
      });

      right.appendChild(removeBtn);
      li.append(left, right);
      this.listEl.appendChild(li);
    });
  }

  open() {
    this.drawer.classList.add('open');
    this.drawer.setAttribute('aria-hidden', 'false');
    this.overlay.hidden = false;
    this.fab.setAttribute('aria-expanded', 'true');
    this.fab.classList.add('hide'); // Hide button when drawer opens

  }
  close() {
    this.drawer.classList.remove('open');
    this.drawer.setAttribute('aria-hidden', 'true');
    this.overlay.hidden = true;
    this.fab.setAttribute('aria-expanded', 'false');
    this.fab.classList.remove('hide'); // Show button when drawer closes

  }

  bind() {
    // open/close
    this.fab?.addEventListener('click', () => {
      const isOpen = this.drawer.classList.contains('open');
      isOpen ? this.close() : this.open();
    });
    this.closeBtn?.addEventListener('click', () => this.close());
    this.overlay?.addEventListener('click', () => this.close());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') this.close(); });

    // share (kept) — builds ?saved=...
    this.shareBtn?.addEventListener('click', async () => {
      const ids = this.getCheckedIds();
      const url = new URL(location.href);
      ids.length ? url.searchParams.set('saved', ids.join(',')) : url.searchParams.delete('saved');
      const shareUrl = url.toString();

      if (navigator.share) {
        try { await navigator.share({ title: 'Η λίστα μου – Κέρκυρα', url: shareUrl }); } catch {}
      } else {
        try {
          await navigator.clipboard.writeText(shareUrl);
          this.shareBtn.textContent = 'Αντιγράφηκε ο σύνδεσμος';
          setTimeout(() => this.shareBtn.textContent = 'Κοινή χρήση', 1500);
        } catch {
          prompt('Αντιγράψτε τον σύνδεσμο:', shareUrl);
        }
      }
    });

    // clear (kept)
    this.clearBtn?.addEventListener('click', () => {
      if (!confirm('Σίγουρα να καθαρίσω τη λίστα;')) return;
      $$('input[type="checkbox"][data-id]').forEach(box => {
        localStorage.setItem(box.dataset.id, 'false');
        box.checked = false;
      });
      this.render();
      emit('list:updated');
    });

    // re-render when checkboxes change
    document.addEventListener('list:updated', () => this.render());
  }

  init() {
    this.render();
    // also render whenever any checkbox changes (initial hook)
    $$('input[type="checkbox"][data-id]').forEach(box => box.addEventListener('change', () => this.render()));
    this.bind();
  }
}

// =============== Shared List Loader (?saved=...) ===============
class SharedListLoader {
  init() {
    const q = new URLSearchParams(location.search).get('saved');
    if (!q) return;

    // Replace current selections with the shared ones (no snapshot / no restore)
    $$('input[type="checkbox"][data-id]').forEach(box => {
      localStorage.setItem(box.dataset.id, 'false');
      box.checked = false;
    });

    q.split(',')
     .map(s => s.trim())
     .filter(Boolean)
     .forEach(id => {
       localStorage.setItem(id, 'true');
       const box = document.querySelector(`input[type="checkbox"][data-id="${id}"]`);
       if (box) box.checked = true;
     });

    emit('list:updated');
  }
}

// =============== boot ===============
document.addEventListener('DOMContentLoaded', () => {
  const checkboxes = new Checkboxes();
  const accordion  = new Accordion();
  const reading    = new ReadingList();
  const loader     = new SharedListLoader();

  checkboxes.init();
  accordion.init();
  reading.init();
  loader.init();
});


