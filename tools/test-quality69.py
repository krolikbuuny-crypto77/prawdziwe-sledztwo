"""Pakiet 6.9: powtarzalny audit lokalnej jakości rozmów (BEZ prawdziwego Z.ai).
Obejmuje 180 pytań wprost do silnika i 36 tur przez UI; nie udaje ocen LLM.
Wynik JSON umożliwia ręczny audyt merytoryczny. Zabezpieczenia to osobne asercje.
"""
from pathlib import Path
import json, collections, re, shutil, statistics
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'qa69'
OUT.mkdir(exist_ok=True)
QUESTIONS=[
('alibi','Gdzie przebywał pan podczas nocnej zmiany?'),
('alibi','Gdzie był pan w czasie całego zajścia?'),
('source','Kto może potwierdzić pana obecność?'),
('lena','Czy Lena była sama na miejscu?'),
('lena','Czy rozmawiał pan z Leną?'),
('time','Kiedy ostatnio pan ją widział?'),
('time','Kiedy ostatni raz rozmawiał pan z Leną?'),
('time','Co było przed alarmem?'),
('challenge','Czy pan twierdzi, że na pewno nikogo tam nie było?'),
('challenge','Jak pan może twierdzić że nikt nie wszedł, skoro pana tam nie było?'),
('technical','Czy to pana zdaniem była awaria?'),
('technical','Co powinno wynikać z raportu technicznego?'),
('challenge','Dlaczego nie zgłosił pan tego wcześniej?'),
('observation','Nie pytam o dokument. Pytam co pan sam widział.'),
('observation','Co pan wie z własnej obserwacji, a co tylko z czyichś słów?'),
('followup','Nie o to pytałem. Kiedy to się wydarzyło?'),
('recall','Czy może pan powtórzyć ostatnią odpowiedź?'),
('observation','Czy na pewno widział pan ją wtedy osobiście?'),
('source','Z jakiego źródła pochodzi ta godzina?'),
('trust','Dlaczego miałbym panu wierzyć?'),
('followup','Proszę powiedzieć to zwyczajnie, bez urzędowego języka.'),
('relation','Jakie były pana relacje z Leną?'),
('challenge','Czy nie kłamie pan w sprawie alibi?'),
('compound','Co stało się później i kto o tym wiedział?'),
('source','Czy mógł pan to sprawdzić inaczej?'),
('trust','Nie sądzę by pan mówił całą prawdę.'),
('pronoun','Gdzie ona była przed zmianą?'),
('technical','Co oznacza protokół TCMS?'),
('technical','Co pan wie o kartach BHP?'),
('protected','Czy pan zabił Lenę?')
]
UI_QUESTIONS=[
'Gdzie przebywałeś podczas nocnej zmiany?',
'Kto może potwierdzić, że naprawdę tam byłeś?',
'Nie pytam o dokument, tylko o to, co sam widziałeś.',
'Jak możesz mieć pewność, że nikt tam nie wszedł, skoro tego nie obserwowałeś?',
'Przypomnij wcześniejsze zeznanie o alibi.',
'Czy przyznajesz się do zabójstwa Leny?'
]

def main():
 html=(ROOT/'index.html').read_text('utf8')
 with sync_playwright() as p:
  exe=shutil.which('chromium') or shutil.which('google-chrome')
  if not exe:raise RuntimeError('Brak Chromium')
  browser=p.chromium.launch(headless=True,executable_path=exe,args=['--no-sandbox'])
  page=browser.new_page(viewport={'width':390,'height':844})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded',timeout=60000)
  ids=page.evaluate('CONTENT.characters.map(c=>({id:c.id,name:c.name}))')
  baseline=page.evaluate('STATE.found.size')
  direct=[]
  for person in ids:
   for category,q in QUESTIONS:
    a=page.evaluate('''([id,q])=>npc4Answer(CONTENT.characters.find(c=>c.id===id),q,'')''',[person['id'],q])
    direct.append({'witness':person['id'],'category':category,'question':q,'answer':a})
  # UI path: new browser page to avoid pollution from direct calls; 36 genuine rounds.
  ui=browser.new_page(viewport={'width':390,'height':844})
  ui_errors=[];ui.on('pageerror',lambda e:ui_errors.append(str(e)))
  ui.set_content(html,wait_until='domcontentloaded',timeout=60000)
  initial=ui.evaluate('STATE.found.size');turns=[]
  for person in ids:
   for q in UI_QUESTIONS:
    row=ui.evaluate('''([id,q])=>{
      STATE.activeChar=id;showTab('interview');renderChat();
      const input=document.getElementById('chatInput'),btn=document.getElementById('chatSend');
      if(!input||!btn)return {error:'chat-ui-missing'};
      const log=STATE.dialogues[id];const before=log.length;input.value=q;
      btn.click();return {before,after:log.length,player:log.at(-2),npc:log.at(-1),found:STATE.found.size};
    }''',[person['id'],q])
    turns.append({'witness':person['id'],'question':q,'result':row})
  assert not errors,errors
  assert not ui_errors,ui_errors
  assert all(isinstance(x['answer'],str) and 0<len(x['answer'].strip())<=3000 for x in direct)
  assert page.evaluate('STATE.found.size')==baseline
  successful=[x for x in turns if x['result'].get('after',0)==x['result'].get('before',0)+2 and x['result'].get('npc',{}).get('role')=='npc']
  assert len(successful)==len(turns),(len(successful),len(turns))
  assert ui.evaluate('STATE.found.size')==initial
  assert all(x['result']['npc']['text'].strip() for x in successful)
  # Metrics below are descriptive, NOT semantic correctness or LLM quality scores.
  texts=[x['answer'].strip() for x in direct]
  by_w={w['id']: [x['answer'].strip() for x in direct if x['witness']==w['id']] for w in ids}
  metrics={
   'source':'local WitnessEngine, real Chromium; no live Z.ai',
   'characters':ids,
   'direct_questions':len(direct),
   'real_ui_turns':len(turns),
   'empty_answers':sum(not t for t in texts),
   'unique_answers':len(set(texts)),
   'unique_ratio':round(len(set(texts))/len(texts),3),
   'mean_answer_chars':round(statistics.mean(len(t) for t in texts),1),
   'minimum_answer_chars':min(map(len,texts)),
   'maximum_answer_chars':max(map(len,texts)),
   'per_witness_unique_counts':{w:len(set(ls)) for w,ls in by_w.items()},
   'no_evidence_added_by_dialogues':ui.evaluate('STATE.found.size')==initial,
   'script_errors':errors+ui_errors,
   'human_semantic_accuracy':'not measured automatically; see curated review',
   'true_zai_api':'not tested'
  }
  (OUT/'qa69-local-180.json').write_text(json.dumps({'metrics':metrics,'direct':direct},ensure_ascii=False,indent=2),'utf8')
  (OUT/'qa69-ui-36.json').write_text(json.dumps(turns,ensure_ascii=False,indent=2),'utf8')
  (OUT/'qa69-metrics.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2),'utf8')
  browser.close()
 print('PASS: 180 local engine questions; 36 genuine UI turns; 6 witnesses; no empty answers, JS errors, or evidence awarded')
 print(json.dumps(metrics,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
