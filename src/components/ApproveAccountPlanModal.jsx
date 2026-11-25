import { useEffect } from 'react';
import '@/styles/edit-modal.css';

export default function ApproveAccountPlanModal({
  isApproving = false,
  error = '',
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape' && !isApproving) onCancel?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isApproving, onCancel]);

  return (
    <div
      className="stakeholder-edit-overlay submit-mpd-approval-overlay"
      onClick={isApproving ? undefined : onCancel}
      role="presentation"
    >
      <section
        className="stakeholder-edit-modal submit-mpd-approval-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="approveAccountPlanTitle"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="stakeholder-edit-head">
          <div className="stakeholder-edit-title">
            <h3 id="approveAccountPlanTitle">Approve Account Plan?</h3>
            <p>Confirm that you want to approve this account plan.</p>
          </div>
          <button
            type="button"
            className="stakeholder-edit-close"
            onClick={onCancel}
            aria-label="Close"
            disabled={isApproving}
          />
        </header>

        {error && (
          <div className="stakeholder-edit-body submit-mpd-approval-body">
            <div className="critical-activity-edit-error" role="alert">{error}</div>
          </div>
        )}

        <footer className="stakeholder-edit-foot">
          <button
            type="button"
            className="stakeholder-edit-button-secondary"
            onClick={onCancel}
            disabled={isApproving}
          >
            Cancel
          </button>
          <button
            type="button"
            className="stakeholder-edit-button-primary"
            onClick={onConfirm}
            disabled={isApproving}
          >
            {isApproving ? 'Approving...' : 'Confirm'}
          </button>
        </footer>
      </section>
    </div>
  );
}
