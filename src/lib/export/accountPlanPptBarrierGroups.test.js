import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAccountPlanPptSlides, buildBarrierTacticGroups } from './accountPlanPptSections.js';
import {
  BARRIER_GROUP_AREA,
  GROUP_GAP,
  headerRowHeight,
  BARRIER_COLUMNS,
  MIN_FONT_SIZE,
  TACTIC_COLUMNS,
  ZERO_TACTIC_MESSAGE,
  barrierGroupMetrics,
  measureBarrierGroup,
  paginateBarrierGroups,
  usableBarrierGroupHeight,
} from './accountPlanPptBarrierGroups.js';

const barrier = (id, overrides = {}) => ({
  id,
  type: 'Barrier',
  name: `Barrier ${id}`,
  category: 'Capacity',
  status: 'Open',
  indication: 'DLBCL',
  strategy: 'Expand Class Share',
  businessImpact: 'High',
  ...overrides,
});

const tactic = (id, barrierDriverId, overrides = {}) => ({
  id,
  name: `Tactic ${id}`,
  barrierDriverId,
  status: 'Planned',
  ownerLabel: 'Priya Kumar',
  dueDate: '2026-05-20',
  comments: 'Follow up after tumor board.',
  ...overrides,
});

const cellIndex = (key) => TACTIC_COLUMNS.findIndex((column) => column.key === key);

const barrierSlides = (slides) => slides.filter((slide) => /^barriers(-\d+)?$/.test(slide.key));

const groupsOf = (slides) => barrierSlides(slides).flatMap((slide) => slide.groups);

const buildSlides = (barriers, tactics, options = {}) =>
  buildAccountPlanPptSlides(
    {
      barriersDrivers: { barriers, drivers: [] },
      criticalActivities: { activities: tactics },
    },
    options
  );

// --- Test 1: zero tactics -----------------------------------------------

test('a barrier with no medical tactics still renders with an explicit zero state', () => {
  const groups = buildBarrierTacticGroups([barrier('b1')], []);

  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].medicalTactics, []);

  // The barrier still occupies one row, which carries the explicit zero state
  // rather than an empty cell.
  const measured = measureBarrierGroup(groups[0]);
  assert.equal(measured.isZeroState, true);
  assert.equal(measured.rows.length, 1);
  assert.equal(measured.rows[0].tactic, null);
  assert.ok(measured.height > 0, 'zero state reserves visible height');
  assert.equal(ZERO_TACTIC_MESSAGE, 'No Medical Tactics associated.');
});

// --- Test 2: exactly one tactic -----------------------------------------

test('a barrier with one tactic shows that tactic with every export field', () => {
  const groups = buildBarrierTacticGroups(
    [barrier('b1')],
    [tactic('t1', 'b1', { name: 'Chair capacity workshop', status: 'In Progress', ownerLabel: 'James Chen' })]
  );

  assert.equal(groups[0].medicalTactics.length, 1);
  const [entry] = groups[0].medicalTactics;
  assert.equal(entry.cells[cellIndex('tacticTitle')], 'Chair capacity workshop');
  assert.equal(entry.cells[cellIndex('dueDate')], '20 May');
  assert.equal(entry.cells[cellIndex('tacticStatus')], 'In Progress');
  assert.equal(entry.cells[cellIndex('accountable')], 'James Chen');
  assert.deepEqual(TACTIC_COLUMNS.map((column) => column.header), [
    'Medical Tactics', 'Due Date', 'Tactic Status', 'Accountable',
  ]);
});

test('barrier and opportunity due dates render as day and full month', () => {
  const groups = buildBarrierTacticGroups(
    [barrier('b1')],
    [
      tactic('t1', 'b1', { dueDate: '2026-07-12' }),
      tactic('t2', 'b1', { dueDate: '2026-01-01' }),
      tactic('t3', 'b1', { dueDate: '2026-09-30T14:20:00' }),
      tactic('t4', 'b1', { dueDate: null }),
    ]
  );

  assert.deepEqual(
    groups[0].medicalTactics.map((entry) => entry.cells[cellIndex('dueDate')]),
    ['12 July', '1 January', '30 September', 'No due date']
  );
});

