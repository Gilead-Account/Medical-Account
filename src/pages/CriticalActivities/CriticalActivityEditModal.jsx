import { useEffect, useMemo, useState } from 'react';
import Field, { FieldHelpButton } from '@/components/EditModalField';
import { CRITICAL_ACTIVITY_HELP } from '@/pages/CriticalActivities/criticalActivityHelp';
import {
  isOpenBarrierDriverOption,
  linkedBarrierDriverSelectOptions,
  optionForId,
} from '@/pages/CriticalActivities/linkedBarrierDriverOptions';
import { medicalRecordTypeLabel } from '@/lib/medicalTerminology';
import {
  labelForPicklistValue,
  medicalTacticOptionsForParent,
} from '@/lib/dataservice/accountPlan/titlePicklistMappings';
import {
  escapeBelongsToFieldControl,
  isDirectBackdropClick,
} from '@/lib/helper/modalDismiss';

const toDateInputValue = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
};

const displayStatus = (status) => {
  return status || 'Planned';
};

const buildInitialForm = (activity, parentRecord) => ({
  title: activity?.nameValue ?? activity?.name ?? '',
  details: activity?.details || '',
  indication: activity?.indication || parentRecord?.indication || '',
  status: activity?.legacyEditState === 'legacy' ? (activity?.status || '') : displayStatus(activity?.status),
  accountable: activity?.ownerLabel || '',
  dueDate: toDateInputValue(activity?.dueDate),
  completedDate: toDateInputValue(activity?.completedDate),
  parentId: activity?.barrierDriverId || parentRecord?.id || '',
  parentType: activity?.parentType || parentRecord?.type || '',
  parentRecordTypeId: activity?.parentRecordTypeId || parentRecord?.recordTypeId || '',
});

