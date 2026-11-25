import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

const packageJson = JSON.parse(await read('../package.json'));
const viteSource = await read('../vite.config.js');
const appSource = await read('../src/App.jsx');
const sharedSource = await read('../src/lib/dataservice/accountPlan/shared.js');
const teamMembersSource = await read('../src/lib/dataservice/accountPlan/teamMembers.js');

test('the default deployable build uses the live Veeva DataService mode', () => {
  assert.match(packageJson.scripts.build, /vite build --mode production/);
  assert.match(packageJson.scripts.build, /postbuild\.mjs live/);
  assert.match(viteSource, /mockAdapter\.live\.js/);
});

test('live application source has no seeded Account Plan or dummy header value', () => {
  assert.doesNotMatch(appSource, /LOCAL_MRD_DEMO_PLAN|FY26 Medical Account Plan - Northstar ATC|Mock1/);
  assert.doesNotMatch(sharedSource, /MM_ACCOUNT_PRIORITY_DUMMY|mmAccountPriority:\s*['"]On hold['"]/);
  assert.match(sharedSource, /mmAccountPriority:\s*null/);
});

test('Team Member options come from CRM metadata and fetched CRM rows only', () => {
  assert.doesNotMatch(teamMembersSource, /FALLBACK_PICKLISTS/);
  assert.match(teamMembersSource, /participationOptions:\s*mergeWithDataValues\(\s*participationPicklist,/);
  assert.match(teamMembersSource, /statusOptions:\s*mergeWithDataValues\(\s*statusPicklist,/);
});
