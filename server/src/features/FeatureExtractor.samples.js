const { extractFeatures } = require('./FeatureExtractor');

const event = (type, timestamp, metadata = {}) => ({ type, timestamp, metadata });

const samples = {
  clean_solve: [
    event('session_started', '2026-01-01T00:00:00.000Z'),
    event('first_keypress', '2026-01-01T00:00:05.000Z'),
    event('typing_started', '2026-01-01T00:00:05.000Z'),
    event('code_changed', '2026-01-01T00:00:06.000Z', { inserted: 20 }),
    event('typing_stopped', '2026-01-01T00:00:15.000Z'),
    event('run_clicked', '2026-01-01T00:00:20.000Z'),
    event('accepted', '2026-01-01T00:00:22.000Z'),
    event('submit_clicked', '2026-01-01T00:00:24.000Z'),
    event('submission_completed', '2026-01-01T00:00:25.000Z', { solved: true }),
    event('session_ended', '2026-01-01T00:00:26.000Z'),
  ],
  pattern_gap: [
    event('session_started', '2026-01-01T00:00:00.000Z'),
    event('first_keypress', '2026-01-01T00:00:35.000Z'),
    event('idle_started', '2026-01-01T00:00:36.000Z'),
    event('idle_ended', '2026-01-01T00:01:30.000Z'),
    event('run_clicked', '2026-01-01T00:01:40.000Z'),
    event('wrong_answer', '2026-01-01T00:01:42.000Z'),
    event('session_ended', '2026-01-01T00:01:45.000Z'),
  ],
  implementation_gap: [
    event('session_started', '2026-01-01T00:00:00.000Z'),
    event('first_keypress', '2026-01-01T00:00:03.000Z'),
    event('code_changed', '2026-01-01T00:00:04.000Z', { inserted: 40 }),
    event('run_clicked', '2026-01-01T00:00:20.000Z'),
    event('compile_failure', '2026-01-01T00:00:21.000Z'),
    event('backspace', '2026-01-01T00:00:25.000Z'),
    event('run_clicked', '2026-01-01T00:00:40.000Z'),
    event('wrong_answer', '2026-01-01T00:00:41.000Z'),
    event('session_ended', '2026-01-01T00:00:45.000Z'),
  ],
  time_pressure: [
    event('session_started', '2026-01-01T00:00:00.000Z'),
    event('first_keypress', '2026-01-01T00:00:01.000Z'),
    event('typing_started', '2026-01-01T00:00:01.000Z'),
    event('code_changed', '2026-01-01T00:00:02.000Z', { inserted: 10, deleted: 2 }),
    event('submit_clicked', '2026-01-01T00:00:08.000Z'),
    event('wrong_answer', '2026-01-01T00:00:09.000Z'),
    event('session_ended', '2026-01-01T00:00:10.000Z'),
  ],
};

for (const [name, events] of Object.entries(samples)) {
  const result = extractFeatures({ events });
  console.log(`\n=== ${name} ===`);
  console.log(JSON.stringify(result, null, 2));
}
