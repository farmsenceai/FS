    /* ── Role selection step ── */
    let selectedRole = null;
    let pendingRoleAuth = null;

    const roleCard = document.getElementById('role-select-card');
    const twoColEl = document.getElementById('fs-two-col');
    const roleOptions = Array.from(document.querySelectorAll('.fs-role-option'));
    const roleNextBtn = document.getElementById('fs-role-next');

    const leftTitle = document.getElementById('fs-left-title');
    const leftDesc = document.getElementById('fs-left-desc');
    const leftFeatures = document.getElementById('fs-left-features');

    const roleLabels = {
      business: 'Business',
      farmer: 'Farmer',
      admin: 'Administrator'
    };

    const roleIcons = {
      business: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="8" width="18" height="12" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="1.8"/><path d="M3 13h18" stroke="currentColor" stroke-width="1.8"/></svg>',
      farmer: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21c0-6 4-8 4-13a4 4 0 0 0-8 0c0 5 4 7 4 13z" stroke="currentColor" stroke-width="1.8"/></svg>',
      admin: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 3l7 3v5c0 5-3.2 8.5-7 10-3.8-1.5-7-5-7-10V6l7-3z" stroke="currentColor" stroke-width="1.8"/><path d="M9.5 12l2 2 3.5-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    };

    const checkIconSvg = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/><path d="M8 12l2.5 2.5L16 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    const roleContent = {
      business: {
        desc: "Run your poultry business end-to-end \u2014 track farm operations, monitor financials, and forecast profits with FarmSence's business dashboard.",
        features: [
          { icon: checkIconSvg, text: 'Full visibility into every farm, batch and project' },
          { icon: roleIcons.business, text: 'Revenue, FCR and profit forecasting in one place' }
        ]
      },
      farmer: {
        desc: "Keep an eye on your flock from anywhere \u2014 log daily activity and track FCR, ADG, mortality and livability in real time with FarmSence.",
        features: [
          { icon: checkIconSvg, text: 'Simple daily logging built for the field' },
          { icon: roleIcons.farmer, text: 'Live feed conversion and growth tracking' }
        ]
      },
      admin: {
        desc: "Oversee every project and team from a single console \u2014 manage project managers, site visits and access across all farms with FarmSence.",
        features: [
          { icon: checkIconSvg, text: 'Manage teams, assignments and site visits' },
          { icon: roleIcons.admin, text: 'Role-based access across every farm and batch' }
        ]
      }
    };

    document.querySelectorAll('.fs-role-radio').forEach(radio => {
      radio.addEventListener('change', () => {
        const opt = radio.closest('.fs-role-option');
        roleOptions.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedRole = opt.dataset.role;
        roleNextBtn.disabled = false;
      });
    });

    roleNextBtn.addEventListener('click', async () => {
      if (!selectedRole || roleNextBtn.disabled) return;
      roleNextBtn.disabled = true;

      if (pendingRoleAuth) {
        try {
          setMessage('Saving your role...', 'success');
          await saveSelectedRoleAndContinue(pendingRoleAuth);
        } catch (err) {
          setMessage(err.message || 'Could not save role. Please try again.');
          roleNextBtn.disabled = false;
        }
        return;
      }

      const roleLabel = roleLabels[selectedRole];
      const content = roleContent[selectedRole];

      leftTitle.textContent = roleLabel;
      leftDesc.textContent = content.desc;
      leftFeatures.innerHTML = content.features.map(f => `
        <div class="fs-left-feature">
          <span class="fs-left-feature-icon">${f.icon}</span>
          <span>${f.text}</span>
        </div>`).join('');

      // Point 3: swap the email placeholder to match the selected role
      emailInput.placeholder = `Enter ${roleLabel} ID`;

      roleCard.style.display = 'none';
      twoColEl.classList.add('fs-active');
    });

    /* ── Existing sign-in functionality (unchanged) ── */
    const API = `${window.location.origin}/api/auth`;
    const redirectTarget = getSafeRedirectTarget();
    let pendingPhone = '';
    let isRegisterMode = false;

    const emailInput = document.getElementById('si-email');
    const passwordInput = document.getElementById('si-password');
    const continueBtn = document.getElementById('si-continue');
    const messageEl = document.getElementById('si-auth-message');
    const toggleMode = document.getElementById('si-toggle-mode');
    const modeText = document.getElementById('si-mode-text');
    const titleEl = document.querySelector('#sign-in-card .si-title');
    const subEl = document.querySelector('#sign-in-card .si-sub');

    const emailError = document.createElement('div');
    emailError.className = 'fs-error-inline';
    emailInput.after(emailError);

    const phoneContainer = document.createElement('div');
    phoneContainer.id = 'phone-input-container';
    phoneContainer.innerHTML = `
      <input type="text" id="si-phone" class="si-input" placeholder="Phone number">
      <button class="si-btn-primary" id="btn-phone-submit">Send OTP</button>
    `;
    document.getElementById('btn-phone').after(phoneContainer);

    const otpContainer = document.createElement('div');
    otpContainer.id = 'otp-input-container';
    otpContainer.innerHTML = `
      <input type="text" id="si-otp" class="si-input" placeholder="Enter 6-digit OTP">
      <button class="si-btn-primary" id="btn-otp-verify">Verify OTP</button>
    `;
    phoneContainer.after(otpContainer);

    function setMessage(message, type = 'error') {
      messageEl.textContent = message || '';
      messageEl.classList.toggle('success', type === 'success');
    }

    function setLoading(isLoading, label) {
      continueBtn.disabled = isLoading;
      continueBtn.textContent = isLoading ? label : (isRegisterMode ? 'Create account' : 'Sign in');
    }

    function validateEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function validatePassword(password) {
      if (password.length < 8) return 'Password must be at least 8 characters long';
      if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
        return 'Password must include uppercase, lowercase, and number characters';
      }
      return '';
    }

    async function parseResponse(res) {
      let data = {};
      try {
        data = await res.json();
      } catch (err) {
        data = {};
      }

      if (!res.ok) {
        throw new Error(data.msg || 'Server error. Please try again.');
      }

      return data;
    }

    async function requestAuth(path, body) {
      const res = await fetch(`${API}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return parseResponse(res);
    }

    function normalizeRole(role) {
      return role === 'administrator' ? 'admin' : role;
    }

    async function saveRole(token, role) {
      const res = await fetch(`${API}/set-role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: normalizeRole(role) })
      });
      return parseResponse(res);
    }

    async function openDashboardForAuthenticatedUser(token) {
      await window.FarmSenseDashboardRoute.openDashboardForAuthenticatedUser({
        afterOpenUrl: '/index.html',
        openInNewTab: true,
        token
      });
    }

    function getSafeRedirectTarget() {
      const redirect = new URLSearchParams(window.location.search).get('redirect');
      if (!redirect) return '';

      try {
        const target = new URL(redirect, window.location.origin);
        if (target.origin !== window.location.origin) return '';
        return `${target.pathname}${target.search}${target.hash}`;
      } catch (err) {
        return '';
      }
    }

    async function saveSelectedRoleAndContinue(data) {
      const roleData = await saveRole(data.token, selectedRole);
      await handleSignInSuccess(roleData);
    }

    function resetRoleSelectionView() {
      pendingRoleAuth = null;
      selectedRole = null;
      roleOptions.forEach(o => {
        o.classList.remove('selected');
        const radio = o.querySelector('.fs-role-radio');
        if (radio) radio.checked = false;
      });
      roleCard.style.display = '';
      roleCard.classList.remove('fs-fade-out');
      twoColEl.classList.remove('fs-active');
      roleNextBtn.disabled = true;
    }

    function showRoleSelectionForAuthenticatedUser(data) {
      resetRoleSelectionView();
      pendingRoleAuth = data;
      localStorage.setItem('fs_token', data.token);
      localStorage.setItem('fs_user', JSON.stringify(data.user));
      setMessage('Choose your role to continue.', 'success');
    }

    async function handleSignInSuccess(data) {
      if (!data.success || !data.token) {
        throw new Error(data.msg || 'Sign in failed');
      }

      localStorage.setItem('fs_token', data.token);
      if (redirectTarget) {
        window.location.href = redirectTarget;
        return;
      }
      await openDashboardForAuthenticatedUser(data.token);
    }

    window.addEventListener('message', async (event) => {
      // Security check: allow matching origin
      if (event.origin !== window.location.origin && !event.origin.includes('localhost')) return;

      if ((event.data?.type === 'GOOGLE_AUTH_SUCCESS' || event.data?.type === 'MICROSOFT_AUTH_SUCCESS') && event.data.token) {
        try {
          // Fetch user info using the token (more secure than sending via postMessage)
          const res = await fetch(`${API}/me`, {
            headers: { 'Authorization': `Bearer ${event.data.token}` }
          });
          const data = await parseResponse(res);

          const authData = {
            success: true,
            token: event.data.token,
            user: data.user
          };

          await handleSignInSuccess(authData);
        } catch (err) {
          setMessage(err.message || 'Failed to fetch user profile after social login.');
        }
      } else if (event.data?.type === 'GOOGLE_AUTH_ERROR' || event.data?.type === 'MICROSOFT_AUTH_ERROR') {
        setMessage(event.data.msg || 'Social sign-in failed.');
      }
    });

    function updateMode() {
      titleEl.textContent = isRegisterMode ? 'Create your account' : 'Welcome back';
      subEl.textContent = isRegisterMode ? 'Start using FarmSence with your work email' : 'Sign in to your FarmSence account';
      passwordInput.autocomplete = isRegisterMode ? 'new-password' : 'current-password';
      modeText.textContent = isRegisterMode ? 'Already have an account?' : "Don't have an account?";
      toggleMode.textContent = isRegisterMode ? 'Sign in' : 'Sign up';
      continueBtn.textContent = isRegisterMode ? 'Create account' : 'Sign in';
      setMessage('');
    }

    async function handleSubmit() {
      const email = emailInput.value.trim();
      const password = passwordInput.value;

      if (!validateEmail(email)) {
        emailError.textContent = "Please enter a valid email address";
        emailError.style.display = 'block';
        emailInput.focus();
        return;
      }

      emailError.style.display = 'none';

      if (!password) {
        setMessage('Password is required');
        passwordInput.focus();
        return;
      }

      if (isRegisterMode) {
        const passwordError = validatePassword(password);
        if (passwordError) {
          setMessage(passwordError);
          passwordInput.focus();
          return;
        }
      }

      try {
        setMessage('');
        setLoading(true, isRegisterMode ? 'Creating account...' : 'Signing in...');

        const data = isRegisterMode
          ? await requestAuth('/register', { email, password, role: selectedRole })
          : await requestAuth('/login', { email, password, role: selectedRole });
        await handleSignInSuccess(data);
      } catch (err) {
        setMessage(err.message || 'Error connecting to server');
        setLoading(false);
      }
    }

    continueBtn.onclick = handleSubmit;

    [emailInput, passwordInput].forEach(input => {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') handleSubmit();
      });
    });

    toggleMode.onclick = e => {
      e.preventDefault();
      isRegisterMode = !isRegisterMode;
      updateMode();
    };

   document.getElementById('btn-google').onclick = () => {
    if (!selectedRole) {
      setMessage('Please select a role before signing in.');
      return;
    }
    window.open(
        `${API}/google?role=${encodeURIComponent(selectedRole)}`,
        'googleLogin',
        'width=500,height=700'
      );
    };

    document.getElementById('btn-apple').onclick = () => alert("Apple Sign-In coming soon.");

    document.getElementById('btn-microsoft').onclick = () => {
      if (!selectedRole) {
        setMessage('Please select a role before signing in.');
        return;
      }
      window.open(
        `${API}/microsoft?role=${encodeURIComponent(selectedRole)}`,
        'microsoftLogin',
        'width=500,height=700'
      );
    };

    document.getElementById('btn-phone').onclick = () => {
      phoneContainer.style.display = (phoneContainer.style.display === 'flex') ? 'none' : 'flex';
    };

    document.getElementById('btn-phone-submit').onclick = async () => {
      const phone = document.getElementById('si-phone').value.trim();
      if (!phone) return alert('Enter phone number');
      if (!selectedRole) {
        setMessage('Please select a role before signing in.');
        return;
      }
      pendingPhone = phone;
      try {
        const res = await fetch(`${API}/phone/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone })
        });
        const data = await res.json();
        alert(data.message);
        phoneContainer.style.display = 'none';
        otpContainer.style.display = 'flex';
      } catch (err) {
        alert('Error sending OTP');
      }
    };

    document.getElementById('btn-otp-verify').onclick = async () => {
      const otp = document.getElementById('si-otp').value.trim();
      if (!otp) return alert('Enter OTP');
      try {
        const res = await fetch(`${API}/phone/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: pendingPhone, otp, role: selectedRole })
        });
        const data = await parseResponse(res);
        await handleSignInSuccess(data);
      } catch (err) {
        setMessage(err.message || 'Error verifying OTP');
      }
    };

    updateMode();
