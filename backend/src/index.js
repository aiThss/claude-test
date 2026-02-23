require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static: uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Static: all frontend assets EXCEPT index.html at root
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir, { index: false }));

// --- Config endpoint: inject owner username vào frontend ---
app.get('/config.js', (req, res) => {
  const username = process.env.PROFILE_USERNAME || '';
  res.type('application/javascript');
  res.set('Cache-Control', 'no-store');
  res.send(`window.BIOLINK_OWNER = "${username}";`);
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicDir, 'admin', 'index.html'));
});
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(publicDir, 'admin', 'index.html'));
});

// Root / và tất cả route còn lại → public profile page
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB error:', err.message);
    process.exit(1);
  });

module.exports = app;
