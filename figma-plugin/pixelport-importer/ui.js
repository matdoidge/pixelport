const picker = document.getElementById('bundle-files');
const importButton = document.getElementById('import');
const cancelButton = document.getElementById('cancel');
const statusNode = document.getElementById('status');

let selectedFiles = [];

function setStatus(message) {
  statusNode.textContent = message;
}

function normalizeRelativePath(file) {
  const root = file.webkitRelativePath || file.name;
  return root
    .split('/')
    .slice(1)
    .join('/');
}

async function readBundleSelection(files) {
  const all = Array.from(files || []);
  const normalized = all.map((file) => ({
    file,
    relativePath: normalizeRelativePath(file)
  }));

  const manifestEntry = normalized.find((item) => item.relativePath === 'manifest.json');
  if (!manifestEntry) {
    throw new Error('manifest.json was not found in the selected folder.');
  }

  const manifest = JSON.parse(await manifestEntry.file.text());
  const requiredTiles = manifest && manifest.tiles && Array.isArray(manifest.tiles.files)
    ? manifest.tiles.files
    : [];

  if (requiredTiles.length === 0) {
    throw new Error('Manifest has no tile entries.');
  }

  const map = new Map();
  normalized.forEach((item) => {
    map.set(item.relativePath, item.file);
  });

  const tileFiles = [];
  for (const tile of requiredTiles) {
    if (!tile || typeof tile.file !== 'string') {
      continue;
    }

    const file = map.get(tile.file);
    if (!file) {
      throw new Error(`Missing tile file: ${tile.file}`);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    tileFiles.push({
      file: tile.file,
      bytes
    });
  }

  return {
    manifest,
    files: tileFiles
  };
}

picker.addEventListener('change', () => {
  selectedFiles = Array.from(picker.files || []);
  importButton.disabled = selectedFiles.length === 0;
  setStatus(selectedFiles.length > 0
    ? `Selected ${selectedFiles.length} files. Ready to import.`
    : 'Waiting for bundle selection.');
});

importButton.addEventListener('click', async () => {
  if (selectedFiles.length === 0) {
    setStatus('Select a PixelPort bundle folder first.');
    return;
  }

  importButton.disabled = true;
  setStatus('Reading bundle and importing into Figma...');

  try {
    const payload = await readBundleSelection(selectedFiles);
    parent.postMessage({ pluginMessage: { type: 'import-bundle', payload } }, '*');
  } catch (error) {
    importButton.disabled = false;
    setStatus(error instanceof Error ? error.message : String(error));
  }
});

cancelButton.addEventListener('click', () => {
  parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*');
});

window.onmessage = (event) => {
  const pluginMessage = event.data && event.data.pluginMessage;
  if (!pluginMessage) {
    return;
  }

  if (pluginMessage.type === 'import-error') {
    importButton.disabled = false;
    setStatus(pluginMessage.message || 'Import failed.');
  }
};
