from pathlib import Path
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1672,'height':941})
 errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 page.set_content((R/'index.html').read_text(),wait_until='domcontentloaded')
 page.evaluate("showTab('interview')")
 data=page.evaluate('''()=>{
 const q=s=>document.querySelector(s);
 const evidence=DOCS.find(d=>STATE.found.has(d.id));
 const before=q('#chatName').textContent;
 const marekPhoto=q('#witnessStage .wp-photo')?.getAttribute('src');
 const t=q('#characterList [data-char="TOMASZ"]');t.click();
 const after=q('#chatName').textContent;
 const tomaszPhoto=q('#witnessStage .wp-photo')?.getAttribute('src');
 const drafted='Gdzie byłeś po północy?';q('#chatInput').value=drafted;
 const unchanged=q('#chatInput').value===drafted;
 // Earned+reviewed only. Show and select through the original native evidence control.
 let exhibit=null;
 if(evidence){STATE.reviewedEvidence.add(evidence.id);renderAttached();let btn=q('#ps23EvidenceCards button[data-ps23-exhibit]'); if(btn){btn.click();exhibit=q('#attachedDoc').value;}}
 const coop=document.querySelector('.ps23-coop-fold');
 return {before,after,marekPhoto,tomaszPhoto,unchanged,exhibit,earned:evidence?.id||null,coopAccessible:!!coop&&coop.contains(document.querySelector('.ps-coop-bar')),oneForm:document.querySelectorAll('#interview #chatInput').length===1,oneSend:document.querySelectorAll('#interview #chatSend').length===1,details:document.querySelectorAll('#interview .ps23-extras').length};
 }''')
 assert data['before']=='Marek Nowicki',data
 assert data['after']=='Tomasz Krawczyk',data
 assert data['marekPhoto']!=data['tomaszPhoto'],data
 assert data['unchanged'] and data['oneForm'] and data['oneSend'],data
 assert data['coopAccessible'] and data['details']==1,data
 if data['earned']:assert data['exhibit']==data['earned'],data
 assert not errs,errs[:2]
 print('PASS 6 witness cards; actual photo switch; own question preserved; one form; evidence via original selector; coop tools available; details collapsed')
 b.close()
