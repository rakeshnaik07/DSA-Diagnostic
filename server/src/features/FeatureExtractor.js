const MS_PER_SECOND = 1000;
const IDLE_THRESHOLD_MS = 1000;

const NUMERIC_FEATURES = [
  'total_session_time', 'active_time', 'idle_time', 'hidden_tab_time', 'focus_loss_time',
  'first_keypress_delay', 'first_run_delay', 'first_submit_delay', 'average_idle_duration',
  'maximum_idle_duration', 'idle_frequency', 'idle_before_first_run', 'idle_before_submit',
  'total_typing_time', 'typing_bursts', 'average_typing_burst', 'inserted_characters',
  'deleted_characters', 'backspace_count', 'undo_count', 'redo_count', 'paste_count',
  'edit_operations', 'insertion_ratio', 'deletion_ratio', 'edit_churn_score',
  'average_characters_per_edit', 'average_time_between_edits', 'run_count',
  'compile_success_count', 'compile_failure_count', 'runtime_error_count', 'wrong_answer_count',
  'accepted_count', 'compile_failure_rate', 'success_after_failures', 'submission_count',
  'accepted_submission', 'submissions_before_success', 'active_time_ratio',
  'productive_typing_ratio', 'thinking_ratio', 'execution_ratio', 'editing_ratio',
];

function timestampOf(event) {
  const value = typeof event?.timestamp === 'number' ? event.timestamp : Date.parse(event?.timestamp);
  return Number.isFinite(value) ? value : null;
}

function metadataOf(event) {
  return event?.metadata && typeof event.metadata === 'object' ? event.metadata : {};
}

function durationBetween(start, end) {
  return start !== null && end !== null && end >= start ? end - start : null;
}

function sum(values) {
  return values.length ? values.reduce((total, value) => total + value, 0) : 0;
}

function average(values) {
  return values.length ? sum(values) / values.length : null;
}

function intervalTotal(events, startTypes, endTypes, sessionEnd) {
  const starts = [];
  const durations = [];
  for (const event of events) {
    if (startTypes.has(event.type)) starts.push(event.time);
    if (endTypes.has(event.type) && starts.length) {
      const start = starts.shift();
      const duration = durationBetween(start, event.time);
      if (duration !== null) durations.push(duration);
    }
  }
  if (starts.length && sessionEnd !== null) {
    for (const start of starts) {
      const duration = durationBetween(start, sessionEnd);
      if (duration !== null) durations.push(duration);
    }
  }
  return durations;
}

function emptyFeatures() {
  return Object.fromEntries(NUMERIC_FEATURES.map((name) => [name, null]));
}

