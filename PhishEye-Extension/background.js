// Minimal service worker
chrome.runtime.onInstalled.addListener(() => {
    console.log('PhishEye Extension Installed');
});

// Listener for logging
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'LOG') {
        console.log('[PhishEye]', message.payload);
    }
});
