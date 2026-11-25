import { useCallback, useEffect, useRef, useState } from 'react';
import AccountPlanLauncher from '@/components/AccountPlanLauncher';
import ApprovalHistoryModal from '@/components/ApprovalHistoryModal';
import ApproveAccountPlanModal from '@/components/ApproveAccountPlanModal';
import Sidebar from '@/components/Sidebar';
import ExecutiveSummaryModal from '@/components/ExecutiveSummaryModal';
import LoadingScreen from '@/components/LoadingScreen';
import SubmitMpdApprovalConfirmModal from '@/components/SubmitMpdApprovalConfirmModal';
import Overview from '@/pages/Overview';
import Stakeholders from '@/pages/Stakeholders';
import TeamMembers from '@/pages/TeamMembers';
import CriticalActivities from '@/pages/CriticalActivities';
import BarriersDrivers from '@/pages/BarriersDrivers';
import AccountProfile from '@/pages/AccountProfile';
import {
  isLocalPreview,
  isMockRuntime,
  hasVeevaRuntime,
} from '@/lib/dataservice/client';
import { loadHome } from '@/lib/dataservice/accountPlan/home';
import { loadBarriersDrivers } from '@/lib/dataservice/accountPlan/barriersDrivers';
import { loadCriticalActivities } from '@/lib/dataservice/accountPlan/criticalActivities';
import { loadAccountProfile } from '@/lib/dataservice/accountPlan/accountProfile';
import { loadStakeholders } from '@/lib/dataservice/accountPlan/stakeholders';
import { loadTeamMembers, sortTeamMembersByParticipation } from '@/lib/dataservice/accountPlan/teamMembers';
import { fetchPlanApprovalStatus, getCurrentUserName } from '@/lib/dataservice/accountPlan/shared';
import { getCurrentUserProfileName } from '@/lib/dataservice/accountPlan/shared';
import { setCurrentAccountPlanIdOverride } from '@/lib/dataservice/accountPlan/shared';
import { detectRuntimeViewMode } from '@/lib/runtime/viewMode';
import {
  deliverPreparedAccountPlanPpt,
  loadAccountPlanPptData,
  prepareAccountPlanPpt,
} from '@/lib/export/accountPlanPpt';
import {
  deliverPreparedAccountPlanPdf,
  prepareAccountPlanPdf,
} from '@/lib/export/accountPlanPdf';
import { buildAccountPlanExecutiveSummary } from '@/lib/export/accountPlanExecutiveSummary';
import {
  approveAccountPlan,
  fetchAccountPlanApprovalHistory,
  submitMpdApproval,
} from '@/lib/dataservice/accountPlan/approval';
import {
  APPROVED_STATUS,
  isAccountPlanApprovalPending,
  isSubmittedForApprovalStatus,
  SUBMITTED_FOR_APPROVAL_STATUS,
} from '@/lib/accountPlanReadOnly';
import {
  canProfileApproveAccountPlan,
  canProfileViewAccountPlanApprovalHistory,
  isMpdApprovalRestrictedProfile,
} from '@/lib/approvalProfileAccess';

// Active Medical pages declare their loaders. Cached data makes navigation
// immediate while background refresh keeps Home and detail views aligned.
const PAGES = [
  { key: 'overview', label: 'Home', shortLabel: 'HM', loader: loadHome },
  { key: 'barriers-drivers', label: 'Barriers & Opportunities', shortLabel: 'BO', loader: loadBarriersDrivers },
  { key: 'critical-activities', label: 'Medical Tactics', shortLabel: 'MT', loader: loadCriticalActivities },
  { key: 'kpi', label: 'Medical Account Profile', shortLabel: 'MP', loader: loadAccountProfile },
  { key: 'stakeholders', label: 'Stakeholders', shortLabel: 'SH', loader: loadStakeholders },
  { key: 'team-members', label: 'Team Members', shortLabel: 'TM', loader: loadTeamMembers },
];

const PAGE_BY_KEY = Object.fromEntries(PAGES.map((p) => [p.key, p]));
const pageDataKey = (key) => PAGE_BY_KEY[key]?.dataKey || key;
const IPAD_CONTEXT_BUILD_MARKER = import.meta.env.VITE_DATA_MODE === 'mock'
  ? 'MIPAD-20260807.12-DESKTOP-MOCK'
  : 'MIPAD-20260807.12-DESKTOP-MOCK-LIVE';
const ipadRuntimeDiagnostic = () => {
  const diagnostic = typeof window !== 'undefined'
    ? window.__KAM_VEEVA_BOOTSTRAP__
    : null;
  if (!diagnostic) return 'Bootstrap diagnostics unavailable.';
  const final = diagnostic.final || {};
  const replay = diagnostic.replayResults?.length
    ? diagnostic.replayResults.join(', ')
    : 'not needed';
  return [
    `Q=${final.q || 'undefined'}`,
    `Utilities=${final.utilities || 'undefined'}`,
    `OnlineAPI=${final.onlineApi || 'undefined'}`,
    `DS=${final.ds || 'undefined'}`,
    `CurrentObject=${final.currentObjectMethod || 'undefined'}`,
    `Scripts=${final.runtimeScriptCount ?? 0}`,
    `Replay=${replay}`,
  ].join(' | ');
};
const ipadCurrentObjectDiagnostic = () => {
  const entries = typeof window !== 'undefined'
    ? window.__KAM_CURRENT_OBJECT_DIAGNOSTICS__
    : null;
  if (!Array.isArray(entries) || !entries.length) return 'Context calls: none recorded.';
  return `Context calls: ${entries.map((entry) => {
    if (entry.outcome === 'rejected') {
      return `${entry.object}=rejected(${entry.error || 'unknown'})`;
    }
    return `${entry.object}=resolved(ID:${entry.hasSalesforceId ? 'yes' : 'no'}; keys:${entry.keys})`;
  }).join(' | ')}`;
};
const localIsoDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const CRITICAL_ACTIVITY_CACHE_FIELDS = {
  overview: 'criticalActivities',
  'barriers-drivers': 'activities',
  'critical-activities': 'activities',
};

const TEAM_MEMBER_CACHE_FIELDS = {
  overview: 'teamMembers',
  'team-members': 'teamMembers',
};

