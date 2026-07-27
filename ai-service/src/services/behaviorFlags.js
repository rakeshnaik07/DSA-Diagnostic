const MEMORIZED_SESSION_TIME_MS = 60000;
const MEMORIZED_FIRST_RUN_DELAY_MS = 15000;

function computeFlags(features = {}) {
  const flags = [];
  const pasteCount = features.paste_count;
  const backspaceCount = features.backspace_count;
  const editChurnScore = features.edit_churn_score;

  if (
    pasteCount >= 1 &&
    backspaceCount <= 1 &&
    (editChurnScore === null || editChurnScore === undefined || editChurnScore < 1.5)
  ) {
    flags.push({
      flag: 'POSSIBLE_PASTED_SOLUTION',
      severity: 'high',
      reason: `paste_count of ${pasteCount} combined with minimal editing activity (backspace_count ${backspaceCount}, edit_churn_score ${editChurnScore}) suggests the solution may have been pasted rather than independently written.`,
    });
  }

  const totalSessionTime = features.total_session_time;
  const firstRunDelay = features.first_run_delay;
  if (
    features.submissions_before_success <= 1 &&
    features.runtime_error_count === 0 &&
    features.wrong_answer_count === 0 &&
    features.compile_failure_count === 0 &&
    totalSessionTime !== null && totalSessionTime !== undefined &&
    totalSessionTime < MEMORIZED_SESSION_TIME_MS &&
    firstRunDelay !== null && firstRunDelay !== undefined &&
    firstRunDelay < MEMORIZED_FIRST_RUN_DELAY_MS
  ) {
    flags.push({
      flag: 'POSSIBLE_MEMORIZED_SOLUTION',
      severity: 'medium',
      reason: `The problem was solved correctly on the first attempt with no errors in under ${totalSessionTime / 1000} seconds, which is unusually fast and may indicate prior familiarity with this exact problem.`,
    });
  }

  return flags;
}

module.exports = { computeFlags };
