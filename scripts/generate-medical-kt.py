"""Render the Medicalv2 KT source to PDF and editable DOCX.

Requires reportlab, python-docx and pymupdf. Run from any directory.
The source's explicit page markers preserve the reference's paginated structure.
"""
from pathlib import Path
import re
from html import escape
from io import BytesIO
import fitz
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, Table, TableStyle, Spacer, Flowable
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'docs' / 'Kite_MyInsights_KT_SOP_Medicalv2'
NAVY, BLUE, INK, MUTED, GOLD = '#17365D', '#2E74B5', '#0B2545', '#5B6573', '#B07A15'
FONTDIR = Path('/Applications/Microsoft Word.app/Contents/Resources/DFonts')
fontfiles = ['Calibri.ttf', 'Calibrib.ttf', 'Calibrii.ttf']
if all((FONTDIR / f).exists() for f in fontfiles):
    for name, file in zip(['Body', 'BodyBold', 'BodyItalic'], fontfiles):
        pdfmetrics.registerFont(TTFont(name, str(FONTDIR / file)))
else:
    FONTDIR = ROOT / 'src/fonts'
    for name, file in zip(['Body', 'BodyBold', 'BodyItalic'], ['Lato-Regular.ttf', 'Lato-Bold.ttf', 'Lato-Regular.ttf']):
        pdfmetrics.registerFont(TTFont(name, str(FONTDIR / file)))
pdfmetrics.registerFontFamily('Body', normal='Body', bold='BodyBold', italic='BodyItalic', boldItalic='BodyBold')

STYLES = {
    'p': ParagraphStyle('p', fontName='Body', fontSize=10.3, leading=14.2, textColor=colors.HexColor(INK), spaceAfter=7),
    'h1': ParagraphStyle('h1', fontName='BodyBold', fontSize=24, leading=29, alignment=1, textColor=colors.HexColor(NAVY), spaceAfter=18),
    'h2': ParagraphStyle('h2', fontName='BodyBold', fontSize=16, leading=20, textColor=colors.HexColor(BLUE), spaceAfter=11, spaceBefore=8),
    'h3': ParagraphStyle('h3', fontName='BodyBold', fontSize=12, leading=15.5, textColor=colors.HexColor(BLUE), spaceAfter=8, spaceBefore=7),
    'table': ParagraphStyle('table', fontName='Body', fontSize=9.1, leading=11.8, textColor=colors.HexColor(INK)),
    'code': ParagraphStyle('code', fontName='Courier', fontSize=8.4, leading=12, textColor=colors.HexColor(INK)),
    'small': ParagraphStyle('small', fontName='Body', fontSize=8, leading=10.5, textColor=colors.HexColor(MUTED)),
    'quote': ParagraphStyle('quote', fontName='Body', fontSize=9.4, leading=12.6, textColor=colors.HexColor(INK)),
    'part': ParagraphStyle('part', fontName='BodyBold', fontSize=10, leading=14, alignment=1, textColor=colors.HexColor(GOLD), spaceAfter=10),
}

def markup(s):
    s = escape(s)
    # Give long API names safe wrapping points while preserving the actual text.
    s = re.sub(r'([A-Za-z0-9]+_)(?=[A-Za-z])', r'\1<wbr/>', s)
    return s

def blocks(text):
    lines = text.strip().splitlines()
    i = 0
    while i < len(lines):
        s = lines[i].strip()
        if not s:
            i += 1
            continue
        if s.startswith('```'):
            code = []
            i += 1
            while i < len(lines) and not lines[i].startswith('```'):
                code.append(lines[i]); i += 1
            yield ('code', '\n'.join(code)); i += 1
        elif s.startswith('|'):
            rows = []
            while i < len(lines) and lines[i].strip().startswith('|'):
                row = [x.strip() for x in lines[i].strip().strip('|').split('|')]
                if not all(re.fullmatch(r'[:\- ]+', x) for x in row): rows.append(row)
                i += 1
            yield ('table', rows)
        elif s.startswith('#'):
            level = len(s) - len(s.lstrip('#'))
            yield ('h' + str(level), s[level:].strip()); i += 1
        elif s.startswith('> '):
            yield ('quote', s[2:]); i += 1
        elif s.startswith('PART '):
            yield ('part', s); i += 1
        elif s == '{{DIAGRAM}}':
            yield ('diagram', ''); i += 1
        else:
            yield ('p', s); i += 1

