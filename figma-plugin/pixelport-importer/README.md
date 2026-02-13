# PixelPort Figma Importer (Local Plugin)

This plugin imports a PixelPort tiled bundle (`manifest.json` + `tiles/*.png`) and reassembles it into a full-size frame in Figma.

## Load plugin in Figma

1. Open Figma desktop app.
2. Go to `Plugins` -> `Development` -> `Import plugin from manifest...`.
3. Choose `figma-plugin/pixelport-importer/manifest.json`.

## Use with PixelPort

1. Capture in PixelPort.
2. Click `Send to Figma` in PixelPort.
3. In Figma, run `PixelPort Bundle Importer` plugin.
4. Select the exported bundle folder.
5. Click `Import Bundle`.

The plugin creates one frame at original image dimensions and places tile rectangles to reconstruct the screenshot.
