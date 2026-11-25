"""Export a source-traced Medicalv2 UI/API reference. Requires openpyxl."""
from pathlib import Path
import csv
import re
import subprocess
from datetime import datetime
from zoneinfo import ZoneInfo
from openpyxl import Workbook, load_workbook
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.worksheet.table import Table, TableStyleInfo

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs'
SERVICE = 'src/lib/dataservice/accountPlan/'
SHARED = SERVICE + 'shared.js'
sources = {str(p.relative_to(ROOT)): p.read_text() for p in (ROOT / 'src').rglob('*') if p.suffix in ('.js', '.jsx')}
shared = sources[SHARED]
branch = subprocess.check_output(['git', 'branch', '--show-current'], cwd=ROOT, text=True).strip()
commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
if branch != 'Medicalv2':
    raise SystemExit('Run this exporter from the Medicalv2 branch.')


def literal_map(name):
    match = re.search(r'\bconst ' + name + r' = \{(.*?)\n\};', shared, re.S)
    if not match:
        raise ValueError(name)
    return dict((m[0] or m[1], m[2]) for m in re.findall(r"(?:'([^']+)'|(\w+)):\s*'([^']+)'", match[1]))


def ref(file, needle):
    pos = sources[file].find(needle)
    if pos < 0:
        raise ValueError(f'Missing source anchor: {file}: {needle}')
    return f'{file}:{sources[file][:pos].count(chr(10)) + 1}'


headers = ['Page / Area', 'UI label / purpose', 'UI data key', 'Object API', 'Field API', 'UI access / usage', 'Notes / transformation', 'Source']
rows, backend, inactive = [], [], []
P = 'Account_Plan_vod__c'
E = 'KPH_Ecosystem_Plan__c'
B = 'KPH_Medical_Barrier_Tactical_Actions__c'
T = 'KPH_Medical_Tactics__c'
TM = 'Account_Team_Member_vod__c'
S = 'KPH_Stakeholder_Map__c'
R = 'KPH_Ecosystem_Map_Dynamics__c'
N = 'KPH_Other_Healthcare_Networks__c'
H = 'KPH_Account_Plan_Approval_History__c'


def add(page, label, key, obj, api, access='Read-only', notes='', file=SHARED, anchor=None, target=None):
    target = rows if target is None else target
    target.append([page, label, key, obj, api, access, notes, ref(file, anchor or api)])


# Launcher: labels are copied from the actual table definition.
launch = SERVICE + 'accountPlanLauncher.js'
launch_map = {
    'name': (P, 'Name'), 'ownerName': ('User', 'Name'),
    'marketAccessPrioritizedAccount': ('Account', 'KPH_Market_Access_Prioritized_Account__c'),
    'mmAtcPriorityAccount': ('Account', 'KPH_MM_ATC_Priority__c'),
    'atcCohortDlbcl': (E, 'KPH_ATC_Cohort__c'), 'planStatus': (P, 'KPH_Plan_status__c'),
    'territory': (P, 'KPH_Territory__c'), 'territoryDescription': (P, 'KPH_Territory_Description__c'),
    'atcCertifiedDate': (P, 'KPH_ATC_Certified_Date__c'),
    'lastFieldDirectorReviewDate': (P, 'KPH_Last_FD_Review_date__c'), 'submittedDate': (P, 'KPH_Medical_Submitted_Date__c'),
}
for key, label in re.findall(r"\{ key: '(\w+)', label: '([^']+)'", sources['src/components/AccountPlanLauncher.jsx']):
    obj, api = launch_map[key]
    note = {'ownerName': 'Resolve Account Plan.OwnerId to User.Id, then display User.Name.',
            'atcCohortDlbcl': 'Latest profile by LastModifiedDate, joined using KPH_Account_Plan__c.',
            'submittedDate': 'Launcher reads the Medical submitted date written by approval submission.'}.get(key, '')
    if obj == 'Account':
        note = 'Join Account Plan.Account_vod__c to Account.Id.'
    add('Desktop launcher', label, key, obj, api, notes=note, file=launch)

