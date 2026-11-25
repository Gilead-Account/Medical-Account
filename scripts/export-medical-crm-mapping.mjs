import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = resolve(root, 'docs');

const platformFields = new Set([
  'Id', 'Name', 'OwnerId', 'CreatedDate', 'CreatedById', 'LastModifiedDate',
  'LastActivityDate', 'RecordTypeId', 'FirstName', 'LastName', 'IsPersonAccount',
]);

const field = (api, logicalName = '', required = 'Confirm', notes = '') => ({
  api,
  logicalName,
  required,
  notes,
});

const groups = [
  {
    page: 'Desktop Account Plan Launcher',
    area: 'Plan selection and launcher table',
    object: 'Account_Plan_vod__c',
    access: 'Read',
    source: 'src/lib/dataservice/accountPlan/accountPlanLauncher.js',
    fields: [
      field('Id', 'Plan record ID', 'Yes'),
      field('Name', 'Plan name', 'Yes'),
      field('OwnerId', 'Plan owner lookup', 'Yes'),
      field('Account_vod__c', 'ATC account lookup', 'Yes'),
      field('Owner.Name', 'Owner display name'),
      field('Owner.FirstName', 'Owner first name'),
      field('Owner.LastName', 'Owner last name'),
      field('KPH_ATC_EID__c', 'ATC EID'),
      field('KPH_ATC_Certified_Date__c', 'ATC certified date'),
      field('KPH_Plan_status__c', 'Plan status'),
      field('KPH_Territory_Description__c', 'Territory description'),
      field('KPH_Territory__c', 'Territory'),
      field('KPH_Last_FD_Review_date__c', 'Last FD Review date'),
      field('KPH_Medical_Submitted_Date__c', 'Submitted date'),
    ],
  },
  {
    page: 'Desktop Account Plan Launcher',
    area: 'Owner fallback lookup',
    object: 'User',
    access: 'Read',
    source: 'src/lib/dataservice/accountPlan/accountPlanLauncher.js',
    fields: ['Id', 'Name', 'FirstName', 'LastName'].map((api) => field(api)),
  },
  {
    page: 'Desktop Account Plan Launcher',
    area: 'Account priority lookup and eligible-plan filters',
    object: 'Account',
    access: 'Read',
    source: 'src/lib/dataservice/accountPlan/accountPlanLauncher.js',
    fields: [
      field('Id', 'Account record ID', 'Yes'),
      field('KPH_MM_ATC_Priority__c', 'MM ATC Priority'),
      field('KPH_Market_Access_Prioritized_Account__c', 'Market Access prioritized account'),
      field(
        'Hospital_Type__c',
        'Hospital type',
        'Yes',
        'Launcher filter currently requires Authorized Treatment Center.'
      ),
      field(
        'Customer_Master_Status_vod__c',
        'Customer master status',
        'Yes',
        'Launcher filter currently requires Valid_vod.'
      ),
    ],
  },
  {
    page: 'Desktop Account Plan Launcher',
    area: 'Cohort fallback lookup',
    object: 'KPH_Ecosystem_Plan__c',
    access: 'Read',
    source: 'src/lib/dataservice/accountPlan/accountPlanLauncher.js',
    fields: [
      field('Id', 'Profile record ID', 'Yes'),
      field('KPH_Account_Plan__c', 'Account Plan lookup', 'Yes'),
      field('KPH_ATC_Cohort__c', 'ATC Cohort DLBCL'),
      field('LastModifiedDate', 'Last modified date'),
    ],
  },
  {
    page: 'Shared Shell / Every Page',
    area: 'Account Plan header and common context',
    object: 'Account_Plan_vod__c',
    access: 'Read / Update',
    source: 'src/lib/dataservice/accountPlan/shared.js',
    fields: [
      'Id', 'LastModifiedDate', 'Account_vod__c', 'KPH_ATC_Strategic_Opportunities__c',
      'KPH_Last_FD_Review_date__c', 'KPH_Territory_Description__c',
      'KPH_Territory__c', 'KPH_Approval_Status__c', 'KPH_Is_Submitted__c',
    ].map((api) => field(api)),
  },
  {
    page: 'Shared Shell / Every Page',
    area: 'ATC account header',
    object: 'Account',
    access: 'Read',
    source: 'src/lib/dataservice/accountPlan/shared.js',
    fields: [
      field('Id', 'Account record ID', 'Yes'),
      field('Name', 'ATC account name', 'Yes'),
      field('EID_GILD__c', 'EID'),
      field('Territory_vod__c', 'Account territory'),
      field('KPH_MM_ATC_Priority__c', 'MM ATC Priority'),
    ],
  },
  {
    page: 'FD Approval Backend',
    area: 'Submit and approve workflow',
    object: 'Account_Plan_vod__c',
    access: 'Read / Update',
    source: 'src/lib/dataservice/accountPlan/approval.js',
    fields: [
      field('Id', 'Account Plan record ID', 'Yes'),
      field('KPH_Medical_Approval_Status__c', 'Medical approval status', 'Yes'),
      field('KPH_Medical_Submitter_Name__c', 'Medical submitter name', 'Yes'),
      field('KPH_Medical_Approver_Email__c', 'Manager approver email', 'Yes'),
      field('KPH_Last_FD_Review_date__c', 'Last FD Review date', 'Yes'),
      field('LastModifiedDate', 'Approval polling change marker'),
    ],
  },
  {
    page: 'FD Approval Backend',
    area: 'Logged-in submitter and manager approver lookup',
    object: 'User',
    access: 'Read',
    source: 'src/lib/dataservice/accountPlan/shared.js',
    fields: [
      field('Id', 'Current user ID', 'Yes'),
      field('Name', 'Submitter display name', 'Yes'),
      field('ManagerId', 'Current user manager ID', 'Yes'),
      field('Email', 'Manager user email', 'Yes'),
      field('Profile_Name_vod_c', 'Current Veeva profile name', 'Yes'),
      field('Profile_Name_vod__c', 'Alternate current Veeva profile name', 'Fallback'),
    ],
  },
  {
    page: 'Home',
    area: 'Header KPIs and profile strip',
    object: 'KPH_Ecosystem_Plan__c',
    access: 'Read',
    source: 'src/lib/dataservice/accountPlan/home.js + shared.js',
    fields: [
      'Id', 'LastModifiedDate', 'KPH_Account_Plan__c', 'KPH_ATC_Cohort__c',
    ].map((api) => field(api)),
  },
  {
    page: 'Home / Barriers & Opportunities',
    area: 'Barrier and Opportunity records, CRUD, filters, and picklists',
    object: 'KPH_Medical_Barrier_Tactical_Actions__c',
    access: 'Read / Create / Update',
    source: 'src/lib/dataservice/accountPlan/shared.js + barriersDrivers.js + home.js',
    fields: [
      'Id', 'Name', 'RecordTypeId', 'LastModifiedDate', 'KPH_Account_Plan__c',
      'KPH_Barrier_Title__c', 'KPH_Opportunity_Title__c',
      'KPH_Indication__c', 'KPH_Medical_Tactical_Action_Status__c',
      'KPH_Medical_Strategy__c',
      'KPH_Comments__c',
    ].map((api) => field(api)),
  },
  {
    page: 'Home / Medical Tactics / Barriers & Opportunities',
    area: 'Medical Tactic records, parent mapping, CRUD, and picklists',
    object: 'KPH_Medical_Tactics__c',
    access: 'Read / Create / Update',
    source: 'src/lib/dataservice/accountPlan/shared.js + criticalActivities.js + home.js',
    fields: [
      'Id', 'Name', 'CreatedById', 'LastModifiedDate', 'KPH_Account_Plans__c',
      'KPH_Barrier_or_Opportunity__c', 'KPH_Medical_Tactics__c',
      'KPH_Detail__c', 'KPH_Status__c', 'KPH_To_Be_Completed_By__c',
      'KPH_Accountable_POD_Members__c',
      'KPH_Indication__c',
      'KPH_Is_Deleted__c',
    ].map((api) => field(api)),
  },
  {
    page: 'Home / Team Members',
    area: 'Account Plan team membership',
    object: 'Account_Team_Member_vod__c',
    access: 'Read / Create / Update',
    source: 'src/lib/dataservice/accountPlan/shared.js + teamMembers.js + home.js',
    fields: [
      'Id', 'Name', 'Account_Plan_vod__c',
      'Account_Team_Member_Active__c', 'KPH_Participation__c',
      'KPH_Role__c', 'Role_vod__c', 'Team_Member_Name_vod__c',
      'Team_Member_vod__c', 'KPH_Is_Deleted__c',
    ].map((api) => field(api)),
  },
  {
    page: 'Cross Functional Plan of Action',
    area: 'DLBCL Plan of Action blocks',
    object: 'Account_Plan_vod__c',
    access: 'Read / Update',
    source: 'src/lib/dataservice/accountPlan/shared.js + crossFunctionalPlan.js',
    fields: [
      'Id', 'LastModifiedDate', 'KPH_Customer_Engagement_DLBCL_POA__c',
      'KPH_Market_Access_DLBCL_POA__c', 'KPH_Medical_Affairs_DLBCL_POA__c',
    ].map((api) => field(api)),
  },
  {
    page: 'Medical Account Profile',
    area: 'Profile identity and read-only regional dynamics',
    object: 'KPH_Ecosystem_Plan__c',
    access: 'Read',
    source: 'src/lib/dataservice/accountPlan/shared.js + accountProfile.js',
    fields: [
      'Id', 'LastModifiedDate', 'KPH_Account_Plan__c',
      'KPH_Region_Dynamics_to_be_Aware_of_DLBCL__c',
      'KPH_Region_Dynamics_to_be_Aware_of_MM__c',
    ].map((api) => field(api)),
  },
  {
    page: 'Medical Account Profile',
    area: 'MM fields stored on Account Plan rather than profile record',
    object: 'Account_Plan_vod__c',
    access: 'Read / Update',
    source: 'src/lib/dataservice/accountPlan/shared.js + accountProfile.js',
    fields: [
      'KPH_ATC_Profile_Category__c', 'KPH_Medical_Education__c',
      'KPH_ATC_Profile_1__c', 'KPH_Kite_Clinical_Trial__c',
      'KPH_Competitor_Trial__c', 'KPH_Medical_Collaboration__c',
      'KPH_Research_Capabilities_Timelines__c',
    ].map((api) => field(api)),
  },
  {
    page: 'Referral & Dynamics',
    area: 'Referral mapping records',
    object: 'KPH_Ecosystem_Map_Dynamics__c',
    access: 'Read / Create / Update',
    source: 'src/lib/dataservice/accountPlan/shared.js + accountProfile.js',
    fields: [
      'Id', 'Name', 'Account_Plan_vod__c',
      'KPH_Account_Profile__c', 'Indication__c', 'KPH_HCO_Classification__c',
      'KPH_Name_of_Site__c', 'KPH_Comments__c',
      'Name_of_Site__c', 'KPH_Is_Deleted__c',
    ].map((api) => field(api)),
  },
  {
    page: 'Referral & Dynamics',
    area: 'Other Healthcare Networks (currently read-only UI)',
    object: 'KPH_Other_Healthcare_Networks__c',
    access: 'Read',
    source: 'src/lib/dataservice/accountPlan/shared.js + accountProfile.js',
    fields: [
      'Id', 'Name', 'KPH_Account_Name__c',
      'KPH_Account_Profile__c', 'KPH_Kite_Accountable__c', 'KPH_Is_Deleted__c',
    ].map((api) => field(api)),
  },
  {
    page: 'Stakeholders',
    area: 'Stakeholder records and influence fields',
    object: 'KPH_Stakeholder_Map__c',
    access: 'Read / Create / Update',
    source: 'src/lib/dataservice/accountPlan/shared.js + stakeholders.js',
    fields: [
      'Id', 'Name', 'KPH_Account_Plan__c', 'KPH_Account__c',
      'KPH_First_Name__c', 'KPH_Last_Name__c', 'KPH_Title__c',
      'KPH_Other_Title__c', 'Stakeholder_Account_Class__c',
      'KPH_Name_Of_Site2__c', 'Stakeholder_EID__c', 'Stakeholder_NPI__c',
      'KPH_Is_Deleted__c',
    ].map((api) => field(api)),
  },
  {
    page: 'Shared Lookups / Backend',
    area: 'Account lookup for ATCs, sites, networks, and stakeholders',
    object: 'Account',
    access: 'Read',
    source: 'src/lib/dataservice/accountPlan/shared.js',
    fields: [
      'Id', 'Name', 'IsPersonAccount', 'EID_GILD__c', 'Territory_vod__c',
      'Account_Identifier_vod__c', 'NET_External_Id__c', 'AccountNumber',
      'RecordTypeId',
    ].map((api) => field(api)),
  },
  {
    page: 'Shared Lookups / Backend',
    area: 'User lookup for created-by, owners, POD, and reviewer',
    object: 'User',
    access: 'Read',
    source: 'src/lib/dataservice/accountPlan/shared.js',
    fields: [
      'Id', 'Name', 'Profile_Name_vod_c',
      'Profile_Name_vod__c',
    ].map((api) => field(api)),
  },
];

