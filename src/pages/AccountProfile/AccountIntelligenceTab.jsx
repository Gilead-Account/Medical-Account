import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DLBCL_MEDICAL_PROFILE_FIELD_API_NAMES,
  medicalEducationStatusFieldsFor,
  medicalEducationStatusKey,
  MM_MEDICAL_PROFILE_FIELD_API_NAMES,
} from '@/lib/dataservice/accountPlan/shared';
import { medicalEducationValueFromStatuses } from '@/pages/AccountProfile/medicalEducationStatuses';
import {
  mergeMedicalProfileDraftValues,
  sanitizeMedicalProfilePicklistValue,
} from '@/pages/AccountProfile/medicalProfilePicklistValues';

const MM_PROFILE_TEXT_MAX_LENGTH = 250;
const MULTISELECT_VIEWPORT_MARGIN = 12;
const MULTISELECT_MENU_GAP = 6;
const MULTISELECT_MENU_MAX_HEIGHT = 240;
const MEDICAL_EDUCATION_STATUS_OPTIONS = ['Pending', 'Completed', 'Declined'];

const accountInformationFields = () => [];

const fieldWithOptions = (field, picklists) => ({
  ...field,
  options: picklists[field.crmField] || [],
});

const medicalEducationStatusFields = (fields, picklists, statusFieldApiNames) =>
  Object.entries(statusFieldApiNames).map(([optionValue, crmField]) => ({
    key: medicalEducationStatusKey(optionValue),
    label: `${optionValue} status`,
    parentKey: 'medicalEducation',
    parentOption: optionValue,
    crmField,
    editable: true,
    inputType: 'select',
    options: picklists[crmField]?.length
      ? picklists[crmField]
      : (picklists[fields.medicalEducationStatus]?.length
        ? picklists[fields.medicalEducationStatus]
        : MEDICAL_EDUCATION_STATUS_OPTIONS),
  }));

const medicalProfileFields = (profileType, picklists) => {
  const isDlbcl = profileType === 'dlbcl';
  const fields = isDlbcl
    ? DLBCL_MEDICAL_PROFILE_FIELD_API_NAMES
    : MM_MEDICAL_PROFILE_FIELD_API_NAMES;
  const prefix = isDlbcl ? 'DLBCL' : 'MM';
  const statusFieldApiNames = medicalEducationStatusFieldsFor(profileType);
  const hasPerValueStatuses = Object.keys(statusFieldApiNames).length > 0;
  const kiteClinicalTrialLabel = isDlbcl ? 'Kite Lymphoma/Pipeline' : 'Kite MM';
  const medicalEducationField = {
    ...fieldWithOptions({ key: 'medicalEducation', label: `${prefix} Medical Education`, crmField: fields.medicalEducation, editable: true, inputType: 'education-status-list', layout: 'diagram-half' }, picklists),
    options: picklists[fields.medicalEducation]?.length
      ? picklists[fields.medicalEducation]
      : Object.keys(statusFieldApiNames),
  };
  const educationStatusFields = medicalEducationStatusFields(fields, picklists, statusFieldApiNames);
  const kiteClinicalTrialField = fieldWithOptions({ key: 'kiteClinicalTrial', label: kiteClinicalTrialLabel, crmField: fields.kiteClinicalTrial, editable: true, inputType: 'multiselect', layout: 'diagram-half' }, picklists);

  return [
    fieldWithOptions({ key: 'atcProfileCategory', label: `${prefix} ATC Profile Category`, crmField: fields.atcProfileCategory, editable: true, inputType: 'multiselect', layout: 'diagram-half' }, picklists),
    kiteClinicalTrialField,
    { key: 'atcProfile', label: `${prefix} ATC Profile`, crmField: fields.atcProfile, editable: true, inputType: 'text', maxLength: 32768, layout: 'diagram-full' },
    medicalEducationField,
    ...educationStatusFields,
    { key: 'competitorTrial', label: `${prefix} Competitor Trial`, crmField: fields.competitorTrial, editable: true, inputType: 'text', maxLength: 32768, layout: 'diagram-half' },
    fieldWithOptions({ key: 'medicalCollaboration', label: `${prefix} Medical Collaboration`, crmField: fields.medicalCollaboration, editable: true, inputType: 'multiselect', layout: 'diagram-half' }, picklists),
    { key: 'researchCapabilitiesTimelines', label: `${prefix} Research Capabilities Timelines`, crmField: fields.researchCapabilitiesTimelines, editable: true, inputType: 'text', maxLength: 255, layout: 'diagram-half' },
    ...(hasPerValueStatuses
      ? []
      : [fieldWithOptions({ key: 'medicalEducationStatus', label: `${prefix} Medical Education`, crmField: fields.medicalEducationStatus, editable: true, inputType: 'select', layout: 'diagram-half' }, picklists)]),
  ];
};

