document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // Navigation Panel Toggle
  const userMenuBtn = document.getElementById('userMenuBtn');
  const navPanel = document.getElementById('navPanel');
  const panelItems = document.querySelectorAll('.panel-item[data-tab]');

  // Toggle Nav Panel
  if (userMenuBtn) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navPanel.classList.toggle('hidden');
    });
  }

  // Close Panel when clicking outside
  document.addEventListener('click', (e) => {
    if (navPanel && !navPanel.contains(e.target) && userMenuBtn && !userMenuBtn.contains(e.target)) {
      navPanel.classList.add('hidden');
    }
  });

  // Navigation routing
  panelItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');

      if (targetTab === 'dashboard') {
        window.location.href = '../Main_Dash/mainDash.html';
      } else if (targetTab === 'history') {
        // Already on history page, just close panel
        navPanel.classList.add('hidden');
      } else if (targetTab === 'settings') {
        window.location.href = '../setting/settings.html';
      } else if (targetTab === 'quickscan') {
        alert('Quick Scan feature - Enter a URL to scan for phishing threats!');
        navPanel.classList.add('hidden');
      }
    });
  });

  // Logout button
  const logoutBtn = document.querySelector('.logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to logout?')) {
        try {
          await api.logout();
        } finally {
          window.location.href = '../login-page/login.html';
        }
      }
    });
  }

  // Check authentication
  requireAuth();

  // Load user profile
  loadUserProfile();

  // Load real data from API
  loadHistoryData();
});

// Load user profile
async function loadUserProfile() {
  try {
    const user = api.getUser();
    if (user) {
      const userName = document.querySelector('.panel-user-name');
      const userEmail = document.querySelector('.panel-user-email');
      const userAvatar = document.querySelector('.user-avatar');

      if (userName) userName.textContent = user.full_name || user.fullName || 'User';
      if (userEmail) userEmail.textContent = user.email || '';
      if (userAvatar) userAvatar.textContent = (user.full_name || user.fullName || 'U')[0].toUpperCase();
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
  }
}

// Load history data from API
async function loadHistoryData() {
  try {
    // Get distribution data
    const distributionResponse = await api.getDistribution();
    
    // Get scan history
    const historyResponse = await api.getScanHistory({ limit: 10 });

    // Update chart with real data
    if (distributionResponse.success && distributionResponse.data) {
      updateChart(distributionResponse.data);
    }

    // Update history cards with real data
    if (historyResponse.scans && historyResponse.scans.length > 0) {
      updateHistoryCards(historyResponse.scans);
      updateTimeline(historyResponse.scans);
      updateMiniCards(historyResponse.scans);
    } else {
      // Show empty state
      showEmptyState();
    }

    // Update analytics cards
    await updateAnalyticsCards();
  } catch (error) {
    console.error('Error loading history data:', error);
    showEmptyState();
  }
}

// Update chart with real data
function updateChart(distributionData) {
  const canvas = document.getElementById("securityChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const gradientSafe = ctx.createRadialGradient(140, 140, 10, 140, 140, 140);
  gradientSafe.addColorStop(0, "#4ade80");
  gradientSafe.addColorStop(1, "#15803d");

  const gradientSuspicious = ctx.createRadialGradient(140, 140, 10, 140, 140, 140);
  gradientSuspicious.addColorStop(0, "#fde047");
  gradientSuspicious.addColorStop(1, "#d97706");

  const gradientMalicious = ctx.createRadialGradient(140, 140, 10, 140, 140, 140);
  gradientMalicious.addColorStop(0, "#fb7185");
  gradientMalicious.addColorStop(1, "#b91c1c");

  const safe = distributionData.Safe || 0;
  const suspicious = distributionData.Suspicious || distributionData.Malware || 0;
  const malicious = distributionData.Phishing || distributionData.Malicious || 0;

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Safe", "Suspicious", "Malicious"],
      datasets: [
        {
          data: [safe, suspicious, malicious],
          backgroundColor: [gradientSafe, gradientSuspicious, gradientMalicious],
          borderColor: "#050b1b",
          borderWidth: 5,
          hoverBorderColor: "#38bdf8",
          hoverOffset: 18,
        },
      ],
    },
    options: {
      responsive: true,
      animation: {
        duration: 1400,
        easing: "easeOutQuint",
      },
      layout: {
        padding: 10,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: "rgba(3, 10, 31, 0.9)",
          titleColor: "#e0f2ff",
          bodyColor: "#c9dcff",
          borderColor: "rgba(14, 165, 233, 0.45)",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
        },
      },
    },
  });
}

