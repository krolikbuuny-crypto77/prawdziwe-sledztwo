import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {askGemini,models} from '../lib/ai-providers-rc7.js';
const src=readFileSync(new URL('../api/interview.js',import.meta.url),'utf8');
assert.match(src,/thinkingLevel:phase==='semantic-audit'\?'medium':'low'/);
assert.doesNotMatch(src,/thinkingLevel:'high'/);
const defense=readFileSync(new URL('../api/defense-objections.js',import.meta.url),'utf8');
assert.match(defense,/thinkingLevel:'high'/);
process.env.GEMINI_API_KEY='mock-only';
const seen=[];
const mock=async(url,options)=>{
  const body=JSON.parse(options.body);
  seen.push({url,body});
  return {ok:true,status:200,json:async()=>({candidates:[{content:{parts:[{text:'{"ok":true,"text":"Zgodnie z faktami."}'}]}}]})};
};
for(const level of ['high','medium']){
  const r=await askGemini({system:'Świadek lub audytor',payload:{question:'Kto to potwierdza?'},model:models().interview,thinkingLevel:level},mock);
  assert.equal(r.ok,true);
  assert.equal(seen.at(-1).body.generationConfig.thinkingConfig.thinkingLevel,level);
  assert.equal(seen.at(-1).body.generationConfig.responseMimeType,'application/json');
}
assert.equal(seen.length,2);
console.log('PASS RC9: przesłuchania thinking low, audyt medium; finał high bez zmian');
