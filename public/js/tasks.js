// ===== Tasks Page =====
const TasksPage = {
    render() {
        return `
      <div class="fade-in">
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">📋 إحصائيات المهام</h3>
            <button class="btn btn-primary btn-small" onclick="TasksPage.openAddModal()"><i class="fas fa-plus"></i> مهمة جديدة</button>
          </div>
          <div class="grid-4">
            <div class="stat-card"><div class="stat-card-value" id="task-total" style="color:var(--accent-blue)">0</div><div class="stat-card-label">إجمالي المهام</div></div>
            <div class="stat-card"><div class="stat-card-value" id="task-completed" style="color:var(--accent-green)">0</div><div class="stat-card-label">مكتملة</div></div>
            <div class="stat-card"><div class="stat-card-value" id="task-pending" style="color:var(--accent-orange)">0</div><div class="stat-card-label">قيد الانتظار</div></div>
            <div class="stat-card"><div class="stat-card-value" id="task-overdue" style="color:var(--accent-red)">0</div><div class="stat-card-label">متأخرة</div></div>
          </div>
        </div>
        <div class="section">
          <div class="tabs">
            <button class="tab-btn active" onclick="TasksPage.filterTasks('all',this)">الكل</button>
            <button class="tab-btn" onclick="TasksPage.filterTasks('pending',this)">قيد الانتظار</button>
            <button class="tab-btn" onclick="TasksPage.filterTasks('in_progress',this)">جارية</button>
            <button class="tab-btn" onclick="TasksPage.filterTasks('completed',this)">مكتملة</button>
          </div>
          <div id="tasks-list"></div>
        </div>
      </div>`;
    },

    async load() {
        try {
            const [tasks, stats] = await Promise.all([API.getTasks(), API.getTaskStats()]);
            document.getElementById('task-total').textContent = stats.total;
            document.getElementById('task-completed').textContent = stats.completed;
            document.getElementById('task-pending').textContent = stats.pending;
            document.getElementById('task-overdue').textContent = stats.overdue;
            this.allTasks = tasks;
            this.renderTasks(tasks);
        } catch (err) { console.error(err); }
    },

    allTasks: [],

    filterTasks(status, btn) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
        const filtered = status === 'all' ? this.allTasks : this.allTasks.filter(t => t.status === status);
        this.renderTasks(filtered);
    },

    renderTasks(tasks) {
        const el = document.getElementById('tasks-list');
        if (!el) return;
        if (!tasks.length) { el.innerHTML = '<div class="empty-state"><i class="fas fa-clipboard-list"></i><h3>لا توجد مهام</h3><p>أضف مهمة جديدة للبدء</p></div>'; return; }
        const priorityLabels = { 5: 'عاجل', 4: 'مرتفع', 3: 'متوسط', 2: 'منخفض', 1: 'أدنى' };
        const statusLabels = { pending: 'انتظار', in_progress: 'جارية', completed: 'مكتملة', cancelled: 'ملغاة' };
        el.innerHTML = tasks.map(t => {
            const isCompleted = t.status === 'completed';
            const isOverdue = !isCompleted && t.due_date && new Date(t.due_date) < new Date();
            return `
        <div class="task-item ${isOverdue ? 'overdue' : ''}">
          <div class="task-checkbox ${isCompleted ? 'checked' : ''}" onclick="TasksPage.toggleTask('${t.id}', ${!isCompleted})">
            ${isCompleted ? '<i class="fas fa-check"></i>' : ''}
          </div>
          <div class="task-content">
            <div class="task-title ${isCompleted ? 'completed' : ''}">${t.title}</div>
            <div class="task-meta">
              <span class="tag tag-${t.status}">${statusLabels[t.status]}</span>
              ${t.due_date ? `<span ${isOverdue ? 'style="color:var(--accent-red)"' : ''}><i class="fas fa-calendar"></i> ${new Date(t.due_date).toLocaleDateString('ar-EG')}</span>` : ''}
              ${t.category ? `<span><i class="fas fa-tag"></i> ${t.category}</span>` : ''}
              <span>الأهمية: ${priorityLabels[t.priority] || t.priority}</span>
            </div>
          </div>
          <div class="task-actions">
            <button class="btn-icon" onclick="TasksPage.deleteTask('${t.id}')"><i class="fas fa-trash" style="font-size:0.75rem;color:var(--accent-red)"></i></button>
          </div>
        </div>`;
        }).join('');
    },

    openAddModal() {
        const cats = ['عمل', 'شخصي', 'دراسة', 'صحة', 'مالية', 'مشروع', 'أخرى'];
        App.showModal('مهمة جديدة', `
      <div class="form-group"><label class="form-label">العنوان</label><input type="text" class="form-input" id="task-title" placeholder="عنوان المهمة" required></div>
      <div class="form-group"><label class="form-label">الوصف</label><textarea class="form-textarea" id="task-desc" placeholder="وصف اختياري"></textarea></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">الفئة</label><select class="form-select" id="task-cat">${cats.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
        <div class="form-group"><label class="form-label">الأولوية</label><select class="form-select" id="task-priority"><option value="1">أدنى</option><option value="2">منخفض</option><option value="3" selected>متوسط</option><option value="4">مرتفع</option><option value="5">عاجل</option></select></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">تاريخ الاستحقاق</label><input type="date" class="form-input" id="task-due"></div>
        <div class="form-group"><label class="form-label">الوقت المتوقع (دقيقة)</label><input type="number" class="form-input" id="task-est" placeholder="30"></div>
      </div>
      <div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" onclick="TasksPage.saveTask()">حفظ</button></div>`);
    },

    async saveTask() {
        try {
            await API.createTask({
                title: document.getElementById('task-title').value,
                description: document.getElementById('task-desc').value,
                category: document.getElementById('task-cat').value,
                priority: parseInt(document.getElementById('task-priority').value),
                due_date: document.getElementById('task-due').value || null,
                estimated_minutes: parseInt(document.getElementById('task-est').value) || null
            });
            App.closeModal(); App.showToast('تمت إضافة المهمة', 'success'); this.load();
        } catch (err) { App.showToast(err.message, 'error'); }
    },

    async toggleTask(id, completed) {
        try {
            await API.updateTask(id, { status: completed ? 'completed' : 'pending' });
            App.showToast(completed ? 'تم الإنجاز! 🎉' : 'تم إلغاء الإنجاز', 'success');
            this.load();
        } catch (err) { App.showToast(err.message, 'error'); }
    },

    async deleteTask(id) {
        try { await API.deleteTask(id); App.showToast('تم حذف المهمة', 'success'); this.load(); }
        catch (err) { App.showToast(err.message, 'error'); }
    }
};
