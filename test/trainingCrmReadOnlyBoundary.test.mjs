import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const clientPath = new URL('../src/lib/dataservice/client.js', import.meta.url);
const queryPath = new URL('../src/lib/dataservice/query.js', import.meta.url);
const appPath = new URL('../src/App.jsx', import.meta.url);
const sharedPath = new URL('../src/lib/dataservice/accountPlan/shared.js', import.meta.url);

test('hybrid CRM bridge exposes reads but no mutation methods', async () => {
  const source = await readFile(clientPath, 'utf8');

  assert.match(source, /export const crmReadDs = Object\.freeze\(/);
  assert.match(source, /runQuery: \(\.\.\.args\)/);
  assert.match(source, /getDataForCurrentObject: \(\.\.\.args\)/);
  assert.match(source, /getPicklistValueLabels: \(\.\.\.args\)/);
  const readBridge = source.match(/export const crmReadDs = Object\.freeze\(\{[\s\S]*?\n\}\);/)?.[0] || '';
  assert.doesNotMatch(readBridge, /(?:createRecord|updateRecord|deleteRecord)\s*:/);
});

test('mutation wrappers default to the mock-selectable ds channel', async () => {
  const source = await readFile(queryPath, 'utf8');

  assert.match(source, /export const createRecord[\s\S]*?return ds\.createRecord/);
  assert.match(source, /export const updateRecord[\s\S]*?options\.crm \? crmUpdateDs : ds/);
  assert.match(source, /export const deleteRecord[\s\S]*?return ds\.deleteRecord/);
  assert.doesNotMatch(source, /crmReadDs\.(?:createRecord|updateRecord|deleteRecord)/);
});

test('Team Member creation has a narrowly scoped direct CRM create channel', async () => {
  const [clientSource, querySource] = await Promise.all([
    readFile(clientPath, 'utf8'),
    readFile(queryPath, 'utf8'),
  ]);

  assert.match(clientSource, /export const crmCreateDs = Object\.freeze\(/);
  assert.match(clientSource, /createRecord: \(\.\.\.args\) => dynamicRuntimeAdapter\.createRecord\(\.\.\.args\)/);
  assert.match(querySource, /export const createCrmRecord[\s\S]*?return crmCreateDs\.createRecord/);
});

test('Stakeholder editing has a narrowly scoped direct CRM update channel', async () => {
  const [clientSource, querySource] = await Promise.all([
    readFile(clientPath, 'utf8'),
    readFile(queryPath, 'utf8'),
  ]);

  assert.match(clientSource, /export const crmUpdateDs = Object\.freeze\(/);
  assert.match(clientSource, /updateRecord: \(\.\.\.args\) => dynamicRuntimeAdapter\.updateRecord\(\.\.\.args\)/);
  assert.match(querySource, /export const updateRecord[\s\S]*?options\.crm \? crmUpdateDs : ds/);
});

test('Commercial Account Profile has a narrowly scoped live CRM read path only', async () => {
  const source = await readFile(sharedPath, 'utf8');
  const block = source.match(
    /export const fetchCommercialAccountProfile = async[\s\S]*?\n\};/
  )?.[0] || '';

  assert.match(block, /hasVeevaRuntime\(\)/);
  assert.match(block, /runCrmQuery/);
  assert.doesNotMatch(block, /createCrmRecord|updateRecord|deleteRecord/);
});

test('custom Account Plan launcher remains desktop-only', async () => {
  const source = await readFile(appPath, 'utf8');
  assert.match(source, /const shouldShowAccountPlanLauncher = isDesktopView && !isDesktopPlanSelected/);
  assert.match(source, /const shouldLoadAccountPlanPages = !shouldShowAccountPlanLauncher/);
});
