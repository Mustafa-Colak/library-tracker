let currentLang = localStorage.getItem('lang') || 'tr';
let translations = {};

// Promise that resolves when translations are first loaded
let _i18nReadyResolve;
window.i18nReady = new Promise(resolve => { _i18nReadyResolve = resolve; });

// Language change callbacks for re-rendering dynamic content
const _langChangeCallbacks = [];

function onLanguageChange(cb) {
  _langChangeCallbacks.push(cb);
}

async function loadLanguage(lang) {
  const res = await fetch(`/locales/${lang}.json`);
  translations = await res.json();
  currentLang = lang;
  localStorage.setItem('lang', lang);
  applyTranslations();
  updateLangButtons();
  // Resolve the ready promise (only first time matters)
  _i18nReadyResolve();
  // Notify all registered callbacks (for dynamic content re-render)
  _langChangeCallbacks.forEach(cb => cb(lang));
}

function t(key) {
  const keys = key.split('.');
  let val = translations;
  for (const k of keys) {
    val = val?.[k];
  }
  return val || key;
}

function applyTranslations() {
  // Handle RTL for Arabic
  const isRtl = ['ar'].includes(currentLang);
  document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', currentLang);

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = t(key);
    if (text !== key) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = text;
      } else {
        el.textContent = text;
      }
    }
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
}

function updateLangButtons() {
  document.querySelectorAll('.lang-switch button').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
  });
}

function switchLang(lang) {
  loadLanguage(lang);
}

// Init on page load
document.addEventListener('DOMContentLoaded', () => {
  loadLanguage(currentLang);
});

// Make globals available
window.t = t;
window.switchLang = switchLang;
window.onLanguageChange = onLanguageChange;
