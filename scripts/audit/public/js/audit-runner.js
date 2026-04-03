// ============================================
// Audit Runner Dashboard - Main Coordinator
// ============================================
//
// Main entry point that coordinates API calls, state updates, and UI rendering.
// This is the "glue" layer - contains NO business logic (that's on the server),
// NO raw API calls (that's in audit-api.js), and NO DOM manipulation (that's in audit-ui.js).
//
// Pattern: Fetch data → Update state → Render UI
//
// Business logic lives in: scripts/audit/audit-shared.js, audit-status.js, etc.

import * as API from './audit-api.js';
import * as UI from './audit-ui.js';
import { state, TRIP_AUDIT_FILE, setupWebSocket, startStatusPolling, stopStatusPolling, startAuditTimer, stopAuditTimer, playNotificationSound } from './audit-state.js';

// ============================================
// Initialize
// ============================================

async function init() {
  // Get trip from URL
  const path = window.location.pathname.slice(1);
  state.trip = path || 'greece';

  // Load configuration (thresholds, etc.)
  try {
    state.config = await API.fetchConfig();
  } catch (err) {
    console.error('Failed to load config:', err);
    // Fallback to defaults if API fails
    state.config = {
      articleThreshold: 8.5,
      tripThreshold: 8.7
    };
  }

  // Set up WebSocket
  setupWebSocket(handleWebSocketMessage);

  // Load initial status
  await loadStatus();

  // Set up file selector change handler
  document.getElementById('fileSelector').addEventListener('change', async (e) => {
    // Check which provider (if any) is currently displayed
    const previewContent = document.getElementById('previewContent');
    const previousProvider = previewContent.dataset.provider;
    console.log('[File Selector] Previous provider:', previousProvider, 'New file:', e.target.value);

    // Update file and reload status
    state.file = e.target.value;
    await loadStatus();

    // Auto-load same provider's output for new file if one was displayed
    if (previousProvider) {
      console.log('[File Selector] Auto-loading', previousProvider, 'output for', state.file);
      loadAuditOutput(previousProvider);
    } else {
      console.log('[File Selector] No previous provider, skipping auto-load');
    }
  });

  // Set up ESC key handler for modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const commitModal = document.getElementById('commitModal');
      const rankingsModal = document.getElementById('rankingsModal');
      const historyModal = document.getElementById('historyModal');

      if (commitModal.classList.contains('show')) {
        UI.closeCommitModal();
      } else if (rankingsModal.classList.contains('show')) {
        UI.closeRankings();
      } else if (historyModal.classList.contains('show')) {
        UI.closeHistory();
      }
    }
  });

  // Start status polling
  startStatusPolling(loadStatus);

  // Stop polling on page unload
  window.addEventListener('beforeunload', stopStatusPolling);
}

// ============================================
// WebSocket Message Handler
// ============================================

function handleWebSocketMessage(message) {
  if (message.type === 'audit-complete') {
    console.log(`[WS] Audit completed: ${message.provider} on ${message.file}`);

    // Stop timer
    stopAuditTimer(`${message.provider}-${message.file}`);

    // Play notification sound
    playNotificationSound();

    // Remove from running set
    state.runningAudits.delete(`${message.provider}-${message.file}`);

    // Reload status
    loadStatus();

    // Auto-load the output in preview pane
    if (message.file === state.file) {
      loadAuditOutput(message.provider);
    }

    // Refresh rankings if modal is open
    const modal = document.getElementById('rankingsModal');
    if (modal && modal.classList.contains('show')) {
      const titleText = document.getElementById('rankingsTitle').textContent;
      if (titleText.includes(UI.getProviderLabel(message.provider))) {
        showRankings(message.provider);
      }
    }
  }

  if (message.type === 'audit-error') {
    console.error(`[WS] Audit failed: ${message.error}`);
    state.runningAudits.delete(`${message.provider}-${message.file}`);
    alert(`Audit failed: ${message.error}`);
    loadStatus();
  }

  if (message.type === 'audit-stopped') {
    console.log(`[WS] Audit stopped: ${message.provider} on ${message.file}`);
    state.runningAudits.delete(`${message.provider}-${message.file}`);
    loadStatus();
  }
}

// ============================================
// Load Trip Status
// ============================================