const walkJavaScriptFiles = async (directory) => (
  await Promise.all((await readdir(directory, { withFileTypes: true })).map((entry) => {
    const target = join(directory, entry.name);
    if (entry.isDirectory()) return walkJavaScriptFiles(target);
    return entry.isFile() && entry.name.endsWith('.js') ? [target] : [];
  }))
).flat();

const validateCustomFieldCoverage = async () => {
  const serviceDirectory = resolve(root, 'src/lib/dataservice');
  const files = await walkJavaScriptFiles(serviceDirectory);
  const sourceApis = new Set();
  const customApiPattern = /\b([A-Za-z][A-Za-z0-9_]*(?:__c|_vod_c))\b/g;

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const match of source.matchAll(customApiPattern)) {
      sourceApis.add(match[1]);
    }
  }

  const exportedApis = new Set(
    groups.flatMap((group) => [
      group.object,
      ...group.fields.map((entry) => (typeof entry === 'string' ? entry : entry.api)),
    ])
  );
  const exportedCustomApis = new Set(
    [...exportedApis].filter((api) => /(?:__c|_vod_c)$/.test(api))
  );
  const missing = [...sourceApis].filter((api) => !exportedCustomApis.has(api)).sort();
  const unused = [...exportedCustomApis].filter((api) => !sourceApis.has(api)).sort();

  if (missing.length || unused.length) {
    throw new Error([
      'Medical CRM export is out of sync with the active data services.',
      missing.length ? `Missing from export: ${missing.join(', ')}` : '',
      unused.length ? `Not used by active data services: ${unused.join(', ')}` : '',
    ].filter(Boolean).join('\n'));
  }
  return sourceApis.size;
};

