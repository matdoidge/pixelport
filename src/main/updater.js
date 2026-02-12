const { app } = require('electron');

let autoUpdater;
try {
  ({ autoUpdater } = require('electron-updater'));
} catch {
  autoUpdater = null;
}

function emitStatus(window, payload) {
  if (!window || window.isDestroyed()) {
    return;
  }

  window.webContents.send('app-update-status', {
    timestamp: Date.now(),
    ...payload
  });
}

function isUpdaterUsable() {
  return Boolean(autoUpdater) && app.isPackaged;
}

function setupAutoUpdater(mainWindow) {
  if (!autoUpdater) {
    emitStatus(mainWindow, {
      state: 'disabled',
      message: 'Auto-updater unavailable: install dependencies to enable electron-updater.'
    });
    return;
  }

  if (!app.isPackaged) {
    emitStatus(mainWindow, {
      state: 'disabled',
      message: 'Auto-updates are disabled in development builds.'
    });
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    emitStatus(mainWindow, {
      state: 'checking',
      message: 'Checking for updates...'
    });
  });

  autoUpdater.on('update-available', (info) => {
    emitStatus(mainWindow, {
      state: 'available',
      message: `Update available: v${info.version}. Downloading...`,
      info
    });
  });

  autoUpdater.on('update-not-available', (info) => {
    emitStatus(mainWindow, {
      state: 'not-available',
      message: `You are up to date (v${info.version || app.getVersion()}).`,
      info
    });
  });

  autoUpdater.on('download-progress', (progress) => {
    emitStatus(mainWindow, {
      state: 'downloading',
      message: `Downloading update: ${Math.round(progress.percent)}%`,
      progress
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    emitStatus(mainWindow, {
      state: 'downloaded',
      message: `Update downloaded (v${info.version}). Restart app to apply.`,
      info
    });
  });

  autoUpdater.on('error', (error) => {
    emitStatus(mainWindow, {
      state: 'error',
      message: `Auto-update error: ${error?.message || String(error)}`
    });
  });
}

async function checkForUpdates(mainWindow) {
  if (!isUpdaterUsable()) {
    emitStatus(mainWindow, {
      state: 'disabled',
      message: 'Auto-updates are unavailable for this build.'
    });
    return { ok: false, reason: 'disabled' };
  }

  try {
    await autoUpdater.checkForUpdates();
    return { ok: true };
  } catch (error) {
    emitStatus(mainWindow, {
      state: 'error',
      message: `Update check failed: ${error instanceof Error ? error.message : String(error)}`
    });
    return { ok: false, reason: 'error' };
  }
}

module.exports = {
  setupAutoUpdater,
  checkForUpdates
};
