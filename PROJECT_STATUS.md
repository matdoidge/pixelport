# Screengrabby Project Status

Last updated: 2026-02-12

## Completed

- Analyzed and implemented initial app foundation from `project_scope.md`.
- Scaffolded Electron desktop app structure.
- Added Playwright-based capture engine with:
  - URL normalization and validation
  - Viewport width/height controls
  - Device scale factor support (`1x`, `2x`, `3x`)
  - Capture modes: `fold` (above-the-fold) and `full` (full-page)
  - Output formats: `jpg`, `webp`
  - Quality control (`60-100`)
  - Stability controls:
    - `waitUntil`: `networkidle` or `domcontentloaded`
    - `timeoutMs`
    - `delayMs`
  - Deterministic file naming
  - Friendly error mapping for common failures
- Added basic renderer UI with form controls for all current capture settings.
- Added output folder picker and status log panel.
- Added in-app preview panel that shows the latest captured image.
- Improved form UX with inline validation messages and stricter submit gating.
- Added mode-aware height behavior (disabled for full-page mode).
- Added persistent app-level preferences storage (including output folder path).
- Refreshed renderer styling for a more modern, crisp UI.
- Optimized capture speed by reusing a persistent Chromium instance between captures.
- Added background browser warm-up on app start to reduce first-capture latency.
- Split UI into `Core Capture` and `Advanced Settings` sections.
- Re-themed UI to a dark, higher-character visual style with color accents.
- Set default load strategy to `domcontentloaded` for faster average captures.
- Added in-capture visual feedback with spinner and animated progress bar.
- Improved capture button contrast, readability, and interaction styling.
- Added queue mode for capturing multiple URLs in one run.
- Added queue thumbnail strip with clickable previews for each successful URL capture.
- Added output folder and last-file reveal actions for quick Finder access.
- Added per-thumbnail Reveal actions in queue results for direct file access.
- Added capture profiles: `Fast`, `Balanced`, and `Ultra`.
- Added cookie banner handling options and custom selector support.
- Added animation suppression option for deterministic captures.
- Added queue concurrency control (`1-3` workers) with parallel batch processing.
- Added consistency mode with sticky/fixed element suppression and media pausing.
- Added single-URL multi-size capture with selectable target presets.
- Enabled multi-size captures in queue mode (URL x preset job expansion).
- Added capture timing telemetry and surfaced timing metrics in UI status.
- Added reusable browser-context caching keyed by profile/viewport/scale to improve throughput.
- Added packaging configuration and scripts for macOS DMG output.
- Added baseline tests for filename generation utilities.
- Added README with local run/test instructions and known limitations.

## Current File Inventory

- `/Users/matdoidge/Code/screengrabby/src/main/index.js`
- `/Users/matdoidge/Code/screengrabby/src/preload/index.js`
- `/Users/matdoidge/Code/screengrabby/src/core/capture.js`
- `/Users/matdoidge/Code/screengrabby/src/core/validation.js`
- `/Users/matdoidge/Code/screengrabby/src/core/filename.js`
- `/Users/matdoidge/Code/screengrabby/src/renderer/index.html`
- `/Users/matdoidge/Code/screengrabby/src/renderer/renderer.js`
- `/Users/matdoidge/Code/screengrabby/src/renderer/styles.css`
- `/Users/matdoidge/Code/screengrabby/test/filename.test.js`
- `/Users/matdoidge/Code/screengrabby/README.md`

## Known Gaps vs Scope

- Packaging is configured but build artifacts are not yet validated in this environment.
- No end-to-end capture integration test yet.
- No diagnostics export/copy action yet.

## Next Steps (Priority Order)

1. Add preview flow in UI
- Completed on 2026-02-12.

2. Improve validation and UX hardening
- Completed on 2026-02-12.

3. Add integration test for capture output
- Capture known URL with fixed config.
- Assert file existence and expected pixel dimensions.

4. Add packaging pipeline
- Completed on 2026-02-12 (configuration + docs). Validate DMG build on host machine.

5. Add diagnostics panel actions
- Add copy diagnostics button for troubleshooting.

## Runbook

1. Install dependencies
```bash
npm install
```

2. Install Chromium for Playwright
```bash
npx playwright install chromium
```

3. Start app
```bash
npm start
```

4. Run tests
```bash
npm test
```

## Update Rule

After each meaningful change:
- Update `Completed` and `Known Gaps vs Scope`.
- Reorder `Next Steps` if priorities change.
- Refresh `Last updated` date.
