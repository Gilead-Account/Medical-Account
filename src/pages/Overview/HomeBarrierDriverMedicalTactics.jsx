import { useState } from 'react';
import {
  activityDueDetail,
  activityIsOpen,
  activityStatusLabel,
  daysFromNow,
  formatDateLabel,
} from '@/lib/helper/utils';

const COMPLETED_TACTIC_STATUSES = new Set(['complete', 'completed', 'closed', 'archived']);

const TACTIC_FILTERS = [
  { id: 'all', label: 'All Tactics' },
  { id: 'open', label: 'Open' },
  { id: 'closed', label: 'Completed' },
];

const isHomeModalTacticOpen = (activity) =>
  activityIsOpen(activity) &&
  !COMPLETED_TACTIC_STATUSES.has(String(activity?.status || '').trim().toLowerCase());

const tacticsForHomeModalFilter = (rows, filter) => rows.filter((activity) => {
  if (filter === 'open') return isHomeModalTacticOpen(activity);
  if (filter === 'closed') return !isHomeModalTacticOpen(activity);
  return true;
});

const tacticPriorityMeta = (activity) => {
  if (!isHomeModalTacticOpen(activity)) {
    return { label: 'Complete', tone: 'complete' };
  }

  const daysUntilDue = daysFromNow(activity?.dueDate);
  if (daysUntilDue !== null && daysUntilDue < 0) {
    return { label: 'Overdue', tone: 'overdue' };
  }
  if (daysUntilDue !== null && daysUntilDue <= 30) {
    return { label: daysUntilDue === 0 ? 'Due today' : 'Due soon', tone: 'due-soon' };
  }
  if (daysUntilDue === null) {
    return { label: 'No due date', tone: 'unscheduled' };
  }
  return { label: 'On track', tone: 'on-track' };
};

const medicalRecordLabel = (record) => (record?.type === 'Driver' ? 'opportunity' : 'barrier');

const TacticMeta = ({ label, value }) => (
  <span className="home-bd-activity-meta-item">
    <small>{label}</small>
    <strong>{value || 'Not entered'}</strong>
  </span>
);

export default function HomeBarrierDriverMedicalTactics({ record, activities, onEditActivity }) {
  const rows = activities || [];
  const firstOpenTactic = rows.find(isHomeModalTacticOpen);
  const [expandedId, setExpandedId] = useState(() => firstOpenTactic?.id || rows[0]?.id || null);
  const [tacticFilter, setTacticFilter] = useState('all');
  const openCount = rows.reduce(
    (count, activity) => count + (isHomeModalTacticOpen(activity) ? 1 : 0),
    0
  );
  const filterCounts = {
    all: rows.length,
    open: openCount,
    closed: rows.length - openCount,
  };
  const visibleRows = tacticsForHomeModalFilter(rows, tacticFilter);

  const toggleTactic = (activityId) => {
    setExpandedId((current) => (current === activityId ? null : activityId));
  };

  const selectTacticFilter = (nextFilter) => {
    const nextRows = tacticsForHomeModalFilter(rows, nextFilter);
    setTacticFilter(nextFilter);
    setExpandedId(nextRows[0]?.id || null);
  };

  const recordLabel = medicalRecordLabel(record);
  const emptyFilterLabel = TACTIC_FILTERS.find(({ id }) => id === tacticFilter)?.label.toLowerCase();

  return (
    <section className="home-bd-activities" aria-labelledby="home-bd-medical-tactics-title">
      <div className="home-bd-activities-head">
        <div className="home-bd-activities-title-group">
          <span className="home-bd-activities-title-icon" aria-hidden="true">
            <i />
          </span>
          <h4 id="home-bd-medical-tactics-title">Linked Medical Tactics</h4>
        </div>
        <div className="home-bd-activity-filters" role="group" aria-label="Filter linked Medical Tactics">
          {TACTIC_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              className={`home-bd-activity-filter is-${filter.id} ${tacticFilter === filter.id ? 'is-selected' : ''}`}
              aria-pressed={tacticFilter === filter.id}
              onClick={() => selectTacticFilter(filter.id)}
            >
              <span>{filter.label}</span>
              <strong aria-label={`${filterCounts[filter.id]} medical tactics`}>
                {filterCounts[filter.id]}
              </strong>
            </button>
          ))}
        </div>
      </div>

      {visibleRows.length ? (
        <div className="home-bd-activity-list">
          {visibleRows.map((activity, index) => {
            const isExpanded = expandedId === activity.id;
            const panelId = `home-bd-medical-tactic-panel-${activity.id}`;
            const priority = tacticPriorityMeta(activity);
            return (
              <article
                key={activity.id}
                className={`home-bd-activity-accordion is-${priority.tone} ${isExpanded ? 'is-expanded' : ''}`}
                style={{ '--home-bd-activity-order': index }}
              >
                <div className="home-bd-activity-summary-row">
                  <button
                    type="button"
                    className="home-bd-activity-toggle"
                    aria-expanded={isExpanded}
                    aria-controls={panelId}
                    onClick={() => toggleTactic(activity.id)}
                  >
                    <span className="home-bd-activity-index" aria-hidden="true">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="home-bd-activity-title-block">
                      <span className="home-bd-activity-title-line">
                        <strong>{activity.name || 'Untitled Medical Tactic'}</strong>
                        <span className={`home-bd-activity-priority is-${priority.tone}`}>
                          {priority.label}
                        </span>
                      </span>
                      <span className="home-bd-activity-glance">
                        <span>{activityStatusLabel(activity)}</span>
                        <span aria-hidden="true">•</span>
                        <span>{activityDueDetail(activity)}</span>
                        <span aria-hidden="true">•</span>
                        <span>{activity.ownerLabel || 'Unassigned'}</span>
                      </span>
                    </span>
                    <span className="home-bd-activity-chevron" aria-hidden="true" />
                  </button>
                  {onEditActivity ? (
                    <button
                      type="button"
                      className="home-bd-activity-edit"
                      onClick={() => onEditActivity(activity)}
                      aria-label={`Edit ${activity.name || 'medical tactic'}`}
                    >
                      Edit
                    </button>
                  ) : null}
                </div>

                {isExpanded ? (
                  <div id={panelId} className="home-bd-activity-panel">
                    <div className="home-bd-activity-detail-copy">
                      <span>Medical Tactic details</span>
                      <p>{activity.details || 'No additional details have been entered.'}</p>
                    </div>
                    <div className="home-bd-activity-meta-grid">
                      <TacticMeta label="Medical Tactic Status" value={activityStatusLabel(activity)} />
                      <TacticMeta label="Due Date" value={formatDateLabel(activity.dueDate, 'Not entered')} />
                      <TacticMeta label="Accountable" value={activity.ownerLabel || 'Unassigned'} />
                      <TacticMeta label="Indication" value={activity.indication} />
                      <TacticMeta label="Created By" value={activity.createdBy} />
                      <TacticMeta label="Last Modified" value={formatDateLabel(activity.lastModifiedDate, 'Not entered')} />
                    </div>
                    {activity.comments ? (
                      <div className="home-bd-activity-comment">
                        <span>Comments</span>
                        <p>{activity.comments}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="home-bd-activities-empty">
          <span aria-hidden="true">✓</span>
          <div>
            <strong>
              {rows.length ? `No ${emptyFilterLabel} medical tactics` : 'No linked Medical Tactics'}
            </strong>
            <p>
              {rows.length
                ? `This ${recordLabel} has no medical tactics in this view.`
                : `This ${recordLabel} does not have any active or completed Medical Tactics yet.`}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
