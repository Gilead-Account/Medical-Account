import { Fragment, useEffect, useRef, useState } from 'react';
import { FieldHelpButton } from '@/components/EditModalField';
import HomeFieldHelp from '@/components/HomeFieldHelp';
import { formatDate } from '@/lib/helper/utils';
import {
  isSubmittedForApprovalStatus,
  SUBMITTED_FOR_APPROVAL_STATUS,
} from '@/lib/accountPlanReadOnly';
import { deliverPreparedAccountPlanPdf } from '@/lib/export/accountPlanPdf';
import { PDF_MIME } from '@/lib/export/accountPlanPdfRenderer';
import PdfAllPagesViewer from '@/components/PdfAllPagesViewer';
import accountPlanUserGuidePdf from '@/assets/account-plan-user-guide.pdf?url';
import accountPlanLegalCompliancePdf from '@/assets/account-plan-legal-compliance-guidance.pdf?url';
import '@/styles/edit-modal.css';
import '@/components/Sidebar.css';

const EXPORT_MENU_OPTIONS = [
  { key: 'submit-mpd-approval', label: 'Submit for FD Approval', section: 'approval' },
  { key: 'approval-history', label: 'Approval History', section: 'approval', approvalHistoryOnly: true },
  { key: 'export-ppt', label: 'Export to PPT', section: 'export' },
];

const EXPORT_MENU_SECTIONS = [
  { key: 'approval', label: 'Approval' },
  { key: 'export', label: 'Export' },
];

const COMPLIANCE_REMINDERS = [
  { text: 'This information is confidential and may not be disclosed externally.' },
  { text: 'For internal strategic planning purposes only.' },
  {
    text: 'Functions may align at a high level but remain responsible for their own tactics and must not direct or influence other functions.',
  },
  { text: 'All activities must comply with applicable legal, regulatory, and policy requirements.' },
  {
    text: 'For full compliance guidance, please refer to ',
    linkLabel: 'Compliance Atlas',
    linkUrl: 'https://gileadcomplianceatlas.com/kite',
  },
];

const HELP_GUIDANCE = [
  { text: 'Account Plan User Guide', opensUserGuide: true },
  { text: 'Account Plan Legal & Compliance Guidance', opensComplianceGuidance: true },
];


const HELP_AND_GUARDRAILS_INLINE_HELP = 'Help: User Guide';

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3.5" y="5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3.5v3M16 3.5v3" strokeLinecap="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="8.5" />
      <ellipse cx="12" cy="12" rx="4" ry="8.5" />
      <path d="M3.5 12h17" />
    </svg>
  );
}

function NavIcon({ pageKey }) {
  switch (pageKey) {
    case 'overview':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M4 11.5 12 4l8 7.5" />
          <path d="M6.5 10.5V20h11v-9.5" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    case 'barriers-drivers':
      // Opposing forces: an up arrow (driver) and a down arrow (barrier).
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M8 20V6" />
          <path d="M5 9l3-3 3 3" />
          <path d="M16 4v14" />
          <path d="M13 15l3 3 3-3" />
        </svg>
      );
    case 'critical-activities':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect x="4.5" y="4.5" width="15" height="15" rx="3" />
          <path d="m8 12.5 3 3 5-7" />
        </svg>
      );
    case 'kpi':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="8" r="3.2" />
          <path d="M6.5 19c.7-3.2 2.6-5 5.5-5s4.8 1.8 5.5 5" />
        </svg>
      );
    case 'stakeholders':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="9" cy="9" r="2.6" />
          <circle cx="16" cy="10" r="2.2" />
          <path d="M4.5 18c.7-3 2.2-4.5 4.5-4.5s3.8 1.5 4.5 4.5" />
          <path d="M13.5 17.5c.5-2 1.6-3.1 3.3-3.1 1.5 0 2.6 1 3.2 3.1" />
        </svg>
      );
    case 'team-members':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect x="5" y="5" width="14" height="14" rx="2.5" />
          <path d="M9 9h.01" />
          <path d="M15 9h.01" />
          <path d="M9 15h.01" />
          <path d="M15 15h.01" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
  }
}

