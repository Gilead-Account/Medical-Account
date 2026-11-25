import { medicalRecordTypeLabel } from '../medicalTerminology.js';

const hasValue = (value) => value !== null && value !== undefined && value !== '';

// Empty values render as a dash, matching the Account Profile page (see
// test/accountProfileNavigation.test.mjs) rather than the older "Not entered".
const EMPTY_DISPLAY_VALUE = '-';

const textValue = (value, fallback = EMPTY_DISPLAY_VALUE) => {
  if (value === true) return 'Yes';
  if (value === false) return 'No';
  if (!hasValue(value)) return fallback;
  return String(value).replace(/\s+/g, ' ').trim() || fallback;
};

const formatDate = (value, fallback = EMPTY_DISPLAY_VALUE) => {
  if (!value) return fallback;
  const dateOnly = typeof value === 'string' && value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) return `${dateOnly[2]}/${dateOnly[3]}/${dateOnly[1]}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return textValue(value, fallback);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}/${day}/${date.getFullYear()}`;
};

const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

const isOpenRecord = (record) => {
  const status = normalizeStatus(record?.status);
  return status !== 'closed' && status !== 'complete' && status !== 'completed';
};

const isActiveActivityStatus = (status) => {
  const normalized = normalizeStatus(status);
  return normalized === 'planned' || normalized === 'in progress';
};

const isClosedActivityStatus = (status) => {
  const normalized = normalizeStatus(status);
  return normalized === 'closed' || normalized === 'complete' || normalized === 'completed';
};

const isClosedWithinDays = (activity, today, days = 30) => {
  if (!isClosedActivityStatus(activity?.status)) return false;
  const closedValue = activity.completedDate || activity.closedDate || activity.lastModifiedDate;
  if (!closedValue) return false;
  const closedDate = new Date(closedValue);
  if (Number.isNaN(closedDate.getTime())) return false;
  const current = today instanceof Date ? today : new Date(today || Date.now());
  const diffMs = current.getTime() - closedDate.getTime();
  return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000;
};

const activeStatusFlag = (value) => {
  const raw = value && typeof value === 'object' && 'value' in value ? value.value : value;
  if (raw === true || raw === false) return raw;
  const key = String(raw ?? '').trim().toLowerCase();
  if (key === 'active' || key === 'true' || key === 'yes' || key === '1') return true;
  if (key === 'inactive' || key === 'false' || key === 'no' || key === '0') return false;
  return null;
};

const teamMemberStatus = (row) => {
  const activeFlag = activeStatusFlag(row?.isPrimary);
  if (activeFlag !== null) return activeFlag ? 'Active' : 'Inactive';
  const crmActiveFlag = activeStatusFlag(row?.Account_Team_Member_Active__c ?? row?.accountTeamMemberActive);
  if (crmActiveFlag !== null) return crmActiveFlag ? 'Active' : 'Inactive';
  const displayStatus = textValue(row?.status, '');
  return displayStatus || 'Inactive';
};

const lastFieldDirectorReviewValue = (plan) =>
  formatDate(plan?.lastFieldDirectorReviewDate, EMPTY_DISPLAY_VALUE);

const openActivityCount = (record, openActivityCountByBarrier) =>
  Number(openActivityCountByBarrier?.[record?.id] ?? record?.openCount ?? 0) || 0;

const barrierDriverCountRow = (record, openActivityCountByBarrier) => ({
  indication: textValue(record?.indication),
  category: textValue(record?.category),
  title: textValue(record?.name || record?.title, 'Untitled'),
  openActivities: openActivityCount(record, openActivityCountByBarrier),
});

const barrierDriverCommentRow = (record) => ({
  type: medicalRecordTypeLabel(record?.type),
  title: textValue(record?.name || record?.title, 'Untitled'),
  indication: textValue(record?.indication),
  strategy: textValue(record?.strategyLabel || record?.strategy),
  category: textValue(record?.category),
  businessImpact: textValue(record?.businessImpact),
  comments: textValue(record?.comments, 'No comment'),
});

