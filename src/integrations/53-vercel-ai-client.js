/* Pakiet 6.16: Groq GPT-OSS opiniuje TYLKO tablicę dedukcyjną.
 * Gemini 3.8 Flash prowadzi przesłuchania i zwraca emocje do portretów.
 * Lokalny ReasoningEngine zachowuje wyłączną władzę nad wynikiem gry.
 */
let psEvidenceAssessmentRequest=0;
window.psDualAssess=async function(draft,sourceMap){
 const requestId=++psEvidenceAssessmentRequest;
 if(!/^https?:$/.test(location.protocol))return;
 const host=document.getElementById('dd2Review');if(!host)return;
 document.getElementById('psDualAssessment')?.remove();
 const localAssessment=typeof dd2Audit==='function'?dd2Audit(draft):null;
 const localReadiness=typeof dd7Reasoning==='function'?dd7Reasoning(draft):null;
 const panel=document.createElement('section');
 panel.id='psDualAssessment';panel.setAttribute('role','status');panel.setAttribute('aria-live','polite');
 panel.style.cssText='margin-top:14px;padding:15px;background:#111d25;border:1px solid #506273;border-radius:9px;white-space:pre-wrap;line-height:1.6';
 panel.textContent='Analiza dostępnych źródeł przez AI…';host.after(panel);
 const links=(Array.isArray(draft?.links)?draft.links:[]).slice(0,8).map(link=>{
  const src=sourceMap.get(link.source);
  if(!src || !window.PS_REASONING_ENGINE?.source(link.source))return null;
  return {id:link.source,name:String(src.label||'').slice(0,160),body:String(src.body||'').slice(0,1300),
   role:link.role,note:String(link.note||'').slice(0,550)};
 }).filter(Boolean);
 if(!links.length){panel.textContent='Do dodatkowej analizy AI potrzebny jest co najmniej jeden zdobyty dokument lub zapis zeznania połączony z hipotezą.';return;}
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),16000);
 // AI nie zmienia punktów przyznanych przez lokalny audyt. Pokazujemy
 // dwie niezależne osie: jakość uzasadnienia i interpretację posiadanych akt.
 const localSummary=localAssessment?
  `LOKALNY AUDYT WARSZTATU: ${localAssessment.score}/100 (${localAssessment.status}). ${localReadiness?.ok?'Warunki formalne zostały spełnione.':'Sprawdź wskazane braki formalne.'} To nie jest ocena prawdziwości tezy.`:
  'Lokalna ocena warsztatu pozostaje niezależna od analizy AI.';

 const text=(x,n=600)=>typeof x==='string'?x.trim().slice(0,n):'';
 const labels=new Map(links.map(l=>[l.id,l.name]));
 const claims=(xs)=>Array.isArray(xs)?xs.slice(0,2).filter(x=>x&&typeof x.text==='string'&&Array.isArray(x.sourceIds))
  .map(x=>({text:text(x.text,330),ids:x.sourceIds.filter(id=>labels.has(id)).slice(0,3)})).filter(x=>x.text&&x.ids.length):[];
 try{
  const body=JSON.stringify({kind:draft.kind,statement:draft.statement,alternative:draft.alternative,test:draft.test,links});
  const pendingDocs=links.filter(link=>link.id.startsWith('doc:')).map(link=>link.id.slice(4));
  if(pendingDocs.length&&window.PS617_SYNC?.ensureEvidence){
   for(const id of pendingDocs){
    if(!(await window.PS617_SYNC.ensureEvidence(id,2200))){
     panel.textContent=localSummary+'\n\nAnaliza AI jeszcze niedostępna: jeden z materiałów oczekuje na zatwierdzenie przez serwer.';return;
    }
   }
  }
  let response=await fetch('/api/evidence-review',{method:'POST',headers:{'Content-Type':'application/json','X-PS-Client':'game'},credentials:'same-origin',body,signal:controller.signal});
  if(response.status===403){panel.textContent=localSummary+'\n\nNie wszystkie wybrane źródła zostały zatwierdzone przez serwer. Poczekaj na synchronizację zapisu lub wybierz zatwierdzone materiały.';return;}
  if(response.status===429){panel.textContent='Osiągnięto limit analiz AI. Wróć za kilka minut; lokalna analiza nadal działa.';return;}
  if(!response.ok)throw Error('Groq temporarily unavailable');
  const data=await response.json();
  if(!panel.isConnected||requestId!==psEvidenceAssessmentRequest)return;
  const a=data?.assessment;if(data.ok!==true||!a||typeof a!=='object')throw Error('No AI assessment');
  if(a.advisory===true){
   const rows=[localSummary,'ANALIZA AI ŹRÓDEŁ — wskazówki pomocnicze. Potwierdzenie przesłanki w dokumencie nie oznacza wysokiej jakości uzasadnienia ani zaliczenia formalnych warunków gry.'];
   if(text(a.summary))rows.push(text(a.summary,420));
   const confirmed=claims(a.confirmed),uncertain=claims(a.uncertain);
   if(confirmed.length)rows.push('CO WYNIKA ZE ŹRÓDEŁ',...confirmed.map(x=>'• '+x.text+'\n  Źródło: '+x.ids.map(id=>labels.get(id)).join('; ')));
   if(uncertain.length)rows.push('CZEGO JESZCZE NIE WIEMY',...uncertain.map(x=>'• '+x.text+'\n  Zobacz: '+x.ids.map(id=>labels.get(id)).join('; ')));
   if(text(a.nextStep))rows.push('MOŻESZ SPRAWDZIĆ (opcjonalnie)',text(a.nextStep,300));
   if(!confirmed.length&&!uncertain.length)rows.push('Nie znaleziono jednoznacznych ustaleń, które można bezpiecznie przypisać połączonym źródłom.');
   panel.textContent=rows.join('\n\n');
  } else {
   // Legacy /api/evaluate contract. Keep it readable and non-binding.
   const entries=x=>Array.isArray(x)?x.slice(0,4).map(v=>text(v,300)).filter(Boolean):[];
   const score=typeof a.score==='number'&&Number.isFinite(a.score)?Math.round(Math.max(0,Math.min(100,a.score))):null;
   panel.textContent=[localSummary,'OPINIA AI — pomocnicza (nie zmienia wyniku gry)',score===null?'':'Wynik orientacyjny: '+score+'/100',
    text(a.summary,420),...entries(a.strengths).map(x=>'Co przemawia za tezą: '+x),
    ...entries(a.issues).map(x=>'Co wymaga sprawdzenia: '+x),
    text(a.nextStep,300)?'Możesz sprawdzić: '+text(a.nextStep,300):''].filter(Boolean).join('\n');
  }
 }catch{
  if(panel.isConnected&&requestId===psEvidenceAssessmentRequest)
   panel.textContent=localSummary+'\n\nAnaliza AI jest teraz niedostępna. Lokalna ocena materiałów działa nadal, bez utraty postępu.';
 }finally{clearTimeout(timeout)}
};
