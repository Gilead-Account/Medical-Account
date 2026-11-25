from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter


OUTPUT = Path(__file__).resolve().parents[1] / "docs" / "Medicalv2_Picklist_API_Name_Rules.xlsx"

NAVY = "17365D"
BLUE = "0070C0"
LIGHT_BLUE = "D9EAF7"
PALE_BLUE = "EAF4FB"
GREEN = "E2F0D9"
YELLOW = "FFF2CC"
RED = "FCE4D6"
WHITE = "FFFFFF"
GRAY = "E7E6E6"
TEXT = "1F2937"
THIN = Side(style="thin", color="B8C2CC")


def title(ws, text, subtitle=None):
    ws.sheet_view.showGridLines = False
    ws.merge_cells("A1:H1")
    cell = ws["A1"]
    cell.value = text
    cell.fill = PatternFill("solid", fgColor=NAVY)
    cell.font = Font(color=WHITE, bold=True, size=16)
    cell.alignment = Alignment(vertical="center")
    ws.row_dimensions[1].height = 28
    if subtitle:
        ws.merge_cells("A2:H2")
        sub = ws["A2"]
        sub.value = subtitle
        sub.fill = PatternFill("solid", fgColor=LIGHT_BLUE)
        sub.font = Font(color=TEXT, italic=True, size=10)
        sub.alignment = Alignment(wrap_text=True, vertical="center")
        ws.row_dimensions[2].height = 32


def table(ws, start_row, headers, rows, widths=None, freeze=None):
    for column, header in enumerate(headers, 1):
        cell = ws.cell(start_row, column, header)
        cell.fill = PatternFill("solid", fgColor=BLUE)
        cell.font = Font(color=WHITE, bold=True)
        cell.alignment = Alignment(wrap_text=True, vertical="center")
        cell.border = Border(top=THIN, bottom=THIN, left=THIN, right=THIN)
    ws.row_dimensions[start_row].height = 32

    for row_index, values in enumerate(rows, start_row + 1):
        for column, value in enumerate(values, 1):
            cell = ws.cell(row_index, column, value)
            cell.fill = PatternFill("solid", fgColor=WHITE if row_index % 2 else PALE_BLUE)
            cell.font = Font(color=TEXT, size=10)
            cell.alignment = Alignment(wrap_text=True, vertical="top")
            cell.border = Border(top=THIN, bottom=THIN, left=THIN, right=THIN)
        ws.row_dimensions[row_index].height = max(30, 15 * (1 + max(str(v).count("\n") for v in values)))

    end_row = start_row + len(rows)
    end_col = len(headers)
    ws.auto_filter.ref = f"A{start_row}:{get_column_letter(end_col)}{end_row}"
    if widths:
        for index, width in enumerate(widths, 1):
            ws.column_dimensions[get_column_letter(index)].width = width
    if freeze:
        ws.freeze_panes = freeze


def note(ws, row, heading, body, fill=YELLOW):
    ws.cell(row, 1, heading)
    ws.cell(row, 1).font = Font(bold=True, color=TEXT)
    ws.cell(row, 1).fill = PatternFill("solid", fgColor=fill)
    ws.merge_cells(start_row=row, start_column=2, end_row=row, end_column=8)
    ws.cell(row, 2, body)
    ws.cell(row, 2).alignment = Alignment(wrap_text=True, vertical="top")
    ws.cell(row, 2).fill = PatternFill("solid", fgColor=fill)
    for col in range(1, 9):
        ws.cell(row, col).border = Border(top=THIN, bottom=THIN, left=THIN, right=THIN)
    ws.row_dimensions[row].height = 42


wb = Workbook()
ws = wb.active
ws.title = "Read Me"
title(
    ws,
    "Medicalv2 Picklist API-Name Rules",
    "Current implementation reference for Barrier Title, Opportunity Title, Medical Strategy, and Medical Tactic.",
)
ws.column_dimensions["A"].width = 27
for col in range(2, 9):
    ws.column_dimensions[get_column_letter(col)].width = 18

