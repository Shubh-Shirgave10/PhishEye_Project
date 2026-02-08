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

        const indicator = document.querySelector('.tab-indicator');

        if (target === 'signup') {
            indicator.style.transform = 'translateX(100%)';
            formsContainer.style.transform = 'translateX(-33.333%)';
        } else if (target === 'login') {
            indicator.style.transform = 'translateX(0)';
            formsContainer.style.transform = 'translateX(0)';
        } else if (target === 'forgotPassword') {
            // For forgot password, we don't move the tab indicator but slide the container
            formsContainer.style.transform = 'translateX(-66.666%)';
        }

        authForms.forEach(form => {
            if (form.id === target + 'Form') {
                form.classList.add('active');
            } else {
                form.classList.remove('active');
            }
        });

        setTimeout(adjustHeight, 300); // Wait for slide transition
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

    /* ---------------------- SOCIAL LOGIN ---------------------- */
    const socialBtns = document.querySelectorAll('.social-btn');
    socialBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const provider = btn.classList.contains('google-btn') ? 'Google' : 'Facebook';
            const email = `social_${provider.toLowerCase()}@example.com`; // In a real app, this comes from the social provider's SDK
            const fullName = `Social ${provider} User`;

            try {
                const res = await api.socialLogin(email, fullName, provider);
                if (res.success) {
                    window.location.href = '../Main_Dash/mainDash.html';
                } else {
                    alert(res.message || 'Social login failed');
                }
            } catch (err) {
                console.error('Social login error:', err);
                alert('Social login failed. Please try again.');
            }
        });
    });

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

    /* ---------------------- SIGNUP FLOW (OTP) ---------------------- */
    const sendSignupOtpBtn = document.getElementById('sendSignupOtpBtn');
    const verifySignupOtpBtn = document.getElementById('verifySignupOtpBtn');
    const signupOtpSection = document.getElementById('signupOtpSection');
    const signupStep1 = document.getElementById('signupStep1');
    const signupStep2 = document.getElementById('signupStep2');
    const signupEmailInput = signupForm.querySelector('input[name="email"]');

    sendSignupOtpBtn.addEventListener('click', async () => {
        const email = signupEmailInput.value.trim();
        if (!isValidEmail(email)) {
            alert('Please enter a valid business email');
            return;
        }

        const originalText = showLoading(sendSignupOtpBtn);
        try {
            const res = await api.sendOTP(email, 'signup');
            if (res.success) {
                signupOtpSection.classList.remove('hidden');
                sendSignupOtpBtn.textContent = 'Resend OTP';
                
                // If OTP is in response (development mode), show it to user
                if (res.otp) {
                    alert(`OTP sent! Your verification code is: ${res.otp}\n\n(This is shown because email is not configured. In production, check your email.)`);
                } else {
                    alert('OTP sent to your email! Please check your inbox.');
                }
            } else {
                alert(res.message || 'Failed to send OTP');
            }
        } catch (err) {
            console.error('OTP send error:', err);
            alert('Error sending OTP: ' + (err.message || 'Please try again'));
        } finally {
            hideLoading(sendSignupOtpBtn, originalText);
        }
    });

    verifySignupOtpBtn.addEventListener('click', async () => {
        const email = signupEmailInput.value.trim();
        const otp = document.getElementById('signupOtp').value.trim();

        if (otp.length !== 6) {
            alert('Enter a valid 6-digit OTP');
            return;
        }

        const originalText = showLoading(verifySignupOtpBtn);
        try {
            const res = await api.verifyOTP(email, otp, 'signup');
            if (res.success) {
                signupStep1.classList.add('hidden');
                signupStep2.classList.remove('hidden');
                adjustHeight();
                alert('Email verified successfully!');
            } else {
                alert(res.message || 'Invalid OTP');
            }
        } catch (err) {
            alert('Verification error');
        } finally {
            hideLoading(verifySignupOtpBtn, originalText);
        }
    });

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fullName = signupForm.querySelector('input[name="fullName"]').value.trim();
            const email = signupEmailInput.value.trim();
            const password = document.getElementById('signupPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (password !== confirmPassword) {
                alert('Passwords do not match');
                return;
            }

            const submitBtn = signupForm.querySelector('button[type="submit"]');
            const originalText = showLoading(submitBtn);

            try {
                const res = await api.signup({ fullName, email, password });
                if (res.success) {
                    alert('Account created! Please login.');
                    location.reload(); // Quick reset
                } else {
                    alert(res.message);
                }
            } catch (err) {
                alert('Signup failed');
            } finally {
                hideLoading(submitBtn, originalText);
            }
        });
    }

    /* ---------------------- FORGOT PASSWORD ---------------------- */
    const forgotForm = document.getElementById('forgotPasswordForm');
    const sendResetOtpBtn = document.getElementById('sendResetOtpBtn');
    const verifyAndResetBtn = document.getElementById('verifyAndResetBtn');
    const resetOtpSection = document.getElementById('resetOtpSection');

    sendResetOtpBtn.addEventListener('click', async () => {
        const email = document.getElementById('resetEmail').value.trim();
        if (!isValidEmail(email)) {
            alert('Enter your registered email');
            return;
        }

        const originalText = showLoading(sendResetOtpBtn);
        try {
            const res = await api.sendOTP(email, 'reset_password');
            if (res.success) {
                resetOtpSection.classList.remove('hidden');
                sendResetOtpBtn.classList.add('hidden');
                verifyAndResetBtn.classList.remove('hidden');
                adjustHeight();
                
                // If OTP is in response (development mode), show it to user
                if (res.otp) {
                    alert(`Reset OTP sent! Your verification code is: ${res.otp}\n\n(This is shown because email is not configured. In production, check your email.)`);
                } else {
                    alert('Reset OTP sent to your email! Please check your inbox.');
                }
            } else {
                alert(res.message);
            }
        } catch (err) {
            console.error('Reset OTP error:', err);
            alert('Error: ' + (err.message || 'Please try again'));
        } finally {
            hideLoading(sendResetOtpBtn, originalText);
        }
    });

    verifyAndResetBtn.addEventListener('click', async () => {
        const email = document.getElementById('resetEmail').value.trim();
        const otp = document.getElementById('resetOtp').value.trim();
        const password = document.getElementById('resetNewPassword').value;

        if (otp.length !== 6 || password.length < 6) {
            alert('Please provide valid OTP and a new password (min 6 chars)');
            return;
        }

        const originalText = showLoading(verifyAndResetBtn);
        try {
            // First verify OTP
            const vRes = await api.verifyOTP(email, otp, 'reset_password');
            if (vRes.success) {
                // Then Reset
                const rRes = await api.resetPassword(email, password);
                if (rRes.success) {
                    alert('Password reset successful! You can now login.');
                    switchTab('login');
                } else {
                    alert(rRes.message);
                }
            } else {
                alert('Invalid OTP');
            }
        } catch (err) {
            alert('Reset failed');
        } finally {
            hideLoading(verifyAndResetBtn, originalText);
        }
    });

    // Initial adjustment
    adjustHeight();

    // Check if already logged in
    if (api.isAuthenticated()) {
        window.location.href = '../Main_Dash/mainDash.html';
    }
});
