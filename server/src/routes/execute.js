const express = require('express');
const router = express.Router();
const Problem = require('../models/Problem');

router.post('/', async (req, res) => {
  const { code, problemId } = req.body;

  try {
    const problem = await Problem.findById(problemId);
    if (!problem) return res.status(404).json({ error: 'Problem not found' });

    const fullProgram = problem.driverTemplate.replace('{{SOLUTION}}', code);

    const jdoodleRes = await fetch('https://api.jdoodle.com/v1/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: process.env.JDOODLE_CLIENT_ID,
        clientSecret: process.env.JDOODLE_CLIENT_SECRET,
        script: fullProgram,
        language: 'java',
        versionIndex: '4'
      })
    });

    const result = await jdoodleRes.json();
const output = result.output || '';
const match = output.match(/RESULT:(\d+)\/(\d+)/);
const passed = match ? match[1] === match[2] : false;
const passCount = match ? parseInt(match[1]) : 0;
const totalCount = match ? parseInt(match[2]) : 0;

res.json({ output, statusCode: result.statusCode, passed, passCount, totalCount });
  } catch (err) {
    console.error('Execution failed:', err.message);
    res.status(500).json({ error: 'Code execution failed' });
  }
});

module.exports = router;