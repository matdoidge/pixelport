# Screengrabby

Screengrabby is a macOS desktop app for deterministic webpage screenshots with explicit control over viewport, scale, quality, and reliability.

## Features

- Single URL capture and queue mode (multiple URLs in one run)
- Profiles: `Fast`, `Balanced`, `Ultra`
- Capture modes: above-the-fold and full-page
- Output formats: JPG and WebP
- Quality, scale, timeout, wait strategy, and post-load delay controls
- Cookie banner handling: off, hide common banners, or attempt accept-then-hide
- Animation suppression for more stable screenshots
- In-app preview and capture progress feedback
- Queue thumbnails for quick visual QA
- Queue concurrency control (`1-3` workers)
- Single-URL multi-size capture in one run
- Consistency mode for cleaner, repeatable outputs
- Per-capture timing telemetry in status output
- Open output folder and reveal latest file actions
- Persistent preferences (including output folder)

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

## Output naming

`{domain}_{path-slug}_{width}px_{scale}x_{mode}.{ext}`

Example:

`example-com_home_1280px_2x_full.webp`

If timestamp is enabled, an ISO-style suffix is appended.

## Notes

- `domcontentloaded` is the default strategy for faster average captures.
- For highly dynamic pages, switch profile to `Ultra` or change wait strategy to `networkidle`.
