const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();
const CRM_MEDICAL_TACTIC_OPTIONS_BY_RECORD_TYPE_KEY = '__crmMedicalTacticOptionsByRecordType';
const MEDICAL_TACTIC_PARENT_TYPES = {
  barrier: 'Barrier',
  opp: 'Driver',
  opportunity: 'Driver',
};
const MEDICAL_TACTIC_INDICATIONS = ['DLBCL', 'MM'];

export const picklistInfoFromLabels = (source) => {
  const values = [];
  const labels = {};
  const add = (value, label, active = true) => {
    // Restricted picklists must be written with the exact API value returned
    // by CRM. Do not trim or collapse whitespace here: only the user-facing
    // label may be normalized for display and matching.
    const apiValue = value === null || value === undefined ? '' : String(value);
    if (!apiValue.trim()) return;
    if (active && !values.includes(apiValue)) values.push(apiValue);
    labels[apiValue] = medicalPicklistLabel(apiValue, { [apiValue]: label });
  };

  if (Array.isArray(source)) {
    for (const entry of source) {
      if (typeof entry === 'string') {
        add(entry, entry);
      } else if (entry && typeof entry === 'object') {
        // Some runtime versions return both a display `value` and a distinct
        // API identifier. Restricted picklist writes must prefer that API
        // identifier; sending the display value produces INVALID_OR_NULL_FOR_
        // RESTRICTED_PICKLIST even when the option looks correct in the UI.
        const value = entry.apiValue || entry.apiName || entry.name || entry.value || entry.label;
        add(value, entry.label || entry.displayLabel || entry.translatedLabel || entry.value || value, entry.isActive !== false && entry.active !== false);
      }
    }
  } else if (source && typeof source === 'object') {
    for (const [value, label] of Object.entries(source)) add(value, label);
  }

  return { values, labels };
};

// CRM API names encode dependencies; those suffixes are never display text.
// Prefer the actual CRM label, including when it differs entirely from the API name.
export const medicalPicklistLabel = (value, labels = {}) => {
  const label = clean(labels?.[value]);
  const text = clean(value);
  if (label && label !== text) return label;
  return text
    .replace(/\s*\|\s*(?:MM|DLBCL|Portfolio)(?:\s*,\s*(?:MM|DLBCL|Portfolio))*\s*$/i, '')
    .replace(/\s*\((?:Med|Barrier|Opp|Opportunity)\)\s*$/i, '')
    .trim();
};

export const labelForPicklistValue = (labels, value) => medicalPicklistLabel(value, labels);

export const withMedicalPicklistLabels = (record, picklists = {}, isTactic = false) => {
  if (!record) return record;
  const nameValue = record.nameValue ?? record.name;
  const labels = isTactic ? picklists.medicalTacticTitleLabels
    : record.type === 'Driver' ? picklists.driverTitleLabels : picklists.barrierTitleLabels;
  return {
    ...record,
    nameValue,
    name: medicalPicklistLabel(nameValue, labels),
    ...(!isTactic && record.strategy ? {
      strategyLabel: medicalPicklistLabel(record.strategy, picklists.strategyLabels),
    } : {}),
  };
};

export const buildMedicalTacticOptionsByParentTitle = (values = []) => {
  const optionsByRecordTypeAndIndication = {
    Barrier: { DLBCL: [], MM: [] },
    Driver: { DLBCL: [], MM: [] },
  };

  for (const value of values || []) {
    const apiName = String(value || '').trim();
    const separatorIndex = apiName.lastIndexOf(' | ');
    if (separatorIndex < 0) continue;

    const nameBeforeIndication = apiName.slice(0, separatorIndex).trim();
    const parentMarker = nameBeforeIndication.match(/\((Barrier|Opp|Opportunity)\)\s*$/i);
    if (!parentMarker) continue;

    const parentType = MEDICAL_TACTIC_PARENT_TYPES[parentMarker[1].toLowerCase()];
    const indications = apiName
      .slice(separatorIndex + 3)
      .split(',')
      .map((indication) => clean(indication).toUpperCase())
      .filter((indication) => MEDICAL_TACTIC_INDICATIONS.includes(indication));

    for (const indication of indications) {
      const options = optionsByRecordTypeAndIndication[parentType][indication];
      if (!options.includes(value)) options.push(value);
    }
  }

  return {
    [CRM_MEDICAL_TACTIC_OPTIONS_BY_RECORD_TYPE_KEY]: optionsByRecordTypeAndIndication,
  };
};

export const medicalTacticOptionsForParent = (
  parent,
  optionsByParentTitle = {},
  currentValue = ''
) => {
  if (!parent) return [];
  const parentType = String(parent.type || '').trim().toLowerCase();
  const type = ['driver', 'opp', 'opportunity'].includes(parentType)
    ? 'Driver'
    : 'Barrier';
  const indication = clean(parent.indication).toUpperCase();
  if (!indication) return [];
  return optionsByParentTitle?.[CRM_MEDICAL_TACTIC_OPTIONS_BY_RECORD_TYPE_KEY]?.[type]?.[indication] || [];
};
