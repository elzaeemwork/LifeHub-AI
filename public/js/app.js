// ===== Main App Controller =====
const App = {
    currentPage: 'dashboard',
    session: null,

    pages: {
        dashboard: { title: 'لوحة التحكم', subtitle: 'نظرة شاملة على حياتك', module: DashboardPage },
        finance: { title: 'إدارة المالية', subtitle: 'تتبع دخلك ومصاريفك وميزانياتك', module: FinancePage },
        tasks: { title: 'إدارة المهام', subtitle: 'نظم مهامك واعمل بذكاء', module: TasksPage },
        health: { title: 'الصحة والطاقة', subtitle: 'راقب صحتك الجسدية والنفسية', module: HealthPage },
        goals: { title: 'الأهداف', subtitle: 'حدد أهدافك وتابع تقدمك', module: GoalsPage },
        'ai-insights': { title: 'رؤى ذكية', subtitle: 'تحليلات مدعومة بالذكاء الاصطناعي', module: AIInsightsPage }
    },

    init() {
        // Check saved session
        const saved = localStorage.getItem('lifehub_session');
        if (saved) {
            try {
                this.session = JSON.parse(saved);
                API.setToken(this.session.access_token);
                this.showApp();
            } catch (e) { localStorage.removeItem('lifehub_session'); }
        }
        this.setupAuthListeners();
        this.setupNavListeners();
        this.updateDate();
    },

    setupAuthListeners() {
        // Auth tabs
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const isLogin = tab.dataset.tab === 'login';
                document.getElementById('login-form').style.display = isLogin ? 'flex' : 'none';
                document.getElementById('signup-form').style.display = isLogin ? 'none' : 'flex';
            });
        });

        // Login
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const errEl = document.getElementById('login-error');
            errEl.textContent = '';
            try {
                const result = await API.login(
                    document.getElementById('login-email').value,
                    document.getElementById('login-password').value
                );
                this.session = result.session;
                API.setToken(result.session.access_token);
                localStorage.setItem('lifehub_session', JSON.stringify(result.session));
                this.showApp();
            } catch (err) { errEl.textContent = err.message; }
        });

        // Signup
        document.getElementById('signup-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const errEl = document.getElementById('signup-error');
            const successEl = document.getElementById('signup-success');
            errEl.textContent = '';
            successEl.textContent = '';
            try {
                const result = await API.signup(
                    document.getElementById('signup-email').value,
                    document.getElementById('signup-password').value,
                    document.getElementById('signup-name').value
                );
                if (result.session) {
                    this.session = result.session;
                    API.setToken(result.session.access_token);
                    localStorage.setItem('lifehub_session', JSON.stringify(result.session));
                    this.showApp();
                } else {
                    successEl.textContent = 'تم إنشاء الحساب! تحقق من بريدك الإلكتروني للتأكيد.';
                }
            } catch (err) { errEl.textContent = err.message; }
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            localStorage.removeItem('lifehub_session');
            this.session = null;
            API.setToken(null);
            document.getElementById('auth-screen').style.display = 'flex';
            document.getElementById('app').style.display = 'none';
        });
    },

    setupNavListeners() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigate(item.dataset.page);
            });
        });

        // Sidebar toggle (mobile)
        document.getElementById('sidebar-toggle').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('open');
        });

        // Close sidebar on content click (mobile)
        document.querySelector('.main-content').addEventListener('click', () => {
            document.querySelector('.sidebar').classList.remove('open');
        });
    },

    async showApp() {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('app').style.display = 'flex';
        // Load user info
        try {
            const { user, profile } = await API.getUser();
            const name = profile?.full_name || user?.email?.split('@')[0] || 'المستخدم';
            document.getElementById('sidebar-username').textContent = name;
            document.getElementById('sidebar-email').textContent = user?.email || '';
        } catch (err) { console.error(err); }
        this.navigate('dashboard');
    },

    navigate(page) {
        if (!this.pages[page]) return;
        this.currentPage = page;

        // Update active nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Update page title
        document.getElementById('page-title').textContent = this.pages[page].title;
        document.getElementById('page-subtitle').textContent = this.pages[page].subtitle;

        // Render page
        const content = document.getElementById('content-area');
        content.innerHTML = this.pages[page].module.render();

        // Load data
        this.pages[page].module.load();

        // Close mobile sidebar
        document.querySelector('.sidebar').classList.remove('open');
    },

    updateDate() {
        const now = new Date();
        const dateStr = now.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const el = document.getElementById('topbar-date');
        if (el) el.textContent = dateStr;
    },

    updateMiniScore(score) {
        const el = document.getElementById('mini-score');
        const ring = document.getElementById('score-ring-fill');
        if (el) el.textContent = score;
        if (ring) ring.setAttribute('stroke-dasharray', `${score}, 100`);
    },

    // Modal
    showModal(title, content) {
        const overlay = document.getElementById('modal-overlay');
        const modal = document.getElementById('modal-content');
        modal.innerHTML = `<div class="modal-header"><h3 class="modal-title">${title}</h3><button class="btn-icon" onclick="App.closeModal()"><i class="fas fa-times"></i></button></div>${content}`;
        overlay.style.display = 'flex';
        overlay.addEventListener('click', (e) => { if (e.target === overlay) this.closeModal(); });
    },

    closeModal() {
        document.getElementById('modal-overlay').style.display = 'none';
    },

    // Toast
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => App.init());
