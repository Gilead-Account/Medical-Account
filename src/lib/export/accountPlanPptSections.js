import {
  BARRIER_COLUMNS,
  TACTIC_COLUMNS,
  paginateBarrierGroups,
} from './accountPlanPptBarrierGroups.js';

const DEFAULT_MAX_ROWS_PER_SLIDE = 10;

const hasValue = (value) => value !== null && value !== undefined && value !== '';

const toText = (value, fallback = '-') => {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (!hasValue(value)) return fallback;
  return String(value).replace(/\s+/g, ' ').trim() || fallback;
};

const lastFieldDirectorReviewDisplay = (plan = {}) =>
  formatDate(plan.lastFieldDirectorReviewDate, 'Not entered');

const buildCurrentKpiCards = (header = {}, account = {}, plan = {}) => [
  { label: 'ATC Cohort DLBCL', value: toText(header.atcCohort, 'Not entered') },
  { label: 'MM ATC Priority', value: toText(header.mmAtcPriority || account.mmAtcPriority, 'Not entered') },
  { label: 'Territory', value: toText(plan.territoryDescription || account.territory, 'Not entered') },
  { label: 'Last FD Review', value: lastFieldDirectorReviewDisplay(plan) },
];

const formatDate = (value, fallback = 'Not entered') => {
  if (!value) return fallback;
  const dateOnly = typeof value === 'string' && value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) return `${dateOnly[2]}/${dateOnly[3]}/${dateOnly[1]}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}/${date.getFullYear()}`;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Due dates on the Barrier / Opportunity slides read as "12 July" — day then
// full month, no year. Date-only CRM strings are split by hand for the same
// reason formatDate does it: `new Date('2026-07-12')` is UTC midnight, which
// renders as the previous day west of Greenwich.
const formatDayMonth = (value, fallback = 'No due date') => {
  if (!value) return fallback;
  const dateOnly = typeof value === 'string' && value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const [day, month] = dateOnly
    ? [Number(dateOnly[3]), Number(dateOnly[2]) - 1]
    : (() => {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? [] : [date.getDate(), date.getMonth()];
      })();
  return MONTH_NAMES[month] ? `${day} ${MONTH_NAMES[month]}` : String(value);
};

const chunkRows = (rows, size) => {
  const chunks = [];
  const source = rows && rows.length ? rows : [[]];
  for (let i = 0; i < source.length; i += size) {
    chunks.push(source.slice(i, i + size));
  }
  return chunks.length ? chunks : [[]];
};

const emptySectionMessage = (title) => `No ${String(title || 'records').toLowerCase()} available.`;

// The exported Medical Account Profile tabs. MM Comm Profile and DLBCL Comm
// Profile are reference-only in the app and are intentionally absent.
// `sourceKey` is the loadAccountProfile() key each tab reads — the two
// indications are separate field groups on the same Ecosystem Plan row, so
// each slide reads its own. `prefix` is the indication its field labels carry.
const ATC_MEDICAL_PROFILE_TABS = [
  {
    key: 'mm-medical-profile',
    title: 'MM ATC Medical Profile',
    prefix: 'MM',
    sourceKey: 'mmMedicalProfile',
  },
  {
    key: 'dlbcl-medical-profile',
    title: 'DLBCL ATC Medical Profile',
    prefix: 'DLBCL',
    sourceKey: 'dlbclMedicalProfile',
  },
];

// Row labels mirror the Account Profile tab (AccountIntelligenceTab.jsx), which
// prefixes every field with the indication and names the Kite trial field after
// it. The row order is the export's own and does not follow the tab layout.
const atcMedicalProfileFields = (prefix) => [
  [`${prefix} ATC Profile Category`, 'atcProfileCategory'],
  [`${prefix} Medical Education`, 'medicalEducation'],
  [`${prefix} ATC Profile`, 'atcProfile'],
  [prefix === 'DLBCL' ? 'Kite Lymphoma/Pipeline' : 'Kite MM', 'kiteClinicalTrial'],
  [`${prefix} Competitor Trial`, 'competitorTrial'],
  [`${prefix} Medical Collaboration`, 'medicalCollaboration'],
  [`${prefix} Research Capabilities Timelines`, 'researchCapabilitiesTimelines'],
];

