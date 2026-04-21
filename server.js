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

// CORS : mobile apps n'ont pas d'origin header → toujours autorisées.
// On restreint uniquement les origines browser connues pour limiter l'abus depuis le web.
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // mobile / curl / server-to-server
    const allowed = [
      'http://localhost:8081',
      'http://localhost:19006',
      'http://localhost:3000',
    ];
    if (allowed.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: false,
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
// Limite à 1 Mo — scan-label passe par multer (multipart), pas par express.json
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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
      if (!process.env.BREVO_API_KEY) {
        console.warn('⚠️  BREVO_API_KEY manquant — les emails de bienvenue ne seront pas envoyés');
      }
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
};

start();