const mergeOptions = (current, options) => {
  const seen = new Set();
  const out = [];
  for (const value of [current, ...(options || [])]) {
    if (!value || value === 'All' || value === 'Unassigned' || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
};

const restrictedOptions = (current, options) => {
  const source = (options || []).filter(Boolean);
  return source.length ? source : mergeOptions(current, source);
};

export default function CriticalActivityEditModal({
  activity,
  parentRecord,
  barrierDriverOptions,
  indicationOptions,
  accountableOptions,
  statusOptions,
  medicalTacticOptions,
  medicalTacticTitleLabels,
  medicalTacticOptionsByParentTitle,
  editDisabledReason = '',
  isSaving,
  error,
  onClose,
  onSave,
  onDelete,
}) {
  const isEdit = !!activity?.id;
  const legacyMode = isEdit && activity?.legacyEditState === 'legacy';
  const legacyDateUnknown = isEdit && activity?.legacyEditState === 'unknown';
  const [form, setForm] = useState(() => buildInitialForm(activity, parentRecord));
  const [validationError, setValidationError] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    setForm(buildInitialForm(activity, parentRecord));
    setValidationError('');
    setConfirmDeleteOpen(false);
  }, [activity?.id, parentRecord?.id, parentRecord?.indication]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape' || isSaving) return;
      if (confirmDeleteOpen) {
        setConfirmDeleteOpen(false);
        return;
      }
      if (escapeBelongsToFieldControl(e)) return;
      onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmDeleteOpen, isSaving, onClose]);

  const modalAccountableOptions = useMemo(
    () => restrictedOptions(form.accountable, accountableOptions),
    [form.accountable, accountableOptions]
  );
  const modalStatusOptions = useMemo(
    () => mergeOptions(form.status, statusOptions),
    [form.status, statusOptions]
  );
  const canDeactivate = !legacyMode && activity?.canDeactivate !== false;
  const relatedOptions = useMemo(
    () => linkedBarrierDriverSelectOptions(barrierDriverOptions, form.parentId),
    [barrierDriverOptions, form.parentId]
  );
  const hasRelatedOptions = relatedOptions.length > 0;
  const selectedParentOption = useMemo(
    () => optionForId(relatedOptions, form.parentId),
    [relatedOptions, form.parentId]
  );
  const mappedMedicalTacticOptions = useMemo(
    () => mergeOptions(
      form.title,
      medicalTacticOptionsForParent(
        selectedParentOption,
        medicalTacticOptionsByParentTitle,
        form.title
      )
    ).filter((option) => !medicalTacticOptions?.length || medicalTacticOptions.includes(option)),
    [
      form.title,
      medicalTacticOptions,
      medicalTacticOptionsByParentTitle,
      selectedParentOption,
    ]
  );
  const remainingFieldsDisabled = legacyMode || legacyDateUnknown || Boolean(editDisabledReason) || Boolean(
    isEdit &&
    selectedParentOption &&
    !isOpenBarrierDriverOption(selectedParentOption)
  );

  const updateField = (key, value) => {
    if (legacyMode) return;
    setValidationError('');
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === 'parentId') {
        const found = optionForId(relatedOptions, value);
        next.parentType = found ? found.type : '';
        next.parentRecordTypeId = found ? (found.recordTypeId || '') : '';
        next.indication = found ? (found.indication || '') : '';
        if (value !== current.parentId) next.title = '';
      }
      return next;
    });
  };

  const requestDelete = () => {
    setValidationError('');
    setConfirmDeleteOpen(true);
  };

  const confirmDelete = () => {
    if (onDelete && activity) onDelete(activity);
  };

  const cancelDelete = () => {
    setConfirmDeleteOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (legacyMode) {
      setValidationError('Medical Tactics linked to legacy Barriers are read-only.');
      return;
    }
    if (!form.parentId) {
      setValidationError('Linked Barrier/Opportunity is required.');
      return;
    }
    if (!form.title.trim()) {
      setValidationError('Medical Tactic is required.');
      return;
    }
    if (!mappedMedicalTacticOptions.includes(form.title)) {
      setValidationError('Select an active Medical Tactic value from CRM.');
      return;
    }
    if (!form.indication) {
      setValidationError('Indication is required.');
      return;
    }
    if (!form.dueDate) {
      setValidationError('Due Date is required.');
      return;
    }
    if (!isEdit && !hasRelatedOptions) {
      setValidationError('Create or reopen a barrier or opportunity before adding a medical tactic.');
      return;
    }
    if (!isEdit && !optionForId(relatedOptions, form.parentId)) {
      setValidationError('Select an open linked Barrier/Opportunity.');
      return;
    }
    if (remainingFieldsDisabled) {
      setValidationError(
        editDisabledReason || 'Select an open linked Barrier/Opportunity before saving this medical tactic.'
      );
      return;
    }
    if (form.accountable && modalAccountableOptions.length && !modalAccountableOptions.includes(form.accountable)) {
      setValidationError('Select a valid accountable POD member.');
      return;
    }
    if (onSave) onSave({ ...form });
  };

  if (!activity && isEdit) return null;

  const title = isEdit ? 'Edit Medical Tactic' : 'New Medical Tactic';
  const subtitle = isEdit
    ? activity.name || 'Untitled'
    : parentRecord
      ? `Linked to ${medicalRecordTypeLabel(parentRecord.type)}: ${parentRecord.name || 'Untitled'}`
      : 'Select a linked barrier or opportunity';

  return (
    <div
      className="stakeholder-edit-overlay"
      onClick={isSaving || confirmDeleteOpen ? undefined : (event) => {
        if (isDirectBackdropClick(event)) onClose();
      }}
      role="presentation"
    >
      <form
        className={`stakeholder-edit-modal critical-activity-edit-modal bd-critical-activity-modal ${remainingFieldsDisabled ? 'is-fields-locked' : ''} ${legacyMode ? 'is-legacy-record' : ''}`}
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <header className="stakeholder-edit-head">
          <div className="stakeholder-edit-title">
            <h3>{title}</h3>
            <div className="stakeholder-edit-subtitle-row">
              <p>{subtitle}</p>
              <FieldHelpButton
                className="stakeholder-edit-subtitle-help"
                label="Medical tactic sub-header guidance"
                text={CRITICAL_ACTIVITY_HELP.subheader}
              />
            </div>
          </div>
          <button
            type="button"
            className="stakeholder-edit-close"
            onClick={onClose}
            aria-label="Close"
            disabled={isSaving}
          />
        </header>

        <div className="stakeholder-edit-body">
          {legacyDateUnknown && <p role="alert">Unable to verify historical-record edit access. Refresh or contact support.</p>}
          <section className="stakeholder-edit-section">
            <div className="stakeholder-edit-grid">
              <Field label="Linked Barrier/Opportunity" help={CRITICAL_ACTIVITY_HELP.linkedBarrierDriver}>
                <select
                  value={form.parentId}
                  required
                  disabled={isEdit || !hasRelatedOptions}
                  aria-disabled={isEdit || !hasRelatedOptions}
                  onChange={(e) => updateField('parentId', e.target.value)}
                >
                  <option value="">Select linked barrier or opportunity</option>
                  {relatedOptions.map((opt) => (
                    <option key={opt.id} value={opt.id} hidden={!!opt.isCurrentClosedSelection}>
                      {medicalRecordTypeLabel(opt.type)}: {opt.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Medical Tactic" help={CRITICAL_ACTIVITY_HELP.title}>
                {legacyMode ? <input type="text" value={activity.name || '-'} disabled /> : (
                <select
                  value={form.title}
                  required
                  disabled={!selectedParentOption || remainingFieldsDisabled}
                  onChange={(e) => updateField('title', e.target.value)}
                >
                  <option value="">
                    {selectedParentOption
                      ? 'Select medical tactic'
                      : 'Select linked barrier or opportunity first'}
                  </option>
                  {mappedMedicalTacticOptions.map((option) => (
                    <option key={option} value={option}>
                      {labelForPicklistValue(medicalTacticTitleLabels, option)}
                    </option>
                  ))}
                </select>
                )}
              </Field>

              <Field label="Medical Tactic Status" help={CRITICAL_ACTIVITY_HELP.status}>
                <select
                  value={form.status}
                  required={legacyMode}
                  disabled={remainingFieldsDisabled}
                  onChange={(e) => updateField('status', e.target.value)}
                >
                  {legacyMode && !form.status && <option value="" disabled>Select status</option>}
                  {modalStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Due Date" className="critical-activity-due-date-field">
                <input
                  className="critical-activity-due-date-input"
                  data-field-help={CRITICAL_ACTIVITY_HELP.dueDate}
                  name="criticalActivityDueDate"
                  type="date"
                  value={form.dueDate}
                  required
                  disabled={legacyMode || remainingFieldsDisabled}
                  onChange={(e) => updateField('dueDate', e.target.value)}
                />
              </Field>

              <Field label="Indication" help={CRITICAL_ACTIVITY_HELP.indication}>
                <input
                  type="text"
                  readOnly
                  value={form.indication}
                  disabled={legacyMode}
                  placeholder="Set by the linked barrier/opportunity"
                />
              </Field>

              <Field label="Accountable" help={CRITICAL_ACTIVITY_HELP.accountable}>
                {legacyMode ? <input type="text" value={form.accountable || '-'} disabled /> : (
                <select
                  value={form.accountable}
                  disabled={remainingFieldsDisabled}
                  onChange={(e) => updateField('accountable', e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {modalAccountableOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                )}
              </Field>

              <Field label="Details" help={CRITICAL_ACTIVITY_HELP.details} className="is-textarea">
                <textarea
                  rows={3}
                  value={form.details}
                  maxLength={255}
                  readOnly={remainingFieldsDisabled}
                  onChange={(e) => updateField('details', e.target.value)}
                />
              </Field>
            </div>
          </section>
          {(validationError || error) && (
            <div className="critical-activity-edit-error">{validationError || error}</div>
          )}
        </div>

        <footer className="stakeholder-edit-foot">
          {isEdit && canDeactivate && onDelete && (
            <button
              type="button"
              className="critical-activity-delete-button"
              onClick={requestDelete}
              disabled={isSaving}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            className="stakeholder-edit-button-secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button type="submit" className="stakeholder-edit-button-primary" disabled={isSaving || remainingFieldsDisabled}>
            {isSaving ? 'Saving' : 'Save'}
          </button>
        </footer>
      </form>

      {confirmDeleteOpen && (
        <div
          className="critical-activity-confirm-scrim"
          role="presentation"
          onClick={(e) => e.stopPropagation()}
        >
          <section
            className="critical-activity-confirm-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="criticalActivityDeactivateConfirmTitle"
          >
            <h4 id="criticalActivityDeactivateConfirmTitle">
              Are you sure you want to delete this medical tactic?
            </h4>
            <div className="critical-activity-confirm-actions">
              <button
                type="button"
                className="stakeholder-edit-button-secondary"
                onClick={cancelDelete}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="critical-activity-delete-button confirm"
                onClick={confirmDelete}
                disabled={isSaving}
              >
                Confirm Delete
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
