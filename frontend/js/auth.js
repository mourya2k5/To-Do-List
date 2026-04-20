const authState = {
    userId: null,
    username: null
};

const dom = {
    authContainer: document.getElementById('authContainer'),
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    mfaSetupForm: document.getElementById('mfaSetupForm'),
    mfaLoginForm: document.getElementById('mfaLoginForm'),
    appContainer: document.getElementById('appContainer'),
    
    // Auth Forms
    formLogin: document.getElementById('formLogin'),
    formRegister: document.getElementById('formRegister'),
    formMfaLogin: document.getElementById('formMfaLogin'),
    
    // Auth Buttons
    showRegister: document.getElementById('showRegister'),
    showLogin: document.getElementById('showLogin'),
    btnVerifyMfaSetup: document.getElementById('btnVerifyMfaSetup'),
    btnSkipMfaSetup: document.getElementById('btnSkipMfaSetup'),
    btnCancelMfaLogin: document.getElementById('btnCancelMfaLogin')
};

const hideAllAuthForms = () => {
    dom.loginForm.classList.add('hidden');
    dom.registerForm.classList.add('hidden');
    dom.mfaSetupForm.classList.add('hidden');
    dom.mfaLoginForm.classList.add('hidden');
};

const showForm = (form) => {
    hideAllAuthForms();
    form.classList.remove('hidden');
};

dom.showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    showForm(dom.registerForm);
});

dom.showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    showForm(dom.loginForm);
});

dom.btnCancelMfaLogin.addEventListener('click', () => {
    showForm(dom.loginForm);
});

const handleAuthSuccess = (token, username) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    dom.authContainer.classList.add('hidden');
    dom.appContainer.classList.remove('hidden');
    document.getElementById('userGreeting').textContent = `Hello, ${username}`;
    if (window.loadTodos) window.loadTodos();
};

dom.formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnLogin');
    const u = document.getElementById('loginUsername').value;
    const p = document.getElementById('loginPassword').value;

    btn.disabled = true;
    try {
        const res = await api.auth.login(u, p);
        if (res.mfaRequired) {
            authState.userId = res.userId;
            showForm(dom.mfaLoginForm);
        } else {
            handleAuthSuccess(res.token, res.username);
            dom.formLogin.reset();
        }
    } catch (err) {
        alert(err.message);
    } finally {
        btn.disabled = false;
    }
});

dom.formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnRegister');
    const u = document.getElementById('registerUsername').value;
    const p = document.getElementById('registerPassword').value;

    btn.disabled = true;
    try {
        const res = await api.auth.register(u, p);
        
        localStorage.setItem('token', res.token);
        authState.userId = res.id;
        authState.username = res.username;
        
        const mfaRes = await api.auth.setupMfa();
        document.getElementById('qrCodeContainer').innerHTML = `<img src="${mfaRes.qrCode}" alt="QR Code">`;
        document.getElementById('mfaSecret').value = mfaRes.secret;
        
        showForm(dom.mfaSetupForm);
        dom.formRegister.reset();
    } catch (err) {
        alert(err.message);
    } finally {
        btn.disabled = false;
    }
});

dom.btnSkipMfaSetup.addEventListener('click', () => {
    handleAuthSuccess(localStorage.getItem('token'), authState.username);
});

dom.btnVerifyMfaSetup.addEventListener('click', async () => {
    const code = document.getElementById('mfaSetupCode').value;
    if (!code) return alert('Enter code');
    
    try {
        const res = await api.auth.verifyMfaSetup(authState.userId, code);
        handleAuthSuccess(res.token, res.username);
    } catch (err) {
        alert(err.message);
    }
});

dom.formMfaLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = document.getElementById('mfaLoginCode').value;
    if (!code) return alert('Enter code');

    try {
        const res = await api.auth.verifyMfa(authState.userId, code);
        handleAuthSuccess(res.token, res.username);
    } catch (err) {
        alert(err.message);
    }
});

window.addEventListener('DOMContentLoaded', () => {
    const token = api._getToken();
    const username = localStorage.getItem('username');
    if (token) {
        dom.authContainer.classList.add('hidden');
        dom.appContainer.classList.remove('hidden');
        document.getElementById('userGreeting').textContent = `Hello, ${username || 'User'}`;
        // Give app.js time to attach loadTodos
        setTimeout(() => {
            if (window.loadTodos) window.loadTodos();
        }, 50);
    }
});
