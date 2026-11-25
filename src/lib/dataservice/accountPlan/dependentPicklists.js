import { getObjectMetadata } from '@/lib/dataservice/query';

const FIELD_NAME_KEYS = ['name', 'apiName', 'fieldApiName', 'fieldName', 'fullName', 'qualifiedApiName'];
const PICKLIST_KEYS = ['picklistValues', 'values', 'entries', 'picklistEntries', 'value'];
const loggedDependencyProbes = new Set();
const loggedFieldMetadataProbes = new Set();

const BARRIER_DRIVER_INDICATION_FIELD = 'KPH_Indication__c';

const unwrapMetadataPayload = (metadata) => {
  if (!metadata || typeof metadata !== 'object') return metadata;
  return metadata.data || metadata.response || metadata;
};

const normalizeKey = (value) => String(value || '').trim().toUpperCase();

const metadataFieldName = (field) => {
  if (!field || typeof field !== 'object') return '';
  for (const key of FIELD_NAME_KEYS) {
    if (field[key]) return String(field[key]).trim();
  }
  return '';
};

const findFieldMetadata = (root, fieldApi, depth = 0, seen = new Set()) => {
  if (!root || typeof root !== 'object' || depth > 10 || seen.has(root)) return null;
  seen.add(root);

  if (!Array.isArray(root)) {
    if (root[fieldApi] && typeof root[fieldApi] === 'object') return root[fieldApi];
    if (metadataFieldName(root) === fieldApi) return root;
  }

  if (Array.isArray(root)) {
    for (const item of root) {
      const found = findFieldMetadata(item, fieldApi, depth + 1, seen);
      if (found) return found;
    }
    return null;
  }

  for (const value of Object.values(root)) {
    const found = findFieldMetadata(value, fieldApi, depth + 1, seen);
    if (found) return found;
  }
  return null;
};

const logFieldMetadataProbe = ({ objectApi, fieldApi, metadata }) => {
  if (fieldApi !== BARRIER_DRIVER_INDICATION_FIELD) return;

  const key = `${objectApi}.${fieldApi}`;
  if (loggedFieldMetadataProbes.has(key)) return;
  loggedFieldMetadataProbes.add(key);

  const payload = unwrapMetadataPayload(metadata);
  const fieldMetadata = findFieldMetadata(payload, fieldApi);

  console.info(`[metadata probe] ${objectApi}.${fieldApi}`, {
    fieldMetadata: fieldMetadata || null,
    rawObjectMetadata: metadata || null,
  });
};

const normalizeEntryList = (source) => {
  if (!source) return [];
  if (Array.isArray(source)) return source.filter(Boolean);
  if (typeof source !== 'object') return [];
  return Object.entries(source).map(([value, entry]) => {
    if (entry && typeof entry === 'object') return { value, ...entry };
    return { value, label: entry };
  });
};

const picklistEntries = (fieldMetadata) => {
  if (!fieldMetadata || typeof fieldMetadata !== 'object') return [];
  const candidates = [
    ...PICKLIST_KEYS.map((key) => fieldMetadata[key]),
    fieldMetadata.valueSet?.values,
    fieldMetadata.valueSet?.value,
    fieldMetadata.valueSet?.valueSetDefinition?.value,
    fieldMetadata.valueSetDefinition?.value,
  ];
  for (const candidate of candidates) {
    const entries = normalizeEntryList(candidate);
    if (entries.length) return entries;
  }
  return [];
};

const entryValue = (entry) => {
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  if (typeof entry !== 'object') return '';
  return (
    entry.apiValue ||
    entry.apiName ||
    entry.fullName ||
    entry.name ||
    entry.value ||
    entry.label ||
    ''
  );
};

const entryValidFor = (entry) => {
  if (!entry || typeof entry !== 'object') return undefined;
  return entry.validFor ?? entry.valid_for ?? entry.validForValues ?? entry.controllerValues;
};

const controllerValuesFromMetadata = (targetMetadata, controllingMetadata) => {
  const explicit = targetMetadata?.controllerValues || targetMetadata?.controllingValues;
  if (Array.isArray(explicit)) {
    return explicit.map((value, index) => ({ value, index })).filter((entry) => entry.value);
  }
  if (explicit && typeof explicit === 'object') {
    return Object.entries(explicit).map(([value, index]) => ({ value, index }));
  }
  return picklistEntries(controllingMetadata)
    .map((entry, index) => ({ value: entryValue(entry), index }))
    .filter((entry) => entry.value);
};

