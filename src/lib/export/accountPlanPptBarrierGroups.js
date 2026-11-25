// Geometry + measurement for the grouped "Barrier -> its Medical Tactics" table.
//
// One table per slide. Each Barrier field keeps its own column, and those cells
// are merged (rowspan) down all of that barrier's tactic rows, so a group reads
// as one block with normal table gridlines separating the tactics:
//
//   Barrier 1 | Capacity | Open | ... | tactic 1 | Planned | ...
//             |          |      |     | tactic 2 | Complete| ...
//   Barrier 2 | Clinical | Open | ... | tactic 1 | Planned | ...
//
// Pagination (accountPlanPptSections) and drawing (accountPlanPptRenderer) both
// read their numbers from here, so the vertical space a group is *budgeted*
// during pagination is exactly the space it is *drawn* in. Keeping the two in
// one place is what stops rows from being clipped or overlapping.
//
// Deliberately dependency-free: it is imported by plain `node --test` files.

// Table band on a KITE_WIDE slide: below the header rule (y 1.18) and above the
// footer (y 6.95).
export const BARRIER_GROUP_AREA = {
  x: 0.72,
  width: 12.35,
  top: 1.48,
  bottom: 6.85,
};

// Smallest font the export is allowed to use. The compact layout may shrink to
// this, never below it.
export const MIN_FONT_SIZE = 7;

// Left + right cell margins applied by the renderer's table cells.
const CELL_SIDE_MARGINS = 0.12;

// Trebuchet MS averages ~0.5em per glyph; the ratios are rounded up slightly so
// estimates over- rather than under-provision (PowerPoint grows a table row
// that needs more space than we asked for, which would push later rows off the
// slide).
const CHAR_WIDTH_RATIO = 0.52;
const LINE_HEIGHT_RATIO = 1.34;

const LAYOUT_MODES = {
  normal: {
    headerFont: 7.6,
    barrierTitleFont: 7.9,
    barrierFont: 7.6,
    tacticFont: 7.6,
    rowPad: 0.1,
  },
  compact: {
    headerFont: 7.2,
    barrierTitleFont: MIN_FONT_SIZE,
    barrierFont: MIN_FONT_SIZE,
    tacticFont: MIN_FONT_SIZE,
    rowPad: 0.06,
  },
};

export const barrierGroupMetrics = (mode) => LAYOUT_MODES[mode] || LAYOUT_MODES.normal;

// `source: 'barrier'` columns are merged (rowspan) down the whole group;
// `source: 'tactic'` columns vary row by row, so each tactic's fields are
// separated from the next by the table's own gridlines.
//
// Barrier columns lead and tactic columns follow, contiguously — the zero-state
// row relies on the tactic columns sitting next to each other so one cell can
// span them.
export const BARRIER_GROUP_COLUMNS = [
  { key: 'title', header: 'Title', source: 'barrier', weight: 2.6, limit: 160 },
  { key: 'strategy', header: 'Strategy', source: 'barrier', weight: 1.9, limit: 90 },
  { key: 'indication', header: 'Indication', source: 'barrier', weight: 0.9, limit: 24 },
  { key: 'status', header: 'Status', source: 'barrier', weight: 0.85, limit: 24 },
  { key: 'tacticTitle', header: 'Medical Tactics', source: 'tactic', weight: 2.6, limit: 200 },
  { key: 'dueDate', header: 'Due Date', source: 'tactic', weight: 0.85, limit: 18 },
  { key: 'tacticStatus', header: 'Tactic Status', source: 'tactic', weight: 0.95, limit: 28 },
  { key: 'accountable', header: 'Accountable', source: 'tactic', weight: 1.35, limit: 60 },
];

// `gridIndex` is the column's position in the rendered table, which the merged
// barrier columns need because they are not contiguous.
const columnsFrom = (source) =>
  BARRIER_GROUP_COLUMNS.map((column, gridIndex) => ({ ...column, gridIndex })).filter(
    (column) => column.source === source
  );

