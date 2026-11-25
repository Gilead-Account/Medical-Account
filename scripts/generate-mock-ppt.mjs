import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';
import {
  buildAccountPlanExportTitle,
  buildAccountPlanPptSlides,
} from '../src/lib/export/accountPlanPptSections.js';
import {
  applyCoverTemplateContentTypes,
  buildCoverSlideXml,
  formatCoverDate,
  getCoverAccountName,
  sanitizeCoverSlideMasterRelsXml,
  sanitizeCoverSlideMasterXml,
} from '../src/lib/export/accountPlanPptCoverTemplate.js';
import { createAccountPlanPresentation } from '../src/lib/export/accountPlanPptRenderer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outputPath = path.join(rootDir, 'dist', 'mock-account-plan-export.pptx');
const coverTemplateDir = path.join(rootDir, 'src', 'lib', 'export', 'templates');

const coverTextParts = [
  ['ppt/slides/_rels/slide1.xml.rels', 'cover/slide1.xml.rels'],
  ['ppt/slideLayouts/slideLayout200.xml', 'cover/slideLayout200.xml'],
  ['ppt/slideLayouts/_rels/slideLayout200.xml.rels', 'cover/slideLayout200.xml.rels'],
  ['ppt/slideMasters/slideMaster8.xml', 'cover/slideMaster8.xml', 'coverMaster'],
  ['ppt/slideMasters/_rels/slideMaster8.xml.rels', 'cover/slideMaster8.xml.rels', 'coverMasterRels'],
  ['ppt/theme/theme8.xml', 'cover/theme8.xml'],
  ['ppt/tags/tag13.xml', 'cover/tag13.xml'],
  ['ppt/tags/tag14.xml', 'cover/tag14.xml'],
];

const coverBinaryParts = [
  ['ppt/media/image3.emf', 'cover/image3.emf'],
  ['ppt/media/image9.png', 'cover/image9.png'],
  ['ppt/media/image56.emf', 'cover/image56.emf'],
  ['ppt/media/image68.png', 'cover/image68.png'],
  ['ppt/media/kiteLogo.png', 'cover/kiteLogo.png'],
  ['ppt/embeddings/oleObject9.bin', 'cover/oleObject9.bin'],
  ['ppt/embeddings/oleObject10.bin', 'cover/oleObject10.bin'],
];

const nextXmlId = (xml, pattern) => {
  const ids = [...String(xml || '').matchAll(pattern)]
    .map((match) => Number(match[1]))
    .filter(Number.isFinite);
  return Math.max(0, ...ids) + 1;
};

const addCoverSlideMasterToPresentation = async (zip) => {
  const relsFile = zip.file('ppt/_rels/presentation.xml.rels');
  const presentationFile = zip.file('ppt/presentation.xml');
  if (!relsFile || !presentationFile) return;

  let relsXml = await relsFile.async('string');
  let masterRelId = relsXml.match(/<Relationship[^>]+Id="([^"]+)"[^>]+Target="slideMasters\/slideMaster8\.xml"[^>]*\/>/)?.[1];
  if (!masterRelId) {
    masterRelId = `rId${nextXmlId(relsXml, /Id="rId(\d+)"/g)}`;
    relsXml = relsXml.replace(
      '</Relationships>',
      `<Relationship Id="${masterRelId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster8.xml"/></Relationships>`,
    );
    zip.file('ppt/_rels/presentation.xml.rels', relsXml);
  }

  let presentationXml = await presentationFile.async('string');
  if (!presentationXml.includes(`r:id="${masterRelId}"`)) {
    const nextMasterId = nextXmlId(presentationXml, /<p:sldMasterId id="(\d+)"/g);
    presentationXml = presentationXml.replace(
      '</p:sldMasterIdLst>',
      `<p:sldMasterId id="${Math.max(nextMasterId, 2147483649)}" r:id="${masterRelId}"/></p:sldMasterIdLst>`,
    );
    zip.file('ppt/presentation.xml', presentationXml);
  }
};

const mockParentNameById = {
  'mock-b-1': 'OP infusion capacity capped at 12 chairs',
  'mock-b-2': 'P&T re-review delaying MM access',
  'mock-d-1': 'Lymphoma CAR-T champion',
};

