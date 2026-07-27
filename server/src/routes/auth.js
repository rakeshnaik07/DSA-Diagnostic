const express = require('express');
const User = require('../models/User');
const { hashPassword, comparePassword, generateToken, verifyToken } = require('../utils/auth');

const router = express.Router();
const cookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 };
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function setToken(res, user) { res.cookie('token', generateToken(user._id), cookieOptions); }
function publicUser(user) { return { id: user._id.toString(), email: user.email }; }

router.post('/register', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = req.body.password;
  if (!emailPattern.test(email)) return res.status(400).json({ error: 'A valid email is required' });
  if (typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    if (await User.findOne({ email })) return res.status(409).json({ error: 'Email is already registered' });
    const user = await User.create({ email, passwordHash: await hashPassword(password) });
    setToken(res, user);
    res.status(201).json({ user: publicUser(user) });
  } catch (err) { res.status(500).json({ error: 'Could not register user' }); }
});

router.post('/login', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const user = await User.findOne({ email });
  if (!user || typeof req.body.password !== 'string' || !(await comparePassword(req.body.password, user.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
  setToken(res, user);
  res.json({ user: publicUser(user) });
});

router.post('/logout', (req, res) => { res.clearCookie('token', cookieOptions); res.json({ message: 'Logged out' }); });

router.get('/me', async (req, res) => {
  try {
    const payload = verifyToken(req.cookies?.token);
    const user = await User.findById(payload.userId).select('_id email');
    if (!user) throw new Error('User not found');
    res.json({ user: publicUser(user) });
  } catch (err) { res.status(401).json({ error: 'Not authenticated' }); }
});

module.exports = router;
