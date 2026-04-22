require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const passport = require('passport');

const { generalLimiter } = require('./middleware/rateLimiter');
const { configurePassport } = require('./config/passport');
const authRoutes = require('./routes/auth');
const incidentRoutes = require('./routes/incidents');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const mediaRoutes = require('./routes/media');
const predictionRoutes = require('./routes/prediction');

const createApp = () => {
  const app = express();

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(compression());
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  configurePassport();
  app.use(passport.initialize());

  app.use(generalLimiter);

  app.use((req, res, next) => {
    req.io = req.app.get('io');
    next();
  });

  app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

  app.use('/api/auth', authRoutes);
  app.use('/api/incidents', incidentRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/media', mediaRoutes);
  app.use('/api/prediction', predictionRoutes);

  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  });

  app.use((req, res) => res.status(404).json({ error: 'Not found' }));

  return app;
};

module.exports = { createApp };
