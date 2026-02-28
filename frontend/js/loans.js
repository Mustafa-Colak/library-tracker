let selectedMember = null;
let selectedBook = null;

function updateLoanSteps() {
  const step1 = document.getElementById('step1');
  const step2 = document.getElementById('step2');
  const step3 = document.getElementById('step3');
  if (!step1) return;

  step1.className = 'loan-step' + (selectedMember ? ' done' : ' active');
  step2.className = 'loan-step' + (selectedBook ? ' done' : selectedMember ? ' active' : '');
  step3.className = 'loan-step' + (selectedMember && selectedBook ? ' active' : '');
}

async function loadLoans(page = 1) {
  const status = document.getElementById('statusFilter')?.value || '';
  let path = `/api/loans?page=${page}&limit=20`;
  if (status) path += `&status=${status}`;

  showTableLoading('loansTable', 7);
  try {
    const data = await apiGet(path);
    renderLoans(data.items);
    renderPagination(document.getElementById('pagination'), data, 'loadLoans');
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function renderLoans(loans) {
  const tbody = document.getElementById('loansTable');
  if (!loans.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty-state">
      <div class="empty-icon">&#128260;</div>
      <p>${t('common.no_data')}</p>
    </td></tr>`;
    return;
  }
  const statusLabels = {
    active: t('loan.status_active'),
    returned: t('loan.status_returned'),
    overdue: t('loan.status_overdue'),
  };
  const statusBadges = { active: 'badge-active', returned: 'badge-returned', overdue: 'badge-overdue' };

  tbody.innerHTML = loans.map(l => {
    const borrowed = new Date(l.borrowed_at).toLocaleDateString();
    const due = new Date(l.due_date).toLocaleDateString();
    const returned = l.returned_at ? new Date(l.returned_at).toLocaleDateString() : '<span class="text-muted">-</span>';
    const memberName = l.member ? `${esc(l.member.name)} ${esc(l.member.surname)}` : l.member_id;
    const bookTitle = l.book ? esc(l.book.title) : l.book_id;

    return `<tr>
      <td>${memberName}</td>
      <td>${bookTitle}</td>
      <td>${borrowed}</td>
      <td>${due}</td>
      <td>${returned}</td>
      <td><span class="badge ${statusBadges[l.status]}">${statusLabels[l.status] || esc(l.status)}</span></td>
      <td class="actions">
        ${l.status !== 'returned' && hasRole('admin','operator') ? `<button class="btn btn-success btn-sm" onclick="returnBook(${l.id})">${t('loan.return')}</button>` : ''}
      </td>
    </tr>`;
  }).join('');
}

async function scanMember(memberNo) {
  try {
    const member = await apiGet(`/api/members/barcode/${encodeURIComponent(memberNo)}`);
    selectedMember = member;
    document.getElementById('memberInfo').innerHTML =
      `<strong>${esc(member.name)} ${esc(member.surname)}</strong> (${esc(member.member_no)}) - ${t('member.' + member.member_type)}`;
    document.getElementById('memberInfo').style.display = 'block';
    document.getElementById('bookBarcode').focus();
    updateLoanSteps();
  } catch (e) {
    showToast(e.message, 'error');
    selectedMember = null;
    document.getElementById('memberInfo').style.display = 'none';
    updateLoanSteps();
  }
}

async function scanBook(isbn) {
  try {
    const book = await apiGet(`/api/books/barcode/${encodeURIComponent(isbn)}`);
    selectedBook = book;
    document.getElementById('bookInfo').innerHTML =
      `<strong>${esc(book.title)}</strong> - ${esc(book.author)} (${t('book.available')}: ${book.available_copies})`;
    document.getElementById('bookInfo').style.display = 'block';
    updateLoanSteps();
  } catch (e) {
    showToast(e.message, 'error');
    selectedBook = null;
    document.getElementById('bookInfo').style.display = 'none';
    updateLoanSteps();
  }
}

async function createLoan() {
  if (!selectedMember || !selectedBook) {
    showToast(t('loan.scan_first'), 'warning');
    return;
  }
  try {
    await apiPost('/api/loans', { book_id: selectedBook.id, member_id: selectedMember.id });
    showToast(t('loan.created'));
    clearLoanForm();
    loadLoans();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

async function returnBook(loanId) {
  const ok = await showConfirm(t('loan.confirm_return'));
  if (!ok) return;
  try {
    await apiPut(`/api/loans/${loanId}/return`, {});
    showToast(t('loan.returned'));
    loadLoans();
  } catch (e) {
    showToast(e.message, 'error');
  }
}

function clearLoanForm() {
  selectedMember = null;
  selectedBook = null;
  document.getElementById('memberBarcode').value = '';
  document.getElementById('bookBarcode').value = '';
  document.getElementById('memberInfo').style.display = 'none';
  document.getElementById('bookInfo').style.display = 'none';
  document.getElementById('memberBarcode').focus();
  updateLoanSteps();
}

function filterLoans() {
  loadLoans(1);
}

document.addEventListener('DOMContentLoaded', async () => {
  await i18nReady;
  if (!initAuth()) return;
  loadLoans();
  if (hasRole('admin', 'operator')) {
    initBarcodeScanner(document.getElementById('memberBarcode'), scanMember);
    initBarcodeScanner(document.getElementById('bookBarcode'), scanBook);
    updateLoanSteps();
  }
});
