document.addEventListener('DOMContentLoaded', () => {
    const scanBtn = document.getElementById('scanBtn');
    const urlDisplay = document.getElementById('urlDisplay');
    const resultSection = document.getElementById('resultSection');
    const loadingSection = document.getElementById('loadingSection');
    const errorSection = document.getElementById('errorSection');

    // Elements to update
    const verdictText = document.getElementById('verdictText');
    const verdictBox = document.getElementById('verdictBox');
    const riskBar = document.getElementById('riskBar');
    const riskValue = document.getElementById('riskValue');
    const confidenceValue = document.getElementById('confidenceValue');
    const cachedBadge = document.getElementById('cachedBadge');

    let currentTabUrl = '';

    // Get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
            currentTabUrl = tabs[0].url;
            urlDisplay.querySelector('.url-text').textContent = currentTabUrl;
        }
    });

    scanBtn.addEventListener('click', async () => {
        if (!currentTabUrl) return;

        // UI Reset
        scanBtn.disabled = true;
        resultSection.classList.add('hidden');
        errorSection.classList.add('hidden');
        loadingSection.classList.remove('hidden');

        try {
            const response = await fetch('http://localhost:5000/api/scan/quick', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: currentTabUrl })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            displayResult(data);

        } catch (error) {
            console.error('Scan Error:', error);
            errorSection.querySelector('#errorText').textContent = 'Backend Connection Failed';
            errorSection.classList.remove('hidden');
        } finally {
            loadingSection.classList.add('hidden');
            scanBtn.disabled = false;
        }
    });

    function displayResult(data) {
        resultSection.classList.remove('hidden');

        // Verdict
        const verdict = data.verdict.toUpperCase();
        verdictText.textContent = verdict;

        // Reset classes
        verdictBox.className = 'verdict-box';

        if (verdict === 'SAFE') {
            verdictBox.classList.add('verdict-safe');
            riskBar.style.backgroundColor = '#22c55e';
        } else if (verdict === 'PHISHING' || verdict === 'MALICIOUS') {
            verdictBox.classList.add('verdict-malicious');
            riskBar.style.backgroundColor = '#ef4444';
        } else {
            verdictBox.classList.add('verdict-suspicious');
            riskBar.style.backgroundColor = '#f59e0b';
        }

        // Risk Score & Confidence
        // Backend returns 0-1 or 0-100? Assuming 0-1 based on previous code (confidence_score)
        const riskPercent = Math.round((data.risk_score || 0) * 100);
        const confPercent = Math.round((data.confidence || 0) * 100);

        riskBar.style.width = `${riskPercent}%`;
        riskValue.textContent = `${riskPercent}%`;
        confidenceValue.textContent = `${confPercent}%`;

        // Cached Logic
        if (data.cached) {
            cachedBadge.classList.remove('hidden');
        } else {
            cachedBadge.classList.add('hidden');
        }
    }
});
