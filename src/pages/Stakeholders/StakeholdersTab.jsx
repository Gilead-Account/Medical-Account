import { useMemo, useState } from 'react';
import TableSortButton from '@/components/TableSortButton';
import {
  displayValue,
  formatCountLabel,
  stakeholderRoleOptions,
  stakeholderMatchesFilters,
} from '@/lib/helper/utils';
import { nextTableSort, stableSortRows } from '@/lib/helper/tableSort';

const STAKEHOLDER_TABLE_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'primaryParent', label: 'Primary Parent' },
];

const stakeholderSortValue = (stakeholder, key) => {
  switch (key) {
    case 'name':
      return stakeholder.name || null;
    case 'role':
      return stakeholder.role || null;
    case 'primaryParent':
      return stakeholder.primaryParent || null;
    default:
      return '';
  }
};

export default function StakeholdersTab({
  stakeholders,
  filters,
  onFilterChange,
}) {
  const [sort, setSort] = useState(null);
  const filtered = useMemo(() => {
    const matched = (stakeholders || []).filter((s) => stakeholderMatchesFilters(s, filters));
    return stableSortRows(matched, sort, stakeholderSortValue);
  }, [stakeholders, filters, sort]);
  const roleOptions = stakeholderRoleOptions(stakeholders);
  const handleSort = (key) => setSort((current) => nextTableSort(current, key));

  return (
    <>
      <article className="mock-card critical-activity-toolbar-card stakeholder-toolbar-card">
        <div className="critical-activity-toolbar">
          <div className="mock-filter-row bd-filter-strip stakeholder-filter-row">
            <div className="bd-filter-select-box stakeholder-filter-select-box">
              <label className="select-shell">
                <select
                  name="stakeholderRoleFilter"
                  aria-label="Stakeholder role filter"
                  value={filters.role}
                  onChange={(e) => onFilterChange({ ...filters, role: e.target.value })}
                >
                  {roleOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt === 'All' ? 'Role (All)' : opt}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="stakeholder-toolbar-actions">
              <span className="stakeholder-count-pill">
                {formatCountLabel((stakeholders || []).length, 'Stakeholder')}
              </span>
            </div>
          </div>
        </div>
      </article>

      <article className="mock-card stakeholder-table-card">
        <div className="stakeholder-table-head">
        {STAKEHOLDER_TABLE_COLUMNS.map((column) => (
          <span key={column.key}>
            <TableSortButton column={column} sort={sort} onSort={handleSort} />
          </span>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state small">No stakeholders match the current filters.</div>
      )}

      {filtered.map((s) => (
          <div key={s.id} className="stakeholder-table-item">
            <div className="stakeholder-table-row">
              <div className="stakeholder-name-cell">
                <span>
                  <strong>{s.name}</strong>
                  <small>{s.stakeholderId || 'No stakeholder ID'}</small>
                </span>
              </div>
              <span>{displayValue(s.role)}</span>
              <span className="stakeholder-parent-cell" title={s.primaryParent || ''}>
                <span className="stakeholder-parent-value">{displayValue(s.primaryParent, '-')}</span>
              </span>
            </div>
          </div>
      ))}
      </article>
    </>
  );
}
