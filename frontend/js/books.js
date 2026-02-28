let currentPage = 1;

/* ---------- Default categories (always shown) ---------- */
const DEFAULT_CATEGORIES = [
  'Roman', 'Bilim', 'Tarih', 'Çocuk', 'Ders Kitabı',
  'Şiir', 'Ansiklopedi', 'Hikaye', 'Biyografi', 'Diğer'
];

/* ---------- Suggestions cache ---------- */
let suggestionsCache = null;

async function loadSuggestions() {
  try {
    const data = await apiGet('/api/books/suggestions');
    // Merge default categories with DB categories (unique, sorted)
    const allCats = [...new Set([...DEFAULT_CATEGORIES, ...data.categories])].sort();
    suggestionsCache = {
      authors: data.authors,
      publishers: data.publishers,
      categories: allCats,
    };
    // Also populate the category filter dropdown on books list page
    populateCategoryFilter(allCats);
  } catch {
    suggestionsCache = {
      authors: [],
      publishers: [],
      categories: [...DEFAULT_CATEGORIES],
    };
    populateCategoryFilter(DEFAULT_CATEGORIES);
  }
}

function populateCategoryFilter(categories) {
  const sel = document.getElementById('categoryFilter');
  if (!sel) return;
  const current = sel.value;
  // Keep the first "all categories" option
  sel.innerHTML = `<option value="" data-i18n="book.all_categories">${t('book.all_categories')}</option>`;
  categories.forEach(c => {
    sel.innerHTML += `<option value="${esc(c)}">${esc(c)}</option>`;
  });
  sel.value = current;
}

/* ---------- Autocomplete engine ---------- */
function setupAutocomplete(inputId, listId, getItems) {
  const input = document.getElementById(inputId);
  const list = document.getElementById(listId);
  if (!input || !list) return;

  let selectedIdx = -1;

  function render(filter) {
    const items = getItems();
    const term = (filter || '').toLowerCase();
    const matches = term
      ? items.filter(i => i.toLowerCase().includes(term))
      : items;

    if (!matches.length) {
      list.classList.remove('open');
      return;
    }

    selectedIdx = -1;
    list.innerHTML = matches.map((item, i) => {
      let label = esc(item);
      if (term) {
        const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        label = label.replace(re, '<mark>$1</mark>');
      }
      return `<div class="autocomplete-item" data-index="${i}" data-value="${esc(item)}">${label}</div>`;
    }).join('');
    list.classList.add('open');
  }

  input.addEventListener('focus', () => render(input.value));
  input.addEventListener('input', () => render(input.value));

  input.addEventListener('keydown', (e) => {
    const items = list.querySelectorAll('.autocomplete-item');
    if (!items.length || !list.classList.contains('open')) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIdx = Math.min(selectedIdx + 1, items.length - 1);
      items.forEach((el, i) => el.classList.toggle('selected', i === selectedIdx));
      items[selectedIdx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIdx = Math.max(selectedIdx - 1, 0);
      items.forEach((el, i) => el.classList.toggle('selected', i === selectedIdx));
      items[selectedIdx]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter' && selectedIdx >= 0) {
      e.preventDefault();
      input.value = items[selectedIdx].dataset.value;
      list.classList.remove('open');
    } else if (e.key === 'Escape') {
      list.classList.remove('open');
    }
  });

  list.addEventListener('click', (e) => {
    const item = e.target.closest('.autocomplete-item');
    if (item) {
      input.value = item.dataset.value;
      list.classList.remove('open');
    }
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !list.contains(e.target)) {
      list.classList.remove('open');
    }
  });
}

/* ---------- ISBN Validation ---------- */
function validateISBN(isbn) {
  const clean = isbn.replace(/[-\s]/g, '');
  if (clean.length === 10) {
    return /^\d{9}[\dX]$/.test(clean);
  } else if (clean.length === 13) {
    return /^\d{13}$/.test(clean);
  }
  return false;
}

/* ---------- Books CRUD ---------- */

