// ============================================
// Audit Runner Dashboard - UI Rendering
// ============================================
//
// Pure DOM manipulation and HTML rendering.
// All functions take data as input and update the DOM or return HTML strings.
// Contains NO business logic or API calls - just presentation layer.
//
// Rendering functions are called by coordinator (audit-runner.js)
// after fetching data from API (audit-api.js).

import { TRIP_AUDIT_FILE } from './audit-state.js';

// ============================================
// Helper Functions
// ============================================

export function getProviderLabel(provider) {
  return provider === 'opus' ? 'Opus' : 'GPT';
}

// ============================================
// Trip Name Display
// ============================================

export function updateTripName(trip) {
  const emoji = {
    greece: '🇬🇷',
    spain: '🇪🇸',
    botswana: '🇧🇼',
    newzealand: '🇳🇿',
    utah: '🏜️'
  }[trip] || '🌍';

  const name = trip.charAt(0).toUpperCase() + trip.slice(1);
  document.getElementById('tripName').textContent = `${emoji} ${name}`;
}

// ============================================
// File Selector
// ============================================

export function updateFileSelector(files, currentFile) {
  const selector = document.getElementById('fileSelector');
  selector.innerHTML = '<option value="">Select file...</option>';

  if (!files) return;

  // Add _trip as first option (trip-level audit)
  const tripOption = document.createElement('option');
  tripOption.value = TRIP_AUDIT_FILE;
  tripOption.textContent = '🎯 Trip Audit';
  if (TRIP_AUDIT_FILE === currentFile) tripOption.selected = true;
  selector.appendChild(tripOption);

  // Add separator
  const separator = document.createElement('option');
  separator.disabled = true;
  separator.textContent = '──────────';
  selector.appendChild(separator);

  // Add individual files
  files.forEach(({ file }) => {
    const option = document.createElement('option');
    option.value = file;
    option.textContent = file.charAt(0).toUpperCase() + file.slice(1);
    if (file === currentFile) option.selected = true;
    selector.appendChild(option);
  });
}

// ============================================
// Provider Cards
// ============================================

export function createProviderCard(provider, data, file, runningAudits) {
  const card = document.createElement('div');
  card.className = 'provider-card';
  card.dataset.provider = provider;

  const name = getProviderLabel(provider);

  if (!data.hasAudit) {
    card.innerHTML = `
      <div class="provider-header">
        <div class="provider-left">
          <div class="provider-name">${name}</div>
        </div>
        <div class="provider-status">No audit</div>
      </div>
      <div class="no-audit">No audit found for this file</div>
    `;
    return card;
  }

  const isRecent = data.lastModified.includes('ago') || data.lastModified === 'Just now';
  const statusClass = isRecent ? 'recent' : 'stale';

  const isRunning = runningAudits.has(`${provider}-${file}`);

  const deltasId = `deltas-${provider}-${file}`;

  card.innerHTML = `
    <div class="provider-header">
      <div class="provider-left">
        <div class="provider-name">${name}</div>
        <div class="provider-actions">
          <button class="btn btn-primary" id="runBtn-${provider}-${file}" onclick="runAudit('${provider}')" ${isRunning ? 'disabled' : ''}>
            ${isRunning ? '<span class="spinner"></span>Running...' : `Run ${name}`}
          </button>
          ${isRunning ? `<button class="btn btn-danger" onclick="stopAudit('${provider}')">Stop</button>` : ''}
          <button class="btn btn-secondary" onclick="loadAuditOutput('${provider}')">
            Output →
          </button>
          <button class="btn btn-secondary" onclick="showRankings('${provider}')">
            Rank
          </button>
          <button class="btn btn-secondary" onclick="showHistory('${provider}')">
            History
          </button>
        </div>
      </div>
      <div class="provider-right">
        <div class="provider-score">Overall: <strong>${data.overall.toFixed(2)}</strong></div>
      </div>
    </div>
    <div class="status-line-flex">
      <span>${data.linesChanged ? `${data.linesChanged} since last commit ${data.lastCommitFormatted || 'unknown'}` : `no changes since last commit ${data.lastCommitFormatted || 'unknown'}`}</span>
      <span class="last-audit">Last audit: ${data.lastModified}</span>
    </div>
    ${data.scores ? `
      <div class="deltas" id="${deltasId}">${data.deltas ? renderDeltas(data.deltas) : renderScores(data.scores)}</div>
    ` : ''}
  `;

  return card;
}

