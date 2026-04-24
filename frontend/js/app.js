const appDom = {
    formTodo: document.getElementById('formTodo'),
    todoInput: document.getElementById('todoInput'),
    todoDueDate: document.getElementById('todoDueDate'),
    pendingList: document.getElementById('pendingList'),
    completedList: document.getElementById('completedList'),
    btnLogout: document.getElementById('btnLogout'),
    btnSetupMfaApp: document.getElementById('btnSetupMfaApp'),
    themeToggle: document.getElementById('themeToggle')
};

let todos = [];

window.loadTodos = async () => {
    try {
        todos = await api.todos.getAll();
        updateUI();
        
        const username = localStorage.getItem('username');
        if (username) {
            const userGreeting = document.getElementById('userGreeting');
            if(userGreeting) userGreeting.textContent = `Hello, ${username}`;
            
            const profileName = document.getElementById('profileName');
            if(profileName) profileName.textContent = username;
        }
        
        document.body.classList.add('app-active');
    } catch (err) {
        if (err.message.toLowerCase().includes('authorized') || err.message.toLowerCase().includes('token')) {
            logout(); 
        } else {
            console.error(err);
        }
    }
};

const updateUI = () => {
    if (typeof renderTodos === 'function') {
        renderTodos(todos, appDom.pendingList, appDom.completedList, toggleTodo, deleteTodo, editTodo);
    }
    updateProfileStats();
};

appDom.formTodo.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = appDom.todoInput.value.trim();
    const dueDate = appDom.todoDueDate.value;
    if (!title) return;

    try {
        const newTodo = await api.todos.create(title, dueDate);
        todos.push(newTodo);
        appDom.todoInput.value = '';
        appDom.todoDueDate.value = '';
        updateUI();
    } catch (err) {
        alert(err.message);
    }
});

const toggleTodo = async (id, completed) => {
    try {
        await api.todos.update(id, completed);
        const todo = todos.find(t => t.id === id);
        if (todo) todo.completed = completed;
        updateUI();
    } catch (err) {
        alert(err.message);
        updateUI(); 
    }
};

const editTodo = async (id, newTitle, newDueDate) => {
    try {
        await api.todos.update(id, undefined, newTitle, newDueDate);
        const todo = todos.find(t => t.id === id);
        if (todo) {
            todo.title = newTitle;
            todo.dueDate = newDueDate;
        }
        updateUI();
    } catch (err) {
        alert(err.message);
    }
};

const deleteTodo = async (id) => {
    try {
        await api.todos.delete(id);
        todos = todos.filter(t => t.id !== id);
        updateUI();
    } catch (err) {
        alert(err.message);
    }
};

const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    document.body.classList.remove('app-active');
    document.getElementById('appContainer').classList.add('hidden');
    document.getElementById('authContainer').classList.remove('hidden');
    if (typeof hideAllAuthForms === 'function') hideAllAuthForms();
    document.getElementById('formLogin').reset();
    document.getElementById('loginForm').classList.remove('hidden');
};

if(appDom.btnLogout) appDom.btnLogout.addEventListener('click', logout);

if(appDom.btnSetupMfaApp) appDom.btnSetupMfaApp.addEventListener('click', async () => {
    try {
        const statusRes = await api.auth.checkMfaStatus();
        if (statusRes.mfaEnabled) {
            return alert('MFA is already enabled on your account.');
        }

        const mfaRes = await api.auth.setupMfa();
        document.getElementById('qrCodeContainer').innerHTML = `<img src="${mfaRes.qrCode}" alt="QR Code">`;
        document.getElementById('mfaSecret').value = mfaRes.secret;
        document.getElementById('mfaSetupCode').value = '';
        
        document.body.classList.remove('app-active');
        document.getElementById('appContainer').classList.add('hidden');
        document.getElementById('authContainer').classList.remove('hidden');
        if (typeof hideAllAuthForms === 'function') hideAllAuthForms();
        
        document.getElementById('mfaSetupForm').classList.remove('hidden');
        
        const token = localStorage.getItem('token');
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        // Expose credentials to auth state running in same window
        if (typeof authState !== 'undefined') {
            authState.userId = payload.id;
            authState.username = localStorage.getItem('username');
        }

    } catch (err) {
        alert(err.message);
    }
});

