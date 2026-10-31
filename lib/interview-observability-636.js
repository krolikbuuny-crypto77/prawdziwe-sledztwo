/** Request-scoped diagnostics. Never collect utterances, prompts, IPs, tokens, document text, or credentials. */
const PHASES=new Set(['generate','quality','rewrite','semantic-audit','post-check','save']);
const PROVIDERS=new Set(['gemini','zai','groq','local','server']);
const OUTCOMES=new Set(['ok','rejected','error','skipped']);
const CODES=new Set(['corroboration_nonanswer','relationship_actor_reversed','victim_gender_mismatch','model_fallback','invalid_decision','missing_fact_ids','fact_ids_count','fact_ids_type','duplicate_fact_ids','unknown_fact_ids','accepted','repeated_previous_reply','semantic_repetition','missing_question_part','wrong_document_type',
 'photograph_not_addressed','presented_evidence_ignored','not_relevant','not_entailed','not_complete',
 'invalid_json','bad_fact_ids','poor_style','hard_guard','timeout','provider_error','unknown','no_retry_budget',
 'missing_server_state','state_conflict','server_guard','quality_rejected']);
export function makeInterviewTrace(){
 const steps=[];
 return {
  add(provider,phase,outcome,durationMs=0,code='unknown'){
   if(steps.length>=24)return;
   steps.push({provider:PROVIDERS.has(provider)?provider:'server',phase:PHASES.has(phase)?phase:'post-check',
    result:OUTCOMES.has(outcome)?outcome:'error',durationMs:Math.min(120000,Math.max(0,Math.round(Number(durationMs)||0))),
    code:CODES.has(code)?code:'unknown'});
  },
  summary(){return {version:'6.36-I',attempts:steps.map(x=>({...x})),
   providerCalls:steps.filter(x=>['generate','rewrite','semantic-audit'].includes(x.phase)).length,
   correctiveCalls:steps.filter(x=>x.phase==='rewrite').length,
   rejectedChecks:steps.filter(x=>x.result==='rejected').length};}
 };
}