// CRM stores these fields as semicolon-delimited multi-selects; the profile tab
// and the executive summary both display them comma separated.
const MULTI_SELECT_PROFILE_KEYS = new Set([
  'atcProfileCategory',
  'medicalEducation',
  'kiteClinicalTrial',
  'medicalCollaboration',
]);

const splitMultiSelect = (raw) =>
  String(raw ?? '').split(';').map((part) => part.trim()).filter(Boolean);

// Every Medical Education selection carries its own status picklist on the
// Ecosystem Plan (AE Management / ATC Onboarding / Outpatient). toAccountProfile
// flattens those onto the profile under this key prefix, so each selection
// exports on its own line as "<selected value> - <status>".
const MEDICAL_EDUCATION_STATUS_KEY_PREFIX = 'medicalEducationStatusFor:';

// The status dropdown shows '-' for an unset status, which is how the app marks
// a Medical Education value as not selected. Those values are left off the
// slide entirely rather than exported without a status.
const hasEducationStatus = (status) => Boolean(status) && status !== '-';

// Returns null when nothing is selected, which drops the row from the slide
// rather than exporting an empty Medical Education field.
const medicalEducationText = (values) => {
  const lines = splitMultiSelect(values?.medicalEducation)
    .map((selection) => ({
      selection,
      status: toText(values?.[`${MEDICAL_EDUCATION_STATUS_KEY_PREFIX}${selection}`], ''),
    }))
    .filter(({ status }) => hasEducationStatus(status))
    .map(({ selection, status }) => `${selection} - ${status}`);
  return lines.length ? lines.join('\n') : null;
};

const medicalProfileValue = (values, key) => {
  if (key === 'medicalEducation') return medicalEducationText(values);
  const raw = values?.[key];
  if (!MULTI_SELECT_PROFILE_KEYS.has(key)) return toText(raw, 'Not entered');
  const parts = splitMultiSelect(raw);
  return parts.length ? parts.join(', ') : 'Not entered';
};

const medicalProfileRows = (values, prefix) => atcMedicalProfileFields(prefix)
  .map(([label, key]) => [label, medicalProfileValue(values, key)])
  .filter(([, value]) => value !== null);

const addTableSlides = (slides, { key, title, label, headers, rows, colWidths, colLimits }, maxRowsPerSlide) => {
  const chunks = chunkRows(rows || [], maxRowsPerSlide);
  chunks.forEach((chunk, index) => {
    slides.push({
      type: 'table',
      key: chunks.length > 1 ? `${key}-${index + 1}` : key,
      title,
      label,
      headers,
      rows: chunk[0]?.length ? chunk : [],
      colWidths,
      colLimits,
      chunkLabel: chunks.length > 1 ? `${index + 1} of ${chunks.length}` : '',
      emptyMessage: emptySectionMessage(title),
    });
  });
};

const activeStatusFlag = (value) => {
  const raw = value && typeof value === 'object' && 'value' in value ? value.value : value;
  if (raw === true || raw === false) return raw;
  const key = String(raw ?? '').trim().toLowerCase();
  if (key === 'active' || key === 'true' || key === 'yes' || key === '1') return true;
  if (key === 'inactive' || key === 'false' || key === 'no' || key === '0') return false;
  return null;
};

const teamMemberStatus = (row) => {
  const activeFlag = activeStatusFlag(row?.isPrimary);
  if (activeFlag !== null) return activeFlag ? 'Active' : 'Inactive';
  const crmActiveFlag = activeStatusFlag(row?.Account_Team_Member_Active__c ?? row?.accountTeamMemberActive);
  if (crmActiveFlag !== null) return crmActiveFlag ? 'Active' : 'Inactive';
  return toText(row?.status, 'Inactive');
};

const truncate = (value, max) =>
  value.length > max ? `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…` : value;

// Salesforce IDs surface as either the 15- or 18-char form depending on the
// runtime, so both sides of the Barrier ↔ Medical Tactic join are keyed on the
// 15-char prefix. Non-Salesforce ids (mock/test fixtures) are used verbatim.
const relationshipKey = (value) => {
  const raw = String(value ?? '').trim();
  if (!raw) return '';
  return /^[a-zA-Z0-9]{18}$/.test(raw) ? raw.slice(0, 15) : raw;
};