async function loadBooks(page = 1) {
  currentPage = page;
  const search = document.getElementById('searchInput')?.value || '';
  const category = document.getElementById('categoryFilter')?.value || '';
  let path = `/api/books?page=${page}&limit=20`;
  if (search) path += `&search=${encodeURIComponent(search)}`;
  if (category) path += `&category=${encodeURIComponent(category)}`;

  showTableLoading('booksTable', 8);
  try {
    const data = await apiGet(path);
    renderBooks(data.items);
    renderPagination(document.getElementById('pagination'), data, 'loadBooks');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function renderBooks(books) {
  const tbody = document.getElementById('booksTable');
  if (!books.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="empty-state">
      <div class="empty-icon">&#128214;</div>
      <p>${t('common.no_data')}</p>
    </td></tr>`;
    return;
  }
  tbody.innerHTML = books.map(b => `
    <tr>
      <td><code>${esc(b.isbn)}</code></td>
      <td><strong>${esc(b.title)}</strong></td>
      <td>${esc(b.author)}</td>
      <td>${esc(b.category) || '<span class="text-muted">-</span>'}</td>
      <td>${esc(b.shelf_location) || '<span class="text-muted">-</span>'}</td>
      <td>${b.total_copies}</td>
      <td>${b.available_copies > 0
        ? `<span class="badge badge-active">${b.available_copies}</span>`
        : `<span class="badge badge-overdue">0</span>`}</td>
      <td class="actions">
        ${hasRole('admin','operator') ? `<button class="btn btn-outline btn-sm btn-icon" onclick="editBook(${b.id})" title="${t('common.edit')}">&#9998;</button>` : ''}
        ${hasRole('admin') ? `<button class="btn btn-danger btn-sm btn-icon" onclick="deleteBook(${b.id})" title="${t('common.delete')}">&#128465;</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function openAddBook() {
  document.getElementById('bookForm').reset();
  document.getElementById('bookId').value = '';
  document.getElementById('bookDialogTitle').textContent = t('book.add');
  document.getElementById('bookDialog').showModal();
}

async function editBook(id) {
  try {
    const book = await apiGet(`/api/books/${id}`);
    document.getElementById('bookId').value = book.id;
    document.getElementById('isbn').value = book.isbn;
    document.getElementById('title').value = book.title;
    document.getElementById('author').value = book.author;
    document.getElementById('publisher').value = book.publisher || '';
    document.getElementById('year').value = book.year || '';
    document.getElementById('category').value = book.category || '';
    document.getElementById('shelfLocation').value = book.shelf_location || '';
    document.getElementById('totalCopies').value = book.total_copies;
    document.getElementById('bookDialogTitle').textContent = t('book.edit');
    document.getElementById('bookDialog').showModal();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function saveBook(e) {
  e.preventDefault();
  const id = document.getElementById('bookId').value;
  const isbnVal = document.getElementById('isbn').value.trim();
  if (!validateISBN(isbnVal)) {
    showToast(t('book.invalid_isbn'), 'error');
    return;
  }

  const data = {
    isbn: isbnVal,
    title: document.getElementById('title').value,
    author: document.getElementById('author').value,
    publisher: document.getElementById('publisher').value || null,
    year: document.getElementById('year').value ? parseInt(document.getElementById('year').value) : null,
    category: document.getElementById('category').value || null,
    shelf_location: document.getElementById('shelfLocation').value || null,
    total_copies: parseInt(document.getElementById('totalCopies').value) || 1,
  };

  try {
    if (id) {
      await apiPut(`/api/books/${id}`, data);
      showToast(t('book.updated'));
    } else {
      await apiPost('/api/books', data);
      showToast(t('book.added'));
    }
    document.getElementById('bookDialog').close();
    // Refresh suggestions cache (new author/publisher/category may have been added)
    loadSuggestions();
    loadBooks(currentPage);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function deleteBook(id) {
  const ok = await showConfirm(t('common.confirm_delete'));
  if (!ok) return;
  try {
    await apiDelete(`/api/books/${id}`);
    showToast(t('book.deleted'));
    loadBooks(currentPage);
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function searchBooks() {
  loadBooks(1);
}

document.addEventListener('DOMContentLoaded', async () => {
  await i18nReady;
  if (!initAuth()) return;

  // Load suggestions and setup autocomplete
  await loadSuggestions();
  setupAutocomplete('author', 'authorList', () => suggestionsCache?.authors || []);
  setupAutocomplete('publisher', 'publisherList', () => suggestionsCache?.publishers || []);
  setupAutocomplete('category', 'categoryList', () => suggestionsCache?.categories || DEFAULT_CATEGORIES);

  loadBooks();
  document.getElementById('bookForm')?.addEventListener('submit', saveBook);
});