for label, key, obj, api, note in [
    ('Account Plan name', 'plan.name', P, 'Name', 'Fallback: plan.accountName, then Account.Name.'),
    ('EID', 'plan.eid', P, 'KPH_ATC_EID__c', 'Sidebar uses the plan EID.'),
    ('Last FD Review', 'plan.lastFieldDirectorReviewDate', P, 'KPH_Last_FD_Review_date__c', 'Displays Submitted for Approval instead of the date while Medical approval is submitted.'),
    ('Territory', 'plan.territoryDescription', P, 'KPH_Territory_Description__c', 'Fallback: plan.KPH_Territory__c, then Account.Territory_vod__c.'),
]:
    add('Shared sidebar', label, key, obj, api, notes=note)
add('Home', 'MM ATC Priority', 'header.mmAtcPriority', 'Account', 'KPH_MM_ATC_Priority__c')
add('Home', 'ATC Cohort DLBCL', 'header.atcCohort', E, 'KPH_ATC_Cohort__c')
add('Home', 'Customer Goals for CAR T Service Line', 'customerGoals', P, 'KPH_ATC_Strategic_Opportunities__c', 'Read / Update', 'UI limit: 500 characters.')
add('Home', 'Medical Strategy (MM / DLBCL)', 'strategies', B, 'KPH_Medical_Strategy__c', 'Derived / Read-only', 'Aggregate distinct strategies from barrier/opportunity records by indication; display picklist labels and omit dash placeholders.')

for label, key, api, note in [
    ('Barrier Title', 'name / form.title', 'KPH_Barrier_Title__c', 'Barrier record type. Approved picklist API value; UI displays its label.'),
    ('Opportunity Title', 'name / form.title', 'KPH_Opportunity_Title__c', 'Opportunity uses internal type Driver. Offline writes also supply an indication-valid value for the opposite title field.'),
    ('Indication', 'indication', 'KPH_Indication__c', 'Controls title and strategy choices; changes cascade to linked Medical Tactics.'),
    ('Medical Strategy', 'strategy / strategyLabel', 'KPH_Medical_Strategy__c', 'Picklist API value is stored; its label is displayed. Legacy strategy rules can make the record read-only.'),
    ('Status', 'status', 'KPH_Medical_Tactical_Action_Status__c', 'UI Closed saves as Complete. Legacy Barriers display Closed and cannot be edited.'),
    ('Comments', 'comments', 'KPH_Comments__c', 'Optional field; access fallback can omit it from reads/writes.'),
]:
    add('Barriers & Opportunities / Home', label, key, B, api, 'Read / Create / Update', note)
add('Barriers & Opportunities', 'Barrier / Opportunity type', 'type / recordTypeId', B, 'RecordTypeId', 'Derived / Create / Update', 'Resolved from RecordType metadata; Driver means Opportunity in the UI.')
for label, key, api, note in [
    ('Medical Tactic', 'name / nameValue / form.title', 'KPH_Medical_Tactics__c', 'Approved picklist API value; display label. Read fallback is KPH_Detail__c. Title limit: 255 characters.'),
    ('Linked Barrier/Opportunity', 'barrierDriverId / parentName', 'KPH_Barrier_or_Opportunity__c', 'Lookup to Medical Barrier/Opportunity. Display parent title. Required on create; indication inherits from parent.'),
    ('Status / Medical Tactic Status', 'status', 'KPH_Status__c', 'Completed saves as Complete; blank status defaults to Planned. Completion can prompt for parent status update.'),
    ('Due Date', 'dueDate', 'KPH_To_Be_Completed_By__c', 'Date value; validated before saving.'),
    ('Indication', 'indication', 'KPH_Indication__c', 'Parent indication is authoritative in the UI.'),
    ('Accountable', 'ownerLabel / form.accountable', 'KPH_Accountable_POD_Members__c', 'Picklist value; this is not an OwnerId lookup.'),
    ('Details', 'details', 'KPH_Detail__c', 'Trimmed text, empty value saved as empty string.'),
]:
    add('Medical Tactics / Barriers & Opportunities / Home', label, key, T, api, 'Read / Create / Update', note)
add('Medical Tactics / Barriers & Opportunities', 'Last Mod / Last Modified Date', 'lastModifiedDate', T, 'LastModifiedDate')
add('Barriers & Opportunities / Home tactic details', 'Created By', 'createdById / createdBy', T, 'CreatedById', notes='Resolve User.Id to User.Name; fallback relationship name or user ID.')
add('Medical Tactics', 'Delete tactic', 'canDelete', T, 'KPH_Is_Deleted__c', 'Action / Update', 'Soft delete sets true and preserves parent lookup; active rows exclude deleted records.')

