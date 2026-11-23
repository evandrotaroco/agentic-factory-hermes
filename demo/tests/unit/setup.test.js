import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const manifestUrl = new URL('../../package.json', import.meta.url);

test('o manifesto é privado, usa ESM e expõe os comandos do plano', () => {
  const manifest = JSON.parse(readFileSync(manifestUrl, 'utf8'));

  assert.equal(manifest.private, true);
  assert.equal(manifest.type, 'module');
  assert.equal(manifest.scripts.test, 'node --test "tests/unit/*.test.js" && playwright test');
  assert.equal(manifest.scripts['browser:install'], 'playwright install chromium');
});
