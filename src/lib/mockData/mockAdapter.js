// Implements the same surface as window.ds (Veeva's MyInsights data service)
// so the React app can run on a local vite dev server with no Veeva runtime.
//
// Mirrors site_crm_v1/src/lib/mockData/mockAdapter.js but with fixtures
// shaped for an Account Plan / Overview screen.

import {
  fixtures,
  filterByWhere,
  fixtureRowsForAccountPlan,
  PLAN_ID,
} from '@/lib/mockData/fixtures';
import {
  applyPersistedMockRecord,
  clearPersistedMockRecordFields,
  isPersistedMockRecordDeleted,
  persistedMockRecords,
  persistMockRecordCreation,
  persistMockRecordDeletion,
  persistMockRecordUpdate,
} from '@/lib/mockData/mockPersistence';

const mockQuery = typeof window === 'undefined'
  ? new URLSearchParams()
  : new URLSearchParams(window.location.search);
const isMrdReviewerPreview = mockQuery.get('reviewer')?.toLowerCase() === 'mrd';

// Keep the MRD approval demo repeatable. A fresh browser load starts the
// selected mock plan Submitted for Approval, while approval remains visible for the
// rest of that page session (including background status refreshes).
if (isMrdReviewerPreview) {
  clearPersistedMockRecordFields('Account_Plan_vod__c', PLAN_ID, [
    'KPH_Medical_Approval_Status__c',
    'KPH_Medical_Submitter_Name__c',
    'KPH_Is_Submitted__c',
    'KPH_Last_FD_Review_date__c',
    'KPH_Last_MPD_Reviewer__c',
  ]);
}
let boundAccountPlanId = PLAN_ID;

export const bindMockAccountPlanContext = (planId) => {
  const value = String(planId || '').trim();
  if (value) boundAccountPlanId = value;
  return boundAccountPlanId;
};

const persistedObjectKey = (object) =>
  boundAccountPlanId === PLAN_ID ? object : `${object}::${boundAccountPlanId}`;

const wrap = (obj) => {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    out[key] = { value };
  }
  return out;
};

const resolveQuery = ({ object, where }) => {
  const rows = fixtures[object];
  if (!rows) {
    console.warn('[mockAdapter] no fixture for object', object);
    return [];
  }
  const storageObject = persistedObjectKey(object);
  const createdRows = persistedMockRecords(storageObject).map(wrap);
  const seenIds = new Set();
  const currentRows = [
    ...createdRows,
    ...fixtureRowsForAccountPlan(object, boundAccountPlanId),
  ]
    .filter((row) => {
      const id = row?.Id?.value ?? row?.Id;
      if (!id || seenIds.has(id)) return !id;
      seenIds.add(id);
      return true;
    })
    .map((row) => applyPersistedMockRecord(storageObject, row))
    .filter((row) => !isPersistedMockRecordDeleted(storageObject, row?.Id?.value ?? row?.Id));
  const filteredRows = filterByWhere(currentRows, where);
  if (object !== 'Account_Plan_vod__c' || !isMrdReviewerPreview) return filteredRows;
  return filteredRows.map((row) => (
    row?.Id?.value === boundAccountPlanId && row?.KPH_Medical_Approval_Status__c?.value !== 'Approved'
      ? {
          ...row,
          KPH_Medical_Approval_Status__c: { value: 'Submitted for Approval' },
          KPH_Medical_Submitter_Name__c: { value: 'Priya Kumar' },
          KPH_Is_Submitted__c: { value: true },
        }
      : row
  ));
};

