import assert from 'node:assert/strict';
import {readdirSync,readFileSync} from 'node:fs';
import {auditBlindClaims} from '../lib/admin-rc57-claim-audit.js';
import {blindEvidencePacket,runBlindStage} from '../lib/admin-rc57-blind.js';
import {evaluateBlindDecision} from '../lib/admin-rc57-blind-grade.js';

const all=new Set(blindEvidencePacket('complete').documents.map(d=>d.id));
const early=new Set(blindEvidencePacket('initial').documents.map(d=>d.id));
const base={suspectId:'MAGDALENA',alternativeId:'ELZBIETA',certainty:'medium',
 evidenceIds:['EVID_MESSAGE_THREAD_RECOVERED','EVID_MESSAGE_DEVICE_METADATA','DIG-09','ADM-04','EVID_ACCEPTANCE_RECORD','TEC-15','LAB-07'],
 reasoning:'Wiadomość wysłano o 01:32 z konta AUD-04 i urządzenia TAB-AUD-02, co wskazuje na Magdalenę Kaczmarek jako nadawczynię. ZG-41 opisuje L-3, chociaż zdjęcie pokazuje L-2. Monitoring nie pozwala rozpoznać twarzy. Trasa 215 s jest możliwa, nie dowodzi obecności.',
 counterargument:'Elżbieta miała niewysłany projekt zgłoszenia BHP, a brak wysłania zgłoszenia sugeruje ukrywanie wiedzy.',
 missingProof:'Brakuje bezpośredniego rozpoznania twarzy i LAB-014.'};
