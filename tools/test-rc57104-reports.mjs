import assert from 'node:assert/strict';
import {auditBlindClaims,auditLiveDialogue} from '../lib/admin-rc57-claim-audit.js';
import {blindEvidencePacket} from '../lib/admin-rc57-blind.js';
import {runLiveStep} from '../lib/admin-rc57-live.js';
import {attemptInterview} from '../api/interview.js';
import {trustedScene} from '../lib/trusted-interview-624.js';
import {buildQuestionContext} from '../lib/question-context-630.js';
import {readdirSync} from 'node:fs';
process.env.RC57_ADMIN_SECRET='TEST_SECRET_NOT_PRODUCTION_LONG_SECRET_123456';
process.env.RC57_LIVE_TEST_ENABLED='true';
process.env.APINEX_API_KEY='MOCK_ONLY_NOT_REAL';
const docs=new Set(blindEvidencePacket('complete').documents.map(x=>x.id));
const make=(reasoning,counterargument='')=>auditBlindClaims({evidenceIds:['LAB-03','LAB-07','TEC-15'],reasoning,counterargument,missingProof:''},{availableIds:docs,allDocumentIds:docs});
const safe=[
 'Włókna W-7 z odzieży Leny są klasowo zgodne z pokrowcem sprzętu audytowego (LAB-03, LAB-07), co łączy miejsce zdarzenia z działem audytu, choć nie wskazuje konkretnej osoby.',
 'Włókna W-7 są jedynie klasowo zgodne z wyposażeniem audytu, a nie indywidualnie identyfikujące Magdalenę.',
 'LAB-07 nie identyfikuje jednoznacznie Magdaleny.',
 'LAB-07 nie jest indywidualną identyfikacją osoby.'
];
for(const reasoning of safe)assert(!make(reasoning).findings.some(x=>x.code==='class_fibers_as_individual_proof'),reasoning);
for(const bad of [
 'LAB-07 pozwala jednoznacznie zidentyfikować Magdalenę jako osobę, od której pochodzą włókna.',
 'LAB-07 daje indywidualną identyfikację Magdaleny.'
])assert(make(bad).findings.some(x=>x.code==='class_fibers_as_individual_proof'),bad);
const history=[
 {role:'player',text:'Jaką rolę pełniłeś podczas tej zmiany?'},
 {role:'witness',text:'Byłem kierownikiem zajezdni i nadzorowałem nocną zmianę, będąc dostępny z biura. Nadzorowałem zadania do alarmu o 02:02.'},
 {role:'player',text:'Co możesz potwierdzić na podstawie własnej pamięci?'},
 {role:'witness',text:'Na początku zmiany byłem w biurze kierownika.'}
];
const question='Czy pamiętasz, co powiedziałeś na początku tej rozmowy?';
const invented='Pamiętam, że na początku rozmowy ustaliłem, co wynika z zapisów, a co tylko ktoś pamięta. Na początku zmiany byłem w biurze kierownika.';
assert(auditLiveDialogue({question,answer:invented,history,witnessId:'MAREK'}).findings.some(f=>f.code==='opening_memory_attribution'));
const accurate='Na początku powiedziałem, że byłem kierownikiem zajezdni, nadzorowałem zmianę i byłem dostępny z biura.';
assert(!auditLiveDialogue({question,answer:accurate,history,witnessId:'MAREK'}).findings.some(f=>f.code==='opening_memory_attribution'));
const scene=trustedScene({identity:{id:'MAREK'},question,primaryMode:true,knowledge:{documentsShown:[]}},null,buildQuestionContext(question,history));
scene.approvedThreadHistory=history;scene._responseDeadline=Date.now()+100000;scene._providerDeadline=Date.now()+80000;
let observedAnchor=null;
const result=await attemptInterview(scene,'apinex-luna',async(system,payload,limit,temp,provider,phase)=>{
 if(phase==='generate'){observedAnchor=payload.conversationOpeningAnchor;return {decision:'answer',factIds:['f0'],text:scene.knowledge.factBank[0].text};}
 return {relevant:true,entailed:true,complete:true,semanticRepeat:false,coveredParts:[],reason:'ok'};
});
assert.equal(observedAnchor?.text,history[1].text,'First answer must survive payload compaction even in later turns');
const req={headers:{host:'game.example','x-forwarded-proto':'https',origin:'https://game.example',cookie:'__Host-ps57=test-only'},method:'POST'};
const params={mode:'live-long',provider:'apinex-luna',offset:0,confirmed:true};
const providerFailure=await runLiveStep(params,req,async()=>{throw Error('connection problem');});
assert.equal(providerFailure.results[0].status,'blocked');assert.equal(providerFailure.stopped,'provider_error');assert.equal(providerFailure.retryOffset,0);assert.equal(providerFailure.nextToken,null);assert.equal(providerFailure.retryable,true);
const qualityFailure=await runLiveStep(params,req,async()=>null);
assert.equal(qualityFailure.results[0].status,'blocked');assert.equal(qualityFailure.stopped,'answer_quality_rejected');assert.equal(qualityFailure.retryOffset,0);assert.equal(qualityFailure.nextToken,null);assert.equal(qualityFailure.retryable,true);
const recovered=await runLiveStep(params,req,async()=>({ok:true,decision:'answer',semanticVerified:true,factIds:['f0'],text:'Byłem kierownikiem zajezdni i odpowiadałem za organizację nocnej zmiany.'}));
assert.equal(recovered.results[0].status,'pass');assert(recovered.nextToken,'Successful retry may advance only after verified reply');
const laterFailure=await runLiveStep({mode:'live-long',provider:'apinex-luna',offset:1,token:recovered.nextToken},req,async()=>{throw Error('upstream-502');});
assert.equal(laterFailure.results[0].status,'blocked');assert.equal(laterFailure.nextToken,recovered.nextToken,'Signed history must be bit-for-bit identical after transport failure');
assert.equal(laterFailure.results[0].detail,'provider_upstream_unavailable');
assert.equal(readdirSync(new URL('../api/',import.meta.url)).filter(x=>x.endsWith('.js')).length,12);
console.log('RC57.10.4 PASS: exact false positive fixed; real overclaims flagged; faithful vs invented opening memory; memory anchor reaches API; safe manual retry for provider and quality failures; 12 functions');
