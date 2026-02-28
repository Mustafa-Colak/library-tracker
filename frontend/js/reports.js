async function loadSummary() {
  try {
    const data = await apiGet('/api/reports/summary');
    document.getElementById('totalBooks').textContent = data.total_books;
    document.getElementById('uniqueTitles').textContent = data.unique_titles;
    document.getElementById('totalMembers').textContent = data.total_members;
    document.getElementById('activeLoans').textContent = data.active_loans;
    document.getElementById('overdueLoans').textContent = data.overdue_loans;
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function loadPopularBooks() {
  showTableLoading('popularBooksTable', 4);
  try {
    const books = await apiGet('/api/reports/popular-books');
    const tbody = document.getElementById('popularBooksTable');
    if (!books.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="empty-state">
        <div class="empty-icon">&#128214;</div>
        <p>${t('common.no_data')}</p>
      </td></tr>`;
      return;
    }
    tbody.innerHTML = books.map((b, i) => `
      <tr>
        <td><span class="rank-badge">${i + 1}</span></td>
        <td><strong>${esc(b.title)}</strong></td>
        <td>${esc(b.author)}</td>
        <td><span class="badge badge-active">${b.loan_count}</span></td>
      </tr>
    `).join('');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function loadOverdueReport() {
  showTableLoading('overdueTable', 5);
  try {
    const loans = await apiGet('/api/reports/overdue');
    const tbody = document.getElementById('overdueTable');
    if (!loans.length) {
      tbody.innerHTML = `<tr><td colspan="5" class="empty-state">
        <div class="empty-icon">&#9989;</div>
        <p>${t('common.no_data')}</p>
      </td></tr>`;
      return;
    }
    tbody.innerHTML = loans.map(l => {
      const due = new Date(l.due_date);
      const now = new Date();
      const daysLate = Math.floor((now - due) / (1000 * 60 * 60 * 24));
      const memberName = l.member ? `${esc(l.member.name)} ${esc(l.member.surname)}` : l.member_id;
      const bookTitle = l.book ? esc(l.book.title) : l.book_id;
      return `<tr>
        <td>${memberName}</td>
        <td>${bookTitle}</td>
        <td>${due.toLocaleDateString()}</td>
        <td><span class="badge badge-overdue">${daysLate} ${t('report.days')}</span></td>
        <td class="actions">
          <button class="btn btn-success btn-sm" onclick="returnFromReport(${l.id})">${t('loan.return')}</button>
        </td>
      </tr>`;
    }).join('');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function returnFromReport(loanId) {
  const ok = await showConfirm(t('loan.confirm_return'));
  if (!ok) return;
  try {
    await apiPut(`/api/loans/${loanId}/return`, {});
    showToast(t('loan.returned'));
    loadSummary();
    loadOverdueReport();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await i18nReady;
  if (!initAuth()) return;
  loadSummary();
  loadPopularBooks();
  loadOverdueReport();
});