class Diagram(Flowable):
    def __init__(self):
        super().__init__()
        self.width = 468
        self.height = 205
    def draw(self):
        c = self.canv
        labels = [
            ('Entry + Runtime', 'index.html\nq.js + MyInsightsLibrary'),
            ('React Shell', 'App.jsx\nplan, cache, refresh'),
            ('Pages + Forms', 'Medical UI\nshared modal writers'),
            ('Domain Services', 'accountPlan/*\nfields, joins, payloads'),
            ('Build + Package', 'Vite + postbuild\nlive / training ZIP'),
            ('CRM Objects', 'Plan + Medical objects\nAccount, User, metadata'),
            ('Query Boundary', 'query.js\nIDs, VQL, unwrap'),
            ('Adapter Channels', 'client.js\nmock / explicit CRM'),
        ]
        xs = [0, 120, 240, 360]
        for i, (title, body) in enumerate(labels):
            x, y = xs[i % 4], 127 if i < 4 else 38
            c.setFillColor(colors.HexColor('#EFF5FB')); c.setStrokeColor(colors.HexColor('#5595D2'))
            c.roundRect(x, y, 108, 57, 5, fill=1, stroke=1)
            c.setFillColor(colors.HexColor(NAVY)); c.setFont('BodyBold', 9)
            c.drawString(x+6, y+41, title)
            c.setFont('Body', 8)
            for n, line in enumerate(body.split('\n')): c.drawString(x+6, y+27-11*n, line)
        c.setStrokeColor(colors.HexColor(BLUE)); c.setFillColor(colors.HexColor(BLUE))
        for y in [155, 66]:
            for x in [108, 228, 348]:
                if y == 155:
                    c.line(x, y, x+12, y)
                    p=c.beginPath(); p.moveTo(x+12,y);p.lineTo(x+8,y+3);p.lineTo(x+8,y-3);p.close()
                else:
                    c.line(x, y, x+12, y)
                    p=c.beginPath();p.moveTo(x,y);p.lineTo(x+4,y+3);p.lineTo(x+4,y-3);p.close()
                c.drawPath(p, fill=1, stroke=0)
        c.line(414,127,414,95)
        p=c.beginPath();p.moveTo(414,95);p.lineTo(411,100);p.lineTo(417,100);p.close();c.drawPath(p,fill=1,stroke=0)
        c.setFont('Body',8);c.setFillColor(colors.HexColor(MUTED))
        c.drawString(0, 12, 'Trace the selected channel: training can call explicit live CRM reads and writes.')

def table_widths(rows):
    n=len(rows[0])
    if n == 2: return [133,335]
    if n == 4: return [68,115,140,145] if rows[0][0]=='Version' else [100,122,123,123]
    # More room for long Medical API names and responsibility columns.
    if rows[0][0] in ['Object','UI concept']: return [163,137,168] if rows[0][0]=='Object' else [85,190,193]
    if rows[0][-1] == 'Start page': return [126,302,40]
    return [128,151,189]

def flowables(kind, value):
    if kind=='diagram': return [Diagram(), Spacer(1,6)]
    if kind=='table':
        data=[[Paragraph(markup(v), STYLES['table']) for v in row] for row in value]
        t=Table(data, colWidths=table_widths(value), hAlign='LEFT')
        t.setStyle(TableStyle([
            ('BACKGROUND',(0,0),(-1,0),colors.HexColor('#EAF1F8')),
            ('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.white,colors.HexColor('#F7F9FC')]),
            ('VALIGN',(0,0),(-1,-1),'TOP'),
            ('LINEBELOW',(0,0),(-1,0),.65,colors.HexColor('#B8CCE0')),
            ('LINEBELOW',(0,1),(-1,-1),.3,colors.HexColor('#DCE3EB')),
            ('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),
            ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),
        ]))
        return [t,Spacer(1,10)]
    if kind=='code':
        p=Paragraph('<br/>'.join(escape(s).replace(' ','&#160;') for s in value.splitlines()),STYLES['code'])
        t=Table([[p]],colWidths=[468]);t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#F1F4F8')),('BOX',(0,0),(-1,-1),.4,colors.HexColor('#DCE3EB')),('TOPPADDING',(0,0),(-1,-1),8),('BOTTOMPADDING',(0,0),(-1,-1),8)]))
        return [t,Spacer(1,9)]
    if kind=='quote':
        t=Table([[Paragraph(markup(value),STYLES['quote'])]],colWidths=[468])
        t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),colors.HexColor('#EFF5FB')),('BOX',(0,0),(-1,-1),.5,colors.HexColor('#77A4D1')),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
        return [t,Spacer(1,9)]
    if kind=='p' and value.startswith('Source anchors:'): kind='small'
    if value.startswith('- '): value='• '+value[2:]
    return [Paragraph(markup(value),STYLES.get(kind,STYLES['p']))]

