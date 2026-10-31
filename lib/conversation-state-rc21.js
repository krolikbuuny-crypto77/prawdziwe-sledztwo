/** Server transcript -> discourse state and style only. Never adds case facts or unlocks. */
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').toLowerCase().replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const text=s=>String(s||'').replace(/[<>\u0000-\u001f]/g,' ').trim();
const profiles={
 MAREK:{concern:'Odpowiedzialność za organizację i rozliczenia; utrata kontroli nad wyjaśnieniem własnych decyzji.',habit:'Wyjaśnia zakres decyzji. Przy nacisku skraca obronne wstępy i podaje własną czynność.',repair:'Na konkretny dokument reaguje rozdzieleniem decyzji, zapisu i wykonania.'},
 TOMASZ:{concern:'Znalezienie Leny i odpowiedzialność za dyspozycje oraz łączność.',habit:'Krótko opisuje kolejność zdarzeń. Nie zasłania pytania technicznym żargonem.',repair:'Przy pytaniu o czas oddziela punkt z rejestru od własnej pamięci.'},
 JANUSZ:{concern:'Rzetelność pracy warsztatu i różnica między formularzem a rzeczywistym sprawdzeniem.',habit:'Konkretny język warsztatowy. Przy zarzucie odnosi się do wskazanej czynności, nie wygłasza obrony całego warsztatu.',repair:'Wyjaśnia kolejno wykonanie, zapis i podpis.'},
 ELZBIETA:{concern:'Reakcja na ostrzeżenie Leny i możliwość zaniedbania obowiązku.',habit:'Uważna i bardziej osobista przy Lenie; nie wyprowadza wiedzy o przemocy z poczucia winy.',repair:'Oddziela rozmowę o ryzyku, dokument i jego doręczenie.'},
 KAMIL:{concern:'Błędne przypisanie człowiekowi czynności na podstawie logu lub nośnika.',habit:'Techniczny konkret w zwykłym języku. Nie poucza śledczego zamiast odpowiadać.',repair:'Wskazuje, co rejestr mierzy, a czego nie identyfikuje.'},
 MAGDALENA:{concern:'Wiarygodność zawodowa i interpretacja dokumentacji odbiorowej.',habit:'Precyzyjna, oszczędna wypowiedź. Przy nacisku nie przechodzi w rozwlekły język prawniczy.',repair:'Rozdziela zapis dokumentu, własne działanie i wniosek śledczego.'}
};
export function buildConversationState(id,transcript=[],question='',presentedEvidence=null){
 const rows=Array.isArray(transcript)?transcript.slice(-80):[];
 const entries=[];
 for(let i=1;i<rows.length;i++){
  const a=rows[i-1],b=rows[i];
  if(!['player','śledczy'].includes(a?.role)||!['witness','świadek'].includes(b?.role)||b.narrativeStatus==='offline_unverified')continue;
  const answer=text(b.text),q=text(a.text),normal=fold(answer);
  const state=b.narrativeStatus==='scripted_correction'?'reported_scripted_correction':
   /czy chodzi|kogo masz na mysli|co masz na mysli|prosze (?:wskaz|doprecyz)|ktory (?:zapis|dokument)/.test(normal)&&answer.includes('?')?'clarification_requested':
   /nie wiem|nie pamietam|nie potrafie|nie moge potwierdz|nie wskaze/.test(normal)?'reported_knowledge_limit':'reported_answer';
  const entry={question:q.slice(0,280),reply:answer.slice(0,420),state,turn:entries.length+1};
  if(state==='reported_scripted_correction')for(const earlier of entries)if(fold(earlier.question)===fold(q))earlier.supersededBy=entry.turn;
  const pending=entries.at(-1);
  if(pending?.state==='clarification_requested'){
   const words=fold(q).split(' ');
   const explicitChoice=/^(?:o )?(?:pierwsz|drug)/.test(fold(q))&&pending.reply.includes('?');
   const offered=fold(pending.reply).split(' ').filter(w=>w.length>4).map(w=>w.slice(0,5));
   const overlap=words.filter(w=>w.length>4).some(w=>offered.includes(w.slice(0,5)));
   if(fold(q)===fold(pending.question)||explicitChoice||(words.length<=8&&overlap))pending.followedByTurn=entry.turn;
  }
  entries.push(entry);
 }
 const q=fold(question),last=entries.at(-1);
 const pressure=rows.filter(r=>['player','śledczy'].includes(r?.role)).slice(-8).map(r=>fold(r.text));
 const challenging=pressure.filter(x=>/klam|przyznaj|oszuk|sciemni|zabil|zamord/.test(x)).length;
 const precise=pressure.filter(x=>/skad|zrod|potwierdz|dokladnie|dokument|co widzial/.test(x)).length;
 const style=profiles[id]||profiles.MAREK;
 return {
  authority:'reported-conversation-and-style-not-case-facts',
  followUpMode:/^(?:a )?(?:dlaczego|czemu|po co)(?: tak| to| wtedy)?$/.test(q)?'explain_previous_reply':
   /nie o to|nie pytam|pytam o|konkretnie|bez lania wody/.test(q)?'repair_previous_scope':'answer_current_question',
  previousTurn:last||null,
  awaitingClarification:entries.filter(e=>e.state==='clarification_requested'&&!e.supersededBy&&!e.followedByTurn).slice(-2),
  corrections:entries.filter(e=>e.state==='reported_scripted_correction').slice(-2),
  knownLimits:entries.filter(e=>e.state==='reported_knowledge_limit'&&!e.supersededBy).slice(-3),
  recentState:entries.slice(-4).map(({question,state,turn,supersededBy})=>({question,state,turn,...(supersededBy?{supersededBy}:{})})),
  psychology:{...style,stance:challenging>precise+1?'guarded':precise>challenging?'focused':'measured',evidenceResponse:presentedEvidence?'Odnieś się do faktycznie okazanego materiału, zachowując indywidualny sposób mówienia.':'Brak okazanego materiału nie jest dowodem zarzutu.'},
  policy:'Nie powtarzaj alibi na pytanie o przyczynę. Wyjaśnij poprzednią czynność lub nazwij konkretną granicę wiedzy. Granica wiedzy nie jest automatycznie pytaniem pozostawionym bez odpowiedzi. Dawne słowa ani emocje nie dodają faktów. Sprostowanie wymaga bieżących dozwolonych faktów; ton nie odblokowuje tajemnic.'
 };
}
