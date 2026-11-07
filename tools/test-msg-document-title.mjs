import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {buildPage} from './build.mjs';
const source=readFileSync(new URL('../src/core/case-engine.js',import.meta.url),'utf8');
const content=readFileSync(new URL('../src/data/case-content.js',import.meta.url),'utf8');
const data=JSON.parse(content.trim().replace(/^const CONTENT\s*=\s*/,''));
const byId=Object.fromEntries(data.documents.map(d=>[d.id,d]));
const norm = s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/[^a-z0-9 ]+/g,' ').replace(/\s+/g,' ').trim();
const helper=source.match(/function msgMetadataSourceMatches\([\s\S]*?\n}\n/);
const validator=source.match(/function msgIsValid\([\s\S]*?\n}\n/);
assert(helper,'Brak funkcji normalizacji źródła w kodzie');
assert(validator,'Brak walidatora deszyfratora');
const ctx={byId,norm,MSG_INPUT:['DIG-03','DIG-04','DIG-05'],MSG_ANSWER:{ids:['A','B','C','D','E']},
 msgKeyBytes:()=>[1,2,3],msgDecode:()=>({valid:true}),MSG_BY_ID:{A:{},B:{},C:{},D:{},E:{}},mini5Correct:(lab,x)=>lab==='msg'&&x==='m5:integrity'};
vm.createContext(ctx);vm.runInContext(helper[0]+'\n'+validator[0],ctx);
const title=byId['DIG-05'].title;
const good = ['DIG-05','dig 05','  DIG-05  ',title,title.toUpperCase(),'Dane operatora o wiadomosci z godz 01:32','DIG-05 — '+title,title+' (DIG-05)'];
const bad = ['', 'DIG-04','DIG-050',byId['DIG-04'].title,byId['DIG-03'].title,'operator','Dane operatora o wiadomości','dokument metadanych','DIG-05-FAŁSZ',title+' inny tekst'];
const report=sourceName=>({chain:['A','B','C','D','E'],key:'000000',report:{slot:'4107',time:'01:32',account:'AUD-04',device:'TAB-AUD-02',source:sourceName,summary:'m5:integrity'}});
const found=new Set(ctx.MSG_INPUT);
for(const name of good){assert.equal(ctx.msgMetadataSourceMatches(name),true,'Should accept '+name);assert.equal(ctx.msgIsValid(report(name),found),true,'Full validation should accept '+name);}
for(const name of bad){assert.equal(ctx.msgMetadataSourceMatches(name),false,'Should reject '+name);assert.equal(ctx.msgIsValid(report(name),found),false,'Full validation should reject '+name);}
const wrong=report(title);wrong.report.device='FAKE';assert.equal(ctx.msgIsValid(wrong,found),false,'Device constraints preserved');
const noDocument=report(title);assert.equal(ctx.msgIsValid(noDocument,new Set(['DIG-03','DIG-04'])),false,'Input evidence requirements preserved');
const html=buildPage().html;
assert(html.includes('Niezależny dokument metadanych (kod lub pełny tytuł)'),'Build includes clarified label');
assert(html.includes('function msgMetadataSourceMatches'),'Build includes validation helper');
console.log(`PASS: ${good.length} accepted, ${bad.length} rejected, evidence/device checks and production build verified`);
