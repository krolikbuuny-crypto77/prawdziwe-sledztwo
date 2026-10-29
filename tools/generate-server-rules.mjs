// Uruchomić po zmianie scenariusza, aby serwer walidował te same przesłanki co klient.
import fs from 'node:fs';
import vm from 'node:vm';
const text=fs.readFileSync('src/core/case-engine.js','utf8');
const content=JSON.parse(fs.readFileSync('src/data/case-content.js','utf8').trim().replace(/^const CONTENT=/,'').replace(/;$/,''));
function extract(name,ending){const at=text.indexOf('const '+name+'=');if(at<0)throw Error(name);const start=at+('const '+name+'=').length;const stop=text.indexOf(ending,start);if(stop<0)throw Error(name+' terminator');return vm.runInNewContext('('+text.slice(start,stop+ending.length-1)+')',Object.create(null),{timeout:1000});}
const spots=extract('SC_SPOTS','];').filter(s=>s.doc).map(({id,room,doc})=>({id,room,doc}));
const challenges=extract('SC_CHALLENGES','};');
const gates=extract('SC_GATES','};');
const searchable=content.documents.filter(d=>['oględziny','przed-mg'].includes(d.acquisition)&&!spots.some(x=>x.doc===d.id)).map(d=>d.id);
const rules={version:1,initial:content.initialIds,scriptedCorrections:Object.fromEntries(content.characters.map(c=>[c.id,{text:c.voice.evidence_strong||'',gates:content.gates.filter(g=>g.character===c.name).map(g=>g.needs)}])),documents:Object.fromEntries(content.documents.map(d=>[d.id,{acquisition:d.acquisition,area:d.area,family:d.family}])),spots:Object.fromEntries(spots.map(s=>[s.id,s])),searchable,gates,challenges:Object.fromEntries(Object.entries(challenges).map(([id,c])=>[id,{method:c.method,correct:c.correct}]))};
fs.writeFileSync('lib/approved-rules.json',JSON.stringify(rules,null,2)+'\n');
fs.writeFileSync('lib/approved-rules.js','// Wygenerowany plik: wyłącznie kod walidatora serwerowego.\nexport default '+JSON.stringify(rules)+';\n');
console.log('Reguły serwera:',content.documents.length,'akt,',spots.length,'punktów oględzin,',searchable.length,'akt wyszukiwalnych');
