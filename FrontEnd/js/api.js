// PhishEye API Service Layer
// Centralized API communication with error handling and authentication

class APIService {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.tokenKey = CONFIG.TOKEN_KEY;
        this.userKey = CONFIG.USER_KEY;
    }

    // Get stored authentication token
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    // Set authentication token
    setToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    // Remove authentication token
    removeToken() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
    }

    // Get stored user data
    getUser() {
        const user = localStorage.getItem(this.userKey);
        return user ? JSON.parse(user) : null;
    }

    // Set user data
    setUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.getToken();
    }

    // Build headers with authentication
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (includeAuth && this.getToken()) {
            headers['Authorization'] = `Bearer ${this.getToken()}`;
        }

        return headers;
    }

    // Generic request method with error handling
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: this.getHeaders(options.auth !== false)
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            console.error('API Request Error:', error);

            // Handle authentication errors
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                this.removeToken();
                window.location.href = '/login-page/login.html';
            }

            throw error;
        }
    }

    // GET request
    async get(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'GET',
            ...options
        });
    }

    // POST request
    async post(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options
        });
    }

    // PUT request
    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options
        });
    }

    // DELETE request
    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'DELETE',
            ...options
        });
    }

    // ==================== AUTHENTICATION ENDPOINTS ====================

    // User login
    async login(email, password) {
        const response = await this.post('/auth/login', { email, password }, { auth: false });

        if (response.success && response.token) {
            this.setToken(response.token);
            this.setUser(response.user);
        }

        return response;
    }

    // User signup
    async signup(userData) {
        return await this.post('/auth/signup', userData, { auth: false });
    }

    // Send OTP
    async sendOTP(phone) {
        return await this.post('/auth/send-otp', { phone }, { auth: false });
    }

    // Verify OTP
    async verifyOTP(phone, otp) {
        return await this.post('/auth/verify-otp', { phone, otp }, { auth: false });
    }

    // User logout
    async logout() {
        try {
            await this.post('/auth/logout');
        } finally {
            this.removeToken();
        }
    }

    // ==================== URL SCANNING ENDPOINTS ====================

    // Quick scan
    async quickScan(url) {
        return await this.post('/scan/quick', { url });
    }

    // Deep scan
    async deepScan(url, scanMode = 'standard') {
        return await this.post('/scan/deep', { url, scanMode });
    }

    // ==================== HISTORY & ANALYTICS ENDPOINTS ====================

    // Get scan history
    async getScanHistory(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/history/scans?${queryString}` : '/history/scans';
        return await this.get(endpoint);
    }

    // Get dashboard statistics
    async getDashboardStats(period = '7d') {
        return await this.get(`/analytics/dashboard?period=${period}`);
    }

    // Get distribution analytics (for pie chart)
    async getDistribution() {
        return await this.get('/analytics/distribution');
    }

    // Delete specific scan
    async deleteScan(scanId) {
        return await this.delete(`/history/scans/${scanId}`);
    }

    // Clear all history
    async clearHistory() {
        return await this.delete('/history/clear');
    }

    // ==================== USER SETTINGS ENDPOINTS ====================

    // Get user settings
    async getSettings() {
        return await this.get('/user/settings');
    }

    // Update user settings
    async updateSettings(settings) {
        return await this.put('/user/settings', settings);
    }

    // Reset settings to default
    async resetSettings() {
        return await this.post('/user/settings/reset');
    }

    // ==================== USER PROFILE ENDPOINTS ====================

    // Get user profile
    async getProfile() {
        return await this.get('/user/profile');
    }

    // Update user profile
    async updateProfile(profileData) {
        return await this.put('/user/profile', profileData);
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        return await this.put('/user/password', { currentPassword, newPassword });
    }

    // Delete account
    async deleteAccount(password, confirmation) {
        return await this.delete('/user/account', {
            body: JSON.stringify({ password, confirmation })
        });
    }

    // ==================== NOTIFICATION ENDPOINTS ====================

    // Get notifications
    async getNotifications(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = queryString ? `/notifications?${queryString}` : '/notifications';
        return await this.get(endpoint);
    }

    // Mark notification as read
    async markNotificationRead(notificationId) {
        return await this.put(`/notifications/${notificationId}/read`);
    }

    // ==================== UTILITY ENDPOINTS ====================

    // Health check
    async healthCheck() {
        return await this.get('/health', { auth: false });
    }

    // Export history
    async exportHistory(format = 'json', period = '30d') {
        const endpoint = `/history/export?format=${format}&period=${period}`;
        const url = `${this.baseURL}${endpoint}`;

        // Open in new window for file download
        const token = this.getToken();
        const headers = token ? `&token=${token}` : '';
        window.open(`${url}${headers}`, '_blank');
    }
}

// Create singleton instance
const api = new APIService();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
}
