import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildMedicalTacticOptionsByParentTitle,
  medicalTacticOptionsForParent,
} from '../src/lib/dataservice/accountPlan/titlePicklistMappings.js';

const barrierModalPath = new URL(
  '../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx',
  import.meta.url
);
const newTacticModalPath = new URL(
  '../src/pages/CriticalActivities/CriticalActivityNewModal.jsx',
  import.meta.url
);
const editTacticModalPath = new URL(
  '../src/pages/CriticalActivities/CriticalActivityEditModal.jsx',
  import.meta.url
);

test('barrier and opportunity titles are restricted to their title dropdowns', async () => {
  const source = await readFile(barrierModalPath, 'utf8');

  assert.match(source, /picklists\?\.barrierTitles/);
  assert.match(source, /picklists\?\.driverTitles/);
  assert.match(source, /<Field label=\{`\$\{typeLabel\} Title`\}[\s\S]*?<select/);
  assert.match(source, /hasIndication \? `Select \$\{typeLower\} title` : 'Select indication first'/);
  assert.match(source, /Select a valid \$\{typeLower\} title/);
});

test('medical tactic requires a linked record first and uses only CRM options', async () => {
  for (const path of [newTacticModalPath, editTacticModalPath]) {
    const source = await readFile(path, 'utf8');
    const linkedFieldIndex = source.indexOf('<Field label="Linked Barrier/Opportunity"');
    const tacticFieldIndex = source.indexOf('<Field label="Medical Tactic"');

    assert.ok(linkedFieldIndex >= 0);
    assert.ok(tacticFieldIndex > linkedFieldIndex);
    assert.match(source, /medicalTacticOptionsForParent/);
    assert.match(source, /Select linked barrier or opportunity first/);
    assert.match(source, /Select an active Medical Tactic value from CRM/);
    assert.match(source, /next\.title = ''/);
    assert.doesNotMatch(source, /Medical Tactic Title/);
  }

  const newSource = await readFile(newTacticModalPath, 'utf8');
  const editSource = await readFile(editTacticModalPath, 'utf8');
  assert.match(newSource, /disabled=\{!selectedParentOption\}/);
  assert.match(editSource, /disabled=\{!selectedParentOption \|\| remainingFieldsDisabled\}/);
});

test('medical tactic options use CRM values assigned to parent record type and indication', () => {
  const values = [
    'DLBCL barrier tactic (Barrier) | DLBCL',
    'MM barrier tactic (Barrier) | MM',
    'Shared opportunity tactic (Opp) | MM, DLBCL',
  ];
  const mapping = buildMedicalTacticOptionsByParentTitle(values);

  assert.deepEqual(
    medicalTacticOptionsForParent(
      { name: 'Barrier A', type: 'Barrier', indication: 'DLBCL' },
      mapping
    ),
    [values[0]]
  );
  assert.deepEqual(
    medicalTacticOptionsForParent(
      { name: 'Barrier B', type: 'Barrier', indication: 'MM' },
      mapping
    ),
    [values[1]]
  );
  assert.deepEqual(
    medicalTacticOptionsForParent(
      { name: 'Opportunity A', type: 'Driver', indication: 'DLBCL' },
      mapping
    ),
    [values[2]]
  );
});

test('CRM tactic API values remain exact while filtering by record type', () => {
  const value = 'Assess opportunities  exactly (Opp) | MM, DLBCL ';
  const mapping = buildMedicalTacticOptionsByParentTitle([value]);

  assert.deepEqual(
    medicalTacticOptionsForParent({ name: 'Barrier A', type: 'Barrier', indication: 'DLBCL' }, mapping),
    []
  );
  assert.deepEqual(
    medicalTacticOptionsForParent({ name: 'Opportunity B', type: 'Driver', indication: 'DLBCL' }, mapping),
    [value]
  );
});

test('medical tactic indication comes only from the API-name suffix', () => {
  const value = 'MM opportunity tactic (Opp) | MM';
  const mapping = buildMedicalTacticOptionsByParentTitle([value]);

  assert.deepEqual(
    medicalTacticOptionsForParent(
      { name: 'DLBCL Opportunity', type: 'Driver', indication: 'DLBCL' },
      mapping
    ),
    []
  );
  assert.deepEqual(
    medicalTacticOptionsForParent(
      { name: 'MM Opportunity', type: 'Driver', indication: 'MM' },
      mapping
    ),
    [value]
  );
});

test('Barrier and Opp markers keep tactics on the matching parent type', () => {
  const dlbclValue = 'DLBCL tactic (Barrier) | DLBCL';
  const mmValue = 'MM tactic (Barrier) | MM';
  const opportunityValue = 'Opportunity tactic (Opp) | DLBCL, MM';
  const mapping = buildMedicalTacticOptionsByParentTitle([
    dlbclValue,
    mmValue,
    opportunityValue,
  ]);

  assert.deepEqual(
    medicalTacticOptionsForParent(
      { name: 'DLBCL Barrier', type: 'Barrier', indication: 'DLBCL' },
      mapping
    ),
    [dlbclValue]
  );
  assert.deepEqual(
    medicalTacticOptionsForParent(
      { name: 'MM Barrier', type: 'Barrier', indication: 'MM' },
      mapping
    ),
    [mmValue]
  );
  for (const indication of ['DLBCL', 'MM']) {
    assert.deepEqual(
      medicalTacticOptionsForParent(
        { name: `${indication} Opportunity`, type: 'Driver', indication },
        mapping
      ),
      [opportunityValue]
    );
  }
});

test('medical tactics without a valid parent marker and indication suffix are excluded', () => {
  const mapping = buildMedicalTacticOptionsByParentTitle([
    'Unsuffixed tactic',
    'Missing marker | DLBCL',
    'Unsupported marker (Commercial) | DLBCL',
    'Unsupported indication (Barrier) | AML',
    'Portfolio only (Opp) | Portfolio',
  ]);

  assert.deepEqual(
    medicalTacticOptionsForParent(
      { name: 'Any parent', type: 'Barrier', indication: 'DLBCL' },
      mapping,
      'Inactive stored value'
    ),
    []
  );
});
