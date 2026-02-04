document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  requireAuth();

  // Initialize Lucide Icons
  lucide.createIcons();

  // Load user profile
  await loadUserProfile();

  // Elements
  const userMenuBtn = document.getElementById('userMenuBtn');
  const navPanel = document.getElementById('navPanel');
  const panelItems = document.querySelectorAll('.panel-item[data-tab]');

  // Toggle Nav Panel
  userMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    navPanel.classList.toggle('hidden');
  });

  // Close Panel when clicking outside
  document.addEventListener('click', (e) => {
    if (!navPanel.contains(e.target) && !userMenuBtn.contains(e.target)) {
      navPanel.classList.add('hidden');
    }
  });

  // Tab Switching Logic
  panelItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');

      // Special handling for history tab - redirect to history page
      if (targetTab === 'history') {
        window.location.href = '../History/history.html';
        return;
      }

      // Special handling for settings tab - redirect to settings page
      if (targetTab === 'settings') {
        window.location.href = '../setting/settings.html';
        return;
      }

      // Special handling for quick scan - show scan modal
      if (targetTab === 'quickscan') {
        showQuickScanDialog();
        navPanel.classList.add('hidden');
        return;
      }

      // Close panel after selection
      navPanel.classList.add('hidden');
    });
  });

  // Logout Button
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

  // Load dashboard statistics and update chart
  await loadDashboardData();
});

// Load user profile
async function loadUserProfile() {
  try {
    const user = api.getUser();
    if (user) {
      // Update user info in nav panel
      const userName = document.querySelector('.panel-user-name');
      const userEmail = document.querySelector('.panel-user-email');
      const userAvatar = document.querySelector('.user-avatar');

      if (userName) userName.textContent = user.fullName || 'User';
      if (userEmail) userEmail.textContent = user.email || '';
      if (userAvatar) userAvatar.textContent = (user.fullName || 'U')[0].toUpperCase();
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
  }
}

// Load dashboard analytics from API
async function loadDashboardData() {
  try {
    // Get dashboard statistics from API
    const response = await api.getDashboardStats('7d');

    if (response.success && response.stats) {
      const stats = response.stats;

      // Update stat cards
      updateStatCard(0, stats.totalScans || 0);
      updateStatCard(1, stats.safeCount || 0);
      updateStatCard(2, stats.suspiciousCount || 0);
      updateStatCard(3, stats.maliciousCount || 0);

      // Update chart with real data
      updateChart(stats.trendData || [
        { label: 'Safe', value: stats.safeCount || 0 },
        { label: 'Suspicious', value: stats.suspiciousCount || 0 },
        { label: 'Malware', value: stats.maliciousCount || 0 }
      ]);
    } else {
      // Fallback to default data if API fails
      console.warn('Using fallback data for dashboard');
      updateChart([
        { label: 'Safe', value: 92 },
        { label: 'Suspicious', value: 21 },
        { label: 'Malware', value: 15 }
      ]);
    }
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    // Use fallback data
    updateChart([
      { label: 'Safe', value: 92 },
      { label: 'Suspicious', value: 21 },
      { label: 'Malware', value: 15 }
    ]);
  }
}

// Update stat card value
function updateStatCard(index, value) {
  const statCards = document.querySelectorAll('.stat-card');
  if (statCards[index]) {
    const valueElement = statCards[index].querySelector('.stat-value');
    if (valueElement) {
      valueElement.textContent = value;
    }
  }
}

// Update Chart.js with real data
function updateChart(trendData) {
  const ctx = document.getElementById('securityChart').getContext('2d');

  const labels = trendData.map(item => item.label);
  const values = trendData.map(item => item.value);

  const securityData = {
    labels: labels,
    datasets: [{
      label: 'Detection Analysis',
      data: values,
      borderColor: '#06b6d4', // cyan-500
      backgroundColor: 'rgba(6, 182, 212, 0.1)',
      borderWidth: 3,
      tension: 0.4,
      pointBackgroundColor: '#06b6d4',
      pointBorderColor: '#0e7490', // cyan-700
      pointBorderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
      fill: false
    }]
  };

  new Chart(ctx, {
    type: 'line',
    data: securityData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: '#111827', // gray-900
          titleColor: '#f3f4f6', // gray-100
          bodyColor: '#f3f4f6',
          borderColor: '#1f2937', // gray-800
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            label: function (context) {
              return `Value: ${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false
          },
          ticks: {
            color: '#9ca3af', // gray-400
            font: {
              size: 14
            }
          }
        },
        y: {
          grid: {
            color: '#1f2937', // gray-800
            borderDash: [5, 5]
          },
          ticks: {
            color: '#9ca3af',
            font: {
              size: 14
            }
          },
          min: 0,
          max: Math.max(...values) + 10
        }
      }
    }
  });
}

// Quick Scan Dialog
function showQuickScanDialog() {
  const url = prompt('Enter URL to scan for phishing threats:');

  if (!url) return;

  if (!isValidURL(url)) {
    alert('Please enter a valid URL');
    return;
  }

  performQuickScan(url);
}

// Perform quick scan using API
async function performQuickScan(url) {
  try {
    // Show loading state (you can improve this with a modal later)
    const originalBody = document.body.style.cursor;
    document.body.style.cursor = 'wait';

    const response = await api.quickScan(url);

    if (response.success && response.result) {
      const result = response.result;
      const status = result.status;
      const confidence = (result.confidenceScore * 100).toFixed(1);

      // Show result alert
      let message = `Scan Complete!\n\n`;
      message += `URL: ${url}\n`;
      message += `Status: ${status.toUpperCase()}\n`;
      message += `Confidence: ${confidence}%\n`;

      if (result.threats && result.threats.length > 0) {
        message += `\nThreats Detected:\n- ${result.threats.join('\n- ')}`;
      }

      alert(message);

      // Reload dashboard to show updated stats
      await loadDashboardData();
    } else {
      alert('Scan failed. Please try again.');
    }
  } catch (error) {
    console.error('Quick scan error:', error);
    alert(error.message || 'Failed to scan URL. Please try again.');
  } finally {
    document.body.style.cursor = 'default';
  }
}
