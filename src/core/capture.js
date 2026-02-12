const path = require('node:path');
const fs = require('node:fs/promises');
const { performance } = require('node:perf_hooks');
const { chromium } = require('playwright');
const sharp = require('sharp');
const { buildOutputFilename } = require('./filename');
const { normalizeCaptureInput } = require('./validation');

let browserPromise;
const contextPromises = new Map();

const DEFAULT_COOKIE_SELECTORS = [
  '#onetrust-banner-sdk',
  '#onetrust-consent-sdk',
  '.ot-sdk-container',
  '.ot-sdk-row',
  '[id*="cookie" i][id*="banner" i]',
  '[class*="cookie" i][class*="banner" i]',
  '[class*="consent" i][class*="banner" i]',
  '[data-testid*="cookie" i]',
  '[aria-label*="cookie" i]',
  '[role="dialog"][aria-label*="cookie" i]'
];

const COOKIE_ACCEPT_LABELS = [
  'accept',
  'accept all',
  'allow all',
  'agree',
  'i agree',
  'ok',
  'got it'
];

function ms(value) {
  return Math.round(value);
}

function formatError(error) {
  if (!(error instanceof Error)) {
    return 'Unknown capture error.';
  }

  const message = error.message.toLowerCase();

  if (message.includes('timeout')) {
    return 'Navigation timed out. Try a longer timeout or a different wait strategy.';
  }

  if (message.includes('net::err_name_not_resolved') || message.includes('failed to resolve')) {
    return 'Could not resolve the URL host. Check the address and your connection.';
  }

  if (message.includes('net::err_connection_refused')) {
    return 'Connection was refused by the destination server.';
  }

  if (message.includes('crash')) {
    return 'The browser page crashed during capture.';
  }

  return error.message;
}

function contextKeyForInput(input) {
  return [
    `profile:${input.profile}`,
    `w:${input.width}`,
    `h:${input.height}`,
    `s:${input.scale}`,
    `rm:${input.suppressAnimations ? 1 : 0}`
  ].join('|');
}

function resetBrowserState() {
  browserPromise = undefined;
  contextPromises.clear();
}

async function waitForFonts(page) {
  await page.evaluate(async () => {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }
  });
}

