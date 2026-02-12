const presets = [
  { label: 'Custom', width: null, height: null },
  { label: 'MacBook 13 (1280)', width: 1280, height: 800 },
  { label: 'MacBook 14 (1512)', width: 1512, height: 900 },
  { label: 'Laptop common (1366)', width: 1366, height: 800 },
  { label: 'Desktop (1920)', width: 1920, height: 1080 },
  { label: 'Social portrait (1080)', width: 1080, height: 1350 }
];

const profiles = {
  fast: {
    scale: 1,
    quality: 78,
    waitUntil: 'domcontentloaded',
    timeoutMs: 15000,
    delayMs: 0,
    queueConcurrency: 3,
    suppressAnimations: true,
    cookieHandling: 'hide'
  },
  balanced: {
    scale: 2,
    quality: 88,
    waitUntil: 'domcontentloaded',
    timeoutMs: 30000,
    delayMs: 150,
    queueConcurrency: 2,
    suppressAnimations: true,
    cookieHandling: 'hide'
  },
  ultra: {
    scale: 3,
    quality: 95,
    waitUntil: 'networkidle',
    timeoutMs: 45000,
    delayMs: 500,
    queueConcurrency: 1,
    suppressAnimations: true,
    cookieHandling: 'accept'
  }
};

const form = document.getElementById('capture-form');
const urlInput = document.getElementById('url');
const urlListInput = document.getElementById('url-list');
const captureTypeSelect = document.getElementById('capture-type');
const singleUrlField = document.getElementById('single-url-field');
const queueUrlField = document.getElementById('queue-url-field');
const multiSizeToggleRow = document.getElementById('multi-size-toggle-row');
const multiSizeEnabledInput = document.getElementById('multi-size-enabled');
const multiSizeOptions = document.getElementById('multi-size-options');
const multiSizePresetInputs = [...document.querySelectorAll('.multi-size-preset')];
const presetSelect = document.getElementById('preset');
const widthInput = document.getElementById('width');
const heightInput = document.getElementById('height');
const heightHelp = document.getElementById('height-help');
const modeSelect = document.getElementById('mode');
const formatSelect = document.getElementById('format');
const scaleSelect = document.getElementById('scale');
const waitUntilSelect = document.getElementById('wait-until');
const timeoutInput = document.getElementById('timeout');
const delayInput = document.getElementById('delay');
const queueConcurrencySelect = document.getElementById('queue-concurrency');
const consistencyModeInput = document.getElementById('consistency-mode');
const consistencyDelaySelect = document.getElementById('consistency-delay-ms');
const qualityInput = document.getElementById('quality');
const qualityValue = document.getElementById('quality-value');
const cookieHandlingSelect = document.getElementById('cookie-handling');
const cookieSelectorsInput = document.getElementById('cookie-selectors');
const suppressAnimationsInput = document.getElementById('suppress-animations');
const appendTimestampInput = document.getElementById('append-timestamp');
const folderPath = document.getElementById('folder-path');
const chooseFolderButton = document.getElementById('choose-folder');
const statusText = document.getElementById('status-text');
const captureButton = document.getElementById('capture');
const openOutputFolderButton = document.getElementById('open-output-folder');
const revealLastFileButton = document.getElementById('reveal-last-file');
const captureFeedback = document.getElementById('capture-feedback');
const captureFeedbackText = document.getElementById('capture-feedback-text');
const captureProgressTrack = document.getElementById('capture-progress-track');
const captureProgressFill = document.getElementById('capture-progress-fill');
const previewImage = document.getElementById('preview-image');
const previewEmpty = document.getElementById('preview-empty');
const queueResultsSection = document.getElementById('queue-results');
const queueResultsGrid = document.getElementById('queue-results-grid');
const queueResultsEmpty = document.getElementById('queue-results-empty');

const profileButtons = [...document.querySelectorAll('.profile-btn')];

const errorNodes = {
  url: document.getElementById('error-url'),
  urlList: document.getElementById('error-urlList'),
  multiSize: document.getElementById('error-multiSize'),
  width: document.getElementById('error-width'),
  height: document.getElementById('error-height'),
  timeout: document.getElementById('error-timeout'),
  outputDir: document.getElementById('error-outputDir')
};