const humanize = (api) => String(api)
  .replace(/\.__r\./g, ' ')
  .replace(/__r\./g, ' ')
  .replace(/__c$/g, '')
  .replace(/_vod$/g, '')
  .replace(/_/g, ' ')
  .replace(/\bKPH\b/g, '')
  .replace(/\s+/g, ' ')
  .trim();

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const rows = groups.flatMap((group) => group.fields.map((entry) => {
  const item = typeof entry === 'string' ? field(entry) : entry;
  const isPlatform = platformFields.has(item.api) || item.api.includes('.');
  return {
    Page: group.page,
    'Backend Area': group.area,
    'Logical / UI Field': item.logicalName || humanize(item.api),
    'Current Object API': group.object,
    'Current Field API': item.api,
    Access: group.access,
    'Mapping Treatment': isPlatform ? 'Confirm/reuse platform field' : 'Map to new Medical field',
    'Required for Medical': item.required,
    'New Medical Object API': '',
    'New Medical Field API': '',
    'Relationship / Picklist Notes': item.notes,
    'Source File': group.source,
  };
}));

const medicalv1Pages = [
  'Home',
  'Barriers & Opportunities',
  'Medical Tactics',
  'Cross Functional Plan of Action',
  'Medical Account Profile',
  'Stakeholders',
  'Team Members',
];

