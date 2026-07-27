import { API_BASE_URL, apiFetch } from '../config';

const FLUSH_INTERVAL_MS = 10000;

function makeEventId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export class TelemetryManager {
  constructor({ sessionId, onError } = {}) {
    this.sessionId = sessionId;
    this.onError = onError;
    this.buffer = [];
    this.flushInFlight = false;
    this.flushTimer = null;
  }

  start() {
    this.flushTimer = window.setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
  }

  recordEvent(type, metadata = {}) {
    const event = {
      type,
      timestamp: new Date().toISOString(),
      metadata: { ...metadata, eventId: makeEventId() },
    };
    this.buffer.push(event);
    return event;
  }

  async flush({ keepalive = false } = {}) {
    if (!this.sessionId || this.flushInFlight || this.buffer.length === 0) return;
    this.flushInFlight = true;
    const batch = this.buffer.slice();
    try {
      const response = await apiFetch(`${API_BASE_URL}/api/sessions/${this.sessionId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
        keepalive,
      });
      if (!response.ok) throw new Error(`Telemetry flush failed (${response.status})`);
      this.buffer = this.buffer.filter((event) => !batch.includes(event));
    } catch (error) {
      this.onError?.(error);
    } finally {
      this.flushInFlight = false;
    }
  }

  stop() {
    if (this.flushTimer) window.clearInterval(this.flushTimer);
    this.flushTimer = null;
  }

  destroy() {
    this.stop();
    return this.flush({ keepalive: true });
  }
}
