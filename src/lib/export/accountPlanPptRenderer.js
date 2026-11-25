import PptxGenJS from 'pptxgenjs';
import {
  BARRIER_COLUMNS,
  BARRIER_GROUP_AREA,
  BARRIER_GROUP_COLUMNS,
  TACTIC_COLUMNS,
  ZERO_TACTIC_MESSAGE,
  barrierGroupMetrics,
  columnWidths,
  headerRowHeight,
} from './accountPlanPptBarrierGroups.js';

const SLIDE = { width: 13.333, height: 7.5 };
const TABLE_WIDTH = 12.35;

const COLORS = {
  accent: '0065A8',
  accentDark: '004B7C',
  dark: '233243',
  mid: '55565C',
  border: 'BFD6E6',
  pale: '0065A8',
  row: 'F6FAFD',
  white: 'FFFFFF',
  bg: 'FFFFFF',
};

const FONT = 'Trebuchet MS';

const cleanText = (value, fallback = '-') => {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value).replace(/\s+/g, ' ').trim() || fallback;
};

// Table cells may intentionally contain line breaks (for example one Medical
// Education selection per line). Normalize whitespace within each line while
// preserving those explicit breaks for PowerPoint; no bullet formatting is
// applied.
const cleanTableText = (value, fallback = '-') => {
  if (value === null || value === undefined || value === '') return fallback;
  const text = String(value)
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
  return text || fallback;
};

const limitText = (value, limit = 95) => {
  const text = cleanTableText(value);
  return text.length > limit ? `${text.slice(0, Math.max(0, limit - 3))}...` : text;
};

const normalizeColWidths = (colWidths = [], targetWidth = TABLE_WIDTH) => {
  if (!colWidths.length) return [];
  const total = colWidths.reduce((sum, width) => sum + Number(width || 0), 0);
  if (!total) return colWidths;
  return colWidths.map((width) => (Number(width || 0) / total) * targetWidth);
};

const setSlideBackground = (slide) => {
  slide.background = { color: COLORS.bg };
};

const addKiteRule = (pres, slide) => {
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 0.09,
    h: SLIDE.height,
    fill: { color: COLORS.accent },
    line: { color: COLORS.accent },
  });
};

const addHeader = (pres, slide, title, slideTitle, label, chunkLabel) => {
  setSlideBackground(slide);
  addKiteRule(pres, slide);
  slide.addText(slideTitle, {
    x: 0.72,
    y: 0.4,
    w: 11.82,
    h: 0.42,
    fontFace: FONT,
    fontSize: 22,
    color: COLORS.accent,
    bold: true,
    margin: 0,
    breakLine: false,
    fit: 'shrink',
    align: 'center',
  });
  slide.addText(title, {
    x: 0.72,
    y: 0.88,
    w: 7.45,
    h: 0.2,
    fontFace: FONT,
    fontSize: 9.5,
    color: COLORS.mid,
    bold: true,
    margin: 0,
    fit: 'shrink',
    breakLine: false,
  });
  slide.addText([label, chunkLabel].filter(Boolean).join('  |  '), {
    x: 8.45,
    y: 0.88,
    w: 3.98,
    h: 0.2,
    fontFace: FONT,
    fontSize: 8.7,
    color: COLORS.mid,
    bold: true,
    align: 'right',
    margin: 0,
    fit: 'shrink',
  });
  slide.addShape(pres.ShapeType.line, {
    x: 0.72,
    y: 1.18,
    w: 11.8,
    h: 0,
    line: { color: COLORS.border, width: 0.8 },
  });
};

const addFooter = (slide, pageNumber) => {
  slide.addText('Confidential – Internal Use Only', {
    x: 3.35,
    y: 6.96,
    w: 6.65,
    h: 0.22,
    fontFace: FONT,
    fontSize: 9,
    color: COLORS.mid,
    margin: 0,
    align: 'center',
  });
  slide.addText(String(pageNumber), {
    x: 12.0,
    y: 6.95,
    w: 0.45,
    h: 0.24,
    fontFace: FONT,
    fontSize: 9.5,
    color: COLORS.mid,
    margin: 0,
    align: 'right',
  });
};

