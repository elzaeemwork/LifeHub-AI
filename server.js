require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Make supabase available to routes
app.use((req, res, next) => {
  req.supabase = supabase;
  // Extract user token from Authorization header for authenticated requests
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    req.userToken = token;
    // Create an authenticated supabase client
    req.supabaseAuth = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );
  }
  next();
});

// Auth middleware
const requireAuth = (req, res, next) => {
  if (!req.supabaseAuth) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};
app.use('/api/finance', requireAuth);
app.use('/api/tasks', requireAuth);
app.use('/api/health', requireAuth);
app.use('/api/goals', requireAuth);
app.use('/api/dashboard', requireAuth);
app.use('/api/ai', requireAuth);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/health', require('./routes/health'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/ai', require('./routes/ai'));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 LifeHub AI running at http://localhost:${PORT}\n`);
});