labels = {'atcProfileCategory': 'ATC Profile Category', 'medicalEducation': 'Medical Education',
          'atcProfile': 'ATC Profile', 'competitorTrial': 'Competitor Trial',
          'medicalCollaboration': 'Medical Collaboration', 'researchCapabilitiesTimelines': 'Research Capabilities Timelines'}
for prefix in ['MM', 'DLBCL']:
    mapping = literal_map(prefix + '_MEDICAL_PROFILE_FIELD_API_NAMES')
    page = f'Medical Account Profile / {prefix} ATC Medical Profile'
    for key, api in mapping.items():
        if key == 'medicalEducationStatus':
            add(page, f'{prefix} Medical Education legacy status metadata', key, E, api, 'Metadata / hidden fallback', 'Queried and used for status option fallback; no standalone control while per-topic status fields are configured.', target=backend)
            continue
        label = ('Kite MM' if prefix == 'MM' else 'Kite Lymphoma/Pipeline') if key == 'kiteClinicalTrial' else f'{prefix} {labels[key]}'
        note = 'Saved on the plan-scoped Ecosystem Plan record, using medicalProfileId.'
        if key in ['atcProfileCategory', 'medicalCollaboration', 'kiteClinicalTrial']:
            note += ' Multi-select; semicolon-separated API values.'
        if key == 'medicalEducation':
            note += ' Semicolon-separated education topics derived from topics having a nonblank status; saves alongside changed topic statuses.'
        if key in ['atcProfile', 'competitorTrial']:
            note += ' UI maxLength: 32768.'
        if key == 'researchCapabilitiesTimelines':
            note += ' UI maxLength: 255. DLBCL intentionally uses KPH_DLBCL_MM_Research_Capabilities__c.'
        add(page, label, key, E, api, 'Read / Update', note)
    for topic, api in literal_map(prefix + '_MEDICAL_EDUCATION_STATUS_FIELD_API_NAMES').items():
        add(page, f'{topic} status', 'medicalEducationStatusFor:' + topic, E, api, 'Read / Update', 'Independent topic status picklist; option fallback uses the profile Medical Education status metadata.')

# All commercial MM mappings, with hidden fields explicitly marked.
commfile = 'src/pages/AccountProfile/CommercialMmProfileTab.jsx'
comm = sources[commfile]
for key, api in literal_map('MM_PROFILE_FIELD_API_NAMES').items():
    match = re.search(r"key: '" + re.escape(key) + r"',\s*label: '([^']+)'([^}]*)(?:\}|$)", comm, re.S)
    if not match:
        raise ValueError(f'Missing MM UI label for {key}')
    hidden = 'hidden: true' in match[2]
    add('Medical Account Profile / MM Comm Profile', match[1], 'commercialMmProfile.' + key, E, api,
        'Loaded / hidden' if hidden else 'Read-only',
        'Hidden by field definition; still queried.' if hidden else 'Entire tab is passed isReadOnly; no UI writes, even where the shared field definition says editable.',
        target=backend if hidden else rows)

profilefile = SERVICE + 'accountProfile.js'
for key, label, obj, api in [
    ('atcCohort', 'ATC Cohort DLBCL', E, 'KPH_ATC_Cohort__c'),
    ('mmAtcPriority', 'MM ATC Priority', 'Account', 'KPH_MM_ATC_Priority__c'),
    ('payerMix', 'Payer Mix', E, 'KPH_Payer_Mix__c'),
    ('payerType', 'Payer Type', E, 'KPH_Payer_Type__c'),
    ('topPayersName', 'Top 3 Payers', E, 'KPH_Top_3_Payers_Name__c'),
]:
    add('Medical Account Profile / DLBCL Comm Profile', label, key, obj, api, notes='Read-only commercial reference. Top payers split on slash/newline and display at most three.' if key == 'topPayersName' else '')
for match in re.finditer(r"\{ key: '(\w+)', label: '([^']+)', type: '([^']+)', field: '(\w+)', crmField: '([^']+)'([^}]+)?\}", sources[profilefile]):
    key, label, typ, datakey, api, extra = match.groups()
    add('Medical Account Profile / DLBCL Comm Profile', label, datakey, E, api, notes=('Conditional follow-up; see DLBCL_PROFILE_QUESTIONS and ProfileTab parent-value checks. ' if 'dependsOn' in (extra or '') else '') + ('Semicolon-separated multi-select.' if typ == 'multipicklist' else 'Read-only commercial reference.'), file=profilefile)

