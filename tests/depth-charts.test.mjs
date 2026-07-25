import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PACKAGE_TEMPLATES, WORKSPACE_SCHEMA_VERSION, STORAGE_KEY } from '../site/src/constants.js';

test('depth chart foundation advances isolated workspace schema', () => {
  assert.equal(WORKSPACE_SCHEMA_VERSION, 3);
  assert.equal(STORAGE_KEY, 'three-phase-hq.workspace.v3');
});

test('starter package templates cover all three phases', () => {
  const units = new Set(PACKAGE_TEMPLATES.map((item) => item.unit));
  assert.deepEqual([...units].sort(), ['Defense', 'Offense', 'Special Teams'].sort());
  assert.ok(PACKAGE_TEMPLATES.some((item) => item.id === 'offense-11'));
  assert.ok(PACKAGE_TEMPLATES.some((item) => item.id === 'defense-425'));
  assert.ok(PACKAGE_TEMPLATES.some((item) => item.id === 'st-punt'));
});

test('every starter template has eleven football assignments', () => {
  for (const template of PACKAGE_TEMPLATES) assert.equal(template.slots.length, 11, template.name);
});

test('depth chart UI is loaded as an independent module and tablet stylesheet', async () => {
  const html = await readFile(new URL('../site/index.html', import.meta.url), 'utf8');
  assert.match(html, /depth-charts\.css/);
  assert.match(html, /depth-charts\.js/);
});

test('depth chart module provides starter and two backup levels without drag dependency', async () => {
  const js = await readFile(new URL('../site/src/depth-charts.js', import.meta.url), 'utf8');
  assert.match(js, /Starter/);
  assert.match(js, /Backup 1/);
  assert.match(js, /Backup 2/);
  assert.doesNotMatch(js, /draggable\s*=|dragstart|drop\s*\(/i);
});
