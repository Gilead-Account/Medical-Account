import assert from 'node:assert/strict';
import test from 'node:test';
import JSZip from 'jszip';
import { buildAccountPlanPptSlides } from './accountPlanPptSections.js';
import { createAccountPlanPresentation } from './accountPlanPptRenderer.js';

const baseData = {
  home: {
    account: { name: 'Mock Cancer Center' },
    plan: { territoryDescription: 'US - North Region 4', lastFieldDirectorReviewDate: '2026-04-15' },
    header: {
      atcCohort: 'Cohort 4',
      atcSegment: 'Inpatient and Outpatient',
      mmAtcPriority: 'P1',
      kltSprintAccount: true,
      marketAccessPrioritizedAccount: 'Yes',
      kadTargetList: true,
      referralVolume: '24',
      secondLinePlusVolume: '8',
    },
    customerGoals: 'Grow CART adoption while improving outpatient referral coverage.',
    strategies: { dlbcl: ['Expand Class Share', 'Lead/Grow Brand Share'], mm: ['Defend Market Share'] },
  },
  barriersDrivers: {
    barriers: [
      {
        id: 'b1',
        type: 'Barrier',
        name: 'Capacity constraint',
        category: 'Capacity',
        status: 'Open',
        indication: 'DLBCL',
        strategy: 'Expand Class Share',
        businessImpact: 'High',
      },
    ],
    drivers: [
      {
        id: 'd1',
        type: 'Driver',
        name: 'Clinical champion',
        category: 'Clinical',
        status: 'Open',
        indication: 'DLBCL',
        strategy: 'Lead/Grow Brand Share',
        businessImpact: 'Medium',
      },
    ],
    openActivityCountByBarrier: { b1: 2, d1: 0 },
  },
  criticalActivities: {
    activities: Array.from({ length: 7 }, (_, index) => ({
      id: `a${index}`,
      name: `Activity ${index + 1}`,
      barrierDriverId: 'b1',
      parentName: 'Capacity constraint',
      indication: 'DLBCL',
      status: 'Planned',
      ownerLabel: 'Priya Kumar',
      dueDate: '2026-05-20',
      lastModifiedDate: '2026-05-01',
    })),
  },
  poa: {
    blocks: [
      {
        heading: 'DLBCL Customer Engagement Plan of Action',
        indication: 'DLBCL',
        functionName: 'Customer Engagement',
        content: 'Coordinate quarterly referral cadence.',
      },
      {
        heading: 'MM Customer Engagement Plan of Action',
        indication: 'MM',
        functionName: 'Customer Engagement',
        content: 'Prepare MM access follow-up.',
      },
      {
        heading: 'DLBCL Market Access Plan of Action',
        indication: 'DLBCL',
        functionName: 'Market Access',
        content: 'Prepare P&T re-review packet.',
      },
    ],
  },
  accountProfile: {
    mmMedicalProfile: {
      atcProfileCategory: 'Academic ATC',
      medicalEducation: 'AE Management',
      'medicalEducationStatusFor:AE Management': 'Completed',
      atcProfile: 'Research-focused Medical profile.',
    },
    dlbclMedicalProfile: {
      atcProfileCategory: 'Community ATC',
      medicalEducation: 'ATC Onboarding;Outpatient',
      'medicalEducationStatusFor:ATC Onboarding': 'Pending',
      'medicalEducationStatusFor:Outpatient': 'Declined',
      atcProfile: 'Referral-heavy Lymphoma profile.',
    },
    referralAccounts: [{ name: 'Northern Oncology', hcoClassification: 'Community', indication: 'DLBCL' }],
    healthcareNetworks: [{ accountName: 'Northern Network', kiteAccountable: 'James Chen' }],
    regionalDynamics: { DLBCL: 'Capacity is tightening.', MM: 'Access is widening.' },
  },
  stakeholders: {
    stakeholders: [{
      name: 'Anita Rao',
      stakeholderId: '118822',
      role: 'Lymphoma Lead',
      primaryParent: 'Mock Cancer Center',
    }],
  },
  teamMembers: {
    teamMembers: [
      { name: 'Priya Kumar', role: 'Sr Cell Therapy Account Manager', isPrimary: { value: true }, participation: 'Core' },
      { name: 'James Chen', role: 'Market Access', isPrimary: false, participation: 'Extended' },
      { name: 'Maria Lopez', role: 'TLL', status: 'Active', participation: 'Lead' },
    ],
  },
};

