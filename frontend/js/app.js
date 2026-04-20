const appDom = {
    formTodo: document.getElementById('formTodo'),
    todoInput: document.getElementById('todoInput'),
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
        renderTodos(todos, appDom.pendingList, appDom.completedList, toggleTodo, deleteTodo);
    }
};

appDom.formTodo.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = appDom.todoInput.value.trim();
    if (!title) return;

    try {
        const newTodo = await api.todos.create(title);
        todos.push(newTodo);
        appDom.todoInput.value = '';
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
    document.getElementById('appContainer').classList.add('hidden');
    document.getElementById('authContainer').classList.remove('hidden');
    if (typeof hideAllAuthForms === 'function') hideAllAuthForms();
    document.getElementById('formLogin').reset();
    document.getElementById('loginForm').classList.remove('hidden');
};

appDom.btnLogout.addEventListener('click', logout);

appDom.btnSetupMfaApp.addEventListener('click', async () => {
    try {
        const mfaRes = await api.auth.setupMfa();
        document.getElementById('qrCodeContainer').innerHTML = `<img src="${mfaRes.qrCode}" alt="QR Code">`;
        document.getElementById('mfaSecret').value = mfaRes.secret;
        document.getElementById('mfaSetupCode').value = '';
        
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
        document.getElementById('moonIcon').classList.add('hidden');
        document.getElementById('sunIcon').classList.remove('hidden');
    } else {
        document.getElementById('moonIcon').classList.remove('hidden');
        document.getElementById('sunIcon').classList.add('hidden');
    }
};

appDom.themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
});

initTheme();
