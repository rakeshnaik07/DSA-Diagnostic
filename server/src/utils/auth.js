const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function hashPassword(plainPassword) { return bcrypt.hash(plainPassword, 10); }
async function comparePassword(plainPassword, hash) { return bcrypt.compare(plainPassword, hash); }
function generateToken(userId) { return jwt.sign({ userId: userId.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' }); }
function verifyToken(token) { return jwt.verify(token, process.env.JWT_SECRET); }

module.exports = { hashPassword, comparePassword, generateToken, verifyToken };
