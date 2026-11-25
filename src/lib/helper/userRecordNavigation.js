// Hosted MyInsights uses a CDN origin; the embedding CRM referrer identifies the org.
// Native/offline runtimes have no CRM referrer and retain Veeva viewRecord navigation.
export const hostedUserRecordUrl = (recordId, referrer) => {
  if (!/^005[a-zA-Z0-9]{12}(?:[a-zA-Z0-9]{3})?$/.test(String(recordId || ''))) return null;
  try {
    const parent = new URL(referrer);
    if (parent.protocol !== 'https:' || !/(?:\.lightning\.force\.com|\.my\.salesforce\.com)$/.test(parent.hostname)) return null;
    return `${parent.origin}/lightning/r/User/${recordId}/view`;
  } catch {
    return null;
  }
};
