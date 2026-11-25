import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

import {
  BARRIER_OPPORTUNITY_INDICATIONS,
  configuredPicklistOptions,
  medicalStrategyPicklistInfoByApiName,
  picklistOptionsByApiNameIndication,
} from '../src/lib/dataservice/accountPlan/barrierOpportunityPicklists.js';
import {
  buildMedicalTacticOptionsByParentTitle,
  medicalTacticOptionsForParent,
  picklistInfoFromLabels,
} from '../src/lib/dataservice/accountPlan/titlePicklistMappings.js';

const modalPath = new URL(
  '../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx',
  import.meta.url
);
const barriersDataPath = new URL(
  '../src/lib/dataservice/accountPlan/barriersDrivers.js',
  import.meta.url
);
const homeDataPath = new URL(
  '../src/lib/dataservice/accountPlan/home.js',
  import.meta.url
);
const overviewPagePath = new URL('../src/pages/Overview/index.jsx', import.meta.url);

test('the Barrier and Opportunity workflow supports only DLBCL and MM', () => {
  assert.deepEqual(BARRIER_OPPORTUNITY_INDICATIONS, ['DLBCL', 'MM']);
});

test('Medical Tactic metadata preserves exact restricted-picklist API values', () => {
  const exactApiValue = 'Identify patient  navigator at institution | DLBCL ';
  const info = picklistInfoFromLabels({
    [exactApiValue]: 'Identify patient navigator at institution',
  });

  assert.deepEqual(info.values, [exactApiValue]);
  assert.equal(info.labels[exactApiValue], 'Identify patient navigator at institution');
  assert.deepEqual(
    configuredPicklistOptions(
      info.values,
      info.labels,
      ['Identify patient navigator at institution'],
      'DLBCL'
    ),
    [exactApiValue]
  );
});

test('Medical Tactic metadata excludes values explicitly marked inactive by CRM', () => {
  const info = picklistInfoFromLabels([
    { name: 'active-api-value', label: 'Active tactic', isActive: true },
    { name: 'inactive-api-value', label: 'Inactive tactic', isActive: false },
  ]);

  assert.deepEqual(info.values, ['active-api-value']);
  assert.deepEqual(info.labels, { 'active-api-value': 'Active tactic', 'inactive-api-value': 'Inactive tactic' });
});

test('Medical Tactic metadata prefers the CRM API name over a display value', () => {
  const info = picklistInfoFromLabels([
    {
      apiName: 'Assess_opportunities_to_present_data',
      value: 'Assess opportunities to present data/clinical updates to CAR T department',
      label: 'Assess opportunities to present data/clinical updates to CAR T department',
      isActive: true,
    },
  ]);

  assert.deepEqual(info.values, ['Assess_opportunities_to_present_data']);
  assert.equal(
    info.labels.Assess_opportunities_to_present_data,
    'Assess opportunities to present data/clinical updates to CAR T department'
  );
});

test('Medical Strategies use only (Med) API names and their indication suffixes', () => {
  const shared = 'Win the CAR T Treatment Decision (Med) | DLBCL, MM';
  const dlbcl = 'Maximize Opportunities in Lymphoma and Leukemia pipeline (Med) | DLBCL';
  const mm = 'MM Launch Preparedness (Med) | MM';
  const nonMedical = 'Drive confidence in early use of CAR-T | DLBCL,Portfolio';
  const unsuffixed = 'MM Launch Prep';
  const unsupported = 'AML Strategy (Med) | AML';
  const info = medicalStrategyPicklistInfoByApiName(
    [nonMedical, unsuffixed, shared, dlbcl, mm, unsupported],
    {
      [shared]: 'Win the CAR T Treatment Decision',
      [dlbcl]: 'Maximize Opportunities in Lymphoma and Leukemia pipeline',
      [mm]: 'MM Launch Preparedness',
    }
  );

  assert.deepEqual(info.values, [shared, dlbcl, mm]);
  assert.deepEqual(info.optionsByIndication, {
    DLBCL: [shared, dlbcl],
    MM: [shared, mm],
  });
  assert.equal(info.labels[shared], 'Win the CAR T Treatment Decision');
  assert.equal(info.labels[unsupported], undefined);
});

