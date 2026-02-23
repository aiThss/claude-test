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

// Static: frontend files
const publicDir = path.join(__dirname, '../public');
app.use(express.static(publicDir));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profile'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Admin routes → serve admin/index.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(publicDir, 'admin', 'index.html'));
});
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(publicDir, 'admin', 'index.html'));
});

// Catch-all → serve public profile page (/:username)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Đã kết nối MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('❌ Lỗi kết nối MongoDB:', error.message);
    process.exit(1);
  });

module.exports = app;
