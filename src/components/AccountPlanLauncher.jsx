import { useEffect, useMemo, useRef, useState } from 'react';
import KiteAccountPlanLoader from '@/components/KiteAccountPlanLoader';
import { fetchCurrentUserAccountPlans } from '@/lib/dataservice/accountPlan/accountPlanLauncher';
import { nextTableSort, stableSortRows, toDateSortValue } from '@/lib/helper/tableSort';
import { formatDate } from '@/lib/helper/utils';

const EMPTY_ROWS = [];
const LOADER_MIN_DURATION_MS = 2500;
const ACCOUNT_PLAN_LAUNCHER_COLUMNS = [
  { key: 'name', label: 'Account Plan Name' },
  { key: 'ownerName', label: 'Owner Name' },
  { key: 'marketAccessPrioritizedAccount', label: 'Market Access Prioritized Account' },
  { key: 'mmAtcPriorityAccount', label: 'MM ATC Priority Account' },
  { key: 'atcCohortDlbcl', label: 'ATC Cohort DLBCL' },
  { key: 'planStatus', label: 'Plan Status' },
  { key: 'territory', label: 'Territory' },
  { key: 'territoryDescription', label: 'Territory Description' },
  { key: 'atcCertifiedDate', label: 'ATC Certified Date', type: 'date' },
  { key: 'lastFieldDirectorReviewDate', label: 'Last FD Review', type: 'date' },
  { key: 'submittedDate', label: 'Submitted Date', type: 'date' },
];

const launcherSortValue = (row, key) => {
  const column = ACCOUNT_PLAN_LAUNCHER_COLUMNS.find((item) => item.key === key);
  if (column?.type === 'date') return toDateSortValue(row[key]);
  return row[key];
};

const renderLauncherCellValue = (plan, column) => {
  if (column.type === 'date') {
    return formatDate(plan[column.key], '-');
  }
  return plan[column.key] || '-';
};

function LauncherSortButton({ column, sort, onSort }) {
  const isActive = sort && sort.key === column.key;
  const direction = isActive ? sort.direction : '';

  return (
    <button
      type="button"
      className="account-plan-launcher-sort-button"
      onClick={() => onSort(column.key)}
      aria-label={`Sort by ${column.label}`}
      aria-pressed={!!isActive}
      data-sort-key={column.key}
      data-sort-direction={direction || 'none'}
      title={column.label}
    >
      <span className="account-plan-launcher-sort-label">{column.label}</span>
      <span className="account-plan-launcher-sort-slot" aria-hidden="true">
        <i className={`activity-sort-arrow ${direction}`} />
      </span>
    </button>
  );
}

export default function AccountPlanLauncher({ onSelectPlan }) {
  const [rows, setRows] = useState(EMPTY_ROWS);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState(null);
  const loadSeqRef = useRef(0);
  const loadTimerRef = useRef(null);

  const loadRows = () => {
    const loadSeq = loadSeqRef.current + 1;
    loadSeqRef.current = loadSeq;
    const startedAt = Date.now();
    if (loadTimerRef.current) {
      window.clearTimeout(loadTimerRef.current);
      loadTimerRef.current = null;
    }
    setStatus('loading');
    setError(null);
    fetchCurrentUserAccountPlans()
      .then((plans) => ({ nextStatus: 'ready', plans: plans || EMPTY_ROWS, error: null }))
      .catch((err) => {
        console.error('[account-plan-launcher] load failed', err);
        return { nextStatus: 'error', plans: EMPTY_ROWS, error: err };
      })
      .then((result) => {
        const elapsed = Date.now() - startedAt;
        const remainingMs = Math.max(0, LOADER_MIN_DURATION_MS - elapsed);
        loadTimerRef.current = window.setTimeout(() => {
          if (loadSeqRef.current !== loadSeq) return;
          loadTimerRef.current = null;
          setRows(result.plans);
          setError(result.error);
          setStatus(result.nextStatus);
        }, remainingMs);
      });
  };

  useEffect(() => {
    loadRows();
    return () => {
      loadSeqRef.current += 1;
      if (loadTimerRef.current) {
        window.clearTimeout(loadTimerRef.current);
      }
    };
  }, []);

  const filteredRows = useMemo(() => {
    const term = String(query || '').trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [
        row.name,
        row.eid,
        row.ownerName,
        row.ownerFirstName,
        row.ownerLastName,
        row.marketAccessPrioritizedAccount,
        row.mmAtcPriorityAccount,
        row.atcCohortDlbcl,
        row.planStatus,
        row.territory,
        row.territoryDescription,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [query, rows]);
  const visibleRows = useMemo(
    () => stableSortRows(filteredRows, sort, launcherSortValue),
    [filteredRows, sort]
  );
  const handleSort = (key) => setSort((current) => nextTableSort(current, key));

  return (
    <main className="account-plan-launcher" aria-label="Account Plan selection">
      {status === 'loading' ? (
        <KiteAccountPlanLoader />
      ) : (
        <section className="account-plan-launcher-panel">
        <div className="account-plan-launcher-panel-head">
          <div className="account-plan-launcher-panel-title">
            <span className="account-plan-launcher-count">{filteredRows.length}</span>
            <div>
              <h1>Account Plans</h1>
              <span>{filteredRows.length === 1 ? '1 result' : `${filteredRows.length} results`}</span>
            </div>
          </div>
          <div className="account-plan-launcher-actions">
            <label className="account-plan-launcher-search">
              <span>Search</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Plan, owner, territory"
              />
            </label>
            <button type="button" className="account-plan-launcher-refresh" onClick={loadRows}>
              Refresh
            </button>
          </div>
        </div>

        {status === 'error' && (
          <div className="account-plan-launcher-state is-error">
            <strong>Unable to load Account Plans.</strong>
            <span>{error?.message || 'Try refreshing the list.'}</span>
          </div>
        )}

        {status === 'ready' && filteredRows.length === 0 && (
          <div className="account-plan-launcher-state">
            <strong>No Account Plans found.</strong>
            <span>Try a different search or refresh the list.</span>
          </div>
        )}

        {status === 'ready' && visibleRows.length > 0 && (
          <div className="account-plan-launcher-table" role="table" aria-label="Account Plans">
            <div className="account-plan-launcher-row is-head" role="row">
              {ACCOUNT_PLAN_LAUNCHER_COLUMNS.map((column) => (
                <span role="columnheader" key={column.key}>
                  <LauncherSortButton column={column} sort={sort} onSort={handleSort} />
                </span>
              ))}
              <span role="columnheader">Action</span>
            </div>
            {visibleRows.map((plan) => (
              <div className="account-plan-launcher-row" role="row" key={plan.id}>
                {ACCOUNT_PLAN_LAUNCHER_COLUMNS.map((column) => (
                  <span
                    role="cell"
                    data-label={column.label}
                    className={column.key === 'name' ? 'account-plan-launcher-plan-name' : undefined}
                    key={column.key}
                  >
                    {column.key === 'name' ? (
                      <>
                        <strong title={plan.name}>{plan.name}</strong>
                        <small>{plan.eid || '-'}</small>
                      </>
                    ) : (
                      renderLauncherCellValue(plan, column)
                    )}
                  </span>
                ))}
                <span role="cell" data-label="Action">
                  <button
                    type="button"
                    className="account-plan-launcher-open"
                    aria-label={`Open ${plan.name}`}
                    onClick={() => onSelectPlan?.(plan)}
                  >
                    Open
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
        </section>
      )}
    </main>
  );
}
