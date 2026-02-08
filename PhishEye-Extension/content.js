// PhishEye Content Script
// 1. Bridges Authentication from Dashboard to Extension
// 2. Displays Real-time Warnings

// --- AUTH SYNCHRONIZATION ---
window.addEventListener('message', (event) => {
    // Only accept messages from ourselves
    if (event.source !== window) return;

    if (event.data.type === 'PHISHEYE_AUTH_SYNC') {
        const { token } = event.data;
        // Forward to background script to store in chrome.storage.local
        chrome.runtime.sendMessage({
            type: 'SYNC_AUTH',
            payload: { token: token }
        }, (response) => {
            console.log('[PhishEye Content] Auth Token Synced to Extension Storage');
        });
    }
});

// Also check localStorage for token sync (backup method)
function checkLocalStorageForToken() {
    try {
        const syncTime = localStorage.getItem('phisheye_auth_sync_time');
        const token = localStorage.getItem('phisheye_auth_sync_token');
        
        // Only sync if token was set in last 5 seconds (to avoid stale tokens)
        if (token && syncTime) {
            const timeDiff = Date.now() - parseInt(syncTime);
            if (timeDiff < 5000) { // 5 seconds
                chrome.runtime.sendMessage({
                    type: 'SYNC_AUTH',
                    payload: { token: token }
                }, (response) => {
                    console.log('[PhishEye Content] Auth Token Synced from localStorage');
                });
            }
        }
    } catch (e) {
        console.warn('[PhishEye Content] Error checking localStorage for token', e);
    }
}

// Check for token sync every second when on dashboard/login pages
if (window.location.href.includes('localhost:5000') || window.location.href.includes('Main_Dash') || window.location.href.includes('login')) {
    checkLocalStorageForToken();
    const syncInterval = setInterval(() => {
        checkLocalStorageForToken();
        // Stop checking after 30 seconds to avoid infinite loop
        setTimeout(() => clearInterval(syncInterval), 30000);
    }, 1000);
}

// Also listen for storage events (when localStorage changes)
window.addEventListener('storage', (e) => {
    if (e.key === 'phisheye_auth_sync_token') {
        checkLocalStorageForToken();
    }
});

// --- SCAN RESULT DISPLAY ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SHOW_WARNING') {
        showWarningBanner(message.payload);
    } else if (message.type === 'SHOW_SCAN_RESULT') {
        showScanResultBanner(message.payload);
    }
});

