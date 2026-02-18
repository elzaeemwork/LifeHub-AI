const express = require('express');
const router = express.Router();

// Get all goals
router.get('/', async (req, res) => {
    try {
        const { status, category } = req.query;
        let query = req.supabaseAuth.from('goals').select('*, goal_milestones(*)').order('created_at', { ascending: false });
        if (status) query = query.eq('status', status);
        if (category) query = query.eq('category', category);
        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Create goal
router.post('/', async (req, res) => {
    try {
        const { data: { user } } = await req.supabaseAuth.auth.getUser();
        const { title, description, category, target_value, unit, deadline } = req.body;
        const { data, error } = await req.supabaseAuth.from('goals').insert({
            user_id: user.id, title, description, category, target_value, unit, deadline
        }).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update goal
router.put('/:id', async (req, res) => {
    try {
        const { data, error } = await req.supabaseAuth.from('goals').update(req.body).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete goal
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await req.supabaseAuth.from('goals').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Add milestone
router.post('/:goalId/milestones', async (req, res) => {
    try {
        const { title, target_value } = req.body;
        const { data, error } = await req.supabaseAuth.from('goal_milestones').insert({
            goal_id: req.params.goalId, title, target_value
        }).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Toggle milestone completion
router.put('/milestones/:id', async (req, res) => {
    try {
        const { completed } = req.body;
        const updates = { completed, completed_at: completed ? new Date().toISOString() : null };
        const { data, error } = await req.supabaseAuth.from('goal_milestones').update(updates).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Goal stats
router.get('/stats', async (req, res) => {
    try {
        const { data: goals, error } = await req.supabaseAuth.from('goals').select('*');
        if (error) throw error;
        const total = goals.length;
        const active = goals.filter(g => g.status === 'active').length;
        const completed = goals.filter(g => g.status === 'completed').length;
        const avgProgress = goals.filter(g => g.target_value > 0).reduce((sum, g) => {
            return sum + (parseFloat(g.current_value) / parseFloat(g.target_value)) * 100;
        }, 0) / (goals.filter(g => g.target_value > 0).length || 1);
        res.json({ total, active, completed, avgProgress: avgProgress.toFixed(1) });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