note(ws, 4, "Core principle", "The API name controls eligibility. The user sees the CRM label, but the application saves the exact API value returned by CRM.", GREEN)
note(ws, 6, "Indication suffix", "Use a final delimiter with spaces:  | DLBCL,  | MM, or  | MM, DLBCL. Comma order is not important. Matching is case-insensitive, but the recommended API naming uses uppercase indications.")
note(ws, 8, "No suffix", "A value without a final supported indication suffix is excluded for both DLBCL and MM. Placeholder and legacy values are not fallback options.", RED)
note(ws, 10, "Live metadata", "Options are built from active CRM picklist metadata at runtime. There are no hardcoded title, strategy, or tactic option lists.", LIGHT_BLUE)
note(ws, 12, "Current scope", "Barrier/Opportunity creation supports DLBCL and MM. Portfolio and other indications are not shown by these rules.")
note(ws, 14, "Implementation", "Medicalv2 behavior documented after commit fb3df2b. Generated 29 September 2026.", GRAY)

ws = wb.create_sheet("Rule Matrix")
title(ws, "Rule Matrix", "How each field's API name is interpreted.")
headers = [
    "Picklist",
    "Salesforce field API",
    "Required API-name format",
    "Type marker",
    "Indication rule",
    "Excluded when",
    "Saved value",
    "Example",
]
rows = [
    [
        "Barrier Title",
        "KPH_Barrier_Title__c",
        "<title> | <indication list>",
        "None",
        "Shown only when the selected indication appears after the final |. Supported: DLBCL, MM.",
        "No final ' | '; suffix has neither DLBCL nor MM; inactive in CRM.",
        "Exact CRM API value",
        "Confidence in AE management with community ATCs | MM",
    ],
    [
        "Opportunity Title",
        "KPH_Opportunity_Title__c",
        "<title> | <indication list>",
        "None",
        "Same indication rule as Barrier Title.",
        "No final ' | '; suffix has neither DLBCL nor MM; inactive in CRM.",
        "Exact CRM API value",
        "Potential Kite Clinical Trial Site | MM, DLBCL",
    ],
    [
        "Medical Strategy",
        "KPH_Medical_Strategy__c",
        "<strategy> (Med) | <indication list>",
        "Must contain (Med), case-insensitive.",
        "After passing the (Med) test, shown only for indications listed after the final |.",
        "Missing (Med); no supported suffix; inactive in CRM.",
        "Exact CRM API value",
        "Community Expansion (Med) | DLBCL, MM",
    ],
    [
        "Medical Tactic",
        "KPH_Medical_Tactics__c",
        "<tactic> (Barrier) | <indications>\nor\n<tactic> (Opp) | <indications>",
        "Must end immediately before | with (Barrier), (Opp), or (Opportunity), case-insensitive.",
        "Must match both the linked parent type and the linked parent's indication.",
        "Missing/invalid type marker; no DLBCL/MM suffix; wrong parent type; inactive in CRM.",
        "Exact CRM API value",
        "First Patient Experience Support (Barrier) | MM",
    ],
]
table(ws, 4, headers, rows, [20, 30, 38, 34, 42, 42, 24, 50], freeze="A5")

ws = wb.create_sheet("Decision Matrix")
title(ws, "Display Decision Matrix", "A value is displayed only when every applicable condition below is true.")
headers = ["Selected indication", "Parent being created", "Barrier Title", "Opportunity Title", "Medical Strategy", "Medical Tactic", "Result"]
rows = [
    ["DLBCL", "Barrier", "Suffix contains DLBCL", "Not displayed", "Contains (Med) + suffix contains DLBCL", "(Barrier) + suffix contains DLBCL", "Eligible values shown"],
    ["MM", "Barrier", "Suffix contains MM", "Not displayed", "Contains (Med) + suffix contains MM", "(Barrier) + suffix contains MM", "Eligible values shown"],
    ["DLBCL", "Opportunity", "Not displayed", "Suffix contains DLBCL", "Contains (Med) + suffix contains DLBCL", "(Opp)/(Opportunity) + suffix contains DLBCL", "Eligible values shown"],
    ["MM", "Opportunity", "Not displayed", "Suffix contains MM", "Contains (Med) + suffix contains MM", "(Opp)/(Opportunity) + suffix contains MM", "Eligible values shown"],
    ["Any", "No indication selected", "None", "None", "None", "None", "Select indication first"],
]
table(ws, 4, headers, rows, [20, 24, 29, 29, 40, 44, 27], freeze="A5")