// =============================================================================
// Medical Account Profile
// =============================================================================
// Mirrors the five Account Profile tabs. Field lists are duplicated here rather
// than imported from the tab components because those are JSX and this module
// is loaded directly by Node in tests and by the PDF renderer.
//
// MM ATC and DLBCL ATC Medical Profile intentionally render the same seven
// fields — src/pages/AccountProfile/index.jsx passes the same `mmProfile`
// object to both tabs and only varies the heading.

// CRM stores multi-select picklists semicolon-delimited
// ('Academic ATC;High Research Engagement'). The Account Profile tabs split on
// ';' for display, so the summary reads them back as a comma-separated list.
// Only fields the tabs render as multi-selects are converted, so a semicolon
// typed into a free-text field survives untouched.
const MULTI_SELECT_PROFILE_KEYS = new Set([
  'atcProfileCategory',
  'medicalEducation',
  'kiteClinicalTrial',
  'medicalCollaboration',
]);

const multiSelectText = (value) => {
  const parts = String(value ?? '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);
  return parts.length ? parts.join(', ') : '';
};

const ATC_MEDICAL_PROFILE_FIELDS = [
  ['atcProfileCategory', 'ATC Profile Category'],
  ['medicalEducation', 'Medical Education'],
  ['atcProfileSummary', 'ATC Profile Summary'],
  ['kiteClinicalTrial', 'Kite Clinical Trial'],
  ['competitorTrial', 'Competitor Trial'],
  ['medicalCollaboration', 'Medical Collaboration'],
  ['researchCapabilitiesTimelines', 'Research Capabilities / Timelines'],
];

const MM_COMM_PROFILE_GROUPS = [
  ['Account Information', [
    ['factAccredited', 'FACT Accredited'],
    ['340bAccount', '340B Account'],
    ['anitoCelTrialSite', 'Anito-Cel Trial Site'],
  ]],
  ['01 MM Treatment Landscape & Demand', [
    ['projectedAnitoCelDemand', 'Projected Anito-Cel Demand'],
    ['secondLinePatientEstimate', '2L+ Patient Estimate'],
    ['currentCartUtilizationVolume', 'Current CART Utilization Volume'],
    ['currentBispecificUtilization', 'Current Bispecific Utilization'],
    ['fourthLinePatientEstimate', '4L+ Patient Estimate'],
    ['bispecificUse', 'Bispecific Use (Tec / Elrex / Talvey)'],
    ['secondLineTreatmentPreference', '2L Treatment Preference'],
    ['fourthLineTreatmentPreference', '4L+ Treatment Preference'],
    ['perceptionOfAnitoCel', 'Perception of Anito-Cel'],
  ]],
  ['02 CART Infrastructure & Ops Readiness', [
    ['cartProgramStructure', 'CART Program Structure'],
    ['outpatientCartCapability', 'Outpatient CART Capability'],
    ['receptivityToAnitoCelOp', 'Receptivity to Anito-Cel OP'],
    ['operationalCapacityAssessment', 'Operational Capacity Assessment'],
  ]],
  ['03 Access, Reimbursement & Economics', [
    ['payerMix', 'Payer Mix - Commercial % / Medicare % / Medicaid %'],
    ['ptStatus', 'P&T Status'],
    ['ptTimingNextReview', 'P&T Timing / Next Review'],
    ['formularyStatus', 'Formulary Status'],
    ['ptCommittee', 'P&T Committee'],
    ['ptLead', 'P&T Lead'],
    ['accessBarriers', 'Access Barriers'],
  ]],
  ['04 Referral Ecosystem & Patient Flow', [
    ['catchmentArea', 'Catchment Area (sites / miles)'],
    ['internalExternalMix', 'Internal / External Mix %'],
    ['topReferringSites', 'Top Referring Sites'],
  ]],
  ['05 HCP Stakeholder & Engagement Profile', [
    ['cartTreatersAtAtc', '# CART Treaters at ATC'],
    ['mmAnitoCelClinicalChampion', 'MM Anito-Cel Clinical Champion'],
    ['adminChampionRole', 'Admin Champion & Role'],
    ['mmOpinionLeaders', 'MM Opinion Leaders'],
  ]],
];

const profileFields = (values, defs) =>
  defs.map(([key, label]) => {
    const raw = values?.[key];
    return {
      label,
      value: MULTI_SELECT_PROFILE_KEYS.has(key)
        ? textValue(multiSelectText(raw))
        : textValue(raw),
    };
  });

// Reference rows arrive as { key, label, value }; profile questions arrive as
// two parallel columns of { label, value }. Both flatten to label/value pairs.
const referenceFields = (rows) =>
  (rows || []).map((row) => ({ label: textValue(row?.label), value: textValue(row?.value) }));

// Question answers arrive either as an array or as a semicolon-delimited
// string, depending on whether the picklist is multi-select.
const questionFields = (columns) =>
  (columns || []).flat().map((item) => {
    const isMulti = item?.isMultiSelect || item?.inputType === 'multipicklist';
    let value = item?.value;
    if (Array.isArray(value)) value = value.map((entry) => String(entry).trim()).filter(Boolean).join(', ');
    else if (isMulti) value = multiSelectText(value);
    return { label: textValue(item?.label), value: textValue(value) };
  });

const buildMedicalAccountProfile = (accountProfile = {}) => {
  const mmProfile = accountProfile.mmProfile || {};
  const atcMedicalFields = profileFields(mmProfile, ATC_MEDICAL_PROFILE_FIELDS);

  return [
    { title: 'MM ATC Medical Profile', groups: [{ title: '', fields: atcMedicalFields }], tables: [] },
    { title: 'DLBCL ATC Medical Profile', groups: [{ title: '', fields: atcMedicalFields }], tables: [] },
    {
      title: 'MM Comm Profile',
      groups: MM_COMM_PROFILE_GROUPS.map(([title, defs]) => ({
        title,
        fields: profileFields(mmProfile, defs),
      })),
      tables: [],
    },
    {
      title: 'DLBCL Comm Profile',
      groups: [
        { title: 'Account Attributes', fields: referenceFields(accountProfile.accountAttributeRows) },
        { title: 'Reimbursement', fields: referenceFields(accountProfile.reimbursementRows) },
        { title: 'Profile Questions', fields: questionFields(accountProfile.profileQuestionColumns) },
      ].filter((group) => group.fields.length),
      tables: [],
    },
    {
      title: 'Referral & Dynamics',
      groups: [{
        title: 'Regional Dynamics',
        fields: [
          { label: 'DLBCL Regional Dynamics', value: textValue(accountProfile.regionalDynamics?.DLBCL) },
          { label: 'MM Regional Dynamics', value: textValue(accountProfile.regionalDynamics?.MM) },
        ],
      }],
      tables: [
        {
          title: 'Referral Mapping',
          headers: ['Site Name', 'HCO Classification', 'Indication'],
          rows: (accountProfile.referralAccounts || []).map((row) => [
            textValue(row?.name, 'Untitled'),
            textValue(row?.hcoClassification),
            textValue(row?.indication),
          ]),
        },
        {
          title: 'Other Healthcare Networks',
          headers: ['Account Name', 'Kite Accountable'],
          rows: (accountProfile.healthcareNetworks || []).map((row) => [
            textValue(row?.accountName, 'Untitled'),
            textValue(row?.kiteAccountable),
          ]),
        },
      ],
    },
  ];
};

const exportTitle = (data) => {
  const home = data?.home || {};
  const accountProfile = data?.accountProfile || {};
  const accountName =
    home.account?.name ||
    accountProfile.account?.name ||
    home.plan?.accountName ||
    accountProfile.plan?.accountName ||
    'Account Plan';
  const title = String(accountName).trim();
  return /\bAccount\s+Plan$/i.test(title) ? title : `${title} Account Plan`;
};

export const buildAccountPlanExecutiveSummary = (data, { today = new Date() } = {}) => {
  const home = data?.home || {};
  const accountProfile = data?.accountProfile || {};
  const account = home.account || accountProfile.account || {};
  const plan = home.plan || accountProfile.plan || {};
  const header = home.header || accountProfile.header || {};
  const accountName = textValue(account.name || plan.accountName, 'Account Plan');
  const eid = textValue(account.eid || account.externalId || plan.eid, '');
  const barriersDrivers = data?.barriersDrivers || {};
  // No indication filtering — both DLBCL and MM barriers/drivers flow through.
  const allBarriers = barriersDrivers.barriers || [];
  const allDrivers = barriersDrivers.drivers || [];
  const openActivityCountByBarrier = barriersDrivers.openActivityCountByBarrier || {};
  const strategies = home.strategies || {};

  const visibleStakeholders = (data?.stakeholders?.stakeholders || []).map((row) => ({
    name: textValue(row.name, 'Untitled'),
    stakeholderId: textValue(row.stakeholderId),
    role: textValue(row.role),
    primaryParent: textValue(row.primaryParent),
  }));

  const activityRows = (data?.criticalActivities?.activities || barriersDrivers.activities || [])
    .filter((activity) =>
      isActiveActivityStatus(activity.status) || isClosedWithinDays(activity, today)
    )
    .map((activity) => ({
      title: textValue(activity.name, 'Untitled'),
      relatedBarrier: textValue(activity.parentName, 'Plan-level'),
      indication: textValue(activity.indication),
      status: textValue(activity.status, 'Planned'),
      accountable: textValue(activity.ownerLabel || activity.accountable, 'Unassigned'),
      dueDate: formatDate(activity.dueDate),
      lastModifiedDate: formatDate(activity.lastModifiedDate),
    }));

  return {
    title: exportTitle(data),
    accountName,
    eid,
    accountLine: eid ? `${accountName} (EID: ${eid})` : accountName,
    generatedDate: formatDate(today),
    keyInfo: [
      { label: 'ATC Cohort DLBCL', value: textValue(header.atcCohort) },
      { label: 'MM ATC Priority', value: textValue(header.mmAtcPriority || account.mmAtcPriority) },
      { label: 'Territory', value: textValue(plan.territoryDescription || account.territory) },
      { label: 'Last FD Review', value: lastFieldDirectorReviewValue(plan) },
    ],
    goalsAndStrategy: [
      {
        title: 'Medical Strategy - DLBCL',
        body: (strategies.dlbcl || []).length ? strategies.dlbcl.join('; ') : EMPTY_DISPLAY_VALUE,
      },
      {
        title: 'Medical Strategy - MM',
        body: (strategies.mm || []).length ? strategies.mm.join('; ') : EMPTY_DISPLAY_VALUE,
      },
    ],
    medicalAccountProfile: buildMedicalAccountProfile(accountProfile),
    barrierDriverCounts: {
      barriers: allBarriers.map((record) => barrierDriverCountRow(record, openActivityCountByBarrier)),
      drivers: allDrivers.map((record) => barrierDriverCountRow(record, openActivityCountByBarrier)),
    },
    topStakeholders: visibleStakeholders,
    criticalActivities: activityRows,
    openBarrierDrivers: [...allBarriers, ...allDrivers]
      .filter(isOpenRecord)
      .map(barrierDriverCommentRow),
    teamMembers: (data?.teamMembers?.teamMembers || []).map((row) => ({
      name: textValue(row.name, 'Unnamed team member'),
      role: textValue(row.role || row.functionName),
      status: teamMemberStatus(row),
      participation: textValue(row.participation || (row.isPrimary ? 'Core' : 'Extended')),
    })),
  };
};