pages=BASE.with_suffix('.md').read_text().split('<!-- PAGE -->')
assert len(pages)==30, len(pages)
c=canvas.Canvas(str(BASE.with_suffix('.pdf')), pagesize=(612,792))
c.setTitle('Kite Medical Account Planning MyInsights — Medicalv2 KT SOP')
c.setAuthor('Kite Account Planning engineering / product team')

def chrome(n):
    c.setFont('Body',8);c.setFillColor(colors.HexColor(MUTED))
    if n>1: c.drawString(72,748,'KITE MYINSIGHTS KT SOP   |   Medicalv2')
    if n>1: c.drawRightString(540,31,f'Page {n} of {len(pages)}')
    else: c.drawCentredString(306,31,'Internal KT reference | Source reviewed 26 October 2026')

def cover():
    c.setFillColor(colors.HexColor(GOLD));c.setFont('BodyBold',10)
    c.drawCentredString(306,620,'STANDARD OPERATING PROCEDURE')
    for text,y in [('Kite Medical Account Planning',573),('MyInsights Application',532)]:
        c.setFont('BodyBold',27);c.setFillColor(colors.HexColor(NAVY));c.drawCentredString(306,y,text)
    p=Paragraph('Knowledge Transfer, Development, CRM Integration, Testing, Packaging, and Release',ParagraphStyle('sub',parent=STYLES['p'],fontName='BodyItalic',fontSize=13,leading=18,alignment=1,textColor=colors.HexColor(MUTED)))
    w,h=p.wrap(468,80);p.drawOn(c,72,474-h)
    note='Baseline: Prepared from Medicalv2 at commit 2fc48cb3. Source reviewed 26 October 2026. Includes uncommitted local page/navigation cleanup. Remote freshness and live CRM/device behavior require environment verification.'
    t=flowables('quote',note)[0];w,h=t.wrap(468,100);t.drawOn(c,72,420-h)
    c.setFont('BodyBold',10);c.setFillColor(colors.HexColor(GOLD));c.drawCentredString(306,322,'Audience')
    p=Paragraph('Developers, support engineers, QA analysts, CRM administrators, and release owners new to the Medical Account Plan codebase',ParagraphStyle('aud',parent=STYLES['p'],alignment=1))
    w,h=p.wrap(450,80);p.drawOn(c,81,304-h)
    c.setFillColor(colors.HexColor(NAVY));c.setFont('BodyBold',10.5);c.drawCentredString(306,246,'Document version 1.1')
    c.setFillColor(colors.HexColor(MUTED));c.setFont('Body',10.5);c.drawCentredString(306,226,'26 October 2026')

layout=[]
for n,page in enumerate(pages,1):
    chrome(n)
    if n==1: cover()
    else:
        fs=[f for k,v in blocks(page) for f in flowables(k,v)]
        # Scale typography only if necessary; fail rather than silently clipping.
        heights=[]
        for f in fs:
            w,h=f.wrap(468,1000)
            heights.append(h + getattr(f,'spaceBefore',0) + getattr(f,'spaceAfter',0))
        total=sum(heights)
        scale=min(1, 678/total)
        if scale<.82: raise ValueError(f'Page {n} too dense: {total:.1f}')
        c.saveState();c.translate(72,720);c.scale(scale,scale)
        y=0
        for f in fs:
            y-=getattr(f,'spaceBefore',0)
            w,h=f.wrap(468,1000);y-=h;f.drawOn(c,0,y)
            y-=getattr(f,'spaceAfter',0)
        c.restoreState()
        layout.append((n,round(total),round(scale,3)))
    c.showPage()
c.save()

# Use a raster copy of the same vector flow figure for the editable Word file.
rendered=fitz.open(BASE.with_suffix('.pdf'))
figure_stream=BytesIO()
figure_canvas=canvas.Canvas(figure_stream,pagesize=(468,205))
Diagram().drawOn(figure_canvas,0,0)
figure_canvas.save()
figure_doc=fitz.open(stream=figure_stream.getvalue(),filetype='pdf')
diagram_png=BytesIO(figure_doc[0].get_pixmap(matrix=fitz.Matrix(2,2)).tobytes('png'))

