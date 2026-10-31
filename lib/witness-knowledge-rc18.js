/** Server-owned authored extension. General principles never establish case events. */
import knowledge from './witness-knowledge-rc18.json' with {type:'json'};
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').toLocaleLowerCase('pl');
const topics={
 role:/obowiazk|funkcj|stanowisk.*peln|czym.*zajm|odpowiad.*pracy|nadzor|zmian/,
 alibi:/alibi|gdzie|byles|byl pan|cala noc|przez cal|wychod|pobyt|obecn/,
 witness:/kto.*(?:potwierdz|widzial)|swiad|poswiad|obserwow|odleglosc|oswietlen/,
 relationship:/lena|leny|lene|ofiara|ofiare|zmarla|relac|znales|znal pan|znajom/,
 report:/zglasz|zglosz|zastrzez|uwag|adresat|odbiorc|wyslan|nadani|projekt/,
 phone:/telefon|polaczen|biling|wiadomosc|rozmow|radio|lacznosc|komunik/,
 records:/dokument|rejestr|wpis|log|zapis|monitor|nagran|kamer|podpis|wersj/,
 authorization:/autoryzac|zgod|odbior|zatwierdz|podpis|zlec|uprawn/,
 workshop:/wagon|tw.217|uster|awari|napraw|diagnost|tcms|hamul|czujnik|czesc|podzespol|test/,
 safety:/bhp|bezpieczen|oslon|slad|smar|wlo|probk|ratown|obrazen|zabezpiecz/,
 finance:/finans|dostawc|premi|faktur|umow|oszczed|termin|koszt|platn|pieniadz/,
 identity:/kart|t.?17|identyfik|konto|konta|czytnik|drzwi|haslo/,
 alarm:/alarm|znale|odnale|chronolog|godzin|czas|minut|wczesniej|pozniej/,
 memory:/pamie|skad|zrod|pewn|widziales|widzial pan|wlasn.*obserw|cytat/,
 responsibility:/odpowiedzial|win|zabil|zaboj|przyzn|motyw|ukry|zataj|sprzeczn|sklam|sprost/,
 emotion:/nerw|emocj|milcz|odmaw|zlos|stres|przerw|spokoj|obaw|niepokoj/,
 pressure:/presj|nacisk|rozkaz|polecen|zmus|groz/
};
const words=s=>new Set(fold(s).match(/[a-z0-9]{4,}/g)||[]);
export function selectWitnessKnowledge(id,question,approvedHistory=[]){
 const own=knowledge.profiles[id];if(!own)return [];
 // Only question text is used for relevance. History changes retrieval, never authority.
 const current=fold(question);
 const prior=(Array.isArray(approvedHistory)?approvedHistory:[]).filter(r=>r?.role==='player'||r?.role==='śledczy').slice(-2).map(r=>r.text).join(' ');
 const context=current.length<65?current+' '+fold(prior):current;
 const w=words(context);
 const score=row=>(topics[row.topic]?.test(current)?12:topics[row.topic]?.test(context)?5:0)+[...words(row.text)].filter(x=>w.has(x)).length;
 const ranked=rows=>rows.map((r,i)=>({...r,score:score(r),order:i})).filter(r=>r.score>=4).sort((a,b)=>b.score-a.score||a.order-b.order);
 // Bound extra prompt cost. Original authored voice and gated documents are untouched.
 return [...ranked(own).slice(0,6),...ranked(knowledge.shared).slice(0,2)].map(({score,order,...r})=>r);
}
export const authoredKnowledge=knowledge;