// --- Test 3: multiple tactics -------------------------------------------

test('every tactic of a multi-tactic barrier is listed exactly once', () => {
  const tactics = ['t1', 't2', 't3', 't4'].map((id) => tactic(id, 'b1'));
  const groups = buildBarrierTacticGroups([barrier('b1')], tactics);

  assert.deepEqual(groups[0].medicalTactics.map((entry) => entry.id), ['t1', 't2', 't3', 't4']);
  assert.equal(new Set(groups[0].medicalTactics.map((entry) => entry.id)).size, 4);
});

// --- Test 4: mixed dataset ----------------------------------------------

test('tactics attach only to their own barrier across a mixed dataset', () => {
  const barriers = [barrier('b1'), barrier('b2'), barrier('b3')];
  const tactics = [
    tactic('t1', 'b1'),
    tactic('t2', 'b2'),
    tactic('t3', 'b2'),
    tactic('t4', 'b2'),
    tactic('t5', null), // plan-level: belongs to no barrier
  ];

  const groups = buildBarrierTacticGroups(barriers, tactics);

  assert.deepEqual(
    groups.map((group) => group.medicalTactics.map((entry) => entry.id)),
    [['t1'], ['t2', 't3', 't4'], []]
  );
});

test('matches barriers and tactics across 15- and 18-character salesforce ids', () => {
  const groups = buildBarrierTacticGroups(
    [barrier('a1B2c3D4e5F6g7H'), barrier('z9Y8x7W6v5U4t3SAAA')],
    [tactic('t1', 'a1B2c3D4e5F6g7HAAA'), tactic('t2', 'z9Y8x7W6v5U4t3S')]
  );

  assert.deepEqual(
    groups.map((group) => group.medicalTactics.map((entry) => entry.id)),
    [['t1'], ['t2']]
  );
});

test('deactivated tactics are excluded from the group', () => {
  const groups = buildBarrierTacticGroups(
    [barrier('b1')],
    [tactic('t1', 'b1'), tactic('t2', 'b1', { isDeactivated: true })]
  );

  assert.deepEqual(groups[0].medicalTactics.map((entry) => entry.id), ['t1']);
});

// --- Test 5: slide overflow keeps groups whole ---------------------------

test('a group that does not fit moves whole to the next slide', () => {
  const barriers = Array.from({ length: 12 }, (_, index) => barrier(`b${index + 1}`));
  const tactics = barriers.flatMap((record) =>
    Array.from({ length: 3 }, (_, index) => tactic(`${record.id}-t${index}`, record.id))
  );

  const slides = buildSlides(barriers, tactics);
  const pages = barrierSlides(slides);

  assert.ok(pages.length > 1, 'twelve three-tactic barriers need more than one slide');
  // Every barrier appears exactly once, and each appearance carries its full
  // tactic list — nothing is split.
  const rendered = groupsOf(slides);
  assert.deepEqual(rendered.map((group) => group.barrier.title), barriers.map((r) => `Barrier ${r.id}`));
  rendered.forEach((group) => {
    assert.equal(group.rows.length, 3);
    assert.equal(group.continued, false);
    assert.equal(group.continues, false);
  });
  assert.deepEqual(pages.map((page, index) => page.chunkLabel), pages.map((_, index) => `${index + 1} of ${pages.length}`));
});

test('paginated slides never exceed the usable slide height', () => {
  const barriers = Array.from({ length: 8 }, (_, index) => barrier(`b${index + 1}`));
  const tactics = barriers.flatMap((record) =>
    Array.from({ length: (record.id.length % 4) + 1 }, (_, index) => tactic(`${record.id}-t${index}`, record.id))
  );
  // Every slide reserves room for the repeated column-header row.
  const usable = usableBarrierGroupHeight() - headerRowHeight('normal');

  const pages = paginateBarrierGroups(buildBarrierTacticGroups(barriers, tactics));

  pages.forEach((page) => {
    const height = page.reduce((sum, group) => sum + group.height, 0) + GROUP_GAP * (page.length - 1);
    assert.ok(height <= usable + 1e-9, `page height ${height} exceeds usable ${usable}`);
    assert.ok(
      BARRIER_GROUP_AREA.top + headerRowHeight('normal') + height <= BARRIER_GROUP_AREA.bottom + 1e-9,
      'table runs past the footer'
    );
  });
});

