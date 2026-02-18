const express = require('express');
const router = express.Router();

// Sign up
router.post('/signup', async (req, res) => {
    try {
        const { email, password, full_name } = req.body;
        const { data, error } = await req.supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name } }
        });
        if (error) throw error;
        res.json({ user: data.user, session: data.session });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data, error } = await req.supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        res.json({ user: data.user, session: data.session });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get current user
router.get('/user', async (req, res) => {
    try {
        if (!req.supabaseAuth) return res.status(401).json({ error: 'Not authenticated' });
        const { data: { user }, error } = await req.supabaseAuth.auth.getUser();
        if (error) throw error;
        // Get profile
        const { data: profile } = await req.supabaseAuth.from('profiles').select('*').eq('id', user.id).single();
        res.json({ user, profile });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update profile
router.put('/profile', async (req, res) => {
    try {
        if (!req.supabaseAuth) return res.status(401).json({ error: 'Not authenticated' });
        const { data: { user } } = await req.supabaseAuth.auth.getUser();
        const { full_name, avatar_url, settings } = req.body;
        const updates = {};
        if (full_name !== undefined) updates.full_name = full_name;
        if (avatar_url !== undefined) updates.avatar_url = avatar_url;
        if (settings !== undefined) updates.settings = settings;
        updates.updated_at = new Date().toISOString();
        const { data, error } = await req.supabaseAuth.from('profiles').update(updates).eq('id', user.id).select().single();
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
