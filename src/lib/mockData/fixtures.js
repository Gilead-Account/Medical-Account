// Canned VOD responses used when running outside Veeva.
//
// Each record is shaped exactly like the real Veeva response would be:
// every field is `{ value: <thing> }`. This is what `unwrap()` in query.js
// expects.
//
// The PLAN_ID is the Id used as the "current object" — any other table
// is filtered to records pointing at it.

export const PLAN_ID = 'a0X8C00000Mock1AAB';
const ACCOUNT_ID = '0018C00000MAccount';

const wrap = (obj) => {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[k] = { value: v };
  }
  return out;
};

export const fixtures = {
  RecordType: [
    wrap({ Id: '012VE000007fGxdYAE', DeveloperName: 'Barrier', Name: 'Barrier', SobjectType: 'KPH_Medical_Barrier_Tactical_Actions__c', IsActive: true }),
    wrap({ Id: '012VE000007fGzFYAU', DeveloperName: 'Opportunity', Name: 'Opportunity', SobjectType: 'KPH_Medical_Barrier_Tactical_Actions__c', IsActive: true }),
  ],
  Account_Plan_vod__c: [
    wrap({
      Id: PLAN_ID,
      Name: 'FY26 Medical Account Plan - Northstar ATC',
      OwnerId: '0058C00000MockUser2',
      'Owner.Name': 'Priya Kumar',
      'Owner.FirstName': 'Priya',
      'Owner.LastName': 'Kumar',
      LastModifiedDate: '2026-04-22T12:34:56Z',
      Account_vod__c: ACCOUNT_ID,
      'Account_vod__r.Hospital_Type__c': 'Authorized Treatment Center',
      'Account_vod__r.Customer_Master_Status_vod__c': 'Valid_vod',
      KPH_ATC_EID__c: '998877',
      KPH_ATC_Strategic_Opportunities__c: null,
      KPH_Last_FD_Review_date__c: '2026-04-15',
      KPH_Territory_Description__c: 'US - North Region 4',
      KPH_Territory__c: 'NR4',
      KPH_Plan_status__c: 'Moved Forward',
      KPH_Medical_Approval_Status__c: 'Draft',
      KPH_Medical_Submitter_Name__c: null,
      KPH_Is_Submitted__c: false,
      KPH_Medical_Submitted_Date__c: null,
      KPH_ATC_Certified_Date__c: '2022-06-24',
      KPH_ATC_Profile_Category__c: 'Academic ATC;High Research Engagement;Outpatient Expansion',
      KPH_Medical_Education__c: 'Peer-to-Peer Education;Tumor Board Education',
      KPH_ATC_Profile_1__c:
        'High-volume academic ATC with established cellular therapy operations, growing outpatient capability, and strong interest in collaborative evidence generation.',
      KPH_Kite_Clinical_Trial__c: 'ZUMA-7;ZUMA-24',
      KPH_Competitor_Trial__c:
        'Active bispecific and next-generation cell therapy studies across LBCL and multiple myeloma.',
      KPH_Medical_Collaboration__c:
        'Scientific Exchange;Investigator-Initiated Research;RWE Collaboration',
      KPH_Research_Capabilities_Timelines__c:
        'Dedicated clinical research office; feasibility review typically completed within 6–8 weeks.',
      KPH_Customer_Engagement_DLBCL_POA__c:
        'Quarterly OP infusion capacity reviews with lymphoma lead + KAD. Pull-through Yescarta data at three regional dinners.',
      KPH_Medical_Affairs_DLBCL_POA__c:
        'MSL to socialize Phase 3 follow-up with bispecific lead; align on sequencing language for upcoming tumor board.',
      KPH_Market_Access_DLBCL_POA__c:
        'P&T re-review packet for DLBCL set for Q3; align payer mix story with finance.',
    }),
    wrap({
      Id: 'a0X8C00000Mock2AAC',
      Name: 'ACT Plan 009',
      OwnerId: '0058C00000MockUser2',
      'Owner.Name': 'Priya Kumar',
      'Owner.FirstName': 'Priya',
      'Owner.LastName': 'Kumar',
      LastModifiedDate: '2026-05-04T16:20:00Z',
      Account_vod__c: ACCOUNT_ID,
      'Account_vod__r.Hospital_Type__c': 'Authorized Treatment Center',
      'Account_vod__r.Customer_Master_Status_vod__c': 'Valid_vod',
      KPH_ATC_EID__c: '998877',
      KPH_Territory_Description__c: 'US - North Region 4',
      KPH_Territory__c: 'NR4',
      KPH_ATC_Certified_Date__c: '2018-02-20',
      KPH_Last_FD_Review_date__c: '2026-05-12',
      KPH_Medical_Submitted_Date__c: null,
      KPH_Plan_status__c: 'Potential ATC',
      KPH_Medical_Approval_Status__c: 'Draft',
      KPH_Medical_Submitter_Name__c: null,
      KPH_Is_Submitted__c: false,
    }),
    wrap({
      Id: 'a0X8C00000Mock3AAD',
      Name: 'FOX CHASE TEMPLE UNIVERSITY HOSPITAL BONE MARROW TRANSPLANT PROGRAM',
      OwnerId: '0058C00000MockUser2',
      'Owner.Name': 'Priya Kumar',
      'Owner.FirstName': 'Priya',
      'Owner.LastName': 'Kumar',
      LastModifiedDate: '2026-05-18T10:15:00Z',
      Account_vod__c: ACCOUNT_ID,
      'Account_vod__r.Hospital_Type__c': 'Authorized Treatment Center',
      'Account_vod__r.Customer_Master_Status_vod__c': 'Valid_vod',
      KPH_ATC_EID__c: '998877',
      KPH_Territory_Description__c: 'US - North Region 4',
      KPH_Territory__c: 'NR4',
      KPH_ATC_Certified_Date__c: '2018-06-13',
      KPH_Last_FD_Review_date__c: '2026-06-24',
      KPH_Medical_Submitted_Date__c: null,
      KPH_Plan_status__c: null,
      KPH_Medical_Approval_Status__c: 'Draft',
      KPH_Medical_Submitter_Name__c: null,
      KPH_Is_Submitted__c: false,
    }),
  ],

  Account: [
    wrap({
      Id: ACCOUNT_ID,
      Name: 'Northstar Cancer Center',
      // EID values in CRM are stored as plain identifiers — the "EID"
      // label is added by the UI, not the data.
      EID_GILD__c: '998877',
      KPH_MM_ATC_Priority__c: 'P2',
      KPH_Market_Access_Prioritized_Account__c: 'Yes',
      Hospital_Type__c: 'Authorized Treatment Center',
      Customer_Master_Status_vod__c: 'Valid_vod',
      Territory_vod__c: 'US - North Region 4',
      RecordTypeId: '01241000000cF0GAAU',
      IsPersonAccount: false,
      Account_Identifier_vod__c: '998877',
    }),
    wrap({
      Id: '0018C00000MSite1AA',
      Name: 'Northern Oncology Associates',
      EID_GILD__c: 'NOA-001',
      Territory_vod__c: 'US - North Region 4',
      RecordTypeId: '01241000000cF0GAAU',
      IsPersonAccount: false,
      Account_Identifier_vod__c: 'NOA-001',
    }),
    wrap({
      Id: '0018C00000MSite2AA',
      Name: 'Riverside Hematology Clinic',
      EID_GILD__c: 'RHC-002',
      Territory_vod__c: 'US - North Region 4',
      RecordTypeId: '01241000000cF0GAAU',
      IsPersonAccount: false,
      Account_Identifier_vod__c: 'RHC-002',
    }),
    wrap({
      Id: '0018C00000MSite3AA',
      Name: 'Lakeside Cancer Partners',
      EID_GILD__c: 'LCP-003',
      Territory_vod__c: 'US - North Region 4',
      RecordTypeId: '01241000000cF0GAAU',
      IsPersonAccount: false,
      Account_Identifier_vod__c: 'LCP-003',
    }),
    wrap({
      Id: '0018C00000MSite4AA',
      Name: 'Westlake Regional Cancer Center',
      EID_GILD__c: 'WRC-004',
      Territory_vod__c: 'US - North Region 4',
      RecordTypeId: '01241000000cF0GAAU',
      IsPersonAccount: false,
      Account_Identifier_vod__c: 'WRC-004',
    }),
    wrap({
      Id: '0018C00000MSite5AA',
      Name: 'Prairie View Hematology Group',
      EID_GILD__c: 'PVH-005',
      Territory_vod__c: 'US - North Region 4',
      RecordTypeId: '01241000000cF0GAAU',
      IsPersonAccount: false,
      Account_Identifier_vod__c: 'PVH-005',
    }),
    wrap({
      Id: '0018C00000MockNet2',
      Name: 'Northern Regional Network',
      EID_GILD__c: 'NRN-004',
      Territory_vod__c: 'US - North Region 4',
      RecordTypeId: '01241000000cF0GAAU',
      IsPersonAccount: false,
      Account_Identifier_vod__c: 'NRN-004',
    }),
    wrap({
      Id: '0038C00000MockHcp1',
      Name: 'Elena Martin',
      EID_GILD__c: '118822',
      Territory_vod__c: 'US - North Region 4',
      RecordTypeId: '01241000000PersonA',
      IsPersonAccount: true,
      Account_Identifier_vod__c: '118822',
      Primary_Parent_vod__c: ACCOUNT_ID,
      'Primary_Parent_vod__r.Name': 'Northstar Cancer Center',
    }),
    wrap({
      Id: '0038C00000MockHcp2',
      Name: 'Marcus Lin',
      EID_GILD__c: '118899',
      Territory_vod__c: 'US - North Region 4',
      RecordTypeId: '01241000000PersonA',
      IsPersonAccount: true,
      Account_Identifier_vod__c: '118899',
      Primary_Parent_vod__c: ACCOUNT_ID,
      'Primary_Parent_vod__r.Name': 'Northstar Cancer Center',
    }),
    wrap({
      Id: '0038C00000MockHcp3',
      Name: 'Sofia Patel',
      EID_GILD__c: '118901',
      Territory_vod__c: 'US - North Region 4',
      RecordTypeId: '01241000000PersonA',
      IsPersonAccount: true,
      Account_Identifier_vod__c: '118901',
      Primary_Parent_vod__c: ACCOUNT_ID,
      'Primary_Parent_vod__r.Name': 'Northstar Cancer Center',
    }),
    wrap({
      Id: '0038C00000MockHcp4',
      Name: 'Daniel Kim',
      EID_GILD__c: '118944',
      Territory_vod__c: 'US - North Region 4',
      RecordTypeId: '01241000000PersonA',
      IsPersonAccount: true,
      Account_Identifier_vod__c: '118944',
      Primary_Parent_vod__c: ACCOUNT_ID,
      'Primary_Parent_vod__r.Name': 'Northstar Cancer Center',
    }),
    wrap({
      Id: '0038C00000MockHcp5',
      Name: 'Rachel Thompson',
      EID_GILD__c: '118977',
      Territory_vod__c: 'US - North Region 4',
      RecordTypeId: '01241000000PersonA',
      IsPersonAccount: true,
      Account_Identifier_vod__c: '118977',
      Primary_Parent_vod__c: ACCOUNT_ID,
      'Primary_Parent_vod__r.Name': 'Northstar Cancer Center',
    }),
  ],

  User: [
    wrap({
      Id: '0058C00000MockUser1',
      Name: 'Harshil Gupta',
    }),
    wrap({
      Id: '0058C00000MockUser2',
      Name: 'Priya Kumar',
      Profile_Name_vod__c: 'KPH-CTAM',
    }),
    wrap({
      Id: '0058C00000MockUser3',
      Name: 'James Chen',
    }),
    wrap({
      Id: '0058C00000MockUser4',
      Name: 'Maria Lopez',
    }),
    wrap({
      Id: '0058C00000MockUser5',
      Name: 'Noah Williams',
    }),
    wrap({
      Id: '0058C00000MockUser6',
      Name: 'Ava Johnson',
    }),
    wrap({
      Id: '0058C00000MockUser7',
      Name: 'Ethan Brown',
    }),
    wrap({
      Id: '0058C00000MockUser8',
      Name: 'Lena Foster',
    }),
    wrap({
      Id: '0058C00000MockUser9',
      Name: 'Omar Hassan',
    }),
  ],

  KPH_Ecosystem_Plan__c: [
    wrap({
      Id: 'a1A8C00000MockProf1',
      KPH_Account_Plan__c: PLAN_ID,
      KPH_ATC_Cohort__c: 'Cohort 4',
      KPH_MM_ATC_Profile_Category__c: 'Academic ATC',
      KPH_MM_Medical_Education__c: 'AE Management;ATC Onboarding',
      KPH_MM_ATC_Profile__c: 'Academic MM center preparing for expanded cellular therapy demand.',
      KPH_MM_Kite_Clinical_Trial__c: 'Anito-cel Phase 3',
      KPH_MM_Competitor_Trial__c: 'Active BCMA-directed clinical research portfolio.',
      KPH_MM_Medical_Collaboration__c: 'Scientific Exchange;RWE Collaboration',
      KPH_MM_Research_Capabilities__c: 'Dedicated research office with six-week feasibility review.',
      KPH_ae_management_Status__c: 'Completed',
      KPH_atc_onboarding_Status2__c: 'Pending',
      KPH_outpatient_Status3__c: null,
      KPH_DLBCL_ATC_Profile_Category__c: 'Academic ATC',
      KPH_DLBCL_Medical_Education__c: 'AE Management;Outpatient',
      KPH_DLBCL_ATC_Profile__c: 'High-volume lymphoma program with an expanding outpatient pathway.',
      KPH_DLBCL_Clinical_Trial__c: 'ZUMA-7;ZUMA-24',
      KPH_DLBCL_Competitor_Trial__c: 'Multiple active lymphoma and bispecific studies.',
      KPH_DLBCL_Medical_Collaboration__c: 'Scientific Exchange;Investigator-Initiated Research',
      KPH_DLBCL_MM_Research_Capabilities__c: 'Cell therapy research team with established startup processes.',
      KPH_DLBCL_ae_management_Status__c: 'Completed',
      KPH_DLBCL_atc_onboarding2__c: null,
      KPH_DLBCL_outpatient3__c: 'Pending',
      KPH_Region_Dynamics_to_be_Aware_of_DLBCL__c:
        'OP infusion capacity tightening across the catchment; competing CAR-T sites are recruiting heavily into the region.',
      KPH_Region_Dynamics_to_be_Aware_of_MM__c:
        'Bispecific access widening but inpatient buy-and-bill flow remains a constraint at three of the four anchor accounts.',
    }),
  ],

  KPH_Ecosystem_Map_Dynamics__c: [
    wrap({
      Id: 'a5kMockRef1',
      CreatedById: '0058C00000MockUser2',
      Name: 'ED-MOCK-001',
      LastModifiedDate: '2026-05-18T15:00:00Z',
      Account_Plan_vod__c: PLAN_ID,
      KPH_Account_Profile__c: 'a1A8C00000MockProf1',
      KPH_HCO_Classification__c: 'Community Oncology',
      KPH_Name_of_Site__c: '0018C00000MSite1AA',
      Name_of_Site__c: 'Northern Oncology Associates',
      Indication__c: 'DLBCL',
      KPH_Comments__c: 'Anchor referral relationship.',
    }),
    wrap({
      Id: 'a5kMockRef2',
      CreatedById: '0058C00000MockUser2',
      Name: 'ED-MOCK-002',
      Account_Plan_vod__c: PLAN_ID,
      KPH_Account_Profile__c: 'a1A8C00000MockProf1',
      KPH_HCO_Classification__c: 'Community Oncology',
      KPH_Name_of_Site__c: '0018C00000MSite2AA',
      Name_of_Site__c: 'Riverside Hematology Clinic',
      Indication__c: 'MM',
      KPH_Comments__c: null,
    }),
    wrap({
      Id: 'a5kMockRef3',
      CreatedById: '0058C00000MockUser2',
      Name: 'ED-MOCK-003',
      Account_Plan_vod__c: PLAN_ID,
      KPH_Account_Profile__c: 'a1A8C00000MockProf1',
      KPH_HCO_Classification__c: 'Academic Affiliate',
      KPH_Name_of_Site__c: '0018C00000MSite3AA',
      Name_of_Site__c: 'Lakeside Cancer Partners',
      Indication__c: 'Portfolio',
      KPH_Comments__c: 'Newly engaged this quarter.',
    }),
    wrap({
      Id: 'a5kMockRef4',
      CreatedById: '0058C00000MockUser2',
      Name: 'ED-MOCK-004',
      Account_Plan_vod__c: PLAN_ID,
      KPH_Account_Profile__c: 'a1A8C00000MockProf1',
      KPH_HCO_Classification__c: 'Regional Cancer Center',
      KPH_Name_of_Site__c: '0018C00000MSite4AA',
      Name_of_Site__c: 'Westlake Regional Cancer Center',
      Indication__c: 'DLBCL',
      KPH_Comments__c: 'High-priority regional referral hub with growing CAR-T identification volume.',
    }),
    wrap({
      Id: 'a5kMockRef5',
      CreatedById: '0058C00000MockUser2',
      Name: 'ED-MOCK-005',
      Account_Plan_vod__c: PLAN_ID,
      KPH_Account_Profile__c: 'a1A8C00000MockProf1',
      KPH_HCO_Classification__c: 'Community Hematology',
      KPH_Name_of_Site__c: '0018C00000MSite5AA',
      Name_of_Site__c: 'Prairie View Hematology Group',
      Indication__c: 'MM',
      KPH_Comments__c: 'Developing referral relationship for complex relapsed and refractory patients.',
    }),
  ],

  KPH_Other_Healthcare_Networks__c: [
    wrap({
      Id: 'a5nMockNet1',
      CreatedById: '0058C00000MockUser2',
      Name: 'HN-MOCK-001',
      KPH_Account_Name__c: ACCOUNT_ID,
      KPH_Account_Profile__c: 'a1A8C00000MockProf1',
      KPH_Kite_Accountable__c: 'Priya Kumar',
    }),
    wrap({
      Id: 'a5nMockNet2',
      CreatedById: '0058C00000MockUser2',
      Name: 'HN-MOCK-002',
      KPH_Account_Name__c: ACCOUNT_ID,
      KPH_Account_Profile__c: 'a1A8C00000MockProf1',
      KPH_Kite_Accountable__c: 'James Chen',
    }),
    wrap({
      Id: 'a5nMockNet3',
      CreatedById: '0058C00000MockUser2',
      Name: 'HN-MOCK-003',
      KPH_Account_Name__c: ACCOUNT_ID,
      KPH_Account_Profile__c: 'a1A8C00000MockProf1',
      KPH_Kite_Accountable__c: null,
    }),
  ],

  KPH_Medical_Barrier_Tactical_Actions__c: [
    wrap({
      Id: 'a2B8C00000MockBD1',
      Name: 'BD-0001',
      KPH_Account_Plan__c: PLAN_ID,
      RecordTypeId: '012VI00000GKwWWYA1',
      KPH_Barrier_Title__c: 'Yescarta AE profile is elevated compared to in- and out-of-class competitors',
      KPH_Opportunity_Title__c: null,
      KPH_Indication__c: 'DLBCL',
      KPH_Medical_Tactical_Action_Status__c: 'In Progress',
      KPH_Medical_Strategy__c: 'Win the CAR T Treatment Decision',
      KPH_Comments__c: 'Clarify how CAR-T evidence informs treatment sequencing decisions.',
    }),
    wrap({
      Id: 'a2B8C00000MockBD2',
      Name: 'BD-0002',
      KPH_Account_Plan__c: PLAN_ID,
      RecordTypeId: '012VI00000GKwWXYA1',
      KPH_Barrier_Title__c: null,
      KPH_Opportunity_Title__c: 'Potential Kite Clinical Trial Site',
      KPH_Indication__c: 'DLBCL',
      KPH_Medical_Tactical_Action_Status__c: 'In Progress',
      KPH_Medical_Strategy__c: 'Drive earlier referral and CAR T Action',
      KPH_Comments__c: 'Use scientific exchange to address HCP evidence needs.',
    }),
    wrap({
      Id: 'a2B8C00000MockBD3',
      Name: 'BD-0003',
      KPH_Account_Plan__c: PLAN_ID,
      RecordTypeId: '012VI00000GKwWXYA1',
      KPH_Barrier_Title__c: null,
      KPH_Opportunity_Title__c: 'Robust Internal Referrals',
      KPH_Indication__c: 'DLBCL',
      KPH_Medical_Tactical_Action_Status__c: 'Identified - Not Started',
      KPH_Medical_Strategy__c: 'Community Expansion',
      KPH_Comments__c: 'Document site requirements and decision owners for early access.',
    }),
    wrap({
      Id: 'a2B8C00000MockBD4',
      Name: 'BD-0004',
      KPH_Account_Plan__c: PLAN_ID,
      RecordTypeId: '012VI00000GKwWXYA1',
      KPH_Barrier_Title__c: null,
      KPH_Opportunity_Title__c: 'Robust Internal Referrals',
      KPH_Indication__c: 'MM',
      KPH_Medical_Tactical_Action_Status__c: 'In Progress',
      KPH_Medical_Strategy__c: 'MM Launch Preparedness',
      KPH_Comments__c: 'Assess site interest and feasibility for real-world evidence generation.',
    }),
    wrap({
      Id: 'a2B8C00000MockBD5',
      Name: 'BD-0005',
      KPH_Account_Plan__c: PLAN_ID,
      RecordTypeId: '012VI00000GKwWXYA1',
      KPH_Barrier_Title__c: null,
      KPH_Opportunity_Title__c: 'Strong Community Network',
      KPH_Indication__c: 'DLBCL',
      KPH_Medical_Tactical_Action_Status__c: 'Identified - Not Started',
      KPH_Medical_Strategy__c: 'Community Expansion',
      KPH_Comments__c: 'Build confidence in outpatient patient selection, monitoring, and escalation workflows.',
    }),
    wrap({
      Id: 'a2B8C00000MockBD6',
      Name: 'BD-0006',
      KPH_Account_Plan__c: PLAN_ID,
      RecordTypeId: '012VI00000GKwWXYA1',
      KPH_Barrier_Title__c: null,
      KPH_Opportunity_Title__c: 'Interest to collaborate with Kite',
      KPH_Indication__c: 'DLBCL',
      KPH_Medical_Tactical_Action_Status__c: 'In Progress',
      KPH_Medical_Strategy__c: 'Maximize Opportunities in Lymphoma and Leukemia pipeline',
      KPH_Comments__c: 'Help community teams identify eligible patients and connect them to the ATC earlier.',
    }),
  ],

  KPH_Medical_Tactics__c: [
    wrap({
      Id: 'a3C8C00000MockAct1',
      Name: 'CA-0001',
      CreatedById: '0058C00000MockUser2',
      KPH_Account_Plans__c: PLAN_ID,
      LastModifiedDate: '2026-05-18T15:00:00Z',
      KPH_Barrier_or_Opportunity__c: 'a2B8C00000MockBD1',
      KPH_Medical_Tactics__c: 'C4/C6, Z24 and RWE data review combined with staff training on AE Management',
      KPH_Detail__c: 'Coordinate a scientific discussion on treatment sequencing evidence.',
      KPH_Status__c: 'In Progress',
      KPH_To_Be_Completed_By__c: '2026-07-24',
      KPH_Accountable_POD_Members__c: 'Priya Kumar',
      KPH_Indication__c: 'DLBCL',
    }),
    wrap({
      Id: 'a3C8C00000MockAct2',
      Name: 'CA-0002',
      CreatedById: '0058C00000MockUser3',
      KPH_Account_Plans__c: PLAN_ID,
      LastModifiedDate: '2026-05-18T15:00:00Z',
      KPH_Barrier_or_Opportunity__c: 'a2B8C00000MockBD2',
      KPH_Medical_Tactics__c: 'Nominate site to clinical development',
      KPH_Detail__c: 'Align channel-data content with the scientific communications team.',
      KPH_Status__c: 'Planned',
      KPH_To_Be_Completed_By__c: '2026-07-30',
      KPH_Accountable_POD_Members__c: 'James Chen',
      KPH_Indication__c: 'DLBCL',
    }),
    wrap({
      Id: 'a3C8C00000MockAct3',
      Name: 'CA-0003',
      CreatedById: '0058C00000MockUser2',
      KPH_Account_Plans__c: PLAN_ID,
      LastModifiedDate: '2026-05-18T15:00:00Z',
      KPH_Barrier_or_Opportunity__c: 'a2B8C00000MockBD4',
      KPH_Medical_Tactics__c: 'Scientific engagement focus on efficacy, safety and manufacturing differentiation from in-class and out of class competitors',
      KPH_Detail__c: 'Review candidate population criteria and evidence-generation feasibility.',
      KPH_Status__c: 'In Progress',
      KPH_To_Be_Completed_By__c: '2026-08-07',
      KPH_Accountable_POD_Members__c: 'Priya Kumar',
      KPH_Indication__c: 'MM',
    }),
    wrap({
      Id: 'a3C8C00000MockAct4',
      Name: 'CA-0004',
      CreatedById: '0058C00000MockUser2',
      KPH_Account_Plans__c: PLAN_ID,
      LastModifiedDate: '2026-07-20T14:00:00Z',
      KPH_Barrier_or_Opportunity__c: 'a2B8C00000MockBD5',
      KPH_Medical_Tactics__c: 'Assess opportunities to present data/clinical updates to CAR T department',
      KPH_Detail__c: 'Review patient selection, monitoring, and escalation considerations with the multidisciplinary team.',
      KPH_Status__c: 'Planned',
      KPH_To_Be_Completed_By__c: '2026-08-12',
      KPH_Accountable_POD_Members__c: 'Priya Kumar',
      KPH_Indication__c: 'DLBCL',
    }),
    wrap({
      Id: 'a3C8C00000MockAct5',
      Name: 'CA-0005',
      CreatedById: '0058C00000MockUser4',
      KPH_Account_Plans__c: PLAN_ID,
      LastModifiedDate: '2026-07-19T13:30:00Z',
      KPH_Barrier_or_Opportunity__c: 'a2B8C00000MockBD5',
      KPH_Medical_Tactics__c: 'Identify patient navigator at institution for opportunities to educate satellite/community',
      KPH_Detail__c: 'Provide an approved evidence summary tailored to the site outpatient readiness discussion.',
      KPH_Status__c: 'In Progress',
      KPH_To_Be_Completed_By__c: '2026-08-19',
      KPH_Accountable_POD_Members__c: 'Maria Lopez',
      KPH_Indication__c: 'DLBCL',
    }),
    wrap({
      Id: 'a3C8C00000MockAct6',
      Name: 'CA-0006',
      CreatedById: '0058C00000MockUser2',
      KPH_Account_Plans__c: PLAN_ID,
      LastModifiedDate: '2026-07-18T12:00:00Z',
      KPH_Barrier_or_Opportunity__c: 'a2B8C00000MockBD6',
      KPH_Medical_Tactics__c: 'Understand trial selection process and study start up process',
      KPH_Detail__c: 'Identify knowledge gaps across the highest-volume community referral sites.',
      KPH_Status__c: 'In Progress',
      KPH_To_Be_Completed_By__c: '2026-08-05',
      KPH_Accountable_POD_Members__c: 'Priya Kumar',
      KPH_Indication__c: 'DLBCL',
    }),
    wrap({
      Id: 'a3C8C00000MockAct7',
      Name: 'CA-0007',
      CreatedById: '0058C00000MockUser3',
      KPH_Account_Plans__c: PLAN_ID,
      LastModifiedDate: '2026-07-17T11:00:00Z',
      KPH_Barrier_or_Opportunity__c: 'a2B8C00000MockBD6',
      KPH_Medical_Tactics__c: 'Identify community relationships/referral patterns at ATC',
      KPH_Detail__c: 'Coordinate a case-based scientific discussion focused on earlier referral identification.',
      KPH_Status__c: 'Planned',
      KPH_To_Be_Completed_By__c: '2026-08-26',
      KPH_Accountable_POD_Members__c: 'James Chen',
      KPH_Indication__c: 'DLBCL',
    }),
  ],

  Account_Team_Member_vod__c: [
    wrap({
      Id: 'a4D8C00000MockTM1',
      Name: 'TM-0001',
      Team_Member_vod__c: '0058C00000MockUser2',
      Team_Member_Name_vod__c: 'Priya Kumar',
      Account_Plan_vod__c: PLAN_ID,
      Account_Team_Member_Active__c: true,
      KPH_Role__c: 'Sr Cell Therapy Account Manager',
      Role_vod__c: 'Sr Cell Therapy Account Manager',
      KPH_Participation__c: 'Core',
    }),
    wrap({
      Id: 'a4D8C00000MockTM2',
      Name: 'TM-0002',
      Team_Member_vod__c: '0058C00000MockUser3',
      Team_Member_Name_vod__c: 'James Chen',
      Account_Plan_vod__c: PLAN_ID,
      Account_Team_Member_Active__c: true,
      KPH_Role__c: 'Key Account Director',
      Role_vod__c: 'Key Account Director',
      KPH_Participation__c: 'Core',
    }),
    wrap({
      Id: 'a4D8C00000MockTM3',
      Name: 'TM-0003',
      Team_Member_vod__c: '0058C00000MockUser4',
      Team_Member_Name_vod__c: 'Maria Lopez',
      Account_Plan_vod__c: PLAN_ID,
      Account_Team_Member_Active__c: true,
      KPH_Role__c: 'Medical Science Liaison',
      Role_vod__c: 'Medical Science Liaison',
      KPH_Participation__c: 'Core',
    }),
    wrap({
      Id: 'a4D8C00000MockTM4',
      Name: 'TM-0004',
      Team_Member_vod__c: '0058C00000MockUser5',
      Team_Member_Name_vod__c: 'Dan Reyes',
      Account_Plan_vod__c: PLAN_ID,
      Account_Team_Member_Active__c: false,
      KPH_Role__c: 'Thought Leader Liaison',
      Role_vod__c: 'Thought Leader Liaison',
      KPH_Participation__c: 'Extended',
    }),
    wrap({
      Id: 'a4D8C00000MockTM5',
      Name: 'TM-0005',
      Team_Member_vod__c: '0058C00000MockUser6',
      Team_Member_Name_vod__c: 'Alex Hart',
      Account_Plan_vod__c: PLAN_ID,
      Account_Team_Member_Active__c: true,
      KPH_Role__c: 'Principal Medical Scientist',
      Role_vod__c: 'Principal Medical Scientist',
      KPH_Participation__c: 'Lead',
    }),
    wrap({
      Id: 'a4D8C00000MockTM6',
      Name: 'TM-0006',
      Team_Member_vod__c: '0058C00000MockUser7',
      Team_Member_Name_vod__c: 'Sara Iyer',
      Account_Plan_vod__c: PLAN_ID,
      Account_Team_Member_Active__c: false,
      KPH_Role__c: null,
      Role_vod__c: null,
      KPH_Participation__c: 'Extended',
    }),
    wrap({
      Id: 'a4D8C00000MockTM7',
      Name: 'TM-0007',
      Team_Member_vod__c: '0058C00000MockUser8',
      Team_Member_Name_vod__c: 'Lena Foster',
      Account_Plan_vod__c: PLAN_ID,
      Account_Team_Member_Active__c: true,
      KPH_Role__c: 'Medical Regional Director',
      Role_vod__c: 'Medical Regional Director',
      KPH_Participation__c: 'Lead',
    }),
    wrap({
      Id: 'a4D8C00000MockTM8',
      Name: 'TM-0008',
      Team_Member_vod__c: '0058C00000MockUser9',
      Team_Member_Name_vod__c: 'Omar Hassan',
      Account_Plan_vod__c: PLAN_ID,
      Account_Team_Member_Active__c: true,
      KPH_Role__c: 'Clinical Education Specialist',
      Role_vod__c: 'Clinical Education Specialist',
      KPH_Participation__c: 'Core',
    }),
  ],

  KPH_Stakeholder_Map__c: [
    wrap({
      Id: 'a5E8C00000MockStk1',
      CreatedById: '0058C00000MockUser2',
      Name: 'STK-0001',
      KPH_Account_Plan__c: PLAN_ID,
      KPH_Account__c: '0038C00000MockHcp1',
      KPH_First_Name__c: 'Anita',
      KPH_Last_Name__c: 'Rao',
      KPH_Title__c: 'Lymphoma Lead',
      KPH_Other_Title__c: null,
      Stakeholder_Account_Class__c: 'Physician',
      KPH_Name_Of_Site2__c: 'Northstar Cancer Center - Main Campus',
      KPH_Primary_Parent_Name__c: 'Northstar Cancer Center - Main Campus',
      Stakeholder_EID__c: '118822',
      Stakeholder_NPI__c: '1003456789',
    }),
    wrap({
      Id: 'a5E8C00000MockStk2',
      CreatedById: '0058C00000MockUser2',
      Name: 'STK-0002',
      KPH_Account_Plan__c: PLAN_ID,
      KPH_Account__c: '0038C00000MockHcp2',
      KPH_First_Name__c: 'Marcus',
      KPH_Last_Name__c: 'Lin',
      KPH_Title__c: 'Pharmacy Director',
      KPH_Other_Title__c: null,
      Stakeholder_Account_Class__c: 'Pharmacist',
      KPH_Name_Of_Site2__c: 'Northstar Cancer Center - Pharmacy',
      KPH_Primary_Parent_Name__c: 'Northstar Cancer Center - Pharmacy',
      Stakeholder_EID__c: '118899',
      Stakeholder_NPI__c: null,
    }),
    wrap({
      Id: 'a5E8C00000MockStk3',
      CreatedById: '0058C00000MockUser2',
      Name: 'STK-0003',
      KPH_Account_Plan__c: PLAN_ID,
      KPH_Account__c: '0038C00000MockHcp3',
      KPH_First_Name__c: 'Sofia',
      KPH_Last_Name__c: 'Patel',
      KPH_Title__c: 'Bispecifics Lead',
      KPH_Other_Title__c: null,
      Stakeholder_Account_Class__c: 'Physician',
      KPH_Name_Of_Site2__c: 'Northstar Cancer Center - Outpatient',
      KPH_Primary_Parent_Name__c: 'Northstar Cancer Center - Outpatient',
      Stakeholder_EID__c: '118901',
      Stakeholder_NPI__c: '1006677889',
    }),
    wrap({
      Id: 'a5E8C00000MockStk4',
      CreatedById: '0058C00000MockUser2',
      Name: 'STK-0004',
      KPH_Account_Plan__c: PLAN_ID,
      KPH_Account__c: '0038C00000MockHcp4',
      KPH_First_Name__c: 'Daniel',
      KPH_Last_Name__c: 'Kim',
      KPH_Title__c: 'Cell Therapy Director',
      KPH_Other_Title__c: null,
      Stakeholder_Account_Class__c: 'Physician',
      KPH_Name_Of_Site2__c: 'Northstar Cancer Center - Cellular Therapy',
      KPH_Primary_Parent_Name__c: 'Northstar Cancer Center - Cellular Therapy',
      Stakeholder_EID__c: '118944',
      Stakeholder_NPI__c: '1007788991',
    }),
    wrap({
      Id: 'a5E8C00000MockStk5',
      CreatedById: '0058C00000MockUser2',
      Name: 'STK-0005',
      KPH_Account_Plan__c: PLAN_ID,
      KPH_Account__c: '0038C00000MockHcp5',
      KPH_First_Name__c: 'Rachel',
      KPH_Last_Name__c: 'Thompson',
      KPH_Title__c: 'Other',
      KPH_Other_Title__c: 'Nurse Program Coordinator',
      Stakeholder_Account_Class__c: 'Nurse',
      KPH_Name_Of_Site2__c: 'Northstar Cancer Center - Transplant Program',
      KPH_Primary_Parent_Name__c: 'Northstar Cancer Center - Transplant Program',
      Stakeholder_EID__c: '118977',
      Stakeholder_NPI__c: null,
    }),
  ],
};