const COMPLIANCE_PDF_TITLE = 'Account Plan Legal & Compliance Guidance';
const COMPLIANCE_PDF_FILE_NAME = 'Account-Plan-Legal-Compliance-Guidance.pdf';
const USER_GUIDE_PDF_TITLE = 'Account Plan User Guide';
const USER_GUIDE_PDF_FILE_NAME = 'Account-Plan-User-Guide.pdf';

const loadPdfBlob = async (src) => {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`Unable to load PDF (${response.status}).`);
  }
  const sourceBlob = await response.blob();
  if (!sourceBlob.size) {
    throw new Error('The PDF file is empty.');
  }
  if (sourceBlob.type === PDF_MIME) return sourceBlob;
  return new Blob([await sourceBlob.arrayBuffer()], { type: PDF_MIME });
};

function UserGuidePdfModal({ onClose }) {
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const handleSavePdf = async () => {
    if (isSavingPdf) return;
    setIsSavingPdf(true);
    setSaveError('');
    try {
      const blob = await loadPdfBlob(accountPlanUserGuidePdf);
      await deliverPreparedAccountPlanPdf({
        blob,
        fileName: USER_GUIDE_PDF_FILE_NAME,
        pageCount: null,
        slideCount: null,
        title: USER_GUIDE_PDF_TITLE,
      }, {
        directShare: true,
      });
    } catch (error) {
      setSaveError(error?.message || 'Unable to save PDF.');
    } finally {
      setIsSavingPdf(false);
    }
  };

  return (
    <div className="bd-reference-pdf-overlay" onClick={onClose} role="presentation">
      <section
        className="bd-reference-pdf-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="userGuidePdfTitle"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="bd-reference-pdf-head">
          <h3 id="userGuidePdfTitle">{USER_GUIDE_PDF_TITLE}</h3>
          <div className="bd-reference-pdf-actions">
            <button
              type="button"
              className="button secondary bd-reference-pdf-save"
              onClick={handleSavePdf}
              disabled={isSavingPdf}
            >
              {isSavingPdf ? 'Saving PDF...' : 'Save PDF'}
            </button>
            <button
              type="button"
              className="bd-reference-pdf-close"
              onClick={onClose}
              aria-label={`Close ${USER_GUIDE_PDF_TITLE} PDF`}
            />
          </div>
        </header>
        {saveError && (
          <div className="bd-reference-pdf-error" role="alert">
            {saveError}
          </div>
        )}
        <div className="bd-reference-pdf-body">
          <PdfAllPagesViewer
            src={accountPlanUserGuidePdf}
            className="user-guide-pdf-viewer"
          />
        </div>
      </section>
    </div>
  );
}

function ComplianceGuidanceModal({ onClose }) {
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const handleSavePdf = async () => {
    if (isSavingPdf) return;
    setIsSavingPdf(true);
    setSaveError('');
    try {
      const blob = await loadPdfBlob(accountPlanLegalCompliancePdf);
      await deliverPreparedAccountPlanPdf({
        blob,
        fileName: COMPLIANCE_PDF_FILE_NAME,
        pageCount: null,
        slideCount: null,
        title: COMPLIANCE_PDF_TITLE,
      }, {
        directShare: true,
      });
    } catch (error) {
      setSaveError(error?.message || 'Unable to save PDF.');
    } finally {
      setIsSavingPdf(false);
    }
  };

  return (
    <div className="bd-reference-pdf-overlay" onClick={onClose} role="presentation">
      <section
        className="bd-reference-pdf-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="complianceGuidanceTitle"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="bd-reference-pdf-head">
          <h3 id="complianceGuidanceTitle">{COMPLIANCE_PDF_TITLE}</h3>
          <div className="bd-reference-pdf-actions">
            <button
              type="button"
              className="button secondary bd-reference-pdf-save"
              onClick={handleSavePdf}
              disabled={isSavingPdf}
            >
              {isSavingPdf ? 'Saving PDF...' : 'Save PDF'}
            </button>
            <button
              type="button"
              className="bd-reference-pdf-close"
              onClick={onClose}
              aria-label={`Close ${COMPLIANCE_PDF_TITLE} PDF`}
            />
          </div>
        </header>
        {saveError && (
          <div className="bd-reference-pdf-error" role="alert">
            {saveError}
          </div>
        )}
        <div className="bd-reference-pdf-body">
          <PdfAllPagesViewer
            src={accountPlanLegalCompliancePdf}
            className="compliance-pdf-viewer"
          />
        </div>
      </section>
    </div>
  );
}