const accountIntelligenceSections = (profileType = 'mm', mmProfilePicklists = {}) => [{
  title: profileType === 'dlbcl' ? 'DLBCL ATC Medical Profile' : 'MM ATC Medical Profile',
  className: 'is-medical-profile-diagram',
  placement: 'main',
  fields: medicalProfileFields(profileType, mmProfilePicklists),
}];

const ACCOUNT_INTELLIGENCE_SECTIONS = accountIntelligenceSections();

const editValue = (value) => (value === null || value === undefined ? '' : String(value));
const displayValue = (value) => {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
};
const labelWithUnit = (item) => (item.unit ? `${item.label} (${item.unit})` : item.label);

// Values come straight from their owning CRM records — no component-level
// dummy fallback. Empty fields
// render as "-"; local/offline dummy data lives in mock fixtures.
const valueFromProfile = (profileValues, item) =>
  profileValues && Object.prototype.hasOwnProperty.call(profileValues, item.key)
    ? profileValues[item.key]
    : '';

const editableItemsForSections = (
  sections = ACCOUNT_INTELLIGENCE_SECTIONS,
  accountFields = accountInformationFields()
) => {
  const editableAccountFields = accountFields.filter((field) => field.editable);
  const editableFields = sections.flatMap((section) =>
    section.fields.filter((field) => field.editable)
  );

  return [...editableAccountFields, ...editableFields];
};

const buildInitialEditableValues = (
  profileValues = {},
  sections = ACCOUNT_INTELLIGENCE_SECTIONS,
  accountFields = accountInformationFields(),
  removeInactivePicklistValues = false
) => {
  return Object.fromEntries(
    editableItemsForSections(sections, accountFields).map((item) => [
      item.key,
      removeInactivePicklistValues
        ? sanitizeMedicalProfilePicklistValue(
            valueFromProfile(profileValues, item),
            item.inputType,
            item.options
          )
        : editValue(valueFromProfile(profileValues, item)),
    ])
  );
};

