// Utility Functions for PhishEye

// Show loading spinner
function showLoading(button) {
    if (!button) return null;

    const originalText = button.textContent;
    button.disabled = true;
    button.classList.add('loading');

    return originalText;
}

// Hide loading spinner
function hideLoading(button, originalText) {
    if (!button) return;

    button.disabled = false;
    button.classList.remove('loading');
    if (originalText) {
        button.textContent = originalText;
    }
}

// Show error message
function showError(message, containerId = null) {
    if (containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.textContent = message;
            container.style.color = 'var(--error, #ef4444)';
            container.style.display = 'block';
            return;
        }
    }

    // Fallback to alert
    alert(message);
}

// Show success message
function showSuccess(message, containerId = null) {
    if (containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.textContent = message;
            container.style.color = 'var(--success, #22c55e)';
            container.style.display = 'block';
            return;
        }
    }

    // Fallback to alert
    alert(message);
}

// Clear message
function clearMessage(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.textContent = '';
        container.style.display = 'none';
    }
}

// Debounce function for search/input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Validate email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validate URL
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Validate phone number (basic)
function isValidPhone(phone) {
    const phoneRegex = /^\d{10,15}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
}

// Check authentication and redirect if needed
function requireAuth() {
    if (!api.isAuthenticated()) {
        window.location.href = '../login-page/login.html';
        return false;
    }
    return true;
}

// Get status color based on scan result
function getStatusColor(status) {
    const colors = {
        'safe': '#22c55e',
        'suspicious': '#f59e0b',
        'malicious': '#ef4444',
        'malware': '#dc2626'
    };
    return colors[status.toLowerCase()] || '#6b7280';
}

// Get status badge HTML
function getStatusBadge(status) {
    const color = getStatusColor(status);
    return `<span class="status-badge" style="background-color: ${color}20; color: ${color}; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">${status.toUpperCase()}</span>`;
}

// Truncate URL for display
function truncateURL(url, maxLength = 50) {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength - 3) + '...';
}

// Copy to clipboard
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy:', err);
        return false;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showLoading,
        hideLoading,
        showError,
        showSuccess,
        clearMessage,
        debounce,
        formatDate,
        isValidEmail,
        isValidURL,
        isValidPhone,
        requireAuth,
        getStatusColor,
        getStatusBadge,
        truncateURL,
        copyToClipboard
    };
}
