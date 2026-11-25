import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const require = createRequire(import.meta.url);
const { buildSync } = createRequire(require.resolve('vite'))('esbuild');
const loadComponent = (path) => {
  const result = buildSync({
    entryPoints: [fileURLToPath(new URL(`../src/pages/${path}.jsx`, import.meta.url))],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    jsx: 'automatic',
    define: { 'import.meta': '{"env":{}}' },
    alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(require, module, module.exports);
  return module.exports.default;
};

const BarrierModal = loadComponent('BarriersDrivers/BarrierDriverEditModal');
const TacticModal = loadComponent('CriticalActivities/CriticalActivityEditModal');
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));

const field = (html, label) => {
  const labels = [...html.matchAll(/<label\b[^>]*for="([^"]+)"[^>]*>([^<]+)<\/label>/g)];
  const id = labels.find((match) => match[2] === label)?.[1];
  assert.ok(id, `Missing label ${label}`);
  const controls = [...html.matchAll(/<(input|select|textarea)\b([^>]*)(?:>([\s\S]*?)<\/\1>|\/?>)/g)];
  const match = controls.find((entry) => entry[2].includes(`id="${id}"`));
  assert.ok(match, `Missing control ${label}`);
  return {
    tag: match[1],
    attrs: match[2],
    disabled: /\bdisabled=""/.test(match[2]),
    readOnly: /\breadonly=""/i.test(match[2]),
  };
};

const parent = {
  id: 'barrier',
  name: 'Historical Barrier',
  type: 'Barrier',
  indication: 'DLBCL',
  strategy: '',
  status: 'Closed',
  comments: 'Historical comment',
  legacyEditState: 'legacy',
};
const tactic = {
  id: 'tactic',
  name: 'Historical Tactic',
  barrierDriverId: parent.id,
  indication: 'DLBCL',
  status: 'Complete',
  dueDate: '',
  ownerLabel: 'Historical owner',
  details: 'Historical detail',
  legacyEditState: 'legacy',
  canDeactivate: false,
};
const tacticProps = {
  activity: tactic,
  parentRecord: parent,
  barrierDriverOptions: [parent],
  statusOptions: ['Planned', 'Complete'],
  medicalTacticOptions: ['Approved Tactic'],
  accountableOptions: ['Approved owner'],
};

test('legacy Barrier renders every field disabled and cannot be saved', () => {
  const html = render(BarrierModal, { record: parent, picklists: {} });
  for (const label of ['Indication', 'Medical Strategy', 'Barrier Title', 'Status', 'Comments']) {
    assert.equal(field(html, label).disabled, true, label);
  }
  assert.match(html, /<button type="submit"[^>]*disabled=""/);
});

test('Medical Tactic linked to a legacy Barrier renders every field read-only', () => {
  const html = render(TacticModal, tacticProps);
  for (const label of [
    'Linked Barrier/Opportunity',
    'Medical Tactic',
    'Medical Tactic Status',
    'Due Date',
    'Indication',
    'Accountable',
  ]) {
    assert.equal(field(html, label).disabled, true, label);
  }
  assert.equal(field(html, 'Details').readOnly, true);
  assert.doesNotMatch(html, />Delete<\/button>/);
  assert.match(html, /<button type="submit"[^>]*disabled=""/);
});

test('unknown candidate state fails closed for both edit forms', () => {
  for (const [component, props] of [
    [TacticModal, { ...tacticProps, activity: { ...tactic, legacyEditState: 'unknown' } }],
    [BarrierModal, { record: { ...parent, legacyEditState: 'unknown' }, picklists: {} }],
  ]) {
    const html = render(component, props);
    assert.match(html, /Unable to verify historical-record edit access/);
    assert.match(html, /<button type="submit"[^>]*disabled=""/);
  }
});
