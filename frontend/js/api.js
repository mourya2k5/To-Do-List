const API_URL = '/api';

const api = {
    _getToken() {
        return localStorage.getItem('token');
    },

    async _request(endpoint, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        const token = this._getToken();
        if (token && !options.noAuth) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers
        };

        // If local run outside docker, you might need to point to localhost:5000:
        // We will fallback to port 5000 if not on same origin
        const baseUrl = window.location.port !== "5000" && window.location.hostname === "localhost" 
            ? 'http://localhost:5000/api' : API_URL;

        try {
            const response = await fetch(`${baseUrl}${endpoint}`, config);
            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'API Error');
            }

            return data.data;
        } catch (err) {
            throw err;
        }
    },

    auth: {
        register: (username, password) => api._request('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            noAuth: true
        }),
        login: (username, password) => api._request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
            noAuth: true
        }),
        setupMfa: () => api._request('/auth/setup-mfa', { method: 'POST' }),
        checkMfaStatus: () => api._request('/auth/mfa-status'),
        verifyMfa: (userId, token) => api._request('/auth/verify-mfa', {
            method: 'POST',
            body: JSON.stringify({ userId, token }),
            noAuth: true
        })
    },

    todos: {
        getAll: () => api._request('/todos'),
        create: (title) => api._request('/todos', {
            method: 'POST',
            body: JSON.stringify({ title })
        }),
        update: (id, completed) => api._request(`/todos/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ completed })
        }),
        delete: (id) => api._request(`/todos/${id}`, {
            method: 'DELETE'
        })
    }
};
