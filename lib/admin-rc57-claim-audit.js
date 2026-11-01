/* RC57.10.1 — post-inference grounded checks. Never included in the model prompt.
 * Heuristics flag review candidates, not conclusive guilt or semantic proof.
 */
const ID_PATTERN=/\b(?:EVID_[A-Z0-9_]+|(?:MED|TEC|VIS|ADM|DIG|LAB)-\d{2,3})\b/g;
const clean=v=>String(v||'').toLocaleLowerCase('pl');
const sentences=value=>String(value||'').split(/(?<=[.!?])\s+|[;\n]+/).map(x=>x.trim()).filter(Boolean);
const hedged=s=>/(?:\bmoż(?:e|liw)|\bmogł|\bprawdopodobn|\bhipotez|\bnie (?:wiadomo|ustalono|dowodzi|potwierdza|pozwala|oznacza)|\bbez (?:potwierdzenia|dowodu)|\bniekoniecznie|\bpotencjaln)/iu.test(s);
const add=(findings,code,field,evidence,detail)=>findings.push({code,level:'warning',field,...(evidence?{evidence}:{}),detail});
export function auditBlindClaims(decision,{availableIds,allDocumentIds}){
 const fields=['reasoning','counterargument','missingProof'];
 const findings=[];
 const known=new Set(allDocumentIds||availableIds),available=new Set(availableIds);
 const cited=new Set();
 for(const field of fields){
  const txt=String(decision?.[field]||'');
  for(const id of txt.match(ID_PATTERN)||[]){
   cited.add(id);
   if(!known.has(id))findings.push({code:'unknown_document_in_text',level:'error',field,evidence:id,
    detail:`W polu ${field} pojawia się identyfikator ${id}, którego nie ma w dokumentacji gry. Sprawdź, czy AI nie wymyśliło źródła.`});
   else if(!available.has(id))findings.push({code:'document_not_available_at_stage',level:'warning',field,evidence:id,
    detail:`Dokument ${id} istnieje, ale nie był dostępny w tej fazie śledztwa.`});
  }
 }
 // Explicit list is audited even at the 13-document stage; it must not hide a fabricated ID.
 for(const id of new Set(Array.isArray(decision?.evidenceIds)?decision.evidenceIds:[])){
  if(!known.has(id))findings.push({code:'unknown_document_in_evidence_list',level:'error',field:'evidenceIds',evidence:id,
   detail:`Lista głównych dowodów zawiera nieistniejący identyfikator ${id}.`});
  else if(!available.has(id))findings.push({code:'document_not_available_in_evidence_list',level:'error',field:'evidenceIds',evidence:id,
   detail:`Lista głównych dowodów zawiera ${id}, którego model nie otrzymał na tym etapie.`});
 }
 const reasoning=clean(decision?.reasoning),combined=clean(fields.map(k=>decision?.[k]).join(' '));
 // The C camera is 50 seconds *ahead*: subtract 50 seconds from the recorder reading.
 if(/(?:kamer\w*\s*c\b|cctv|monitoring)/i.test(combined)&&
    /01:38:50/.test(combined)&&/(?:\+\s*50\s*s|dodano\s*50\s*(?:s|sekund)|po\s*korekcie[^.]{0,48}01:38:50|01:38:50[^.]{0,48}po\s*korekcie)/i.test(combined)){
  findings.push({code:'camera_c_time_conversion',level:'warning',field:'reasoning',evidence:'EVID_CCTV_SYNC',
   detail:'Kamera C wyprzedza czas centralny o 50 s: 01:38:50 na rejestratorze oznacza 01:38:00 czasu centralnego. Sprawdź rozumowanie AI.'});
 }
 // A 01:35–01:44 fragment is real, but DIG-09 shows no interaction until 01:52.
 if(/(?:dig-09|aktywno\w*\s*(?:komputera|klawiatury)|interakcj\w*\s*(?:komputera|wskaźnika|klawiatury))/i.test(reasoning)&&
    /01:35\s*(?:-|–|—|do)\s*01:44/.test(reasoning)&&!/01:52/.test(reasoning)){
  findings.push({code:'incomplete_activity_window',level:'warning',field:'reasoning',evidence:'DIG-09',
   detail:'DIG-09 nie rejestruje następnej interakcji aż do 01:52. Przedział 01:35–01:44 jest tylko fragmentem luki, nie jej końcem.'});
 }
 // RC57.10.1: source-specific inference checks. These only flag affirmative,
 // recognizable overclaims. Uncertain hypotheses remain legitimate reasoning.
 for(const field of fields){
  const body=String(decision?.[field]||'');
  const bodyLower=clean(body);
  for(const sentence of sentences(body)){
   const st=clean(sentence);
   if((/aud-04|tab-aud-02|evid_message_device_metadata|kont[ao] audyt|urządzeni[ea] audytow/.test(st))&&
      /magdalen/.test(st)&&
      (/(?:magdalen\w*[^.!?]{0,95}jako nadawczyn)|(?:magdalen\w*[^.!?]{0,85}(?:wysłała|nadała|napisała) wiadomość)|(?:wiadomość[^.!?]{0,75}(?:wysłała|nadała) magdalen)/i.test(st))&&
      !hedged(st)){
    add(findings,'account_as_person',field,'EVID_MESSAGE_DEVICE_METADATA',
     'Metadane identyfikują konto i urządzenie, nie osobę obsługującą sprzęt. Sformułowanie sugeruje potwierdzonego nadawcę.');
   }
   if(/(?:niez[ao]realizowan|niewysłan|niewyslan|brak wysłania|brak wyslania|projektu zgłoszenia|projekt zgłoszenia)/.test(st)&&
      /(?:elżbiet|zieb|zięb|bhp|zgłoszen|zgloszen)/.test(st)&&
      /(?:ukrywan|zataj|tuszowan|świadom.*(?:winy|ukry|zataj))/i.test(st)&&!/(?:nie dowodzi|nie oznacza|nie świadczy|brak dowodu)/i.test(st)){
    add(findings,'bhp_draft_as_concealment',field,'EVID_BHP_DRAFT',
     'Niewysłany projekt BHP nie wystarcza do przypisania intencji ukrywania wiedzy lub udziału w zdarzeniu.');
   }
   if(/(?:kamer|monitoring|wizyjn)/.test(st)&&/(?:nisz|stanowisk(?:a|u)\s*(?:nr)?\s*3)/.test(st)&&
      /(?:brak|nie jest monitorowan|nie obejmuj|poza zasięgiem)/.test(st)&&
      /(?:uniemożliwia|uniemozliwia|wyklucza|nie da się|nie mozna|nie można)/.test(st)&&
      /(?:drog[ęai]|tras[ęay]|dojścia|dojscia)/.test(st)&&!hedged(st)){
    add(findings,'camera_blind_spot_overgeneralized',field,'VIS-10',
     'Kamery nie pokazują wnętrza niszy, ale umożliwiają częściową analizę drogi dojścia.');
   }
   if(/(?:sesj|połączeni|polaczeni|prezentacj)/.test(st)&&/(?:audyt|au-01|magdalen)/.test(st)&&
      /(?:udowadnia|dowodzi|potwierdza(?:ło|ła|ł|nie)?)/.test(st)&&
      /(?:fizyczn.{0,20}obecno|obecno.{0,25}(?:przed komputerem|w biurze)|przebywała w biurze)/.test(st)&&!hedged(st)){
    add(findings,'online_session_as_physical_alibi',field,'EVID_CONFERENCE_SESSION',
     'Ciągłe połączenie AU-01 nie dowodzi ciągłej fizycznej obecności uczestniczki.');
   }
   if(/(?:lab-03|lab-07|lab-09|włókn|wlokn)/.test(st)&&
      /(?:jednoznaczn|indywidualn|z całą pewnością|bezsporn)/.test(st)&&
      /(?:magdalen|osob[ęa]|sprawc|identyfik)/.test(st)&&!hedged(st)){
    add(findings,'class_fibers_as_individual_proof',field,'LAB-07',
     'Zbieżność włókien W-7 i P-A jest klasowa, nie identyfikuje jednoznacznie osoby.');
   }
   if(/(?:adm-04|215\s*(?:sekund|s)|analiz.{0,20}tras)/.test(st)&&
      /(?:magdalen.{0,70}(?:przeszła|dotarła|była przy)|udowadnia.{0,40}(?:przejś|obecno))/i.test(st)&&!hedged(st)){
    add(findings,'route_feasibility_as_presence',field,'ADM-04',
     'Wykonalność trasy 215 s nie potwierdza, że konkretna osoba nią przeszła.');
   }
   if(/(?:vis-05|vis-08|kamera c|monitoring)/.test(st)&&
      /(?:rozpoznan.{0,32}magdalen|twarz.{0,25}magdalen|identyfikowan.{0,32}magdalen)/.test(st)&&!hedged(st)){
    add(findings,'camera_as_facial_identification',field,'VIS-08',
     'Nagrania pokazują sylwetkę i ubiór, nie czytelną twarz Magdaleny.');
   }
  }
  if(/\blab-07\b/.test(bodyLower)&&/\blab-09\b/.test(bodyLower)&&
     /(?:dwa|kilka|odrębne|osobne)[^.]{0,55}(?:niezależn|dowod|ślad|potwierdz)/i.test(bodyLower)&&
     !/(?:nie (?:są|stanowią)|to nie)[^.]{0,45}niezależn/i.test(bodyLower)){
   add(findings,'dependent_lab_results_double_counted',field,'LAB-09',
    'LAB-07 i LAB-09 powtarzają ten sam profil włókien W-7/P-A; nie są dwoma niezależnymi zdarzeniami kontaktowymi.');
  }
 }
 return {version:'RC57.10.1-claims',findings,requiresManualReview:findings.length>0,
  identifiersInText:[...cited],unrecognizedIdentifiers:[...new Set(findings.filter(x=>x.code==='unknown_document_in_text').map(x=>x.evidence))],
  note:'Reguły wskazują podejrzane twierdzenia do weryfikacji; nie potwierdzają logicznej poprawności całego uzasadnienia.'};
}
const words=t=>clean(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').match(/[a-z0-9]{3,}/g)||[];
function similarity(a,b){const A=new Set(words(a)),B=new Set(words(b));if(A.size<9||B.size<9)return 0;
 const overlap=[...A].filter(x=>B.has(x)).length;return overlap/Math.max(1,Math.min(A.size,B.size));}
export function auditLiveDialogue({question,answer,history=[],witnessId=null}){
 const q=clean(question),a=clean(answer),findings=[];
 const prior=Array.isArray(history)?history.filter(x=>x?.role==='witness'&&typeof x.text==='string'):[];
 if(prior.length>=2&&/(?:na poczatku|na początku|wczesniej|wcześniej|przed chwila|przed chwilą|powiedzial|powiedział|pamietasz|pamiętasz)/i.test(q)&&
    /(?:nie pamietam|nie pamiętam|nie odtwarzam|nie wiem)\b/i.test(a)&&/(?:nagran|zapisu|dokladn|dokładn)/i.test(a)){
  findings.push({code:'memory_evasion',level:'warning',detail:'Świadek odsyła do nagrania lub nie pamięta własnych słów, choć ich zapis jest obecny w historii testowej. Sprawdź pamięć kontekstu.'});
 }
 // RC57.10.2: the start of a shift can be known while the ordering of later
 // visits is not. Only flag if an explicit later ordering is both stated and denied.
 const orderedPlaces=/\b(?:najpierw|potem|następnie|później)\b/i.test(a)&&
   (a.match(/\b(?:biurze|dyspozytorni|warsztacie|przejściu|stanowisku)\b/gi)||[]).length>=2;
 const deniesSameOrder=/(?:nie (?:pamiętam|pamietam|odtwarzam|potrafię|potrafie)[^.]{0,95}(?:w jakiej kolejności|kolejności tych|kolejności miejsc)|nie wiem[^.]{0,75}co (?:było|bylo) (?:pierwsze|najpierw))/i.test(a);
 const preciseOnly=/(?:co do minuty|dokładn(?:ych|ej)? godzin|w każdej minucie)/i.test(a);
 if(orderedPlaces&&deniesSameOrder&&!preciseOnly){
  findings.push({code:'self_order_contradiction',level:'warning',detail:'Świadek podaje konkretną kolejność kilku miejsc, a następnie zaprzecza pamięci tej samej kolejności. Zweryfikuj zakres wypowiedzi.'});
 }
 // RC57.8: do not confuse a defensible uncertainty with an evasive answer.
 const asksLocation=/(?:gdzie|w jakim miejscu|twoj[aą] obecno[sś][cć]|miejsce pobytu)/i.test(q);
 // A negative location ("nie byłam przy stanowisku") is NOT an answer to
 // "gdzie byłaś?". Only count affirmative locations, including terse replies.
 const loc=/\b(?:w|we|przy|na|obok)\s+(?:warsztacie|biurze|dyspozytorni|stanowisku|hali|korytarzu|przej[sś]ciu|zapleczu|zajezdni)\b/gi;
 const affirmativePlaces=[...a.matchAll(loc)].filter(m=>{
  const left=a.slice(Math.max(0,m.index-45),m.index);
  return !/\bnie\s+(?:(?:był|byl|pracował|pracowal|przebywał|przebywal|stał|stal)\w*\s+){1,3}$/iu.test(left)&&
    !/\bnie\s+(?:był|byl|pracował|pracowal|przebywał|przebywal|stał|stal)\w*\s*$/iu.test(left);
 });
 const hasPlace=affirmativePlaces.length>0;
 const cannotName=/(?:nie potrafi[eę] wskaza[cć]|nie mog[eę] poda[cć]|nie podam miejsca|nie wiem[ ,]*gdzie|nie (?:potrafi[eę]|mog[eę]) okre[sś]li[cć])/i.test(a);
 if(asksLocation&&!hasPlace&&cannotName){
  findings.push({code:'location_evasion',level:'warning',detail:'Pytanie dotyczy miejsca pobytu, ale odpowiedź zawiera tylko zaprzeczenie, ogólną niewiedzę lub brak potwierdzenia. Sprawdź, czy to uzasadniona luka pamięci.'});
 }
 if(asksLocation&&hasPlace&&/(?:nie (?:mog[eę]|potrafi[eę]) (?:poda[cć]|wskaza[cć]) miejsca|nie wiem[ ,]*gdzie by[lł][ae]m|nie potrafi[eę] wskaza[cć] swojego miejsca|nie mog[eę] poda[cć] miejsca|nie mam takiej pewno[sś]ci)/i.test(a)){
  findings.push({code:'place_self_contradiction',level:'warning',detail:'Świadek podaje miejsce, a następnie neguje możliwość wskazania lokalizacji. Może chodzić o inny przedział czasu — sprawdź zakres wypowiedzi.'});
 }
 // Conference presence and physical location are separate claims. A first-person
 // statement about having been at a "station" is not supported by a session log.
 if(witnessId==='MAGDALENA'&&asksLocation&&/(?:sesj[aęi]|połączeni[ea]|polaczeni[ea])/.test(a)&&
    /\bbył[aa]m\s+przy\s+stanowisku\b/i.test(a)){
  findings.push({code:'session_as_location',level:'warning',detail:'Magdalena podaje fizyczne stanowisko w kontekście sesji audytowej. Sam zapis połączenia nie ustala miejsca jej pobytu; wymaga ręcznej kontroli kanonu.'});
 }
 if(asksLocation&&/nie (?:potrafi[eę]|mog[eę]) tego potwierdzi[cć] z w[lł]asnej obserwacji/i.test(a)){
  findings.push({code:'self_location_observation',level:'warning',detail:'Świadek mówi o własnym miejscu pobytu jak o cudzej obserwacji. To nienaturalne i może ukrywać sprzeczność w relacji.'});
 }
 if(/(?:co mo[zż]esz potwierdzi[cć].*w[lł]asnej pami[eę]ci)/i.test(q)&&
    /^(?:z w[lł]asnej obserwacji nie mog[eę] tego potwierdzi[cć])/i.test(a)){
  findings.push({code:'memory_answer_without_referent',level:'warning',detail:'Odpowiedź zaczyna się od „tego”, nie wskazując, czego dotyczy zaprzeczenie. Zamiast wspomnienia podaje niezrozumiałe zastrzeżenie.'});
 }
 if(/nie pytam o len[aeęy]/i.test(q)&&/\b(?:len[aeęy]|rudnick)/i.test(a)){
  findings.push({code:'excluded_topic_repeated',level:'warning',detail:'Śledczy wyraźnie wyłączył temat Leny, a odpowiedź ponownie go rozwija. Sprawdź relewancję.'});
 }
 if(/\b(?:z w[lł]asnej obserwacji|dowodzi obecno[sś]ci przez ca[lł][aą] noc|obiektywne [zź]r[oó]d[lł]o)/i.test(a)&&a.length>65){
  findings.push({code:'overformal_answer',level:'warning',detail:'Nienaturalne, protokolarne sformułowanie — rozważ prostszą, bezpośrednią wypowiedź.'});
 }
 // QA-only spelling slips observed in a real RC57.6 export; never change witness facts.
 const slips=[['nadzierałem','nienaturalna lub błędna odmiana czasownika przy opisie nadzoru'],['dyspozyorni','literówka w nazwie dyspozytorni']];
 for(const [token,issue] of slips)if(a.includes(token))findings.push({code:'speech_typo',level:'warning',detail:'Możliwa usterka językowa: '+issue+'.'});
 const repeat=prior.map(x=>similarity(x.text,answer));
 // Repeating established work duties while answering a new *time-specific*
 // alibi question isn't by itself irrelevant repetition if the timeframe is new.
 const addsTimeFrame=asksLocation&&/po p[oó][lł]nocy/i.test(q)&&
   /(?:po p[oó][lł]nocy|konkretnego miejsca|dok[lł]adnej godziny)/i.test(a)&&
   prior.every(x=>!/po p[oó][lł]nocy/i.test(x.text));
 if(repeat.length&&Math.max(...repeat)>=0.84&&!addsTimeFrame&&
   !/(?:powtorz|powtórz|przypomnij|co powiedzial|co powiedział|podsumuj)/i.test(q)){
  findings.push({code:'near_repetition',level:'warning',detail:'Odpowiedź jest bardzo podobna do wcześniejszej wypowiedzi, pomimo innego pytania.'});
 }
 return {version:'RC57.10.2-dialogue',findings,requiresManualReview:findings.length>0,note:'Kandydaci do przeglądu, nie automatycznie stwierdzone naruszenia kanonu.'};
}
