import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  mergeMedicalProfileDraftValues,
  sanitizeMedicalProfilePicklistValue,
} from '../src/pages/AccountProfile/medicalProfilePicklistValues.js';

const tabSource = await readFile(
  new URL('../src/pages/AccountProfile/AccountIntelligenceTab.jsx', import.meta.url),
  'utf8'
);

const activeOptions = [
  { value: 'Inpatient and Outpatient', label: 'Inpatient and Outpatient' },
  { value: 'Kite Clinical Trial Site', label: 'Kite Clinical Trial Site' },
  { value: 'Outpatient', label: 'Outpatient' },
];

test('inactive values are removed from MM and DLBCL multi-picklist values', () => {
  assert.equal(
    sanitizeMedicalProfilePicklistValue(
      'Inpatient;Cohort 4;Outpatient',
      'multiselect',
      activeOptions
    ),
    'Outpatient'
  );
});

test('inactive values are removed from single-select profile values', () => {
  assert.equal(
    sanitizeMedicalProfilePicklistValue('Inactive Status', 'select', [
      { value: 'Pending', label: 'Pending' },
      { value: 'Completed', label: 'Completed' },
    ]),
    ''
  );
  assert.equal(
    sanitizeMedicalProfilePicklistValue('Completed', 'select', [
      { value: 'Pending', label: 'Pending' },
      { value: 'Completed', label: 'Completed' },
    ]),
    'Completed'
  );
});

test('stored values are preserved when picklist metadata is unavailable', () => {
  assert.equal(
    sanitizeMedicalProfilePicklistValue('Inpatient;Cohort 4', 'multiselect', []),
    'Inpatient;Cohort 4'
  );
});

test('medical profile drafts are sanitized while the saved baseline stays unchanged', () => {
  assert.match(tabSource, /buildInitialEditableValues\(values, sections, accountFields, true\)/);
  assert.match(tabSource, /const savedValues = buildInitialEditableValues\(values, sections, accountFields\)/);
  assert.match(tabSource, /const activeValues = buildInitialEditableValues\(values, sections, accountFields, true\)/);
  assert.match(tabSource, /setSavedEditableValues\(savedValues\)/);
  assert.match(tabSource, /mergeMedicalProfileDraftValues\(current, previousSavedValues, activeValues\)/);
  assert.match(tabSource, /profileChanged\s*\? activeValues/);
});

test('iPad background refreshes preserve unsaved picklist and text edits on MM and DLBCL profiles', () => {
  for (const profileType of ['mm', 'dlbcl']) {
    assert.deepEqual(
      mergeMedicalProfileDraftValues(
        {
          atcProfileCategory: `${profileType} user selection`,
          kiteClinicalTrial: `${profileType} pipeline selection`,
          atcProfile: `${profileType} unsaved text`,
          competitorTrial: 'Previously saved text',
        },
        {
          atcProfileCategory: '',
          kiteClinicalTrial: '',
          atcProfile: 'Previously saved profile',
          competitorTrial: 'Previously saved text',
        },
        {
          atcProfileCategory: '',
          kiteClinicalTrial: '',
          atcProfile: 'Previously saved profile',
          competitorTrial: 'Refreshed CRM text',
        }
      ),
      {
        atcProfileCategory: `${profileType} user selection`,
        kiteClinicalTrial: `${profileType} pipeline selection`,
        atcProfile: `${profileType} unsaved text`,
        competitorTrial: 'Refreshed CRM text',
      }
    );
  }
});
