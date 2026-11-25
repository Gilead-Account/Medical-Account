import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sidebarSource = await readFile(new URL('../src/components/Sidebar.jsx', import.meta.url), 'utf8');
const exportMenuOptions = sidebarSource.match(
  /const EXPORT_MENU_OPTIONS = \[[\s\S]*?\n\];/
)?.[0] || '';

test('account plan export menu exposes only Export to PPT', () => {
  const exportSectionOptions = [...exportMenuOptions.matchAll(
    /\{ key: '([^']+)', label: '([^']+)', section: 'export' \}/g
  )].map((match) => ({ key: match[1], label: match[2] }));

  assert.deepEqual(exportSectionOptions, [
    { key: 'export-ppt', label: 'Export to PPT' },
  ]);
  assert.doesNotMatch(exportMenuOptions, /Export to PDF/);
  assert.doesNotMatch(exportMenuOptions, /Executive Summary/);
});

test('approval actions remain separate from the PowerPoint export option', () => {
  assert.match(exportMenuOptions, /label: 'Submit for FD Approval', section: 'approval'/);
  assert.doesNotMatch(exportMenuOptions, /label: 'Submit Approval'/);
  assert.match(exportMenuOptions, /label: 'Approval History', section: 'approval'/);
});
