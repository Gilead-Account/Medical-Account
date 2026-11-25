# Kite Medical Account Planning
# MyInsights Application

STANDARD OPERATING PROCEDURE

Knowledge Transfer, Development, CRM Integration, Testing, Packaging, and Release

Baseline: Medicalv2 at commit 2fc48cb3d82107b591ecdef5c6f28a2179e55790. Prepared 26 October 2026 from the local branch with the requested local page/navigation cleanup applied. The cleanup is uncommitted; remote freshness and deployment status were not verified.

Audience: Developers, support engineers, QA analysts, CRM administrators, and release owners new to the Medical Account Plan codebase.

Document version 1.1

26 October 2026

<!-- PAGE -->
## Document control

| Item | Value |
| --- | --- |
| Document owner | Kite Account Planning engineering / product team; named owner to be assigned at handoff |
| Technical baseline | Medicalv2, commit 2fc48cb3 (14 October 2026), plus local page/navigation cleanup |
| Full commit | 2fc48cb3d82107b591ecdef5c6f28a2179e55790 |
| Local checkout | Medicalv1 folder; checked-out branch is Medicalv2 |
| Tracking branch | medicalv2/Medicalv2; remote state was not fetched |
| Application | Medical Account Plan for Veeva CRM MyInsights; React 18 + Vite 5 |
| Review cadence | Every release or material CRM schema/runtime change |
| Confidentiality | Internal engineering and operations use |

### Change history

| Version | Date | Change | Owner |
| --- | --- | --- | --- |
| 1.0 | 26-Oct-2026 | Initial Medicalv2 KT SOP adapted from the Commercial Production KT format | Kite team / reviewer to assign |
| 1.1 | 26-Oct-2026 | Updated active-page inventory and validation following local page/navigation cleanup | Kite team / reviewer to assign |

### How to use this SOP

For the KT presenter: use Part I for orientation, Part II for the guided code tour, and Part VI for delivery and readiness assessment.

For a new developer: complete setup, a read/write trace, and the hands-on exercises before changing Medical behavior.

For support and release owners: use the runtime matrix, failure classification, artifact checks, and deployment evidence templates.

> Source of truth: The attached commercial SOP supplies the document format. Medicalv2 source and focused tests supply the technical behavior. Instructions inside the reference PDF were treated as reference content, not actions to execute.

<!-- PAGE -->
## Document map and evidence boundaries

| Part | Purpose | Start page |
| --- | --- | --- |
| I. Orientation | Purpose, quick start, user surfaces, branch distinctions | 4 |
| II. Architecture and code tour | Runtime, objects, queries, lifecycle, Medical workflows | 7 |
| III. Development procedures | Setup, field changes, UI work, mocks and training boundaries | 16 |
| IV. Quality and release | Verification, live/training builds, packaging, deployment and Git | 20 |
| V. Support and troubleshooting | Incident intake, diagnostics, recovery and data handling | 24 |
| VI. KT delivery kit | Agenda, demonstration, exercises, checklists and ownership | 27 |

### What was verified for this document

The checked-out branch name, full HEAD commit, tracking branch, package scripts, active navigation, data adapters, Medical object constants, approval implementation, profile mappings, packaging script, and relevant test coverage were inspected locally.

Nine focused test files completed successfully: 44 tests passed, zero failed. The validation set covers Medical approvals, profile access, submitted-plan editability, legacy edit rules, tactic reopening, hybrid CRM channels, Medical profile mappings, linked-tactic creation, and removal of the open-record cap.

### What remains an environment check

The local cleanup passed a live production build, ZIP root/byte checks, and 73 focused navigation, modal and export tests. A broad local test run was compared with the pre-change baseline; see section 19.1. Browser, CRM, Salesforce Flow and iPad/device validation remain environment checks.

Existing untracked field-mapping workbooks, CSV/Markdown files, and their generator were present before this task and were left intact. Technical assertions here were checked against application source, rather than treating those uncommitted documents as the branch baseline.

> Documentation caveat: README.md and docs/veeva-sandbox-deployment-checklist.md describe a broadly mock-only training package. Current source has explicit live CRM exceptions. Use section 18's channel matrix when planning a training demonstration.

<!-- PAGE -->
PART I
# Orientation

Build the Medical mental model before touching code or CRM data.

## 1. Purpose and scope

This SOP enables a new owner to develop, debug, test, package, and support the Medical Account Plan MyInsights application on Medicalv2. It follows the six-part organization and numbered operating procedures of the supplied commercial KT document.

### 1.1 In scope

- React application structure, six active navigation surfaces, modal forms, and cached page data.
- Medical Barriers and Opportunities, linked Medical Tactics, strategies, profiles, stakeholders, team members, approvals, and exports.
- Veeva DataService context, queries, joins, metadata, writes, online/offline behavior, and record lifecycle.
- Local preview, packaged hybrid training, live-only build, testing, artifact inspection, release handoff, and support.

### 1.2 Evidence and authorization

A local test proves only the behavior it exercises. Live Veeva bridge availability, field permissions, validation rules, Flow automation, sharing, and offline synchronization require checks in the intended environment.

Deployment and CRM mutation procedures in this SOP describe future operating steps; creation of this document did not perform them. Record target org, operator, approval, and rollback ownership in the team's release evidence.

### 1.3 Medical branch distinction

The Medical UI uses Opportunities, while internal code retains Driver and filenames such as barriersDrivers.js and criticalActivities.js. Those names are implementation history; they do not mean that the commercial CRM objects or commercial approval rules apply.

Source anchors: src/App.jsx (PAGES); src/lib/medicalTerminology.js; src/lib/dataservice/accountPlan/shared.js.

<!-- PAGE -->
## 2. First-hour quick start

1. Open a terminal in the repository root. Confirm branch spelling, HEAD, upstream, and all existing work.
2. Install locked dependencies only when needed. Start Vite and use the URL reported by the server.
3. Open the seeded Medical plan. Inspect Home, Barriers & Opportunities, and Medical Tactics at desktop and tablet widths.
4. Trace one field to its CRM constant and mapper. Run the closest focused Node test.
5. Review live versus training commands and ZIP shape. Build only the variant appropriate to the session.

```bash
git status --short --branch
git branch --show-current
git rev-parse HEAD
git rev-parse --abbrev-ref --symbolic-full-name '@{u}'
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
node --test --test-concurrency=1 test/medicalTerminology.test.mjs
```

Expected document baseline: branch Medicalv2; upstream medicalv2/Medicalv2; HEAD 2fc48cb3. Branch names are case-sensitive. The local folder name Medicalv1 does not identify the checked-out code.

Local Vite preview enters the seeded FY26 Medical Account Plan - Northstar ATC directly. Packaged desktop builds retain the Account Plan launcher. A small hosted browser viewport alone does not prove iPad behavior.

## 3. Application at a glance

