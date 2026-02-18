const express = require('express');
const router = express.Router();

// Get AI insights
router.get('/insights', async (req, res) => {
    try {
        const { module, unread_only } = req.query;
        let query = req.supabaseAuth.from('ai_insights').select('*').order('created_at', { ascending: false }).limit(20);
        if (module) query = query.eq('module', module);
        if (unread_only === 'true') query = query.eq('is_read', false);
        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Mark insight as read
router.post('/insights/:id/read', async (req, res) => {
    try {
        const { data, error } = await req.supabaseAuth.from('ai_insights').update({ is_read: true }).eq('id', req.params.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Generate insights (rule-based AI engine)
router.post('/generate', async (req, res) => {
    try {
        const { data: { user } } = await req.supabaseAuth.auth.getUser();
        const now = new Date();
        const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const d7 = new Date(now - 7 * 86400000).toISOString().split('T')[0];
        const insights = [];

        // Finance insights
        const { data: txns } = await req.supabaseAuth.from('transactions').select('*').gte('date', firstOfMonth);
        if (txns && txns.length > 0) {
            const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + parseFloat(t.amount), 0);
            const expenses = txns.filter(t => t.type === 'expense').reduce((s, t) => s + parseFloat(t.amount), 0);
            if (expenses > income * 0.9) {
                insights.push({ module: 'finance', insight_type: 'warning', title: '⚠️ إنفاق مرتفع', description: `إنفاقك هذا الشهر (${expenses.toFixed(0)}) يقترب من دخلك (${income.toFixed(0)}). حاول تقليل المصاريف غير الضرورية.`, priority: 5 });
            }
            if (expenses > 0 && income > expenses * 1.5) {
                insights.push({ module: 'finance', insight_type: 'achievement', title: '🎉 توفير ممتاز!', description: `معدل توفيرك هذا الشهر ${((1 - expenses / income) * 100).toFixed(0)}%. استمر!`, priority: 2 });
            }
            // Top spending category
            const cats = {};
            txns.filter(t => t.type === 'expense').forEach(t => cats[t.category] = (cats[t.category] || 0) + parseFloat(t.amount));
            const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
            if (topCat) {
                insights.push({ module: 'finance', insight_type: 'tip', title: '💡 أعلى فئة إنفاق', description: `"${topCat[0]}" هي أعلى فئة إنفاق بـ ${topCat[1].toFixed(0)}. راجع إذا كان بإمكانك تقليلها.`, priority: 3 });
            }
        }

        // Task insights
        const { data: tasks } = await req.supabaseAuth.from('tasks').select('*');
        if (tasks) {
            const overdue = tasks.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < now);
            if (overdue.length > 0) {
                insights.push({ module: 'tasks', insight_type: 'warning', title: '⏰ مهام متأخرة', description: `لديك ${overdue.length} مهمة متأخرة. أعد ترتيب أولوياتك لإنجازها.`, priority: 4 });
            }
            const completed = tasks.filter(t => t.status === 'completed').length;
            if (completed > 5) {
                insights.push({ module: 'tasks', insight_type: 'achievement', title: '🏆 إنجاز رائع!', description: `أكملت ${completed} مهمة. إنتاجيتك ممتازة!`, priority: 2 });
            }
        }

        // Health insights
        const { data: health } = await req.supabaseAuth.from('health_logs').select('*').gte('date', d7);
        if (health && health.length > 0) {
            const avgSleep = health.filter(h => h.sleep_hours).reduce((s, h) => s + parseFloat(h.sleep_hours), 0) / health.filter(h => h.sleep_hours).length;
            if (avgSleep < 6) {
                insights.push({ module: 'health', insight_type: 'warning', title: '😴 نوم غير كاف', description: `متوسط نومك ${avgSleep.toFixed(1)} ساعات. الموصى به 7-8 ساعات.`, priority: 5 });
            }
            const avgMood = health.filter(h => h.mood).reduce((s, h) => s + h.mood, 0) / health.filter(h => h.mood).length;
            if (avgMood < 4) {
                insights.push({ module: 'health', insight_type: 'recommendation', title: '🧘 حسّن مزاجك', description: 'مزاجك منخفض. جرّب التأمل أو المشي أو التحدث مع صديق.', priority: 4 });
            }
            if (avgMood >= 7) {
                insights.push({ module: 'health', insight_type: 'achievement', title: '😊 مزاج ممتاز!', description: `متوسط مزاجك ${avgMood.toFixed(1)}/10. حالتك النفسية رائعة!`, priority: 1 });
            }
        } else {
            insights.push({ module: 'health', insight_type: 'recommendation', title: '📝 سجّل صحتك', description: 'لم تسجل بيانات صحية هذا الأسبوع. التتبع المنتظم يساعدك على تحسين عاداتك.', priority: 3 });
        }

        // Goals insights
        const { data: goals } = await req.supabaseAuth.from('goals').select('*').eq('status', 'active');
        if (goals && goals.length > 0) {
            goals.forEach(g => {
                if (g.target_value > 0) {
                    const progress = (parseFloat(g.current_value) / parseFloat(g.target_value)) * 100;
                    if (progress >= 80) {
                        insights.push({ module: 'goals', insight_type: 'achievement', title: `🎯 قريب من الهدف!`, description: `"${g.title}" وصل إلى ${progress.toFixed(0)}%. أنت قريب جداً!`, priority: 2 });
                    }
                    if (g.deadline && new Date(g.deadline) < new Date(now.getTime() + 7 * 86400000) && progress < 50) {
                        insights.push({ module: 'goals', insight_type: 'warning', title: '⚠️ موعد نهائي قريب', description: `"${g.title}" يحتاج إلى مزيد من العمل. الموعد النهائي خلال أسبوع!`, priority: 5 });
                    }
                }
            });
        }

        // Save insights
        if (insights.length > 0) {
            const { error } = await req.supabaseAuth.from('ai_insights').insert(insights.map(i => ({ ...i, user_id: user.id })));
            if (error) throw error;
        }

        res.json({ generated: insights.length, insights });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
