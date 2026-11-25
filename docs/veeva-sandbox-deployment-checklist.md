# Veeva sandbox training deployment

## Data mode

`npm run build:training` creates the **training/mock** MyInsights ZIP. The package
contains the records in `src/lib/mockData/fixtures.js` and the picklists in
`src/lib/mockData/mockAdapter.js`. When deployed inside Veeva, it reads the
real `Account_Plan_vod__c` records visible through Salesforce sharing. Desktop
users first see that real Account Plan listing; selecting Open reads the real
plan and parent Account shell data. iPad users entering from an Account Plan
record use that current record directly. The bundled Northstar Medical
scenario is then bound to the selected real plan; Medical page and child data
remain mocked.

The training package therefore requires a readable CRM Account Plan record and
the Account Plan MyInsights entry point, but it does not require the pending
Medical child-field APIs or CRM picklist metadata to display its scenario. If
Veeva does not provide a current Account Plan ID, the deployed app shows its
missing-context state instead of silently loading an unrelated mock plan.

When available, the selected Account Plan, its parent Account, and the signed-in
Veeva User identity/profile are read from the runtime so MSL, MRD, and FD
role-specific controls can behave appropriately.
If that User context is unavailable, the package falls back to its mock MSL
identity; the account-plan records remain mocked in either case.

`npm run build` and `npm run build:live` create the live CRM package. That
package excludes fixtures and uses Veeva DataService for reads and writes.

On iPad, live DataService reads come from Veeva's synchronized offline
database. Desktop or Legacy changes therefore become available only after the
iPad completes an inbound Veeva sync. When the user returns to this MyInsights
app after syncing, the app refreshes all pages already loaded in the workspace
so the newly downloaded values replace its in-memory page cache. If values are
still absent after a successful device sync and app resume, verify the affected
objects, fields, and record criteria in the applicable Veeva Mobile Object
Configuration; the HTML report cannot download records excluded from that
configuration.

## Included training data

The bundled scenario includes:

- Account Plan and parent Northstar Cancer Center Account.
- Medical profile values and populated profile picklists.
- Medical strategies, barriers, opportunities, and linked Medical Tactics.
- Team Members and populated participation/status picklists.
- Stakeholders linked to mock Person Accounts whose
  `Primary_Parent_vod__c` points to the mock Northstar HCO.
- Referral mappings, healthcare networks, and regional dynamics.

Run `npm run verify:training-data` before packaging. It validates plan/child
relationships, Medical Tactic parents, stakeholder Person Account and primary
parent relationships, Team Member User links, and required picklist coverage.

## Training changes and persistence

Create, update, and confirmed delete actions in mock mode are saved to browser
storage. The baseline fixtures and locally created data are merged on every
load; deleted records remain hidden and edits remain applied after closing and
reopening the page as long as the Veeva webview retains its site storage.

This is intentionally different from CRM persistence:

- The training bundle's CRM adapter is read-only. No create, update, approval,
  or delete action can invoke Veeva CRM mutation methods.
- Changes are local to the browser/webview storage partition on that device.
- They are not synchronized between different iPads or different Veeva users'
  isolated webview storage.
- Clearing application/site data or reinstalling the Veeva client can reset
  local changes back to the bundled baseline fixtures.
- The bundled baseline mock scenario is present for every readable CRM Account
  Plan opened through the MyInsights package, regardless of MSL, MRD, or FD
  role.
- Locally created/edited/deleted mock records are isolated by the real CRM
  Account Plan ID, so training changes on one plan do not alter another plan.
- The desktop launcher deliberately has no Commercial ATC or Medical-field
  filter while Medical discriminator APIs are pending. Salesforce record
  sharing determines which Account Plans the signed-in Medical user can list.

Shared user-created changes across users/devices cannot be guaranteed without
a shared backend such as CRM. Once the Medical APIs are available, switch to
`npm run build:live` for durable, shared CRM records.

## Deployment verification

1. Run `npm run verify:training-data`.
2. Run `npm run build:training`.
3. Upload the ZIP whose filename contains `training` to an `HTML_Report_vod`
   record with the `Account_Plan_vod` record type.
4. Open a readable active Account Plan record while online and offline on the
   iPad.
5. Create and edit a barrier, stakeholder, Team Member, Referral Mapping, and
   Medical Tactic; close and reopen the plan and confirm each remains.
6. Delete one child record through its confirmation action; close and reopen
   and confirm it remains hidden.
7. Sign in as each role to confirm the bundled baseline is visible. Treat any
   user-created changes as device/user-local until the live CRM build is used.