export function createTripProviderCard(provider, data, tripAuditControllers) {
  const card = document.createElement('div');
  card.className = 'provider-card';
  card.dataset.provider = provider;

  const name = getProviderLabel(provider);
  const isRunning = tripAuditControllers[provider] != null;

  if (!data.hasAudit) {
    card.innerHTML = `
      <div class="provider-header">
        <div class="provider-left">
          <div class="provider-actions">
            <button class="btn btn-primary" id="runTripBtn-${provider}" onclick="runTripAudit('${provider}')" ${isRunning ? 'disabled' : ''}>
              ${isRunning ? '<span class="spinner"></span>Running...' : `Run ${name}`}
            </button>
            ${isRunning ? `<button class="btn btn-danger" onclick="stopTripAudit('${provider}')">Stop</button>` : ''}
            <button class="btn btn-secondary" onclick="loadTripAuditOutput('${provider}')">
              Output →
            </button>
          </div>
        </div>
        <div class="provider-status">No trip audit</div>
      </div>
      <div class="no-audit">No trip audit found</div>
    `;
    return card;
  }

  // Trip audit exists - show scores
  const scores = data.scores || {};
  const scoresHTML = renderTripScores(scores);
  const overallScore = scores.overall_score ? scores.overall_score.toFixed(2) : 'N/A';

  card.innerHTML = `
    <div class="provider-header">
      <div class="provider-left">
        <div class="provider-actions">
          <button class="btn btn-primary" id="runTripBtn-${provider}" onclick="runTripAudit('${provider}')" ${isRunning ? 'disabled' : ''}>
            ${isRunning ? '<span class="spinner"></span>Running...' : `Run ${name}`}
          </button>
          ${isRunning ? `<button class="btn btn-danger" onclick="stopTripAudit('${provider}')">Stop</button>` : ''}
          <button class="btn btn-secondary" onclick="loadTripAuditOutput('${provider}')">
            Output →
          </button>
        </div>
      </div>
      <div class="provider-right">
        <div class="provider-score">Overall: <strong>${overallScore}</strong></div>
      </div>
    </div>
    <div class="status-line-flex">
      <span></span>
      <span class="last-audit">Last audit: ${data.lastModified}</span>
    </div>
    ${scoresHTML ? `<div class="deltas">${scoresHTML}</div>` : ''}
  `;

  return card;
}

// ============================================
// Score Rendering
// ============================================

export function renderDeltas(deltas) {
  return deltas.map(d => {
    // Determine color based on delta value: green for positive, black for flat, red for negative
    const deltaValue = parseFloat(d.delta);
    const color = deltaValue > 0 ? '#4caf50' : (deltaValue < 0 ? '#d32f2f' : '#333');
    const parts = d.text.split(/\s{2,}/); // Split on multiple spaces
    if (parts.length >= 2) {
      // Format: "Label    prev => curr  delta"
      const label = parts[0].trim();
      const rest = parts.slice(1).join('  ');
      return `<div style="display: flex; justify-content: space-between; padding: 0; color: ${color}; ${d.downgrade ? 'font-weight: 600;' : ''}"><span>${label}</span><span style="margin-left: 8px; white-space: nowrap;">${rest}</span></div>`;
    }
    // Fallback for unexpected format
    return `<div style="padding: 0; color: ${color}; ${d.downgrade ? 'font-weight: 600;' : ''}">${d.text}</div>`;
  }).join('');
}

export function renderScores(scores) {
  const dimensions = {
    prose_control_structure: 'Prose Control',
    narrative_clarity_arc: 'Narrative Clarity',
    opening_strength: 'Opening Strength',
    brand_alignment: 'Brand Alignment',
    distinctiveness: 'Distinctiveness',
    decision_clarity: 'Decision Clarity'
  };

  return Object.entries(dimensions)
    .filter(([key, _]) => scores[key] != null)
    .map(([key, label]) => {
      return `<div style="display: flex; justify-content: space-between; padding: 0;"><span>${label}</span><span style="font-weight: 600; margin-left: 8px;">${scores[key].toFixed(1)}</span></div>`;
    }).join('');
}