// Update history cards with real scan data
function updateHistoryCards(scans) {
  const topCards = document.querySelector('.top-cards');
  if (!topCards) return;

  // Clear existing cards
  topCards.innerHTML = '';

  // Show up to 3 most recent scans
  scans.slice(0, 3).forEach(scan => {
    const card = document.createElement('article');
    card.className = `history-card ${scan.status.toLowerCase()}`;
    
    const riskScore = scan.confidenceScore ? Math.round(scan.confidenceScore * 100) : 0;
    const scanDate = formatDate(scan.detectTime || scan.created_at);
    
    card.innerHTML = `
      <div class="row">
        <span class="url">${truncateURL(scan.url, 30)}</span>
        <span class="badge ${scan.status.toLowerCase()}">${scan.status}</span>
      </div>
      <p class="subtitle">${scan.threats && scan.threats.length > 0 ? scan.threats.join(' • ') : 'No threats detected'}</p>
      <div class="meta">
        <span>Risk Score <strong>${riskScore}%</strong></span>
        <span>${scanDate}</span>
      </div>
      <button class="ghost-btn">View Report</button>
    `;
    
    topCards.appendChild(card);
  });
}

// Update analytics cards with real data
async function updateAnalyticsCards() {
  try {
    const statsResponse = await api.getDashboardStats('7d');
    
    if (statsResponse.success && statsResponse.stats) {
      const stats = statsResponse.stats;
      
      // Update total scans
      const totalElement = document.querySelector('.analytics-card.total strong');
      if (totalElement) totalElement.textContent = stats.totalScans || 0;
      
      // Update safe count
      const safeElement = document.querySelector('.analytics-card.safe strong');
      if (safeElement) safeElement.textContent = stats.safeCount || 0;
      
      // Update suspicious count
      const suspiciousElement = document.querySelector('.analytics-card.suspicious strong');
      if (suspiciousElement) suspiciousElement.textContent = stats.suspiciousCount || 0;
      
      // Update malicious count
      const maliciousElement = document.querySelector('.analytics-card.malicious strong');
      if (maliciousElement) maliciousElement.textContent = stats.maliciousCount || 0;
    }
  } catch (error) {
    console.error('Error updating analytics cards:', error);
  }
}

// Update timeline with recent scans
function updateTimeline(scans) {
  const timeline = document.querySelector('.timeline-premium');
  if (!timeline) return;

  // Clear existing items
  timeline.innerHTML = '';

  // Show up to 5 most recent scans
  scans.slice(0, 5).forEach(scan => {
    const item = document.createElement('div');
    item.className = `timeline-item ${scan.status.toLowerCase()}`;
    
    const scanDate = formatDate(scan.detectTime || scan.created_at);
    const timeOnly = new Date(scan.detectTime || scan.created_at).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    item.innerHTML = `
      <span class="dot"></span>
      <div>
        <p>${truncateURL(scan.url, 30)}</p>
        <small>${scan.status} • ${timeOnly}</small>
      </div>
    `;
    
    timeline.appendChild(item);
  });
}

// Update mini cards with recent scans
function updateMiniCards(scans) {
  const miniStack = document.querySelector('.mini-stack');
  if (!miniStack) return;

  // Clear existing cards
  miniStack.innerHTML = '';

  // Show up to 3 most recent scans
  scans.slice(0, 3).forEach(scan => {
    const card = document.createElement('article');
    card.className = `mini-card ${scan.status.toLowerCase()}`;
    
    const riskScore = scan.confidenceScore ? Math.round(scan.confidenceScore * 100) : 0;
    const scanDate = new Date(scan.detectTime || scan.created_at);
    const timeOnly = scanDate.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    card.innerHTML = `
      <div>
        <p class="url">${truncateURL(scan.url, 25)}</p>
        <span class="badge ${scan.status.toLowerCase()}">${scan.status}</span>
      </div>
      <div class="details">
        <span>${timeOnly}</span>
        <strong>Risk ${riskScore}%</strong>
      </div>
    `;
    
    miniStack.appendChild(card);
  });
}

// Show empty state when no data
function showEmptyState() {
  const topCards = document.querySelector('.top-cards');
  if (topCards) {
    topCards.innerHTML = `
      <article class="history-card" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
        <p style="color: #9ca3af; font-size: 18px;">No scan history yet. Start scanning URLs to see results here.</p>
      </article>
    `;
  }

  const timeline = document.querySelector('.timeline-premium');
  if (timeline) {
    timeline.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #9ca3af;">
        <p>No recent events</p>
      </div>
    `;
  }

  const miniStack = document.querySelector('.mini-stack');
  if (miniStack) {
    miniStack.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #9ca3af;">
        <p>No recent scans</p>
      </div>
    `;
  }
}
