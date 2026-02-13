# PixelPort Marketing Site Scope (One-Page)

## Overview
Create a simple one-page marketing website for PixelPort that reflects the app's existing visual identity (dark gradient background, cyan/magenta accents, and high-contrast UI styling).

Primary goal: clearly communicate what PixelPort does, show the product/icon branding, and give users a direct path to download/get the app.

## Audience
- Designers and marketers who need reliable, high-quality website screenshots
- Internal teams evaluating PixelPort quickly

## Goals
- Explain PixelPort value in under 10 seconds
- Showcase key functionality with concise feature blurbs
- Display the PixelPort icon and App Store-style badge/download CTA
- Keep style consistent with the desktop app theme
- Work well on desktop and mobile

## Information Architecture (Single Page)
1. Hero
2. Features
3. Visual Preview
4. Download / CTA
5. Footer

## Section Requirements

### 1) Hero
Must include:
- App icon (from `assets/icon/pixelport-icon-source.png` or exported web-safe asset)
- Product name: `PixelPort`
- Short positioning blurb (1-2 lines)
- Primary CTA button: `Download for macOS` (or `Get PixelPort`)
- Optional secondary CTA: `View Features`

Suggested hero blurb:
"PixelPort delivers crisp, repeatable website screenshots with precise control over size, scale, and capture reliability."

### 2) Features
Include 4-6 concise feature cards with short descriptions. Suggested cards:
- Deterministic captures
- Full page and above-the-fold modes
- Multi-size output presets
- JPG/WebP export with quality control
- Queue capture for multiple URLs
- Reliability controls (wait strategy, delay, consistency mode)

### 3) Visual Preview
Include:
- One screenshot/mockup of the app UI or output
- Optional caption describing quality and repeatability

### 4) Download / CTA
Must include:
- App Store-style badge/icon treatment (visual only if not published, linked if published)
- Primary download button
- Optional small line for platform support: `macOS (Apple Silicon and Intel)`

If App Store listing is not live, use:
- `Download DMG` button
- `Coming soon to the App Store` text next to App Store badge visual

### 5) Footer
Include:
- Product name
- Short copyright/company line
- Optional links: privacy, support, GitHub/releases

## Visual Direction
Use the same theme language as the app:
- Background: deep navy/charcoal with subtle gradient/radial glow
- Accent colors: cyan + magenta
- Text: high-contrast whites and cool muted blue for secondary text
- Style: clean, technical, premium

## Design Tokens (Initial)
- `--bg: #070b13`
- `--bg-accent-1: #0b1f4d`
- `--bg-accent-2: #3d0f5d`
- `--bg-accent-3: #123a30`
- `--text: #f3f6ff`
- `--muted: #9fb0d7`
- `--accent: #39b7ff`
- `--accent-2: #ff5ed5`

## Functional Requirements
- Static one-page site (`index.html`, Tailwind-powered styles, optional `script.js`)
- Tailwind CSS is required for layout, spacing, typography, and responsive behavior
- Fully responsive layout across mobile, tablet, laptop, and wide desktop breakpoints
- Sticky top navigation with CTA button
- Smooth anchor scrolling between sections
- Accessible semantics and contrast-conscious styles
- Optimized images (web-friendly sizes/formats)

## Responsive Requirements (Explicit)
- Mobile-first implementation using Tailwind responsive utilities (`sm`, `md`, `lg`, `xl`, `2xl`)
- No horizontal scrolling at any supported viewport width
- Navigation, hero content, feature cards, and CTA stack/reflow cleanly at small widths
- Touch target sizing remains usable on mobile
- Typography and spacing scale consistently by breakpoint
- Image/media containers preserve aspect ratio and avoid layout shift

## Content Requirements
- Tone: concise, clear, capability-focused
- No long paragraphs; prefer short blurbs and bullets
- Avoid technical overload; focus on user outcomes

## Assets
Required:
- PixelPort app icon (`assets/icon/*`)
- One app screenshot or capture sample

Optional:
- App Store badge artwork
- Additional brand marks

## Out of Scope (v1)
- Multi-page marketing website
- Blog/docs CMS
- Analytics/dashboard integrations
- Localization
- Complex animation system

## Deliverables
1. `marketing/index.html`
2. `marketing/tailwind.config.js` (or project-level Tailwind config reference)
3. `marketing/assets/*` (optimized icon/screenshot/badge assets)
4. Short `marketing/README.md` with run/deploy notes (including Tailwind build/run steps)

## Acceptance Criteria
- Single page clearly communicates PixelPort purpose and key features
- Icon and App Store/download area are visibly present
- Visual style is recognizably aligned to the desktop app
- Layout is fully responsive and readable across mobile, tablet, laptop, and desktop
- No horizontal overflow or clipped UI at common breakpoints (>=320px through wide desktop)
- CTA is obvious and easy to find above the fold