export function renderTripScores(scores) {
  const tripDimensions = {
    redundant_overlaps: 'Redundant Overlaps',
    information_gaps: 'Information Gaps',
    stylistic_consistency: 'Stylistic Consistency',
    narrative_flow_sequencing: 'Narrative Flow'
  };

  return Object.entries(tripDimensions)
    .filter(([key, _]) => scores[key] != null)
    .map(([key, label]) => {
      const value = scores[key].toFixed(1);
      return `<div style="display: flex; justify-content: space-between; padding: 0; max-width: 100%; overflow: hidden;"><span style="flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${label}</span><span style="font-weight: 600; margin-left: 8px; flex-shrink: 0;">${value}</span></div>`;
    }).join('');
}

// ============================================
// Audit Output Display
// ============================================

export function displayAuditOutput(markdown, provider, file) {
  const html = marked.parse(markdown);

  const previewContent = document.getElementById('previewContent');
  previewContent.innerHTML = html;
  previewContent.dataset.provider = provider;
  previewContent.dataset.file = file;

  // Mark active provider card
  document.querySelectorAll('.provider-card').forEach(card => {
    card.classList.remove('active');
  });
  const activeCard = document.querySelector(`.provider-card[data-provider="${provider}"]`);
  if (activeCard) {
    activeCard.classList.add('active');
  }

  // Scroll to top
  document.querySelector('.preview-pane').scrollTop = 0;
}

export function displayAuditOutputError(errorMessage) {
  document.getElementById('previewContent').innerHTML = `
    <div class="empty-preview">Failed to load audit: ${errorMessage}</div>
  `;
}

export function displayTripAuditResults(markdown, filename, provider, scores) {
  const html = marked.parse(markdown);

  const previewContent = document.getElementById('previewContent');
  const providerLabel = getProviderLabel(provider);

  previewContent.innerHTML = `
    <div style="padding: 20px;">
      <h2>Trip-Level Audit (${providerLabel})</h2>
      <p style="color: #666; font-size: 0.9em; margin-bottom: 20px;">${filename}</p>
      <div>${html}</div>
    </div>
  `;

  // Highlight the provider card that ran the trip audit
  document.querySelectorAll('.provider-card').forEach(card => {
    card.classList.remove('active');
  });
  const activeCard = document.querySelector(`.provider-card[data-provider="${provider}"]`);
  if (activeCard) {
    activeCard.classList.add('active');
  }

  // Scroll to top
  document.querySelector('.preview-pane').scrollTop = 0;
}

// ============================================
// Commit Button State
// ============================================

export function updateCommitButtons(fileStatus, currentFile) {
  const commitBtn = document.getElementById('commitBtn');
  const pushBtn = document.getElementById('pushBtn');

  // If buttons don't exist yet, return
  if (!commitBtn || !pushBtn) return;

  // Determine if buttons should be enabled
  let shouldEnable = false;

  // Check if we have a file selected (not trip audit)
  if (currentFile && currentFile !== TRIP_AUDIT_FILE && fileStatus) {
    // linesChanged is a string like "+2 -1" or null
    shouldEnable = ['opus', 'gpt'].some(provider => {
      const providerData = fileStatus.providers[provider];
      return providerData?.linesChanged != null && providerData.linesChanged !== '';
    });
  }

  // Update both buttons together to keep them in sync
  commitBtn.disabled = !shouldEnable;
  pushBtn.disabled = !shouldEnable;
}

// ============================================
// Toggle All Deltas Visibility
// ============================================

export function toggleAllDeltas() {
  const allDeltas = document.querySelectorAll('.deltas');
  const button = document.getElementById('globalToggle');
  const icon = document.getElementById('global-icon');

  // Check if any are visible
  const anyVisible = Array.from(allDeltas).some(d => !d.classList.contains('collapsed'));

  if (anyVisible) {
    // Hide all
    allDeltas.forEach(d => d.classList.add('collapsed'));
    icon.textContent = '▶';
    button.innerHTML = '<span id="global-icon">▶</span> Show details';
  } else {
    // Show all
    allDeltas.forEach(d => d.classList.remove('collapsed'));
    icon.textContent = '▼';
    button.innerHTML = '<span id="global-icon">▼</span> Hide details';
  }
}