const addCardBackground = (pres, slide, x, y, w, h) => {
  slide.addShape(pres.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.08,
    fill: { color: COLORS.white },
    line: { color: COLORS.border, width: 0.7 },
    shadow: { type: 'outer', color: '000000', blur: 1, angle: 45, distance: 1, opacity: 0.04 },
  });
};

const addTitleSlide = (pres, slide, title, pptSlide) => {
  setSlideBackground(slide);
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: SLIDE.width,
    h: 0.86,
    fill: { color: COLORS.accent },
    line: { color: COLORS.accent },
  });
  slide.addText(cleanText(pptSlide.label, 'Account plan export'), {
    x: 0.62,
    y: 0.24,
    w: 3.0,
    h: 0.2,
    fontFace: FONT,
    fontSize: 10,
    color: COLORS.white,
    bold: true,
    margin: 0,
    charSpace: 1.1,
  });
  slide.addText(title, {
    x: 0.72,
    y: 2.06,
    w: 8.7,
    h: 0.74,
    fontFace: FONT,
    fontSize: 34,
    color: COLORS.dark,
    bold: true,
    margin: 0,
    fit: 'shrink',
    breakLine: false,
  });
  // No separate account-name line: the title already reads "<Account> Account
  // Plan", so repeating the account under it duplicates the same text.
  const fields = pptSlide.fields || [];
  fields.slice(0, 3).forEach((field, index) => {
    const x = 0.76 + index * 3.2;
    slide.addText(cleanText(field.label, '').toUpperCase(), {
      x,
      y: 4.7,
      w: 2.72,
      h: 0.18,
      fontFace: FONT,
      fontSize: 7.5,
      color: COLORS.mid,
      bold: true,
      margin: 0,
      fit: 'shrink',
    });
    slide.addText(cleanText(field.value, 'Not entered'), {
      x,
      y: 5.0,
      w: 2.72,
      h: 0.28,
      fontFace: FONT,
      fontSize: 13,
      color: COLORS.dark,
      bold: true,
      margin: 0,
      fit: 'shrink',
    });
  });

  slide.addShape(pres.ShapeType.rect, {
    x: 0.76,
    y: 5.72,
    w: 11.82,
    h: 0.03,
    fill: { color: COLORS.border },
    line: { color: COLORS.border },
  });
  slide.addText(`Generated ${new Date().toLocaleDateString()}`, {
    x: 0.76,
    y: 6.02,
    w: 4.6,
    h: 0.18,
    fontFace: FONT,
    fontSize: 8,
    color: COLORS.mid,
    margin: 0,
  });
};

