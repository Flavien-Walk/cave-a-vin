require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { connectDB } = require('./src/config/database');
const { errorHandler, notFound } = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',     require('./src/routes/auth'));
app.use('/api/bottles',  require('./src/routes/bottles'));
app.use('/api/stats',    require('./src/routes/stats'));
app.use('/api/wishlist', require('./src/routes/wishlist'));
app.use('/api/caves',    require('./src/routes/caves'));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '2.0.0', timestamp: new Date().toISOString() });
});

// ── Error handling ───────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start ────────────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`🍷 Cave à Vin API v2 — port ${PORT} — ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
};

start();
