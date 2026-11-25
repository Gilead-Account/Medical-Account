import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const modalPaths = {
  barrierDriver: new URL(
    '../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx',
    import.meta.url
  ),
  newMedicalTactic: new URL(
    '../src/pages/CriticalActivities/CriticalActivityNewModal.jsx',
    import.meta.url
  ),
  editMedicalTactic: new URL(
    '../src/pages/CriticalActivities/CriticalActivityEditModal.jsx',
    import.meta.url
  ),
};

const fieldMarkup = (source, label) => {
  const start = source.indexOf(`<Field label="${label}"`);
  assert.notEqual(start, -1, `${label} field should remain present`);
  const end = source.indexOf('</Field>', start);
  assert.notEqual(end, -1, `${label} field should have closing markup`);
  return source.slice(start, end);
};

test('details and comments are optional in account-plan modals', async () => {
  const [barrierDriver, newMedicalTactic, editMedicalTactic] = await Promise.all(
    Object.values(modalPaths).map((path) => readFile(path, 'utf8'))
  );

  assert.doesNotMatch(fieldMarkup(barrierDriver, 'Comments'), /\brequired\b/);
  assert.doesNotMatch(fieldMarkup(barrierDriver, 'Details'), /\brequired\b/);
  assert.doesNotMatch(barrierDriver, /submission\.comments\.trim\(\)/);
  assert.doesNotMatch(barrierDriver, /tacticForm\.details\.trim\(\)/);

  assert.doesNotMatch(fieldMarkup(newMedicalTactic, 'Details'), /\brequired\b/);
  assert.doesNotMatch(newMedicalTactic, /form\.details\.trim\(\)/);

  assert.doesNotMatch(fieldMarkup(editMedicalTactic, 'Details'), /\brequired\b/);
  assert.doesNotMatch(editMedicalTactic, /form\.details\.trim\(\)/);

});
