const express = require('express');
const router = express.Router();

// Get all tasks
router.get('/', async (req, res) => {
    try {
        const { status, category, priority } = req.query;
        let query = req.supabaseAuth.from('tasks').select('*').order('priority', { ascending: false }).order('due_date', { ascending: true });
        if (status) query = query.eq('status', status);
        if (category) query = query.eq('category', category);
        if (priority) query = query.eq('priority', priority);
        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Create task
router.post('/', async (req, res) => {
    try {
        const { data: { user } } = await req.supabaseAuth.auth.getUser();
        const { title, description, priority, due_date, estimated_minutes, category } = req.body;
        const { data, error } = await req.supabaseAuth.from('tasks').insert({
            user_id: user.id, title, description,
            priority: priority || 3,
            due_date, estimated_minutes, category
        }).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update task
router.put('/:id', async (req, res) => {
    try {
        const updates = { ...req.body };
        if (updates.status === 'completed' && !updates.completed_at) {
            updates.completed_at = new Date().toISOString();
        }
        const { data, error } = await req.supabaseAuth.from('tasks').update(updates).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete task
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await req.supabaseAuth.from('tasks').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get task stats
router.get('/stats', async (req, res) => {
    try {
        const { data: tasks, error } = await req.supabaseAuth.from('tasks').select('*');
        if (error) throw error;
        const total = tasks.length;
        const completed = tasks.filter(t => t.status === 'completed').length;
        const pending = tasks.filter(t => t.status === 'pending').length;
        const inProgress = tasks.filter(t => t.status === 'in_progress').length;
        const overdue = tasks.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < new Date()).length;
        const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : 0;
        res.json({ total, completed, pending, inProgress, overdue, completionRate });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