const addCardsSlide = (pres, slide, pptSlide) => {
  const cards = pptSlide.cards || [];
  const summaryCards = pptSlide.summaryCards || [];
  if (summaryCards.length) {
    if (pptSlide.summaryTitle) {
      slide.addText(cleanText(pptSlide.summaryTitle, ''), {
        x: 0.58,
        y: 1.34,
        w: 12.16,
        h: 0.24,
        fontFace: FONT,
        fontSize: 11,
        color: COLORS.accentDark,
        bold: true,
        margin: 0,
        fit: 'shrink',
      });
    }
    const startX = 0.58;
    const y = pptSlide.summaryTitle ? 1.66 : 1.42;
    const gap = 0.14;
    const visibleSummaryCards = summaryCards.slice(0, 5);
    const cardWidth = (12.16 - gap * Math.max(visibleSummaryCards.length - 1, 0)) /
      Math.max(visibleSummaryCards.length, 1);
    visibleSummaryCards.forEach((card, index) => {
      const x = startX + index * (cardWidth + gap);
      slide.addShape(pres.ShapeType.roundRect, {
        x,
        y,
        w: cardWidth,
        h: 0.72,
        rectRadius: 0.05,
        fill: { color: COLORS.white },
        line: { color: COLORS.border, width: 0.55 },
      });
      slide.addText(cleanText(card.label, '').toUpperCase(), {
        x: x + 0.13,
        y: y + 0.12,
        w: cardWidth - 0.26,
        h: 0.16,
        fontFace: FONT,
        fontSize: 6.7,
        color: COLORS.mid,
        bold: true,
        margin: 0,
        fit: 'shrink',
        breakLine: false,
      });
      slide.addText(cleanText(card.value, 'Not entered'), {
        x: x + 0.13,
        y: y + 0.36,
        w: cardWidth - 0.26,
        h: 0.22,
        fontFace: FONT,
        fontSize: 10.2,
        color: COLORS.accentDark,
        bold: true,
        margin: 0,
        fit: 'shrink',
        breakLine: false,
      });
    });
  }

  const cardWidth = 5.92;
  const hasSummary = summaryCards.length > 0;
  const hasCardsTitle = Boolean(pptSlide.cardsTitle);
  const cardHeight = hasSummary
    ? (hasCardsTitle ? 3.45 : 3.81)
    : (hasCardsTitle ? 4.55 : 4.65);
  const cardY = hasSummary
    ? (hasCardsTitle ? 2.94 : 2.58)
    : (hasCardsTitle ? 1.86 : 1.52);
  if (hasCardsTitle) {
    slide.addText(cleanText(pptSlide.cardsTitle, ''), {
      x: 0.58,
      y: hasSummary ? 2.58 : 1.42,
      w: 12.16,
      h: 0.24,
      fontFace: FONT,
      fontSize: 11,
      color: COLORS.accentDark,
      bold: true,
      margin: 0,
      fit: 'shrink',
    });
  }
  cards.slice(0, 2).forEach((card, index) => {
    const x = index === 0 ? 0.58 : 6.82;
    const y = cardY;
    addCardBackground(pres, slide, x, y, cardWidth, cardHeight);
    if (card.label) {
      slide.addText(cleanText(card.label, '').toUpperCase(), {
        x: x + 0.28,
        y: y + 0.24,
        w: cardWidth - 0.56,
        h: 0.2,
        fontFace: FONT,
        fontSize: 8,
        color: COLORS.accent,
        bold: true,
        charSpace: 1.4,
        margin: 0,
      });
    }
    slide.addText(cleanText(card.title, ''), {
      x: x + 0.28,
      y: y + (card.label ? 0.54 : 0.3),
      w: cardWidth - 0.56,
      h: 0.42,
      fontFace: FONT,
      fontSize: 16,
      color: COLORS.accentDark,
      bold: true,
      margin: 0,
      fit: 'shrink',
    });
    const bulletItems = (card.bullets || [])
      .map((item) => cleanText(item, ''))
      .filter(Boolean);
    const body = bulletItems.length
      ? bulletItems.map((item) => ({
          text: item,
          options: {
            bullet: true,
            breakLine: true,
          },
        }))
      : cleanText(card.body, 'Not entered');
    slide.addText(body, {
      x: x + 0.28,
      y: y + (card.label ? 1.08 : 0.9),
      w: cardWidth - 0.56,
      h: cardHeight - (card.label ? 1.36 : 1.18),
      fontFace: FONT,
      fontSize: 12.5,
      color: COLORS.dark,
      margin: 0.03,
      valign: 'top',
      fit: 'shrink',
      breakLine: false,
    });
  });
};

const addBoxesSlide = (pres, slide, pptSlide) => {
  const boxes = pptSlide.boxes || [];
  boxes.slice(0, 2).forEach((box, index) => {
    const x = index === 0 ? 0.58 : 6.82;
    const y = 1.55;
    const w = 5.92;
    const h = 4.92;
    addCardBackground(pres, slide, x, y, w, h);
    slide.addText(cleanText(box.title, ''), {
      x: x + 0.28,
      y: y + 0.3,
      w: w - 0.56,
      h: 0.38,
      fontFace: FONT,
      fontSize: 15,
      color: COLORS.accentDark,
      bold: true,
      margin: 0,
      fit: 'shrink',
    });
    slide.addText(cleanText(box.body, 'Not entered'), {
      x: x + 0.28,
      y: y + 0.9,
      w: w - 0.56,
      h: h - 1.24,
      fontFace: FONT,
      fontSize: 10.8,
      color: COLORS.dark,
      margin: 0.02,
      valign: 'top',
      fit: 'shrink',
      breakLine: false,
    });
  });
};

