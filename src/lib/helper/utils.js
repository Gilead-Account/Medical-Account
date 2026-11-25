// Small, generic helpers ported from the legacy AngularJS controller.
// Anything Veeva-specific goes in dataservice/.

export const safeLower = (v) =>
  v === null || v === undefined ? '' : String(v).toLowerCase();

export const hasValue = (v) => v !== null && v !== undefined && v !== '';

export const countNoun = (count, singular, plural = `${singular}s`) =>
  Number(count) > 1 ? plural : singular;

export const formatCountLabel = (count, singular, plural = `${singular}s`) => {
  const normalizedCount = Number(count) || 0;
  return `${normalizedCount} ${countNoun(normalizedCount, singular, plural)}`;
};

export const normalizeCrmBoolean = (value) => {
  if (value === true || value === 1) return true;
  if (value === false || value === 0) return false;
  const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (['true', 'yes', '1'].includes(normalized)) return true;
  if (['false', 'no', '0'].includes(normalized)) return false;
  return value;
};

export const booleanDisplay = (value) => {
  const normalized = normalizeCrmBoolean(value);
  if (normalized === true) return 'Yes';
  if (normalized === false) return 'No';
  return hasValue(normalized) ? normalized : 'Not entered';
};

const SALESFORCE_ID_PATTERN = /^[a-zA-Z0-9]{15}(?:[a-zA-Z0-9]{3})?$/;

const recordIdMatchKeys = (value) => {
  const text = String(value || '').trim();
  if (!text) return [];
  if (SALESFORCE_ID_PATTERN.test(text)) {
    return Array.from(new Set([text, text.slice(0, 15)]));
  }
  return [text];
};

const addRecordIdMatchKeys = (set, value) => {
  recordIdMatchKeys(value).forEach((key) => set.add(key));
};

const recordIdSetHas = (set, value) =>
  recordIdMatchKeys(value).some((key) => set.has(key));

export const recordIdMatches = (left, right) => {
  if (!left || !right) return false;
  const rightKeys = new Set(recordIdMatchKeys(right));
  return recordIdMatchKeys(left).some((key) => rightKeys.has(key));
};

const parseDate = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const twoDigitDatePart = (value) => String(value).padStart(2, '0');

export const formatDateLabel = (value, fallback = 'Not available') => {
  const d = parseDate(value);
  if (!d) return value ? String(value) : fallback;
  return `${twoDigitDatePart(d.getMonth() + 1)}/${twoDigitDatePart(d.getDate())}/${d.getFullYear()}`;
};

export const formatDate = formatDateLabel;

export const daysFromNow = (value) => {
  const d = parseDate(value);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - today.getTime()) / 86400000);
};

export const truncateDisplay = (value, limit = 55) => {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return 'Untitled';
  if (text.length <= limit) return text;
  return text.slice(0, Math.max(0, limit - 3)) + '...';
};

export const truncate = truncateDisplay;

export const firstInitial = (value) => String(value || 'A').trim().charAt(0) || 'A';

export const impactTone = (impact) => {
  const key = safeLower(impact);
  if (key === 'high' || key === 'p1') return 'negative';
  if (key === 'medium' || key === 'p2') return 'caution';
  return 'positive';
};

// workspace-service.statusTone — pill modifier for activity / plan status.
export const statusTone = (status) => {
  const key = safeLower(status);
  if (
    key === 'moved forward' ||
    key === 'complete' ||
    key === 'open' ||
    key === 'active' ||
    key === 'identified - not started' ||
    key === 'near outcome'
  ) return 'positive';
  if (key === 'closed' || key === 'archived') return 'neutral';
  if (key === 'in progress') return 'caution';
  if (key === 'setback') return 'negative';
  return 'caution';
};

export const activityStatusLabel = (activity) => {
  const status = activity && activity.status ? activity.status : 'Planned';
  return status === 'Complete' ? 'Completed' : status;
};

const activityStatusKey = (a) => safeLower(a && a.status ? a.status : 'Planned');

export const activityIsOpen = (a) => {
  const status = activityStatusKey(a);
  return a && a.isArchived !== true && a.isDeactivated !== true && status !== 'complete' && status !== 'archived';
};

export const activityDueTone = (activity) => {
  const days = daysFromNow(activity && activity.dueDate);
  return days !== null && days < 0 ? 'is-overdue' : 'is-standard';
};

export const activityDueLabel = (activity) =>
  formatDateLabel(activity && activity.dueDate, 'No date').replace(',', '');

export const activityDueDetail = (activity) => {
  const days = daysFromNow(activity && activity.dueDate);
  if (days === null) return 'No due date';
  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return 'Due today';
  return `Due in ${days} days`;
};