// ============================================
// Rankings Modal
// ============================================

export function showRankingsModal(data, currentFile) {
  // Build rankings HTML
  const rankingsHTML = data.rankings.map((item, index) => {
    const isCurrent = item.file === currentFile;
    const isPublishable = item.score >= data.articleThreshold;
    const scoreColor = isPublishable ? '#4caf50' : '#1976d2';
    return `
      <div class="ranking-item ${isCurrent ? 'current' : ''}"
           onclick="selectFileFromRankings('${item.file}')">
        <div class="rank-badge">#${index + 1} of ${data.rankings.length}</div>
        <div class="rank-file">${item.file}</div>
        <div class="rank-score" style="color: ${scoreColor}">${item.score.toFixed(2)}</div>
      </div>
    `;
  }).join('');

  // Format readiness status
  const readinessStatus = data.tripReady ? 'READY' : 'NOT READY';
  const readinessColor = data.tripReady ? '#4caf50' : '#ff9800';

  // Update modal
  const providerLabel = getProviderLabel(data.provider);
  const tripLabel = data.trip.charAt(0).toUpperCase() + data.trip.slice(1);
  document.getElementById('rankingsTitle').innerHTML =
    `${providerLabel} Rankings — ${tripLabel}  •  Avg: ${data.average.toFixed(2)}  •  <span style="color: ${readinessColor}">${readinessStatus}</span>`;
  document.getElementById('rankingsList').innerHTML = rankingsHTML;

  // Show modal
  document.getElementById('rankingsModal').classList.add('show');
}

export function closeRankings() {
  document.getElementById('rankingsModal').classList.remove('show');
}

// ============================================
// History Chart Modal
// ============================================

let historyChartInstance = null;

export function showHistoryModal(data, trip) {
  // Update modal title
  const providerLabel = getProviderLabel(data.provider);
  const tripLabel = trip.charAt(0).toUpperCase() + trip.slice(1);
  document.getElementById('historyTitle').textContent =
    `${providerLabel} History — ${tripLabel}`;

  // Prepare chart data
  const chartData = prepareChartData(data);

  // Render chart
  renderHistoryChart(chartData);

  // Show modal
  document.getElementById('historyModal').classList.add('show');
}

function prepareChartData(historyData) {
  const { dates, articles, tripAverage } = historyData;

  // X-axis labels: MM-DD format
  const labels = dates.map(d => d.slice(5));

  // Expanded color palette with more distinct colors
  const colors = [
    '#1976d2', // blue
    '#388e3c', // green
    '#d32f2f', // red
    '#f57c00', // orange
    '#7b1fa2', // purple
    '#0097a7', // cyan
    '#e91e63', // pink
    '#ff9800', // amber
    '#00897b', // teal
    '#5d4037', // brown
    '#795548', // dark brown
    '#607d8b'  // blue grey
  ];

  const datasets = [];
  let maxScore = 0;

  // Article datasets (dashed lines)
  const articleNames = Object.keys(articles).sort();
  articleNames.forEach((article, index) => {
    const color = colors[index % colors.length];
    const articleData = articles[article];
    const dataPoints = dates.map(date => articleData[date] ?? null);

    // Track max score
    dataPoints.forEach(score => {
      if (score != null && score > maxScore) maxScore = score;
    });

    datasets.push({
      label: article.charAt(0).toUpperCase() + article.slice(1),
      data: dataPoints,
      borderColor: color,
      backgroundColor: color + '33',
      borderWidth: 2,
      borderDash: [5, 5],
      spanGaps: true,
      pointRadius: 3,
      pointHoverRadius: 5
    });
  });

  // Trip average dataset (solid, thicker)
  const avgData = dates.map(date => tripAverage[date]);
  avgData.forEach(score => {
    if (score != null && score > maxScore) maxScore = score;
  });

  datasets.push({
    label: 'Trip Average',
    data: avgData,
    borderColor: '#333',
    backgroundColor: '#33333333',
    borderWidth: 3,
    borderDash: [],
    spanGaps: true,
    pointRadius: 4,
    pointHoverRadius: 6
  });

  return { labels, datasets, maxScore };
}

