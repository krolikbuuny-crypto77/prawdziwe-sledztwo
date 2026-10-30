/** Classify only the output contract; never repair unknown references or relax entailment. */
export function factContractIssue(response,facts){
 if(response?.decision==='fallback')return 'model_fallback';
 if(response?.decision!=='answer')return 'invalid_decision';
 if(!Array.isArray(response.factIds))return 'missing_fact_ids';
 if(response.factIds.length<1||response.factIds.length>4)return 'fact_ids_count';
 if(response.factIds.some(id=>typeof id!=='string'))return 'fact_ids_type';
 if(new Set(response.factIds).size!==response.factIds.length)return 'duplicate_fact_ids';
 const allowed=new Set(facts.map(f=>f.id));
 if(response.factIds.some(id=>!allowed.has(id)))return 'unknown_fact_ids';
 return null;
}