for label, key, obj, api, note in [
    ('Site Name', 'referralAccounts[].name / siteId', R, 'KPH_Name_of_Site__c', 'Lookup to Account.Id; display Account.Name, fallback referral Name, then site ID.'),
    ('HCO Classification', 'referralAccounts[].hcoClassification', R, 'KPH_HCO_Classification__c', ''),
    ('Indication', 'referralAccounts[].indication', R, 'Indication__c', 'Both displays as DLBCL + MM.'),
    ('DLBCL Regional Dynamics to be aware of', 'regionalDynamics.DLBCL', E, 'KPH_Region_Dynamics_to_be_Aware_of_DLBCL__c', ''),
    ('MM Regional Dynamics to be aware of', 'regionalDynamics.MM', E, 'KPH_Region_Dynamics_to_be_Aware_of_MM__c', ''),
    ('Account Name', 'healthcareNetworks[].accountName', N, 'KPH_Account_Name__c', 'Lookup to Account.Id; display Account.Name, fallback network Name, then account ID.'),
    ('Kite Lead', 'healthcareNetworks[].kiteAccountable', N, 'KPH_Kite_Accountable__c', 'Displayed directly from stored value.'),
]:
    add('Medical Account Profile / Referral & Dynamics', label, key, obj, api, notes=note)
for label, key, api, note in [
    ('Name', 'name / profileRecordId', 'KPH_Account__c', 'Resolve Account.Name; fallback stored KPH_Account_Name__c, then legacy name components / Name / account ID. Opens the linked Account record.'),
    ('Role', 'role', 'KPH_Title__c', ''),
    ('Primary Parent', 'primaryParent', 'KPH_Primary_Parent_Name__c', ''),
]:
    add('Stakeholders', label, key, S, api, notes='Read-only list in current UI. ' + note)
for label, key, api, access, note in [
    ('Name', 'name', 'Team_Member_Name_vod__c', 'Read / Create', 'Selected User.Name on creation; name is read-only when editing an existing member. Writer resends name and user ID.'),
    ('Role', 'role / functionName', 'KPH_Role__c', 'Read-only', 'Not included in create/update payload.'),
    ('Status', 'isPrimary / form.status', 'Account_Team_Member_Active__c', 'Read-only', 'Boolean normalized to Active / Inactive. Not included in create/update payload.'),
    ('Participation', 'participation', 'KPH_Participation__c', 'Read / Create / Update', 'CRM picklist.'),
    ('Name selection (User lookup)', 'userId', 'Team_Member_vod__c', 'Read / Create', 'User lookup; required in create/update payload.'),
    ('Delete team member', 'id', 'KPH_Is_Deleted__c', 'Action / Update', 'Soft delete; active records filter excludes true.'),
]:
    add('Team Members / Home POD', label, key, TM, api, access, note)

approvalfile = SERVICE + 'approval.js'
for label, key, api, note in [
    ('Medical approval state', 'plan.approvalStatus', 'KPH_Medical_Approval_Status__c', 'Submit writes Submitted for Approval; approve writes Approved. Drives buttons and sidebar state.'),
    ('Submitter name', 'submitterName', 'KPH_Medical_Submitter_Name__c', 'Current User.Name on submit; cleared on approve.'),
    ('Approver email routing', 'approverEmail', 'KPH_Medical_Approver_Email__c', 'Resolve logged-in User.ManagerId to manager User.Email; cleared on approve.'),
    ('Approver name routing', 'approverName', 'KPH_Medical_Approver_Name__c', 'Manager User.Name; supplemental write, omitted if required-only retry is needed; cleared on approve.'),
    ('Medical submitted date', 'submittedDate', 'KPH_Medical_Submitted_Date__c', 'YYYY-MM-DD date supplied by App; supplemental write. Cleared on approve. Also displayed by the launcher.'),
]:
    add('FD approval workflow', label, key, P, api, 'Action / Update', note, file=approvalfile)
for label, key, api, note in [
    ('Created Date', 'createdDate', 'CreatedDate', 'Events in the same minute are merged into one request.'),
    ('Approval Date', 'approvalDate', 'LastModifiedDate', 'Approved records only; fallback CreatedDate. Not the Account Plan Last FD Review field.'),
    ('Status', 'status', 'KPH_Medical_Status__c', 'Merged lifecycle rank: Approved > Pending > Submitted.'),
    ('Medical Submitter', 'medicalSubmitter', 'KPH_Medical_Submitter__c', 'Resolve User.Name if stored value is a Salesforce ID; otherwise display text.'),
    ('Actual Approver', 'actualApprover', 'KPH_Medical_Approver__c', 'Resolve User.Name; blank until Approved.'),
]:
    add('Approval History', label, key, H, api, notes=note, file=approvalfile)

