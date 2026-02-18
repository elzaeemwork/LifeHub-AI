// ===== AI Insights Page =====
const AIInsightsPage = {
    render() {
        return `
      <div class="fade-in">
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">🧠 الرؤى الذكية</h3>
            <div style="display:flex;gap:0.5rem">
              <button class="btn btn-primary btn-small" onclick="AIInsightsPage.generate()"><i class="fas fa-sync"></i> توليد رؤى جديدة</button>
            </div>
          </div>
          <p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:1.5rem">تحليلات ذكية مبنية على بياناتك لمساعدتك في اتخاذ قرارات أفضل</p>
          <div class="tabs">
            <button class="tab-btn active" onclick="AIInsightsPage.filter('all',this)">الكل</button>
            <button class="tab-btn" onclick="AIInsightsPage.filter('finance',this)">المالية</button>
            <button class="tab-btn" onclick="AIInsightsPage.filter('tasks',this)">المهام</button>
            <button class="tab-btn" onclick="AIInsightsPage.filter('health',this)">الصحة</button>
            <button class="tab-btn" onclick="AIInsightsPage.filter('goals',this)">الأهداف</button>
          </div>
          <div id="insights-list"></div>
        </div>
      </div>`;
    },

    allInsights: [],

    async load() {
        try {
            const insights = await API.getInsights();
            this.allInsights = insights;
            this.renderInsights(insights);
            // Reset badge
            const badge = document.getElementById('insights-badge');
            if (badge) badge.style.display = 'none';
        } catch (err) { console.error(err); }
    },

    filter(module, btn) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        const filtered = module === 'all' ? this.allInsights : this.allInsights.filter(i => i.module === module);
        this.renderInsights(filtered);
    },

    renderInsights(insights) {
        const el = document.getElementById('insights-list');
        if (!el) return;
        if (!insights.length) {
            el.innerHTML = '<div class="empty-state"><i class="fas fa-brain"></i><h3>لا توجد رؤى بعد</h3><p>اضغط "توليد رؤى جديدة" لتحليل بياناتك</p></div>';
            return;
        }
        const moduleLabels = { finance: 'المالية', tasks: 'المهام', health: 'الصحة', goals: 'الأهداف', general: 'عام' };
        const typeColors = { tip: 'var(--accent-blue)', warning: 'var(--accent-orange)', achievement: 'var(--accent-green)', prediction: 'var(--accent-purple)', recommendation: 'var(--accent-cyan)' };
        el.innerHTML = insights.map(i => `
      <div class="insight-card ${!i.is_read ? 'unread' : ''}" onclick="AIInsightsPage.markRead('${i.id}', this)">
        <div class="insight-header">
          <div class="insight-title">${i.title}</div>
          <span class="insight-module" style="background:${typeColors[i.insight_type]}22;color:${typeColors[i.insight_type]}">${moduleLabels[i.module]}</span>
        </div>
        <div class="insight-description">${i.description}</div>
        <div class="insight-time">${this.timeAgo(i.created_at)}</div>
      </div>`).join('');
    },

    async markRead(id, el) {
        try {
            await API.markInsightRead(id);
            if (el) el.classList.remove('unread');
        } catch (err) { console.error(err); }
    },

    async generate() {
        try {
            App.showToast('جاري تحليل بياناتك...', 'info');
            const result = await API.generateInsights();
            App.showToast(`تم توليد ${result.generated} رؤية ذكية!`, 'success');
            this.load();
        } catch (err) { App.showToast('خطأ في توليد الرؤى', 'error'); }
    },

    timeAgo(dateStr) {
        const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
        if (diff < 60) return 'الآن';
        if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
        if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
        return `منذ ${Math.floor(diff / 86400)} يوم`;
    }
};