let selectedOutputDir = '';
let isCapturing = false;
let saveTimer;
let progressTimer;
let progressValue = 0;
let activeProfile = 'balanced';
let currentBatchId = '';
let lastPreviewPath = '';

function setStatus(message) {
  statusText.textContent = message;
}

function updateActionButtons() {
  openOutputFolderButton.disabled = !selectedOutputDir;
  revealLastFileButton.disabled = !lastPreviewPath;
}

function setProgress(value) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  captureProgressFill.style.width = `${clamped}%`;
  captureProgressTrack.setAttribute('aria-valuenow', String(clamped));
}

function startCaptureFeedback(message) {
  progressValue = 6;
  setProgress(progressValue);
  captureFeedback.classList.add('active');
  captureFeedbackText.textContent = message || 'Loading page...';

  clearInterval(progressTimer);
  progressTimer = setInterval(() => {
    if (progressValue < 88) {
      progressValue += Math.max(1, (90 - progressValue) * 0.08);
      setProgress(progressValue);
    }
  }, 220);
}

function finishCaptureFeedback(success, message) {
  clearInterval(progressTimer);
  setProgress(success ? 100 : 0);
  captureFeedbackText.textContent = message || (success ? 'Capture complete.' : 'Capture failed.');

  setTimeout(() => {
    captureFeedback.classList.remove('active');
    captureFeedbackText.textContent = 'Preparing capture...';
    setProgress(0);
  }, success ? 800 : 1200);
}

function setError(field, message) {
  const node = errorNodes[field];
  if (node) {
    node.textContent = message || '';
  }
}

function clearErrors() {
  Object.keys(errorNodes).forEach((key) => setError(key, ''));
}

