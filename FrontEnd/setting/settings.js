// settings.js

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  if (window.lucide) {
    lucide.createIcons();
  }

  // --- Navigation Panel Logic (Global) ---
  const userMenuBtn = document.getElementById('userMenuBtn');
  const navPanel = document.getElementById('navPanel');
  const panelItems = document.querySelectorAll('.panel-item');

  // Toggle Nav Panel
  if (userMenuBtn && navPanel) {
    userMenuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navPanel.classList.toggle("hidden");
    });

    // Close Panel on outside click
    document.addEventListener("click", (e) => {
      if (!navPanel.contains(e.target) && !userMenuBtn.contains(e.target)) {
        navPanel.classList.add("hidden");
      }
    });
  }

  // Navigation routing
  panelItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');

      if (targetTab === 'dashboard') {
        window.location.href = '../Main_Dash/mainDash.html';
      } else if (targetTab === 'history') {
        window.location.href = '../History/history.html';
      } else if (targetTab === 'settings') {
        // Already on settings page, just close panel
        navPanel.classList.add('hidden');
      } else if (targetTab === 'quickscan') {
        alert('Quick Scan feature - Enter a URL to scan for phishing threats!');
        navPanel.classList.add('hidden');
      }
    });
  });

  // Logout button
  const logoutBtn = document.querySelector('.logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        window.location.href = '../login-page/login.html';
      }
    });
  }

  // --- Settings Page Specific Logic ---
  initSettingsNavigation();
  loadSettings();
  initControls();
});

/* ---------- Settings Sidebar Navigation ---------- */
function initSettingsNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  const sections = document.querySelectorAll('.settings-section');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-target');

      // Update Sidebar Active State
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Show Target Section
      sections.forEach(section => {
        section.classList.remove('active');
        if (section.id === targetId) {
          section.classList.add('active');
        }
      });

      if (targetId === 'about') {
        ensureAboutFrameLoaded();
      }
    });
  });

  const activeSection = document.querySelector('.settings-section.active');
  if (activeSection && activeSection.id === 'about') {
    ensureAboutFrameLoaded();
  }
}

let aboutFrameLoaded = false;
function ensureAboutFrameLoaded() {
  if (aboutFrameLoaded) return;
  const aboutFrame = document.getElementById('aboutFrame');
  if (!aboutFrame) return;
  const src = aboutFrame.dataset.src || '../about/about.html';
  aboutFrame.src = src;
  aboutFrameLoaded = true;
}

/* ---------- Load / Save Settings ---------- */
const defaults = {
  theme: 'dark',
  neonGlow: true,
  accent: '#22d3ee',
  autoScanOnLoad: false,
  deepScanMode: 'standard',
  autoBlock: false,
  saveHistory: true,
  historyTTL: 7,
  enableNotif: true,
  dailySummary: false,
  sessionTimeout: 60
};

let settings = {};

function loadSettings() {
  try {
    const raw = localStorage.getItem('phisheye_settings');
    settings = raw ? JSON.parse(raw) : { ...defaults };
  } catch (e) {
    settings = { ...defaults };
  }
  applySettingsToUI();
  applyTheme();
}

function saveSettings() {
  localStorage.setItem('phisheye_settings', JSON.stringify(settings));
}

