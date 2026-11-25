import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const stakeholdersTab = await readFile(
  new URL('../src/pages/Stakeholders/StakeholdersTab.jsx', import.meta.url),
  'utf8'
);
const stakeholdersCss = await readFile(
  new URL('../src/pages/Stakeholders/Stakeholders.css', import.meta.url),
  'utf8'
);

test('Stakeholder count stays on the right without an Add action', () => {
  assert.doesNotMatch(stakeholdersTab, /Add Stakeholder|stakeholder-add-button|onAdd/);
  assert.match(
    stakeholdersCss,
    /Keep the stakeholder count on the right[\s\S]*?grid-template-columns:\s*max-content minmax\(0, 1fr\) !important;/
  );
  assert.match(
    stakeholdersCss,
    /Keep the stakeholder count on the right[\s\S]*?\.stakeholder-toolbar-actions\s*\{[\s\S]*?justify-self:\s*end;/
  );
});
