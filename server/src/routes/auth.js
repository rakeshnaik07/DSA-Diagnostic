const express = require('express');
const User = require('../models/User');
const {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
} = require('../utils/auth');

const router = express.Router();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmail = (email) =>
  typeof email === 'string' ? email.trim().toLowerCase() : '';

const publicUser = (user) => ({
  id: user._id.toString(),
  email: user.email,
  role: user.role,
});

const setToken = (res, user) => {
  res.cookie('token', generateToken(user._id), cookieOptions);
};

router.post('/register', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;

  if (!emailPattern.test(email)) {
    return res.status(400).json({
      error: 'A valid email is required',
    });
  }

  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters',
    });
  }

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        error: 'Email is already registered',
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      email,
      passwordHash,
    });

    setToken(res, user);

    return res.status(201).json({
      user: publicUser(user),
    });
  } catch (err) {
    return res.status(500).json({
      error: 'Could not register user',
    });
  }
});

router.post('/login', async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const { password } = req.body;

  const user = await User.findOne({ email });

  const isValid =
    user &&
    typeof password === 'string' &&
    (await comparePassword(password, user.passwordHash));

  if (!isValid) {
    return res.status(401).json({
      error: 'Invalid credentials',
    });
  }

  setToken(res, user);

  return res.json({
    user: publicUser(user),
  });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOptions);

  return res.json({
    message: 'Logged out',
  });
});

router.get('/me', async (req, res) => {
  try {
    const payload = verifyToken(req.cookies?.token);

    const user = await User.findById(payload.userId).select(
      '_id email role'
    );

    if (!user) {
      throw new Error('User not found');
    }

    return res.json({
      user: publicUser(user),
    });
  } catch (err) {
    return res.status(401).json({
      error: 'Not authenticated',
    });
  }
});

module.exports = router;