// --- Test 6: one oversized barrier --------------------------------------

test('an oversized barrier is split into labelled continuation groups', () => {
  const tactics = Array.from({ length: 40 }, (_, index) => tactic(`t${index}`, 'b1'));
  const groups = buildBarrierTacticGroups([barrier('b1')], tactics);

  const pages = paginateBarrierGroups(groups);

  assert.ok(pages.length > 1, 'forty tactics cannot fit on one slide');
  pages.forEach((page) => assert.equal(page.length, 1, 'an oversized group owns its slide'));

  const parts = pages.flat();
  // Compact layout is attempted before splitting, but never below the minimum
  // readable font size.
  assert.equal(parts[0].mode, 'compact');
  assert.ok(barrierGroupMetrics('compact').tacticFont >= MIN_FONT_SIZE);

  assert.equal(parts[0].continued, false);
  assert.ok(parts.slice(1).every((part) => part.continued), 'later parts are flagged as continuations');
  assert.ok(parts.slice(0, -1).every((part) => part.continues));
  const usable = usableBarrierGroupHeight() - headerRowHeight('normal');
  parts.forEach((part) => {
    assert.equal(part.barrier.title, 'Barrier b1', 'barrier identity repeats on every part');
    assert.ok(part.rows.length > 0);
    assert.ok(part.height <= usable + 1e-9, `part height ${part.height} exceeds usable ${usable}`);
  });
  // Column headers are re-emitted on every slide, so each part gets them back.
  assert.ok(headerRowHeight('normal') > 0);

  // No tactic row is dropped, duplicated, or reordered.
  assert.deepEqual(
    parts.flatMap((part) => part.rows.map((row) => row.tactic.id)),
    tactics.map((entry) => entry.id)
  );
  assert.deepEqual(parts.map((part) => part.startIndex), [0, ...parts.slice(0, -1).map((p, i) => parts.slice(0, i + 1).reduce((sum, q) => sum + q.rows.length, 0))]);
});

// --- Test 7: long text ---------------------------------------------------

test('long text grows row heights instead of overflowing the group', () => {
  const longText = 'Coordinate the outpatient infusion capacity expansion across every referring site. '.repeat(6);
  const groups = buildBarrierTacticGroups(
    [barrier('b1', { name: longText, strategy: longText, comments: longText })],
    [tactic('t1', 'b1', { name: longText, comments: longText, ownerLabel: longText })]
  );

  const short = measureBarrierGroup(buildBarrierTacticGroups([barrier('b2')], [tactic('t2', 'b2')])[0]);
  const long = measureBarrierGroup(groups[0]);

  assert.ok(long.barrierCellHeight > short.barrierCellHeight, 'a long barrier context cell is taller');
  assert.ok(long.rows[0].height > short.rows[0].height, 'a long tactic row is taller');
  assert.ok(long.rows[0].lines > 1);
  // The rows always cover the merged barrier cell, so neither can be clipped.
  const rowsHeight = long.rows.reduce((sum, row) => sum + row.height, 0);
  assert.ok(rowsHeight >= long.barrierCellHeight - 1e-9, 'rows span at least the merged cell height');
  assert.equal(long.height, rowsHeight);
});

test('a tall barrier context cell is covered by its tactic rows', () => {
  const longText = 'The outpatient infusion suite is capped at twelve chairs across two shifts. '.repeat(4);
  // One short tactic under a barrier with a lot of context: the single row has
  // to grow so the merged cell is not clipped.
  const group = measureBarrierGroup(
    buildBarrierTacticGroups(
      [barrier('b1', { name: longText, strategy: longText, comments: longText })],
      [tactic('t1', 'b1', { name: 'Short', comments: '' })]
    )[0]
  );

  assert.equal(group.rows.length, 1);
  assert.ok(group.rows[0].height >= group.barrierCellHeight - 1e-9);
  assert.equal(group.height, group.rows[0].height);
});

// --- Test 8: missing optional values -------------------------------------

