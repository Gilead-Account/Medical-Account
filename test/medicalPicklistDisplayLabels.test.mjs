import test from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {
  medicalPicklistLabel,
  picklistInfoFromLabels,
  withMedicalPicklistLabels,
} from '../src/lib/dataservice/accountPlan/titlePicklistMappings.js';
import { buildAccountPlanExecutiveSummary } from '../src/lib/export/accountPlanExecutiveSummary.js';
import { buildAccountPlanPptSlides } from '../src/lib/export/accountPlanPptSections.js';
import { createAccountPlanPresentation } from '../src/lib/export/accountPlanPptRenderer.js';

const opportunityApi = 'Strong Community Network | MM, DLBCL';
const barrierApi = 'Capacity constraint | DLBCL';
const strategyApi = 'Grow network (Med) | MM, DLBCL';
const tacticApi = 'Identify patient navigator (Opp) | MM, DLBCL';
const picklists = {
  driverTitleLabels: { [opportunityApi]: 'Strong Community Network' },
  barrierTitleLabels: { [barrierApi]: 'Limited treatment capacity' },
  strategyLabels: { [strategyApi]: 'Expand clinical collaboration' },
  medicalTacticTitleLabels: { [tacticApi]: 'Identify a patient navigator' },
};

test('all four Medical picklists prefer CRM labels and retain exact API values for editing', () => {
  const original = { type: 'Driver', name: opportunityApi, strategy: strategyApi };
  const opportunity = withMedicalPicklistLabels(original, picklists);
  assert.equal(opportunity.name, 'Strong Community Network');
  assert.equal(opportunity.nameValue, opportunityApi);
  assert.equal(opportunity.strategyLabel, 'Expand clinical collaboration');
  assert.equal(opportunity.strategy, strategyApi);
  assert.equal(original.name, opportunityApi);
  assert.deepEqual(withMedicalPicklistLabels(opportunity, picklists), opportunity);
  assert.equal(withMedicalPicklistLabels({ type: 'Barrier', name: barrierApi }, picklists).name,
    'Limited treatment capacity');
  const exactApi = ` ${tacticApi} `;
  const tactic = withMedicalPicklistLabels({ name: exactApi }, {
    medicalTacticTitleLabels: { [exactApi]: 'Identify a patient navigator' },
  }, true);
  assert.equal(tactic.name, 'Identify a patient navigator');
  assert.equal(tactic.nameValue, exactApi);
});

test('API-only metadata and missing metadata do not expose dependency suffixes', () => {
  const expected = ['Strong Community Network', 'Capacity constraint', 'Grow network', 'Identify patient navigator'];
  const values = [opportunityApi, barrierApi, strategyApi, tacticApi];
  const info = picklistInfoFromLabels(values);
  assert.deepEqual(info.values, values);
  assert.deepEqual(Object.values(info.labels), expected);
  assert.deepEqual(values.map((value) => medicalPicklistLabel(value)), expected);
  assert.equal(medicalPicklistLabel('Ordinary legacy title'), 'Ordinary legacy title');
  assert.equal(medicalPicklistLabel('internal_code', { internal_code: 'Actual label (Med)' }), 'Actual label (Med)');
});

test('inactive values retain display labels without becoming selectable', () => {
  const info = picklistInfoFromLabels([{ apiName: 'old_api_code', label: 'Historical tactic', active: false }]);
  assert.deepEqual(info.values, []);
  assert.equal(medicalPicklistLabel('old_api_code', info.labels), 'Historical tactic');
});

test('executive summary and PowerPoint display labels without leaking saved API values', async () => {
  const opportunity = withMedicalPicklistLabels({ id: 'opp', type: 'Driver', name: opportunityApi, strategy: strategyApi, status: 'Open', indication: 'DLBCL' }, picklists);
  const barrier = withMedicalPicklistLabels({ id: 'barrier', type: 'Barrier', name: barrierApi, strategy: strategyApi, status: 'Open', indication: 'DLBCL' }, picklists);
  const tactic = withMedicalPicklistLabels({ id: 'tactic', name: tacticApi, barrierDriverId: 'opp', parentName: opportunity.name, status: 'Planned', indication: 'DLBCL' }, picklists, true);
  const data = {
    home: { account: { name: 'Test Account' }, strategies: { dlbcl: [opportunity.strategyLabel] } },
    barriersDrivers: { barriers: [barrier], drivers: [opportunity], activities: [tactic] },
    criticalActivities: { activities: [tactic] },
  };
  const summary = buildAccountPlanExecutiveSummary(data);
  const slides = buildAccountPlanPptSlides(data);
  const presentation = createAccountPlanPresentation(slides, { title: 'Test Account Plan' });
  const zip = await JSZip.loadAsync(await presentation.write({ outputType: 'nodebuffer' }));
  const slideXml = (await Promise.all(Object.keys(zip.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .map((path) => zip.file(path).async('string')))).join('\n');
  for (const output of [JSON.stringify(summary), JSON.stringify(slides), slideXml]) {
    for (const raw of [opportunityApi, barrierApi, strategyApi, tacticApi]) assert.ok(!output.includes(raw), raw);
    for (const label of ['Strong Community Network', 'Limited treatment capacity', 'Expand clinical collaboration', 'Identify a patient navigator']) assert.ok(output.includes(label), label);
  }
});
