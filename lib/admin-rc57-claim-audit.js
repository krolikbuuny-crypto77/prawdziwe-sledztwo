/* RC57.6 — post-inference grounded checks. Never included in the model prompt.
 * Heuristics flag review candidates, not conclusive guilt or semantic proof.
 */
const ID_PATTERN=/\b(?:EVID_[A-Z0-9_]+|(?:MED|TEC|VIS|ADM|DIG|LAB)-\d{2,3})\b/g;
const clean=v=>String(v||'').toLocaleLowerCase('pl');
export function auditBlindClaims(decision,{availableIds,allDocumentIds}){
 const fields=['reasoning','counterargument','missingProof'];
 const findings=[];
 const known=new Set(allDocumentIds||availableIds),available=new Set(availableIds);
 const cited=new Set();
 for(const field of fields){
  const txt=String(decision?.[field]||'');
  for(const id of txt.match(ID_PATTERN)||[]){
   cited.add(id);
   if(!known.has(id))findings.push({code:'unknown_document_in_text',level:'warning',field,evidence:id,
    detail:`W polu ${field} pojawia się identyfikator ${id}, którego nie ma w dokumentacji gry. Sprawdź, czy AI nie wymyśliło źródła.`});
   else if(!available.has(id))findings.push({code:'document_not_available_at_stage',level:'warning',field,evidence:id,
    detail:`Dokument ${id} istnieje, ale nie był dostępny w tej fazie śledztwa.`});
  }
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
 return {version:'RC57.6-claims',findings,requiresManualReview:findings.length>0,
  identifiersInText:[...cited],unrecognizedIdentifiers:[...new Set(findings.filter(x=>x.code==='unknown_document_in_text').map(x=>x.evidence))],
  note:'Reguły wskazują podejrzane twierdzenia do weryfikacji; nie potwierdzają logicznej poprawności całego uzasadnienia.'};
}
const words=t=>clean(t).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').match(/[a-z0-9]{3,}/g)||[];
function similarity(a,b){const A=new Set(words(a)),B=new Set(words(b));if(A.size<9||B.size<9)return 0;
 const overlap=[...A].filter(x=>B.has(x)).length;return overlap/Math.max(1,Math.min(A.size,B.size));}
export function auditLiveDialogue({question,answer,history=[]}){
 const q=clean(question),a=clean(answer),findings=[];
 const prior=Array.isArray(history)?history.filter(x=>x?.role==='witness'&&typeof x.text==='string'):[];
 if(prior.length>=2&&/(?:na poczatku|na początku|wczesniej|wcześniej|przed chwila|przed chwilą|powiedzial|powiedział|pamietasz|pamiętasz)/i.test(q)&&
    /(?:nie pamietam|nie pamiętam|nie odtwarzam|nie wiem)\b/i.test(a)&&/(?:nagran|zapisu|dokladn|dokładn)/i.test(a)){
  findings.push({code:'memory_evasion',level:'warning',detail:'Świadek odsyła do nagrania lub nie pamięta własnych słów, choć ich zapis jest obecny w historii testowej. Sprawdź pamięć kontekstu.'});
 }
 if(/\b(?:potem|następnie|najpierw|później)\b/i.test(a)&&
   /(?:nie (?:pamietam|pamiętam|odtwarzam|potrafie|potrafię)[^.]{0,85}kolejno|kolejno\w*[^.]{0,85}nie (?:pamietam|pamiętam|odtwarzam))/i.test(a)){
  findings.push({code:'self_order_contradiction',level:'warning',detail:'W tej samej wypowiedzi pada konkretna kolejność miejsc i zastrzeżenie, że świadek nie potrafi jej odtworzyć.'});
 }
 const repeat=prior.map(x=>similarity(x.text,answer));
 if(repeat.length&&Math.max(...repeat)>=0.84&&!/(?:powtorz|powtórz|przypomnij|co powiedzial|co powiedział|podsumuj)/i.test(q)){
  findings.push({code:'near_repetition',level:'warning',detail:'Odpowiedź jest bardzo podobna do wcześniejszej wypowiedzi, pomimo innego pytania.'});
 }
 return {version:'RC57.6-dialogue',findings,requiresManualReview:findings.length>0,note:'Kandydaci do przeglądu, nie automatycznie stwierdzone naruszenia kanonu.'};
}
