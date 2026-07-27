require('dotenv').config();
const mongoose = require('mongoose');
const Session = require('../models/Session');
const { extractFeatures } = require('./FeatureExtractor');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const sessions = await Session.find({});
  for (const session of sessions) {
    session.features = extractFeatures(session.toObject()).features;
    await session.save();
  }
  console.log(`Backfilled features for ${sessions.length} sessions`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error('Feature backfill failed:', error.message);
  await mongoose.disconnect();
  process.exitCode = 1;
});