export const BARRIER_COLUMNS = columnsFrom('barrier');
export const TACTIC_COLUMNS = columnsFrom('tactic');

export const ZERO_TACTIC_MESSAGE = 'No Medical Tactics associated.';

// Adjacent groups share a border — that shared edge is what makes the merged
// barrier cells read as one block.
export const GROUP_GAP = 0;

export const columnWidths = (areaWidth = BARRIER_GROUP_AREA.width) => {
  const total = BARRIER_GROUP_COLUMNS.reduce((sum, column) => sum + column.weight, 0);
  return BARRIER_GROUP_COLUMNS.map((column) => (column.weight / total) * areaWidth);
};

const lineHeight = (fontSize) => (fontSize * LINE_HEIGHT_RATIO) / 72;

// Greedy word-wrap line count. Words longer than a line (e.g. a pasted URL in a
// comment) are counted as wrapping mid-word, which is what PowerPoint does.
export const estimateTextLines = (text, widthInches, fontSize) => {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!value || !(widthInches > 0)) return 1;
  const charsPerLine = Math.max(4, Math.floor((widthInches * 72) / (fontSize * CHAR_WIDTH_RATIO)));
  let lines = 1;
  let used = 0;
  for (const word of value.split(' ')) {
    if (!word) continue;
    if (used === 0) used = word.length;
    else if (used + 1 + word.length <= charsPerLine) used += 1 + word.length;
    else {
      lines += 1;
      used = word.length;
    }
    while (used > charsPerLine) {
      lines += 1;
      used -= charsPerLine;
    }
  }
  return lines;
};

export const headerRowHeight = (mode = 'normal') => {
  const metrics = barrierGroupMetrics(mode);
  return Math.max(0.24, lineHeight(metrics.headerFont) + metrics.rowPad);
};

export const usableBarrierGroupHeight = (areaHeight) =>
  Number(areaHeight) > 0 ? Number(areaHeight) : BARRIER_GROUP_AREA.bottom - BARRIER_GROUP_AREA.top;

const textHeight = (text, width, fontSize) =>
  estimateTextLines(text, width - CELL_SIDE_MARGINS, fontSize) * lineHeight(fontSize);

// Height of the merged barrier block: the tallest of its context cells. The
// title is measured with room for the " (continued)" suffix a split group adds.
const measureBarrierCells = (barrier, colWidths, metrics) =>
  BARRIER_COLUMNS.reduce((tallest, column, index) => {
    const isTitle = column.key === 'title';
    const text = isTitle ? `${barrier?.cells?.[index] ?? ''} (continued)` : barrier?.cells?.[index];
    const font = isTitle ? metrics.barrierTitleFont : metrics.barrierFont;
    return Math.max(tallest, textHeight(text, colWidths[column.gridIndex], font));
  }, 0) + metrics.rowPad;

const measureTacticRow = (tactic, colWidths, metrics) => {
  const lines = TACTIC_COLUMNS.reduce(
    (max, column, index) =>
      Math.max(
        max,
        estimateTextLines(tactic?.cells?.[index], colWidths[column.gridIndex] - CELL_SIDE_MARGINS, metrics.tacticFont)
      ),
    1
  );
  return {
    tactic,
    lines,
    height: Math.max(0.24, lines * lineHeight(metrics.tacticFont) + metrics.rowPad),
  };
};

// A barrier with no tactics still occupies one row — the zero-state row.
const measureZeroStateRow = (metrics) => ({
  tactic: null,
  lines: 1,
  height: Math.max(0.26, lineHeight(metrics.tacticFont) + metrics.rowPad),
});

/**
 * The merged barrier cells span the group's rows, so the rows must together be
 * at least as tall as the tallest of them. Any deficit is added to the last row
 * rather than letting PowerPoint silently grow the table.
 */
