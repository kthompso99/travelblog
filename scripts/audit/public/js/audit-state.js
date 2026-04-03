// ============================================
// Audit Runner Dashboard - State Management
// ============================================
//
// Manages application state, WebSocket connection, and polling timers.
// Contains no business logic or UI rendering - just state container
// and real-time communication infrastructure.
//
// State updates trigger UI re-renders in audit-runner.js coordinator.

// ============================================
// Trip-level Audit Constant
// ============================================

// Must match TRIP_AUDIT_SUBDIR in audit-shared.js
export const TRIP_AUDIT_FILE = '_trip';

// ============================================
// Application State
// ============================================

export const state = {
  trip: null,
  file: null,
  status: null,
  ws: null,
  runningAudits: new Set(),
  config: null,  // Loaded from /api/config
  tripAuditControllers: {},  // AbortControllers for trip audits
  auditTimers: {}  // Timers for showing elapsed time during audits
};

// ============================================
// Audit Timer Management
// ============================================

export function startAuditTimer(key, buttonId) {
  const startTime = Date.now();
  const interval = setInterval(() => {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const button = document.getElementById(buttonId);
    if (button) {
      button.innerHTML = `<span class="spinner"></span>Running... ${elapsed}s`;
    }
  }, 1000);

  state.auditTimers[key] = { interval, startTime };
}

export function stopAuditTimer(key) {
  const timer = state.auditTimers[key];
  if (timer) {
    clearInterval(timer.interval);
    delete state.auditTimers[key];
  }
}

// ============================================
// WebSocket Connection
// ============================================

export function setupWebSocket(onMessage) {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  state.ws = new WebSocket(`${protocol}//${window.location.host}`);

  state.ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    onMessage(message);
  };

  state.ws.onclose = () => {
    console.log('[WS] Connection closed, reconnecting in 3s...');
    setTimeout(() => setupWebSocket(onMessage), 3000);
  };
}

// ============================================
// Status Polling
// ============================================

let statusPollInterval = null;

export function startStatusPolling(callback) {
  if (statusPollInterval) return; // Already polling

  statusPollInterval = setInterval(async () => {
    if (state.trip) {
      await callback(true); // isBackgroundPoll = true
    }
  }, 5000); // 5 seconds
}

export function stopStatusPolling() {
  if (statusPollInterval) {
    clearInterval(statusPollInterval);
    statusPollInterval = null;
  }
}

// ============================================
// Notification Sound
// ============================================

export function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800; // Hz
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (err) {
    console.log('Could not play notification sound:', err);
  }
}