/* ---------- Apply settings to UI ---------- */
function applySettingsToUI() {
  // Theme
  const themeRadio = document.querySelector(`input[name="theme"][value="${settings.theme}"]`);
  if (themeRadio) themeRadio.checked = true;

  // Neon Glow
  const neonCheck = document.getElementById('neonGlow');
  if (neonCheck) neonCheck.checked = !!settings.neonGlow;

  // Accent
  document.documentElement.style.setProperty('--cyan-500', settings.accent);
  // Also update the picker UI
  document.querySelectorAll('.accent-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === settings.accent);
  });

  // Scan Preferences
  if (document.getElementById('autoScanOnLoad')) document.getElementById('autoScanOnLoad').checked = !!settings.autoScanOnLoad;
  if (document.getElementById('deepScanMode')) document.getElementById('deepScanMode').value = settings.deepScanMode;
  if (document.getElementById('autoBlock')) document.getElementById('autoBlock').checked = !!settings.autoBlock;

  // Privacy
  if (document.getElementById('saveHistory')) document.getElementById('saveHistory').checked = !!settings.saveHistory;
  if (document.getElementById('historyTTL')) document.getElementById('historyTTL').value = settings.historyTTL;

  // Notifications
  if (document.getElementById('enableNotif')) document.getElementById('enableNotif').checked = !!settings.enableNotif;
  if (document.getElementById('dailySummary')) document.getElementById('dailySummary').checked = !!settings.dailySummary;

  // Security
  if (document.getElementById('sessionTimeout')) document.getElementById('sessionTimeout').value = settings.sessionTimeout;
}

/* ---------- Apply theme (update DOM/CSS) ---------- */
function applyTheme() {
  const theme = settings.theme || 'dark';
  // In a real app, you might toggle a class on body
  // For now, we just ensure the radio is checked
  // Implementation of light mode would require CSS variables update
}

/* ---------- Read UI into settings ---------- */
function readUIToSettings() {
  const themeEl = document.querySelector('input[name="theme"]:checked');
  if (themeEl) settings.theme = themeEl.value;

  const neonEl = document.getElementById('neonGlow');
  if (neonEl) settings.neonGlow = neonEl.checked;

  // Accent is handled by click listener directly

  const autoScanEl = document.getElementById('autoScanOnLoad');
  if (autoScanEl) settings.autoScanOnLoad = autoScanEl.checked;

  const deepScanEl = document.getElementById('deepScanMode');
  if (deepScanEl) settings.deepScanMode = deepScanEl.value;

  const autoBlockEl = document.getElementById('autoBlock');
  if (autoBlockEl) settings.autoBlock = autoBlockEl.checked;

  const saveHistEl = document.getElementById('saveHistory');
  if (saveHistEl) settings.saveHistory = saveHistEl.checked;

  const ttlEl = document.getElementById('historyTTL');
  if (ttlEl) settings.historyTTL = Number(ttlEl.value);

  const notifEl = document.getElementById('enableNotif');
  if (notifEl) settings.enableNotif = notifEl.checked;

  const dailyEl = document.getElementById('dailySummary');
  if (dailyEl) settings.dailySummary = dailyEl.checked;

  const sessionEl = document.getElementById('sessionTimeout');
  if (sessionEl) settings.sessionTimeout = Number(sessionEl.value);
}

/* ---------- Wire up controls ---------- */
function initControls() {
  // Accent Picker
  const palette = document.getElementById('accentPalette');
  if (palette) {
    palette.addEventListener('click', (e) => {
      const btn = e.target.closest('.accent-btn');
      if (!btn) return;

      // UI Update
      document.querySelectorAll('.accent-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Logic Update
      const color = btn.dataset.color;
      settings.accent = color;
      document.documentElement.style.setProperty('--cyan-500', color);
      // We can also update other variables derived from accent if needed
    });
  }

  // Save Button
  const saveBtn = document.getElementById('saveSettings');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      readUIToSettings();
      saveSettings();
      alert('Settings saved successfully!');
    });
  }

  // Reset Defaults
  const resetBtn = document.getElementById('resetDefaults');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Reset all settings to default?')) {
        settings = { ...defaults };
        applySettingsToUI();
        saveSettings();
      }
    });
  }

  // Delete Account
  const delBtn = document.getElementById('deleteAccount');
  if (delBtn) {
    delBtn.addEventListener('click', () => {
      if (confirm('Are you sure? This will delete all your data permanently.')) {
        localStorage.clear();
        alert('Account deleted.');
        window.location.reload();
      }
    });
  }

}
