const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');

// GET /api/problems — list all problems (no solutions/test case answers exposed)
router.get('/', async (req, res) => {
  try {
    const problems = await Problem.find().select('title difficulty category');
    res.json(problems);
  } catch (err) {
    console.error('Failed to fetch problems:', err.message);
    res.status(500).json({ error: 'Could not fetch problems' });
  }
});

// GET /api/problems/:id — single problem with full detail (for the solving screen)
router.get('/:id', async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    res.json(problem);
  } catch (err) {
    console.error('Failed to fetch problem:', err.message);
    res.status(500).json({ error: 'Could not fetch problem' });
  }
});

module.exports = router;