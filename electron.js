const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// Load environment variables
const envPath = app.isPackaged
    ? path.join(process.resourcesPath, '.env')
    : path.join(__dirname, '.env');
require('dotenv').config({ path: envPath });

let mainWindow;
let serverInstance;

function startServer() {
    return new Promise((resolve) => {
        const express = require('express');
        const cors = require('cors');
        const { createClient } = require('@supabase/supabase-js');

        const server = express();
        const PORT = process.env.PORT || 3000;

        server.use(cors());
        server.use(express.json());
        server.use(express.static(path.join(__dirname, 'public')));

        // Supabase client
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_ANON_KEY;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Auth middleware
        const authMiddleware = async (req, res, next) => {
            const token = req.headers.authorization?.replace('Bearer ', '');
            if (!token) return res.status(401).json({ error: 'No token provided' });
            const { data: { user }, error } = await supabase.auth.getUser(token);
            if (error || !user) return res.status(401).json({ error: 'Invalid token' });
            req.user = user;
            req.supabase = createClient(supabaseUrl, supabaseKey, {
                global: { headers: { Authorization: `Bearer ${token}` } }
            });
            next();
        };

        // Make supabase available
        server.use((req, res, next) => {
            req.supabaseAdmin = supabase;
            next();
        });

        // Routes
        server.use('/api/auth', require('./routes/auth'));
        server.use('/api/finance', authMiddleware, require('./routes/finance'));
        server.use('/api/tasks', authMiddleware, require('./routes/tasks'));
        server.use('/api/health', authMiddleware, require('./routes/health'));
        server.use('/api/goals', authMiddleware, require('./routes/goals'));
        server.use('/api/dashboard', authMiddleware, require('./routes/dashboard'));
        server.use('/api/ai', authMiddleware, require('./routes/ai'));

        // SPA fallback
        server.get('*', (req, res) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });

        serverInstance = server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            resolve(PORT);
        });
    });
}

function createWindow(port) {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 900,
        minHeight: 600,
        title: 'LifeHub AI',
        icon: path.join(__dirname, 'public', 'icon.png'),
        backgroundColor: '#0a0a1a',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        show: false,
        autoHideMenuBar: true
    });

    mainWindow.loadURL(`http://localhost:${port}`);

    // Show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Open external links in browser
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });

    // Handle OAuth redirects back to the app
    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (url.startsWith(`http://localhost:${port}`)) {
            // Allow navigation to our app
            return;
        }
        if (url.includes('accounts.google.com') || url.includes('supabase.co')) {
            // Allow Google OAuth and Supabase redirects
            return;
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(async () => {
    const port = await startServer();
    createWindow(port);
});

app.on('window-all-closed', () => {
    if (serverInstance) serverInstance.close();
    app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        startServer().then(createWindow);
    }
});
