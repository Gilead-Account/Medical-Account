# Function catalog: Medical Account Plan

Inspected 27 October 2026. Covers **1074 named JavaScript/JSX/MJS function definitions** across application source and JavaScript tooling, plus exported aliases. Read [the page-by-page walkthrough](CODEBASE_WALKTHROUGH.md) first.

This is a lookup reference, not a suggested presentation order. Search for a filename or function name. Each source link points at its declaration. Repeated names are separate functions in separate scopes/files; the file and line distinguish them.

Coverage includes named declarations, variable-assigned functions, object methods, and useCallback-assigned functions. Anonymous map/filter/event/effect callbacks are described through their enclosing workflow rather than listed as separate functions. Vendor libraries in public/static, tests, generated bundles, XML templates, and Python document/workbook generators are outside this application-function inventory. A declaration appearing here does not prove an active UI call site; retained/inactive flows are identified in the walkthrough.

**Connections:** Each file lists its local imports. The final table column shows up to six actual function-call or JSX-component references inside each implementation, including nested callbacks. This is a reading aid, not a complete execution trace; some references are conditional or dormant. Imported references lead to the dependency files above the table; locally declared references lead to another row in the same file.

**Conventions:** loaders assemble page data; fetchers read records/metadata; mappers create UI models; apply-form helpers change immediate UI state; domain writers persist; event handlers coordinate the workflow. Default-adapter writes and explicit CRM writes have different destinations in training builds. See the walkthrough runtime section before demonstrating saves.

## Files

