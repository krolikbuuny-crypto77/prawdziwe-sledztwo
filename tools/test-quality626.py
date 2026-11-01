"""6.26 browser regressions: question roles, exact displayed testimony, saves, count declensions.
Network provider is mocked; this is not a live Z.ai/Groq/Supabase test.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil, json, re
R=Path(__file__).resolve().parent.parent
HTML=(R/'index.html').read_text(encoding='utf8').replace('const online=/^https?:$/.test(location.protocol);','const online=true;')
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page(viewport={'width':390,'height':844});errors=[]
 page.on('pageerror',lambda e: errors.append(str(e)))
 page.set_content(HTML,wait_until='domcontentloaded',timeout=90000)
 focus=page.evaluate('''()=>[
 PS626_INTENT.focus('Gdzie przebywałeś między 01:30 a 02:05?'),
 PS626_INTENT.focus('Nie pytam o Lenę. Gdzie ty byłeś od 01:30 do 02:05?'),
 PS626_INTENT.focus('Kto zgłosił znalezienie Leny i o której godzinie?'),
 PS626_INTENT.focus('Kiedy ostatnio widziałeś Lenę żywą?'),
 PS626_INTENT.focus('Gdzie była Lena?'),
 PS626_INTENT.relevant('self_alibi','Ostatni raz widziałem Lenę żywą o 21:00.'),
 PS626_INTENT.relevant('alarm_report','Ostatni raz widziałem ją żywą przy bramie.'),
 psPolishCount(1,'pytanie','pytania','pytań'),psPolishCount(2,'pytanie','pytania','pytań'),psPolishCount(5,'pytanie','pytania','pytań'),psPolishCount(12,'pytanie','pytania','pytań'),psPolishCount(22,'pytanie','pytania','pytań'),
 psPolishCount(1,'zapis','zapisy','zapisów'),psPolishCount(2,'zapis','zapisy','zapisów')
 ]''')
 assert focus==['self_alibi','self_alibi','alarm_report',None,None,False,False,'pytanie','pytania','pytań','pytań','pytania','zapis','zapisy'],focus
 answers=page.evaluate('''()=>{
  const baseline=STATE.found.size;let rows=[];
  for(const [id,q] of [
   ['MAREK','Gdzie przebywałeś między 01:30 a 02:05?'],
   ['MAREK','Nie pytam o Lenę. Gdzie ty byłeś od 01:30 do 02:05?'],
   ['TOMASZ','Kto zgłosił znalezienie Leny i o której godzinie?'],
   ['TOMASZ','To kto dokładnie zgłosił alarm?']]){
   const c=CONTENT.characters.find(x=>x.id===id),reply=npc4Answer(c,q,'');
   rows.push({id,q,reply,topic:PS626_INTENT.focus(q),relevant:PS626_INTENT.relevant(PS626_INTENT.focus(q),reply)});
  }
  return {rows,unchanged:STATE.found.size===baseline};
 }''')
 assert answers['unchanged'] and all(x['relevant'] for x in answers['rows']),answers
 assert 'biur' in answers['rows'][0]['reply'].lower() or 'zmian' in answers['rows'][0]['reply'].lower(),answers
 assert '02:02' in answers['rows'][2]['reply'],answers
 print('PASS role-aware alibi/reporting for Marek and Tomasz; no evidence unlock')
 # Simulate a full successful API answer and check same turn in every persisted transcript.
 page.evaluate('''()=>{
  window.fetch=async(url,opts)=>({ok:true,status:200,json:async()=>({ok:true,serverCanonical:true,decision:'answer',semanticVerified:true,
   text:'Byłem dostępny z biura podczas nocnej zmiany. Nie mogę potwierdzić, że przebywałem tam bez przerwy.',provider:'zai'})});
  STATE.activeChar='MAREK';showTab('interview');renderChat();
  document.getElementById('chatInput').value='Gdzie byłeś podczas nocnej zmiany?';
  document.getElementById('chatSend').click();
 }''')
 page.wait_for_function('!window.PS77_AI.busy',timeout=30000)
 synced=page.evaluate('''()=>{const d=buildSave(),id='MAREK';return {
  log:d.dialogues?.[id]?.at(-1)?.text||STATE.dialogues[id].at(-1).text,
  approved:d.ps67.approved[id].at(-1)?.text,
  canonical:d.ps67.canonical[id].at(-1)?.text,
  episode:d.ps68.witnesses[id].episodes.at(-1)?.a,
  episodeCanonical:d.ps68.witnesses[id].episodes.at(-1)?.canonical,
  anchor:d.ps68.witnesses[id].anchors.alibi?.last?.a,
  identical:STATE.dialogues[id].at(-1).text===d.ps67.approved[id].at(-1)?.text &&
   STATE.dialogues[id].at(-1).text.slice(0,680)===d.ps68.witnesses[id].episodes.at(-1)?.a,
  found:STATE.found.size,ps67:d.ps67.version
 } }''')
 assert synced['identical'],synced
 assert synced['canonical']!=synced['log'] and synced['episodeCanonical']!=synced['episode'],synced
 assert synced['ps67']==1
 print('PASS local transcript, ps67.approved, ps68.episodes and anchors reconciled; canonical remains separate')
 # Repeat same scope: an untrusted/off-topic completion from an older backend cannot replace the correct local reply.
 # The current server's serverCanonical=true response is independently validated before commit.
 page.evaluate('''()=>{
  window.fetch=async()=>({ok:true,status:200,json:async()=>({ok:true,serverCanonical:false,decision:'answer',semanticVerified:true,
   text:'Ostatni raz rozmawiałem z Leną przy wagonie.',provider:'zai'})});
  STATE.activeChar='MAREK';showTab('interview');
  document.getElementById('chatInput').value='Gdzie byłeś od 01:30 do 02:05?';
  document.getElementById('chatSend').click();
 }''')
 page.wait_for_function('!window.PS77_AI.busy',timeout=30000)
 blocked=page.evaluate('''()=>{const d=buildSave(),a=STATE.dialogues.MAREK.at(-1).text;return {a,approved:d.ps67.approved.MAREK.at(-1).text,episode:d.ps68.witnesses.MAREK.episodes.at(-1).a,canon:d.ps67.canonical.MAREK.at(-1).text}}''')
 assert blocked['a']==blocked['approved'] and blocked['a'][:680]==blocked['episode'],blocked
 assert 'Ostatni raz rozmawiałem' not in blocked['a'],blocked
 print('PASS off-topic AI answer rejected; local answer and persisted memories stay aligned')
 # Reimport full save and re-read without duplicate or reset of the approved canon.
 restored=page.evaluate('''()=>{const s=buildSave();applySave(s);const x=buildSave();return {ok:x.ps67.approved.MAREK.at(-1).text===STATE.dialogues.MAREK.at(-1).text,
  immutable:x.ps67.canonical.MAREK.at(-1).text!==x.ps67.approved.MAREK.at(-1).text||x.ps67.canonical.MAREK.at(-1).text===STATE.dialogues.MAREK.at(-1).text};}''')
 assert restored['ok'],restored
 assert not errors,errors
 print('PASS SaveManager reload, browser JavaScript error count 0')
 browser.close()
