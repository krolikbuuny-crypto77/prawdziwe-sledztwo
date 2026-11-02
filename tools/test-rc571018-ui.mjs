import fs from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const read=x=>fs.readFileSync(new URL(x,root),'utf8');
const template=read('src/index.template.html');
const ai=read('src/integrations/35-zai-client.js');
const style=read('src/styles/103-dossier-visual-rc571015.css');
const cases=read('src/data/case-content.js');
assert.match(template,/id="ps18Boot"/);
assert.match(template,/Otwieranie akt sprawy/);
assert.match(template,/class="cross3-inline ps18-guidance"/);
assert.match(template,/id="chatInput"/);
assert.match(ai,/Świadek przygotowuje odpowiedź/);
assert.match(ai,/Pytanie zostało zachowane/);
assert.match(ai,/Retry-After/);
assert.match(ai,/ps18-error/);
assert.doesNotMatch(ai,/'AI jest chwilowo niedostępne \(HTTP/);
assert.match(style,/ps18-low-motion/);
assert.match(style,/#interview \.chatfoot\{order:0/);
for(const name of ['Marek Nowicki','Tomasz Krawczyk','Janusz Wójcik','Elżbieta Zięba','Kamil Brzozowski','Magdalena Kaczmarek','Lena Rudnicka','TW-217'])
 assert.ok(cases.includes(name)||template.includes(name),name+' missing from canon');
for(const id of ['marek','tomasz','janusz','elzbieta','kamil','magdalena'])
 assert.ok(fs.existsSync(new URL('assets/portraits/'+id+'.webp',root)),id+' portrait missing');
assert.ok(!template.includes('Śmierć w nocnym autobusie'));
assert.ok(!template.includes('Anna Krawczyk'));
console.log('RC57.10.18 PASS: one question field, boot, friendly status, canonical names and six local photos');
