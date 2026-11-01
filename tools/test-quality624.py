"""Real browser local quality (not a human naturalness benchmark)."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil,json
ROOT=Path(__file__).resolve().parent.parent
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 pg=b.new_page(viewport={'width':390,'height':844});errors=[];pg.on('pageerror',lambda x:errors.append(str(x)))
 pg.set_content((ROOT/'index.html').read_text(),wait_until='domcontentloaded',timeout=50000)
 out=pg.evaluate('''()=>{
  const questions=['Czy karta T-17 potwierdza obecność?','Co pamiętasz z nocnej zmiany?','Czy przyznajesz się do zabójstwa Leny?'];
  const before=JSON.stringify([...STATE.found]),v=[];
  for(const c of CONTENT.characters){const replies=[];
   for(const q of questions)replies.push({q,a:npc4Answer(c,q,'')});
   v.push({id:c.id,replies});
  }
  return {v,unchanged:before===JSON.stringify([...STATE.found]),overflow:document.documentElement.scrollWidth-innerWidth};
 }''')
 assert len(out['v'])==6 and out['unchanged'] and out['overflow']<=2 and not errors,(out,errors)
 for v in out['v']:
  a=v['replies'][0]['a'].lower()
  assert any(w in a for w in ('kart','t-17','czytnik','zapis','identyfikat')),(v['id'],a)
  assert not any(w in a for w in ('bhp','dyspozytorni','rubryk','warsztacie')),(v['id'],a)
  assert all(row['a'].strip() for row in v['replies'])
 print('PASS 6 witnesses x 3 actual local answers; 6/6 relevant to T-17; no evidence changes or overflow')
 (ROOT/'QA-624'/'local-quality.json').write_text(json.dumps(out,ensure_ascii=False,indent=2))
 b.close()
