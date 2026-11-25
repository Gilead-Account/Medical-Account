const MOCK_RECORD_OVERRIDES_KEY = 'medicalv1:mock-record-overrides';
const MOCK_CREATED_RECORDS_KEY = 'medicalv1:mock-created-records';
const MOCK_DELETED_RECORDS_KEY = 'medicalv1:mock-deleted-records';

const browserStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

const readOverrides = (storage) => {
  if (!storage) return {};
  try {
    const parsed = JSON.parse(storage.getItem(MOCK_RECORD_OVERRIDES_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const readObjectMap = (storage, key) => {
  if (!storage) return {};
  try {
    const parsed = JSON.parse(storage.getItem(key) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeObjectMap = (storage, key, value) => {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage can be unavailable or full in restricted browser contexts.
  }
};

export const persistMockRecordUpdate = (object, id, fields, storage = browserStorage()) => {
  if (!storage || !object || !id) return;
  try {
    const overrides = readOverrides(storage);
    const objectOverrides = overrides[object] || {};
    const recordOverrides = objectOverrides[id] || {};
    storage.setItem(MOCK_RECORD_OVERRIDES_KEY, JSON.stringify({
      ...overrides,
      [object]: {
        ...objectOverrides,
        [id]: { ...recordOverrides, ...(fields || {}) },
      },
    }));
  } catch {
    // localStorage can be unavailable in private/restricted browser contexts.
  }
};

export const clearPersistedMockRecordFields = (
  object,
  id,
  fields,
  storage = browserStorage()
) => {
  if (!storage || !object || !id || !Array.isArray(fields) || !fields.length) return;
  try {
    const overrides = readOverrides(storage);
    const objectOverrides = overrides[object];
    const recordOverrides = objectOverrides?.[id];
    if (!recordOverrides || typeof recordOverrides !== 'object') return;

    const nextRecord = { ...recordOverrides };
    for (const field of fields) delete nextRecord[field];
    const nextObject = { ...objectOverrides };
    if (Object.keys(nextRecord).length) nextObject[id] = nextRecord;
    else delete nextObject[id];

    const nextOverrides = { ...overrides };
    if (Object.keys(nextObject).length) nextOverrides[object] = nextObject;
    else delete nextOverrides[object];
    storage.setItem(MOCK_RECORD_OVERRIDES_KEY, JSON.stringify(nextOverrides));
  } catch {
    // Demo reset is best-effort when storage is restricted.
  }
};

export const applyPersistedMockRecord = (object, row, storage = browserStorage()) => {
  const id = row?.Id?.value ?? row?.Id;
  if (!id) return row;
  const fields = readOverrides(storage)?.[object]?.[id];
  if (!fields || typeof fields !== 'object') return row;

  const wrappedFields = Object.fromEntries(
    Object.entries(fields).map(([field, value]) => [field, { value }])
  );
  return { ...row, ...wrappedFields };
};

export const persistMockRecordCreation = (object, id, fields, storage = browserStorage()) => {
  if (!storage || !object || !id) return;
  const records = readObjectMap(storage, MOCK_CREATED_RECORDS_KEY);
  writeObjectMap(storage, MOCK_CREATED_RECORDS_KEY, {
    ...records,
    [object]: {
      ...(records[object] || {}),
      [id]: { Id: id, ...(fields || {}) },
    },
  });
};

export const persistedMockRecords = (object, storage = browserStorage()) => {
  const records = readObjectMap(storage, MOCK_CREATED_RECORDS_KEY)?.[object] || {};
  return Object.values(records).filter((record) => record && record.Id);
};

export const persistMockRecordDeletion = (object, id, storage = browserStorage()) => {
  if (!storage || !object || !id) return;
  const deleted = readObjectMap(storage, MOCK_DELETED_RECORDS_KEY);
  writeObjectMap(storage, MOCK_DELETED_RECORDS_KEY, {
    ...deleted,
    [object]: {
      ...(deleted[object] || {}),
      [id]: true,
    },
  });
};

export const isPersistedMockRecordDeleted = (object, id, storage = browserStorage()) =>
  !!(id && readObjectMap(storage, MOCK_DELETED_RECORDS_KEY)?.[object]?.[id]);
