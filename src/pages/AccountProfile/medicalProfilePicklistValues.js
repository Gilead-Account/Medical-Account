const MULTI_VALUE_INPUT_TYPES = new Set(['multiselect', 'education-status-list']);
const PICKLIST_INPUT_TYPES = new Set([...MULTI_VALUE_INPUT_TYPES, 'select']);

const stringValue = (value) =>
  value === null || value === undefined ? '' : String(value);

const optionValue = (option) =>
  stringValue(option?.value ?? option).trim();

export const sanitizeMedicalProfilePicklistValue = (
  value,
  inputType,
  options = []
) => {
  const currentValue = stringValue(value);
  if (!PICKLIST_INPUT_TYPES.has(inputType)) return currentValue;

  const activeValues = new Set((options || []).map(optionValue).filter(Boolean));
  // An empty option list can also mean the metadata request failed. Preserve
  // the stored value in that case so a temporary metadata issue cannot erase
  // valid CRM data.
  if (!activeValues.size) return currentValue;

  if (MULTI_VALUE_INPUT_TYPES.has(inputType)) {
    return currentValue
      .split(';')
      .map((entry) => entry.trim())
      .filter((entry) => entry && activeValues.has(entry))
      .join(';');
  }

  return activeValues.has(currentValue.trim()) ? currentValue.trim() : '';
};

export const mergeMedicalProfileDraftValues = (
  draftValues = {},
  previousSavedValues = {},
  incomingValues = {}
) => Object.fromEntries(
  Object.entries(incomingValues).map(([key, incomingValue]) => {
    const draftValue = draftValues[key];
    const previousSavedValue = previousSavedValues[key];
    const isDirty = stringValue(draftValue) !== stringValue(previousSavedValue);
    return [key, isDirty ? draftValue : incomingValue];
  })
);