function normalizeUrlInput(rawUrl) {
  const trimmed = String(rawUrl || '').trim();
  if (!trimmed) {
    return '';
  }

  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function toFileUrl(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  return encodeURI(`file://${normalized}`);
}

function parseQueueUrls(raw) {
  return String(raw || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => normalizeUrlInput(line));
}

function getSelectedMultiSizePresetIds() {
  return multiSizePresetInputs
    .filter((input) => input.checked)
    .map((input) => Number.parseInt(input.value, 10))
    .filter((value) => Number.isFinite(value) && value > 0 && value < presets.length);
}

function showPreview(outputPath) {
  const cacheBuster = Date.now();
  previewImage.src = `${toFileUrl(outputPath)}?v=${cacheBuster}`;
  previewImage.style.display = 'block';
  previewEmpty.style.display = 'none';
  lastPreviewPath = outputPath;
  updateActionButtons();
}

function clearQueueResults() {
  queueResultsGrid.innerHTML = '';
  queueResultsSection.classList.add('hidden');
  queueResultsEmpty.textContent = 'Run a queue capture to see thumbnails here.';
}

function setActiveThumbnail(outputPath) {
  const cards = queueResultsGrid.querySelectorAll('.queue-thumb');
  cards.forEach((card) => {
    card.classList.toggle('active', card.dataset.outputPath === outputPath);
  });
}

function renderQueueResults(results) {
  const successes = results.filter((item) => item.ok && item.outputPath);
  queueResultsGrid.innerHTML = '';

  if (successes.length === 0) {
    queueResultsSection.classList.remove('hidden');
    queueResultsEmpty.textContent = 'Queue completed with no successful captures.';
    return;
  }

  queueResultsSection.classList.remove('hidden');
  queueResultsEmpty.textContent = `${successes.length} screenshot${successes.length === 1 ? '' : 's'} generated. Click a thumbnail to preview.`;

  successes.forEach((item, index) => {
    const card = document.createElement('article');
    card.className = 'queue-thumb';
    card.dataset.outputPath = item.outputPath;

    const previewButton = document.createElement('button');
    previewButton.type = 'button';
    previewButton.className = 'queue-thumb-preview';
    previewButton.dataset.outputPath = item.outputPath;

    const image = document.createElement('img');
    image.src = `${toFileUrl(item.outputPath)}?thumb=${Date.now()}-${index}`;
    image.alt = `Preview for ${item.url}`;
    image.loading = 'lazy';

    const label = document.createElement('span');
    label.className = 'queue-thumb-url';
    label.textContent = item.sizeLabel ? `${item.url} (${item.sizeLabel})` : item.url;

    const actions = document.createElement('div');
    actions.className = 'queue-thumb-actions';

    const revealButton = document.createElement('button');
    revealButton.type = 'button';
    revealButton.className = 'queue-thumb-reveal';
    revealButton.textContent = 'Reveal in Finder';

    revealButton.addEventListener('click', async () => {
      const response = await window.screengrabby.revealFile(item.outputPath);
      if (!response.ok) {
        setStatus(`Could not reveal file: ${response.error}`);
      }
    });

    previewButton.appendChild(image);
    previewButton.appendChild(label);
    actions.appendChild(revealButton);
    card.appendChild(previewButton);
    card.appendChild(actions);

    previewButton.addEventListener('click', () => {
      showPreview(item.outputPath);
      setActiveThumbnail(item.outputPath);
    });

    queueResultsGrid.appendChild(card);
  });

  const firstOutputPath = successes[0].outputPath;
  setActiveThumbnail(firstOutputPath);
}

function validateState() {
  clearErrors();

  const captureType = captureTypeSelect.value;

  if (captureType === 'single') {
    const draftUrl = normalizeUrlInput(urlInput.value);
    if (!draftUrl) {
      setError('url', 'URL is required.');
    } else {
      try {
        const parsed = new URL(draftUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          setError('url', 'Only HTTP and HTTPS URLs are allowed.');
        }
      } catch {
        setError('url', 'URL is invalid. Example: https://example.com');
      }
    }

  } else {
    const urls = parseQueueUrls(urlListInput.value);
    if (urls.length === 0) {
      setError('urlList', 'Provide at least one URL for queue mode.');
    }

    const invalid = urls.find((item) => {
      try {
        const parsed = new URL(item);
        return !['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return true;
      }
    });

    if (invalid) {
      setError('urlList', `Invalid URL in queue: ${invalid}`);
    }
  }

  if (multiSizeEnabledInput.checked) {
    const selected = getSelectedMultiSizePresetIds();
    if (selected.length === 0) {
      setError('multiSize', 'Select at least one size when multi-size mode is enabled.');
    }
  }

  const width = Number(widthInput.value);
  if (!Number.isFinite(width) || width < 320) {
    setError('width', 'Width must be at least 320px.');
  }

  const height = Number(heightInput.value);
  if (modeSelect.value === 'fold' && (!Number.isFinite(height) || height < 320)) {
    setError('height', 'Height must be at least 320px for fold mode.');
  }

  const timeout = Number(timeoutInput.value);
  if (!Number.isFinite(timeout) || timeout < 1000) {
    setError('timeout', 'Timeout must be at least 1000 ms.');
  }

  if (!selectedOutputDir) {
    setError('outputDir', 'Choose an output folder.');
  }

  return !Object.values(errorNodes).some((node) => node.textContent.trim());
}

function updateHeightState() {
  const isFullPage = modeSelect.value === 'full';
  heightInput.disabled = isFullPage;
  heightHelp.textContent = isFullPage
    ? 'Disabled for full-page mode. Full document height is captured automatically.'
    : 'Used for above-the-fold captures.';
}

function updateCaptureTypeState() {
  const isQueue = captureTypeSelect.value === 'queue';
  singleUrlField.classList.toggle('hidden', isQueue);
  queueUrlField.classList.toggle('hidden', !isQueue);
  updateMultiSizeState();
  captureButton.textContent = isQueue ? 'Capture Queue' : 'Capture Screenshot';
}

function updateMultiSizeState() {
  multiSizeOptions.classList.toggle('hidden', !multiSizeEnabledInput.checked);
}

function setActiveProfile(profileId) {
  activeProfile = profiles[profileId] ? profileId : 'balanced';
  profileButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.profile === activeProfile);
  });
}

