// ============================================================
// Download Organizer Pro — popup.js (Phase 2: Full Pro Gates)
// ============================================================

// --- Constants ---

const LEMON_SQUEEZY_URLS = {
  oneTime: 'REPLACE_WITH_LEMON_SQUEEZY_ONETIME_CHECKOUT_URL',
  monthly: 'REPLACE_WITH_LEMON_SQUEEZY_MONTHLY_CHECKOUT_URL',
};
const VALIDATION_API_URL = 'REPLACE_WITH_VERCEL_URL/api/validate-license';

const DEFAULT_FOLDER_MAP = {
  images: 'Images', videos: 'Videos', documents: 'Documents',
  audio: 'Music', archives: 'Archives', code: 'Code',
};
const PRO_CATEGORIES = ['audio', 'archives', 'code'];


// --- DOM References ---

const toggleEl = document.getElementById('toggle-enabled');
const saveBtn = document.getElementById('btn-save');
const activateBtn = document.getElementById('btn-activate');
const resetStatsBtn = document.getElementById('btn-reset-stats');
const licenseKeyInput = document.getElementById('license-key-input');
const dateSubfoldersCheckbox = document.getElementById('date-subfolders-checkbox');
const toastEl = document.getElementById('toast');
const planFreeEl = document.getElementById('plan-free');
const planProEl = document.getElementById('plan-pro');
const licenseErrorEl = document.getElementById('license-error');
const licenseSuccessEl = document.getElementById('license-success');
const navToStatsBtn = document.getElementById('nav-to-stats');

let toastTimer = null;


// --- Functions ---

function showScreen(screenId) {
  const screens = ['screen-main', 'screen-stats', 'screen-license'];
  screens.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.hidden = id !== screenId;
  });
}

function showToast(message, durationMs = 2000) {
  toastEl.textContent = message;
  toastEl.classList.add('visible');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('visible');
  }, durationMs);
}

function renderProState(isPro) {
  // Plan banner
  if (isPro) {
    planFreeEl.hidden = true;
    planProEl.hidden = false;
  } else {
    planFreeEl.hidden = false;
    planProEl.hidden = true;
  }

  // Upgrade link — hide when Pro
  const upgradeLink = document.getElementById('nav-to-license');
  if (upgradeLink) upgradeLink.hidden = isPro;

  // Custom folder names are Pro-only (per monetization.md)
  // Lock ALL folder inputs on free plan, unlock all on Pro
  document.querySelectorAll('[data-category]').forEach((input) => {
    const cat = input.dataset.category;
    const row = input.closest('.category-row');
    const isProCat = PRO_CATEGORIES.includes(cat);

    if (isPro) {
      // Pro: unlock everything
      input.classList.remove('locked');
      input.removeAttribute('disabled');
      if (row) row.classList.remove('locked');
    } else if (isProCat) {
      // Free + Pro category: fully locked row
      input.classList.add('locked');
      input.setAttribute('disabled', 'true');
      if (row) row.classList.add('locked');
    } else {
      // Free + Free category: input editable (custom names work for free cats)
      input.classList.remove('locked');
      input.removeAttribute('disabled');
      if (row) row.classList.remove('locked');
    }
  });

  // Pro badges — show/hide
  PRO_CATEGORIES.forEach((cat) => {
    const badge = document.getElementById(`badge-${cat}`);
    if (badge) badge.hidden = isPro;
  });

  // Date subfolders — lock if not pro
  const dateSection = document.getElementById('date-subfolder-section');
  if (isPro) {
    if (dateSection) dateSection.classList.remove('locked');
    dateSubfoldersCheckbox.removeAttribute('disabled');
  } else {
    if (dateSection) dateSection.classList.add('locked');
    dateSubfoldersCheckbox.setAttribute('disabled', 'true');
  }

  // Stats button — show only for Pro
  navToStatsBtn.hidden = !isPro;

  // License button — update text when Pro
  const licenseBtn = document.getElementById('nav-to-license-btn');
  if (licenseBtn) {
    if (isPro) {
      licenseBtn.textContent = '✓ Pro License Active';
      licenseBtn.disabled = true;
      licenseBtn.style.opacity = '0.6';
    } else {
      licenseBtn.textContent = 'Activate License Key';
      licenseBtn.disabled = false;
      licenseBtn.style.opacity = '1';
    }
  }
}

