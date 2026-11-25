import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [overviewSource, tacticPanelSource, modalSource, activityEditModalSource, cssSource] = await Promise.all([
  readFile(new URL('../src/pages/Overview/index.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/Overview/HomeBarrierDriverMedicalTactics.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/CriticalActivities/CriticalActivityEditModal.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/pages/Overview/Overview.css', import.meta.url), 'utf8'),
]);

test('Medical Home Barrier and Opportunity rows open the expanded linked-tactic modal', () => {
  assert.match(overviewSource, /import HomeBarrierDriverMedicalTactics/);
  assert.match(overviewSource, /recordIdMatches\(activity\.barrierDriverId, selectedRecordId\)/);
  assert.match(overviewSource, /activity\.isDeactivated !== true/);
  assert.match(overviewSource, /activities=\{selectedBarrierDriverTactics\}/);
  assert.match(overviewSource, /modalClassName="home-bd-detail-modal"/);
  assert.match(overviewSource, /headerSubtitle=\{bdEditState\.record\?\.name \|\| 'Untitled'\}/);
  assert.match(overviewSource, /setBdEditState\(null\);\s*openEditActivity\(activity\)/);
  assert.match(modalSource, /\{children\}/);
  assert.match(modalSource, /const displayedSubtitle = headerSubtitle \?\? subtitle/);
  assert.match(modalSource, /role="dialog"/);
  assert.match(modalSource, /aria-modal="true"/);
  assert.match(modalSource, /!hideSubtitle \? <p>\{displayedSubtitle\}<\/p> : null/);
});

test('linked-work panel uses Medical terminology and accessible accordion controls', () => {
  assert.match(tacticPanelSource, />Linked Medical Tactics<\/h4>/);
  assert.match(tacticPanelSource, /aria-label="Filter linked Medical Tactics"/);
  assert.match(tacticPanelSource, /\{ id: 'all', label: 'All Tactics' \}/);
  assert.match(tacticPanelSource, /\{ id: 'open', label: 'Open' \}/);
  assert.match(tacticPanelSource, /\{ id: 'closed', label: 'Completed' \}/);
  assert.match(tacticPanelSource, /aria-expanded=\{isExpanded\}/);
  assert.match(tacticPanelSource, /aria-controls=\{panelId\}/);
  assert.match(tacticPanelSource, /Medical Tactic details/);
  assert.match(tacticPanelSource, /label="Medical Tactic Status"/);
  assert.match(tacticPanelSource, /label="Due Date"/);
  assert.match(tacticPanelSource, /label="Accountable"/);
  assert.match(tacticPanelSource, /label="Indication"/);
  assert.match(tacticPanelSource, /label="Created By"/);
  assert.match(tacticPanelSource, /label="Last Modified"/);
  assert.match(tacticPanelSource, /activity\.comments/);
  assert.match(tacticPanelSource, /onEditActivity\(activity\)/);
  assert.match(tacticPanelSource, /String\(index \+ 1\)\.padStart\(2, '0'\)/);
  assert.doesNotMatch(tacticPanelSource, /Linked Critical Activities|Untitled Critical Activity/);
});

test('editing a linked Home medical tactic keeps its active title selected', () => {
  assert.match(overviewSource, /setActivityEditState\(\{ activity, parentRecord \}\)/);
  assert.match(activityEditModalSource, /title: activity\?\.nameValue \?\? activity\?\.name \?\? ''/);
  assert.match(
    activityEditModalSource,
    /mergeOptions\(\s*form\.title,\s*medicalTacticOptionsForParent\(/
  );
  assert.match(
    activityEditModalSource,
    /!medicalTacticOptions\?\.length \|\| medicalTacticOptions\.includes\(option\)/
  );
});

test('expanded Medical modal styling is scoped, responsive, and reduced-motion safe', () => {
  assert.match(cssSource, /\.home-bd-detail-modal/);
  assert.match(cssSource, /\.home-bd-activity-accordion/);
  assert.match(cssSource, /\.home-bd-activity-meta-grid/);
  assert.match(cssSource, /@media \(max-width: 820px\)/);
  assert.match(cssSource, /@media \(max-width: 620px\)/);
  assert.match(cssSource, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(cssSource, /\.home-bd-activity-filters[\s\S]*?display:\s*inline-grid/);
  assert.match(cssSource, /\.home-bd-activity-filter\.is-selected/);
  assert.match(cssSource, /\.home-bd-activity-filter:focus-visible/);
});
