const express = require('express');
const next = require('next');
const fs = require('fs');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const SESSION_SECRET = process.env.SESSION_SECRET || 'your-secure-session-secret';
const mockAdminCredentials = { 
  username: 'ExampleLogin123', 
  password: 'ExamplePassword123'
};
const KNIVES_FILE_PATH = './knives.json';

const readKnivesFromFile = () => {
  try {
    return JSON.parse(fs.readFileSync(KNIVES_FILE_PATH, 'utf-8'));
  } catch (error) {
    // If file doesn't exist, create it with empty array
    fs.writeFileSync(KNIVES_FILE_PATH, JSON.stringify([], null, 2));
    return [];
  }
};

app.prepare().then(() => {
  const server = express();

  server.use(express.json());
  server.use(express.urlencoded({ extended: true }));
  server.use(cookieParser());
  
  server.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: !dev,
      sameSite: 'lax', // Changed to lax to allow normal navigation
      maxAge: 24 * 60 * 60 * 1000
    }
  }));

  // Get auth status
  server.get('/api/auth-status', (req, res) => {
    res.json({ 
      isAuthenticated: !!req.session.isAuthenticated,
      username: req.session.username 
    });
  });

  // Modified knives endpoint to always return data
  server.get('/api/knives', (req, res) => {
    const knives = readKnivesFromFile();
    res.json(knives);
  });

  // Keep save-knives endpoint protected
  server.post('/api/save-knives', (req, res) => {
    if (!req.session.isAuthenticated) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const knives = req.body;
    fs.writeFileSync(KNIVES_FILE_PATH, JSON.stringify(knives, null, 2));
    res.json({ success: true });
  });

  server.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === mockAdminCredentials.username && password === mockAdminCredentials.password) {
      req.session.isAuthenticated = true;
      req.session.username = username;
      return res.json({ success: true });
    }
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  });

  server.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Logout failed' });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });

  server.get('*', (req, res) => {
    return handle(req, res);
  });

  server.listen(3000, (err) => {
    if (err) throw err;
    console.log('> Ready on http://localhost:3000');
  });
});