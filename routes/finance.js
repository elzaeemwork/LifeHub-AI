const express = require('express');
const router = express.Router();

// Get all transactions with optional filters
router.get('/transactions', async (req, res) => {
    try {
        const { type, category, from_date, to_date, limit = 50 } = req.query;
        let query = req.supabaseAuth.from('transactions').select('*').order('date', { ascending: false }).limit(limit);
        if (type) query = query.eq('type', type);
        if (category) query = query.eq('category', category);
        if (from_date) query = query.gte('date', from_date);
        if (to_date) query = query.lte('date', to_date);
        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Add transaction
router.post('/transactions', async (req, res) => {
    try {
        const { data: { user } } = await req.supabaseAuth.auth.getUser();
        const { amount, type, category, description, date, recurring, recurring_period } = req.body;
        const { data, error } = await req.supabaseAuth.from('transactions').insert({
            user_id: user.id, amount, type, category, description,
            date: date || new Date().toISOString().split('T')[0],
            recurring: recurring || false, recurring_period
        }).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update transaction
router.put('/transactions/:id', async (req, res) => {
    try {
        const { data, error } = await req.supabaseAuth.from('transactions').update(req.body).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete transaction
router.delete('/transactions/:id', async (req, res) => {
    try {
        const { error } = await req.supabaseAuth.from('transactions').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get budgets
router.get('/budgets', async (req, res) => {
    try {
        const { data, error } = await req.supabaseAuth.from('budgets').select('*');
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Create/update budget
router.post('/budgets', async (req, res) => {
    try {
        const { data: { user } } = await req.supabaseAuth.auth.getUser();
        const { id, category, limit_amount, period } = req.body;
        if (id) {
            const { data, error } = await req.supabaseAuth.from('budgets').update({ category, limit_amount, period }).eq('id', id).select().single();
            if (error) throw error;
            return res.json(data);
        }
        const { data, error } = await req.supabaseAuth.from('budgets').insert({ user_id: user.id, category, limit_amount, period: period || 'monthly' }).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete budget
router.delete('/budgets/:id', async (req, res) => {
    try {
        const { error } = await req.supabaseAuth.from('budgets').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Finance summary (monthly income, expenses, savings rate)
router.get('/summary', async (req, res) => {
    try {
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const { data: transactions, error } = await req.supabaseAuth.from('transactions').select('*').gte('date', firstOfMonth);
        if (error) throw error;
        const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
        const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
        const savings = income - expenses;
        const savingsRate = income > 0 ? ((savings / income) * 100).toFixed(1) : 0;
        // Category breakdown
        const categories = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + parseFloat(t.amount);
        });
        res.json({ income, expenses, savings, savingsRate, categories, transactionCount: transactions.length });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
