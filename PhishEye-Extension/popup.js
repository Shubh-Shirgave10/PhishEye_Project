document.addEventListener('DOMContentLoaded', () => {
    const scanBtn = document.getElementById('scanBtn');
    const urlDisplay = document.getElementById('urlDisplay');
    const resultSection = document.getElementById('resultSection');
    const loadingSection = document.getElementById('loadingSection');
    const errorSection = document.getElementById('errorSection');
    const authRequired = document.getElementById('authRequired');
    const goToDashBtn = document.getElementById('goToDashBtn');

    // UI Elements
    const verdictText = document.getElementById('verdictText');
    const verdictBox = document.getElementById('verdictBox');
    const riskBar = document.getElementById('riskBar');
    const riskValue = document.getElementById('riskValue');
    const confidenceValue = document.getElementById('confidenceValue');
    const explanationText = document.getElementById('explanationText');
    const cachedBadge = document.getElementById('cachedBadge');

    let currentTabUrl = '';

    // 1. Initial State Check and Setup
    initializePopup();

    async function initializePopup() {
        // First, check authentication
        const isAuthenticated = await checkAuth();
        
        // Then get tab info and auto-scan if authenticated
        await getTabInfo();
        
        // If authenticated and we have a valid URL, auto-scan
        if (isAuthenticated && currentTabUrl && isValidUrl(currentTabUrl)) {
            await autoScanCurrentTab();
        }
    }

    async function getTabInfo() {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tabs[0] && tabs[0].url) {
                currentTabUrl = tabs[0].url;
                const urlText = urlDisplay.querySelector('.url-text');
                if (urlText) {
                    urlText.textContent = truncateUrl(currentTabUrl, 50);
                    urlText.title = currentTabUrl;
                }
            } else {
                const urlText = urlDisplay.querySelector('.url-text');
                if (urlText) {
                    urlText.textContent = 'No active tab detected';
                }
            }
        } catch (error) {
            console.error('Error getting tab info:', error);
        }
    }

    function isValidUrl(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
        } catch {
            return false;
        }
    }

    function truncateUrl(url, maxLength) {
        if (url.length <= maxLength) return url;
        return url.substring(0, maxLength - 3) + '...';
    }

    async function checkAuth() {
        try {
            const { phisheye_token: token } = await chrome.storage.local.get(['phisheye_token']);
            
            if (!token) {
                showAuthRequired();
                return false;
            }

            // Verify token with backend
            const isValid = await verifyToken(token);
            
            if (!isValid) {
                // Token is invalid, remove it
                await chrome.storage.local.remove('phisheye_token');
                showAuthRequired();
                return false;
            }

            // Token is valid, show scan interface
            showScanInterface();
            return true;
        } catch (error) {
            console.error('Auth check error:', error);
            showAuthRequired();
            return false;
        }
    }

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
            console.error('Token verification error:', error);
            return false;
        }
    }

    function showAuthRequired() {
        authRequired.classList.remove('hidden');
        scanBtn.classList.add('hidden');
        resultSection.classList.add('hidden');
        loadingSection.classList.add('hidden');
    }

    function showScanInterface() {
        authRequired.classList.add('hidden');
        scanBtn.classList.remove('hidden');
    }

    async function autoScanCurrentTab() {
        if (!currentTabUrl || !isValidUrl(currentTabUrl)) return;

        // Check if there's a recent scan result for this URL (within last 5 minutes)
        const { lastScanResult } = await chrome.storage.local.get(['lastScanResult']);
        if (lastScanResult && lastScanResult.url === currentTabUrl) {
            const timeDiff = Date.now() - (lastScanResult.timestamp || 0);
            if (timeDiff < 300000) { // 5 minutes
                // Display the cached result
                displayResult({
                    success: true,
                    result: {
                        status: lastScanResult.status,
                        confidenceScore: lastScanResult.confidenceScore,
                        explanation: lastScanResult.explanation,
                        cached: lastScanResult.cached
                    }
                });
                return;
            }
        }

        // Auto-scan the current tab
        scanBtn.disabled = true;
        resultSection.classList.add('hidden');
        errorSection.classList.add('hidden');
        loadingSection.classList.remove('hidden');

        try {
            await performScan(currentTabUrl);
        } catch (error) {
            console.error('Auto-scan error:', error);
            loadingSection.classList.add('hidden');
        } finally {
            scanBtn.disabled = false;
        }
    }

    goToDashBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: 'http://localhost:5000/FrontEnd/Main_Dash/mainDash.html' });
    });

    scanBtn.addEventListener('click', async () => {
        if (!currentTabUrl || !isValidUrl(currentTabUrl)) {
            errorSection.querySelector('#errorText').textContent = 'Invalid URL. Please navigate to a valid website.';
            errorSection.classList.remove('hidden');
            return;
        }

        // UI Reset
        scanBtn.disabled = true;
        resultSection.classList.add('hidden');
        errorSection.classList.add('hidden');
        loadingSection.classList.remove('hidden');

        try {
            await performScan(currentTabUrl);
        } catch (error) {
            console.error('Scan Error:', error);
            errorSection.querySelector('#errorText').textContent = error.message || 'Scan failed';
            errorSection.classList.remove('hidden');
        } finally {
            loadingSection.classList.add('hidden');
            scanBtn.disabled = false;
        }
    });

    async function performScan(url) {
        const { phisheye_token: token } = await chrome.storage.local.get(['phisheye_token']);

        if (!token) {
            throw new Error('Not authenticated. Please login to the dashboard.');
        }

        const response = await fetch('http://localhost:5000/api/scan/quick', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ url: url })
        });

        if (response.status === 401) {
            // Token expired or invalid
            await chrome.storage.local.remove('phisheye_token');
            showAuthRequired();
            throw new Error('Session expired. Please login again.');
        }

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || 'Scan failed');
        }

        const data = await response.json();
        displayResult(data);
        
        // Store result for future reference
        await chrome.storage.local.set({
            lastScanResult: {
                url: url,
                status: data.result.status.toUpperCase(),
                confidenceScore: data.result.confidenceScore,
                explanation: data.result.explanation,
                cached: data.result.cached || false,
                timestamp: Date.now()
            }
        });
    }

    function displayResult(data) {
        if (!data.success || !data.result) {
            errorSection.querySelector('#errorText').textContent = 'Invalid Response';
            errorSection.classList.remove('hidden');
            return;
        }

        const res = data.result;
        resultSection.classList.remove('hidden');

        // Verdict Styling
        const verdict = res.status.toUpperCase();
        verdictText.textContent = verdict;
        verdictBox.className = 'verdict-box';

        if (verdict === 'SAFE') {
            verdictBox.classList.add('verdict-safe');
        } else if (verdict === 'MALICIOUS' || verdict === 'PHISHING') {
            verdictBox.classList.add('verdict-malicious');
        } else {
            verdictBox.classList.add('verdict-suspicious');
        }

        // Stats
        const risk = Math.round((res.confidenceScore || 0) * 100);
        riskBar.style.width = `${risk}%`;
        riskValue.textContent = `${risk}%`;
        confidenceValue.textContent = `${risk}%`;

        // Explanation
        explanationText.textContent = res.explanation || "No detailed explanation provided.";

        // Cached
        if (res.cached) cachedBadge.classList.remove('hidden');
        else cachedBadge.classList.add('hidden');

        // Show dashboard button after results
        showDashboardButton();
    }

    function showDashboardButton() {
        // Remove existing dashboard button if any
        const existingBtn = document.getElementById('viewDashboardBtn');
        if (existingBtn) existingBtn.remove();

        // Create and add dashboard button
        const dashBtn = document.createElement('button');
        dashBtn.id = 'viewDashboardBtn';
        dashBtn.className = 'primary-btn';
        dashBtn.style.marginTop = '16px';
        dashBtn.style.width = '100%';
        dashBtn.textContent = 'View Full Report in Dashboard';
        dashBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: 'http://localhost:5000/FrontEnd/Main_Dash/mainDash.html' });
        });

        // Insert after result section
        resultSection.appendChild(dashBtn);
    }
});
