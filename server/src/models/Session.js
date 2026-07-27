const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  type: { type: String, required: true, trim: true },
  // New telemetry uses ISO timestamps and metadata. Legacy numeric timestamps
  // and legacy event fields remain optional for backwards compatibility.
  timestamp: { type: mongoose.Schema.Types.Mixed, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  durationMs: { type: Number },
  inserted: { type: Number },
  deleted: { type: Number }
}, { _id: false });

const aiReportSchema = new mongoose.Schema({
  summary: { type: String },
  overallScore: { type: Number },
  insufficientData: { type: Boolean, default: false },
  strengths: [{
    point: { type: String },
    evidence: { type: String }
  }],
  weaknesses: [{
    point: { type: String },
    evidence: { type: String },
    severity: { type: String, enum: ['low', 'medium', 'high'] }
  }],
  improvements: [{
    action: { type: String },
    reason: { type: String }
  }],
  generatedAt: { type: Date },
}, { _id: false });

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  events: [eventSchema],
  firstLineTimeMs: { type: Number },
  submitTimeMs: { type: Number },
  solved: { type: Boolean, default: false },
  finalCode: { type: String },
  features: { type: mongoose.Schema.Types.Mixed, default: null },
  aiReport: { type: aiReportSchema, default: null },
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