# Derived values and controls use existing records; they do not have dedicated API fields.
for page, label, key, obj, api, note in [
    ('Home / Barriers & Opportunities', 'Medical Tactics count / open count', 'openActivityCountByBarrier / activityCount', T, 'KPH_Barrier_or_Opportunity__c + KPH_Status__c', 'Group linked tactics by parent and count open statuses; also display total linked tactics.'),
    ('Barriers & Opportunities', 'Active / Closed summary counts', 'status summary', B, 'KPH_Medical_Tactical_Action_Status__c', 'Calculated from loaded barrier/opportunity records after UI normalization.'),
    ('Home tactic details', 'Timing / Overdue / Due today / Due soon / On track', 'timing', T, 'KPH_To_Be_Completed_By__c + KPH_Status__c', 'Computed from due date, status, and current date.'),
    ('Medical Account Profile / Referral & Dynamics', 'Site count', 'referralAccounts.length', R, 'Id', 'Count of loaded active referral rows.'),
    ('All lists', 'Search, sort, filter, tabs and record counts', 'component state', '', '', 'Client-side UI state using the mapped record fields; no independent persisted CRM field.'),
    ('PPT / PDF / Executive Summary', 'Exported field values', 'page loader data', '', '', 'Reuses page data and mappings; generated output adds no independent CRM field.'),
]:
    add(page, label, key, obj, api, 'Derived / local', note, file='src/App.jsx', anchor='const ')

# Query dependencies, including IDs, parent links, soft-delete flags, and hidden loaded fields.
# Resolve the source's literal constants and array spreads without executing application code.
constants = {}
for file in [SHARED, launch, approvalfile]:
    text = sources[file]
    env = {'BARRIER_DRIVER_TITLE_FIELDS': literal_map('BARRIER_DRIVER_TITLE_FIELDS')}
    for name, value in re.findall(r"\bconst (\w+) = '([^'\n]*)';", text):
        env[name] = value
    env.update({name: literal_map(name) for name in re.findall(r'export const (\w+FIELD_API_NAMES) = \{', shared)})
    definitions = dict(re.findall(r'\bconst (\w+) = (.*?);', text, re.S))
    def resolve(expr):
        expr = re.sub(r'//[^\n]*', '', expr).strip()
        if expr in env:
            return env[expr]
        if re.fullmatch(r"'[^']*'", expr):
            return expr[1:-1]
        if '.' in expr and not expr.startswith('...'):
            base, _, prop = expr.partition('.')
            if isinstance(env.get(base), dict):
                return env[base][prop]
        for prefix in ['Object.freeze(', 'Array.from(new Set(']:
            if expr.startswith(prefix):
                return resolve(expr[len(prefix):-len(')' if prefix == 'Object.freeze(' else '))')])
        if expr.startswith('[') and expr.endswith(']'):
            result = []
            for item in expr[1:-1].split(','):
                item = item.strip()
                if not item:
                    continue
                if item.startswith('...Object.values(') and item.endswith(')'):
                    result.extend(env[item[len('...Object.values('):-1]].values())
                elif item.startswith('...'):
                    result.extend(resolve(item[3:]))
                else:
                    result.append(resolve(item))
            return list(dict.fromkeys(result))
        raise ValueError(expr)
    for _ in range(6):
        for name, expr in definitions.items():
            if name in env:
                continue
            try:
                env[name] = resolve(expr)
            except (ValueError, KeyError, TypeError):
                pass
    constants[file] = env