const tableCell = (text, options = {}) => ({
  text: limitText(text, options.limit || 95),
  options: {
    fontFace: FONT,
    fontSize: options.fontSize || 7.6,
    color: options.color || COLORS.dark,
    bold: !!options.bold,
    fill: { color: options.fill || COLORS.white },
    margin: 0.055,
    valign: options.valign || 'middle',
    ...(options.rowspan > 1 ? { rowspan: options.rowspan } : {}),
    ...(options.colspan > 1 ? { colspan: options.colspan } : {}),
  },
});

const addTableSlide = (slide, pptSlide) => {
  const headers = pptSlide.headers || [];
  const rows = pptSlide.rows || [];
  if (!rows.length) {
    slide.addText(pptSlide.emptyMessage || 'No records available.', {
      x: 0.58,
      y: 1.72,
      w: 12.1,
      h: 0.42,
      fontFace: FONT,
      fontSize: 14,
      color: COLORS.mid,
      margin: 0,
    });
    return;
  }

  const rowHeight = Math.min(0.46, 5.08 / Math.max(rows.length + 1, 1));
  const colLimits = Array.isArray(pptSlide.colLimits) ? pptSlide.colLimits : [];
  const tableRows = [
    headers.map((header) => tableCell(header, {
      bold: true,
      fontSize: 7.3,
      color: COLORS.white,
      fill: COLORS.pale,
      limit: 42,
    })),
    ...rows.map((row, rowIndex) =>
      row.map((cell, colIndex) => tableCell(cell, {
        fill: rowIndex % 2 === 0 ? COLORS.white : COLORS.row,
        // Wider per-cell limit for columns that wrap heavier content
        // (e.g. Comments on the barrier/driver export) — falls back to
        // the tableCell default (95) when no override is provided.
        limit: colLimits[colIndex],
      }))
    ),
  ];

  slide.addTable(tableRows, {
    x: 0.72,
    y: 1.48,
    w: TABLE_WIDTH,
    h: 5.08,
    colW: normalizeColWidths(pptSlide.colWidths, TABLE_WIDTH),
    rowH: rowHeight,
    border: { pt: 0.5, color: COLORS.border },
    margin: 0.04,
    valign: 'middle',
    autoFit: false,
  });
};

// ---------------------------------------------------------------------------
// Barrier -> Medical Tactics grid
//
// One table per slide. Each Barrier field keeps its own column and those cells
// are merged (rowspan) down all of that barrier's tactic rows, so tactics stay
// separated by normal gridlines while the barrier they belong to is unambiguous:
//
//   Barrier 1 | Capacity | Open | ... | tactic 1 | Planned  | ...
//             |          |      |     | tactic 2 | Complete | ...
//   Barrier 2 | Clinical | Open | ... | tactic 1 | Planned  | ...
//
// Every row is drawn at the exact height accountPlanPptBarrierGroups measured
// for it during pagination, so nothing is clipped and no group is split unless
// it physically cannot fit on one slide.
// ---------------------------------------------------------------------------