function renderHistoryChart(chartData) {
  const ctx = document.getElementById('historyChart').getContext('2d');

  // Destroy previous chart
  if (historyChartInstance) {
    historyChartInstance.destroy();
  }

  // Calculate Y-axis max: round up to nearest 0.5, minimum 9.5
  const maxScore = chartData.maxScore || 9;
  const yMax = Math.max(9.5, Math.ceil(maxScore * 2) / 2);

  // Create new chart
  historyChartInstance = new Chart(ctx, {
    type: 'line',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      plugins: {
        legend: {
          position: 'right',
          labels: { font: { size: 12 }, padding: 10, usePointStyle: true }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              const label = context.dataset.label || '';
              const value = context.parsed.y;
              return value != null ? `${label}: ${value.toFixed(2)}` : null;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Date (MM-DD)', font: { size: 13 } },
          grid: { display: false }
        },
        y: {
          title: { display: true, text: 'Score', font: { size: 13 } },
          min: 7,
          max: yMax,
          ticks: { stepSize: 0.5 },
          grid: { color: '#e0e0e0' }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });
}

export function closeHistory() {
  document.getElementById('historyModal').classList.remove('show');
  if (historyChartInstance) {
    historyChartInstance.destroy();
    historyChartInstance = null;
  }
}

// ============================================
// Commit Modal
// ============================================

export function showCommitModal(fileStatus, file, trip, provider, shouldPush, config) {
  const modal = document.getElementById('commitModal');
  const title = document.getElementById('commitModalTitle');
  const confirmBtn = document.getElementById('confirmCommitBtn');
  const filePathSpan = document.getElementById('commitFilePath');
  const linesChangedSpan = document.getElementById('commitLinesChanged');
  const messageInput = document.getElementById('commitMessage');
  const errorDiv = document.getElementById('commitError');

  if (!fileStatus) return;

  const providerData = fileStatus.providers[provider];
  if (!providerData) return;

  // Get scores
  const currScore = providerData.overall;
  // Use remote score for push (cumulative), local score for commit (incremental)
  const prevScoreGit = shouldPush ? providerData.prevScoreRemote : providerData.prevScore;
  // Fall back to audit history if no git commit with score
  const prevScore = prevScoreGit ?? providerData.prevAuditScore;

  // Build commit message
  let defaultMessage;
  if (prevScore !== null && prevScore !== undefined) {
    if (shouldPush) {
      // Push format: "Content(malaga): 8.03=>8.80"
      defaultMessage = `Content(${file}): ${prevScore.toFixed(2)}=>${currScore.toFixed(2)}`;
    } else {
      // Commit format: "Content(malaga) from 8.75 to 8.80"
      defaultMessage = `Content(${file}) from ${prevScore.toFixed(2)} to ${currScore.toFixed(2)}`;
    }
  } else {
    defaultMessage = `Content(${file}) at ${currScore.toFixed(2)}`;
  }

  // Update modal
  title.textContent = shouldPush ? 'Commit & Push' : 'Commit Changes';
  confirmBtn.textContent = shouldPush ? 'Commit & Push' : 'Commit';
  filePathSpan.textContent = `content/trips/${trip}/${file}.md`;
  linesChangedSpan.textContent = providerData.linesChanged || 'none';
  messageInput.value = defaultMessage;
  errorDiv.style.display = 'none';

  // Store shouldPush flag
  modal.dataset.shouldPush = shouldPush;

  // Show modal and focus input
  modal.classList.add('show');
  messageInput.focus();
  messageInput.select();
}

export function closeCommitModal() {
  const modal = document.getElementById('commitModal');
  modal.classList.remove('show');
}

export function showCommitError(message) {
  const errorDiv = document.getElementById('commitError');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

export function setCommitButtonLoading(isLoading, shouldPush) {
  const confirmBtn = document.getElementById('confirmCommitBtn');
  confirmBtn.disabled = isLoading;
  if (isLoading) {
    confirmBtn.textContent = shouldPush ? 'Committing & Pushing...' : 'Committing...';
  } else {
    confirmBtn.textContent = shouldPush ? 'Commit & Push' : 'Commit';
  }
}
