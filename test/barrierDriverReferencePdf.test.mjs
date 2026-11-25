import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pagePath = new URL('../src/pages/BarriersDrivers/index.jsx', import.meta.url);
const modalPath = new URL('../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx', import.meta.url);
test('barrier and opportunity modals omit the tactical actions guide', async () => {
  const [modalSource, pageSource] = await Promise.all([
    readFile(modalPath, 'utf8'),
    readFile(pagePath, 'utf8'),
  ]);

  for (const source of [modalSource, pageSource]) {
    assert.doesNotMatch(source, /onOpenReferencePdf/);
    assert.doesNotMatch(source, /View Tactical Actions Guide/);
    assert.doesNotMatch(source, /ap-barriers-and-tactical-action\.pdf/);
  }
});
