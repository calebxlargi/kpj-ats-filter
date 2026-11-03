"""Generate clearly fictional, text-readable sample CVs. Uses reportlab (authoring only)."""
import json, pathlib, subprocess, html, sys, zipfile
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
ROOT = pathlib.Path(__file__).resolve().parents[1]
raw = subprocess.check_output(['node','--input-type=module','-e',"import {samples} from './src/samples.js'; console.log(JSON.stringify(samples))"],cwd=ROOT,text=True)
samples = json.loads(raw)
if '--additional-only' in sys.argv:
 samples = [sample for sample in samples if sample['id'] not in ('nurse', 'doctor', 'business')]
name_style=ParagraphStyle('name',fontName='Helvetica-Bold',fontSize=22,leading=26,textColor=colors.HexColor('#978467'),spaceAfter=6)
role_style=ParagraphStyle('role',fontName='Helvetica',fontSize=11,leading=15,textColor=colors.HexColor('#66515E'),spaceAfter=8)
body_style=ParagraphStyle('body',fontName='Helvetica',fontSize=9.1,leading=12.6,textColor=colors.HexColor('#3C3640'),spaceAfter=4)
section_style=ParagraphStyle('section',fontName='Helvetica-Bold',fontSize=8.5,leading=12,textColor=colors.HexColor('#978467'),spaceBefore=10,spaceAfter=5)
small_style=ParagraphStyle('small',parent=body_style,fontSize=7.5,leading=10,textColor=colors.HexColor('#8A7583'))
def footer(canvas,doc):
 canvas.saveState();canvas.setStrokeColor(colors.HexColor('#E6D9E0'));canvas.line(42,38,A4[0]-42,38)
 canvas.setFont('Helvetica',7);canvas.setFillColor(colors.HexColor('#947B89'))
 canvas.drawString(42,26,'FICTIONAL CV | KPJ Talent Match software testing | Credentials not verified')
 canvas.drawRightString(A4[0]-42,26,str(doc.page));canvas.restoreState()
for sample in samples:
 (ROOT/'public'/'samples'/f"{sample['file']}.txt").write_text(sample['cv']+'\n')
 target=ROOT/'public'/'samples'/f"{sample['file']}.pdf"
 doc=SimpleDocTemplate(str(target),pagesize=A4,rightMargin=42,leftMargin=42,topMargin=35,bottomMargin=50,title=f"{sample['name']} - Fictional sample CV",author='KPJ Talent Match demo')
 story=[]
 for i,line in enumerate(sample['cv'].splitlines()):
  if not line.strip():continue
  line=line.replace('—','-').replace('–','-').replace('’',"'")
  style=name_style if i==0 else role_style if i==1 else section_style if line.isupper() and len(line)<70 else small_style if line.startswith('FICTIONAL SAMPLE') else body_style
  text=html.escape(line)
  if line.startswith('- '): text='&#8226; '+html.escape(line[2:])
  story.append(Paragraph(text,style))
 doc.build(story,onFirstPage=footer,onLaterPages=footer)
 print(target)

# A single convenient download containing only the nine additional candidates.
all_samples=json.loads(raw)
additional=[s for s in all_samples if s['id'] not in ('nurse','doctor','business')]
with zipfile.ZipFile(ROOT/'public'/'samples'/'additional-test-cvs.zip','w',zipfile.ZIP_DEFLATED) as bundle:
 for sample in additional:
  for extension in ['pdf','txt']:
   path=ROOT/'public'/'samples'/f"{sample['file']}.{extension}"
   bundle.write(path,path.name)
 guide='KPJ Talent Match - Nine additional fictional test CVs\n\nAll people, employers, contacts and credentials are invented.\nTest scenario labels describe text evidence only, not suitability.\n\n'
 guide+='\n'.join(f"{s['category']} | {s['name']} | {s['scenario']}" for s in additional)
 bundle.writestr('READ-ME.txt',guide+'\n')
