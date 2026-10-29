"""Pakiet 6.11: offline, statycznie oceniany zestaw intencji i integralność faktów."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,shutil
ROOT=Path(__file__).resolve().parent.parent
CASES=[
 ('personal_observation','Co sam widziałeś tej nocy?'),
 ('knowledge_source','Skąd masz te informacje?'),
 ('certainty_limit','Na ile jesteś pewien swojej wersji?'),
 ('epistemic_challenge','Skoro nie obserwowałeś wejścia, jak możesz twierdzić, że nikt nie wszedł?'),
 ('time_precision','O której dokładnie to było?'),
 ('place_precision','W którym pomieszczeniu wtedy byłeś?'),
 ('alibi','Gdzie byłeś podczas nocnej zmiany?'),
 ('corroboration','Kto może potwierdzić twoją obecność?'),
 ('event_sequence','Co się stało potem?'),
 ('action_taken','Co z tym zrobiłeś?'),
 ('reason_for_action','Dlaczego nie zareagowałeś?'),
 ('report_recipient','Komu zgłosiłeś awarię?'),
 ('victim_contact','Kiedy ostatnio rozmawiałeś z Leną?'),
 ('relationship','Jakie były twoje relacje z Leną?'),
 ('previous_statement','Przypomnij wcześniejsze zeznanie o alibi.'),
 ('contradiction','Najpierw twierdziłeś inaczej, czy widzisz sprzeczność?'),
 ('clarify_reference','Co z nią?'),
 ('direct_accusation','Czy przyznajesz się do zabójstwa Leny?'),
 ('procedural_refusal','Dlaczego odmawiasz odpowiedzi?'),
 ('documents','Co wynika z dokumentów?')]
EXTRA=[
 ('knowledge_source','Na jakiej podstawie to twierdzisz?'),
 ('certainty_limit','Czy możesz wykluczyć, że ktoś tam był?'),
 ('epistemic_challenge','Jak możesz mieć pewność, skoro nie widziałeś wejścia?'),
 ('time_precision','Kiedy dokładnie ją spotkałeś?'),
 ('place_precision','Gdzie dokładnie to się zdarzyło?'),
 ('corroboration','Czy ktoś może to poświadczyć?'),
 ('reason_for_action','Co cię skłoniło do tej decyzji?'),
 ('report_recipient','Kogo poinformowałeś o awarii?'),
 ('victim_contact','Co powiedziała Lena podczas rozmowy?'),
 ('relationship','Jaka łączyła cię relacja z Leną?'),
 ('previous_statement','Co mówiłaś wcześniej?'),
 ('contradiction','Te wypowiedzi nie zgadzają się ze sobą.'),
 ('direct_accusation','Czy to ty zabiłeś Lenę?'),
 ('documents','Czy widziałeś raport?')]
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844})
 errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
 page.set_content((ROOT/'index.html').read_text('utf8'),wait_until='domcontentloaded',timeout=60000)
 assert page.evaluate('PS611_NLU.intents.length')==20
 report=[]
 for intended,q in CASES+EXTRA:
  got=page.evaluate('(q)=>PS611_NLU.analyze(q)',q)
  ok=intended in got['intents']
  report.append({'expected':intended,'question':q,'actual':got['intents'],'ok':ok})
 incorrect=[r for r in report if not r['ok']]
 assert not incorrect,incorrect
 assert page.evaluate('(q)=>PS611_NLU.analyze(q).slots.compound','O której byłeś i kto cię widział?')
 assert page.evaluate('(q)=>PS611_NLU.analyze(q).slots.negated','Nie widziałem jej tam.')
 assert page.evaluate('(q)=>!PS611_NLU.analyze(q).intents.includes("direct_accusation")','Kto zabił Lenę?')
 assert page.evaluate('''() => {const bank=[{id:'f0',origin:'current',text:'Nie wiem nic o wejściu.',certainty:'qualified'},
 {id:'f1',origin:'public',text:'Zajmowałem się pracą przy dokumentach.',certainty:'statement'},
 {id:'f2',origin:'prior-local',text:'Rozmawiałem z Leną o 21:47.',certainty:'statement'}];
 const out=PS611_NLU.rankFacts(bank,'O której rozmawiałeś z Leną?');
 return out.length===3&&out[0].id==='f0'&&out[1].text===bank[2].text&&JSON.stringify(out.map(x=>x.id))===JSON.stringify(['f0','f1','f2']);}''')
 before=page.evaluate('STATE.found.size')
 data=page.evaluate('''() => {
 const r=[];
 for (const c of CONTENT.characters){
  STATE.activeChar=c.id;showTab('interview');renderChat();
  const log=STATE.dialogues[c.id],before=log.length;
  const input=document.getElementById('chatInput');input.value='Co z nią?';document.getElementById('chatSend').click();
  const context=PS65_CONTEXT.read(c.id,log.at(-1).text,'Skąd masz pewność?',before);
  r.push({id:c.id,delta:log.length-before,answer:log.at(-1).text,plan:context?.request?.semanticPlan,
   factCount:context?.knowledge?.factBank?.length||0,first:context?.knowledge?.factBank?.[0]});
 }
 return r;
 }''')
 assert all(x['delta']==2 and x['answer'] and x['plan'] and x['factCount']<=36 and x['first']['origin']=='current' for x in data),data
 assert page.evaluate('STATE.found.size')==before
 assert not errs,errs
 out={'questions':len(report),'recognized':sum(r['ok'] for r in report),'witnesses':len(data),'evidenceAdded':0,'errors':errs,'cases':report,'contexts':data}
 (ROOT/'QA-6.11-WYNIKI.json').write_text(json.dumps(out,ensure_ascii=False,indent=2),'utf8')
 print(f"PASS package6.11: {len(report)}/{len(report)} intents, 6 witnesses, no evidence unlock, bounded facts, page errors=0")
 browser.close()