async function suppressAnimations(page) {
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
        caret-color: transparent !important;
      }
    `
  });
}

async function clickCookieAccept(page) {
  await page.evaluate((labels) => {
    const textMatch = (value) => {
      const normalized = value.trim().toLowerCase();
      return labels.some((label) => normalized === label || normalized.includes(label));
    };

    const maybeClick = (elements) => {
      for (const el of elements) {
        const text = (el.textContent || '').trim().toLowerCase();
        if (textMatch(text)) {
          el.click();
          return true;
        }
      }
      return false;
    };

    const candidates = [
      ...document.querySelectorAll('button'),
      ...document.querySelectorAll('a[role="button"]'),
      ...document.querySelectorAll('[role="button"]')
    ];

    maybeClick(candidates);
  }, COOKIE_ACCEPT_LABELS);
}

async function hideCookieBanners(page, customSelectors) {
  const selectors = [...DEFAULT_COOKIE_SELECTORS, ...(customSelectors || [])];

  await page.evaluate((list) => {
    const unique = [...new Set(list)];
    unique.forEach((selector) => {
      document.querySelectorAll(selector).forEach((node) => {
        const el = node;
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('opacity', '0', 'important');
        el.setAttribute('aria-hidden', 'true');
      });
    });
  }, selectors);
}

async function applyConsistencyMode(page) {
  await page.evaluate(() => {
    document.querySelectorAll('video, audio').forEach((media) => {
      try {
        media.pause();
        media.currentTime = 0;
      } catch {
        // Ignore media elements that cannot be controlled.
      }
    });

    const all = document.querySelectorAll('*');
    all.forEach((node) => {
      const el = node;
      const style = window.getComputedStyle(el);
      const position = style.position;
      if (position !== 'fixed' && position !== 'sticky') {
        return;
      }

      const rect = el.getBoundingClientRect();
      const nearTop = rect.top <= 140;
      const nearBottom = window.innerHeight - rect.bottom <= 140;
      const smallEnough = rect.height <= 240;

      if ((nearTop || nearBottom) && smallEnough) {
        el.style.setProperty('display', 'none', 'important');
        el.style.setProperty('visibility', 'hidden', 'important');
        el.style.setProperty('opacity', '0', 'important');
      }
    });
  });
}

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true });
  }

  try {
    return await browserPromise;
  } catch (error) {
    resetBrowserState();
    throw error;
  }
}

async function getContext(browser, input) {
  const key = contextKeyForInput(input);

  if (!contextPromises.has(key)) {
    const promise = browser.newContext({
      viewport: {
        width: input.width,
        height: input.height
      },
      deviceScaleFactor: input.scale,
      reducedMotion: input.suppressAnimations ? 'reduce' : 'no-preference'
    }).catch((error) => {
      contextPromises.delete(key);
      throw error;
    });

    contextPromises.set(key, promise);
  }

  const context = await contextPromises.get(key);
  return { key, context };
}

async function warmupCaptureBrowser() {
  await getBrowser();
}

async function closeCaptureBrowser() {
  const contexts = [...contextPromises.values()];
  contextPromises.clear();

  await Promise.all(contexts.map(async (promise) => {
    try {
      const context = await promise;
      await context.close();
    } catch {
      // Ignore context close failures during shutdown.
    }
  }));

  if (!browserPromise) {
    return;
  }

  const browser = await browserPromise;
  await browser.close();
  resetBrowserState();
}

async function capturePage(rawPayload) {
  const input = normalizeCaptureInput(rawPayload);
  const totalStart = performance.now();

  await fs.mkdir(input.outputDir, { recursive: true });

  const extension = input.format === 'webp' ? 'webp' : 'jpg';
  const outputFilename = buildOutputFilename({
    url: input.url,
    width: input.width,
    scale: input.scale,
    mode: input.mode,
    extension,
    appendTimestamp: input.appendTimestamp
  });

  const outputPath = path.join(input.outputDir, outputFilename);

  let page;
  let context;
  let contextKey;

  let navigationMs = 0;
  let prepareMs = 0;
  let screenshotMs = 0;
  let encodeMs = 0;

  try {
    const browser = await getBrowser();
    const contextResult = await getContext(browser, input);
    context = contextResult.context;
    contextKey = contextResult.key;

    await context.clearCookies();

    page = await context.newPage();

    const navigationStart = performance.now();
    await page.goto(input.url, {
      waitUntil: input.waitUntil,
      timeout: input.timeoutMs
    });
    navigationMs = performance.now() - navigationStart;

    const prepareStart = performance.now();

    if (input.suppressAnimations) {
      await suppressAnimations(page);
    }

    if (input.cookieHandling === 'accept') {
      await clickCookieAccept(page);
      await page.waitForTimeout(300);
      await hideCookieBanners(page, input.cookieSelectors);
    } else if (input.cookieHandling === 'hide') {
      await hideCookieBanners(page, input.cookieSelectors);
    }

    if (input.consistencyMode) {
      await applyConsistencyMode(page);
    }

    await waitForFonts(page);

    const effectiveDelayMs = Math.max(
      input.delayMs,
      input.consistencyMode ? input.consistencyDelayMs : 0
    );

    if (effectiveDelayMs > 0) {
      await page.waitForTimeout(effectiveDelayMs);
    }

    prepareMs = performance.now() - prepareStart;

    const fullPage = input.mode === 'full';

    let pixelWidth;
    let pixelHeight;

    if (input.format === 'jpg') {
      const screenshotStart = performance.now();
      const jpegBuffer = await page.screenshot({
        type: 'jpeg',
        quality: input.quality,
        fullPage,
        omitBackground: false
      });
      screenshotMs = performance.now() - screenshotStart;

      const encodeStart = performance.now();
      await fs.writeFile(outputPath, jpegBuffer);
      const metadata = await sharp(jpegBuffer).metadata();
      pixelWidth = metadata.width;
      pixelHeight = metadata.height;
      encodeMs = performance.now() - encodeStart;
    } else {
      const screenshotStart = performance.now();
      const pngBuffer = await page.screenshot({
        type: 'png',
        fullPage,
        omitBackground: false
      });
      screenshotMs = performance.now() - screenshotStart;

      const encodeStart = performance.now();
      const info = await sharp(pngBuffer)
        .flatten({ background: '#ffffff' })
        .webp({ quality: input.quality })
        .toFile(outputPath);
      pixelWidth = info.width;
      pixelHeight = info.height;
      encodeMs = performance.now() - encodeStart;
    }

    const totalMs = performance.now() - totalStart;

    return {
      ok: true,
      outputPath,
      pixelWidth,
      pixelHeight,
      message: `Saved ${path.basename(outputPath)}`,
      telemetry: {
        navigationMs: ms(navigationMs),
        prepareMs: ms(prepareMs),
        screenshotMs: ms(screenshotMs),
        encodeMs: ms(encodeMs),
        totalMs: ms(totalMs),
        contextKey
      }
    };
  } catch (error) {
    const lowered = String(error).toLowerCase();
    if (lowered.includes('browser has been closed') || lowered.includes('target page, context or browser has been closed')) {
      resetBrowserState();
    }

    throw new Error(formatError(error));
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
}

module.exports = {
  capturePage,
  closeCaptureBrowser,
  warmupCaptureBrowser
};
