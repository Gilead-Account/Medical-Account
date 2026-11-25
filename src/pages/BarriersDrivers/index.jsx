import { medicalPicklistLabel } from '@/lib/dataservice/accountPlan/titlePicklistMappings';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  activityStatusLabel,
  formatCountLabel,
  formatDateLabel,
  recordIdMatches,
  statusTone,
  truncateDisplay,
} from '@/lib/helper/utils';
import {
  addBarrierDriver,
  addCriticalActivity,
  deleteCriticalActivity,
  normalizeBarrierDriverStatusForDisplay,
  saveBarrierDriver,
  saveBarrierDriverStatus,
  saveCriticalActivity,
} from '@/lib/dataservice/accountPlan/barriersDrivers';
import { optionsForControllerValue } from '@/lib/dataservice/accountPlan/dependentPicklists';
import { formatCriticalActivitySaveError } from '@/lib/dataservice/accountPlan/errorMessages';
import {
  medicalRecordTypeFilterLabel,
  medicalRecordTypeLabel,
  medicalRecordTypeLabelLower,
} from '@/lib/medicalTerminology';
import {
  BARRIER_DRIVER_RECORD_TYPE_IDS,
  BARRIER_DRIVER_STATUS_ORDER,
  barrierDriverStatusRank,
  barrierDriverUsesStrategy,
  buildOpenActivityCountByBarrier,
  categoryPrefix,
  createdRecordIdFromWriteResult,
  filterBarrierDriverIndicationsForType,
  isClosedBarrierDriverStatus,
  isOpenBarrierDriverStatus,
} from '@/lib/dataservice/accountPlan/shared';
import BarrierDriverEditModal from '@/pages/BarriersDrivers/BarrierDriverEditModal';
import CriticalActivityEditModal from '@/pages/CriticalActivities/CriticalActivityEditModal';
import CriticalActivityNewModal from '@/pages/CriticalActivities/CriticalActivityNewModal';
import { criticalActivityClosedParentEditReason } from '@/pages/CriticalActivities/linkedBarrierDriverOptions';
import {
  buildLinkedBarrierDriverStatusPrompt,
  linkedBarrierDriverCloseBlockedMessage,
  LinkedBarrierDriverStatusConfirmModal,
  LinkedBarrierDriverStatusPromptModal,
  mergeBarrierDriverStatusOptions,
} from '@/pages/CriticalActivities/LinkedBarrierDriverStatusPrompt';
import '@/styles/edit-modal.css';
import '@/pages/BarriersDrivers/BarriersDrivers.css';

const TABS = [
  { key: 'barriers', label: 'Barriers' },
  { key: 'drivers', label: 'Opportunities' },
];

const DEFAULT_FILTERS = {
  type: 'All',
  indication: 'All',
  strategy: 'All',
  status: 'Active',
  accountable: 'All',
  driverTitle: 'All',
  barrierTitle: 'All',
};

const OPEN_STATUSES = new Set(['Open', 'Planned', 'In Progress']);
const COMPLETED_STATUSES = new Set(['Complete', 'Completed', 'Closed']);
const TITLE_DISPLAY_LIMIT = 55;

const recordValue = (value) =>
  value && typeof value === 'object' && 'value' in value ? value.value : value;

const createdRecordId = (result) =>
  createdRecordIdFromWriteResult(result) || `new-${Date.now()}`;

const todayIsoDate = () => new Date().toISOString().slice(0, 10);

const storedStatusFromForm = (status) => (status === 'Completed' ? 'Complete' : status || 'Planned');
const isDeactivateChecked = (value) =>
  value === true || ['true', 'yes', '1'].includes(String(value || '').trim().toLowerCase());

const normalizedBarrierDriverType = (type) => (type === 'Driver' ? 'Driver' : 'Barrier');

const barrierDriverTypeLabel = (type) => medicalRecordTypeLabelLower(normalizedBarrierDriverType(type));

const closeBlockedByActivitiesMessage = (type, openActivityCount) => {
  const label = barrierDriverTypeLabel(type);
  const activityLabel = openActivityCount === 1 ? 'medical tactic' : 'medical tactics';
  const activityAction = openActivityCount === 1 ? 'it' : 'them';
  return `This ${label} has ${openActivityCount} open ${activityLabel}. Close ${activityAction} before closing the ${label}.`;
};

const isOpenBarrierDriverRecord = (record) =>
  isOpenBarrierDriverStatus(record?.status);

const barrierDriverStatusTone = (status) =>
  isClosedBarrierDriverStatus(status) ? 'neutral' : 'positive';

const recordMatchesStatus = (record, statusFilter) => {
  if (statusFilter === 'All') return true;
  const status = normalizeBarrierDriverStatusForDisplay(record.status);
  if (statusFilter === 'Active') return isOpenBarrierDriverStatus(status);
  return status === normalizeBarrierDriverStatusForDisplay(statusFilter);
};

const sortRecordsByLifecycleStatus = (records, statusFilter) => {
  if (statusFilter !== 'All') return records;
  return (records || [])
    .map((record, index) => ({ record, index }))
    .sort((left, right) => (
      barrierDriverStatusRank(left.record.status) - barrierDriverStatusRank(right.record.status) ||
      left.index - right.index
    ))
    .map(({ record }) => record);
};

const recordMatchesIndication = (record, indication) =>
  indication === 'All' || (record.indication || '') === indication;

const recordMatchesStrategy = (record, strategy) =>
  strategy === 'All' || (record.strategy || '') === strategy;

const recordMatchesType = (record, typeFilter) => {
  if (typeFilter === 'All') return true;
  if (typeFilter === 'Barriers') return record.type === 'Barrier';
  if (typeFilter === 'Drivers') return record.type === 'Driver';
  return true;
};

const recordActivitySummary = (record, openCountMap) => {
  const count = (openCountMap && openCountMap[record.id]) || 0;
  if (!count) return 'No open medical tactics';
  return `${count} open medical ${count === 1 ? 'tactic' : 'tactics'}`;
};

const COLUMNS = [
  { key: 'name', label: 'Medical Tactic' },
  { key: 'related', label: 'Linked Barrier/Opportunity' },
  { key: 'indication', label: 'Indication' },
  { key: 'status', label: 'Status' },
  { key: 'createdBy', label: 'Created By' },
  { key: 'accountable', label: 'Accountable' },
  { key: 'dueDate', label: 'Due Date' },
  { key: 'lastModified', label: 'Last Modified Date' },
];

const parseSortDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
};

const sortValue = (a, key) => {
  switch (key) {
    case 'name':
      return a.name || 'Untitled';
    case 'related':
      return a.parentName || 'Plan-level';
    case 'indication':
      return a.indication || '-';
    case 'status':
      return activityStatusLabel(a);
    case 'createdBy':
      return a.createdBy || 'Not entered';
    case 'accountable':
      return a.ownerLabel || 'Unassigned';
    case 'dueDate':
      return parseSortDate(a.dueDate);
    case 'lastModified':
      return a.lastModifiedDate || '';
    default:
      return '';
  }
};

