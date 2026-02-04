// API Configuration
const CONFIG = {
  // API Base URL - Update this to your backend server URL
  API_BASE_URL: 'http://localhost:5000/api',
  
  // Alternative: Use environment detection
  // API_BASE_URL: window.location.hostname === 'localhost' 
  //   ? 'http://localhost:5000/api' 
  //   : 'https://your-production-api.com/api',
  
  // Authentication
  TOKEN_KEY: 'phisheye_auth_token',
  USER_KEY: 'phisheye_user',
  
  // Request timeouts (milliseconds)
  REQUEST_TIMEOUT: 30000,
  
  // Local storage keys
  SETTINGS_KEY: 'phisheye_settings',
  
  // Default settings
  DEFAULT_SETTINGS: {
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
  }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
