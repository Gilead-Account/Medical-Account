import { FieldHelpButton } from '@/components/EditModalField';

export const HOME_FIELD_HELP = {
  lastFieldDirectorReviewDate:
    'Displays the date of the most recent Field Director review.',
  atcCohort:
    'Classifies the account based on cohort grouping to support segmentation and benchmarking.',
  atcSegment:
    'Shows the account segment used for planning and comparison across similar sites.',
  kltSprintAccount:
    'Indicates whether this account is part of a focused KLT sprint initiative.',
  customerGoals:
    'Capture the customer\'s primary goal for their CAR-T program as a clear, one-line statement reflecting the current focus or priority.',
  barriers:
    'Highlights key barriers currently impacting account performance or CAR-T adoption.',
  drivers:
    'Highlights key opportunities supporting account performance or CAR-T adoption.',
  kiteStrategy:
    'Auto-populated from selected barrier/opportunity strategies and reflects the overall medical approach to the account.',
  criticalActivities:
    'Shows overdue and near-term medical tactics that need attention within the next 30 days.',
  teamMembers:
    'Lists internal team members attached to the account plan and their participation role.',
};

export default function HomeFieldHelp({ helpKey, label, className = '' }) {
  const text = HOME_FIELD_HELP[helpKey];
  if (!text) return null;

  return (
    <FieldHelpButton
      className={`home-field-help ${className}`.trim()}
      label={`${label || 'Home field'} guidance`}
      text={text}
    />
  );
}
