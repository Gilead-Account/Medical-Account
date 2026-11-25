// CRM record types and field names remain unchanged; only medical-facing copy
// uses the revised account-plan terminology.
export const medicalRecordTypeLabel = (type) =>
  type === 'Driver' ? 'Opportunity' : (type && type !== 'Barrier' ? type : 'Barrier');

export const medicalRecordTypeLabelLower = (type) =>
  medicalRecordTypeLabel(type).toLowerCase();

export const medicalRecordTypeFilterLabel = (value) =>
  value === 'Drivers' ? 'Opportunities' : value;
