const express = require('express');
const router = express.Router();

// Get health logs
router.get('/', async (req, res) => {
    try {
        const { from_date, to_date, limit = 30 } = req.query;
        let query = req.supabaseAuth.from('health_logs').select('*').order('date', { ascending: false }).limit(limit);
        if (from_date) query = query.gte('date', from_date);
        if (to_date) query = query.lte('date', to_date);
        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Add/update health log (upsert by date)
router.post('/', async (req, res) => {
    try {
        const { data: { user } } = await req.supabaseAuth.auth.getUser();
        const { date, sleep_hours, water_ml, exercise_minutes, mood, energy, steps, calories, notes } = req.body;
        const logDate = date || new Date().toISOString().split('T')[0];
        const { data, error } = await req.supabaseAuth.from('health_logs').upsert({
            user_id: user.id, date: logDate, sleep_hours, water_ml, exercise_minutes, mood, energy, steps, calories, notes
        }, { onConflict: 'user_id,date' }).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete health log
router.delete('/:id', async (req, res) => {
    try {
        const { error } = await req.supabaseAuth.from('health_logs').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Health stats (averages for last 7 and 30 days)
router.get('/stats', async (req, res) => {
    try {
        const now = new Date();
        const d7 = new Date(now - 7 * 86400000).toISOString().split('T')[0];
        const d30 = new Date(now - 30 * 86400000).toISOString().split('T')[0];
        const { data: logs7, error: e1 } = await req.supabaseAuth.from('health_logs').select('*').gte('date', d7);
        const { data: logs30, error: e2 } = await req.supabaseAuth.from('health_logs').select('*').gte('date', d30);
        if (e1 || e2) throw (e1 || e2);
        const avg = (arr, key) => {
            const vals = arr.filter(l => l[key] != null).map(l => parseFloat(l[key]));
            return vals.length > 0 ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
        };
        res.json({
            week: { avgSleep: avg(logs7, 'sleep_hours'), avgMood: avg(logs7, 'mood'), avgEnergy: avg(logs7, 'energy'), avgExercise: avg(logs7, 'exercise_minutes'), avgWater: avg(logs7, 'water_ml'), days: logs7.length },
            month: { avgSleep: avg(logs30, 'sleep_hours'), avgMood: avg(logs30, 'mood'), avgEnergy: avg(logs30, 'energy'), avgExercise: avg(logs30, 'exercise_minutes'), avgWater: avg(logs30, 'water_ml'), days: logs30.length }
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
