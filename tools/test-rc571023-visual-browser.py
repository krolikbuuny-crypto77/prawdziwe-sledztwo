from pathlib import Path
import base64
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
html=(R/'index.html').read_text()
for f in list((R/'assets/portraits').glob('*.webp'))+list((R/'assets/ui').glob('*')):
 rel=f.relative_to(R).as_posix();mime='image/webp' if f.suffix=='.webp' else ('image/jpeg' if f.suffix=='.jpg' else ('image/svg+xml' if f.suffix=='.svg' else 'image/png'))
 html=html.replace(rel,'data:'+mime+';base64,'+base64.b64encode(f.read_bytes()).decode())
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for w,h in [(1672,941),(1440,900),(768,1024),(390,844),(320,760)]:
  pg=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.set_content(html,wait_until='domcontentloaded',timeout=45000)
  pg.evaluate("showTab('interview')")
  if w<940:pg.evaluate("document.querySelector('#psm-tab-chat')?.click()")
  pics={a.name: 'data:image/webp;base64,'+base64.b64encode(a.read_bytes()).decode() for a in (R/'assets/portraits').glob('*.webp')}
  pg.evaluate('''mapping=>{document.querySelectorAll('img.wp-photo').forEach(img=>{let f=img.getAttribute('src')?.split('/').pop();if(mapping[f])img.src=mapping[f]})}''',pics)
  pg.wait_for_timeout(100)
  pg.screenshot(path=str(R/f'PODGLAD-RC571023-{w}.png'),full_page=False)
  data=pg.evaluate('''()=>{let q=s=>document.querySelector(s);let rect=s=>{let r=q(s).getBoundingClientRect();return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),bottom:Math.round(r.bottom)}};return {overflow:document.documentElement.scrollWidth-innerWidth,panel:rect('#interview .charactergrid>.chat'),list:rect('#characterList'),portrait:rect('#witnessStage'),log:rect('#chatLog'),input:rect('#chatInput'),send:rect('#chatSend'),meters:q('#npc4Panel')?.querySelectorAll('.npc4-metric').length,stances:document.querySelectorAll('[data-npc4-stance]').length,evidence:!!q('#attachedDoc'),evidenceCards:q('#ps23EvidenceCards')?.children.length,witnesses:document.querySelectorAll('#interview .character').length,errors:[]}}''')
  print(w,data,'errors',errs[:2],flush=True)
  assert data['overflow']<=2,(w,'overflow',data)
  assert data['meters']==3 and data['stances']==3 and data['witnesses']==6,(w,data)
  assert data['input']['w']>90 and data['send']['w']>75,(w,data)
  assert not errs,(w,errs[:2])
  pg.close()
 browser.close()