const appendUniqueOptions = (out, values) => {
  const seen = new Set(out);
  for (const value of values || []) {
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
};

const fallbackStrategiesForIndication = (picklists, indication) => {
  const key = String(indication || '').trim().toUpperCase();
  if (key === 'MM') return picklists?.mmStrategies || [];
  if (key === 'PORTFOLIO') return picklists?.portfolioStrategies || [];
  return picklists?.dlbclStrategies || [];
};

const strategyOptionsForFilter = (picklists, tab, indicationFilter) => {
  const type = tab === 'drivers' ? 'Driver' : 'Barrier';
  const allowedIndications = filterBarrierDriverIndicationsForType(picklists?.barrierDriverIndications, type);
  const indicationSource = indicationFilter === 'All'
    ? allowedIndications
    : allowedIndications.filter((value) => value === indicationFilter);
  const out = ['All'];
  for (const indication of indicationSource) {
    if (!barrierDriverUsesStrategy(indication)) continue;
    appendUniqueOptions(
      out,
      optionsForControllerValue(picklists?.strategyOptionsByIndication, indication) ||
        fallbackStrategiesForIndication(picklists, indication)
    );
  }
  if (out.length === 1 && tab === 'drivers' && indicationFilter === 'All') {
    appendUniqueOptions(out, picklists?.barrierStrategies || []);
  }
  return out;
};

const compareSortValues = (left, right, direction) => {
  const leftEmpty = left === null || left === undefined || left === '';
  const rightEmpty = right === null || right === undefined || right === '';
  if (leftEmpty && rightEmpty) return 0;
  if (leftEmpty) return 1;
  if (rightEmpty) return -1;
  const result =
    typeof left === 'number' && typeof right === 'number'
      ? left - right
      : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
  return direction === 'desc' ? result * -1 : result;
};

const sortedActivities = (rows, sort) => {
  if (!sort || !sort.key) return rows || [];
  return (rows || [])
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const result = compareSortValues(sortValue(a.row, sort.key), sortValue(b.row, sort.key), sort.direction);
      return result || a.index - b.index;
    })
    .map(({ row }) => row);
};

const applyActivityForm = (activity, form, barrierLookup, saveResult, picklists = {}) => {
  const status = storedStatusFromForm(form.status);
  const isComplete = COMPLETED_STATUSES.has(status);
  const parent = form.parentId ? barrierLookup.get(form.parentId) : null;
  const hasDeactivateField = Object.prototype.hasOwnProperty.call(form, 'deactivate');
  const hasCommentsField = Object.prototype.hasOwnProperty.call(form, 'comments');
  const savedComments = false;
  const savedDeactivate = activity.canDeactivate !== false;
  return {
    ...activity,
    nameValue: form.title || '',
    name: medicalPicklistLabel(form.title, picklists.medicalTacticTitleLabels),
    details: String(form.details || '').trim(),
    indication: form.indication || '',
    status,
    ownerLabel: form.accountable || '',
    comments: savedComments && hasCommentsField
      ? (form.comments || '')
      : (activity.comments || ''),
    dueDate: form.dueDate || null,
    completedDate: isComplete ? (form.completedDate || activity.completedDate || todayIsoDate()) : null,
    isDeactivated: savedDeactivate && hasDeactivateField
      ? isDeactivateChecked(form.deactivate)
      : activity.isDeactivated === true,
    canEditComments: savedComments,
    canDeactivate: savedDeactivate,
    barrierDriverId: form.parentId || null,
    parentName: parent ? parent.name : (form.parentId ? 'Linked record unavailable' : 'Plan-level'),
    parentType: parent ? parent.type : (form.parentType || null),
    parentRecordTypeId: parent ? (parent.recordTypeId || null) : (form.parentRecordTypeId || null),
    lastModifiedDate: new Date().toISOString(),
  };
};

const applyActivityDeactivate = (activity, saveResult) => {
  const savedDeactivate = activity.canDeactivate !== false;
  return {
    ...activity,
    isDeactivated: savedDeactivate ? true : activity.isDeactivated === true,
    canDeactivate: savedDeactivate,
    lastModifiedDate: new Date().toISOString(),
  };
};

const strategyLabelForValue = (picklists, value, fallback = null) => {
  const labels = picklists?.strategyLabels;
  return medicalPicklistLabel(value, labels) || fallback || null;
};

const strategyPillValue = (record) =>
  record?.strategyLabel || record?.strategy || 'Strategy not entered';

const categoryLabelForValue = (picklists, value, fallback = null) => {
  const labels = picklists?.categoryLabels;
  if (!value || !labels || typeof labels !== 'object') return fallback || categoryPrefix(value) || value || null;
  return Object.prototype.hasOwnProperty.call(labels, value)
    ? (labels[value] || value)
    : (fallback || categoryPrefix(value) || value);
};

const applyBarrierDriverForm = (record, form, picklists = {}) => {
  const strategy = barrierDriverUsesStrategy(form.indication) ? (form.strategy || null) : null;
  const previousLabel = record.strategy === strategy ? record.strategyLabel : null;
  const previousCategoryLabel = record.categoryValue === form.category ? record.category : null;
  return {
    ...record,
    type: form.type,
    nameValue: form.name || '',
    name: medicalPicklistLabel(form.name, form.type === 'Driver' ? picklists.driverTitleLabels : picklists.barrierTitleLabels),
    status: normalizeBarrierDriverStatusForDisplay(form.status),
    indication: form.indication,
    strategy,
    strategyLabel: strategy ? strategyLabelForValue(picklists, strategy, previousLabel) : null,
    strategyRank: barrierDriverUsesStrategy(form.indication) ? (form.strategyRank || null) : null,
    category: categoryLabelForValue(picklists, form.category, previousCategoryLabel),
    categoryValue: form.category || null,
    businessImpact: form.businessImpact || null,
    comments: form.comments || '',
    lastModifiedDate: new Date().toISOString(),
  };
};

function ExpandIcon({ expanded }) {
  return (
    <svg className="bd-expand-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M5 12h14" />
      {!expanded && <path d="M12 5v14" />}
    </svg>
  );
}

function EditPencilIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function EditIconButton({ ariaLabel, onClick, disabled = false }) {
  return (
    <button
      type="button"
      className="stakeholder-edit-button"
      onClick={onClick}
      aria-label={ariaLabel}
      title="Edit"
      disabled={disabled}
    >
      <EditPencilIcon />
    </button>
  );
}

function HierarchyRow({ record, openCountMap, isExpanded, activities, picklists, onToggle, onEdit, onAddActivity, onEditActivity, isReadOnly = false }) {
  const recordClosed = isClosedBarrierDriverStatus(record.status);
  const recordLocked = record.legacyEditState === 'legacy';
  return (
    <article className={`bd-tree-row ${record.type === 'Driver' ? 'is-driver' : ''} ${isExpanded ? 'is-expanded' : ''}`}>
      <div className="bd-tree-main">
        <button
          type="button"
          className="bd-expand-button"
          onClick={onToggle}
          aria-expanded={isExpanded}
        >
          <ExpandIcon expanded={isExpanded} />
        </button>
        <div className="bd-tree-copy">
          <div className="bd-tree-title-line">
            <span
              className={`bd-type-pill ${record.type === 'Driver' ? 'driver' : 'barrier'}`}
              title={strategyPillValue(record)}
            >
              {strategyPillValue(record)}
            </span>
            <h4 title={record.name || ''}>{truncateDisplay(record.name || 'Untitled', TITLE_DISPLAY_LIMIT)}</h4>
          </div>
          <p className="bd-record-description">{record.comments || 'No comment'}</p>
          <div className="bd-chip-row">
            <span className="chip chip-blue">{record.indication || '-'}</span>
            <span className={`chip ${barrierDriverStatusTone(record.status)}`}>{record.status || BARRIER_DRIVER_STATUS_ORDER[0]}</span>
            <span className="chip chip-blue bd-activity-summary-pill">
              {recordActivitySummary(record, openCountMap)}
            </span>
          </div>
        </div>
        {!recordLocked && (
          <EditIconButton
            ariaLabel={`Edit ${record.name || 'barrier or opportunity'}`}
            onClick={() => onEdit(record)}
            disabled={isReadOnly}
          />
        )}
      </div>

      {isExpanded && (
        <div className="bd-activity-branch">
          <div className="bd-activity-branch-head">
            <strong>Medical Tactics</strong>
            <span>{activities.length} total</span>
          </div>
          {activities.map((activity) => (
            <article key={activity.id} className="bd-activity-card">
              <div>
                <h4 title={activity.name || ''}>{truncateDisplay(activity.name || 'Untitled', TITLE_DISPLAY_LIMIT)}</h4>
                {activity.details && (
                  <p className="bd-activity-description bd-critical-activity-details">
                    <span>Details</span> {activity.details}
                  </p>
                )}
                <div className="bd-chip-row">
                  <span className="chip">
                    {truncateDisplay(activity.parentName || record.name || 'Plan-level', TITLE_DISPLAY_LIMIT)}
                  </span>
                  <span className={`chip ${statusTone(activity.status)}`}>
                    {activityStatusLabel(activity)}
                  </span>
                  <span className="chip">Created By {activity.createdBy || 'Not entered'}</span>
                  <span className="chip">Accountable {activity.ownerLabel || 'Unassigned'}</span>
                  <span className="chip">
                    Due Date {activity.dueDate ? formatDateLabel(activity.dueDate, 'Not entered') : 'Not entered'}
                  </span>
                  <span className="chip">
                    Last Modified Date {formatDateLabel(activity.lastModifiedDate, 'Not entered')}
                  </span>
                </div>
              </div>
              {activity.legacyEditState !== 'legacy' && (
                <EditIconButton
                  ariaLabel={`Edit ${activity.name || 'medical tactic'}`}
                  onClick={() => onEditActivity(activity)}
                  disabled={isReadOnly}
                />
              )}
            </article>
          ))}
          <button
            type="button"
            className="button primary-red"
            onClick={() => onAddActivity(record)}
            disabled={isReadOnly || recordClosed || recordLocked}
          >
            Add Medical Tactic
          </button>
          {activities.length === 0 && (
            <div className="empty-state small">No medical tactics linked.</div>
          )}
        </div>
      )}
    </article>
  );
}

