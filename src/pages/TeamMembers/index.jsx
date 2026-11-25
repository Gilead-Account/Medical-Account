import { hostedUserRecordUrl } from '@/lib/helper/userRecordNavigation';
import { viewRecord } from '@/lib/dataservice/query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import TableSortButton from '@/components/TableSortButton';
import { displayValue, formatCountLabel, teamMemberPhone } from '@/lib/helper/utils';
import { nextTableSort, stableSortRows } from '@/lib/helper/tableSort';
import {
  DUPLICATE_TEAM_MEMBER_MESSAGE,
  filterExistingTeamMemberUsers,
  hasDuplicateTeamMemberUser,
  teamMemberRawUserIds,
  teamMemberUserIds,
} from '@/lib/helper/teamMemberUsers';
import '@/styles/edit-modal.css';
import '@/pages/TeamMembers/TeamMembers.css';
import TeamMemberEditModal from '@/pages/TeamMembers/TeamMemberEditModal';
import {
  createTeamMember,
  deleteTeamMember,
  searchUsers as searchTeamUsers,
  sortTeamMembersByParticipation,
  updateTeamMember,
} from '@/lib/dataservice/accountPlan/teamMembers';

const EMPTY_ROWS = [];

const TEAM_MEMBER_TABLE_COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'role', label: 'Role' },
  { key: 'participation', label: 'Participation' },
];

const TEAM_MEMBER_FILTER_DEFAULTS = { participation: 'All', role: 'All' };
// Distinct, non-empty values of a field across the current team-member rows.
const uniqueValues = (rows, field) => {
  const seen = new Set();
  (rows || []).forEach((row) => {
    const value = row?.[field];
    if (value === null || value === undefined || value === '') return;
    seen.add(String(value));
  });
  return Array.from(seen).sort((a, b) => a.localeCompare(b));
};

const teamMemberSortValue = (member, key) => {
  switch (key) {
    case 'name':
      return member.name || null;
    case 'role':
      return member.role || member.functionName || null;
    case 'participation':
      return teamMemberPhone(member);
    default:
      return '';
  }
};

// Same-shape edit pencil button used in the Stakeholders table.
function EditPencil({ ariaLabel = 'Edit', onClick, disabled = false }) {
  return (
    <button
      type="button"
      className="stakeholder-edit-button"
      onClick={(e) => {
        e.stopPropagation();
        if (disabled) return;
        if (onClick) onClick();
      }}
      disabled={disabled || !onClick}
      aria-label={ariaLabel}
      title="Edit"
    >
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
    </button>
  );
}

function TeamMemberNameCell({ member }) {
  const [navigationError, setNavigationError] = useState('');
  const recordUrl = hostedUserRecordUrl(member.userId, typeof document !== 'undefined' ? document.referrer : '');
  const openUserRecord = async (event) => {
    if (recordUrl) return;
    event.preventDefault();
    setNavigationError('');
    try {
      await viewRecord('User', member.userId);
    } catch {
      setNavigationError('Unable to open this User record. Please try again.');
    }
  };
  return (
    <span>
      {member.userId ? (
        <a
          className="team-member-record-link"
          href={recordUrl || "#"}
          target={recordUrl ? "_blank" : undefined}
          rel="noopener noreferrer"
          onClick={openUserRecord}
          aria-label={`Open ${member.name || 'team member'} User record`}
        >
          <strong>{member.name}</strong>
        </a>
      ) : (
        <strong>{member.name}</strong>
      )}
      {navigationError && <span role="alert">{navigationError}</span>}
    </span>
  );
}

const applySavedTeamMember = (member, form, saved = {}) => ({
  ...member,
  ...saved,
  userId: form.userId || saved.userId || member.userId || null,
  name: form.name || saved.name || member.name,
  role: form.role || saved.role || member.role || null,
  functionName: form.role || saved.functionName || member.functionName || null,
  participation: form.participation || saved.participation || null,
  isPrimary: form.status ? form.status === 'Active' : saved.isPrimary ?? member.isPrimary,
});

