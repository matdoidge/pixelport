figma.showUI(__html__, { width: 420, height: 540, title: 'PixelPort Importer' });

function buildTileMap(items) {
  const map = new Map();
  for (const item of items) {
    if (!item || typeof item.file !== 'string' || !item.bytes) {
      continue;
    }
    map.set(item.file, item.bytes);
  }
  return map;
}

async function importBundle(payload) {
  const manifest = payload && payload.manifest;
  const files = payload && Array.isArray(payload.files) ? payload.files : [];

  if (!manifest || typeof manifest !== 'object') {
    throw new Error('Manifest data is missing.');
  }

  if (!manifest.frame || !Number.isFinite(manifest.frame.width) || !Number.isFinite(manifest.frame.height)) {
    throw new Error('Manifest frame size is invalid.');
  }

  const tileDefs = manifest.tiles && Array.isArray(manifest.tiles.files)
    ? manifest.tiles.files
    : [];

  if (tileDefs.length === 0) {
    throw new Error('No tile entries were found in the manifest.');
  }

  const fileMap = buildTileMap(files);

  const frame = figma.createFrame();
  frame.name = manifest.frame.name || 'PixelPort Capture';
  frame.resizeWithoutConstraints(manifest.frame.width, manifest.frame.height);
  frame.clipsContent = true;

  for (const tile of tileDefs) {
    const fileName = tile.file;
    const bytes = fileMap.get(fileName);

    if (!bytes) {
      throw new Error('Missing tile file: ' + fileName);
    }

    const image = figma.createImage(bytes);
    const rect = figma.createRectangle();
    rect.name = `Tile ${tile.row}-${tile.col}`;
    rect.resize(tile.width, tile.height);
    rect.x = tile.x;
    rect.y = tile.y;
    rect.fills = [
      {
        type: 'IMAGE',
        imageHash: image.hash,
        scaleMode: 'FILL'
      }
    ];

    frame.appendChild(rect);
  }

  figma.currentPage.appendChild(frame);
  figma.currentPage.selection = [frame];
  figma.viewport.scrollAndZoomIntoView([frame]);
}

figma.ui.onmessage = async (msg) => {
  if (!msg || typeof msg !== 'object') {
    return;
  }

  if (msg.type === 'cancel') {
    figma.closePlugin('Import cancelled.');
    return;
  }

  if (msg.type === 'import-bundle') {
    try {
      await importBundle(msg.payload || {});
      figma.closePlugin('PixelPort bundle imported.');
    } catch (error) {
      figma.notify(error instanceof Error ? error.message : String(error), { error: true });
      figma.ui.postMessage({
        type: 'import-error',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
};
