const barrierDriverStatusKey = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const isClosedBarrierDriverStatusValue = (value) => {
  const key = barrierDriverStatusKey(value);
  return key === 'close' || key === 'closed' || key === 'complete' || key === 'completed';
};

const criticalActivityStatusKey = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

export const isCompletedCriticalActivityStatusValue = (value) => {
  const key = criticalActivityStatusKey(value);
  return key === 'complete' || key === 'completed' || key === 'closed';
};

export const optionForId = (options, id) =>
  (options || []).find((option) => option && option.id === id) || null;

export const isOpenBarrierDriverOption = (option) =>
  Boolean(option?.id) && !isClosedBarrierDriverStatusValue(option?.status);

export const criticalActivityClosedParentEditReason = (activity, parentRecord) => {
  if (!activity?.barrierDriverId || !parentRecord?.id) return '';
  return isOpenBarrierDriverOption(parentRecord)
    ? ''
    : 'Reopen the linked Barrier/Opportunity before editing this medical tactic.';
};

export const linkedBarrierDriverSelectOptions = (options, currentParentId = '') => {
  const currentId = String(currentParentId || '');
  const openOptions = [];
  const seen = new Set();
  let currentClosedSelection = null;

  for (const option of options || []) {
    if (!option?.id || seen.has(option.id)) continue;
    seen.add(option.id);

    if (isOpenBarrierDriverOption(option)) {
      openOptions.push({ ...option, isCurrentClosedSelection: false });
      continue;
    }

    if (currentId && option.id === currentId) {
      currentClosedSelection = { ...option, isCurrentClosedSelection: true };
    }
  }

  return currentClosedSelection
    ? [currentClosedSelection, ...openOptions]
    : openOptions;
};
