# PixelPort

PixelPort is a macOS desktop app for deterministic webpage screenshots with explicit control over viewport, scale, quality, and reliability.

## Features

- Single URL capture and queue mode (multiple URLs in one run)
- Profiles: `Fast`, `Balanced`, `Ultra`
- Capture modes: above-the-fold and full-page
- Output formats: JPG and WebP
- Quality, scale, timeout, wait strategy, and post-load delay controls
- Cookie banner handling: off, hide common banners, or attempt accept-then-hide
- Animation suppression and consistency mode for repeatable outputs
- Single and queue multi-size capture
- Queue thumbnails for quick visual QA
- Queue concurrency control (`1-3` workers)
- Per-capture timing telemetry in status output
- Open output folder and reveal latest file actions
- Persistent preferences (including output folder)
- In-app auto-update checks (packaged builds)

## Run locally

1. Install dependencies:

```bash
npm install
```

2. Install Playwright Chromium binary (first run only):

```bash
npx playwright install chromium
```

3. Start the app:

```bash
npm start
```

## Test

```bash
npm test
```

## Package for sharing (macOS)

Build a distributable DMG:

```bash
npm run dist:mac
```

Build an unpacked app directory (faster for local checks):

```bash
npm run pack:mac
```

Output artifacts are written to `dist/`.

## Auto-update setup

Auto-update is wired via `electron-updater` and checks on app launch (packaged builds only).

### 1. Choose update host

You can use any of:

- GitHub Releases
- S3/static bucket
- private/internal HTTP server

Current `package.json` is configured with a placeholder generic provider:

- `build.publish[0].provider = generic`
- `build.publish[0].url = https://example.com/pixelport-updates`

Replace this URL with your real update feed location.

### 2. Publish release artifacts

For each app version:

1. Bump `version` in `package.json`
2. Build DMG using `npm run dist:mac`
3. Upload generated artifacts from `dist/` to your publish location, including the generated update metadata file(s)

### 3. Client update behavior

- App checks for updates on launch
- Status appears in the app status panel
- Manual check is available via `Check for Updates`
- Downloaded updates are installed on app restart/quit

## Output naming

`{domain}_{path-slug}_{width}px_{scale}x_{mode}.{ext}`

Example:

`example-com_home_1280px_2x_full.webp`

If timestamp is enabled, an ISO-style suffix is appended.
