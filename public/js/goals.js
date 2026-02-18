// ===== Goals Page =====
const GoalsPage = {
    render() {
        return `
      <div class="fade-in">
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">📊 إحصائيات الأهداف</h3>
            <button class="btn btn-primary btn-small" onclick="GoalsPage.openAddModal()"><i class="fas fa-plus"></i> هدف جديد</button>
          </div>
          <div class="grid-3">
            <div class="stat-card"><div class="stat-card-value" id="goal-active" style="color:var(--accent-blue)">0</div><div class="stat-card-label">أهداف نشطة</div></div>
            <div class="stat-card"><div class="stat-card-value" id="goal-completed" style="color:var(--accent-green)">0</div><div class="stat-card-label">أهداف محققة</div></div>
            <div class="stat-card"><div class="stat-card-value" id="goal-progress" style="color:var(--accent-purple)">0%</div><div class="stat-card-label">متوسط التقدم</div></div>
          </div>
        </div>
        <div class="section">
          <div class="tabs">
            <button class="tab-btn active" onclick="GoalsPage.filterGoals('all',this)">الكل</button>
            <button class="tab-btn" onclick="GoalsPage.filterGoals('active',this)">نشطة</button>
            <button class="tab-btn" onclick="GoalsPage.filterGoals('completed',this)">محققة</button>
          </div>
          <div class="grid-2" id="goals-list"></div>
        </div>
      </div>`;
    },

    allGoals: [],

    async load() {
        try {
            const [goals, stats] = await Promise.all([API.getGoals(), API.getGoalStats()]);
            document.getElementById('goal-active').textContent = stats.active;
            document.getElementById('goal-completed').textContent = stats.completed;
            document.getElementById('goal-progress').textContent = stats.avgProgress + '%';
            this.allGoals = goals;
            this.renderGoals(goals);
        } catch (err) { console.error(err); }
    },

    filterGoals(status, btn) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        const filtered = status === 'all' ? this.allGoals : this.allGoals.filter(g => g.status === status);
        this.renderGoals(filtered);
    },

    renderGoals(goals) {
        const el = document.getElementById('goals-list');
        if (!el) return;
        if (!goals.length) { el.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><i class="fas fa-flag"></i><h3>لا توجد أهداف</h3><p>حدد أهدافك وابدأ رحلة التحقيق</p></div>'; return; }
        const catLabels = { finance: '💰 مالية', health: '🏥 صحة', career: '💼 مهنية', education: '📚 تعليم', personal: '🧘 شخصية', other: '📌 أخرى' };
        el.innerHTML = goals.map(g => {
            const progress = g.target_value > 0 ? Math.min(100, (parseFloat(g.current_value) / parseFloat(g.target_value)) * 100) : 0;
            const milestones = g.goal_milestones || [];
            const completedM = milestones.filter(m => m.completed).length;
            return `
        <div class="goal-card">
          <div class="goal-header">
            <div class="goal-title">${g.title}</div>
            <span class="goal-category">${catLabels[g.category] || g.category}</span>
          </div>
          ${g.description ? `<p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:0.75rem">${g.description}</p>` : ''}
          <div class="goal-progress-bar"><div class="goal-progress-fill" style="width:${progress}%"></div></div>
          <div class="goal-stats">
            <span>${parseFloat(g.current_value || 0).toFixed(0)} / ${parseFloat(g.target_value || 0).toFixed(0)} ${g.unit || ''}</span>
            <span style="font-weight:600;color:var(--accent-purple)">${progress.toFixed(0)}%</span>
          </div>
          ${milestones.length > 0 ? `<div style="margin-top:0.75rem;border-top:1px solid var(--border-glass);padding-top:0.75rem">
            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:0.5rem">المعالم (${completedM}/${milestones.length})</div>
            ${milestones.map(m => `<div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:4px">
              <div class="task-checkbox ${m.completed ? 'checked' : ''}" style="width:18px;height:18px" onclick="GoalsPage.toggleMilestone('${m.id}',${!m.completed})">${m.completed ? '<i class="fas fa-check" style="font-size:0.6rem"></i>' : ''}</div>
              <span style="font-size:0.8rem;${m.completed ? 'text-decoration:line-through;color:var(--text-muted)' : ''}">${m.title}</span>
            </div>`).join('')}
          </div>` : ''}
          <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
            <button class="btn btn-secondary btn-small" onclick="GoalsPage.openUpdateModal('${g.id}',${g.current_value || 0})"><i class="fas fa-edit"></i> تحديث</button>
            <button class="btn btn-secondary btn-small" onclick="GoalsPage.openMilestoneModal('${g.id}')"><i class="fas fa-flag"></i> معلم</button>
            ${g.deadline ? `<span style="margin-right:auto;font-size:0.75rem;color:var(--text-muted)"><i class="fas fa-clock"></i> ${new Date(g.deadline).toLocaleDateString('ar-EG')}</span>` : ''}
            <button class="btn-icon" onclick="GoalsPage.deleteGoal('${g.id}')" style="margin-right:auto"><i class="fas fa-trash" style="font-size:0.7rem;color:var(--accent-red)"></i></button>
          </div>
        </div>`;
        }).join('');
    },

    openAddModal() {
        App.showModal('هدف جديد', `
      <div class="form-group"><label class="form-label">العنوان</label><input type="text" class="form-input" id="g-title" placeholder="عنوان الهدف" required></div>
      <div class="form-group"><label class="form-label">الوصف</label><textarea class="form-textarea" id="g-desc" placeholder="وصف اختياري"></textarea></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">الفئة</label><select class="form-select" id="g-cat"><option value="finance">مالية</option><option value="health">صحة</option><option value="career">مهنية</option><option value="education">تعليم</option><option value="personal">شخصية</option><option value="other">أخرى</option></select></div>
        <div class="form-group"><label class="form-label">الوحدة</label><input type="text" class="form-input" id="g-unit" placeholder="مثال: ريال، كيلو، ساعة"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">القيمة المستهدفة</label><input type="number" class="form-input" id="g-target" placeholder="100"></div>
        <div class="form-group"><label class="form-label">الموعد النهائي</label><input type="date" class="form-input" id="g-deadline"></div>
      </div>
      <div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" onclick="GoalsPage.saveGoal()">حفظ</button></div>`);
    },

    async saveGoal() {
        try {
            await API.createGoal({
                title: document.getElementById('g-title').value,
                description: document.getElementById('g-desc').value || null,
                category: document.getElementById('g-cat').value,
                target_value: parseFloat(document.getElementById('g-target').value) || 0,
                unit: document.getElementById('g-unit').value || null,
                deadline: document.getElementById('g-deadline').value || null
            });
            App.closeModal(); App.showToast('تم إنشاء الهدف', 'success'); this.load();
        } catch (err) { App.showToast(err.message, 'error'); }
    },

    openUpdateModal(id, currentValue) {
        App.showModal('تحديث التقدم', `
      <div class="form-group"><label class="form-label">القيمة الحالية</label><input type="number" class="form-input" id="g-update-val" value="${currentValue}"></div>
      <div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" onclick="GoalsPage.updateProgress('${id}')">تحديث</button></div>`);
    },

    async updateProgress(id) {
        try {
            const val = parseFloat(document.getElementById('g-update-val').value);
            await API.updateGoal(id, { current_value: val });
            App.closeModal(); App.showToast('تم تحديث التقدم', 'success'); this.load();
        } catch (err) { App.showToast(err.message, 'error'); }
    },

    openMilestoneModal(goalId) {
        App.showModal('إضافة معلم', `
      <div class="form-group"><label class="form-label">العنوان</label><input type="text" class="form-input" id="m-title" placeholder="عنوان المعلم"></div>
      <div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" onclick="GoalsPage.saveMilestone('${goalId}')">حفظ</button></div>`);
    },

    async saveMilestone(goalId) {
        try {
            await API.addMilestone(goalId, { title: document.getElementById('m-title').value });
            App.closeModal(); App.showToast('تمت إضافة المعلم', 'success'); this.load();
        } catch (err) { App.showToast(err.message, 'error'); }
    },

    async toggleMilestone(id, completed) {
        try { await API.toggleMilestone(id, completed); this.load(); }
        catch (err) { App.showToast(err.message, 'error'); }
    },

    async deleteGoal(id) {
        try { await API.deleteGoal(id); App.showToast('تم حذف الهدف', 'success'); this.load(); }
        catch (err) { App.showToast(err.message, 'error'); }
    }
};
