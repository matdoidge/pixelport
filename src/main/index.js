const path = require('node:path');
const fs = require('node:fs/promises');
const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const { capturePage, closeCaptureBrowser, warmupCaptureBrowser } = require('../core/capture');
const { getPreferences, savePreferences } = require('./preferences');
const { setupAutoUpdater, checkForUpdates } = require('./updater');

let mainWindow;

function createWindow() {
  const win = new BrowserWindow({
    width: 1080,
    height: 880,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  mainWindow = win;

  win.on('closed', () => {
    if (mainWindow === win) {
      mainWindow = undefined;
    }
  });

  return win;
}

function normalizeQueueConcurrency(value) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed)) {
    return 2;
  }

  return Math.min(3, Math.max(1, parsed));
}

ipcMain.handle('choose-output-dir', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('open-output-folder', async (_event, folderPath) => {
  try {
    const target = String(folderPath || '').trim();
    if (!target) {
      throw new Error('No output folder selected.');
    }

    await fs.access(target);
    const error = await shell.openPath(target);
    if (error) {
      throw new Error(error);
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
});

ipcMain.handle('reveal-file', async (_event, filePath) => {
  try {
    const target = String(filePath || '').trim();
    if (!target) {
      throw new Error('No file is available to reveal.');
    }

    await fs.access(target);
    shell.showItemInFolder(target);

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
});

ipcMain.handle('check-for-updates', async () => checkForUpdates(mainWindow));

ipcMain.handle('capture-request', async (_event, payload) => {
  try {
    return await capturePage(payload);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
});

ipcMain.handle('capture-batch-request', async (event, payload) => {
  const urls = Array.isArray(payload.urls) ? payload.urls : [];
  const jobs = Array.isArray(payload.jobs) ? payload.jobs : [];
  const batchId = payload.batchId || 'default';
  const batchSettings = {
    ...(payload.settings || {}),
    appendTimestamp: true
  };

  const workItems = jobs.length > 0
    ? jobs
    : urls.map((url) => ({ url }));

  const queueConcurrency = normalizeQueueConcurrency(batchSettings.queueConcurrency);
  const total = workItems.length;
  const startedAt = Date.now();

  let completed = 0;
  let successCount = 0;
  let failureCount = 0;
  let totalDurationMs = 0;
  let maxDurationMs = 0;
  let nextIndex = 0;

  const results = new Array(total);

  async function worker() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;

      if (index >= total) {
        return;
      }

      const item = workItems[index];
      const url = item.url;
      const sizeLabel = item.sizeLabel || null;
      const started = Date.now();

      const result = await capturePage({
        ...batchSettings,
        ...item,
        url
      }).catch((error) => ({
        ok: false,
        error: error instanceof Error ? error.message : String(error)
      }));

      const durationMs = Date.now() - started;
      totalDurationMs += durationMs;
      maxDurationMs = Math.max(maxDurationMs, durationMs);
      completed += 1;

      if (result.ok) {
        successCount += 1;
        results[index] = {
          url,
          sizeLabel,
          ok: true,
          outputPath: result.outputPath,
          pixelWidth: result.pixelWidth,
          pixelHeight: result.pixelHeight,
          telemetry: result.telemetry,
          durationMs
        };
      } else {
        failureCount += 1;
        results[index] = {
          url,
          sizeLabel,
          ok: false,
          error: result.error,
          durationMs
        };
      }

      event.sender.send('capture-batch-progress', {
        batchId,
        completed,
        total,
        successCount,
        failureCount,
        currentUrl: sizeLabel ? `${url} (${sizeLabel})` : url,
        avgDurationMs: completed > 0 ? Math.round(totalDurationMs / completed) : 0,
        queueConcurrency
      });
    }
  }

  await Promise.all(Array.from({ length: Math.min(queueConcurrency, Math.max(1, total)) }, () => worker()));

  return {
    ok: true,
    batchId,
    total,
    completed,
    successCount,
    failureCount,
    queueConcurrency,
    telemetry: {
      totalMs: Date.now() - startedAt,
      avgDurationMs: completed > 0 ? Math.round(totalDurationMs / completed) : 0,
      maxDurationMs
    },
    results
  };
});

ipcMain.handle('preferences-get', async () => getPreferences());

ipcMain.handle('preferences-save', async (_event, payload) => savePreferences(payload));

app.whenReady().then(() => {
  createWindow();
  warmupCaptureBrowser().catch(() => {});
  setupAutoUpdater(mainWindow);

  setTimeout(() => {
    checkForUpdates(mainWindow).catch(() => {});
  }, 2500);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      setupAutoUpdater(mainWindow);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  await closeCaptureBrowser();
});
