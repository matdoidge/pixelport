const test = require('node:test');
const assert = require('node:assert/strict');
const { buildOutputFilename, slugifyPathname } = require('../src/core/filename');

test('slugifyPathname returns home for root', () => {
  assert.equal(slugifyPathname('/'), 'home');
});

test('slugifyPathname normalizes path', () => {
  assert.equal(slugifyPathname('/Pricing/Enterprise/'), 'pricing-enterprise');
});

test('buildOutputFilename is deterministic', () => {
  const file = buildOutputFilename({
    url: 'https://example.com/home',
    width: 1280,
    scale: 2,
    mode: 'full',
    extension: 'webp',
    appendTimestamp: false
  });

  assert.equal(file, 'example-com_home_1280px_2x_full.webp');
});