test('PPT cover always renders Last FD Review as a date', () => {
  const slides = buildAccountPlanPptSlides({
    home: {
      plan: {
        approvalStatus: 'Under Review',
        lastFieldDirectorReviewDate: '2026-04-15',
      },
    },
  });
  const titleSlide = slides.find((slide) => slide.key === 'title');

  assert.equal(
    titleSlide.fields.find((field) => field.label === 'Last FD Review')?.value,
    '04/15/2026'
  );
});

test('cover shows the plan name once, with EID, Territory and Last FD Review', async () => {
  const data = {
    home: {
      account: { name: 'Mock Cancer Center', eid: '998877' },
      plan: { territoryDescription: 'US - North Region 4', lastFieldDirectorReviewDate: '2026-04-15' },
    },
  };
  const slides = buildAccountPlanPptSlides(data);
  const title = 'Mock Cancer Center Account Plan';
  const presentation = createAccountPlanPresentation(slides, { title });
  const zip = await JSZip.loadAsync(await presentation.write({ outputType: 'nodebuffer' }));
  const coverXml = await zip.file('ppt/slides/slide1.xml').async('string');
  const runs = [...coverXml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((match) => match[1]);

  for (const expected of ['EID', '998877', 'TERRITORY', 'US - North Region 4', 'LAST FD REVIEW', '04/15/2026']) {
    assert.ok(runs.includes(expected), `cover is missing ${expected}`);
  }
  assert.ok(runs.includes(title));
  // The account name appears only inside the plan title, never on its own line.
  assert.equal(runs.filter((run) => run.includes('Mock Cancer Center')).length, 1);
});

test('keeps title page first and starts Medical Strategy edits on the next slide', () => {
  const slides = buildAccountPlanPptSlides(baseData, { maxRowsPerSlide: 5 });
  const titleSlide = slides[0];
  const homeSlide = slides.find((slide) => slide.key === 'home');

  assert.equal(titleSlide.type, 'title');
  assert.equal(titleSlide.key, 'title');
  assert.equal(titleSlide.title, 'Mock Cancer Center Account Plan');
  assert.equal(slides[1], homeSlide);
  assert.equal(homeSlide.type, 'cards');
  assert.equal(homeSlide.title, 'Medical Strategy');
  assert.equal(homeSlide.label, 'Strategy');
  assert.equal(homeSlide.summaryTitle, '');
  assert.equal(homeSlide.cardsTitle, '');
  assert.deepEqual(homeSlide.summaryCards.map((card) => card.label), [
    'ATC Cohort DLBCL',
    'MM ATC Priority',
    'Territory',
    'Last FD Review',
  ]);
  assert.deepEqual(homeSlide.cards.map((card) => card.title), [
    'MM Strategy',
    'DLBCL Strategy',
  ]);
  assert.deepEqual(homeSlide.cards.map((card) => card.label), ['', '']);
  assert.equal(homeSlide.cards.find((card) => card.title === 'DLBCL Strategy').body, 'Expand Class Share\nLead/Grow Brand Share');
  assert.equal(homeSlide.cards.find((card) => card.title === 'MM Strategy').body, 'Defend Market Share');
  assert.equal(homeSlide.cards.length, 2);

  const homeContent = JSON.stringify(homeSlide);
  assert.doesNotMatch(homeContent, /Customer Goals|Barriers|Opportunities|Medical Tactics|Team Members/i);
});

test('PPT stakeholder and team member sections use executive-summary field mapping', () => {
  const slides = buildAccountPlanPptSlides(baseData, { maxRowsPerSlide: 5 });
  const stakeholderSlide = slides.find((slide) => slide.key === 'stakeholders');
  const teamMemberSlide = slides.find((slide) => slide.key === 'team-members');

  assert.deepEqual(stakeholderSlide.headers, [
    'Name',
    'Stakeholder ID',
    'Role',
    'Primary Parent',
  ]);
  assert.deepEqual(stakeholderSlide.rows[0], [
    'Anita Rao',
    '118822',
    'Lymphoma Lead',
    'Mock Cancer Center',
  ]);

  assert.deepEqual(teamMemberSlide.headers, ['Name', 'Role', 'Status', 'Participation']);
  assert.deepEqual(teamMemberSlide.rows.map((row) => row[2]), ['Active', 'Inactive', 'Active']);
  assert.deepEqual(teamMemberSlide.rows.map((row) => row[3]), ['Core', 'Extended', 'Lead']);
});

test('puts barriers and drivers on separate grouped slides', () => {
  const slides = buildAccountPlanPptSlides(baseData, { maxRowsPerSlide: 5 });
  const barrierSlide = slides.find((slide) => slide.key === 'barriers');
  const driverSlide = slides.find((slide) => slide.key === 'drivers');
  const combinedSlide = slides.find((slide) => slide.key === 'barriers-drivers');

  assert.equal(combinedSlide, undefined);
  assert.equal(barrierSlide.title, 'Barriers');
  assert.equal(barrierSlide.type, 'barrier-groups');
  assert.equal(barrierSlide.label, 'Barriers & Medical Tactics');
  assert.equal(driverSlide.type, 'barrier-groups');
  assert.equal(driverSlide.title, 'Opportunities');
  assert.equal(driverSlide.label, 'Opportunities & Medical Tactics');
  assert.deepEqual(barrierSlide.groups.map((group) => group.barrier.title), ['Capacity constraint']);
  assert.deepEqual(driverSlide.groups.map((group) => group.barrier.title), ['Clinical champion']);
  assert.deepEqual(barrierSlide.groups[0].barrier.cells, [
    'Capacity constraint', 'Expand Class Share', 'DLBCL', 'Open',
  ]);
  assert.equal(barrierSlide.groups[0].rows.length, 7, 'all seven linked tactics stay with the barrier');
  // Tactics live only inside their barrier/opportunity group now — there is no
  // standalone Medical Tactics section.
  assert.equal(slides.some((slide) => slide.key.startsWith('critical-activities')), false);
});

test('exports one slide per Medical Account Profile tab and skips the Commercial tabs', () => {
  const slides = buildAccountPlanPptSlides(baseData, { maxRowsPerSlide: 20 });
  const profileSlides = slides.filter((slide) => slide.label === 'Medical Account Profile');

  assert.deepEqual(profileSlides.map((slide) => slide.title), [
    'MM ATC Medical Profile',
    'DLBCL ATC Medical Profile',
    'Referral Mapping',
  ]);
  assert.equal(
    slides.some((slide) => /Comm Profile/i.test(slide.title)),
    false,
    'the reference-only Commercial tabs are not exported'
  );

  // Each tab reads its own indication's field group and carries that
  // indication's labels, matching the Account Profile tab.
  const [mm, dlbcl] = profileSlides;
  assert.deepEqual(mm.headers, ['Field', 'Value']);
  assert.deepEqual(mm.rows.map((row) => row[0]), [
    'MM ATC Profile Category',
    'MM Medical Education',
    'MM ATC Profile',
    'Kite MM',
    'MM Competitor Trial',
    'MM Medical Collaboration',
    'MM Research Capabilities Timelines',
  ]);
  assert.deepEqual(dlbcl.rows.map((row) => row[0]), [
    'DLBCL ATC Profile Category',
    'DLBCL Medical Education',
    'DLBCL ATC Profile',
    'Kite Lymphoma/Pipeline',
    'DLBCL Competitor Trial',
    'DLBCL Medical Collaboration',
    'DLBCL Research Capabilities Timelines',
  ]);
  assert.equal(mm.rows.find((row) => row[0] === 'MM ATC Profile Category')[1], 'Academic ATC');
  assert.equal(
    mm.rows.find((row) => row[0] === 'MM ATC Profile')[1],
    'Research-focused Medical profile.'
  );
  assert.equal(mm.rows.find((row) => row[0] === 'Kite MM')[1], 'Not entered');

  // The DLBCL slide reads the DLBCL field group, not the MM one.
  assert.equal(dlbcl.rows.find((row) => row[0] === 'DLBCL ATC Profile Category')[1], 'Community ATC');
  assert.equal(
    dlbcl.rows.find((row) => row[0] === 'DLBCL ATC Profile')[1],
    'Referral-heavy Lymphoma profile.'
  );
  assert.equal(
    dlbcl.rows.find((row) => row[0] === 'DLBCL Medical Education')[1],
    'ATC Onboarding - Pending\nOutpatient - Declined'
  );

  // Referral Mapping stands alone with its own columns — the Other Healthcare
  // Networks table on the same tab is not mixed in.
  const referral = profileSlides[2];
  assert.deepEqual(referral.headers, ['Site Name', 'HCO Classification', 'Indication']);
  assert.deepEqual(referral.rows, [['Northern Oncology', 'Community', 'DLBCL']]);
  assert.doesNotMatch(JSON.stringify(slides), /Healthcare Network|Kite Accountable|Regional Dynamics/i);
});

test('renders semicolon-delimited profile multi-selects comma separated', () => {
  const slides = buildAccountPlanPptSlides({
    accountProfile: { mmMedicalProfile: { atcProfileCategory: 'Academic ATC;High Research Engagement' } },
  });
  const mm = slides.find((slide) => slide.title === 'MM ATC Medical Profile');

  assert.equal(
    mm.rows.find((row) => row[0] === 'MM ATC Profile Category')[1],
    'Academic ATC, High Research Engagement'
  );
});

test('renders each Medical Education selection with its own status on a new line', () => {
  const slides = buildAccountPlanPptSlides({
    accountProfile: {
      mmMedicalProfile: {
        medicalEducation: 'AE Management;ATC Onboarding;Outpatient',
        'medicalEducationStatusFor:AE Management': 'Completed',
        'medicalEducationStatusFor:ATC Onboarding': 'Pending',
        'medicalEducationStatusFor:Outpatient': 'Declined',
      },
    },
  });
  const mm = slides.find((slide) => slide.title === 'MM ATC Medical Profile');

  assert.equal(
    mm.rows.find((row) => row[0] === 'MM Medical Education')[1],
    'AE Management - Completed\nATC Onboarding - Pending\nOutpatient - Declined'
  );
});

test('leaves out Medical Education values whose status is unset', () => {
  const slides = buildAccountPlanPptSlides({
    accountProfile: {
      mmMedicalProfile: {
        medicalEducation: 'AE Management;ATC Onboarding;Outpatient',
        'medicalEducationStatusFor:AE Management': '',
        'medicalEducationStatusFor:ATC Onboarding': '-',
        'medicalEducationStatusFor:Outpatient': 'Pending',
      },
    },
  });
  const mm = slides.find((slide) => slide.title === 'MM ATC Medical Profile');

  assert.equal(
    mm.rows.find((row) => row[0] === 'MM Medical Education')[1],
    'Outpatient - Pending'
  );
});

test('drops the Medical Education row when no selection has a status', () => {
  const slides = buildAccountPlanPptSlides({
    accountProfile: {
      mmMedicalProfile: {
        medicalEducation: 'AE Management;Outpatient',
        atcProfileCategory: 'Academic ATC',
      },
    },
  });
  const mm = slides.find((slide) => slide.title === 'MM ATC Medical Profile');

  assert.equal(mm.rows.some((row) => row[0] === 'MM Medical Education'), false);
  assert.equal(mm.rows.find((row) => row[0] === 'MM ATC Profile Category')[1], 'Academic ATC');
});

test('places the Medical Account Profile tabs after Barriers and Opportunities', () => {
  const slides = buildAccountPlanPptSlides({
    barriersDrivers: {
      barriers: [{ id: 'b1', name: 'Capacity', type: 'Barrier' }],
      drivers: [{ id: 'd1', name: 'Champion', type: 'Driver' }],
    },
    accountProfile: {},
  });
  const indexOfKey = (key) => slides.findIndex((slide) => slide.key.startsWith(key));

  assert.ok(indexOfKey('drivers') > indexOfKey('barriers'));
  assert.ok(indexOfKey('mm-medical-profile') > indexOfKey('drivers'));
  assert.ok(indexOfKey('dlbcl-medical-profile') > indexOfKey('mm-medical-profile'));
  assert.ok(indexOfKey('referral-dynamics') > indexOfKey('dlbcl-medical-profile'));
});

test('exports neither a standalone Medical Tactics section nor a Plan of Action slide', () => {
  const slides = buildAccountPlanPptSlides(baseData, { maxRowsPerSlide: 5 });

  assert.equal(slides.some((slide) => slide.key.startsWith('critical-activities')), false);
  assert.equal(slides.some((slide) => slide.key === 'poa'), false);
  assert.equal(slides.some((slide) => slide.type === 'boxes'), false);
  assert.equal(slides.some((slide) => /Plan of Action/i.test(slide.title || '')), false);
});

test('splits long tables across multiple slides', () => {
  // The ATC profile tabs carry seven fields, so a small row budget chunks them.
  const slides = buildAccountPlanPptSlides(baseData, { maxRowsPerSlide: 3 });
  const profileSlides = slides.filter((slide) => slide.key.startsWith('mm-medical-profile'));

  assert.equal(profileSlides.length, 3);
  assert.deepEqual(profileSlides.map((slide) => slide.rows.length), [3, 3, 1]);
  assert.equal(profileSlides[0].chunkLabel, '1 of 3');
});
