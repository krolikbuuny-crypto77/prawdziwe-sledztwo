"""RC57.10.43: detect visible overlap of witness role, portrait button and mood
on mobile. No AI or remote storage calls are made."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import mimetypes,json,sys
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text(encoding='utf-8').replace('<head>','<head><base href="https://game.test/">',1)
widths=[(320,700),(390,844),(700,1000),(1440,900)]
count=0;fails=[];records=[]
def check(ok,msg):
 global count
 count+=1
 if not ok:fails.append(msg)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 for w,h in widths:
  pg=b.new_page(viewport={'width':w,'height':h},reduced_motion='reduce')
  pageerrors=[];pg.on('pageerror',lambda x:pageerrors.append(str(x)))
  def route(r):
   f=(root/r.request.url.split('game.test/')[-1].split('?')[0].split('#')[0]).resolve()
   if f.is_file() and f.is_relative_to(root):r.fulfill(status=200,body=f.read_bytes(),content_type=mimetypes.guess_type(f)[0] or 'application/octet-stream')
   else:r.fulfill(status=404,body='not found')
  pg.route('https://game.test/**',route);pg.set_content(html,wait_until='domcontentloaded',timeout=90000)
  pg.evaluate("document.body.classList.remove('ps-resume-pending');showTab('interview');window.PS_MOBILE_WORKSPACES.setInterviewView('chat')")
  def rect(selector):return pg.locator(selector).first.bounding_box()
  def overlap(a,b):return (a['x']+a['width']>b['x']+.5 and b['x']+b['width']>a['x']+.5 and a['y']+a['height']>b['y']+.5 and b['y']+b['height']>a['y']+.5)
  docwidth=pg.evaluate('document.documentElement.scrollWidth')
  check(docwidth<=w+1,f'{w}: document horizontal overflow {docwidth}')
  if w<=700:
   name=rect('#interview #chatName');role=rect('#interview #chatRole');toggle=rect('#interview .psm-portrait-toggle');log=rect('#interview .chatlog');input_=rect('#interview #chatInput');send=rect('#interview #chatSend')
   check(not overlap(name,role),f'{w}: name overlaps role')
   check(not overlap(role,toggle),f'{w}: role overlaps toggle')
   check(toggle['y']+toggle['height']<=log['y']+.5,f'{w}: toggle overlaps protocol')
   check(log['y']+log['height']<=input_['y']+.5,f'{w}: log overlaps question')
   check(input_['width']>=w-90,f'{w}: question narrow')
   check(send['width']>=100,f'{w}: send button narrow')
   pg.evaluate("document.querySelector('#interview .psm-portrait-toggle').click()")
   stage=rect('#interview .witness-stage-host');panel=rect('#interview #npc4Panel');toggle=rect('#interview .psm-portrait-toggle');log=rect('#interview .chatlog')
   check(not overlap(stage,panel),f'{w}: portrait overlaps mood meters')
   check(not overlap(panel,toggle),f'{w}: mood meters overlap toggle')
   check(toggle['y']+toggle['height']<=log['y']+.5,f'{w}: open portrait overlaps protocol')
   pg.evaluate("document.querySelector('#interview .psm-portrait-toggle').click()")
   check(pg.locator('#interview #chatRole').is_visible(),f'{w}: role disappeared after collapse')
   check(pg.locator('#interview #chatSend').is_visible(),f'{w}: send disappeared')
  else:
   check(pg.locator('#interview #chatName').is_visible(),f'{w}: desktop header hidden')
   check(pg.locator('#interview #chatSend').is_visible(),f'{w}: desktop send hidden')
  for tab in ['overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final']:
   pg.evaluate('(id)=>showTab(id)',tab)
   check(pg.evaluate('document.documentElement.scrollWidth')<=w+1,f'{w}: overflow {tab}')
  check(not pageerrors,f'{w}: JS exception {pageerrors[:2]}')
  records.append({'width':w,'height':h,'checks_ok':True,'page_errors':pageerrors})
  print('checked',w,flush=True)
  pg.close()
 b.close()
(root/'QA-RC571043').mkdir(exist_ok=True)
(root/'QA-RC571043/results.json').write_text(json.dumps({'passed':count-len(fails),'total':count,'failures':fails,'widths':records},ensure_ascii=False,indent=2))
print(f'RC57.10.43 visual checks: {count-len(fails)}/{count}')
for x in fails:print('FAIL',x)
if fails:sys.exit(1)
