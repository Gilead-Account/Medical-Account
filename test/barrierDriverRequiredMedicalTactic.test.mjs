import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const barriersDriversPagePath = new URL('../src/pages/BarriersDrivers/index.jsx', import.meta.url);
const barrierDriverModalPath = new URL(
  '../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx',
  import.meta.url
);
const newMedicalTacticModalPath = new URL(
  '../src/pages/CriticalActivities/CriticalActivityNewModal.jsx',
  import.meta.url
);
const barriersDriversCssPath = new URL(
  '../src/pages/BarriersDrivers/BarriersDrivers.css',
  import.meta.url
);
const sharedModalCssPath = new URL('../src/styles/edit-modal.css', import.meta.url);

test('creating a barrier or opportunity saves its linked Medical Tactic from one modal', async () => {
  const [source, modalSource] = await Promise.all([
    readFile(barriersDriversPagePath, 'utf8'),
    readFile(barrierDriverModalPath, 'utf8'),
  ]);

  assert.match(modalSource, /<h4>New Linked Medical Tactic<\/h4>/);
  assert.match(modalSource, /!isEdit && \(/);
  assert.match(modalSource, /onSave\([\s\S]*?submission,[\s\S]*?tacticForm/);
  assert.match(source, /handleSaveBarrierDriver = async \(form, linkedTacticForm = null\)/);
  assert.match(source, /await addBarrierDriver\(planId, formWithPlan\)/);
  assert.match(source, /await addCriticalActivity\(planId, tacticPayload\)/);
  assert.doesNotMatch(source, /setActivityCreateState\(\{ parentRecord: newRecord, isRequired: true \}\)/);
  assert.doesNotMatch(source, /Add at least one Medical Tactic to complete creation\./);
});

test('new barriers and opportunities stay open so their required tactic can be created', async () => {
  const source = await readFile(barrierDriverModalPath, 'utf8');

  assert.match(source, /<Field label=\{`\$\{typeLabel\} Title`\}/);
  assert.match(source, /setValidationError\(`\$\{typeLabel\} Title is required\.`\)/);
  assert.match(source, /availableStatusOptions\.filter\(isOpenBarrierDriverStatus\)/);
  assert.match(
    source,
    /const statusOptions = isEdit[\s\S]*?\? availableStatusOptions[\s\S]*?: \(createStatusOptions\.length/
  );
});

test('standalone New Medical Tactic modal retains its optional required-mode support', async () => {
  const source = await readFile(newMedicalTacticModalPath, 'utf8');

  assert.match(source, /isRequired = false/);
  assert.match(source, /e\.key === 'Escape'[\s\S]*?!isSaving[\s\S]*?!isRequired[\s\S]*?!escapeBelongsToFieldControl\(e\)/);
  assert.match(source, /onClick=\{isSaving \|\| isRequired \? undefined : \(event\) =>/);
  assert.match(source, /isDirectBackdropClick\(event\)/);
  assert.match(source, /disabled=\{isSaving \|\| isRequired\}/);
  assert.match(
    source,
    /At least one Medical Tactic is required for a new Barrier or Opportunity\./
  );
});

test('combined create modal remains scrollable and usable at desktop and iPad sizes', async () => {
  const [pageCss, sharedCss] = await Promise.all([
    readFile(barriersDriversCssPath, 'utf8'),
    readFile(sharedModalCssPath, 'utf8'),
  ]);

  assert.match(pageCss, /\.bd-create-with-tactic-modal\s*\{[\s\S]*?width:\s*min\(840px/);
  assert.match(
    pageCss,
    /@media \(min-width:\s*601px\) and \(max-width:\s*1180px\)[\s\S]*?\.bd-create-with-tactic-modal[\s\S]*?100dvh/
  );
  assert.match(pageCss, /bd-create-with-tactic-modal \.stakeholder-edit-body[\s\S]*?-webkit-overflow-scrolling:\s*touch/);
  assert.match(pageCss, /bd-create-with-tactic-modal \.stakeholder-edit-foot[\s\S]*?flex-wrap:\s*wrap/);
  assert.match(sharedCss, /\.stakeholder-edit-body\s*\{[\s\S]*?overflow-y:\s*auto/);
  assert.match(
    sharedCss,
    /critical-activity-due-date-input\[type='date'\][\s\S]*?max-inline-size:\s*100% !important/
  );
});
