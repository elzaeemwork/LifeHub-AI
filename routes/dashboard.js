const express = require('express');
const router = express.Router();

// Dashboard summary - aggregates all modules
router.get('/summary', async (req, res) => {
    try {
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const today = now.toISOString().split('T')[0];

        // Finance
        const { data: txns } = await req.supabaseAuth.from('transactions').select('*').gte('date', firstOfMonth);
        const income = (txns || []).filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
        const expenses = (txns || []).filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);

        // Tasks
        const { data: tasks } = await req.supabaseAuth.from('tasks').select('*');
        const totalTasks = (tasks || []).length;
        const completedTasks = (tasks || []).filter(t => t.status === 'completed').length;
        const pendingTasks = (tasks || []).filter(t => t.status === 'pending').length;
        const overdueTasks = (tasks || []).filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < now).length;

        // Health (last 7 days)
        const d7 = new Date(now - 7 * 86400000).toISOString().split('T')[0];
        const { data: health } = await req.supabaseAuth.from('health_logs').select('*').gte('date', d7);
        const avg = (arr, key) => {
            const v = (arr || []).filter(l => l[key] != null).map(l => parseFloat(l[key]));
            return v.length > 0 ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : 0;
        };

        // Goals
        const { data: goals } = await req.supabaseAuth.from('goals').select('*');
        const activeGoals = (goals || []).filter(g => g.status === 'active').length;
        const completedGoals = (goals || []).filter(g => g.status === 'completed').length;

        // Unread insights
        const { data: insights } = await req.supabaseAuth.from('ai_insights').select('id').eq('is_read', false);

        res.json({
            finance: { income, expenses, savings: income - expenses, transactionCount: (txns || []).length },
            tasks: { total: totalTasks, completed: completedTasks, pending: pendingTasks, overdue: overdueTasks, completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0 },
            health: { avgMood: avg(health, 'mood'), avgEnergy: avg(health, 'energy'), avgSleep: avg(health, 'sleep_hours'), avgExercise: avg(health, 'exercise_minutes'), daysLogged: (health || []).length },
            goals: { active: activeGoals, completed: completedGoals, total: (goals || []).length },
            unreadInsights: (insights || []).length
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Life Score calculation
router.get('/life-score', async (req, res) => {
    try {
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const d7 = new Date(now - 7 * 86400000).toISOString().split('T')[0];

        // Finance Score (0-100): based on savings rate
        const { data: txns } = await req.supabaseAuth.from('transactions').select('*').gte('date', firstOfMonth);
        const income = (txns || []).filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
        const expenses = (txns || []).filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
        const savingsRate = income > 0 ? (income - expenses) / income : 0;
        const financeScore = Math.min(100, Math.max(0, savingsRate * 200)); // 50% savings = 100 score

        // Task Score (0-100): based on completion rate and no overdue
        const { data: tasks } = await req.supabaseAuth.from('tasks').select('*');
        const totalTasks = (tasks || []).length;
        const completedTasks = (tasks || []).filter(t => t.status === 'completed').length;
        const overdueTasks = (tasks || []).filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < now).length;
        const taskCompletion = totalTasks > 0 ? completedTasks / totalTasks : 0.5;
        const overduePenalty = totalTasks > 0 ? (overdueTasks / totalTasks) * 30 : 0;
        const taskScore = Math.min(100, Math.max(0, taskCompletion * 100 - overduePenalty));

        // Health Score (0-100): based on averages
        const { data: health } = await req.supabaseAuth.from('health_logs').select('*').gte('date', d7);
        let healthScore = 50; // default
        if (health && health.length > 0) {
            const avgMood = health.filter(h => h.mood).reduce((s, h) => s + h.mood, 0) / health.filter(h => h.mood).length || 5;
            const avgEnergy = health.filter(h => h.energy).reduce((s, h) => s + h.energy, 0) / health.filter(h => h.energy).length || 5;
            const avgSleep = health.filter(h => h.sleep_hours).reduce((s, h) => s + parseFloat(h.sleep_hours), 0) / health.filter(h => h.sleep_hours).length || 7;
            const sleepScore = Math.min(10, (avgSleep / 8) * 10);
            healthScore = ((avgMood + avgEnergy + sleepScore) / 30) * 100;
        }

        // Goal Score (0-100): based on progress
        const { data: goals } = await req.supabaseAuth.from('goals').select('*').eq('status', 'active');
        let goalScore = 50;
        if (goals && goals.length > 0) {
            const avgProgress = goals.reduce((sum, g) => {
                const progress = g.target_value > 0 ? (parseFloat(g.current_value) / parseFloat(g.target_value)) * 100 : 50;
                return sum + Math.min(100, progress);
            }, 0) / goals.length;
            goalScore = avgProgress;
        }

        // Weighted total
        const weights = { finance: 0.25, tasks: 0.25, health: 0.30, goals: 0.20 };
        const totalScore = Math.round(
            financeScore * weights.finance +
            taskScore * weights.tasks +
            healthScore * weights.health +
            goalScore * weights.goals
        );

        res.json({
            total: Math.min(100, Math.max(0, totalScore)),
            breakdown: {
                finance: { score: Math.round(financeScore), weight: weights.finance },
                tasks: { score: Math.round(taskScore), weight: weights.tasks },
                health: { score: Math.round(healthScore), weight: weights.health },
                goals: { score: Math.round(goalScore), weight: weights.goals }
            }
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
