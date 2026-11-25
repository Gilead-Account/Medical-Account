import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const readProjectFile = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Barrier and Opportunity use the approved Medical object mapping', async () => {
  const shared = await readProjectFile('src/lib/dataservice/accountPlan/shared.js');

  assert.match(shared, /BARRIER_DRIVER_OBJECT = 'KPH_Medical_Barrier_Tactical_Actions__c'/);
  assert.match(shared, /fetchBarrierDriverRecordTypeIds/);
  assert.doesNotMatch(shared, /012VE000007fG(?:xdYAE|zFYAU)/);
  assert.match(shared, /Barrier: 'KPH_Barrier_Title__c'/);
  assert.match(shared, /Driver: 'KPH_Opportunity_Title__c'/);
  assert.match(shared, /BARRIER_DRIVER_STRATEGY_FIELD = 'KPH_Medical_Strategy__c'/);
  assert.match(shared, /BARRIER_DRIVER_STATUS_FIELD = 'KPH_Medical_Tactical_Action_Status__c'/);
  assert.match(shared, /BARRIER_DRIVER_INDICATION_FIELD = 'KPH_Indication__c'/);
  assert.match(shared, /BARRIER_DRIVER_COMMENTS_FIELD = 'KPH_Comments__c'/);
});

test('Barrier and Opportunity no longer query or write retired fields', async () => {
  const sources = await Promise.all([
    readProjectFile('src/lib/dataservice/accountPlan/shared.js'),
    readProjectFile('src/lib/dataservice/accountPlan/barriersDrivers.js'),
    readProjectFile('src/lib/dataservice/accountPlan/home.js'),
  ]);
  const source = sources.join('\n');

  for (const retired of [
    'KPH_Driver_Title__c',
    'KPH_Barrier_1__c',
    'KPH_Tactical_Action_Driver__c',
    'KPH_Barrier_Type__c',
    'KPH_Driver_Type__c',
    'KPH_Rank_1__c',
    'KPH_Plan_Strategy__c',
    'KPH_Strategy_Rank__c',
    '012VI000006GnvlYAC',
    '012Su0000011a45IAA',
  ]) {
    assert.doesNotMatch(source, new RegExp(retired));
  }

  assert.doesNotMatch(source, /PLAN_STRATEGY_/);
  assert.doesNotMatch(source, /fetchPlanStrategies/);
});

test('picklist metadata and training fixtures use the approved fields', async () => {
  const [barriersDrivers, home, dependentPicklists, fixtures, mockAdapter] = await Promise.all([
    readProjectFile('src/lib/dataservice/accountPlan/barriersDrivers.js'),
    readProjectFile('src/lib/dataservice/accountPlan/home.js'),
    readProjectFile('src/lib/dataservice/accountPlan/dependentPicklists.js'),
    readProjectFile('src/lib/mockData/fixtures.js'),
    readProjectFile('src/lib/mockData/mockAdapter.js'),
  ]);
  const picklistSources = `${barriersDrivers}\n${home}`;
  const mockSources = `${fixtures}\n${mockAdapter}`;

  assert.match(picklistSources, /KPH_Opportunity_Title__c/);
  assert.match(picklistSources, /BARRIER_DRIVER_STRATEGY_FIELD/);
  assert.doesNotMatch(dependentPicklists, /hardcodedStrategyDependencyOptions/);
  assert.match(mockSources, /KPH_Opportunity_Title__c/);
  assert.match(mockSources, /KPH_Medical_Strategy__c/);
  assert.match(mockSources, /012VE000007fGxdYAE/);
  assert.match(mockSources, /012VE000007fGzFYAU/);
  assert.doesNotMatch(picklistSources, /^\s*categoryLabels,\s*$/m);
  assert.equal(
    (picklistSources.match(/categoryLabels: dynamicPicklists\.categoryLabels \|\| \{\}/g) || []).length,
    2
  );
});

test('Barrier and Opportunity modal exposes the approved visible fields', async () => {
  const modal = await readProjectFile('src/pages/BarriersDrivers/BarrierDriverEditModal.jsx');

  for (const label of ['Title', 'Status', 'Indication', 'Medical Strategy', 'Comments']) {
    assert.match(modal, new RegExp(label));
  }
  assert.doesNotMatch(modal, /<Field label="Type"/);
});

test('Barrier and Opportunity modals use the requested desktop and iPad field order', async () => {
  const [modal, editModalCss] = await Promise.all([
    readProjectFile('src/pages/BarriersDrivers/BarrierDriverEditModal.jsx'),
    readProjectFile('src/styles/edit-modal.css'),
  ]);
  const fieldIndexes = [
    '<Field label="Indication" help={BARRIER_DRIVER_HELP.indication}>',
    '<Field label="Medical Strategy" help={BARRIER_DRIVER_HELP.strategy}>',
    '<Field label={`${typeLabel} Title`} help={BARRIER_DRIVER_HELP.title}>',
    '<Field label="Status" help={BARRIER_DRIVER_HELP.status}>',
  ].map((field) => modal.indexOf(field));

  assert.ok(fieldIndexes.every((index) => index >= 0));
  assert.deepEqual([...fieldIndexes].sort((left, right) => left - right), fieldIndexes);
  assert.match(
    editModalCss,
    /\.stakeholder-edit-grid\s*\{[\s\S]*?grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/
  );
});

test('Barrier and Opportunity title selection requires an indication first', async () => {
  const modal = await readProjectFile('src/pages/BarriersDrivers/BarrierDriverEditModal.jsx');
  const titleField = modal.slice(
    modal.indexOf('<Field label={`${typeLabel} Title`}'),
    modal.indexOf('<Field label="Status"')
  );

  assert.match(titleField, /disabled=\{statusOnlyMode \|\| !hasIndication\}/);
  assert.match(titleField, /hasIndication \? `Select \$\{typeLower\} title` : 'Select indication first'/);
});