function RecordCard({
  record,
  isExpanded,
  activities,
  openCountMap,
  onToggle,
  onEdit,
  onAddActivity,
  onEditActivity,
  isReadOnly = false,
  tacticLabel = 'Medical Tactics',
}) {
  const recordClosed = isClosedBarrierDriverStatus(record.status);
  const recordLocked = record.legacyEditState === 'legacy';
  return (
    <article className={`bd-tree-row ${record.type === 'Driver' ? 'is-driver' : ''} ${isExpanded ? 'is-expanded' : ''}`}>
      <div
        className="bd-tree-main"
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <button
          type="button"
          className="bd-expand-button"
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} medical tactics for ${record.name || 'record'}`}
        >
          <ExpandIcon expanded={isExpanded} />
        </button>
        <div className="bd-tree-copy">
          <div className="bd-tree-title-line">
            <span
              className={`bd-type-pill ${record.type === 'Driver' ? 'driver' : 'barrier'}`}
              title={strategyPillValue(record)}
            >
              {strategyPillValue(record)}
            </span>
            <h4 title={record.name || ''}>{truncateDisplay(record.name || 'Untitled', TITLE_DISPLAY_LIMIT)}</h4>
          </div>
          <p className="bd-record-description">{record.comments || 'No comment'}</p>
          <div className="bd-chip-row bd-record-chip-row">
            <span className="chip chip-blue">{record.indication || 'Not entered'}</span>
            <span className={`chip ${barrierDriverStatusTone(record.status)}`}>{record.status || BARRIER_DRIVER_STATUS_ORDER[0]}</span>
            <span className="chip chip-blue bd-activity-summary-pill">
              {recordActivitySummary(record, openCountMap)}
            </span>
          </div>
        </div>
        {!recordLocked && (
          <EditIconButton
            ariaLabel={`Edit ${record.name || 'barrier or opportunity'}`}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(record);
            }}
            disabled={isReadOnly}
          />
        )}
      </div>

      {isExpanded && (
        <div className={`bd-activity-branch bd-card-activity-branch ${activities.length ? '' : 'is-empty'}`}>
          <div className="bd-activity-branch-head">
            <strong>{tacticLabel}</strong>
            <span className="bd-activity-total-pill">{activities.length} total</span>
          </div>
          {activities.map((activity) => (
            <article key={activity.id} className="bd-activity-card bd-critical-activity-card is-pill-layout">
              <div className="bd-critical-activity-copy">
                <div className="bd-critical-activity-head">
                  <h4 title={activity.name || ''}>{truncateDisplay(activity.name || 'Untitled', TITLE_DISPLAY_LIMIT)}</h4>
                  <span className={`bd-activity-status-badge ${statusTone(activity.status)}`}>
                    {activityStatusLabel(activity)}
                  </span>
                </div>
                {activity.details && (
                  <p className="bd-activity-description bd-critical-activity-details">
                    <span>Details</span> {activity.details}
                  </p>
                )}
                <div className="bd-critical-activity-pill-row">
                  <span className="bd-critical-pill">
                    <strong>Created By</strong> <em>{activity.createdBy || 'Not entered'}</em>
                  </span>
                  <span className="bd-critical-pill">
                    <strong>Accountable</strong> <em>{activity.ownerLabel || 'Unassigned'}</em>
                  </span>
                  <span className="bd-critical-pill">
                    <strong>Due Date</strong>{' '}
                    <em>{activity.dueDate ? formatDateLabel(activity.dueDate, 'Not entered') : 'Not entered'}</em>
                  </span>
                  <span className="bd-critical-pill">
                    <strong>Last Modified Date</strong>{' '}
                    <em>{formatDateLabel(activity.lastModifiedDate, 'Not entered')}</em>
                  </span>
                </div>
              </div>
              {activity.legacyEditState !== 'legacy' && (
                <EditIconButton
                  ariaLabel={`Edit ${activity.name || 'medical tactic'}`}
                  onClick={() => onEditActivity(activity)}
                  disabled={isReadOnly}
                />
              )}
            </article>
          ))}
          {activities.length > 0 && (
            <button
              type="button"
              className="button primary-red bd-card-activity-add-button"
              onClick={() => onAddActivity(record)}
              disabled={isReadOnly || recordClosed || recordLocked}
            >
              Add Medical Tactic
            </button>
          )}
          {activities.length === 0 && (
            <div className="bd-empty-activity-panel">
              <strong>No linked {tacticLabel.toLowerCase()}.</strong>
              <button
                type="button"
                className="button primary-red bd-card-activity-add-button"
                onClick={() => onAddActivity(record)}
                disabled={isReadOnly || recordClosed || recordLocked}
              >
                Add Medical Tactic
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function ActivitiesSection({ section, sort, onSort, onEdit, isReadOnly = false }) {
  const visible = useMemo(() => sortedActivities(section.rows || [], sort), [section.rows, sort]);
  return (
    <section className="critical-activity-table-section">
      <div className="critical-activity-table-title">
        <h4>{section.title}</h4>
      </div>
      <div className="bd-record-table activities-table">
        <div className="bd-record-head">
          {COLUMNS.map((col) => (
            <span key={col.key}>
              <button
                type="button"
                className="activity-sort-button"
                onClick={() => onSort(section.key, col.key)}
                aria-label={`Sort ${section.title} by ${col.label}`}
              >
                <strong className="activity-sort-label">{col.label}</strong>
                <i
                  className={`activity-sort-arrow ${sort && sort.key === col.key ? sort.direction : ''}`}
                  aria-hidden="true"
                />
              </button>
            </span>
          ))}
          <span className="activity-action-head" aria-hidden="true" />
        </div>
        {visible.map((a) => (
          <div key={a.id} className="bd-record-row-flat">
            <strong title={a.name || ''}>{truncateDisplay(a.name || 'Untitled', TITLE_DISPLAY_LIMIT)}</strong>
            <span title={a.parentName || ''}>{truncateDisplay(a.parentName || 'Plan-level', TITLE_DISPLAY_LIMIT)}</span>
            <span>{a.indication || '-'}</span>
            <span>
              <em className={`pill ${statusTone(a.status)}`}>{activityStatusLabel(a)}</em>
            </span>
            <span>{a.createdBy || 'Not entered'}</span>
            <span>{a.ownerLabel || 'Unassigned'}</span>
            <span>{formatDateLabel(a.dueDate, 'Not entered')}</span>
            <span>{formatDateLabel(a.lastModifiedDate, 'Not entered')}</span>
            <span className="stakeholder-row-actions activity-row-actions">
              {a.legacyEditState !== 'legacy' && (
                <EditIconButton
                  ariaLabel={`Edit ${a.name || 'medical tactic'}`}
                  onClick={() => onEdit(a)}
                  disabled={isReadOnly}
                />
              )}
            </span>
          </div>
        ))}
        {visible.length === 0 && (
          <div className="empty-state small">{section.emptyMessage}</div>
        )}
      </div>
    </section>
  );
}

export default function BarriersDrivers({ data, initialTab = 'barriers', onActivityChange, onNotify, isReadOnly = false }) {
  const planId = data.planId;
  const picklists = data.picklists || {};
  const [tab, setTab] = useState('barriers');
  const [barriers, setBarriers] = useState(() => data.barriers || []);
  const [drivers, setDrivers] = useState(() => data.drivers || []);
  const [activities, setActivities] = useState(() => data.activities || []);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [expandedRows, setExpandedRows] = useState({});
  const [planLevelExpanded, setPlanLevelExpanded] = useState(false);
  const [sorts, setSorts] = useState({});
  const [bdEditState, setBdEditState] = useState(null); // { record?, defaultType }
  const [activityEditState, setActivityEditState] = useState(null); // { activity, parentRecord? }
  const [activityCreateState, setActivityCreateState] = useState(null); // { parentRecord? }
  const [isSavingBd, setIsSavingBd] = useState(false);
  const [isSavingActivity, setIsSavingActivity] = useState(false);
  const [bdError, setBdError] = useState('');
  const [activityError, setActivityError] = useState('');
  const [pendingBarrierDriverStatusConfirm, setPendingBarrierDriverStatusConfirm] = useState(null);
  const [pendingBarrierDriverStatusPrompt, setPendingBarrierDriverStatusPrompt] = useState(null);
  const [barrierDriverStatusPromptValue, setBarrierDriverStatusPromptValue] = useState('');
  const [barrierDriverStatusPromptError, setBarrierDriverStatusPromptError] = useState('');
  const [isSavingBarrierDriverStatus, setIsSavingBarrierDriverStatus] = useState(false);

  useEffect(() => {
    setBarriers(data.barriers || []);
    setDrivers(data.drivers || []);
    setActivities(data.activities || []);
  }, [data]);

  useEffect(() => {
    if (!isReadOnly) return;
    setBdEditState(null);
    setActivityEditState(null);
    setActivityCreateState(null);
    setPendingBarrierDriverStatusConfirm(null);
    setPendingBarrierDriverStatusPrompt(null);
  }, [isReadOnly]);

  useEffect(() => {
    setPendingBarrierDriverStatusConfirm(null);
    setPendingBarrierDriverStatusPrompt(null);
    setBarrierDriverStatusPromptValue('');
    setBarrierDriverStatusPromptError('');
  }, [planId]);

  useEffect(() => {
    if (TABS.some((item) => item.key === initialTab)) {
      setTab(initialTab);
    }
  }, [initialTab]);

  const allRecords = useMemo(() => [...barriers, ...drivers], [barriers, drivers]);
  const recordById = useMemo(() => new Map(allRecords.map((r) => [r.id, r])), [allRecords]);
  const openRecordById = useMemo(
    () => new Map(allRecords.filter(isOpenBarrierDriverRecord).map((r) => [r.id, r])),
    [allRecords]
  );
  const closedParentEditReason = useCallback(
    (activity, parentRecord = null) =>
      criticalActivityClosedParentEditReason(
        activity,
        parentRecord || (activity?.barrierDriverId ? recordById.get(activity.barrierDriverId) : null)
      ),
    [recordById]
  );

  const openCountByBarrier = useMemo(() => {
    return buildOpenActivityCountByBarrier(activities);
  }, [activities]);

  const filteredRecords = useMemo(() => {
    const rows = allRecords.filter((r) =>
      recordMatchesType(r, filters.type) &&
      recordMatchesIndication(r, filters.indication) &&
      recordMatchesStrategy(r, filters.strategy) &&
      recordMatchesStatus(r, filters.status)
    );
    return sortRecordsByLifecycleStatus(rows, filters.status);
  }, [allRecords, filters]);

  const filteredBarriers = useMemo(
    () => sortRecordsByLifecycleStatus(
      barriers.filter((r) =>
        recordMatchesIndication(r, filters.indication) &&
        recordMatchesStrategy(r, filters.strategy) &&
        recordMatchesStatus(r, filters.status)
      ),
      filters.status
    ),
    [barriers, filters]
  );
  const filteredDrivers = useMemo(
    () => sortRecordsByLifecycleStatus(
      drivers.filter((r) =>
        recordMatchesIndication(r, filters.indication) &&
        recordMatchesStrategy(r, filters.strategy) &&
        recordMatchesStatus(r, filters.status)
      ),
      filters.status
    ),
    [drivers, filters]
  );
  const filteredEntryActivities = (record) =>
    activities
      .filter((a) => recordIdMatches(a.barrierDriverId, record.id) && a.isDeactivated !== true)
      .map((activity) => ({
        ...activity,
        editDisabledReason: closedParentEditReason(activity, record),
      }));
  const filteredPlanLevelActivities = useMemo(
    () => activities.filter((a) => !a.barrierDriverId && a.isDeactivated !== true),
    [activities]
  );

  const accountableOptionsForFilters = useMemo(() => {
    // Accountable comes strictly from the CRM picklist — not unioned with
    // values found on existing activity records.
    const seen = new Set();
    const out = ['All'];
    for (const v of picklists.accountableMembers || []) {
      if (!v || v === 'All' || seen.has(v)) continue;
      seen.add(v);
      out.push(v);
    }
    return out;
  }, [picklists.accountableMembers]);

  const driverTitleOptions = useMemo(() => {
    const seen = new Set();
    const out = ['All'];
    for (const d of drivers) {
      if (!d.name || seen.has(d.name)) continue;
      seen.add(d.name);
      out.push(d.name);
    }
    return out;
  }, [drivers]);

  const barrierTitleOptions = useMemo(() => {
    const seen = new Set();
    const out = ['All'];
    for (const b of barriers) {
      if (!b.name || seen.has(b.name)) continue;
      seen.add(b.name);
      out.push(b.name);
    }
    return out;
  }, [barriers]);

  const indicationOptions = useMemo(() => {
    const list = picklists.barrierDriverIndications || [];
    const type = tab === 'drivers' ? 'Driver' : 'Barrier';
    return ['All', ...filterBarrierDriverIndicationsForType(list, type)];
  }, [picklists, tab]);
  useEffect(() => {
    if (indicationOptions.includes(filters.indication)) return;
    setFilters((current) => ({ ...current, indication: 'All' }));
  }, [filters.indication, indicationOptions]);
  const strategyFilterOptions = useMemo(
    () => strategyOptionsForFilter(picklists, tab, filters.indication),
    [picklists, tab, filters.indication]
  );
  useEffect(() => {
    if (strategyFilterOptions.includes(filters.strategy)) return;
    setFilters((current) => ({ ...current, strategy: 'All' }));
  }, [filters.strategy, strategyFilterOptions]);
  const statusFilterOptions = useMemo(() => {
    const seen = new Set(BARRIER_DRIVER_STATUS_ORDER);
    const extras = (picklists.barrierStatuses || [])
      .map(normalizeBarrierDriverStatusForDisplay)
      .filter((status) => {
        if (!status || seen.has(status)) return false;
        seen.add(status);
        return true;
      });
    return [...BARRIER_DRIVER_STATUS_ORDER, ...extras];
  }, [picklists]);
  const activityIndicationOptions = useMemo(
    () => picklists.activityIndications || picklists.barrierDriverIndications || [],
    [picklists]
  );
  const barrierDriverStatusOptions = useMemo(
    () => mergeBarrierDriverStatusOptions(picklists.barrierStatuses),
    [picklists.barrierStatuses]
  );

  const visibleTabs = useMemo(() => {
    return TABS;
  }, []);

  const activeRecordTypeLabel = tab === 'drivers' ? 'Opportunities' : 'Barriers';
  const activeRecordSingularLabel = tab === 'drivers' ? 'Opportunity' : 'Barrier';
  const activeRecordInternalSingularLabel = tab === 'drivers' ? 'Driver' : 'Barrier';
  // Open-record limit removed — barriers/drivers can be added without a cap.
  const barrierLimitReached = false;
  const driverLimitReached = false;
  const barrierAddLimitMessage = undefined;
  const driverAddLimitMessage = undefined;
  const activeAddType = tab === 'drivers' ? 'Driver' : 'Barrier';
  const activeAddLimitReached = false;
  const activeAddLimitMessage = undefined;
  const activeRecordsForSummary = useMemo(() => {
    const rows = tab === 'drivers' ? drivers : barriers;
    return rows.filter((r) =>
      recordMatchesIndication(r, filters.indication) &&
      recordMatchesStrategy(r, filters.strategy)
    );
  }, [
    barriers,
    drivers,
    filters.indication,
    filters.strategy,
    tab,
  ]);

  const statusKpis = useMemo(() => {
    const open = activeRecordsForSummary.filter((r) => isOpenBarrierDriverStatus(r.status)).length;
    const closed = activeRecordsForSummary.filter((r) => isClosedBarrierDriverStatus(r.status)).length;
    return { open, closed };
  }, [activeRecordsForSummary]);

  const matchesActivityFilters = (activity) => {
    if (filters.accountable !== 'All' && (activity.ownerLabel || 'Unassigned') !== filters.accountable) return false;
    if (filters.indication !== 'All' && (activity.indication || '') !== filters.indication) return false;
    if (filters.driverTitle !== 'All') {
      const parent = activity.barrierDriverId ? recordById.get(activity.barrierDriverId) : null;
      if (!parent || parent.type !== 'Driver' || parent.name !== filters.driverTitle) return false;
    }
    if (filters.barrierTitle !== 'All') {
      const parent = activity.barrierDriverId ? recordById.get(activity.barrierDriverId) : null;
      if (!parent || parent.type !== 'Barrier' || parent.name !== filters.barrierTitle) return false;
    }
    return true;
  };

  const activitySections = useMemo(() => {
    const base = activities
      .filter((a) => a.isDeactivated !== true)
      .filter(matchesActivityFilters)
      .map((activity) => ({
        ...activity,
        editDisabledReason: closedParentEditReason(activity),
      }));
    return [
      {
        key: 'open',
        title: 'Open and Planned Medical Tactics',
        emptyMessage: 'No open or planned medical tactics match the current filters.',
        rows: base.filter((a) => OPEN_STATUSES.has(a.status)),
      },
      {
        key: 'completed',
        title: 'Completed Medical Tactics',
        emptyMessage: 'No completed medical tactics match the current filters.',
        rows: base.filter((a) => COMPLETED_STATUSES.has(a.status)),
      },
    ];
  }, [activities, filters, closedParentEditReason]);

  const toggleRow = (id) => setExpandedRows((s) => ({ ...s, [id]: !s[id] }));

  const handleSort = (sectionKey, columnKey) => {
    setSorts((current) => {
      const existing = current[sectionKey];
      const direction =
        existing && existing.key === columnKey && existing.direction === 'asc' ? 'desc' : 'asc';
      return { ...current, [sectionKey]: { key: columnKey, direction } };
    });
  };

  const openNewBarrierDriver = (defaultType) => {
    if (isReadOnly) return;
    const type = normalizedBarrierDriverType(defaultType);
    setBdError('');
    setBdEditState({ record: null, defaultType: type });
  };

  const openEditBarrierDriver = (record) => {
    if (isReadOnly || record?.legacyEditState === 'legacy') return;
    setBdError('');
    setBdEditState({ record, defaultType: record.type });
  };

  const closeBdModal = () => {
    if (isSavingBd) return;
    setBdEditState(null);
    setBdError('');
  };

  const openNewActivity = (parentRecord) => {
    if (isReadOnly || parentRecord?.legacyEditState === 'legacy') return;
    setActivityError('');
    setActivityEditState(null);
    setActivityCreateState({ parentRecord: parentRecord || null });
  };

  const openEditActivity = (activity) => {
    if (isReadOnly || activity?.legacyEditState === 'legacy') return;
    setActivityError('');
    setActivityCreateState(null);
    const parent = activity.barrierDriverId ? recordById.get(activity.barrierDriverId) : null;
    setActivityEditState({ activity, parentRecord: parent });
  };

  const closeActivityModal = () => {
    if (isSavingActivity) return;
    setActivityEditState(null);
    setActivityCreateState(null);
    setActivityError('');
  };

  const handleSaveBarrierDriver = async (form, linkedTacticForm = null) => {
    if (isReadOnly) return;
    const isCreate = !bdEditState.record?.id;
    const previousClosed = !isCreate && isClosedBarrierDriverStatus(bdEditState.record?.status);
    const type = normalizedBarrierDriverType(form.type);
    const openActivityCount = bdEditState.record?.id ? (openCountByBarrier[bdEditState.record.id] || 0) : 0;
    if (!isCreate && isClosedBarrierDriverStatus(form.status) && openActivityCount > 0) {
      setBdError(closeBlockedByActivitiesMessage(type, openActivityCount));
      return;
    }
    if (isCreate && !linkedTacticForm) {
      setBdError('Complete the New Linked Medical Tactic section before saving.');
      return;
    }

    setIsSavingBd(true);
    setBdError('');
    try {
      const formWithPlan = { ...form, accountPlanId: planId };
      if (previousClosed && !form.legacyUpdate) {
        await saveBarrierDriverStatus(bdEditState.record.id, form.status);
        const updated = {
          ...bdEditState.record,
          status: normalizeBarrierDriverStatusForDisplay(form.status),
        };
        if (updated.type === 'Driver') {
          setDrivers((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
        } else {
          setBarriers((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
        }
      } else if (!isCreate) {
        await saveBarrierDriver(bdEditState.record.id, {
          ...formWithPlan,
          previousIndication: bdEditState.record.indication || '',
        });
        const updated = applyBarrierDriverForm(bdEditState.record, formWithPlan, picklists);
        if (updated.type === 'Driver') {
          setDrivers((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
        } else {
          setBarriers((rows) => rows.map((r) => (r.id === updated.id ? updated : r)));
        }
        // The indication cascade (in updateBarrierDriver) re-stamps linked
        // critical activities; mirror that locally so the inline list doesn't
        // show a stale indication before the page reload.
        if ((formWithPlan.indication || '') !== (bdEditState.record.indication || '')) {
          setActivities((rows) =>
            rows.map((a) =>
              recordIdMatches(a.barrierDriverId, updated.id)
                ? { ...a, indication: formWithPlan.indication || '' }
                : a
            )
          );
        }
      } else {
        const result = await addBarrierDriver(planId, formWithPlan);
        const persistedRecordId = createdRecordIdFromWriteResult(result);
        if (!persistedRecordId) {
          throw new Error(
            `The ${barrierDriverTypeLabel(type)} was created, but CRM did not return its record ID. Refresh before creating the linked medical tactic.`
          );
        }
        const newRecord = applyBarrierDriverForm(
          {
            id: persistedRecordId,
            type,
            recordTypeId:
              recordValue(result?.savedFields?.RecordTypeId) ||
              BARRIER_DRIVER_RECORD_TYPE_IDS[type],
          },
          formWithPlan,
          picklists
        );
        const tacticPayload = {
          title: linkedTacticForm.title,
          details: linkedTacticForm.details,
          indication: formWithPlan.indication,
          status: linkedTacticForm.status,
          accountable: linkedTacticForm.accountable,
          dueDate: linkedTacticForm.dueDate,
          parentId: newRecord.id,
          parentType: newRecord.type,
          parentRecordTypeId: newRecord.recordTypeId,
        };
        let tacticResult;
        try {
          tacticResult = await addCriticalActivity(planId, tacticPayload);
        } catch (error) {
          const wrapped = new Error(
            `The ${barrierDriverTypeLabel(type)} was created, but the linked medical tactic could not be created.`
          );
          wrapped.cause = error;
          throw wrapped;
        }
        const lookupWithNewRecord = new Map(recordById);
        lookupWithNewRecord.set(newRecord.id, newRecord);
        const newActivity = applyActivityForm(
          {
            id: createdRecordId(tacticResult),
            planId,
            canEditComments: true,
            canDeactivate: true,
            isDeactivated: false,
          },
          tacticPayload,
          lookupWithNewRecord,
          tacticResult,
          picklists
        );
        if (newRecord.type === 'Driver') setDrivers((rows) => [newRecord, ...rows]);
        else setBarriers((rows) => [newRecord, ...rows]);
        setActivities((rows) => [newActivity, ...rows]);
        if (onActivityChange) onActivityChange(newActivity);
      }
      onNotify?.({
        title: `${activeRecordSingularLabel} saved.`,
        detail: isCreate
          ? 'The linked Medical Tactic was created at the same time.'
          : 'Your changes have been saved.',
        refreshPages: true,
      });
      setBdEditState(null);
    } catch (error) {
      setBdError(formatCriticalActivitySaveError(error));
    } finally {
      setIsSavingBd(false);
    }
  };

  const handleSaveActivity = async (form) => {
    if (isReadOnly) return;
    setIsSavingActivity(true);
    setActivityError('');
    try {
      const payload = {
        title: form.title,
        details: form.details,
        indication: form.indication,
        status: form.status,
        accountable: form.accountable,
        dueDate: form.dueDate,
        completedDate: form.completedDate,
        parentId: form.parentId,
        parentType: form.parentType,
        parentRecordTypeId: form.parentRecordTypeId,
      };
      if (Object.prototype.hasOwnProperty.call(form, 'comments')) payload.comments = form.comments;
      if (Object.prototype.hasOwnProperty.call(form, 'deactivate')) payload.deactivate = form.deactivate;
      if (activityEditState.activity?.id) {
        const parentChanged =
          (form.parentId || '') !== (activityEditState.activity.barrierDriverId || '') ||
          (form.parentType || '') !== (activityEditState.activity.parentType || '');
        const result = await saveCriticalActivity(activityEditState.activity.id, payload);
        const updated = applyActivityForm(activityEditState.activity, form, recordById, result, picklists);
        const nextActivities = activities.map((r) => (r.id === updated.id ? updated : r));
        setActivities(nextActivities);
        if (onActivityChange) onActivityChange(updated);
        const parent = updated.barrierDriverId ? recordById.get(updated.barrierDriverId) : null;
        const prompt = buildLinkedBarrierDriverStatusPrompt({
          activity: activityEditState.activity,
          updated,
          rows: nextActivities,
          parent,
          statusOptions: barrierDriverStatusOptions,
        });
        if (prompt) {
          setPendingBarrierDriverStatusConfirm(prompt);
          setPendingBarrierDriverStatusPrompt(null);
          setBarrierDriverStatusPromptValue('');
          setBarrierDriverStatusPromptError('');
        }
      }
      onNotify?.({
        title: 'Medical tactic saved.',
        detail: 'Your changes have been saved.',
        refreshPages: true,
      });
      setActivityEditState(null);
    } catch (error) {
      setActivityError(formatCriticalActivitySaveError(error));
    } finally {
      setIsSavingActivity(false);
    }
  };

  const handleDeleteActivity = async () => {
    if (isReadOnly) return;
    if (!activityEditState.activity?.id) return;
    setIsSavingActivity(true);
    setActivityError('');
    try {
      await deleteCriticalActivity(activityEditState.activity.id, activityEditState.activity);
      setActivities((rows) => rows.filter((r) => r.id !== activityEditState.activity.id));
      if (onActivityChange) {
        onActivityChange({ ...activityEditState.activity, isDeleted: true, isDeactivated: true });
      }
      onNotify?.({
        title: 'Medical tactic deleted.',
        detail: 'The medical tactic has been marked deleted.',
        refreshPages: true,
      });
      setActivityEditState(null);
    } catch (error) {
      setActivityError(error && error.message ? error.message : 'Unable to delete medical tactic.');
    } finally {
      setIsSavingActivity(false);
    }
  };

  const handleCreateActivity = async (form) => {
    if (isReadOnly) return;
    if (!form.parentId) {
      setActivityError('Linked Barrier/Opportunity is required.');
      return;
    }
    if (!form.indication) {
      setActivityError('Indication is required.');
      return;
    }
    if (!openRecordById.has(form.parentId)) {
      setActivityError('Select an open linked Barrier/Opportunity.');
      return;
    }
    setIsSavingActivity(true);
    setActivityError('');
    try {
      const payload = {
        title: form.title,
        details: form.details,
        indication: form.indication,
        status: form.status,
        accountable: form.accountable,
        dueDate: form.dueDate,
        parentId: form.parentId,
        parentType: form.parentType,
        parentRecordTypeId: form.parentRecordTypeId,
      };
      const result = await addCriticalActivity(planId, payload);
      const created = applyActivityForm(
        {
          id: createdRecordId(result),
          planId,
          canEditComments: true,
          canDeactivate: true,
          isDeactivated: false,
        },
        form,
        recordById,
        result,
        picklists
      );
      setActivities((rows) => [created, ...rows]);
      if (onActivityChange) onActivityChange(created);
      onNotify?.({
        title: 'Medical tactic saved.',
        detail: 'Your changes have been saved.',
        refreshPages: true,
      });
      setActivityCreateState(null);
    } catch (error) {
      setActivityError(formatCriticalActivitySaveError(error));
    } finally {
      setIsSavingActivity(false);
    }
  };

  const handleDismissBarrierDriverStatusPrompt = () => {
    if (isSavingBarrierDriverStatus) return;
    setPendingBarrierDriverStatusPrompt(null);
    setBarrierDriverStatusPromptValue('');
    setBarrierDriverStatusPromptError('');
  };

  const handleDismissBarrierDriverStatusConfirm = () => {
    setPendingBarrierDriverStatusConfirm(null);
    setBarrierDriverStatusPromptValue('');
    setBarrierDriverStatusPromptError('');
  };

  const handleOpenBarrierDriverStatusPrompt = () => {
    if (isReadOnly) return;
    const prompt = pendingBarrierDriverStatusConfirm;
    if (!prompt) return;
    setPendingBarrierDriverStatusConfirm(null);
    setPendingBarrierDriverStatusPrompt(prompt);
    setBarrierDriverStatusPromptValue(prompt.initialStatus);
    setBarrierDriverStatusPromptError('');
  };

  const handleBarrierDriverStatusPromptChange = (value) => {
    setBarrierDriverStatusPromptValue(value);
    setBarrierDriverStatusPromptError('');
  };

  const handleSaveBarrierDriverStatusPrompt = async () => {
    if (isReadOnly) return;
    const prompt = pendingBarrierDriverStatusPrompt;
    const status = normalizeBarrierDriverStatusForDisplay(barrierDriverStatusPromptValue);
    if (!prompt?.parentId || !status) return;
    if (prompt.remainingOpenActivityCount > 0 && isClosedBarrierDriverStatus(status)) {
      setBarrierDriverStatusPromptError(linkedBarrierDriverCloseBlockedMessage(prompt));
      return;
    }

    setIsSavingBarrierDriverStatus(true);
    setBarrierDriverStatusPromptError('');
    try {
      await saveBarrierDriverStatus(prompt.parentId, status);
      const applyStatus = (record) =>
        record.id === prompt.parentId
          ? { ...record, status, lastModifiedDate: new Date().toISOString() }
          : record;
      setBarriers((rows) => rows.map(applyStatus));
      setDrivers((rows) => rows.map(applyStatus));
      onNotify?.({
        title: `${prompt.parentType} status updated.`,
        detail: `${prompt.parentType} status updated to ${status}.`,
        refreshPages: true,
      });
      setPendingBarrierDriverStatusConfirm(null);
      setPendingBarrierDriverStatusPrompt(null);
      setBarrierDriverStatusPromptValue('');
    } catch (error) {
      setBarrierDriverStatusPromptError(
        error && error.message ? error.message : `Unable to update ${prompt.parentType} status.`
      );
    } finally {
      setIsSavingBarrierDriverStatus(false);
    }
  };

  const barrierDriverOptionsForActivity = useMemo(
    () =>
      allRecords.map((r) => ({
        id: r.id,
        type: r.type,
        name: r.name,
        indication: r.indication,
        status: r.status,
        recordTypeId: r.recordTypeId,
        legacyEditState: r.legacyEditState,
      })),
    [allRecords]
  );
  const openBarrierDriverOptionsForActivity = useMemo(
    () => barrierDriverOptionsForActivity.filter(isOpenBarrierDriverRecord),
    [barrierDriverOptionsForActivity]
  );

  const isActivities = tab === 'activities';

  return (
    <section className={`page page-barriers-drivers mock-bd-page ${isActivities ? 'is-critical-activities-page' : ''} is-${activeRecordInternalSingularLabel.toLowerCase()}-workspace`.trim()}>
      <article className="mock-control-panel bd-tabs-panel">
        <div className="bd-tabs-toolbar">
          <div className="bd-tab-row account-profile-tabs bd-workspace-tabs" role="tablist">
            {visibleTabs.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`bd-tab ${tab === t.key ? 'is-active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </article>

      <article className="mock-control-panel bd-command-panel">
        <div className="bd-command-body">
          <div className="mock-kpi-row bd-status-card-row" aria-label={`${activeRecordTypeLabel} status summary`}>
            <button
              type="button"
              className={`mock-kpi-card bd-status-card ${filters.status === 'Active' ? 'is-active' : ''}`}
              onClick={() => setFilters({ ...filters, status: 'Active' })}
              aria-pressed={filters.status === 'Active'}
            >
              <span>Active {activeRecordTypeLabel}</span>
              <strong>{statusKpis.open}</strong>
            </button>
            <button
              type="button"
              className={`mock-kpi-card bd-status-card ${filters.status === 'Closed' ? 'is-active' : ''}`}
              onClick={() => setFilters({ ...filters, status: 'Closed' })}
              aria-pressed={filters.status === 'Closed'}
            >
              <span>Closed {activeRecordTypeLabel}</span>
              <strong>{statusKpis.closed}</strong>
            </button>
          </div>

          {/* "Filter" label dropped — the picklists are self-explanatory.
              The status + indication picklists themselves stay. */}
          <div className="mock-filter-row bd-filter-strip">
          {!isActivities && (
            <div className="bd-filter-select-box">
              <label className="select-shell">
                <select
                  name="barrierDriverStatusFilter"
                  aria-label={`${activeRecordSingularLabel} status filter`}
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="All">Status (All)</option>
                  <option value="Active">Active {activeRecordTypeLabel}</option>
                  {statusFilterOptions.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              {tab === 'hierarchy' && (
                <label className="select-shell">
                  <select
                    name="barrierDriverTypeFilter"
                    aria-label="Barrier or opportunity type filter"
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  >
                    {(picklists.barrierTypeFilters || ['All', 'Barriers', 'Drivers']).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt === 'All' ? 'Type (All)' : medicalRecordTypeFilterLabel(opt)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="select-shell">
                <select
                  name="barrierDriverIndicationFilter"
                  aria-label="Indication filter"
                  value={filters.indication}
                  onChange={(e) => setFilters({ ...filters, indication: e.target.value })}
                >
                  {indicationOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === 'All' ? 'Indication (All)' : opt}
                    </option>
                  ))}
                </select>
              </label>
              <label className="select-shell">
                <select
                  name="barrierDriverStrategyFilter"
                  aria-label="Strategy filter"
                  value={filters.strategy}
                  onChange={(e) => setFilters({ ...filters, strategy: e.target.value })}
                >
                  {strategyFilterOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === 'All' ? 'Select strategy' : strategyLabelForValue(picklists, opt)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
          {!isActivities && (
            <button
              type="button"
              className="button bd-add-record-button bd-filter-add-button"
              aria-disabled={isReadOnly || activeAddLimitReached}
              disabled={isReadOnly || activeAddLimitReached}
              title={activeAddLimitMessage}
              onClick={() => openNewBarrierDriver(activeAddType)}
            >
              Add {medicalRecordTypeLabel(activeAddType)}
            </button>
          )}
          {tab === 'activities' && (
            <>
              <label className="select-shell">
                <select
                  name="criticalActivityAccountableFilter"
                  aria-label="Medical tactic accountable filter"
                  value={filters.accountable}
                  onChange={(e) => setFilters({ ...filters, accountable: e.target.value })}
                >
                  {accountableOptionsForFilters.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === 'All' ? 'Accountable (All)' : opt}
                    </option>
                  ))}
                </select>
              </label>
              <label className="select-shell">
                <select
                  name="criticalActivityDriverTitleFilter"
                  aria-label="Medical tactic opportunity title filter"
                  value={filters.driverTitle}
                  onChange={(e) => setFilters({ ...filters, driverTitle: e.target.value })}
                >
                  {driverTitleOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === 'All' ? 'Opportunity Title (All)' : opt}
                    </option>
                  ))}
                </select>
              </label>
              <label className="select-shell">
                <select
                  name="criticalActivityBarrierTitleFilter"
                  aria-label="Medical tactic barrier title filter"
                  value={filters.barrierTitle}
                  onChange={(e) => setFilters({ ...filters, barrierTitle: e.target.value })}
                >
                  {barrierTitleOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === 'All' ? 'Barrier Title (All)' : opt}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="button primary-red filter-row-action"
                disabled={isReadOnly}
                onClick={() => openNewActivity(null)}
              >
                New Medical Tactic
              </button>
            </>
          )}
          </div>
          {bdError && !bdEditState && (
            <div className="critical-activity-edit-error bd-inline-error" role="alert">
              {bdError}
            </div>
          )}
        </div>
      </article>

      {tab === 'hierarchy' && (
        <article className="mock-card bd-hierarchy-card">
          <div className="mock-section-head">
            <div>
              <h3>Barriers/Opportunities Hierarchy</h3>
              <p>Medical tactics are hidden until the barrier or opportunity is expanded.</p>
            </div>
            <div className="button-row">
              <button
                type="button"
                className="button bd-add-record-button"
                aria-disabled={isReadOnly || barrierLimitReached}
                disabled={isReadOnly || barrierLimitReached}
                title={barrierAddLimitMessage}
                onClick={() => openNewBarrierDriver('Barrier')}
              >
                Add Barrier
              </button>
              <button
                type="button"
                className="button bd-add-record-button"
                aria-disabled={isReadOnly || driverLimitReached}
                disabled={isReadOnly || driverLimitReached}
                title={driverAddLimitMessage}
                onClick={() => openNewBarrierDriver('Driver')}
              >
                Add Opportunity
              </button>
            </div>
          </div>

          <div className="bd-hierarchy-list">
            {filteredRecords.length === 0 && (
              <div className="empty-state small">No barriers or opportunities match the current filters.</div>
            )}
            {filteredRecords.map((record) => (
              <HierarchyRow
                key={record.id}
                record={record}
                openCountMap={openCountByBarrier}
                isExpanded={!!expandedRows[record.id]}
                activities={filteredEntryActivities(record)}
                picklists={picklists}
                onToggle={() => toggleRow(record.id)}
                onEdit={openEditBarrierDriver}
                onAddActivity={openNewActivity}
                onEditActivity={openEditActivity}
                isReadOnly={isReadOnly}
              />
            ))}

            {filteredPlanLevelActivities.length > 0 && (
              <article className="bd-tree-row is-plan-level">
                <div className="bd-tree-main">
                  <button
                    type="button"
                    className="bd-expand-button"
                    onClick={() => setPlanLevelExpanded((v) => !v)}
                    aria-expanded={planLevelExpanded}
                  >
                    <ExpandIcon expanded={planLevelExpanded} />
                  </button>
                  <div className="bd-tree-copy">
                    <div className="bd-tree-title-line">
                      <span className="bd-type-pill">Plan</span>
                      <h4>Plan-Level Medical Tactics</h4>
                    </div>
                    <p>Medical tactics not attached to a visible barrier or opportunity.</p>
                    <div className="bd-chip-row">
                      <span className="chip chip-green">
                        {formatCountLabel(filteredPlanLevelActivities.length, 'medical tactic')}
                      </span>
                    </div>
                  </div>
                </div>
                {planLevelExpanded && (
                  <div className="bd-activity-branch">
                    <div className="bd-activity-branch-head">
                      <strong>Medical Tactics</strong>
                      <span>{filteredPlanLevelActivities.length} total</span>
                    </div>
                    {filteredPlanLevelActivities.map((activity) => (
                      <article key={activity.id} className="bd-activity-card">
                        <div>
                          <h4 title={activity.name || ''}>{truncateDisplay(activity.name || 'Untitled', TITLE_DISPLAY_LIMIT)}</h4>
                          {activity.details && (
                            <p className="bd-activity-description bd-critical-activity-details">
                              <span>Details</span> {activity.details}
                            </p>
                          )}
                          <div className="bd-chip-row">
                            <span className="chip">
                              Linked Barrier/Opportunity {truncateDisplay(activity.parentName || 'Plan-level', TITLE_DISPLAY_LIMIT)}
                            </span>
                            <span className={`chip ${statusTone(activity.status)}`}>
                              Medical Tactic Status {activityStatusLabel(activity)}
                            </span>
                            <span className="chip">Created By {activity.createdBy || 'Not entered'}</span>
                            <span className="chip">Accountable {activity.ownerLabel || 'Unassigned'}</span>
                            <span className="chip">
                              Due Date {activity.dueDate ? formatDateLabel(activity.dueDate, 'Not entered') : 'Not entered'}
                            </span>
                            <span className="chip">
                              Last Modified Date {formatDateLabel(activity.lastModifiedDate, 'Not entered')}
                            </span>
                          </div>
                        </div>
                        <EditIconButton
                          ariaLabel={`Edit ${activity.name || 'medical tactic'}`}
                          onClick={() => openEditActivity(activity)}
                          disabled={isReadOnly}
                        />
                      </article>
                    ))}
                  </div>
                )}
              </article>
            )}
          </div>
        </article>
      )}

      {tab === 'barriers' && (
        <article className="mock-card bd-record-card">
          <div className="bd-hierarchy-list bd-card-list">
            {filteredBarriers.length === 0 && (
              <div className="empty-state small">No barriers match the current filters.</div>
            )}
            {filteredBarriers.map((barrier) => (
              <RecordCard
                key={barrier.id}
                record={barrier}
                isExpanded={!!expandedRows[barrier.id]}
                activities={filteredEntryActivities(barrier)}
                openCountMap={openCountByBarrier}
                onToggle={() => toggleRow(barrier.id)}
                onEdit={openEditBarrierDriver}
                onAddActivity={openNewActivity}
                onEditActivity={openEditActivity}
                isReadOnly={isReadOnly}
              />
            ))}
          </div>
        </article>
      )}

      {tab === 'drivers' && (
        <article className="mock-card bd-record-card">
          <div className="bd-hierarchy-list bd-card-list">
            {filteredDrivers.length === 0 && (
              <div className="empty-state small">No opportunities match the current filters.</div>
            )}
            {filteredDrivers.map((driver) => (
              <RecordCard
                key={driver.id}
                record={driver}
                isExpanded={!!expandedRows[driver.id]}
                activities={filteredEntryActivities(driver)}
                openCountMap={openCountByBarrier}
                onToggle={() => toggleRow(driver.id)}
                onEdit={openEditBarrierDriver}
                onAddActivity={openNewActivity}
                onEditActivity={openEditActivity}
                isReadOnly={isReadOnly}
              />
            ))}
          </div>
        </article>
      )}

      {tab === 'activities' && (
        <article className="critical-activity-records">
          <div className="critical-activity-table-stack">
            {activitySections.map((section) => (
              <ActivitiesSection
                key={section.key}
                section={section}
                sort={sorts[section.key]}
                onSort={handleSort}
                onEdit={openEditActivity}
                isReadOnly={isReadOnly}
              />
            ))}
          </div>
        </article>
      )}

      {!isReadOnly && bdEditState && (
        <BarrierDriverEditModal
          record={bdEditState.record}
          defaultType={bdEditState.defaultType}
          picklists={picklists}
          accountableOptions={picklists.accountableMembers || []}
          activityStatusOptions={picklists.activityStatuses || []}
          medicalTacticOptions={picklists.medicalTacticTitles || []}
          medicalTacticTitleLabels={picklists.medicalTacticTitleLabels || {}}
          medicalTacticOptionsByParentTitle={picklists.medicalTacticOptionsByParentTitle || {}}
          isSaving={isSavingBd}
          error={bdError}
          onClose={closeBdModal}
          onSave={handleSaveBarrierDriver}
        />
      )}

      {!isReadOnly && activityEditState && (
        <CriticalActivityEditModal
          activity={activityEditState.activity}
          parentRecord={activityEditState.parentRecord}
          barrierDriverOptions={barrierDriverOptionsForActivity}
          indicationOptions={activityIndicationOptions}
          accountableOptions={picklists.accountableMembers || []}
          statusOptions={picklists.activityStatuses || []}
          medicalTacticOptions={picklists.medicalTacticTitles || []}
          medicalTacticTitleLabels={picklists.medicalTacticTitleLabels || {}}
          medicalTacticOptionsByParentTitle={picklists.medicalTacticOptionsByParentTitle || {}}
          editDisabledReason={activityEditState.activity?.editDisabledReason || ''}
          isSaving={isSavingActivity}
          error={activityError}
          onClose={closeActivityModal}
          onSave={handleSaveActivity}
          onDelete={handleDeleteActivity}
        />
      )}

      {!isReadOnly && activityCreateState && (
        <CriticalActivityNewModal
          barrierDriverOptions={openBarrierDriverOptionsForActivity}
          parentRecord={activityCreateState.parentRecord}
          indicationOptions={activityIndicationOptions}
          accountableOptions={picklists.accountableMembers || []}
          statusOptions={picklists.activityStatuses || []}
          medicalTacticOptions={picklists.medicalTacticTitles || []}
          medicalTacticTitleLabels={picklists.medicalTacticTitleLabels || {}}
          medicalTacticOptionsByParentTitle={picklists.medicalTacticOptionsByParentTitle || {}}
          isSaving={isSavingActivity}
          error={activityError}
          onClose={closeActivityModal}
          onSave={handleCreateActivity}
        />
      )}

      {!isReadOnly && pendingBarrierDriverStatusConfirm && (
        <LinkedBarrierDriverStatusConfirmModal
          prompt={pendingBarrierDriverStatusConfirm}
          onDismiss={handleDismissBarrierDriverStatusConfirm}
          onConfirm={handleOpenBarrierDriverStatusPrompt}
        />
      )}

      {!isReadOnly && pendingBarrierDriverStatusPrompt && (
        <LinkedBarrierDriverStatusPromptModal
          prompt={pendingBarrierDriverStatusPrompt}
          value={barrierDriverStatusPromptValue}
          error={barrierDriverStatusPromptError}
          isSaving={isSavingBarrierDriverStatus}
          onChange={handleBarrierDriverStatusPromptChange}
          onDismiss={handleDismissBarrierDriverStatusPrompt}
          onSave={handleSaveBarrierDriverStatusPrompt}
        />
      )}
    </section>
  );
}
