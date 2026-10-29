/* Etap 2 — jedyny właściciel persystencji. Zachowuje format bazowy PS_V7 i wersję 11.
 * Rejestruje rozszerzenia stanu, bez podmieniania buildSave/applySave.
 * Schema v2 dodaje sumę SHA-256; starsze pliki bez metadanych pozostają obsługiwane.
 */
const SaveManager = (() => {
 'use strict';
 const SCHEMA = 2;
 const hooks=[];
 const names=new Set();
 const HASH_ALGO='SHA-256';
 const K=[
 0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
 0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
 0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
 0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
 0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
 0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
 0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
 0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
 ];
 const rotr=(n,x)=>(x>>>n)|(x<<(32-n));
 // Synchronous SHA-256 is used so autosave and the existing synchronous save API stay compatible.
 function digest(string){
  const raw=new TextEncoder().encode(string), n=raw.length;
  const padded=new Uint8Array(Math.ceil((n+9)/64)*64);padded.set(raw);padded[n]=0x80;
  const view=new DataView(padded.buffer);
  const hi=Math.floor(n/0x20000000),lo=(n*8)>>>0;
  view.setUint32(padded.length-8,hi);view.setUint32(padded.length-4,lo);
  const h=new Uint32Array([0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19]);
  const w=new Uint32Array(64);
  for(let off=0;off<padded.length;off+=64){
   for(let i=0;i<16;i++)w[i]=view.getUint32(off+4*i);
   for(let i=16;i<64;i++){
    const a=w[i-15],b=w[i-2];
    w[i]=(w[i-16]+(rotr(7,a)^rotr(18,a)^(a>>>3))+w[i-7]+(rotr(17,b)^rotr(19,b)^(b>>>10)))>>>0;
   }
   let [a,b,c,d,e,f,g,j]=h;
   for(let i=0;i<64;i++){
    const s1=rotr(6,e)^rotr(11,e)^rotr(25,e);
    const t1=(j+s1+((e&f)^(~e&g))+K[i]+w[i])>>>0;
    const s0=rotr(2,a)^rotr(13,a)^rotr(22,a);
    const t2=(s0+((a&b)^(a&c)^(b&c)))>>>0;
    j=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
   }
   for(let i=0;i<8;i++)h[i]=(h[i]+[a,b,c,d,e,f,g,j][i])>>>0;
  }
  return [...h].map(x=>x.toString(16).padStart(8,'0')).join('');
 }
 function register(hook){
  if(!hook||typeof hook.name!=='string'||!hook.name.trim()||names.has(hook.name))throw Error('Powtarzający się moduł zapisu.');
  for(const key of ['beforeBuild','build','beforeApply','apply','onApplyError']){
   if(key in hook&&typeof hook[key]!=='function')throw Error('Nieprawidłowy hook: '+key);
  }
  names.add(hook.name);hooks.push(Object.freeze({...hook}));
  return () => {const i=hooks.findIndex(h=>h.name===hook.name);if(i>=0){hooks.splice(i,1);names.delete(hook.name);}};
 }
 const plain=value=>value&&typeof value==='object'&&!Array.isArray(value);
 function verify(input){
  if(!plain(input))throw Error('Plik nie zawiera poprawnego obiektu zapisu.');
  const meta=input.saveMeta;
  if(meta===undefined)return {schemaVersion:1,legacy:true};
  if(!plain(meta)||meta.schemaVersion!==SCHEMA||meta.algorithm!==HASH_ALGO||
     !Number.isSafeInteger(meta.createdAt)||meta.createdAt<0||
     typeof meta.checksum!=='string'||!/^[0-9a-f]{64}$/.test(meta.checksum))
    throw Error('Nieobsługiwana wersja lub nieprawidłowe metadane zapisu.');
  const withoutHash={...input,saveMeta:{schemaVersion:meta.schemaVersion,algorithm:meta.algorithm,createdAt:meta.createdAt}};
  if(digest(JSON.stringify(withoutHash))!==meta.checksum)
    throw Error('Suma kontrolna zapisu nie zgadza się. Plik mógł zostać uszkodzony.');
  return {schemaVersion:SCHEMA,legacy:false};
 }
 function migrate(input){
  const check=verify(input);
  // Keep legacy format/version untouched: applyCoreSave dispatches migration for V7 stages 3–14.
  if(typeof input.format!=='string'||!Array.isArray(input.found))throw Error('Nieobsługiwany plik zapisu.');
  const data=JSON.parse(JSON.stringify(input));
  if(check.legacy)delete data.saveMeta;
  return data;
 }
 function build(){
  for(let i=hooks.length-1;i>=0;i--)hooks[i].beforeBuild?.();
  const data=buildCoreSave();
  for(const hook of hooks)hook.build?.(data);
  // JSON clone prevents state object aliases and ensures the hash matches exported JSON.
  const clean=JSON.parse(JSON.stringify(data));
  delete clean.saveMeta;
  clean.saveMeta={schemaVersion:SCHEMA,algorithm:HASH_ALGO,createdAt:Date.now()};
  clean.saveMeta.checksum=digest(JSON.stringify(clean));
  return clean;
 }
 function apply(input){
  const data=migrate(input); // Validate before modifying any gameplay state.
  try{
   for(let i=hooks.length-1;i>=0;i--)hooks[i].beforeApply?.(data);
   const result=applyCoreSave(data);
   for(const hook of hooks)hook.apply?.(data);
   return result;
  }catch(error){
   for(let i=hooks.length-1;i>=0;i--){
    try{hooks[i].onApplyError?.(error);}catch(other){console.error('Błąd sprzątania po odczycie:',other);}
   }
   throw error;
  }
 }
 function writeAutosave(key,context={}){
  if(!key||typeof key!=='string')throw Error('Niepoprawny klucz autosave.');
  const save=build();
  localStorage.setItem(key,JSON.stringify({tab:context.tab||'',t:Date.now(),save}));
  return save.saveMeta.createdAt;
 }
 function readAutosave(key){
  const raw=localStorage.getItem(key);
  if(!raw)return null;
  const entry=JSON.parse(raw);
  if(!plain(entry)||!plain(entry.save))throw Error('Niekompletna sesja automatyczna.');
  verify(entry.save);
  return entry;
 }
 function clearAutosave(key){localStorage.removeItem(key);}
 return Object.freeze({schemaVersion:SCHEMA,register,build,apply,verify,migrate,writeAutosave,readAutosave,clearAutosave,
  inspect:()=>({schemaVersion:SCHEMA,hooks:hooks.map(h=>h.name)}),sha256:digest});
})();
function registerSaveHook(definition){return SaveManager.register(definition);}
function buildSave(){return SaveManager.build();}
function applySave(data){return SaveManager.apply(data);}
window.PS_SAVE_MANAGER=SaveManager;
