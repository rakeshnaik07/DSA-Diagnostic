const User = require('../models/User');
const { verifyToken } = require('../utils/auth');

async function requireAuth(req, res, next) {
  try {
    const payload = verifyToken(req.cookies?.token);
    const user = await User.findById(payload.userId).select('_id email').lean();
    if (!user) throw new Error('User not found');
    req.user = { id: user._id.toString(), email: user.email };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Not authenticated' });
  }
}

module.exports = requireAuth;
