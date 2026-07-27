const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const { extractFeatures } = require('../features/FeatureExtractor');

const TELEMETRY_TYPES = new Set([
  'session_started', 'problem_loaded', 'session_ended',
  'first_keypress', 'typing_started', 'typing_stopped', 'code_changed',
  'backspace', 'paste', 'undo', 'redo',
  'idle_started', 'idle_ended',
  'run_clicked', 'compile_success', 'compile_failure', 'runtime_error',
  'wrong_answer', 'accepted', 'execution_completed',
  'submit_clicked', 'submission_completed',
  'tab_hidden', 'tab_visible', 'window_blur', 'window_focus',
  // Existing records may contain these legacy events.
  'idle_gap', 'edit_churn',
]);

function validateEvents(events) {
  if (!Array.isArray(events)) return { valid: false, error: 'events must be an array' };
  if (events.length > 500) return { valid: false, error: 'too many events in one request' };
  for (const event of events) {
    if (!event || typeof event !== 'object' || typeof event.type !== 'string' || !event.type.trim()) {
      return { valid: false, error: 'each event requires a type' };
    }
    if (!TELEMETRY_TYPES.has(event.type)) return { valid: false, error: `unsupported event type: ${event.type}` };
    if (event.timestamp === undefined || event.timestamp === null) {
      return { valid: false, error: 'each event requires a timestamp' };
    }
    if (event.metadata !== undefined && (typeof event.metadata !== 'object' || Array.isArray(event.metadata))) {
      return { valid: false, error: 'event metadata must be an object' };
    }
  }
  return { valid: true };
}

function appendUniqueEvents(session, events) {
  const existingIds = new Set((session.events || []).map((event) => event.metadata?.eventId).filter(Boolean));
  const unique = events.filter((event) => !event.metadata?.eventId || !existingIds.has(event.metadata.eventId));
  session.events.push(...unique);
  return unique.length;
}

router.post('/', async (req, res) => {
  try {
    const eventCheck = validateEvents(req.body.events || []);
    if (!eventCheck.valid) return res.status(400).json({ error: eventCheck.error });
    const session = new Session(req.body);
    const extracted = extractFeatures(session.toObject());
    session.features = extracted.features;
    await session.save();
    res.json(session);
  } catch (err) {
    console.error('Failed to save session:', err.message);
    res.status(500).json({ error: 'Could not save session' });
  }
});

router.patch('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    if (req.body.events !== undefined) {
      const eventCheck = validateEvents(req.body.events);
      if (!eventCheck.valid) return res.status(400).json({ error: eventCheck.error });
      appendUniqueEvents(session, req.body.events);
    }

    if (req.body.firstLineTimeMs !== undefined) {
      session.firstLineTimeMs = req.body.firstLineTimeMs;
    }
    if (req.body.submitTimeMs !== undefined) {
      session.submitTimeMs = req.body.submitTimeMs;
    }
    if (req.body.solved !== undefined) {
      session.solved = req.body.solved;
    }
    if (req.body.finalCode !== undefined) {
      session.finalCode = req.body.finalCode;
    }
    session.features = extractFeatures(session.toObject()).features;

    await session.save();
    res.json(session);
  } catch (err) {
    console.error('Failed to patch session:', err.message);
    res.status(500).json({ error: 'Could not update session' });
  }
});

// Append telemetry without exposing the rest of the session update contract.
// This is also suitable for small keepalive/unload flushes from the browser.
router.post('/:id/events', async (req, res) => {
  try {
    const eventCheck = validateEvents(req.body.events);
    if (!eventCheck.valid) return res.status(400).json({ error: eventCheck.error });
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    const appended = appendUniqueEvents(session, req.body.events);
    session.features = extractFeatures(session.toObject()).features;
    await session.save();
    res.json({ appended, totalEvents: session.events.length });
  } catch (err) {
    console.error('Failed to append session events:', err.message);
    res.status(500).json({ error: 'Could not append session events' });
  }
});

router.post('/:id/analyze', async (req, res) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const session = await Session.findById(req.params.id).populate('problemId', 'title');
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (!session.features || typeof session.features !== 'object' || Object.keys(session.features).length === 0) {
      return res.status(400).json({ error: 'Session has no extracted features yet' });
    }
    const body = { features: session.features };
    if (session.problemId?.title) body.problemTitle = session.problemId.title;
    if (typeof session.finalCode === 'string' && session.finalCode.trim()) body.code = session.finalCode;
    const response = await fetch(`${process.env.AI_SERVICE_URL || 'http://localhost:8000'}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = await response.json();
    if (!response.ok) return res.status(response.status).json(payload);
    const report = {
      summary: payload.summary,
      overallScore: payload.overallScore,
      insufficientData: payload.insufficientData === true,
      strengths: payload.strengths,
      weaknesses: payload.weaknesses,
      improvements: payload.improvements,
      generatedAt: new Date(),
    };
    session.aiReport = report;
    await session.save();
    res.json({ session, report });
  } catch (err) {
    console.error('AI analysis request failed:', err.message);
    res.status(502).json({ error: 'AI analysis service unavailable' });
  } finally {
    clearTimeout(timeout);
  }
});

router.get('/solved', async (req, res) => {
  try {
    const sessions = await Session.find({ solved: true }).populate('problemId', 'title difficulty category').lean();
    res.json(sessions);
  } catch (err) {
    console.error('Failed to fetch solved sessions:', err.message);
    res.status(500).json({ error: 'Could not fetch solved sessions' });
  }
});

router.get('/count', async (req, res) => {
  try {
    const total = await Session.countDocuments({});
    res.json({ total });
  } catch (err) {
    console.error('Failed to get session counts:', err.message);
    res.status(500).json({ error: 'Could not get session counts' });
  }
});

module.exports = router;