const consumersByGroup = new Map([
  [
    'Shared Shell / Every Page|Account Plan header and common context',
    medicalv1Pages,
  ],
  [
    'Shared Shell / Every Page|ATC account header',
    medicalv1Pages,
  ],
  [
    'Home / Barriers & Opportunities|Barrier and Opportunity records, CRUD, filters, and picklists',
    ['Home', 'Barriers & Opportunities', 'Medical Tactics', 'Cross Functional Plan of Action'],
  ],
  [
    'Home / Barriers & Opportunities|Strategy lookup and rank',
    ['Home', 'Barriers & Opportunities'],
  ],
  [
    'Home / Medical Tactics / Barriers & Opportunities|Medical Tactic records, parent mapping, CRUD, and picklists',
    ['Home', 'Barriers & Opportunities', 'Medical Tactics', 'Cross Functional Plan of Action'],
  ],
  [
    'Home / Team Members|Account Plan team membership',
    ['Home', 'Team Members', 'Cross Functional Plan of Action'],
  ],
  [
    'Referral & Dynamics|Referral mapping records',
    ['Home', 'Medical Account Profile — Referral & Dynamics'],
  ],
  [
    'Referral & Dynamics|Other Healthcare Networks (currently read-only UI)',
    ['Medical Account Profile — Referral & Dynamics'],
  ],
  [
    'Account Insights Backend|Monthly Executive Summary / account insights',
    ['Backend — Account Insights'],
  ],
  [
    'FD Approval Backend|Submit and approve workflow',
    ['Backend — MRD Approval'],
  ],
  [
    'FD Approval Backend|Logged-in submitter and manager approver lookup',
    ['Backend — MRD Approval'],
  ],
  [
    'Shared Lookups / Backend|Account lookup for ATCs, sites, networks, and stakeholders',
    ['Backend — Shared Account Lookup'],
  ],
  [
    'Shared Lookups / Backend|User lookup for created-by, owners, POD, and reviewer',
    ['Backend — Shared User Lookup'],
  ],
]);

