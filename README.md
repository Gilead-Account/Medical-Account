# Medical Account Plan

React + Vite implementation of the Medical Account Plan for Veeva MyInsights.
Local development uses a Veeva-shaped mock adapter, so the complete plan can be
reviewed without a CRM login or connected data.

## Preview on localhost

From this repository:

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). The local preview opens
directly into the seeded **FY26 Medical Account Plan - Northstar ATC**. It
includes medical Barriers, Opportunities, Medical Tactics, and a Home Medical
Strategy summary for DLBCL and MM.

The training package uses CRM only to read the selected Account Plan, its
parent Account, and signed-in user context. All Medical feature data remains
mocked and all training writes remain local.

## Mock data

- CRM-shaped records: `src/lib/mockData/fixtures.js`
- Picklists and local Veeva adapter: `src/lib/mockData/mockAdapter.js`

The current sample plan includes:

- Barrier: Treatment decisions focused on Bispecifics
- Opportunities: Deliver Channel Data to HCPs, Confirm EAP Requirements, and
  RWE Trial Support
- Medical Tactics: Schedule Discussion with OLs at ATC, Partner with Sci Comm
  on Content, and Review Patient Population Candidates
- Medical Strategy: Drive confidence in early use of CAR-T and Establish
  outpatient expansion for DLBCL/Portfolio; MM Launch Prep for MM

## Build for Veeva CRM

```bash
npm run build
```

The default output is the live CRM build written to `dist/`. It excludes the
mock fixtures and uses Veeva's runtime DataService (`window.ds`) for Account
Plan and related-object reads and writes. The package must run inside Veeva
MyInsights; outside Veeva it reports that the DataService runtime is missing
instead of silently loading mock records. Asset paths remain relative for
MyInsights hosting.

`npm run build:live` is an explicit alias for the same live build. For local
demonstrations only, `npm run build:training` creates the separate mock-backed
training package. Do not deploy that training ZIP when CRM persistence is
required.

Before a sandbox training deployment, follow the
[Veeva sandbox deployment and training-data checklist](docs/veeva-sandbox-deployment-checklist.md).
Use `npm run verify:training-data` only when intentionally preparing the
separate training package.