const STARTUP_PRELOAD_DELAY_MS = 0;
const NAVIGATION_PRELOAD_DELAY_MS = 120;
const APPROVAL_STATUS_REFRESH_MS = 3000;
const APPROVAL_STATUS_RESUME_THROTTLE_MS = 1200;
const WORKSPACE_RESUME_REFRESH_THROTTLE_MS = 1200;
const EXPORT_PREPARE_IDLE_DELAY_MS = 650;
const EXPORT_PREPARE_IDLE_TIMEOUT_MS = 1600;
const STARTUP_PRELOAD_PAGE_KEYS = [
  'stakeholders',
  'team-members',
];

const mergeRecord = (rows, record) => {
  const list = rows || [];
  return list.some((row) => row && row.id === record.id)
    ? list.map((row) => (row && row.id === record.id ? record : row))
    : [record, ...list];
};

const getRuntimeViewSnapshot = () => {
  try {
    return detectRuntimeViewMode();
  } catch {
    return { viewMode: 'ipad', layoutMode: 'unknown' };
  }
};

const hasShellContext = (data) => Boolean(
  data && (
    data.plan ||
    data.account ||
    data.planId
  )
);

const resolveShellSource = (cachedPageData, activeData) =>
  cachedPageData.overview || activeData || Object.values(cachedPageData || {}).find(hasShellContext) || null;

const isMissingAccountPlanContextError = (error) =>
  /no account plan in context/i.test(String(error?.message || error || ''));