export default function TeamMembers({ data, onMemberChange, onMemberDelete, onNotify, isReadOnly = false }) {
  const sourceRows = useMemo(
    () => sortTeamMembersByParticipation((data && data.teamMembers) || EMPTY_ROWS),
    [data]
  );
  const picklists = (data && data.picklists) || {};
  const [rows, setRows] = useState(sourceRows);
  const [editingMember, setEditingMember] = useState(null);
  const [sort, setSort] = useState(null);
  const [filters, setFilters] = useState(TEAM_MEMBER_FILTER_DEFAULTS);
  const editingMemberId = editingMember?.id || null;

  // Participation options: prefer the CRM picklist when provided, fall
  // back to whatever distinct values the current rows contain.
  const participationOptions = useMemo(() => {
    const fromPicklist = (picklists.participationOptions || []).filter(Boolean);
    if (fromPicklist.length) return fromPicklist;
    return uniqueValues(rows, 'participation');
  }, [picklists.participationOptions, rows]);

  // Role values come straight from the team-member rows (no CRM picklist
  // is loaded for this column today).
  const roleOptions = useMemo(
    () => uniqueValues(rows, 'role').concat(
      uniqueValues(rows, 'functionName').filter((value) => !uniqueValues(rows, 'role').includes(value))
    ),
    [rows]
  );

  const filteredRows = useMemo(
    () =>
      rows.filter((member) => {
        if (filters.participation !== 'All') {
          if (String(member.participation || '') !== filters.participation) return false;
        }
        if (filters.role !== 'All') {
          const memberRole = String(member.role || member.functionName || '');
          if (memberRole !== filters.role) return false;
        }
        return true;
      }),
    [rows, filters]
  );

  const displayRows = useMemo(
    () => stableSortRows(filteredRows, sort, teamMemberSortValue),
    [filteredRows, sort]
  );
  const excludedLookupUserIds = useMemo(
    () => teamMemberUserIds(rows, editingMemberId),
    [rows, editingMemberId]
  );
  const excludedLookupUserRawIds = useMemo(
    () => teamMemberRawUserIds(rows, editingMemberId),
    [rows, editingMemberId]
  );
  const searchAvailableTeamUsers = useCallback(
    (query, limit) =>
      Promise.resolve(searchTeamUsers(query, limit, excludedLookupUserRawIds))
        .then((results) => filterExistingTeamMemberUsers(results, excludedLookupUserIds)),
    [excludedLookupUserIds, excludedLookupUserRawIds]
  );
  const handleSort = (key) => setSort((current) => nextTableSort(current, key));

  useEffect(() => {
    setRows(sourceRows);
  }, [sourceRows]);

  useEffect(() => {
    if (isReadOnly) setEditingMember(null);
  }, [isReadOnly]);

  const openAddMember = () => {
    if (isReadOnly) return;
    setEditingMember({ isPrimary: true });
  };

  const openEditMember = (member) => {
    if (isReadOnly) return;
    setEditingMember(member);
  };

  const saveMember = async (id, form) => {
    if (isReadOnly) return;
    if (hasDuplicateTeamMemberUser(rows, form.userId, id || null)) {
      throw new Error(DUPLICATE_TEAM_MEMBER_MESSAGE);
    }
    if (id) {
      const saved = await updateTeamMember(id, form);
      const existingMember = rows.find((member) => member.id === id) || { id };
      const updatedMember = applySavedTeamMember(existingMember, form, saved);
      setRows((current) =>
        sortTeamMembersByParticipation(
          current.map((member) =>
            member.id === id ? applySavedTeamMember(member, form, saved) : member
          )
        )
      );
      onMemberChange?.(updatedMember);
      onNotify?.({
        title: 'Team member saved.',
        detail: 'Your changes have been saved.',
        refreshPages: true,
      });
      return;
    }

    const saved = await createTeamMember(data.planId, form);
    const created = {
      ...saved,
      userId: form.userId || saved.userId || null,
      name: form.name || saved.name || 'Unnamed team member',
      role: form.role || saved.role || null,
      functionName: form.role || saved.functionName || null,
      participation: form.participation || saved.participation || null,
      isPrimary: form.status ? form.status === 'Active' : saved.isPrimary,
    };
    setRows((current) => sortTeamMembersByParticipation([created, ...current]));
    onMemberChange?.(created);
    onNotify?.({
      title: 'Team member saved.',
      detail: 'Your changes have been saved.',
      refreshPages: true,
    });
  };

  const deleteMember = async (member) => {
    if (isReadOnly || !member?.id) return;
    await deleteTeamMember(member.id);
    setRows((current) => current.filter((row) => row.id !== member.id));
    onMemberDelete?.(member.id);
    onNotify?.({
      title: 'Team member deleted.',
      detail: 'The team member has been removed from this account plan.',
      refreshPages: true,
    });
  };

  return (
    <section className="page page-team-members mock-stakeholder-page">
      {/* Filter toolbar — Participation + Role left, count pill + Add
          button right. Same Critical-Activities / Stakeholders shape. */}
      <article className="mock-card critical-activity-toolbar-card team-members-toolbar-card">
        <div className="critical-activity-toolbar">
          <div className="mock-filter-row bd-filter-row team-members-filter-row">
            <label className="select-shell">
              <select
                name="teamMemberParticipationFilter"
                aria-label="Team member participation filter"
                value={filters.participation}
                onChange={(e) => setFilters({ ...filters, participation: e.target.value })}
              >
                <option value="All">Participation (All)</option>
                {participationOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </label>
            <label className="select-shell">
              <select
                name="teamMemberRoleFilter"
                aria-label="Team member role filter"
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              >
                <option value="All">Role (All)</option>
                {roleOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="team-members-toolbar-actions">
            <span className="team-members-count-pill">
              {formatCountLabel(rows.length, 'Team Member')}
            </span>
            <button
              type="button"
              className="button primary-red critical-activity-new-button stakeholder-add-button"
              onClick={openAddMember}
              disabled={isReadOnly}
            >
              Add Team Member
            </button>
          </div>
        </div>
      </article>

      <article className="mock-card stakeholder-table-card">
        <div className="team-members-table-head">
          {TEAM_MEMBER_TABLE_COLUMNS.map((column) => (
            <span key={column.key}>
              <TableSortButton column={column} sort={sort} onSort={handleSort} />
            </span>
          ))}
          <span />
        </div>
        {displayRows.map((member) => (
          <div key={member.id} className="team-members-table-row">
            <TeamMemberNameCell member={member} />
            <span>{displayValue(member.role || member.functionName)}</span>
            <span>{teamMemberPhone(member)}</span>
            <span className="stakeholder-row-actions">
              <EditPencil
                ariaLabel={`Edit ${member.name || 'team member'}`}
                onClick={() => openEditMember(member)}
                disabled={isReadOnly}
              />
            </span>
          </div>
        ))}
        {displayRows.length === 0 && (
          <div className="empty-state small">No team members match the current filters.</div>
        )}
      </article>

      {!isReadOnly && editingMember && (
        <TeamMemberEditModal
          member={editingMember}
          participationOptions={picklists.participationOptions || []}
          statusOptions={picklists.statusOptions || []}
          searchUsers={searchAvailableTeamUsers}
          onClose={() => setEditingMember(null)}
          onSave={saveMember}
          onDelete={deleteMember}
        />
      )}
    </section>
  );
}