function AccountIntelligenceControl({
  item,
  value,
  onChange,
  disabled = false,
  childItems = [],
  childValues = {},
}) {
  if (item.inputType === 'education-status-list') {
    return (
      <MedicalEducationEditor
        item={item}
        onChange={onChange}
        disabled={disabled}
        statusItems={childItems}
        statusValues={childValues}
      />
    );
  }

  if (item.inputType === 'multiselect') {
    return (
      <MedicalMultiSelect
        item={item}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }

  if (item.inputType === 'select') {
    const options = [
      { value: '', label: '-' },
      ...(item.options || []).map((option) => {
        if (option && typeof option === 'object') {
          return {
            value: editValue(option.value),
            label: String(option.label || option.value || '-'),
          };
        }
        return {
          value: editValue(option),
          label: String(option || '-'),
        };
      }),
    ];
    return (
      <select
        aria-label={item.label}
        className="account-intelligence-control"
        value={editValue(value)}
        disabled={disabled}
        onChange={(event) => onChange(item.key, event.target.value)}
      >
        {options.map((option) => (
          <option value={option.value} key={option.value || 'empty'}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  if (item.inputType === 'number') {
    return (
      <input
        aria-label={item.label}
        className="account-intelligence-control"
        inputMode="numeric"
        pattern="[0-9]*"
        min="0"
        type="text"
        value={editValue(value)}
        placeholder="-"
        disabled={disabled}
        onChange={(event) => onChange(item.key, event.target.value.replace(/[^\d]/g, ''))}
      />
    );
  }

  return (
    <textarea
      aria-label={item.label}
      className="account-intelligence-control is-textarea"
      maxLength={item.maxLength || MM_PROFILE_TEXT_MAX_LENGTH}
      rows={2}
      value={editValue(value)}
      disabled={disabled}
      onChange={(event) => onChange(item.key, event.target.value)}
    />
  );
}

function MedicalEducationEditor({
  item,
  onChange,
  disabled,
  statusItems = [],
  statusValues = {},
}) {
  const options = (item.options || []).map((option) => ({
    value: editValue(option?.value ?? option),
    label: String(option?.label ?? option?.value ?? option),
  }));
  const statusItemByOption = new Map(
    statusItems.map((statusItem) => [statusItem.parentOption, statusItem])
  );

  const renderStatusControl = (option) => {
    const statusItem = statusItemByOption.get(option.value);
    if (!statusItem) return null;
    return (
      <select
        aria-label={`${option.label} status`}
        className="medical-education-status-control"
        value={editValue(statusValues[statusItem.key])}
        disabled={disabled}
        onChange={(event) => onChange(statusItem.key, event.target.value)}
      >
        <option value="">-</option>
        {(statusItem.options || []).map((statusOption) => {
          const statusValue = editValue(statusOption?.value ?? statusOption);
          return (
            <option value={statusValue} key={statusValue}>
              {String(statusOption?.label ?? statusOption?.value ?? statusOption)}
            </option>
          );
        })}
      </select>
    );
  };

  return (
    <div className="medical-education-editor" role="group" aria-label={item.label}>
      <div className="medical-education-option-list">
        {options.map((option) => (
          <div className="medical-education-option" key={option.value}>
            <span className="medical-education-option-label">{option.label}</span>
            <div className="medical-education-status-slot">
              {renderStatusControl(option)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MedicalMultiSelect({ item, value, onChange, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const selectedValues = editValue(value).split(';').map((entry) => entry.trim()).filter(Boolean);
  const selected = new Set(selectedValues);
  const options = (item.options || []).map((option) => ({
    value: editValue(option?.value ?? option),
    label: String(option?.label ?? option?.value ?? option),
  }));
  const optionLabels = new Map(options.map((option) => [option.value, option.label]));
  const summary = selectedValues.length
    ? selectedValues.map((selectedValue) => optionLabels.get(selectedValue) || selectedValue).join(', ')
    : '-';
  const toggle = (optionValue) => {
    const next = new Set(selected);
    if (next.has(optionValue)) next.delete(optionValue);
    else next.add(optionValue);
    onChange(item.key, Array.from(next).join(';'));
  };

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger || typeof window === 'undefined') return;

    const rect = trigger.getBoundingClientRect();
    const viewport = window.visualViewport;
    const viewportHeight = viewport?.height || window.innerHeight;
    const viewportWidth = viewport?.width || window.innerWidth;
    const spaceBelow = viewportHeight - rect.bottom - MULTISELECT_VIEWPORT_MARGIN;
    const spaceAbove = rect.top - MULTISELECT_VIEWPORT_MARGIN;
    const opensAbove = spaceBelow < 160 && spaceAbove > spaceBelow;
    const availableHeight = Math.max(
      96,
      (opensAbove ? spaceAbove : spaceBelow) - MULTISELECT_MENU_GAP
    );
    const width = Math.min(rect.width, viewportWidth - (MULTISELECT_VIEWPORT_MARGIN * 2));
    const left = Math.min(
      Math.max(rect.left, MULTISELECT_VIEWPORT_MARGIN),
      Math.max(MULTISELECT_VIEWPORT_MARGIN, viewportWidth - width - MULTISELECT_VIEWPORT_MARGIN)
    );

    setMenuStyle({
      left: `${left}px`,
      top: `${opensAbove ? rect.top - MULTISELECT_MENU_GAP : rect.bottom + MULTISELECT_MENU_GAP}px`,
      width: `${width}px`,
      maxHeight: `${Math.min(MULTISELECT_MENU_MAX_HEIGHT, availableHeight)}px`,
      transform: opensAbove ? 'translateY(-100%)' : 'none',
    });
  }, []);

  useEffect(() => {
    if (!isOpen || disabled || typeof document === 'undefined') return undefined;

    updateMenuPosition();
    const handleOutsidePointer = (event) => {
      if (rootRef.current?.contains(event.target) || menuRef.current?.contains(event.target)) return;
      setIsOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      triggerRef.current?.focus();
    };
    const handleViewportChange = () => updateMenuPosition();

    document.addEventListener('pointerdown', handleOutsidePointer, true);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    window.visualViewport?.addEventListener('resize', handleViewportChange);
    window.visualViewport?.addEventListener('scroll', handleViewportChange);

    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer, true);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
      window.visualViewport?.removeEventListener('resize', handleViewportChange);
      window.visualViewport?.removeEventListener('scroll', handleViewportChange);
    };
  }, [disabled, isOpen, updateMenuPosition]);

  useEffect(() => {
    if (disabled) setIsOpen(false);
  }, [disabled]);

  const menu = isOpen && !disabled && typeof document !== 'undefined' ? createPortal(
    <div ref={menuRef} className="medical-multiselect-menu" style={menuStyle}>
      {options.map((option) => (
        <label key={option.value}>
          <input type="checkbox" checked={selected.has(option.value)} onChange={() => toggle(option.value)} />
          <span>{option.label}</span>
        </label>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div ref={rootRef} className={`medical-multiselect ${isOpen ? 'is-open' : ''}`}>
      <button
        ref={triggerRef}
        type="button"
        className="account-intelligence-control medical-multiselect-trigger"
        aria-label={item.label}
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{summary}</span>
      </button>
      {menu}
    </div>
  );
}

function AccountIntelligenceField({
  item,
  value,
  onChange,
  isReadOnly = false,
  childItems = [],
  childValues = {},
}) {
  const isEditable = item.editable && !isReadOnly;
  const displayUnit = item.displayUnit;
  const renderedLabel = labelWithUnit(item);
  const className = [
    'account-intelligence-field',
    isEditable ? 'is-editable' : '',
    item.editable && isReadOnly ? 'is-readonly' : '',
    item.inlineValue ? 'has-inline-value' : '',
    item.valuePlacement === 'below' ? 'has-stacked-value' : '',
    item.tabletLayout ? `is-${item.tabletLayout}` : '',
    item.layout ? `is-${item.layout}` : '',
    item.key === 'competitorTrial' ? 'is-competitor-trial' : '',
  ].filter(Boolean).join(' ');

  const valueControl = (
    <AccountIntelligenceControl
      item={item}
      value={value}
      onChange={onChange}
      disabled={!isEditable}
      childItems={childItems}
      childValues={childValues}
    />
  );
  const renderedValue = item.editable ? (
    displayUnit ? (
      <span className="account-intelligence-value-with-unit">
        {valueControl}
        <span className="account-intelligence-value-unit">{displayUnit}</span>
      </span>
    ) : (
      valueControl
    )
  ) : (
    <strong className={displayUnit ? 'has-display-unit' : undefined}>
      {displayValue(value)}
      {displayUnit ? <span className="account-intelligence-value-unit">{displayUnit}</span> : null}
    </strong>
  );

  return (
    <div className={className}>
      <div className="account-intelligence-field-copy">
        {item.inlineValue ? (
          <div className="account-intelligence-field-label-row">
            <span>{renderedLabel}</span>
            {renderedValue}
          </div>
        ) : (
          <>
            <span>{renderedLabel}</span>
            {renderedValue}
          </>
        )}
      </div>
    </div>
  );
}

function AccountInformationSection({ fields, profileValues, editableValues, onChange, isReadOnly }) {
  return (
    <section className="account-intelligence-section account-information-section">
      <div className="account-intelligence-section-head">
        <div>
          <h3>Account Information</h3>
        </div>
      </div>
      <div className="account-information-field-grid">
        {fields.map((item) => {
          const crmValue = valueFromProfile(profileValues, item);
          return (
            <AccountIntelligenceField
              item={item}
              key={item.key}
              value={item.editable && !isReadOnly ? editableValues[item.key] ?? editValue(crmValue) : crmValue}
              onChange={onChange}
              isReadOnly={isReadOnly}
            />
          );
        })}
      </div>
    </section>
  );
}

function AccountIntelligenceSection({ section, profileValues, editableValues, onChange, isReadOnly, saveAction = null }) {
  return (
    <section className={`account-intelligence-section is-${section.placement} ${section.className || ''}`.trim()}>
      <div className="account-intelligence-section-head">
        <div>
          <h3>{section.title}</h3>
        </div>
        {saveAction ? (
          <button
            type="button"
            className="account-intelligence-save-button"
            onClick={saveAction.onSave}
            disabled={saveAction.disabled}
          >
            {saveAction.label}
          </button>
        ) : null}
      </div>
      <div className="account-intelligence-field-grid">
        {section.fields.filter((item) => !item.parentKey).map((item) => {
          const crmValue = valueFromProfile(profileValues, item);
          return (
            <AccountIntelligenceField
              item={item}
              key={item.key}
              value={item.editable && !isReadOnly ? editableValues[item.key] ?? editValue(crmValue) : crmValue}
              childItems={section.fields.filter((field) => field.parentKey === item.key)}
              childValues={editableValues}
              onChange={onChange}
              isReadOnly={isReadOnly}
            />
          );
        })}
      </div>
    </section>
  );
}

export default function AccountIntelligenceTab({
  profileTitle = 'MM ATC Medical Profile',
  profileType = 'mm',
  profileRecordId = '',
  values = {},
  mmProfilePicklists = {},
  isReadOnly = false,
  onSave,
  onSaveActionChange,
}) {
  const sections = useMemo(
    () => accountIntelligenceSections(profileType, mmProfilePicklists).map((section) => ({ ...section, title: profileTitle })),
    [mmProfilePicklists, profileTitle, profileType]
  );
  const accountFields = useMemo(() => accountInformationFields(mmProfilePicklists), [mmProfilePicklists]);
  const editableItems = useMemo(
    () => editableItemsForSections(sections, accountFields),
    [accountFields, sections]
  );
  const [savedEditableValues, setSavedEditableValues] = useState(() =>
    buildInitialEditableValues(values, sections, accountFields)
  );
  const [editableValues, setEditableValues] = useState(() =>
    buildInitialEditableValues(values, sections, accountFields, true)
  );
  const savedEditableValuesRef = useRef(savedEditableValues);
  const profileIdentityRef = useRef(`${profileRecordId}:${profileType}`);
  const [isSaving, setIsSaving] = useState(false);
  const mainSections = sections.filter((section) => section.placement === 'main');
  const sideSections = sections.filter((section) => section.placement === 'side');
  const normalizedEditableValues = useMemo(() => {
    const educationItem = editableItems.find((item) => item.key === 'medicalEducation');
    const statusItems = editableItems.filter((item) => item.parentKey === 'medicalEducation');
    if (!educationItem || !statusItems.length) return editableValues;
    return {
      ...editableValues,
      medicalEducation: medicalEducationValueFromStatuses(
        educationItem.options,
        statusItems,
        editableValues
      ),
    };
  }, [editableItems, editableValues]);

  useEffect(() => {
    const savedValues = buildInitialEditableValues(values, sections, accountFields);
    const activeValues = buildInitialEditableValues(values, sections, accountFields, true);
    const profileIdentity = `${profileRecordId}:${profileType}`;
    const profileChanged = profileIdentityRef.current !== profileIdentity;
    const previousSavedValues = savedEditableValuesRef.current;

    profileIdentityRef.current = profileIdentity;
    savedEditableValuesRef.current = savedValues;
    setSavedEditableValues(savedValues);
    setEditableValues((current) => (
      profileChanged
        ? activeValues
        : mergeMedicalProfileDraftValues(current, previousSavedValues, activeValues)
    ));
  }, [accountFields, profileRecordId, profileType, values, sections]);

  const handleEditableValueChange = (key, value) => {
    if (isReadOnly) return;
    setEditableValues((current) => ({ ...current, [key]: value }));
  };

  const isFieldDirty = (item) =>
    item.editable && item.crmField && editValue(normalizedEditableValues[item.key] ?? '') !== editValue(savedEditableValues[item.key] ?? '');

  const dirtyItems = useMemo(
    () => editableItems.filter((item) => item.editable && item.crmField && isFieldDirty(item)),
    [editableItems, normalizedEditableValues, savedEditableValues]
  );
  const hasUnsaved = dirtyItems.length > 0;
  const dirtyCount = dirtyItems.length;

  // Save all dirty MM fields at once. The parent persists each CRM API field to
  // KPH_Ecosystem_Plan__c, matching the single-save draft flow used by DLBCL.
  const handleSave = useCallback(async () => {
    if (isReadOnly || typeof onSave !== 'function' || !hasUnsaved || isSaving) return;
    const updates = {};
    const savedUpdates = {};
    for (const item of dirtyItems) {
      const nextValue = normalizedEditableValues[item.key] ?? '';
      updates[item.crmField] = nextValue;
      savedUpdates[item.key] = nextValue;
    }
    if (!Object.keys(updates).length) return;
    setIsSaving(true);
    try {
      await onSave(updates);
      setSavedEditableValues((current) => {
        const next = { ...current, ...savedUpdates };
        savedEditableValuesRef.current = next;
        return next;
      });
    } finally {
      setIsSaving(false);
    }
  }, [dirtyItems, hasUnsaved, isReadOnly, isSaving, normalizedEditableValues, onSave]);
  const saveLabel = isSaving ? 'Saving...' : hasUnsaved ? `Save (${dirtyCount})` : 'Save';

  useEffect(() => {
    if (isReadOnly || typeof onSave !== 'function' || typeof onSaveActionChange !== 'function') {
      onSaveActionChange?.(null);
      return undefined;
    }
    onSaveActionChange({
      label: saveLabel,
      hasUnsaved,
      dirtyCount,
      isSaving,
      onSave: handleSave,
    });
    return () => onSaveActionChange(null);
  }, [dirtyCount, handleSave, hasUnsaved, isReadOnly, isSaving, onSave, onSaveActionChange, saveLabel]);

  return (
    <div className="account-profile-workbook account-intelligence-workbook medical-profile-workbook">
      {accountFields.length ? (
        <AccountInformationSection
          fields={accountFields}
          profileValues={values}
          editableValues={normalizedEditableValues}
          onChange={handleEditableValueChange}
          isReadOnly={isReadOnly}
        />
      ) : null}

      <div className="account-intelligence-detail-layout">
        <div className="account-intelligence-main-stack">
          {mainSections.map((section, index) => (
            <AccountIntelligenceSection
              section={section}
              profileValues={values}
              editableValues={normalizedEditableValues}
              onChange={handleEditableValueChange}
              isReadOnly={isReadOnly}
              saveAction={index === 0 ? {
                label: saveLabel,
                onSave: handleSave,
                disabled: isReadOnly || isSaving || !hasUnsaved,
              } : null}
              key={section.title}
            />
          ))}
        </div>
        <aside className="account-intelligence-side-stack">
          {sideSections.map((section) => (
            <AccountIntelligenceSection
              section={section}
              profileValues={values}
              editableValues={normalizedEditableValues}
              onChange={handleEditableValueChange}
              isReadOnly={isReadOnly}
              key={section.title}
            />
          ))}
        </aside>
      </div>
    </div>
  );
}
