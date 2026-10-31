/** RC33: sequential, fail-closed advisory-only routing. One active inference at a time. */
import {askGroq,askGemini,ProviderFailure,parseAIJson,providerErrorDetails} from './ai-providers-rc7.js';
export const SPECIALIZED_CHAINS=Object.freeze({
 evidence:Object.freeze([
  ['apinex','free/glm-5.3'],['apinex','free/deepseek-v4-pro-0813'],
  ['groq','openai/gpt-oss-120b'],['groq','qwen/qwen3.8-27b'],['groq','openai/gpt-oss-20b']]),
 laboratory:Object.freeze([
  ['apinex','free/minimax-m3.1-flash'],['apinex','free/mimo-v2.6-pro'],
  ['groq','openai/gpt-oss-20b'],['groq','openai/gpt-oss-120b']]),
 defense:Object.freeze([
  ['apinex','free/gemini-3.8-flash'],['google','gemini-3.8-flash'],
  ['apinex','free/glm-5.3'],['groq','openai/gpt-oss-120b'],['groq','openai/gpt-oss-20b']])
});
const APINEX_ALLOWED=new Set([
 'free/glm-5.3','free/deepseek-v4-pro-0813','free/minimax-m3.1-flash','free/mimo-v2.6-pro','free/gemini-3.8-flash'
]);
export const configuredProvider=p=>p==='apinex'?!!process.env.APINEX_API_KEY:
 p==='groq'?!!process.env.GROQ_API_KEY:
 p==='google'?!!(process.env.GEMINI_API_KEY||process.env.GOOGLE_AI_STUDIO_API_KEY):false;
export async function askApinexSpecialized({system,payload,model,timeoutMs,maxTokens,temperature=0.15},transport=fetch){
 if(!APINEX_ALLOWED.has(model))throw new ProviderFailure('apinex_model_not_allowed',400);
 const key=process.env.APINEX_API_KEY;
 if(!key)throw new ProviderFailure('apinex_not_configured',503);
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),Math.max(950,Math.min(45000,timeoutMs)));
 try{
  const res=await transport('https://api.apinex.bond/v1/chat/completions',{
   method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${key}`},signal:ctrl.signal,
   body:JSON.stringify({model,messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(payload)}],
    response_format:{type:'json_object'},temperature,max_tokens:maxTokens,stream:false})
  });
  if(!res.ok){
   const failure=new ProviderFailure([401,403].includes(res.status)?'upstream_authorization':res.status===429?'upstream_rate_limit':res.status===402?'upstream_payment_required':res.status===404?'model_not_available':[400,422].includes(res.status)?'upstream_invalid_request':'upstream_unavailable',res.status);
   failure.diagnostic=await providerErrorDetails(res);throw failure;
  }
  const data=await res.json();
  if(data?.error){
   const status=Number(data.error.status||data.error.code)||502;
   const failure=new ProviderFailure(status===429?'upstream_rate_limit':[401,403].includes(status)?'upstream_authorization':status===402?'upstream_payment_required':'upstream_invalid_request',status);
   failure.diagnostic={upstreamStatus:status};throw failure;
  }
  return parseAIJson(data?.choices?.[0]?.message?.content);
 }catch(e){if(e?.name==='AbortError')throw new ProviderFailure('model_timeout',504);throw e;}
 finally{clearTimeout(timer);}
}

export async function runSpecializedChain({task,system,payload,validate,totalMs,attemptMs=12000,maxTokens=1000,temperature=0.15,transport}){
 if(!Object.hasOwn(SPECIALIZED_CHAINS,task))throw new Error('Unknown specialist task');
 const deadline=Date.now()+totalMs,attempts=[];
 let apinexBlocked=false,apinexOutages=0;
 let lastError=null;
 for(const [provider,model] of SPECIALIZED_CHAINS[task]){
  if(provider==='apinex'&&apinexBlocked){attempts.push({provider,model,code:'shared_limit_skipped'});continue;}
  if(!configuredProvider(provider)){attempts.push({provider,model,code:'not_configured'});continue;}
  const remaining=deadline-Date.now();
  if(remaining<1100){attempts.push({provider,model,code:'budget_exhausted'});break;}
  const timeoutMs=Math.max(950,Math.min(attemptMs,remaining-150));
  try{
   const raw=provider==='apinex'?await askApinexSpecialized({system,payload,model,maxTokens,timeoutMs,temperature},transport):
    provider==='google'?await askGemini({system,payload,model,maxTokens,timeoutMs,thinkingLevel:'high'},transport):
    await askGroq({system,payload,model,maxTokens,timeoutMs,temperature,
     role:task==='laboratory'?'laboratory':'deduction',reasoningEffort:task==='laboratory'?'low':'medium'},transport);
   const safe=validate(raw);
   if(!safe){attempts.push({provider,model,code:'invalid_response'});continue;}
   return {provider,model,result:safe,attempts};
  }catch(error){
   const code=String(error?.code||'provider_error');lastError=error;
   attempts.push({provider,model,code});
   if(provider==='apinex'){
    if(['upstream_rate_limit','upstream_payment_required','upstream_authorization'].includes(code)||[401,402,403,429].includes(error?.diagnostic?.upstreamStatus))apinexBlocked=true;
    else if(code==='upstream_unavailable'&&++apinexOutages>=2)apinexBlocked=true;
   }
  }
 }
 // No raw model output in exceptions/logs; diagnostics are safe model IDs + finite error codes.
 const e=new ProviderFailure('specialist_models_unavailable',503);
 e.attempts=attempts;
 e.lastCode=String(lastError?.code||'no_approved_response').slice(0,70);
 throw e;
}
