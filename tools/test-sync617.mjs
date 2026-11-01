import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const script=fs.readFileSync(new URL('../src/integrations/75-verified-state-sync.js',import.meta.url),'utf8');
const store=new Map();const posted=[];
const localStorage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v)};
function build(online){
 let pending=[];const listeners={};const eventListeners={};
 const anchor={appendChild(){}};
 const document={createElement(){return {style:{},setAttribute(){},textContent:''};},
 getElementById(id){return id==='saveBtn'?{parentElement:anchor}:id==='psResumeOffer'?{}:null;},body:anchor,
 addEventListener(name,fn){listeners[name]=fn;},visibilityState:'visible'};
 const window={addEventListener(name,fn){listeners[name]=fn;}};
 const nav={onLine:online};
 const fetch=async(url,opts)=>{
  if(!opts||!opts.method||opts.method==='GET')return {ok:true,status:200,json:async()=>({ok:true,revision:posted.length,state:{}})};
  const payload=JSON.parse(opts.body);
  if(payload.revision!==posted.length)return {ok:false,status:409};
  posted.push(...payload.actions);
  return {ok:true,status:200,json:async()=>({ok:true,revision:posted.length,decisions:payload.actions.map(x=>({id:x.id,ok:true})),state:{}})};
 };
 const context={document,window,navigator:nav,localStorage,location:{protocol:'https:'},fetch,
 Date,Math,JSON,console,setTimeout:(fn)=>{pending.push(fn);return pending.length;},clearTimeout:()=>{},
 STATE:{area:'tech',scene12:{}},PS_EVENTS:{on:(type,id,fn)=>eventListeners[id]=fn}};
 vm.runInNewContext(script,context,{timeout:1000});
 async function drain(){const scheduled=[...pending];pending=[];for(const fn of scheduled)await fn();await new Promise(resolve=>setImmediate(resolve));}
 return {window,context,nav,drain,emit:eventListeners['ps617-server-proposal']};
}
let first=build(false);
first.emit({id:'TEC-12',origin:'area-search'});
assert.equal(first.window.PS617_SYNC.pending,1);
assert.equal(posted.length,0);
let second=build(true);
assert.equal(second.window.PS617_SYNC.pending,1,'same offline queue loaded');
second.window.PS617_SYNC.resume();await second.drain();
assert.equal(second.window.PS617_SYNC.pending,0);
assert.equal(posted.length,1);
assert.equal(posted[0].action.docId,'TEC-12');
assert.equal(posted[0].action.origin,'area-search');
assert.equal(JSON.parse(store.get('ps617-pending-actions')).length,0);
console.log('PASS offline 6.17 VM: local action queued, persisted across runtime restart, replayed on recovery');
