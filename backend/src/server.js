require('dotenv').config();
const express = require('express');
const cors = require('cors');
const User = require('./models/User');
const Document = require('./models/Document');
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const { pool, redis } = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    await redis.ping();
    res.json({ status: 'ok', postgres: 'ok', redis: 'ok' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Инициализация БД и запуск
async function start() {
  try {
    await User.createTable();
    await Document.createTable();
    console.log('Tables initialized');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start:', err);
    process.exit(1);
  }
}

start();