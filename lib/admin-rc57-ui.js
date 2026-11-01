/* RC57 dashboard served from a function, not bundled into the player's index.html. */
import crypto from 'node:crypto';
import {configured,securityHeaders} from './admin-rc57-auth.js';
const page=(ready,nonce)=>`<!doctype html><html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>RC57 — prywatny tester śledztwa · RC57.6</title>
<style nonce="${nonce}">
:root{font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color-scheme:dark;background:#080d18;color:#eff5fd}*{box-sizing:border-box}body{margin:0;min-height:100vh}main{max-width:1020px;margin:32px auto;padding:16px}h1{font-size:1.8rem;margin:0 0 8px}h2{font-size:1.15rem}p,.subtle{color:#bac8dd;line-height:1.55}.card{border:1px solid #263750;background:#101c2d;border-radius:14px;padding:20px;margin:16px 0}.row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}.space{justify-content:space-between}input,button,select{font:inherit;border-radius:9px;padding:11px 14px;min-height:43px}input,select{color:#f7f9fd;border:1px solid #496080;background:#142338;max-width:100%}button{border:1px solid #7493c1;background:#183959;color:#fff;cursor:pointer}button.primary{background:#295c99;border-color:#5096e9}button:hover:not(:disabled){filter:brightness(1.12)}button:disabled{opacity:.55;cursor:not-allowed}label{display:block;font-size:.95rem;margin-bottom:8px}.hidden{display:none!important}.error{color:#ff9e9e}.success{color:#8ee1b5}.warn{color:#ffdc8e}.stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}.metric{border:1px solid #2b4563;border-radius:10px;padding:13px;background:#0b1726}.metric strong{font-size:1.35rem;display:block}.progress{width:100%;height:13px;border-radius:40px;background:#263650;overflow:hidden}.bar{height:100%;width:0;background:#3baf78;transition:width .18s}.items{max-height:440px;overflow-y:auto;border:1px solid #29405f;border-radius:10px}.case{padding:10px 12px;border-bottom:1px solid #243a57}.case:last-child{border:none}.tag{font-size:.78rem;padding:3px 8px;border-radius:6px;background:#273a55}.case small{display:block;color:#adc1d5;margin-top:3px}.foot{font-size:.88rem;color:#a9b9d0}a{color:#a9ccff}code{background:#223047;padding:2px 6px;border-radius:4px}@media(max-width:650px){main{margin:10px auto}.stats{grid-template-columns:repeat(2,minmax(0,1fr))}h1{font-size:1.5rem}.row>*{flex-shrink:1}}
</style></head><body><main><div class="row space"><div><h1>RC57 — Centrum testowania śledztwa · RC57.6</h1><p class="subtle">Panel administratora · oddzielony od gry · mechanika testowana bez Supabase, prawdziwe AI tylko za zgodą</p></div><a href="/" rel="noreferrer">Wróć do gry</a></div>
<section id="setup" class="card hidden"><h2>Konfiguracja wymagana</h2><p>Ustaw sekrety <code>RC57_ADMIN_PASSWORD</code> i <code>RC57_ADMIN_SECRET</code> w Vercel → Environment Variables (minimum 20 i 32 znaki). Następnie wykonaj ponowne wdrożenie.</p></section>
<section id="login" class="card hidden"><h2>Logowanie administratora</h2><form id="loginForm"><label for="pass">Hasło administratora RC57</label><div class="row"><input id="pass" type="password" autocomplete="current-password" minlength="20" required style="flex:1;min-width:170px"><button class="primary" type="submit">Zaloguj</button></div></form><p id="loginError" class="error" role="alert"></p><p class="foot">Sam adres jest publiczny, ale testy i raporty wymagają uwierzytelnienia serwerowego. Sesja wygasa po 4 godzinach.</p></section>
<section id="dashboard" class="hidden"><section class="card"><div class="row space"><h2>Uruchom testy</h2><button id="logout">Wyloguj</button></div><p>Testy 60/600 są bezpłatnymi sprawdzeniami deterministycznymi; nie wysyłają zapytań do AI. Testy AI na żywo uruchamia się osobno poniżej.</p><div class="row"><label><span>Zakres:</span> <select id="mode"><option value="quick">Szybki — 60 testów</option><option value="full">Pełny — 600 testów</option></select></label><button class="primary" id="run">Uruchom test</button><button id="cancel" disabled>Przerwij</button><button id="export" disabled>Eksportuj JSON</button></div><p class="foot">Sprawdzamy prawdziwe funkcje rozpoznawania pytań, pamięci rozmów, ograniczeń wiedzy, blokad dowodów oraz zabezpieczeń tokenów. Testy awarii i kooperacji obejmują wybrane reguły i symulacje, a nie produkcyjne połączenie dwóch przeglądarek.</p></section>
<section class="card" id="blindSection"><h2>Ślepy test detektywistyczny — RC57.10.1</h2>
<p>Model otrzymuje wyłącznie treść dokumentów dostępnych graczowi. Dwa niezależne podejścia: 13 materiałów początkowych oraz komplet 78 dokumentów. <strong>Nie zna prawidłowego sprawcy</strong> ani werdyktu; rozwiązanie porównywane jest dopiero po udzieleniu odpowiedzi. Nie wczytuje wyników poprzedniej próby.</p>
<div class="row"><label>Dostawca <select id="blindProvider"><option value="apinex-luna">Apinex Luna</option><option value="apinex-jev">Apinex Jev 1.13</option></select></label></div>
<label><input id="blindConsent" type="checkbox"> Potwierdzam dwa wywołania rzeczywistego modelu AI oraz możliwe zużycie limitu/koszt u dostawcy.</label>
<div class="row"><button class="primary" id="blindRun" disabled>Rozpocznij ślepe śledztwo</button><button id="blindExport" disabled>Pobierz raport JSON</button></div>
<p class="foot" id="blindAvailability">Aby uruchomić test, włącz RC57_LIVE_TEST_ENABLED=true i skonfiguruj klucz dostawcy.</p>
<p id="blindStatus" role="status">Nie uruchomiono testu.</p>
<div class="items" id="blindResults"><div class="case subtle">Po uruchomieniu zobaczysz trzy osobne oceny: typowania sprawcy, poprawności źródeł i jakości rozumowania.</div></div>
<p class="foot">Zgodny wybór nie dowodzi wystarczającej mocy poszlak; test nie obejmuje żywych przesłuchań ani samodzielnego klikania minigier. Jeśli model nie potrafi rozstrzygnąć, wynik pozostanie nierozstrzygnięty, a nie automatycznie zaliczony.</p></section>
<section class="card" id="playSection"><h2>Automatyczne przejście całej gry — RC57.6</h2>
<p>Symulator rozpoczyna <strong>nowe śledztwo od zera</strong> i wykonuje kolejno: odkrywanie dokumentów, oględziny, analizy, oś czasu, zeznania offline, akt oskarżenia, obronę i werdykt. Nie dostaje gotowych dowodów. Wykona też scenariusz błędnego oskarżenia i wznowienia po przerwaniu.</p>
<div class="row"><button id="playRun" class="primary">Przejdź automatycznie całą sprawę</button><button id="playStop" disabled>Przerwij po scenariuszu</button><button id="playExport" disabled>Pobierz dziennik JSON</button></div>
<p id="playStatus" role="status">Nie uruchomiono symulacji.</p>
<div class="stats"><div class="metric"><strong id="playDone">0 / 3</strong>Ścieżki</div><div class="metric"><strong id="playActions">0</strong>Akcje</div><div class="metric"><strong id="playFailed" class="error">0</strong>Błędy</div><div class="metric"><strong id="playVerdicts">—</strong>Wyniki</div></div>
<div class="progress" role="progressbar" aria-label="Automatyczne przejście gry" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="playProgress"><div id="playBar" class="bar"></div></div>
<div id="playPaths" class="items"><div class="case subtle">Po uruchomieniu pojawi się pełna historia każdego przebiegu.</div></div>
<details style="margin-top:14px"><summary>Co symulator faktycznie wykonuje?</summary><p>Przechodzi <strong>sekwencyjnie</strong> rzeczywiste walidatory serwerowe na odrębnym stanie w pamięci funkcji Vercel. Nie używa bazy produkcyjnej, nie wysyła pytań do modeli AI i nie otwiera ani nie klika ekranów gry. Zeznania są jawnie oznaczone jako lokalne, niezweryfikowane. Wynik zielony dotyczy logiki ścieżki; do pełnego testu produktu w przeglądarce nadal potrzebne są testy E2E i Supabase.</p></details></section>
<section class="card" id="gameSection"><h2>Audyt całego śledztwa — RC57.6</h2>
<p>380 odrębnych przypadków wykonuje <strong>prawdziwe walidatory reguł gry</strong> na izolowanym stanie: od rozpoczęcia i oględzin przez dokumenty, chronologię, zagadki, zeznania offline, aż po oskarżenie, obronę i werdykt. Nie modyfikuje zapisów ani bazy.</p>
<div class="row"><button id="gameRun" class="primary">Sprawdź mechanikę całej sprawy</button><button id="gameCancel" disabled>Przerwij</button><button id="gameExport" disabled>Raport JSON</button></div>
<p id="gameStatus" role="status">Nie uruchomiono audytu śledztwa.</p><div class="stats"><div class="metric"><strong id="gameDone">0</strong>Wykonane</div><div class="metric"><strong id="gamePass" class="success">0</strong>Zaliczone</div><div class="metric"><strong id="gameWarn" class="warn">0</strong>Ostrzeżenia</div><div class="metric"><strong id="gameFail" class="error">0</strong>Błędy</div></div>
<div class="progress" role="progressbar" aria-label="Audyt całej sprawy" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="gameProgress"><div id="gameBar" class="bar"></div></div>
<div id="gameGroups" class="foot" style="margin:12px 0">Kategorie będą widoczne po uruchomieniu.</div><div class="items" id="gameIssues"><div class="case subtle">Wyniki i ewentualne problemy pojawią się tutaj.</div></div>
<h3>Kontrola ekranu gry w przeglądarce</h3><p>Osobny szybki test dostępności strony, sekcji i kluczowych przycisków. Nie zapisuje nic do gry.</p>
<div class="row"><button id="uiRun">Sprawdź ekran gry</button><button id="uiExport" disabled>Raport interfejsu JSON</button></div><p id="uiStatus" role="status">Nie sprawdzano ekranu.</p><div id="uiIssues" class="items"></div>
<details style="margin-top:14px"><summary>Zakres testów i ograniczenia</summary><p>Testujemy logikę serwerową, a nie automatyczny klikany przebieg wszystkich ekranów. Osobne testy przeglądarkowe i dwuosobowe sprawdzanie pokoju Supabase wymagają izolowanego środowiska uruchomieniowego. Test AI na żywo znajduje się poniżej. Zielony wynik nie oznacza, że wszystkie ścieżki produkcyjne są bezbłędne.</p></details></section>
<section class="card" id="stressSection"><h2>RC57.10 — trudne pytania, literówki i zaprzeczenia</h2>
<p>120 deterministycznie losowanych, zróżnicowanych pytań do wszystkich sześciu świadków. Test sprawdza mechanizmy analizy i kontrakty, bez połączenia z API i bez zmiany zapisów. Wynik nie stanowi oceny wypowiedzi prawdziwego AI.</p>
<div class="row"><button id="stressRun" class="primary">Sprawdź 120 trudnych pytań</button><button id="stressExport" disabled>Pobierz raport JSON</button></div>
<p id="stressStatus" role="status">Nie uruchomiono testu.</p><div id="stressResults" class="items"></div></section>
<section class="card" id="liveSection"><h2>Rzeczywiste przesłuchania AI — RC57.10</h2>
<p>Kontrolowany test sześciu świadków z prawdziwą odpowiedzią modelu i produkcyjnym audytem faktów. Nie używa zapisów ani pokojów graczy. Wyniki nie gwarantują naturalności; każdą odpowiedź można przeczytać w pobranym raporcie.</p>
<div class="row"><label>Zakres <select id="liveMode"><option value="live-short">Krótki — 18 pytań, po 3 na świadka</option><option value="live-long">Długi — 72 pytania, po 12 na świadka</option><option value="live-stress">Trudne / literówki — 18 pytań, po 3 na świadka</option></select></label><label>Dostawca <select id="liveProvider"><option value="apinex-luna">Apinex Luna</option><option value="apinex-jev">Apinex Jev 1.13</option></select></label></div>
<label><input type="checkbox" id="liveConsent"> Potwierdzam użycie prawdziwego API. Każde pytanie może wymagać kilku wywołań modelu (odpowiedź, audyt i ewentualna poprawka). Test może zużyć limit lub naliczyć koszt u dostawcy.</label>
<div class="row"><button class="primary" id="runLive" disabled>Testuj prawdziwe AI</button><button id="cancelLive" disabled>Przerwij po bieżącej odpowiedzi</button><button id="resumeLive" disabled>Wznów od zatrzymanego pytania</button><button id="exportLive" disabled>Eksportuj rozmowy JSON</button></div>
<p id="liveAvailability" class="foot"></p><p id="liveStatus" role="status">Nie uruchomiono testów AI.</p>
<div class="stats"><div class="metric"><strong id="liveDone">0</strong>Wykonane</div><div class="metric"><strong id="livePassed" class="success">0</strong>Zaliczone</div><div class="metric"><strong id="liveWarning" class="warn">0</strong>Ostrzeżenia</div><div class="metric"><strong id="liveFailed" class="error">0</strong>Błędy</div><div class="metric"><strong id="liveBlocked" class="warn">0</strong>Wstrzymane próby</div></div>
<div id="liveIssues" class="items"><div class="case subtle">Tu pojawią się pytania, odpowiedzi oraz uwagi z audytu.</div></div>
<p class="foot">RC57.10: maksymalnie <strong>7 pytań testowych na minutę</strong> w tej karcie (co najmniej 8,572 s między rozpoczęciami). Limit obejmuje również ślepy test i wznowienia. Jedno pytanie może wymagać kilku wywołań API, więc mimo limitu pytań nadal jest możliwy błąd 429.</p><p class="foot">Ze względów bezpieczeństwa tryb jest domyślnie wyłączony. Ustaw w Vercel <code>RC57_LIVE_TEST_ENABLED=true</code> i ponownie wdróż. Wybierz dostawcę z już skonfigurowanym kluczem. Opcjonalny globalny limit rzeczywistych wywołań: migracja Supabase 007 i APINEX_SHARED_QUOTA_ENABLED=true. Bez tej opcji limit działa wyłącznie w karcie testera oraz istnieją limity sesji gracza.</p></section>
<section class="card"><h2>Raport wykonania</h2><div class="stats"><div class="metric"><strong id="done">0</strong>Wykonane</div><div class="metric"><strong id="passed" class="success">0</strong>Zaliczone</div><div class="metric"><strong id="warning" class="warn">0</strong>Ostrzeżenia</div><div class="metric"><strong id="failed" class="error">0</strong>Błędy</div></div><p id="runStatus" aria-live="polite">Nie uruchomiono testu.</p><div class="progress" role="progressbar" aria-label="Postęp testów" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="progress"><div id="bar" class="bar"></div></div></section>
<section class="card"><h2>Problemy wymagające sprawdzenia</h2><div class="items" id="issues"><div class="case subtle">Po uruchomieniu testów pojawią się tutaj błędy i ostrzeżenia.</div></div></section><p class="foot">RC57.6 — osobno: 600 testów dialogów, 380 kontroli mechaniki, kontrakty HTML i prawdziwe rozmowy AI. Automatyczne sekwencyjne przejście logiki jest w RC57.6; prawdziwe dwuosobowe E2E pozostaje testem odrębnym.</p></section></main>
<script nonce="${nonce}">
(()=>{'use strict';
const $=id=>document.getElementById(id);let running=false,stop=false,report=null,liveRunning=false,liveStop=false,liveReport=null,liveResume=null,liveConfig={enabled:false,providers:[]};let gameRunning=false,gameStop=false,gameReport=null,gameInfo=null,uiReport=null;let playRunning=false,playStop=false,playReport=null,playInfo=null;let blindRunning=false,blindReport=null,blindInfo=null;
// Deterministic stress parser tests, same private admin authentication and no API tokens.
let stressRunning=false,stressReport=null;
$('stressRun').addEventListener('click',async()=>{
 if(stressRunning)return;stressRunning=true;$('stressRun').disabled=true;$('stressExport').disabled=true;
 stressReport={release:'RC57.10-stress',startedAt:new Date().toISOString(),results:[],total:120,complete:false};
 try{for(let i=0;i<120;i+=20){const part=await api({action:'stress-batch',offset:i});stressReport.results.push(...part.results);$('stressStatus').textContent='Sprawdzono '+stressReport.results.length+' / 120';}
 stressReport.complete=true;const fails=stressReport.results.filter(x=>x.status==='fail');$('stressStatus').textContent='Ukończono 120 prób. Błędy parsera: '+fails.length+'; to nie jest wynik testu prawdziwego AI.';
 const out=$('stressResults');out.replaceChildren();for(const item of fails.slice(0,25)){const p=document.createElement('div');p.className='case';p.textContent=item.id+' · '+item.question+' · '+item.detail;out.append(p);}
 }catch(e){stressReport.error=e.message;$('stressStatus').textContent='Błąd testu: '+e.message;}
 finally{stressRunning=false;$('stressRun').disabled=false;$('stressExport').disabled=!stressReport?.results?.length;stressReport.endedAt=new Date().toISOString();}
});
$('stressExport').addEventListener('click',()=>{if(stressReport)saveJson('Prawdziwe_Sledztwo_RC57_10_stress.json',stressReport)});
// RC57.10: Shared client-side pacing for live interrogations, blind stages and retries.
// Counts tester questions, not upstream generation/semantic-audit/rewrite requests.
const AI_TEST_MAX_QPM=7,AI_TEST_MIN_INTERVAL_MS=Math.ceil(60000/AI_TEST_MAX_QPM);
let aiTestLastStart=null,aiTestCooldownUntil=0,aiTestSlotQueue=Promise.resolve();
async function reserveAiTestSlot(statusId,shouldCancel){
 // Reserve starts sequentially even if the user runs two AI test modes at once.
 const previous=aiTestSlotQueue;
 let unlock;aiTestSlotQueue=new Promise(resolve=>{unlock=resolve;});
 await previous;
 try{
  const target=Math.max(aiTestLastStart===null?0:aiTestLastStart+AI_TEST_MIN_INTERVAL_MS,aiTestCooldownUntil);
  while(Date.now()<target){
   if(shouldCancel&&shouldCancel())return false;
   const remaining=target-Date.now();
   $(statusId).textContent='Limit testów AI: maks. 7 pytań/min. Następne pytanie za '+Math.ceil(remaining/1000)+' s.';
   await new Promise(resolve=>setTimeout(resolve,Math.min(1000,Math.max(1,remaining))));
  }
  if(shouldCancel&&shouldCancel())return false;
  aiTestLastStart=Date.now();
  return true;
 }finally{unlock();}
}
const show=id=>{for(const el of ['setup','login','dashboard'])$(el).classList.toggle('hidden',el!==id)};
async function api(data){const resp=await fetch('/api/admin-rc57',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify(data),cache:'no-store'});const body=await resp.json().catch(()=>({error:'invalid_server_response'}));if(!resp.ok)throw Error(body.error||String(resp.status));return body;}
async function status(){const resp=await fetch('/api/admin-rc57',{credentials:'same-origin',cache:'no-store'});if(resp.status===401){show('login');return;}if(!resp.ok){show('setup');return;}const b=await resp.json();liveConfig=b.live||liveConfig;gameInfo=b.gameAudit||gameInfo;playInfo=b.playthrough||playInfo;blindInfo=b.blind||blindInfo;show('dashboard');updateLiveAvailability();updateBlindAvailability()}
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();$('loginError').textContent='';try{await api({action:'login',password:$('pass').value});$('pass').value='';show('dashboard');await status()}catch(err){$('loginError').textContent='Logowanie nieudane ('+err.message+').' ;$('pass').value='';}});
$('logout').addEventListener('click',async()=>{if(running||liveRunning||gameRunning||playRunning||blindRunning)return;try{await api({action:'logout'});}catch{}report=null;show('login');});
function render(){if(!report)return;const list=report.results;const total=report.total;const pass=list.filter(x=>x.status==='pass').length,warning=list.filter(x=>x.status==='warning').length,fail=list.filter(x=>x.status==='fail').length;
 $('done').textContent=String(list.length)+' / '+total;$('passed').textContent=String(pass);$('warning').textContent=String(warning);$('failed').textContent=String(fail);const p=Math.floor(100*list.length/total);$('bar').style.width=p+'%';$('progress').setAttribute('aria-valuenow',String(p));const box=$('issues');box.replaceChildren();const problems=list.filter(x=>x.status!=='pass');if(!problems.length){const el=document.createElement('div');el.className='case subtle';el.textContent=list.length===total?'Brak problemów w tym zestawie.':'Dotychczas bez problemów.';box.append(el);}for(const row of problems.slice(0,100)){const el=document.createElement('div');el.className='case';const strong=document.createElement('strong');strong.textContent=row.id+' · '+row.witness+' · '+row.group+' · '+row.status;const small=document.createElement('small');small.textContent=row.detail;el.append(strong,small);box.append(el);}if(problems.length>100){const extra=document.createElement('div');extra.className='case';extra.textContent='Pozostałe problemy: '+(problems.length-100)+' — pobierz pełny raport JSON.';box.append(extra);}}
$('cancel').addEventListener('click',()=>{stop=true;$('cancel').disabled=true;});
$('run').addEventListener('click',async()=>{if(running)return;running=true;stop=false;const mode=$('mode').value,total=mode==='quick'?60:600;report={release:'RC57-v1',mode,total,startedAt:new Date().toISOString(),endedAt:null,complete:false,results:[],limitations:['Testy deterministyczne','Brak rzeczywistych odpowiedzi dostawców AI','Brak rzeczywistej kooperacji na produkcyjnym Supabase','Brak zapisu wyników na serwerze']};$('run').disabled=true;$('mode').disabled=true;$('cancel').disabled=false;$('export').disabled=true;
 try{for(let offset=0;offset<total;offset+=20){if(stop)break;const batch=await api({action:'batch',mode,offset});if(batch.offset!==offset||batch.total!==total||batch.results.length>20)throw Error('batch_mismatch');report.results.push(...batch.results);render();$('runStatus').textContent='Wykonano '+report.results.length+' z '+total+'.';}
 report.complete=report.results.length===total&&!stop;report.endedAt=new Date().toISOString();$('runStatus').textContent=report.complete?'Test zakończony. Wynik: '+report.results.filter(x=>x.status==='fail').length+' błędów.':'Test przerwany lub niekompletny.';
 }catch(err){report.error=String(err.message);report.endedAt=new Date().toISOString();$('runStatus').textContent='Przerwano z błędem: '+err.message;}
 finally{running=false;$('run').disabled=false;$('mode').disabled=false;$('cancel').disabled=true;$('export').disabled=!report.results.length;render();}});
$('export').addEventListener('click',()=>{if(!report)return;const summary={pass:report.results.filter(x=>x.status==='pass').length,warning:report.results.filter(x=>x.status==='warning').length,fail:report.results.filter(x=>x.status==='fail').length};const blob=new Blob([JSON.stringify({...report,summary},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='Prawdziwe_Sledztwo_RC57_raport_'+report.mode+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);});
function updateLiveAvailability(){
 const selected=$('liveProvider').value;const active=!!liveConfig.enabled&&liveConfig.providers.includes(selected);
 $('runLive').disabled=liveRunning||!active||!$('liveConsent').checked;
 $('resumeLive').disabled=liveRunning||!active||!$('liveConsent').checked||!liveResume||liveResume.provider!==selected||liveResume.mode!==$('liveMode').value;
 $('liveAvailability').textContent=!liveConfig.enabled?'Tryb wyłączony. Dodaj RC57_LIVE_TEST_ENABLED=true w Vercel.':!liveConfig.providers.length?'Brak klucza APINEX_API_KEY na serwerze.':!liveConfig.providers.includes(selected)?'Brak skonfigurowanego klucza dla tego dostawcy.':'Dostawca gotowy. Odpowiedzi i ich oceny są zapisywane tylko w pamięci tej karty i w eksporcie.';
}
$('liveConsent').addEventListener('change',updateLiveAvailability);
$('liveProvider').addEventListener('change',updateLiveAvailability);
$('liveMode').addEventListener('change',updateLiveAvailability);
$('cancelLive').addEventListener('click',()=>{liveStop=true;$('cancelLive').disabled=true;});
function renderLive(){if(!liveReport)return;const rows=liveReport.results;
 $('liveDone').textContent=rows.length+' / '+liveReport.total;
 $('livePassed').textContent=rows.filter(x=>x.status==='pass').length;
 $('liveWarning').textContent=rows.filter(x=>x.status==='warning').length;
 $('liveFailed').textContent=rows.filter(x=>x.status==='fail').length;
 $('liveBlocked').textContent=(liveReport.blockedAttempts||[]).length;
 const box=$('liveIssues');box.replaceChildren();
 // Blocked attempts are NOT completed answers, but must be visible for debugging.
 for(const row of [...rows.slice(-18),...(liveReport.blockedAttempts||[]).slice(-6)]){
  const el=document.createElement('div');el.className='case';
  const name=document.createElement('strong');name.textContent=row.id+' · '+row.witness+' · '+row.status+' · '+row.elapsedMs+' ms';
  const q=document.createElement('div');q.textContent='Pytanie: '+row.question;
  const a=document.createElement('div');a.textContent='Odpowiedź: '+(row.answer||'(brak bezpiecznej odpowiedzi)');
  const note=document.createElement('small');note.textContent=row.detail;el.append(name,q,a,note);
  if(row.failureDiagnostics){const diag=document.createElement('small');diag.className='warn';
   const f=row.failureDiagnostics;
   diag.textContent='Dostawca: '+f.code+' · etap: '+f.phase+' · HTTP: '+(f.upstreamStatus??'nieznany')+
    ' · wywołania: '+f.providerCalls+(f.retryAfterSeconds?' · Retry-After: '+f.retryAfterSeconds+' s':'');
   el.append(diag);}
  if(row.qa?.productionAudit){const diag=document.createElement('small');diag.className='warn';diag.textContent='Audyt produkcyjny: '+row.qa.productionAudit.lastSafeReason+'; sprawdzenia odrzucone: '+row.qa.productionAudit.rejectedChecks.map(x=>x.phase+':'+x.code).join(', ');el.append(diag);}
  if(row.qa?.findings?.length){const qa=document.createElement('small');qa.className='warn';qa.textContent='Kontrola kontekstu: '+row.qa.findings.map(f=>f.code+' — '+f.detail).join(' ');el.append(qa);}
  box.append(el);
 }
}
// RC57.6: blocked API calls do not advance the test or change signed conversation history.
async function executeLiveLoop({mode,provider,total,offset,token}){
 liveRunning=true;liveStop=false;$('runLive').disabled=true;$('resumeLive').disabled=true;
 $('liveMode').disabled=true;$('liveProvider').disabled=true;$('cancelLive').disabled=false;$('exportLive').disabled=true;
 try{
  for(let step=offset;step<total;step++){
   if(liveStop)break;
   if(!await reserveAiTestSlot('liveStatus',()=>liveStop))break;
   const resp=await api({action:'live-step',mode,provider,offset:step,token,confirmed:step===0});
   if(resp.offset!==step||resp.total!==total||resp.results.length!==1)throw Error('Nieprawidłowa kolejność odpowiedzi testera');
   const item=resp.results[0];
   if(item.status==='blocked'){
    // Repeated manual retries of the SAME blocked question must not hammer
    // the free upstream quota every 20 s. No automatic retry is issued.
    const sameQuestionFailures=(liveReport.blockedAttempts||[]).filter(x=>x.retryOffset===step).length+1;
    const basePause=Number(resp.suggestedPauseSeconds)||20;
    const pauseSeconds=Math.min(300,Math.max(basePause,basePause*Math.min(8,2**(sameQuestionFailures-1))));
    liveReport.blockedAttempts.push({...item,retryOffset:step,retryable:resp.retryable,
     suggestedPauseSeconds:resp.suggestedPauseSeconds,effectivePauseSeconds:pauseSeconds,
     repetitionAtThisQuestion:sameQuestionFailures});
    if(resp.retryable)aiTestCooldownUntil=Math.max(aiTestCooldownUntil,Date.now()+pauseSeconds*1000);
    liveReport.stopReason=resp.stopped;
    liveResume=resp.retryable?{mode,provider,total,offset:step,token:resp.nextToken}:null;
    const reason=item.failureDiagnostics?.code||resp.stopped||'nieznana';
    const phase=item.failureDiagnostics?.phase||'nieustalony';
    $('liveStatus').textContent=!resp.retryable?
      'Nie można ponowić bez zmiany konfiguracji lub odnowienia limitu ('+reason+'). Sprawdź etap i HTTP w raporcie JSON; zaliczone odpowiedzi pozostają bez zmian.':
      resp.stopped==='answer_quality_rejected'?'Model nie uzyskał bezpiecznej odpowiedzi. Historia jest zachowana; po sprawdzeniu kodu odrzucenia możesz ponowić TO SAMO pytanie. Przerwa: '+pauseSeconds+' s.':
      'Żądanie wstrzymane ('+reason+', etap: '+phase+'). Pytanie nie zostało zaliczone ani pominięte. Próba '+sameQuestionFailures+' tego pytania. Wznów po '+pauseSeconds+' s; przy powtarzającym się błędzie sprawdź raport JSON.';
    renderLive();break;
   }
   token=resp.nextToken;liveReport.results.push(item);renderLive();
   $('liveStatus').textContent='Sprawdzono '+liveReport.results.length+' z '+total+'.';
  }
  liveReport.complete=liveReport.results.length===total&&!liveStop;
  if(liveReport.complete){liveResume=null;liveReport.stopReason=null;$('liveStatus').textContent='Test zakończony — przejrzyj ostrzeżenia i odpowiedzi.';}
  else if(liveStop){liveResume=null;$('liveStatus').textContent='Zatrzymano na żądanie. Możesz pobrać wyniki częściowe.';}
  liveReport.endedAt=new Date().toISOString();
 }catch(err){liveReport.error=err.message;liveReport.endedAt=new Date().toISOString();liveResume=null;$('liveStatus').textContent='Test zatrzymany: '+err.message;}
 finally{liveRunning=false;$('liveMode').disabled=false;$('liveProvider').disabled=false;$('cancelLive').disabled=true;
  $('exportLive').disabled=!liveReport.results.length&&!(liveReport.blockedAttempts||[]).length;updateLiveAvailability();renderLive();}
}
$('runLive').addEventListener('click',async()=>{
 if(liveRunning||!$('liveConsent').checked||!liveConfig.enabled)return;
 const mode=$('liveMode').value,provider=$('liveProvider').value,total=mode==='live-long'?72:18;
 if(!liveConfig.providers.includes(provider))return;
 liveResume=null;
 liveReport={release:'RC57.10.10-live',mode,provider,total,rateLimit:{maxQuestionsPerMinute:7,minStartIntervalMs:8572,scope:'jedna karta, wszystkie testy AI'},startedAt:new Date().toISOString(),endedAt:null,complete:false,results:[],blockedAttempts:[],limitations:['Pytania do modeli mogą zużyć limit API','Ocena semantyczna i naturalność wymagają kontroli człowieka','Bez produkcyjnej bazy danych i realnych graczy','Stan wznowienia jest tylko w otwartej karcie przez czas ważności podpisanego tokena (120 minut)']};
 await executeLiveLoop({mode,provider,total,offset:0,token:null});
});
$('resumeLive').addEventListener('click',async()=>{
 if(!liveResume||liveRunning||!$('liveConsent').checked)return;
 const start=liveResume;liveResume=null;
 await executeLiveLoop(start);
});
$('exportLive').addEventListener('click',()=>{if(!liveReport)return;
 const blob=new Blob([JSON.stringify({...liveReport,summary:{pass:liveReport.results.filter(x=>x.status==='pass').length,warning:liveReport.results.filter(x=>x.status==='warning').length,fail:liveReport.results.filter(x=>x.status==='fail').length,blocked:(liveReport.blockedAttempts||[]).length}},null,2)],{type:'application/json'});
 const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Prawdziwe_Sledztwo_RC57_10_10_AI_'+liveReport.mode+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
});


// RC57.6: independent blind reasoning stages. The model never receives the answer key.
function updateBlindAvailability(){
 const allowed=!!liveConfig.enabled&&liveConfig.providers.includes($('blindProvider').value);
 $('blindRun').disabled=blindRunning||!allowed||!$('blindConsent').checked;
 $('blindAvailability').textContent=allowed?'Dostawca gotowy. Każdy etap wykonuje jedno wywołanie AI, co może zużyć limit.':'Tryb wymaga RC57_LIVE_TEST_ENABLED=true i skonfigurowanego dostawcy.';
}
$('blindConsent').addEventListener('change',updateBlindAvailability);
$('blindProvider').addEventListener('change',updateBlindAvailability);
function renderBlind(){if(!blindReport)return;const root=$('blindResults');root.replaceChildren();
 for(const result of blindReport.stages){const item=document.createElement('div');item.className='case';
  const headline=document.createElement('strong');headline.textContent=(result.phase==='initial'?'13 dokumentów':'78 dokumentów')+' · Podejrzany: '+(result.decision.suspectId||'brak rozstrzygnięcia')+' · pewność: '+result.decision.certainty;item.append(headline);
  const dimensions=result.grade?.dimensions||{};
  for(const [name,value] of [['Dowody',result.decision.evidenceIds.join(', ')],['Uzasadnienie',result.decision.reasoning],['Alternatywa',result.decision.counterargument],['Brakujący dowód',result.decision.missingProof],
   ['1. Trafność wskazania',dimensions.verdict?.label||(result.grade?.graded?result.grade?.assessment:'Bez oceny sprawcy')],
   ['2. Poprawność dowodowa',dimensions.evidence?.label||'Nie oceniono'],
   ['3. Jakość rozumowania',dimensions.reasoning?.label||'Nie oceniono'],
   ['Ocena zbiorcza',result.grade?.assessment||'Nie oceniono'],
   ['Uwagi do argumentacji',result.qa?.findings?.map(f=>f.code+': '+f.detail).join(' | ')||'Brak sygnałów z kontroli heurystycznej; nie oznacza to zatwierdzenia rozumowania']]){
   const line=document.createElement('div');line.textContent=name+': '+(value||'brak');item.append(line);}
  root.append(item);
 }
}
$('blindRun').addEventListener('click',async()=>{
 if(blindRunning||!$('blindConsent').checked)return;const provider=$('blindProvider').value;
 if(!liveConfig.enabled||!liveConfig.providers.includes(provider))return;
 blindRunning=true;blindReport={release:'RC57.10.4-blind',provider,rateLimit:{maxQuestionsPerMinute:7,minStartIntervalMs:8572,scope:'jedna karta'},startedAt:new Date().toISOString(),stages:[],complete:false};
 $('blindProvider').disabled=true;$('blindExport').disabled=true;updateBlindAvailability();
 try{for(const stage of ['initial','complete']){
  $('blindStatus').textContent=stage==='initial'?'Ślepa analiza 13 dokumentów…':'Niezależna analiza 78 dokumentów…';
  await reserveAiTestSlot('blindStatus');
  const result=await api({action:'blind-stage',stage,provider,confirmed:true});
  if(result.phase!==stage||!result.blind||!result.integrity||!result.decision)throw Error('Nieprawidłowy raport modelu');
  blindReport.stages.push(result);renderBlind();
 }
 blindReport.complete=blindReport.stages.length===2;
 blindReport.comparison={firstChoice:blindReport.stages[0].decision.suspectId,finalChoice:blindReport.stages[1].decision.suspectId,
 changed:blindReport.stages[0].decision.suspectId!==blindReport.stages[1].decision.suspectId,
 interpretation:'Zmiana wskazania jest obserwacją, nie automatycznym dowodem rozwiązywalności.'};
 $('blindStatus').textContent='Zakończono dwie niezależne analizy. Przeczytaj uzasadnienie i kontrargumenty; wybór zgodny z kanonem nie wystarcza do oceny uczciwości zagadki.';
 }catch(e){blindReport.error=e.message;$('blindStatus').textContent='Test nieukończony: '+e.message+'; wyniki częściowe można pobrać.';}
 finally{blindRunning=false;blindReport.endedAt=new Date().toISOString();$('blindProvider').disabled=false;$('blindExport').disabled=blindReport.stages.length===0;updateBlindAvailability();renderBlind();}
});
$('blindExport').addEventListener('click',()=>{if(blindReport)saveJson('Prawdziwe_Sledztwo_RC57_10_1_slepy_test.json',blindReport)});

// Sequential playthrough: three independent, real-rule scenarios from initialState.
function renderPlaythrough(){
 if(!playReport)return;
 const paths=playReport.scenarios,steps=paths.flatMap(x=>x.steps),failed=steps.filter(x=>x.status==='fail').length;
 $('playDone').textContent=paths.length+' / 3';$('playActions').textContent=steps.length;$('playFailed').textContent=failed;
 $('playVerdicts').textContent=paths.map(x=>x.summary.verdict||'brak').join(' / ');
 const pct=Math.floor(paths.length*100/3);$('playBar').style.width=pct+'%';$('playProgress').setAttribute('aria-valuenow',String(pct));
 const view=$('playPaths');view.replaceChildren();
 for(const s of paths){const item=document.createElement('div');item.className='case';const strong=document.createElement('strong');
 strong.textContent=s.scenarioLabel+' — '+(s.summary.completed?'ukończona':'nieukończona')+', '+s.summary.steps+' działań, błędy: '+s.summary.failed+', werdykt: '+(s.summary.verdict||'brak');
 item.append(strong);
 const details=document.createElement('details'),head=document.createElement('summary');head.textContent='Zobacz kroki symulacji';details.append(head);
 const list=document.createElement('div');for(const step of s.steps){const line=document.createElement('div');line.className='case';line.textContent=step.id+' · '+step.phase+' · '+step.label+' · '+step.status+' · '+step.detail;list.append(line);}details.append(list);item.append(details);view.append(item);
 }
}
$('playStop').addEventListener('click',()=>{playStop=true;$('playStop').disabled=true;});
$('playRun').addEventListener('click',async()=>{
 if(playRunning)return;playRunning=true;playStop=false;
 playReport={version:'RC57.6-serial-playthrough',startedAt:new Date().toISOString(),complete:false,scenarios:[],coverage:playInfo?.covered||[],notCovered:playInfo?.notCovered||[]};
 $('playRun').disabled=true;$('playStop').disabled=false;$('playExport').disabled=true;
 try{
  for(const scenario of ['canonical','wrong_suspect','resume']){
   if(playStop)break;
   const s=await api({action:'playthrough-scenario',scenario});
   if(s.scenario!==scenario||!Array.isArray(s.steps)||!s.summary||s.summary.steps!==s.steps.length)throw Error('Nieprawidłowa odpowiedź symulatora');
   playReport.scenarios.push(s);renderPlaythrough();$('playStatus').textContent='Sprawdzono '+playReport.scenarios.length+' z 3 ścieżek.';
   if(!s.summary.completed)break;
  }
  playReport.complete=!playStop&&playReport.scenarios.length===3&&playReport.scenarios.every(s=>s.summary.completed);
  $('playStatus').textContent=playReport.complete?'Wszystkie 3 symulacje ukończone. Można pobrać dziennik akcji.':'Symulacja nieukończona lub przerwana — sprawdź ostatni krok i raport.';
 }catch(e){playReport.error=e.message;$('playStatus').textContent='Błąd: '+e.message;}
 finally{playRunning=false;playReport.endedAt=new Date().toISOString();$('playRun').disabled=false;$('playStop').disabled=true;$('playExport').disabled=!playReport.scenarios.length;renderPlaythrough();}
});
$('playExport').addEventListener('click',()=>{if(playReport)saveJson('Prawdziwe_Sledztwo_RC57_4_przejscie_calej_gry.json',playReport)});

// Server-owned whole-game core audit, no network beyond authenticated /api/admin-rc57.
function gameRender(){if(!gameReport)return;const rows=gameReport.results,total=gameReport.total;
 $('gameDone').textContent=rows.length+' / '+total;
 $('gamePass').textContent=rows.filter(x=>x.status==='pass').length;
 $('gameWarn').textContent=rows.filter(x=>x.status==='warning').length;
 $('gameFail').textContent=rows.filter(x=>x.status==='fail').length;
 const pct=Math.floor(rows.length*100/total);$('gameBar').style.width=pct+'%';$('gameProgress').setAttribute('aria-valuenow',String(pct));
 const groups={};for(const r of rows){const g=groups[r.group]||{pass:0,warning:0,fail:0};g[r.status]++;groups[r.group]=g}
 $('gameGroups').textContent=Object.entries(groups).map(([k,v])=>k+': '+v.pass+' zal., '+v.fail+' bł.').join(' · ');
 const problems=rows.filter(x=>x.status!=='pass');const list=$('gameIssues');list.replaceChildren();if(!problems.length){const node=document.createElement('div');node.className='case subtle';node.textContent='Brak wykrytych problemów w wykonanych przypadkach.';list.append(node)}
 for(const r of problems.slice(0,100)){const node=document.createElement('div'),strong=document.createElement('strong'),small=document.createElement('small');node.className='case';strong.textContent=r.id+' · '+r.group+' · '+r.description+' · '+r.status;small.textContent=r.detail;node.append(strong,small);list.append(node)}
}
$('gameCancel').addEventListener('click',()=>{gameStop=true;$('gameCancel').disabled=true});
$('gameRun').addEventListener('click',async()=>{if(gameRunning)return;gameRunning=true;gameStop=false;const total=gameInfo?.total||380;
 gameReport={release:'RC57.6-whole-game-core',mode:'whole-game',total,startedAt:new Date().toISOString(),complete:false,results:[],coverage:gameInfo?.coverage||[],notCovered:gameInfo?.notCovered||[]};
 $('gameRun').disabled=true;$('gameCancel').disabled=false;$('gameExport').disabled=true;
 try{for(let offset=0;offset<total;offset+=20){if(gameStop)break;const b=await api({action:'game-batch',offset});if(b.total!==total||b.offset!==offset||b.results.length>20||!b.results.length)throw Error('Błąd integralności wyników');gameReport.results.push(...b.results);gameRender();$('gameStatus').textContent='Wykonano '+gameReport.results.length+' / '+total}
 gameReport.complete=!gameStop&&gameReport.results.length===total;gameReport.endedAt=new Date().toISOString();$('gameStatus').textContent=gameReport.complete?'Zakończono: '+gameReport.results.filter(x=>x.status==='fail').length+' błędów. Nadal wymagane osobne testy live/E2E.':'Przerwano — wynik częściowy.';
 }catch(e){gameReport.error=String(e.message);gameReport.endedAt=new Date().toISOString();$('gameStatus').textContent='Błąd audytu: '+e.message}
 finally{gameRunning=false;$('gameRun').disabled=false;$('gameCancel').disabled=true;$('gameExport').disabled=!gameReport.results.length;gameRender()}
});
$('gameExport').addEventListener('click',()=>saveJson('Prawdziwe_Sledztwo_RC57_3_cala_sprawa.json',gameReport));
function saveJson(name,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
// Read-only browser smoke: inspect current deployed HTML and its controls without executing it.
$('uiRun').addEventListener('click',async()=>{const btn=$('uiRun');btn.disabled=true;$('uiExport').disabled=true;$('uiStatus').textContent='Sprawdzanie strony…';
 const ids=['nav','mainContent','overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final','chatInput','chatSend','characterList','docList','searchBtn','tlVerifyAll','saveBtn','loadFile'];
 const checks=[];const record=(name,ok,detail)=>checks.push({name,status:ok?'pass':'fail',detail});
 try{const response=await fetch('/',{cache:'no-store',credentials:'omit'});record('Strona główna HTTP 200',response.ok,'HTTP '+response.status);
 const content=await response.text();record('Dokument HTML',content.length>100000&&content.includes('<html'),'Rozmiar: '+content.length);
 const doc=new DOMParser().parseFromString(content,'text/html');for(const id of ids)record('Element #'+id,!!doc.getElementById(id),id);
 const scripts=[...doc.querySelectorAll('script')].map(x=>x.textContent||'').join(' ');for(const symbol of ['SaveManager','safeLoad','buildSave','showTab','CONTENT','STATE'])record('Moduł '+symbol,scripts.includes(symbol),'Obecność w dostarczonym HTML');
 record('Brak panelu RC57 w menu gry',!doc.getElementById('gameRun'),'Tester nie jest elementem gry');
 }catch(e){record('Pobranie strony gry',false,String(e.message))}
 uiReport={release:'RC57.6-browser-contract',startedAt:new Date().toISOString(),endedAt:new Date().toISOString(),results:checks,limitations:['Sprawdza dostarczony HTML i widoczność elementów, nie klika przez wszystkie ścieżki ani nie korzysta z Supabase.']};
 const list=$('uiIssues');list.replaceChildren();for(const row of checks.filter(x=>x.status==='fail')){const box=document.createElement('div');box.className='case';box.textContent=row.name+' — '+row.detail;list.append(box)}
 const errors=checks.filter(x=>x.status==='fail').length;$('uiStatus').textContent='Sprawdzono '+checks.length+' kontraktów ekranu; błędy: '+errors+'.';if(!errors){const ok=document.createElement('div');ok.className='case success';ok.textContent='Kontrola statyczna przeszła. Rzeczywiste klikanie i zapisy wymagają oddzielnych testów E2E.';list.append(ok)}
 btn.disabled=false;$('uiExport').disabled=false;
});
$('uiExport').addEventListener('click',()=>{if(uiReport)saveJson('Prawdziwe_Sledztwo_RC57_3_interfejs.json',uiReport)});

${ready?'status().catch(()=>show("login"));':'show("setup");'}
})();
</script></body></html>`;
export default function handler(req,res){securityHeaders(res);if(req.method!=='GET')return res.status(405).send('Method not allowed');const nonce=crypto.randomBytes(16).toString('base64');res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Content-Security-Policy',`default-src 'none'; script-src 'nonce-${nonce}'; style-src 'nonce-${nonce}'; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'; img-src 'none'`);return res.status(200).send(page(configured(),nonce));}
