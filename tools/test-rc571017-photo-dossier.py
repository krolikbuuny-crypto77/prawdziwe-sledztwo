from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil, json
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text()
from urllib.parse import urlparse
from pathlib import PurePosixPath
results=[]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 for width in (320,390,768,1440,1920):
  page=browser.new_page(viewport={'width':width,'height':950},reduced_motion='reduce')
  errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
  page.route('**/assets/portraits/*.webp', lambda route:route.fulfill(path=ROOT / route.request.url.split('/assets/portraits/')[-1].join([])) if False else route.fulfill(path=ROOT/'assets/portraits'/route.request.url.rsplit('/',1)[-1], content_type='image/webp'))
  page.set_content(HTML.replace('<head>','<head><base href=\"https://dossier.local/\">',1),wait_until='domcontentloaded',timeout=90000)
  page.evaluate("showTab('interview')")
  for witness in ('MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA'):
   data=page.evaluate('''id=>{
      STATE.activeChar=id;renderChat();
      const stage=document.querySelector('#witnessStage .wp-stage');
      const active=document.querySelector('#characterList .character.active');
      const photo=stage?.querySelector('img.wp-photo'), mini=active?.querySelector('img.wp-photo');
      const full=photo?.getBoundingClientRect(), tiny=mini?.getBoundingClientRect();
      return {hero:photo?.getAttribute('src'),thumb:mini?.getAttribute('src'),
              photos:document.querySelectorAll('#characterList img.wp-photo').length,
              preview:!!stage?.querySelector('svg.wp-portrait-svg'),
              behavior:document.querySelectorAll('#npc4Panel .npc4-metrics').length,
              controls:!!document.querySelector('#chatInput')&&!!document.querySelector('#chatSend'),
              overflow:document.documentElement.scrollWidth,viewport:innerWidth,
              dimensions:[full?.width,full?.height,tiny?.width,tiny?.height],
              invalid:!photo?.complete||photo?.naturalWidth===0||!mini?.complete||mini?.naturalWidth===0}
   }''',witness)
   assert data['hero']==data['thumb'] and data['hero'].endswith(witness.lower()+'.webp'),(witness,data)
   assert data['photos']==6 and data['preview'] and data['controls'],(witness,data)
   assert data['behavior']==1,(witness,data)
   # wait for image to load before naturalWidth check
   page.locator('#witnessStage img.wp-photo').evaluate('(el)=>el.decode()')
   assert page.locator('#witnessStage img.wp-photo').evaluate('el=>el.naturalWidth')>0
   assert data['overflow']<=width+2,(witness,data)
  page.evaluate("STATE.activeChar='MAREK';renderChat()")
  if width in (390,1440):page.screenshot(path=str(ROOT/f'QA-RC571017-photo-{width}.png'),full_page=True)
  assert not errors,errors[:4]
  results.append({'width':width,'witnesses':6,'photosLoaded':True,'overflow':False,'runtimeErrors':0})
  print('PASS',width,'6 matched portraits; no overflow or JS errors')
  page.close()
 browser.close()
(ROOT/'QA-RC571017-photo-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
