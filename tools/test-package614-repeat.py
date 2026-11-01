from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil,json
root=Path(__file__).resolve().parent.parent
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 p=b.new_page()
 p.set_content((root/'index.html').read_text('utf8'),wait_until='domcontentloaded')
 result=p.evaluate('''() => {
   let c=CONTENT.characters.find(x=>x.id==='MAREK');
   let q='Panie Marku, Co było przyczyną twojej decyzji, by zostać w biurze?';
   let expected='Nie umiem wskazać konkretnej przyczyny na podstawie tego, co pamiętam. Nie chcę jej wymyślać.';
   let answers=[],found=STATE.found.size;
   for(let i=0;i<7;i++)answers.push(npc4Answer(c,q,''));
   let uniq=new Set(answers).size;
   let state=PS614_VARIETY.stats(c.id);
   const save=buildSave();safeLoad(save);
   let roundtrip=PS614_VARIETY.stats(c.id);
   npc4Reset();let cleared=PS614_VARIETY.stats(c.id);
   return {answers,uniq,state,roundtrip,cleared,foundDelta:STATE.found.size-found};
 }''')
 assert result['uniq']>=3,result
 assert result['state']==result['roundtrip'],result
 assert result['cleared']['phrases']==0 and result['foundDelta']==0,result
 print('PASS 7 repeats ->',result['uniq'],'variants; save roundtrip; reset; no evidence')
 p.close();b.close()