function applyProfile(profileId) {
  const profile = profiles[profileId];
  if (!profile) {
    return;
  }

  scaleSelect.value = String(profile.scale);
  qualityInput.value = String(profile.quality);
  qualityValue.textContent = String(profile.quality);
  waitUntilSelect.value = profile.waitUntil;
  timeoutInput.value = String(profile.timeoutMs);
  delayInput.value = String(profile.delayMs);
  queueConcurrencySelect.value = String(profile.queueConcurrency);
  suppressAnimationsInput.checked = Boolean(profile.suppressAnimations);
  cookieHandlingSelect.value = profile.cookieHandling;

  setActiveProfile(profileId);
}

function buildPreferencePayload() {
  return {
    profile: activeProfile,
    captureType: captureTypeSelect.value,
    url: urlInput.value,
    urlList: urlListInput.value,
    multiSizeEnabled: multiSizeEnabledInput.checked,
    multiSizePresetIds: getSelectedMultiSizePresetIds().join(','),
    presetIndex: Number(presetSelect.value),
    width: Number(widthInput.value),
    height: Number(heightInput.value),
    scale: Number(scaleSelect.value),
    mode: modeSelect.value,
    format: formatSelect.value,
    quality: Number(qualityInput.value),
    waitUntil: waitUntilSelect.value,
    timeoutMs: Number(timeoutInput.value),
    delayMs: Number(delayInput.value),
    queueConcurrency: Number(queueConcurrencySelect.value),
    consistencyMode: consistencyModeInput.checked,
    consistencyDelayMs: Number(consistencyDelaySelect.value),
    cookieHandling: cookieHandlingSelect.value,
    cookieSelectors: cookieSelectorsInput.value,
    suppressAnimations: suppressAnimationsInput.checked,
    appendTimestamp: appendTimestampInput.checked,
    outputDir: selectedOutputDir
  };
}

function buildCaptureSettings() {
  return {
    width: Number(widthInput.value),
    height: Number(heightInput.value),
    scale: Number(scaleSelect.value),
    mode: modeSelect.value,
    format: formatSelect.value,
    quality: Number(qualityInput.value),
    waitUntil: waitUntilSelect.value,
    timeoutMs: Number(timeoutInput.value),
    delayMs: Number(delayInput.value),
    queueConcurrency: Number(queueConcurrencySelect.value),
    consistencyMode: consistencyModeInput.checked,
    consistencyDelayMs: Number(consistencyDelaySelect.value),
    cookieHandling: cookieHandlingSelect.value,
    cookieSelectors: cookieSelectorsInput.value,
    suppressAnimations: suppressAnimationsInput.checked,
    outputDir: selectedOutputDir,
    appendTimestamp: appendTimestampInput.checked,
    profile: activeProfile
  };
}

function buildMultiSizeJobs(urls) {
  const presetIds = getSelectedMultiSizePresetIds();
  if (presetIds.length === 0) {
    return urls.map((url) => ({ url }));
  }

  const jobs = [];
  urls.forEach((url) => {
    presetIds.forEach((presetId) => {
      const preset = presets[presetId];
      if (!preset || !preset.width || !preset.height) {
        return;
      }

      jobs.push({
        url,
        width: preset.width,
        height: preset.height,
        sizeLabel: `${preset.width}x${preset.height}`
      });
    });
  });

  return jobs;
}

function queueSavePreferences() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    window.screengrabby.savePreferences(buildPreferencePayload());
  }, 220);
}