test('Barrier and Opportunity Title API-name suffixes define indication options', () => {
  const dlbcl = 'DLBCL only barrier | DLBCL';
  const mm = 'MM only barrier | MM';
  const shared = 'Shared barrier | MM, DLBCL';
  const mixed = 'MM plus unsupported suffix | MM, AML';
  const unmapped = 'test value to be deleted';
  const portfolio = 'Portfolio title | Portfolio';
  const unsupported = 'Unsupported title | AML';

  assert.deepEqual(
    picklistOptionsByApiNameIndication([
      unmapped,
      portfolio,
      unsupported,
      mm,
      mixed,
      shared,
      dlbcl,
    ]),
    {
      DLBCL: [shared, dlbcl],
      MM: [mm, mixed, shared],
    }
  );
});

test('a title suffix without DLBCL or MM produces no options for either indication', () => {
  assert.deepEqual(
    picklistOptionsByApiNameIndication([
      'Select Opportunity Title',
      'Portfolio title | Portfolio',
      'Unsupported title | AML',
    ]),
    { DLBCL: [], MM: [] }
  );
});

test('unsuffixed titles have no hardcoded indication fallback', () => {
  assert.deepEqual(
    picklistOptionsByApiNameIndication(['Legacy title without indication suffix']),
    { DLBCL: [], MM: [] }
  );
});

test('medical tactics are filtered by the linked parent record type', () => {
  const values = [
    'Barrier tactic (Barrier) | DLBCL',
    'Opportunity tactic (Opp) | MM, DLBCL',
  ];
  const mapping = buildMedicalTacticOptionsByParentTitle(values);
  assert.deepEqual(
    medicalTacticOptionsForParent({ name: 'Any Barrier', indication: 'DLBCL', type: 'Barrier' }, mapping),
    [values[0]]
  );
  assert.deepEqual(
    medicalTacticOptionsForParent({ name: 'Any Opportunity', indication: 'MM', type: 'Driver' }, mapping),
    [values[1]]
  );
});

test('both data composers expose the same strategy and title dependency maps', async () => {
  const [barriersData, homeData] = await Promise.all([
    readFile(barriersDataPath, 'utf8'),
    readFile(homeDataPath, 'utf8'),
  ]);

  for (const source of [barriersData, homeData]) {
    assert.doesNotMatch(source, /MEDICAL_STRATEGY_LABELS_BY_INDICATION/);
    assert.match(source, /medicalStrategyPicklistInfoByApiName/);
    assert.doesNotMatch(source, /BARRIER_TITLE_LABELS_BY_INDICATION/);
    assert.doesNotMatch(source, /OPPORTUNITY_TITLE_LABELS_BY_INDICATION/);
    assert.match(source, /barrierTitleOptionsByIndication/);
    assert.match(source, /driverTitleOptionsByIndication/);
    assert.match(
      source,
      /const barrierTitleOptionsByIndication = picklistOptionsByApiNameIndication\(\s*barrierTitles\.values\s*\)/
    );
    assert.match(
      source,
      /const driverTitleOptionsByIndication = picklistOptionsByApiNameIndication\(\s*driverTitles\.values\s*\)/
    );
  }
});

test('the modal recomputes titles by indication and clears stale dependent values', async () => {
  const source = await readFile(modalPath, 'utf8');

  assert.match(source, /picklists\?\.barrierTitleOptionsByIndication/);
  assert.match(source, /picklists\?\.driverTitleOptionsByIndication/);
  assert.match(source, /optionsForControllerValue\(\s*titleOptionsByIndication,\s*form\.indication/);
  assert.match(source, /if \(key === 'indication'\) \{[\s\S]*?next\.strategy = '';[\s\S]*?next\.name = '';/);
  assert.match(source, /key === 'name' \|\| key === 'type' \|\| key === 'indication'/);
  assert.match(source, /oppositeTitleOptionsByIndication/);
  assert.match(source, /offlineOppositeTitleValue: oppositeTitleSource\[0\] \|\| ''/);
});

test('Home indication edits cascade to linked medical tactics like the main page', async () => {
  const source = await readFile(overviewPagePath, 'utf8');

  assert.match(source, /previousIndication = bdEditState\.record\.indication \|\| ''/);
  assert.match(source, /saveBarrierDriver\(bdEditState\.record\.id, \{[\s\S]*?previousIndication/);
  assert.match(source, /recordIdMatches\(activity\.barrierDriverId, updated\.id\)/);
  assert.match(source, /criticalActivities: \(current\.criticalActivities \|\| \[\]\)\.map\(updateLinkedIndication\)/);
});
