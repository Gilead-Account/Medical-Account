import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const sidebarCss = await readFile(
  new URL('../src/components/Sidebar.css', import.meta.url),
  'utf8'
);
const sidebarSource = await readFile(
  new URL('../src/components/Sidebar.jsx', import.meta.url),
  'utf8'
);
const sharedAccountPlanSource = await readFile(
  new URL('../src/lib/dataservice/accountPlan/shared.js', import.meta.url),
  'utf8'
);

test('sidebar account card prefers the selected CRM Account Plan name', () => {
  assert.match(
    sidebarSource,
    /const accountPlanName\s*=\s*[\s\S]*?plan && plan\.name[\s\S]*?account && account\.name/
  );
  assert.match(sidebarSource, /title=\{accountPlanName\}>\{accountPlanName\}/);
});

test('sidebar account card reads EID from the selected Account Plan', () => {
  assert.match(sidebarSource, /const eid\s*=\s*plan && plan\.eid/);
  assert.doesNotMatch(sidebarSource, /const eid\s*=\s*account && account\.eid/);
  assert.match(sharedAccountPlanSource, /const PLAN_FIELDS_BASE\s*=\s*\[[\s\S]*?'KPH_ATC_EID__c'/);
  assert.match(sharedAccountPlanSource, /eid:\s*r\.KPH_ATC_EID__c \|\| null/);
});

test('sidebar account card stays within the nav rail while using compact readable stat rows', () => {
  assert.match(sidebarCss, /\.sidebar-account-card[\s\S]*?box-sizing:\s*border-box/);
  assert.match(sidebarCss, /\.sidebar-account-card[\s\S]*?width:\s*100%/);
  assert.match(sidebarCss, /\.sidebar-account-card[\s\S]*?max-width:\s*100%/);
  assert.match(sidebarCss, /\.sidebar-stat-card[\s\S]*?grid-template-columns:\s*22px minmax\(0,\s*1fr\)/);
  assert.match(sidebarCss, /\.sidebar-stat-card[\s\S]*?min-height:\s*38px/);
  assert.match(sidebarCss, /\.sidebar-stat-card[\s\S]*?padding:\s*5px 7px/);
  assert.match(sidebarCss, /\.sidebar-stat-copy span[\s\S]*?font-size:\s*9\.2px/);
  assert.match(sidebarCss, /\.sidebar-stat-copy strong[\s\S]*?font-size:\s*11px/);
});

test('tablet sidebar media query does not shrink account stat text back down', () => {
  assert.match(sidebarCss, /@media \(min-width:\s*721px\) and \(max-width:\s*1400px\)[\s\S]*?\.sidebar-stat-card[\s\S]*?min-height:\s*clamp\(36px,\s*4vh,\s*38px\)/);
  assert.match(sidebarCss, /@media \(min-width:\s*721px\) and \(max-width:\s*1400px\)[\s\S]*?\.sidebar-stat-card[\s\S]*?padding:\s*clamp\(4px,\s*0\.52vh,\s*5px\) clamp\(6px,\s*0\.62vw,\s*7px\)/);
  assert.match(sidebarCss, /@media \(min-width:\s*721px\) and \(max-width:\s*1400px\)[\s\S]*?\.sidebar-stat-copy span[\s\S]*?font-size:\s*clamp\(9px,\s*0\.76vw,\s*9\.2px\)/);
  assert.match(sidebarCss, /@media \(min-width:\s*721px\) and \(max-width:\s*1400px\)[\s\S]*?\.sidebar-stat-copy strong[\s\S]*?font-size:\s*clamp\(10\.8px,\s*0\.95vw,\s*11px\)/);
});

test('sidebar help popup has separate Help and Guardrails section styling', () => {
  assert.match(sidebarCss, /\.sidebar-policy-help-sections/);
  assert.match(sidebarCss, /\.sidebar-policy-help-section\.is-guardrails/);
  assert.match(sidebarCss, /\.sidebar-policy-help-section\.is-help/);
  assert.match(sidebarCss, /\.sidebar-policy-help-button[\s\S]*?box-sizing:\s*border-box/);
  assert.match(sidebarCss, /\.sidebar-policy-help-button[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\) auto/);
  assert.match(sidebarCss, /\.sidebar-policy-help-button[\s\S]*?max-width:\s*100%/);
  assert.match(sidebarCss, /\.sidebar-policy-help-button[\s\S]*?min-height:\s*34px/);
  assert.match(sidebarCss, /\.sidebar-policy-help-inline-help \.field-help-button[\s\S]*?width:\s*15px/);
  assert.match(sidebarCss, /\.sidebar-policy-help-inline-help \.field-help-button[\s\S]*?border-color:\s*#a8d4e6/);
  assert.doesNotMatch(sidebarCss, /sidebar-policy-help-icon/);
  assert.doesNotMatch(sidebarCss, /sidebar-policy-help-copy small/);
});

test('export submit MRD trigger uses a fixed-size SVG caret across desktop and iPad states', () => {
  assert.match(sidebarSource, /<svg[\s\S]*?className="sidebar-export-caret-icon"/);
  assert.doesNotMatch(sidebarSource, /isExportMenuOpen \? '.*' : '.*'/);
  assert.match(sidebarCss, /\.sidebar-export-caret[\s\S]*?flex:\s*0 0 18px/);
  assert.match(sidebarCss, /\.sidebar-export-caret[\s\S]*?width:\s*18px/);
  assert.match(sidebarCss, /\.sidebar-export-caret[\s\S]*?height:\s*18px/);
  assert.match(sidebarCss, /\.sidebar-export-caret-icon[\s\S]*?width:\s*16px/);
  assert.match(sidebarCss, /\.sidebar-export-caret-icon[\s\S]*?height:\s*16px/);
  assert.match(
    sidebarCss,
    /@media \(min-width:\s*721px\) and \(max-width:\s*1400px\)[\s\S]*?\.sidebar-export-caret[\s\S]*?flex:\s*0 0 18px/
  );
});