inventory = [
    (SHARED, 'PLAN_FIELDS_BASE', P, 'Shared plan context'),
    (SHARED, 'ACCOUNT_FIELDS', 'Account', 'Shared Account context'),
    (SHARED, 'ECOSYSTEM_PLAN_FIELDS', E, 'Home profile strip'),
    (SHARED, 'BARRIER_DRIVER_FIELDS', B, 'Barrier / Opportunity query'),
    (SHARED, 'ACTIVITY_FIELDS', T, 'Medical Tactic query'),
    (SHARED, 'TEAM_MEMBER_BY_PLAN_FIELDS', TM, 'Team Member query'),
    (SHARED, 'STAKEHOLDER_FIELDS', S, 'Stakeholder query'),
    (SHARED, 'MEDICAL_PROFILE_FIELD_API_NAMES', E, 'Medical profile queries / write allowlist'),
    (SHARED, 'ACCOUNT_PROFILE_FIELDS', E, 'Commercial / regional profile queries'),
    (SHARED, 'REFERRAL_ACCOUNT_FIELDS', R, 'Referral query'),
    (SHARED, 'HEALTHCARE_NETWORK_FIELDS', N, 'Healthcare network query'),
    (SHARED, 'ACCOUNT_LOOKUP_FIELDS', 'Account', 'Account lookup queries'),
    (launch, 'ACCOUNT_PLAN_LAUNCHER_FIELDS', P, 'Launcher plan query'),
    (launch, 'USER_FIELDS', 'User', 'Launcher owner query'),
    (launch, 'ACCOUNT_PRIORITY_FIELDS', 'Account', 'Launcher priority query'),
    (launch, 'ACCOUNT_PROFILE_COHORT_FIELDS', E, 'Launcher cohort query'),
    (approvalfile, 'APPROVAL_HISTORY_FIELDS', H, 'Approval History query'),
]
for file, name, obj, area in inventory:
    fields = constants[file].get(name)
    if not isinstance(fields, list) or not fields:
        raise ValueError(f'Cannot resolve {file}: {name}')
    for api in fields:
        if not any(row[3] == obj and row[4] == api for row in rows + backend):
            add(area, 'Record / query dependency: ' + api, '', obj, api, 'Backend read / linkage', 'Queried field; no standalone visible control. Parent IDs and flags may also be populated by create/delete actions.', file=file, anchor=name, target=backend)

for obj, api, label, note, file in [
    (P, 'Account_vod__c', 'Account link', 'Join plan to Account.', SHARED),
    (P, 'KPH_Territory__c', 'Territory fallback', 'Fallback for territory description.', SHARED),
    (P, 'KPH_Is_Submitted__c', 'Submission flag', 'Read and normalized; current approval writer updates Medical status/routing fields instead.', SHARED),
    ('Account', 'Hospital_Type__c', 'Launcher account eligibility', 'WHERE requires Authorized Treatment Center.', launch),
    ('Account', 'Customer_Master_Status_vod__c', 'Launcher account eligibility', 'WHERE requires Valid_vod.', launch),
    ('Account', 'Primary_Parent_vod__c', 'Stakeholder Account lookup parent', 'Optional field on lookup-search results; current Stakeholders list displays KPH_Stakeholder_Map__c.KPH_Primary_Parent_Name__c directly.', SHARED),
    ('User', 'ManagerId', 'Approval manager routing', 'Logged-in User.ManagerId joins to manager User.Id.', approvalfile),
    ('User', 'Email', 'Approval manager email', 'Manager routing email.', approvalfile),
    ('User', 'Name', 'Current user / lookup / created-by display', 'Used for names and submitter identity.', SHARED),
    ('User', 'Id', 'User identity', 'Lookup key / current user context.', SHARED),
    ('User', 'Profile_Name_vod_c', 'Profile access control', 'Preferred runtime profile API spelling in source.', SHARED),
    ('User', 'Profile_Name_vod__c', 'Profile access control fallback', 'Alternate runtime profile API spelling.', SHARED),
    ('RecordType', 'Id', 'Record type IDs', 'Runtime metadata lookup for Medical Barriers, Opportunities, Tactics and approval history.', SHARED),
    ('RecordType', 'DeveloperName', 'Record type selection', 'Resolves Medical record types by developer name.', SHARED),
    ('RecordType', 'Name', 'Record type display fallback', 'Record type metadata.', SHARED),
    ('RecordType', 'SobjectType', 'Record type object filter', 'Filters record type metadata by object.', SHARED),
    (H, 'KPH_Account_Plan__c', 'History plan filter', 'WHERE filters history to selected plan.', approvalfile),
    (H, 'RecordTypeId', 'Medical history filter', 'Filters to KPH_Medical_Approved / Pending / Submitted record types.', approvalfile),
]:
    add('Shared / workflow dependencies', label, '', obj, api, 'Backend read / filter', note, file=file, target=backend)

