import fs from 'node:fs';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {relationFacts,PERSON_ROSTER} from '../lib/witness-relations-rc46.js';
const speakers=PERSON_ROSTER.filter(p=>p.id!=='LENA');
const lines=[
 '# Mapa wiedzy o innych osobach — RC57.10.46','',
 'To jest **indeks wyszukiwania zdań już autoryzowanych**, a nie lista potwierdzonych relacji prywatnych. Wymienienie nazwiska w źródle nie oznacza samo w sobie znajomości, konfliktu ani zaufania. Dane pochodzą wyłącznie z serwerowego rejestru danego świadka; żadnych nowych faktów nie dopisano.','',
 '## Zasady','',
 'Każdy może być pytany o pozostałych pięciu świadków oraz Lenę, łącznie z ich zawodową znajomością, opiniami, relacjami i cytowanymi słowami. Odpowiedź musi wynikać z własnych, dozwolonych faktów osoby przesłuchiwanej. Nie wolno używać prywatnych zeznań innych świadków jako jej pamięci. Zaimek jest rozstrzygany tylko z zatwierdzonych pytań skierowanych do tego samego świadka; gdy jest wiele możliwych osób, wymagane jest doprecyzowanie.','',
 '## Sześć perspektyw (przykładowe dozwolone źródła)',''
];
for(const speaker of speakers){
 lines.push(`### ${speaker.name}`,'', '| Osoba, o którą pyta śledczy | Własne dozwolone źródła |','|---|---|');
 for(const person of PERSON_ROSTER.filter(p=>p.id!==speaker.id)){
  const q=`Co wiesz o ${person.name}?`;
  const scene=trustedScene({identity:{id:speaker.id},question:q,knowledge:{documentsShown:[]}});
  const r=relationFacts(speaker.id,q,scene.knowledge.factBank);
  const ids=r.persons.find(x=>x.id===person.id)?.factIds||[];
  const notes=ids.slice(0,2).map(id=>{const f=scene.knowledge.factBank.find(x=>x.id===id);return `\`${f.source}\` (${String(f.text).slice(0,95).replaceAll('|','/')}...)`;});
  lines.push(`| ${person.name} | ${notes.length?notes.join('; '):'Brak bezpośredniej wypowiedzi o tej osobie w dostępnych faktach — nie dopowiadaj relacji.'} |`);
 }
 lines.push('');
}
lines.push('## Granice relacji dwuosobowych','',
 'Pytanie „Jakie relacje łączyły Kamila i Lenę?” zadane trzeciemu świadkowi **nie uprawnia** do połączenia dwóch osobnych faktów (o Kamilu i o Lenie) w nowy fakt o ich wzajemnej relacji. Wymagany jest bezpośredni dozwolony opis ich kontaktu, w jednej wypowiedzi konkretnego świadka.','',
 'Pytanie „Czy Lena ufała Markowi?” bez dozwolonego świadectwa o zaufaniu wymaga wyraźnego zastrzeżenia braku podstaw, nawet jeśli znana jest współpraca zawodowa.','',
 'Zarzuty „Wójcik twierdzi, że…” są wypowiedziami gracza. Zatwierdzona historia przesłuchania danej postaci nie potwierdza treści innego przesłuchania.','',
 'Odpowiedzi lokalne zachowują dosłowny autoryzowany fragment lub odpowiadają o braku podstaw. Chmurowe AI dostaje jedynie ID pasujących do już autoryzowanego banku faktów i instrukcje rozróżniania źródeł.','');
fs.writeFileSync(new URL('../MAPA-RELACJI-RC57_10_46.md',import.meta.url),lines.join('\n'));
console.log('Map generated: 6 witness viewpoints, 36 person links checked against approved bank.');