| Layer | Owner | Responsibility |
| --- | --- | --- |
| Presentation | React 18; pages and components | Forms, tables, navigation, notices, responsive layout |
| Controller | src/App.jsx | Plan selection, page cache, refresh, approval controls, exports |
| Domain | dataservice/accountPlan/* | Field lists, joins, mapped models, validation, write payloads |
| CRM boundary | query.js + client.js | DataService channels, ID helpers, response normalization |
| Local scenario | mockData/* | CRM-shaped fixtures and local mock persistence |
| Delivery | Vite + postbuild.mjs | Self-contained index.html and variant-labelled ZIPs |

Windows PowerShell users can use npm.cmd where shell execution policy prevents npm.ps1. Commands elsewhere in this SOP use standard npm syntax.

<!-- PAGE -->
## 4. Functional navigation and Medical deltas

| Page | Main module | Responsibility |
| --- | --- | --- |
| Home | pages/Overview + home.js | Account overview, Medical Strategy, goals, linked-tactic summaries, team context |
| Barriers & Opportunities | pages/BarriersDrivers + barriersDrivers.js | Medical parent records, indications, strategies, status, required linked tactic on creation |
| Medical Tactics | pages/CriticalActivities + criticalActivities.js | Tactic title, detail, due date, status, accountable member, parent linkage |
| Medical Account Profile | pages/AccountProfile + accountProfile.js | MM/DLBCL Medical tabs, Commercial reference tabs, Referral & Dynamics |
| Stakeholders | pages/Stakeholders + stakeholders.js | Person Account lookup, role and Other Role, mapped account/parent data |
| Team Members | pages/TeamMembers + teamMembers.js | User selection, participation, plan membership and record links |

### 4.1 Differences from the supplied commercial SOP

| Commercial reference | Medicalv2 baseline |
| --- | --- |
| Barriers & Drivers | Barriers & Opportunities; internal Driver still maps to Opportunity |
| KPH_Barriers_and_Tactical_Actions__c | KPH_Medical_Barrier_Tactical_Actions__c |
| KPH_Additional_Critical_Activities__c | KPH_Medical_Tactics__c |
| Commercial manager history-row decisions | Medical Account Plan status/routing writes and Medical history reads |
| Commercial approval submission comment | Medical submission date, submitter name, manager name/email |
| One production build narrative | Explicit live and hybrid training variants |

### 4.2 Profile tabs

The active Medical Account Profile has MM ATC Medical Profile, DLBCL ATC Medical Profile, MM Comm Profile, DLBCL Comm Profile, and Referral & Dynamics. The Commercial tabs are read-only reference views. Referral & Dynamics is rendered without edit callbacks in this branch, although referral writer functions remain available in the service layer.

Source anchors: src/App.jsx; src/pages/AccountProfile/index.jsx; src/lib/dataservice/accountPlan/shared.js.

<!-- PAGE -->
PART II
# Architecture and code tour

Follow one value from CRM context to UI and back to the write payload.

## 5. Runtime architecture

{{DIAGRAM}}

Figure 1. Medical Account Plan runtime and data flow.

> Core boundary: Components call domain services; domain services use query.js and client.js. Direct CRM reads and writes are explicit channels. A mock-backed default adapter does not prevent a domain service from choosing a live CRM channel.

### 5.1 Browser entry sequence

1. index.html loads q.js and MyInsightsLibrary.js and includes defensive Veeva bootstrap handling.
2. src/main.jsx mounts App.jsx into the application root.
3. App.jsx detects runtime mode. Local Vite enters the seeded plan; packaged desktop can show the launcher; iPad uses record context.
4. The selected loader resolves Account Plan and Account shell context, then composes domain reads and dependent joins.
5. query.js obtains the appropriate adapter dynamically; mappers unwrap CRM cells into UI models.
6. App.jsx caches page payloads and coordinates shared-record updates, background refresh, and export preparation.

Source anchors: index.html; src/main.jsx; src/App.jsx; src/lib/dataservice/client.js; src/lib/dataservice/query.js.

<!-- PAGE -->
### 5.2 Development, training, and live runtime

| Concern | Local Vite | Training ZIP in Veeva | Live ZIP in Veeva |
| --- | --- | --- | --- |
| Default adapter | Mock | Mock | Dynamic window.ds |
| Plan entry | Seeded plan | Real plan context / desktop list | Real plan context / desktop list |
| Child features | Fictional fixtures | Mixed; inspect explicit CRM paths | CRM reads and writes |
| Missing bridge | Preview still opens | Cannot establish normal deployed CRM context | Clear DataService runtime error |
| Persistence proof | Local only for mock paths | Action-specific; see section 18 | Verify CRM record and sync |
| Build command | npm run dev | npm run build:training | npm run build or build:live |

## 6. Repository ownership map

| Path | Owns | Boundary |
| --- | --- | --- |
| src/App.jsx | Navigation, plan selection, page cache, approval/export orchestration | Keep page-specific CRM fields in domain code |
| src/pages/* | Page state, layout, forms, modal composition | Call domain functions rather than window.ds |
| src/components/* | Shared shell, launcher, dialogs, help | Avoid broad CRM payload construction |
| src/lib/dataservice/accountPlan/* | Loaders, joins, field lists, models, CRUD rules | No DOM rendering |
| src/lib/dataservice/query.js | Query/write wrappers, unwrapping, Salesforce ID helpers | Preserve online/offline semantics |
| src/lib/dataservice/client.js | Mock/live selection and explicit CRM channels | Recheck every bypass of the default adapter |
| src/lib/mockData/* | Fictional fixture shape, mock parsing and persistence | Do not assume it controls explicit CRM writes |
| src/lib/export/* | PDF/PPT preparation, delivery and summary | Reuse mapped data and verify exported values |
| test/* | Focused behavior and source-contract regressions | Local success is not an org/device assertion |
| scripts/postbuild.mjs | Runtime embedding and ZIP packaging | No business rules |

The shared.js module owns reusable primitives and many field constants. Page-specific composers such as home.js and accountProfile.js own orchestration. Read both when following a displayed value.

<!-- PAGE -->
## 7. Runtime mode and Account Plan context

src/lib/runtime/viewMode.js distinguishes layout width from runtime mode. A real iPad signal takes precedence. Mobile layout is up to 720 pixels; tablet layout extends through 1400 pixels. Hosted HTTP/HTTPS tablet layouts can remain desktop; non-hosted tablet paths can select iPad behavior.

| Mode | Entry behavior | Critical check |
| --- | --- | --- |
| Local Vite | Direct seeded Medical plan | Do not expect the packaged desktop launcher |
| Packaged desktop / hosted web | Account Plan launcher until a plan is selected | Plan switch resets workspace context/cache |
| iPad | Direct shell using CRM entry context | Correct AccountPlan context, offline query support, inbound sync |
| Mobile | Direct shell | Preserve responsive controls and visible errors |

### 7.1 Account Plan resolution order

1. Explicit current-plan override, including window.__KAM_ACCOUNT_PLAN_ID__.
2. Veeva getDataForCurrentObject using AccountPlan first, then Account_Plan_vod__c, Account_Plan_vod, and Account_Plan compatibility names.
3. HTMLConfig current-object identifiers from supported window contexts.
4. Supported URL or referrer record IDs.
5. Account context followed by its most recently modified Account Plan.

The resolver checks Salesforce ID shape and coalesces in-flight resolution. Packaged Veeva reads use the real CRM channel for context. Missing context must remain visible rather than silently substituting an unrelated fixture plan.

### 7.2 Refresh and offline synchronization

App.jsx refreshes approval status and loaded workspace data on relevant resume paths. The approval refresh interval constant is 3000 ms; this refresh cannot download records that Veeva has not synchronized.

On iPad, desktop CRM changes require inbound Veeva synchronization before offline queries can see them. If a completed sync and application resume still show missing records, inspect the Mobile Object Configuration, object/field availability, record filters, and user access.

Source anchors: viewMode.js; shared.js (getCurrentAccountPlanId); App.jsx (refresh handlers); test/pageRefreshRecovery.test.mjs.

<!-- PAGE -->
## 8. CRM data model quick reference

| Object | Role | Key relationship / fields |
| --- | --- | --- |
| Account_Plan_vod__c | Plan shell, goals, Medical approval/routing | Account_vod__c; KPH_Medical_Approval_Status__c |
| Account | ATC identity, Person Accounts, site/name lookup | Primary_Parent_vod__c; explicit ID joins |
| User | Identity, manager routing, team/user names | ManagerId, Email, Name |
| RecordType | Medical parent/tactic/history classification | Resolve IDs by object and supported developer names |
| KPH_Ecosystem_Plan__c | MM/DLBCL Medical profile and reference data | KPH_Account_Plan__c to Account Plan |
| KPH_Medical_Barrier_Tactical_Actions__c | Medical Barrier or Opportunity | KPH_Account_Plan__c; type-specific title fields |
| KPH_Medical_Tactics__c | Linked Medical Tactic | KPH_Account_Plans__c; KPH_Barrier_or_Opportunity__c |
| Account_Team_Member_vod__c | Team Members / POD context | Account_Plan_vod__c; Team_Member_vod__c |
| KPH_Stakeholder_Map__c | Stakeholder role and Account link | KPH_Account_Plan__c; KPH_Account__c |
| KPH_Ecosystem_Map_Dynamics__c | Referral/site mapping | Account_Plan_vod__c; KPH_Account_Profile__c; KPH_Name_of_Site__c |
| KPH_Other_Healthcare_Networks__c | Healthcare network rows | KPH_Account_Profile__c; KPH_Account_Name__c |
| KPH_Account_Plan_Approval_History__c | Medical approval lifecycle evidence | KPH_Account_Plan__c; Medical status/submitter/approver |

### 8.1 Record type and relationship discipline

Medical parent RecordType IDs are discovered from the connected org; the application rejects missing or ambiguous Barrier/Opportunity types. Do not copy the hard-coded commercial IDs from the supplied reference PDF.

The Medical Tactic parent lookup is singular KPH_Barrier_or_Opportunity__c, while its plan lookup is plural KPH_Account_Plans__c. Confusing these names can create an orphaned row or a failed write.

Medical Strategy is stored on Medical parent records as KPH_Medical_Strategy__c. The Home strategy presentation aggregates those records. Do not infer an active KPH_Strategy__c dependency from the commercial SOP.

Source anchors: shared.js (object constants and field arrays); approval.js (history fields and record types).

<!-- PAGE -->
## 9. Read/query contract

| Wrapper | Purpose | Operational behavior |
| --- | --- | --- |
| runQuery | Default-channel multi-row reads | Normalizes responses, coalesces identical requests, strips unsupported dotted fields by default |
| runCrmQuery | Explicit CRM reads | Used for real plan, profile, stakeholder, team and other supported paths in hybrid runtime |
| queryRecord | Single-record read | Failure can return null; use intentionally |
| getDataForCurrentObject | Default context | Handles Veeva response shapes |
| getCrmDataForCurrentObject | Explicit CRM context | Approval routing and runtime context |
| getPicklistValueLabels / getCrmPicklistValueLabels | API-value to display-label metadata | Preserve API values on save |
| getObjectMetadata | Dependent picklist metadata | Parse optional/runtime-specific structures defensively |

### 9.1 Rules that prevent offline failures

- where contains an expression only; sort entries omit ORDER BY. Keep selected fields unique.
- Use buildIdMatchWhere and Salesforce ID helpers to support 15- and 18-character IDs.
- Use inClause for online/offline IN syntax. Do not hard-code one runtime's syntax into shared loaders.
- Avoid dotted relationship fields in shared/device queries. Use explicit parent/Account/User joins.
- allowDottedFields is an explicit exception requiring a supported online path and appropriate fallback.
- Run independent reads concurrently; wait for parent IDs before dependent queries. Preserve meaningful primary-query errors.
- Read field lists, mapper precedence, optional-field fallbacks, and permissions together when a value is blank.

```javascript
const rows = await runQuery({
  object: 'KPH_Medical_Tactics__c',
  fields: ['Id', 'KPH_Barrier_or_Opportunity__c', 'KPH_Status__c'],
  where: buildIdMatchWhere('KPH_Account_Plans__c', planId),
  sort: ['LastModifiedDate DESC'],
});
```

Source anchors: src/lib/dataservice/query.js; test/queryAllowDottedFields.test.mjs; test/queryInFlightCoalescing.test.mjs.

<!-- PAGE -->
## 10. Write and record-lifecycle contract

1. Validate the form model and parent/context IDs.
2. Call a named domain writer. Construct only the supported CRM fields.
3. Choose the adapter deliberately: default ds, explicit createCrmRecord, or updateRecord with the crm option.
4. Await the write, then update saved state/cache and show success. Keep a useful error visible if any step fails.
5. Reload from CRM or reopen the mock context, as appropriate, to prove persistence.

Do not add OwnerId or Veeva-managed audit/device fields to payloads without a verified requirement. Keep null/blank, boolean, numeric, date, and multipicklist normalization at the write boundary. Preserve each object's established soft-delete contract.

## 11. Page-specific implementation notes

### 11.1 Home

loadHome resolves shell context and composes header, Medical parents, tactics, team members, strategies and metadata. Home and detail pages share writers. App.jsx coordinates updated tactic counts and shared page caches.

Home strategy grouping comes from mapped Medical parents for DLBCL, Portfolio and MM. An urgent/timing indicator is derived from tactic due date and status; it is not a separate persisted field.

### 11.2 Barriers and Opportunities

Medical parent titles use KPH_Barrier_Title__c or KPH_Opportunity_Title__c. Status uses KPH_Medical_Tactical_Action_Status__c; strategy uses KPH_Medical_Strategy__c; indication uses KPH_Indication__c. Opportunity retains the internal type Driver.

New parent creation collects a linked Medical Tactic in the same modal. The page saves the parent first, then the tactic. This is two operations, not an atomic transaction. If the tactic write fails, the parent may already exist; reload and repair the missing tactic instead of blindly repeating parent creation.

The previous ten-open-record cap is removed. New parent status choices remain open so the required linked tactic can be created. Indication/type options and title/strategy dependencies must preserve current API values and labels.

Source anchors: pages/BarriersDrivers/index.jsx; BarrierDriverEditModal.jsx; shared.js; test/barrierDriverRequiredMedicalTactic.test.mjs; test/barrierDriverOpenLimit.test.mjs.

<!-- PAGE -->
### 11.3 Medical Tactics and legacy access

Medical Tactics use KPH_Medical_Tactics__c for both object and title field. Other main fields are KPH_Detail__c, KPH_Status__c, KPH_To_Be_Completed_By__c, KPH_Accountable_POD_Members__c and KPH_Indication__c. Soft deletion uses KPH_Is_Deleted__c.

The title limit is 255 characters. Due Date is required. Stored Completed is normalized to Complete; the open-status set contains Open, In Progress and Planned. Do not apply the old 55-character commercial title assumption.

The edit modal locks the linked parent selection. A completed tactic can reopen while its parent is active; when its parent is Closed, reopen the parent first. Closing/completion prompts and linked counts must remain consistent across Home and detail pages.

A Barrier with blank or placeholder Medical Strategy is legacy and read-only regardless of its creation date. Its linked Medical Tactics inherit that lock. Opportunities are outside this particular legacy rule. Before writes, domain code re-reads classification; unknown/unverifiable access does not grant edit permission.

### 11.4 Medical Account Profile

The profile owner is KPH_Ecosystem_Plan__c, selected by KPH_Account_Plan__c and latest LastModifiedDate. MM and DLBCL have separate field maps even when the UI labels look alike.

| UI concept | MM field example | DLBCL field example |
| --- | --- | --- |
| Category | KPH_MM_ATC_Profile_Category__c | KPH_DLBCL_ATC_Profile_Category__c |
| Medical Education | KPH_MM_Medical_Education__c | KPH_DLBCL_Medical_Education__c |
| Clinical Trial | KPH_MM_Kite_Clinical_Trial__c | KPH_DLBCL_Clinical_Trial__c |
| Research Capabilities | KPH_MM_Research_Capabilities__c | KPH_DLBCL_MM_Research_Capabilities__c |

Medical Education selections have independent status fields, including different MM/DLBCL AE Management, ATC Onboarding and Outpatient APIs. Use the exported mapping constants rather than deriving field names from labels.

Profile saves require a live Veeva session, an existing profile ID, and an allowlisted Medical field; blank becomes null. Local Vite can display fixtures, but Medical profile saves do not use a mock fallback. Commercial reference tabs stay read-only.

Source anchors: shared.js (Medical maps and updateMedicalAccountProfileField); pages/AccountProfile/index.jsx; test/medicalLegacyEditPolicy.test.mjs; test/accountProfileMedicalCrmMapping.test.mjs.

<!-- PAGE -->
### 11.5 Stakeholders, Team Members, and referrals

Stakeholders are scoped by KPH_Account_Plan__c and active soft-delete criteria. KPH_Account__c stores the selected Person Account. Role is KPH_Title__c; Other requires KPH_Other_Title__c. The current field list also reads KPH_Primary_Parent_Name__c. Inspect mapper precedence before changing account/parent name joins.

Stakeholder create/edit selects the live CRM channel when Veeva is available. Default soft-delete behavior differs from that channel choice; do not assume all actions in one page share persistence semantics in training mode.

Team Members use Account_Team_Member_vod__c with Account_Plan_vod__c, Team_Member_vod__c, Team_Member_Name_vod__c and KPH_Participation__c in write payloads. Creation uses createCrmRecord explicitly. Update and delete use the default adapter. Display-only role/status fields must not be mistaken for fields sent in that payload.

Referral site writes use KPH_Name_of_Site__c in this branch, not the commercial reference's Name_of_Site__c. Writers validate a selected site ID and use live CRM when available. Referral & Dynamics is currently a read-only presentation in the active profile page; service functions alone do not establish an enabled edit flow.

### 11.6 Medical approval workflow: submit and decide

The UI action is Submit for FD approval, although the function name submitMpdApproval is retained. Submission requires plan ID, YYYY-MM-DD submission date and signed-in submitter name. Routing resolves the logged-in User, reads ManagerId, then loads the manager's Email and Name. Missing routing data blocks submission.

| Action | Required Account Plan update | Supplemental update |
| --- | --- | --- |
| Submit | KPH_Medical_Approval_Status__c = Submitted for Approval; KPH_Medical_Submitter_Name__c; KPH_Medical_Approver_Email__c | KPH_Medical_Approver_Name__c; KPH_Medical_Submitted_Date__c |
| Approve | Status = Approved; clear submitter name and approver email | Clear approver name and submitted date |

These writes explicitly use CRM. The source retries required fields alone after a non-Flow full-payload failure; it does not retry recognized Salesforce Flow faults. The function does not implement the commercial reject/reassign history-row decision path.

Source anchors: shared.js (team/stakeholder/referral writers); approval.js (submitMpdApproval, approveAccountPlan, updateApprovalRecord).

<!-- PAGE -->
### 11.6 Medical approval workflow: access and history

| Capability | Current implementation |
| --- | --- |
| Approve button | Approver profile AND status exactly Submitted for Approval |
| Approver profiles | KPH-MSL-Manager-Platform; Field Director and Medical Regional Director, with/without KPH- prefix |
| Review-only director aliases | Medical Plan Director / Medical Planning Director appear in reviewer/history lists; this alone does not grant approve access |
| History access | Reviewer aliases plus KPH-MSL-Manager-Platform, KPH-MSL-Platform, Medical Science Liaison |
| Restricted submission profiles | KPH-Key Account Director; KPH-CTAM Manager |
| Repeated submission | Hidden/blocked while pending; Approved permits a new submission |
| Plan editability | Submission does not globally lock pages; legacy/reference restrictions remain independent |

Profiles are normalized for case and whitespace. Current App.jsx passes its approver-profile result into the sidebar reviewer behavior; inspect that wiring as well as exported profile lists when troubleshooting controls.

Pending recognition includes Submitted for Approval, legacy Under Review, and the submitted flag when status is not Approved. The exact Submitted for Approval state is still required for the approve button.

History is read from KPH_Account_Plan_Approval_History__c, scoped by Medical record types KPH_Medical_Approved, KPH_Medical_Pending and KPH_Medical_Submitted. Names resolve through User joins. The UI merges lifecycle rows created within the same minute; Actual Approver stays blank until Approved. Approved history timestamps use LastModifiedDate, falling back to CreatedDate.

The application updates Account Plan routing/status fields and reads history; verify the connected org's automation creates the expected history. Do not claim Flow success from local source/tests. Last FD Review is read through KPH_Last_FD_Review_date__c; approveAccountPlan does not directly write it.

### 11.7 PDF, PowerPoint, and executive summary

Exports under src/lib/export consume mapped page data. A screen mapping change must be checked in generated PDF/PPT output as well. Executive summary generation and prepared exports are orchestrated by App.jsx.

For the PPT logo fixture test, generate the mock PPTX using scripts/generate-mock-ppt.mjs after any build that cleans dist. Confirm delivery behavior in the intended desktop or device runtime.

Source anchors: approvalProfileAccess.js; accountPlanReadOnly.js; approval.js; App.jsx; test/submittedApprovalEditable.test.mjs.

<!-- PAGE -->
PART III
# Development procedures

Make narrow changes that preserve Medical CRM and device contracts.

## 12. Workstation setup

### 12.1 Required tools and access

| Tool | Purpose | Verification |
| --- | --- | --- |
| Git | Branch, diff, history, reviewed changes | git --version |
| Node.js + npm | Vite, Node tests, packaging | node --version; npm --version; use team-supported versions |
| Terminal | Bash/zsh or PowerShell command execution | Start in repository root |
| Browser | UI, responsive checks and developer console | Use actual Vite URL |
| Archive utility | postbuild uses PowerShell or zip fallback | Confirm chosen build can create archives |
| Veeva sandbox | Real context, permissions, automation and persistence | Authorized Account Plan entry point |
| iPad/Veeva client | Offline and synchronized data verification | Confirm app/device version and sync scope |

### 12.2 Install and run

```bash
# From the repository root
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

- Confirm Vite reports a listener and the page loads without fatal dependency errors.
- Confirm local preview opens the seeded Medical plan, not the packaged launcher.
- Open the six active pages and inspect browser errors.
- Resize to desktop and tablet widths; record the flow and runtime distinction.
- Use a connected Veeva session for Medical profile saving; local fixture rendering does not prove that write.

The repository includes package-lock.json; use it for reproducible installation. A successful install says nothing about availability of org-specific Medical APIs or offline record types.

Source anchors: package.json; README.md; vite.config.js; App.jsx.

<!-- PAGE -->
## 13. Standard change workflow

1. Record branch, commit, upstream, worktree status and any existing untracked work.
2. Find the visible label and nearest relevant test with rg.
3. Trace UI key to loader, mapper, field list, query channel, CRM object and write payload.
4. Identify the affected runtimes: local preview, packaged training, live desktop and iPad/offline.
5. Make the smallest change. Add focused regression coverage when behavior needs protection; routine document/copy edits can use direct review.
6. Run relevant existing tests serially. Inspect rendered behavior for UI changes.
7. Review diff and whitespace. Build and audit the intended variant if creating a release candidate.
8. Record what passed and what requires CRM/device validation. Stage only intended paths when committing is requested.

```bash
git status --short --branch
rg -n 'Exact label|KPH_Field__c' src test
node --test --test-concurrency=1 test/medicalApprovalWorkflow.test.mjs
git diff --check
git diff --stat
npm run build:live
```

## 14. Procedure: add or remap a CRM field

1. Verify exact object/field API, type, relationship, metadata, FLS and offline availability.
2. Find the owning constants in shared.js or the domain module; update a unique field list.
3. Unwrap and map null, false, zero and blank intentionally. Avoid truthiness that drops valid values.
4. Add only the supported write mapping, if the surface is editable. Check whether it selects a live CRM channel in training.
5. Fetch picklist labels from the correct object.field and retain API values on save. Check dependent controls.
6. Update mock parity where used, then verify query fields, mapper and payload with meaningful tests.
7. Check exports and fresh build content if affected. Confirm the real value in CRM, or record that it remains unverified.

> Medical mapping trap: KPH_DLBCL_MM_Research_Capabilities__c is the DLBCL field used by current source. Do not invent a cleaner-looking API name. Exact CRM metadata and the current mapping constants take precedence over naming symmetry.

<!-- PAGE -->
## 15. Procedure: change a CRM query

- Identify default ds versus explicit CRM channel before editing filters.
- Confirm plan/profile parent IDs and Salesforce ID variants. Use buildIdMatchWhere and inClause.
- Keep field arrays unique and avoid dotted relationships in shared/offline code.
- Separate dependent joins from concurrent independent reads.
- For optional profile fields, preserve accessible-field fallback behavior; do not hide a primary query failure behind an empty list.
- Check object/record-type visibility for the actual user and offline configuration.
- Run the relevant query, field-map and runtime tests; validate in Veeva for device-level claims.

## 16. Procedure: add or change a form

- Keep field validation, domain validation, and CRM enforcement distinct. Confirm required fields and maximum lengths.
- Use CRM IDs for lookup selections, not a display name. Preserve API picklist values while rendering readable labels.
- Preserve blank-to-null rules and each object's payload allowlist.
- Await writes. Do not show success based only on local setState.
- Respect legacy Barrier/tactic locks, closed-parent tactic restrictions and read-only Commercial reference tabs.
- For combined parent/tactic creation, preserve the two-step failure message and recovery path.
- Verify cached Home/detail models after save, refresh and plan switching.

## 17. Procedure: change UI, CSS, or navigation

Inspect the actual page or modal at a desktop width and tablet widths such as 1180 x 820 and 1024 x 768. Check overflow, sticky controls, modal scrolling, touch targets, date fields, long tactic labels and visible errors.

Local Vite skips the desktop launcher. If changing launcher selection or record navigation, use the packaged desktop path and verify that launcher controls stay out of the iPad shell. Responsive width alone does not emulate a native iPad bridge.

Source anchors: query.js; shared.js; pages/CriticalActivities/*; pages/BarriersDrivers/*; test/runtimeViewMode.test.mjs; test/desktopAccountPlanLauncher.test.mjs.

<!-- PAGE -->
## 18. Local mocks and hybrid training procedure

The development adapter uses CRM-shaped fictional rows and local persistence. The training build sets VITE_DATA_MODE=mock and keeps the mock default adapter, but explicit CRM channels remain callable. The following matrix records current source choices when Veeva is available.

| Area / action | Training behavior in Veeva | Source |
| --- | --- | --- |
| Plan, Account, identity and context | Explicit real CRM reads | client.js; shared.js |
| Medical parents/tactics, default writes | Default mock channel | shared.js; query.js |
| Medical MM/DLBCL profile read/save | Real CRM read; allowlisted real update | shared.js |
| Commercial profile reference tabs | Real CRM reads; read-only UI | shared.js; AccountProfile/index.jsx |
| Team Member list/create | Real CRM query/create | fetchTeamMembersByPlan; createTeamMember |
| Team Member update/delete | Default adapter; mocked in training | updateTeamMember; deleteTeamMember |
| Stakeholder list/create/update | Real CRM when runtime available | fetchStakeholders; create/updateStakeholder |
| Stakeholder delete | Default soft-delete channel | deleteStakeholder |
| Referral reads and service writers | Real CRM when runtime available; current tab is read-only | shared.js; AccountProfile/index.jsx |
| Approval submit/approve | Explicit real CRM updates | approval.js |
| Other default mock edits | Browser/webview-local state | mockAdapter.js |

### 18.1 Session preparation and persistence

Use clearly fictional fixtures. Preserve method/response parity rather than weakening production queries to fit a mock parser. Run npm run verify:training-data before preparing the training variant.

Mock edits depend on the browser/webview storage partition and plan binding; they are not a shared CRM backend. Site-data clearing can reset them. Real-channel writes instead require correct CRM permissions and record verification. A page can mix these outcomes by action.

> Training caveat: Do not describe the current training ZIP as universally CRM read-only. crmReadDs itself is read-only, but client.js also exposes crmCreateDs and crmUpdateDs, used by the exceptions above. Reconcile older training handoffs with source before a connected demonstration.

<!-- PAGE -->
PART IV
# Quality and release

Prove the changed behavior, the selected artifact, and the target environment.

## 19. Testing strategy

| Gate | When | Evidence |
| --- | --- | --- |
| Focused Node tests | Behavior or contract change | Exact file list, pass/fail and exit status |
| Broader serial suite | Cross-cutting/runtime/release change | Full command, duration, failures/timeouts |
| Rendered QA | UI, navigation, modal or export change | Viewport, user flow, console and output review |
| Variant build | Release candidate | Explicit live/training command, fresh output |
| Artifact audit | Deployable ZIP | Entries, embedded runtimes, byte comparison, hash |
| CRM/device check | Queries, writes, approval, sync or permissions | Actual user/org/device outcome and limitations |

```bash
# Explicit focused file list
node --test --test-concurrency=1 \
  test/medicalApprovalWorkflow.test.mjs \
  test/submittedApprovalEditable.test.mjs \
  test/trainingCrmReadOnlyBoundary.test.mjs

# Full top-level .test.mjs suite, Bash/zsh
node --test --test-concurrency=1 test/*.test.mjs
```

The updated checkout has 92 top-level .test.mjs files. Tests under src/lib/export are separate; follow their fixture requirements. Counts can change, so discover files before claiming broad coverage. Do not append a literal test argument to an explicit file command.

### 19.1 Validation completed for this KT

44 tests passed across these nine files: medicalApprovalWorkflow, approvalProfileAccess, submittedApprovalEditable, medicalLegacyEditPolicy, medicalTacticReopenPolicy, trainingCrmReadOnlyBoundary, accountProfileMedicalCrmMapping, barrierDriverRequiredMedicalTactic and barrierDriverOpenLimit (all under test/, suffix .test.mjs).

The page/navigation cleanup also passed 73 focused tests across active navigation, sidebar, shared modal, parent-link and export coverage. The live production build passed, and the new ZIP contains exactly one root index.html whose bytes match dist/index.html. Active CSS selector/declaration preservation was checked against the starting revision.

The broad suite had 35 failures before cleanup. After cleanup it completed 412 tests: 380 passed and 32 failed, with no new failure names compared with baseline. The remaining failures include existing tests for absent Account Insights/form files and unrelated field/summary expectations. Browser, CRM and iPad validation were not performed.

<!-- PAGE -->
## 20. Build and package

### 20.1 Authoritative build commands

```bash
npm run build          # production mode + postbuild live
npm run build:live     # explicit live alias
npm run build:training # training mode + postbuild training
```

Vite uses relative asset paths, embeds application JS/CSS and inline assets, and targets ES2022. Live mode aliases the mock adapter to the live stub; training retains fixtures. postbuild embeds q.js and MyInsightsLibrary.js as base64 data-URI scripts, removes assets/static output folders, and writes date and timestamp ZIP copies.

### 20.2 Expected artifact names and shape

```text
dist/kite_myinsights_v2_live_YYYYMMDD_HHMMSS.zip
dist/kite_myinsights_v2_training_YYYYMMDD_HHMMSS.zip
  index.html    (the only ZIP entry, at root)

# Additional date-only copy, for the selected variant:
dist/kite_myinsights_v2_live_YYYY-MM-DD.zip
```

Timestamps are generated using UTC in postbuild.mjs. Build variants share dist, and each Vite build empties it. Preserve a release candidate outside dist before building another variant if both are needed.

### 20.3 Artifact checklist

- Use the new timestamped ZIP whose variant matches the intended behavior.
- Verify exactly one root index.html; no wrapper folder, source, tests, .git, node_modules or environment files.
- Compare extracted HTML bytes with dist/index.html.
- Verify embedded q.js precedes MyInsightsLibrary.js and runtime bootstrap remains intact.
- Verify no unresolved ./static references or inappropriate root-absolute assets remain.
- Confirm live packages exclude bundled scenario fixtures. Training packages intentionally retain fictional fixtures; label them accordingly.
- Scan for unexpected endpoints, credentials and retired API/copy relevant to the change.
- Record ZIP size and SHA-256. A successful build alone does not prove correct variant or successful CRM execution.

Source anchors: package.json; vite.config.js; scripts/postbuild.mjs; index.html.

<!-- PAGE -->
## 21. Veeva deployment handoff

1. Confirm approved target org, HTML report, user audience, build variant and owner.
2. Record branch, full commit, test results, ZIP absolute path, variant, byte size and SHA-256.
3. Identify the prior approved package and a rollback owner before replacing content.
4. Upload through the team's governed MyInsights process. The repository checklist identifies HTML_Report_vod with Account_Plan_vod record type for the Account Plan entry point; verify target-org configuration.
5. Confirm desktop launcher selection and iPad AccountPlan context, as applicable.
6. Smoke-test Medical reads, an agreed write, approval visibility and exports with the intended profile.
7. Verify actual persistence by requery/reopen. For approval, confirm manager routing, status and automation-produced history.
8. Repeat affected flows after iPad synchronization and offline entry when in scope.
9. Record results and limitations. Restore the prior package if agreed rollback criteria are met.

### 21.1 Release evidence template

| Item | Record at release |
| --- | --- |
| Source | Branch, full commit, upstream, clean/intended diff |
| Artifact | Live/training variant, filename, absolute path, bytes, SHA-256 |
| Validation | Exact tests, build exit, ZIP audit, UI flows |
| Environment | Org, HTML report, entry object, user/profile, client/device |
| Data evidence | Saved record/field verification, approval Flow/history result |
| Offline evidence | Last sync, affected object coverage, offline outcome |
| Recovery | Previous approved ZIP/hash, owner, rollback trigger |
| Limitations | Checks not run, schema/access gaps, follow-up owner |

### 21.2 Rollback scope

Reinstalling a prior HTML ZIP restores application code, not CRM data already changed by a live channel. If a release created incorrect records or routing values, gather exact affected records and coordinate data remediation separately with the CRM owner.

For a training incident, establish the actual channel first. Clearing browser storage can reset mock changes but cannot reverse an explicit CRM update.

<!-- PAGE -->
## 22. Git branch, pull, and push procedure

### 22.1 Preserve work and establish the target

Check status, local branch, upstream and untracked files. The inspected local branch tracks medicalv2/Medicalv2; do not assume origin or a lowercase medicalv2 branch. Resolve exact case and remote name before changing refs.

Preserve unrelated work through a deliberate commit, separate checkout, or named stash including untracked paths when appropriate. Do not overwrite a dirty working tree. Fetch and inspect divergence before a fast-forward pull; if integration is needed, follow the repository's agreed review process.

```bash
git status --short --branch
git remote -v
git branch -vv
git rev-parse --abbrev-ref --symbolic-full-name '@{u}'
# After target and working state are confirmed:
git fetch medicalv2
git rev-list --left-right --count HEAD...medicalv2/Medicalv2
```

### 22.2 Commit and push

Run relevant checks, inspect the full diff, and stage only intended files. Commit/push only in the scope of the requested workflow. If publishing Medicalv2 is authorized, verify the target refspec first; the corresponding target is HEAD:Medicalv2 on remote medicalv2.

After a requested push, fetch and prove local HEAD equals the remote target. Do not use force to bypass divergence. Treat authentication failures as access issues.

## 23. Definition of done

- Branch/upstream, baseline and existing work recorded; unrelated files preserved.
- UI-to-mapper-to-query/write-to-object.field trace established.
- Appropriate focused checks pass; broader failures or unrun checks are explicit.
- Relevant UI/device behavior and training/live channels assessed.
- Diff is scoped and whitespace checks pass.
- Fresh artifact built, audited and hashed when a release candidate is requested.
- CRM/device outcome, limitations, rollback owner and remote proof recorded as applicable.

No fetch, pull, commit, push or application deployment was performed to create this KT document.

<!-- PAGE -->
PART V
# Support and troubleshooting

Classify the failing boundary before changing code.

## 24. Incident intake template

| Capture | Guidance |
| --- | --- |
| Environment | Local Vite, training in Veeva, live hosted CRM, iPad online/offline |
| Source/artifact | Branch, commit, live/training ZIP name and hash |
| Context | Plan/profile record, user/profile, device, app version and last sync |
| Action | Exact sequence and selected fields/buttons |
| Expected / actual | Specific value, visibility, routing or persistence outcome |
| Evidence | Sanitized console, query/payload field names, CRM reread, screenshot |
| Reproducibility | One user/record/runtime or consistent across cases |

## 25. Failure classification

| Symptom | Likely boundary | First checks |
| --- | --- | --- |
| Blank or endless loading | Bootstrap, context, rejected read | window.ds, runtime diagnostics, first failed query |
| Medical field blank | Wrong field/profile, FLS, offline sync | Exact MM/DLBCL API, latest profile ID, accessible-field fallback |
| Local profile save fails | Intentional live-session requirement | Veeva session and Ecosystem Plan ID |
| Training edit appears in CRM | Explicit CRM channel | Section 18 matrix and writer function |
| Parent created, tactic missing | Second write failed | Existing parent ID; repair linked tactic |
| Approve button absent | Profile or exact status | canProfileApproveAccountPlan; Submitted for Approval |
| Submit fails | User/Manager or Flow fault | ManagerId, Email, Name; Salesforce validation/Flow message |
| Submitted plan still editable | Intended behavior | Pending blocks resubmission, not all edits |
| Tactic locked | Legacy Barrier or Closed parent | Stored strategy and parent status |
| Desktop correct; iPad stale | Sync/config/query mismatch | Inbound sync, Mobile Object Configuration, IDs and dotted fields |

<!-- PAGE -->
## 26. Troubleshooting playbooks

### 26.1 Missing Account Plan context or failed bootstrap

Confirm packaged runtime and entry object. Inspect the AccountPlan-first context sequence, supported fallback names, HTMLConfig and selected-plan override. App.jsx exposes bootstrap diagnostics through window.__KAM_VEEVA_BOOTSTRAP__ and context-call diagnostics through window.__KAM_CURRENT_OBJECT_DIAGNOSTICS__.

Check Q, Utilities, OnlineAPI, DataService and script initialization separately. A missing bridge is not the same as a successful bridge returning no plan. Use sanitized values when sharing diagnostic output.

### 26.2 Blank Medical profile or incorrect MM/DLBCL value

Resolve the latest KPH_Ecosystem_Plan__c for KPH_Account_Plan__c. Confirm the profile ID and exact field map. Verify FLS, optional-field fallback, picklist API values and per-education status mappings.

The Ecosystem Plan does not have KPH_Is_Deleted__c; do not add the child-object soft-delete filter to that query. On iPad, confirm inbound synchronization and Mobile Object Configuration before treating a cache refresh as a data fix.

### 26.3 Save succeeds locally but CRM differs

Identify the writer and adapter rather than inferring persistence from the page. Re-read the actual target record after the awaited write. Training actions can mix mock and CRM paths; update/delete behavior can differ from create in the same module.

If parent creation succeeded and linked tactic creation failed, retain the existing parent ID, resolve the tactic validation/access error and complete the relationship. Repeating the entire create flow can duplicate parents.

### 26.4 Approval submission or history fails

Check signed-in User ID, ManagerId, manager Email/Name, Account Plan routing FLS, and the exact Medical status. For Flow failures, use the specific Salesforce error and coordinate with the CRM automation owner; repeating a failed request does not repair server automation.

For missing history, verify visibility of Medical RecordType rows and the history object/fields. The UI combines rows within the same minute and suppresses Actual Approver until Approved. Compare raw records before declaring records missing or duplicated.

Source anchors: App.jsx; shared.js; approval.js; client.js; query.js.

<!-- PAGE -->
### 26.5 Package fails to load or shows old behavior

Open the exact uploaded ZIP and check the variant and timestamp. Verify one root index.html, runtime embedding/order, absence of unresolved static paths, and agreement between extracted bytes and the built HTML.

Check the MyInsights content record and entry object, then distinguish bootstrap, context, field access and primary-query errors. A runtime marker containing MOCK in its historical name is not sufficient evidence of training mode; use package variant, build configuration and adapter behavior.

### 26.6 Stakeholder or related Account name is wrong

Trace the stored Account ID, current field list, mapper precedence and explicit Account name lookup. The active stakeholder fields include KPH_Primary_Parent_Name__c; do not assume an older parent-join implementation remains active.

If a flow requires a parent Account join, query the child Account's Primary_Parent_vod__c, collect those IDs, then query parent Account names with normalized IDs. Do not apply Person Account restrictions to the parent HCO query without a business requirement.

## 27. Security and data handling

Use fictional fixtures and sanitized diagnostic examples. Do not place credentials, access/session tokens, private keys or reusable secrets in browser code, source, exports, ZIPs or incident notes.

The branch contains stakeholder and profile diagnostic logging. Review logs before sharing; query rows and record IDs can contain account/person context. Share the minimal field names, error text and sanitized structure needed to reproduce a failure.

Respect Salesforce sharing, field permissions, validation rules and Veeva offline configuration. UI visibility rules are not a replacement for CRM access enforcement. Confirm the actual target record and channel before a connected training action.

Review generated PDF, PPT and ZIP artifacts for unintended data before release. Use the approved environment and owner for any external integration or credential handling.

For incidents involving persisted records, separate code rollback from data remediation. Preserve branch, package hash, user/profile, affected fields and sanitized before/after evidence so the CRM owner can assess the change.

<!-- PAGE -->
PART VI
# KT delivery kit

Run the session, demonstrate evidence, and assess readiness.

## 28. Recommended KT agenda

| Time | Topic | Outcome |
| --- | --- | --- |
| 0:00-0:20 | Medical context and six user surfaces | Explain parent/tactic/profile relationships |
| 0:20-0:45 | Architecture and three runtime modes | Distinguish preview, hybrid training and live |
| 0:45-1:15 | Guided repository tour | Find UI, domain, adapters, exports, tests and packaging |
| 1:15-1:45 | Read/write trace and CRM channels | Identify field, mapper, parent ID and persistence path |
| 1:45-2:00 | Break | Capture unresolved questions |
| 2:00-2:35 | Medical legacy and approval workflows | Explain locks, pending editability and manager routing |
| 2:35-3:05 | Test and diagnose | Run focused checks and classify a failure |
| 3:05-3:35 | Build, ZIP audit and deployment evidence | Select the correct variant and record its hash |
| 3:35-4:00 | Git and hands-on exercise | Make a scoped change on an appropriate branch |
| 4:00-4:15 | Readiness and ownership | Assign access gaps, follow-ups and shadow period |

## 29. Presenter demonstration script

1. Show current branch, upstream, commit and worktree. Explain why Medicalv1 as a folder name is not a branch identity.
2. Open App.jsx PAGES and show the six active navigation entries and their loaders. Follow each entry to its rendered page.
3. Open local preview and trace one Medical Tactic value through shared.js, its field list, mapper and UI.
4. Follow combined parent/tactic creation and show its second-write failure message without deliberately creating bad CRM data.
5. Show client.js and identify ds, crmReadDs, crmCreateDs and crmUpdateDs. Trace a training exception before any connected demo.
6. Explain approval submit fields, User.ManagerId routing, profile checks and editable pending plans.

<!-- PAGE -->
### 29.1 Presenter demonstration, continued

7. Show a legacy Barrier with missing strategy and explain its inherited tactic lock. Compare an active parent and a closed-parent tactic.
8. Compare MM and DLBCL Medical mappings, independent education status fields, and read-only Commercial tabs.
9. Run a focused test and identify the exact query, payload or state assertion it covers.
10. In an appropriate build session, create the requested variant, inspect the root ZIP entry, compare bytes, check runtime order and calculate SHA-256.
11. Show the release evidence template and a scoped Git diff. Record CRM/device checks that still require an environment.

## 30. Hands-on exercises

### Exercise A: Medical Tactic read-path trace

Choose a visible tactic field. Produce label -> component -> model key -> mapper -> loader -> object.field -> plan/parent filter -> selected adapter. Explain how its value reaches both a detail page and Home summary. Success: every step is supported by a current source location.

### Exercise B: Safe display change

On a disposable development branch, change a mock-only display label. Verify the local screen and scoped diff. Success: no CRM API, payload, record type or live behavior changes; unrelated files remain untouched.

### Exercise C: Approval and training-channel verification

Explain each required/supplemental submit field, manager lookup, retry behavior and status transition. Then classify Team Member create versus update, stakeholder edit and Medical profile save in training mode. Success: the trainee predicts which action can affect CRM and supports the answer with source.

### Exercise D: Artifact inspection

Build the assigned live or training variant without uploading. Record exact ZIP name, entries, HTML byte comparison, runtime order, SHA-256 and intended target. Success: another owner can reproduce the candidate and distinguish its persistence behavior.

### Exercise E: Partial parent/tactic failure

Using a local test or code walkthrough, explain the state after the parent saves but tactic creation fails. Success: identify the existing parent, repair the missing tactic and avoid a duplicate-parent retry.

<!-- PAGE -->
## 31. New-owner readiness checklist

- Can explain local mock, hybrid training and live CRM as distinct modes.
- Can locate each active page loader and its CRM fields.
- Can construct safe ID/filter syntax and explain dotted-field risks.
- Can trace every write's adapter and prove persistence appropriately.
- Can explain legacy Barrier locks and closed-parent tactic reopening.
- Can explain manager routing, approver profiles, pending editability and history display.
- Can verify MM/DLBCL profile mapping, field access and offline refresh boundaries.
- Can run focused tests and state what they do not prove.
- Can build/audit the correct variant and record its hash.
- Knows CRM schema/Flow, product, offline and release escalation owners.

## 32. Operational checklists

### 32.1 Before coding

- Confirm branch/upstream and preserve unrelated work.
- Identify exact behavior, object/field, adapter and runtime.
- Locate relevant tests and verify unfamiliar API names against source/metadata.

### 32.2 Before requesting review

- Review scoped diff and whitespace; relevant tests pass.
- Inspect rendered behavior when UI changes.
- Record build/artifact results where required, plus unrun CRM/device checks.
- Remove temporary diagnostics and exclude unintended data or credentials.

### 32.3 Before deployment

- Record approved source, variant, target, operator and artifact hash.
- Identify rollback package and data-remediation owner.
- Agree desktop/iPad, read/write, approval and export smoke scope.
- Verify hybrid training exceptions before connected demonstrations.

### 32.4 Ownership handoff record

Assign named owners for product rules, CRM schema/FLS, Flow approvals, Veeva offline configuration, release approval and support. Record access gaps and follow-up dates; ownership is not inferred from a code filename.

<!-- PAGE -->
## 33. Glossary

| Term | Meaning |
| --- | --- |
| MyInsights / DataService | Veeva custom HTML runtime / window.ds CRM bridge |
| VQL / dotted field | Device query behavior / relationship field such as Owner.Name |
| MSL / MRD / FD | Medical Science Liaison / Medical Regional Director / Field Director |
| MM / DLBCL / ATC | Multiple myeloma / diffuse large B-cell lymphoma / Authorized Treatment Center |
| Opportunity / Driver | Medical UI term / retained internal type for the same parent category |
| Medical Tactic | Child action linked to a Medical Barrier or Opportunity |
| Legacy Barrier | Barrier without a stored usable Medical Strategy; read-only in current rules |
| Hybrid training | Mock default adapter plus explicit real CRM paths |
| FLS / MOC | Salesforce field-level security / Veeva Mobile Object Configuration |
| Soft delete / fixture | Inactive/deleted flag rather than hard delete / fictional CRM-shaped local data |

## 34. Command reference

```bash
git status --short --branch
git rev-parse HEAD
git diff --check
rg -n 'Exact label|KPH_Field__c' src test
npm run dev -- --host 127.0.0.1 --port 5173
node --test --test-concurrency=1 test/medicalApprovalWorkflow.test.mjs
npm run verify:training-data
npm run build:live
# Or intentionally choose: npm run build:training
unzip -l dist/kite_myinsights_v2_live_<timestamp>.zip
shasum -a 256 dist/kite_myinsights_v2_live_<timestamp>.zip
```

Replace <timestamp> with the actual filename before running shell commands. On Windows use Get-FileHash -Algorithm SHA256 and archive inspection through PowerShell or the approved archive tool.

## 35. Maintenance and ownership

Update the branch/commit baseline, active pages, mappings, adapter exceptions, approvals, tests and build naming after material changes. Reconcile stale training documentation with source. Keep release evidence with package hash, org, user/profile, device coverage and limitations.

Use the companion editable Word/Markdown files for revisions and regenerate the PDF after review. Every behavior claim should remain traceable to source, a test, an artifact, a CRM record or a device observation.