const audit=d=>auditBlindClaims(d,{availableIds:all,allDocumentIds:all});
const qa=audit(base);
assert.deepEqual(new Set(qa.findings.map(f=>f.code)),new Set(['unknown_document_in_text','account_as_person','bhp_draft_as_concealment']));
const grade=evaluateBlindDecision({phase:'complete',decision:base,validIds:all,qa});
assert.equal(grade.dimensions.verdict.status,'matches_canon');
assert.equal(grade.dimensions.evidence.status,'invalid_sources');
assert.equal(grade.dimensions.reasoning.status,'flagged');
assert.equal(grade.assessment,'canon_match_with_source_errors');
assert.equal(grade.canonMatch,true);
assert.deepEqual(grade.invalidSourceIds,['LAB-014']);
const careful={...base,reasoning:'Powiązanie z kontem AUD-04 i TAB-AUD-02 wskazuje na techniczne źródło wiadomości, ale nie potwierdza, kto korzystał z urządzenia. Magdalena mogła być nadawczynią. Monitoring nie rozpoznaje twarzy. Trasa ADM-04 była wykonalna.',counterargument:'Elżbieta pozostawiła niewysłany projekt BHP, ale nie oznacza to ukrywania wiedzy.',missingProof:'Brak odcisków i niezależnego potwierdzenia tożsamości.'};
const carefulQa=audit(careful);
assert(!carefulQa.findings.some(f=>['account_as_person','bhp_draft_as_concealment'].includes(f.code)));
const carefulGrade=evaluateBlindDecision({phase:'complete',decision:careful,validIds:all,qa:carefulQa});
assert.equal(carefulGrade.dimensions.verdict.status,'matches_canon');
assert.equal(carefulGrade.dimensions.evidence.status,'references_valid');
assert.equal(carefulGrade.dimensions.reasoning.status,'manual_review_required');
assert.equal(carefulGrade.assessment,'canon_match_requires_manual_review');
const more=[
 ['camera_blind_spot_overgeneralized','VIS-10 i TEC-16 wskazują, że nisza stanowiska nr 3 nie jest monitorowana przez żadną kamerę, co uniemożliwia odtworzenie drogi dojścia.'],
 ['online_session_as_physical_alibi','Sesja AU-01 audytu potwierdzała fizyczną obecność Magdaleny w biurze przez cały czas.'],
 ['class_fibers_as_individual_proof','LAB-07 pozwala jednoznacznie zidentyfikować Magdalenę jako osobę, od której pochodziły włókna.'],
 ['route_feasibility_as_presence','ADM-04: Magdalena przeszła trasę w 215 sekund.'],
 ['camera_as_facial_identification','VIS-08: rozpoznano Magdalenę na nagraniu monitoringu.'],
 ['dependent_lab_results_double_counted','LAB-07 i LAB-09 to dwa niezależne dowody kontaktu z tą samą osobą.']
];
for(const [code,text] of more){
 const flagged=audit({...base,reasoning:text,counterargument:'',missingProof:''});
 assert(flagged.findings.some(f=>f.code===code),`Oczekiwano ${code}: ${JSON.stringify(flagged.findings)}`);
}
const safe=[
 'VIS-10: nisza nie jest monitorowana, jednak kamery umożliwiają analizę drogi dojścia.',
 'Połączenie AU-01 nie dowodzi fizycznej obecności Magdaleny w biurze.',
 'LAB-07 i LAB-09 opisują powiązane wyniki tych samych włókien W-7, bez identyfikacji osoby.',
 'ADM-04: 215 sekund wystarczało do przejścia, nie dowodzi jednak, że Magdalena rzeczywiście przeszła.',
 'VIS-05 i VIS-08 pokazują sylwetkę, lecz nie pozwalają rozpoznać Magdaleny.'
];
for(const text of safe){
 const flagged=audit({...careful,reasoning:text,counterargument:'',missingProof:''});
 assert.equal(flagged.findings.length,0,`False positive dla '${text}': ${JSON.stringify(flagged.findings)}`);
}
const explicit=audit({...careful,evidenceIds:[...careful.evidenceIds,'LAB-014'],reasoning:'',counterargument:'',missingProof:''});
assert(explicit.findings.some(f=>f.code==='unknown_document_in_evidence_list'));
const first=auditBlindClaims({...careful,evidenceIds:['MED-01','MED-07','TEC-03'],reasoning:'Dokument EVID_CCTV_SYNC wskazuje korektę zegara.',counterargument:'',missingProof:''},{availableIds:early,allDocumentIds:all});
assert(first.findings.some(f=>f.code==='document_not_available_at_stage'));
const start=evaluateBlindDecision({phase:'initial',decision:base,validIds:early,qa:first});
assert.equal(start.graded,false);assert.equal(start.dimensions.verdict.status,'not_graded');
assert.equal(start.dimensions.evidence.status,'invalid_sources');
const wrong=evaluateBlindDecision({phase:'complete',decision:{...careful,suspectId:'MAREK'},validIds:all,qa:carefulQa});
assert.equal(wrong.dimensions.verdict.status,'different_suspect');
const unknown=evaluateBlindDecision({phase:'complete',decision:{...careful,suspectId:null},validIds:all,qa:carefulQa});
assert.equal(unknown.dimensions.verdict.status,'undetermined');
process.env.APINEX_API_KEY='MOCK_ONLY_DO_NOT_SEND';process.env.RC57_LIVE_TEST_ENABLED='true';
let inferPayload,inferSystem;
const report=await runBlindStage({stage:'complete',provider:'apinex-luna',confirmed:true},async args=>{inferPayload=args.payload;inferSystem=args.system;return base;});
assert.equal(report.grade.assessment,'canon_match_with_source_errors');
assert(report.qa.findings.some(f=>f.evidence==='LAB-014'));
assert(!JSON.stringify(inferPayload).includes('LAB-014'));
assert(!JSON.stringify(inferPayload).includes('EXPECTED'));
assert(!JSON.stringify(inferPayload).includes('canonMatch'));
assert(!inferSystem.includes('MAGDALENA'));
const html=readFileSync(new URL('../lib/admin-rc57-ui.js',import.meta.url),'utf8');
for(const label of ['Trafność wskazania','Poprawność dowodowa','Jakość rozumowania'])assert(html.includes(label));
assert.equal(readdirSync(new URL('../api/',import.meta.url)).filter(x=>x.endsWith('.js')).length,12);
console.log('PASS RC57.10.1: three independent ratings, real report LAB-014/account/BHP, six source checks, cautious claims safe, 13-doc evidence review, blind isolation, 12 Vercel functions.');
