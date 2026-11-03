import fs from 'node:fs';
import path from 'node:path';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {buildInterrogationBrief} from '../lib/interrogation-brief-rc45.js';
import {PERSON_ROSTER} from '../lib/witness-relations-rc46.js';
const root=path.resolve(import.meta.dirname,'..');
const lines=[
 '# RC57.10.47 — 12 obszarów wiedzy i psychologii sześciu świadków',
 '',
 '## Ważne zasady',
 '',
 'Ta mapa jest **serwerowym indeksem dozwolonych źródeł i wskazówek stylistycznych**, a nie zbiorem nowych zdarzeń. Numery `fN` są lokalne dla konkretnego zapytania i świadka, nie są stałymi identyfikatorami kanonu. Niżej podajemy trwały identyfikator źródła (`stableId` / `source`).',
 'Przy braku autoryzowanego faktu nie wolno wymyślać rodziny, stażu, życiorysu, scen z przeszłości, prywatnych związków, uczuć ani podejrzeń. Nie oznacza to, że postacie ich nie mają; dane są po prostu nieustalone w kanonie.',
 'Wspomnienia rozmowy pochodzą z zatwierdzonego transkryptu tej samej postaci; nie są samodzielnymi dowodami. Nacisk, empatia i zmęczenie wpływają na *sposób mówienia*, nie na dostęp do sekretów.',
 '',
 '## Zakres funkcjonalny',
 '',
 '1. Życiorys: informacje zawodowe z kanonu; nieznane dzieciństwo/rodzina nie są uzupełniane.',
 '2. Codzienność: odrębne rozpoznanie obowiązków na jednej zmianie i typowych przyzwyczajeń.',
 '3. Osobiste wspomnienia: wyłącznie autoryzowane obserwacje i kontakty.',
 '4. Charakter: osobne, spójne idiolekty — wskazówka zachowania, nie fakt o czynie.',
 '5. Relacja z Leną: potwierdzone kontakty i granice prywatnej wiedzy.',
 '6. Relacje z pozostałymi świadkami: tylko własne źródła, bez domyślania się więzi dwóch innych osób.',
 '7. Przekonania: wypowiedzi subiektywne oznaczone jako opinie, nigdy jako dowody.',
 '8. Granice wiedzy: rozdział obserwacji, dokumentów, cudzych słów, wniosków.',
 '9. Emocjonalna pamięć: współczesne obawy nie są automatycznie uczuciami z nocy zdarzenia.',
 '10. Sposób wypowiedzi: osobne rytmy mówienia sześciu osób, krótko i bez gotowych formułek.',
 '11. Pamięć rozmowy: wyłącznie zatwierdzone wcześniejsze słowa przesłuchiwanego, z oznaczeniem cytatu.',
 '12. Reakcja na zachowanie gracza: nacisk/empatia/powtórzenie bez odblokowywania faktów.',
 ''
];
for(const witness of PERSON_ROSTER.filter(x=>x.id!=='LENA')){
 const scene=trustedScene({identity:{id:witness.id},question:'Opowiedz, co pamiętasz o pracy podczas zmiany i Lenie',knowledge:{documentsShown:[]}});
 const humanity=buildInterrogationBrief(scene).humanity;
 lines.push(`## ${witness.name}`,'',`**Styl:** ${humanity.style.rhythm}. **Reakcja:** ${humanity.style.reaction}.`,'',
  '| Obszar | Pokrycie autoryzowane | Źródła / luka |','|---|---|---|');
 for(const [key,area] of Object.entries(humanity.areas)){
  let refs=area.factIds.map(fid=>scene.knowledge.factBank.find(f=>f.id===fid)).filter(Boolean);
  if(key==='others'){
   const indexed=[];
   for(const target of PERSON_ROSTER.filter(p=>p.id!=='LENA'&&p.id!==witness.id)){
    const targeted=trustedScene({identity:{id:witness.id},question:`Co wiesz o ${target.name}?`,knowledge:{documentsShown:[]}});
    const planned=buildInterrogationBrief(targeted);
    const ids=planned.relationships.preferFactIds;
    for(const fid of ids){
     const f=targeted.knowledge.factBank.find(f=>f.id===fid);
     if(f&&planned.relationships.persons.some(p=>p.factIds.includes(fid)))indexed.push(f);
    }
   }
   refs=[...new Map(indexed.map(f=>[f.stableId||f.source,f])).values()];
  }
  const stable=[...new Set(refs.map(x=>x.stableId||x.source))].slice(0,3);
  const src=key==='emotion'?(stable.join(', ')||'brak')+(area.eventEmotionFactIds?.length?' · wspomnienie z czasu zdarzenia: potwierdzone':' · emocja w czasie zdarzenia: NIEPOTWIERDZONA'):
   stable.join(', ');
  const coverage=['character','voice','memory','reactions'].includes(key)?'Wskazówka stylu / kontekst rozmowy':
   key==='daily'?'Tylko dane o tej zmianie':refs.length?'Istnieją źródła':'Brak potwierdzonej historii';
  lines.push(`| ${area.label} | ${coverage} | ${src||'brak źródła — bez dopowiadania'} |`);
 }
 lines.push('','**Przykładowy bezpieczny przebieg:** Pytanie o pracę → autoryzowany opis obowiązków. Pytanie o prywatną rodzinę → granica wiedzy. Pytanie o cudzą relację → wyłącznie własne źródła. Pytanie o dawne emocje → tylko bezpośrednie wspomnienie z czasu zdarzenia.','','');
}
lines.push('## Co wymaga osobnej zgody scenariuszowej?','','Nowy staż pracy, wiek, rodzina, wydarzenia z młodości, konkretne prywatne nawyki, nieznane relacje lub konflikty, dialogi z przeszłości i nowe emocjonalne sceny. Dodanie takich informacji wymaga świadomej zmiany kanonu, przypisania punktu widzenia każdej postaci, stopnia wiarygodności oraz nowych testów bramek dowodowych.');
const outfile=path.join(root,'MAPA-12-OBSZAROW-RC57_10_47.md');fs.writeFileSync(outfile,lines.join('\n')+'\n');
console.log(`Wrote ${outfile}: ${lines.length} lines`);