const barrierContext = (record = {}) => {
  const values = {
    title: toText(record.name || record.title, 'Untitled'),
    strategy: toText(record.strategyLabel || record.strategy, 'Not entered'),
    indication: toText(record.indication, 'Not entered'),
    status: toText(record.status, 'Open'),
  };
  return {
    id: record.id || '',
    ...values,
    // Cell order matches BARRIER_COLUMNS so measurement and drawing stay aligned.
    cells: BARRIER_COLUMNS.map((column) => truncate(values[column.key], column.limit)),
  };
};

const medicalTacticEntry = (activity = {}) => {
  const values = {
    tacticTitle: toText(activity.name || activity.title, 'Untitled medical tactic'),
    dueDate: formatDayMonth(activity.dueDate),
    tacticStatus: toText(activity.status, 'Not entered'),
    accountable: toText(activity.ownerLabel || activity.accountable, 'Unassigned'),
  };
  return {
    id: activity.id || '',
    title: values.tacticTitle,
    // Cell order matches TACTIC_COLUMNS so measurement and drawing stay aligned.
    cells: TACTIC_COLUMNS.map((column) => truncate(values[column.key], column.limit)),
  };
};

/**
 * Join each Barrier/Opportunity to the full list of Medical Tactics that point
 * at it, preserving records with no tactics (they render an explicit zero
 * state). Replaces the previous "open tactic count" column.
 */
export const buildBarrierTacticGroups = (records = [], activities = []) => {
  const tacticsByBarrier = new Map();
  for (const activity of activities || []) {
    // Deactivated / soft-deleted tactics are hidden everywhere else in the app.
    if (!activity || activity.isDeactivated === true) continue;
    const key = relationshipKey(activity.barrierDriverId);
    if (!key) continue; // plan-level tactic — no parent barrier to nest under
    if (!tacticsByBarrier.has(key)) tacticsByBarrier.set(key, []);
    tacticsByBarrier.get(key).push(activity);
  }
  return (records || []).map((record) => ({
    barrier: barrierContext(record),
    medicalTactics: (tacticsByBarrier.get(relationshipKey(record?.id)) || []).map(medicalTacticEntry),
  }));
};

// Pagination is height-driven: complete groups are packed onto a slide and any
// group that does not fit in the remaining space moves whole to the next one.
const addBarrierGroupSlides = (slides, { key, title, label, groups }, layoutOptions = {}) => {
  const pages = paginateBarrierGroups(groups, layoutOptions);
  const slidePages = pages.length ? pages : [[]];
  slidePages.forEach((page, index) => {
    slides.push({
      type: 'barrier-groups',
      key: slidePages.length > 1 ? `${key}-${index + 1}` : key,
      title,
      label,
      groups: page,
      chunkLabel: slidePages.length > 1 ? `${index + 1} of ${slidePages.length}` : '',
      emptyMessage: emptySectionMessage(title),
    });
  });
};

