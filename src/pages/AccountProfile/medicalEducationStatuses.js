const optionValue = (option) => String(option?.value ?? option ?? '');

export const medicalEducationValueFromStatuses = (
  options = [],
  statusItems = [],
  values = {}
) => {
  const statusItemByOption = new Map(
    statusItems.map((statusItem) => [statusItem.parentOption, statusItem])
  );
  return options
    .map(optionValue)
    .filter((educationValue) => {
      const statusItem = statusItemByOption.get(educationValue);
      return statusItem && String(values[statusItem.key] ?? '').trim() !== '';
    })
    .join(';');
};