const addBarrierGroupsSlide = (slide, pptSlide) => {
  const groups = pptSlide.groups || [];
  if (!groups.length) {
    slide.addText(pptSlide.emptyMessage || 'No records available.', {
      x: 0.58,
      y: 1.72,
      w: 12.1,
      h: 0.42,
      fontFace: FONT,
      fontSize: 14,
      color: COLORS.mid,
      margin: 0,
    });
    return;
  }

  // Column headers repeat on every slide, including continuations.
  const headerMetrics = barrierGroupMetrics('normal');
  const tableRows = [
    BARRIER_GROUP_COLUMNS.map((column) =>
      tableCell(column.header, {
        bold: true,
        fontSize: headerMetrics.headerFont,
        color: COLORS.white,
        fill: COLORS.pale,
        limit: 42,
      })
    ),
  ];
  const rowHeights = [headerRowHeight('normal')];

  groups.forEach((group, groupIndex) => {
    const metrics = barrierGroupMetrics(group.mode);
    // Banding by group (not by row) keeps a barrier and its tactics reading as
    // one block.
    // One fill for the whole group — barrier context and tactic rows alike —
    // alternating between groups, so each barrier reads as a single band.
    const groupFill = groupIndex % 2 === 0 ? COLORS.white : COLORS.row;

    group.rows.forEach((row, rowIndex) => {
      // Barrier context cells are emitted once, on the group's first row, with
      // a rowspan covering the rest. Continuation rows carry only the tactic
      // cell — pptxgenjs fills in the vertical-merge placeholders by position,
      // which is why the columns are walked in grid order here.
      const cells = [];
      BARRIER_GROUP_COLUMNS.forEach((column) => {
        if (column.source === 'tactic') {
          // With no tactics, one cell spans every tactic column so the zero
          // state reads as a statement rather than a row of empty columns.
          if (group.isZeroState) {
            if (column.key !== TACTIC_COLUMNS[0].key) return;
            cells.push(
              tableCell(ZERO_TACTIC_MESSAGE, {
                colspan: TACTIC_COLUMNS.length,
                fontSize: metrics.tacticFont,
                color: COLORS.mid,
                italic: true,
                fill: groupFill,
                valign: 'middle',
              })
            );
            return;
          }
          const tacticIndex = TACTIC_COLUMNS.findIndex((entry) => entry.key === column.key);
          cells.push(
            tableCell(row.tactic.cells[tacticIndex], {
              fontSize: metrics.tacticFont,
              fill: groupFill,
              limit: column.limit,
              valign: 'top',
            })
          );
          return;
        }
        if (rowIndex > 0) return;
        const barrierIndex = BARRIER_COLUMNS.findIndex((entry) => entry.key === column.key);
        const isTitle = column.key === 'title';
        cells.push(
          tableCell(
            // A split group repeats its barrier, so the repeat is labelled.
            isTitle && group.continued
              ? `${group.barrier.cells[barrierIndex]} (continued)`
              : group.barrier.cells[barrierIndex],
            {
              rowspan: group.rows.length,
              fill: groupFill,
              fontSize: isTitle ? metrics.barrierTitleFont : metrics.barrierFont,
              color: isTitle ? COLORS.accentDark : COLORS.dark,
              bold: isTitle,
              limit: column.limit + (isTitle ? 12 : 0),
              valign: 'top',
            }
          )
        );
      });
      tableRows.push(cells);
      rowHeights.push(row.height);
    });
  });

  slide.addTable(tableRows, {
    x: BARRIER_GROUP_AREA.x,
    y: BARRIER_GROUP_AREA.top,
    w: BARRIER_GROUP_AREA.width,
    colW: columnWidths(BARRIER_GROUP_AREA.width),
    // Per-row heights come straight from the measured layout, so the table
    // occupies exactly the space pagination reserved for it.
    rowH: rowHeights,
    border: { pt: 0.5, color: COLORS.border },
    margin: 0.055,
    valign: 'top',
    autoPage: false,
  });
};

export const createAccountPlanPresentation = (slides, options = {}) => {
  const pres = new PptxGenJS();
  pres.author = 'Kite MyInsights';
  pres.subject = 'Account Plan Export';
  pres.title = options.title || 'Account Plan Export';
  pres.company = 'Kite';
  pres.lang = 'en-US';
  pres.defineLayout({ name: 'KITE_WIDE', width: SLIDE.width, height: SLIDE.height });
  pres.layout = 'KITE_WIDE';
  pres.theme = {
    headFontFace: FONT,
    bodyFontFace: FONT,
    lang: 'en-US',
  };

  (slides || []).forEach((pptSlide, index) => {
    const slide = pres.addSlide();
    if (pptSlide.type === 'title') {
      addTitleSlide(pres, slide, options.title || 'Account Plan Export', pptSlide);
    } else {
      addHeader(pres, slide, options.title || 'Account Plan Export', pptSlide.title, pptSlide.label, pptSlide.chunkLabel);
    }
    if (pptSlide.type === 'title') {
      return;
    } else if (pptSlide.type === 'cards') {
      addCardsSlide(pres, slide, pptSlide);
    } else if (pptSlide.type === 'boxes') {
      addBoxesSlide(pres, slide, pptSlide);
    } else if (pptSlide.type === 'barrier-groups') {
      addBarrierGroupsSlide(slide, pptSlide);
    } else {
      addTableSlide(slide, pptSlide);
    }
    addFooter(slide, index + 1);
  });

  return pres;
};

export const PPTX_MIME = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