const activityRows = [
  'OP capacity workshop with infusion lead',
  'Draft MM P&T resubmission packet',
  'Confirm northern referral cadence',
  'Brief MSL on bispecific timing',
  'Update referral map for northern catchment',
  'Prepare outpatient administration summary',
  'Schedule tumor board sequencing review',
  'Align payer story with finance team',
  'Refresh REMS workflow gaps',
  'Finalize KAD stakeholder follow-up',
  'Review regional dinner attendee list',
  'Confirm pharmacy benefit positioning',
// Spread the mock tactics so the grouped export exercises every relationship
// count: many tactics, exactly one, and barriers with none at all.
].map((name, index) => {
  const parents = ['mock-b-1', 'mock-d-1', 'mock-b-1', 'mock-d-1', 'mock-b-2', 'mock-d-1'];
  const parentId = parents[index % parents.length];
  return {
    id: `mock-act-${index + 1}`,
    name,
    barrierDriverId: parentId,
    parentName: mockParentNameById[parentId],
    indication: index % 4 === 1 ? 'MM' : 'DLBCL',
    status: index % 3 === 0 ? 'In Progress' : 'Planned',
    ownerLabel: index % 2 === 0 ? 'Priya Kumar' : 'James Chen',
    dueDate: `2026-06-${String(5 + index).padStart(2, '0')}`,
    lastModifiedDate: '2026-05-18',
  };
});