const consumersForGroup = (group) =>
  consumersByGroup.get(`${group.page}|${group.area}`) || [group.page];

const currentUsageRows = groups.flatMap((group) =>
  consumersForGroup(group).flatMap((consumer) =>
    group.fields.map((entry) => {
      const item = typeof entry === 'string' ? field(entry) : entry;
      return {
        Branch: 'Medicalv1',
        'Page / Backend Consumer': consumer,
        'Backend Area': group.area,
        'Current Object API': group.object,
        'Current Field API': item.api,
        'Logical / UI Field': item.logicalName || humanize(item.api),
        Access: group.access,
        Required: item.required,
        'Relationship / Picklist Notes': item.notes,
        'Source File': group.source,
      };
    })
  )
);

const headers = Object.keys(rows[0]);
const csv = [
  headers.map(csvCell).join(','),
  ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
].join('\n') + '\n';

const currentUsageHeaders = Object.keys(currentUsageRows[0]);
const currentUsageCsv = [
  currentUsageHeaders.map(csvCell).join(','),
  ...currentUsageRows.map((row) =>
    currentUsageHeaders.map((header) => csvCell(row[header])).join(',')
  ),
].join('\n') + '\n';

const xmlEscape = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const excelColumn = (index) => {
  let value = index + 1;
  let output = '';
  while (value > 0) {
    value -= 1;
    output = String.fromCharCode(65 + (value % 26)) + output;
    value = Math.floor(value / 26);
  }
  return output;
};

