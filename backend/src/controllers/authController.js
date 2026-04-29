const { body } = require('express-validator');
const User = require('../models/user');
const { generateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { sendWelcomeEmail, sendLoginEmail } = require('../services/email.service');

const registerValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  validate,
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  validate,
];

const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const user = await User.createUser({ email, password, name });
    const token = generateToken(user._id);

    // Send welcome email asynchronously
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, isActive: true }).select('+passwordHash');
    if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await User.verifyPassword(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user._id);

    // Send login welcome email asynchronously (fire-and-forget)
    sendLoginEmail(user.email, user.name).catch(console.error);

    res.json({
      token,
      user: {
        id: user._id, email: user.email, name: user.name,
        role: user.role, trustScore: user.trustScore, points: user.points,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).where({ isActive: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

const googleCallback = (req, res) => {
  const token = generateToken(req.user._id);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
};

module.exports = { register, login, me, googleCallback, registerValidation, loginValidation };