async function loadStatus(isBackgroundPoll = false) {
  try {
    const data = await API.fetchStatus(state.trip);

    state.status = data;

    // Use recent file if no file selected
    if (!state.file && data.recentFile) {
      state.file = data.recentFile;
    }

    // Update UI - but skip full re-render during background polls if audit is running
    // (WebSocket handles real-time updates for running audits)
    if (!isBackgroundPoll || state.runningAudits.size === 0) {
      UI.updateTripName(state.trip);
      UI.updateFileSelector(data.files, state.file);
      await updateProviders();
    } else {
      // Only update commit buttons during background poll (no re-render)
      const fileStatus = state.status?.files?.find(f => f.file === state.file);
      if (fileStatus) {
        UI.updateCommitButtons(fileStatus, state.file);
      }
    }
  } catch (err) {
    console.error('Failed to load status:', err);
  }
}

// ============================================
// Update Providers UI
// ============================================

async function updateProviders() {
  const container = document.getElementById('providers');
  container.innerHTML = '';

  if (!state.file || !state.status) {
    container.innerHTML = '<div class="no-audit">Select a file to view audit status</div>';
    return;
  }

  // Handle trip audit mode
  if (state.file === TRIP_AUDIT_FILE) {
    const tripStatus = await API.fetchTripAuditStatus(state.trip);
    ['opus', 'gpt'].forEach(provider => {
      const providerData = tripStatus[provider];
      const card = UI.createTripProviderCard(provider, providerData, state.tripAuditControllers);
      container.appendChild(card);
    });
    return;
  }

  // Handle regular file mode
  const fileStatus = state.status.files.find(f => f.file === state.file);
  if (!fileStatus) return;

  ['opus', 'gpt'].forEach(provider => {
    const providerData = fileStatus.providers[provider];
    const card = UI.createProviderCard(provider, providerData, state.file, state.runningAudits);
    container.appendChild(card);
  });

  // Update commit buttons
  UI.updateCommitButtons(fileStatus, state.file);
}

// ============================================
// Audit Actions
// ============================================

async function runAudit(provider) {
  if (!state.file) return;

  state.lastProvider = provider;  // Track last used provider
  state.runningAudits.add(`${provider}-${state.file}`);
  await updateProviders();

  try {
    await API.startAudit(state.trip, state.file, provider);

    console.log(`[AUDIT] Started ${provider} audit on ${state.file}`);

    // Start elapsed timer
    const buttonId = `runBtn-${provider}-${state.file}`;
    startAuditTimer(`${provider}-${state.file}`, buttonId);
  } catch (err) {
    console.error('Failed to start audit:', err);
    stopAuditTimer(`${provider}-${state.file}`);
    state.runningAudits.delete(`${provider}-${state.file}`);
    await updateProviders();
    alert(`Failed to start audit: ${err.message}`);
  }
}

async function stopAudit(provider) {
  if (!state.file) return;

  try {
    await API.stopAudit(state.trip, state.file, provider);
    console.log(`[AUDIT] Stopping ${provider} audit on ${state.file}`);
  } catch (err) {
    console.error('Failed to stop audit:', err);
    alert(`Failed to stop audit: ${err.message}`);
  }
}

async function runTripAudit(provider) {
  if (!state.trip) {
    alert('No trip loaded');
    return;
  }

  // Create AbortController for this trip audit
  const controller = new AbortController();
  state.tripAuditControllers[provider] = controller;

  // Update UI to show loading state
  await updateProviders();

  // Start elapsed timer
  const buttonId = `runTripBtn-${provider}`;
  startAuditTimer(`trip-${provider}`, buttonId);

  try {
    console.log(`[TRIP AUDIT] Starting ${provider} trip audit on ${state.trip}...`);

    const data = await API.startTripAudit(state.trip, provider, controller.signal);

    if (data.success) {
      console.log(`[TRIP AUDIT] Completed: ${data.mdFilename}`);
      UI.displayTripAuditResults(data.markdown, data.mdFilename, provider, data.scores);
    } else {
      throw new Error(data.error || 'Trip audit failed');
    }

  } catch (err) {
    if (err.name === 'AbortError') {
      console.log(`[TRIP AUDIT] Cancelled ${provider} trip audit`);
    } else {
      console.error('Trip audit failed:', err);
      alert(`Trip audit failed: ${err.message}`);
    }
  } finally {
    stopAuditTimer(`trip-${provider}`);
    delete state.tripAuditControllers[provider];
    await updateProviders();
  }
}

function stopTripAudit(provider) {
  const controller = state.tripAuditControllers[provider];
  if (controller) {
    console.log(`[TRIP AUDIT] Stopping ${provider} trip audit...`);
    controller.abort();
  }
}

async function loadAuditOutput(provider) {
  if (!state.file) return;

  try {
    const markdown = await API.fetchAuditOutput(state.trip, state.file, provider);
    UI.displayAuditOutput(markdown, provider, state.file);
  } catch (err) {
    console.error('Failed to load audit output:', err);
    UI.displayAuditOutputError(err.message);
  }
}