- [src/main.jsx](#srcmainjsx)
- [src/App.jsx](#srcappjsx)
- [src/components/AccountPlanLauncher.jsx](#srccomponentsaccountplanlauncherjsx)
- [src/components/Sidebar.jsx](#srccomponentssidebarjsx)
- [src/pages/Overview/AccountStrip.jsx](#srcpagesoverviewaccountstripjsx)
- [src/pages/Overview/BarriersDriversSummary.jsx](#srcpagesoverviewbarriersdriverssummaryjsx)
- [src/pages/Overview/HomeBarrierDriverMedicalTactics.jsx](#srcpagesoverviewhomebarrierdrivermedicaltacticsjsx)
- [src/pages/Overview/KiteStrategy.jsx](#srcpagesoverviewkitestrategyjsx)
- [src/pages/Overview/PodUsers.jsx](#srcpagesoverviewpodusersjsx)
- [src/pages/Overview/UrgentActivities.jsx](#srcpagesoverviewurgentactivitiesjsx)
- [src/pages/Overview/index.jsx](#srcpagesoverviewindexjsx)
- [src/pages/BarriersDrivers/BarrierDriverEditModal.jsx](#srcpagesbarriersdriversbarrierdrivereditmodaljsx)
- [src/pages/BarriersDrivers/barrierDriverModalOptions.js](#srcpagesbarriersdriversbarrierdrivermodaloptionsjs)
- [src/pages/BarriersDrivers/index.jsx](#srcpagesbarriersdriversindexjsx)
- [src/pages/CriticalActivities/CriticalActivityEditModal.jsx](#srcpagescriticalactivitiescriticalactivityeditmodaljsx)
- [src/pages/CriticalActivities/CriticalActivityNewModal.jsx](#srcpagescriticalactivitiescriticalactivitynewmodaljsx)
- [src/pages/CriticalActivities/LinkedBarrierDriverStatusPrompt.jsx](#srcpagescriticalactivitieslinkedbarrierdriverstatuspromptjsx)
- [src/pages/CriticalActivities/index.jsx](#srcpagescriticalactivitiesindexjsx)
- [src/pages/CriticalActivities/linkedBarrierDriverOptions.js](#srcpagescriticalactivitieslinkedbarrierdriveroptionsjs)
- [src/pages/AccountProfile/AccountIntelligenceTab.jsx](#srcpagesaccountprofileaccountintelligencetabjsx)
- [src/pages/AccountProfile/AccountLookupField.jsx](#srcpagesaccountprofileaccountlookupfieldjsx)
- [src/pages/AccountProfile/CommercialMmProfileTab.jsx](#srcpagesaccountprofilecommercialmmprofiletabjsx)
- [src/pages/AccountProfile/ProfileTab.jsx](#srcpagesaccountprofileprofiletabjsx)
- [src/pages/AccountProfile/ReferralDynamicsTab.jsx](#srcpagesaccountprofilereferraldynamicstabjsx)
- [src/pages/AccountProfile/index.jsx](#srcpagesaccountprofileindexjsx)
- [src/pages/AccountProfile/medicalEducationStatuses.js](#srcpagesaccountprofilemedicaleducationstatusesjs)
- [src/pages/AccountProfile/medicalProfilePicklistValues.js](#srcpagesaccountprofilemedicalprofilepicklistvaluesjs)
- [src/pages/Stakeholders/StakeholdersTab.jsx](#srcpagesstakeholdersstakeholderstabjsx)
- [src/pages/Stakeholders/index.jsx](#srcpagesstakeholdersindexjsx)
- [src/pages/TeamMembers/TeamMemberEditModal.jsx](#srcpagesteammembersteammembereditmodaljsx)
- [src/pages/TeamMembers/index.jsx](#srcpagesteammembersindexjsx)
- [src/lib/dataservice/accountPlan/accountPlanLauncher.js](#srclibdataserviceaccountplanaccountplanlauncherjs)
- [src/lib/dataservice/accountPlan/accountProfile.js](#srclibdataserviceaccountplanaccountprofilejs)
- [src/lib/dataservice/accountPlan/approval.js](#srclibdataserviceaccountplanapprovaljs)
- [src/lib/dataservice/accountPlan/barrierOpportunityPicklists.js](#srclibdataserviceaccountplanbarrieropportunitypicklistsjs)
- [src/lib/dataservice/accountPlan/barriersDrivers.js](#srclibdataserviceaccountplanbarriersdriversjs)
- [src/lib/dataservice/accountPlan/criticalActivities.js](#srclibdataserviceaccountplancriticalactivitiesjs)
- [src/lib/dataservice/accountPlan/dependentPicklists.js](#srclibdataserviceaccountplandependentpicklistsjs)
- [src/lib/dataservice/accountPlan/errorMessages.js](#srclibdataserviceaccountplanerrormessagesjs)
- [src/lib/dataservice/accountPlan/home.js](#srclibdataserviceaccountplanhomejs)
- [src/lib/dataservice/accountPlan/shared.js](#srclibdataserviceaccountplansharedjs)
- [src/lib/dataservice/accountPlan/stakeholders.js](#srclibdataserviceaccountplanstakeholdersjs)
- [src/lib/dataservice/accountPlan/teamMembers.js](#srclibdataserviceaccountplanteammembersjs)
- [src/lib/dataservice/accountPlan/titlePicklistMappings.js](#srclibdataserviceaccountplantitlepicklistmappingsjs)
- [src/lib/dataservice/client.js](#srclibdataserviceclientjs)
- [src/lib/dataservice/mockAdapter.live.js](#srclibdataservicemockadapterlivejs)
- [src/lib/dataservice/query.js](#srclibdataservicequeryjs)
- [src/lib/accountPlanReadOnly.js](#srclibaccountplanreadonlyjs)
- [src/lib/approvalProfileAccess.js](#srclibapprovalprofileaccessjs)
- [src/lib/approvalReviewDate.js](#srclibapprovalreviewdatejs)
- [src/lib/medicalTerminology.js](#srclibmedicalterminologyjs)
- [src/components/AccountProfileFieldHelp.jsx](#srccomponentsaccountprofilefieldhelpjsx)
- [src/components/ApprovalHistoryModal.jsx](#srccomponentsapprovalhistorymodaljsx)
- [src/components/ApproveAccountPlanModal.jsx](#srccomponentsapproveaccountplanmodaljsx)
- [src/components/EditModalField.jsx](#srccomponentseditmodalfieldjsx)
- [src/components/ExecutiveSummaryModal.jsx](#srccomponentsexecutivesummarymodaljsx)
- [src/components/HomeFieldHelp.jsx](#srccomponentshomefieldhelpjsx)
- [src/components/KiteAccountPlanLoader.jsx](#srccomponentskiteaccountplanloaderjsx)
- [src/components/LoadingScreen.jsx](#srccomponentsloadingscreenjsx)
- [src/components/PdfAllPagesViewer.jsx](#srccomponentspdfallpagesviewerjsx)
- [src/components/SubmitMpdApprovalConfirmModal.jsx](#srccomponentssubmitmpdapprovalconfirmmodaljsx)
- [src/components/TableSortButton.jsx](#srccomponentstablesortbuttonjsx)
- [src/lib/helper/modalDismiss.js](#srclibhelpermodaldismissjs)
- [src/lib/helper/tableSort.js](#srclibhelpertablesortjs)
- [src/lib/helper/teamMemberUsers.js](#srclibhelperteammemberusersjs)
- [src/lib/helper/userRecordNavigation.js](#srclibhelperuserrecordnavigationjs)
- [src/lib/helper/utils.js](#srclibhelperutilsjs)
- [src/lib/runtime/viewMode.js](#srclibruntimeviewmodejs)
- [src/lib/export/accountPlanExecutiveSummary.js](#srclibexportaccountplanexecutivesummaryjs)
- [src/lib/export/accountPlanPdf.js](#srclibexportaccountplanpdfjs)
- [src/lib/export/accountPlanPdfRenderer.js](#srclibexportaccountplanpdfrendererjs)
- [src/lib/export/accountPlanPpt.js](#srclibexportaccountplanpptjs)
- [src/lib/export/accountPlanPptBarrierGroups.js](#srclibexportaccountplanpptbarriergroupsjs)
- [src/lib/export/accountPlanPptCoverTemplate.js](#srclibexportaccountplanpptcovertemplatejs)
- [src/lib/export/accountPlanPptDelivery.js](#srclibexportaccountplanpptdeliveryjs)
- [src/lib/export/accountPlanPptRenderer.js](#srclibexportaccountplanpptrendererjs)
- [src/lib/export/accountPlanPptSections.js](#srclibexportaccountplanpptsectionsjs)
- [src/lib/mockData/fixtures.js](#srclibmockdatafixturesjs)
- [src/lib/mockData/mockAdapter.js](#srclibmockdatamockadapterjs)
- [src/lib/mockData/mockPersistence.js](#srclibmockdatamockpersistencejs)
- [scripts/export-medical-crm-mapping.mjs](#scriptsexport-medical-crm-mappingmjs)
- [scripts/generate-mock-ppt.mjs](#scriptsgenerate-mock-pptmjs)
- [scripts/postbuild.mjs](#scriptspostbuildmjs)
- [scripts/verify-training-data.mjs](#scriptsverify-training-datamjs)

## src/main.jsx

[Open source](../src/main.jsx)

Local dependencies: [main.css](../src/styles/main.css).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`runtimeSnapshot` — 9](../src/main.jsx#L9) | Captures availability of Q, Veeva utilities, DataService, and packaged runtime scripts. | — |
| [`hasVeevaDataService` — 31](../src/main.jsx#L31) | Checks whether window.ds exposes the current-object method required at startup. | — |
| [`waitForVeevaDataServiceFor` — 36](../src/main.jsx#L36) | Polls the runtime bridge for a bounded period. | `hasVeevaDataService` |
| [`replayRuntimeScript` — 45](../src/main.jsx#L45) | Reloads one packaged runtime script and records whether it loaded or failed. | — |
| [`waitForVeevaDataService` — 65](../src/main.jsx#L65) | Waits for packaged bridge initialization, optionally replays Q/MyInsights scripts, and records final diagnostics. | `hasVeevaDataService`, `runtimeSnapshot`, `waitForVeevaDataServiceFor`, `replayRuntimeScript` |

## src/App.jsx

[Open source](../src/App.jsx)

Local dependencies: [AccountPlanLauncher.jsx](../src/components/AccountPlanLauncher.jsx), [ApprovalHistoryModal.jsx](../src/components/ApprovalHistoryModal.jsx), [ApproveAccountPlanModal.jsx](../src/components/ApproveAccountPlanModal.jsx), [Sidebar.jsx](../src/components/Sidebar.jsx), [ExecutiveSummaryModal.jsx](../src/components/ExecutiveSummaryModal.jsx), [LoadingScreen.jsx](../src/components/LoadingScreen.jsx), [SubmitMpdApprovalConfirmModal.jsx](../src/components/SubmitMpdApprovalConfirmModal.jsx), [index.jsx](../src/pages/Overview/index.jsx), [index.jsx](../src/pages/Stakeholders/index.jsx), [index.jsx](../src/pages/TeamMembers/index.jsx), [index.jsx](../src/pages/CriticalActivities/index.jsx), [index.jsx](../src/pages/BarriersDrivers/index.jsx), [index.jsx](../src/pages/AccountProfile/index.jsx), [client.js](../src/lib/dataservice/client.js), [home.js](../src/lib/dataservice/accountPlan/home.js), [barriersDrivers.js](../src/lib/dataservice/accountPlan/barriersDrivers.js), [criticalActivities.js](../src/lib/dataservice/accountPlan/criticalActivities.js), [accountProfile.js](../src/lib/dataservice/accountPlan/accountProfile.js), [stakeholders.js](../src/lib/dataservice/accountPlan/stakeholders.js), [teamMembers.js](../src/lib/dataservice/accountPlan/teamMembers.js), [shared.js](../src/lib/dataservice/accountPlan/shared.js), [viewMode.js](../src/lib/runtime/viewMode.js), [accountPlanPpt.js](../src/lib/export/accountPlanPpt.js), [accountPlanPdf.js](../src/lib/export/accountPlanPdf.js), [accountPlanExecutiveSummary.js](../src/lib/export/accountPlanExecutiveSummary.js), [approval.js](../src/lib/dataservice/accountPlan/approval.js), [accountPlanReadOnly.js](../src/lib/accountPlanReadOnly.js), [approvalProfileAccess.js](../src/lib/approvalProfileAccess.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`pageDataKey` — 69](../src/App.jsx#L69) | Translates a navigation key to its page-data cache key. | — |
| [`ipadRuntimeDiagnostic` — 73](../src/App.jsx#L73) | Formats bootstrap/runtime availability into a diagnostic string for context errors. | — |
| [`ipadCurrentObjectDiagnostic` — 92](../src/App.jsx#L92) | Formats recorded current-object lookup outcomes for context troubleshooting. | — |
| [`localIsoDate` — 104](../src/App.jsx#L104) | Formats today's local calendar date as YYYY-MM-DD for approval submission. | — |
| [`mergeRecord` — 135](../src/App.jsx#L135) | Replaces a matching row by ID or inserts the new row at the front. | — |
| [`getRuntimeViewSnapshot` — 142](../src/App.jsx#L142) | Reads runtime/layout detection and falls back to an unknown iPad snapshot if detection throws. | `detectRuntimeViewMode` |
| [`hasShellContext` — 150](../src/App.jsx#L150) | Checks whether a page payload contains plan/account context for the persistent shell. | — |
| [`resolveShellSource` — 158](../src/App.jsx#L158) | Chooses Home or another loaded page payload to supply plan/account information to the sidebar. | — |
| [`isMissingAccountPlanContextError` — 161](../src/App.jsx#L161) | Recognizes the missing-plan-context error so App can show specific recovery guidance. | — |
| [`isLocalMrdApprovalDemo` — 164](../src/App.jsx#L164) | Checks the local-preview reviewer=mrd query parameter used by the demo recovery effect. | — |
| [`App` — 169](../src/App.jsx#L169) | Renders the application shell and coordinates navigation, page caches, approvals, exports, notifications, and runtime changes. | `getRuntimeViewSnapshot`, `pageDataKey`, `resolveShellSource`, `isMpdApprovalRestrictedProfile`, `isAccountPlanApprovalPending`, `canProfileApproveAccountPlan`; more in source |
| [`updateCachedPageData` — 296](../src/App.jsx#L296) | Merges a replacement/update into one page payload in App's cache. | — |
| [`syncCriticalActivityAcrossCaches` — 307](../src/App.jsx#L307) | Merges a saved tactic or removes a deleted tactic in Home, parent-page, and tactic-page caches. | `mergeRecord` |
| [`syncTeamMemberAcrossCaches` — 335](../src/App.jsx#L335) | Merges and re-sorts a saved member in Home and Team Members caches. | `sortTeamMembersByParticipation` |
| [`removeTeamMemberAcrossCaches` — 357](../src/App.jsx#L357) | Removes a membership from the Home and Team Members caches. | `sortTeamMembersByParticipation` |
| [`clearCriticalActivityEditTarget` — 377](../src/App.jsx#L377) | Clears a pending cross-page tactic edit request. | — |
| [`resetAccountPlanWorkspace` — 383](../src/App.jsx#L383) | Clears cached pages, in-flight tracking, pending edits, approval snapshot, and prepared exports before switching plans. | `clearCriticalActivityEditTarget` |
| [`handleSelectLauncherPlan` — 403](../src/App.jsx#L403) | Sets the chosen plan context, resets the workspace, and starts Home loading. | `setCurrentAccountPlanIdOverride`, `resetAccountPlanWorkspace` |
| [`navigateToPage` — 411](../src/App.jsx#L411) | Chooses the requested page; App clears pending tactic navigation while Sidebar also handles menu/tap state. | `clearCriticalActivityEditTarget` |
| [`navigateToBarriersDrivers` — 416](../src/App.jsx#L416) | Opens Barriers & Opportunities on the Barrier or Opportunity tab selected from Home. | `clearCriticalActivityEditTarget` |
| [`navigateToCriticalActivity` — 423](../src/App.jsx#L423) | Records the tactic target and request counter so App can load/navigate and open the corresponding edit form. | — |
| [`clearAppNotice` — 438](../src/App.jsx#L438) | Cancels the notice timer and removes the current application toast. | — |
| [`loadPage` — 446](../src/App.jsx#L446) | Runs the registered loader, shares in-flight work, caches successful data, and retains cached content on background refresh failure. | `pageDataKey` |
| [`refreshApprovalStatus` — 499](../src/App.jsx#L499) | Fetches a small authoritative plan status snapshot while coalescing/throttling overlapping checks. | `fetchPlanApprovalStatus` |
| [`refreshLoadedPages` — 543](../src/App.jsx#L543) | Starts forced background reloads of already-loaded page payloads. | `loadPage` |
| [`showAppNotice` — 557](../src/App.jsx#L557) | Shows a temporary notification and optionally requests background page refresh. | `refreshLoadedPages` |
| [`handleSubmitMpdApproval` — 580](../src/App.jsx#L580) | Checks submission eligibility and opens the FD submission confirmation dialog. | — |
| [`handleCancelMpdApprovalConfirmation` — 587](../src/App.jsx#L587) | Closes the FD submission confirmation dialog. | — |
| [`handleConfirmMpdApproval` — 591](../src/App.jsx#L591) | Gets submitter/date, submits through the approval service, updates shell status, and refreshes cached data. | `showAppNotice`, `localIsoDate`, `getCurrentUserName`, `submitMpdApproval`, `refreshApprovalStatus` |
| [`handleOpenApproveAccountPlan` — 646](../src/App.jsx#L646) | Opens the approve dialog only when the current profile/status allow approval. | — |
| [`handleCloseApproveAccountPlan` — 652](../src/App.jsx#L652) | Dismisses the approve dialog unless a write is still running. | — |
| [`handleApproveAccountPlan` — 658](../src/App.jsx#L658) | Writes Approved through the service, updates local status, and requests a refresh. | `approveAccountPlan`, `showAppNotice`, `refreshApprovalStatus` |
| [`loadApprovalHistory` — 685](../src/App.jsx#L685) | Loads history entries and manages its loading/error state. | `fetchAccountPlanApprovalHistory` |
| [`handleOpenApprovalHistory` — 700](../src/App.jsx#L700) | Opens the history modal and starts loading its records. | `loadApprovalHistory` |
| [`handleOpenExecutiveSummary` — 706](../src/App.jsx#L706) | Assembles an executive summary and opens its modal; this handler currently has no visible Sidebar trigger. | `loadAccountPlanPptData`, `buildAccountPlanExecutiveSummary` |
| [`handleCloseExecutiveSummary` — 727](../src/App.jsx#L727) | Closes the executive summary and invalidates its outstanding request marker. | — |
| [`handleSaveExecutiveSummaryPdf` — 732](../src/App.jsx#L732) | Invokes PDF export from the executive-summary save action. | `handleExportPdf` |
| [`showExportResult` — 736](../src/App.jsx#L736) | Turns an export delivery result into UI state and retains any manual-open URL. | — |
| [`preparePptExport` — 746](../src/App.jsx#L746) | Prepares and caches an export Blob, tracking busy/error state and ignoring stale preparation requests. | `prepareAccountPlanPpt` |
| [`preparePdfExport` — 769](../src/App.jsx#L769) | Prepares and caches an export Blob, tracking busy/error state and ignoring stale preparation requests. | `prepareAccountPlanPdf` |
| [`deliverPreparedPptFromTap` — 792](../src/App.jsx#L792) | Delivers an already-prepared file from a user action and updates result/error state. | `deliverPreparedAccountPlanPpt`, `showExportResult` |
| [`deliverPreparedPdfFromTap` — 815](../src/App.jsx#L815) | Delivers an already-prepared file from a user action and updates result/error state. | `deliverPreparedAccountPlanPdf`, `showExportResult` |
| [`handleExportPpt` — 838](../src/App.jsx#L838) | Coordinates preparation and delivery, handles repeat taps, and reports export failures. | `deliverPreparedPptFromTap`, `preparePptExport` |
| [`handleExportPdf` — 870](../src/App.jsx#L870) | Coordinates preparation and delivery, handles repeat taps, and reports export failures. | `deliverPreparedPdfFromTap`, `preparePdfExport` |
| [`handlePrepareExportMenuOpen` — 902](../src/App.jsx#L902) | Starts export preparation as the action menu opens so the final tap can deliver a ready file. | `preparePptExport`, `preparePdfExport` |
| [`clearExportNotice` — 915](../src/App.jsx#L915) | Clears export notices and releases any retained object URL. | — |
| [`handleResume` — 966](../src/App.jsx#L966) | Refreshes approval and cached pages when the browser/app resumes, with visibility and throttle checks. | `refreshApprovalStatus`, `refreshLoadedPages` |
| [`updateModalState` — 1002](../src/App.jsx#L1002) | Detects modal overlays in the DOM and updates shell modal state. | — |
| [`updateRuntimeView` — 1016](../src/App.jsx#L1016) | Refreshes device/layout detection after resize/orientation changes and enables plan loading outside desktop launcher mode. | `getRuntimeViewSnapshot` |
| [`prepareExports` — 1057](../src/App.jsx#L1057) | Schedules PPT/PDF preparation for the current page-data snapshot and rejects stale results. | `prepareAccountPlanPpt`, `prepareAccountPlanPdf` |
| [`preloadPages` — 1195](../src/App.jsx#L1195) | Loads remaining uncached navigation payloads after Home is ready. | `pageDataKey`, `loadPage` |

## src/components/AccountPlanLauncher.jsx

[Open source](../src/components/AccountPlanLauncher.jsx)

Local dependencies: [KiteAccountPlanLoader.jsx](../src/components/KiteAccountPlanLoader.jsx), [accountPlanLauncher.js](../src/lib/dataservice/accountPlan/accountPlanLauncher.js), [tableSort.js](../src/lib/helper/tableSort.js), [utils.js](../src/lib/helper/utils.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`launcherSortValue` — 23](../src/components/AccountPlanLauncher.jsx#L23) | Selects and normalizes the requested column's value for sorting the owning table. | `toDateSortValue` |
| [`renderLauncherCellValue` — 29](../src/components/AccountPlanLauncher.jsx#L29) | Formats a launcher column value for the visible table. | `formatDate` |
| [`LauncherSortButton` — 36](../src/components/AccountPlanLauncher.jsx#L36) | Renders the launcher's sort control and direction state. | — |
| [`AccountPlanLauncher` — 59](../src/components/AccountPlanLauncher.jsx#L59) | Loads, filters, sorts, and renders desktop Account Plan selection and invokes onSelectPlan. | `fetchCurrentUserAccountPlans`, `loadRows`, `stableSortRows`, `nextTableSort`, `KiteAccountPlanLoader`, `LauncherSortButton`; more in source |
| [`loadRows` — 68](../src/components/AccountPlanLauncher.jsx#L68) | Loads launcher rows and tracks loading/error state for retry/refresh. | `fetchCurrentUserAccountPlans` |
| [`handleSort` — 132](../src/components/AccountPlanLauncher.jsx#L132) | Updates sort-column/direction state for the owning table; it does not mutate CRM records. | `nextTableSort` |

## src/components/Sidebar.jsx

[Open source](../src/components/Sidebar.jsx)

Local dependencies: [EditModalField.jsx](../src/components/EditModalField.jsx), [HomeFieldHelp.jsx](../src/components/HomeFieldHelp.jsx), [utils.js](../src/lib/helper/utils.js), [accountPlanReadOnly.js](../src/lib/accountPlanReadOnly.js), [accountPlanPdf.js](../src/lib/export/accountPlanPdf.js), [accountPlanPdfRenderer.js](../src/lib/export/accountPlanPdfRenderer.js), [PdfAllPagesViewer.jsx](../src/components/PdfAllPagesViewer.jsx), [edit-modal.css](../src/styles/edit-modal.css), [Sidebar.css](../src/components/Sidebar.css).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`CalendarIcon` — 50](../src/components/Sidebar.jsx#L50) | Renders the corresponding small UI icon; no data fetching or persistence. | — |
| [`GlobeIcon` — 60](../src/components/Sidebar.jsx#L60) | Renders the corresponding small UI icon; no data fetching or persistence. | — |
| [`NavIcon` — 70](../src/components/Sidebar.jsx#L70) | Renders the corresponding small UI icon; no data fetching or persistence. | — |
| [`loadPdfBlob` — 137](../src/components/Sidebar.jsx#L137) | Fetches a bundled PDF resource as a Blob for viewing/saving. | — |
| [`UserGuidePdfModal` — 150](../src/components/Sidebar.jsx#L150) | Renders the corresponding bundled guide PDF in a modal with a download/share save action. | `loadPdfBlob`, `deliverPreparedAccountPlanPdf`, `PdfAllPagesViewer` |
| [`onKey` — 155](../src/components/Sidebar.jsx#L155) | Handles keyboard behavior for the owning modal/control, especially Escape without interfering with field controls. | — |
| [`handleSavePdf` — 165](../src/components/Sidebar.jsx#L165) | Delivers the bundled guide PDF using supported browser sharing/download behavior. | `loadPdfBlob`, `deliverPreparedAccountPlanPdf` |
| [`ComplianceGuidanceModal` — 231](../src/components/Sidebar.jsx#L231) | Renders the corresponding bundled guide PDF in a modal with a download/share save action. | `loadPdfBlob`, `deliverPreparedAccountPlanPdf`, `PdfAllPagesViewer` |
| [`onKey` — 236](../src/components/Sidebar.jsx#L236) | Handles keyboard behavior for the owning modal/control, especially Escape without interfering with field controls. | — |
| [`handleSavePdf` — 246](../src/components/Sidebar.jsx#L246) | Delivers the bundled guide PDF using supported browser sharing/download behavior. | `loadPdfBlob`, `deliverPreparedAccountPlanPdf` |
| [`Sidebar` — 312](../src/components/Sidebar.jsx#L312) | Renders plan/account context, navigation, help PDFs, export/submission menu, and profile/status-controlled approval actions. | `isSubmittedForApprovalStatus`, `formatDate`, `navigateToPage`, `CalendarIcon`, `HomeFieldHelp`, `GlobeIcon`; more in source |
| [`onDocPointer` — 355](../src/components/Sidebar.jsx#L355) | Dismisses the owning Sidebar menu when a pointer event occurs outside its element. | — |
| [`onDocPointer` — 366](../src/components/Sidebar.jsx#L366) | Dismisses the owning Sidebar menu when a pointer event occurs outside its element. | — |
| [`handleExportOption` — 390](../src/components/Sidebar.jsx#L390) | Dispatches the selected visible menu action to its App callback. | — |
| [`togglePolicyHelp` — 410](../src/components/Sidebar.jsx#L410) | Toggles compliance/help guidance and closes the export menu. | — |
| [`navigateToPage` — 415](../src/components/Sidebar.jsx#L415) | Chooses the requested page; App clears pending tactic navigation while Sidebar also handles menu/tap state. | — |
| [`choosePage` — 431](../src/components/Sidebar.jsx#L431) | Delegates a navigation click to Sidebar's duplicate-event-aware navigation function. | `navigateToPage` |
| [`handleNavPointerDown` — 435](../src/components/Sidebar.jsx#L435) | Starts a navigation press, records its pointer/coordinates, and preloads the target page. | — |
| [`handleNavPointerUp` — 446](../src/components/Sidebar.jsx#L446) | Treats a matching press with limited movement as a navigation tap. | `navigateToPage` |
| [`handleNavPointerCancel` — 455](../src/components/Sidebar.jsx#L455) | Clears a cancelled navigation pointer press. | — |

## src/pages/Overview/AccountStrip.jsx

[Open source](../src/pages/Overview/AccountStrip.jsx)

Local dependencies: [HomeFieldHelp.jsx](../src/components/HomeFieldHelp.jsx).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`buildHeaderCards` — 4](../src/pages/Overview/AccountStrip.jsx#L4) | Builds the two Home header-card label/value definitions. | — |
| [`AccountStrip` — 13](../src/pages/Overview/AccountStrip.jsx#L13) | Renders MM ATC Priority and ATC Cohort header cards from the Home payload. | `buildHeaderCards`, `HomeFieldHelp` |

## src/pages/Overview/BarriersDriversSummary.jsx

[Open source](../src/pages/Overview/BarriersDriversSummary.jsx)

Local dependencies: [HomeFieldHelp.jsx](../src/components/HomeFieldHelp.jsx), [utils.js](../src/lib/helper/utils.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`homeSummaryColumns` — 8](../src/pages/Overview/BarriersDriversSummary.jsx#L8) | Builds the column definitions for Home's parent summary table. | — |
| [`toneClass` — 15](../src/pages/Overview/BarriersDriversSummary.jsx#L15) | Maps a display tone to the summary's CSS class. | — |
| [`SummaryTable` — 17](../src/pages/Overview/BarriersDriversSummary.jsx#L17) | Renders one parent summary, count labels, and callbacks into parent/tactic detail. | `homeSummaryColumns`, `HomeFieldHelp`, `truncateDisplay`, `toneClass`, `statusTone` |
| [`BarriersDriversSummary` — 84](../src/pages/Overview/BarriersDriversSummary.jsx#L84) | Renders Home's separate Barrier and Opportunity summary tables. | `SummaryTable` |

## src/pages/Overview/HomeBarrierDriverMedicalTactics.jsx

[Open source](../src/pages/Overview/HomeBarrierDriverMedicalTactics.jsx)

Local dependencies: [utils.js](../src/lib/helper/utils.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`isHomeModalTacticOpen` — 18](../src/pages/Overview/HomeBarrierDriverMedicalTactics.jsx#L18) | Determines whether a linked tactic belongs in the Home modal's open-tactic filter. | `activityIsOpen` |
| [`tacticsForHomeModalFilter` — 22](../src/pages/Overview/HomeBarrierDriverMedicalTactics.jsx#L22) | Selects linked tactics matching the chosen Home modal filter. | `isHomeModalTacticOpen` |
| [`tacticPriorityMeta` — 28](../src/pages/Overview/HomeBarrierDriverMedicalTactics.jsx#L28) | Builds due-date/overdue display information for a linked tactic. | `isHomeModalTacticOpen`, `daysFromNow` |
| [`medicalRecordLabel` — 46](../src/pages/Overview/HomeBarrierDriverMedicalTactics.jsx#L46) | Formats the selected parent's Barrier/Opportunity label. | — |
| [`TacticMeta` — 48](../src/pages/Overview/HomeBarrierDriverMedicalTactics.jsx#L48) | Renders one linked tactic's status/accountable/due-date metadata. | — |
| [`HomeBarrierDriverMedicalTactics` — 55](../src/pages/Overview/HomeBarrierDriverMedicalTactics.jsx#L55) | Renders the selected parent's linked tactic list inside the Home modal, with filtering and expansion. | `isHomeModalTacticOpen`, `tacticsForHomeModalFilter`, `medicalRecordLabel`, `selectTacticFilter`, `tacticPriorityMeta`, `toggleTactic`; more in source |
| [`toggleTactic` — 71](../src/pages/Overview/HomeBarrierDriverMedicalTactics.jsx#L71) | Expands or collapses one linked tactic's details. | — |
| [`selectTacticFilter` — 75](../src/pages/Overview/HomeBarrierDriverMedicalTactics.jsx#L75) | Changes the Home modal tactic filter and resets expansion state as implemented. | `tacticsForHomeModalFilter` |

## src/pages/Overview/KiteStrategy.jsx

[Open source](../src/pages/Overview/KiteStrategy.jsx)

Local dependencies: [HomeFieldHelp.jsx](../src/components/HomeFieldHelp.jsx).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`splitStrategy` — 3](../src/pages/Overview/KiteStrategy.jsx#L3) | Separates a numbered strategy label into its display prefix/text. | — |
| [`groupStrategies` — 12](../src/pages/Overview/KiteStrategy.jsx#L12) | Groups/deduplicates strategy display entries before rendering columns. | `splitStrategy` |
| [`StrategyColumns` — 35](../src/pages/Overview/KiteStrategy.jsx#L35) | Renders grouped strategy entries as columns. | `groupStrategies` |
| [`KiteStrategy` — 56](../src/pages/Overview/KiteStrategy.jsx#L56) | Renders DLBCL/Portfolio and MM strategy summaries derived from open parent records. | `HomeFieldHelp`, `StrategyColumns` |

## src/pages/Overview/PodUsers.jsx

[Open source](../src/pages/Overview/PodUsers.jsx)

Local dependencies: [HomeFieldHelp.jsx](../src/components/HomeFieldHelp.jsx), [utils.js](../src/lib/helper/utils.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`podParticipationClass` — 10](../src/pages/Overview/PodUsers.jsx#L10) | Chooses the visual class for a member's participation category. | — |
| [`PodUsers` — 18](../src/pages/Overview/PodUsers.jsx#L18) | Renders plan membership and participation in the Home panel. | `HomeFieldHelp`, `formatCountLabel`, `podParticipationClass` |

## src/pages/Overview/UrgentActivities.jsx

[Open source](../src/pages/Overview/UrgentActivities.jsx)

Local dependencies: [HomeFieldHelp.jsx](../src/components/HomeFieldHelp.jsx), [utils.js](../src/lib/helper/utils.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`UrgentActivities` — 14](../src/pages/Overview/UrgentActivities.jsx#L14) | Renders the urgent/due-date tactic list and opens the selected tactic through its callback. | `HomeFieldHelp`, `formatCountLabel`, `activityParentName`, `activityDueTone`, `activityDueLabel`, `activityDueDetail` |

## src/pages/Overview/index.jsx

[Open source](../src/pages/Overview/index.jsx)

Local dependencies: [titlePicklistMappings.js](../src/lib/dataservice/accountPlan/titlePicklistMappings.js), [utils.js](../src/lib/helper/utils.js), [teamMemberUsers.js](../src/lib/helper/teamMemberUsers.js), [home.js](../src/lib/dataservice/accountPlan/home.js), [errorMessages.js](../src/lib/dataservice/accountPlan/errorMessages.js), [shared.js](../src/lib/dataservice/accountPlan/shared.js), [edit-modal.css](../src/styles/edit-modal.css), [Overview.css](../src/pages/Overview/Overview.css), [AccountStrip.jsx](../src/pages/Overview/AccountStrip.jsx), [KiteStrategy.jsx](../src/pages/Overview/KiteStrategy.jsx), [BarriersDriversSummary.jsx](../src/pages/Overview/BarriersDriversSummary.jsx), [HomeBarrierDriverMedicalTactics.jsx](../src/pages/Overview/HomeBarrierDriverMedicalTactics.jsx), [UrgentActivities.jsx](../src/pages/Overview/UrgentActivities.jsx), [PodUsers.jsx](../src/pages/Overview/PodUsers.jsx), [BarrierDriverEditModal.jsx](../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx), [CriticalActivityEditModal.jsx](../src/pages/CriticalActivities/CriticalActivityEditModal.jsx), [linkedBarrierDriverOptions.js](../src/pages/CriticalActivities/linkedBarrierDriverOptions.js), [LinkedBarrierDriverStatusPrompt.jsx](../src/pages/CriticalActivities/LinkedBarrierDriverStatusPrompt.jsx), [TeamMemberEditModal.jsx](../src/pages/TeamMembers/TeamMemberEditModal.jsx).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`recordValue` — 55](../src/pages/Overview/index.jsx#L55) | Unwraps one value cell for UI result handling. | — |
| [`newLocalId` — 58](../src/pages/Overview/index.jsx#L58) | Builds a temporary display ID when a write response supplies no persisted ID. | `recordValue` |
| [`createdId` — 61](../src/pages/Overview/index.jsx#L61) | Extracts the created record ID, with a local display-ID fallback in the owning page. | `createdRecordIdFromWriteResult`, `newLocalId` |
| [`todayIsoDate` — 67](../src/pages/Overview/index.jsx#L67) | Produces today's UTC ISO date portion for immediate UI completion-date defaults. | — |
| [`storedActivityStatus` — 69](../src/pages/Overview/index.jsx#L69) | Converts the displayed Completed label to stored Complete and applies the planned-status default. | — |
| [`isDeactivateChecked` — 71](../src/pages/Overview/index.jsx#L71) | Normalizes the boolean-like forms accepted by this helper's caller. | — |
| [`normalizedBarrierDriverType` — 74](../src/pages/Overview/index.jsx#L74) | Normalizes the parent type to internal Driver or Barrier. | — |
| [`barrierDriverTypeLabel` — 76](../src/pages/Overview/index.jsx#L76) | Converts the internal parent type into user-facing lowercase Barrier/Opportunity wording. | `normalizedBarrierDriverType` |
| [`isClosedBarrierDriverStatus` — 78](../src/pages/Overview/index.jsx#L78) | Recognizes closed parent status variants supported by this module. | — |
| [`closeBlockedByActivitiesMessage` — 83](../src/pages/Overview/index.jsx#L83) | Explains that linked open tactics must close before the parent can close. | `barrierDriverTypeLabel` |
| [`applyActivityForm` — 92](../src/pages/Overview/index.jsx#L92) | Builds the immediate UI tactic model after a successful form write, translating labels/status and parent details. | `storedActivityStatus`, `medicalPicklistLabel`, `todayIsoDate`, `isDeactivateChecked` |
| [`applyActivityDeactivate` — 129](../src/pages/Overview/index.jsx#L129) | Builds a locally deactivated tactic model; retained helper, not a CRM write. | — |
| [`strategyLabelForValue` — 139](../src/pages/Overview/index.jsx#L139) | Resolves the selected strategy's display label with a fallback. | `medicalPicklistLabel` |
| [`applyBarrierDriverForm` — 144](../src/pages/Overview/index.jsx#L144) | Builds the immediate UI parent model from saved form values and metadata labels. | `barrierDriverUsesStrategy`, `medicalPicklistLabel`, `strategyLabelForValue`, `categoryPrefix` |
| [`applyTeamMemberForm` — 165](../src/pages/Overview/index.jsx#L165) | Merges saved member/form values into Home's immediate membership model. | — |
| [`Overview` — 174](../src/pages/Overview/index.jsx#L174) | Renders Home and coordinates inline parent, tactic, and membership editing with App cache callbacks. | `sortTeamMembersByParticipation`, `criticalActivityClosedParentEditReason`, `homeUrgentActivities`, `closedParentEditReason`, `homeSummaryTables`, `buildOpenActivityCountByBarrier`; more in source |
| [`closedParentEditReason` — 242](../src/pages/Overview/index.jsx#L242) | Returns the instruction to reopen a closed parent before editing its tactic. | `criticalActivityClosedParentEditReason` |
| [`searchAvailableTeamUsers` — 296](../src/pages/Overview/index.jsx#L296) | Searches Users with existing membership exclusions and filters duplicate User choices. | `searchTeamUsers`, `filterExistingTeamMemberUsers` |
| [`openEditBarrierDriver` — 304](../src/pages/Overview/index.jsx#L304) | Selects an editable parent for the shared editor and clears its previous error. | — |
| [`closeBdModal` — 310](../src/pages/Overview/index.jsx#L310) | Dismisses the parent editor unless a save is running. | — |
| [`persistBarrierDriverInState` — 316](../src/pages/Overview/index.jsx#L316) | Merges a saved parent into the correct Home type array and App Home cache. | `mergeRecord` |
| [`handleSaveBarrierDriver` — 342](../src/pages/Overview/index.jsx#L342) | Validates closure/edit rules and saves a parent; on the detail page, creation also sequentially creates the required first linked tactic. | `isClosedBarrierDriverStatus`, `closeBlockedByActivitiesMessage`, `saveBarrierDriverStatus`, `persistBarrierDriverInState`, `normalizeBarrierDriverStatusForDisplay`, `saveBarrierDriver`; more in source |
| [`updateLinkedIndication` — 370](../src/pages/Overview/index.jsx#L370) | Mirrors a saved parent's indication onto a matching linked tactic in local state. | `recordIdMatches` |
| [`openEditActivity` — 402](../src/pages/Overview/index.jsx#L402) | Selects an editable tactic and opens its edit modal, respecting page/legacy guards. | — |
| [`openActivityFromBarrierDriverModal` — 409](../src/pages/Overview/index.jsx#L409) | Closes the Home parent editor and opens its selected linked tactic editor. | `openEditActivity` |
| [`closeActivityModal` — 414](../src/pages/Overview/index.jsx#L414) | Dismisses the tactic editor and clears its error unless a save is running. | — |
| [`handleSaveActivity` — 420](../src/pages/Overview/index.jsx#L420) | Persists a tactic draft, merges the updated UI record, reports cache changes, and offers a parent-status prompt on completion. | `saveCriticalActivity`, `applyActivityForm`, `buildLinkedBarrierDriverStatusPrompt`, `addCriticalActivity`, `createdId`, `formatCriticalActivitySaveError` |
| [`handleDeleteActivity` — 492](../src/pages/Overview/index.jsx#L492) | Soft-deletes the selected tactic, removes it from local lists, and reports deletion to App. | `deleteCriticalActivity` |
| [`handleDismissBarrierDriverStatusPrompt` — 519](../src/pages/Overview/index.jsx#L519) | Dismisses the parent-status selector and clears its draft/error unless its save is running. | — |
| [`handleDismissBarrierDriverStatusConfirm` — 526](../src/pages/Overview/index.jsx#L526) | Dismisses the initial offer to update the linked parent's status. | — |
| [`handleOpenBarrierDriverStatusPrompt` — 532](../src/pages/Overview/index.jsx#L532) | Moves from the completion confirmation to the parent-status selector and initializes the status draft. | — |
| [`handleBarrierDriverStatusPromptChange` — 542](../src/pages/Overview/index.jsx#L542) | Updates the proposed parent status and clears validation feedback. | — |
| [`handleSaveBarrierDriverStatusPrompt` — 547](../src/pages/Overview/index.jsx#L547) | Prevents closure with remaining open tactics, writes the parent status, and updates local state/refresh notices. | `normalizeBarrierDriverStatusForDisplay`, `isClosedBarrierDriverStatus`, `linkedBarrierDriverCloseBlockedMessage`, `saveBarrierDriverStatus` |
| [`applyStatus` — 561](../src/pages/Overview/index.jsx#L561) | Overlays the newly saved status onto the matching parent in a local array. | — |
| [`openEditMember` — 594](../src/pages/Overview/index.jsx#L594) | Selects an existing member for editing. | — |
| [`closeMemberModal` — 598](../src/pages/Overview/index.jsx#L598) | Clears the selected Home member/editor state. | — |
| [`handleSaveMember` — 599](../src/pages/Overview/index.jsx#L599) | Checks duplicate Users, creates/updates membership, updates local/shared caches, and reports success or failure. | `hasDuplicateTeamMemberUser`, `updateTeamMember`, `applyTeamMemberForm`, `sortTeamMembersByParticipation` |
| [`handleDeleteMember` — 634](../src/pages/Overview/index.jsx#L634) | Soft-deletes membership and removes it from local/shared caches. | `deleteTeamMember` |
| [`mergeRecord` — 745](../src/pages/Overview/index.jsx#L745) | Replaces a matching row by ID or inserts the new row at the front. | — |

## src/pages/BarriersDrivers/BarrierDriverEditModal.jsx

[Open source](../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx)

Local dependencies: [shared.js](../src/lib/dataservice/accountPlan/shared.js), [dependentPicklists.js](../src/lib/dataservice/accountPlan/dependentPicklists.js), [EditModalField.jsx](../src/components/EditModalField.jsx), [barrierDriverModalOptions.js](../src/pages/BarriersDrivers/barrierDriverModalOptions.js), [medicalTerminology.js](../src/lib/medicalTerminology.js), [criticalActivityHelp.js](../src/pages/CriticalActivities/criticalActivityHelp.js), [titlePicklistMappings.js](../src/lib/dataservice/accountPlan/titlePicklistMappings.js), [modalDismiss.js](../src/lib/helper/modalDismiss.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`buildInitialForm` — 36](../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx#L36) | Constructs the owning modal's initial editable draft from the selected record/defaults; fields differ by modal. | `barrierDriverUsesStrategy` |
| [`buildInitialTacticForm` — 48](../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx#L48) | Builds defaults for the required first tactic inside the new-parent modal. | — |
| [`firstOptionList` — 56](../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx#L56) | Returns the first nonempty candidate option array. | — |
| [`strategyLabelForValue` — 58](../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx#L58) | Resolves the selected strategy's display label with a fallback. | `labelForPicklistValue` |
| [`BarrierDriverEditModal` — 63](../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx#L63) | Renders the parent create/edit form, dependent choices, legacy/status-only mode, and required first tactic on creation. | `isClosedBarrierDriverStatus`, `buildInitialForm`, `buildInitialTacticForm`, `escapeBelongsToFieldControl`, `barrierDriverUsesStrategy`, `optionsForControllerValue`; more in source |
| [`onKey` — 96](../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx#L96) | Handles keyboard behavior for the owning modal/control, especially Escape without interfering with field controls. | `escapeBelongsToFieldControl` |
| [`updateField` — 184](../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx#L184) | Updates a modal draft field and applies that form's dependent-field resets. | — |
| [`updateTacticField` — 205](../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx#L205) | Updates the draft for the required linked tactic inside the parent creation modal. | — |
| [`handleSubmit` — 210](../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx#L210) | Validates the owning modal's draft and invokes its save callback; the page/service performs persistence. | `isBarrierDriverIndicationAllowedForType` |

## src/pages/BarriersDrivers/barrierDriverModalOptions.js

[Open source](../src/pages/BarriersDrivers/barrierDriverModalOptions.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`optionsWithTransientValue` — 1](../src/pages/BarriersDrivers/barrierDriverModalOptions.js#L1) | Adds the current value temporarily when needed so a select can display an existing selection. | — |

## src/pages/BarriersDrivers/index.jsx

[Open source](../src/pages/BarriersDrivers/index.jsx)

Local dependencies: [titlePicklistMappings.js](../src/lib/dataservice/accountPlan/titlePicklistMappings.js), [utils.js](../src/lib/helper/utils.js), [barriersDrivers.js](../src/lib/dataservice/accountPlan/barriersDrivers.js), [dependentPicklists.js](../src/lib/dataservice/accountPlan/dependentPicklists.js), [errorMessages.js](../src/lib/dataservice/accountPlan/errorMessages.js), [medicalTerminology.js](../src/lib/medicalTerminology.js), [shared.js](../src/lib/dataservice/accountPlan/shared.js), [BarrierDriverEditModal.jsx](../src/pages/BarriersDrivers/BarrierDriverEditModal.jsx), [CriticalActivityEditModal.jsx](../src/pages/CriticalActivities/CriticalActivityEditModal.jsx), [CriticalActivityNewModal.jsx](../src/pages/CriticalActivities/CriticalActivityNewModal.jsx), [linkedBarrierDriverOptions.js](../src/pages/CriticalActivities/linkedBarrierDriverOptions.js), [LinkedBarrierDriverStatusPrompt.jsx](../src/pages/CriticalActivities/LinkedBarrierDriverStatusPrompt.jsx), [edit-modal.css](../src/styles/edit-modal.css), [BarriersDrivers.css](../src/pages/BarriersDrivers/BarriersDrivers.css).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`recordValue` — 72](../src/pages/BarriersDrivers/index.jsx#L72) | Unwraps one value cell for UI result handling. | — |
| [`createdRecordId` — 75](../src/pages/BarriersDrivers/index.jsx#L75) | Extracts the created record ID, with a local display-ID fallback in the owning page. | `createdRecordIdFromWriteResult` |
| [`todayIsoDate` — 78](../src/pages/BarriersDrivers/index.jsx#L78) | Produces today's UTC ISO date portion for immediate UI completion-date defaults. | — |
| [`storedStatusFromForm` — 80](../src/pages/BarriersDrivers/index.jsx#L80) | Converts the displayed Completed label to stored Complete and applies the planned-status default. | — |
| [`isDeactivateChecked` — 81](../src/pages/BarriersDrivers/index.jsx#L81) | Normalizes the boolean-like forms accepted by this helper's caller. | — |
| [`normalizedBarrierDriverType` — 84](../src/pages/BarriersDrivers/index.jsx#L84) | Normalizes the parent type to internal Driver or Barrier. | — |
| [`barrierDriverTypeLabel` — 86](../src/pages/BarriersDrivers/index.jsx#L86) | Converts the internal parent type into user-facing lowercase Barrier/Opportunity wording. | `medicalRecordTypeLabelLower`, `normalizedBarrierDriverType` |
| [`closeBlockedByActivitiesMessage` — 88](../src/pages/BarriersDrivers/index.jsx#L88) | Explains that linked open tactics must close before the parent can close. | `barrierDriverTypeLabel` |
| [`isOpenBarrierDriverRecord` — 95](../src/pages/BarriersDrivers/index.jsx#L95) | Tests whether a parent record has an open lifecycle status. | `isOpenBarrierDriverStatus` |
| [`barrierDriverStatusTone` — 98](../src/pages/BarriersDrivers/index.jsx#L98) | Maps parent status to its CSS display tone. | `isClosedBarrierDriverStatus` |
| [`recordMatchesStatus` — 101](../src/pages/BarriersDrivers/index.jsx#L101) | Checks one parent against the corresponding selected page filter. | `normalizeBarrierDriverStatusForDisplay`, `isOpenBarrierDriverStatus` |
| [`sortRecordsByLifecycleStatus` — 108](../src/pages/BarriersDrivers/index.jsx#L108) | Orders parent records according to lifecycle/status filtering behavior. | `barrierDriverStatusRank` |
| [`recordMatchesIndication` — 119](../src/pages/BarriersDrivers/index.jsx#L119) | Checks one parent against the corresponding selected page filter. | — |
| [`recordMatchesStrategy` — 122](../src/pages/BarriersDrivers/index.jsx#L122) | Checks one parent against the corresponding selected page filter. | — |
| [`recordMatchesType` — 125](../src/pages/BarriersDrivers/index.jsx#L125) | Checks one parent against the corresponding selected page filter. | — |
| [`recordActivitySummary` — 132](../src/pages/BarriersDrivers/index.jsx#L132) | Builds the linked open-tactic count/summary for a parent. | — |
| [`parseSortDate` — 149](../src/pages/BarriersDrivers/index.jsx#L149) | Converts a sortable date to its timestamp, preserving a blank/invalid sentinel. | — |
| [`sortValue` — 155](../src/pages/BarriersDrivers/index.jsx#L155) | Selects and normalizes the requested column's value for sorting the owning table. | `activityStatusLabel`, `parseSortDate` |
| [`appendUniqueOptions` — 178](../src/pages/BarriersDrivers/index.jsx#L178) | Adds new nonempty option values while preventing duplicates. | — |
| [`fallbackStrategiesForIndication` — 188](../src/pages/BarriersDrivers/index.jsx#L188) | Selects the indication-specific strategy list when building filter options. | — |
| [`strategyOptionsForFilter` — 195](../src/pages/BarriersDrivers/index.jsx#L195) | Builds strategy filter choices for the current parent tab and indication. | `filterBarrierDriverIndicationsForType`, `barrierDriverUsesStrategy`, `appendUniqueOptions`, `optionsForControllerValue`, `fallbackStrategiesForIndication` |
| [`compareSortValues` — 216](../src/pages/BarriersDrivers/index.jsx#L216) | Compares numeric/text values in the selected direction while placing empty values consistently. | — |
| [`sortedActivities` — 229](../src/pages/BarriersDrivers/index.jsx#L229) | Returns rows ordered by the selected column/direction, preserving original order for equal values. | `compareSortValues`, `sortValue` |
| [`applyActivityForm` — 240](../src/pages/BarriersDrivers/index.jsx#L240) | Builds the immediate UI tactic model after a successful form write, translating labels/status and parent details. | `storedStatusFromForm`, `medicalPicklistLabel`, `todayIsoDate`, `isDeactivateChecked` |
| [`applyActivityDeactivate` — 274](../src/pages/BarriersDrivers/index.jsx#L274) | Builds a locally deactivated tactic model; retained helper, not a CRM write. | — |
| [`strategyLabelForValue` — 284](../src/pages/BarriersDrivers/index.jsx#L284) | Resolves the selected strategy's display label with a fallback. | `medicalPicklistLabel` |
| [`strategyPillValue` — 289](../src/pages/BarriersDrivers/index.jsx#L289) | Chooses the parent strategy text shown in the strategy pill. | — |
| [`categoryLabelForValue` — 292](../src/pages/BarriersDrivers/index.jsx#L292) | Resolves a category display label using metadata/fallback values. | `categoryPrefix` |
| [`applyBarrierDriverForm` — 300](../src/pages/BarriersDrivers/index.jsx#L300) | Builds the immediate UI parent model from saved form values and metadata labels. | `barrierDriverUsesStrategy`, `medicalPicklistLabel`, `normalizeBarrierDriverStatusForDisplay`, `strategyLabelForValue`, `categoryLabelForValue` |
| [`ExpandIcon` — 322](../src/pages/BarriersDrivers/index.jsx#L322) | Renders the corresponding small UI icon; no data fetching or persistence. | — |
| [`EditPencilIcon` — 331](../src/pages/BarriersDrivers/index.jsx#L331) | Renders the corresponding small UI icon; no data fetching or persistence. | — |
| [`EditIconButton` — 350](../src/pages/BarriersDrivers/index.jsx#L350) | Renders an accessible edit action button and invokes its supplied callback. | `EditPencilIcon` |
| [`HierarchyRow` — 365](../src/pages/BarriersDrivers/index.jsx#L365) | Renders one parent with expandable linked tactics and parent/tactic actions. | `isClosedBarrierDriverStatus`, `ExpandIcon`, `strategyPillValue`, `truncateDisplay`, `barrierDriverStatusTone`, `recordActivitySummary`; more in source |
| [`RecordCard` — 465](../src/pages/BarriersDrivers/index.jsx#L465) | Renders one parent card and its metadata/actions in the current parent-page layout. | `isClosedBarrierDriverStatus`, `ExpandIcon`, `strategyPillValue`, `truncateDisplay`, `barrierDriverStatusTone`, `recordActivitySummary`; more in source |
| [`ActivitiesSection` — 611](../src/pages/BarriersDrivers/index.jsx#L611) | Renders a sortable open/completed tactic subsection on the parent page. | `sortedActivities`, `truncateDisplay`, `statusTone`, `activityStatusLabel`, `formatDateLabel`, `EditIconButton` |
| [`BarriersDrivers` — 669](../src/pages/BarriersDrivers/index.jsx#L669) | Renders parent/tactic views, filtering, KPI counts, expansion, and all parent/tactic edit/create workflows. | `criticalActivityClosedParentEditReason`, `buildOpenActivityCountByBarrier`, `recordMatchesType`, `recordMatchesIndication`, `recordMatchesStrategy`, `recordMatchesStatus`; more in source |
| [`closedParentEditReason` — 727](../src/pages/BarriersDrivers/index.jsx#L727) | Returns the instruction to reopen a closed parent before editing its tactic. | `criticalActivityClosedParentEditReason` |
| [`filteredEntryActivities` — 772](../src/pages/BarriersDrivers/index.jsx#L772) | Applies the page's linked-tactic filters to one parent's child rows. | `recordIdMatches`, `closedParentEditReason` |
| [`matchesActivityFilters` — 891](../src/pages/BarriersDrivers/index.jsx#L891) | Checks a tactic against the parent page's selected indication/accountable/title/status filters. | — |
| [`toggleRow` — 929](../src/pages/BarriersDrivers/index.jsx#L929) | Toggles expansion of a parent row's linked tactics. | — |
| [`handleSort` — 931](../src/pages/BarriersDrivers/index.jsx#L931) | Updates sort-column/direction state for the owning table; it does not mutate CRM records. | — |
| [`openNewBarrierDriver` — 940](../src/pages/BarriersDrivers/index.jsx#L940) | Opens the parent create form with the chosen Barrier/Opportunity type. | `normalizedBarrierDriverType` |
| [`openEditBarrierDriver` — 947](../src/pages/BarriersDrivers/index.jsx#L947) | Selects an editable parent for the shared editor and clears its previous error. | — |
| [`closeBdModal` — 953](../src/pages/BarriersDrivers/index.jsx#L953) | Dismisses the parent editor unless a save is running. | — |
| [`openNewActivity` — 959](../src/pages/BarriersDrivers/index.jsx#L959) | Opens the linked-tactic create form for a selected parent. | — |
| [`openEditActivity` — 966](../src/pages/BarriersDrivers/index.jsx#L966) | Selects an editable tactic and opens its edit modal, respecting page/legacy guards. | — |
| [`closeActivityModal` — 974](../src/pages/BarriersDrivers/index.jsx#L974) | Dismisses the tactic editor and clears its error unless a save is running. | — |
| [`handleSaveBarrierDriver` — 981](../src/pages/BarriersDrivers/index.jsx#L981) | Validates closure/edit rules and saves a parent; on the detail page, creation also sequentially creates the required first linked tactic. | `isClosedBarrierDriverStatus`, `normalizedBarrierDriverType`, `closeBlockedByActivitiesMessage`, `saveBarrierDriverStatus`, `normalizeBarrierDriverStatusForDisplay`, `saveBarrierDriver`; more in source |
| [`handleSaveActivity` — 1109](../src/pages/BarriersDrivers/index.jsx#L1109) | Persists a tactic draft, merges the updated UI record, reports cache changes, and offers a parent-status prompt on completion. | `saveCriticalActivity`, `applyActivityForm`, `buildLinkedBarrierDriverStatusPrompt`, `formatCriticalActivitySaveError` |
| [`handleDeleteActivity` — 1165](../src/pages/BarriersDrivers/index.jsx#L1165) | Soft-deletes the selected tactic, removes it from local lists, and reports deletion to App. | `deleteCriticalActivity` |
| [`handleCreateActivity` — 1189](../src/pages/BarriersDrivers/index.jsx#L1189) | Checks required/open parent linkage, creates a tactic, merges its UI row, and reports the change to App. | `addCriticalActivity`, `applyActivityForm`, `createdRecordId`, `formatCriticalActivitySaveError` |
| [`handleDismissBarrierDriverStatusPrompt` — 1246](../src/pages/BarriersDrivers/index.jsx#L1246) | Dismisses the parent-status selector and clears its draft/error unless its save is running. | — |
| [`handleDismissBarrierDriverStatusConfirm` — 1253](../src/pages/BarriersDrivers/index.jsx#L1253) | Dismisses the initial offer to update the linked parent's status. | — |
| [`handleOpenBarrierDriverStatusPrompt` — 1259](../src/pages/BarriersDrivers/index.jsx#L1259) | Moves from the completion confirmation to the parent-status selector and initializes the status draft. | — |
| [`handleBarrierDriverStatusPromptChange` — 1269](../src/pages/BarriersDrivers/index.jsx#L1269) | Updates the proposed parent status and clears validation feedback. | — |
| [`handleSaveBarrierDriverStatusPrompt` — 1274](../src/pages/BarriersDrivers/index.jsx#L1274) | Prevents closure with remaining open tactics, writes the parent status, and updates local state/refresh notices. | `normalizeBarrierDriverStatusForDisplay`, `isClosedBarrierDriverStatus`, `linkedBarrierDriverCloseBlockedMessage`, `saveBarrierDriverStatus` |
| [`applyStatus` — 1288](../src/pages/BarriersDrivers/index.jsx#L1288) | Overlays the newly saved status onto the matching parent in a local array. | — |

## src/pages/CriticalActivities/CriticalActivityEditModal.jsx

[Open source](../src/pages/CriticalActivities/CriticalActivityEditModal.jsx)

Local dependencies: [EditModalField.jsx](../src/components/EditModalField.jsx), [criticalActivityHelp.js](../src/pages/CriticalActivities/criticalActivityHelp.js), [linkedBarrierDriverOptions.js](../src/pages/CriticalActivities/linkedBarrierDriverOptions.js), [medicalTerminology.js](../src/lib/medicalTerminology.js), [titlePicklistMappings.js](../src/lib/dataservice/accountPlan/titlePicklistMappings.js), [modalDismiss.js](../src/lib/helper/modalDismiss.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`toDateInputValue` — 19](../src/pages/CriticalActivities/CriticalActivityEditModal.jsx#L19) | Extracts a YYYY-MM-DD value suitable for the date input. | — |
| [`displayStatus` — 26](../src/pages/CriticalActivities/CriticalActivityEditModal.jsx#L26) | Converts stored Complete to the Completed display label. | — |
| [`buildInitialForm` — 30](../src/pages/CriticalActivities/CriticalActivityEditModal.jsx#L30) | Constructs the owning modal's initial editable draft from the selected record/defaults; fields differ by modal. | `displayStatus`, `toDateInputValue` |
| [`mergeOptions` — 43](../src/pages/CriticalActivities/CriticalActivityEditModal.jsx#L43) | Deduplicates nonempty values/options while preserving usable order; inspect the module for its blank/All/current-value policy. | — |
| [`restrictedOptions` — 54](../src/pages/CriticalActivities/CriticalActivityEditModal.jsx#L54) | Limits form choices to allowed metadata values under the edit modal's current-value policy. | `mergeOptions` |
| [`CriticalActivityEditModal` — 59](../src/pages/CriticalActivities/CriticalActivityEditModal.jsx#L59) | Renders tactic editing, fixed parent context, date/status controls, and delete confirmation. | `buildInitialForm`, `escapeBelongsToFieldControl`, `restrictedOptions`, `mergeOptions`, `linkedBarrierDriverSelectOptions`, `optionForId`; more in source |
| [`onKey` — 90](../src/pages/CriticalActivities/CriticalActivityEditModal.jsx#L90) | Handles keyboard behavior for the owning modal/control, especially Escape without interfering with field controls. | `escapeBelongsToFieldControl` |
| [`updateField` — 143](../src/pages/CriticalActivities/CriticalActivityEditModal.jsx#L143) | Updates a modal draft field and applies that form's dependent-field resets. | `optionForId` |
| [`requestDelete` — 159](../src/pages/CriticalActivities/CriticalActivityEditModal.jsx#L159) | Opens the tactic delete confirmation step. | — |
| [`confirmDelete` — 164](../src/pages/CriticalActivities/CriticalActivityEditModal.jsx#L164) | Invokes the supplied tactic deletion callback after confirmation. | — |
| [`cancelDelete` — 168](../src/pages/CriticalActivities/CriticalActivityEditModal.jsx#L168) | Closes the deletion confirmation without writing. | — |
| [`handleSubmit` — 172](../src/pages/CriticalActivities/CriticalActivityEditModal.jsx#L172) | Validates the owning modal's draft and invokes its save callback; the page/service performs persistence. | `optionForId` |

## src/pages/CriticalActivities/CriticalActivityNewModal.jsx

[Open source](../src/pages/CriticalActivities/CriticalActivityNewModal.jsx)

Local dependencies: [EditModalField.jsx](../src/components/EditModalField.jsx), [criticalActivityHelp.js](../src/pages/CriticalActivities/criticalActivityHelp.js), [linkedBarrierDriverOptions.js](../src/pages/CriticalActivities/linkedBarrierDriverOptions.js), [medicalTerminology.js](../src/lib/medicalTerminology.js), [titlePicklistMappings.js](../src/lib/dataservice/accountPlan/titlePicklistMappings.js), [modalDismiss.js](../src/lib/helper/modalDismiss.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`buildInitialForm` — 18](../src/pages/CriticalActivities/CriticalActivityNewModal.jsx#L18) | Constructs the owning modal's initial editable draft from the selected record/defaults; fields differ by modal. | `optionForId` |
| [`mergeOptions` — 35](../src/pages/CriticalActivities/CriticalActivityNewModal.jsx#L35) | Deduplicates nonempty values/options while preserving usable order; inspect the module for its blank/All/current-value policy. | — |
| [`CriticalActivityNewModal` — 46](../src/pages/CriticalActivities/CriticalActivityNewModal.jsx#L46) | Renders new-tactic controls, derives parent-compatible choices, and validates before calling create. | `isOpenBarrierDriverOption`, `buildInitialForm`, `escapeBelongsToFieldControl`, `mergeOptions`, `optionForId`, `medicalTacticOptionsForParent`; more in source |
| [`onKey` — 76](../src/pages/CriticalActivities/CriticalActivityNewModal.jsx#L76) | Handles keyboard behavior for the owning modal/control, especially Escape without interfering with field controls. | `escapeBelongsToFieldControl` |
| [`updateField` — 115](../src/pages/CriticalActivities/CriticalActivityNewModal.jsx#L115) | Updates a modal draft field and applies that form's dependent-field resets. | `optionForId` |
| [`handleSubmit` — 131](../src/pages/CriticalActivities/CriticalActivityNewModal.jsx#L131) | Validates the owning modal's draft and invokes its save callback; the page/service performs persistence. | `optionForId` |

## src/pages/CriticalActivities/LinkedBarrierDriverStatusPrompt.jsx

[Open source](../src/pages/CriticalActivities/LinkedBarrierDriverStatusPrompt.jsx)

Local dependencies: [shared.js](../src/lib/dataservice/accountPlan/shared.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`activityStatusKey` — 9](../src/pages/CriticalActivities/LinkedBarrierDriverStatusPrompt.jsx#L9) | Normalizes a status input for comparisons; inspect the source signature because some versions accept a record and others a raw status. | — |
| [`isCompletedActivityStatusValue` — 15](../src/pages/CriticalActivities/LinkedBarrierDriverStatusPrompt.jsx#L15) | Recognizes complete/completed/closed tactic status strings. | `activityStatusKey` |
| [`parentTypeTitle` — 18](../src/pages/CriticalActivities/LinkedBarrierDriverStatusPrompt.jsx#L18) | Formats internal Driver/Barrier type as Opportunity/Barrier for the completion prompt. | — |
| [`parentTypeLabel` — 21](../src/pages/CriticalActivities/LinkedBarrierDriverStatusPrompt.jsx#L21) | Formats internal Driver/Barrier type as Opportunity/Barrier for the completion prompt. | `parentTypeTitle` |
| [`linkedBarrierDriverCloseBlockedMessage` — 23](../src/pages/CriticalActivities/LinkedBarrierDriverStatusPrompt.jsx#L23) | Explains that all linked tactics must be complete before parent closure. | — |
| [`mergeBarrierDriverStatusOptions` — 26](../src/pages/CriticalActivities/LinkedBarrierDriverStatusPrompt.jsx#L26) | Normalizes/deduplicates parent status options and optionally retains the current status. | `normalizeBarrierDriverStatusForDisplay` |
| [`remainingOpenActivitiesForParent` — 39](../src/pages/CriticalActivities/LinkedBarrierDriverStatusPrompt.jsx#L39) | Finds other active incomplete tactics linked to the parent after the current tactic completes. | `isCompletedActivityStatusValue` |
| [`shouldPromptForBarrierDriverStatus` — 48](../src/pages/CriticalActivities/LinkedBarrierDriverStatusPrompt.jsx#L48) | Detects an incomplete-to-completed tactic transition with parent linkage. | `isCompletedActivityStatusValue` |
| [`initialPromptStatus` — 53](../src/pages/CriticalActivities/LinkedBarrierDriverStatusPrompt.jsx#L53) | Chooses a valid initial parent status without permitting closure while other tactics remain open. | `normalizeBarrierDriverStatusForDisplay`, `isClosedBarrierDriverStatus` |
| [`buildLinkedBarrierDriverStatusPrompt` — 66](../src/pages/CriticalActivities/LinkedBarrierDriverStatusPrompt.jsx#L66) | Builds parent/tactic identity, remaining-open count, and allowed statuses for the optional post-completion flow. | `shouldPromptForBarrierDriverStatus`, `remainingOpenActivitiesForParent`, `mergeBarrierDriverStatusOptions`, `parentTypeTitle`, `parentTypeLabel`, `normalizeBarrierDriverStatusForDisplay`; more in source |
| [`LinkedBarrierDriverStatusConfirmModal` — 98](../src/pages/CriticalActivities/LinkedBarrierDriverStatusPrompt.jsx#L98) | Renders the initial offer to update the linked parent's status after tactic completion. | — |
| [`onKey` — 104](../src/pages/CriticalActivities/LinkedBarrierDriverStatusPrompt.jsx#L104) | Handles keyboard behavior for the owning modal/control, especially Escape without interfering with field controls. | — |
| [`LinkedBarrierDriverStatusPromptModal` — 167](../src/pages/CriticalActivities/LinkedBarrierDriverStatusPrompt.jsx#L167) | Renders the separate parent-status selector and blocks invalid closure choices. | `isClosedBarrierDriverStatus` |
| [`onKey` — 177](../src/pages/CriticalActivities/LinkedBarrierDriverStatusPrompt.jsx#L177) | Handles keyboard behavior for the owning modal/control, especially Escape without interfering with field controls. | — |

## src/pages/CriticalActivities/index.jsx

[Open source](../src/pages/CriticalActivities/index.jsx)

Local dependencies: [titlePicklistMappings.js](../src/lib/dataservice/accountPlan/titlePicklistMappings.js), [utils.js](../src/lib/helper/utils.js), [criticalActivities.js](../src/lib/dataservice/accountPlan/criticalActivities.js), [errorMessages.js](../src/lib/dataservice/accountPlan/errorMessages.js), [shared.js](../src/lib/dataservice/accountPlan/shared.js), [CriticalActivityEditModal.jsx](../src/pages/CriticalActivities/CriticalActivityEditModal.jsx), [CriticalActivityNewModal.jsx](../src/pages/CriticalActivities/CriticalActivityNewModal.jsx), [linkedBarrierDriverOptions.js](../src/pages/CriticalActivities/linkedBarrierDriverOptions.js), [LinkedBarrierDriverStatusPrompt.jsx](../src/pages/CriticalActivities/LinkedBarrierDriverStatusPrompt.jsx), [edit-modal.css](../src/styles/edit-modal.css).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`optionsFor` — 39](../src/pages/CriticalActivities/index.jsx#L39) | Builds an All-prefixed filter list from metadata plus observed row values. | — |
| [`valueOptionsFor` — 56](../src/pages/CriticalActivities/index.jsx#L56) | Builds value choices without the All filter sentinel. | `optionsFor` |
| [`matchesFilters` — 59](../src/pages/CriticalActivities/index.jsx#L59) | Checks a tactic against accountable member, linked parent, and indication filters. | — |
| [`activityStatusKey` — 66](../src/pages/CriticalActivities/index.jsx#L66) | Normalizes a status input for comparisons; inspect the source signature because some versions accept a record and others a raw status. | — |
| [`statusKey` — 72](../src/pages/CriticalActivities/index.jsx#L72) | Normalizes a status input for comparisons; inspect the source signature because some versions accept a record and others a raw status. | `activityStatusKey` |
| [`parseSortDate` — 102](../src/pages/CriticalActivities/index.jsx#L102) | Converts a sortable date to its timestamp, preserving a blank/invalid sentinel. | — |
| [`todayIsoDate` — 108](../src/pages/CriticalActivities/index.jsx#L108) | Produces today's UTC ISO date portion for immediate UI completion-date defaults. | — |
| [`isOpenActivity` — 110](../src/pages/CriticalActivities/index.jsx#L110) | Recognizes the owning module's open/planned/in-progress tactic statuses. | `statusKey` |
| [`isCompletedActivity` — 113](../src/pages/CriticalActivities/index.jsx#L113) | Recognizes complete/completed/closed tactics according to the owning module's active-record rules. | `statusKey` |
| [`matchesKpiFilter` — 116](../src/pages/CriticalActivities/index.jsx#L116) | Applies the selected Planned/In Progress/Completed KPI status filter. | `statusKey` |
| [`storedStatusFromForm` — 125](../src/pages/CriticalActivities/index.jsx#L125) | Converts the displayed Completed label to stored Complete and applies the planned-status default. | — |
| [`isDeactivateChecked` — 126](../src/pages/CriticalActivities/index.jsx#L126) | Normalizes the boolean-like forms accepted by this helper's caller. | — |
| [`applyActivityForm` — 129](../src/pages/CriticalActivities/index.jsx#L129) | Builds the immediate UI tactic model after a successful form write, translating labels/status and parent details. | `storedStatusFromForm`, `isCompletedActivityStatusValue`, `medicalPicklistLabel`, `todayIsoDate`, `isDeactivateChecked` |
| [`applyActivityDeactivate` — 166](../src/pages/CriticalActivities/index.jsx#L166) | Builds a locally deactivated tactic model; retained helper, not a CRM write. | — |
| [`createdActivityId` — 176](../src/pages/CriticalActivities/index.jsx#L176) | Extracts the created record ID, with a local display-ID fallback in the owning page. | `createdRecordIdFromWriteResult` |
| [`buildCreatedActivityRow` — 180](../src/pages/CriticalActivities/index.jsx#L180) | Builds the immediate new-tactic UI record with its plan/parent metadata after creation. | `applyActivityForm`, `createdActivityId` |
| [`sortValue` — 202](../src/pages/CriticalActivities/index.jsx#L202) | Selects and normalizes the requested column's value for sorting the owning table. | `activityStatusLabel`, `parseSortDate` |
| [`compareSortValues` — 223](../src/pages/CriticalActivities/index.jsx#L223) | Compares numeric/text values in the selected direction while placing empty values consistently. | — |
| [`sortedRows` — 237](../src/pages/CriticalActivities/index.jsx#L237) | Returns rows ordered by the selected column/direction, preserving original order for equal values. | `compareSortValues`, `sortValue` |
| [`Section` — 248](../src/pages/CriticalActivities/index.jsx#L248) | Renders a sortable Medical Tactics section and its row edit actions. | `sortedRows`, `truncateDisplay`, `statusTone`, `activityStatusLabel`, `formatDateLabel` |
| [`CriticalActivities` — 332](../src/pages/CriticalActivities/index.jsx#L332) | Renders the complete plan tactic list, KPI filters, sortable sections, create/edit/delete dialogs, and parent-status prompts. | `criticalActivityClosedParentEditReason`, `optionsFor`, `mergeBarrierDriverStatusOptions`, `isCompletedActivity`, `isOpenActivity`, `matchesFilters`; more in source |
| [`closedParentEditReason` — 396](../src/pages/CriticalActivities/index.jsx#L396) | Returns the instruction to reopen a closed parent before editing its tactic. | `criticalActivityClosedParentEditReason` |
| [`handleKpiClick` — 541](../src/pages/CriticalActivities/index.jsx#L541) | Toggles Planned/In Progress filtering or scrolls to the completed section. | — |
| [`handleSort` — 553](../src/pages/CriticalActivities/index.jsx#L553) | Updates sort-column/direction state for the owning table; it does not mutate CRM records. | — |
| [`handleEditActivity` — 562](../src/pages/CriticalActivities/index.jsx#L562) | Selects an editable tactic and opens its edit modal, respecting page/legacy guards. | — |
| [`closeEditModal` — 568](../src/pages/CriticalActivities/index.jsx#L568) | Dismisses the tactic editor and clears its error unless a save is running. | — |
| [`openNewModal` — 574](../src/pages/CriticalActivities/index.jsx#L574) | Opens the new-tactic modal and clears an earlier create error. | — |
| [`closeNewModal` — 580](../src/pages/CriticalActivities/index.jsx#L580) | Dismisses the new-tactic modal unless creation is running. | — |
| [`handleSaveActivity` — 586](../src/pages/CriticalActivities/index.jsx#L586) | Persists a tactic draft, merges the updated UI record, reports cache changes, and offers a parent-status prompt on completion. | `saveCriticalActivity`, `applyActivityForm`, `buildLinkedBarrierDriverStatusPrompt`, `formatCriticalActivitySaveError` |
| [`handleDeleteActivity` — 645](../src/pages/CriticalActivities/index.jsx#L645) | Soft-deletes the selected tactic, removes it from local lists, and reports deletion to App. | `deleteCriticalActivity` |
| [`handleCreateActivity` — 667](../src/pages/CriticalActivities/index.jsx#L667) | Checks required/open parent linkage, creates a tactic, merges its UI row, and reports the change to App. | `addCriticalActivity`, `buildCreatedActivityRow`, `formatCriticalActivitySaveError` |
| [`handleDismissBarrierDriverStatusPrompt` — 701](../src/pages/CriticalActivities/index.jsx#L701) | Dismisses the parent-status selector and clears its draft/error unless its save is running. | — |
| [`handleDismissBarrierDriverStatusConfirm` — 708](../src/pages/CriticalActivities/index.jsx#L708) | Dismisses the initial offer to update the linked parent's status. | — |
| [`handleOpenBarrierDriverStatusPrompt` — 714](../src/pages/CriticalActivities/index.jsx#L714) | Moves from the completion confirmation to the parent-status selector and initializes the status draft. | — |
| [`handleBarrierDriverStatusPromptChange` — 724](../src/pages/CriticalActivities/index.jsx#L724) | Updates the proposed parent status and clears validation feedback. | — |
| [`handleSaveBarrierDriverStatusPrompt` — 729](../src/pages/CriticalActivities/index.jsx#L729) | Prevents closure with remaining open tactics, writes the parent status, and updates local state/refresh notices. | `normalizeBarrierDriverStatusForDisplay`, `isClosedBarrierDriverStatus`, `linkedBarrierDriverCloseBlockedMessage`, `saveBarrierDriverStatus` |

## src/pages/CriticalActivities/linkedBarrierDriverOptions.js

[Open source](../src/pages/CriticalActivities/linkedBarrierDriverOptions.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`barrierDriverStatusKey` — 1](../src/pages/CriticalActivities/linkedBarrierDriverOptions.js#L1) | Normalizes a status input for comparisons; inspect the source signature because some versions accept a record and others a raw status. | — |
| [`isClosedBarrierDriverStatusValue` — 7](../src/pages/CriticalActivities/linkedBarrierDriverOptions.js#L7) | Recognizes closed parent status variants supported by this module. | `barrierDriverStatusKey` |
| [`criticalActivityStatusKey` — 12](../src/pages/CriticalActivities/linkedBarrierDriverOptions.js#L12) | Normalizes a status input for comparisons; inspect the source signature because some versions accept a record and others a raw status. | — |
| [`isCompletedCriticalActivityStatusValue` — 18](../src/pages/CriticalActivities/linkedBarrierDriverOptions.js#L18) | Recognizes complete/completed/closed tactic status strings. | `criticalActivityStatusKey` |
| [`optionForId` — 23](../src/pages/CriticalActivities/linkedBarrierDriverOptions.js#L23) | Finds a linked parent option by its identifier. | — |
| [`isOpenBarrierDriverOption` — 26](../src/pages/CriticalActivities/linkedBarrierDriverOptions.js#L26) | Requires an identified parent whose status is not closed/completed. | `isClosedBarrierDriverStatusValue` |
| [`criticalActivityClosedParentEditReason` — 29](../src/pages/CriticalActivities/linkedBarrierDriverOptions.js#L29) | Returns the reopen-parent instruction when a tactic's linked parent is closed. | `isOpenBarrierDriverOption` |
| [`linkedBarrierDriverSelectOptions` — 36](../src/pages/CriticalActivities/linkedBarrierDriverOptions.js#L36) | Offers open parents and can retain the existing closed selection for context/display. | `isOpenBarrierDriverOption` |

## src/pages/AccountProfile/AccountIntelligenceTab.jsx

[Open source](../src/pages/AccountProfile/AccountIntelligenceTab.jsx)

Local dependencies: [shared.js](../src/lib/dataservice/accountPlan/shared.js), [medicalEducationStatuses.js](../src/pages/AccountProfile/medicalEducationStatuses.js), [medicalProfilePicklistValues.js](../src/pages/AccountProfile/medicalProfilePicklistValues.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`accountInformationFields` — 21](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L21) | Defines the owning tab's Account information fields; the active Medical version currently returns an empty list. | — |
| [`fieldWithOptions` — 23](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L23) | Adds the CRM metadata choices to one Medical field definition. | — |
| [`medicalEducationStatusFields` — 28](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L28) | Builds per-education-option status controls with their API fields and available status options. | `medicalEducationStatusKey` |
| [`medicalProfileFields` — 44](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L44) | Defines the editable MM/DLBCL Medical profile fields, control types, CRM API names, labels, and limits. | `medicalEducationStatusFieldsFor`, `fieldWithOptions`, `medicalEducationStatusFields` |
| [`accountIntelligenceSections` — 77](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L77) | Groups field definitions into the owning Medical/Commercial tab sections. | `medicalProfileFields` |
| [`editValue` — 86](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L86) | Converts nullish values to an empty editable string while preserving other values as text. | — |
| [`displayValue` — 87](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L87) | Formats blank/boolean values for display using the owning module's fallback wording. | — |
| [`labelWithUnit` — 91](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L91) | Adds a unit to a field's label when defined. | — |
| [`valueFromProfile` — 96](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L96) | Reads a field's UI value from the supplied profile model. | — |
| [`editableItemsForSections` — 101](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L101) | Collects field definitions that can participate in the tab's draft/save logic. | `accountInformationFields` |
| [`buildInitialEditableValues` — 113](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L113) | Builds initial draft values from the profile and editable field definitions. | `accountInformationFields`, `editableItemsForSections`, `sanitizeMedicalProfilePicklistValue`, `valueFromProfile`, `editValue` |
| [`AccountIntelligenceControl` — 133](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L133) | Chooses and renders the field control described by a Medical/Commercial field definition. | `MedicalEducationEditor`, `MedicalMultiSelect`, `editValue` |
| [`MedicalEducationEditor` — 227](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L227) | Renders Medical Education options with individual status controls. | `editValue`, `renderStatusControl` |
| [`renderStatusControl` — 242](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L242) | Renders the selected education option's status editor. | `editValue` |
| [`MedicalMultiSelect` — 282](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L282) | Renders a portal-based multi-select menu, serializes selected values, and manages viewport/outside-click behavior. | `editValue`, `updateMenuPosition`, `createPortal`, `toggle` |
| [`toggle` — 298](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L298) | Adds/removes a selected choice in the Medical multi-select value. | — |
| [`updateMenuPosition` — 305](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L305) | Measures the field and viewport to position a dropdown without clipping it. | — |
| [`handleOutsidePointer` — 339](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L339) | Closes the owning popup when a pointer interaction occurs outside its control. | — |
| [`handleKeyDown` — 343](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L343) | Handles keyboard behavior for the owning modal/control, especially Escape without interfering with field controls. | — |
| [`handleViewportChange` — 348](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L348) | Repositions the Medical multi-select menu when viewport/scroll geometry changes. | `updateMenuPosition` |
| [`AccountIntelligenceField` — 401](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L401) | Renders a field's label, value/control, and read-only/edit state. | `labelWithUnit`, `AccountIntelligenceControl`, `displayValue` |
| [`AccountInformationSection` — 468](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L468) | Renders the owning tab's Account information field group. | `valueFromProfile`, `AccountIntelligenceField`, `editValue` |
| [`AccountIntelligenceSection` — 494](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L494) | Renders one profile field group and any attached save action. | `valueFromProfile`, `AccountIntelligenceField`, `editValue` |
| [`AccountIntelligenceTab` — 532](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L532) | Maintains Medical profile drafts and saved values, renders field groups, computes dirty fields, and delegates saving; the Commercial file uses this old export name too. | `accountIntelligenceSections`, `accountInformationFields`, `editableItemsForSections`, `buildInitialEditableValues`, `medicalEducationValueFromStatuses`, `mergeMedicalProfileDraftValues`; more in source |
| [`handleEditableValueChange` — 593](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L593) | Updates an editable profile draft property unless the tab is read-only. | — |
| [`isFieldDirty` — 598](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L598) | Compares the field's current normalized draft with the saved snapshot. | `editValue` |
| [`handleSave` — 610](../src/pages/AccountProfile/AccountIntelligenceTab.jsx#L610) | Validates/delegates the owning form or document save action; current reference-tab save machinery is not enabled by its parent call site. | — |

## src/pages/AccountProfile/AccountLookupField.jsx

[Open source](../src/pages/AccountProfile/AccountLookupField.jsx)

Local dependencies: [EditModalField.jsx](../src/components/EditModalField.jsx).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`lookupMeta` — 5](../src/pages/AccountProfile/AccountLookupField.jsx#L5) | Builds secondary descriptive text for an account/user lookup result. | — |
| [`AccountLookupField` — 8](../src/pages/AccountProfile/AccountLookupField.jsx#L8) | Provides the reusable async lookup textbox/results popup used by the member User selector and retained lookup infrastructure. | `positionResults`, `handleSelect`, `lookupMeta`, `FieldHelpButton`, `createPortal` |
| [`onPointerDown` — 37](../src/pages/AccountProfile/AccountLookupField.jsx#L37) | Closes the owning popup when a pointer interaction occurs outside its control. | — |
| [`positionResults` — 57](../src/pages/AccountProfile/AccountLookupField.jsx#L57) | Measures the field and viewport to position a dropdown without clipping it. | — |
| [`handleSelect` — 110](../src/pages/AccountProfile/AccountLookupField.jsx#L110) | Commits a lookup result, updates displayed text, and closes the results menu. | — |

## src/pages/AccountProfile/CommercialMmProfileTab.jsx

[Open source](../src/pages/AccountProfile/CommercialMmProfileTab.jsx)

Local dependencies: [shared.js](../src/lib/dataservice/accountPlan/shared.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`accountInformationFields` — 6](../src/pages/AccountProfile/CommercialMmProfileTab.jsx#L6) | Defines the owning tab's Account information fields; the active Medical version currently returns an empty list. | — |
| [`accountIntelligenceSections` — 30](../src/pages/AccountProfile/CommercialMmProfileTab.jsx#L30) | Groups field definitions into the owning Medical/Commercial tab sections. | — |
| [`visibleAccountIntelligenceSections` — 97](../src/pages/AccountProfile/CommercialMmProfileTab.jsx#L97) | Filters Commercial MM sections to the ones intended for this reference view. | `accountIntelligenceSections` |
| [`editValue` — 105](../src/pages/AccountProfile/CommercialMmProfileTab.jsx#L105) | Converts nullish values to an empty editable string while preserving other values as text. | — |
| [`displayValue` — 106](../src/pages/AccountProfile/CommercialMmProfileTab.jsx#L106) | Formats blank/boolean values for display using the owning module's fallback wording. | — |
| [`displayValueForItem` — 110](../src/pages/AccountProfile/CommercialMmProfileTab.jsx#L110) | Formats a Commercial field value using its type/definition. | `editValue`, `displayValue` |
| [`labelWithUnit` — 117](../src/pages/AccountProfile/CommercialMmProfileTab.jsx#L117) | Adds a unit to a field's label when defined. | — |
| [`valueFromProfile` — 122](../src/pages/AccountProfile/CommercialMmProfileTab.jsx#L122) | Reads a field's UI value from the supplied profile model. | — |
| [`editableItemsForSections` — 127](../src/pages/AccountProfile/CommercialMmProfileTab.jsx#L127) | Collects field definitions that can participate in the tab's draft/save logic. | `accountInformationFields` |
| [`buildInitialEditableValues` — 139](../src/pages/AccountProfile/CommercialMmProfileTab.jsx#L139) | Builds initial draft values from the profile and editable field definitions. | `accountInformationFields`, `editableItemsForSections`, `editValue`, `valueFromProfile` |
| [`AccountIntelligenceControl` — 152](../src/pages/AccountProfile/CommercialMmProfileTab.jsx#L152) | Chooses and renders the field control described by a Medical/Commercial field definition. | `editValue` |
| [`AccountIntelligenceField` — 216](../src/pages/AccountProfile/CommercialMmProfileTab.jsx#L216) | Renders a field's label, value/control, and read-only/edit state. | `labelWithUnit`, `AccountIntelligenceControl`, `displayValueForItem` |
| [`AccountInformationSection` — 273](../src/pages/AccountProfile/CommercialMmProfileTab.jsx#L273) | Renders the owning tab's Account information field group. | `valueFromProfile`, `AccountIntelligenceField`, `editValue` |
| [`AccountIntelligenceSection` — 299](../src/pages/AccountProfile/CommercialMmProfileTab.jsx#L299) | Renders one profile field group and any attached save action. | `valueFromProfile`, `AccountIntelligenceField`, `editValue` |
| [`AccountIntelligenceTab` — 328](../src/pages/AccountProfile/CommercialMmProfileTab.jsx#L328) | Despite the internal function name, this is the Commercial MM reference tab; its current parent forces read-only mode. | `visibleAccountIntelligenceSections`, `accountInformationFields`, `editableItemsForSections`, `buildInitialEditableValues`, `editValue`, `isFieldDirty`; more in source |
| [`handleEditableValueChange` — 360](../src/pages/AccountProfile/CommercialMmProfileTab.jsx#L360) | Updates an editable profile draft property unless the tab is read-only. | — |
| [`isFieldDirty` — 365](../src/pages/AccountProfile/CommercialMmProfileTab.jsx#L365) | Compares the field's current normalized draft with the saved snapshot. | `editValue` |
| [`handleSave` — 377](../src/pages/AccountProfile/CommercialMmProfileTab.jsx#L377) | Validates/delegates the owning form or document save action; current reference-tab save machinery is not enabled by its parent call site. | — |

## src/pages/AccountProfile/ProfileTab.jsx

[Open source](../src/pages/AccountProfile/ProfileTab.jsx)

Local dependencies: [AccountProfileFieldHelp.jsx](../src/components/AccountProfileFieldHelp.jsx).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`editValue` — 5](../src/pages/AccountProfile/ProfileTab.jsx#L5) | Converts nullish values to an empty editable string while preserving other values as text. | — |
| [`parseMultiPicklistValue` — 8](../src/pages/AccountProfile/ProfileTab.jsx#L8) | Splits a semicolon-delimited CRM multi-select string into distinct nonempty values. | `editValue` |
| [`serializeMultiPicklistValue` — 14](../src/pages/AccountProfile/ProfileTab.jsx#L14) | Joins a normalized multi-select array into a CRM semicolon-delimited value. | `editValue` |
| [`profileDisplay` — 20](../src/pages/AccountProfile/ProfileTab.jsx#L20) | Formats a Commercial profile reference item's value for display. | `editValue` |
| [`parseTopPayers` — 32](../src/pages/AccountProfile/ProfileTab.jsx#L32) | Parses the reference payer field into an ordered set of displayed payer names. | `profileDisplay` |
| [`topPayerCountClass` — 42](../src/pages/AccountProfile/ProfileTab.jsx#L42) | Selects payer-card layout according to the number of payer entries. | — |
| [`EmptyPayerState` — 54](../src/pages/AccountProfile/ProfileTab.jsx#L54) | Renders the Commercial profile's empty payer display. | — |
| [`attributeKeyClass` — 58](../src/pages/AccountProfile/ProfileTab.jsx#L58) | Turns an attribute key into a CSS modifier used by the Commercial reference layout. | — |
| [`AttributeLabel` — 61](../src/pages/AccountProfile/ProfileTab.jsx#L61) | Renders a Commercial attribute label with applicable help content. | `AccountProfileFieldHelp` |
| [`TopPayersRankedCard` — 74](../src/pages/AccountProfile/ProfileTab.jsx#L74) | Renders the ordered Commercial Top Payers reference card. | `parseTopPayers`, `AttributeLabel`, `EmptyPayerState` |
| [`AttributeGrid` — 93](../src/pages/AccountProfile/ProfileTab.jsx#L93) | Renders Commercial reference attributes, with special payer handling. | `parseTopPayers`, `topPayerCountClass`, `TopPayersRankedCard`, `attributeKeyClass`, `AttributeLabel`, `profileDisplay` |
| [`ProfileQuestionRow` — 121](../src/pages/AccountProfile/ProfileTab.jsx#L121) | Renders one Commercial DLBCL question and any dependent/multi-select display/control; parent currently supplies read-only mode. | `editValue`, `parseMultiPicklistValue`, `serializeMultiPicklistValue`, `toggleMultiSelectValue` |
| [`toggleMultiSelectValue` — 141](../src/pages/AccountProfile/ProfileTab.jsx#L141) | Adds/removes a choice from the Commercial question's draft selection. | `serializeMultiPicklistValue` |
| [`closeOnOutsidePointer` — 157](../src/pages/AccountProfile/ProfileTab.jsx#L157) | Closes the owning popup when a pointer interaction occurs outside its control. | — |
| [`buildDrafts` — 232](../src/pages/AccountProfile/ProfileTab.jsx#L232) | Initializes the retained Commercial question draft map from question columns. | `editValue` |
| [`ProfileTab` — 242](../src/pages/AccountProfile/ProfileTab.jsx#L242) | Renders DLBCL Commercial reference attributes, payer data, and questions; parent currently forces read-only mode. | `buildDrafts`, `editValue`, `AttributeGrid`, `AccountProfileFieldHelp`, `ProfileQuestionRow` |
| [`handleDraftChange` — 276](../src/pages/AccountProfile/ProfileTab.jsx#L276) | Changes a retained Commercial question draft when editing is enabled. | — |
| [`handleSave` — 282](../src/pages/AccountProfile/ProfileTab.jsx#L282) | Validates/delegates the owning form or document save action; current reference-tab save machinery is not enabled by its parent call site. | — |

## src/pages/AccountProfile/ReferralDynamicsTab.jsx

[Open source](../src/pages/AccountProfile/ReferralDynamicsTab.jsx)

Local dependencies: [tableSort.js](../src/lib/helper/tableSort.js), [TableSortButton.jsx](../src/components/TableSortButton.jsx), [AccountProfileFieldHelp.jsx](../src/components/AccountProfileFieldHelp.jsx), [utils.js](../src/lib/helper/utils.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`referralIndicationDisplay` — 7](../src/pages/AccountProfile/ReferralDynamicsTab.jsx#L7) | Normalizes the referral indication into the tab's displayed wording. | — |
| [`referralSortValue` — 24](../src/pages/AccountProfile/ReferralDynamicsTab.jsx#L24) | Selects and normalizes the requested column's value for sorting the owning table. | `referralIndicationDisplay` |
| [`networkSortValue` — 37](../src/pages/AccountProfile/ReferralDynamicsTab.jsx#L37) | Selects and normalizes the requested column's value for sorting the owning table. | — |
| [`ReferralMappingCard` — 48](../src/pages/AccountProfile/ReferralDynamicsTab.jsx#L48) | Renders the sortable read-only referral mapping table. | `stableSortRows`, `AccountProfileFieldHelp`, `formatCountLabel`, `TableSortButton`, `referralIndicationDisplay` |
| [`RegionalDynamicsPanel` — 88](../src/pages/AccountProfile/ReferralDynamicsTab.jsx#L88) | Renders one indication's read-only regional-dynamics narrative. | `AccountProfileFieldHelp` |
| [`HealthcareNetworksCard` — 102](../src/pages/AccountProfile/ReferralDynamicsTab.jsx#L102) | Renders the sortable read-only healthcare networks table. | `stableSortRows`, `AccountProfileFieldHelp`, `TableSortButton` |
| [`ReferralDynamicsTab` — 142](../src/pages/AccountProfile/ReferralDynamicsTab.jsx#L142) | Combines referral mappings, regional dynamics, and network references with local sorting state. | `nextTableSort`, `ReferralMappingCard`, `RegionalDynamicsPanel`, `HealthcareNetworksCard` |
| [`handleReferralSort` — 150](../src/pages/AccountProfile/ReferralDynamicsTab.jsx#L150) | Updates sort-column/direction state for the owning table; it does not mutate CRM records. | `nextTableSort` |
| [`handleNetworkSort` — 151](../src/pages/AccountProfile/ReferralDynamicsTab.jsx#L151) | Updates sort-column/direction state for the owning table; it does not mutate CRM records. | `nextTableSort` |

## src/pages/AccountProfile/index.jsx

[Open source](../src/pages/AccountProfile/index.jsx)

Local dependencies: [ProfileTab.jsx](../src/pages/AccountProfile/ProfileTab.jsx), [ReferralDynamicsTab.jsx](../src/pages/AccountProfile/ReferralDynamicsTab.jsx), [AccountIntelligenceTab.jsx](../src/pages/AccountProfile/AccountIntelligenceTab.jsx), [CommercialMmProfileTab.jsx](../src/pages/AccountProfile/CommercialMmProfileTab.jsx), [accountProfile.js](../src/lib/dataservice/accountPlan/accountProfile.js), [edit-modal.css](../src/styles/edit-modal.css), [AccountProfile.css](../src/pages/AccountProfile/AccountProfile.css).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`resolveInitialTab` — 18](../src/pages/AccountProfile/index.jsx#L18) | Accepts a valid profile tab key or defaults to MM ATC Medical Profile. | — |
| [`AccountProfile` — 21](../src/pages/AccountProfile/index.jsx#L21) | Renders five profile tabs and delegates Medical field writes; Commercial and referral views are read-only. | `resolveInitialTab`, `saveMedicalProfileField`, `ReferralDynamicsTab`, `AccountIntelligenceTab`, `CommercialMmProfileTab`, `ProfileTab` |
| [`handleSaveMmProfile` — 30](../src/pages/AccountProfile/index.jsx#L30) | Sequentially saves allowed Medical fields for either indication, shows notices, and requests refresh; errors are caught rather than rethrown. | `saveMedicalProfileField` |

## src/pages/AccountProfile/medicalEducationStatuses.js

[Open source](../src/pages/AccountProfile/medicalEducationStatuses.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`optionValue` — 1](../src/pages/AccountProfile/medicalEducationStatuses.js#L1) | Extracts an option's API value from an option object or scalar. | — |
| [`medicalEducationValueFromStatuses` — 3](../src/pages/AccountProfile/medicalEducationStatuses.js#L3) | Derives the semicolon-delimited education selection from populated per-option statuses. | — |

## src/pages/AccountProfile/medicalProfilePicklistValues.js

[Open source](../src/pages/AccountProfile/medicalProfilePicklistValues.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`stringValue` — 4](../src/pages/AccountProfile/medicalProfilePicklistValues.js#L4) | Converts nullish values to an empty editable string while preserving other values as text. | — |
| [`optionValue` — 7](../src/pages/AccountProfile/medicalProfilePicklistValues.js#L7) | Extracts an option's API value from an option object or scalar. | `stringValue` |
| [`sanitizeMedicalProfilePicklistValue` — 10](../src/pages/AccountProfile/medicalProfilePicklistValues.js#L10) | Removes choices absent from current CRM metadata and normalizes single/multiple selection values. | `stringValue` |
| [`mergeMedicalProfileDraftValues` — 35](../src/pages/AccountProfile/medicalProfilePicklistValues.js#L35) | Merges refreshed profile values while retaining eligible unsaved local changes. | `stringValue` |

## src/pages/Stakeholders/StakeholdersTab.jsx

[Open source](../src/pages/Stakeholders/StakeholdersTab.jsx)

Local dependencies: [TableSortButton.jsx](../src/components/TableSortButton.jsx), [utils.js](../src/lib/helper/utils.js), [tableSort.js](../src/lib/helper/tableSort.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`stakeholderSortValue` — 17](../src/pages/Stakeholders/StakeholdersTab.jsx#L17) | Selects and normalizes the requested column's value for sorting the owning table. | — |
| [`StakeholdersTab` — 30](../src/pages/Stakeholders/StakeholdersTab.jsx#L30) | Builds role choices, filters stakeholder rows, applies stable sorting, and renders the reference list. | `stakeholderMatchesFilters`, `stableSortRows`, `stakeholderRoleOptions`, `nextTableSort`, `formatCountLabel`, `TableSortButton`; more in source |
| [`handleSort` — 41](../src/pages/Stakeholders/StakeholdersTab.jsx#L41) | Updates sort-column/direction state for the owning table; it does not mutate CRM records. | `nextTableSort` |

## src/pages/Stakeholders/index.jsx

[Open source](../src/pages/Stakeholders/index.jsx)

Local dependencies: [Stakeholders.css](../src/pages/Stakeholders/Stakeholders.css), [StakeholdersTab.jsx](../src/pages/Stakeholders/StakeholdersTab.jsx).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`Stakeholders` — 7](../src/pages/Stakeholders/index.jsx#L7) | Owns the role filter and renders the current read-only stakeholder table. | `StakeholdersTab` |

## src/pages/TeamMembers/TeamMemberEditModal.jsx

[Open source](../src/pages/TeamMembers/TeamMemberEditModal.jsx)

Local dependencies: [EditModalField.jsx](../src/components/EditModalField.jsx), [utils.js](../src/lib/helper/utils.js), [AccountLookupField.jsx](../src/pages/AccountProfile/AccountLookupField.jsx).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`buildInitialForm` — 28](../src/pages/TeamMembers/TeamMemberEditModal.jsx#L28) | Constructs the owning modal's initial editable draft from the selected record/defaults; fields differ by modal. | `displayValue` |
| [`Field` — 36](../src/pages/TeamMembers/TeamMemberEditModal.jsx#L36) | Renders one Team Member field as a read-only value or allowed form control. | `FieldHelpButton` |
| [`mergeOptions` — 98](../src/pages/TeamMembers/TeamMemberEditModal.jsx#L98) | Deduplicates nonempty values/options while preserving usable order; inspect the module for its blank/All/current-value policy. | — |
| [`TeamMemberEditModal` — 109](../src/pages/TeamMembers/TeamMemberEditModal.jsx#L109) | Renders User selection and editable participation, with CRM-sourced role/status display and delegated save/delete actions. | `buildInitialForm`, `mergeOptions`, `displayValue`, `teamMemberPhone`, `AccountLookupField`, `Field` |
| [`onKey` — 133](../src/pages/TeamMembers/TeamMemberEditModal.jsx#L133) | Handles keyboard behavior for the owning modal/control, especially Escape without interfering with field controls. | — |
| [`updateField` — 149](../src/pages/TeamMembers/TeamMemberEditModal.jsx#L149) | Updates a modal draft field and applies that form's dependent-field resets. | — |
| [`updateUserQuery` — 154](../src/pages/TeamMembers/TeamMemberEditModal.jsx#L154) | Changes lookup search text and clears the previously selected User identity. | — |
| [`selectUser` — 159](../src/pages/TeamMembers/TeamMemberEditModal.jsx#L159) | Sets the chosen User ID/name and related display values into the membership draft. | — |
| [`handleSave` — 168](../src/pages/TeamMembers/TeamMemberEditModal.jsx#L168) | Validates/delegates the owning form or document save action; current reference-tab save machinery is not enabled by its parent call site. | — |
| [`handleDelete` — 186](../src/pages/TeamMembers/TeamMemberEditModal.jsx#L186) | Invokes the owning form's supplied delete action and manages its busy/error state. | — |

## src/pages/TeamMembers/index.jsx

[Open source](../src/pages/TeamMembers/index.jsx)

Local dependencies: [userRecordNavigation.js](../src/lib/helper/userRecordNavigation.js), [query.js](../src/lib/dataservice/query.js), [TableSortButton.jsx](../src/components/TableSortButton.jsx), [utils.js](../src/lib/helper/utils.js), [tableSort.js](../src/lib/helper/tableSort.js), [teamMemberUsers.js](../src/lib/helper/teamMemberUsers.js), [edit-modal.css](../src/styles/edit-modal.css), [TeamMembers.css](../src/pages/TeamMembers/TeamMembers.css), [TeamMemberEditModal.jsx](../src/pages/TeamMembers/TeamMemberEditModal.jsx), [teamMembers.js](../src/lib/dataservice/accountPlan/teamMembers.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`uniqueValues` — 35](../src/pages/TeamMembers/index.jsx#L35) | Deduplicates nonempty values/options while preserving usable order; inspect the module for its blank/All/current-value policy. | — |
| [`teamMemberSortValue` — 45](../src/pages/TeamMembers/index.jsx#L45) | Selects and normalizes the requested column's value for sorting the owning table. | `teamMemberPhone` |
| [`EditPencil` — 59](../src/pages/TeamMembers/index.jsx#L59) | Renders the corresponding small UI icon; no data fetching or persistence. | — |
| [`TeamMemberNameCell` — 91](../src/pages/TeamMembers/index.jsx#L91) | Renders the linked User name and selects hosted/native navigation behavior. | `hostedUserRecordUrl`, `viewRecord` |
| [`openUserRecord` — 94](../src/pages/TeamMembers/index.jsx#L94) | Opens the selected member's User record through the available hosted/native route. | `viewRecord` |
| [`applySavedTeamMember` — 125](../src/pages/TeamMembers/index.jsx#L125) | Merges a saved membership into the local list and preserves expected UI fields. | — |
| [`TeamMembers` — 136](../src/pages/TeamMembers/index.jsx#L136) | Renders plan memberships with filters/sorting and add/edit/delete workflows synchronized with Home. | `sortTeamMembersByParticipation`, `uniqueValues`, `stableSortRows`, `teamMemberUserIds`, `teamMemberRawUserIds`, `searchTeamUsers`; more in source |
| [`searchAvailableTeamUsers` — 192](../src/pages/TeamMembers/index.jsx#L192) | Searches Users with existing membership exclusions and filters duplicate User choices. | `searchTeamUsers`, `filterExistingTeamMemberUsers` |
| [`handleSort` — 198](../src/pages/TeamMembers/index.jsx#L198) | Updates sort-column/direction state for the owning table; it does not mutate CRM records. | `nextTableSort` |
| [`openAddMember` — 208](../src/pages/TeamMembers/index.jsx#L208) | Opens the create-membership form. | — |
| [`openEditMember` — 213](../src/pages/TeamMembers/index.jsx#L213) | Selects an existing member for editing. | — |
| [`saveMember` — 218](../src/pages/TeamMembers/index.jsx#L218) | Checks duplicate Users, creates/updates membership, updates local/shared caches, and reports success or failure. | `hasDuplicateTeamMemberUser`, `updateTeamMember`, `applySavedTeamMember`, `sortTeamMembersByParticipation`, `createTeamMember` |
| [`deleteMember` — 262](../src/pages/TeamMembers/index.jsx#L262) | Soft-deletes membership and removes it from local/shared caches. | `deleteTeamMember` |

## src/lib/dataservice/accountPlan/accountPlanLauncher.js

[Open source](../src/lib/dataservice/accountPlan/accountPlanLauncher.js)

Local dependencies: [query.js](../src/lib/dataservice/query.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`uniqueValues` — 48](../src/lib/dataservice/accountPlan/accountPlanLauncher.js#L48) | Deduplicates nonempty values/options while preserving usable order; inspect the module for its blank/All/current-value policy. | — |
| [`displayString` — 51](../src/lib/dataservice/accountPlan/accountPlanLauncher.js#L51) | Normalizes launcher cell values for readable display/filtering. | — |
| [`mergeRowsById` — 58](../src/lib/dataservice/accountPlan/accountPlanLauncher.js#L58) | Merges records from multiple field queries into one model per compatible ID. | `unwrap` |
| [`fetchAccessibleFieldsById` — 81](../src/lib/dataservice/accountPlan/accountPlanLauncher.js#L81) | Reads requested launcher fields by IDs with access-tolerant fallbacks. | `uniqueValues`, `runCrmQuery`, `inClause`, `mergeRowsById` |
| [`fetchUserNamesById` — 107](../src/lib/dataservice/accountPlan/accountPlanLauncher.js#L107) | Batch-resolves plan owner User names for the launcher. | `uniqueValues`, `runCrmQuery`, `inClause`, `displayString` |
| [`fetchAccountPriorityById` — 126](../src/lib/dataservice/accountPlan/accountPlanLauncher.js#L126) | Batch-loads Account MM ATC Priority values for launcher rows. | `uniqueValues`, `runCrmQuery`, `inClause`, `displayString` |
| [`fetchAtcCohortByPlanId` — 149](../src/lib/dataservice/accountPlan/accountPlanLauncher.js#L149) | Batch-loads plan-linked Ecosystem Plan cohort values for launcher rows. | `uniqueValues`, `runCrmQuery`, `inClause`, `displayString` |
| [`toAccountPlanLauncherRow` — 174](../src/lib/dataservice/accountPlan/accountPlanLauncher.js#L174) | Maps plan/account/owner/cohort fields into one launcher list row. | `unwrap`, `displayString` |
| [`sortLauncherRows` — 203](../src/lib/dataservice/accountPlan/accountPlanLauncher.js#L203) | Applies the launcher's default row ordering. | — |
| [`fetchLauncherAccountPlans` — 213](../src/lib/dataservice/accountPlan/accountPlanLauncher.js#L213) | Loads/enriches Account Plans for the desktop launcher using the supplied filter/scope. | `runCrmQuery`, `unwrap`, `fetchAccessibleFieldsById`, `mergeRowsById` |
| [`fetchCurrentUserAccountPlans` — 229](../src/lib/dataservice/accountPlan/accountPlanLauncher.js#L229) | Loads the launcher plans scoped to the current signed-in User. | `fetchLauncherAccountPlans`, `fetchUserNamesById`, `unwrap`, `fetchAccountPriorityById`, `fetchAtcCohortByPlanId`, `sortLauncherRows`; more in source |

## src/lib/dataservice/accountPlan/accountProfile.js

[Open source](../src/lib/dataservice/accountPlan/accountProfile.js)

Local dependencies: [shared.js](../src/lib/dataservice/accountPlan/shared.js), [query.js](../src/lib/dataservice/query.js), [client.js](../src/lib/dataservice/client.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`sourceLookup` — 67](../src/lib/dataservice/accountPlan/accountProfile.js#L67) | Groups the Account and profile models by source for reference-field definitions. | — |
| [`valueFromDef` — 68](../src/lib/dataservice/accountPlan/accountProfile.js#L68) | Reads a field definition's property from its named source model. | — |
| [`buildReferenceRows` — 69](../src/lib/dataservice/accountPlan/accountProfile.js#L69) | Maps field definitions into label/type/value rows for the Commercial reference tabs. | `valueFromDef` |
| [`picklistOptionsFromLabels` — 77](../src/lib/dataservice/accountPlan/accountProfile.js#L77) | Turns metadata into value/label option objects. | — |
| [`mergePicklistOptions` — 108](../src/lib/dataservice/accountPlan/accountProfile.js#L108) | Deduplicates nonempty values/options while preserving usable order; inspect the module for its blank/All/current-value policy. | — |
| [`getRuntimePicklistValueLabels` — 125](../src/lib/dataservice/accountPlan/accountProfile.js#L125) | Chooses explicit CRM metadata when a packaged Veeva runtime is available and default metadata otherwise. | `hasVeevaRuntime` |
| [`fetchReferralIndicationPicklist` — 128](../src/lib/dataservice/accountPlan/accountProfile.js#L128) | Loads the referral indication field's value/label options. | `getRuntimePicklistValueLabels` |
| [`fetchProfileQuestionPicklists` — 133](../src/lib/dataservice/accountPlan/accountProfile.js#L133) | Loads metadata for the DLBCL Commercial reference questions. | `getRuntimePicklistValueLabels` |
| [`fetchMedicalProfilePicklists` — 157](../src/lib/dataservice/accountPlan/accountProfile.js#L157) | Loads metadata for MM/DLBCL Medical fields and per-education status fields. | `getRuntimePicklistValueLabels` |
| [`fetchCommercialProfilePicklists` — 177](../src/lib/dataservice/accountPlan/accountProfile.js#L177) | Loads metadata for Commercial MM reference fields. | `getRuntimePicklistValueLabels` |
| [`buildProfileQuestionColumns` — 186](../src/lib/dataservice/accountPlan/accountProfile.js#L186) | Maps Commercial DLBCL question definitions/values/options into two display columns. | — |
| [`toItem` — 188](../src/lib/dataservice/accountPlan/accountProfile.js#L188) | Builds a question definition's display/control model with its CRM field and current value. | — |
| [`loadAccountProfile` — 207](../src/lib/dataservice/accountPlan/accountProfile.js#L207) | Assembles Medical/Commercial profiles, metadata, referral/network children, and regional dynamics into all five tabs' data. | `requireCurrentAccountPlanId`, `resolveShellContextForPlanId`, `fetchMedicalAccountProfile`, `fetchAccountProfile`, `fetchCommercialAccountProfile`, `fetchReferralDynamicsAccountProfile`; more in source |
| [`saveMedicalProfileField` — 290](../src/lib/dataservice/accountPlan/accountProfile.js#L290) | Rejects unsupported Medical API fields, then delegates the Ecosystem Plan update to the live-only writer. | `updateMedicalAccountProfileField` |

Exported aliases/constants assigned to another identifier (no separate function body):

- [`saveReferralAccount`](../src/lib/dataservice/accountPlan/accountProfile.js#L297) → `updateReferralAccount`. Follow the target's definition/import to see behavior and persistence destination.
- [`addReferralAccount`](../src/lib/dataservice/accountPlan/accountProfile.js#L298) → `createReferralAccount`. Follow the target's definition/import to see behavior and persistence destination.
- [`deleteReferralAccount`](../src/lib/dataservice/accountPlan/accountProfile.js#L299) → `softDeleteReferralAccount`. Follow the target's definition/import to see behavior and persistence destination.
- [`searchReferralSiteAccounts`](../src/lib/dataservice/accountPlan/accountProfile.js#L300) → `searchSiteAccounts`. Follow the target's definition/import to see behavior and persistence destination.

## src/lib/dataservice/accountPlan/approval.js

[Open source](../src/lib/dataservice/accountPlan/approval.js)

Local dependencies: [query.js](../src/lib/dataservice/query.js), [accountPlanReadOnly.js](../src/lib/accountPlanReadOnly.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`nestedErrorMessages` — 63](../src/lib/dataservice/accountPlan/approval.js#L63) | Recursively collects error messages from nested bridge/Salesforce rejection objects. | — |
| [`readableError` — 79](../src/lib/dataservice/accountPlan/approval.js#L79) | Chooses a useful specific Salesforce error message over a generic bridge failure. | `nestedErrorMessages` |
| [`isSalesforceAutomationFailure` — 91](../src/lib/dataservice/accountPlan/approval.js#L91) | Recognizes Flow/process failure signals so approval writes are not retried pointlessly. | `nestedErrorMessages` |
| [`updateApprovalRecord` — 96](../src/lib/dataservice/accountPlan/approval.js#L96) | Writes full approval routing/status fields through explicit CRM, retrying required-only fields except on Flow failures. | `toCanonicalSalesforceId`, `updateRecord`, `isSalesforceAutomationFailure`, `readableError` |
| [`idVariants` — 125](../src/lib/dataservice/accountPlan/approval.js#L125) | Produces unique Salesforce ID forms so online/offline IDs can match the same record. | `salesforceIdVariants` |
| [`isSalesforceId` — 132](../src/lib/dataservice/accountPlan/approval.js#L132) | Checks whether a value has the 15- or 18-character Salesforce ID shape. | — |
| [`fetchUserNames` — 136](../src/lib/dataservice/accountPlan/approval.js#L136) | Resolves Salesforce User identifiers referenced in approval history into display names. | `unwrap`, `runQuery`, `inClause`, `idVariants` |
| [`mappedValueForId` — 160](../src/lib/dataservice/accountPlan/approval.js#L160) | Finds a lookup value under compatible Salesforce ID forms. | `idVariants` |
| [`approvalHistoryPerson` — 163](../src/lib/dataservice/accountPlan/approval.js#L163) | Resolves an approval-history person to a User name or the available raw value. | `mappedValueForId` |
| [`approvalHistoryRequestKey` — 166](../src/lib/dataservice/accountPlan/approval.js#L166) | Groups approval-history lifecycle records into the same displayed minute/request. | — |
| [`approvalHistoryStatusRank` — 175](../src/lib/dataservice/accountPlan/approval.js#L175) | Orders history lifecycle states so Approved supersedes Pending and Submitted. | — |
| [`mergeApprovalHistoryRequests` — 183](../src/lib/dataservice/accountPlan/approval.js#L183) | Combines same-minute lifecycle rows, retains submission identity, and only exposes an actual approver for approved requests. | `approvalHistoryRequestKey`, `approvalHistoryStatusRank` |
| [`fetchMedicalApprovalHistoryRecordTypes` — 219](../src/lib/dataservice/accountPlan/approval.js#L219) | Loads the allowed Medical approval-history RecordType identifiers. | `runQuery`, `inClause`, `unwrap` |
| [`inaccessibleApprovalHistoryField` — 234](../src/lib/dataservice/accountPlan/approval.js#L234) | Identifies an inaccessible optional history field named by an error. | — |
| [`runApprovalHistoryQueryWithFieldFallback` — 246](../src/lib/dataservice/accountPlan/approval.js#L246) | Retries history reads after removing only an inaccessible optional field. | `runQuery`, `inaccessibleApprovalHistoryField` |
| [`fetchApprovalHistoryRowsForRecordType` — 258](../src/lib/dataservice/accountPlan/approval.js#L258) | Reads plan-scoped history rows for one allowed Medical record type. | `buildIdMatchWhere`, `runApprovalHistoryQueryWithFieldFallback` |
| [`crmScalar` — 269](../src/lib/dataservice/accountPlan/approval.js#L269) | Recursively unwraps nested CRM value cells into a scalar. | — |
| [`requiredUserField` — 278](../src/lib/dataservice/accountPlan/approval.js#L278) | Normalizes a User record field to trimmed text for routing validation. | `crmScalar` |
| [`fetchCurrentUserManager` — 280](../src/lib/dataservice/accountPlan/approval.js#L280) | Reads the current User's ManagerId then manager email/name through explicit CRM; rejects incomplete routing data. | `crmScalar`, `getCrmDataForCurrentObject`, `runCrmQuery`, `buildIdMatchWhere`, `requiredUserField`, `unwrap` |
| [`fetchAccountPlanApprovalReview` — 309](../src/lib/dataservice/accountPlan/approval.js#L309) | Reads retained approval-review summary fields and maps them into a review model. | `runQuery`, `buildIdMatchWhere`, `unwrap`, `readableError` |
| [`fetchAccountPlanApprovalHistory` — 337](../src/lib/dataservice/accountPlan/approval.js#L337) | Loads Medical history rows, resolves people, and merges lifecycle rows into displayed requests. | `fetchMedicalApprovalHistoryRecordTypes`, `fetchApprovalHistoryRowsForRecordType`, `unwrap`, `fetchUserNames`, `approvalHistoryStatusRank`, `approvalHistoryPerson`; more in source |
| [`submitMpdApproval` — 384](../src/lib/dataservice/accountPlan/approval.js#L384) | Writes Submitted for Approval plus submitter/manager routing fields and supplemental name/date through live CRM. | `fetchCurrentUserManager`, `updateApprovalRecord`, `readableError` |
| [`approveAccountPlan` — 415](../src/lib/dataservice/accountPlan/approval.js#L415) | Writes Approved and clears submitter/manager/submission routing fields through live CRM. | `updateApprovalRecord`, `readableError` |

Exported aliases/constants assigned to another identifier (no separate function body):

- [`ACCOUNT_PLAN_APPROVAL_STATUS_FIELD`](../src/lib/dataservice/accountPlan/approval.js#L26) → `ACCOUNT_PLAN_MEDICAL_APPROVAL_STATUS_FIELD`. Follow the target's definition/import to see behavior and persistence destination.

## src/lib/dataservice/accountPlan/barrierOpportunityPicklists.js

[Open source](../src/lib/dataservice/accountPlan/barrierOpportunityPicklists.js)

Local dependencies: [titlePicklistMappings.js](../src/lib/dataservice/accountPlan/titlePicklistMappings.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`normalize` — 3](../src/lib/dataservice/accountPlan/barrierOpportunityPicklists.js#L3) | Normalizes configured picklist API-name text for matching. | — |
| [`configuredValueMetadata` — 9](../src/lib/dataservice/accountPlan/barrierOpportunityPicklists.js#L9) | Parses configured API values into their display/indication classification. | — |
| [`picklistOptionsByApiNameIndication` — 37](../src/lib/dataservice/accountPlan/barrierOpportunityPicklists.js#L37) | Groups allowed picklist API values by indications encoded in their API names. | `normalize`, `configuredValueMetadata` |
| [`medicalStrategyPicklistInfoByApiName` — 64](../src/lib/dataservice/accountPlan/barrierOpportunityPicklists.js#L64) | Builds strategy values/labels and indication option groups from configured metadata/API names. | `picklistOptionsByApiNameIndication`, `configuredValueMetadata`, `medicalPicklistLabel` |
| [`configuredPicklistOptions` — 87](../src/lib/dataservice/accountPlan/barrierOpportunityPicklists.js#L87) | Builds allowed choices from available metadata and configured values without silently inventing inactive CRM choices. | `normalize`, `configuredValueMetadata` |
| [`configuredPicklistOptionsByIndication` — 124](../src/lib/dataservice/accountPlan/barrierOpportunityPicklists.js#L124) | Builds per-indication choice groups using configured/available picklist values. | `configuredPicklistOptions` |

## src/lib/dataservice/accountPlan/barriersDrivers.js

[Open source](../src/lib/dataservice/accountPlan/barriersDrivers.js)

Local dependencies: [titlePicklistMappings.js](../src/lib/dataservice/accountPlan/titlePicklistMappings.js), [shared.js](../src/lib/dataservice/accountPlan/shared.js), [dependentPicklists.js](../src/lib/dataservice/accountPlan/dependentPicklists.js), [query.js](../src/lib/dataservice/query.js), [barrierOpportunityPicklists.js](../src/lib/dataservice/accountPlan/barrierOpportunityPicklists.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`isOpenActivity` — 52](../src/lib/dataservice/accountPlan/barriersDrivers.js#L52) | Recognizes the owning module's open/planned/in-progress tactic statuses. | — |
| [`isCompletedActivity` — 55](../src/lib/dataservice/accountPlan/barriersDrivers.js#L55) | Recognizes complete/completed/closed tactics according to the owning module's active-record rules. | — |
| [`mergeWithDataValues` — 60](../src/lib/dataservice/accountPlan/barriersDrivers.js#L60) | Deduplicates nonempty values/options while preserving usable order; inspect the module for its blank/All/current-value policy. | — |
| [`picklistInfoFromLabels` — 71](../src/lib/dataservice/accountPlan/barriersDrivers.js#L71) | Converts supported metadata shapes into API values plus value-to-display-label mapping. | `add` |
| [`add` — 75](../src/lib/dataservice/accountPlan/barriersDrivers.js#L75) | Adds a nonempty API value/display-label pair to the enclosing metadata accumulator without duplicating its value. | — |
| [`valuesFromPicklistLabels` — 107](../src/lib/dataservice/accountPlan/barriersDrivers.js#L107) | Extracts a deduplicated list of API values from supported picklist metadata shapes. | `picklistInfoFromLabels` |
| [`fetchPicklistInfo` — 109](../src/lib/dataservice/accountPlan/barriersDrivers.js#L109) | Loads field metadata and returns values plus labels, or an empty metadata model on failure. | `getPicklistValueLabels` |
| [`fetchPicklistOptions` — 114](../src/lib/dataservice/accountPlan/barriersDrivers.js#L114) | Reads picklist API values for the object/field owned by this module, with an empty-list fallback. | `getPicklistValueLabels` |
| [`visibleIndications` — 119](../src/lib/dataservice/accountPlan/barriersDrivers.js#L119) | Filters indication choices through the current shared visibility policy. | — |
| [`fetchBarrierDriverPicklists` — 122](../src/lib/dataservice/accountPlan/barriersDrivers.js#L122) | Reads parent title/strategy/status metadata and builds configured indication-dependent option maps. | `fetchPicklistOptions`, `fetchPicklistInfo`, `getPicklistValueLabels`, `medicalStrategyPicklistInfoByApiName`, `optionsForControllerValue`, `picklistOptionsByApiNameIndication`; more in source |
| [`strategiesForIndication` — 147](../src/lib/dataservice/accountPlan/barriersDrivers.js#L147) | Selects the strategy options configured for one indication. | `optionsForControllerValue` |
| [`fetchCriticalActivityPicklists` — 185](../src/lib/dataservice/accountPlan/barriersDrivers.js#L185) | Reads tactic status/indication/accountable/title metadata and parent-status options for tactic forms. | `fetchPicklistOptions`, `getPicklistValueLabels`, `buildMedicalTacticOptionsByParentTitle` |
| [`loadBarriersDrivers` — 209](../src/lib/dataservice/accountPlan/barriersDrivers.js#L209) | Loads and joins parent/tactic data plus metadata into the Barriers & Opportunities page payload. | `requireCurrentAccountPlanId`, `resolveShellContextForPlanId`, `fetchBarriersAndDrivers`, `fetchCriticalActivities`, `fetchBarrierDriverPicklists`, `fetchCriticalActivityPicklists`; more in source |

Exported aliases/constants assigned to another identifier (no separate function body):

- [`saveBarrierDriver`](../src/lib/dataservice/accountPlan/barriersDrivers.js#L339) → `updateBarrierDriver`. Follow the target's definition/import to see behavior and persistence destination.
- [`saveBarrierDriverStatus`](../src/lib/dataservice/accountPlan/barriersDrivers.js#L340) → `updateBarrierDriverStatus`. Follow the target's definition/import to see behavior and persistence destination.
- [`addBarrierDriver`](../src/lib/dataservice/accountPlan/barriersDrivers.js#L341) → `createBarrierDriver`. Follow the target's definition/import to see behavior and persistence destination.
- [`saveCriticalActivity`](../src/lib/dataservice/accountPlan/barriersDrivers.js#L342) → `updateCriticalActivity`. Follow the target's definition/import to see behavior and persistence destination.
- [`addCriticalActivity`](../src/lib/dataservice/accountPlan/barriersDrivers.js#L343) → `createCriticalActivity`. Follow the target's definition/import to see behavior and persistence destination.

## src/lib/dataservice/accountPlan/criticalActivities.js

[Open source](../src/lib/dataservice/accountPlan/criticalActivities.js)

Local dependencies: [titlePicklistMappings.js](../src/lib/dataservice/accountPlan/titlePicklistMappings.js), [barriersDrivers.js](../src/lib/dataservice/accountPlan/barriersDrivers.js), [shared.js](../src/lib/dataservice/accountPlan/shared.js), [query.js](../src/lib/dataservice/query.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`mergeWithDataValues` — 36](../src/lib/dataservice/accountPlan/criticalActivities.js#L36) | Deduplicates nonempty values/options while preserving usable order; inspect the module for its blank/All/current-value policy. | — |
| [`valuesFromPicklistLabels` — 47](../src/lib/dataservice/accountPlan/criticalActivities.js#L47) | Extracts a deduplicated list of API values from supported picklist metadata shapes. | `mergeWithDataValues` |
| [`fetchActivityPicklistOptions` — 64](../src/lib/dataservice/accountPlan/criticalActivities.js#L64) | Reads picklist API values for the object/field owned by this module, with an empty-list fallback. | `getPicklistValueLabels` |
| [`fetchBarrierDriverStatusPicklistOptions` — 69](../src/lib/dataservice/accountPlan/criticalActivities.js#L69) | Reads picklist API values for the object/field owned by this module, with an empty-list fallback. | `getPicklistValueLabels` |
| [`visibleIndications` — 74](../src/lib/dataservice/accountPlan/criticalActivities.js#L74) | Filters indication choices through the current shared visibility policy. | — |
| [`fetchCriticalActivityPicklists` — 77](../src/lib/dataservice/accountPlan/criticalActivities.js#L77) | Reads tactic status/indication/accountable/title metadata and parent-status options for tactic forms. | `fetchActivityPicklistOptions`, `fetchBarrierDriverStatusPicklistOptions`, `getPicklistValueLabels`, `buildMedicalTacticOptionsByParentTitle` |
| [`isOpen` — 100](../src/lib/dataservice/accountPlan/criticalActivities.js#L100) | Recognizes the owning module's open/planned/in-progress tactic statuses. | — |
| [`isCompleted` — 103](../src/lib/dataservice/accountPlan/criticalActivities.js#L103) | Recognizes complete/completed/closed tactics according to the owning module's active-record rules. | — |
| [`loadCriticalActivities` — 106](../src/lib/dataservice/accountPlan/criticalActivities.js#L106) | Loads all plan tactics and parent choices, enriches linkage/legacy policy, and builds open/completed sections. | `requireCurrentAccountPlanId`, `resolveShellContextForPlanId`, `fetchCriticalActivities`, `fetchBarriersAndDrivers`, `fetchCriticalActivityPicklists`, `fetchBarrierDriverPicklists`; more in source |

Exported aliases/constants assigned to another identifier (no separate function body):

- [`saveCriticalActivity`](../src/lib/dataservice/accountPlan/criticalActivities.js#L190) → `updateCriticalActivity`. Follow the target's definition/import to see behavior and persistence destination.
- [`addCriticalActivity`](../src/lib/dataservice/accountPlan/criticalActivities.js#L191) → `createCriticalActivity`. Follow the target's definition/import to see behavior and persistence destination.
- [`saveBarrierDriverStatus`](../src/lib/dataservice/accountPlan/criticalActivities.js#L192) → `updateBarrierDriverStatus`. Follow the target's definition/import to see behavior and persistence destination.

## src/lib/dataservice/accountPlan/dependentPicklists.js

[Open source](../src/lib/dataservice/accountPlan/dependentPicklists.js)

Local dependencies: [query.js](../src/lib/dataservice/query.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`unwrapMetadataPayload` — 10](../src/lib/dataservice/accountPlan/dependentPicklists.js#L10) | Selects the object metadata payload from supported wrapper shapes. | — |
| [`normalizeKey` — 15](../src/lib/dataservice/accountPlan/dependentPicklists.js#L15) | Normalizes metadata names for compatible field/controller matching. | — |
| [`metadataFieldName` — 17](../src/lib/dataservice/accountPlan/dependentPicklists.js#L17) | Extracts a field API name from a metadata field entry. | — |
| [`findFieldMetadata` — 25](../src/lib/dataservice/accountPlan/dependentPicklists.js#L25) | Finds the requested field definition across supported metadata shapes. | `metadataFieldName` |
| [`logFieldMetadataProbe` — 49](../src/lib/dataservice/accountPlan/dependentPicklists.js#L49) | Records object-metadata dependency inspection diagnostics. | `unwrapMetadataPayload`, `findFieldMetadata` |
| [`normalizeEntryList` — 65](../src/lib/dataservice/accountPlan/dependentPicklists.js#L65) | Turns supported metadata entry containers into a uniform list. | — |
| [`picklistEntries` — 75](../src/lib/dataservice/accountPlan/dependentPicklists.js#L75) | Extracts a field's picklist entry list. | `normalizeEntryList` |
| [`entryValue` — 91](../src/lib/dataservice/accountPlan/dependentPicklists.js#L91) | Reads the API value from a metadata picklist entry. | — |
| [`entryValidFor` — 106](../src/lib/dataservice/accountPlan/dependentPicklists.js#L106) | Extracts the dependent option's validFor/controller eligibility information. | — |
| [`controllerValuesFromMetadata` — 111](../src/lib/dataservice/accountPlan/dependentPicklists.js#L111) | Builds the controller-value-to-index mapping needed by dependent picklists. | `picklistEntries`, `entryValue` |
| [`decodeBase64Bytes` — 124](../src/lib/dataservice/accountPlan/dependentPicklists.js#L124) | Decodes Salesforce validFor base64 into bytes for dependency checks. | — |
| [`validForIncludesIndex` — 138](../src/lib/dataservice/accountPlan/dependentPicklists.js#L138) | Tests whether a dependency bitset includes the selected controller index. | `decodeBase64Bytes` |
| [`validForAllowsController` — 147](../src/lib/dataservice/accountPlan/dependentPicklists.js#L147) | Interprets supported validFor formats to decide whether a dependent option is allowed. | `normalizeKey`, `validForIncludesIndex` |
| [`dependencyOptionsFromMetadata` — 172](../src/lib/dataservice/accountPlan/dependentPicklists.js#L172) | Builds allowed dependent values per controller using metadata/controller indices. | `unwrapMetadataPayload`, `findFieldMetadata`, `picklistEntries`, `controllerValuesFromMetadata`, `entryValue`, `entryValidFor`; more in source |
| [`optionsForControllerValue` — 211](../src/lib/dataservice/accountPlan/dependentPicklists.js#L211) | Finds the option list for a controller value with supported normalized matching. | `normalizeKey` |
| [`fetchDependencyOptionsFromObjectMetadata` — 219](../src/lib/dataservice/accountPlan/dependentPicklists.js#L219) | Fetches object metadata and derives dependent option maps, retaining diagnostic/fallback behavior. | `getObjectMetadata`, `logFieldMetadataProbe`, `dependencyOptionsFromMetadata` |

## src/lib/dataservice/accountPlan/errorMessages.js

[Open source](../src/lib/dataservice/accountPlan/errorMessages.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`normalizeErrorForDisplay` — 3](../src/lib/dataservice/accountPlan/errorMessages.js#L3) | Extracts readable text from varied nested service error shapes. | — |
| [`exactErrorText` — 37](../src/lib/dataservice/accountPlan/errorMessages.js#L37) | Selects exact error text without losing the underlying Salesforce message. | `normalizeErrorForDisplay` |
| [`primaryErrorMessage` — 46](../src/lib/dataservice/accountPlan/errorMessages.js#L46) | Chooses the main error message from the normalized error representation. | — |
| [`formatCriticalActivitySaveError` — 56](../src/lib/dataservice/accountPlan/errorMessages.js#L56) | Formats a tactic/linked-create save error, retaining useful underlying cause information. | `primaryErrorMessage`, `exactErrorText` |

## src/lib/dataservice/accountPlan/home.js

[Open source](../src/lib/dataservice/accountPlan/home.js)

Local dependencies: [titlePicklistMappings.js](../src/lib/dataservice/accountPlan/titlePicklistMappings.js), [shared.js](../src/lib/dataservice/accountPlan/shared.js), [dependentPicklists.js](../src/lib/dataservice/accountPlan/dependentPicklists.js), [query.js](../src/lib/dataservice/query.js), [barrierOpportunityPicklists.js](../src/lib/dataservice/accountPlan/barrierOpportunityPicklists.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`mergeUnique` — 66](../src/lib/dataservice/accountPlan/home.js#L66) | Deduplicates nonempty values/options while preserving usable order; inspect the module for its blank/All/current-value policy. | — |
| [`picklistInfoFromLabels` — 79](../src/lib/dataservice/accountPlan/home.js#L79) | Converts supported metadata shapes into API values plus value-to-display-label mapping. | `add` |
| [`add` — 83](../src/lib/dataservice/accountPlan/home.js#L83) | Adds a nonempty API value/display-label pair to the enclosing metadata accumulator without duplicating its value. | — |
| [`valuesFromPicklistLabels` — 113](../src/lib/dataservice/accountPlan/home.js#L113) | Extracts a deduplicated list of API values from supported picklist metadata shapes. | `picklistInfoFromLabels` |
| [`fetchPicklistInfo` — 115](../src/lib/dataservice/accountPlan/home.js#L115) | Loads field metadata and returns values plus labels, or an empty metadata model on failure. | `getPicklistValueLabels` |
| [`fetchPicklistOptions` — 120](../src/lib/dataservice/accountPlan/home.js#L120) | Reads picklist API values for the object/field owned by this module, with an empty-list fallback. | `getPicklistValueLabels` |
| [`visibleIndications` — 126](../src/lib/dataservice/accountPlan/home.js#L126) | Filters indication choices through the current shared visibility policy. | — |
| [`fetchHomePicklists` — 129](../src/lib/dataservice/accountPlan/home.js#L129) | Reads the title/status/strategy/accountable/member metadata needed by Home's editors and summaries. | `fetchPicklistOptions`, `fetchPicklistInfo`, `getPicklistValueLabels`, `medicalStrategyPicklistInfoByApiName`, `optionsForControllerValue`, `picklistOptionsByApiNameIndication`; more in source |
| [`strategiesForIndication` — 166](../src/lib/dataservice/accountPlan/home.js#L166) | Selects the strategy options configured for one indication. | `optionsForControllerValue` |
| [`loadHome` — 212](../src/lib/dataservice/accountPlan/home.js#L212) | Loads shell/header, parents, tactics, members, and picklists together; maps/enriches them into Home's payload. | `requireCurrentAccountPlanId`, `resolveShellContextForPlanId`, `fetchHeaderFields`, `fetchBarriersAndDrivers`, `fetchCriticalActivities`, `fetchTeamMembersByPlan`; more in source |

Exported aliases/constants assigned to another identifier (no separate function body):

- [`saveCustomerGoals`](../src/lib/dataservice/accountPlan/home.js#L338) → `updateCustomerGoals`. Follow the target's definition/import to see behavior and persistence destination.
- [`saveBarrierDriver`](../src/lib/dataservice/accountPlan/home.js#L339) → `updateBarrierDriver`. Follow the target's definition/import to see behavior and persistence destination.
- [`saveBarrierDriverStatus`](../src/lib/dataservice/accountPlan/home.js#L340) → `updateBarrierDriverStatus`. Follow the target's definition/import to see behavior and persistence destination.
- [`addBarrierDriver`](../src/lib/dataservice/accountPlan/home.js#L341) → `createBarrierDriver`. Follow the target's definition/import to see behavior and persistence destination.
- [`saveCriticalActivity`](../src/lib/dataservice/accountPlan/home.js#L342) → `updateCriticalActivity`. Follow the target's definition/import to see behavior and persistence destination.
- [`addCriticalActivity`](../src/lib/dataservice/accountPlan/home.js#L343) → `createCriticalActivity`. Follow the target's definition/import to see behavior and persistence destination.

## src/lib/dataservice/accountPlan/shared.js

[Open source](../src/lib/dataservice/accountPlan/shared.js)

Local dependencies: [query.js](../src/lib/dataservice/query.js), [client.js](../src/lib/dataservice/client.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`isMedicalLegacyStrategy` — 40](../src/lib/dataservice/accountPlan/shared.js#L40) | Treats an empty or dash-placeholder strategy as legacy/missing Medical Strategy. | `fieldValue` |
| [`medicalLegacyEditState` — 47](../src/lib/dataservice/accountPlan/shared.js#L47) | Returns legacy for a Barrier without Medical Strategy and current otherwise. | — |
| [`sameRecordId` — 50](../src/lib/dataservice/accountPlan/shared.js#L50) | Matches records across supported 15-/18-character Salesforce ID forms. | `toCanonicalSalesforceId` |
| [`readBarrierLegacyEditState` — 58](../src/lib/dataservice/accountPlan/shared.js#L58) | Rereads parent record type/strategy and verifies identity before allowing historical-record edits. | `buildIdMatchWhere`, `fetchBarrierDriverRecordTypeIds`, `runQuery`, `unwrap`, `sameRecordId`, `fieldValue`; more in source |
| [`readMedicalLegacyEditState` — 82](../src/lib/dataservice/accountPlan/shared.js#L82) | Checks a parent directly or follows a tactic's parent to determine whether the legacy lock applies. | `readBarrierLegacyEditState`, `buildIdMatchWhere`, `runQuery`, `unwrap`, `sameRecordId`, `fieldValue`; more in source |
| [`toBooleanFlag` — 114](../src/lib/dataservice/accountPlan/shared.js#L114) | Normalizes the boolean-like forms accepted by this helper's caller. | `fieldValue` |
| [`isLikelySalesforceId` — 176](../src/lib/dataservice/accountPlan/shared.js#L176) | Checks whether a value has the 15- or 18-character Salesforce ID shape. | — |
| [`tryWindowGlobal` — 179](../src/lib/dataservice/accountPlan/shared.js#L179) | Safely reads a nested window configuration path. | — |
| [`readHtmlConfigRecordId` — 194](../src/lib/dataservice/accountPlan/shared.js#L194) | Looks for a Salesforce plan/context ID in embedded HTML/runtime configuration. | `tryWindowGlobal`, `isLikelySalesforceId` |
| [`extractIdFromUrl` — 229](../src/lib/dataservice/accountPlan/shared.js#L229) | Extracts a Salesforce-shaped record identifier from recognized URL forms. | `isLikelySalesforceId` |
| [`readUrlAndReferrerRecordId` — 246](../src/lib/dataservice/accountPlan/shared.js#L246) | Tries current, parent/top, and referrer URL context to recover a plan identifier. | `extractIdFromUrl` |
| [`readCurrentAccountPlanIdOverride` — 265](../src/lib/dataservice/accountPlan/shared.js#L265) | Reads the plan selection override from window/session state. | `isLikelySalesforceId` |
| [`setCurrentAccountPlanIdOverride` — 274](../src/lib/dataservice/accountPlan/shared.js#L274) | Stores a plan selection override and clears related context request tracking. | `isLikelySalesforceId`, `bindAccountPlanDataContext` |
| [`resolveCurrentAccountPlanId` — 304](../src/lib/dataservice/accountPlan/shared.js#L304) | Tries Veeva AccountPlan aliases, embedded configuration, URLs, then a plan lookup for the current Account. | `hasVeevaRuntime`, `isLikelySalesforceId`, `readHtmlConfigRecordId`, `readUrlAndReferrerRecordId`, `buildIdMatchWhere`, `unwrap` |
| [`getCurrentAccountPlanId` — 340](../src/lib/dataservice/accountPlan/shared.js#L340) | Uses a selected-plan override or coalesced context resolution and binds mock plan context when applicable. | `readCurrentAccountPlanIdOverride`, `isLikelySalesforceId`, `bindAccountPlanDataContext`, `resolveCurrentAccountPlanId` |
| [`getCurrentUserId` — 362](../src/lib/dataservice/accountPlan/shared.js#L362) | Reads the signed-in User identifier from runtime context. | `getDataForCurrentObject` |
| [`getCurrentUserProfileName` — 369](../src/lib/dataservice/accountPlan/shared.js#L369) | Tries supported User profile-name context fields for UI access checks. | `getDataForCurrentObject` |
| [`getCurrentUserName` — 377](../src/lib/dataservice/accountPlan/shared.js#L377) | Reads the current User name directly or resolves it from the User ID. | `getDataForCurrentObject`, `getCurrentUserId`, `buildIdMatchWhere`, `runQuery`, `unwrap` |
| [`isInaccessibleFieldQueryError` — 396](../src/lib/dataservice/accountPlan/shared.js#L396) | Recognizes field-access/schema errors eligible for narrower read retries. | — |
| [`fetchAccessiblePlanFields` — 408](../src/lib/dataservice/accountPlan/shared.js#L408) | Reads available fields, reducing/retrying field groups after eligible access errors so other data can still load. | `unwrap` |
| [`fetchPlan` — 434](../src/lib/dataservice/accountPlan/shared.js#L434) | Reads the root Account Plan and merges available fields from the appropriate runtime channels. | `buildIdMatchWhere`, `hasVeevaRuntime`, `unwrap`, `fetchAccessiblePlanFields` |
| [`fetchPlanApprovalStatus` — 469](../src/lib/dataservice/accountPlan/shared.js#L469) | Reads the plan's small approval/status snapshot for shell refresh and polling. | `getCurrentAccountPlanId`, `buildIdMatchWhere`, `runQuery`, `unwrap`, `toBooleanFlag` |
| [`toPlanShape` — 493](../src/lib/dataservice/accountPlan/shared.js#L493) | Maps raw Account Plan fields to the shell's plan model. | `toBooleanFlag` |
| [`fetchAccountHeaderFields` — 508](../src/lib/dataservice/accountPlan/shared.js#L508) | Reads optional Account header information, including MM ATC Priority, separately from required Account fields. | `buildIdMatchWhere`, `hasVeevaRuntime`, `unwrap` |
| [`fetchAccessibleAccountFields` — 536](../src/lib/dataservice/accountPlan/shared.js#L536) | Reads available fields, reducing/retrying field groups after eligible access errors so other data can still load. | `unwrap` |
| [`fetchAccount` — 560](../src/lib/dataservice/accountPlan/shared.js#L560) | Reads the parent Account and assembles its shell/header model. | `buildIdMatchWhere`, `hasVeevaRuntime`, `fetchAccessibleAccountFields`, `fetchAccountHeaderFields`, `unwrap` |
| [`quoteSoqlValue` — 592](../src/lib/dataservice/accountPlan/shared.js#L592) | Quotes and escapes a text value for a query predicate. | — |
| [`accountLookupSearchTerm` — 594](../src/lib/dataservice/accountPlan/shared.js#L594) | Trims and normalizes spacing in a site-account search term. | — |
| [`titleCaseSearchTerm` — 596](../src/lib/dataservice/accountPlan/shared.js#L596) | Builds a title-cased search variant for runtime query compatibility. | `accountLookupSearchTerm` |
| [`accountLookupSearchVariants` — 601](../src/lib/dataservice/accountPlan/shared.js#L601) | Builds distinct case/spacing variants used by account lookup searches. | `accountLookupSearchTerm`, `titleCaseSearchTerm` |
| [`accountLookupSiteWhere` — 607](../src/lib/dataservice/accountPlan/shared.js#L607) | Builds the classification predicate for eligible site Accounts. | `quoteSoqlValue` |
| [`accountLookupWhere` — 610](../src/lib/dataservice/accountPlan/shared.js#L610) | Combines account-site eligibility and user-entered text matching. | `accountLookupSearchVariants`, `accountLookupSiteWhere`, `quoteSoqlValue` |
| [`accountMatchesLookupTerm` — 634](../src/lib/dataservice/accountPlan/shared.js#L634) | Applies the site-account lookup's text match to returned rows. | `accountLookupSearchTerm` |
| [`toAccountLookupOption` — 640](../src/lib/dataservice/accountPlan/shared.js#L640) | Maps an Account row to the identifier, label, and metadata shown by lookup controls. | `unwrap` |
| [`fetchSiteAccountRows` — 657](../src/lib/dataservice/accountPlan/shared.js#L657) | Executes an account lookup query and retries eligible field-access failures with a narrower field set. | `hasVeevaRuntime`, `isOnline` |
| [`searchSiteAccounts` — 671](../src/lib/dataservice/accountPlan/shared.js#L671) | Searches eligible site Accounts and returns deduplicated lookup choices. | `hasVeevaRuntime`, `accountLookupWhere`, `fetchSiteAccountRows`, `accountMatchesLookupTerm` |
| [`accountNameWhere` — 694](../src/lib/dataservice/accountPlan/shared.js#L694) | Builds Account name predicates for stakeholder lookup. | `accountLookupSearchVariants`, `quoteSoqlValue` |
| [`fetchStakeholderAccountRows` — 703](../src/lib/dataservice/accountPlan/shared.js#L703) | Executes an account lookup query and retries eligible field-access failures with a narrower field set. | `hasVeevaRuntime`, `isOnline` |
| [`searchStakeholderAccounts` — 729](../src/lib/dataservice/accountPlan/shared.js#L729) | Searches stakeholder/person Accounts using the runtime-appropriate query channel. | `hasVeevaRuntime`, `accountNameWhere`, `fetchStakeholderAccountRows`, `accountMatchesLookupTerm`, `fetchAccountNameLookup`, `accountNameFromLookup` |
| [`normalizeUserLookupId` — 763](../src/lib/dataservice/accountPlan/shared.js#L763) | Normalizes User IDs for duplicate detection across Salesforce ID formats. | `toCanonicalSalesforceId` |
| [`userLookupExcludedIdSet` — 770](../src/lib/dataservice/accountPlan/shared.js#L770) | Builds the normalized set of User IDs to omit from lookup results. | — |
| [`userLookupExclusionWhere` — 777](../src/lib/dataservice/accountPlan/shared.js#L777) | Builds query exclusions for Users already assigned to the plan. | `salesforceIdVariants`, `quoteSoqlValue` |
| [`userLookupWhere` — 792](../src/lib/dataservice/accountPlan/shared.js#L792) | Combines active-user, search-term, and duplicate-exclusion predicates. | `accountLookupSearchVariants`, `quoteSoqlValue`, `userLookupExclusionWhere` |
| [`userMatchesLookupTerm` — 803](../src/lib/dataservice/accountPlan/shared.js#L803) | Checks a returned User against the lookup text. | `accountLookupSearchTerm` |
| [`toUserLookupOption` — 809](../src/lib/dataservice/accountPlan/shared.js#L809) | Maps a User record into a name/identifier lookup choice. | `unwrap` |
| [`searchUsers` — 818](../src/lib/dataservice/accountPlan/shared.js#L818) | Searches eligible Users, excluding existing members, and returns normalized lookup choices. | `userLookupExcludedIdSet`, `runCrmQuery`, `userLookupWhere`, `userMatchesLookupTerm`, `normalizeUserLookupId` |
| [`missingAccountPlanContextError` — 842](../src/lib/dataservice/accountPlan/shared.js#L842) | Constructs the specific no-plan-in-context error handled by the application shell. | — |
| [`requireCurrentAccountPlanId` — 845](../src/lib/dataservice/accountPlan/shared.js#L845) | Resolves the active plan identifier and throws when context cannot be established. | `getCurrentAccountPlanId`, `missingAccountPlanContextError` |
| [`shellContextKey` — 851](../src/lib/dataservice/accountPlan/shared.js#L851) | Builds a request identity from plan ID and requested plan fields. | `toCanonicalSalesforceId` |
| [`buildShellContextForPlanId` — 861](../src/lib/dataservice/accountPlan/shared.js#L861) | Fetches/maps the Account Plan and parent Account into shared shell context. | `missingAccountPlanContextError`, `fetchPlan`, `toPlanShape`, `fetchAccount`, `toCanonicalSalesforceId` |
| [`resolveShellContextForPlanId` — 873](../src/lib/dataservice/accountPlan/shared.js#L873) | Coalesces matching in-flight shell-context loads and returns plan/account context. | `missingAccountPlanContextError`, `shellContextKey`, `buildShellContextForPlanId` |
| [`resolveShellContext` — 892](../src/lib/dataservice/accountPlan/shared.js#L892) | Resolves the current plan before loading its shell context. | `resolveShellContextForPlanId`, `requireCurrentAccountPlanId` |
| [`toCustomerGoals` — 900](../src/lib/dataservice/accountPlan/shared.js#L900) | Extracts customer-goal text from the configured Account Plan field; retained service support. | — |
| [`updateCustomerGoals` — 903](../src/lib/dataservice/accountPlan/shared.js#L903) | Writes customer-goal text to the configured Account Plan field; no current standalone Home editor. | `updateRecord` |
| [`fetchHeaderFields` — 922](../src/lib/dataservice/accountPlan/shared.js#L922) | Loads Ecosystem Plan header fields for Home and returns header/profile context. | `buildIdMatchWhere`, `runQuery`, `unwrap` |
| [`fetchBarrierDriverRecordTypeIds` — 953](../src/lib/dataservice/accountPlan/shared.js#L953) | Loads active Medical parent RecordType rows and establishes Barrier/Opportunity type IDs. | `runQuery`, `unwrap`, `criticalActivityTypeFromRecordType`, `fieldValue`, `normalizeRecordTypeId` |
| [`barrierDriverStatusKey` — 998](../src/lib/dataservice/accountPlan/shared.js#L998) | Normalizes a status input for comparisons; inspect the source signature because some versions accept a record and others a raw status. | — |
| [`barrierDriverStatusRank` — 1005](../src/lib/dataservice/accountPlan/shared.js#L1005) | Assigns lifecycle order to a parent status for sorting. | `normalizeBarrierDriverStatusForDisplay` |
| [`isClosedBarrierDriverStatus` — 1011](../src/lib/dataservice/accountPlan/shared.js#L1011) | Recognizes closed parent status variants supported by this module. | `normalizeBarrierDriverStatusForDisplay` |
| [`isOpenBarrierDriverStatus` — 1014](../src/lib/dataservice/accountPlan/shared.js#L1014) | Checks whether a parent status is open according to the shared lifecycle rules. | `isClosedBarrierDriverStatus` |
| [`barrierDriverUsesStrategy` — 1017](../src/lib/dataservice/accountPlan/shared.js#L1017) | Determines whether the selected indication uses Medical Strategy. | — |
| [`isMmIndication` — 1023](../src/lib/dataservice/accountPlan/shared.js#L1023) | Recognizes the MM indication regardless of casing/spacing. | — |
| [`isBarrierDriverIndicationAllowedForType` — 1028](../src/lib/dataservice/accountPlan/shared.js#L1028) | Currently returns true: the older indication restriction is disabled. | — |
| [`filterBarrierDriverIndicationsForType` — 1030](../src/lib/dataservice/accountPlan/shared.js#L1030) | Deduplicates supported indication choices and retains the current choice; the current type restriction permits all. | `isBarrierDriverIndicationAllowedForType` |
| [`isVisibleBarrierDriverIndication` — 1044](../src/lib/dataservice/accountPlan/shared.js#L1044) | Currently returns true: the older indication restriction is disabled. | — |
| [`normalizeRecordTypeId` — 1046](../src/lib/dataservice/accountPlan/shared.js#L1046) | Normalizes a RecordType ID for type lookup. | `toCanonicalSalesforceId` |
| [`barrierDriverRecordTypeId` — 1051](../src/lib/dataservice/accountPlan/shared.js#L1051) | Gets the configured/discovered RecordType ID for Barrier or Opportunity. | — |
| [`typeFromBarrierDriverRecordTypeId` — 1054](../src/lib/dataservice/accountPlan/shared.js#L1054) | Maps a Medical parent RecordType ID to Barrier or internal Driver. | `normalizeRecordTypeId` |
| [`categoryPrefix` — 1086](../src/lib/dataservice/accountPlan/shared.js#L1086) | Extracts the display prefix from a category value. | — |
| [`barrierDriverFieldAccess` — 1092](../src/lib/dataservice/accountPlan/shared.js#L1092) | Builds capability information from the fields successfully fetched for this record type. | — |
| [`normalizeBarrierDriverStatusForDisplay` — 1096](../src/lib/dataservice/accountPlan/shared.js#L1096) | Maps stored parent status into the user-facing status wording. | `barrierDriverStatusKey` |
| [`normalizeBarrierDriverStatusForSave` — 1108](../src/lib/dataservice/accountPlan/shared.js#L1108) | Maps the displayed parent status into its stored CRM value. | `normalizeBarrierDriverStatusForDisplay` |
| [`picklistLabelForValue` — 1116](../src/lib/dataservice/accountPlan/shared.js#L1116) | Looks up a display label while retaining a usable value fallback. | — |
| [`toBarrierDriver` — 1121](../src/lib/dataservice/accountPlan/shared.js#L1121) | Unwraps a Medical parent record, resolves its type/title/strategy, and attaches edit/capability information. | `barrierDriverFieldAccess`, `unwrap`, `typeFromBarrierDriverRecordTypeId`, `barrierDriverUsesStrategy`, `fieldValue`, `medicalLegacyEditState`; more in source |
| [`fetchBarrierDriverRows` — 1164](../src/lib/dataservice/accountPlan/shared.js#L1164) | Reads raw domain rows and retries only eligible optional-field access failures. | `runQuery`, `inaccessibleFieldFromError` |
| [`fetchBarriersAndDrivers` — 1181](../src/lib/dataservice/accountPlan/shared.js#L1181) | Loads parent record types and plan-scoped parent rows plus field-access capability information. | `buildIdMatchWhere`, `barrierDriverFieldAccess`, `fetchBarrierDriverRecordTypeIds`, `fetchBarrierDriverRows` |
| [`buildBarrierDriverWriteFields` — 1190](../src/lib/dataservice/accountPlan/shared.js#L1190) | Builds the exact Medical parent payload: RecordType, titles, indication, stored status, strategy, and comments. | `barrierDriverUsesStrategy`, `barrierDriverRecordTypeId`, `normalizeBarrierDriverStatusForSave` |
| [`responseValue` — 1217](../src/lib/dataservice/accountPlan/shared.js#L1217) | Extracts one CRM cell's value, retaining a scalar input unchanged. | — |
| [`createdRecordIdFromWriteResult` — 1220](../src/lib/dataservice/accountPlan/shared.js#L1220) | Finds a persisted record ID across supported nested create-response shapes. | `responseValue` |
| [`retryBarrierDriverWriteWithoutOptional` — 1253](../src/lib/dataservice/accountPlan/shared.js#L1253) | Retries a failed write only when an inaccessible optional field can be omitted; required fields/errors still fail. | `inaccessibleFieldFromError` |
| [`cascadeIndicationToLinkedActivities` — 1276](../src/lib/dataservice/accountPlan/shared.js#L1276) | Updates linked tactics whose indication differs from the saved parent; logs cascade failure without undoing the parent write. | `criticalActivityParentLookupFieldFor`, `buildIdMatchWhere`, `runQuery`, `fieldValue`, `updateRecord` |
| [`updateBarrierDriver` — 1308](../src/lib/dataservice/accountPlan/shared.js#L1308) | Verifies legacy edit access, writes the parent payload, and optionally cascades a changed indication to linked tactics. | `readMedicalLegacyEditState`, `buildBarrierDriverWriteFields`, `retryBarrierDriverWriteWithoutOptional`, `updateRecord`, `cascadeIndicationToLinkedActivities` |
| [`updateBarrierDriverStatus` — 1334](../src/lib/dataservice/accountPlan/shared.js#L1334) | Verifies edit access and writes only the parent's stored lifecycle status. | `readMedicalLegacyEditState`, `normalizeBarrierDriverStatusForSave`, `updateRecord` |
| [`createBarrierDriver` — 1352](../src/lib/dataservice/accountPlan/shared.js#L1352) | Loads parent record types and creates a Medical parent linked to the Account Plan. | `fetchBarrierDriverRecordTypeIds`, `buildBarrierDriverWriteFields`, `retryBarrierDriverWriteWithoutOptional`, `createRecord` |
| [`aggregateStrategies` — 1363](../src/lib/dataservice/accountPlan/shared.js#L1363) | Collects unique Medical Strategies from open parent records, grouped by indication. | `unwrap`, `barrierDriverUsesStrategy`, `fieldValue`, `picklistLabelForValue`, `isClosedBarrierDriverStatus` |
| [`escapeSoqlString` — 1429](../src/lib/dataservice/accountPlan/shared.js#L1429) | Escapes apostrophes in text used in a SOQL/VQL literal. | — |
| [`truncateCriticalActivityTitle` — 1431](../src/lib/dataservice/accountPlan/shared.js#L1431) | Applies the configured maximum length to the stored tactic title. | — |
| [`buildAnyIdMatchWhere` — 1434](../src/lib/dataservice/accountPlan/shared.js#L1434) | Builds a predicate matching multiple IDs and their compatible Salesforce forms. | `salesforceIdVariants`, `escapeSoqlString` |
| [`salesforceIdLookupKeys` — 1451](../src/lib/dataservice/accountPlan/shared.js#L1451) | Produces compatible record-ID keys for cross-runtime lookups. | `salesforceIdVariants` |
| [`createSalesforceIdLookup` — 1459](../src/lib/dataservice/accountPlan/shared.js#L1459) | Indexes mapped records by their compatible Salesforce ID forms. | `salesforceIdLookupKeys` |
| [`getSalesforceIdLookupEntry` — 1470](../src/lib/dataservice/accountPlan/shared.js#L1470) | Finds a record in that index using an available ID variant. | `salesforceIdLookupKeys` |
| [`lookupUserNamesById` — 1479](../src/lib/dataservice/accountPlan/shared.js#L1479) | Batch-reads User names for referenced creator/owner IDs used in tactic models. | `buildAnyIdMatchWhere`, `runQuery`, `unwrap`, `salesforceIdVariants` |
| [`isTruthy` — 1507](../src/lib/dataservice/accountPlan/shared.js#L1507) | Normalizes the boolean-like forms accepted by this helper's caller. | — |
| [`unwrapLookupCell` — 1513](../src/lib/dataservice/accountPlan/shared.js#L1513) | Unwraps nested lookup-value cells with a depth guard. | — |
| [`lookupIdValue` — 1521](../src/lib/dataservice/accountPlan/shared.js#L1521) | Extracts an identifier from scalar or structured lookup values. | `unwrapLookupCell` |
| [`stringifyError` — 1535](../src/lib/dataservice/accountPlan/shared.js#L1535) | Extracts useful error text from varied bridge rejection shapes. | — |
| [`inaccessibleFieldFromError` — 1547](../src/lib/dataservice/accountPlan/shared.js#L1547) | Finds the field API name named in an inaccessible-field/schema error. | `stringifyError` |
| [`canRetryWithoutField` — 1560](../src/lib/dataservice/accountPlan/shared.js#L1560) | Checks whether a rejected optional field can be removed from a fetch field list. | — |
| [`activityFieldAccess` — 1563](../src/lib/dataservice/accountPlan/shared.js#L1563) | Builds capability information from the fields successfully fetched for this record type. | — |
| [`toActivity` — 1567](../src/lib/dataservice/accountPlan/shared.js#L1567) | Maps a raw Medical Tactic into UI title/detail/status/accountable/date/parent/capability properties. | `activityFieldAccess`, `unwrap`, `lookupIdValue`, `truncateCriticalActivityTitle`, `fieldValue`, `relationshipName` |
| [`applyMedicalLegacyParentPolicy` — 1597](../src/lib/dataservice/accountPlan/shared.js#L1597) | Propagates a linked legacy Barrier's edit lock to its tactic model. | — |
| [`fetchCriticalActivityRows` — 1620](../src/lib/dataservice/accountPlan/shared.js#L1620) | Reads raw domain rows and retries only eligible optional-field access failures. | `runQuery`, `inaccessibleFieldFromError`, `canRetryWithoutField` |
| [`fetchCriticalActivities` — 1637](../src/lib/dataservice/accountPlan/shared.js#L1637) | Reads active plan tactics, resolves referenced User names, and maps rows into UI activities. | `buildIdMatchWhere`, `fetchCriticalActivityRows`, `activityFieldAccess`, `unwrap`, `lookupUserNamesById`, `toActivity` |
| [`normalizedActivityStatus` — 1654](../src/lib/dataservice/accountPlan/shared.js#L1654) | Converts the displayed Completed label to stored Complete and applies the planned-status default. | — |
| [`normalizedCriticalActivityTitle` — 1657](../src/lib/dataservice/accountPlan/shared.js#L1657) | Trims the tactic title before validation/persistence. | — |
| [`validateCriticalActivityTitle` — 1659](../src/lib/dataservice/accountPlan/shared.js#L1659) | Requires an acceptable tactic title within the configured CRM picklist length. | `normalizedCriticalActivityTitle` |
| [`validateCriticalActivityDueDate` — 1669](../src/lib/dataservice/accountPlan/shared.js#L1669) | Requires a due date for a tactic write. | — |
| [`recordIdForSoftDelete` — 1675](../src/lib/dataservice/accountPlan/shared.js#L1675) | Normalizes the target ID used by soft-delete updates. | `isOnline`, `toCanonicalSalesforceId` |
| [`collectNotFoundSignals` — 1681](../src/lib/dataservice/accountPlan/shared.js#L1681) | Recursively collects error signals used to recognize a desktop missing-record response. | — |
| [`isDesktopSoftDeleteNotFoundError` — 1711](../src/lib/dataservice/accountPlan/shared.js#L1711) | Recognizes a missing-record condition eligible for alternate-ID soft-delete retry. | `isOnline`, `collectNotFoundSignals` |
| [`softDeleteRecord` — 1721](../src/lib/dataservice/accountPlan/shared.js#L1721) | Updates the domain soft-delete flag, with runtime-specific ID retry handling. | `recordIdForSoftDelete`, `updateRecord`, `isDesktopSoftDeleteNotFoundError` |
| [`retryWriteWithoutInaccessibleOptionalField` — 1736](../src/lib/dataservice/accountPlan/shared.js#L1736) | Retries a failed write only when an inaccessible optional field can be omitted; required fields/errors still fail. | `inaccessibleFieldFromError` |
| [`hasExplicitCriticalActivityParent` — 1751](../src/lib/dataservice/accountPlan/shared.js#L1751) | Checks whether a tactic form explicitly supplies parent linkage information. | — |
| [`criticalActivityParentId` — 1758](../src/lib/dataservice/accountPlan/shared.js#L1758) | Selects the tactic's parent ID from supported form/model aliases. | — |
| [`explicitCriticalActivityParentType` — 1761](../src/lib/dataservice/accountPlan/shared.js#L1761) | Accepts explicit Barrier or Driver type from the form. | — |
| [`criticalActivityTypeFromRecordType` — 1769](../src/lib/dataservice/accountPlan/shared.js#L1769) | Classifies a Medical Tactic RecordType by its developer/display name. | `fieldValue` |
| [`fetchCriticalActivityRecordTypeIds` — 1779](../src/lib/dataservice/accountPlan/shared.js#L1779) | Loads/caches active Medical Tactic RecordType IDs by parent type. | `runQuery`, `unwrap`, `criticalActivityTypeFromRecordType`, `fieldValue` |
| [`resolveCriticalActivityRecordTypeId` — 1800](../src/lib/dataservice/accountPlan/shared.js#L1800) | Finds the required tactic RecordType ID or reports that the type is unavailable. | `fetchCriticalActivityRecordTypeIds` |
| [`criticalActivityRecordTypeIdForWrite` — 1813](../src/lib/dataservice/accountPlan/shared.js#L1813) | Uses the accessible default for Barrier tactics and resolves an explicit Opportunity tactic RecordType. | `resolveCriticalActivityRecordTypeId` |
| [`isInaccessibleRecordTypeError` — 1818](../src/lib/dataservice/accountPlan/shared.js#L1818) | Recognizes Salesforce rejection of an inaccessible explicit RecordTypeId. | `stringifyError` |
| [`writeCriticalActivityWithAccessibleRecordType` — 1837](../src/lib/dataservice/accountPlan/shared.js#L1837) | Retries an explicit RecordTypeId rejection without that ID so CRM can apply the user's default. | `isInaccessibleRecordTypeError` |
| [`criticalActivityParentLookupFieldFor` — 1845](../src/lib/dataservice/accountPlan/shared.js#L1845) | Returns the shared KPH_Barrier_or_Opportunity__c parent lookup for both parent types. | — |
| [`criticalActivityParentFields` — 1848](../src/lib/dataservice/accountPlan/shared.js#L1848) | Builds the shared parent-lookup write field when the form supplies parent data. | `hasExplicitCriticalActivityParent`, `criticalActivityParentId` |
| [`validateCriticalActivityParentRecordType` — 1856](../src/lib/dataservice/accountPlan/shared.js#L1856) | Verifies the linked parent has an allowed Medical type and agrees with the requested type. | `hasExplicitCriticalActivityParent`, `criticalActivityParentId`, `fetchBarrierDriverRecordTypeIds`, `typeFromBarrierDriverRecordTypeId`, `explicitCriticalActivityParentType` |
| [`updateCriticalActivity` — 1877](../src/lib/dataservice/accountPlan/shared.js#L1877) | Rereads legacy access, validates the tactic, builds exact CRM fields, and writes with optional-field/RecordType fallbacks. | `readMedicalLegacyEditState`, `hasExplicitCriticalActivityParent`, `criticalActivityParentId`, `validateCriticalActivityTitle`, `validateCriticalActivityDueDate`, `validateCriticalActivityParentRecordType`; more in source |
| [`criticalActivityDeleteFields` — 1917](../src/lib/dataservice/accountPlan/shared.js#L1917) | Builds the tactic soft-delete flag and preserves supplied parent linkage. | `criticalActivityParentId` |
| [`deleteCriticalActivity` — 1926](../src/lib/dataservice/accountPlan/shared.js#L1926) | Verifies the tactic is editable, then marks it deleted with the shared soft-delete writer. | `readMedicalLegacyEditState`, `softDeleteRecord`, `criticalActivityDeleteFields` |
| [`createCriticalActivity` — 1940](../src/lib/dataservice/accountPlan/shared.js#L1940) | Requires plan, linked parent, indication, title, and due date; creates the correctly typed Medical Tactic. | `criticalActivityParentId`, `validateCriticalActivityTitle`, `validateCriticalActivityDueDate`, `validateCriticalActivityParentRecordType`, `criticalActivityRecordTypeIdForWrite`, `normalizedActivityStatus`; more in source |
| [`buildOpenActivityCountByBarrier` — 1978](../src/lib/dataservice/accountPlan/shared.js#L1978) | Counts active open/planned/in-progress tactics under each compatible parent ID. | `salesforceIdLookupKeys` |
| [`participationSortRank` — 1995](../src/lib/dataservice/accountPlan/shared.js#L1995) | Ranks Core, Lead, Extended, then other participation values. | — |
| [`sortTeamMembersByParticipation` — 2001](../src/lib/dataservice/accountPlan/shared.js#L2001) | Stable-sorts members by participation rank, then name. | `participationSortRank` |
| [`toTeamMember` — 2035](../src/lib/dataservice/accountPlan/shared.js#L2035) | Maps membership CRM cells to User ID, display name, role, participation, and active flag. | `unwrap`, `toBooleanFlag` |
| [`fetchTeamMembersByPlan` — 2049](../src/lib/dataservice/accountPlan/shared.js#L2049) | Reads active memberships through the explicit CRM query channel and maps/sorts them. | `buildIdMatchWhere`, `runCrmQuery`, `sortTeamMembersByParticipation` |
| [`cleanedTextOrNull` — 2064](../src/lib/dataservice/accountPlan/shared.js#L2064) | Trims text and converts empty values to null for CRM writes. | — |
| [`normalizedActiveStatus` — 2069](../src/lib/dataservice/accountPlan/shared.js#L2069) | Interprets active/inactive boolean-like values for membership/display logic. | — |
| [`teamMemberDisplayFields` — 2077](../src/lib/dataservice/accountPlan/shared.js#L2077) | Builds role/active-status cells for reconstructing the UI model, separate from the actual editable payload. | `cleanedTextOrNull`, `normalizedActiveStatus` |
| [`buildTeamMemberWriteFields` — 2082](../src/lib/dataservice/accountPlan/shared.js#L2082) | Writes selected User ID, member name, and participation; role/status are display-only here. | `cleanedTextOrNull` |
| [`updateTeamMember` — 2088](../src/lib/dataservice/accountPlan/shared.js#L2088) | Validates member/User IDs, updates editable fields through the default channel, and returns a mapped member. | `buildTeamMemberWriteFields`, `updateRecord`, `toTeamMember`, `teamMemberDisplayFields` |
| [`deleteTeamMember` — 2099](../src/lib/dataservice/accountPlan/shared.js#L2099) | Soft-deletes a membership through the default update channel. | `softDeleteRecord` |
| [`createTeamMember` — 2104](../src/lib/dataservice/accountPlan/shared.js#L2104) | Creates a membership through the explicit CRM create channel and returns its mapped record. | `buildTeamMemberWriteFields`, `createCrmRecord`, `createdRecordIdFromWriteResult`, `toTeamMember`, `teamMemberDisplayFields` |
| [`stakeholderQueryAsSoql` — 2123](../src/lib/dataservice/accountPlan/shared.js#L2123) | Formats structured query parameters as a readable diagnostic query string. | — |
| [`logStakeholderCrm` — 2134](../src/lib/dataservice/accountPlan/shared.js#L2134) | Records stakeholder query/join diagnostics for investigation. | `hasVeevaRuntime` |
| [`resetStakeholderCrmLog` — 2150](../src/lib/dataservice/accountPlan/shared.js#L2150) | Clears previous stakeholder query diagnostics before a new read. | `hasVeevaRuntime` |
| [`toStakeholder` — 2170](../src/lib/dataservice/accountPlan/shared.js#L2170) | Joins stakeholder map fields with Account identity and maps display name, role, identifiers, and parent name. | `unwrap`, `stakeholderAccountDetailsFromLookup` |
| [`fetchStakeholders` — 2190](../src/lib/dataservice/accountPlan/shared.js#L2190) | Reads active plan stakeholder maps, joins Account details, and logs the resulting mapped rows. | `resetStakeholderCrmLog`, `buildIdMatchWhere`, `hasVeevaRuntime`, `logStakeholderCrm`, `stakeholderQueryAsSoql`, `unwrapRows`; more in source |
| [`splitStakeholderName` — 2253](../src/lib/dataservice/accountPlan/shared.js#L2253) | Splits a stakeholder name into first/last portions for retained writer support. | — |
| [`stakeholderDisplayFields` — 2264](../src/lib/dataservice/accountPlan/shared.js#L2264) | Builds CRM-style name/role display cells from the stakeholder draft. | `splitStakeholderName`, `cleanedTextOrNull` |
| [`buildStakeholderWriteFields` — 2275](../src/lib/dataservice/accountPlan/shared.js#L2275) | Builds the exact retained stakeholder write fields, including Account lookup and role fields. | `cleanedTextOrNull` |
| [`validateStakeholderOtherRole` — 2289](../src/lib/dataservice/accountPlan/shared.js#L2289) | Requires Other Role text when the selected role needs it. | — |
| [`updateStakeholder` — 2298](../src/lib/dataservice/accountPlan/shared.js#L2298) | Retained stakeholder persistence helper; the current Stakeholders page is read-only and does not call it. | `buildStakeholderWriteFields`, `validateStakeholderOtherRole`, `cleanedTextOrNull`, `updateRecord`, `hasVeevaRuntime`, `toStakeholder`; more in source |
| [`deleteStakeholder` — 2314](../src/lib/dataservice/accountPlan/shared.js#L2314) | Retained stakeholder persistence helper; the current Stakeholders page is read-only and does not call it. | `softDeleteRecord` |
| [`createStakeholder` — 2319](../src/lib/dataservice/accountPlan/shared.js#L2319) | Retained stakeholder persistence helper; the current Stakeholders page is read-only and does not call it. | `buildStakeholderWriteFields`, `validateStakeholderOtherRole`, `hasVeevaRuntime`, `createdRecordIdFromWriteResult`, `toStakeholder`, `stakeholderDisplayFields` |
| [`medicalEducationStatusFieldsFor` — 2388](../src/lib/dataservice/accountPlan/shared.js#L2388) | Selects the MM or DLBCL per-education-option status API-field map. | — |
| [`medicalEducationStatusKey` — 2395](../src/lib/dataservice/accountPlan/shared.js#L2395) | Creates the internal draft key for one Medical Education option's status. | — |
| [`firstFilledWithField` — 2487](../src/lib/dataservice/accountPlan/shared.js#L2487) | Finds the first populated candidate field and returns both value and source-field name. | — |
| [`fieldValue` — 2501](../src/lib/dataservice/accountPlan/shared.js#L2501) | Extracts one CRM cell's value, retaining a scalar input unchanged. | — |
| [`relationshipName` — 2504](../src/lib/dataservice/accountPlan/shared.js#L2504) | Reads a relationship Name from dotted or nested CRM shapes. | `fieldValue` |
| [`toAccountProfile` — 2513](../src/lib/dataservice/accountPlan/shared.js#L2513) | Maps an Ecosystem Plan to MM/DLBCL Medical, Commercial, and regional-dynamics models using field API maps. | `unwrap`, `medicalEducationStatusKey`, `medicalProfileEntries`, `firstFilledWithField` |
| [`medicalProfileEntries` — 2519](../src/lib/dataservice/accountPlan/shared.js#L2519) | Builds one indication's Medical profile properties, including per-option education statuses. | `medicalEducationStatusKey` |
| [`accountProfileQueryAsSoql` — 2557](../src/lib/dataservice/accountPlan/shared.js#L2557) | Formats structured query parameters as a readable diagnostic query string. | — |
| [`recordCommercialProfileQueryDiagnostic` — 2564](../src/lib/dataservice/accountPlan/shared.js#L2564) | Records the exact Commercial profile query and result/error diagnostics. | `accountProfileQueryAsSoql` |
| [`executeAccountProfileQuery` — 2581](../src/lib/dataservice/accountPlan/shared.js#L2581) | Runs a profile query through the supplied channel with optional diagnostic logging. | `recordCommercialProfileQueryDiagnostic` |
| [`fetchAccessibleAccountProfileFields` — 2604](../src/lib/dataservice/accountPlan/shared.js#L2604) | Reads available fields, reducing/retrying field groups after eligible access errors so other data can still load. | `executeAccountProfileQuery`, `unwrap`, `isInaccessibleFieldQueryError` |
| [`fetchAccountProfile` — 2644](../src/lib/dataservice/accountPlan/shared.js#L2644) | Reads the latest plan-scoped Ecosystem Plan and merges available optional fields through the default adapter. | `buildIdMatchWhere`, `runQuery`, `unwrap`, `fetchAccessibleAccountProfileFields`, `toAccountProfile` |
| [`fetchMedicalAccountProfile` — 2668](../src/lib/dataservice/accountPlan/shared.js#L2668) | Reads editable Medical profile fields through live CRM in Veeva; mock reads are allowed only when explicitly requested for local preview. | `hasVeevaRuntime`, `buildIdMatchWhere`, `unwrap`, `fetchAccessibleAccountProfileFields`, `toAccountProfile` |
| [`fetchReferralDynamicsAccountProfile` — 2696](../src/lib/dataservice/accountPlan/shared.js#L2696) | Reads the latest plan profile with narrow regional-dynamics fields, using CRM when hosted in Veeva. | `buildIdMatchWhere`, `hasVeevaRuntime`, `toAccountProfile` |
| [`fetchCommercialAccountProfile` — 2720](../src/lib/dataservice/accountPlan/shared.js#L2720) | Reads Commercial reference fields through CRM in Veeva, with optional-field fallbacks and query diagnostics. | `buildIdMatchWhere`, `hasVeevaRuntime`, `executeAccountProfileQuery`, `unwrap`, `fetchAccessibleAccountProfileFields`, `toAccountProfile` |
| [`updateMedicalAccountProfileField` — 2752](../src/lib/dataservice/accountPlan/shared.js#L2752) | Requires live Veeva, a valid Ecosystem Plan target, and an allowed Medical API field; writes through explicit CRM. | `hasVeevaRuntime`, `updateRecord` |
| [`addAccountNameLookup` — 2797](../src/lib/dataservice/accountPlan/shared.js#L2797) | Indexes Account display names under compatible ID keys. | `toCanonicalSalesforceId` |
| [`accountNameFromLookup` — 2808](../src/lib/dataservice/accountPlan/shared.js#L2808) | Resolves an Account name from the available ID variants. | `toCanonicalSalesforceId` |
| [`unwrapRows` — 2819](../src/lib/dataservice/accountPlan/shared.js#L2819) | Unwraps each record in a returned collection. | — |
| [`fetchAccountNameLookup` — 2821](../src/lib/dataservice/accountPlan/shared.js#L2821) | Batch-loads referenced Account names and builds an ID-compatible lookup. | `buildAnyIdMatchWhere`, `logStakeholderCrm`, `stakeholderQueryAsSoql`, `unwrap`, `addAccountNameLookup`, `stringifyError` |
| [`addStakeholderAccountDetails` — 2882](../src/lib/dataservice/accountPlan/shared.js#L2882) | Indexes stakeholder Account identity details by compatible IDs. | `toCanonicalSalesforceId` |
| [`stakeholderAccountDetailsFromLookup` — 2896](../src/lib/dataservice/accountPlan/shared.js#L2896) | Resolves stakeholder Account details across ID variants. | `toCanonicalSalesforceId` |
| [`fetchStakeholderAccountDetails` — 2907](../src/lib/dataservice/accountPlan/shared.js#L2907) | Batch-reads Accounts referenced by stakeholder maps for the join. | `buildAnyIdMatchWhere`, `logStakeholderCrm`, `stakeholderQueryAsSoql`, `unwrap`, `addStakeholderAccountDetails`, `stringifyError` |
| [`toReferralAccount` — 2955](../src/lib/dataservice/accountPlan/shared.js#L2955) | Maps a referral row and resolved site Account name into the reference-tab model. | `unwrap`, `accountNameFromLookup`, `toBooleanFlag` |
| [`fetchReferralAccounts` — 2975](../src/lib/dataservice/accountPlan/shared.js#L2975) | Loads plan/profile referral mappings and resolves site Account names. | `buildIdMatchWhere`, `hasVeevaRuntime`, `fetchReferralAccountRows`, `fetchAccountNameLookup`, `toReferralAccount` |
| [`fetchReferralAccountRows` — 2989](../src/lib/dataservice/accountPlan/shared.js#L2989) | Reads active referral rows for the plan/profile scopes through the supplied query channel. | — |
| [`fetchHealthcareNetworkRows` — 2997](../src/lib/dataservice/accountPlan/shared.js#L2997) | Reads active healthcare-network child rows for an Ecosystem Plan. | — |
| [`fetchAccountProfileChildRecords` — 3013](../src/lib/dataservice/accountPlan/shared.js#L3013) | Loads referral and network children and shares Account-name resolution across the results. | `buildIdMatchWhere`, `hasVeevaRuntime`, `fetchReferralAccountRows`, `fetchHealthcareNetworkRows`, `fetchAccountNameLookup`, `toReferralAccount`; more in source |
| [`buildReferralAccountWriteFields` — 3040](../src/lib/dataservice/accountPlan/shared.js#L3040) | Builds retained referral fields, including the selected site Account lookup. | `toBooleanFlag` |
| [`updateReferralAccount` — 3058](../src/lib/dataservice/accountPlan/shared.js#L3058) | Retained referral writer; the current Referral & Dynamics tab does not expose editing callbacks. | `updateRecord`, `buildReferralAccountWriteFields`, `hasVeevaRuntime` |
| [`deleteReferralAccount` — 3068](../src/lib/dataservice/accountPlan/shared.js#L3068) | Retained referral writer; the current Referral & Dynamics tab does not expose editing callbacks. | `softDeleteRecord`, `hasVeevaRuntime` |
| [`createReferralAccount` — 3073](../src/lib/dataservice/accountPlan/shared.js#L3073) | Retained referral writer; the current Referral & Dynamics tab does not expose editing callbacks. | `hasVeevaRuntime`, `buildReferralAccountWriteFields` |
| [`toHealthcareNetwork` — 3106](../src/lib/dataservice/accountPlan/shared.js#L3106) | Maps a network row, Account name, profile ID, and Kite-accountable value for display. | `unwrap`, `accountNameFromLookup` |
| [`fetchHealthcareNetworks` — 3119](../src/lib/dataservice/accountPlan/shared.js#L3119) | Reads profile-scoped network rows and resolves referenced Account names. | `buildIdMatchWhere`, `hasVeevaRuntime`, `fetchHealthcareNetworkRows`, `fetchAccountNameLookup`, `toHealthcareNetwork` |

Exported aliases/constants assigned to another identifier (no separate function body):

- [`PLAN_FIELDS`](../src/lib/dataservice/accountPlan/shared.js#L138) → `PLAN_FIELDS_BASE`. Follow the target's definition/import to see behavior and persistence destination.
- [`deactivateCriticalActivity`](../src/lib/dataservice/accountPlan/shared.js#L1938) → `deleteCriticalActivity`. Follow the target's definition/import to see behavior and persistence destination.

## src/lib/dataservice/accountPlan/stakeholders.js

[Open source](../src/lib/dataservice/accountPlan/stakeholders.js)

Local dependencies: [shared.js](../src/lib/dataservice/accountPlan/shared.js), [query.js](../src/lib/dataservice/query.js), [client.js](../src/lib/dataservice/client.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`mergeWithDataValues` — 23](../src/lib/dataservice/accountPlan/stakeholders.js#L23) | Deduplicates nonempty values/options while preserving usable order; inspect the module for its blank/All/current-value policy. | — |
| [`valuesFromPicklistLabels` — 34](../src/lib/dataservice/accountPlan/stakeholders.js#L34) | Extracts a deduplicated list of API values from supported picklist metadata shapes. | `mergeWithDataValues` |
| [`fetchPicklistOptions` — 51](../src/lib/dataservice/accountPlan/stakeholders.js#L51) | Reads picklist API values for the object/field owned by this module, with an empty-list fallback. | `hasVeevaRuntime` |
| [`fetchStakeholderPicklists` — 60](../src/lib/dataservice/accountPlan/stakeholders.js#L60) | Loads role choices for retained stakeholder form/service support. | `fetchPicklistOptions` |
| [`loadStakeholders` — 68](../src/lib/dataservice/accountPlan/stakeholders.js#L68) | Loads plan shell, stakeholder records, and role metadata into the stakeholder page payload. | `requireCurrentAccountPlanId`, `resolveShellContextForPlanId`, `fetchStakeholders`, `fetchStakeholderPicklists` |

## src/lib/dataservice/accountPlan/teamMembers.js

[Open source](../src/lib/dataservice/accountPlan/teamMembers.js)

Local dependencies: [shared.js](../src/lib/dataservice/accountPlan/shared.js), [query.js](../src/lib/dataservice/query.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`mergeWithDataValues` — 19](../src/lib/dataservice/accountPlan/teamMembers.js#L19) | Deduplicates nonempty values/options while preserving usable order; inspect the module for its blank/All/current-value policy. | — |
| [`valuesFromPicklistLabels` — 30](../src/lib/dataservice/accountPlan/teamMembers.js#L30) | Extracts a deduplicated list of API values from supported picklist metadata shapes. | `mergeWithDataValues` |
| [`fetchPicklistOptions` — 47](../src/lib/dataservice/accountPlan/teamMembers.js#L47) | Reads picklist API values for the object/field owned by this module, with an empty-list fallback. | `getPicklistValueLabels` |
| [`loadTeamMembers` — 52](../src/lib/dataservice/accountPlan/teamMembers.js#L52) | Loads plan shell, memberships, and participation/status options into the member page payload. | `requireCurrentAccountPlanId`, `resolveShellContextForPlanId`, `fetchTeamMembersByPlan`, `fetchPicklistOptions`, `mergeWithDataValues` |

## src/lib/dataservice/accountPlan/titlePicklistMappings.js

[Open source](../src/lib/dataservice/accountPlan/titlePicklistMappings.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`clean` — 1](../src/lib/dataservice/accountPlan/titlePicklistMappings.js#L1) | Normalizes picklist text values before label/API mapping. | — |
| [`picklistInfoFromLabels` — 10](../src/lib/dataservice/accountPlan/titlePicklistMappings.js#L10) | Converts supported metadata shapes into API values plus value-to-display-label mapping. | `medicalPicklistLabel`, `add` |
| [`add` — 13](../src/lib/dataservice/accountPlan/titlePicklistMappings.js#L13) | Adds a nonempty API value/display-label pair to the enclosing metadata accumulator without duplicating its value. | `medicalPicklistLabel` |
| [`medicalPicklistLabel` — 45](../src/lib/dataservice/accountPlan/titlePicklistMappings.js#L45) | Returns a Medical display label for a stored API value using metadata and supported cleanup. | `clean` |
| [`labelForPicklistValue` — 55](../src/lib/dataservice/accountPlan/titlePicklistMappings.js#L55) | Looks up a display label while retaining a usable value fallback. | `medicalPicklistLabel` |
| [`withMedicalPicklistLabels` — 57](../src/lib/dataservice/accountPlan/titlePicklistMappings.js#L57) | Attaches display labels while preserving stored parent/tactic API values. | `medicalPicklistLabel` |
| [`buildMedicalTacticOptionsByParentTitle` — 72](../src/lib/dataservice/accountPlan/titlePicklistMappings.js#L72) | Despite its old name, parses tactic API markers into allowed choices by parent type and indication. | `clean` |
| [`medicalTacticOptionsForParent` — 105](../src/lib/dataservice/accountPlan/titlePicklistMappings.js#L105) | Selects tactic choices by parent Barrier/Opportunity type and indication, not the individual parent's title. | `clean` |

## src/lib/dataservice/client.js

[Open source](../src/lib/dataservice/client.js)

Local dependencies: [mockAdapter.js](../src/lib/mockData/mockAdapter.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`getRuntimeDs` — 19](../src/lib/dataservice/client.js#L19) | Returns window.ds dynamically so late Veeva initialization is visible to callers. | — |
| [`hasVeevaRuntime` — 21](../src/lib/dataservice/client.js#L21) | Reports an available packaged Veeva DataService; local Vite is intentionally excluded. | `getRuntimeDs` |
| [`missingRuntime` — 23](../src/lib/dataservice/client.js#L23) | Builds a rejecting adapter method with a clear missing-Veeva-runtime message. | — |
| [`findRuntimeField` — 43](../src/lib/dataservice/client.js#L43) | Recursively extracts a field from nested runtime payloads, unwrapping value cells. | — |
| [`getDataForCurrentObject` — 66](../src/lib/dataservice/client.js#L66) | In packaged training mode, borrows real plan/User identity from Veeva while retaining mock feature records and rebinding plan context. | `getRuntimeDs`, `findRuntimeField`, `bindMockAccountPlanContext` |
| [`isHybridTrainingRuntime` — 133](../src/lib/dataservice/client.js#L133) | Reports a mock/training build running with a live Veeva runtime. | `hasVeevaRuntime` |
| [`bindAccountPlanDataContext` — 134](../src/lib/dataservice/client.js#L134) | Rebinds mock records to the current plan when using mock data; live mode keeps the ID unchanged. | `bindMockAccountPlanContext` |
| [`isOnline` — 141](../src/lib/dataservice/client.js#L141) | Checks the Veeva CDN hostname to choose online/offline query behavior; this is not a general internet-connectivity test. | — |

Exported aliases/constants assigned to another identifier (no separate function body):

- [`isMockRuntime`](../src/lib/dataservice/client.js#L131) → `useMockData`. Follow the target's definition/import to see behavior and persistence destination.
- [`isLocalPreview`](../src/lib/dataservice/client.js#L132) → `isDev`. Follow the target's definition/import to see behavior and persistence destination.

## src/lib/dataservice/mockAdapter.live.js

[Open source](../src/lib/dataservice/mockAdapter.live.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`bindMockAccountPlanContext` — 5](../src/lib/dataservice/mockAdapter.live.js#L5) | Binds fictional records to the selected plan in mock builds; the live stub version deliberately returns null. | — |

## src/lib/dataservice/query.js

[Open source](../src/lib/dataservice/query.js)

Local dependencies: [client.js](../src/lib/dataservice/client.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`recordCurrentObjectDiagnostic` — 27](../src/lib/dataservice/query.js#L27) | Appends context-read diagnostics to a window property for support. | — |
| [`responseKeySummary` — 35](../src/lib/dataservice/query.js#L35) | Summarizes response/container keys without dumping the entire context payload. | — |
| [`requestKey` — 47](../src/lib/dataservice/query.js#L47) | Serializes request inputs for in-flight deduplication, returning null when serialization fails. | — |
| [`extractPicklistValueLabels` — 60](../src/lib/dataservice/query.js#L60) | Finds exact object/field picklist metadata through supported data/response wrappers. | — |
| [`inClause` — 83](../src/lib/dataservice/query.js#L83) | Builds an IN-list using online parentheses or offline VQL braces. | — |
| [`stripDottedFields` — 96](../src/lib/dataservice/query.js#L96) | Removes relationship-field paths that offline VQL may reject. | — |
| [`safeQueryParams` — 101](../src/lib/dataservice/query.js#L101) | Removes the allowDottedFields control flag and strips relationship SELECT fields unless explicitly allowed. | `stripDottedFields` |
| [`toReadableError` — 114](../src/lib/dataservice/query.js#L114) | Wraps bridge errors with a readable message, operation/object context, and original cause. | — |
| [`runQuery` — 131](../src/lib/dataservice/query.js#L131) | Queries through the default adapter, coalesces identical in-flight calls, extracts data rows, and propagates readable errors. | `safeQueryParams`, `requestKey`, `toReadableError` |
| [`runCrmQuery` — 155](../src/lib/dataservice/query.js#L155) | Queries through the explicit live CRM read channel, separate from the default/mock adapter. | `safeQueryParams`, `requestKey`, `toReadableError` |
| [`queryRecord` — 179](../src/lib/dataservice/query.js#L179) | Reads one record through the adapter and returns null after a logged failure. | `safeQueryParams` |
| [`candidateContainerKeys` — 202](../src/lib/dataservice/query.js#L202) | Builds object-name variants used by different Veeva current-object response shapes. | — |
| [`unwrapCell` — 211](../src/lib/dataservice/query.js#L211) | Recursively extracts value/display cell contents with a depth limit. | — |
| [`findNestedValue` — 218](../src/lib/dataservice/query.js#L218) | Searches nested objects for the requested field and unwraps its value. | `unwrapCell` |
| [`parseResponsePayload` — 230](../src/lib/dataservice/query.js#L230) | Selects the data/response wrapper or original payload before extracting context. | — |
| [`extractCurrentObjectField` — 237](../src/lib/dataservice/query.js#L237) | Resolves a field across object aliases, root fields, nested containers, and lowercase ID fallbacks. | `parseResponsePayload`, `candidateContainerKeys`, `unwrapCell`, `findNestedValue` |
| [`getDataForCurrentObject` — 275](../src/lib/dataservice/query.js#L275) | Reads and normalizes context through the default adapter; concurrent matching reads share a promise. | `requestKey`, `extractCurrentObjectField` |
| [`getCrmDataForCurrentObject` — 298](../src/lib/dataservice/query.js#L298) | Reads context explicitly from CRM, normalizes the result, and records context diagnostics. | `requestKey`, `extractCurrentObjectField`, `recordCurrentObjectDiagnostic`, `responseKeySummary` |
| [`viewRecord` — 334](../src/lib/dataservice/query.js#L334) | Asks the adapter to open a native CRM record view. | — |
| [`updateRecord` — 341](../src/lib/dataservice/query.js#L341) | Updates one object/record; the crm option explicitly chooses the live CRM update channel. | — |
| [`createRecord` — 349](../src/lib/dataservice/query.js#L349) | Creates one record through the default adapter. | — |
| [`createCrmRecord` — 356](../src/lib/dataservice/query.js#L356) | Creates one record explicitly through the live CRM channel. | — |
| [`deleteRecord` — 363](../src/lib/dataservice/query.js#L363) | Invokes physical adapter deletion if supported; most domain delete flows instead use soft-delete updates. | — |
| [`getPicklistValueLabels` — 373](../src/lib/dataservice/query.js#L373) | Reads and normalizes picklist labels through the default adapter, with an empty metadata fallback. | `requestKey`, `extractPicklistValueLabels` |
| [`getCrmPicklistValueLabels` — 394](../src/lib/dataservice/query.js#L394) | Reads and normalizes picklist labels through the explicit live CRM channel. | `requestKey`, `extractPicklistValueLabels` |
| [`getObjectMetadata` — 417](../src/lib/dataservice/query.js#L417) | Reads object metadata when supported and returns null after a logged failure. | `requestKey` |
| [`unwrap` — 440](../src/lib/dataservice/query.js#L440) | Converts CRM field cells into a plain record; script-local versions perform the equivalent fixture unwrapping. | `unwrapCell` |
| [`unwrapAll` — 449](../src/lib/dataservice/query.js#L449) | Unwraps each record in a returned collection. | — |
| [`to18CharId` — 463](../src/lib/dataservice/query.js#L463) | Computes the standard Salesforce 18-character suffix from a 15-character ID. | — |
| [`isLikelySalesforceId` — 482](../src/lib/dataservice/query.js#L482) | Checks whether a value has the 15- or 18-character Salesforce ID shape. | — |
| [`toCanonicalSalesforceId` — 489](../src/lib/dataservice/query.js#L489) | Returns an 18-character Salesforce ID or null for a non-Salesforce-shaped input. | `isLikelySalesforceId`, `to18CharId` |
| [`salesforceIdVariants` — 502](../src/lib/dataservice/query.js#L502) | Produces unique Salesforce ID forms so online/offline IDs can match the same record. | `toCanonicalSalesforceId` |
| [`escapeSoqlString` — 517](../src/lib/dataservice/query.js#L517) | Escapes apostrophes in text used in a SOQL/VQL literal. | — |
| [`buildIdMatchWhere` — 526](../src/lib/dataservice/query.js#L526) | Builds an equality predicate covering ID variants, with a simple escaped match for mock IDs. | `salesforceIdVariants`, `escapeSoqlString` |

## src/lib/accountPlanReadOnly.js

[Open source](../src/lib/accountPlanReadOnly.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`statusKey` — 6](../src/lib/accountPlanReadOnly.js#L6) | Normalizes a status input for comparisons; inspect the source signature because some versions accept a record and others a raw status. | — |
| [`isUnderReviewStatus` — 8](../src/lib/accountPlanReadOnly.js#L8) | Compares a status to the corresponding approval constant after case/space normalization. | `statusKey` |
| [`isSubmittedForApprovalStatus` — 11](../src/lib/accountPlanReadOnly.js#L11) | Compares a status to the corresponding approval constant after case/space normalization. | `statusKey` |
| [`isApprovedStatus` — 14](../src/lib/accountPlanReadOnly.js#L14) | Compares a status to the corresponding approval constant after case/space normalization. | `statusKey` |
| [`isAccountPlanApprovalPending` — 20](../src/lib/accountPlanReadOnly.js#L20) | Combines current/legacy pending statuses and the submitted flag, with Approved reopening future submission. | `isSubmittedForApprovalStatus`, `isUnderReviewStatus`, `isApprovedStatus` |

## src/lib/approvalProfileAccess.js

[Open source](../src/lib/approvalProfileAccess.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`normalizeProfileName` — 38](../src/lib/approvalProfileAccess.js#L38) | Normalizes profile spelling/spacing/case for exact allowlist comparisons. | — |
| [`isMpdApprovalRestrictedProfile` — 57](../src/lib/approvalProfileAccess.js#L57) | Checks the explicit list of profiles blocked from the submission action. | `normalizeProfileName` |
| [`isAccountPlanReviewerProfile` — 60](../src/lib/approvalProfileAccess.js#L60) | Checks the broader reviewer list; this list is distinct from actual approve eligibility. | `normalizeProfileName` |
| [`isMedicalApprovalManagerProfile` — 63](../src/lib/approvalProfileAccess.js#L63) | Recognizes the specific Medical MSL Manager profile. | `normalizeProfileName` |
| [`canProfileApproveAccountPlan` — 66](../src/lib/approvalProfileAccess.js#L66) | Checks the actual approver allowlist used to enable plan approval. | `normalizeProfileName` |
| [`canProfileViewAccountPlanApprovalHistory` — 69](../src/lib/approvalProfileAccess.js#L69) | Checks the history-viewer allowlist. | `normalizeProfileName` |

## src/lib/approvalReviewDate.js

[Open source](../src/lib/approvalReviewDate.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`acceptedStatus` — 1](../src/lib/approvalReviewDate.js#L1) | Recognizes accepted/approved status for review-date fallback. | — |
| [`isoDatePart` — 4](../src/lib/approvalReviewDate.js#L4) | Extracts a leading YYYY-MM-DD date from a stored date/timestamp. | — |
| [`acceptedApprovalReviewDate` — 13](../src/lib/approvalReviewDate.js#L13) | Uses an explicit review date, otherwise an approved/accepted record's LastModifiedDate. | `isoDatePart`, `acceptedStatus` |

## src/lib/medicalTerminology.js

[Open source](../src/lib/medicalTerminology.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`medicalRecordTypeLabel` — 3](../src/lib/medicalTerminology.js#L3) | Translates internal Driver to Opportunity and defaults the parent label appropriately. | — |
| [`medicalRecordTypeLabelLower` — 6](../src/lib/medicalTerminology.js#L6) | Returns the Medical parent type label in lowercase. | `medicalRecordTypeLabel` |
| [`medicalRecordTypeFilterLabel` — 9](../src/lib/medicalTerminology.js#L9) | Translates a Drivers filter label to Opportunities. | — |

## src/components/AccountProfileFieldHelp.jsx

[Open source](../src/components/AccountProfileFieldHelp.jsx)

Local dependencies: [EditModalField.jsx](../src/components/EditModalField.jsx).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`AccountProfileFieldHelp` — 30](../src/components/AccountProfileFieldHelp.jsx#L30) | Looks up the owning page's field-help copy and renders the shared help control. | `FieldHelpButton` |

## src/components/ApprovalHistoryModal.jsx

[Open source](../src/components/ApprovalHistoryModal.jsx)

Local dependencies: [TableSortButton.jsx](../src/components/TableSortButton.jsx), [tableSort.js](../src/lib/helper/tableSort.js), [edit-modal.css](../src/styles/edit-modal.css), [ApprovalHistoryModal.css](../src/components/ApprovalHistoryModal.css).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`historySortValue` — 15](../src/components/ApprovalHistoryModal.jsx#L15) | Selects and normalizes the requested column's value for sorting the owning table. | `toDateSortValue` |
| [`historyDate` — 21](../src/components/ApprovalHistoryModal.jsx#L21) | Formats an approval-history date for display. | — |
| [`ApprovalHistoryModal` — 33](../src/components/ApprovalHistoryModal.jsx#L33) | Renders sortable Medical approval history with loading, retry, empty, and error states. | `stableSortRows`, `nextTableSort`, `TableSortButton`, `historyDate` |
| [`onKey` — 44](../src/components/ApprovalHistoryModal.jsx#L44) | Handles keyboard behavior for the owning modal/control, especially Escape without interfering with field controls. | — |
| [`handleSort` — 56](../src/components/ApprovalHistoryModal.jsx#L56) | Updates sort-column/direction state for the owning table; it does not mutate CRM records. | `nextTableSort` |

## src/components/ApproveAccountPlanModal.jsx

[Open source](../src/components/ApproveAccountPlanModal.jsx)

Local dependencies: [edit-modal.css](../src/styles/edit-modal.css).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`ApproveAccountPlanModal` — 4](../src/components/ApproveAccountPlanModal.jsx#L4) | Renders the approve confirmation dialog and delegates confirmation/cancellation. | — |
| [`onKey` — 11](../src/components/ApproveAccountPlanModal.jsx#L11) | Handles keyboard behavior for the owning modal/control, especially Escape without interfering with field controls. | — |

## src/components/EditModalField.jsx

[Open source](../src/components/EditModalField.jsx)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`getHelpScopeElement` — 7](../src/components/EditModalField.jsx#L7) | Finds the containing modal/page used as the help popover positioning boundary. | — |
| [`clamp` — 12](../src/components/EditModalField.jsx#L12) | Constrains a numeric value between the supplied bounds. | — |
| [`FieldHelpButton` — 14](../src/components/EditModalField.jsx#L14) | Renders an accessible help toggle with measured popover placement and dismissal behavior. | `clamp`, `getHelpScopeElement`, `updatePopoverPosition`, `createPortal` |
| [`updatePopoverPosition` — 23](../src/components/EditModalField.jsx#L23) | Measures the trigger/scope and places the help popup within available space. | `clamp` |
| [`closeWhenSiblingOpens` — 52](../src/components/EditModalField.jsx#L52) | Closes this help popover when another help control opens. | `getHelpScopeElement` |
| [`toggleHelp` — 65](../src/components/EditModalField.jsx#L65) | Changes help-popover visibility and coordinates the shared help-open event. | `getHelpScopeElement` |
| [`EditModalField` — 147](../src/components/EditModalField.jsx#L147) | Renders a standard modal field wrapper with label, optional help, and supplied input/control. | `isValidElement`, `cloneElement`, `FieldHelpButton` |

## src/components/ExecutiveSummaryModal.jsx

[Open source](../src/components/ExecutiveSummaryModal.jsx)

Local dependencies: [ExecutiveSummaryModal.css](../src/components/ExecutiveSummaryModal.css).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`rowsOrEmpty` — 3](../src/components/ExecutiveSummaryModal.jsx#L3) | Returns available summary rows or a safe empty array. | — |
| [`SummaryFieldGrid` — 5](../src/components/ExecutiveSummaryModal.jsx#L5) | Renders executive-summary label/value fields. | — |
| [`SummaryCardGrid` — 18](../src/components/ExecutiveSummaryModal.jsx#L18) | Renders executive-summary cards. | — |
| [`MedicalProfileBlock` — 34](../src/components/ExecutiveSummaryModal.jsx#L34) | Renders one indication's Medical profile section in the summary modal. | `SimpleTable` |
| [`CountColumn` — 71](../src/components/ExecutiveSummaryModal.jsx#L71) | Renders a summary count with its heading/label. | `rowsOrEmpty` |
| [`SimpleTable` — 93](../src/components/ExecutiveSummaryModal.jsx#L93) | Renders a summary reference table with its empty-state behavior. | `rowsOrEmpty` |
| [`OpenBarrierDriverTable` — 118](../src/components/ExecutiveSummaryModal.jsx#L118) | Renders summary parent rows with linked-tactic/count context. | `rowsOrEmpty` |
| [`ExecutiveSummaryModal` — 145](../src/components/ExecutiveSummaryModal.jsx#L145) | Renders assembled executive-summary sections, loading/error state, and the delegated PDF save action. | `SummaryFieldGrid`, `SummaryCardGrid`, `MedicalProfileBlock`, `CountColumn`, `SimpleTable`, `OpenBarrierDriverTable` |

## src/components/HomeFieldHelp.jsx

[Open source](../src/components/HomeFieldHelp.jsx)

Local dependencies: [EditModalField.jsx](../src/components/EditModalField.jsx).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`HomeFieldHelp` — 26](../src/components/HomeFieldHelp.jsx#L26) | Looks up the owning page's field-help copy and renders the shared help control. | `FieldHelpButton` |

## src/components/KiteAccountPlanLoader.jsx

[Open source](../src/components/KiteAccountPlanLoader.jsx)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`KiteAccountPlanLoader` — 15](../src/components/KiteAccountPlanLoader.jsx#L15) | Renders the packaged Kite loader asset; data loading is owned by the caller. | — |

## src/components/LoadingScreen.jsx

[Open source](../src/components/LoadingScreen.jsx)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`LegacyLoadingScreen` — 5](../src/components/LoadingScreen.jsx#L5) | Renders one of the available loading-screen visual variants. | — |
| [`KiteLogoLoadingScreen` — 37](../src/components/LoadingScreen.jsx#L37) | Renders one of the available loading-screen visual variants. | — |
| [`KiteMinimalLoadingScreen` — 62](../src/components/LoadingScreen.jsx#L62) | Renders one of the available loading-screen visual variants. | — |
| [`LoadingScreen` — 84](../src/components/LoadingScreen.jsx#L84) | Chooses the configured loading presentation and label. | `LegacyLoadingScreen`, `KiteLogoLoadingScreen`, `KiteMinimalLoadingScreen` |

## src/components/PdfAllPagesViewer.jsx

[Open source](../src/components/PdfAllPagesViewer.jsx)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`ensureWorker` — 8](../src/components/PdfAllPagesViewer.jsx#L8) | Initializes PDF.js worker configuration once before rendering documents. | — |
| [`normalizeAnnotationUrl` — 14](../src/components/PdfAllPagesViewer.jsx#L14) | Resolves/filters a PDF link annotation URL for the embedded viewer. | — |
| [`appendLinkAnnotations` — 28](../src/components/PdfAllPagesViewer.jsx#L28) | Adds positioned clickable link overlays corresponding to PDF page annotations. | `normalizeAnnotationUrl` |
| [`PdfAllPagesViewer` — 62](../src/components/PdfAllPagesViewer.jsx#L62) | Loads a PDF, renders every page to canvases with annotation links, and cleans up on unmount/change. | `ensureWorker`, `appendLinkAnnotations` |

## src/components/SubmitMpdApprovalConfirmModal.jsx

[Open source](../src/components/SubmitMpdApprovalConfirmModal.jsx)

Local dependencies: [edit-modal.css](../src/styles/edit-modal.css).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`SubmitMpdApprovalConfirmModal` — 4](../src/components/SubmitMpdApprovalConfirmModal.jsx#L4) | Renders FD submission confirmation with busy/error feedback and delegated actions. | — |
| [`onKey` — 6](../src/components/SubmitMpdApprovalConfirmModal.jsx#L6) | Handles keyboard behavior for the owning modal/control, especially Escape without interfering with field controls. | — |

## src/components/TableSortButton.jsx

[Open source](../src/components/TableSortButton.jsx)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`TableSortButton` — 1](../src/components/TableSortButton.jsx#L1) | Renders a sortable column header with accessible label and direction indicator. | — |

## src/lib/helper/modalDismiss.js

[Open source](../src/lib/helper/modalDismiss.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`escapeBelongsToFieldControl` — 12](../src/lib/helper/modalDismiss.js#L12) | Determines whether a field/popover should consume Escape before its containing modal closes. | — |
| [`isDirectBackdropClick` — 25](../src/lib/helper/modalDismiss.js#L25) | Checks whether the actual overlay background, rather than a child, was clicked. | — |

## src/lib/helper/tableSort.js

[Open source](../src/lib/helper/tableSort.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`normalizeTableSortDirection` — 1](../src/lib/helper/tableSort.js#L1) | Normalizes a direction to asc/desc. | — |
| [`nextTableSort` — 3](../src/lib/helper/tableSort.js#L3) | Chooses the next column/direction when a sortable header is activated. | `normalizeTableSortDirection` |
| [`toDateSortValue` — 11](../src/lib/helper/tableSort.js#L11) | Converts a sortable date to its timestamp, preserving a blank/invalid sentinel. | — |
| [`isEmptySortValue` — 18](../src/lib/helper/tableSort.js#L18) | Recognizes nullish/empty sort values. | — |
| [`compareTableSortValues` — 20](../src/lib/helper/tableSort.js#L20) | Compares numeric/text values in the selected direction while placing empty values consistently. | `isEmptySortValue`, `normalizeTableSortDirection` |
| [`stableSortRows` — 35](../src/lib/helper/tableSort.js#L35) | Returns rows ordered by the selected column/direction, preserving original order for equal values. | `compareTableSortValues` |

## src/lib/helper/teamMemberUsers.js

[Open source](../src/lib/helper/teamMemberUsers.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`normalizeTeamMemberUserId` — 6](../src/lib/helper/teamMemberUsers.js#L6) | Normalizes User IDs for duplicate detection across Salesforce ID formats. | — |
| [`teamMemberUserIds` — 12](../src/lib/helper/teamMemberUsers.js#L12) | Builds normalized existing-member User IDs, optionally excluding the currently edited membership. | `normalizeTeamMemberUserId` |
| [`teamMemberRawUserIds` — 20](../src/lib/helper/teamMemberUsers.js#L20) | Collects original existing-member User IDs for query exclusions. | — |
| [`hasDuplicateTeamMemberUser` — 26](../src/lib/helper/teamMemberUsers.js#L26) | Tests whether the selected User already has another membership. | `teamMemberUserIds`, `normalizeTeamMemberUserId` |
| [`filterExistingTeamMemberUsers` — 29](../src/lib/helper/teamMemberUsers.js#L29) | Removes lookup choices that correspond to existing plan members. | `normalizeTeamMemberUserId` |

## src/lib/helper/userRecordNavigation.js

[Open source](../src/lib/helper/userRecordNavigation.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`hostedUserRecordUrl` — 3](../src/lib/helper/userRecordNavigation.js#L3) | Builds the hosted CRM URL for a User record when the current runtime supports that route. | — |

## src/lib/helper/utils.js

[Open source](../src/lib/helper/utils.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`safeLower` — 4](../src/lib/helper/utils.js#L4) | Converts a null-safe input to lowercase text. | — |
| [`hasValue` — 7](../src/lib/helper/utils.js#L7) | Tests for a non-null, non-undefined, nonempty value according to the owning module. | — |
| [`countNoun` — 9](../src/lib/helper/utils.js#L9) | Chooses singular/plural count wording using the current helper's count rule. | — |
| [`formatCountLabel` — 12](../src/lib/helper/utils.js#L12) | Formats a numeric count with its selected noun form. | `countNoun` |
| [`normalizeCrmBoolean` — 17](../src/lib/helper/utils.js#L17) | Converts common CRM boolean/number/string forms to true/false and leaves unrecognized values unchanged. | — |
| [`booleanDisplay` — 26](../src/lib/helper/utils.js#L26) | Formats recognized CRM booleans as Yes/No and blanks as the display fallback. | `normalizeCrmBoolean`, `hasValue` |
| [`recordIdMatchKeys` — 35](../src/lib/helper/utils.js#L35) | Produces compatible record-ID keys for cross-runtime lookups. | — |
| [`addRecordIdMatchKeys` — 44](../src/lib/helper/utils.js#L44) | Adds every compatible record-ID key to a set. | `recordIdMatchKeys` |
| [`recordIdSetHas` — 48](../src/lib/helper/utils.js#L48) | Tests whether any compatible form of an ID exists in a set. | `recordIdMatchKeys` |
| [`recordIdMatches` — 51](../src/lib/helper/utils.js#L51) | Matches records across supported 15-/18-character Salesforce ID forms. | `recordIdMatchKeys` |
| [`parseDate` — 57](../src/lib/helper/utils.js#L57) | Parses dates, treating date-only strings as local calendar dates to avoid UTC display shifts. | — |
| [`twoDigitDatePart` — 67](../src/lib/helper/utils.js#L67) | Pads month/day numbers to two digits. | — |
| [`formatDateLabel` — 69](../src/lib/helper/utils.js#L69) | Formats a date as MM/DD/YYYY with a fallback for missing/invalid values. | `parseDate`, `twoDigitDatePart` |
| [`daysFromNow` — 77](../src/lib/helper/utils.js#L77) | Computes whole calendar-day distance from today. | `parseDate` |
| [`truncateDisplay` — 86](../src/lib/helper/utils.js#L86) | Shortens display text to the module's limit with its truncation policy. | — |
| [`firstInitial` — 95](../src/lib/helper/utils.js#L95) | Extracts a display initial with a fallback. | — |
| [`impactTone` — 97](../src/lib/helper/utils.js#L97) | Maps impact/priority labels to a visual severity tone. | `safeLower` |
| [`statusTone` — 105](../src/lib/helper/utils.js#L105) | Maps status text to a visual status-pill tone. | `safeLower` |
| [`activityStatusLabel` — 121](../src/lib/helper/utils.js#L121) | Shows stored Complete as Completed and applies the activity default status label. | — |
| [`activityStatusKey` — 126](../src/lib/helper/utils.js#L126) | Normalizes a status input for comparisons; inspect the source signature because some versions accept a record and others a raw status. | `safeLower` |
| [`activityIsOpen` — 128](../src/lib/helper/utils.js#L128) | Checks Home's open-activity rule, excluding archived/deactivated and selected terminal statuses. | `activityStatusKey` |
| [`activityDueTone` — 133](../src/lib/helper/utils.js#L133) | Returns the overdue or standard due-date CSS modifier. | `daysFromNow` |
| [`activityDueLabel` — 138](../src/lib/helper/utils.js#L138) | Formats a tactic's due date for the Home list. | `formatDateLabel` |
| [`activityDueDetail` — 141](../src/lib/helper/utils.js#L141) | Formats No due date, overdue, today, or days-until-due wording. | `daysFromNow` |
| [`activityParentName` — 149](../src/lib/helper/utils.js#L149) | Chooses linked parent name, indication fallback, or Plan-level wording. | — |
| [`isHomeActivityWindow` — 156](../src/lib/helper/utils.js#L156) | Requires an open tactic with a date on/before 30 days from today; overdue dates remain included. | `activityIsOpen`, `parseDate` |
| [`homeUrgentActivities` — 167](../src/lib/helper/utils.js#L167) | Selects Home's due-date window and stable-sorts earliest/most-overdue first. | `daysFromNow` |
| [`recordIsOpen` — 181](../src/lib/helper/utils.js#L181) | Checks whether a parent is not closed/archived under Home summary rules. | `safeLower` |
| [`recordClosedWithinDays` — 183](../src/lib/helper/utils.js#L183) | Checks whether a closed record's modification date lies inside the requested recent-days window. | `recordIsOpen`, `parseDate` |
| [`displayValue` — 194](../src/lib/helper/utils.js#L194) | Formats blank/boolean values for display using the owning module's fallback wording. | — |
| [`stakeholderRoleOptions` — 201](../src/lib/helper/utils.js#L201) | Builds distinct roles found in stakeholder data with All as the first filter option. | — |
| [`stakeholderMatchesFilters` — 212](../src/lib/helper/utils.js#L212) | Applies the selected stakeholder role filter. | — |
| [`teamMemberPhone` — 219](../src/lib/helper/utils.js#L219) | Despite its old name, displays participation, falling back to Active/Inactive wording. | — |
| [`criticalActivityCounts` — 230](../src/lib/helper/utils.js#L230) | Counts active open and completed tactics, excluding deactivated rows. | `safeLower` |
| [`homeSummaryTables` — 242](../src/lib/helper/utils.js#L242) | Builds separate Barrier/Opportunity summaries with all open parents, recently closed counts, and linked tactic totals. | `recordClosedWithinDays`, `addRecordIdMatchKeys`, `criticalActivityCounts`, `recordIdSetHas`, `buildTable` |
| [`buildTable` — 243](../src/lib/helper/utils.js#L243) | Builds one type-specific Home summary table model. | `recordClosedWithinDays`, `addRecordIdMatchKeys`, `criticalActivityCounts`, `recordIdSetHas` |

Exported aliases/constants assigned to another identifier (no separate function body):

- [`formatDate`](../src/lib/helper/utils.js#L75) → `formatDateLabel`. Follow the target's definition/import to see behavior and persistence destination.
- [`truncate`](../src/lib/helper/utils.js#L93) → `truncateDisplay`. Follow the target's definition/import to see behavior and persistence destination.

## src/lib/runtime/viewMode.js

[Open source](../src/lib/runtime/viewMode.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`getWindowLike` — 9](../src/lib/runtime/viewMode.js#L9) | Uses the injected browser environment or the real window for testable runtime detection. | — |
| [`mediaMatches` — 14](../src/lib/runtime/viewMode.js#L14) | Safely evaluates a media query when matchMedia exists. | — |
| [`viewportNumber` — 25](../src/lib/runtime/viewMode.js#L25) | Converts a viewport measurement into a positive rounded number or zero. | — |
| [`isLikelyIPad` — 33](../src/lib/runtime/viewMode.js#L33) | Recognizes iPad user-agent/platform signals, including touch-capable Mac-style iPadOS identity. | — |
| [`layoutModeForWidth` — 44](../src/lib/runtime/viewMode.js#L44) | Classifies viewport width as mobile, tablet, desktop, or unknown. | — |
| [`isHostedWebLocation` — 53](../src/lib/runtime/viewMode.js#L53) | Checks whether the page is hosted through HTTP or HTTPS rather than a local container URL. | — |
| [`detectRuntimeViewMode` — 67](../src/lib/runtime/viewMode.js#L67) | Combines device, viewport, pointer, and hosting signals into the runtime view/layout snapshot. | `getWindowLike`, `viewportNumber`, `mediaMatches`, `isLikelyIPad`, `layoutModeForWidth`, `isHostedWebLocation` |
| [`viewModeLabel` — 115](../src/lib/runtime/viewMode.js#L115) | Converts the internal runtime mode into a readable label. | — |
| [`runtimeViewModeSummary` — 125](../src/lib/runtime/viewMode.js#L125) | Formats runtime detection measurements and reason into a support/debugging string. | `viewModeLabel` |

## src/lib/export/accountPlanExecutiveSummary.js

[Open source](../src/lib/export/accountPlanExecutiveSummary.js)

Local dependencies: [medicalTerminology.js](../src/lib/medicalTerminology.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`hasValue` — 3](../src/lib/export/accountPlanExecutiveSummary.js#L3) | Tests for a non-null, non-undefined, nonempty value according to the owning module. | — |
| [`textValue` — 9](../src/lib/export/accountPlanExecutiveSummary.js#L9) | Converts a value into the owning export model's display text/fallback. | `hasValue` |
| [`formatDate` — 16](../src/lib/export/accountPlanExecutiveSummary.js#L16) | Formats a date for the owning export layout; source defines the exact style/fallback. | `textValue` |
| [`normalizeStatus` — 27](../src/lib/export/accountPlanExecutiveSummary.js#L27) | Normalizes status text for export filtering/counting. | — |
| [`isOpenRecord` — 29](../src/lib/export/accountPlanExecutiveSummary.js#L29) | Checks whether a parent belongs in the export's open-record content. | `normalizeStatus` |
| [`isActiveActivityStatus` — 34](../src/lib/export/accountPlanExecutiveSummary.js#L34) | Classifies a tactic status for export summaries. | `normalizeStatus` |
| [`isClosedActivityStatus` — 39](../src/lib/export/accountPlanExecutiveSummary.js#L39) | Classifies a tactic status for export summaries. | `normalizeStatus` |
| [`isClosedWithinDays` — 44](../src/lib/export/accountPlanExecutiveSummary.js#L44) | Checks whether a closed record's modification date lies inside the requested recent-days window. | `isClosedActivityStatus` |
| [`activeStatusFlag` — 55](../src/lib/export/accountPlanExecutiveSummary.js#L55) | Interprets active/inactive boolean-like values for membership/display logic. | — |
| [`teamMemberStatus` — 64](../src/lib/export/accountPlanExecutiveSummary.js#L64) | Builds the displayed member active/inactive status for export content. | `activeStatusFlag`, `textValue` |
| [`lastFieldDirectorReviewValue` — 73](../src/lib/export/accountPlanExecutiveSummary.js#L73) | Builds review-date/status text used in export headers and summary fields. | `formatDate` |
| [`openActivityCount` — 76](../src/lib/export/accountPlanExecutiveSummary.js#L76) | Selects the linked open-tactic total for an exported parent row. | — |
| [`barrierDriverCountRow` — 79](../src/lib/export/accountPlanExecutiveSummary.js#L79) | Builds a parent-type count row for the executive summary. | `textValue`, `openActivityCount` |
| [`barrierDriverCommentRow` — 86](../src/lib/export/accountPlanExecutiveSummary.js#L86) | Builds a parent/comment row for executive-summary content. | `medicalRecordTypeLabel`, `textValue` |
| [`multiSelectText` — 119](../src/lib/export/accountPlanExecutiveSummary.js#L119) | Formats semicolon-delimited multi-select values for readable summary output. | — |
| [`profileFields` — 182](../src/lib/export/accountPlanExecutiveSummary.js#L182) | Maps Medical profile definitions into exported label/value entries. | `textValue`, `multiSelectText` |
| [`referenceFields` — 195](../src/lib/export/accountPlanExecutiveSummary.js#L195) | Maps Commercial reference rows into executive-summary fields. | `textValue` |
| [`questionFields` — 200](../src/lib/export/accountPlanExecutiveSummary.js#L200) | Maps Commercial question columns into summary fields. | `multiSelectText`, `textValue` |
| [`buildMedicalAccountProfile` — 209](../src/lib/export/accountPlanExecutiveSummary.js#L209) | Assembles the Medical/reference/referral portions of the executive-summary profile model. | `profileFields`, `referenceFields`, `questionFields`, `textValue` |
| [`exportTitle` — 265](../src/lib/export/accountPlanExecutiveSummary.js#L265) | Builds a usable Account Plan document filename/title from plan/account data. | — |
| [`buildAccountPlanExecutiveSummary` — 278](../src/lib/export/accountPlanExecutiveSummary.js#L278) | Combines all page payloads into an executive-summary model with counts, profile sections, parents, tactics, stakeholders, and members. | `textValue`, `isActiveActivityStatus`, `isClosedWithinDays`, `formatDate`, `exportTitle`, `lastFieldDirectorReviewValue`; more in source |

## src/lib/export/accountPlanPdf.js

[Open source](../src/lib/export/accountPlanPdf.js)

Local dependencies: [accountPlanPptSections.js](../src/lib/export/accountPlanPptSections.js), [accountPlanPpt.js](../src/lib/export/accountPlanPpt.js), [accountPlanExecutiveSummary.js](../src/lib/export/accountPlanExecutiveSummary.js), [accountPlanPdfRenderer.js](../src/lib/export/accountPlanPdfRenderer.js), [accountPlanPptDelivery.js](../src/lib/export/accountPlanPptDelivery.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`safeFilePart` — 16](../src/lib/export/accountPlanPdf.js#L16) | Removes/replaces filename-unsafe characters for downloaded export names. | — |
| [`escapeHtml` — 24](../src/lib/export/accountPlanPdf.js#L24) | Escapes interpolated text before writing export helper-window HTML. | — |
| [`clickDownloadLink` — 33](../src/lib/export/accountPlanPdf.js#L33) | Creates/clicks a temporary download anchor for a prepared file URL. | — |
| [`dataUrlToBytes` — 44](../src/lib/export/accountPlanPdf.js#L44) | Decodes image data-URL bytes for PDF embedding. | — |
| [`loadImage` — 55](../src/lib/export/accountPlanPdf.js#L55) | Loads an image and resolves when its browser image data is ready. | — |
| [`loadKiteLogoForPdf` — 66](../src/lib/export/accountPlanPdf.js#L66) | Loads/converts the bundled Kite logo into the image representation needed by the PDF renderer. | `loadImage`, `dataUrlToBytes` |
| [`countPdfPages` — 85](../src/lib/export/accountPlanPdf.js#L85) | Determines the generated PDF page count for delivery/result metadata. | — |
| [`writeReadyPdfExportWindow` — 91](../src/lib/export/accountPlanPdf.js#L91) | Populates an export window with ready-file links and instructions using escaped content. | `escapeHtml` |
| [`shareOrDownloadPdfBlob` — 125](../src/lib/export/accountPlanPdf.js#L125) | Chooses browser sharing, download, or open/manual fallback for a prepared file and reports delivery diagnostics. | `safeFilePart`, `revokeObjectUrl`, `getPptDeliveryEnvironment`, `shouldBypassWebShare`, `formatPptDeliveryDiagnostic`, `writeReadyPdfExportWindow`; more in source |
| [`revokeObjectUrl` — 130](../src/lib/export/accountPlanPdf.js#L130) | Releases a temporary Blob URL once its delivery lifecycle permits cleanup. | — |
| [`finish` — 135](../src/lib/export/accountPlanPdf.js#L135) | Completes the owning export delivery attempt and performs result/window/URL cleanup. | `revokeObjectUrl` |
| [`prepareAccountPlanPdf` — 269](../src/lib/export/accountPlanPdf.js#L269) | Loads/reuses page data, builds the executive-summary model, renders a PDF Blob, and returns a prepared file package. | `loadAccountPlanPptData`, `buildAccountPlanExportTitle`, `buildAccountPlanExecutiveSummary`, `loadKiteLogoForPdf`, `createAccountPlanPdfDocument`, `safeFilePart`; more in source |
| [`deliverPreparedAccountPlanPdf` — 298](../src/lib/export/accountPlanPdf.js#L298) | Delivers an already-prepared PDF through the browser/environment delivery helper. | `shareOrDownloadPdfBlob` |
| [`exportAccountPlanToPdf` — 311](../src/lib/export/accountPlanPdf.js#L311) | Convenience operation that prepares then delivers the Account Plan PDF. | `prepareAccountPlanPdf`, `deliverPreparedAccountPlanPdf` |

## src/lib/export/accountPlanPdfRenderer.js

[Open source](../src/lib/export/accountPlanPdfRenderer.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`cleanText` — 30](../src/lib/export/accountPlanPdfRenderer.js#L30) | Normalizes export text and whitespace for the owning renderer/table layout. | — |
| [`escapePdfText` — 40](../src/lib/export/accountPlanPdfRenderer.js#L40) | Escapes special characters for PDF text operations. | `cleanText` |
| [`hexToRgb` — 47](../src/lib/export/accountPlanPdfRenderer.js#L47) | Converts a hexadecimal color into numeric RGB components. | — |
| [`rgb` — 52](../src/lib/export/accountPlanPdfRenderer.js#L52) | Formats color components for PDF drawing commands. | `hexToRgb` |
| [`bottomY` — 54](../src/lib/export/accountPlanPdfRenderer.js#L54) | Converts top-based layout coordinates to PDF's bottom-based coordinate system. | — |
| [`textWidth` — 56](../src/lib/export/accountPlanPdfRenderer.js#L56) | Estimates PDF text width for wrapping/alignment. | `cleanText` |
| [`splitLongWord` — 68](../src/lib/export/accountPlanPdfRenderer.js#L68) | Splits an overlong word into pieces that fit the available PDF width. | `textWidth` |
| [`wrapText` — 84](../src/lib/export/accountPlanPdfRenderer.js#L84) | Wraps PDF text to the available width and font metrics. | `cleanText`, `textWidth`, `splitLongWord` |
| [`bytesToHex` — 109](../src/lib/export/accountPlanPdfRenderer.js#L109) | Encodes image/binary bytes as hexadecimal PDF content. | — |
| [`normalizeWidths` — 118](../src/lib/export/accountPlanPdfRenderer.js#L118) | Converts relative table column widths into usable renderer dimensions. | — |
| [`pageHeaderMeta` — 202](../src/lib/export/accountPlanPdfRenderer.js#L202) | Builds common PDF header metadata from the summary. | `cleanText` |
| [`drawChrome` — 209](../src/lib/export/accountPlanPdfRenderer.js#L209) | Draws the PDF page's standard header/footer/branding. | `cleanText`, `pageHeaderMeta` |
| [`createDoc` — 256](../src/lib/export/accountPlanPdfRenderer.js#L256) | Creates the PDF drawing/layout state and page-management helpers. | `drawChrome` |
| [`sectionTitle` — 285](../src/lib/export/accountPlanPdfRenderer.js#L285) | Draws a PDF section title and reserves its layout space. | — |
| [`drawHero` — 296](../src/lib/export/accountPlanPdfRenderer.js#L296) | Draws the PDF summary's title/hero block. | — |
| [`drawKeyInfo` — 325](../src/lib/export/accountPlanPdfRenderer.js#L325) | Draws the key account/plan information area. | `sectionTitle` |
| [`drawCardGrid` — 362](../src/lib/export/accountPlanPdfRenderer.js#L362) | Lays out and draws summary cards on PDF pages. | `sectionTitle` |
| [`drawCountSection` — 397](../src/lib/export/accountPlanPdfRenderer.js#L397) | Draws the Barrier/Opportunity count section. | `sectionTitle`, `cardRowsThatFit` |
| [`cardRowsThatFit` — 415](../src/lib/export/accountPlanPdfRenderer.js#L415) | Determines how much card content fits before a page break. | — |
| [`columnPadX` — 489](../src/lib/export/accountPlanPdfRenderer.js#L489) | Returns one PDF table column's padding/text geometry from its definition. | — |
| [`columnPadY` — 490](../src/lib/export/accountPlanPdfRenderer.js#L490) | Returns one PDF table column's padding/text geometry from its definition. | — |
| [`columnLineHeight` — 491](../src/lib/export/accountPlanPdfRenderer.js#L491) | Returns one PDF table column's padding/text geometry from its definition. | — |
| [`columnTextWidth` — 492](../src/lib/export/accountPlanPdfRenderer.js#L492) | Returns one PDF table column's padding/text geometry from its definition. | `columnPadX` |
| [`rowHeightFor` — 494](../src/lib/export/accountPlanPdfRenderer.js#L494) | Measures a PDF table row using wrapped cell text. | `cleanText`, `wrapText`, `columnTextWidth`, `columnLineHeight`, `columnPadY` |
| [`drawTableHeader` — 508](../src/lib/export/accountPlanPdfRenderer.js#L508) | Draws/repeats a PDF table header at the current page position. | — |
| [`drawTable` — 536](../src/lib/export/accountPlanPdfRenderer.js#L536) | Draws a table with wrapped cells and page-break handling. | `normalizeWidths`, `sectionTitle`, `drawTableHeader`, `rowHeightFor`, `columnPadX`, `columnPadY`; more in source |
| [`drawMedicalAccountProfile` — 599](../src/lib/export/accountPlanPdfRenderer.js#L599) | Draws Medical/profile/reference content from the summary model. | `sectionTitle`, `drawTable` |
| [`renderSummary` — 636](../src/lib/export/accountPlanPdfRenderer.js#L636) | Dispatches all executive-summary sections into the PDF layout. | `createDoc`, `drawHero`, `drawKeyInfo`, `drawCardGrid`, `drawMedicalAccountProfile`, `drawCountSection`; more in source |
| [`byteLength` — 676](../src/lib/export/accountPlanPdfRenderer.js#L676) | Measures serialized PDF byte length for offsets. | — |
| [`createPdfBlob` — 678](../src/lib/export/accountPlanPdfRenderer.js#L678) | Serializes PDF objects, pages, streams, fonts/images, cross-reference offsets, and trailer into a PDF Blob. | `bytesToHex`, `byteLength`, `escapePdfText` |
| [`createAccountPlanPdfDocument` — 756](../src/lib/export/accountPlanPdfRenderer.js#L756) | Builds the PDF document/pages from the executive-summary model and supplied renderer options. | `cleanText`, `renderSummary`, `createPdfBlob` |

## src/lib/export/accountPlanPpt.js

[Open source](../src/lib/export/accountPlanPpt.js)

Local dependencies: [accountPlanPptSections.js](../src/lib/export/accountPlanPptSections.js), [accountPlanPptRenderer.js](../src/lib/export/accountPlanPptRenderer.js), [accountPlanPptDelivery.js](../src/lib/export/accountPlanPptDelivery.js), [home.js](../src/lib/dataservice/accountPlan/home.js), [barriersDrivers.js](../src/lib/dataservice/accountPlan/barriersDrivers.js), [criticalActivities.js](../src/lib/dataservice/accountPlan/criticalActivities.js), [accountProfile.js](../src/lib/dataservice/accountPlan/accountProfile.js), [stakeholders.js](../src/lib/dataservice/accountPlan/stakeholders.js), [teamMembers.js](../src/lib/dataservice/accountPlan/teamMembers.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`safeFilePart` — 24](../src/lib/export/accountPlanPpt.js#L24) | Removes/replaces filename-unsafe characters for downloaded export names. | — |
| [`escapeHtml` — 32](../src/lib/export/accountPlanPpt.js#L32) | Escapes interpolated text before writing export helper-window HTML. | — |
| [`writeReadyExportWindow` — 41](../src/lib/export/accountPlanPpt.js#L41) | Populates an export window with ready-file links and instructions using escaped content. | `escapeHtml` |
| [`clickDownloadLink` — 75](../src/lib/export/accountPlanPpt.js#L75) | Creates/clicks a temporary download anchor for a prepared file URL. | — |
| [`loadOrUseCached` — 86](../src/lib/export/accountPlanPpt.js#L86) | Uses a cached page payload when present or invokes its loader. | — |
| [`loadAccountPlanPptData` — 89](../src/lib/export/accountPlanPpt.js#L89) | Collects all six page payloads for exports, reusing App caches and loading missing payloads concurrently. | `loadOrUseCached`, `loadAccountProfile` |
| [`buildAccountPlanPresentation` — 121](../src/lib/export/accountPlanPpt.js#L121) | Builds export title/slide definitions and creates the pptxgenjs presentation. | `buildAccountPlanExportTitle`, `buildAccountPlanPptSlides`, `createAccountPlanPresentation` |
| [`normalizePowerPointXml` — 131](../src/lib/export/accountPlanPpt.js#L131) | Normalizes generated PowerPoint XML values for Office compatibility. | — |
| [`pruneMissingContentTypeOverrides` — 134](../src/lib/export/accountPlanPpt.js#L134) | Removes ZIP content-type declarations that reference absent package parts. | — |
| [`sanitizePowerPointPackage` — 140](../src/lib/export/accountPlanPpt.js#L140) | Cleans generated PPTX package XML/content-type entries before delivery. | `normalizePowerPointXml`, `pruneMissingContentTypeOverrides` |
| [`applyAccountPlanCoverTemplate` — 158](../src/lib/export/accountPlanPpt.js#L158) | Inserts the supplied cover/template assets and relationships into the PPTX package. | `sanitizePowerPointPackage` |
| [`shareOrDownloadBlob` — 168](../src/lib/export/accountPlanPpt.js#L168) | Chooses browser sharing, download, or open/manual fallback for a prepared file and reports delivery diagnostics. | `safeFilePart`, `revokeObjectUrl`, `getPptDeliveryEnvironment`, `shouldBypassWebShare`, `formatPptDeliveryDiagnostic`, `writeReadyExportWindow`; more in source |
| [`revokeObjectUrl` — 173](../src/lib/export/accountPlanPpt.js#L173) | Releases a temporary Blob URL once its delivery lifecycle permits cleanup. | — |
| [`finish` — 178](../src/lib/export/accountPlanPpt.js#L178) | Completes the owning export delivery attempt and performs result/window/URL cleanup. | `revokeObjectUrl` |
| [`prepareAccountPlanPpt` — 312](../src/lib/export/accountPlanPpt.js#L312) | Builds/serializes the presentation, applies/sanitizes the cover package, and returns a prepared PPTX file package. | `loadAccountPlanPptData`, `buildAccountPlanPresentation`, `applyAccountPlanCoverTemplate`, `safeFilePart` |
| [`deliverPreparedAccountPlanPpt` — 331](../src/lib/export/accountPlanPpt.js#L331) | Delivers the already-prepared PPTX using supported share/download/open fallbacks. | `shareOrDownloadBlob` |
| [`exportAccountPlanToPpt` — 343](../src/lib/export/accountPlanPpt.js#L343) | Convenience operation that prepares then delivers the Account Plan PPTX. | `prepareAccountPlanPpt`, `deliverPreparedAccountPlanPpt` |

## src/lib/export/accountPlanPptBarrierGroups.js

[Open source](../src/lib/export/accountPlanPptBarrierGroups.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`barrierGroupMetrics` — 58](../src/lib/export/accountPlanPptBarrierGroups.js#L58) | Builds shared dimensions/options for parent-with-tactics slide layout. | — |
| [`columnsFrom` — 80](../src/lib/export/accountPlanPptBarrierGroups.js#L80) | Converts column definitions into the parent/tactic layout's normalized columns. | — |
| [`columnWidths` — 94](../src/lib/export/accountPlanPptBarrierGroups.js#L94) | Calculates the absolute widths used by the group layout. | — |
| [`lineHeight` — 99](../src/lib/export/accountPlanPptBarrierGroups.js#L99) | Calculates text line height from the configured font/spacing. | — |
| [`estimateTextLines` — 103](../src/lib/export/accountPlanPptBarrierGroups.js#L103) | Estimates wrapped line count to size exported text/table cells. | — |
| [`headerRowHeight` — 125](../src/lib/export/accountPlanPptBarrierGroups.js#L125) | Measures the exported group/table header height. | `barrierGroupMetrics`, `lineHeight` |
| [`usableBarrierGroupHeight` — 130](../src/lib/export/accountPlanPptBarrierGroups.js#L130) | Calculates slide space available after shared chrome/header/footer. | — |
| [`textHeight` — 133](../src/lib/export/accountPlanPptBarrierGroups.js#L133) | Estimates the vertical space needed for a text block. | `estimateTextLines`, `lineHeight` |
| [`measureBarrierCells` — 138](../src/lib/export/accountPlanPptBarrierGroups.js#L138) | Measures the parent's column text cells for group layout. | `textHeight` |
| [`measureTacticRow` — 146](../src/lib/export/accountPlanPptBarrierGroups.js#L146) | Measures a linked tactic row's wrapped text and row height. | `estimateTextLines`, `lineHeight` |
| [`measureZeroStateRow` — 163](../src/lib/export/accountPlanPptBarrierGroups.js#L163) | Measures the no-linked-tactics row for an exported parent group. | `lineHeight` |
| [`finalizeGroup` — 174](../src/lib/export/accountPlanPptBarrierGroups.js#L174) | Attaches final height/count/layout metadata to an export parent group. | — |
| [`measureBarrierGroup` — 191](../src/lib/export/accountPlanPptBarrierGroups.js#L191) | Measures an entire parent plus linked-tactic group before pagination. | `barrierGroupMetrics`, `columnWidths`, `finalizeGroup`, `measureTacticRow`, `measureZeroStateRow`, `measureBarrierCells` |
| [`splitOversizedGroup` — 215](../src/lib/export/accountPlanPptBarrierGroups.js#L215) | Splits a parent group across pages/slides when it exceeds available height. | `finalizeGroup` |
| [`paginateBarrierGroups` — 253](../src/lib/export/accountPlanPptBarrierGroups.js#L253) | Packs measured parent/tactic groups into slide-sized pages while preserving group continuity. | `usableBarrierGroupHeight`, `headerRowHeight`, `measureBarrierGroup`, `flush`, `splitOversizedGroup` |
| [`flush` — 261](../src/lib/export/accountPlanPptBarrierGroups.js#L261) | Commits the current page of measured groups and resets pagination accumulation. | — |

## src/lib/export/accountPlanPptCoverTemplate.js

[Open source](../src/lib/export/accountPlanPptCoverTemplate.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`escapeXmlText` — 1](../src/lib/export/accountPlanPptCoverTemplate.js#L1) | Escapes text inserted into PowerPoint template XML. | — |
| [`replaceTextRun` — 10](../src/lib/export/accountPlanPptCoverTemplate.js#L10) | Replaces a target text run in the supplied cover template. | `escapeXmlText` |
| [`ensureContentType` — 13](../src/lib/export/accountPlanPptCoverTemplate.js#L13) | Adds a required package content-type entry when absent. | — |
| [`removeThinkCellGraphicFrames` — 16](../src/lib/export/accountPlanPptCoverTemplate.js#L16) | Removes unsupported embedded think-cell graphic frames from the cover template. | — |
| [`relationshipId` — 23](../src/lib/export/accountPlanPptCoverTemplate.js#L23) | Extracts a package relationship identifier from XML. | — |
| [`keepRelationships` — 26](../src/lib/export/accountPlanPptCoverTemplate.js#L26) | Filters relationship XML to the relationships still needed by the cleaned cover. | `relationshipId` |
| [`formatCoverDate` — 32](../src/lib/export/accountPlanPptCoverTemplate.js#L32) | Formats the date inserted into the supplied PowerPoint cover. | — |
| [`getCoverAccountName` — 39](../src/lib/export/accountPlanPptCoverTemplate.js#L39) | Selects the Account name displayed on the PowerPoint cover. | — |
| [`applyCoverTemplateContentTypes` — 45](../src/lib/export/accountPlanPptCoverTemplate.js#L45) | Adds/repairs content-type declarations required by imported cover parts. | `ensureContentType` |
| [`sanitizeCoverSlideMasterXml` — 55](../src/lib/export/accountPlanPptCoverTemplate.js#L55) | Removes unsupported/unused cover XML or relationships so the packaged PPTX remains consistent. | `removeThinkCellGraphicFrames` |
| [`sanitizeCoverSlideRelsXml` — 65](../src/lib/export/accountPlanPptCoverTemplate.js#L65) | Removes unsupported/unused cover XML or relationships so the packaged PPTX remains consistent. | `keepRelationships` |
| [`sanitizeCoverSlideMasterRelsXml` — 68](../src/lib/export/accountPlanPptCoverTemplate.js#L68) | Removes unsupported/unused cover XML or relationships so the packaged PPTX remains consistent. | `keepRelationships` |
| [`buildCoverSlideXml` — 71](../src/lib/export/accountPlanPptCoverTemplate.js#L71) | Fills title/account/date values in the supplied cover XML and cleans unsupported content. | `formatCoverDate`, `removeThinkCellGraphicFrames`, `escapeXmlText`, `replaceTextRun` |

## src/lib/export/accountPlanPptDelivery.js

[Open source](../src/lib/export/accountPlanPptDelivery.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`truthy` — 1](../src/lib/export/accountPlanPptDelivery.js#L1) | Interprets browser/environment flag values used by export delivery decisions. | — |
| [`safeNumber` — 3](../src/lib/export/accountPlanPptDelivery.js#L3) | Converts an environment measurement to a finite number with fallback. | — |
| [`getPptDeliveryEnvironment` — 8](../src/lib/export/accountPlanPptDelivery.js#L8) | Captures browser, runtime, viewport, touch, and sharing capabilities relevant to file delivery. | `safeNumber` |
| [`formatPptDeliveryDiagnostic` — 53](../src/lib/export/accountPlanPptDelivery.js#L53) | Formats delivery-environment details for export troubleshooting. | `truthy` |
| [`shouldOfferManualPptOpen` — 71](../src/lib/export/accountPlanPptDelivery.js#L71) | Decides whether this environment needs a manual-open fallback link. | — |
| [`shouldBypassWebShare` — 74](../src/lib/export/accountPlanPptDelivery.js#L74) | Recognizes environments where Web Share should be avoided. | — |
| [`shouldTryWebShare` — 77](../src/lib/export/accountPlanPptDelivery.js#L77) | Decides whether browser file sharing is a supported delivery path. | `shouldBypassWebShare` |
| [`shouldUsePreOpenedPptWindow` — 83](../src/lib/export/accountPlanPptDelivery.js#L83) | Decides whether a window must be opened during the user gesture for later export delivery. | — |

## src/lib/export/accountPlanPptRenderer.js

[Open source](../src/lib/export/accountPlanPptRenderer.js)

Local dependencies: [accountPlanPptBarrierGroups.js](../src/lib/export/accountPlanPptBarrierGroups.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`cleanText` — 30](../src/lib/export/accountPlanPptRenderer.js#L30) | Normalizes export text and whitespace for the owning renderer/table layout. | — |
| [`cleanTableText` — 39](../src/lib/export/accountPlanPptRenderer.js#L39) | Normalizes export text and whitespace for the owning renderer/table layout. | — |
| [`limitText` — 49](../src/lib/export/accountPlanPptRenderer.js#L49) | Shortens display text to the module's limit with its truncation policy. | `cleanTableText` |
| [`normalizeColWidths` — 54](../src/lib/export/accountPlanPptRenderer.js#L54) | Converts relative table column widths into usable renderer dimensions. | — |
| [`setSlideBackground` — 61](../src/lib/export/accountPlanPptRenderer.js#L61) | Applies the common presentation background to a slide. | — |
| [`addKiteRule` — 65](../src/lib/export/accountPlanPptRenderer.js#L65) | Draws the Kite-branded divider/rule on a slide. | — |
| [`addHeader` — 76](../src/lib/export/accountPlanPptRenderer.js#L76) | Draws the common presentation header/footer and document metadata. | `setSlideBackground`, `addKiteRule` |
| [`addFooter` — 128](../src/lib/export/accountPlanPptRenderer.js#L128) | Draws the common presentation header/footer and document metadata. | — |
| [`addCardBackground` — 153](../src/lib/export/accountPlanPptRenderer.js#L153) | Draws the shared presentation card background/border. | — |
| [`addTitleSlide` — 166](../src/lib/export/accountPlanPptRenderer.js#L166) | Draws the presentation title/cover slide content. | `setSlideBackground`, `cleanText` |
| [`addCardsSlide` — 252](../src/lib/export/accountPlanPptRenderer.js#L252) | Draws a slide of summary/information cards. | `cleanText`, `addCardBackground` |
| [`addBoxesSlide` — 397](../src/lib/export/accountPlanPptRenderer.js#L397) | Draws the configured grouped information boxes on a slide. | `addCardBackground`, `cleanText` |
| [`tableCell` — 433](../src/lib/export/accountPlanPptRenderer.js#L433) | Builds a styled PowerPoint table cell. | `limitText` |
| [`addTableSlide` — 448](../src/lib/export/accountPlanPptRenderer.js#L448) | Draws one slide from a table definition, including headings and empty-state content. | `tableCell`, `normalizeColWidths` |
| [`addBarrierGroupsSlide` — 516](../src/lib/export/accountPlanPptRenderer.js#L516) | Draws parent groups with their linked tactic rows using precomputed geometry. | `barrierGroupMetrics`, `tableCell`, `headerRowHeight`, `columnWidths` |
| [`createAccountPlanPresentation` — 631](../src/lib/export/accountPlanPptRenderer.js#L631) | Creates the pptxgenjs document and dispatches each slide definition to the corresponding slide renderer. | `addTitleSlide`, `addHeader`, `addCardsSlide`, `addBoxesSlide`, `addBarrierGroupsSlide`, `addTableSlide`; more in source |

## src/lib/export/accountPlanPptSections.js

[Open source](../src/lib/export/accountPlanPptSections.js)

Local dependencies: [accountPlanPptBarrierGroups.js](../src/lib/export/accountPlanPptBarrierGroups.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`hasValue` — 9](../src/lib/export/accountPlanPptSections.js#L9) | Tests for a non-null, non-undefined, nonempty value according to the owning module. | — |
| [`toText` — 11](../src/lib/export/accountPlanPptSections.js#L11) | Converts a value into the owning export model's display text/fallback. | `hasValue` |
| [`lastFieldDirectorReviewDisplay` — 18](../src/lib/export/accountPlanPptSections.js#L18) | Builds review-date/status text used in export headers and summary fields. | `formatDate` |
| [`buildCurrentKpiCards` — 21](../src/lib/export/accountPlanPptSections.js#L21) | Builds export KPI cards from current Account/header information. | `toText`, `lastFieldDirectorReviewDisplay` |
| [`formatDate` — 28](../src/lib/export/accountPlanPptSections.js#L28) | Formats a date for the owning export layout; source defines the exact style/fallback. | — |
| [`formatDayMonth` — 48](../src/lib/export/accountPlanPptSections.js#L48) | Formats a date for the owning export layout; source defines the exact style/fallback. | — |
| [`chunkRows` — 60](../src/lib/export/accountPlanPptSections.js#L60) | Partitions rows into the requested maximum-size groups. | — |
| [`emptySectionMessage` — 69](../src/lib/export/accountPlanPptSections.js#L69) | Provides the appropriate empty-content message for an export section. | — |
| [`atcMedicalProfileFields` — 94](../src/lib/export/accountPlanPptSections.js#L94) | Defines the exported Medical profile label/property fields. | — |
| [`splitMultiSelect` — 113](../src/lib/export/accountPlanPptSections.js#L113) | Splits stored multi-select text into normalized individual selections. | — |
| [`hasEducationStatus` — 125](../src/lib/export/accountPlanPptSections.js#L125) | Checks whether an education option has a populated status for export display. | — |
| [`medicalEducationText` — 129](../src/lib/export/accountPlanPptSections.js#L129) | Combines selected education options and their individual statuses into export text. | `splitMultiSelect`, `toText`, `hasEducationStatus` |
| [`medicalProfileValue` — 140](../src/lib/export/accountPlanPptSections.js#L140) | Formats one Medical profile field for export output. | `medicalEducationText`, `toText`, `splitMultiSelect` |
| [`medicalProfileRows` — 148](../src/lib/export/accountPlanPptSections.js#L148) | Builds export table rows for one indication's Medical profile. | `atcMedicalProfileFields`, `medicalProfileValue` |
| [`addTableSlides` — 152](../src/lib/export/accountPlanPptSections.js#L152) | Splits a large section into table-slide definitions and appends them. | `chunkRows`, `emptySectionMessage` |
| [`activeStatusFlag` — 170](../src/lib/export/accountPlanPptSections.js#L170) | Interprets active/inactive boolean-like values for membership/display logic. | — |
| [`teamMemberStatus` — 179](../src/lib/export/accountPlanPptSections.js#L179) | Builds the displayed member active/inactive status for export content. | `activeStatusFlag`, `toText` |
| [`truncate` — 187](../src/lib/export/accountPlanPptSections.js#L187) | Shortens display text to the module's limit with its truncation policy. | — |
| [`relationshipKey` — 193](../src/lib/export/accountPlanPptSections.js#L193) | Normalizes a record ID for joining parents and tactics in export content. | — |
| [`barrierContext` — 199](../src/lib/export/accountPlanPptSections.js#L199) | Builds the exported parent title/type/strategy context for linked tactics. | `toText`, `truncate` |
| [`medicalTacticEntry` — 214](../src/lib/export/accountPlanPptSections.js#L214) | Maps one tactic into the export's row/group representation. | `toText`, `formatDayMonth`, `truncate` |
| [`buildBarrierTacticGroups` — 234](../src/lib/export/accountPlanPptSections.js#L234) | Joins parents to their linked tactics for grouped export sections. | `relationshipKey`, `barrierContext` |
| [`addBarrierGroupSlides` — 252](../src/lib/export/accountPlanPptSections.js#L252) | Paginates parent/tactic groups and adds corresponding slide definitions. | `paginateBarrierGroups`, `emptySectionMessage` |
| [`buildAccountPlanPptSlides` — 268](../src/lib/export/accountPlanPptSections.js#L268) | Builds the full ordered slide-definition model from all six page payloads. | `buildAccountPlanExportTitle`, `toText`, `lastFieldDirectorReviewDisplay`, `buildCurrentKpiCards`, `buildBarrierTacticGroups`, `addBarrierGroupSlides`; more in source |
| [`buildAccountPlanExportTitle` — 410](../src/lib/export/accountPlanPptSections.js#L410) | Builds a usable Account Plan document filename/title from plan/account data. | — |

## src/lib/mockData/fixtures.js

[Open source](../src/lib/mockData/fixtures.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`wrap` — 13](../src/lib/mockData/fixtures.js#L13) | Converts a plain fixture record to CRM-style value cells. | — |
| [`fixtureCellValue` — 754](../src/lib/mockData/fixtures.js#L754) | Reads a cell value while rebinding fixture records. | — |
| [`replacePlanIdCells` — 756](../src/lib/mockData/fixtures.js#L756) | Replaces fixture plan-reference cells with the selected context ID. | `fixtureCellValue` |
| [`fixtureRowsForAccountPlan` — 775](../src/lib/mockData/fixtures.js#L775) | Returns fictional rows rebound to the active plan context. | `replacePlanIdCells`, `fixtureCellValue` |
| [`stripOuterParens` — 807](../src/lib/mockData/fixtures.js#L807) | Removes enclosing parentheses before the simplified mock predicate parser evaluates an expression. | — |
| [`filterByWhere` — 815](../src/lib/mockData/fixtures.js#L815) | Evaluates the subset of query predicates supported by local fixtures. | `stripOuterParens`, `parseExpectedValue`, `parseInValues` |
| [`parseExpectedValue` — 824](../src/lib/mockData/fixtures.js#L824) | Parses a scalar expected value from the mock WHERE syntax. | — |
| [`parseInValues` — 831](../src/lib/mockData/fixtures.js#L831) | Parses values in a mock IN-list. | — |

## src/lib/mockData/mockAdapter.js

[Open source](../src/lib/mockData/mockAdapter.js)

Local dependencies: [fixtures.js](../src/lib/mockData/fixtures.js), [mockPersistence.js](../src/lib/mockData/mockPersistence.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`bindMockAccountPlanContext` — 42](../src/lib/mockData/mockAdapter.js#L42) | Binds fictional records to the selected plan in mock builds; the live stub version deliberately returns null. | — |
| [`persistedObjectKey` — 48](../src/lib/mockData/mockAdapter.js#L48) | Chooses the object-specific persistence key used by mock writes. | — |
| [`wrap` — 51](../src/lib/mockData/mockAdapter.js#L51) | Converts a plain fixture record to CRM-style value cells. | — |
| [`resolveQuery` — 59](../src/lib/mockData/mockAdapter.js#L59) | Runs the mock query/filter/sort/limit logic and applies local persisted overrides. | `persistedObjectKey`, `persistedMockRecords`, `fixtureRowsForAccountPlan`, `applyPersistedMockRecord`, `isPersistedMockRecordDeleted`, `filterByWhere` |
| [`barrierDriverStrategyMetadata` — 335](../src/lib/mockData/mockAdapter.js#L335) | Builds mock metadata for Medical strategy options and their dependencies. | — |
| [`runQuery` — 350](../src/lib/mockData/mockAdapter.js#L350) | Executes the simplified fixture query and returns a Veeva-shaped data response. | `resolveQuery` |
| [`queryRecord` — 354](../src/lib/mockData/mockAdapter.js#L354) | Returns the first matching fixture record in a Veeva-shaped response. | `resolveQuery` |
| [`getDataForCurrentObject` — 359](../src/lib/mockData/mockAdapter.js#L359) | Returns fictional context identity/plan fields, including local reviewer-demo overrides. | — |
| [`getPicklistValueLabels` — 389](../src/lib/mockData/mockAdapter.js#L389) | Returns the fixture metadata labels for the requested object/field. | — |
| [`viewRecord` — 397](../src/lib/mockData/mockAdapter.js#L397) | Imitates record navigation for local preview without a live CRM destination. | — |
| [`createRecord` — 402](../src/lib/mockData/mockAdapter.js#L402) | Creates a fictional record and stores it in local mock persistence. | `persistMockRecordCreation`, `persistedObjectKey` |
| [`updateRecord` — 417](../src/lib/mockData/mockAdapter.js#L417) | Applies fields to a fictional record and persists the local override. | `persistMockRecordUpdate`, `persistedObjectKey` |
| [`deleteRecord` — 430](../src/lib/mockData/mockAdapter.js#L430) | Marks/removes a fictional record in local mock persistence. | `persistMockRecordDeletion`, `persistedObjectKey` |
| [`getAvailableObjects` — 438](../src/lib/mockData/mockAdapter.js#L438) | Lists the mock adapter's fixture-backed object names. | — |
| [`getObjectMetadata` — 442](../src/lib/mockData/mockAdapter.js#L442) | Returns the mock object metadata used to illustrate dependency behavior. | — |

## src/lib/mockData/mockPersistence.js

[Open source](../src/lib/mockData/mockPersistence.js)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`browserStorage` — 5](../src/lib/mockData/mockPersistence.js#L5) | Safely obtains browser storage for mock persistence or a no-storage fallback. | — |
| [`readOverrides` — 14](../src/lib/mockData/mockPersistence.js#L14) | Reads/parses stored mock overrides while handling unavailable/invalid storage. | — |
| [`readObjectMap` — 24](../src/lib/mockData/mockPersistence.js#L24) | Returns the persisted record map for one mock object. | — |
| [`writeObjectMap` — 34](../src/lib/mockData/mockPersistence.js#L34) | Serializes the updated mock object map into browser storage. | — |
| [`persistMockRecordUpdate` — 43](../src/lib/mockData/mockPersistence.js#L43) | Stores changed fields for a mock record. | `browserStorage`, `readOverrides` |
| [`clearPersistedMockRecordFields` — 61](../src/lib/mockData/mockPersistence.js#L61) | Removes selected persisted overrides so fixture/default values can apply again. | `browserStorage`, `readOverrides` |
| [`applyPersistedMockRecord` — 89](../src/lib/mockData/mockPersistence.js#L89) | Overlays local saved fields on a fixture record. | `browserStorage`, `readOverrides` |
| [`persistMockRecordCreation` — 101](../src/lib/mockData/mockPersistence.js#L101) | Adds a locally created mock record to browser persistence. | `browserStorage`, `readObjectMap`, `writeObjectMap` |
| [`persistedMockRecords` — 113](../src/lib/mockData/mockPersistence.js#L113) | Returns the locally created records for a mock object. | `browserStorage`, `readObjectMap` |
| [`persistMockRecordDeletion` — 118](../src/lib/mockData/mockPersistence.js#L118) | Records local deletion of a mock record. | `browserStorage`, `readObjectMap`, `writeObjectMap` |
| [`isPersistedMockRecordDeleted` — 130](../src/lib/mockData/mockPersistence.js#L130) | Checks whether local persistence marks a mock record deleted. | `browserStorage`, `readObjectMap` |

## scripts/export-medical-crm-mapping.mjs

[Open source](../scripts/export-medical-crm-mapping.mjs)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`field` — 14](../scripts/export-medical-crm-mapping.mjs#L14) | Registers one field definition in the CRM-mapping export generator. | — |
| [`walkJavaScriptFiles` — 297](../scripts/export-medical-crm-mapping.mjs#L297) | Recursively enumerates application JavaScript files for mapping coverage inspection. | `readdir`, `join` |
| [`validateCustomFieldCoverage` — 305](../scripts/export-medical-crm-mapping.mjs#L305) | Checks that documented mapping definitions cover detected custom CRM field usage. | `resolve`, `walkJavaScriptFiles`, `readFile` |
| [`humanize` — 340](../scripts/export-medical-crm-mapping.mjs#L340) | Turns an API-style field key into a readable mapping label. | — |
| [`csvCell` — 350](../scripts/export-medical-crm-mapping.mjs#L350) | Escapes a value for a CSV cell. | — |
| [`consumersForGroup` — 436](../scripts/export-medical-crm-mapping.mjs#L436) | Lists code consumers for a CRM mapping group. | — |
| [`xmlEscape` — 473](../scripts/export-medical-crm-mapping.mjs#L473) | Escapes workbook XML text in generated mapping artifacts. | — |
| [`excelColumn` — 480](../scripts/export-medical-crm-mapping.mjs#L480) | Converts a zero-based column index into spreadsheet column letters. | — |

## scripts/generate-mock-ppt.mjs

[Open source](../scripts/generate-mock-ppt.mjs)

Local dependencies: [accountPlanPptSections.js](../src/lib/export/accountPlanPptSections.js), [accountPlanPptCoverTemplate.js](../src/lib/export/accountPlanPptCoverTemplate.js), [accountPlanPptRenderer.js](../src/lib/export/accountPlanPptRenderer.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`nextXmlId` — 45](../scripts/generate-mock-ppt.mjs#L45) | Allocates an unused relationship/XML identifier for the mock PPT generator. | — |
| [`addCoverSlideMasterToPresentation` — 52](../scripts/generate-mock-ppt.mjs#L52) | Adds imported cover/master references to the generated demonstration PowerPoint package. | `nextXmlId` |

## scripts/postbuild.mjs

[Open source](../scripts/postbuild.mjs)

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`inlineVeevaRuntime` — 38](../scripts/postbuild.mjs#L38) | Replaces packaged Q/MyInsights script references with embedded base64 script sources. | — |
| [`runPowerShell` — 62](../scripts/postbuild.mjs#L62) | Tries available PowerShell executables for ZIP packaging and reports command failures. | `spawnSync` |
| [`zipSingleFile` — 78](../scripts/postbuild.mjs#L78) | Creates a ZIP containing the root HTML using PowerShell or the zip executable. | `runPowerShell`, `spawnSync` |
| [`main` — 95](../scripts/postbuild.mjs#L95) | Packages the Vite output into live/training labelled single-HTML ZIP artifacts. | `inlineVeevaRuntime`, `zipSingleFile` |

## scripts/verify-training-data.mjs

[Open source](../scripts/verify-training-data.mjs)

Local dependencies: [fixtures.js](../src/lib/mockData/fixtures.js).

| Function (source line) | What it does | Selected calls/components |
| --- | --- | --- |
| [`unwrap` — 15](../scripts/verify-training-data.mjs#L15) | Converts CRM field cells into a plain record; script-local versions perform the equivalent fixture unwrapping. | — |
| [`rows` — 18](../scripts/verify-training-data.mjs#L18) | Unwraps fixture rows for training-data verification. | — |
| [`desktopRows` — 57](../scripts/verify-training-data.mjs#L57) | Builds/verifies the desktop demonstration rows in the training-data verification script. | `fixtureRowsForAccountPlan` |

## Supporting assets and non-function files

CSS/fonts control presentation. Bundled PDFs and the loader HTML supply help/loading assets. PowerPoint cover XML/images/relationships are template assets, not application logic. `accountPlanPptCoverTemplateXml.js` imports/exports those template parts. `criticalActivityHelp.js` supplies help-copy constants.

Python scripts under `scripts/` generate existing handoff documents, field mappings, and picklist workbooks; they do not run when the application opens in Veeva. JavaScript mapping/demo generators above are similarly development tools.

The source was parsed to enumerate the named JavaScript functions and validate catalog coverage. The guide/catalog were added without changing application source or existing uncommitted work. No CRM/device integration or deployed build was verified by this documentation task.