export default function Sidebar({
  pages,
  activeKey,
  onNavigate,
  onPreloadPage,
  onExportPpt,
  onPrepareExports,
  onSubmitMpdApproval,
  onApproveAccountPlan,
  onApprovalHistory,
  canApproveAccountPlan = false,
  canViewApprovalHistory = false,
  isAccountPlanReviewer = false,
  isApprovingAccountPlan = false,
  isMpdApprovalDisabled = false,
  isExportingPpt = false,
  isPreparingPpt = false,
  isMrdApprovalPending = false,
  plan,
  account,
}) {
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isPolicyHelpOpen, setIsPolicyHelpOpen] = useState(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState(false);
  const [isComplianceGuidanceOpen, setIsComplianceGuidanceOpen] = useState(false);
  const exportMenuRef = useRef(null);
  const policyHelpRef = useRef(null);
  const navPressRef = useRef(null);
  const lastPointerNavigationRef = useRef({ key: null, at: 0 });
  const accountPlanName =
    (plan && plan.name) ||
    (plan && plan.accountName) ||
    (account && account.name) ||
    'Not entered';
  const eid = plan && plan.eid;
  const lastFieldDirectorReviewValue = isSubmittedForApprovalStatus(plan?.approvalStatus)
    ? SUBMITTED_FOR_APPROVAL_STATUS
    : formatDate(plan && plan.lastFieldDirectorReviewDate, 'Not entered');
  const territory = (plan && plan.territoryDescription) || (account && account.territory);

  // Close the export dropdown when the user taps outside of it.
  useEffect(() => {
    if (!isExportMenuOpen) return;
    const onDocPointer = (event) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDocPointer);
    return () => document.removeEventListener('pointerdown', onDocPointer);
  }, [isExportMenuOpen]);

  useEffect(() => {
    if (!isPolicyHelpOpen) return;
    const onDocPointer = (event) => {
      if (policyHelpRef.current && !policyHelpRef.current.contains(event.target)) {
        setIsPolicyHelpOpen(false);
      }
    };
    document.addEventListener('pointerdown', onDocPointer, true);
    return () => document.removeEventListener('pointerdown', onDocPointer, true);
  }, [isPolicyHelpOpen]);

  const visibleExportMenuOptions = EXPORT_MENU_OPTIONS.filter((option) => {
    if (
      option.key === 'submit-mpd-approval' &&
      (isMpdApprovalDisabled || isAccountPlanReviewer || isMrdApprovalPending)
    ) return false;
    if (option.approvalHistoryOnly && !canViewApprovalHistory) return false;
    return true;
  });
  const visibleExportMenuSections = EXPORT_MENU_SECTIONS
    .map((section) => ({
      ...section,
      options: visibleExportMenuOptions.filter((option) => option.section === section.key),
    }))
    .filter((section) => section.options.length > 0);

  const handleExportOption = (option) => {
    if (
      option.key === 'submit-mpd-approval' &&
      (isMrdApprovalPending || isMpdApprovalDisabled)
    ) return;
    setIsExportMenuOpen(false);
    if (option.key === 'submit-mpd-approval' && onSubmitMpdApproval) {
      onSubmitMpdApproval();
      return;
    }
    if (option.key === 'approval-history') {
      onApprovalHistory?.();
      return;
    }
    if (option.key === 'export-ppt' && onExportPpt) {
      onExportPpt();
      return;
    }
  };

  const togglePolicyHelp = () => {
    setIsPolicyHelpOpen((v) => !v);
    setIsExportMenuOpen(false);
  };

  const navigateToPage = (page, source = 'click') => {
    const now = Date.now();
    if (
      source === 'click' &&
      lastPointerNavigationRef.current.key === page.key &&
      now - lastPointerNavigationRef.current.at < 650
    ) {
      return;
    }
    if (source === 'pointer') {
      lastPointerNavigationRef.current = { key: page.key, at: now };
    }
    setIsPolicyHelpOpen(false);
    onNavigate(page.key);
  };

  const choosePage = (page) => {
    navigateToPage(page, 'click');
  };

  const handleNavPointerDown = (event, page) => {
    if (event.button !== undefined && event.button !== 0) return;
    onPreloadPage?.(page.key);
    navPressRef.current = {
      pointerId: event.pointerId,
      key: page.key,
      x: event.clientX,
      y: event.clientY,
    };
  };

  const handleNavPointerUp = (event, page) => {
    const press = navPressRef.current;
    navPressRef.current = null;
    if (!press || press.pointerId !== event.pointerId || press.key !== page.key) return;
    const distance = Math.hypot(event.clientX - press.x, event.clientY - press.y);
    if (distance > 14) return;
    navigateToPage(page, 'pointer');
  };

  const handleNavPointerCancel = (event) => {
    if (navPressRef.current?.pointerId === event.pointerId) {
      navPressRef.current = null;
    }
  };

  return (
    <aside className="shell-sidebar">
      <section className="sidebar-account-card">
        {/* Account header — name spans the full card width (no icon) and can
            wrap to 2 lines. EID sits below the name with an "EID" label. */}
        <div className="sidebar-account-card-head">
          <div className="sidebar-account-card-copy">
            <strong title={accountPlanName}>{accountPlanName}</strong>
            {eid && (
              <div className="sidebar-account-eid-row">
                <span>EID:</span>
                <small>{eid}</small>
              </div>
            )}
          </div>
        </div>

        {/* Last FD Review + Territory stacked vertically. */}
        <div className="sidebar-stat-card">
          <span className="sidebar-stat-icon" aria-hidden="true">
            <CalendarIcon />
          </span>
          <div className="sidebar-stat-copy">
            <span className="sidebar-stat-label">
              <span>Last FD Review</span>
              <HomeFieldHelp
                helpKey="lastFieldDirectorReviewDate"
                label="Last FD Review"
                className="sidebar-stat-help"
              />
            </span>
            <strong>{lastFieldDirectorReviewValue}</strong>
          </div>
        </div>

        <div className="sidebar-stat-card">
          <span className="sidebar-stat-icon" aria-hidden="true">
            <GlobeIcon />
          </span>
          <div className="sidebar-stat-copy">
            <span>TERRITORY</span>
            <strong title={territory || ''}>{territory || 'Not entered'}</strong>
          </div>
        </div>
      </section>

      <div className="sidebar-nav-list">
        {pages.map((page) => {
          const isActive = page.key === activeKey;
          return (
            <button
              key={page.key}
              type="button"
              className={`rail-link${isActive ? ' active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onPointerDown={(event) => handleNavPointerDown(event, page)}
              onPointerUp={(event) => handleNavPointerUp(event, page)}
              onPointerCancel={handleNavPointerCancel}
              onMouseEnter={() => onPreloadPage?.(page.key)}
              onClick={() => choosePage(page)}
              title={page.label}
            >
              <span
                className={`nav-icon nav-icon-${page.key}`}
                aria-hidden="true"
              >
                <NavIcon pageKey={page.key} />
              </span>
              <span className="rail-copy">
                <strong>{page.label}</strong>
              </span>
            </button>
          );
        })}
      </div>

      {canApproveAccountPlan && (
        <button
          type="button"
          className="sidebar-approve-plan-button"
          onClick={onApproveAccountPlan}
          disabled={isApprovingAccountPlan}
        >
          <span>{isApprovingAccountPlan ? 'Approving...' : 'Approve'}</span>
        </button>
      )}

      <div className="sidebar-policy-help" ref={policyHelpRef}>
        <div className={`sidebar-policy-help-button${isPolicyHelpOpen ? ' is-open' : ''}`}>
          <button
            type="button"
            className="sidebar-policy-help-trigger"
            aria-expanded={isPolicyHelpOpen}
            aria-controls="sidebar-policy-help-popover"
            aria-describedby={isPolicyHelpOpen ? 'sidebar-policy-help-popover' : undefined}
            onClick={togglePolicyHelp}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setIsPolicyHelpOpen(false);
              }
            }}
          >
            <span className="sidebar-policy-help-copy">
              <strong>Help &amp; Compliance Reminder</strong>
            </span>
          </button>
          <span
            className="sidebar-policy-help-inline-help-shell"
            onClickCapture={() => setIsPolicyHelpOpen(false)}
          >
            <FieldHelpButton
              className="sidebar-policy-help-inline-help"
              label="Help and Compliance Reminder guidance"
              text={HELP_AND_GUARDRAILS_INLINE_HELP}
            />
          </span>
        </div>
        {isPolicyHelpOpen && (
          <div
            id="sidebar-policy-help-popover"
            className="sidebar-policy-help-popover"
            role="tooltip"
          >
            <strong>Help &amp; Compliance Reminder</strong>
            <div className="sidebar-policy-help-sections">
              <section className="sidebar-policy-help-section is-guardrails">
                <h4>Compliance Reminder</h4>
                <ul>
                  {COMPLIANCE_REMINDERS.map((item) => (
                    <li key={item.text}>
                      {item.text}
                      {item.linkUrl && (
                        <a href={item.linkUrl} target="_blank" rel="noopener noreferrer">
                          {item.linkLabel}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="sidebar-policy-help-section is-help">
                <h4>Documents &amp; Guides</h4>
                <ul>
                  {HELP_GUIDANCE.map((item) => (
                    <li key={item.text}>
                      {item.opensUserGuide ? (
                        <button
                          type="button"
                          className="sidebar-policy-help-link"
                          onClick={() => {
                            setIsUserGuideOpen(true);
                            setIsPolicyHelpOpen(false);
                          }}
                        >
                          {item.text}
                        </button>
                      ) : item.opensComplianceGuidance ? (
                        <button
                          type="button"
                          className="sidebar-policy-help-link"
                          onClick={() => {
                            setIsComplianceGuidanceOpen(true);
                            setIsPolicyHelpOpen(false);
                          }}
                        >
                          {item.text}
                        </button>
                      ) : (
                        item.text
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        )}
      </div>

      {/* Export / Submit FD dropdown — opens upward (drop-up) so the
          options aren't clipped by the bottom of the sidebar. */}
      <div className="sidebar-export-menu" ref={exportMenuRef}>
        <button
          type="button"
          className="sidebar-export-button"
          aria-haspopup="menu"
          aria-expanded={isExportMenuOpen}
          onClick={() => {
            setIsExportMenuOpen((v) => {
              const next = !v;
              if (next) onPrepareExports?.();
              return next;
            });
            setIsPolicyHelpOpen(false);
          }}
        >
          <span>Export / Submit FD</span>
          <span className="sidebar-export-caret" aria-hidden="true">
            <svg className="sidebar-export-caret-icon" viewBox="0 0 16 16" focusable="false">
              {isExportMenuOpen ? (
                <path d="M5 3.5 12.5 8 5 12.5z" />
              ) : (
                <path d="M3.5 10.5 8 3.5l4.5 7z" />
              )}
            </svg>
          </span>
        </button>
        {isExportMenuOpen && (
          <ul className="sidebar-export-options" role="menu">
            {visibleExportMenuSections.map((section) => (
              <Fragment key={section.key}>
                <li className="sidebar-export-section-label" role="presentation">
                  {section.label}
                </li>
                {section.options.map((option) => (
                  <li key={option.key} role="none">
                    <button
                      type="button"
                      role="menuitem"
                      className="sidebar-export-option"
                      disabled={
                        (option.key === 'submit-mpd-approval' && isMrdApprovalPending)
                        || (option.key === 'export-ppt' && (isExportingPpt || isPreparingPpt))
                      }
                      title={
                        option.key === 'submit-mpd-approval' && isMrdApprovalPending
                          ? 'Submitted for Approval — awaiting manager approval'
                          : option.label
                      }
                      onClick={() => handleExportOption(option)}
                    >
                      {option.key === 'export-ppt' && isExportingPpt
                        ? 'Generating PPT...'
                        : option.key === 'export-ppt' && isPreparingPpt
                          ? 'Preparing PPT...'
                          : option.label}
                    </button>
                  </li>
                ))}
              </Fragment>
            ))}
          </ul>
        )}
      </div>
      {isUserGuideOpen && (
        <UserGuidePdfModal onClose={() => setIsUserGuideOpen(false)} />
      )}
      {isComplianceGuidanceOpen && (
        <ComplianceGuidanceModal onClose={() => setIsComplianceGuidanceOpen(false)} />
      )}
    </aside>
  );
}