export const mockPicklistLabels = {
  Account_Plan_vod__c: {
    KPH_ATC_Profile_Category__c: {
      'Academic ATC': 'Academic ATC',
      'Community ATC': 'Community ATC',
      'High Research Engagement': 'High Research Engagement',
      'Outpatient Expansion': 'Outpatient Expansion',
    },
    KPH_Medical_Education__c: {
      'Advisory Board': 'Advisory Board',
      'Congress Education': 'Congress Education',
      'Peer-to-Peer Education': 'Peer-to-Peer Education',
      'Tumor Board Education': 'Tumor Board Education',
    },
    KPH_Kite_Clinical_Trial__c: {
      'ZUMA-7': 'ZUMA-7',
      'ZUMA-24': 'ZUMA-24',
      'Anito-cel Phase 3': 'Anito-cel Phase 3',
      'Post-marketing Evidence': 'Post-marketing Evidence',
    },
    KPH_Medical_Collaboration__c: {
      'Scientific Exchange': 'Scientific Exchange',
      'Investigator-Initiated Research': 'Investigator-Initiated Research',
      'RWE Collaboration': 'RWE Collaboration',
      'Advisory Board': 'Advisory Board',
    },
  },
  KPH_Medical_Barrier_Tactical_Actions__c: {
    KPH_Barrier_Title__c: {
      'Yescarta AE profile is elevated compared to in- and out-of-class competitors | DLBCL': 'Yescarta AE profile is elevated compared to in- and out-of-class competitors',
      'Confidence/experience with AE management limited | DLBCL': 'Confidence/experience with AE management limited',
      'BsAbs are increasingly used in community practices delaying referral for CAR T | MM, DLBCL': 'BsAbs are increasingly used in community practices delaying referral for CAR T',
      'Low volume of patient referrals for CAR T | DLBCL': 'Low volume of patient referrals for CAR T',
      'Low awareness of Tecartus 5-YR MCL survival data and optimal patient selection | DLBCL': 'Low awareness of Tecartus 5-YR MCL survival data and optimal patient selection',
      'Limited knowledge on the Kite pipeline and emerging data with next generation constructs | DLBCL': 'Limited knowledge on the Kite pipeline and emerging data with next generation constructs',
      'Highly competitive treatment landscape with many treatment options | MM': 'Highly competitive treatment landscape with many treatment options',
      'Confidence in AE management with community ATCs | MM': 'Confidence in AE management with community ATCs',
      'Limited clinical and patient management experience outside of clinical trials | MM': 'Limited clinical and patient management experience outside of clinical trials',
      'Decline in Referrals for CAR T due to increased treatment options (ex CELMoDs) | MM': 'Decline in Referrals for CAR T due to increased treatment options (ex CELMoDs)',
      'Potential gap in community patients awareness of CAR T as a treatment option for MM | MM': 'Potential gap in community patients awareness of CAR T as a treatment option for MM',
      'Treatment decisions focused on Bispecifics': 'Treatment decisions focused on Bispecifics',
      'Prefer BRE due to favorable safety/toxicity profile': 'Prefer BRE due to favorable safety/toxicity profile',
      'Prefer obe-cel due to favorable safety/toxicity profile': 'Prefer obe-cel due to favorable safety/toxicity profile',
      'Perception of no brand differentiation (Yescarta and Breyanzi)': 'Perception of no brand differentiation (Yescarta and Breyanzi)',
      'Prefer BRE in outpatient': 'Prefer BRE in outpatient',
      'Community referral pathways not well established': 'Community referral pathways not well established',
      'Capacity constraints at ATC (beds/staff/aphe)': 'Capacity constraints at ATC (beds/staff/aphe)',
    },
    KPH_Opportunity_Title__c: {
      'Potential Kite Clinical Trial Site | MM, DLBCL': 'Potential Kite Clinical Trial Site',
      'Robust Internal Referrals | MM, DLBCL': 'Robust Internal Referrals',
      'Strong Community Network | MM, DLBCL': 'Strong Community Network',
      'Interest to collaborate with Kite | MM, DLBCL': 'Interest to collaborate with Kite',
      'Deliver Channel Data to HCPs': 'Deliver Channel Data to HCPs',
      'Confirm EAP Requirements': 'Confirm EAP Requirements',
      'RWE Trial Support': 'RWE Trial Support',
      'Expand Outpatient CAR-T Pathway Education': 'Expand Outpatient CAR-T Pathway Education',
      'Strengthen Community Referral Identification': 'Strengthen Community Referral Identification',
    },
    KPH_Medical_Tactical_Action_Status__c: {
      'Identified - Not Started': 'Identified - Not Started',
      'In Progress': 'In Progress',
      'Near Outcome': 'Near Outcome',
      Closed: 'Closed',
    },
    KPH_Indication__c: {
      DLBCL: 'DLBCL',
      MM: 'MM',
      Portfolio: 'Portfolio',
    },
    KPH_Medical_Strategy__c: {
      'Win the CAR T Treatment Decision (Med) | DLBCL, MM': 'Win the CAR T Treatment Decision',
      'Drive earlier referral and CAR T Action (Med) | DLBCL, MM': 'Drive earlier referral and CAR T Action',
      'Community Expansion (Med) | DLBCL, MM': 'Community Expansion',
      'Maximize Opportunities in Lymphoma and Leukemia pipeline (Med) | DLBCL': 'Maximize Opportunities in Lymphoma and Leukemia pipeline',
      'Establish anito-cel as leading treatment option for patients with multiple myeloma (Med) | MM': 'Establish anito-cel as leading treatment option for patients with multiple myeloma',
      'MM Launch Preparedness (Med) | MM': 'MM Launch Preparedness',
      'Drive confidence in early use of CAR-T | DLBCL,Portfolio': 'Drive confidence in early use of CAR-T',
      'Establish outpatient expansion | DLBCL,Portfolio': 'Establish outpatient expansion',
      'MM Launch Prep | MM': 'MM Launch Prep',
      'Grow Class | Expand Referral Networks': 'Grow Class | Expand Referral Networks',
    },
  },
  KPH_Medical_Tactics__c: {
    KPH_Medical_Tactics__c: {
      'C4/C6, Z24 and RWE data review combined with staff training on AE Management (Barrier) | DLBCL': 'C4/C6, Z24 and RWE data review combined with staff training on AE Management',
      'Educate on 753 emerging data and potential promising safety profile (Barrier) | DLBCL': 'Educate on 753 emerging data and potential promising safety profile',
      'Differentiate Kite manufacturing success from main competitor (Barrier) | DLBCL': 'Differentiate Kite manufacturing success from main competitor',
      'Reenforce OS, Kite commitment to safety (Observational Trial and Next Generation Pipeline) (Barrier) | DLBCL': 'Reenforce OS, Kite commitment to safety (Observational Trial and Next Generation Pipeline)',
      'Identify opportunities for CAR T education, patient identification, Kite clinical trial awareness in the community (Barrier) | DLBCL': 'Identify opportunities for CAR T education, patient identification, Kite clinical trial awareness in the community',
      'Support recruitment to RESOLVE, Palisades 1 and Palisades 2 (Barrier) | DLBCL': 'Support recruitment to RESOLVE, Palisades 1 and Palisades 2',
      'Educate on axi-cel outpatient data, leverage OP and onboarding resource content (Barrier) | DLBCL': 'Educate on axi-cel outpatient data, leverage OP and onboarding resource content',
      'Educate on Kite DLBCL pipeline and potential approval for HGBCL and 2L FL (Barrier) | DLBCL': 'Educate on Kite DLBCL pipeline and potential approval for HGBCL and 2L FL',
      'Educate on 5yr survival and BTKi naive data with Brexu-cel in MCL for RR patients (Barrier) | DLBCL': 'Educate on 5yr survival and BTKi naive data with Brexu-cel in MCL for RR patients',
      'Nominate site to clinical development (Opp) | MM, DLBCL': 'Nominate site to clinical development',
      'Assess opportunities to present data/clinical updates to CAR T department (Opp) | MM, DLBCL': 'Assess opportunities to present data/clinical updates to CAR T department',
      'Identify patient navigator at institution for opportunities to educate satellite/community (Opp) | MM, DLBCL': 'Identify patient navigator at institution for opportunities to educate satellite/community',
      'Understand trial selection process and study start up process (Opp) | MM, DLBCL': 'Understand trial selection process and study start up process',
      'Identify community relationships/referral patterns at ATC (Opp) | MM, DLBCL': 'Identify community relationships/referral patterns at ATC',
      'Elevate awareness within Kite of institutions clinical/scientific expertise (Opp) | MM, DLBCL': 'Elevate awareness within Kite of institutions clinical/scientific expertise',
      'Scientific engagement focus on efficacy, safety and manufacturing differentiation from in-class and out of class competitors (Barrier) | MM': 'Scientific engagement focus on efficacy, safety and manufacturing differentiation from in-class and out of class competitors',
      'Proactive and reactive MM/community education to ensure safe administration of anito-cel in the community (Barrier) | MM': 'Proactive and reactive MM/community education to ensure safe administration of anito-cel in the community',
      'Educate HCPs on the clinical and AE management of anito-cel (patient identification, infusion post-infusion monitoring) (Barrier) | MM': 'Educate HCPs on the clinical and AE management of anito-cel (patient identification, infusion post-infusion monitoring)',
      'First Patient Experience Support (Barrier) | MM': 'First Patient Experience Support',
      'Peer to peer connection through ATC network (Barrier) | MM': 'Peer to peer connection through ATC network',
      'Educate on Anito-cel data and points of differentiation from CARVYKTI and out-of-class therapies (Barrier) | MM': 'Educate on Anito-cel data and points of differentiation from CARVYKTI and out-of-class therapies',
      'Build patient and caregiver awareness of anito-cel as a differentiated CAR T option in 4L+ RRMM (Barrier) | MM': 'Build patient and caregiver awareness of anito-cel as a differentiated CAR T option in 4L+ RRMM',
      'Discuss differentiation of BsAbs/ADCs/CelMods with one time treatment, lower infection rates and lower CRS/ICANS profile (Barrier) | MM': 'Discuss differentiation of BsAbs/ADCs/CelMods with one time treatment, lower infection rates and lower CRS/ICANS profile',
      'Schedule Discussion with OLs at ATC': 'Schedule Discussion with OLs at ATC',
      'Facilitate CAR-T and bispecific sequencing exchange': 'Facilitate CAR-T and bispecific sequencing exchange',
      'Partner with Sci Comm on Content': 'Partner with Sci Comm on Content',
      'Share channel-specific evidence response': 'Share channel-specific evidence response',
      'Map EAP requirements and decision owners': 'Map EAP requirements and decision owners',
      'Review Patient Population Candidates': 'Review Patient Population Candidates',
      'Define RWE study feasibility next steps': 'Define RWE study feasibility next steps',
      'Facilitate Outpatient Workflow Exchange': 'Facilitate Outpatient Workflow Exchange',
      'Share Outpatient Evidence Summary': 'Share Outpatient Evidence Summary',
      'Host outpatient CAR-T workflow workshop': 'Host outpatient CAR-T workflow workshop',
      'Map Community Referral Education Needs': 'Map Community Referral Education Needs',
      'Plan Referral Case-Based Discussion': 'Plan Referral Case-Based Discussion',
      'Prioritize community referral education sites': 'Prioritize community referral education sites',
      'Review comparative cellular therapy safety evidence': 'Review comparative cellular therapy safety evidence',
      'Discuss aALL safety and efficacy evidence': 'Discuss aALL safety and efficacy evidence',
      'Share CAR-T brand differentiation evidence': 'Share CAR-T brand differentiation evidence',
      'Review outpatient monitoring and escalation protocols': 'Review outpatient monitoring and escalation protocols',
      'Assess community referral pathway gaps': 'Assess community referral pathway gaps',
      'Conduct ATC capacity workflow assessment': 'Conduct ATC capacity workflow assessment',
      'Educate on Cohort 4 /6 safety data (CTAM)': 'Educate on Cohort 4 /6 safety data (CTAM)',
      'Submit MIRF for Z24 data': 'Submit MIRF for Z24 data',
      'Educate ATC about community outreach plan': 'Educate ATC about community outreach plan',
      'Present IOR (KAD/CTAM)': 'Present IOR (KAD/CTAM)',
    },
    KPH_Status__c: {
      Planned: 'Planned',
      'In Progress': 'In Progress',
      Complete: 'Complete',
    },
    KPH_Indication__c: {
      DLBCL: 'DLBCL',
      MM: 'MM',
      Portfolio: 'Portfolio',
    },
    KPH_Accountable_POD_Members__c: {
      'Priya Kumar': 'Priya Kumar',
      'James Chen': 'James Chen',
      'Maria Lopez': 'Maria Lopez',
    },
  },
  Account_Team_Member_vod__c: {
    Account_Team_Member_Active__c: {
      Active: 'Active',
      Inactive: 'Inactive',
    },
    KPH_Participation__c: {
      Lead: 'Lead',
      Core: 'Core',
      Extended: 'Extended',
    },
  },
  KPH_Stakeholder_Map__c: {
    KPH_Title__c: {
      'Bispecifics Lead': 'Bispecifics Lead',
      'Cell Therapy Director': 'Cell Therapy Director',
      'Lymphoma Lead': 'Lymphoma Lead',
      Other: 'Other',
      'Pharmacy Director': 'Pharmacy Director',
    },
  },
  KPH_Ecosystem_Map_Dynamics__c: {
    Indication__c: {
      DLBCL: 'DLBCL',
      MM: 'MM',
      Portfolio: 'Portfolio',
    },
  },
  KPH_Ecosystem_Plan__c: {
    KPH_MM_ATC_Profile_Category__c: {
      'Academic ATC': 'Academic ATC',
      'Community ATC': 'Community ATC',
    },
    KPH_DLBCL_ATC_Profile_Category__c: {
      'Academic ATC': 'Academic ATC',
      'Community ATC': 'Community ATC',
    },
    KPH_MM_Medical_Education__c: {
      'AE Management': 'AE Management',
      'ATC Onboarding': 'ATC Onboarding',
      Outpatient: 'Outpatient',
    },
    KPH_DLBCL_Medical_Education__c: {
      'AE Management': 'AE Management',
      'ATC Onboarding': 'ATC Onboarding',
      Outpatient: 'Outpatient',
    },
    KPH_MM_Kite_Clinical_Trial__c: {
      'Anito-cel Phase 3': 'Anito-cel Phase 3',
      'Post-marketing Evidence': 'Post-marketing Evidence',
    },
    KPH_DLBCL_Clinical_Trial__c: {
      'ZUMA-7': 'ZUMA-7',
      'ZUMA-24': 'ZUMA-24',
    },
    KPH_MM_Medical_Collaboration__c: {
      'Scientific Exchange': 'Scientific Exchange',
      'RWE Collaboration': 'RWE Collaboration',
    },
    KPH_DLBCL_Medical_Collaboration__c: {
      'Scientific Exchange': 'Scientific Exchange',
      'Investigator-Initiated Research': 'Investigator-Initiated Research',
    },
    KPH_Medical_Education_Status__c: {
      Pending: 'Pending',
      Completed: 'Completed',
      Declined: 'Declined',
    },
    KPH_DLBCL_Medical_Education_Status__c: {
      Pending: 'Pending',
      Completed: 'Completed',
      Declined: 'Declined',
    },
    KPH_ae_management_Status__c: {
      Pending: 'Pending', Completed: 'Completed', Declined: 'Declined',
    },
    KPH_atc_onboarding_Status2__c: {
      Pending: 'Pending', Completed: 'Completed', Declined: 'Declined',
    },
    KPH_outpatient_Status3__c: {
      Pending: 'Pending', Completed: 'Completed', Declined: 'Declined',
    },
    KPH_DLBCL_ae_management_Status__c: {
      Pending: 'Pending', Completed: 'Completed', Declined: 'Declined',
    },
    KPH_DLBCL_atc_onboarding2__c: {
      Pending: 'Pending', Completed: 'Completed', Declined: 'Declined',
    },
    KPH_DLBCL_outpatient3__c: {
      Pending: 'Pending', Completed: 'Completed', Declined: 'Declined',
    },
  },
};