const finalizeGroup = (group) => {
  const rowsHeight = group.rows.reduce((sum, row) => sum + row.height, 0);
  const deficit = group.barrierCellHeight - rowsHeight;
  const rows = deficit > 0
    ? group.rows.map((row, index) =>
        index === group.rows.length - 1 ? { ...row, height: row.height + deficit } : row
      )
    : group.rows;
  return { ...group, rows, height: Math.max(rowsHeight, group.barrierCellHeight) };
};

/**
 * Measure one complete Barrier group (its merged context cells plus every
 * tactic row, or the zero-state row) in a given layout mode. The returned
 * object is the render contract: accountPlanPptRenderer draws straight from
 * these numbers.
 */
export const measureBarrierGroup = (group, mode = 'normal', areaWidth = BARRIER_GROUP_AREA.width) => {
  const metrics = barrierGroupMetrics(mode);
  const barrier = group?.barrier || {};
  const tactics = group?.medicalTactics || [];
  const colWidths = columnWidths(areaWidth);

  return finalizeGroup({
    barrier,
    mode,
    rows: tactics.length
      ? tactics.map((tactic) => measureTacticRow(tactic, colWidths, metrics))
      : [measureZeroStateRow(metrics)],
    barrierCellHeight: measureBarrierCells(barrier, colWidths, metrics),
    isZeroState: !tactics.length,
    startIndex: 0,
    totalTactics: tactics.length,
    continued: false,
    continues: false,
  });
};

// A group whose merged cells + tactic rows are taller than the table area even
// in compact mode cannot physically fit. Split its tactic rows across
// continuation slides, repeating the barrier context, and never splitting a row.
const splitOversizedGroup = (measured, usableHeight) => {
  const parts = [];
  let index = 0;
  while (index < measured.rows.length) {
    const startIndex = index;
    const rows = [];
    let height = 0;
    // `!rows.length` guarantees forward progress: an individual row taller than
    // the slide still gets its own part rather than looping forever.
    while (index < measured.rows.length && (!rows.length || height + measured.rows[index].height <= usableHeight)) {
      height += measured.rows[index].height;
      rows.push(measured.rows[index]);
      index += 1;
    }
    parts.push(
      finalizeGroup({
        ...measured,
        rows,
        // The continuation repeats the barrier context, but must not grow past
        // the rows it was already sized to fit.
        barrierCellHeight: Math.min(measured.barrierCellHeight, height),
        startIndex,
        continued: parts.length > 0,
        continues: index < measured.rows.length,
      })
    );
  }
  if (!parts.length) parts.push(measured);
  return parts;
};

/**
 * Pack complete Barrier groups onto slides by measured height — never by a
 * fixed row count. A group that does not fit in the space left on the current
 * slide moves whole to the next one.
 *
 * @returns {Array<Array<object>>} one array of measured groups per slide.
 */
export const paginateBarrierGroups = (groups, options = {}) => {
  const areaWidth = options.areaWidth || BARRIER_GROUP_AREA.width;
  // The repeated column-header row costs the same on every slide.
  const usableHeight = usableBarrierGroupHeight(options.areaHeight) - headerRowHeight('normal');
  const pages = [];
  let current = [];
  let used = 0;

  const flush = () => {
    if (!current.length) return;
    pages.push(current);
    current = [];
    used = 0;
  };

  for (const group of groups || []) {
    let measured = measureBarrierGroup(group, 'normal', areaWidth);
    // Try a compact (but still readable, never below MIN_FONT_SIZE) layout
    // before resorting to splitting the group.
    if (measured.height > usableHeight) measured = measureBarrierGroup(group, 'compact', areaWidth);

    if (measured.height > usableHeight) {
      flush();
      for (const part of splitOversizedGroup(measured, usableHeight)) pages.push([part]);
      continue;
    }

    if (current.length && used + GROUP_GAP + measured.height > usableHeight) flush();
    used += (current.length ? GROUP_GAP : 0) + measured.height;
    current.push(measured);
  }

  flush();
  return pages;
};