function applyPreferences(settings) {
  if (!settings || typeof settings !== 'object') {
    return;
  }

  if (typeof settings.profile === 'string') {
    setActiveProfile(settings.profile);
  }

  if (typeof settings.captureType === 'string' && ['single', 'queue'].includes(settings.captureType)) {
    captureTypeSelect.value = settings.captureType;
  }

  if (typeof settings.url === 'string') {
    urlInput.value = settings.url;
  }

  if (typeof settings.urlList === 'string') {
    urlListInput.value = settings.urlList;
  }

  if (typeof settings.multiSizeEnabled === 'boolean') {
    multiSizeEnabledInput.checked = settings.multiSizeEnabled;
  }

  if (typeof settings.multiSizePresetIds === 'string') {
    const selected = new Set(
      settings.multiSizePresetIds
        .split(',')
        .map((value) => Number.parseInt(value.trim(), 10))
        .filter((value) => Number.isFinite(value))
    );
    multiSizePresetInputs.forEach((input) => {
      input.checked = selected.has(Number.parseInt(input.value, 10));
    });
  }

  if (Number.isInteger(settings.presetIndex) && settings.presetIndex >= 0 && settings.presetIndex < presets.length) {
    presetSelect.value = String(settings.presetIndex);
  }

  if (Number.isFinite(settings.width)) {
    widthInput.value = String(settings.width);
  }

  if (Number.isFinite(settings.height)) {
    heightInput.value = String(settings.height);
  }

  if ([1, 2, 3].includes(settings.scale)) {
    scaleSelect.value = String(settings.scale);
  }

  if (['fold', 'full'].includes(settings.mode)) {
    modeSelect.value = settings.mode;
  }

  if (['jpg', 'webp'].includes(settings.format)) {
    formatSelect.value = settings.format;
  }

  if (Number.isFinite(settings.quality) && settings.quality >= 60 && settings.quality <= 100) {
    qualityInput.value = String(settings.quality);
    qualityValue.textContent = String(settings.quality);
  }

  if (['networkidle', 'domcontentloaded'].includes(settings.waitUntil)) {
    waitUntilSelect.value = settings.waitUntil;
  }

  if (Number.isFinite(settings.timeoutMs)) {
    timeoutInput.value = String(settings.timeoutMs);
  }

  if (Number.isFinite(settings.delayMs) && settings.delayMs >= 0) {
    delayInput.value = String(settings.delayMs);
  }

  if (typeof settings.consistencyMode === 'boolean') {
    consistencyModeInput.checked = settings.consistencyMode;
  }

  if ([0, 300, 800, 1500].includes(Number(settings.consistencyDelayMs))) {
    consistencyDelaySelect.value = String(settings.consistencyDelayMs);
  }

  if ([1, 2, 3].includes(Number(settings.queueConcurrency))) {
    queueConcurrencySelect.value = String(settings.queueConcurrency);
  }

  if (['off', 'hide', 'accept'].includes(settings.cookieHandling)) {
    cookieHandlingSelect.value = settings.cookieHandling;
  }

  if (typeof settings.cookieSelectors === 'string') {
    cookieSelectorsInput.value = settings.cookieSelectors;
  }

  suppressAnimationsInput.checked = Boolean(settings.suppressAnimations);
  appendTimestampInput.checked = Boolean(settings.appendTimestamp);

  if (typeof settings.outputDir === 'string' && settings.outputDir.trim()) {
    selectedOutputDir = settings.outputDir;
    folderPath.textContent = selectedOutputDir;
    updateActionButtons();
  }
}

function updateCaptureButtonState() {
  captureButton.disabled = isCapturing || !validateState();
}

function loadPresets() {
  presets.forEach((preset, index) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = preset.label;
    presetSelect.appendChild(option);
  });

  presetSelect.value = '1';
}

