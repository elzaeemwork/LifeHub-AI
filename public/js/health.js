// ===== Health Page =====
const HealthPage = {
    charts: {},
    render() {
        return `
      <div class="fade-in">
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">📊 إحصائيات الأسبوع</h3>
            <button class="btn btn-primary btn-small" onclick="HealthPage.openLogModal()"><i class="fas fa-plus"></i> تسجيل اليوم</button>
          </div>
          <div class="grid-4" id="health-stats-grid">
            <div class="health-metric"><div class="health-metric-icon">😴</div><div class="health-metric-value" id="hs-sleep">--</div><div class="health-metric-label">متوسط النوم <span class="health-metric-unit">ساعة</span></div></div>
            <div class="health-metric"><div class="health-metric-icon">😊</div><div class="health-metric-value" id="hs-mood">--</div><div class="health-metric-label">متوسط المزاج <span class="health-metric-unit">/10</span></div></div>
            <div class="health-metric"><div class="health-metric-icon">⚡</div><div class="health-metric-value" id="hs-energy">--</div><div class="health-metric-label">متوسط الطاقة <span class="health-metric-unit">/10</span></div></div>
            <div class="health-metric"><div class="health-metric-icon">🏃</div><div class="health-metric-value" id="hs-exercise">--</div><div class="health-metric-label">متوسط التمارين <span class="health-metric-unit">دقيقة</span></div></div>
          </div>
        </div>
        <div class="section">
          <div class="grid-2">
            <div class="chart-card"><div class="chart-card-title">📈 النوم والتمارين</div><div class="chart-container"><canvas id="sleep-chart"></canvas></div></div>
            <div class="chart-card"><div class="chart-card-title">😊 المزاج والطاقة</div><div class="chart-container"><canvas id="mood-chart"></canvas></div></div>
          </div>
        </div>
        <div class="section">
          <div class="section-header"><h3 class="section-title">📜 السجل الصحي</h3></div>
          <div id="health-logs-list"></div>
        </div>
      </div>`;
    },

    async load() {
        try {
            const [stats, logs] = await Promise.all([API.getHealthStats(), API.getHealthLogs('?limit=14')]);
            document.getElementById('hs-sleep').textContent = stats.week.avgSleep || '--';
            document.getElementById('hs-mood').textContent = stats.week.avgMood || '--';
            document.getElementById('hs-energy').textContent = stats.week.avgEnergy || '--';
            document.getElementById('hs-exercise').textContent = stats.week.avgExercise || '--';
            this.renderLogs(logs);
            this.renderCharts(logs);
        } catch (err) { console.error(err); }
    },

    renderLogs(logs) {
        const el = document.getElementById('health-logs-list');
        if (!el) return;
        if (!logs.length) { el.innerHTML = '<div class="empty-state"><i class="fas fa-heart"></i><h3>لا توجد سجلات</h3><p>سجّل بياناتك الصحية اليومية</p></div>'; return; }
        el.innerHTML = '<div class="glass-card" style="overflow:hidden"><table class="data-table"><thead><tr><th>التاريخ</th><th>النوم</th><th>المزاج</th><th>الطاقة</th><th>التمارين</th><th>الماء</th><th></th></tr></thead><tbody>' +
            logs.map(l => `<tr>
        <td>${new Date(l.date).toLocaleDateString('ar-EG')}</td>
        <td>${l.sleep_hours ? l.sleep_hours + ' س' : '--'}</td>
        <td>${l.mood ? l.mood + '/10' : '--'}</td>
        <td>${l.energy ? l.energy + '/10' : '--'}</td>
        <td>${l.exercise_minutes ? l.exercise_minutes + ' د' : '--'}</td>
        <td>${l.water_ml ? l.water_ml + ' مل' : '--'}</td>
        <td><button class="btn-icon" onclick="HealthPage.deleteLog('${l.id}')"><i class="fas fa-trash" style="font-size:0.75rem;color:var(--accent-red)"></i></button></td>
      </tr>`).join('') + '</tbody></table></div>';
    },

    renderCharts(logs) {
        if (!logs.length) return;
        const sorted = [...logs].reverse();
        const labels = sorted.map(l => new Date(l.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' }));
        // Sleep chart
        const sleepCtx = document.getElementById('sleep-chart');
        if (sleepCtx) {
            if (this.charts.sleep) this.charts.sleep.destroy();
            this.charts.sleep = new Chart(sleepCtx, {
                type: 'bar', data: {
                    labels,
                    datasets: [
                        { label: 'النوم (ساعة)', data: sorted.map(l => l.sleep_hours), backgroundColor: 'rgba(139,92,246,0.6)', borderRadius: 4 },
                        { label: 'التمارين (دقيقة)', data: sorted.map(l => l.exercise_minutes), backgroundColor: 'rgba(6,182,212,0.6)', borderRadius: 4 }
                    ]
                }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b' } }, x: { grid: { display: false }, ticks: { color: '#64748b' } } }, plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'IBM Plex Sans Arabic' } } } } }
            });
        }
        // Mood chart
        const moodCtx = document.getElementById('mood-chart');
        if (moodCtx) {
            if (this.charts.mood) this.charts.mood.destroy();
            this.charts.mood = new Chart(moodCtx, {
                type: 'line', data: {
                    labels,
                    datasets: [
                        { label: 'المزاج', data: sorted.map(l => l.mood), borderColor: '#ec4899', backgroundColor: 'rgba(236,72,153,0.1)', tension: 0.4, fill: true, pointRadius: 4 },
                        { label: 'الطاقة', data: sorted.map(l => l.energy), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)', tension: 0.4, fill: true, pointRadius: 4 }
                    ]
                }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 10, grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#64748b' } }, x: { grid: { display: false }, ticks: { color: '#64748b' } } }, plugins: { legend: { labels: { color: '#94a3b8', font: { family: 'IBM Plex Sans Arabic' } } } } }
            });
        }
    },

    openLogModal() {
        App.showModal('تسجيل صحي يومي', `
      <div class="form-group"><label class="form-label">التاريخ</label><input type="date" class="form-input" id="h-date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">ساعات النوم</label><input type="number" class="form-input" id="h-sleep" placeholder="7" step="0.5" min="0" max="24"></div>
        <div class="form-group"><label class="form-label">الماء (مل)</label><input type="number" class="form-input" id="h-water" placeholder="2000" step="100"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">التمارين (دقيقة)</label><input type="number" class="form-input" id="h-exercise" placeholder="30"></div>
        <div class="form-group"><label class="form-label">الخطوات</label><input type="number" class="form-input" id="h-steps" placeholder="5000"></div>
      </div>
      <div class="form-group"><label class="form-label">المزاج (1-10)</label>
        <div class="range-group"><input type="range" class="range-input" id="h-mood" min="1" max="10" value="5" oninput="document.getElementById('h-mood-v').textContent=this.value"><span class="range-value" id="h-mood-v">5</span></div>
      </div>
      <div class="form-group"><label class="form-label">الطاقة (1-10)</label>
        <div class="range-group"><input type="range" class="range-input" id="h-energy" min="1" max="10" value="5" oninput="document.getElementById('h-energy-v').textContent=this.value"><span class="range-value" id="h-energy-v">5</span></div>
      </div>
      <div class="form-group"><label class="form-label">ملاحظات</label><textarea class="form-textarea" id="h-notes" placeholder="ملاحظات اختيارية"></textarea></div>
      <div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" onclick="HealthPage.saveLog()">حفظ</button></div>`);
    },

    async saveLog() {
        try {
            await API.logHealth({
                date: document.getElementById('h-date').value,
                sleep_hours: parseFloat(document.getElementById('h-sleep').value) || null,
                water_ml: parseInt(document.getElementById('h-water').value) || null,
                exercise_minutes: parseInt(document.getElementById('h-exercise').value) || null,
                steps: parseInt(document.getElementById('h-steps').value) || null,
                mood: parseInt(document.getElementById('h-mood').value),
                energy: parseInt(document.getElementById('h-energy').value),
                notes: document.getElementById('h-notes').value || null
            });
            App.closeModal(); App.showToast('تم التسجيل بنجاح', 'success'); this.load();
        } catch (err) { App.showToast(err.message, 'error'); }
    },

    async deleteLog(id) {
        try { await API.deleteHealthLog(id); App.showToast('تم الحذف', 'success'); this.load(); }
        catch (err) { App.showToast(err.message, 'error'); }
    }
};
