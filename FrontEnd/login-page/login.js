document.addEventListener('DOMContentLoaded', () => {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabIndicator = document.querySelector('.tab-indicator');
    const formsContainer = document.querySelector('.forms-container');
    const authForms = document.querySelectorAll('.auth-form');
    const switchLinks = document.querySelectorAll('[data-switch]');

    /* ---------------------- PASSWORD TOGGLE ---------------------- */
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            const input = document.getElementById(targetId);

            if (input.type === 'password') {
                input.type = 'text';
                btn.classList.add('active');
            } else {
                input.type = 'password';
                btn.classList.remove('active');
            }
        });
    });

    /* ---------------------- HEIGHT ADJUSTMENT ------------------ */
    function adjustHeight() {
        const activeForm = document.querySelector('.auth-form.active');
        if (activeForm) {
            formsContainer.style.height = activeForm.offsetHeight + 'px';
        }
    }

    window.addEventListener('load', adjustHeight);
    window.addEventListener('resize', adjustHeight);

    /* ---------------------- TAB SWITCHING ---------------------- */
    function switchTab(target) {
        tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.target === target);
        });

        if (target === 'signup') {
            tabIndicator.style.transform = 'translateX(100%)';
            formsContainer.style.transform = 'translateX(-50%)';
        } else {
            tabIndicator.style.transform = 'translateX(0)';
            formsContainer.style.transform = 'translateX(0)';
        }

        authForms.forEach(form => {
            if (form.id === target + 'Form') {
                form.classList.add('active');
            } else {
                form.classList.remove('active');
            }
        });

        setTimeout(adjustHeight, 50);
    }

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.target));
    });

    switchLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab(link.dataset.switch);
        });
    });

    /* ---------------------- OTP LOGIC WITH REAL API ---------------------- */
    const sendOtpBtn = document.getElementById('sendOtpBtn');
    const verifyOtpBtn = document.getElementById('verifyOtpBtn');
    const otpSection = document.getElementById('otpSection');
    const otpInput = document.getElementById('otpInput');
    const otpStatus = document.getElementById('otpStatus');
    const signupPhone = document.getElementById('signup-phone');

    let isOtpVerified = false;

    if (sendOtpBtn) {
        sendOtpBtn.addEventListener('click', async () => {
            const phone = signupPhone.value.trim();

            // Validate phone number
            if (!isValidPhone(phone)) {
                showError('Please enter a valid 10-digit phone number', 'otpStatus');
                adjustHeight();
                return;
            }

            const originalText = showLoading(sendOtpBtn);

            try {
                // Call real API endpoint
                const response = await api.sendOTP(phone);

                if (response.success) {
                    otpSection.hidden = false;
                    showSuccess(`OTP sent to ${phone}`, 'otpStatus');
                    sendOtpBtn.textContent = 'Resend OTP';
                    otpInput.focus();
                } else {
                    showError(response.message || 'Failed to send OTP', 'otpStatus');
                }
            } catch (error) {
                console.error('Send OTP error:', error);
                showError(error.message || 'Failed to send OTP. Please try again.', 'otpStatus');
            } finally {
                hideLoading(sendOtpBtn, originalText);
                adjustHeight();
            }
        });
    }

    if (verifyOtpBtn) {
        verifyOtpBtn.addEventListener('click', async () => {
            const code = otpInput.value.trim();
            const phone = signupPhone.value.trim();

            if (code.length !== 6) {
                showError('Enter a 6-digit code', 'otpStatus');
                adjustHeight();
                return;
            }

            const originalText = showLoading(verifyOtpBtn);

            try {
                // Call real API endpoint
                const response = await api.verifyOTP(phone, code);

                if (response.success && response.verified) {
                    isOtpVerified = true;
                    showSuccess('OTP Verified ✔', 'otpStatus');
                    otpInput.disabled = true;
                    verifyOtpBtn.disabled = true;
                    verifyOtpBtn.textContent = 'Verified';
                } else {
                    showError(response.message || 'Invalid OTP', 'otpStatus');
                }
            } catch (error) {
                console.error('Verify OTP error:', error);
                showError(error.message || 'Failed to verify OTP. Please try again.', 'otpStatus');
            } finally {
                if (!isOtpVerified) {
                    hideLoading(verifyOtpBtn, originalText);
                }
                adjustHeight();
            }
        });
    }

    /* ---------------------- LOGIN FORM WITH REAL API ---------------------- */
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const email = loginForm.querySelector('input[type="email"]').value.trim();
            const password = loginForm.querySelector('input[type="password"], input#loginPassword').value;

            // Validate inputs
            if (!isValidEmail(email)) {
                alert('Please enter a valid email address');
                return;
            }

            if (password.length < 6) {
                alert('Password must be at least 6 characters');
                return;
            }

            const submitBtn = loginForm.querySelector('button[type="submit"]');
            const originalText = showLoading(submitBtn);
            submitBtn.textContent = 'Logging in...';

            try {
                // Call real API endpoint
                const response = await api.login(email, password);

                if (response.success) {
                    // Successful login - redirect to dashboard
                    window.location.href = '../Main_Dash/mainDash.html';
                } else {
                    alert(response.message || 'Login failed. Please check your credentials.');
                    hideLoading(submitBtn, originalText);
                }
            } catch (error) {
                console.error('Login error:', error);
                alert(error.message || 'Login failed. Please try again.');
                hideLoading(submitBtn, originalText);
            }
        });
    }

    /* ---------------------- SIGNUP FORM WITH REAL API ---------------------- */
    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Validation skipped for testing
            // if (!isOtpVerified) { ... }

            // Get form data
            const fullName = signupForm.querySelector('input[name="fullName"]').value.trim();
            const email = signupForm.querySelector('input[name="email"]').value.trim();
            const phone = signupPhone.value.trim();
            const password = signupForm.querySelector('input[placeholder="Enter strong password"]').value;
            const confirmPassword = signupForm.querySelector('input[placeholder="Re-enter password"]').value;

            // Simple check only
            if (!email || !password) {
                alert('Email and Password are required');
                return;
            }

            const submitBtn = signupForm.querySelector('button[type="submit"]');
            const originalText = showLoading(submitBtn);
            submitBtn.textContent = 'Registering...';

            try {
                // Call real API endpoint
                const response = await api.signup({
                    fullName,
                    email,
                    phone,
                    password,
                    otp: otpInput.value.trim()
                });

                if (response.success) {
                    // Reset form and show success
                    signupForm.reset();
                    isOtpVerified = false;
                    otpSection.hidden = true;
                    otpInput.disabled = false;

                    alert('Registration Successful! Please Login.');
                    switchTab('login');
                } else {
                    alert(response.message || 'Registration failed. Please try again.');
                }
            } catch (error) {
                console.error('Signup error:', error);
                alert(error.message || 'Registration failed. Please try again.');
            } finally {
                hideLoading(submitBtn, originalText);
            }
        });
    }

    // Initial adjustment
    adjustHeight();

    // Check if already logged in
    if (api.isAuthenticated()) {
        window.location.href = '../Main_Dash/mainDash.html';
    }

    // DEV SKIP LOGIN
    const skipBtn = document.getElementById('skipLoginBtn');
    if (skipBtn) {
        skipBtn.addEventListener('click', () => {
            localStorage.setItem('phisheye_auth_token', 'dev_bypass_token');
            localStorage.setItem('phisheye_user', JSON.stringify({ username: 'DevUser', email: 'dev@test.com' }));
            window.location.href = '../Main_Dash/mainDash.html';
        });
    }
});
