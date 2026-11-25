import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
const sidebarSource = await readFile(new URL('../src/components/Sidebar.jsx', import.meta.url), 'utf8');
const submitMpdConfirmModalSource = await readFile(new URL('../src/components/SubmitMpdApprovalConfirmModal.jsx', import.meta.url), 'utf8');
const overviewSource = await readFile(new URL('../src/pages/Overview/index.jsx', import.meta.url), 'utf8');
const barriersSource = await readFile(new URL('../src/pages/BarriersDrivers/index.jsx', import.meta.url), 'utf8');
const criticalSource = await readFile(new URL('../src/pages/CriticalActivities/index.jsx', import.meta.url), 'utf8');
const accountProfileSource = await readFile(new URL('../src/pages/AccountProfile/index.jsx', import.meta.url), 'utf8');
const profileTabSource = await readFile(new URL('../src/pages/AccountProfile/ProfileTab.jsx', import.meta.url), 'utf8');
const stakeholdersSource = await readFile(new URL('../src/pages/Stakeholders/index.jsx', import.meta.url), 'utf8');
const teamMembersSource = await readFile(new URL('../src/pages/TeamMembers/index.jsx', import.meta.url), 'utf8');

test('App renders a dismissible success popup for save and submit notifications', () => {
  assert.match(appSource, /const \[appNotice,\s*setAppNotice\] = useState\(null\)/);
  assert.match(appSource, /className=\{`app-notice-toast \$\{appNotice\.tone/);
  assert.match(appSource, /role=\{appNotice\.tone === 'danger' \? 'alert' : 'status'\}/);
  assert.match(appSource, /const refreshLoadedPages = useCallback\(\(keys = Array\.from\(loadedRef\.current\)\)/);
  assert.match(appSource, /if \(refreshPages\) \{\s*refreshLoadedPages\(\);/);
  assert.match(appSource, /onSubmitMpdApproval=\{handleSubmitMpdApproval\}/);
});

test('Submit for FD Approval uses one confirmation with no comments step', () => {
  assert.match(sidebarSource, /onSubmitMpdApproval/);
  assert.match(sidebarSource, /option\.key === 'submit-mpd-approval'/);
  assert.match(sidebarSource, /label:\s*'Submit for FD Approval'/);
  assert.match(appSource, /const \[isMpdApprovalConfirmOpen,\s*setIsMpdApprovalConfirmOpen\] = useState\(false\)/);
  assert.match(appSource, /setIsMpdApprovalConfirmOpen\(true\)/);
  assert.match(appSource, /const handleConfirmMpdApproval = async \(\) =>/);
  assert.match(appSource, /const submitterName = await getCurrentUserName\(\)/);
  assert.match(appSource, /submitMpdApproval\(\{ planId: shellPlanId, submittedDate, submitterName \}\)/);
  assert.match(appSource, /<SubmitMpdApprovalConfirmModal/);
  assert.doesNotMatch(appSource, /<SubmitMpdApprovalModal/);
  assert.match(submitMpdConfirmModalSource, /Submit for FD Approval\?/);
  assert.match(submitMpdConfirmModalSource, />\s*Cancel\s*</);
  assert.match(submitMpdConfirmModalSource, /'Submitting\.\.\.' : 'Submit'/);
  assert.match(sidebarSource, /<span>Export \/ Submit FD<\/span>/);
  assert.doesNotMatch(submitMpdConfirmModalSource, /Comments|textarea|Yes, Continue/);
  assert.doesNotMatch(sidebarSource, /Submit Approval for MPD/);
  assert.doesNotMatch(
    sidebarSource,
    /option\.key === 'submit-mpd-approval'[\s\S]{0,120}console\.info/
  );
});

test('Submit for MRD Approval is hidden for restricted Veeva profiles', () => {
  assert.match(appSource, /getCurrentUserProfileName/);
  assert.match(appSource, /isMpdApprovalRestrictedProfile/);
  assert.match(appSource, /isMpdApprovalDisabled=\{isMpdApprovalDisabled\}/);
  assert.match(sidebarSource, /isMpdApprovalDisabled/);
  assert.match(
    sidebarSource,
    /EXPORT_MENU_OPTIONS\.filter\(\(option\) => \{[\s\S]*?option\.key === 'submit-mpd-approval'[\s\S]*?isMpdApprovalDisabled/
  );
  assert.match(sidebarSource, /visibleExportMenuSections\.map\(\(section\) =>/);
  assert.doesNotMatch(sidebarSource, /Disabled for your profile/);
});

test('page save handlers emit success notifications after successful saves', () => {
  [
    [overviewSource, /onNotify\?\.\(\{\s*title: `\$\{recordTypeLabel\} saved\.`/],
    [overviewSource, /onNotify\?\.\(\{\s*title: 'Medical tactic saved\.'/],
    [barriersSource, /onNotify\?\.\(\{\s*title: `\$\{activeRecordSingularLabel\} saved\.`/],
    [criticalSource, /onNotify\?\.\(\{\s*title: 'Medical tactic saved\.'/],
    [profileTabSource, /onNotify\?\.\(\{\s*title: 'Account profile saved\.'/],
    [accountProfileSource, /onNotify\?\.\(\{\s*title: 'Medical profile saved\.'/],
    [accountProfileSource, /onNotify\?\.\(\{\s*title: 'Referral account saved\.'/],
    [stakeholdersSource, /onNotify\?\.\(\{\s*title: 'Stakeholder saved\.'/],
    [teamMembersSource, /onNotify\?\.\(\{\s*title: 'Team member saved\.'/],
  ].forEach(([source, pattern]) => {
    assert.match(source, pattern);
  });
});

test('backend-backed save notifications request loaded page cache refresh', () => {
  [
    overviewSource,
    barriersSource,
    criticalSource,
    profileTabSource,
    accountProfileSource,
    stakeholdersSource,
    teamMembersSource,
  ].forEach((source) => {
    assert.match(source, /refreshPages: true/);
  });
});
