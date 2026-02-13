#!/usr/bin/env node

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function run(command, options = {}) {
  execSync(command, {
    stdio: 'inherit',
    ...options
  });
}

function runCapture(command) {
  return execSync(command, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}

function fail(message) {
  console.error(`Release aborted: ${message}`);
  process.exit(1);
}

const bumpType = process.argv[2] || 'patch';
const runTests = !process.argv.includes('--no-test');
const validTypes = new Set(['patch', 'minor', 'major']);

if (!validTypes.has(bumpType)) {
  fail(`Invalid bump type \"${bumpType}\". Use patch, minor, or major.`);
}

try {
  runCapture('git rev-parse --is-inside-work-tree');
} catch {
  fail('This command must run inside a git repository.');
}

try {
  runCapture('git rev-parse --abbrev-ref HEAD');
} catch {
  fail('Unable to determine current branch.');
}

try {
  if (runTests) {
    run('npm test');
  }

  run(`npm version ${bumpType} --no-git-tag-version`);

  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version;
  const tag = `v${version}`;

  if (!version) {
    fail('Could not read new version from package.json.');
  }

  try {
    runCapture(`git rev-parse -q --verify refs/tags/${tag}`);
    fail(`Tag ${tag} already exists.`);
  } catch {
    // Tag does not exist yet.
  }

  run('git add -A');

  try {
    runCapture('git diff --cached --quiet');
    fail('No staged changes to commit after version bump.');
  } catch {
    // There are staged changes.
  }

  run(`git commit -m "release: ${tag}"`);
  run(`git tag ${tag}`);
  run('git push --follow-tags');

  console.log(`Release complete: ${tag}`);
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
