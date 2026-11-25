import assert from 'node:assert/strict';
import test from 'node:test';
import JSZip from 'jszip';
import { buildAccountPlanPptSlides } from './accountPlanPptSections.js';
import { createAccountPlanPresentation } from './accountPlanPptRenderer.js';

test('generated PPT Medical Strategy slide keeps KPI cards without duplicate section labels', async () => {
  const data = {
    home: {
      account: { name: 'Test Account' },
      plan: {
        territoryDescription: 'US - North Region 4',
        lastFieldDirectorReviewDate: '2026-04-15',
      },
      header: { mmAtcPriority: 'P1', atcCohort: 'Cohort 4' },
      strategies: {
        dlbcl: ['Expand Class Share', 'Build treatment confidence'],
        mm: ['Defend Market Share', 'Improve patient identification'],
      },
    },
  };
  const slides = buildAccountPlanPptSlides(data);
  const presentation = createAccountPlanPresentation(slides, { title: 'Test Account Plan' });
  const bytes = await presentation.write({ outputType: 'nodebuffer' });
  const zip = await JSZip.loadAsync(bytes);
  const homeXml = await zip.file('ppt/slides/slide2.xml').async('string');

  for (const expected of [
    'Strategy',
    'ATC COHORT DLBCL',
    'MM ATC PRIORITY',
    'TERRITORY',
    'LAST FD REVIEW',
    'Medical Strategy',
    'DLBCL Strategy',
    'MM Strategy',
    'Expand Class Share',
    'Build treatment confidence',
    'Defend Market Share',
    'Improve patient identification',
  ]) {
    assert.match(homeXml, new RegExp(expected));
  }

  assert.equal(
    (homeXml.match(/Medical Strategy/g) || []).length,
    1,
    'Medical Strategy should appear only as the slide title',
  );

  for (const excluded of [
    'Home',
    'Current KPIs',
    'Customer Goals',
    'Barriers',
    'Opportunities',
    'Medical Tactics',
    'Team Members',
  ]) {
    assert.doesNotMatch(homeXml, new RegExp(excluded));
  }

  assert.ok(
    homeXml.indexOf('MM Strategy') < homeXml.indexOf('DLBCL Strategy'),
    'MM Strategy should be the first strategy box in the row',
  );
  assert.equal(
    (homeXml.match(/<a:buChar char="&#x2022;"\/>/g) || []).length,
    4,
    'each MM and DLBCL strategy should be rendered as a native PowerPoint bullet',
  );
});

test('generated PPT preserves Medical Education selections as plain separate lines', async () => {
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
  const presentation = createAccountPlanPresentation(slides, { title: 'Test Account Plan' });
  const bytes = await presentation.write({ outputType: 'nodebuffer' });
  const zip = await JSZip.loadAsync(bytes);
  const profileSlideIndex = slides.findIndex((slide) => slide.title === 'MM ATC Medical Profile') + 1;
  const profileXml = await zip.file(`ppt/slides/slide${profileSlideIndex}.xml`).async('string');
  const educationStart = profileXml.lastIndexOf('<a:tc>', profileXml.indexOf('AE Management'));
  const educationEnd = profileXml.indexOf('</a:tc>', educationStart) + '</a:tc>'.length;
  const educationCellXml = profileXml.slice(educationStart, educationEnd);

  assert.ok(educationStart >= 0 && educationEnd > educationStart);
  assert.equal((educationCellXml.match(/<a:p>/g) || []).length, 3);
  assert.equal((educationCellXml.match(/<a:buNone\/>/g) || []).length, 3);
  assert.ok(educationCellXml.indexOf('AE Management') < educationCellXml.indexOf('ATC Onboarding'));
  assert.ok(educationCellXml.indexOf('ATC Onboarding') < educationCellXml.indexOf('Outpatient'));
  assert.doesNotMatch(educationCellXml, /<a:buChar|[•●▪]/);
});
