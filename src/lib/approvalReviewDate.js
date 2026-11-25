const acceptedStatus = (value) =>
  ['approved', 'accepted'].includes(String(value || '').trim().toLowerCase());

const isoDatePart = (value) => {
  const match = String(value || '').match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
};

// The explicit CRM review date is authoritative. If an approval was accepted
// outside this UI before that field was populated, LastModifiedDate is the
// closest available timestamp for the acceptance and keeps Last FD Review
// from remaining blank.
export const acceptedApprovalReviewDate = (
  approvalStatus,
  reviewDate,
  lastModifiedDate
) => {
  const explicitDate = isoDatePart(reviewDate);
  if (explicitDate) return explicitDate;
  return acceptedStatus(approvalStatus) ? isoDatePart(lastModifiedDate) : null;
};
