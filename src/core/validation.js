function normalizeUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || rawUrl.trim().length === 0) {
    throw new Error('Please enter a URL.');
  }

  const input = rawUrl.trim();
  const withProtocol = /^https?:\/\//i.test(input) ? input : `https://${input}`;

  let parsed;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new Error('The URL is invalid. Example: https://example.com');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are supported.');
  }

  return parsed.toString();
}

function toPositiveInt(value, label) {
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive number.`);
  }

  return parsed;
}

function normalizeCaptureInput(payload) {
  const mode = payload.mode === 'full' ? 'full' : 'fold';
  const format = payload.format === 'webp' ? 'webp' : 'jpg';
  const waitUntil = payload.waitUntil === 'networkidle' ? 'networkidle' : 'domcontentloaded';
  const scale = [1, 2, 3].includes(Number(payload.scale)) ? Number(payload.scale) : 2;
  const cookieHandling = ['off', 'hide', 'accept'].includes(payload.cookieHandling) ? payload.cookieHandling : 'hide';
  const profile = ['fast', 'balanced', 'ultra'].includes(payload.profile) ? payload.profile : 'balanced';

  const width = toPositiveInt(payload.width, 'Width');
  const height = toPositiveInt(payload.height, 'Height');
  const timeoutMs = toPositiveInt(payload.timeoutMs ?? 30000, 'Timeout');
  const delayMs = Math.max(0, Number.parseInt(String(payload.delayMs ?? 0), 10) || 0);
  const quality = Math.min(100, Math.max(60, Number.parseInt(String(payload.quality ?? 90), 10) || 90));
  const suppressAnimations = Boolean(payload.suppressAnimations);
  const queueConcurrency = Math.min(3, Math.max(1, Number.parseInt(String(payload.queueConcurrency ?? 2), 10) || 2));
  const consistencyMode = Boolean(payload.consistencyMode);
  const consistencyDelayMs = Math.max(0, Number.parseInt(String(payload.consistencyDelayMs ?? 800), 10) || 0);

  let cookieSelectors = [];
  if (Array.isArray(payload.cookieSelectors)) {
    cookieSelectors = payload.cookieSelectors.map((value) => String(value).trim()).filter(Boolean);
  } else if (typeof payload.cookieSelectors === 'string') {
    cookieSelectors = payload.cookieSelectors
      .split(/\r?\n|,/)
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (!payload.outputDir || String(payload.outputDir).trim().length === 0) {
    throw new Error('Please select an output folder.');
  }

  return {
    url: normalizeUrl(payload.url),
    mode,
    format,
    waitUntil,
    profile,
    scale,
    width,
    height,
    quality,
    timeoutMs,
    delayMs,
    cookieHandling,
    cookieSelectors,
    suppressAnimations,
    consistencyMode,
    consistencyDelayMs,
    queueConcurrency,
    appendTimestamp: Boolean(payload.appendTimestamp),
    outputDir: String(payload.outputDir)
  };
}

module.exports = {
  normalizeCaptureInput,
  normalizeUrl
};
