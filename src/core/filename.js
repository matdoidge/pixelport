function slugifyPathname(pathname) {
  if (!pathname || pathname === '/') {
    return 'home';
  }

  return pathname
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'home';
}

function toSafeDomain(hostname) {
  return hostname.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
}

function timestampPart(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-');
}

function buildOutputFilename({
  url,
  width,
  scale,
  mode,
  extension,
  appendTimestamp
}) {
  const parsed = new URL(url);
  const domain = toSafeDomain(parsed.hostname);
  const pathSlug = slugifyPathname(parsed.pathname);

  const base = `${domain}_${pathSlug}_${width}px_${scale}x_${mode}`;
  const suffix = appendTimestamp ? `_${timestampPart()}` : '';
  return `${base}${suffix}.${extension}`;
}

module.exports = {
  buildOutputFilename,
  slugifyPathname,
  toSafeDomain
};