const isLocalMrdApprovalDemo = () => {
  if (!isLocalPreview || typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('reviewer')?.toLowerCase() === 'mrd';
};

export default function App() {
  const initialRuntimeModeRef = useRef(null);
  if (!initialRuntimeModeRef.current) {
    const snapshot = getRuntimeViewSnapshot();
    initialRuntimeModeRef.current = {
      snapshot,
      // Local Vite is the design/demo environment: enter the seeded medical
      // plan immediately instead of making reviewers select a plan first.
      // Packaged desktop builds retain the normal account-plan launcher.
      shouldLoadPages: isLocalPreview || snapshot.viewMode !== 'desktop',
    };
  }
  //determines the visible page and loads saved data 
  const [activeKey, setActiveKey] = useState('overview');
  const [pageData, setPageData] = useState({});
  const [pageStatus, setPageStatus] = useState(
    initialRuntimeModeRef.current.shouldLoadPages ? { overview: 'loading' } : {}
  );
  const [pageError, setPageError] = useState({});
  const [runtimeViewSnapshot, setRuntimeViewSnapshot] = useState(initialRuntimeModeRef.current.snapshot);
  const [isDesktopPlanSelected, setIsDesktopPlanSelected] = useState(initialRuntimeModeRef.current.shouldLoadPages);
  const [hasModalOpen, setHasModalOpen] = useState(false);
  const [criticalActivityToEditId, setCriticalActivityToEditId] = useState(null);
  const [criticalActivityToEditTarget, setCriticalActivityToEditTarget] = useState(null);
  const [criticalActivityEditRequest, setCriticalActivityEditRequest] = useState(0);
  const [pendingCriticalActivityNavigation, setPendingCriticalActivityNavigation] = useState(false);
  const [barriersDriversTargetTab, setBarriersDriversTargetTab] = useState('barriers');
  const [isExportingPpt, setIsExportingPpt] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pptPrepareStatus, setPptPrepareStatus] = useState('idle');
  const [pdfPrepareStatus, setPdfPrepareStatus] = useState('idle');
  const [exportNotice, setExportNotice] = useState(null);
  const [appNotice, setAppNotice] = useState(null);
  const [isExecutiveSummaryOpen, setIsExecutiveSummaryOpen] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [executiveSummaryStatus, setExecutiveSummaryStatus] = useState('idle');
  const [executiveSummaryError, setExecutiveSummaryError] = useState(null);
  const [isMpdApprovalConfirmOpen, setIsMpdApprovalConfirmOpen] = useState(false);
  const [mpdApprovalStatus, setMpdApprovalStatus] = useState('idle');
  const [mpdApprovalError, setMpdApprovalError] = useState('');
  const [isApproveAccountPlanOpen, setIsApproveAccountPlanOpen] = useState(false);
  const [isApprovingAccountPlan, setIsApprovingAccountPlan] = useState(false);
  const [approveAccountPlanError, setApproveAccountPlanError] = useState('');
  const [isApprovalHistoryOpen, setIsApprovalHistoryOpen] = useState(false);
  const [approvalHistoryEntries, setApprovalHistoryEntries] = useState([]);
  const [approvalHistoryStatus, setApprovalHistoryStatus] = useState('idle');
  const [approvalHistoryError, setApprovalHistoryError] = useState('');
  const [approvalStatusSnapshot, setApprovalStatusSnapshot] = useState(null);
  const [currentUserProfileName, setCurrentUserProfileName] = useState(null);
  const loadedRef = useRef(new Set());
  const readyPagesRef = useRef(new Set());
  const [pageRefreshing, setPageRefreshing] = useState({});
  const pageLoadPromisesRef = useRef(new Map());
  const approvalStatusRefreshRef = useRef({ inFlight: null, lastCheckedAt: 0 });
  const workspaceResumeRefreshRef = useRef(0);
  const exportManualUrlRef = useRef(null);
  const preparedPptRef = useRef(null);
  const preparedPdfRef = useRef(null);
  const pptPrepareRequestRef = useRef(0);
  const pdfPrepareRequestRef = useRef(0);
  const executiveSummaryRequestRef = useRef(0);
  const appNoticeTimerRef = useRef(null);

  const activePage = PAGE_BY_KEY[activeKey];
  const activeDataKey = pageDataKey(activeKey);
  const activeStatus = pageStatus[activeDataKey] || (activePage?.loader ? 'loading' : 'idle');
  const activeData = pageData[activeDataKey];
  const activeError = pageError[activeDataKey];

  // Sidebar always shows the plan/account header. Any loaded page can contain
  // it, so keep using cached shell data while the active page is still loading.
  const shellSource = resolveShellSource(pageData, activeData);
  const shellPlan = shellSource && shellSource.plan;
  const rawShellPlanId =
    (shellSource && shellSource.plan && shellSource.plan.id) ||
    (shellSource && shellSource.planId) ||
    (activeData && activeData.plan && activeData.plan.id) ||
    (activeData && activeData.planId) ||
    null;
  const hasLiveApprovalStatus = Boolean(
    approvalStatusSnapshot &&
    (!rawShellPlanId || approvalStatusSnapshot.planId === rawShellPlanId)
  );
  const effectiveShellPlan = shellPlan
    ? {
        ...shellPlan,
        approvalStatus: hasLiveApprovalStatus
          ? approvalStatusSnapshot.approvalStatus
          : shellPlan.approvalStatus,
        isSubmitted: hasLiveApprovalStatus ? approvalStatusSnapshot.isSubmitted : shellPlan.isSubmitted,
        submitterName: hasLiveApprovalStatus
          ? (approvalStatusSnapshot.submitterName ?? shellPlan.submitterName)
          : shellPlan.submitterName,
        lastFieldDirectorReviewDate: hasLiveApprovalStatus
          ? (approvalStatusSnapshot.lastFieldDirectorReviewDate ?? shellPlan.lastFieldDirectorReviewDate)
          : shellPlan.lastFieldDirectorReviewDate,
      }
    : (hasLiveApprovalStatus
        ? {
            id: approvalStatusSnapshot.planId,
            approvalStatus: approvalStatusSnapshot.approvalStatus,
            isSubmitted: approvalStatusSnapshot.isSubmitted,
            submitterName: approvalStatusSnapshot.submitterName || null,
            lastFieldDirectorReviewDate: approvalStatusSnapshot.lastFieldDirectorReviewDate || null,
          }
        : null);
  const effectiveShellSource = shellSource && effectiveShellPlan
    ? { ...shellSource, plan: effectiveShellPlan }
    : shellSource;
  const isMpdApprovalDisabled = isMpdApprovalRestrictedProfile(currentUserProfileName);
  const isMrdApprovalPending = isAccountPlanApprovalPending(effectiveShellPlan);
  const isAccountPlanReviewer = canProfileApproveAccountPlan(currentUserProfileName);
  const canApproveAccountPlan =
    isAccountPlanReviewer &&
    isSubmittedForApprovalStatus(effectiveShellPlan?.approvalStatus);
  const canViewApprovalHistory =
    canProfileViewAccountPlanApprovalHistory(currentUserProfileName) && Boolean(rawShellPlanId);
  const shellPlanId =
    rawShellPlanId ||
    (approvalStatusSnapshot && approvalStatusSnapshot.planId) ||
    null;
  const activeLoadingLabel = activePage?.key === 'overview'
    ? 'Account Plan'
    : activePage?.label || 'Account Plan';
  const isDesktopView = runtimeViewSnapshot?.viewMode === 'desktop';
  const shouldShowAccountPlanLauncher = isDesktopView && !isDesktopPlanSelected;
  const shouldLoadAccountPlanPages = !shouldShowAccountPlanLauncher;

  const updateCachedPageData = (key, updater) => {
    setPageData((current) => {
      const existing = current[key] || {};
      const nextValue = typeof updater === 'function' ? updater(existing) : updater;
      return {
        ...current,
        [key]: { ...existing, ...nextValue },
      };
    });
  };

  const syncCriticalActivityAcrossCaches = (activity) => {
    if (!activity?.id) return;
    setPageData((current) => {
      let changed = false;
      const next = { ...current };
      for (const [key, field] of Object.entries(CRITICAL_ACTIVITY_CACHE_FIELDS)) {
        if (!current[key]) continue;
        if (activity.isDeleted === true) {
          const rows = current[key][field] || [];
          const filtered = rows.filter((row) => !row || row.id !== activity.id);
          if (filtered.length === rows.length) continue;
          next[key] = {
            ...current[key],
            [field]: filtered,
          };
          changed = true;
          continue;
        }
        next[key] = {
          ...current[key],
          [field]: mergeRecord(current[key][field], activity),
        };
        changed = true;
      }
      return changed ? next : current;
    });
  };

  const syncTeamMemberAcrossCaches = (member) => {
    if (!member?.id) return;
    setPageData((current) => {
      let changed = false;
      const next = { ...current };
      for (const [key, field] of Object.entries(TEAM_MEMBER_CACHE_FIELDS)) {
        if (!current[key]) continue;
        const rows = current[key][field] || [];
        const hasMember = rows.some((row) => row && row.id === member.id);
        const teamMembers = hasMember
          ? rows.map((row) => (row && row.id === member.id ? { ...row, ...member } : row))
          : [member, ...rows];
        next[key] = {
          ...current[key],
          [field]: sortTeamMembersByParticipation(teamMembers),
        };
        changed = true;
      }
      return changed ? next : current;
    });
  };

  const removeTeamMemberAcrossCaches = (memberId) => {
    if (!memberId) return;
    setPageData((current) => {
      let changed = false;
      const next = { ...current };
      for (const [key, field] of Object.entries(TEAM_MEMBER_CACHE_FIELDS)) {
        if (!current[key]) continue;
        const rows = current[key][field] || [];
        const teamMembers = rows.filter((row) => !row || row.id !== memberId);
        if (teamMembers.length === rows.length) continue;
        next[key] = {
          ...current[key],
          [field]: sortTeamMembersByParticipation(teamMembers),
        };
        changed = true;
      }
      return changed ? next : current;
    });
  };

  const clearCriticalActivityEditTarget = () => {
    setCriticalActivityToEditId(null);
    setCriticalActivityToEditTarget(null);
    setPendingCriticalActivityNavigation(false);
  };

  const resetAccountPlanWorkspace = () => {
    loadedRef.current.clear();
    readyPagesRef.current.clear();
    setPageRefreshing({});
    pageLoadPromisesRef.current.clear();
    preparedPptRef.current = null;
    preparedPdfRef.current = null;
    exportManualUrlRef.current = null;
    clearCriticalActivityEditTarget();
    setActiveKey('overview');
    setBarriersDriversTargetTab('barriers');
    setPageData({});
    setPageError({});
    setApprovalStatusSnapshot(null);
    setPptPrepareStatus('idle');
    setPdfPrepareStatus('idle');
    setExportNotice(null);
    setAppNotice(null);
  };

  const handleSelectLauncherPlan = (plan) => {
    if (!plan?.id) return;
    setCurrentAccountPlanIdOverride(plan.id);
    resetAccountPlanWorkspace();
    setPageStatus({ overview: 'loading' });
    setIsDesktopPlanSelected(true);
  };

  const navigateToPage = (key) => {
    clearCriticalActivityEditTarget();
    setActiveKey(key);
  };

  const navigateToBarriersDrivers = (target) => {
    clearCriticalActivityEditTarget();
    const targetTab = target && target.type === 'Driver' ? 'drivers' : target;
    setBarriersDriversTargetTab(targetTab === 'drivers' ? 'drivers' : 'barriers');
    setActiveKey('barriers-drivers');
  };

  const navigateToCriticalActivity = (activity) => {
    const target = activity && typeof activity === 'object'
      ? {
          ...activity,
          id: activity.id || null,
          name: activity.name || null,
          dueDate: activity.dueDate || null,
        }
      : { id: activity || null, name: null, dueDate: null };
    setCriticalActivityToEditId(target.id);
    setCriticalActivityToEditTarget(target);
    setCriticalActivityEditRequest((request) => request + 1);
    setPendingCriticalActivityNavigation(true);
  };

  const clearAppNotice = () => {
    if (appNoticeTimerRef.current) {
      window.clearTimeout(appNoticeTimerRef.current);
      appNoticeTimerRef.current = null;
    }
    setAppNotice(null);
  };

  const loadPage = useCallback((key, { background = false, force = false } = {}) => {
    const page = PAGE_BY_KEY[key];
    if (!page || !page.loader) return Promise.resolve(null);
    const dataKey = pageDataKey(key);

    const existingRequest = pageLoadPromisesRef.current.get(dataKey);
    if (existingRequest && !force) return existingRequest;
    if (loadedRef.current.has(dataKey) && !force) return Promise.resolve(null);

    loadedRef.current.add(dataKey);
    setPageRefreshing((current) => ({ ...current, [dataKey]: true }));
    setPageStatus((current) => {
      if (background && readyPagesRef.current.has(dataKey)) return current;
      return { ...current, [dataKey]: 'loading' };
    });

    const request = Promise
      .resolve()
      .then(() => page.loader())
      .then((data) => {
        if (pageLoadPromisesRef.current.get(dataKey) !== request) return data;
        readyPagesRef.current.add(dataKey);
        setPageData((current) => ({ ...current, [dataKey]: data }));
        setPageStatus((current) => ({ ...current, [dataKey]: 'ready' }));
        setPageError((current) => {
          if (!Object.prototype.hasOwnProperty.call(current, dataKey)) return current;
          const next = { ...current };
          delete next[dataKey];
          return next;
        });
        return data;
      })
      .catch((error) => {
        if (pageLoadPromisesRef.current.get(dataKey) === request) {
          // A failed refresh must not discard the last successful section.
          const keepCachedPage = background && readyPagesRef.current.has(dataKey);
          if (!keepCachedPage) loadedRef.current.delete(dataKey);
          setPageError((current) => ({ ...current, [dataKey]: error }));
          setPageStatus((current) => ({ ...current, [dataKey]: keepCachedPage ? 'ready' : 'error' }));
        }
        throw error;
      })
      .finally(() => {
        if (pageLoadPromisesRef.current.get(dataKey) === request) {
          pageLoadPromisesRef.current.delete(dataKey);
          setPageRefreshing((current) => ({ ...current, [dataKey]: false }));
        }
      });

    pageLoadPromisesRef.current.set(dataKey, request);
    return request;
  }, []);

  const refreshApprovalStatus = useCallback(({ force = false } = {}) => {
    if (!shouldLoadAccountPlanPages) return Promise.resolve(null);

    const tracker = approvalStatusRefreshRef.current;
    const now = Date.now();

    if (tracker.inFlight) return tracker.inFlight;
    if (!force && now - tracker.lastCheckedAt < APPROVAL_STATUS_RESUME_THROTTLE_MS) {
      return Promise.resolve(null);
    }

    tracker.lastCheckedAt = now;
    const request = fetchPlanApprovalStatus(shellPlanId)
      .then((snapshot) => {
        if (!snapshot) return null;
        setApprovalStatusSnapshot((current) => {
          if (
            current &&
            current.planId === snapshot.planId &&
            current.approvalStatus === snapshot.approvalStatus &&
            current.isSubmitted === snapshot.isSubmitted &&
            current.lastModifiedDate === snapshot.lastModifiedDate &&
            current.lastFieldDirectorReviewDate === snapshot.lastFieldDirectorReviewDate
          ) {
            return current;
          }
          return snapshot;
        });
        return snapshot;
      })
      .catch((error) => {
        console.info('[approval-status] refresh failed', error);
        return null;
      })
      .finally(() => {
        if (tracker.inFlight === request) {
          tracker.inFlight = null;
        }
      });

    tracker.inFlight = request;
    return request;
  }, [shellPlanId, shouldLoadAccountPlanPages]);

  const refreshLoadedPages = useCallback((keys = Array.from(loadedRef.current)) => {
    const pageKeys = Array.from(new Set(keys)).filter((key) => {
      const page = PAGE_BY_KEY[key];
      return loadedRef.current.has(key) && page && page.loader;
    });

    pageKeys.forEach((key) => {
      loadPage(key, { background: true, force: true })
        .catch((error) => {
          console.warn(`[page-refresh] ${key} refresh failed`, error);
        });
    });
  }, [loadPage]);

  const showAppNotice = ({ tone = 'success', title, detail, duration = 3600, refreshPages = false } = {}) => {
    if (!title) return;
    if (appNoticeTimerRef.current) {
      window.clearTimeout(appNoticeTimerRef.current);
      appNoticeTimerRef.current = null;
    }
    setAppNotice({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      tone,
      title,
      detail,
    });
    if (duration > 0) {
      appNoticeTimerRef.current = window.setTimeout(() => {
        setAppNotice(null);
        appNoticeTimerRef.current = null;
      }, duration);
    }
    if (refreshPages) {
      refreshLoadedPages();
    }
  };

  const handleSubmitMpdApproval = () => {
    if (isMrdApprovalPending || isMpdApprovalDisabled) return;
    setMpdApprovalError('');
    setMpdApprovalStatus('idle');
    setIsMpdApprovalConfirmOpen(true);
  };

  const handleCancelMpdApprovalConfirmation = () => {
    setIsMpdApprovalConfirmOpen(false);
  };

  const handleConfirmMpdApproval = async () => {
    if (isMrdApprovalPending) {
      const message = 'This account plan is already Submitted for Approval. Wait for manager approval before submitting again.';
      setMpdApprovalError(message);
      return;
    }
    if (!shellPlanId) {
      const message = 'Missing account plan id. Reopen this MyInsights from an Account Plan record.';
      setMpdApprovalError(message);
      showAppNotice({
        tone: 'danger',
        title: 'Submit for FD approval failed.',
        detail: message,
        duration: 5200,
      });
      return;
    }

    setMpdApprovalStatus('submitting');
    setMpdApprovalError('');

    try {
      const submittedDate = localIsoDate();
      const submitterName = await getCurrentUserName();
      await submitMpdApproval({ planId: shellPlanId, submittedDate, submitterName });
      setApprovalStatusSnapshot({
        planId: shellPlanId,
        approvalStatus: SUBMITTED_FOR_APPROVAL_STATUS,
        isSubmitted: true,
        submitterName,
        submittedDate,
        lastFieldDirectorReviewDate: effectiveShellPlan?.lastFieldDirectorReviewDate || null,
        lastModifiedDate: new Date().toISOString(),
      });
      setIsMpdApprovalConfirmOpen(false);
      showAppNotice({
        title: 'FD approval submitted.',
        detail: 'The account plan is now Submitted for Approval.',
        refreshPages: true,
      });
      refreshApprovalStatus({ force: true });
    } catch (error) {
      const message = error?.message || 'Unable to submit FD approval.';
      setMpdApprovalError(message);
      showAppNotice({
        tone: 'danger',
        title: 'Submit for FD approval failed.',
        detail: message,
        duration: 5200,
      });
    } finally {
      setMpdApprovalStatus('idle');
    }
  };

  const handleOpenApproveAccountPlan = () => {
    if (!canApproveAccountPlan || isApprovingAccountPlan) return;
    setApproveAccountPlanError('');
    setIsApproveAccountPlanOpen(true);
  };

  const handleCloseApproveAccountPlan = () => {
    if (isApprovingAccountPlan) return;
    setIsApproveAccountPlanOpen(false);
    setApproveAccountPlanError('');
  };

  const handleApproveAccountPlan = async () => {
    if (!canApproveAccountPlan || !shellPlanId) return;
    setIsApprovingAccountPlan(true);
    setApproveAccountPlanError('');
    try {
      await approveAccountPlan({ planId: shellPlanId });
      setApprovalStatusSnapshot({
        planId: shellPlanId,
        approvalStatus: APPROVED_STATUS,
        isSubmitted: true,
        submitterName: null,
        lastModifiedDate: new Date().toISOString(),
      });
      setIsApproveAccountPlanOpen(false);
      showAppNotice({
        title: 'Account plan approved.',
        detail: 'The account plan is approved.',
        refreshPages: true,
      });
      refreshApprovalStatus({ force: true });
    } catch (error) {
      setApproveAccountPlanError(error?.message || 'Unable to approve account plan.');
    } finally {
      setIsApprovingAccountPlan(false);
    }
  };

  const loadApprovalHistory = async () => {
    if (!shellPlanId) return;
    setApprovalHistoryStatus('loading');
    setApprovalHistoryError('');
    try {
      const entries = await fetchAccountPlanApprovalHistory(shellPlanId);
      setApprovalHistoryEntries(entries);
      setApprovalHistoryStatus('ready');
    } catch (error) {
      setApprovalHistoryEntries([]);
      setApprovalHistoryStatus('error');
      setApprovalHistoryError(error?.message || 'Unable to load approval history.');
    }
  };

  const handleOpenApprovalHistory = () => {
    if (!canViewApprovalHistory) return;
    setIsApprovalHistoryOpen(true);
    loadApprovalHistory();
  };

  const handleOpenExecutiveSummary = () => {
    const requestId = ++executiveSummaryRequestRef.current;
    setIsExecutiveSummaryOpen(true);
    setExecutiveSummaryStatus('loading');
    setExecutiveSummaryError(null);

    loadAccountPlanPptData(pageData)
      .then((data) => {
        if (requestId !== executiveSummaryRequestRef.current) return;
        setExecutiveSummary(buildAccountPlanExecutiveSummary(data));
        setExecutiveSummaryStatus('ready');
      })
      .catch((error) => {
        if (requestId !== executiveSummaryRequestRef.current) return;
        console.error('[executive-summary] load failed', error);
        setExecutiveSummary(null);
        setExecutiveSummaryError(error);
        setExecutiveSummaryStatus('error');
      });
  };

  const handleCloseExecutiveSummary = () => {
    executiveSummaryRequestRef.current += 1;
    setIsExecutiveSummaryOpen(false);
  };

  const handleSaveExecutiveSummaryPdf = () => {
    handleExportPdf();
  };

  const showExportResult = (result, kind = 'PPT') => {
    if (result.manualUrl) {
      exportManualUrlRef.current = result.manualUrl;
    } else {
      exportManualUrlRef.current = null;
    }
    setExportNotice(null);
    return result;
  };

  const preparePptExport = async () => {
    const requestId = ++pptPrepareRequestRef.current;
    setPptPrepareStatus('preparing');

    try {
      const prepared = await prepareAccountPlanPpt({
        cachedPageData: pageData,
      });

      if (requestId === pptPrepareRequestRef.current) {
        preparedPptRef.current = prepared;
        setPptPrepareStatus('ready');
      }
      return prepared;
    } catch (error) {
      if (requestId === pptPrepareRequestRef.current) {
        preparedPptRef.current = null;
        setPptPrepareStatus('error');
      }
      throw error;
    }
  };

  const preparePdfExport = async () => {
    const requestId = ++pdfPrepareRequestRef.current;
    setPdfPrepareStatus('preparing');

    try {
      const prepared = await prepareAccountPlanPdf({
        cachedPageData: pageData,
      });

      if (requestId === pdfPrepareRequestRef.current) {
        preparedPdfRef.current = prepared;
        setPdfPrepareStatus('ready');
      }
      return prepared;
    } catch (error) {
      if (requestId === pdfPrepareRequestRef.current) {
        preparedPdfRef.current = null;
        setPdfPrepareStatus('error');
      }
      throw error;
    }
  };

  const deliverPreparedPptFromTap = (prepared) => {
    if (exportManualUrlRef.current) {
      URL.revokeObjectURL(exportManualUrlRef.current);
      exportManualUrlRef.current = null;
    }
    setIsExportingPpt(true);
    return deliverPreparedAccountPlanPpt(prepared, {
        directShare: true,
      })
      .then((result) => showExportResult(result, 'PPT'))
      .catch((error) => {
        console.error('[export] PPT delivery failed', error);
        setExportNotice({
          tone: 'danger',
          title: 'PPT open failed. Copy this error and send it.',
          detail: error?.stack || error?.message || String(error),
        });
      })
      .finally(() => {
        setIsExportingPpt(false);
      });
  };

  const deliverPreparedPdfFromTap = (prepared) => {
    if (exportManualUrlRef.current) {
      URL.revokeObjectURL(exportManualUrlRef.current);
      exportManualUrlRef.current = null;
    }
    setIsExportingPdf(true);
    return deliverPreparedAccountPlanPdf(prepared, {
        directShare: true,
      })
      .then((result) => showExportResult(result, 'PDF'))
      .catch((error) => {
        console.error('[export] PDF delivery failed', error);
        setExportNotice({
          tone: 'danger',
          title: 'PDF open failed. Copy this error and send it.',
          detail: error?.stack || error?.message || String(error),
        });
      })
      .finally(() => {
        setIsExportingPdf(false);
      });
  };

  const handleExportPpt = async () => {
    if (isExportingPpt) return;

    if (preparedPptRef.current) {
      deliverPreparedPptFromTap(preparedPptRef.current);
      return;
    }

    if (pptPrepareStatus === 'preparing') return;

    if (exportManualUrlRef.current) {
      URL.revokeObjectURL(exportManualUrlRef.current);
      exportManualUrlRef.current = null;
    }
    setIsExportingPpt(true);

    try {
      const prepared = await preparePptExport();
      preparedPptRef.current = prepared;
      await deliverPreparedPptFromTap(prepared);
    } catch (error) {
      console.error('[export] PPT generation failed', error);
      setExportNotice({
        tone: 'danger',
        title: 'PPT export failed. Copy this error and send it.',
        detail: error?.stack || error?.message || String(error),
      });
    } finally {
      setIsExportingPpt(false);
    }
  };

  const handleExportPdf = async () => {
    if (isExportingPdf) return;

    if (preparedPdfRef.current) {
      deliverPreparedPdfFromTap(preparedPdfRef.current);
      return;
    }

    if (pdfPrepareStatus === 'preparing') return;

    if (exportManualUrlRef.current) {
      URL.revokeObjectURL(exportManualUrlRef.current);
      exportManualUrlRef.current = null;
    }
    setIsExportingPdf(true);

    try {
      const prepared = await preparePdfExport();
      preparedPdfRef.current = prepared;
      await deliverPreparedPdfFromTap(prepared);
    } catch (error) {
      console.error('[export] PDF generation failed', error);
      setExportNotice({
        tone: 'danger',
        title: 'PDF export failed. Copy this error and send it.',
        detail: error?.stack || error?.message || String(error),
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handlePrepareExportMenuOpen = () => {
    if (pptPrepareStatus !== 'ready' && pptPrepareStatus !== 'preparing') {
      preparePptExport().catch((error) => {
        console.info('[export] PPT preparation on menu open failed.', error);
      });
    }
    if (pdfPrepareStatus !== 'ready' && pdfPrepareStatus !== 'preparing') {
      preparePdfExport().catch((error) => {
        console.info('[export] PDF preparation on menu open failed.', error);
      });
    }
  };

  const clearExportNotice = () => {
    if (exportManualUrlRef.current) {
      URL.revokeObjectURL(exportManualUrlRef.current);
      exportManualUrlRef.current = null;
    }
    setExportNotice(null);
  };

  useEffect(() => {
    if (!pendingCriticalActivityNavigation) return;
    setActiveKey('critical-activities');
    setPendingCriticalActivityNavigation(false);
  }, [pendingCriticalActivityNavigation, criticalActivityToEditTarget, criticalActivityEditRequest]);

  useEffect(() => {
    let cancelled = false;
    getCurrentUserProfileName()
      .then((profileName) => {
        if (!cancelled) setCurrentUserProfileName(profileName || null);
      })
      .catch((error) => {
        console.info('[current-user-profile] unable to resolve profile name', error);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isMpdApprovalDisabled) return;
    setMpdApprovalError('');
  }, [isMpdApprovalDisabled]);

  useEffect(() => {
    if (!isMrdApprovalPending) return;
    setIsMpdApprovalConfirmOpen(false);
    setMpdApprovalError('');
  }, [isMrdApprovalPending]);

  useEffect(() => {
    refreshApprovalStatus({ force: true });
  }, [activeKey, refreshApprovalStatus]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    refreshApprovalStatus({ force: true });
    const intervalId = window.setInterval(() => {
      refreshApprovalStatus();
    }, APPROVAL_STATUS_REFRESH_MS);

    const handleResume = () => {
      if (
        typeof document !== 'undefined' &&
        document.visibilityState &&
        document.visibilityState !== 'visible'
      ) {
        return;
      }
      refreshApprovalStatus({ force: true });
      const now = Date.now();
      if (now - workspaceResumeRefreshRef.current < WORKSPACE_RESUME_REFRESH_THROTTLE_MS) {
        return;
      }
      workspaceResumeRefreshRef.current = now;
      refreshLoadedPages();
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleResume);
    }
    window.addEventListener('focus', handleResume);
    window.addEventListener('pageshow', handleResume);

    return () => {
      window.clearInterval(intervalId);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleResume);
      }
      window.removeEventListener('focus', handleResume);
      window.removeEventListener('pageshow', handleResume);
    };
  }, [refreshApprovalStatus, refreshLoadedPages]);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') return undefined;

    const updateModalState = () => {
      setHasModalOpen(Boolean(document.querySelector('.stakeholder-edit-overlay, .modal-scrim')));
    };

    updateModalState();
    const observer = new MutationObserver(updateModalState);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const updateRuntimeView = () => {
      const nextSnapshot = getRuntimeViewSnapshot();
      setRuntimeViewSnapshot(nextSnapshot);
      if (nextSnapshot.viewMode !== 'desktop') {
        setIsDesktopPlanSelected(true);
        setPageStatus((current) => (
          Object.keys(current).length ? current : { overview: 'loading' }
        ));
      }
    };

    window.addEventListener('resize', updateRuntimeView);
    window.addEventListener('orientationchange', updateRuntimeView);
    return () => {
      window.removeEventListener('resize', updateRuntimeView);
      window.removeEventListener('orientationchange', updateRuntimeView);
    };
  }, []);

  useEffect(() => () => {
    if (exportManualUrlRef.current) {
      URL.revokeObjectURL(exportManualUrlRef.current);
      exportManualUrlRef.current = null;
    }
    if (appNoticeTimerRef.current) {
      window.clearTimeout(appNoticeTimerRef.current);
      appNoticeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!Object.keys(pageData).length) return undefined;

    let isCurrent = true;
    let idleId = null;
    preparedPptRef.current = null;
    preparedPdfRef.current = null;
    setPptPrepareStatus('idle');
    setPdfPrepareStatus('idle');

    const timeoutId = window.setTimeout(() => {
      const prepareExports = () => {
        if (!isCurrent) return;
        const requestId = ++pptPrepareRequestRef.current;
        const pdfRequestId = ++pdfPrepareRequestRef.current;

        setPptPrepareStatus('preparing');
        setPdfPrepareStatus('preparing');

        prepareAccountPlanPpt({ cachedPageData: pageData })
          .then((prepared) => {
            if (!isCurrent || requestId !== pptPrepareRequestRef.current) return;
            preparedPptRef.current = prepared;
            setPptPrepareStatus('ready');
          })
          .catch((error) => {
            if (!isCurrent || requestId !== pptPrepareRequestRef.current) return;
            preparedPptRef.current = null;
            setPptPrepareStatus('error');
            console.info('[export] Background PPT preparation failed.', error);
          });

        prepareAccountPlanPdf({ cachedPageData: pageData })
          .then((prepared) => {
            if (!isCurrent || pdfRequestId !== pdfPrepareRequestRef.current) return;
            preparedPdfRef.current = prepared;
            setPdfPrepareStatus('ready');
          })
          .catch((error) => {
            if (!isCurrent || pdfRequestId !== pdfPrepareRequestRef.current) return;
            preparedPdfRef.current = null;
            setPdfPrepareStatus('error');
            console.info('[export] Background PDF preparation failed.', error);
          });
      };

      if (typeof window.requestIdleCallback === 'function') {
        idleId = window.requestIdleCallback(prepareExports, {
          timeout: EXPORT_PREPARE_IDLE_TIMEOUT_MS,
        });
        return;
      }

      prepareExports();
    }, EXPORT_PREPARE_IDLE_DELAY_MS);

    return () => {
      isCurrent = false;
      window.clearTimeout(timeoutId);
      if (idleId !== null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleId);
      }
    };
  }, [pageData]);

  useEffect(() => {
    if (!shouldLoadAccountPlanPages) return;
    if (!activePage || !activePage.loader) return;
    const hasInFlightActivePage = pageLoadPromisesRef.current.has(activeDataKey);
    const hasCachedActivePage = loadedRef.current.has(activeDataKey) && !hasInFlightActivePage;
    loadPage(activeKey, {
      background: hasCachedActivePage || hasInFlightActivePage,
      force: hasCachedActivePage,
    }).catch(() => {});
  }, [activeKey, activeDataKey, activePage, loadPage, shouldLoadAccountPlanPages]);

  // Local MRD demonstrations must never be left behind a stale Vite/HMR
  // in-flight request. If the normal loader is still marked loading after a
  // short grace period, run a clean Home load and commit it directly. This is
  // local-preview-only and cannot affect a packaged Veeva deployment.
  useEffect(() => {
    if (!isLocalMrdApprovalDemo() || pageStatus.overview !== 'loading') return undefined;
    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      Promise.resolve(PAGE_BY_KEY.overview.loader()).then(
        (data) => {
          if (cancelled) return;
          loadedRef.current.add('overview');
          pageLoadPromisesRef.current.delete('overview');
          setPageData((current) => ({ ...current, overview: data }));
          setPageStatus((current) => ({ ...current, overview: 'ready' }));
          setPageError((current) => {
            if (!Object.prototype.hasOwnProperty.call(current, 'overview')) return current;
            const next = { ...current };
            delete next.overview;
            return next;
          });
        },
        (error) => {
          if (cancelled) return;
          setPageError((current) => ({ ...current, overview: error }));
          setPageStatus((current) => ({ ...current, overview: 'error' }));
        }
      );
    }, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [pageStatus.overview]);

  useEffect(() => {
    if (!shouldLoadAccountPlanPages) return undefined;
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      const seenDataKeys = new Set();
      STARTUP_PRELOAD_PAGE_KEYS.forEach((key) => {
        const page = PAGE_BY_KEY[key];
        const dataKey = pageDataKey(key);
        if (
          !page?.loader ||
          loadedRef.current.has(dataKey) ||
          seenDataKeys.has(dataKey)
        ) {
          return;
        }
        seenDataKeys.add(dataKey);
        loadPage(page.key, { background: true })
          .catch((error) => {
            if (!cancelled) {
              console.info(`[startup-page-preload] ${page.key} preload failed`, error);
            }
          });
      });
    }, STARTUP_PRELOAD_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [loadPage, shouldLoadAccountPlanPages]);

  useEffect(() => {
    if (!shouldLoadAccountPlanPages) return undefined;
    if (pageStatus.overview !== 'ready') return undefined;
    let cancelled = false;

    const timeoutId = window.setTimeout(() => {
      const preloadPages = async () => {
        const seenDataKeys = new Set([pageDataKey(activeKey)]);
        const preloadTargets = PAGES.filter((page) => {
          const dataKey = pageDataKey(page.key);
          if (
            !page.loader ||
            loadedRef.current.has(dataKey) ||
            seenDataKeys.has(dataKey)
          ) {
            return false;
          }
          seenDataKeys.add(dataKey);
          return true;
        });
        await Promise.all(preloadTargets.map((page) =>
          loadPage(page.key, { background: true })
            .catch((error) => {
              if (!cancelled) {
                console.info(`[page-preload] ${page.key} preload failed`, error);
              }
            })
        ));
      };

      preloadPages();
    }, NAVIGATION_PRELOAD_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [activeKey, pageStatus.overview, loadPage, shouldLoadAccountPlanPages]);

  if (shouldShowAccountPlanLauncher) {
    return (
      <div className="account-plan-launcher-frame">
        <AccountPlanLauncher onSelectPlan={handleSelectLauncherPlan} />
      </div>
    );
  }

  return (
    <div className={`shell shell-frame${hasModalOpen ? ' modal-open' : ''}`}>
      <Sidebar
        pages={PAGES}
        activeKey={activeKey}
        onNavigate={navigateToPage}
        onPreloadPage={(key) => loadPage(key, { background: true })}
        onExportPpt={handleExportPpt}
        onPrepareExports={handlePrepareExportMenuOpen}
        onSubmitMpdApproval={handleSubmitMpdApproval}
        onApproveAccountPlan={handleOpenApproveAccountPlan}
        onApprovalHistory={handleOpenApprovalHistory}
        canApproveAccountPlan={canApproveAccountPlan}
        canViewApprovalHistory={canViewApprovalHistory}
        isAccountPlanReviewer={isAccountPlanReviewer}
        isApprovingAccountPlan={isApprovingAccountPlan}
        isMpdApprovalDisabled={isMpdApprovalDisabled}
        isMrdApprovalPending={isMrdApprovalPending}
        isExportingPpt={isExportingPpt}
        isPreparingPpt={pptPrepareStatus === 'preparing'}
        plan={effectiveShellSource && effectiveShellSource.plan}
        account={effectiveShellSource && effectiveShellSource.account}
      />

      {appNotice && (
        <div
          className={`app-notice-toast ${appNotice.tone}`}
          role={appNotice.tone === 'danger' ? 'alert' : 'status'}
          aria-live={appNotice.tone === 'danger' ? 'assertive' : 'polite'}
        >
          <div className="app-notice-copy">
            <strong>{appNotice.title}</strong>
            {appNotice.detail && <span>{appNotice.detail}</span>}
          </div>
          <button type="button" onClick={clearAppNotice} aria-label="Dismiss notification">
            x
          </button>
        </div>
      )}

      <section className={`shell-main shell-main-${activeKey}`}>
        {isMockRuntime && (
          <div className="status-banner info">
            {hasVeevaRuntime()
              ? 'Using CRM Account Plan data with mock Medical training data.'
              : 'Running with local mock data (no Veeva runtime detected).'}
          </div>
        )}

        {exportNotice?.tone === 'danger' && (
          <div className="status-banner export-debug-banner danger">
            <div className="export-debug-head">
              <strong>{exportNotice.title}</strong>
              <button type="button" onClick={clearExportNotice}>Dismiss</button>
            </div>
            {exportNotice.detail && <pre>{exportNotice.detail}</pre>}
          </div>
        )}

        {activeStatus === 'error' && isMissingAccountPlanContextError(activeError) && (
          <div className="account-plan-context-empty" role="status">
            <strong>We couldn't find the selected Account Plan.</strong>
            <span>Go back to Account Plans and open the plan again. If the page still does not load, refresh this tab.</span>
            <small>Diagnostic build: {IPAD_CONTEXT_BUILD_MARKER}</small>
            <small>{ipadRuntimeDiagnostic()}</small>
            <small>{ipadCurrentObjectDiagnostic()}</small>
          </div>
        )}

        {activeStatus === 'ready' && activeError && (
          <div className="status-banner warning" role="status">
            <strong>Couldn’t refresh this section.</strong>{' '}
            Showing previously loaded data, which may be out of date.{' '}
            <button type="button" disabled={!!pageRefreshing[activeDataKey]}
              onClick={() => loadPage(activeKey, { background: true, force: true }).catch(() => {})}>
              {pageRefreshing[activeDataKey] ? 'Retrying…' : 'Retry'}
            </button>
          </div>
        )}

        {activeStatus === 'error' && !isMissingAccountPlanContextError(activeError) && (
          <div className="status-banner danger">
            <strong>Failed to load page.</strong>{' '}
            {activeError && activeError.message}{' '}
            <button type="button" disabled={!!pageRefreshing[activeDataKey]}
              onClick={() => loadPage(activeKey, { force: true }).catch(() => {})}>
              Retry
            </button>
          </div>
        )}

        <main className="shell-body">
          {activeStatus === 'loading' && (
            <LoadingScreen label={activeLoadingLabel} />
          )}

          {activeStatus === 'ready' && activeKey === 'overview' && (
            <Overview
              data={activeData}
              onDataChange={(updater) => updateCachedPageData('overview', updater)}
              onActivityChange={syncCriticalActivityAcrossCaches}
              onMemberChange={syncTeamMemberAcrossCaches}
              onMemberDelete={removeTeamMemberAcrossCaches}
              onOpenBarriersDrivers={navigateToBarriersDrivers}
              onOpenCriticalActivity={navigateToCriticalActivity}
              onNotify={showAppNotice}
            />
          )}

          {activeStatus === 'ready' && activeKey === 'barriers-drivers' && (
            <BarriersDrivers
              data={activeData}
              initialTab={barriersDriversTargetTab}
              onActivityChange={syncCriticalActivityAcrossCaches}
              onNotify={showAppNotice}
            />
          )}

          {activeStatus === 'ready' && activeKey === 'kpi' && (
            <AccountProfile data={activeData} initialTab="mm-medical-profile" onNotify={showAppNotice} />
          )}

          {activeStatus === 'ready' && activeKey === 'stakeholders' && (
            <Stakeholders data={activeData} onNotify={showAppNotice} />
          )}

          {activeStatus === 'ready' && activeKey === 'team-members' && (
            <TeamMembers
              data={activeData}
              onMemberChange={syncTeamMemberAcrossCaches}
              onMemberDelete={removeTeamMemberAcrossCaches}
              onNotify={showAppNotice}
            />
          )}

          {activeStatus === 'ready' && activeKey === 'critical-activities' && (
            <CriticalActivities
              data={activeData}
              initialEditActivityId={criticalActivityToEditId}
              initialEditActivity={criticalActivityToEditTarget}
              initialEditRequest={criticalActivityEditRequest}
              onActivityChange={syncCriticalActivityAcrossCaches}
              onNotify={showAppNotice}
            />
          )}

        </main>
      </section>

      {isExecutiveSummaryOpen && (
        <ExecutiveSummaryModal
          summary={executiveSummary}
          status={executiveSummaryStatus}
          error={executiveSummaryError}
          onClose={handleCloseExecutiveSummary}
          onSavePdf={handleSaveExecutiveSummaryPdf}
          isSavingPdf={isExportingPdf || pdfPrepareStatus === 'preparing'}
        />
      )}

      {isMpdApprovalConfirmOpen && (
        <SubmitMpdApprovalConfirmModal
          isSubmitting={mpdApprovalStatus === 'submitting'}
          error={mpdApprovalError}
          onCancel={handleCancelMpdApprovalConfirmation}
          onConfirm={handleConfirmMpdApproval}
        />
      )}

      {isApproveAccountPlanOpen && (
        <ApproveAccountPlanModal
          isApproving={isApprovingAccountPlan}
          error={approveAccountPlanError}
          onCancel={handleCloseApproveAccountPlan}
          onConfirm={handleApproveAccountPlan}
        />
      )}

      {isApprovalHistoryOpen && (
        <ApprovalHistoryModal
          plan={effectiveShellPlan}
          entries={approvalHistoryEntries}
          status={approvalHistoryStatus}
          error={approvalHistoryError}
          onRetry={loadApprovalHistory}
          onClose={() => setIsApprovalHistoryOpen(false)}
        />
      )}
    </div>
  );
}