const initTheme = () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
};

const setTheme = (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    if (theme === 'dark') {
        const moonIcon = document.getElementById('moonIcon');
        const sunIcon = document.getElementById('sunIcon');
        if (moonIcon) moonIcon.classList.add('hidden');
        if (sunIcon) sunIcon.classList.remove('hidden');
    } else {
        const moonIcon = document.getElementById('moonIcon');
        const sunIcon = document.getElementById('sunIcon');
        if (moonIcon) moonIcon.classList.remove('hidden');
        if (sunIcon) sunIcon.classList.add('hidden');
    }
};

if(appDom.themeToggle) appDom.themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
});

initTheme();

// --- Sidebar Navigation Logic ---
document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Update active class on nav
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const targetBtn = e.currentTarget;
        targetBtn.classList.add('active');

        // Hide all views
        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        
        // Show target view
        const targetId = targetBtn.getAttribute('data-target');
        const viewEl = document.getElementById(targetId);
        if (viewEl) {
            viewEl.classList.add('active');
        }

        // Update title
        const viewTitle = document.getElementById('viewTitle');
        if(viewTitle) {
            if (targetId === 'view-todo') viewTitle.textContent = 'Todo List';
            if (targetId === 'view-pro') viewTitle.textContent = 'Upgrade to Pro';
            if (targetId === 'view-profile') viewTitle.textContent = 'Profile Analytics';
        }
    });
});

// --- Analytics Logic ---
const updateProfileStats = () => {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    const statTotal = document.getElementById('statTotal');
    const statCompleted = document.getElementById('statCompleted');
    const statPending = document.getElementById('statPending');
    const statPercentage = document.getElementById('statPercentage');
    const statProgressBar = document.getElementById('statProgressBar');

    if (statTotal) statTotal.textContent = total;
    if (statCompleted) statCompleted.textContent = completed;
    if (statPending) statPending.textContent = pending;
    if (statPercentage) statPercentage.textContent = `${percentage}%`;
    if (statProgressBar) statProgressBar.style.width = `${percentage}%`;
};

// --- Dummy Payment Logic ---
const loadTransactions = () => {
    const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
    const tbody = document.getElementById('transactionList');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    transactions.forEach(t => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${t.id}</td>
            <td>${t.method}</td>
            <td>${new Date(t.date).toLocaleString()}</td>
            <td><span class="badge" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);">Success</span></td>
        `;
        tbody.appendChild(tr);
    });
};

const formPayment = document.getElementById('formPayment');
if (formPayment) {
    formPayment.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const btn = document.getElementById('btnPayNow');
        const spinner = btn.querySelector('.spinner');
        const btnText = btn.querySelector('.btn-text');
        const msgEl = document.getElementById('paymentMessage');
        const selectedMethod = document.querySelector('input[name="paymentMethod"]:checked').value;

        // Simulate network delay
        btn.disabled = true;
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');
        msgEl.className = 'payment-message hidden';

        setTimeout(() => {
            btn.disabled = false;
            btnText.classList.remove('hidden');
            spinner.classList.add('hidden');

            // Save transaction
            const transactions = JSON.parse(localStorage.getItem('transactions') || '[]');
            transactions.unshift({
                id: Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
                method: selectedMethod,
                date: new Date().toISOString()
            });
            localStorage.setItem('transactions', JSON.stringify(transactions));

            // Show success msg
            msgEl.textContent = 'Payment successful! Welcome to Pro.';
            msgEl.className = 'payment-message success';
            
            loadTransactions();
            
            setTimeout(() => {
                msgEl.classList.add('hidden');
            }, 3000);

        }, 1500);
    });
}

// Initial load for transactions
loadTransactions();