ws = wb.create_sheet("Examples")
title(ws, "Valid and Invalid Examples", "Examples are illustrative, not a complete list of configured CRM values.")
headers = ["Picklist", "API name example", "Parent type", "Visible for DLBCL?", "Visible for MM?", "Valid?", "Reason"]
rows = [
    ["Barrier Title", "BsAbs are increasingly used in community practices delaying referral for CAR T | MM, DLBCL", "Barrier", "Yes", "Yes", "Yes", "Both supported indications are in the suffix."],
    ["Barrier Title", "Confidence in AE management with community ATCs | MM", "Barrier", "No", "Yes", "Yes", "MM-only suffix."],
    ["Barrier Title", "test value to be deleted", "Barrier", "No", "No", "No", "No final supported indication suffix."],
    ["Opportunity Title", "Potential Kite Clinical Trial Site | MM, DLBCL", "Opportunity", "Yes", "Yes", "Yes", "Both supported indications are in the suffix."],
    ["Opportunity Title", "Select Opportunity Title", "Opportunity", "No", "No", "No", "Placeholder has no supported suffix and must not be a Salesforce default."],
    ["Medical Strategy", "Community Expansion (Med) | DLBCL, MM", "Either", "Yes", "Yes", "Yes", "Contains (Med) and both indications."],
    ["Medical Strategy", "Maximize Opportunities in Lymphoma and Leukemia pipeline (Med) | DLBCL", "Either", "Yes", "No", "Yes", "DLBCL-only suffix."],
    ["Medical Strategy", "MM Launch Prep", "Either", "No", "No", "No", "Missing (Med) and indication suffix."],
    ["Medical Tactic", "First Patient Experience Support (Barrier) | MM", "Barrier", "No", "Yes", "Yes", "Barrier marker plus MM suffix."],
    ["Medical Tactic", "Nominate site to clinical development (Opp) | MM, DLBCL", "Opportunity", "Yes", "Yes", "Yes", "Opportunity marker plus both indications."],
    ["Medical Tactic", "Nominate site to clinical development (Barrier) | MM, DLBCL", "Opportunity", "No", "No", "No for this parent", "Indications match, but the type marker does not match Opportunity."],
    ["Medical Tactic", "Unmarked tactic | DLBCL", "Barrier", "No", "No", "No", "Missing (Barrier)/(Opp)/(Opportunity) immediately before |."],
]
table(ws, 4, headers, rows, [21, 72, 20, 19, 17, 19, 52], freeze="A5")

ws = wb.create_sheet("Parsing Details")
title(ws, "Parsing Details", "Exact conventions administrators should follow when creating or changing API names.")
headers = ["Topic", "Rule", "Recommended", "Avoid"]
rows = [
    ["Delimiter", "The parser uses the last exact delimiter ' | ' (space-pipe-space).", "Title (Med) | DLBCL", "Title|DLBCL or Title - DLBCL"],
    ["Multiple indications", "Separate indications with commas. Whitespace is normalized.", "Title | MM, DLBCL", "Title | MM / DLBCL"],
    ["Case", "Markers and indications are matched case-insensitively.", "Use canonical (Med), (Barrier), (Opp), DLBCL, MM.", "Inconsistent casing that makes administration harder."],
    ["Unsupported suffix", "Unsupported indications are ignored. At least one supported indication is required.", "Title | MM", "Title | AML only"],
    ["Exact writes", "The application retains the exact API value from metadata when saving.", "Treat API names as immutable integration keys.", "Renaming API values without regression testing."],
    ["Labels", "CRM labels are used for display when supplied by metadata.", "Keep labels user-friendly and tags in API names.", "Putting routing logic only in the label."],
    ["Active state", "Values explicitly marked inactive by CRM are excluded.", "Deactivate obsolete values instead of reusing API names.", "Leaving test values active."],
]
table(ws, 4, headers, rows, [24, 58, 48, 46], freeze="A5")

