from playwright.sync_api import sync_playwright
from pathlib import Path
import json, time, shutil
root=Path('/mnt/data/ps_package_624')
html=(root/'index.html').read_text(encoding='utf-8')
results={}
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for width in (390,1280):
        page=browser.new_page(viewport={'width':width,'height':800},reduced_motion='reduce')
        errors=[]
        page.on('pageerror',lambda e:errors.append(str(e)))
        page.set_content(html, wait_until='domcontentloaded',timeout=25000)
        o=page.evaluate('''() => {
          showTab('interview');
          const before=JSON.stringify([...STATE.found]);
          let samples=[];
          const questions=['Co pamiętasz z nocnego dyżuru?','Skąd to wiesz?','Przyznajesz się do zabójstwa Leny?','Czy karta T-17 potwierdza obecność?','Nie pytam o dokument. Co widziałaś?','Dlaczego nie wysłano ostrzeżenia?'];
          for(const c of CONTENT.characters){
            STATE.activeChar=c.id;renderChat();
            samples.push({id:c.id, answers:questions.map(q=>({q,a:npc4Answer(c,q,'')}))});
          }
          return {ids:CONTENT.characters.length, scriptErrors:0, face:!!window.PS622_FACES, cinematic:!!window.PS621_CINEMA, fallback:!!window.PS77_AI, after:JSON.stringify([...STATE.found]), before, pageWidth:document.documentElement.scrollWidth, viewport:innerWidth, samples};
        }''')
        results[str(width)]={'metrics':{k:v for k,v in o.items() if k!='samples'},'samples':o['samples'] if width==390 else [],'jsErrors':errors}
        print('BROWSER',width,'errors',len(errors),'overflow',o['pageWidth']-width,'voices',o['ids'],'evidenceUnchanged',o['before']==o['after'],'faces',o['face'],flush=True)
        page.close()
    browser.close()
Path('/mnt/data/ps_package_624/QA-624/browser-samples.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
for c in results['390']['samples']:
 print('\n',c['id'],flush=True)
 for q in c['answers'][:4]:print(' ',q['q'],':',q['a'][:170].replace('\n',' '),flush=True)