const workbookRows = [currentUsageHeaders, ...currentUsageRows.map((row) =>
  currentUsageHeaders.map((header) => row[header])
)];
const sheetRowsXml = workbookRows.map((values, rowIndex) => {
  const rowNumber = rowIndex + 1;
  const style = rowIndex === 0 ? ' s="1"' : '';
  const cells = values.map((value, columnIndex) => {
    const ref = `${excelColumn(columnIndex)}${rowNumber}`;
    return `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
  }).join('');
  return `<row r="${rowNumber}">${cells}</row>`;
}).join('');

const xlsx = new JSZip();
xlsx.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`);
xlsx.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`);
xlsx.file('xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="Current Field Usage" sheetId="1" r:id="rId1"/></sheets>
</workbook>`);
xlsx.file('xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);
xlsx.file('xl/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts>
  <fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF005B85"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`);
xlsx.file('xl/worksheets/sheet1.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>
    <col min="1" max="1" width="12" customWidth="1"/><col min="2" max="2" width="36" customWidth="1"/>
    <col min="3" max="3" width="46" customWidth="1"/><col min="4" max="6" width="34" customWidth="1"/>
    <col min="7" max="8" width="20" customWidth="1"/><col min="9" max="9" width="52" customWidth="1"/>
    <col min="10" max="10" width="58" customWidth="1"/>
  </cols>
  <sheetData>${sheetRowsXml}</sheetData>
  <autoFilter ref="A1:J${workbookRows.length}"/>
</worksheet>`);
const currentUsageXlsx = await xlsx.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 9 },
});

const objectSummary = Array.from(new Map(
  groups.map((group) => [group.object, group])
).keys()).sort();

const markdown = `# Medical CRM Mapping Inventory

Generated from the active application data-service mappings.

## How to use this export

- Populate **New Medical Object API** and **New Medical Field API** in the CSV.
- Treat rows marked **Confirm/reuse platform field** as standard Veeva/Salesforce fields that may remain unchanged.
- Validate lookup direction, record types, picklist values, field-level security, offline availability, and create/update permission before implementation.
- The reviewer-name field \`KPH_Last_MPD_Reviewer__c\` is explicitly provisional.
- Duplicate field rows are intentional when the same backend field supports multiple pages.
- The CSV is a mapping template only; generating it does not remove or change any current CRM API mappings.

## Coverage

- ${rows.length} page/backend field dependencies
- ${currentUsageRows.length} page-specific current-usage rows
- ${groups.length} functional groups
- ${objectSummary.length} current CRM objects

## Current objects requiring a Medical mapping decision

${objectSummary.map((object) => `- \`${object}\``).join('\n')}

## Functional groups

${groups.map((group) => `### ${group.page} — ${group.area}

- Current object: \`${group.object}\`
- Access: ${group.access}
- Fields: ${group.fields.length}
- Source: \`${group.source}\`
`).join('\n')}

## Backend migration checklist

1. Supply the new Medical parent Account Plan object and Account lookup.
2. Supply each child object and its parent lookup field.
3. Supply Medical record type IDs for Barriers and Opportunities.
4. Confirm picklist values and controlling/dependent picklist metadata.
5. Confirm soft-delete fields and active-row filters.
6. Confirm reviewer profile names and the reviewer-name/date fields.
7. Confirm offline VQL availability and field-level security by profile.
8. Update mock fixtures, tests, exports, and desktop launcher mappings.
9. Validate create, update, submit, approve, and polling operations on iPad.

## Derived and export-only behavior

- PDF, PowerPoint, and executive-summary exports consume the existing page loaders; they do not issue separate CRM queries.
- Read-only UI sections are still listed when their loaders or backend services query fields.
- Display labels, calculated counts, status sorting, and other derived values do not require additional CRM fields.
- Removed commercial-only tabs are not treated as active Medical page dependencies.
`;

const validatedCustomApiCount = await validateCustomFieldCoverage();
await mkdir(outputDir, { recursive: true });
await writeFile(resolve(outputDir, 'medical-crm-field-mapping.csv'), csv, 'utf8');
await writeFile(resolve(outputDir, 'Medicalv1-current-field-usage.csv'), currentUsageCsv, 'utf8');
await writeFile(resolve(outputDir, 'Medicalv1-current-field-usage.xlsx'), currentUsageXlsx);
await writeFile(resolve(outputDir, 'medical-crm-field-mapping.md'), markdown, 'utf8');

console.log(`Wrote ${rows.length} mappings to docs/medical-crm-field-mapping.csv`);
console.log(`Wrote ${currentUsageRows.length} current field usages to docs/Medicalv1-current-field-usage.csv`);
console.log('Wrote Excel workbook to docs/Medicalv1-current-field-usage.xlsx');
console.log('Wrote migration guide to docs/medical-crm-field-mapping.md');
console.log(`Validated ${validatedCustomApiCount} active custom object/field APIs against the export`);
