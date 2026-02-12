const fs = require('node:fs/promises');
const path = require('node:path');
const { app } = require('electron');

const DEFAULT_PREFERENCES = {
  profile: 'balanced',
  captureType: 'single',
  url: '',
  urlList: '',
  multiSizeEnabled: false,
  multiSizePresetIds: '1,4',
  presetIndex: 1,
  width: 1280,
  height: 900,
  scale: 2,
  mode: 'fold',
  format: 'jpg',
  quality: 90,
  waitUntil: 'domcontentloaded',
  timeoutMs: 30000,
  delayMs: 0,
  queueConcurrency: 2,
  consistencyMode: false,
  consistencyDelayMs: 800,
  cookieHandling: 'hide',
  cookieSelectors: '',
  suppressAnimations: true,
  appendTimestamp: false,
  outputDir: ''
};

function preferencesPath() {
  return path.join(app.getPath('userData'), 'preferences.json');
}

function normalizePreferences(raw) {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PREFERENCES };
  }

  return {
    ...DEFAULT_PREFERENCES,
    ...raw
  };
}

async function getPreferences() {
  try {
    const file = await fs.readFile(preferencesPath(), 'utf8');
    return normalizePreferences(JSON.parse(file));
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

async function savePreferences(raw) {
  const normalized = normalizePreferences(raw);
  await fs.writeFile(preferencesPath(), JSON.stringify(normalized, null, 2), 'utf8');
  return normalized;
}

module.exports = {
  getPreferences,
  savePreferences,
  DEFAULT_PREFERENCES
};
