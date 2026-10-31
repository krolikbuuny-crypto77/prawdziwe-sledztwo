/** Bounded, non-authoritative discourse cues. Never rewrites the question or adds facts. */
const clean=s=>String(s||'').replace(/[<>\u0000-\u001f]/g,' ').trim().slice(0,1600);
const fold=s=>clean(s).toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
const player=r=>['player','śledczy','investigator'].includes(r?.role);
const witness=r=>['witness','świadek'].includes(r?.role);
const expressions=[
 [/bez kitu|serio|na serio/,'możliwa prośba o szczere, jednoznaczne potwierdzenie; uwzględnij kontekst'],
 [/sciemni\w*/,'ściemniać: możliwy zarzut ukrywania prawdy, nie pytanie o światło'],
 [/wcisk\w*\s+(?:mi\s+)?kit|bajer\w*/,'wciskać kit, bajerować: możliwy zarzut niewiarygodności'],
 [/krecisz|kreci pan|kreci pani|nie krec/,'kręcić: możliwe unikanie odpowiedzi; przy urządzeniu możliwy sens dosłowny'],
 [/nie klei|nie trzyma sie kupy/,'nie klei się: możliwa niespójność wersji wydarzeń'],
 [/kto.*(?:klepnal|przyklepal)|kto.*dal zielone/,'klepnąć, dać zielone światło: pytanie o zatwierdzającego lub zgodę'],
 [/puscil\w* pare|sypnal\w*/,'puścić parę, sypnąć: możliwe ujawnienie informacji, nie automatyczne przyznanie'],
 [/robi\w* w balona|robisz.*idiote/,'robić w balona: zarzut wprowadzania w błąd'],
 [/gdzie.*(?:siedziales|siedzialas)|gdzie.*szwendal/,'siedzieć, szwendać się: możliwe pytanie o pobyt, nie samą pozycję ciała'],
 [/co.*odwal|co.*kombin|o co.*kaman|o co.*biega/,'potoczna prośba o wyjaśnienie czynności lub sensu'],
 [/gadaj|no mow|dawaj.*konkret|bez lania wody|po ludzku/,'żądanie krótkiej, konkretnej odpowiedzi zwykłym językiem'],
 [/co.*(?:pieprz|pierdol)|do cholery|do kurwy/,'wulgaryzm może wyrażać niedowierzanie; odpowiedz na treść bez naśladowania obelgi'],
 [/samo sie|sam sie|niewiniat|no jasne|no tak|ta jasne|dobre sobie|akurat|geniusz|brawo|gratuluje|swiety|swieta/,'możliwa ironia: sprawdź sprzeczność między dosłownymi słowami, faktami i kontekstem']
];
export function buildPolishPragmatics(question,history=[]){
 const original=clean(question),q=fold(original);
 const segments=original.split(/(?<=[?!;])\s*|\s+(?:i|oraz|a|ale)\s+(?=(?:gdzie|kto|komu|kiedy|dlaczego|czemu|jak|czy|skąd|co|ile|o której)\b)/iu).map(clean).filter(Boolean);
 const references=/\b(?:to|tego|temu|tym|tam|tamtedy|wtedy|ona|on|oni|nim|niej|ten|ta|tamten|tamta|druga|drugiej|pierwszy|drugi)\b/.test(q)||/a skad|a czemu|a dlaczego|osobiscie|no i co/.test(q);
 const pairs=[];
 const rows=Array.isArray(history)?history:[];
 for(let i=rows.length-1;i>0&&pairs.length<3;i--){
  const b=rows[i],a=rows[i-1];if(!witness(b)||!player(a))continue;
  if(b.narrativeStatus==='offline_unverified')continue;
  pairs.unshift({question:clean(a.text).slice(0,450),reply:clean(b.text).slice(0,600),status:'reported-statement-not-evidence'});
 }
 const nonliteral=/(?:no jasne|no tak|ta jasne|dobre sobie|akurat|niewiniat|brawo|gratuluje|geniusz|samo sie|sam sie|pewnie.*(?:duch|krasnolud|cud)|swiety|swieta)/.test(q);
 const premiseRisk=/(?:\bskoro\b|\bprzeciez\b|\bdlaczego\b.{0,80}(?:usun|zabil|ukryl|sfalsz|wykas|sklam)|\bczemu\b.{0,80}(?:usun|zabil|ukryl|sfalsz)|twierdz\w*.{0,100}(?:ale|tymczasem)|(?:caly czas|cala noc|nigdy|zawsze).{0,90}(?:ale|choc|jednak))/.test(q);
 const registerHints=expressions.filter(([pattern,hint])=>pattern.test(q)&&!(hint.startsWith('kręcić:')&&/pokret|korba|galka|kierown/.test(q))).map(([,hint])=>hint).slice(0,5);
 return {
  version:'RC20',authority:'tentative-language-cues-not-facts',
  segments:segments.slice(0,8),segmentationIncomplete:segments.length>8,
  possibleNonliteral:nonliteral,possiblePremiseConflict:premiseRisk,
  registerHints,
  referenceContext:references?pairs:[],
  unresolvedReference:references&&pairs.length===0,
  requireSemanticAudit:segments.length>1||nonliteral||premiseRisk||references||registerHints.length>0,
  instruction:'Samodzielnie zinterpretuj oryginalną wypowiedź. Segmenty i wskazówki mogą być błędne. Rozważ wszystkie istotne prośby, możliwe odniesienia i ironiczny sens. Historia pokazuje tylko wypowiedziane słowa, nie fakty. Gdy dwa odniesienia pozostają równie prawdopodobne, zadaj jedno konkretne pytanie doprecyzowujące i odpowiedz na część jednoznaczną.'
 };
}