function extractFeatures(session = {}) {
  const rawEvents = Array.isArray(session.events) ? session.events : [];
  const validation = { malformedEvents: 0, duplicateEvents: 0, outOfOrderEvents: 0, warnings: [] };
  const seen = new Set();
  const events = [];

  for (const raw of rawEvents) {
    const time = timestampOf(raw);
    if (!raw || typeof raw.type !== 'string' || time === null) {
      validation.malformedEvents += 1;
      continue;
    }
    const metadata = metadataOf(raw);
    const key = metadata.eventId || `${raw.type}|${time}|${JSON.stringify(metadata)}`;
    if (seen.has(key)) {
      validation.duplicateEvents += 1;
      continue;
    }
    seen.add(key);
    if (raw.type === 'idle_gap') {
      const duration = Number(raw.durationMs) || 0;
      events.push({ type: 'idle_started', metadata: { ...metadata, legacy: true }, time });
      if (duration > 0) events.push({ type: 'idle_ended', metadata: { ...metadata, legacy: true }, time: time + duration });
    } else if (raw.type === 'edit_churn') {
      events.push({ type: 'code_changed', metadata: { ...metadata, inserted: raw.inserted || 0, deleted: raw.deleted || 0, legacy: true }, time });
    } else {
      events.push({ ...raw, metadata, time });
    }
  }

  const chronological = [...events].sort((a, b) => a.time - b.time);
  if (events.some((event, index) => index > 0 && event.time < events[index - 1].time)) {
    validation.outOfOrderEvents = 1;
    validation.warnings.push('events were sorted chronologically');
  }
  const features = emptyFeatures();
  const sessionStart = chronological.find((event) => event.type === 'session_started')?.time ?? chronological[0]?.time ?? null;
  const sessionEnd = chronological.find((event) => event.type === 'session_ended')?.time ?? null;
  const effectiveEnd = sessionEnd ?? timestampOf({ timestamp: session.submitTimeMs }) ?? chronological.at(-1)?.time ?? null;
  if (sessionEnd === null) validation.warnings.push('session_ended is missing');

  const idleDurations = intervalTotal(chronological, new Set(['idle_started']), new Set(['idle_ended']), effectiveEnd);
  const hiddenDurations = intervalTotal(chronological, new Set(['tab_hidden']), new Set(['tab_visible']), effectiveEnd);
  const focusDurations = intervalTotal(chronological, new Set(['window_blur']), new Set(['window_focus']), effectiveEnd);
  const typingDurations = intervalTotal(chronological, new Set(['typing_started']), new Set(['typing_stopped']), effectiveEnd);
  const firstKeypress = chronological.find((event) => event.type === 'first_keypress')?.time;
  const firstRun = chronological.find((event) => event.type === 'run_clicked')?.time;
  const firstSubmit = chronological.find((event) => event.type === 'submit_clicked')?.time;
  const edits = chronological.filter((event) => event.type === 'code_changed');
  const editTimes = edits.map((event) => event.time);
  const inserted = sum(edits.map((event) => Number(event.metadata.inserted) || Number(event.inserted) || 0));
  const deleted = sum(edits.map((event) => Number(event.metadata.deleted) || Number(event.deleted) || 0));
  const editOperations = edits.length;
  const totalChanged = inserted + deleted;
  const runs = chronological.filter((event) => event.type === 'run_clicked').length;
  const compileFailures = chronological.filter((event) => event.type === 'compile_failure').length;
  const compileSuccesses = chronological.filter((event) => event.type === 'compile_success').length;
  const accepted = chronological.filter((event) => event.type === 'accepted').length;
  const firstAcceptedEvent = chronological.find((event) => event.type === 'accepted');
  const submissions = chronological.filter((event) => event.type === 'submit_clicked');
  const firstAccepted = chronological.find((event) => event.type === 'accepted' || event.type === 'submission_completed' && event.metadata.solved === true)?.time;
  const firstRunTime = firstRun ?? null;
  const activeTime = sessionStart !== null && effectiveEnd !== null ? Math.max(0, effectiveEnd - sessionStart - sum(idleDurations) - sum(hiddenDurations) - sum(focusDurations)) : null;
  const totalTime = durationBetween(sessionStart, effectiveEnd);

  features.total_session_time = totalTime;
  features.idle_time = sum(idleDurations);
  features.hidden_tab_time = sum(hiddenDurations);
  features.focus_loss_time = sum(focusDurations);
  features.active_time = activeTime;
  features.first_keypress_delay = durationBetween(sessionStart, firstKeypress);
  features.first_run_delay = durationBetween(sessionStart, firstRun);
  features.first_submit_delay = durationBetween(sessionStart, firstSubmit);
  features.average_idle_duration = average(idleDurations);
  features.maximum_idle_duration = idleDurations.length ? Math.max(...idleDurations) : null;
  features.idle_frequency = totalTime ? idleDurations.length / (totalTime / MS_PER_SECOND) : null;
  features.idle_before_first_run = firstRunTime === null ? null : idleDurations.filter((_, index) => chronological.filter((event) => event.type === 'idle_started')[index]?.time < firstRunTime).length;
  features.idle_before_submit = firstSubmit === null ? null : idleDurations.filter((_, index) => chronological.filter((event) => event.type === 'idle_started')[index]?.time < firstSubmit).length;
  features.total_typing_time = sum(typingDurations);
  features.typing_bursts = typingDurations.length || null;
  features.average_typing_burst = average(typingDurations);
  features.inserted_characters = inserted;
  features.deleted_characters = deleted;
  features.backspace_count = chronological.filter((event) => event.type === 'backspace').length;
  features.undo_count = chronological.filter((event) => event.type === 'undo').length;
  features.redo_count = chronological.filter((event) => event.type === 'redo').length;
  features.paste_count = chronological.filter((event) => event.type === 'paste').length;
  features.edit_operations = editOperations;
  features.insertion_ratio = totalChanged ? inserted / totalChanged : null;
  features.deletion_ratio = totalChanged ? deleted / totalChanged : null;
  features.edit_churn_score = totalChanged ? (inserted + deleted) / Math.max(inserted, 1) : null;
  features.average_characters_per_edit = editOperations ? totalChanged / editOperations : null;
  features.average_time_between_edits = editTimes.length > 1 ? average(editTimes.slice(1).map((time, index) => time - editTimes[index])) : null;
  features.run_count = runs;
  features.compile_success_count = compileSuccesses;
  features.compile_failure_count = compileFailures;
  features.runtime_error_count = chronological.filter((event) => event.type === 'runtime_error').length;
  features.wrong_answer_count = chronological.filter((event) => event.type === 'wrong_answer').length;
  features.accepted_count = accepted;
  features.compile_failure_rate = runs ? compileFailures / runs : null;
  const failuresBeforeSuccess = firstAcceptedEvent ? chronological.filter((event) => event.time < firstAcceptedEvent.time && ['compile_failure', 'runtime_error', 'wrong_answer'].includes(event.type)).length : 0;
  features.success_after_failures = firstAcceptedEvent && failuresBeforeSuccess > 0 ? 1 : 0;
  features.submission_count = submissions.length;
  features.accepted_submission = firstAccepted !== undefined ? 1 : 0;
  features.submissions_before_success = firstAccepted === undefined ? submissions.length : submissions.filter((event) => event.time < firstAccepted).length;

  const typingTime = features.total_typing_time || 0;
  const executionTime = firstRun !== null && effectiveEnd !== null ? Math.max(0, effectiveEnd - firstRun) : null;
  const editingTime = editTimes.length > 1 ? Math.max(0, editTimes.at(-1) - editTimes[0]) : null;
  features.active_time_ratio = totalTime ? activeTime / totalTime : null;
  features.productive_typing_ratio = activeTime ? typingTime / activeTime : null;
  features.thinking_ratio = totalTime ? Math.max(0, (activeTime ?? 0) - typingTime) / totalTime : null;
  features.execution_ratio = totalTime && executionTime !== null ? executionTime / totalTime : null;
  features.editing_ratio = totalTime && editingTime !== null ? editingTime / totalTime : null;

  return { features, validation };
}

module.exports = { extractFeatures, NUMERIC_FEATURES };