export const activityParentName = (activity) => {
  if (!activity) return 'Plan-level';
  if (activity.parentName) return activity.parentName;
  if (activity.indication) return activity.indication;
  return 'Plan-level';
};

export const isHomeActivityWindow = (activity) => {
  if (!activityIsOpen(activity) || !activity.dueDate) return false;
  const due = parseDate(activity.dueDate);
  if (!due) return false;
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() + 30);
  due.setHours(0, 0, 0, 0);
  return due.getTime() <= cutoff.getTime();
};

export const homeUrgentActivities = (activities) =>
  (activities || [])
    .filter(isHomeActivityWindow)
    .map((activity, index) => ({ activity, index }))
    .sort((left, right) => {
      const leftDays = daysFromNow(left.activity.dueDate);
      const rightDays = daysFromNow(right.activity.dueDate);
      const result =
        (leftDays === null ? Number.POSITIVE_INFINITY : leftDays) -
        (rightDays === null ? Number.POSITIVE_INFINITY : rightDays);
      return result || left.index - right.index;
    })
    .map(({ activity }) => activity);

const recordIsOpen = (r) => r && safeLower(r.status || 'Open') !== 'closed' && r.isArchived !== true;

const recordClosedWithinDays = (r, daysBack) => {
  if (!r || recordIsOpen(r)) return false;
  const closedAt = parseDate(r.lastModifiedDate);
  if (!closedAt) return false;
  const cutoff = new Date();
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - daysBack);
  return closedAt.getTime() >= cutoff.getTime();
};

// controller.js displayValue — true/false → Yes/No, blanks → fallback.
export const displayValue = (value, fallback = 'Not entered') => {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  return value === null || value === undefined || value === '' ? fallback : value;
};

// controller.js stakeholderRoleOptions — distinct non-empty roles, 'All' first.
export const stakeholderRoleOptions = (stakeholders) => {
  const seen = new Set();
  const out = ['All'];
  for (const s of stakeholders || []) {
    if (!s || !s.role || seen.has(s.role)) continue;
    seen.add(s.role);
    out.push(s.role);
  }
  return out;
};

export const stakeholderMatchesFilters = (stakeholder, filters) => {
  const f = filters || {};
  return !f.role || f.role === 'All' || stakeholder.role === f.role;
};

// controller.js teamMemberPhone — column heading is "Participation" but the
// value can be the raw participation string, an Active/Inactive flag, or blank.
export const teamMemberPhone = (member) => {
  if (!member) return 'Not entered';
  if (member.participation) return member.participation;
  return member.isPrimary ? 'Active' : 'Inactive';
};

// Open vs closed Medical Tactic counts shown in the Barriers/Drivers summary
// pill on Home. Completed tactics remain visible regardless of completion date.
const ACTIVITY_OPEN_STATUSES = new Set(['open', 'planned', 'in progress']);
const ACTIVITY_CLOSED_STATUSES = new Set(['complete', 'completed', 'closed']);

export const criticalActivityCounts = (activities) => {
  let open = 0;
  let closed = 0;
  for (const a of activities || []) {
    if (!a || a.isDeactivated === true) continue;
    const key = safeLower(a.status);
    if (ACTIVITY_OPEN_STATUSES.has(key)) open += 1;
    else if (ACTIVITY_CLOSED_STATUSES.has(key)) closed += 1;
  }
  return { open, closed };
};

export const homeSummaryTables = (barriers, drivers, activities) => {
  const buildTable = (type, label, tone) => {
    const allRows = (type === 'Driver' ? drivers : barriers) || [];
    const openRows = allRows.filter(recordIsOpen);
    const closedLast90 = allRows.filter((row) => recordClosedWithinDays(row, 90)).length;
    const rowIds = new Set();
    allRows.forEach((row) => addRecordIdMatchKeys(rowIds, row && row.id));
    const counts = criticalActivityCounts(
      (activities || []).filter((activity) => activity && recordIdSetHas(rowIds, activity.barrierDriverId))
    );
    return {
      type,
      label,
      title: type === 'Driver' ? 'Opportunities' : 'Barriers',
      tone,
      tab: type === 'Driver' ? 'drivers' : 'barriers',
      openCount: openRows.length,
      closedLast90,
      // Pill text reflects critical-activity totals for this record type only.
      countSummary: `Medical Tactics: ${counts.open} open | ${counts.closed} completed`,
      activityWindow: '',
      // Show every open record; the Home summary list scrolls (see
      // .home-summary-rows) once it grows past ~5 rows.
      rows: openRows,
    };
  };
  return [
    buildTable('Barrier', 'Barriers', 'barrier'),
    buildTable('Driver', 'Opportunities', 'driver'),
  ];
};
