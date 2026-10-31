/** Execute the real client send layer in a DOM stub, including its async timeout path. */
import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {randomUUID} from 'node:crypto';
const source=fs.readFileSync(new URL('../src/integrations/35-zai-client.js',import.meta.url),'utf8');
const core=fs.readFileSync(new URL('../src/core/case-engine.js',import.meta.url),'utf8');
const metadata=core.slice(core.indexOf('function psAiMeta('),core.indexOf('const psShowAiDiagnostic='));
async function run(mode){
 const c={id:'MAREK',name:'Marek'},input={value:'Masz alibi?',closest:()=>({appendChild(){}}),addEventListener(){},setAttribute(){}},button={disabled:false};
 const state={activeChar:'MAREK',tab:'interview',dialogues:{MAREK:[]},sim:{counter:0},events:[],found:new Set()};
 let send,calls=[],queued=[],resolveRemote;let clock=Date.now();const timers=[];
 const ctx={console,JSON,Math,Date:class extends Date{static now(){return clock;}},AbortController,Uint8Array,sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},
  setTimeout:(fn,ms)=>{timers.push(ms);return setTimeout(fn,ms===82000?15:ms<=8000?70:ms);},clearTimeout,
  navigator:{onLine:mode!=='offline'},location:{protocol:'https:'},STATE:state,CONTENT:{characters:[c]},
  NPC4_STATE:{MAREK:{}},NPC9_MEMORY:{MAREK:{}},NPC9_MEMORY_INITIAL:{},
  norm:s=>String(s).toLowerCase(),simSendChat(){},simWitness:()=>({blocked:false}),renderChat(){},simRenderInterrogation(){},psSchedule(){},
  PS65_CONTEXT:{read:()=>({schema:'test'}),discardUnanswered(){},finalize(){}},
  document:{getElementById:id=>id==='chatInput'?input:id==='chatSend'?button:null,querySelector:()=>null,
   createElement:()=>({style:{},setAttribute(){},append(){}})},
  window:{crypto:{randomUUID},PS617_SYNC:{enqueue:x=>queued.push(x)},PS68_MEMORY:{discardUnanswered(){},recordApproved(){},finalize(){}}},
  WitnessEngine:{snapshotSend:()=>()=>{state.dialogues.MAREK.push({role:'player',text:input.value},{role:'npc',text:'NIEBEZPIECZNY PROWIZORYCZNY TEKST'});state.sim.counter++;input.value='';}},
  registerWitnessSendLayer:(_,fn)=>{send=fn;}};
 ctx.fetch=async(url,opts={})=>{
  if(url==='/api/game-state')return {ok:true,status:200};
  const payload=JSON.parse(opts.body);calls.push(payload);
  if(mode==='late-timeout'&&!payload.localOnly){clock+=89000;throw Error('Delayed network failure');}
  if(mode==='network')throw new TypeError('Network down');
  if(mode==='conflict')return {ok:false,status:409,json:async()=>({error:'State conflict'})};
  if(['timeout','timeout-body'].includes(mode)&&!payload.localOnly)return new Promise((resolve,reject)=>opts.signal.addEventListener('abort',()=>reject(Object.assign(Error('Aborted'),{name:'AbortError'})),{once:true}));
  if(mode==='http-fallback'&&!payload.localOnly)return {ok:false,status:503,json:async()=>({retryAfterSeconds:32})};
  if(mode==='timeout-body'&&payload.localOnly)return {ok:true,status:200,json:()=>new Promise(()=>{})};
  const provider=mode==='cloud'?'apinex-luna':'local';
  const r={ok:true,status:200,json:async()=>({decision:'answer',serverCanonical:true,semanticVerified:provider!=='local',localVerified:provider==='local',provider,
   model:provider==='local'?'witness-registry-rc24':'free/gpt-6-luna',turnId:payload.turnId,text:'Nadzorowałem nocną zmianę i byłem dostępny z biura.'})};
  if(mode==='cloud')return new Promise(resolve=>{resolveRemote=()=>resolve(r);});
  return r;
 };
 vm.createContext(ctx);vm.runInContext(metadata+source,ctx);send();
 if(mode==='cloud'){
  for(let i=0;i<10&&!resolveRemote;i++)await new Promise(r=>setTimeout(r,1));
  assert.equal(state.sim.counter,0,'speculative gameplay must roll back while pending');assert.equal(state.dialogues.MAREK.length,0);resolveRemote();
 }
 for(let i=0;i<100&&ctx.window.PS77_AI.busy;i++)await new Promise(r=>setTimeout(r,3));
 assert.equal(ctx.window.PS77_AI.busy,false);assert.equal(button.disabled,false);
 if(mode==='conflict'){assert.equal(state.dialogues.MAREK.length,0);assert.equal(input.value,'Masz alibi?');assert.equal(calls.length,1);return;}
 assert.equal(state.dialogues.MAREK.length,2,mode);
 const row=state.dialogues.MAREK.at(-1);assert.notEqual(row.text,'NIEBEZPIECZNY PROWIZORYCZNY TEKST');
 assert.equal(row.ai.provider,mode==='cloud'?'apinex-luna':'local',mode);
 assert.equal(state.sim.counter,mode==='cloud'?1:0,'local fallback cannot commit legacy draft effects');
 if(['timeout','http-fallback'].includes(mode)){assert.equal(calls.length,2);assert.equal(calls[1].localOnly,true);assert.equal(calls[1].turnId,calls[0].turnId);}
 if(mode==='late-timeout')assert(timers.includes(1000),'local retry must use only remaining 1s, not a fresh 8s');
 if(mode==='timeout-body')assert.equal(queued.length,1,'stalled response body must time out and finish safely');
 if(mode==='offline'){assert.equal(calls.length,0);assert.equal(queued.length,1);}
 if(mode==='network')assert.equal(queued.length,1);
}
for(const mode of ['cloud','local','timeout','http-fallback','network','offline','conflict','timeout-body','late-timeout'])await run(mode);
console.log('PASS RC25 client: APINEX/local accepted; real timeout callback -> local-only same turnId; 503 -> local; offline/network clarification; 409 stays blocked; no speculative gameplay effects on local fallback.');
