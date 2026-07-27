const { GoogleGenerativeAI } = require('@google/generative-ai');
const { buildAnalysisPrompt } = require('../prompts/analysisPrompt');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is missing. Add it to the environment before starting ai-service.');
  process.exit(1);
}

const client = new GoogleGenerativeAI(apiKey);
const model = client.getGenerativeModel({
  model: 'gemini-3.1-flash-lite',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'object',
      properties: {
        summary: { type: 'string' },
        overallScore: { type: 'number' },
        strengths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              point: { type: 'string' },
              evidence: { type: 'string' },
            },
            required: ['point', 'evidence'],
          },
        },
        weaknesses: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              point: { type: 'string' },
              evidence: { type: 'string' },
              severity: { type: 'string', enum: ['low', 'medium', 'high'] },
            },
            required: ['point', 'evidence', 'severity'],
          },
        },
        improvements: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string' },
              reason: { type: 'string' },
            },
            required: ['action', 'reason'],
          },
        },
      },
      required: ['summary', 'strengths', 'weaknesses', 'improvements', 'overallScore'],
    },
  },
});

function stripCodeFences(text) {
  return text.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

function validateAnalysisShape(analysis) {
  if (!analysis || typeof analysis !== 'object' || Array.isArray(analysis)) return false;
  if (Object.keys(analysis).sort().join('|') !== 'improvements|overallScore|strengths|summary|weaknesses') return false;
  if (typeof analysis.summary !== 'string') return false;
  if (typeof analysis.overallScore !== 'number' || analysis.overallScore < 1 || analysis.overallScore > 10) return false;
  if (!Array.isArray(analysis.strengths) || !Array.isArray(analysis.weaknesses) || !Array.isArray(analysis.improvements)) return false;
  if (analysis.strengths.length > 3 || analysis.weaknesses.length > 3 || analysis.improvements.length > 3) return false;
  if (!analysis.strengths.every((item) => item && typeof item.point === 'string' && typeof item.evidence === 'string')) return false;
  if (!analysis.weaknesses.every((item) => item && typeof item.point === 'string' && typeof item.evidence === 'string' && ['low', 'medium', 'high'].includes(item.severity))) return false;
  return analysis.improvements.every((item) => item && typeof item.action === 'string' && typeof item.reason === 'string');
}

async function analyzeWithGemini(features, problemTitle, code) {
  const result = await model.generateContent(buildAnalysisPrompt(features, problemTitle, code));
  const raw = result.response.text();
  const cleaned = stripCodeFences(raw);

  try {
    const analysis = JSON.parse(cleaned);
    if (!validateAnalysisShape(analysis)) throw new Error('Invalid AI response shape');
    return analysis;
  } catch (error) {
    const parseError = new Error('AI response could not be parsed');
    parseError.raw = raw;
    throw parseError;
  }
}

module.exports = { analyzeWithGemini };