export const buildAccountPlanPptSlides = (data, options = {}) => {
  const maxRowsPerSlide = options.maxRowsPerSlide || DEFAULT_MAX_ROWS_PER_SLIDE;
  const slides = [];
  const home = data?.home || {};
  const accountProfile = data?.accountProfile || {};
  const account = home.account || accountProfile.account || {};
  const plan = home.plan || accountProfile.plan || {};
  const header = home.header || accountProfile.header || {};
  const strategies = home.strategies || {};
  const homeCards = [
    {
      title: 'MM Strategy',
      label: '',
      bullets: strategies.mm || [],
      body: (strategies.mm || []).length
        ? (strategies.mm || []).join('\n')
        : 'Not entered',
    },
    {
      title: 'DLBCL Strategy',
      label: '',
      bullets: strategies.dlbcl || [],
      body: (strategies.dlbcl || []).length
        ? (strategies.dlbcl || []).join('\n')
        : 'Not entered',
    },
  ];

  slides.push({
    type: 'title',
    key: 'title',
    title: buildAccountPlanExportTitle(data),
    label: 'Account plan export',
    accountName: toText(account.name || plan.accountName, 'Account Plan'),
    fields: [
      { label: 'EID', value: toText(account.eid || account.externalId || plan.eid, 'Not entered') },
      { label: 'Territory', value: toText(plan.territoryDescription || header.territory, 'Not entered') },
      { label: 'Last FD Review', value: lastFieldDirectorReviewDisplay(plan) },
    ],
  });

  slides.push({
    type: 'cards',
    key: 'home',
    title: 'Medical Strategy',
    label: 'Strategy',
    summaryTitle: '',
    cardsTitle: '',
    summaryCards: buildCurrentKpiCards(header, account, plan),
    cards: homeCards,
  });

  const barriersDrivers = data?.barriersDrivers || {};
  const activities = data?.criticalActivities?.activities || barriersDrivers.activities || [];

  // Each Barrier / Opportunity carries its own Medical Tactics instead of a
  // count, and the whole group is paginated as one indivisible block.
  // Opportunities follow Barriers.
  const barrierGroupLayout = { areaHeight: options.barrierGroupAreaHeight };
  const barrierGroups = buildBarrierTacticGroups(barriersDrivers.barriers, activities);
  const opportunityGroups = buildBarrierTacticGroups(barriersDrivers.drivers, activities);
  addBarrierGroupSlides(slides, {
    key: 'barriers',
    title: 'Barriers',
    label: 'Barriers & Medical Tactics',
    groups: barrierGroups,
  }, barrierGroupLayout);
  addBarrierGroupSlides(slides, {
    key: 'drivers',
    title: 'Opportunities',
    label: 'Opportunities & Medical Tactics',
    groups: opportunityGroups,
  }, barrierGroupLayout);

  // Medical Account Profile: one section per exported tab. The two Commercial
  // tabs (MM Comm Profile / DLBCL Comm Profile) are reference-only in the app
  // and are deliberately not exported.
  //
  // Each ATC Medical Profile tab reads its own field group off the Ecosystem
  // Plan, so the slide source is taken from the tab's `sourceKey`.
  ATC_MEDICAL_PROFILE_TABS.forEach(({ key, title, prefix, sourceKey }) => {
    addTableSlides(slides, {
      key,
      title,
      label: 'Medical Account Profile',
      headers: ['Field', 'Value'],
      rows: medicalProfileRows(accountProfile[sourceKey], prefix),
      colWidths: [3.4, 8.95],
      colLimits: [60, 600],
    }, maxRowsPerSlide);
  });

  // Referral Mapping only, with its own columns. The Other Healthcare Networks
  // table lives on the same tab but is a separate table and is not exported.
  const referralRows = (accountProfile.referralAccounts || []).map((row) => [
    toText(row.name, 'Untitled'),
    toText(row.hcoClassification, 'Not entered'),
    toText(row.indication),
  ]);
  addTableSlides(slides, {
    key: 'referral-dynamics',
    title: 'Referral Mapping',
    label: 'Medical Account Profile',
    headers: ['Site Name', 'HCO Classification', 'Indication'],
    rows: referralRows,
    colWidths: [5.2, 4.15, 3.0],
    colLimits: [120, 60, 24],
  }, maxRowsPerSlide);

  const stakeholderRows = (data?.stakeholders?.stakeholders || []).map((row) => [
    toText(row.name, 'Untitled'),
    toText(row.stakeholderId),
    toText(row.role),
    toText(row.primaryParent),
  ]);
  addTableSlides(slides, {
    key: 'stakeholders',
    title: 'Stakeholders',
    label: 'Stakeholder Map',
    headers: ['Name', 'Stakeholder ID', 'Role', 'Primary Parent'],
    rows: stakeholderRows,
    colWidths: [2.8, 2.0, 2.2, 2.5],
  }, maxRowsPerSlide);

  const teamMemberRows = (data?.teamMembers?.teamMembers || []).map((row) => [
    toText(row.name, 'Unnamed team member'),
    toText(row.role || row.functionName),
    teamMemberStatus(row),
    toText(row.participation || (activeStatusFlag(row.isPrimary) === true ? 'Core' : 'Extended')),
  ]);
  addTableSlides(slides, {
    key: 'team-members',
    title: 'Team Members',
    label: 'Account POD',
    headers: ['Name', 'Role', 'Status', 'Participation'],
    rows: teamMemberRows,
    colWidths: [2.7, 3.0, 1.1, 1.5],
  }, maxRowsPerSlide);

  return slides;
};

export const buildAccountPlanExportTitle = (data) => {
  const home = data?.home || {};
  const accountProfile = data?.accountProfile || {};
  const accountName =
    home.plan?.name ||
    home.account?.name ||
    accountProfile.account?.name ||
    home.plan?.accountName ||
    accountProfile.plan?.accountName ||
    'Account Plan';
  const title = String(accountName).trim();
  return /\bAccount\s+Plan$/i.test(title) ? title : `${title} Account Plan`;
};