function bindEvents() {
  presetSelect.addEventListener('change', () => {
    const preset = presets[Number(presetSelect.value)];
    if (preset && preset.width && preset.height) {
      widthInput.value = String(preset.width);
      if (modeSelect.value === 'fold') {
        heightInput.value = String(preset.height);
      }
    }

    queueSavePreferences();
    updateCaptureButtonState();
  });

  captureTypeSelect.addEventListener('change', () => {
    updateCaptureTypeState();
    queueSavePreferences();
    updateCaptureButtonState();
  });

  multiSizeEnabledInput.addEventListener('change', () => {
    updateMultiSizeState();
    queueSavePreferences();
    updateCaptureButtonState();
  });

  multiSizePresetInputs.forEach((input) => {
    input.addEventListener('change', () => {
      queueSavePreferences();
      updateCaptureButtonState();
    });
  });

  modeSelect.addEventListener('change', () => {
    updateHeightState();
    queueSavePreferences();
    updateCaptureButtonState();
  });

  qualityInput.addEventListener('input', () => {
    qualityValue.textContent = qualityInput.value;
    queueSavePreferences();
  });

  profileButtons.forEach((button) => {
    button.addEventListener('click', () => {
      applyProfile(button.dataset.profile);
      queueSavePreferences();
      updateCaptureButtonState();
    });
  });

  [
    urlInput,
    urlListInput,
    widthInput,
    heightInput,
    formatSelect,
    scaleSelect,
    waitUntilSelect,
    timeoutInput,
    delayInput,
    queueConcurrencySelect,
    consistencyModeInput,
    consistencyDelaySelect,
    cookieHandlingSelect,
    cookieSelectorsInput,
    suppressAnimationsInput,
    appendTimestampInput
  ].forEach((node) => {
    node.addEventListener('input', () => {
      queueSavePreferences();
      updateCaptureButtonState();
    });

    node.addEventListener('change', () => {
      queueSavePreferences();
      updateCaptureButtonState();
    });
  });

  chooseFolderButton.addEventListener('click', async () => {
    const result = await window.screengrabby.chooseOutputDir();
    if (!result) {
      return;
    }

    selectedOutputDir = result;
    folderPath.textContent = result;
    queueSavePreferences();
    updateActionButtons();
    updateCaptureButtonState();
  });

  openOutputFolderButton.addEventListener('click', async () => {
    const response = await window.screengrabby.openOutputFolder(selectedOutputDir);
    if (!response.ok) {
      setStatus(`Could not open output folder: ${response.error}`);
    }
  });

  revealLastFileButton.addEventListener('click', async () => {
    const response = await window.screengrabby.revealFile(lastPreviewPath);
    if (!response.ok) {
      setStatus(`Could not reveal file: ${response.error}`);
    }
  });

  window.screengrabby.onBatchProgress((data) => {
    if (!isCapturing || !data || data.batchId !== currentBatchId) {
      return;
    }

    const percent = data.total > 0 ? (data.completed / data.total) * 100 : 0;
    setProgress(percent);
    captureFeedbackText.textContent = `Queue ${data.completed}/${data.total} (${data.queueConcurrency} workers, avg ${data.avgDurationMs}ms): ${data.currentUrl}`;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (isCapturing || !validateState()) {
      setStatus('Fix highlighted fields before capturing.');
      updateCaptureButtonState();
      return;
    }

    isCapturing = true;
    updateCaptureButtonState();

    try {
      const settings = buildCaptureSettings();

      if (captureTypeSelect.value === 'single') {
        clearQueueResults();
        const normalizedUrl = normalizeUrlInput(urlInput.value);

        if (multiSizeEnabledInput.checked) {
          const presetIds = getSelectedMultiSizePresetIds();
          startCaptureFeedback(`Multi-size capture starting (${presetIds.length} sizes)...`);

          const multiResults = [];

          for (let index = 0; index < presetIds.length; index += 1) {
            const presetId = presetIds[index];
            const preset = presets[presetId];
            if (!preset) {
              // Skip invalid entries silently.
              continue;
            }

            captureFeedbackText.textContent = `Size ${index + 1}/${presetIds.length}: ${preset.label}`;
            setProgress((index / presetIds.length) * 100);

            const result = await window.screengrabby.capture({
              ...settings,
              url: normalizedUrl,
              width: preset.width,
              height: preset.height
            });

            multiResults.push({
              ok: result.ok,
              outputPath: result.outputPath,
              error: result.error,
              telemetry: result.telemetry,
              url: `${normalizedUrl} [${preset.label}]`,
              pixelWidth: result.pixelWidth,
              pixelHeight: result.pixelHeight
            });
          }

          renderQueueResults(multiResults);
          const firstSuccess = multiResults.find((item) => item.ok && item.outputPath);
          if (firstSuccess) {
            showPreview(firstSuccess.outputPath);
            setActiveThumbnail(firstSuccess.outputPath);
          }

          const successCount = multiResults.filter((item) => item.ok).length;
          const failureCount = multiResults.length - successCount;
          const avgTotalMs = successCount > 0
            ? Math.round(
              multiResults
                .filter((item) => item.ok && item.telemetry)
                .reduce((sum, item) => sum + (item.telemetry.totalMs || 0), 0) / successCount
            )
            : 0;

          finishCaptureFeedback(successCount > 0, 'Multi-size capture complete.');
          setStatus(
            [
              `Multi-size complete: ${successCount}/${multiResults.length} succeeded`,
              `Output folder: ${selectedOutputDir}`,
              `Average successful capture time: ${avgTotalMs}ms`,
              `Failed: ${failureCount}`
            ].join('\n')
          );
        } else {
          startCaptureFeedback('Loading page...');
          const payload = { ...settings, url: normalizedUrl };
          const result = await window.screengrabby.capture(payload);

          if (!result.ok) {
            finishCaptureFeedback(false, 'Capture failed.');
            setStatus(
              [
                `Capture failed: ${result.error}`,
                'Try a longer timeout or switch wait strategy.'
              ].join('\n')
            );
            return;
          }

          showPreview(result.outputPath);
          finishCaptureFeedback(true, 'Capture complete.');

          const telemetry = result.telemetry || {};
          setStatus(
            [
              'Capture complete.',
              `Saved: ${result.outputPath}`,
              `Image size: ${result.pixelWidth}x${result.pixelHeight}px`,
              `Timing: nav ${telemetry.navigationMs ?? 0}ms, prep ${telemetry.prepareMs ?? 0}ms, snap ${telemetry.screenshotMs ?? 0}ms, encode ${telemetry.encodeMs ?? 0}ms, total ${telemetry.totalMs ?? 0}ms`
            ].join('\n')
          );
        }
      } else {
        const urls = parseQueueUrls(urlListInput.value);
        const jobs = multiSizeEnabledInput.checked ? buildMultiSizeJobs(urls) : [];
        currentBatchId = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
        const queueTotal = jobs.length > 0 ? jobs.length : urls.length;
        startCaptureFeedback(`Queue starting (${queueTotal} jobs)...`);

        const batchResult = await window.screengrabby.captureBatch({
          batchId: currentBatchId,
          urls,
          jobs,
          settings
        });

        renderQueueResults(batchResult.results);

        const firstSuccess = batchResult.results.find((item) => item.ok && item.outputPath);
        if (firstSuccess) {
          showPreview(firstSuccess.outputPath);
          setActiveThumbnail(firstSuccess.outputPath);
        }

        finishCaptureFeedback(true, 'Queue complete.');

        const failures = batchResult.results.filter((item) => !item.ok).slice(0, 3);
        const successes = batchResult.results.filter((item) => item.ok).slice(0, 3);
        const failureDetails = failures.length
          ? failures.map((item) => `- ${item.url}: ${item.error}`).join('\n')
          : 'None';
        const successDetails = successes.length
          ? successes.map((item) => `- ${item.outputPath}`).join('\n')
          : 'None';

        setStatus(
          [
            `Queue complete: ${batchResult.successCount}/${batchResult.total} succeeded`,
            `Output folder: ${selectedOutputDir}`,
            `Workers: ${batchResult.queueConcurrency}`,
            `Queue timing: total ${batchResult.telemetry?.totalMs ?? 0}ms, avg ${batchResult.telemetry?.avgDurationMs ?? 0}ms, slowest ${batchResult.telemetry?.maxDurationMs ?? 0}ms`,
            `Failed: ${batchResult.failureCount}`,
            'Saved samples:',
            successDetails,
            'Failure samples:',
            failureDetails
          ].join('\n')
        );
      }

      queueSavePreferences();
    } catch (error) {
      finishCaptureFeedback(false, 'Capture failed.');
      setStatus(`Capture failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      isCapturing = false;
      updateCaptureButtonState();
    }
  });
}

async function init() {
  loadPresets();
  setActiveProfile('balanced');

  try {
    const preferences = await window.screengrabby.getPreferences();
    applyPreferences(preferences);
  } catch {
    setStatus('Loaded with default settings (preferences unavailable).');
  }

  bindEvents();
  updateHeightState();
  updateCaptureTypeState();
  updateActionButtons();
  updateCaptureButtonState();

  if (selectedOutputDir) {
    setStatus('Ready. Previous output folder restored.');
  } else {
    setStatus('Ready. Choose an output folder to begin.');
  }
}

init();