const fixtureCellValue = (cell) => cell?.value ?? cell;

const replacePlanIdCells = (row, accountPlanId) => Object.fromEntries(
  Object.entries(row || {}).map(([field, cell]) => {
    if (cell && typeof cell === 'object' && fixtureCellValue(cell) === PLAN_ID) {
      return [field, { ...cell, value: accountPlanId }];
    }
    return [field, cell];
  })
);

/**
 * Returns the fixture rows scoped to the Account Plan selected in either the
 * iPad entry point or desktop Account Plan launcher.
 *
 * Child rows use PLAN_ID as a reusable template and are rebound to the
 * selected plan. For a seeded desktop plan, the plan keeps its own identity
 * and launcher fields while inheriting any Medical fields omitted from that
 * compact launcher fixture. A real CRM plan receives a synthetic mock Medical
 * row whose CRM identity/header fields are subsequently allowed to win.
 */
export const fixtureRowsForAccountPlan = (object, accountPlanId = PLAN_ID) => {
  const sourceRows = fixtures[object] || [];
  const selectedPlanId = String(accountPlanId || PLAN_ID).trim() || PLAN_ID;
  if (object !== 'Account_Plan_vod__c') {
    return sourceRows.map((row) => replacePlanIdCells(row, selectedPlanId));
  }

  const template = sourceRows.find((row) => fixtureCellValue(row?.Id) === PLAN_ID);
  const selectedFixture = sourceRows.find(
    (row) => fixtureCellValue(row?.Id) === selectedPlanId
  );

  if (selectedFixture) {
    return sourceRows.map((row) => (
      fixtureCellValue(row?.Id) === selectedPlanId
        ? { ...(template || {}), ...row }
        : row
    ));
  }

  return sourceRows.map((row) => (
    fixtureCellValue(row?.Id) === PLAN_ID
      ? replacePlanIdCells(row, selectedPlanId)
      : row
  ));
};

