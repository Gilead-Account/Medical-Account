import { medicalPicklistLabel } from './titlePicklistMappings.js';

const normalize = (value) =>
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const configuredValueMetadata = (value) => {
  const text = String(value || '').trim();
  const separatorIndex = text.lastIndexOf(' | ');
  if (separatorIndex < 0) return { label: '', indications: [] };
  const supportedIndications = new Set(['dlbcl', 'mm', 'portfolio']);
  const suffixValues = text
    .slice(separatorIndex + 3)
    .split(',')
    .map(normalize)
    .filter(Boolean);
  const indications = suffixValues.filter((item) => supportedIndications.has(item));
  if (!suffixValues.length) {
    return { label: '', indications: [] };
  }
  return {
    label: text.slice(0, separatorIndex).trim(),
    indications,
  };
};

export const BARRIER_OPPORTUNITY_INDICATIONS = ['DLBCL', 'MM'];

// Barrier and Opportunity Title are not exposed as dependent Salesforce
// picklists in every MyInsights runtime. When admins encode the indication in
// the picklist API name (for example, "Title | MM" or "Title | MM, DLBCL"),
// use that suffix as the dependency source while preserving the exact API
// value for CRM writes. Values without a supported suffix remain excluded;
// these title fields have no hardcoded indication fallback.
export const picklistOptionsByApiNameIndication = (
  values = [],
  indications = BARRIER_OPPORTUNITY_INDICATIONS
) => {
  const indicationByKey = new Map(
    (indications || []).filter(Boolean).map((indication) => [normalize(indication), indication])
  );
  const optionsByIndication = Object.fromEntries(
    [...indicationByKey.values()].map((indication) => [indication, []])
  );
  for (const value of values || []) {
    if (!value) continue;
    const { indications: encodedIndications } = configuredValueMetadata(value);
    if (!encodedIndications.length) continue;

    for (const encodedIndication of encodedIndications) {
      const indication = indicationByKey.get(encodedIndication);
      if (!indication) continue;
      if (!optionsByIndication[indication].includes(value)) {
        optionsByIndication[indication].push(value);
      }
    }
  }

  return optionsByIndication;
};

export const medicalStrategyPicklistInfoByApiName = (values = [], labels = {}) => {
  const medicalCandidates = (values || []).filter((value) => /\(med\)/i.test(String(value)));
  const optionsByIndication = picklistOptionsByApiNameIndication(medicalCandidates);
  const allowedValues = new Set(Object.values(optionsByIndication).flat());
  const medicalValues = medicalCandidates.filter((value) => allowedValues.has(value));
  const medicalLabels = {};

  for (const value of medicalValues) {
    const configuredLabel = configuredValueMetadata(value).label.replace(/\s*\(med\)\s*$/i, '').trim();
    medicalLabels[value] = medicalPicklistLabel(value, labels) || configuredLabel;
  }

  return {
    values: medicalValues,
    labels: medicalLabels,
    optionsByIndication,
  };
};

// The business rules are defined in terms of display labels, while Veeva must
// receive the underlying CRM/API picklist value on save. Resolve each approved
// label back to the value returned by CRM and retain the business-specified
// ordering. Values absent from CRM metadata are deliberately not offered.
export const configuredPicklistOptions = (
  values = [],
  labels = {},
  configuredLabels = [],
  indication = ''
) => {
  const indicationKey = normalize(indication);
  const valueByLabel = new Map();
  for (const value of values || []) {
    if (!value) continue;
    const encoded = configuredValueMetadata(value);
    if (
      indicationKey &&
      encoded.indications.length &&
      !encoded.indications.includes(indicationKey)
    ) {
      continue;
    }
    const displayLabel = labels?.[value] || value;
    const displayKey = normalize(displayLabel);
    const valueKey = normalize(value);
    const encodedLabelKey = normalize(encoded.label);
    if (displayKey && !valueByLabel.has(displayKey)) valueByLabel.set(displayKey, value);
    if (valueKey && !valueByLabel.has(valueKey)) valueByLabel.set(valueKey, value);
    if (encodedLabelKey && !valueByLabel.has(encodedLabelKey)) {
      valueByLabel.set(encodedLabelKey, value);
    }
  }

  const out = [];
  for (const configuredLabel of configuredLabels || []) {
    const value = valueByLabel.get(normalize(configuredLabel));
    if (value && !out.includes(value)) out.push(value);
  }
  return out;
};

export const configuredPicklistOptionsByIndication = (
  values = [],
  labels = {},
  configuredLabelsByIndication = {}
) => Object.fromEntries(
  Object.entries(configuredLabelsByIndication).map(([indication, configuredLabels]) => [
    indication,
    configuredPicklistOptions(values, labels, configuredLabels, indication),
  ])
);