# Code present in this branch but not exposed by App's current page list / dialogs.
for api in constants[SHARED]['POA_FIELDS']:
    add('Cross Functional Plan of Action', 'Retained POA service field', '', P, api, 'Inactive page', 'No Cross Functional page in App PAGES; do not treat as a current visible UI field.', anchor='POA_FIELDS', target=inactive)
for api in constants[approvalfile]['ACCOUNT_PLAN_APPROVAL_REVIEW_FIELDS']:
    add('Approval review service', 'Retained approval review field', '', P, api, 'Unwired service', 'fetchAccountPlanApprovalReview exists but App does not call it.', file=approvalfile, anchor='ACCOUNT_PLAN_APPROVAL_REVIEW_FIELDS', target=inactive)
add('Old MRD comments modal', 'Comments', 'comments', P, 'KPH_Comments__c', 'Unused constant / inactive modal', 'Current App mounts SubmitMpdApprovalConfirmModal and sends no comments field. Do not map this as an active FD submission input.', file=approvalfile, target=inactive)

for api in ['KPH_First_Name__c', 'KPH_Last_Name__c', 'KPH_Name_Of_Site2__c']:
    add('Stakeholder retained helpers', 'Legacy display fallback', '', S, api, 'Fallback / not queried',
        'Retained mapper/display helper reference; not included in current STAKEHOLDER_FIELDS query or current write payload.', target=inactive)

# Source reference audit: includes object names and inactive/fallback symbols, not just fields.
audit = []
for file, text in sorted(sources.items()):
    if not file.startswith('src/lib/dataservice/'):
        continue
    for api in sorted(set(re.findall(r'\b[A-Za-z][A-Za-z0-9_]*(?:__c|_vod_c)\b', text))):
        if not api.endswith(('__c', '_vod_c')):
            continue
        usage = [r for r in rows + backend + inactive if r[4] == api]
        objects = sorted(set(r[3] for r in usage))
        is_object = any(r[3] == api for r in rows + backend + inactive)
        classification = 'Object API' if is_object and not usage else ('Mapped' if usage else 'Unclassified reference: review required')
        audit.append([api, ', '.join(objects), classification, ref(file, api)])
assert not any(r[2].startswith('Unclassified') for r in audit), [r for r in audit if r[2].startswith('Unclassified')]

notes = [
    ['Scope', 'Current Medicalv2 checkout; source-code mapping, not a live Salesforce schema or permission audit.'],
    ['Branch', branch], ['Commit', commit],
    ['Generated', datetime.now(ZoneInfo('America/Jamaica')).isoformat(timespec='seconds')],
    ['UI fields', str(len(rows))], ['Backend dependencies', str(len(backend))], ['Inactive code', str(len(inactive))],
    ['Transport', 'Veeva MyInsights DataService / query wrappers, not REST endpoint JSON. Object API + Field API identify CRM reads/writes.'],
    ['Source', 'Source anchors are file:line. UI labels checked against active components; query dependencies extracted from source constants.'],
    ['Access', 'UI access records actual current screens, not the presence of unused CRUD helpers. App read-only/profile/legacy rules can disable otherwise editable fields.'],
    ['Education', 'Medical Education stores selected topics; per-topic status fields store each topic status. Legacy aggregate status fields supply fallback option metadata.'],
    ['Commercial tabs', 'MM Comm and DLBCL Comm are read-only. Hidden MM fields are listed in Backend Dependencies.'],
    ['Inactive code', 'Cross Functional POA, approval-review helper, and old MRD comment modal are retained code, absent from active navigation/dialog wiring.'],
    ['Picklists', 'Store API values rather than display labels. Multi-select values are semicolon-separated. Some options are constrained by indication / parent title.'],
    ['Soft delete', 'Medical Tactics, Team Members, Stakeholders, Referral rows and Networks filter KPH_Is_Deleted__c; only exposed delete controls are listed in UI Fields.'],
    ['Approval', 'Current submission writes Medical status, submitter, approver email, plus supplemental Medical approver name/date. Approval clears routing data. CRM automation may maintain general date/status fields.'],
    ['Local state', 'Search/sort/filter/tab selections and derived counts have no dedicated CRM field.'],
    ['Regenerate', 'python3 scripts/export-medicalv2-ui-api-mapping.py (requires openpyxl).'],
]
OUT.mkdir(exist_ok=True)
for name, data in [('Medicalv2-ui-api-field-mapping', rows), ('Medicalv2-backend-field-dependencies', backend)]:
    with (OUT / (name + '.csv')).open('w', newline='', encoding='utf-8-sig') as stream:
        writer = csv.writer(stream)
        writer.writerow(headers)
        writer.writerows(data)

