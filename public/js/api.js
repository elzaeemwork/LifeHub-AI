// ===== API Client =====
const API = {
    token: null,

    setToken(token) { this.token = token; },

    headers() {
        const h = { 'Content-Type': 'application/json' };
        if (this.token) h['Authorization'] = `Bearer ${this.token}`;
        return h;
    },

    async request(method, url, body = null) {
        const opts = { method, headers: this.headers() };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(url, opts);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Request failed');
        return data;
    },

    // Auth
    login: (email, password) => API.request('POST', '/api/auth/login', { email, password }),
    signup: (email, password, full_name) => API.request('POST', '/api/auth/signup', { email, password, full_name }),
    getUser: () => API.request('GET', '/api/auth/user'),
    updateProfile: (data) => API.request('PUT', '/api/auth/profile', data),

    // Finance
    getTransactions: (params = '') => API.request('GET', `/api/finance/transactions${params}`),
    addTransaction: (data) => API.request('POST', '/api/finance/transactions', data),
    deleteTransaction: (id) => API.request('DELETE', `/api/finance/transactions/${id}`),
    getBudgets: () => API.request('GET', '/api/finance/budgets'),
    saveBudget: (data) => API.request('POST', '/api/finance/budgets', data),
    deleteBudget: (id) => API.request('DELETE', `/api/finance/budgets/${id}`),
    getFinanceSummary: () => API.request('GET', '/api/finance/summary'),

    // Tasks
    getTasks: (params = '') => API.request('GET', `/api/tasks${params}`),
    createTask: (data) => API.request('POST', '/api/tasks', data),
    updateTask: (id, data) => API.request('PUT', `/api/tasks/${id}`, data),
    deleteTask: (id) => API.request('DELETE', `/api/tasks/${id}`),
    getTaskStats: () => API.request('GET', '/api/tasks/stats'),

    // Health
    getHealthLogs: (params = '') => API.request('GET', `/api/health${params}`),
    logHealth: (data) => API.request('POST', '/api/health', data),
    deleteHealthLog: (id) => API.request('DELETE', `/api/health/${id}`),
    getHealthStats: () => API.request('GET', '/api/health/stats'),

    // Goals
    getGoals: (params = '') => API.request('GET', `/api/goals${params}`),
    createGoal: (data) => API.request('POST', '/api/goals', data),
    updateGoal: (id, data) => API.request('PUT', `/api/goals/${id}`, data),
    deleteGoal: (id) => API.request('DELETE', `/api/goals/${id}`),
    addMilestone: (goalId, data) => API.request('POST', `/api/goals/${goalId}/milestones`, data),
    toggleMilestone: (id, completed) => API.request('PUT', `/api/goals/milestones/${id}`, { completed }),
    getGoalStats: () => API.request('GET', '/api/goals/stats'),

    // Dashboard
    getDashboardSummary: () => API.request('GET', '/api/dashboard/summary'),
    getLifeScore: () => API.request('GET', '/api/dashboard/life-score'),

    // AI
    getInsights: (params = '') => API.request('GET', `/api/ai/insights${params}`),
    markInsightRead: (id) => API.request('POST', `/api/ai/insights/${id}/read`),
    generateInsights: () => API.request('POST', '/api/ai/generate'),
};
