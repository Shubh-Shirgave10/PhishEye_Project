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
    logoutBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to logout?')) {
        window.location.href = '../login-page/login.html';
      }
    });
  }

  // Chart.js for Security Distribution
  const canvas = document.getElementById("securityChart");
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

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Safe", "Suspicious", "Malicious"],
      datasets: [
        {
          data: [10, 7, 7],
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
});