wb = Workbook()
wb.remove(wb.active)
for title, cols, data in [('Read Me', ['Item', 'Details'], notes), ('UI Fields', headers, rows), ('Backend Dependencies', headers, backend), ('Inactive Code', headers, inactive), ('API Reference Audit', ['API token', 'Mapped object(s)', 'Classification', 'Source'], audit)]:
    ws = wb.create_sheet(title)
    ws.append(cols)
    for row in data:
        ws.append(row)
    ws.freeze_panes = 'A2'
    table = Table(displayName=title.replace(' ', ''), ref=ws.dimensions)
    table.tableStyleInfo = TableStyleInfo(name='TableStyleMedium2', showRowStripes=True)
    ws.add_table(table)
    for cell in ws[1]:
        cell.font = Font(bold=True, color='FFFFFF')
        cell.fill = PatternFill('solid', fgColor='005B85')
    widths = [34, 44, 38, 40, 54, 28, 95, 85] if len(cols) == 8 else ([28, 120] if len(cols) == 2 else [58, 48, 58, 90])
    for column, width in enumerate(widths, 1):
        ws.column_dimensions[ws.cell(1, column).column_letter].width = width
    for row in ws.iter_rows(min_row=2):
        for cell in row:
            cell.alignment = Alignment(vertical='top', wrap_text=True)
        ws.row_dimensions[row[0].row].height = 55 if len(cols) == 8 else 42
xlsx = OUT / 'Medicalv2-ui-api-field-mapping.xlsx'
wb.save(xlsx)

md = ['# Medicalv2 UI to API field mapping', '', f'Branch: `{branch}` · Commit: `{commit}`', '',
      f'{len(rows)} UI mappings, {len(backend)} backend dependencies, and {len(inactive)} retained/inactive code mappings.', '',
      'The Excel workbook includes **UI Fields**, **Backend Dependencies**, **Inactive Code**, **API Reference Audit**, and **Read Me** sheets. CSVs contain the UI and backend tables separately.', '',
      'This maps the current Veeva MyInsights code to CRM object and field API names. It does not verify deployed Salesforce schema or permissions.', '',
      'Editable fields remain subject to the application\'s profile, plan-state, and legacy-record rules. Search, sort, filters, counts, and exports reuse mapped values.', '',
      'Medical profiles use `KPH_Ecosystem_Plan__c`; tactics use `KPH_Medical_Tactics__c`. UI barrier status `Closed` saves as `Complete`. Medical Education topic statuses have separate fields. Commercial, Stakeholder, and Referral & Dynamics screens are read-only.', '']
for page in dict.fromkeys(row[0] for row in rows):
    md += ['## ' + page, '', '| UI field | UI key | Object API | Field API | Usage | Notes | Source |', '|---|---|---|---|---|---|---|']
    for row in rows:
        if row[0] != page:
            continue
        file, line = row[7].rsplit(':', 1)
        values = row[1:7] + [f'[{Path(file).name}:{line}](../{file}#L{line})']
        md.append('| ' + ' | '.join(str(value).replace('|', '\\|').replace('\n', ' ') for value in values) + ' |')
    md.append('')
md += ['## Regenerate', '', '`python3 scripts/export-medicalv2-ui-api-mapping.py` (requires openpyxl).', '']
(OUT / 'Medicalv2-ui-api-field-mapping.md').write_text('\n'.join(md))

# Check the written workbook and CSV against the in-memory rows.
loaded = load_workbook(xlsx, read_only=True)
assert loaded['UI Fields'].max_row == len(rows) + 1
assert loaded['Backend Dependencies'].max_row == len(backend) + 1
assert list(loaded['UI Fields'].values)[1:] == [tuple(v or None for v in row) for row in rows]
for row in rows + backend + inactive:
    assert row[0] and row[1] and row[5] and row[7]
    if row[3]:
        assert row[3] in ''.join(sources.values()), row[3]
    for api in row[4].split(' + '):
        if api:
            assert api in ''.join(sources.values()), api
print(f'Created {xlsx.relative_to(ROOT)}')
print(f'Validated {len(rows)} UI rows, {len(backend)} backend rows, {len(inactive)} inactive rows; {len(audit)} API source references.')