function showWarningBanner(data) {
    if (document.getElementById('phisheye-warning-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'phisheye-warning-banner';

    // Modern Red Warning Style
    Object.assign(banner.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        backgroundColor: '#ef4444',
        color: 'white',
        padding: '16px 24px',
        zIndex: '2147483647', // Max Z-index
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
        fontWeight: '500',
        borderBottom: '2px solid rgba(0,0,0,0.1)'
    });

    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.alignItems = 'center';

    // Add explanation if available
    const explanation = data.explanation ? `<br/><small style="opacity: 0.9; font-weight: 400;">Reason: ${data.explanation}</small>` : '';

    content.innerHTML = `
        <div style="font-size: 24px; margin-right: 16px;">⚠️</div>
        <div>
            <div style="font-size: 16px; font-weight: 700;">PHISHEYE ALERT: POTENTIAL THREAT DETECTED</div>
            <div style="font-size: 14px;">This site is flagged as <strong>${data.status}</strong> (${Math.round(data.score * 100)}% Confidence). ${explanation}</div>
        </div>
    `;

    const actionArea = document.createElement('div');
    actionArea.style.display = 'flex';
    actionArea.style.gap = '10px';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Dismiss Warning';
    Object.assign(closeBtn.style, {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '600'
    });

    closeBtn.onclick = () => banner.remove();

    const dashBtn = document.createElement('button');
    dashBtn.textContent = 'View Dashboard';
    Object.assign(dashBtn.style, {
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '600'
    });

    dashBtn.onclick = () => {
        window.open('http://localhost:5000/FrontEnd/Main_Dash/mainDash.html', '_blank');
    };

    actionArea.appendChild(dashBtn);
    actionArea.appendChild(closeBtn);
    banner.appendChild(content);
    banner.appendChild(actionArea);
    document.body.prepend(banner);
}

function showScanResultBanner(data) {
    // Remove existing banners
    const existingBanner = document.getElementById('phisheye-scan-result-banner');
    if (existingBanner) existingBanner.remove();

    const banner = document.createElement('div');
    banner.id = 'phisheye-scan-result-banner';

    const status = data.status.toUpperCase();
    const isSafe = status === 'SAFE';
    const isMalicious = status === 'MALICIOUS' || status === 'PHISHING';
    const isSuspicious = status === 'SUSPICIOUS';

    // Color scheme based on status
    let bgColor, borderColor, icon, titleText;
    if (isSafe) {
        bgColor = '#22c55e'; // Green
        borderColor = '#16a34a';
        icon = '✅';
        titleText = 'PHISHEYE: SITE IS SAFE';
    } else if (isMalicious) {
        bgColor = '#ef4444'; // Red
        borderColor = '#dc2626';
        icon = '⚠️';
        titleText = 'PHISHEYE ALERT: POTENTIAL THREAT DETECTED';
    } else {
        bgColor = '#f59e0b'; // Yellow/Orange
        borderColor = '#d97706';
        icon = '⚠️';
        titleText = 'PHISHEYE: SUSPICIOUS SITE DETECTED';
    }

    // Modern Banner Style
    Object.assign(banner.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        backgroundColor: bgColor,
        color: 'white',
        padding: '16px 24px',
        zIndex: '2147483647', // Max Z-index
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
        fontWeight: '500',
        borderBottom: `3px solid ${borderColor}`,
        animation: 'slideDown 0.3s ease-out'
    });

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from {
                transform: translateY(-100%);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    const content = document.createElement('div');
    content.style.display = 'flex';
    content.style.alignItems = 'center';
    content.style.flex = '1';

    const confidence = Math.round((data.confidence || data.score || 0) * 100);
    const explanation = data.explanation ? `<br/><small style="opacity: 0.9; font-weight: 400;">${data.explanation}</small>` : '';

    content.innerHTML = `
        <div style="font-size: 28px; margin-right: 16px;">${icon}</div>
        <div style="flex: 1;">
            <div style="font-size: 16px; font-weight: 700;">${titleText}</div>
            <div style="font-size: 14px; margin-top: 4px;">
                Status: <strong>${status}</strong> • Confidence: <strong>${confidence}%</strong>
                ${explanation}
            </div>
        </div>
    `;

    const actionArea = document.createElement('div');
    actionArea.style.display = 'flex';
    actionArea.style.gap = '10px';
    actionArea.style.alignItems = 'center';

    const dashBtn = document.createElement('button');
    dashBtn.textContent = 'View Dashboard';
    Object.assign(dashBtn.style, {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '600',
        transition: 'all 0.2s'
    });
    dashBtn.onmouseover = () => {
        dashBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
    };
    dashBtn.onmouseout = () => {
        dashBtn.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    };
    dashBtn.onclick = () => {
        window.open('http://localhost:5000/FrontEnd/Main_Dash/mainDash.html', '_blank');
    };

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.title = 'Dismiss';
    Object.assign(closeBtn.style, {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.5)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: '600',
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    });
    closeBtn.onclick = () => banner.remove();

    // Auto-dismiss safe banners after 5 seconds
    if (isSafe) {
        setTimeout(() => {
            if (banner.parentNode) {
                banner.style.transition = 'all 0.3s ease-out';
                banner.style.transform = 'translateY(-100%)';
                banner.style.opacity = '0';
                setTimeout(() => banner.remove(), 300);
            }
        }, 5000);
    }

    actionArea.appendChild(dashBtn);
    actionArea.appendChild(closeBtn);
    banner.appendChild(content);
    banner.appendChild(actionArea);
    document.body.prepend(banner);
}
