// PhishEye Production Background Service
chrome.runtime.onInstalled.addListener(() => {
    console.log('PhishEye Production Service Started');
});

// Listening for messages from Dashboard or Popup
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
    if (message.type === 'SYNC_AUTH') {
        const { token } = message.payload;
        chrome.storage.local.set({ phisheye_token: token }, () => {
            console.log('[PhishEye] Auth Synced from Dashboard');
            sendResponse({ success: true });
        });
        return true; // Keep channel open for async response
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_AUTH') {
        chrome.storage.local.get(['phisheye_token'], (res) => {
            sendResponse(res.phisheye_token || null);
        });
        return true;
    }
    
    // Handle internal SYNC_AUTH messages from content scripts
    if (message.type === 'SYNC_AUTH') {
        const { token } = message.payload;
        chrome.storage.local.set({ phisheye_token: token }, () => {
            console.log('[PhishEye Background] Auth Token Synced to Extension Storage');
            sendResponse({ success: true });
        });
        return true; // Keep channel open for async response
    }
    
    // Handle token verification
    if (message.type === 'VERIFY_TOKEN') {
        const { token } = message;
        verifyToken(token).then(isValid => {
            sendResponse({ valid: isValid });
        });
        return true;
    }
});

// Verify token with backend
async function verifyToken(token) {
    try {
        const response = await fetch('http://localhost:5000/api/auth/verify', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.ok;
    } catch (error) {
        console.error('[PhishEye] Token verification error:', error);
        return false;
    }
}

// Auto-scan logic
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    // Only scan when page is fully loaded and URL is valid
    if (changeInfo.status === 'complete' && tab.url) {
        // Skip chrome://, chrome-extension://, and other non-http URLs
        if (tab.url.startsWith('http://') || tab.url.startsWith('https://')) {
            // Skip localhost dashboard pages
            if (!tab.url.includes('localhost:5000')) {
                runAutoScan(tabId, tab.url);
            }
        }
    }
});

async function runAutoScan(tabId, url) {
    const { phisheye_token: token } = await chrome.storage.local.get(['phisheye_token']);

    // Auto-scan only for logged-in users
    if (!token) {
        console.log('[PhishEye] Auto-scan skipped: No authentication token');
        return;
    }

    try {
        console.log('[PhishEye] Auto-scanning URL:', url);
        const response = await fetch('http://localhost:5000/api/scan/quick', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ url: url })
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Token expired, remove it
                await chrome.storage.local.remove('phisheye_token');
                console.log('[PhishEye] Token expired, removed from storage');
            }
            return;
        }

        const data = await response.json();

        if (data.success && data.result) {
            const status = data.result.status.toUpperCase();
            const result = data.result;
            
            console.log('[PhishEye] Scan result:', status, 'for', url);
            
            // Store scan result for popup to display
            await chrome.storage.local.set({ 
                lastScanResult: {
                    url: url,
                    status: status,
                    confidenceScore: result.confidenceScore,
                    explanation: result.explanation,
                    cached: result.cached || false,
                    timestamp: Date.now()
                }
            });

            // Show result popup for ALL scan results (safe, suspicious, malicious)
            try {
                await chrome.tabs.sendMessage(tabId, {
                    type: 'SHOW_SCAN_RESULT',
                    payload: {
                        url: url,
                        status: status,
                        score: result.confidenceScore,
                        explanation: result.explanation,
                        confidence: result.confidenceScore
                    }
                });
            } catch (e) {
                // Content script might not be ready, that's okay
                console.log('[PhishEye] Could not send result message (content script may not be ready)');
            }

            // Also show browser notification for important results
            if (status === 'MALICIOUS' || status === 'PHISHING') {
                showBrowserNotification('PhishEye Alert', `⚠️ ${status} site detected!`, url);
            } else if (status === 'SAFE') {
                // Optionally show safe notification (can be disabled)
                // showBrowserNotification('PhishEye', '✅ Site is safe', url);
            }
        }
    } catch (error) {
        console.error('[PhishEye] Auto-scan error:', error);
    }
}

// Show browser notification
function showBrowserNotification(title, message, url) {
    // Try to create notification, but don't fail if icons don't exist
    try {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: chrome.runtime.getURL('icons/icon48.png'),
            title: title,
            message: message,
            priority: 2
        }, (notificationId) => {
            if (chrome.runtime.lastError) {
                // If icon doesn't exist, create without icon
                chrome.notifications.create({
                    type: 'basic',
                    title: title,
                    message: message,
                    priority: 2
                });
            }
        });
    } catch (e) {
        console.log('[PhishEye] Notification creation failed:', e);
    }
}
