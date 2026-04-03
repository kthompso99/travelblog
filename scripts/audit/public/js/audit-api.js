// ============================================
// Audit Runner Dashboard - API Client
// ============================================
//
// Thin wrapper around fetch calls to the audit server backend.
// All business logic lives on the server in scripts/audit/*.js
//
// This module contains NO business logic - just HTTP communication.
// Returns raw promises from fetch calls. Error handling and UI updates
// happen in the coordinator (audit-runner.js).
//
// Server endpoints defined in: scripts/audit/audit-server.js

// ============================================
// Configuration
// ============================================

export async function fetchConfig() {
  const response = await fetch('/api/config');
  return response.json();
}

// ============================================
// Status & File Information
// ============================================

export async function fetchStatus(trip) {
  const response = await fetch(`/api/status/${trip}`);
  return response.json();
}

export async function fetchTripAuditStatus(trip) {
  const status = {
    opus: { hasAudit: false, scores: null, lastModified: null },
    gpt: { hasAudit: false, scores: null, lastModified: null }
  };

  for (const provider of ['opus', 'gpt']) {
    try {
      // Check if audit markdown exists
      const mdResponse = await fetch(`/api/audit/${trip}/_trip/${provider}.md`);
      if (mdResponse.ok) {
        status[provider].hasAudit = true;
        status[provider].lastModified = 'Available';

        // Load JSON scores
        const jsonResponse = await fetch(`/api/trip-audit-scores/${trip}/${provider}`);
        if (jsonResponse.ok) {
          const data = await jsonResponse.json();
          status[provider].scores = data.scores;
          status[provider].lastModified = data.lastModified || 'Available';
        }
      }
    } catch (err) {
      console.log(`No ${provider} trip audit found:`, err);
    }
  }

  return status;
}

// ============================================
// Audit Output
// ============================================

export async function fetchAuditOutput(trip, file, provider) {
  const response = await fetch(`/api/audit/${trip}/${file}/${provider}.md`);
  if (!response.ok) {
    throw new Error('Audit not found');
  }
  return response.text();
}

// ============================================
// Rankings & History
// ============================================

export async function fetchRankings(trip, provider) {
  const response = await fetch(`/api/rankings/${trip}/${provider}`);
  return response.json();
}

export async function fetchHistory(trip, provider) {
  const response = await fetch(`/api/history/${trip}/${provider}`);
  return response.json();
}

// ============================================
// Run Audits
// ============================================

export async function startAudit(trip, file, provider) {
  const response = await fetch('/api/run-audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trip, file, provider })
  });
  return response.json();
}

export async function stopAudit(trip, file, provider) {
  const response = await fetch('/api/stop-audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trip, file, provider })
  });
  return response.json();
}

export async function startTripAudit(trip, provider, signal) {
  const response = await fetch('/api/trip-audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trip, provider }),
    signal
  });
  return response.json();
}

// ============================================
// Git Operations
// ============================================

export async function commitFile(trip, file, message) {
  const response = await fetch('/api/commit-file', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trip, file, message })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.details || 'Commit failed');
  }

  return result;
}

export async function pushToRemote() {
  const response = await fetch('/api/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || result.details || 'Push failed');
  }

  return result;
}
