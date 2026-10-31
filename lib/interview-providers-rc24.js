/** RC33: server-side interview adapters; never bundled into browser. */
import {ProviderFailure,parseAIJson,providerErrorDetails} from './ai-providers-rc7.js';
export const interviewModels=Object.freeze({
 'apinex-luna':'free/gpt-6-luna',
 'apinex-minimax':'free/minimax-m3.1-flash',
 'apinex-mimo':'free/mimo-v2.6-pro',
 'apinex-glm':'free/glm-5.3-flash',
 'apinex-deepseek':'free/deepseek-v4.1-flash',
 'apinex-glmx':'free/glm-5.3-flashx',
 'apinex-muse':'free/muse-spark-1.3',
 'apinex-gemini':'free/gemini-3.8-flash',
 'apinex-deepseekpro':'free/deepseek-v4-pro-0813',
 'apinex-glmpro':'free/glm-5.3',
 zai:'glm-4.7-flash',local:'witness-registry-rc24'
});
export const INTERVIEW_CHAIN=Object.freeze(Object.keys(interviewModels));
export async function askInterviewProvider({provider,system,payload,maxTokens=1200,temperature=0.25,timeoutMs=12000},transport=fetch){
 const spec=provider==='zai'?{key:process.env.ZAI_API_KEY,url:'https://api.z.ai/api/paas/v4/chat/completions'}:
  provider.startsWith('apinex-')&&Object.hasOwn(interviewModels,provider)?{key:process.env.APINEX_API_KEY,url:'https://api.apinex.bond/v1/chat/completions'}:null;
 if(!spec)throw new ProviderFailure('interview_provider_not_allowed',400);
 if(!spec.key)throw new ProviderFailure(provider+'_not_configured',503);
 const controller=new AbortController();let timer;
 const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new ProviderFailure('model_timeout',504));},Math.max(1,Math.min(30000,timeoutMs)));});
 const request=(async()=>{
  const body={model:interviewModels[provider],messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(payload)}],
   stream:false,max_tokens:maxTokens,temperature,response_format:{type:'json_object'},
   ...(provider==='zai'?{thinking:{type:'disabled'}}:{})};
  const res=await transport(spec.url,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${spec.key}`},body:JSON.stringify(body),signal:controller.signal});
  if(!res.ok){
   const error=new ProviderFailure([401,403].includes(res.status)?'upstream_authorization':res.status===429?'upstream_rate_limit':
    res.status===402?'upstream_payment_required':res.status===413?'upstream_request_too_large':res.status===404?'model_not_available':[400,422].includes(res.status)?'upstream_invalid_request':'upstream_unavailable',res.status);
   error.diagnostic=await providerErrorDetails(res);throw error;
  }
  const data=await res.json();
  if(data?.error){
   const status=Number(data.error.status||data.error.code);
   const failure=new ProviderFailure([401,403].includes(status)?'upstream_authorization':status===429?'upstream_rate_limit':status===402?'upstream_payment_required':'upstream_invalid_request',status||502);
   failure.diagnostic={upstreamStatus:Number.isInteger(status)&&status>=400&&status<=599?status:502};throw failure;
  }
  return parseAIJson(data?.choices?.[0]?.message?.content);
 })();
 try{return await Promise.race([request,timeout]);}
 catch(error){if(error?.name==='AbortError')throw new ProviderFailure('model_timeout',504);throw error;}
 finally{clearTimeout(timer);}
}