function loadTripAuditOutput(provider) {
  loadAuditOutput(provider);
}

// ============================================
// Rankings Modal
// ============================================

async function showRankings(provider) {
  if (!state.trip) return;

  try {
    const data = await API.fetchRankings(state.trip, provider);
    UI.showRankingsModal(data, state.file);
  } catch (err) {
    console.error('Failed to load rankings:', err);
  }
}

function closeRankings() {
  UI.closeRankings();
}

function closeRankingsIfOutside(event) {
  if (event.target.id === 'rankingsModal') {
    UI.closeRankings();
  }
}

function selectFileFromRankings(fileName) {
  state.file = fileName;
  document.getElementById('fileSelector').value = fileName;
  loadStatus();
  UI.closeRankings();
}

// ============================================
// History Chart Modal
// ============================================

async function showHistory(provider) {
  if (!state.trip) return;

  try {
    const data = await API.fetchHistory(state.trip, provider);
    UI.showHistoryModal(data, state.trip);
  } catch (err) {
    console.error('Failed to load history:', err);
    alert(`Failed to load history: ${err.message}`);
  }
}

function closeHistory() {
  UI.closeHistory();
}

function closeHistoryIfOutside(event) {
  if (event.target.id === 'historyModal') {
    UI.closeHistory();
  }
}

// ============================================
// Commit Modal
// ============================================

function openCommitModal(shouldPush = false) {
  // Get current provider from preview pane
  const previewContent = document.getElementById('previewContent');
  const provider = previewContent.dataset.provider || 'opus';

  // Get file status
  const fileStatus = state.status?.files?.find(f => f.file === state.file);
  if (!fileStatus) return;

  UI.showCommitModal(fileStatus, state.file, state.trip, provider, shouldPush, state.config);
}

function closeCommitModal() {
  UI.closeCommitModal();
}

function closeCommitIfOutside(event) {
  if (event.target.id === 'commitModal') {
    UI.closeCommitModal();
  }
}

async function confirmCommit() {
  const modal = document.getElementById('commitModal');
  const messageInput = document.getElementById('commitMessage');
  const message = messageInput.value.trim();

  // Validate message
  if (!message) {
    alert('Please enter a commit message');
    return;
  }

  const shouldPush = modal.dataset.shouldPush === 'true';

  try {
    // Set loading state
    UI.setCommitButtonLoading(true, shouldPush);
    UI.showCommitError(''); // Clear previous errors

    // Commit file
    console.log('[COMMIT] Committing', state.trip, state.file, 'with message:', message);
    const commitResult = await API.commitFile(state.trip, state.file, message);
    const commitHash = commitResult.commitHash;
    console.log('[COMMIT] Success:', commitHash);

    // If shouldPush, push to remote
    if (shouldPush) {
      console.log('[PUSH] Pushing to remote...');
      try {
        await API.pushToRemote();
        console.log('[PUSH] Success');
        alert(`Committed and pushed successfully (${commitHash})`);
      } catch (pushErr) {
        // Commit succeeded but push failed
        UI.showCommitError(`Committed locally (${commitHash}), but push failed: ${pushErr.message}`);
        UI.setCommitButtonLoading(false, shouldPush);
        return;
      }
    } else {
      alert(`Committed successfully (${commitHash})`);
    }

    // Close modal and reload status
    UI.closeCommitModal();
    await loadStatus();

  } catch (err) {
    console.error('[COMMIT] Error:', err);
    UI.showCommitError(err.message);
    UI.setCommitButtonLoading(false, shouldPush);
  }
}

// ============================================
// Make functions global for onclick handlers
// ============================================

window.runAudit = runAudit;
window.stopAudit = stopAudit;
window.runTripAudit = runTripAudit;
window.stopTripAudit = stopTripAudit;
window.loadAuditOutput = loadAuditOutput;
window.loadTripAuditOutput = loadTripAuditOutput;
window.toggleAllDeltas = UI.toggleAllDeltas;
window.showRankings = showRankings;
window.closeRankings = closeRankings;
window.closeRankingsIfOutside = closeRankingsIfOutside;
window.showHistory = showHistory;
window.closeHistory = closeHistory;
window.closeHistoryIfOutside = closeHistoryIfOutside;
window.selectFileFromRankings = selectFileFromRankings;
window.openCommitModal = openCommitModal;
window.closeCommitModal = closeCommitModal;
window.closeCommitIfOutside = closeCommitIfOutside;
window.confirmCommit = confirmCommit;

// ============================================
// Start App
// ============================================

init();
