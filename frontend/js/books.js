let currentPage = 1;

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
  const data = {
    isbn: document.getElementById('isbn').value,
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
  loadBooks();
  document.getElementById('bookForm')?.addEventListener('submit', saveBook);
});
