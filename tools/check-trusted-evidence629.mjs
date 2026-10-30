import fs from 'node:fs';
import assert from 'node:assert/strict';
import registry from '../lib/trusted-evidence-629.js';
const text=fs.readFileSync(new URL('../src/data/case-content.js',import.meta.url),'utf8').trim();
const data=JSON.parse(text.slice('const CONTENT='.length).replace(/;$/,''));
assert.deepEqual(registry.documents,Object.fromEntries(data.documents.map(d=>[d.id,{title:d.title,body:d.body}])));
assert.deepEqual(registry.witnesses,Object.fromEntries(data.characters.map(c=>[c.id,{name:c.name,opening:c.voice.opening}])));
console.log('PASS 6.29 trusted evidence registry matches playable game data exactly');
