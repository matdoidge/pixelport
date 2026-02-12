Project Brief: macOS Desktop App for High-Res URL Screenshots

Overview

Build a macOS desktop application that captures high-quality screenshots of webpages from a given URL. The app must allow precise control over viewport width, pixel density (1x/2x/3x), and capture mode (above-the-fold vs full-page). Output should support JPG and WebP. A preview of the capture before exporting is desirable but not required for v1.

This is intended for a web design company producing social/marketing posts, so reliability and consistency are more important than “fastest possible”.

⸻

Goals
	•	Consistent high-resolution screenshots of URLs (more reliable than Chrome built-in capture).
	•	Control capture viewport width and pixel density (DPI / scale).
	•	Choose capture mode: above fold or full page.
	•	Export as JPG or WebP with adjustable quality.
	•	Provide presets for common screen sizes (laptop/desktop and social-friendly sizes).
	•	Simple UI suitable for internal team use.

⸻

Target Platform
	•	macOS (Apple Silicon and Intel if possible)
	•	Distribution: local/internal (not necessarily App Store)

⸻

Core User Flow
	1.	User enters a URL.
	2.	User selects:
	•	viewport width (preset or custom)
	•	scale factor (1x / 2x / 3x)
	•	capture mode (above fold or full page)
	•	output format (JPG / WebP) and quality
	3.	User clicks Preview (optional) and/or Capture.
	4.	App saves the image(s) to selected output folder (and can optionally show the result).

⸻

Functional Requirements

1) URL Input
	•	Single URL input field with validation.
	•	Auto-add https:// if missing (optional).
	•	Display clear error if page cannot load.

2) Viewport / Window Controls
	•	Capture should be based on a controlled browser viewport (not a literal window screenshot).
	•	Viewport width:
	•	Custom width input (px)
	•	Presets dropdown (examples):
	•	MacBook 13” width: 1280
	•	MacBook 14” width: 1512 (or include 1440 as a standard)
	•	Laptop common: 1366
	•	Desktop: 1920
	•	Social portrait: 1080 (optional)
	•	Viewport height:
	•	For “Above the fold”, use a fixed height from preset or a sensible default (e.g. 800 or 900), or allow custom height.
	•	For “Full page”, height should be full scroll height of the document.

(Agent note: viewport height matters for above-the-fold to be deterministic. Provide either a default height per preset or separate height control.)

3) Scale / DPI
	•	User chooses scale factor: 1x, 2x, 3x
	•	Scale should produce genuinely higher pixel density (not just upscaling after capture).
	•	Implementation should set device scale factor in the rendering engine.

4) Capture Modes
	•	Above the fold: capture only what is initially visible in the viewport at the top of the page.
	•	Full page: capture the entire page height.
	•	Optional: “Start capture after scrolling to selector” (out of scope unless easy).

5) Output Formats
	•	Export: JPG and WebP
	•	Quality control:
	•	JPG quality slider (e.g. 60–100)
	•	WebP quality slider (e.g. 60–100)
	•	Force background to white for transparent areas (so JPG looks correct).

6) Preview (Nice-to-have)
	•	Show a preview image in-app before saving.
	•	Preview should reflect the chosen settings (width/scale/mode).
	•	Not required for v1, but app design should not block adding it later.

7) Saving and Naming
	•	User selects output folder.
	•	Filenames should be deterministic, e.g.:
	•	{domain}_{path-slug}_{width}px_{scale}x_{mode}.{ext}
	•	Example: example-com_home_1280px_2x_full.webp
	•	Option: append timestamp to avoid overwrites.

8) Reliability Options (Must-have)

Expose minimal “stability” controls:
	•	Load strategy: networkidle / domcontentloaded (default: networkidle)
	•	Timeout (default 30s)
	•	Optional additional delay after load (e.g. 0–5000ms) for animations/fonts

9) Error Handling
	•	Clear, human-friendly errors:
	•	invalid URL
	•	navigation timeout
	•	page crashed
	•	blocked by auth / refused connection
	•	Log panel or “copy diagnostics” is a plus.

⸻

Non-Functional Requirements
	•	Fast enough for internal use, but prioritize consistency.
	•	Avoid flaky captures by waiting for fonts + network idle.
	•	Support modern websites (JS-heavy, responsive).
	•	Clean UI, minimal steps.

⸻

Suggested Technical Approach (Agent Guidance)

Recommended engine: Playwright (Chromium)
	•	Use Playwright to:
	•	launch headless Chromium
	•	set viewport width/height
	•	set deviceScaleFactor = 1/2/3
	•	navigate to URL with chosen wait strategy
	•	capture screenshot:
	•	fullPage: true for full page
	•	fullPage: false for fold
	•	Export:
	•	Playwright supports jpeg out of the box.
	•	For WebP:
	•	either capture as PNG then convert to WebP (e.g. using sharp in Node)
	•	or use Chromium screenshot type if supported in chosen version (verify).
	•	UI options:
	•	Native: SwiftUI app that shells out to a Node/Playwright worker process
	•	Or Electron/Tauri app with direct Node integration
	•	Ensure sandboxing/permissions for writing files.

⸻

Deliverables
	1.	macOS app (installable .app or DMG)
	2.	Source code repository with build instructions
	3.	Basic README including:
	•	how to run locally
	•	how to package for macOS
	•	known limitations
	4.	A small set of automated tests (optional but desirable):
	•	capture a known URL at a known width/scale and verify output file exists and has expected dimensions

⸻

Acceptance Criteria (Must Pass)
	•	Given a URL, the app outputs an image that matches:
	•	selected width
	•	selected scale (pixel dimensions increase appropriately)
	•	selected mode (fold vs full page)
	•	selected format (JPG or WebP) with quality control
	•	Presets work and are editable only via UI selection (no manual config required).
	•	Capture is repeatable (same inputs produce consistent results).
	•	Works on macOS Apple Silicon at minimum.

⸻

Out of Scope for v1 (Optional Later)
	•	Batch capture multiple URLs
	•	Cookie/banner auto-dismiss rules
	•	Auth/session profiles for staging logins
	•	Custom CSS injection (hide sticky headers, remove animations)
	•	Scheduling / watch mode
	•	Template overlays/mockups for social posts