test('missing optional values never render as undefined or null', () => {
  const groups = buildBarrierTacticGroups(
    [{ id: 'b1', name: null, category: null, status: '', indication: undefined, strategy: null, businessImpact: '', comments: null }],
    [{ id: 't1', barrierDriverId: 'b1', name: '', status: null, ownerLabel: undefined, dueDate: null, comments: '' }]
  );

  const serialized = JSON.stringify(groups);
  assert.doesNotMatch(serialized, /"(undefined|null|NaN|Invalid Date)"/);

  const [group] = groups;
  assert.equal(group.barrier.title, 'Untitled');
  assert.deepEqual(group.barrier.cells, ['Untitled', 'Not entered', 'Not entered', 'Open']);
  assert.deepEqual(group.medicalTactics[0].cells, [
    'Untitled medical tactic', 'No due date', 'Not entered', 'Unassigned',
  ]);

  assert.doesNotThrow(() => paginateBarrierGroups(groups));
});

// --- Section wiring ------------------------------------------------------

test('the barriers section replaces the tactic count with the tactic list', () => {
  const slides = buildSlides([barrier('b1')], [tactic('t1', 'b1'), tactic('t2', 'b1')]);
  const slide = slides.find((entry) => entry.key === 'barriers');

  assert.equal(slide.type, 'barrier-groups');
  assert.deepEqual(
    slide.groups[0].rows.map((row) => row.tactic.title),
    ['Tactic t1', 'Tactic t2']
  );
  // Each barrier field keeps its own column; none of them is a tactic count.
  assert.deepEqual(
    BARRIER_COLUMNS.map((column) => column.header),
    ['Title', 'Strategy', 'Indication', 'Status']
  );
  assert.equal(
    BARRIER_COLUMNS.some((column) => /open medical tactics|count/i.test(column.header)),
    false,
    'the count-only column is gone'
  );
});

test('a tactic shown under its barrier or opportunity is not repeated in the tactics section', () => {
  const slides = buildAccountPlanPptSlides({
    barriersDrivers: { barriers: [barrier('b1')], drivers: [barrier('d1')] },
    criticalActivities: { activities: [tactic('t1', 'b1'), tactic('t2', 'd1')] },
  });

  // Each tactic appears exactly once in the deck: under its own parent.
  assert.deepEqual(
    slides.filter((slide) => slide.type === 'barrier-groups').flatMap((slide) =>
      slide.groups.flatMap((group) => group.rows.map((row) => row.tactic.id))
    ),
    ['t1', 't2']
  );
  // There is no standalone Medical Tactics section to repeat them in.
  assert.equal(slides.some((slide) => slide.key.startsWith('critical-activities')), false);
});

test('opportunities are exported after barriers', () => {
  const slides = buildAccountPlanPptSlides({
    barriersDrivers: { barriers: [barrier('b1')], drivers: [barrier('d1')] },
    criticalActivities: { activities: [] },
  });

  assert.ok(
    slides.findIndex((slide) => slide.key === 'barriers') <
      slides.findIndex((slide) => slide.key === 'drivers')
  );
});

// A parentless tactic cannot exist: createCriticalActivity / updateCriticalActivity
// reject one ("Linked Barrier/Opportunity is required."), and the loader drops any
// tactic whose parent is not in the visible set. This only pins the defensive
// guard — malformed data must not throw or land under the wrong barrier.
test('a parentless tactic is skipped rather than mis-grouped', () => {
  const groups = buildBarrierTacticGroups(
    [barrier('b1')],
    [tactic('t1', 'b1'), tactic('t2', null)]
  );

  assert.deepEqual(groups[0].medicalTactics.map((entry) => entry.id), ['t1']);
  assert.doesNotThrow(() => buildSlides([barrier('b1')], [tactic('t2', null)]));
});

test('an empty barriers section still produces one slide with an empty message', () => {
  const slides = buildSlides([], []);
  const pages = barrierSlides(slides);

  assert.equal(pages.length, 1);
  assert.deepEqual(pages[0].groups, []);
  assert.equal(pages[0].emptyMessage, 'No barriers available.');
  assert.equal(pages[0].chunkLabel, '');
});
