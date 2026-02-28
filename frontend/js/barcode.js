// USB barcode scanner sends characters rapidly then Enter
// This module detects barcode scan vs manual typing

let barcodeBuffer = '';
let barcodeTimeout = null;
const SCAN_THRESHOLD = 50; // ms between chars for scanner

function initBarcodeScanner(inputEl, onScan) {
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const value = inputEl.value.trim();
      if (value) {
        onScan(value);
        inputEl.value = '';
      }
    }
  });
}

// For loan page: sequential scanning (member card then book barcode)
function initLoanScanner(memberInput, bookInput, onMemberScan, onBookScan) {
  initBarcodeScanner(memberInput, onMemberScan);
  initBarcodeScanner(bookInput, onBookScan);
}
