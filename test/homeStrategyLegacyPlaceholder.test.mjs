import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { homeSummaryTables } from '../src/lib/helper/utils.js';

const require = createRequire(import.meta.url);
const { buildSync } = createRequire(require.resolve('vite'))('esbuild');

// Render the real components with the same React instance as the renderer.
// Compilation is in memory; these tests do not connect to Veeva.
const loadComponent = (name) => {
  const result = buildSync({
    entryPoints: [fileURLToPath(new URL(`../src/pages/Overview/${name}.jsx`, import.meta.url))],
    bundle: true,
    write: false,
    platform: 'node',
    format: 'cjs',
    packages: 'external',
    jsx: 'automatic',
    alias: { '@': fileURLToPath(new URL('../src', import.meta.url)) },
  });
  const module = { exports: {} };
  new Function('require', 'module', 'exports', result.outputFiles[0].text)(
    require, module, module.exports
  );
  return module.exports.default;
};

const KiteStrategy = loadComponent('KiteStrategy');
const Summary = loadComponent('BarriersDriversSummary');
const renderStrategies = (props) => renderToStaticMarkup(React.createElement(KiteStrategy, props));
const strategyItems = (html) => [...html.matchAll(/class="strategy-column-item">([^<]*)</g)]
  .map((match) => match[1]);

test('Home Strategy omits dash-only entries in both indications and retains real strategies', () => {
  const props = {
    dlbcl: ['-', '  -  ', null, '', 'Improve access', 'Follow-up support'],
    mm: ['-', 'Coordinate education'],
  };
  const before = structuredClone(props);
  assert.deepEqual(strategyItems(renderStrategies(props)), [
    'Coordinate education', 'Improve access', 'Follow-up support',
  ]);
  assert.deepEqual(props, before, 'rendering must not modify the source values');
});

test('Grouped dash placeholders create no empty strategy group and preserve normal grouping', () => {
  const html = renderStrategies({
    dlbcl: ['Placeholder only | -', 'Access | -', 'Access | Improve reach', 'Access | Improve reach'],
    mm: ['Education | Coordinate education'],
  });
  assert.deepEqual(strategyItems(html), ['Coordinate education', 'Improve reach']);
  assert.doesNotMatch(html, /Placeholder only/);
  assert.equal((html.match(/<h4>Access<\/h4>/g) || []).length, 1);
});

test('unprefixed medical strategies render without a generic Strategy pill', () => {
  const html = renderStrategies({ dlbcl: ['Improve access'], mm: [] });
  assert.deepEqual(strategyItems(html), ['Improve access']);
  assert.doesNotMatch(html, /<h4>Strategy<\/h4>/);
});

test('All-placeholder Strategy lists keep both indication headings and the existing empty state', () => {
  const html = renderStrategies({ dlbcl: ['-', '  -  '], mm: ['-', null, ''] });
  assert.deepEqual(strategyItems(html), []);
  assert.equal((html.match(/class="strategy-column-empty">Not entered</g) || []).length, 2);
  assert.match(html, />DLBCL</);
  assert.match(html, />MM</);
});

test('Legacy records with dash Strategy remain in both homepage summary tables', () => {
  const barriers = [{
    id: 'local-barrier', type: 'Barrier', name: 'Historical barrier',
    indication: 'DLBCL', status: 'In Progress', strategy: '-',
  }];
  const drivers = [{
    id: 'local-opportunity', type: 'Driver', name: 'Historical opportunity',
    indication: 'MM', status: 'In Progress', strategy: '-',
  }];
  const before = structuredClone({ barriers, drivers });
  renderStrategies({ dlbcl: barriers.map((row) => row.strategy), mm: drivers.map((row) => row.strategy) });
  const tables = homeSummaryTables(barriers, drivers, []);
  assert.deepEqual(tables.flatMap((table) => table.rows.map((row) => row.id)), [
    'local-barrier', 'local-opportunity',
  ]);
  const html = renderToStaticMarkup(React.createElement(Summary, {
    tables, openActivityCountByBarrier: {}, onEditRow: () => {},
  }));
  assert.match(html, /Historical barrier/);
  assert.match(html, /Historical opportunity/);
  assert.deepEqual({ barriers, drivers }, before);
});