/**
 * Returns the rows whose where-clause field matches a value. Supports the
 * simple `Field = 'value'` form, OR'd variant matches, and `Field IN (...)`
 * / `Field IN {...}` lists used by the Account Plan launcher.
 */
const stripOuterParens = (value) => {
  let out = String(value || '').trim();
  while (out.startsWith('(') && out.endsWith(')')) {
    out = out.slice(1, -1).trim();
  }
  return out;
};

export const filterByWhere = (rows, where) => {
  if (!where) return rows;
  const groups = String(where)
    .trim()
    .split(/\s+AND\s+/i)
    .map(stripOuterParens)
    .filter(Boolean);
  if (!groups.length) return rows;

  const parseExpectedValue = (raw) => {
    if (/^true$/i.test(raw)) return true;
    if (/^false$/i.test(raw)) return false;
    if (/^null$/i.test(raw)) return null;
    return raw;
  };

  const parseInValues = (raw) =>
    String(raw || '')
      .split(',')
      .map((value) => value.trim().replace(/^'|'$/g, ''))
      .filter(Boolean);

  const groupMatchers = groups.map((group) =>
    group
      .split(/\s+OR\s+/i)
      .map((clause) => {
        const normalized = stripOuterParens(clause);
        const equalityMatch = /^([\w.]+)\s*=\s*(?:'([^']*)'|(true|false|null))$/i.exec(normalized);
        if (equalityMatch) {
          const [, field, textValue, literalValue] = equalityMatch;
          const expected = parseExpectedValue(textValue ?? literalValue);
          return (row) => {
            const rowValue = row[field] && 'value' in row[field] ? row[field].value : null;
            return rowValue === expected;
          };
        }
        const inMatch = /^([\w.]+)\s+IN\s*(?:\(([^)]*)\)|\{([^}]*)\})$/i.exec(normalized);
        if (inMatch) {
          const [, field, onlineValues, offlineValues] = inMatch;
          const expectedValues = new Set(parseInValues(onlineValues ?? offlineValues));
          return (row) => {
            const rowValue = row[field] && 'value' in row[field] ? row[field].value : null;
            return expectedValues.has(String(rowValue || ''));
          };
        }
        return null;
      })
      .filter(Boolean)
  );
  if (groupMatchers.some((matchers) => !matchers.length)) return rows;

  return rows.filter((row) =>
    groupMatchers.every((matchers) => matchers.some((matches) => matches(row)))
  );
};