const mockData = {
  home: {
    account: { name: 'Mock Cancer Center', eid: '998877' },
    plan: { territoryDescription: 'US - North Region 4', lastFieldDirectorReviewDate: '2026-04-15' },
    header: {
      atcCohort: 'Cohort 4',
      mmAtcPriority: 'Priority 1',
    },
    customerGoals:
      'Lift DLBCL share in OP setting, deepen referral coverage in northern catchment, and secure FY26 P&T re-review for both indications.',
    strategies: {
      dlbcl: [
        'Grow Class | Shift Patients Earlier to CAR-T',
        'Grow Class | Expand Referral Networks',
        'Grow Class | Improve Patient Identification',
        'Win Brand | Establish YESCARTA as Preferred Choice',
      ],
    },
  },
  barriersDrivers: {
    barriers: [
      ['OP infusion capacity capped at 12 chairs', 'Capacity', 'High', 'Grow Class | Shift Patients Earlier to CAR-T', 2],
      ['P&T re-review delaying MM access', 'Operational', 'Medium', 'Grow Class | Expand Referral Networks', 1],
      ['Limited bispecific eligibility data for DLBCL', 'Clinical', 'Medium', 'Grow Class | Improve Patient Identification', 0],
      ['Referral leakage to non-Kite ATCs in northern catchment', 'Access', 'High', 'Win Brand | Establish YESCARTA as Preferred Choice', 0],
    ].map(([name, category, impact, strategy, count], index) => ({
      id: `mock-b-${index + 1}`,
      type: 'Barrier',
      name,
      category,
      status: 'Open',
      indication: index === 1 ? 'MM' : 'DLBCL',
      strategy,
      businessImpact: impact,
      openCount: count,
      comments: index === 0
        ? 'Infusion lead flagged that chair turnover is the binding constraint; a second shift is under review for FY26.'
        : '',
    })),
    drivers: [
      ['Lymphoma CAR-T champion', 'Clinical', 'High', 'Grow Class | Improve Patient Identification'],
      ['Pharmacy lead championing CAR-T', 'Operational', 'Medium', 'Win Brand | Establish YESCARTA as Preferred Choice'],
      ['DLBCL tumor board chair receptive to sequencing data', 'Clinical', 'High', 'Win Brand | Build Confidence in Safety/ AE'],
      ['Strong KAD relationship with lymphoma lead', 'Operational', 'Medium', 'Win Brand | Scale Outpatient Treatment Adoption'],
    ].map(([name, category, impact, strategy], index) => ({
      id: `mock-d-${index + 1}`,
      type: 'Driver',
      name,
      category,
      status: 'Open',
      indication: index === 1 ? 'MM' : 'DLBCL',
      strategy,
      businessImpact: impact,
    })),
    openActivityCountByBarrier: {
      'mock-b-1': 2,
      'mock-b-2': 1,
      'mock-d-1': 0,
    },
  },
  criticalActivities: { activities: activityRows },
  poa: {
    blocks: [
      {
        indication: 'DLBCL',
        functionName: 'Customer Engagement',
        content: 'Quarterly OP infusion capacity reviews with lymphoma lead and KAD.',
      },
      {
        indication: 'MM',
        functionName: 'Customer Engagement',
        content: 'Bispecific competitive update brief with MM clinicians ahead of P&T re-review.',
      },
      {
        indication: 'DLBCL',
        functionName: 'Medical Affairs',
        content: 'MSL to socialize Phase 3 follow-up with bispecific lead.',
      },
      {
        indication: 'MM',
        functionName: 'Market Access',
        content: 'Confirm pharmacy benefit positioning and inpatient buy-and-bill gaps.',
      },
    ],
  },
  accountProfile: {
    mmProfile: {
      atcProfileCategory: 'Academic ATC',
      medicalEducation: 'Peer-to-peer education',
      atcProfileSummary: 'Regional center expanding outpatient CAR-T capability.',
      kiteClinicalTrial: 'Participating',
      competitorTrial: 'One active competitor study',
      medicalCollaboration: 'Tumor board collaboration',
      researchCapabilitiesTimelines: 'Site activation expected in Q4',
    },
    referralAccounts: [
      { name: 'Northern Oncology Associates', hcoClassification: 'Community Oncology', indication: 'DLBCL' },
      { name: 'Riverside Hematology Clinic', hcoClassification: 'Community Oncology', indication: 'MM' },
      { name: 'Lakeside Cancer Partners', hcoClassification: 'Academic Affiliate', indication: 'Portfolio' },
    ],
    healthcareNetworks: [
      { accountName: 'Mock Cancer Center', kiteAccountable: 'Priya Kumar' },
      { accountName: 'Northern Regional Network', kiteAccountable: 'James Chen' },
    ],
    regionalDynamics: {
      DLBCL: 'OP infusion capacity tightening across the catchment; competing CAR-T sites are recruiting heavily into the region.',
      MM: 'Bispecific access widening but inpatient buy-and-bill flow remains constrained.',
    },
  },
  stakeholders: {
    stakeholders: [
      { name: 'Anita Rao', stakeholderId: '10001', role: 'Lymphoma Lead', primaryParent: 'Mock Cancer Center' },
      { name: 'Marcus Lin', stakeholderId: '10002', role: 'Pharmacy Director', primaryParent: 'Mock Cancer Center - Pharmacy' },
      { name: 'Sofia Patel', stakeholderId: '10003', role: 'Bispecifics Lead', primaryParent: 'Mock Cancer Center - Outpatient' },
    ],
  },
  teamMembers: {
    teamMembers: [
      { name: 'Priya Kumar', role: 'Sr Cell Therapy Account Manager', isPrimary: true, participation: 'Core' },
      { name: 'James Chen', role: 'Key Account Director', isPrimary: true, participation: 'Core' },
      { name: 'Maria Lopez', role: 'Medical Science Liaison', isPrimary: true, participation: 'Core' },
      { name: 'Dan Reyes', role: 'Thought Leader Liaison', isPrimary: false, participation: 'Extended' },
    ],
  },
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
const title = buildAccountPlanExportTitle(mockData);
const slides = buildAccountPlanPptSlides(mockData, { maxRowsPerSlide: 7 });
const pres = createAccountPlanPresentation(slides, { title });
const generatedBlob = await pres.write({ outputType: 'blob' });
const zip = await JSZip.loadAsync(await generatedBlob.arrayBuffer());
const templateXml = await fs.readFile(
  path.join(coverTemplateDir, 'mockCoverSlide1.xml'),
  'utf8',
);
zip.file('ppt/slides/slide1.xml', buildCoverSlideXml(templateXml, {
  title,
  accountName: getCoverAccountName(mockData, title),
  generatedDate: formatCoverDate(),
}));
for (const [zipPath, sourcePath, sanitize] of coverTextParts) {
  let content = await fs.readFile(path.join(coverTemplateDir, sourcePath), 'utf8');
  if (sanitize === 'coverMaster') content = sanitizeCoverSlideMasterXml(content);
  if (sanitize === 'coverMasterRels') content = sanitizeCoverSlideMasterRelsXml(content);
  zip.file(zipPath, content);
}
for (const [zipPath, sourcePath] of coverBinaryParts) {
  zip.file(zipPath, await fs.readFile(path.join(coverTemplateDir, sourcePath)));
}
const contentTypes = zip.file('[Content_Types].xml');
if (contentTypes) {
  zip.file('[Content_Types].xml', applyCoverTemplateContentTypes(await contentTypes.async('string')));
}
await addCoverSlideMasterToPresentation(zip);
const outputBuffer = await zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 9 },
});
let writtenOutputPath = outputPath;
try {
  await fs.writeFile(outputPath, outputBuffer);
} catch (error) {
  if (error?.code !== 'EBUSY') throw error;
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+$/, '').replace('T', '_');
  writtenOutputPath = path.join(rootDir, 'dist', `mock-account-plan-export_${timestamp}.pptx`);
  await fs.writeFile(writtenOutputPath, outputBuffer);
}
console.log(JSON.stringify({ outputPath: writtenOutputPath, slideCount: slides.length }, null, 2));
