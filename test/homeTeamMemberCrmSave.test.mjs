import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const overviewPath = new URL('../src/pages/Overview/index.jsx', import.meta.url);
const homeDataPath = new URL('../src/lib/dataservice/accountPlan/home.js', import.meta.url);
const modalPath = new URL('../src/pages/TeamMembers/TeamMemberEditModal.jsx', import.meta.url);

test('Home team member save persists to CRM before updating page caches', async () => {
  const [overviewSource, homeDataSource] = await Promise.all([
    readFile(overviewPath, 'utf8'),
    readFile(homeDataPath, 'utf8'),
  ]);
  const saveHandler = overviewSource.match(
    /const handleSaveMember = async \(id, form\) => \{([\s\S]*?)\n  \};/
  )?.[1] || '';

  assert.match(homeDataSource, /updateTeamMember/);
  assert.match(saveHandler, /const saved = await updateTeamMember\(id, form\);/);
  assert.match(saveHandler, /applyTeamMemberForm\(existingMember, form, saved\)/);
  assert.match(saveHandler, /applyTeamMemberForm\(member, form, saved\)/);
  assert.match(saveHandler, /refreshPages: true/);

  const crmWriteIndex = saveHandler.indexOf('await updateTeamMember(id, form)');
  const localStateIndex = saveHandler.indexOf('setTeamMembers(');
  const pageCacheIndex = saveHandler.indexOf('onDataChange(');
  const sharedCacheIndex = saveHandler.indexOf('onMemberChange?.(');
  assert.ok(crmWriteIndex >= 0);
  assert.ok(localStateIndex > crmWriteIndex);
  assert.ok(pageCacheIndex > crmWriteIndex);
  assert.ok(sharedCacheIndex > crmWriteIndex);
});

test('Home team member CRM failures remain in the edit modal', async () => {
  const modalSource = await readFile(modalPath, 'utf8');
  const saveHandler = modalSource.match(
    /const handleSave = async \(e\) => \{([\s\S]*?)\n  \};/
  )?.[1] || '';

  assert.match(saveHandler, /if \(onSave\) await onSave\(member\.id, form\);/);
  assert.match(saveHandler, /catch \(error\)/);
  assert.match(saveHandler, /setValidationError/);
  assert.ok(saveHandler.indexOf('onClose();') < saveHandler.indexOf('catch (error)'));
});