doc=Document()
section=doc.sections[0]
section.page_width=Inches(8.5);section.page_height=Inches(11)
section.top_margin=Inches(.9);section.bottom_margin=Inches(.8)
section.left_margin=section.right_margin=Inches(1)
section.different_first_page_header_footer=True
normal=doc.styles['Normal'];normal.font.name='Calibri';normal.font.size=Pt(10.3)
normal.font.color.rgb=RGBColor.from_string(INK[1:])
normal.paragraph_format.space_after=Pt(7)
normal.paragraph_format.line_spacing=1.05
for name,size,color in [('Title',27,NAVY),('Heading 1',24,NAVY),('Heading 2',16,BLUE),('Heading 3',12,BLUE)]:
    s=doc.styles[name];s.font.name='Calibri';s.font.size=Pt(size);s.font.color.rgb=RGBColor.from_string(color[1:])
    s.paragraph_format.space_after=Pt(10)
header=section.header.paragraphs[0];header.text='KITE MYINSIGHTS KT SOP   |   Medicalv2'
header.style='Caption';header.runs[0].font.size=Pt(8)
footer=section.footer.paragraphs[0];footer.alignment=2
footer.add_run('Page ')
for instr in ['PAGE','NUMPAGES']:
    fld=OxmlElement('w:fldSimple');fld.set(qn('w:instr'),instr);footer._p.append(fld)
    if instr=='PAGE': footer.add_run(' of ')
for r in footer.runs:r.font.size=Pt(8)
for idx,page in enumerate(pages):
    if idx:doc.add_page_break()
    if idx==0:
        doc.add_paragraph('\n\n\n')
        p=doc.add_paragraph('STANDARD OPERATING PROCEDURE');p.alignment=1
        p.runs[0].font.color.rgb=RGBColor.from_string(GOLD[1:]);p.runs[0].bold=True
        for text in ['Kite Medical Account Planning','MyInsights Application']:
            p=doc.add_paragraph(text,'Title');p.alignment=1
        p=doc.add_paragraph('Knowledge Transfer, Development, CRM Integration, Testing, Packaging, and Release');p.alignment=1;p.runs[0].italic=True
        doc.add_paragraph('Baseline: Medicalv2 at commit 2fc48cb3d82107b591ecdef5c6f28a2179e55790. Source reviewed 26 October 2026. Includes uncommitted local page/navigation cleanup. Remote freshness and live deployment were not verified.')
        p=doc.add_paragraph('Audience');p.alignment=1;p.runs[0].bold=True
        p=doc.add_paragraph('Developers, support engineers, QA analysts, CRM administrators, and release owners new to the Medical Account Plan codebase.');p.alignment=1
        p=doc.add_paragraph('Document version 1.1\n26 October 2026');p.alignment=1
        continue
    for kind,value in blocks(page):
        if kind=='diagram':
            diagram_png.seek(0);doc.add_picture(diagram_png,width=Inches(6.5))
        elif kind=='table':
            t=doc.add_table(rows=0,cols=len(value[0]));t.style='Light Shading Accent 1'
            for ri,row in enumerate(value):
                cells=t.add_row().cells
                for cell,text in zip(cells,row):
                    cell.text=text
                    for p in cell.paragraphs:
                        p.paragraph_format.space_after=Pt(3)
                        p.paragraph_format.space_before=Pt(3)
                        for r in p.runs:r.font.size=Pt(9);r.bold=ri==0
                trpr=t.rows[-1]._tr.get_or_add_trPr();trpr.append(OxmlElement('w:cantSplit'))
            doc.add_paragraph().paragraph_format.space_after=Pt(2)
        elif kind.startswith('h'):
            p=doc.add_paragraph(value,'Heading '+kind[1:])
            if kind=='h1':p.alignment=1
        elif kind=='code':
            p=doc.add_paragraph(value);p.paragraph_format.space_after=Pt(8)
            for r in p.runs:r.font.name='Courier New';r.font.size=Pt(8)
        else:
            p=doc.add_paragraph(value[2:] if value.startswith('- ') else value)
            if kind=='part':p.alignment=1;p.runs[0].bold=True;p.runs[0].font.color.rgb=RGBColor.from_string(GOLD[1:])
            if kind=='quote':
                pp=p._p.get_or_add_pPr();sh=OxmlElement('w:shd');sh.set(qn('w:fill'),'EFF5FB');pp.append(sh)
            if value.startswith('Source anchors:'):
                for r in p.runs:r.font.size=Pt(8);r.font.color.rgb=RGBColor.from_string(MUTED[1:])
doc.core_properties.title='Kite Medical Account Planning MyInsights — Medicalv2 KT SOP'
doc.core_properties.subject='Medicalv2 2fc48cb3; 26 October 2026'
doc.save(BASE.with_suffix('.docx'))
print('PDF pages:',len(rendered))
print('Page layout (page, points, scale):',layout)
print('Created:',BASE.with_suffix('.pdf'))
print('Created:',BASE.with_suffix('.docx'))
