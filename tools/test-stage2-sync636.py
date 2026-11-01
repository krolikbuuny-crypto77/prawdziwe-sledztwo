"""Isolated browser test of the synchronization gate, with mocked API responses."""
import shutil
from pathlib import Path
from playwright.sync_api import sync_playwright
code=(Path(__file__).resolve().parent.parent/'src/integrations/75-verified-state-sync.js').read_text()
# The isolated test uses about:blank, so simulate the production http: protocol check.
code=code.replace("!/^https?:$/.test(location.protocol)",'false /* isolated browser test */')
mock=r'''const PS_EVENTS={on(){}};const STATE={sim:{trial:null},area:'med'};
window.__server={approved:['MED-01'],revision:0,accept:true,posts:0};
window.fetch=async(url,opts={})=>{
 if(url==='/api/game-session-reset'){
  __server.approved=['MED-01'];__server.revision=0;
  return {ok:true,status:200,json:async()=>({ok:true})};
 }
 if(url==='/api/game-state'&&opts.method==='POST'){
  __server.posts++;const batch=JSON.parse(opts.body).actions;
  const decisions=batch.map(x=>({id:x.id,ok:__server.accept,reason:__server.accept?null:'inspection_not_verified'}));
  if(__server.accept&&batch.some(x=>x.action.docId==='VIS-02')){
   __server.approved.push('VIS-02');__server.revision++;
  }
  return {ok:true,status:200,json:async()=>({ok:true,revision:__server.revision,decisions,
    state:{approvedEvidence:__server.approved,verdict:null}})};
 }
 if(url==='/api/game-state')return {ok:true,status:200,json:async()=>({ok:true,
  revision:__server.revision,state:{approvedEvidence:__server.approved,verdict:null}})};
 throw Error('Unexpected URL '+url);
};'''
html='<!doctype html><html><body><button id="saveBtn">Save</button><script>'+mock+'</script><script>'+code+'</script></body></html>'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 for accept in (True,False):
  page=browser.new_page();errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='load')
  page.wait_for_function("()=>document.querySelector('#ps-server-state-status')?.textContent.includes('Postęp serwerowy aktywny')",timeout=9000)
  page.evaluate('(value)=>__server.accept=value',accept)
  result=page.evaluate('''async()=>{
    PS617_SYNC.enqueue({type:'collect_evidence',docId:'VIS-02',origin:'scene-inspection',spotId:'test',room:'bay',method:'measure',answer:'yes'});
    return {allowed:await PS617_SYNC.ensureEvidence('VIS-02',3000),
      approved:PS617_SYNC.isEvidenceApproved('VIS-02'),posts:__server.posts,pending:PS617_SYNC.pending};
  }''')
  assert result['allowed'] is accept,result
  assert result['approved'] is accept,result
  assert result['posts']>=1,result
  assert not errors,errors
  page.close()
 browser.close()
print('PASS stage II browser: confirmed evidence can be used by AI, rejected evidence stays blocked, no JavaScript errors')
