"""Pakiet 6.8: długoterminowa, ograniczona pamięć lokalnych zeznań. Bez rzeczywistego Z.ai."""
from pathlib import Path
import shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text('utf8')
CHROME=shutil.which('chromium') or shutil.which('google-chrome')
assert CHROME
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=CHROME,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844})
 errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
 page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
 assert len(page.evaluate('CONTENT.characters'))==6
 start=page.evaluate('STATE.found.size')
 def talk(id,q):
  return page.evaluate('''([id,q])=>{STATE.activeChar=id;showTab('interview');renderChat();
   document.getElementById('chatInput').value=q;document.getElementById('chatSend').click();
   return {row:STATE.dialogues[id].at(-1),previous:STATE.dialogues[id].at(-2),memory:PS68_MEMORY.inspect()[id]}}''',[id,q])
 for id in page.evaluate('CONTENT.characters.map(c=>c.id)'):
  for question in ['Gdzie byłeś podczas zmiany?', 'Kiedy rozpoczął się dyżur?', 'Co pan wie o Lenie?']:
   response=talk(id,question)
   assert response['row']['role']=='npc',response
  assert response['memory']['episodes']==3,(id,response)
 print('PASS: canonical local replies collected from 6 witnesses; independent per-witness stores')
 online_recall=talk('TOMASZ','Proszę przypomnij mi wcześniejsze zeznanie o alibi.')
 assert 'Wcześniej powiedziałem:' in online_recall['row']['text'],online_recall
 assert online_recall['memory']['episodes']==3
 print('PASS: local UI recall works and does not become a new authoritative testimony')
 # Recall 80+ turns later; first topic anchor must survive eviction.
 for i in range(90):
  response=talk('ELZBIETA',f'Co robiłaś w pracy, proszę wyjaśnić temat numer {i}?')
 assert 45<=response['memory']['episodes']<=80,response['memory']
 saved=page.evaluate('buildSave()')
 assert saved['ps68']['witnesses']['ELZBIETA']['anchors']['alibi']['first']['turn']==1
 assert all(len(w['episodes'])<=80 for w in saved['ps68']['witnesses'].values())
 assert len(str(saved['ps68']))<150000
 print('PASS: 90+ messages, 80-entry rolling limit, oldest alibi anchor preserved, bounded save payload')
 recalled=talk('ELZBIETA','Proszę przypomnij mi wcześniejsze zeznanie o alibi.')
 direct=page.evaluate("PS68_MEMORY.recallReply('ELZBIETA','Proszę przypomnij mi wcześniejsze zeznanie o alibi.')")
 assert 'Wcześniej powiedziałam:' in direct,direct
 assert recalled['memory']['episodes']<=80
 assert 'Wcześniej powiedziałam: „Wcześniej' not in recalled['row']['text']
 print('PASS: archived recall after long gap; no self-repeating recall facts')
 context=page.evaluate('''() => PS65_CONTEXT.read('ELZBIETA','To bieżąca odpowiedź lokalna.','Wróćmy do alibi.',0)''')
 assert context['memory']['longTerm']
 assert any(x['origin']=='prior-local' for x in context['knowledge']['factBank'])
 assert len(context['memory']['longTerm'])<=6
 assert not any(x.get('source','').startswith('future') for x in context['knowledge']['factBank'])
 print('PASS: safe historical anchors in cloud context and approved fact bank')
 # Old save import, partial save, reset/new session
 page.evaluate('d=>applySave(d)',saved)
 restored=page.evaluate('PS68_MEMORY.inspect().ELZBIETA')
 assert restored['topics']>=2 and restored['episodes']>=45
 old=page.evaluate('''()=>{let x=buildSave();delete x.ps68;delete x.saveMeta;return x}''')
 page.evaluate('d=>applySave(d)',old)
 assert page.evaluate('PS68_MEMORY.inspect().ELZBIETA.episodes')==0
 assert page.evaluate('STATE.found.size')==start
 page.evaluate('''()=>{STATE.dialogues.ELZBIETA=[];}''')
 assert page.evaluate('PS68_MEMORY.inspect().ELZBIETA.episodes')==0
 print('PASS: save/import, legacy missing memory, fresh session cleanup, evidence unchanged')
 assert not errors,errors
 browser.close()
