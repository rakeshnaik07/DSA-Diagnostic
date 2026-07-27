import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { API_BASE_URL } from '../config';
import { TelemetryManager } from '../telemetry/TelemetryManager';
import { createEditorTelemetry } from '../telemetry/editorTelemetry';
import SessionReport from '../components/SessionReport';
import Modal from '../components/Modal';

function formatElapsed(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

function ExecutionFeedback({ feedback, onDismiss }) {
  const submitLabels = { success: 'Accepted!', wrong_answer: 'Wrong Answer', compile: 'Compile Error', runtime: 'Runtime Error' };
  const runLabels = { success: 'Compiled successfully', wrong_answer: "Output didn't match expected result", compile: 'Compile error', runtime: 'Runtime error' };
  const label = feedback.submit ? submitLabels[feedback.type] : runLabels[feedback.type];
  const tone = feedback.type === 'success' ? 'success' : feedback.type === 'wrong_answer' ? 'warning' : 'error';
  return (
    <div className={`execution-feedback ${tone} ${feedback.submit ? 'submission-feedback' : ''}`}>
      <div><strong>{label || 'Execution failed'}</strong>{feedback.message && <p>{feedback.message}</p>}</div>
      <button type="button" aria-label="Dismiss result" onClick={onDismiss}>×</button>
    </div>
  );
}

function SolveProblem() {
  const { id } = useParams();

  const [problem, setProblem] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [output, setOutput] = useState(null);
  const [runBusy, setRunBusy] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [executionFeedback, setExecutionFeedback] = useState(null);
  const [outputHistory, setOutputHistory] = useState([]);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const [sessionId, setSessionId] = useState(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionStart, setSessionStart] = useState(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [firstLineTime, setFirstLineTime] = useState(null);

  const lastFlushedMetaRef = useRef({ firstLineTimeMs: null });
  const sessionIdRef = useRef(null);
  const sessionCreationRef = useRef(null);
  const telemetryRef = useRef(null);
  const editorRef = useRef(null);
  const editorTelemetryCleanupRef = useRef(null);
  const reportRequestedRef = useRef(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/problems/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProblem(data);
        setCode(data.starterCode);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!sessionStart || sessionEnded) return undefined;
    const updateElapsed = () => setElapsedMs(Date.now() - sessionStart);
    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [sessionStart, sessionEnded]);

  const createSession = useCallback(async (initialData = {}) => {
    if (sessionIdRef.current) return sessionIdRef.current;
    if (sessionCreationRef.current) return sessionCreationRef.current;

    sessionCreationRef.current = fetch(`${API_BASE_URL}/api/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problemId: problem._id,
        events: [],
        firstLineTimeMs: null,
        submitTimeMs: null,
        solved: false,
        finalCode: problem.starterCode,
        ...initialData,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to create session');
        return res.json();
      })
      .then((data) => {
        sessionIdRef.current = data._id;
        setSessionId(data._id);
        if (data.aiReport) {
          setReport(data.aiReport);
          setIsReportModalOpen(true);
        }
        return data._id;
      })
      .finally(() => {
        sessionCreationRef.current = null;
      });

    try {
      return await sessionCreationRef.current;
    } catch (err) {
      console.error('Failed to create session:', err.message);
      return null;
    }
  }, [problem]);

  useEffect(() => {
    if (!sessionStarted) return undefined;
    return () => {
      if (telemetryRef.current) {
        telemetryRef.current.recordEvent('session_ended', { reason: 'problem_change_or_unmount' });
        telemetryRef.current.destroy();
        telemetryRef.current = null;
      }
      editorTelemetryCleanupRef.current?.();
      editorTelemetryCleanupRef.current = null;
    };
  }, [sessionStarted]);

  const startSession = async () => {
    if (!problem || sessionStarted) return;
    const activeSessionId = await createSession();
    if (!activeSessionId) return;
    telemetryRef.current = new TelemetryManager({
      sessionId: activeSessionId,
      onError: (error) => console.error('Telemetry flush failed:', error.message),
    });
    const startedAt = Date.now();
    setSessionStart(startedAt);
    setElapsedMs(0);
    setSessionEnded(false);
    setSessionStarted(true);
    telemetryRef.current.recordEvent('session_started', { problemId: problem._id });
    telemetryRef.current.recordEvent('problem_loaded', { problemId: problem._id });
    telemetryRef.current.start();
    if (editorRef.current) {
      editorTelemetryCleanupRef.current = createEditorTelemetry({ manager: telemetryRef.current, editor: editorRef.current });
    }
  };

  useEffect(() => {
    const onVisibilityChange = () => telemetryRef.current?.recordEvent(document.hidden ? 'tab_hidden' : 'tab_visible');
    const onBlur = () => telemetryRef.current?.recordEvent('window_blur');
    const onFocus = () => telemetryRef.current?.recordEvent('window_focus');
    const onPageHide = () => {
      telemetryRef.current?.recordEvent('session_ended', { reason: 'page_unload' });
      telemetryRef.current?.destroy();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

  const flushSessionMetadata = useCallback(async () => {
    if (!sessionId) return;
    const body = {};

    if (
      firstLineTime !== null &&
      firstLineTime !== lastFlushedMetaRef.current.firstLineTimeMs
    ) {
      body.firstLineTimeMs = firstLineTime;
    }

    if (Object.keys(body).length === 0) return;

    try {
      await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (body.firstLineTimeMs !== undefined) {
        lastFlushedMetaRef.current.firstLineTimeMs = firstLineTime;
      }
    } catch (err) {
      console.error('Failed to flush session events:', err.message);
    }
  }, [sessionId, firstLineTime]);

  useEffect(() => {
    if (!sessionId) return undefined;

    const interval = setInterval(() => {
      flushSessionMetadata();
    }, 10000);

    return () => {
      clearInterval(interval);
      flushSessionMetadata();
    };
  }, [sessionId, flushSessionMetadata]);

  const handleCodeChange = (value = '') => {
    const now = Date.now();

    let firstLineTimeValue = firstLineTime;
    if (
      problem &&
      sessionStart &&
      !firstLineTime &&
      value.trim().length > problem.starterCode.trim().length
    ) {
      firstLineTimeValue = now - sessionStart;
      setFirstLineTime(firstLineTimeValue);
    }

    setCode(value);
  };

  const classifyExecution = (data) => {
    if (data.statusCode && Number(data.statusCode) !== 200) return { type: 'compile', message: data.error || data.output };
    if (data.runtimeError || data.errorType === 'runtime' || data.status === 'runtime_error') return { type: 'runtime', message: data.error || data.output };
    if (data.passed) return { type: 'success' };
    return { type: 'wrong_answer' };
  };

  const executeCode = async () => {
    const res = await fetch(`${API_BASE_URL}/api/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, problemId: problem._id }),
    });
    const data = await res.json();
    const result = classifyExecution(data);
    if (result.type === 'compile') telemetryRef.current?.recordEvent('compile_failure', { statusCode: data.statusCode });
    else if (result.type === 'runtime') telemetryRef.current?.recordEvent('runtime_error');
    else if (result.type === 'success') telemetryRef.current?.recordEvent('accepted', { passCount: data.passCount, totalCount: data.totalCount });
    else telemetryRef.current?.recordEvent('wrong_answer', { passCount: data.passCount, totalCount: data.totalCount });
    telemetryRef.current?.recordEvent('execution_completed', { passed: Boolean(data.passed), statusCode: data.statusCode });
    return { data, result };
  };

  const handleRun = async () => {
    if (!sessionStarted || runBusy || submitBusy) return;
    setRunBusy(true);
    setExecutionFeedback(null);
    setOutputHistory((history) => [...history, { text: '> Running...' }].slice(-6));
    telemetryRef.current?.recordEvent('run_clicked');
    try {
      const { data, result } = await executeCode();
      setOutput(data);
      setExecutionFeedback(result);
      const line = result.type === 'success' ? '✓ Compiled successfully' : result.type === 'wrong_answer' ? "! Output didn't match expected result" : `${result.type === 'runtime' ? '✗ Runtime error' : '✗ Compile error'}${result.message ? `: ${result.message}` : ''}`;
      setOutputHistory((history) => [...history, { text: line, tone: result.type === 'success' ? 'positive' : result.type === 'wrong_answer' ? 'accent' : 'negative' }].slice(-6));
    } catch (err) {
      setExecutionFeedback({ type: 'error', message: err.message });
      setOutputHistory((history) => [...history, { text: `✗ Run failed: ${err.message}`, tone: 'negative' }].slice(-6));
    } finally {
      setRunBusy(false);
    }
  };

  const handleSubmit = async () => {
    if (!sessionStarted || runBusy || submitBusy) return;
    setSubmitBusy(true);
    setExecutionFeedback(null);
    setOutputHistory((history) => [...history, { text: '> Judging...' }].slice(-6));
    telemetryRef.current?.recordEvent('submit_clicked');
    try {
      const { data: runData, result } = await executeCode();
      telemetryRef.current?.recordEvent('submission_completed', { solved: Boolean(runData.passed) });
      await telemetryRef.current?.flush();
      setExecutionFeedback({ ...result, submit: true });
      const line = result.type === 'success' ? '✓ Accepted!' : result.type === 'wrong_answer' ? '✗ Wrong Answer' : `${result.type === 'runtime' ? '✗ Runtime Error' : '✗ Compile Error'}${result.message ? `: ${result.message}` : ''}`;
      setOutputHistory((history) => [...history, { text: line, tone: result.type === 'success' ? 'positive' : 'negative' }].slice(-6));

      const body = {
        submitTimeMs: Date.now() - sessionStart,
        solved: runData.passed,
        finalCode: code,
      };

      let activeSessionId;
      try {
        activeSessionId = sessionId || sessionIdRef.current || (sessionCreationRef.current && await sessionCreationRef.current);
        if (activeSessionId) {
          await fetch(`${API_BASE_URL}/api/sessions/${activeSessionId}`, {
            method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
          });
        } else {
          const created = await fetch(`${API_BASE_URL}/api/sessions`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ problemId: problem._id, events: [], firstLineTimeMs: firstLineTime, ...body }),
          });
          const createdData = await created.json();
          activeSessionId = createdData._id;
          sessionIdRef.current = activeSessionId;
          setSessionId(activeSessionId);
        }
      } catch (err) {
        console.error('Failed to save session on submit:', err.message);
      }

      setOutput(runData);
      if (runData.passed) {
        setElapsedMs(Date.now() - sessionStart);
        setSessionEnded(true);
        generateReport(activeSessionId);
      }
    } catch (err) {
      setExecutionFeedback({ type: 'error', message: err.message, submit: true });
      setOutputHistory((history) => [...history, { text: `✗ Submit failed: ${err.message}`, tone: 'negative' }].slice(-6));
    } finally {
      setSubmitBusy(false);
    }
  };

  const generateReport = async () => {
    const activeSessionId = sessionId || sessionIdRef.current;
    if (!activeSessionId || reportRequestedRef.current || report) return;
    reportRequestedRef.current = true;
    setIsReportModalOpen(true);
    setReportLoading(true);
    setReportError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${activeSessionId}/analyze`, { method: 'POST' });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Could not generate session report');
      setReport(payload.report);
    } catch (err) {
      setReportError(err.message);
      reportRequestedRef.current = false;
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <main className="solve-layout">
      <section className="problem-panel">
        <div className="solve-heading"><span className={`difficulty ${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span><span className="muted">{problem.category}</span></div>
        <h1>{problem.title}</h1>
        <p className="description">{problem.description}</p>
        <div className="examples"><p className="eyebrow">EXAMPLES</p>{(problem.testCases || []).map((test, index) => <div className="example" key={`${test.input}-${index}`}><strong>Example {index + 1}</strong><p>Input <code>{test.input}</code></p><p>Output <code>{test.expectedOutput}</code></p></div>)}</div>
      </section>
      <section className="editor-panel">

      <div className="session-toolbar"><div><span className="eyebrow">SESSION TIME</span><strong>{formatElapsed(elapsedMs)}</strong></div>{!sessionStarted && <button className="button primary start-button" onClick={startSession}>Start Session</button>}</div>

      <Editor
        height="480px"
        defaultLanguage="java"
        value={code}
        onChange={handleCodeChange}
        onMount={(editor) => {
          editorRef.current = editor;
          if (telemetryRef.current) {
            editorTelemetryCleanupRef.current = createEditorTelemetry({ manager: telemetryRef.current, editor });
          }
        }}
        theme="vs-dark"
        options={{ fontSize: Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue('--text-sm'), 10), fontFamily: getComputedStyle(document.documentElement).getPropertyValue('--font-mono'), minimap: { enabled: false }, padding: { top: Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue('--space-2'), 10) } }}
      />

      <div className="editor-actions"><button className="button secondary" onClick={handleRun} disabled={!sessionStarted || runBusy || submitBusy}>{runBusy ? '◌ Running...' : 'Run'}</button><button className="button primary" onClick={handleSubmit} disabled={!sessionStarted || runBusy || submitBusy}>{submitBusy ? '◌ Judging...' : 'Submit'}</button></div>

      {executionFeedback && <ExecutionFeedback feedback={executionFeedback} onDismiss={() => setExecutionFeedback(null)} />}

      {(outputHistory.length > 0 || output) && (
        <div className="console terminal-strip">
          <div className="console-label">RECENT ACTIVITY</div>
          <div className="terminal-lines">
            {outputHistory.map((line, index) => <div className={line.tone ? `terminal-${line.tone}` : ''} key={`${line.text}-${index}`}>{line.text}</div>)}
            {output && <pre className="terminal-output">{output.stdout || output.output || JSON.stringify(output, null, 2)}</pre>}
          </div>
        </div>
      )}

      {report && <button className="view-report-button" type="button" onClick={() => setIsReportModalOpen(true)}>View Report</button>}

      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)}>
        <SessionReport
          report={report}
          loading={reportLoading}
          error={reportError}
          onGenerate={generateReport}
          onRetry={generateReport}
        />
      </Modal>

      {firstLineTime !== null && (
        <p>First typing after: {firstLineTime} ms</p>
      )}

      </section>
    </main>
  );
}

export default SolveProblem;
