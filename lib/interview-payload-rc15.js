/** Remove duplicated scaffolding, never rank or truncate authorised facts/history. */
export function compactInterviewPayload(scene){
 const payload={...scene,_responseDeadline:undefined,_providerDeadline:undefined,approvedThreadHistory:undefined};
 if(scene.knowledge?.factBank){
  const {groundedOptions,alreadySaid,...knowledge}=scene.knowledge;
  payload.knowledge={...knowledge};
  if(knowledge.factBank.some(f=>f.text===knowledge.currentGroundedAnswer))delete payload.knowledge.currentGroundedAnswer;
  // Topic index repeats fact IDs; the full fact bank and witness boundaries remain.
  if(scene.witnessDossier){const {topics,...dossier}=scene.witnessDossier;payload.witnessDossier=dossier;}
 }
 // Keep original history and long-term summaries; drop only exact duplicated recent pairs.
 if(scene.dialogueMemory?.previousPairs&&scene.memory?.conversation){
  const rows=scene.memory.conversation;
  const covered=scene.dialogueMemory.previousPairs.every(p=>rows.some((r,i)=>r.text===p.question&&rows[i+1]?.text===p.answer));
  if(covered){const {previousPairs,...memory}=scene.dialogueMemory;payload.dialogueMemory=memory;}
 }
 // RC21: remove only byte-identical scaffolding already present elsewhere.
 // Fact IDs, texts, order, ownership and all unique history remain unchanged.
 const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 if(payload.witnessDossier&&payload.personality){
  payload.witnessDossier={...payload.witnessDossier};
  for(const key of ['temperament','diction','speakingStyle'])
   if(payload.witnessDossier[key]!==undefined&&equal(payload.witnessDossier[key],payload.personality[key]))delete payload.witnessDossier[key];
 }
 const conversation=payload.memory?.conversation||payload.conversation||[];
 const coveredPair=pair=>conversation.some((r,i)=>r.text===pair.question&&conversation[i+1]?.text===(pair.reply??pair.answer));
 if(payload.polishPragmatics?.referenceContext?.length&&payload.polishPragmatics.referenceContext.every(coveredPair)){
  const {referenceContext,...rest}=payload.polishPragmatics;
  payload.polishPragmatics={...rest,referenceContextInConversation:true};
 }
 if(payload.conversationState?.previousTurn&&coveredPair(payload.conversationState.previousTurn)){
  const {previousTurn,...rest}=payload.conversationState;
  payload.conversationState={...rest,previousTurnInConversation:true};
 }
 if(payload.declarationLedger?.recent){
  payload.declarationLedger={...payload.declarationLedger,recent:payload.declarationLedger.recent.map(event=>{
   const i=conversation.findIndex((r,j)=>r.text===event.question&&conversation[j+1]?.text===event.reply);
   if(i<0)return event;
   const {question,reply,...metadata}=event;
   return {...metadata,conversationPair:{questionIndex:i,replyIndex:i+1}};
  })};
 }
 return payload;
}