const decodeBase64Bytes = (value) => {
  try {
    if (typeof globalThis.atob === 'function') {
      return Array.from(globalThis.atob(value), (char) => char.charCodeAt(0));
    }
    if (typeof Buffer !== 'undefined') {
      return Array.from(Buffer.from(value, 'base64'));
    }
  } catch {
    return [];
  }
  return [];
};

const validForIncludesIndex = (validFor, index) => {
  const bytes = decodeBase64Bytes(validFor);
  if (!bytes.length || index === undefined || index === null || Number.isNaN(Number(index))) return false;
  const byteIndex = Math.floor(Number(index) / 8);
  const bitIndex = 7 - (Number(index) % 8);
  const byte = bytes[byteIndex];
  return !!(byte & (1 << bitIndex));
};

const validForAllowsController = (validFor, controllerValue, controllerIndex) => {
  if (validFor === undefined || validFor === null || validFor === '') return false;
  if (Array.isArray(validFor)) {
    return validFor.some((entry) =>
      normalizeKey(entry) === normalizeKey(controllerValue) ||
      String(entry) === String(controllerIndex)
    );
  }
  if (typeof validFor === 'object') {
    if (validFor[controllerValue] === true) return true;
    const normalized = normalizeKey(controllerValue);
    return Object.entries(validFor).some(([key, allowed]) => allowed === true && normalizeKey(key) === normalized);
  }
  const asString = String(validFor).trim();
  if (!asString) return false;
  if (normalizeKey(asString) === normalizeKey(controllerValue)) return true;
  if (asString.includes(',') || asString.includes(';')) {
    return asString
      .split(/[;,]/)
      .map((part) => part.trim())
      .some((part) => normalizeKey(part) === normalizeKey(controllerValue) || part === String(controllerIndex));
  }
  return validForIncludesIndex(asString, controllerIndex);
};

export const dependencyOptionsFromMetadata = ({
  metadata,
  objectApi,
  fieldApi,
  controllingFieldApi,
  allOptions = [],
}) => {
  const payload = unwrapMetadataPayload(metadata);
  const targetMetadata = findFieldMetadata(payload, fieldApi);
  const controllingMetadata = findFieldMetadata(payload, controllingFieldApi);
  const entries = picklistEntries(targetMetadata);
  const controllers = controllerValuesFromMetadata(targetMetadata, controllingMetadata);
  if (!targetMetadata || !entries.length || !controllers.length) return null;

  const allowedOptionSet = new Set((allOptions || []).filter(Boolean));
  const filteredEntries = allowedOptionSet.size
    ? entries.filter((entry) => allowedOptionSet.has(entryValue(entry)))
    : entries;
  const optionsByController = {};
  let mappedCount = 0;

  for (const entry of filteredEntries) {
    const value = entryValue(entry);
    const validFor = entryValidFor(entry);
    if (!value || validFor === undefined) continue;
    for (const controller of controllers) {
      if (!validForAllowsController(validFor, controller.value, controller.index)) continue;
      if (!optionsByController[controller.value]) optionsByController[controller.value] = [];
      if (!optionsByController[controller.value].includes(value)) {
        optionsByController[controller.value].push(value);
        mappedCount += 1;
      }
    }
  }

  if (!mappedCount) return null;
  return optionsByController;
};

export const optionsForControllerValue = (optionsByController = {}, controllerValue) => {
  const exact = optionsByController?.[controllerValue];
  if (exact && exact.length) return exact;
  const normalized = normalizeKey(controllerValue);
  const key = Object.keys(optionsByController || {}).find((candidate) => normalizeKey(candidate) === normalized);
  return key ? optionsByController[key] : null;
};

export const fetchDependencyOptionsFromObjectMetadata = async ({
  objectApi,
  fieldApi,
  controllingFieldApi,
  allOptions = [],
}) => {
  const metadata = await getObjectMetadata(objectApi);
  logFieldMetadataProbe({ objectApi, fieldApi: controllingFieldApi, metadata });

  const optionsByController = dependencyOptionsFromMetadata({
    metadata,
    objectApi,
    fieldApi,
    controllingFieldApi,
    allOptions,
  });
  if (optionsByController) return optionsByController;

  if (!optionsByController) {
    const key = `${objectApi}.${fieldApi}.${controllingFieldApi}`;
    if (!loggedDependencyProbes.has(key)) {
      loggedDependencyProbes.add(key);
      console.info(
        `[barriersDrivers] getObjectMetadata did not expose usable dependent picklist data for ${fieldApi} controlled by ${controllingFieldApi}.`,
        { objectApi, fieldApi, controllingFieldApi, metadata }
      );
    }
  }
  return {};
};
