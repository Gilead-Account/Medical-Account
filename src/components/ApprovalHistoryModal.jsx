import { useEffect, useMemo, useState } from 'react';
import TableSortButton from '@/components/TableSortButton';
import { nextTableSort, stableSortRows, toDateSortValue } from '@/lib/helper/tableSort';
import '@/styles/edit-modal.css';
import '@/components/ApprovalHistoryModal.css';

const HISTORY_COLUMNS = [
  { key: 'createdDate', label: 'Created Date', type: 'date' },
  { key: 'approvalDate', label: 'Approval Date', type: 'date' },
  { key: 'status', label: 'Status' },
  { key: 'medicalSubmitter', label: 'Medical Submitter' },
  { key: 'actualApprover', label: 'Actual Approver' },
];

const historySortValue = (entry, key) => {
  const column = HISTORY_COLUMNS.find((candidate) => candidate.key === key);
  if (column?.type === 'date') return toDateSortValue(entry[key]);
  return entry[key] || '';
};

const historyDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value || '-';
  return new Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export default function ApprovalHistoryModal({
  plan,
  entries = [],
  status = 'ready',
  error = '',
  onRetry,
  onClose,
}) {
  const [sort, setSort] = useState({ key: 'createdDate', direction: 'desc' });

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const sortedEntries = useMemo(
    () => stableSortRows(entries, sort, historySortValue),
    [entries, sort]
  );

  const handleSort = (key) => setSort((current) => nextTableSort(current, key));

  return (
    <div className="stakeholder-edit-overlay approval-history-overlay" onClick={onClose} role="presentation">
      <section
        className="stakeholder-edit-modal approval-history-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="approvalHistoryTitle"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="stakeholder-edit-head">
          <div className="stakeholder-edit-title">
            <span className="stakeholder-edit-eyebrow">FD approval</span>
            <h3 id="approvalHistoryTitle">Approval History</h3>
            <p>{plan?.name || 'Account Plan'}</p>
          </div>
          <button type="button" className="stakeholder-edit-close" onClick={onClose} aria-label="Close" />
        </header>
        <div className="stakeholder-edit-body approval-history-body">
          <div className="approval-history-summary" role="status">
            {status === 'loading'
              ? 'Loading approval history...'
              : `${entries.length} approval ${entries.length === 1 ? 'request' : 'requests'}`}
          </div>
          <div className="approval-history-table-wrap">
            <table className="approval-history-table">
              <thead>
                <tr>
                  {HISTORY_COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      aria-sort={
                        sort?.key === column.key
                          ? sort.direction === 'desc' ? 'descending' : 'ascending'
                          : 'none'
                      }
                    >
                      <TableSortButton column={column} sort={sort} onSort={handleSort} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {status === 'loading' && (
                  <tr><td colSpan={HISTORY_COLUMNS.length} className="approval-history-message">Loading approval history...</td></tr>
                )}
                {status === 'error' && (
                  <tr>
                    <td colSpan={HISTORY_COLUMNS.length} className="approval-history-message is-error">
                      <span>{error || 'Unable to load approval history.'}</span>
                      <button type="button" onClick={onRetry}>Try again</button>
                    </td>
                  </tr>
                )}
                {status === 'ready' && entries.length === 0 && (
                  <tr><td colSpan={HISTORY_COLUMNS.length} className="approval-history-message">No approval history was found for this Account Plan.</td></tr>
                )}
                {status === 'ready' && sortedEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td>{historyDate(entry.createdDate)}</td>
                    <td>{historyDate(entry.approvalDate)}</td>
                    <td><span className="approval-history-status">{entry.status || '-'}</span></td>
                    <td>{entry.medicalSubmitter || '-'}</td>
                    <td>{entry.actualApprover || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
