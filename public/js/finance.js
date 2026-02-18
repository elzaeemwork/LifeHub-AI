// ===== Finance Page =====
const FinancePage = {
    charts: {},
    render() {
        return `
      <div class="fade-in">
        <div class="section">
          <div class="section-header">
            <h3 class="section-title">📊 ملخص الشهر</h3>
            <button class="btn btn-primary btn-small" onclick="FinancePage.openAddModal()"><i class="fas fa-plus"></i> معاملة جديدة</button>
          </div>
          <div class="grid-3">
            <div class="stat-card"><div class="stat-card-value" id="fin-income" style="color:var(--accent-green)">$0</div><div class="stat-card-label">الدخل</div></div>
            <div class="stat-card"><div class="stat-card-value" id="fin-expenses" style="color:var(--accent-red)">$0</div><div class="stat-card-label">المصاريف</div></div>
            <div class="stat-card"><div class="stat-card-value" id="fin-savings">$0</div><div class="stat-card-label">التوفير (<span id="fin-rate">0</span>%)</div></div>
          </div>
        </div>
        <div class="section">
          <div class="grid-2">
            <div class="chart-card">
              <div class="chart-card-title">📂 المصاريف حسب الفئة</div>
              <div class="chart-container"><canvas id="expense-cat-chart"></canvas></div>
            </div>
            <div>
              <div class="section-header"><h3 class="section-title">🏦 الميزانيات</h3>
                <button class="btn btn-secondary btn-small" onclick="FinancePage.openBudgetModal()"><i class="fas fa-plus"></i></button>
              </div>
              <div id="budgets-list"></div>
            </div>
          </div>
        </div>
        <div class="section">
          <div class="section-header"><h3 class="section-title">📜 المعاملات الأخيرة</h3></div>
          <div class="glass-card" style="overflow:hidden">
            <table class="data-table"><thead><tr><th>التاريخ</th><th>الوصف</th><th>الفئة</th><th>النوع</th><th>المبلغ</th><th></th></tr></thead>
            <tbody id="transactions-list"></tbody></table>
          </div>
        </div>
      </div>`;
    },

    async load() {
        try {
            const [summary, transactions, budgets] = await Promise.all([API.getFinanceSummary(), API.getTransactions(), API.getBudgets()]);
            document.getElementById('fin-income').textContent = `$${summary.income.toFixed(0)}`;
            document.getElementById('fin-expenses').textContent = `$${summary.expenses.toFixed(0)}`;
            const savEl = document.getElementById('fin-savings');
            savEl.textContent = `$${Math.abs(summary.savings).toFixed(0)}`;
            savEl.style.color = summary.savings >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';
            document.getElementById('fin-rate').textContent = summary.savingsRate;
            this.renderTransactions(transactions);
            this.renderBudgets(budgets, summary.categories);
            this.renderCategoryChart(summary.categories);
        } catch (err) { console.error(err); }
    },

    renderTransactions(txns) {
        const el = document.getElementById('transactions-list');
        if (!el) return;
        if (!txns.length) { el.innerHTML = '<tr><td colspan="6"><div class="empty-state"><i class="fas fa-receipt"></i><h3>لا توجد معاملات</h3></div></td></tr>'; return; }
        el.innerHTML = txns.map(t => `
      <tr>
        <td>${new Date(t.date).toLocaleDateString('ar-EG')}</td>
        <td>${t.description || '--'}</td>
        <td><span class="tag">${t.category}</span></td>
        <td><span class="tag tag-${t.type}">${t.type === 'income' ? 'دخل' : 'مصروف'}</span></td>
        <td style="color:${t.type === 'income' ? 'var(--accent-green)' : 'var(--accent-red)'}; font-weight:600">${t.type === 'income' ? '+' : '-'}$${parseFloat(t.amount).toFixed(0)}</td>
        <td><button class="btn-icon" onclick="FinancePage.deleteTransaction('${t.id}')"><i class="fas fa-trash" style="font-size:0.75rem;color:var(--accent-red)"></i></button></td>
      </tr>`).join('');
    },

    renderBudgets(budgets, spent) {
        const el = document.getElementById('budgets-list');
        if (!el) return;
        if (!budgets.length) { el.innerHTML = '<div class="empty-state" style="padding:1rem"><p>لم تحدد ميزانيات بعد</p></div>'; return; }
        el.innerHTML = budgets.map(b => {
            const s = (spent && spent[b.category]) || 0;
            const pct = Math.min(100, (s / parseFloat(b.limit_amount)) * 100);
            const color = pct > 90 ? 'var(--accent-red)' : pct > 70 ? 'var(--accent-orange)' : 'var(--accent-green)';
            return `<div class="stat-card" style="margin-bottom:0.5rem">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:500">${b.category}</span>
          <button class="btn-icon" onclick="FinancePage.deleteBudget('${b.id}')"><i class="fas fa-times" style="font-size:0.7rem"></i></button>
        </div>
        <div class="goal-progress-bar" style="margin:0.5rem 0"><div class="goal-progress-fill" style="width:${pct}%;background:${color}"></div></div>
        <div style="display:flex;justify-content:space-between;font-size:0.8rem;color:var(--text-muted)"><span>$${s.toFixed(0)} / $${parseFloat(b.limit_amount).toFixed(0)}</span><span>${pct.toFixed(0)}%</span></div>
      </div>`;
        }).join('');
    },

    renderCategoryChart(categories) {
        const ctx = document.getElementById('expense-cat-chart');
        if (!ctx || !categories || !Object.keys(categories).length) return;
        if (this.charts.cat) this.charts.cat.destroy();
        const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6', '#a78bfa'];
        this.charts.cat = new Chart(ctx, {
            type: 'doughnut',
            data: { labels: Object.keys(categories), datasets: [{ data: Object.values(categories), backgroundColor: colors.slice(0, Object.keys(categories).length), borderWidth: 0 }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'IBM Plex Sans Arabic' }, padding: 12 } } }, cutout: '60%' }
        });
    },

    openAddModal() {
        const cats = ['طعام', 'مواصلات', 'ترفيه', 'فواتير', 'تعليم', 'صحة', 'ملابس', 'توفير', 'راتب', 'عمل حر', 'استثمار', 'أخرى'];
        App.showModal('إضافة معاملة', `
      <div class="form-row"><div class="form-group"><label class="form-label">النوع</label><select class="form-select" id="txn-type"><option value="expense">مصروف</option><option value="income">دخل</option></select></div>
      <div class="form-group"><label class="form-label">المبلغ</label><input type="number" class="form-input" id="txn-amount" placeholder="0.00" step="0.01" required></div></div>
      <div class="form-group"><label class="form-label">الفئة</label><select class="form-select" id="txn-category">${cats.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">الوصف</label><input type="text" class="form-input" id="txn-desc" placeholder="وصف اختياري"></div>
      <div class="form-group"><label class="form-label">التاريخ</label><input type="date" class="form-input" id="txn-date" value="${new Date().toISOString().split('T')[0]}"></div>
      <div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" onclick="FinancePage.saveTransaction()">حفظ</button></div>`);
    },

    async saveTransaction() {
        try {
            await API.addTransaction({
                type: document.getElementById('txn-type').value,
                amount: parseFloat(document.getElementById('txn-amount').value),
                category: document.getElementById('txn-category').value,
                description: document.getElementById('txn-desc').value,
                date: document.getElementById('txn-date').value
            });
            App.closeModal();
            App.showToast('تمت إضافة المعاملة', 'success');
            this.load();
        } catch (err) { App.showToast(err.message, 'error'); }
    },

    async deleteTransaction(id) {
        try { await API.deleteTransaction(id); App.showToast('تم الحذف', 'success'); this.load(); }
        catch (err) { App.showToast(err.message, 'error'); }
    },

    openBudgetModal() {
        const cats = ['طعام', 'مواصلات', 'ترفيه', 'فواتير', 'تعليم', 'صحة', 'ملابس', 'أخرى'];
        App.showModal('إضافة ميزانية', `
      <div class="form-group"><label class="form-label">الفئة</label><select class="form-select" id="bgt-cat">${cats.map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
      <div class="form-group"><label class="form-label">الحد الأقصى</label><input type="number" class="form-input" id="bgt-limit" placeholder="0.00"></div>
      <div class="modal-actions"><button class="btn btn-secondary" onclick="App.closeModal()">إلغاء</button><button class="btn btn-primary" onclick="FinancePage.saveBudget()">حفظ</button></div>`);
    },

    async saveBudget() {
        try {
            await API.saveBudget({ category: document.getElementById('bgt-cat').value, limit_amount: parseFloat(document.getElementById('bgt-limit').value) });
            App.closeModal(); App.showToast('تم حفظ الميزانية', 'success'); this.load();
        } catch (err) { App.showToast(err.message, 'error'); }
    },

    async deleteBudget(id) {
        try { await API.deleteBudget(id); App.showToast('تم الحذف', 'success'); this.load(); }
        catch (err) { App.showToast(err.message, 'error'); }
    }
};
