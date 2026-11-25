import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  medicalRecordTypeFilterLabel,
  medicalRecordTypeLabel,
} from '../src/lib/medicalTerminology.js';

test('medical terminology maps CRM record types to medical-facing labels', () => {
  assert.equal(medicalRecordTypeLabel('Driver'), 'Opportunity');
  assert.equal(medicalRecordTypeLabel('Barrier'), 'Barrier');
  assert.equal(medicalRecordTypeFilterLabel('Drivers'), 'Opportunities');
  assert.equal(medicalRecordTypeFilterLabel('Barriers'), 'Barriers');
});

test('medical account plan navigation and modal titles use revised terminology', async () => {
  const [app, sidebar, barrierModal, tacticModal, tacticsPage, executiveSummary, pptSections, pdfRenderer] = await Promise.all([
    readFile(new URL('../src/App.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/Sidebar.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/CriticalActivities/CriticalActivityEditModal.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/pages/CriticalActivities/index.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/ExecutiveSummaryModal.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/export/accountPlanPptSections.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/export/accountPlanPdfRenderer.js', import.meta.url), 'utf8'),
  ]);

  assert.match(app, /label: 'Barriers & Opportunities'/);
  assert.match(app, /label: 'Medical Tactics'/);
  assert.match(barrierModal, /medicalRecordTypeLabel\(form\.type\)/);
  assert.match(tacticModal, /'Edit Medical Tactic'/);
  assert.match(tacticModal, /Linked Barrier\/Opportunity/);
  assert.doesNotMatch(sidebar, /Legacy Account Plan/);
  for (const source of [tacticModal, tacticsPage, executiveSummary, pptSections, pdfRenderer]) {
    assert.doesNotMatch(source, /Medical Tactic Title/);
  }
  assert.match(tacticModal, /<Field label="Medical Tactic"/);
  assert.match(tacticsPage, /label: 'Medical Tactic'/);
  assert.match(executiveSummary, /headers=\{\['Medical Tactic'/);
  assert.match(pptSections, /headers: \['Medical Tactic'/);
  assert.match(pdfRenderer, /label: 'Medical Tactic'/);
});