ws = wb.create_sheet("iPad Offline Sync")
title(ws, "iPad Offline Sync", "How combined Barrier/Opportunity + Medical Tactic creation behaves offline.")
headers = ["Step", "Behavior", "Why it matters", "Admin / tester action"]
rows = [
    [1, "The parent Barrier or Opportunity is queued first.", "The Medical Tactic lookup depends on the parent's temporary mobile ID.", "Confirm the parent has no sync error."],
    [2, "The selected title, indication, strategy, status, and comments use their exact API values.", "Restricted picklists reject labels or inactive/invalid API values.", "Verify API names follow this workbook."],
    [3, "The unused opposite title field receives the first indication-valid API value from live metadata.", "This prevents an invalid placeholder default such as 'Select Opportunity Title' from breaking offline creation.", "Remove invalid Salesforce defaults where possible."],
    [4, "The linked Medical Tactic is queued with the parent's temporary mobile ID.", "Veeva resolves it after the parent syncs successfully.", "A missing Mobile_ID error is normally downstream of a parent failure."],
    [5, "Failed queued records keep their original payload.", "Deploying a corrected bundle does not rewrite an existing failed queue entry.", "Discard failed entries, sync the new bundle, then create fresh records."],
]
table(ws, 4, headers, rows, [10, 62, 62, 54], freeze="A5")
note(ws, 11, "Configuration warning", "The Salesforce default 'Select Opportunity Title' has no DLBCL/MM suffix and is invalid for the current dependency rules. It should be removed as a default even though the app now includes an offline compatibility value.", RED)

ws = wb.create_sheet("Admin QA Checklist")
title(ws, "Admin QA Checklist", "Use after changing picklist API names, labels, active states, defaults, or dependencies.")
headers = ["#", "Test", "Expected result", "Pass / Fail", "Notes"]
rows = [
    [1, "Select DLBCL and open Barrier Title.", "Only values whose API suffix includes DLBCL are shown.", "", ""],
    [2, "Select MM and open Barrier Title.", "Only values whose API suffix includes MM are shown.", "", ""],
    [3, "Repeat for Opportunity Title.", "Only matching DLBCL/MM API suffixes are shown.", "", ""],
    [4, "Review Medical Strategy for DLBCL and MM.", "Only values containing (Med) and the selected indication are shown.", "", ""],
    [5, "Create a Barrier and review Medical Tactic.", "Only (Barrier) tactics matching the Barrier indication are shown.", "", ""],
    [6, "Create an Opportunity and review Medical Tactic.", "Only (Opp)/(Opportunity) tactics matching the Opportunity indication are shown.", "", ""],
    [7, "Inspect a shared '| MM, DLBCL' value.", "The value appears for both indications.", "", ""],
    [8, "Inspect an unsuffixed or placeholder value.", "The value appears for neither indication.", "", ""],
    [9, "Save online.", "CRM receives the exact API values and creates both records.", "", ""],
    [10, "Create and sync on iPad offline.", "Parent syncs first; tactic lookup resolves; no restricted-picklist or Mobile_ID error.", "", ""],
    [11, "Change a CRM label only.", "UI label changes, but eligibility and saved API value remain based on the API name.", "", ""],
]
table(ws, 4, headers, rows, [8, 54, 68, 16, 42], freeze="A5")

for sheet in wb.worksheets:
    sheet.sheet_properties.pageSetUpPr.fitToPage = True
    sheet.page_setup.fitToWidth = 1
    sheet.page_setup.fitToHeight = 0
    sheet.page_setup.orientation = "landscape"
    sheet.page_margins.left = 0.25
    sheet.page_margins.right = 0.25
    sheet.page_margins.top = 0.5
    sheet.page_margins.bottom = 0.5

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
wb.save(OUTPUT)
print(OUTPUT)
