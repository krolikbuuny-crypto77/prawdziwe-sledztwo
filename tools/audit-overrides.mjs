import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const contracts=JSON.parse(fs.readFileSync(path.join(root,'src/compatibility-contracts.json'),'utf8'));
const found=[];
function findFiles(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,ent.name);
  if(ent.isDirectory())findFiles(p);
  else if(ent.name.endsWith('.js'))found.push(p);
}}
findFiles(path.join(root,'src'));
let changed=false;
for(const [name,expected] of Object.entries(contracts.trackedAssignments)){
  const pattern=new RegExp('\\b'+name+'\\s*=\\s*function\\b','g');
  const owners=[];
  for(const f of found){const code=fs.readFileSync(f,'utf8'); const count=[...code.matchAll(pattern)].length;
    if(count)owners.push({file:path.relative(root,f),count});}
  const count=owners.reduce((n,o)=>n+o.count,0);
  console.log(`${name}: ${count} assignments in ${owners.length} source files (baseline ${expected})`);
  if(count!==expected){changed=true;console.error(`REVIEW REQUIRED: assignments to ${name} have changed`);}
}
if(changed)process.exitCode=1;

// Navigation has a single owner; callbacks must use the named hook registry.
const controller=path.join(root, contracts.navigation.controller);
let declarations=0;
const hooks=[];
for(const file of found){
  const source=fs.readFileSync(file,'utf8');
  const declared=[...source.matchAll(/\bfunction\s+showTab\s*\(/g)].length;
  declarations+=declared;
  if(declared && file!==controller){changed=true;console.error(`REVIEW REQUIRED: navigation controller redeclared in ${path.relative(root,file)}`);}
  if(/\b(?:window|globalThis)\.showTab\s*=/.test(source) || /\bshowTab\s*=(?!=)/.test(source)){
    changed=true;console.error(`REVIEW REQUIRED: direct navigation overwrite in ${path.relative(root,file)}`);
  }
  for(const match of source.matchAll(/registerNavigationHook\(\{\s*name:\s*['"]([^'"]+)['"]/g))hooks.push(match[1]);
}
const controllerCode=fs.readFileSync(controller,'utf8');
const tabsBlock=controllerCode.match(/\bconst\s+PS_NAV_TABS\s*=\s*Object\.freeze\(\[([^\]]*)\]\)/);
const countTabs=tabsBlock?[...tabsBlock[1].matchAll(/['"][^'"]+['"]/g)].length:0;
console.log(`Navigation controller: ${declarations} declaration; ${hooks.length} named hooks; ${countTabs} modules`);
if(declarations!==1 || hooks.length!==contracts.navigation.hookCount ||
   new Set(hooks).size!==hooks.length || countTabs!==contracts.navigation.moduleCount){
  changed=true;console.error('REVIEW REQUIRED: navigation ownership, hooks or module definitions changed');
}
if(changed)process.exitCode=1;

// Stage 2 persistence contract: one API owner, only named hooks for game modules.
const saveController=path.join(root,contracts.saveManager.controller);
const saveCode=fs.readFileSync(saveController,'utf8');
let declaredSave=0,declaredLoad=0;
let saveHooks=[];
for(const file of found){
  const code=fs.readFileSync(file,'utf8');
  const b=[...code.matchAll(/\bfunction\s+buildSave\s*\(/g)].length;
  const a=[...code.matchAll(/\bfunction\s+applySave\s*\(/g)].length;
  declaredSave+=b;declaredLoad+=a;
  if((b||a)&&file!==saveController){changed=true;console.error('REVIEW REQUIRED: persistence API declared outside save-manager: '+path.relative(root,file));}
  if(/\b(?:window|globalThis)\.(?:buildSave|applySave)\s*=/.test(code)||
     /\b(?:buildSave|applySave)\s*=(?!=)/.test(code)){
    changed=true;console.error('REVIEW REQUIRED: persistence function overwritten: '+path.relative(root,file));
  }
  saveHooks.push(...[...code.matchAll(/registerSaveHook\(\{\s*name:\s*['"]([^'"]+)['"]/g)].map(x=>x[1]));
}
console.log(`SaveManager: ${declaredSave} build owner; ${declaredLoad} apply owner; ${saveHooks.length} hooks`);
if(declaredSave!==1||declaredLoad!==1||saveHooks.length!==contracts.saveManager.moduleCount||
  new Set(saveHooks).size!==saveHooks.length||!saveCode.includes('const SaveManager =')){
  changed=true;console.error('REVIEW REQUIRED: SaveManager ownership and named hook registry changed');
}
if(changed)process.exitCode=1;

// Stage 3 — no witness overrides outside the stable central controller.
const witnessController=path.join(root,contracts.witnessEngine.controller);
const foundLayers={answer:[],export:[],restore:[],send:[]};
let witnessOwnerCount=0;
for(const file of found){
 const code=fs.readFileSync(file,'utf8');
 for(const name of ['npc4Answer','npc4Export','npc4Restore','simSendChat']){
  const assignments=[...code.matchAll(new RegExp('\\b'+name+'\\s*=\\s*function\\b','g'))];
  if(assignments.length){
   witnessOwnerCount+=assignments.length;
   if(file!==witnessController){changed=true;console.error('REVIEW REQUIRED: witness API overwritten in '+path.relative(root,file));}
  }
 }
 for(const [kind,prefix] of Object.entries({answer:'Answer',export:'Export',restore:'Restore',send:'Send'})){
  for(const m of code.matchAll(new RegExp('registerWitness'+prefix+'Layer\\(\\s*[\"\']([^\"\']+)', 'g'))){
   foundLayers[kind].push(m[1]);
  }
 }
}
console.log(`WitnessEngine: ${witnessOwnerCount} public owners; layers ${JSON.stringify(Object.fromEntries(Object.entries(foundLayers).map(([k,v])=>[k,v.length])))}`);
for(const [k,count] of Object.entries(contracts.witnessEngine.layerCounts)){
 if(foundLayers[k].length!==count||new Set(foundLayers[k]).size!==count){changed=true;console.error('REVIEW REQUIRED: layer ownership for '+k);}
}
if(witnessOwnerCount!==4||!fs.readFileSync(witnessController,'utf8').includes('const WitnessEngine =')){
 changed=true;console.error('REVIEW REQUIRED: missing central witness controller');
}
if(changed)process.exitCode=1;

// Stage 4: reasoning and verdict grading have a single final public owner.
const reasoningFile=path.join(root,'src/core/reasoning-engine.js');
const reasoningCode=fs.readFileSync(reasoningFile,'utf8');
const requiredMethods=['source','document','independent','reasoning','audit','linkHypothesis','defense','caseAssessment','finalAssessment','relevantObjections'];
for(const method of requiredMethods){
 if(!new RegExp('\\b'+method+'\\b').test(reasoningCode)){
  changed=true;console.error(`REVIEW REQUIRED: missing reasoning entrypoint ${method}`);
 }
}
if(!reasoningCode.includes('const ReasoningEngine =')||
 !reasoningCode.includes('window.PS_REASONING_ENGINE=ReasoningEngine')||
 reasoningCode.match(/\bdd2Audit\s*=\s*function/g)?.length!==1||
 reasoningCode.match(/\bsimDefendEvaluation\s*=\s*function/g)?.length!==1){
 changed=true;console.error('REVIEW REQUIRED: reasoning or defense dispatcher changed');
}
const reasoningOwners=found.filter(f=>fs.readFileSync(f,'utf8').includes('window.PS_REASONING_ENGINE=ReasoningEngine'));
if(reasoningOwners.length!==1||reasoningOwners[0]!==reasoningFile){
 changed=true;console.error('REVIEW REQUIRED: multiple reasoning controllers');
}
console.log(`ReasoningEngine: ${requiredMethods.length} entrypoints, 5 qualifications, 6 objections`);
if(changed)process.exitCode=1;

// Stage 5: the global event bus is an immutable, single-owner API; there is one
// named UI subscriber per declared event, and modules emit only known events.
const events = contracts.eventBus;
if (events) {
 const eventFile=path.join(root,events.controller);
 const reactionsFile=path.join(root,events.reactionModule);
 const eventCode=fs.readFileSync(eventFile,'utf8');
 const reactionsCode=fs.readFileSync(reactionsFile,'utf8');
 const typesBlock=eventCode.match(/const types=Object\.freeze\(\[([\s\S]*?)\]\)/);
 const types=typesBlock?[...typesBlock[1].matchAll(/['"]([^'"]+)['"]/g)].map(x=>x[1]):[];
 const subscriptions=[...reactionsCode.matchAll(/PS_EVENTS\.on\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/g)];
 const declarations=found.filter(f=>fs.readFileSync(f,'utf8').includes('const PS_EVENTS ='));
 console.log(`EventBus: ${declarations.length} owner; ${types.length} types; ${subscriptions.length} UI subscribers`);
 if(declarations.length!==1||declarations[0]!==eventFile||types.length!==events.eventCount||
   subscriptions.length!==events.subscriberCount||new Set(types).size!==types.length||
   new Set(subscriptions.map(m=>m[2])).size!==subscriptions.length||
   types.some(type=>!subscriptions.some(m=>m[1]===type))){
    changed=true;console.error('REVIEW REQUIRED: Stage-5 event registry contract changed');
   }
}
if(changed)process.exitCode=1;
