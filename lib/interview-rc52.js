import {INTERVIEW_STYLE_CONTEXT} from './interview-prompt-rc57106.js';
/* RC52 — interpersonal continuity without the forbidden cross-witness knowledge leak.
 * Only the current witness's own server-approved conversation and explicitly presented evidence.
 * Never send other witness transcripts, the complete witness bible or privileged dossier. */
const roster=Object.freeze({MAREK:'Marek Nowicki',TOMASZ:'Tomasz Krawczyk',JANUSZ:'Janusz Wójcik',ELZBIETA:'Elżbieta Zięba',KAMIL:'Kamil Brzozowski',MAGDALENA:'Magdalena Kaczmarek'});
const fold=s=>String(s||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
export { RC52_DIRECTIVE } from './interview-prompt-rc57106.js';
export function witnessRelationshipCue(scene){
 const ownId=scene?.identity?.id,query=fold(scene?.question);
 const recent=(Array.isArray(scene?.approvedThreadHistory)?scene.approvedThreadHistory:[]).slice(-40);
 const knownNames=[];
 for(const [id,name] of Object.entries(roster)){
  if(id===ownId)continue;
  const surname=fold(name.split(' ').at(-1));
  const mentioned=recent.some(turn=>turn&&['witness','npc','świadek'].includes(turn.role)&&fold(String(turn.text||'').slice(0,1000)).includes(surname));
  const queried=query.includes(surname)||query.includes(fold(name));
  if(mentioned||queried)knownNames.push({name,askedNow:queried,previouslyMentionedByWitness:mentioned});
 }
 const shown=(Array.isArray(scene?.knowledge?.documentsShown)?scene.knowledge.documentsShown:[]).filter(x=>typeof x==='string').slice(-8);
 return Object.freeze({authority:'conversation_reference_only_not_fact',persons:knownNames.slice(0,4),
  evidencePresented:scene?.presentedEvidence?{id:String(scene.presentedEvidence.id||'').slice(0,65),type:String(scene.presentedEvidence.type||'').slice(0,65)}:null,
  disclosedDocumentCount:shown.length,
  warning:INTERVIEW_STYLE_CONTEXT.relationship});
}
