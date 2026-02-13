const path = require('node:path');
const fs = require('node:fs/promises');
const sharp = require('sharp');

const DEFAULT_TILE_SIZE = 2048;

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function toTileFilePath(row, col) {
  return `tiles/tile_r${String(row).padStart(3, '0')}_c${String(col).padStart(3, '0')}.png`;
}

async function exportFigmaBundle(payload) {
  const imagePath = String(payload && payload.imagePath ? payload.imagePath : '').trim();
  if (!imagePath) {
    throw new Error('No capture image was provided.');
  }

  await fs.access(imagePath);

  const tileSize = toPositiveInt(payload && payload.tileSize, DEFAULT_TILE_SIZE);
  const outputRoot = String(payload && payload.outputDir ? payload.outputDir : path.dirname(imagePath)).trim();
  if (!outputRoot) {
    throw new Error('No output folder available for Figma bundle export.');
  }

  await fs.mkdir(outputRoot, { recursive: true });

  const image = sharp(imagePath, { failOn: 'none' });
  const metadata = await image.metadata();
  const width = metadata.width;
  const height = metadata.height;

  if (!width || !height) {
    throw new Error('Could not read image dimensions for Figma export.');
  }

  const baseName = path.parse(imagePath).name;
  const bundleDirName = `${baseName}_figma_bundle`;
  const bundleDir = path.join(outputRoot, bundleDirName);
  const tilesDir = path.join(bundleDir, 'tiles');

  await fs.rm(bundleDir, { recursive: true, force: true });
  await fs.mkdir(tilesDir, { recursive: true });

  const columns = Math.ceil(width / tileSize);
  const rows = Math.ceil(height / tileSize);
  const tiles = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const left = col * tileSize;
      const top = row * tileSize;
      const tileWidth = Math.min(tileSize, width - left);
      const tileHeight = Math.min(tileSize, height - top);
      const relativePath = toTileFilePath(row, col);
      const tileOutputPath = path.join(bundleDir, relativePath);

      await image
        .clone()
        .extract({ left, top, width: tileWidth, height: tileHeight })
        .png()
        .toFile(tileOutputPath);

      tiles.push({
        row,
        col,
        x: left,
        y: top,
        width: tileWidth,
        height: tileHeight,
        file: relativePath
      });
    }
  }

  const manifest = {
    version: 1,
    source: {
      fileName: path.basename(imagePath),
      width,
      height,
      format: (metadata.format || 'png').toLowerCase()
    },
    frame: {
      name: `${baseName} (PixelPort)`,
      width,
      height
    },
    tiles: {
      tileSize,
      rows,
      columns,
      count: tiles.length,
      files: tiles
    },
    exportedAt: new Date().toISOString()
  };

  const manifestPath = path.join(bundleDir, 'manifest.json');
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  return {
    ok: true,
    bundleDir,
    manifestPath,
    tileSize,
    tileCount: tiles.length,
    rows,
    columns,
    width,
    height
  };
}

module.exports = {
  exportFigmaBundle,
  DEFAULT_TILE_SIZE
};
