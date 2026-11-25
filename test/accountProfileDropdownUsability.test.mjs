import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const accountIntelligenceSource = await readFile(
  new URL('../src/pages/AccountProfile/AccountIntelligenceTab.jsx', import.meta.url),
  'utf8'
);
const accountProfileCss = await readFile(
  new URL('../src/pages/AccountProfile/AccountProfile.css', import.meta.url),
  'utf8'
);

test('Medical profile removes every orphan section-number render path', () => {
  assert.doesNotMatch(accountIntelligenceSource, /number:\s*'01'/);
  assert.doesNotMatch(accountIntelligenceSource, /section\.number/);
  assert.doesNotMatch(accountProfileCss, /account-intelligence-section-head\s*>\s*span/);
  assert.match(accountProfileCss, /account-intelligence-section-head\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto/);
});

test('Medical profile multiselect dismisses outside and with Escape', () => {
  assert.match(accountIntelligenceSource, /document\.addEventListener\('pointerdown',\s*handleOutsidePointer,\s*true\)/);
  assert.match(accountIntelligenceSource, /event\.key\s*!==\s*'Escape'/);
  assert.match(accountIntelligenceSource, /triggerRef\.current\?\.focus\(\)/);
});

test('Medical profile multiselect is portalled and viewport-aware', () => {
  assert.match(accountIntelligenceSource, /createPortal\(/);
  assert.match(accountIntelligenceSource, /window\.visualViewport/);
  assert.match(accountIntelligenceSource, /opensAbove/);
  assert.match(accountProfileCss, /\.medical-multiselect-menu\s*\{[\s\S]*?position:\s*fixed/);
  assert.match(accountProfileCss, /\.medical-multiselect-menu\s*\{[\s\S]*?max-width:\s*calc\(100vw\s*-\s*24px\)/);
});
