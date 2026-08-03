const express = require('express');
const Problem = require('../models/Problem');
const User = require('../models/User');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();
const problemFields = ['title', 'difficulty', 'category', 'description', 'starterCode', 'driverTemplate', 'testCases'];
const requiredProblemFields = ['title', 'difficulty', 'category', 'description', 'starterCode', 'driverTemplate'];

router.use(requireAuth, requireAdmin);

router.post('/problems', async (req, res) => {
  const missing = requiredProblemFields.filter((field) => req.body[field] === undefined || req.body[field] === null || req.body[field] === '');
  if (missing.length) return res.status(400).json({ error: 'Missing required fields', fields: missing });
  try {
    const problem = await Problem.create(Object.fromEntries(problemFields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]])));
    res.status(201).json(problem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/problems/:id', async (req, res) => {
  const updates = Object.fromEntries(problemFields.filter((field) => req.body[field] !== undefined).map((field) => [field, req.body[field]]));
  try {
    const problem = await Problem.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    res.json(problem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/problems/:id', async (req, res) => {
  try {
    const problem = await Problem.findByIdAndDelete(req.params.id);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('_id email role createdAt').lean();
    res.json(users.map(({ _id, email, role, createdAt }) => ({ id: _id.toString(), email, role, createdAt })));
  } catch (err) {
    res.status(500).json({ error: 'Could not fetch users' });
  }
});

module.exports = router;
