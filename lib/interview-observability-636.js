/** Request-scoped diagnostics. Never collect utterances, prompts, IPs, tokens, document text, or credentials. */
const PHASES=new Set(['generate','quality','rewrite','semantic-audit','post-check','save']);
const PROVIDERS=new Set(['gemini','zai','mistral','groq','apinex-luna','apinex-minimax','apinex-mimo','apinex-glm','apinex-deepseek','apinex-glmx','apinex-muse','apinex-gemini','apinex-deepseekpro','apinex-glmpro','apinex-jev','local','server']);
const OUTCOMES=new Set(['ok','rejected','error','skipped']);
const CODES=new Set(['corroboration_nonanswer','relationship_actor_reversed','victim_gender_mismatch','model_fallback','invalid_decision','missing_fact_ids','fact_ids_count','fact_ids_type','duplicate_fact_ids','unknown_fact_ids','accepted','repeated_previous_reply','semantic_repetition','missing_question_part','wrong_document_type',
 'photograph_not_addressed','presented_evidence_ignored','not_relevant','not_entailed','not_complete',
 'invalid_json','bad_fact_ids','poor_style','hard_guard','timeout','provider_error','unknown','no_retry_budget',
 'authored_fallback','shared_provider_limit','missing_server_state','state_conflict','server_guard','quality_rejected']);
export function makeInterviewTrace(){
 const steps=[];let localDuration=0,contextPreparationDuration=0;const observedCalls=[];
 return {
  addContextDuration(ms){contextPreparationDuration+=Math.max(0,Math.round(ms||0));},
  addLocalDuration(ms){localDuration+=Math.max(0,Math.round(ms||0));},
  noteProviderCall(phase,metrics){if(metrics&&observedCalls.length<40)observedCalls.push({phase,
   inputTokens:metrics.inputTokens??null,outputTokens:metrics.outputTokens??null,
   contextSize:metrics.contextSize??null,providerDurationMs:metrics.providerDurationMs??null,
   quotaWaitMs:metrics.quotaWaitMs??null,requestDispatched:metrics.requestDispatched===true});},
  add(provider,phase,outcome,durationMs=0,code='unknown'){
   if(steps.length>=64)return;
   steps.push({provider:PROVIDERS.has(provider)?provider:'server',phase:PHASES.has(phase)?phase:'post-check',
    result:OUTCOMES.has(outcome)?outcome:'error',durationMs:Math.min(300000,Math.max(0,Math.round(Number(durationMs)||0))),
    code:CODES.has(code)?code:'unknown'});
  },
  summary(){
   const sum=(phase)=>steps.filter(x=>x.phase===phase).reduce((s,x)=>s+x.durationMs,0);
   const tokens=(key)=>observedCalls.length&&observedCalls.every(x=>x[key]!==null)?observedCalls.reduce((s,x)=>s+x[key],0):null;
   const dispatched=observedCalls.filter(x=>x.requestDispatched).length;
   const phases=steps.filter(x=>x.provider!=='local'&&['generate','rewrite','semantic-audit'].includes(x.phase));
   return {version:'RC57.10.5',attempts:steps.map(x=>({...x})),
    providerCalls:observedCalls.length?dispatched:phases.length,
    correctiveCalls:steps.filter(x=>x.phase==='rewrite').length,
    rejectedChecks:steps.filter(x=>x.result==='rejected').length,
    generateDurationMs:sum('generate')+sum('rewrite'),semanticAuditDurationMs:sum('semantic-audit'),
    localValidationDurationMs:localDuration,contextPreparationDurationMs:contextPreparationDuration,
    inputTokens:tokens('inputTokens'),outputTokens:tokens('outputTokens'),
    contextSize:observedCalls.length?Math.max(...observedCalls.map(x=>x.contextSize??0)):null,
    auditMode:steps.some(x=>x.phase==='semantic-audit')?'semantic':steps.some(x=>x.phase==='quality'&&x.code==='accepted')?'local_verbatim':'none',
    providerWaitDurationMs:observedCalls.length?observedCalls.reduce((s,x)=>s+(x.providerDurationMs??0),0):null,
    quotaWaitDurationMs:observedCalls.length?observedCalls.reduce((s,x)=>s+(x.quotaWaitMs??0),0):null};}
 };
}