const barrierDriverStrategyMetadata = () => {
  return {
    object: 'KPH_Medical_Barrier_Tactical_Actions__c',
    fields: [
      { name: 'KPH_Indication__c', dataType: 'picklist' },
      { name: 'KPH_Medical_Strategy__c', dataType: 'picklist' },
    ],
  };
};

const objectMetadata = {
  KPH_Medical_Barrier_Tactical_Actions__c: barrierDriverStrategyMetadata,
};

export const mockAdapter = {
  runQuery(params) {
    return Promise.resolve({ data: resolveQuery(params) });
  },

  queryRecord(params) {
    const rows = resolveQuery(params);
    return Promise.resolve({ data: rows[0] || null });
  },

  getDataForCurrentObject(object, field) {
    // The legacy app launches MyInsights from an Account_Plan_vod__c
    // record, so the "current object" Id is the plan Id.
    if (object === 'Account_Plan_vod__c' && field === 'Id') {
      return Promise.resolve({
        Account_Plan_vod__c: { Id: boundAccountPlanId },
      });
    }
    if (object === 'User' && field === 'Id') {
      return Promise.resolve({
        User: { Id: '0058C00000MockUser2' },
      });
    }
    if (object === 'User' && field === 'Name') {
      return Promise.resolve({
        User: { Name: isMrdReviewerPreview ? 'Morgan Reed, MD' : 'Priya Kumar' },
      });
    }
    if (object === 'User' && (field === 'Profile_Name_vod_c' || field === 'Profile_Name_vod__c')) {
      return Promise.resolve({
        User: {
          [field]: isMrdReviewerPreview
            ? 'KPH-MSL-Manager-Platform'
            : 'Medical Science Liaison',
        },
      });
    }
    return Promise.resolve({ [object]: { [field]: null } });
  },

  getPicklistValueLabels(object, field) {
    return Promise.resolve({
      [object]: {
        [field]: (mockPicklistLabels[object] && mockPicklistLabels[object][field]) || {},
      },
    });
  },

  viewRecord({ object, fields }) {
    console.info('[mockAdapter] viewRecord ->', object, fields && fields.Id);
    return Promise.resolve({ success: true });
  },

  createRecord({ object, fields }) {
    console.info('[mockAdapter] createRecord ->', object, fields);
    const id = `mock-new-${Date.now()}`;
    if (fixtures[object]) {
      const record = {
        Id: id,
        Name: fields && fields.KPH_Medical_Tactics__c ? fields.KPH_Medical_Tactics__c : id,
        LastModifiedDate: new Date().toISOString(),
        ...(fields || {}),
      };
      persistMockRecordCreation(persistedObjectKey(object), id, record);
    }
    return Promise.resolve({ success: true, data: { id, Id: id } });
  },

  updateRecord({ object, id, fields }) {
    console.info('[mockAdapter] updateRecord ->', object, id, fields);
    const lastModifiedDate = new Date().toISOString();
    if (fixtures[object] && id) {
      persistMockRecordUpdate(
        persistedObjectKey(object),
        id,
        { ...fields, LastModifiedDate: lastModifiedDate }
      );
    }
    return Promise.resolve({ success: true, data: { id } });
  },

  deleteRecord({ object, id }) {
    console.info('[mockAdapter] deleteRecord ->', object, id);
    if (fixtures[object]) {
      persistMockRecordDeletion(persistedObjectKey(object), id);
    }
    return Promise.resolve({ success: true, data: { id } });
  },

  getAvailableObjects() {
    return Promise.resolve({ data: Object.keys(fixtures) });
  },

  getObjectMetadata({ object }) {
    const metadata = objectMetadata[object];
    return Promise.resolve({ data: metadata ? metadata() : { object, fields: [] } });
  },
};
