/** Author-only audit of currently public/approved knowledge. No remote calls. */
import {registry,selectRegistryKnowledge} from '../lib/witness-engine-rc22.js';
const id=String(process.argv[2]||'').toUpperCase();
const question=process.argv.slice(3).join(' ').trim();
if(!registry.profiles[id]||question.length<2){
 console.error('Użycie: node tools/audit-retrieval-rc48.mjs MAREK "Co wiesz o Wójciku?"');
 process.exitCode=2;
}else{
 const result=selectRegistryKnowledge(id,question);
 console.log(`Świadek: ${id}; pytanie: ${question}`);
 console.log(`Kontekst: ${result.retrieval.focus}, osoby: ${result.retrieval.personIds.join(',')||'—'}, okres: ${result.retrieval.queryPeriod}`);
 console.log(`Dozwolone: ${result.retrieval.considered}; wybrane: ${result.retrieval.selected}`);
 for(const [index,f] of result.facts.entries()){
  console.log(`${String(index+1).padStart(2)}. ${f.source.padEnd(25)} ${f.text.replace(/\s+/g,' ').slice(0,180)}`);
 }
 console.log('Uwaga: źródła pokazane tutaj nie są automatycznie dowodami ani zezwoleniem na ujawnienie innych informacji.');
}
