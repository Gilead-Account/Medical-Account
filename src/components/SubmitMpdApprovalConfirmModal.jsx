import { useEffect } from 'react';
import '@/styles/edit-modal.css';

export default function SubmitMpdApprovalConfirmModal({ isSubmitting = false, error = '', onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape' && !isSubmitting) onCancel?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isSubmitting, onCancel]);

  return (
    <div
      className="stakeholder-edit-overlay submit-mpd-approval-overlay"
      onClick={isSubmitting ? undefined : onCancel}
      role="presentation"
    >
      <section
        className="stakeholder-edit-modal submit-mpd-approval-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="submitMrdApprovalConfirmTitle"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="stakeholder-edit-head">
          <div className="stakeholder-edit-title">
            <h3 id="submitMrdApprovalConfirmTitle">Submit for FD Approval?</h3>
            <p>Confirm that you want to submit this account plan for FD approval.</p>
          </div>
          <button
            type="button"
            className="stakeholder-edit-close"
            onClick={onCancel}
            aria-label="Close"
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="stakeholder-edit-button-primary"
            onClick={onConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </footer>
      </section>
    </div>
  );
}
