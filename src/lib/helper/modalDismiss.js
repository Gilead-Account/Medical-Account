const NATIVE_ESCAPE_INPUT_TYPES = new Set([
  'date',
  'datetime-local',
  'month',
  'time',
  'week',
]);

// Desktop-native selects and date/time pickers use Escape to dismiss their
// own popup. That same key event can reach a modal's window listener, where it
// must not be mistaken for a request to close the entire modal.
export const escapeBelongsToFieldControl = (event) => {
  if (!event || event.defaultPrevented || event.isComposing) return true;
  const target = event.target;
  const tagName = String(target?.tagName || '').toLowerCase();
  if (tagName === 'select') return true;
  if (tagName === 'input' && NATIVE_ESCAPE_INPUT_TYPES.has(String(target?.type || '').toLowerCase())) {
    return true;
  }
  return Boolean(target?.closest?.('.field-help'));
};

// Close only when the backdrop itself was clicked. Descendant clicks remain
// inside the modal even if a nested control forgets to stop propagation.
export const isDirectBackdropClick = (event) =>
  Boolean(event && event.target === event.currentTarget);
