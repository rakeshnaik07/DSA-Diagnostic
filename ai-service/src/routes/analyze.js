const express = require('express');
const { analyzeWithGemini } = require('../services/geminiClient');

const router = express.Router();
const SPARSE_FEATURE_NULL_THRESHOLD = 0.6;
const ANALYSIS_TIMEOUT_MS = 30000;

router.post('/', async (req, res) => {
  const { features, problemTitle, code } = req.body || {};
  if (!features || typeof features !== 'object' || Array.isArray(features)) {
    return res.status(400).json({ error: 'features must be an object' });
  }

  const featureValues = Object.values(features);
  const nullFeatureCount = featureValues.filter((value) => value === null || value === undefined).length;
  if (featureValues.length && nullFeatureCount / featureValues.length > SPARSE_FEATURE_NULL_THRESHOLD) {
    return res.status(200).json({
      summary: 'Not enough activity was recorded in this session to generate a meaningful analysis.',
      strengths: [],
      weaknesses: [],
      improvements: [],
      overallScore: null,
      insufficientData: true,
      generatedAt: new Date().toISOString(),
    });
  }

  try {
    const analysis = await Promise.race([
      analyzeWithGemini(features, problemTitle, code),
      new Promise((_, reject) => {
        setTimeout(() => reject(Object.assign(new Error('Gemini analysis timed out'), { code: 'AI_TIMEOUT' })), ANALYSIS_TIMEOUT_MS);
      }),
    ]);
    return res.status(200).json({ ...analysis, generatedAt: new Date().toISOString() });
  } catch (error) {
    if (error.code === 'AI_TIMEOUT') {
      return res.status(504).json({ error: 'AI analysis timed out' });
    }
    if (error.message === 'AI response could not be parsed') {
      return res.status(502).json({ error: error.message });
    }
    console.error('Gemini API call failed:', error.message);
    return res.status(502).json({ error: 'AI analysis service unavailable' });
  }
});

module.exports = router;
