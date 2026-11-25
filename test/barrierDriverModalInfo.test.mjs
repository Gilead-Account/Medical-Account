import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const modalPath = new URL('../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx', import.meta.url);
const cssPath = new URL('../src/styles/edit-modal.css', import.meta.url);
const homePath = new URL('../src/pages/Overview/index.jsx', import.meta.url);
const barriersDriversPath = new URL('../src/pages/BarriersDrivers/index.jsx', import.meta.url);

test('barrier driver edit modal exposes field-level info guidance', async () => {
  const [modalSource, homeSource, barriersDriversSource] = await Promise.all([
    readFile(modalPath, 'utf8'),
    readFile(homePath, 'utf8'),
    readFile(barriersDriversPath, 'utf8'),
  ]);

  assert.match(homeSource, /<BarrierDriverEditModal/);
  assert.match(barriersDriversSource, /<BarrierDriverEditModal/);
  assert.doesNotMatch(modalSource, /infoOpen/);
  assert.doesNotMatch(modalSource, /bd-modal-info-popover/);
  assert.match(modalSource, /from '@\/components\/EditModalField'/);
  assert.match(modalSource, /help=\{BARRIER_DRIVER_HELP\.title\}/);
  assert.match(modalSource, /help=\{BARRIER_DRIVER_HELP\.status\}/);
  assert.doesNotMatch(modalSource, /help=\{BARRIER_DRIVER_HELP\.type\}/);
  assert.match(modalSource, /help=\{BARRIER_DRIVER_HELP\.indication\}/);
  assert.match(modalSource, /help=\{BARRIER_DRIVER_HELP\.strategy\}/);
  assert.match(modalSource, /help=\{BARRIER_DRIVER_HELP\.comments\}/);
  assert.doesNotMatch(modalSource, /Tactical Actions Guide|tacticalActionsGuide|onOpenReferencePdf/);
  assert.match(modalSource, /Create a new \$\{typeLower\} for this account plan\./);

  for (const text of [
    'Indicates the current stage',
    'Select the relevant disease area this barrier or opportunity applies to.',
    'Select the medical strategic focus aligned to this barrier or opportunity.',
    'Provide relevant context or observations to help explain the barrier or opportunity',
    'Create a new ${typeLower} for this account plan.',
  ]) {
    assert.match(modalSource, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('edit modal field help popovers are constrained for iPad layouts', async () => {
  const cssSource = await readFile(cssPath, 'utf8');

  assert.match(cssSource, /\.stakeholder-edit-field-label-row/);
  assert.match(cssSource, /\.field-help-button/);
  assert.match(cssSource, /\.field-help-popover[\s\S]*?max-height:/);
  assert.match(cssSource, /\.field-help-popover[\s\S]*?overflow-y:\s*auto;/);
  assert.match(cssSource, /@media \(max-width:\s*820px\)[\s\S]*?\.field-help-popover/);
});

test('barrier and opportunity cards omit the business impact pill', async () => {
  const barriersDriversSource = await readFile(barriersDriversPath, 'utf8');

  assert.doesNotMatch(barriersDriversSource, /impactTone/);
  assert.doesNotMatch(barriersDriversSource, /Impact not set/);
  assert.doesNotMatch(barriersDriversSource, /businessImpact\} impact/);
});
