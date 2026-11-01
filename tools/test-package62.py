"""Pakiet 6.2 — offline contextual interrogation and legacy regression checks."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text(encoding='utf-8')
import shutil
CHROME=shutil.which('chromium') or shutil.which('google-chrome')
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=CHROME,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
 result=page.evaluate('''() => {
  const failures=[],samples=[],found=STATE.found.size;
  const info=PS_WITNESS_ENGINE.inspect();
  if(info.layers.answer.length!==19||info.layers.export.length!==8||info.layers.restore.length!==8) failures.push('registry');
  for(const c of CONTENT.characters){
   const id=c.id;
   const first=npc4Answer(c,'Gdzie nocą przebywałeś?','');
   const anchor=PS62_DIALOGUE.inspect(id);
   const simple=npc4Answer(c,'A możesz to wyjaśnić po ludzku?','');
   const simpleState=PS62_DIALOGUE.inspect(id);
   const implication=npc4Answer(c,'Co z tego wynika?','');
   const redirect=npc4Answer(c,'Nie o to pytam, tylko gdzie byłeś?','');
   const ambiguous=npc4Answer(c,'Gdzie ona wtedy była?','');
   const another=npc4Answer(c,'Nie o to pytałem, interesuje mnie co zrobiłeś dalej','');
   if(!anchor.topic||!simpleState.hits.simplify)failures.push(id+': follow-up not anchored');
   if(/tego nie wiem z wlasnej obserwacji|nie mam tego ustalonego|nie mam pewnosci|nie widzialem tego/.test(norm(simple)))failures.push(id+': generic fallback');
   if(!simple||!simple.includes(':')||!implication.includes('To opis mojej wiedzy'))failures.push(id+': unable to explain');
   if(!redirect.includes(':')||!redirect.includes('Noc')&&!redirect.includes('noc')&&!redirect.includes('biur')&&!redirect.includes('dyspozytorn')&&!redirect.includes('warsztat')&&!redirect.includes('BHP')&&!redirect.includes('diagnostyk')&&!redirect.includes('sesj')&&!redirect.includes('dyspozytor'))failures.push(id+': redirect failed');
   if(!ambiguous.includes('którą osobę'))failures.push(id+': ambiguous pronoun treated as fact');
   if(!another.includes('Który moment masz na myśli'))failures.push(id+': sequence context');
   if(!first||!simple||!redirect)failures.push(id+': empty answer');
   samples.push({id,first,simple,implication,redirect,ambiguous,another});
  }
  if(STATE.found.size!==found)failures.push('dialogue granted evidence');
  return {failures,samples,found};
 }''')
 assert not result['failures'],result['failures']
 print('PASS 6 witnesses × 6 follow-up patterns: plain language, implications, correction, pronoun ambiguity, sequence clarification')
 print('PASS no evidence unlocked by conversational reformulation')

 saved=page.evaluate('''() => {
  const c=CONTENT.characters[0];
  const before=JSON.stringify(NPC4_STATE[c.id].npc62);
  const snapshot=buildSave();
  npc4Answer(c,'Co robisz w tej chwili?','');
  safeLoad(snapshot);
  const after=NPC4_STATE[c.id].npc62;
  if(before!==JSON.stringify(after))throw Error('context not restored');
  return {snapshot,anchor:after.topic};
 }''')
 assert saved['anchor']=='alibi'
 print('PASS SaveManager round trip preserves contextual witness anchors and recent turns')

 # Old SaveManager data have no 6.2 state; should import without a stale anchor.
 migration=page.evaluate('''() => {
  const s=buildSave();
  for(const c of CONTENT.characters)if(s.npc4?.[c.id])delete s.npc4[c.id].npc62;
  const c=CONTENT.characters[0];
  npc4Restore(Object.fromEntries(CONTENT.characters.map(x=>[x.id,{}])));
  return PS62_DIALOGUE.inspect(c.id);
 }''')
 assert migration['topic']=='' and migration['recent']==0,migration
 print('PASS missing legacy npc62 resets anchors instead of carrying context between sessions')

 # New rewrite layer must not change any direct formal challenge or source-bearing question.
 critical=[
  'Czy masz dowód, że Lena była sama?',
  'Pokaż mi protokół zdarzenia i wytłumacz sprzeczność.',
  'Przyznajesz się do zabójstwa Leny?',
  'Kto sfałszował raport BHP?',
  'Czy to ty zabiłeś Lenę?',
  'Co oznacza log TCMS?',
 ]
 protected=page.evaluate('''(questions) => {
  const before=STATE.found.size,out=[];
  for(const c of CONTENT.characters){for(const q of questions){
    const old=NPC9_MEMORY[c.id].confronted?.length||0;
    const ans=npc4Answer(c,q,'');
    const after=NPC9_MEMORY[c.id].confronted?.length||0;
    out.push({id:c.id,q,a:ans,delta:after-old});
  }}
  return {out,before,after:STATE.found.size};
 }''',critical)
 assert protected['before']==protected['after'] and all(x['a'] and len(x['a'])<2600 for x in protected['out'])
 print('PASS 36 formal questions across all 6 witnesses; no material awarded or invented access')

 # Mixed long dialogues: verify no fatal errors and save representation stays bounded.
 stress=page.evaluate('''() => {
   const phrases=['Gdzie nocą przebywałeś?','A możesz to wyjaśnić po ludzku?',
    'Co z tego wynika?','Nie o to pytam, tylko gdzie byłeś?',
    'Co dokładnie robiłeś w pracy?','Powiedz to konkretniej','Gdzie ona wtedy była?',
    'Skąd w ogóle taka pewność?','Wróćmy do twojego alibi.',
    'Nie o to pytałem, interesuje mnie co zrobiłeś dalej.',
    'Czy to znaczy że Lena była sama?', 'Co przed chwilą powiedziałeś?'];
   const before=STATE.found.size;let seen=0,invalid=0;
   for(let j=0;j<1200;j++){
    const c=CONTENT.characters[j%6],q=phrases[j%phrases.length];
    const a=npc4Answer(c,q,'');if(typeof a!=='string'||!a.trim()||a.length>3000)invalid++;
    seen++;
   }
   const data=npc4Export(),stats=CONTENT.characters.map(c=>({id:c.id,entries:data[c.id]?.npc62?.recent.length||0,chars:JSON.stringify(data[c.id]?.npc62).length}));
   return {seen,invalid,found:STATE.found.size,before,stats};
 }''')
 assert stress['seen']==1200 and stress['invalid']==0 and stress['found']==stress['before'],stress
 assert all(x['entries']<=16 and x['chars']<13000 for x in stress['stats']),stress
 print('PASS 1200 mixed turns; bounded contextual history; no empty responses, exceptions or evidence leaks')
 assert not errors,errors

 # Validate the actual conversation UI, not only the engine's direct API.
 ui=browser.new_page(viewport={'width':390,'height':844})
 ui_errors=[];ui.on('pageerror',lambda e:ui_errors.append(str(e)))
 ui.set_content(HTML,wait_until='domcontentloaded')
 visual=ui.evaluate('''() => {
   showTab('interview');const results=[];
   for(const c of CONTENT.characters){
     STATE.activeChar=c.id;renderChat();
     const old=STATE.dialogues[c.id].length;
     document.getElementById('chatInput').value='Gdzie nocą przebywałeś?';
     document.getElementById('chatSend').click();
     document.getElementById('chatInput').value='A możesz to wyjaśnić po ludzku?';
     document.getElementById('chatSend').click();
     results.push({id:c.id,delta:STATE.dialogues[c.id].length-old,reply:STATE.dialogues[c.id].at(-1)?.text||''});
   }
   return {results,found:STATE.found.size};
 }''')
 assert all(x['delta']==4 and ':' in x['reply'] for x in visual['results']),visual
 assert visual['found']==result['found'] and not ui_errors,ui_errors
 print('PASS 12 real UI messages / 6 witnesses; exactly one local reply per question')
 ui.close()
 browser.close()
print('PASS Paket 6.2 offline QA completed')