function loadSettings() {
  chrome.storage.sync.get(['enabled', 'isPro', 'folderMap', 'dateSubfolders'], (result) => {
    // Toggle
    toggleEl.checked = result.enabled !== false;

    // Folder inputs
    const folderMap = result.folderMap || {};
    document.querySelectorAll('[data-category]').forEach((input) => {
      const cat = input.dataset.category;
      input.value = folderMap[cat] || DEFAULT_FOLDER_MAP[cat] || '';
    });

    // Date subfolders
    dateSubfoldersCheckbox.checked = !!result.dateSubfolders;

    // Pro state
    renderProState(!!result.isPro);
  });
}

function getFolderMapFromInputs() {
  const map = {};
  document.querySelectorAll('[data-category]').forEach((el) => {
    map[el.dataset.category] = el.value.trim() || DEFAULT_FOLDER_MAP[el.dataset.category];
  });
  return map;
}

function handleSave() {
  chrome.storage.sync.set({
    folderMap: getFolderMapFromInputs(),
    dateSubfolders: dateSubfoldersCheckbox.checked,
  });
  showToast('Settings saved ✓');
}

function handleToggle() {
  chrome.storage.sync.set({ enabled: toggleEl.checked });
}

async function handleActivateLicense() {
  const key = licenseKeyInput.value.trim();
  licenseErrorEl.hidden = true;
  licenseSuccessEl.hidden = true;

  if (!key) {
    licenseErrorEl.textContent = 'Please enter a license key';
    licenseErrorEl.hidden = false;
    return;
  }

  const originalText = activateBtn.textContent;
  activateBtn.textContent = 'Validating…';
  activateBtn.disabled = true;

  try {
    const response = await fetch(VALIDATION_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: key }),
    });

    const data = await response.json();

    if (data.valid) {
      // Store isPro, licenseKey, and apiUrl (apiUrl needed for background re-validation alarm)
      chrome.storage.sync.set({ isPro: true, licenseKey: key, apiUrl: VALIDATION_API_URL });
      renderProState(true);
      licenseSuccessEl.textContent = '✓ Pro activated! Welcome.';
      licenseSuccessEl.hidden = false;
      showToast('Pro activated!');
    } else {
      licenseErrorEl.textContent = 'Invalid or expired license key';
      licenseErrorEl.hidden = false;
    }
  } catch (err) {
    licenseErrorEl.textContent = 'Could not connect. Check your internet.';
    licenseErrorEl.hidden = false;
  } finally {
    activateBtn.textContent = originalText;
    activateBtn.disabled = false;
  }
}

function loadStats() {
  chrome.storage.local.get(['stats'], (result) => {
    const stats = result.stats || { total: 0, images: 0, videos: 0, documents: 0, audio: 0, archives: 0, code: 0 };
    document.getElementById('stat-total').textContent = stats.total || 0;
    document.getElementById('stat-images').textContent = stats.images || 0;
    document.getElementById('stat-videos').textContent = stats.videos || 0;
    document.getElementById('stat-documents').textContent = stats.documents || 0;
    document.getElementById('stat-audio').textContent = stats.audio || 0;
    document.getElementById('stat-archives').textContent = stats.archives || 0;
    document.getElementById('stat-code').textContent = stats.code || 0;
  });
}

function handleResetStats() {
  chrome.storage.local.set({
    stats: { total: 0, images: 0, videos: 0, documents: 0, audio: 0, archives: 0, code: 0 },
  });
  loadStats();
  showToast('Stats reset');
}


// --- Event Wiring ---

document.addEventListener('DOMContentLoaded', loadSettings);
toggleEl.addEventListener('change', handleToggle);
saveBtn.addEventListener('click', handleSave);
activateBtn.addEventListener('click', handleActivateLicense);
resetStatsBtn.addEventListener('click', handleResetStats);

// Navigation links
document.getElementById('nav-to-license').addEventListener('click', () => showScreen('screen-license'));
document.getElementById('nav-to-license-btn').addEventListener('click', () => showScreen('screen-license'));
document.getElementById('nav-to-stats').addEventListener('click', () => { loadStats(); showScreen('screen-stats'); });
document.getElementById('back-from-stats').addEventListener('click', () => showScreen('screen-main'));
document.getElementById('back-from-license').addEventListener('click', () => showScreen('screen-main'));

// Lemon Squeezy buttons
document.getElementById('btn-onetime').addEventListener('click', () => chrome.tabs.create({ url: LEMON_SQUEEZY_URLS.oneTime }));
document.getElementById('btn-monthly').addEventListener('click', () => chrome.tabs.create({ url: LEMON_SQUEEZY_URLS.monthly }));
