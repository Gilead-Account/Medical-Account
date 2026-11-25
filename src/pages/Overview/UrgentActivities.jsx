import HomeFieldHelp from '@/components/HomeFieldHelp';
import {
  activityDueLabel,
  activityDueDetail,
  activityDueTone,
  activityParentName,
  formatCountLabel,
} from '@/lib/helper/utils';

// 5-cards-max scroll behavior is enforced by CSS (see main.css under
// "Home page side panels: cap to ~5 visible cards"). Inline styles got
// overridden by media-query rules; the CSS rule uses !important to win.

export default function UrgentActivities({ activities, onEditActivity }) {
  const list = activities || [];

  return (
    <article className="mock-card home-panel-card home-activity-panel">
      <div className="mock-section-head home-activity-section-head">
        <h3 className="home-activity-title home-title-with-help">
          <span className="home-activity-title-main">Medical Tactics</span>
          <span className="home-activity-title-window">(Overdue and Due Within 30 Days)</span>
          <HomeFieldHelp helpKey="criticalActivities" label="Medical Tactics" />
        </h3>
        <span className="home-widget-count">{formatCountLabel(list.length, 'item')}</span>
      </div>
      <div className="home-widget-scroll home-activity-card-list">
        {list.map((activity) => (
          <button
            key={activity.id}
            className="home-activity-card"
            type="button"
            onClick={(e) => onEditActivity && activity.legacyEditState !== 'legacy' && onEditActivity(activity, e)}
            disabled={!onEditActivity || activity.legacyEditState === 'legacy'}
            title={activity.editDisabledReason ? 'Open medical tactic' : undefined}
          >
            <span className="home-card-copy">
              <strong>{activity.name}</strong>
              <small>{activity.indication || activityParentName(activity)}</small>
            </span>
            <time className={activityDueTone(activity)}>
              <strong>{activityDueLabel(activity)}</strong>
              <small>{activityDueDetail(activity)}</small>
            </time>
          </button>
        ))}
        {list.length === 0 && (
          <div className="empty-state small">
            No overdue or upcoming medical tactics.
          </div>
        )}
      </div>
    </article>
  );
}
