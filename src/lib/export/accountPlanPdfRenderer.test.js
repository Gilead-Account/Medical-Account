import assert from 'node:assert/strict';
import test from 'node:test';
import { createAccountPlanPdfDocument, PDF_MIME } from './accountPlanPdfRenderer.js';
import { buildAccountPlanExecutiveSummary } from './accountPlanExecutiveSummary.js';

const exportData = {
  home: {
    account: { name: 'Mock Cancer Center', eid: 'EID-12345' },
    plan: { territoryDescription: 'US - North Region 4', lastFieldDirectorReviewDate: '2026-05-11' },
    header: {
      atcCohort: 'Cohort 4',
      atcSegment: 'Inpatient and Outpatient',
      kltSprintAccount: true,
      kadTargetList: true,
      referralVolume: '24',
      secondLinePlusVolume: '8',
    },
    customerGoals: 'Grow CART adoption while improving outpatient referral coverage.',
    strategies: { dlbcl: ['Expand Class Share', 'Lead and grow brand share'] },
  },
  barriersDrivers: {
    barriers: [{
      id: 'b1',
      name: 'Capacity constraint',
      category: 'Capacity',
      status: 'Open',
      indication: 'DLBCL',
      strategy: 'Expand Class Share',
      businessImpact: 'High',
      comments: 'No comment',
    }],
    drivers: [{
      id: 'd1',
      name: 'Clinical champion',
      category: 'Clinical',
      status: 'Open',
      indication: 'DLBCL',
      strategy: 'Lead and grow brand share',
      businessImpact: 'Medium',
    }],
    openActivityCountByBarrier: { b1: 2, d1: 0 },
  },
  criticalActivities: {
    activities: Array.from({ length: 5 }, (_, index) => ({
      id: `a${index}`,
      name: `Activity ${index + 1}`,
      parentName: index % 2 ? 'Clinical champion' : 'Capacity constraint',
      indication: 'DLBCL',
      status: 'Planned',
      ownerLabel: 'Priya Kumar',
      dueDate: '2026-05-20',
      lastModifiedDate: '2026-05-01',
    })),
  },
  poa: {
    blocks: [
      { indication: 'DLBCL', functionName: 'Customer Engagement', content: 'Coordinate quarterly referral cadence.' },
      { indication: 'MM', functionName: 'Market Access', content: 'Prepare MM access follow-up.' },
    ],
  },
  accountProfile: {
    mmProfile: {
      atcProfileCategory: 'Academic ATC',
      medicalEducation: 'Tumor Board Education',
      atcProfileSummary: 'Research-focused Medical profile.',
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
    teamMembers: [{ name: 'Priya Kumar', role: 'Sr Cell Therapy Account Manager', isPrimary: true, participation: 'Core' }],
  },
};

const blobText = async (blob) => new TextDecoder().decode(await blob.arrayBuffer());

test('renders a real A4 executive-summary PDF with every requested section', async () => {
  const summary = buildAccountPlanExecutiveSummary(exportData, {
    today: new Date('2026-06-02T00:00:00Z'),
  });
  const blob = createAccountPlanPdfDocument(summary, {
    title: 'Mock Cancer Center Account Plan',
  });
  const pdf = await blobText(blob);

  assert.equal(blob.type, PDF_MIME);
  assert.match(pdf, /^%PDF-1\.4/);
  assert.match(pdf, /\/MediaBox \[0 0 595\.28 841\.89\]/);
  assert.ok([...pdf.matchAll(/\/Type \/Page\b/g)].length >= 2);
  [
    'Mock Cancer Center Account Plan',
    'Executive Summary',
    'ATC Account Name',
    'Territory',
    'US - North Region 4',
    'Last FD Review',
    '05/11/2026',
    'Medical Strategy - DLBCL',
    'Capacity constraint',
    'Clinical champion',
    'Activity 5',
    'Stakeholders',
    'Stakeholder ID',
    'Anita Rao',
    'Priya Kumar',
    'KITE',
  ].forEach((text) => assert.match(pdf, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))));
  assert.doesNotMatch(pdf, /ATC Priority \(MM\)/);
  assert.doesNotMatch(pdf, /MM plan of action/);
  assert.doesNotMatch(pdf, /Kite Strategy - MM \/ DLBCL/);
});

test('renders the account plan PDF as a report, not PPT slide pages', async () => {
  const summary = buildAccountPlanExecutiveSummary(exportData, {
    today: new Date('2026-06-02T00:00:00Z'),
  });
  const blob = createAccountPlanPdfDocument(summary, {
    title: 'Mock Cancer Center Account Plan',
  });
  const pdf = await blobText(blob);

  assert.match(pdf, /\/MediaBox \[0 0 595\.28 841\.89\]/);
  assert.doesNotMatch(pdf, /\/MediaBox \[0 0 960 540\]/);
  assert.doesNotMatch(pdf, /ATC Segment DLBCL/);
  assert.match(pdf, /ATC Cohort DLBCL/);
  assert.doesNotMatch(pdf, /0\.00 831\.89 595\.28 10\.00 re/);
  assert.match(pdf, /0\.00 0\.00 6\.00 841\.89 re/);
  assert.doesNotMatch(pdf, /AE Safety/);
  assert.doesNotMatch(pdf, /Trials/);
  assert.doesNotMatch(pdf, /ATC flag/);
  assert.doesNotMatch(pdf, /Customer Goals for CAR T Service Line/);
  assert.match(pdf, /Barriers with Open Medical Tactics/);
  assert.match(pdf, /Opportunities with Open Medical Tactics/);
  assert.equal([...pdf.matchAll(/Mock Cancer Center \\\(EID: EID-12345\\\)/g)].length, 1);
  assert.match(pdf, /\(EID: EID-12345\)/);
  assert.doesNotMatch(
    pdf,
    /1\.000 1\.000 1\.000 rg\s+BT \/F2 8\.40 Tf [^\n]+ \(Barriers with Open Medical Tactics\)/
  );
  assert.match(
    pdf,
    /0\.027 0\.188 0\.278 rg\s+BT \/F2 8\.80 Tf [^\n]+ \(Barriers with Open Medical Tactics\)/
  );
  // Barriers/Opportunities stack as two full-width blocks (one column, two
  // rows), and record cards sit two-up inside each block:
  //   cardW = (CONTENT_WIDTH - 20 - cardGap) / 2 = (523.28 - 20 - 10) / 2 = 246.64
  // Card height stays 60 so titles and categories are not clipped.
  assert.doesNotMatch(pdf, /246\.64 42\.00 re/);
  assert.doesNotMatch(pdf, /246\.64 52\.00 re/);
  assert.match(pdf, /246\.64 60\.00 re/);
  // The old side-by-side block layout used 235.64-wide cards.
  assert.doesNotMatch(pdf, /235\.64 60\.00 re/);
  // Each block panel itself spans the full content width.
  assert.match(pdf, /523\.28 \d+\.\d\d re/);
  assert.match(pdf, /Open Barriers \/ Opportunities/);
  assert.doesNotMatch(pdf, /Open Barriers \/ Opportunities with Comments/);
  assert.doesNotMatch(pdf, /BT \/F1 6\.90 Tf 353\.85 [\d.]+ Td \(No comment\)/);
  assert.match(pdf, /BT \/F1 6\.90 Tf 359\.85 [\d.]+ Td \(No comment\)/);
  assert.doesNotMatch(pdf, /\(Barrie\)\s*Tj[\s\S]{0,120}\(r\)\s*Tj/);
  assert.match(pdf, /Medical Tactics/);
});
