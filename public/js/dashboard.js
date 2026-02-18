// ===== Dashboard Page =====
const DashboardPage = {
    charts: {},

    render() {
        return `
      <div class="fade-in">
        <!-- Life Score -->
        <div class="section">
          <div class="life-score-card">
            <h3 style="font-size:1.1rem; margin-bottom:1rem; position:relative; z-index:1">
              <i class="fas fa-atom" style="color:var(--accent-purple)"></i> Life Score
            </h3>
            <div class="life-score-gauge">
              <svg viewBox="0 0 36 36">
                <path class="gauge-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"/>
                <path class="gauge-fill" id="gauge-fill" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" stroke-dasharray="0, 100"/>
              </svg>
              <div class="life-score-number">
                <span class="number" id="ls-total">--</span>
                <span class="label">من 100</span>
              </div>
            </div>
            <div class="score-breakdown" id="score-breakdown">
              <div class="score-item">
                <div class="score-item-value" style="color:var(--accent-green)" id="ls-finance">--</div>
                <div class="score-item-label">المالية</div>
                <div class="score-bar"><div class="score-bar-fill" id="ls-finance-bar" style="width:0;background:var(--accent-green)"></div></div>
              </div>
              <div class="score-item">
                <div class="score-item-value" style="color:var(--accent-blue)" id="ls-tasks">--</div>
                <div class="score-item-label">المهام</div>
                <div class="score-bar"><div class="score-bar-fill" id="ls-tasks-bar" style="width:0;background:var(--accent-blue)"></div></div>
              </div>
              <div class="score-item">
                <div class="score-item-value" style="color:var(--accent-pink)" id="ls-health">--</div>
                <div class="score-item-label">الصحة</div>
                <div class="score-bar"><div class="score-bar-fill" id="ls-health-bar" style="width:0;background:var(--accent-pink)"></div></div>
              </div>
              <div class="score-item">
                <div class="score-item-value" style="color:var(--accent-orange)" id="ls-goals">--</div>
                <div class="score-item-label">الأهداف</div>
                <div class="score-bar"><div class="score-bar-fill" id="ls-goals-bar" style="width:0;background:var(--accent-orange)"></div></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Summary Cards -->
        <div class="section">
          <div class="grid-4">
            <div class="stat-card fade-in stagger-1">
              <div class="stat-card-header">
                <div class="stat-card-icon" style="background:rgba(16,185,129,0.12);color:var(--accent-green)">
                  <i class="fas fa-wallet"></i>
                </div>
              </div>
              <div class="stat-card-value" id="dash-savings">$0</div>
              <div class="stat-card-label">صافي التوفير هذا الشهر</div>
            </div>
            <div class="stat-card fade-in stagger-2">
              <div class="stat-card-header">
                <div class="stat-card-icon" style="background:rgba(59,130,246,0.12);color:var(--accent-blue)">
                  <i class="fas fa-check-circle"></i>
                </div>
              </div>
              <div class="stat-card-value" id="dash-tasks">0%</div>
              <div class="stat-card-label">معدل إنجاز المهام</div>
            </div>
            <div class="stat-card fade-in stagger-3">
              <div class="stat-card-header">
                <div class="stat-card-icon" style="background:rgba(236,72,153,0.12);color:var(--accent-pink)">
                  <i class="fas fa-heart"></i>
                </div>
              </div>
              <div class="stat-card-value" id="dash-mood">--</div>
              <div class="stat-card-label">متوسط المزاج (7 أيام)</div>
            </div>
            <div class="stat-card fade-in stagger-4">
              <div class="stat-card-header">
                <div class="stat-card-icon" style="background:rgba(245,158,11,0.12);color:var(--accent-orange)">
                  <i class="fas fa-bullseye"></i>
                </div>
              </div>
              <div class="stat-card-value" id="dash-goals">0</div>
              <div class="stat-card-label">أهداف نشطة</div>
            </div>
          </div>
        </div>

        <!-- Charts -->
        <div class="section">
          <div class="grid-2">
            <div class="chart-card fade-in">
              <div class="chart-card-title">💰 الدخل مقابل المصاريف</div>
              <div class="chart-container"><canvas id="finance-chart"></canvas></div>
            </div>
            <div class="chart-card fade-in">
              <div class="chart-card-title">📊 المزاج والطاقة</div>
              <div class="chart-container"><canvas id="health-chart"></canvas></div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">⚡ إجراءات سريعة</h3>
          </div>
          <div class="quick-action-row">
            <button class="btn btn-secondary" onclick="App.navigate('finance'); setTimeout(()=>FinancePage.openAddModal(),100)">
              <i class="fas fa-plus"></i> إضافة معاملة
            </button>
            <button class="btn btn-secondary" onclick="App.navigate('tasks'); setTimeout(()=>TasksPage.openAddModal(),100)">
              <i class="fas fa-plus"></i> مهمة جديدة
            </button>
            <button class="btn btn-secondary" onclick="App.navigate('health'); setTimeout(()=>HealthPage.openLogModal(),100)">
              <i class="fas fa-plus"></i> تسجيل صحي
            </button>
            <button class="btn btn-secondary" onclick="App.navigate('goals'); setTimeout(()=>GoalsPage.openAddModal(),100)">
              <i class="fas fa-plus"></i> هدف جديد
            </button>
            <button class="btn btn-primary" onclick="DashboardPage.generateInsights()">
              <i class="fas fa-brain"></i> توليد رؤى ذكية
            </button>
          </div>
        </div>
      </div>
    `;
    },

    async load() {
        try {
            const [summary, lifeScore] = await Promise.all([
                API.getDashboardSummary(),
                API.getLifeScore()
            ]);

            // Update summary cards
            const savingsEl = document.getElementById('dash-savings');
            if (savingsEl) {
                const s = summary.finance.savings;
                savingsEl.textContent = `$${Math.abs(s).toFixed(0)}`;
                savingsEl.style.color = s >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
            }
            const tasksEl = document.getElementById('dash-tasks');
            if (tasksEl) tasksEl.textContent = `${summary.tasks.completionRate}%`;
            const moodEl = document.getElementById('dash-mood');
            if (moodEl) moodEl.textContent = summary.health.avgMood > 0 ? `${summary.health.avgMood}/10` : '--';
            const goalsEl = document.getElementById('dash-goals');
            if (goalsEl) goalsEl.textContent = summary.goals.active;

            // Update Life Score
            this.updateLifeScore(lifeScore);
            App.updateMiniScore(lifeScore.total);

            // Update insights badge
            if (summary.unreadInsights > 0) {
                const badge = document.getElementById('insights-badge');
                if (badge) { badge.textContent = summary.unreadInsights; badge.style.display = 'inline'; }
            }

            // Render charts
            this.renderFinanceChart(summary.finance);
            await this.renderHealthChart();
        } catch (err) {
            console.error('Dashboard load error:', err);
        }
    },

    updateLifeScore(score) {
        const totalEl = document.getElementById('ls-total');
        const gaugeEl = document.getElementById('gauge-fill');
        if (totalEl) totalEl.textContent = score.total;
        if (gaugeEl) gaugeEl.setAttribute('stroke-dasharray', `${score.total}, 100`);
        const b = score.breakdown;
        const ids = { finance: 'ls-finance', tasks: 'ls-tasks', health: 'ls-health', goals: 'ls-goals' };
        Object.keys(ids).forEach(key => {
            const el = document.getElementById(ids[key]);
            const bar = document.getElementById(`${ids[key]}-bar`);
            if (el) el.textContent = b[key].score;
            if (bar) bar.style.width = `${b[key].score}%`;
        });
    },

    renderFinanceChart(finance) {
        const ctx = document.getElementById('finance-chart');
        if (!ctx) return;
        if (this.charts.finance) this.charts.finance.destroy();
        this.charts.finance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['الدخل', 'المصاريف', 'التوفير'],
                datasets: [{
                    data: [finance.income, finance.expenses, Math.max(0, finance.savings)],
                    backgroundColor: ['rgba(16, 185, 129, 0.8)', 'rgba(239, 68, 68, 0.8)', 'rgba(139, 92, 246, 0.8)'],
                    borderWidth: 0, borderRadius: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'IBM Plex Sans Arabic' }, padding: 15 } }
                }, cutout: '65%'
            }
        });
    },

    async renderHealthChart() {
        try {
            const logs = await API.getHealthLogs('?limit=7');
            const ctx = document.getElementById('health-chart');
            if (!ctx || !logs.length) return;
            if (this.charts.health) this.charts.health.destroy();
            const sorted = logs.reverse();
            this.charts.health = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: sorted.map(l => new Date(l.date).toLocaleDateString('ar-EG', { weekday: 'short' })),
                    datasets: [
                        { label: 'المزاج', data: sorted.map(l => l.mood), borderColor: '#ec4899', backgroundColor: 'rgba(236,72,153,0.1)', tension: 0.4, fill: true },
                        { label: 'الطاقة', data: sorted.map(l => l.energy), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', tension: 0.4, fill: true }
                    ]
                },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    scales: {
                        y: { min: 0, max: 10, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b' } },
                        x: { grid: { display: false }, ticks: { color: '#64748b' } }
                    },
                    plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'IBM Plex Sans Arabic' } } } }
                }
            });
        } catch (err) { console.error('Health chart error:', err); }
    },

    async generateInsights() {
        try {
            App.showToast('جاري توليد الرؤى الذكية...', 'info');
            const result = await API.generateInsights();
            App.showToast(`تم توليد ${result.generated} رؤية ذكية!`, 'success');
            // Update badge
            const badge = document.getElementById('insights-badge');
            if (badge && result.generated > 0) {
                badge.textContent = parseInt(badge.textContent || 0) + result.generated;
                badge.style.display = 'inline';
            }
        } catch (err) { App.showToast('خطأ في توليد الرؤى', 'error'); }
    }
};
