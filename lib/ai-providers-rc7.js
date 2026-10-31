/** RC7: isolated, server-only provider adapters. Never import in browser code. */
export const providerConfig=Object.freeze({
 interview:{provider:'apinex',defaultModel:'free/gpt-6-luna',backupProvider:'zai',backupModel:'glm-4.7-flash'},
 deduction:{provider:'groq',defaultModel:'openai/gpt-oss-120b',backupModel:'openai/gpt-oss-20b'},
 laboratory:{provider:'groq',defaultModel:'llama-3.1-8b-instant'},
 defense:{provider:'google',defaultModel:'gemini-3.8-flash'}
});
export class ProviderFailure extends Error{
 constructor(code,status=502){super(code);this.name='ProviderFailure';this.code=code;this.status=status;}
}
const ERROR_CODES=new Set(['INVALID_ARGUMENT','RESOURCE_EXHAUSTED','UNAVAILABLE','INTERNAL','NOT_FOUND','PERMISSION_DENIED','UNAUTHENTICATED','FAILED_PRECONDITION','DEADLINE_EXCEEDED','rate_limit_exceeded','insufficient_quota','invalid_api_key','model_not_found','invalid_request_error','tokens','requests']);
export async function providerErrorDetails(res,now=Date.now()){
 let data;try{data=await res.json();}catch{}
 const err=data?.error||{};
 const candidate=err.status||err.code||err.type;
 const upstreamCode=ERROR_CODES.has(candidate)?candidate:'unknown';
 // Inspect only to classify; NEVER retain or log messages/metadata supplied by providers.
 const message=typeof err.message==='string'?err.message.slice(0,12000).toLowerCase():'';
 const quotaKind=/tokens? per day|\btpd\b|perday.*token/.test(message)?'tokens_daily':
  /requests? per day|\brpd\b|perday.*request/.test(message)?'requests_daily':
  /tokens? per minute|\btpm\b|perminute.*token/.test(message)?'tokens_per_minute':
  /requests? per minute|\brpm\b|perminute.*request/.test(message)?'requests_per_minute':
  /request too large|too many tokens/.test(message)?'request_too_large':'unknown';
 const parameterIssue=![400,422].includes(res.status)?'unknown':/thinking/.test(message)?'thinking_config':/max.?output.?tokens|max_tokens/.test(message)?'output_tokens':
  /response.?schema|response.?format|response.?mime/.test(message)?'response_format':/model/.test(message)?'model':'unknown';
 const retry=res.headers?.get?.('retry-after');
 let seconds=retry==null?NaN:/^\d+(?:\.\d+)?$/.test(retry)?Number(retry):(Date.parse(retry)-now)/1000;
 if(!Number.isFinite(seconds)){
  const details=Array.isArray(err.details)?err.details:[];
  const info=details.find(x=>x?.['@type']==='type.googleapis.com/google.rpc.RetryInfo');
  const value=typeof info?.retryDelay==='string'?info.retryDelay:'';
  if(/^\d+(?:\.\d+)?s$/.test(value))seconds=Number(value.slice(0,-1));
 }
 const numeric=n=>Number.isFinite(n)&&n>=0&&n<=1000000000?n:null;
 const numberAfter=label=>{const m=message.match(label==='limit'?/\blimit\s*[:=]?\s*([0-9]+)/i:/\brequested\s*[:=]?\s*([0-9]+)/i);return m?numeric(Number(m[1])):null;};
 const tokenLimit=numeric(Number(res.headers?.get?.('x-ratelimit-limit-tokens')||NaN))??numberAfter('limit');
 const requestedTokens=numberAfter('requested');
 return {upstreamStatus:Number.isInteger(res.status)?res.status:0,upstreamCode,quotaKind,parameterIssue,requestTooLarge:res.status===413,tokenLimit,requestedTokens,
  retryAfterSeconds:Number.isFinite(seconds)&&seconds>=0?Math.min(604800,Math.ceil(seconds)):null};
}
const modelName=(v,fallback)=>typeof v==='string'&&/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,110}$/.test(v)?v:fallback;
export const models=()=>({
 interview:modelName(process.env.GEMINI_INTERVIEW_MODEL,'gemini-3.8-flash'),
 deduction:modelName(process.env.GROQ_DEDUCTION_MODEL,'openai/gpt-oss-120b'),
 deductionBackup:modelName(process.env.GROQ_DEDUCTION_BACKUP_MODEL,'openai/gpt-oss-20b'),
 laboratory:modelName(process.env.GROQ_LAB_MODEL,'llama-3.1-8b-instant'),
 defense:modelName(process.env.GEMINI_DEFENSE_MODEL,'gemini-3.8-flash')
});
export function parseAIJson(raw){
 if(typeof raw!=='string'||raw.length>70000)throw new ProviderFailure('invalid_model_payload');
 let s=raw.trim().replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'');
 try{return JSON.parse(s);}catch{}
 const a=s.indexOf('{'),b=s.lastIndexOf('}');
 if(a>=0&&b>a)return JSON.parse(s.slice(a,b+1));
 throw new ProviderFailure('invalid_model_json');
}
async function makeRequest(url,headers,body,timeoutMs,transport=fetch){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),Math.min(49000,Math.max(950,timeoutMs)));
 try{
  const res=await transport(url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify(body),signal:controller.signal});
  if(!res.ok){
   const diagnostic=await providerErrorDetails(res);
   let code='upstream_unavailable';
   if(res.status===401||res.status===403)code='upstream_authorization';
   else if(res.status===413)code='upstream_request_too_large';
   else if(res.status===429)code='upstream_rate_limit';
   else if(res.status===404)code='model_not_available';
   else if(res.status===400||res.status===422)code='upstream_invalid_request';
   const failure=new ProviderFailure(code,res.status>=500?503:res.status);
   failure.diagnostic=diagnostic;throw failure;
  }
  return await res.json();
 }catch(e){if(e?.name==='AbortError')throw new ProviderFailure('model_timeout',504);throw e;}finally{clearTimeout(timer);}
}
/** Gemini 3.8 Flash: caller chooses thinking level; interviews high, semantic audit medium, defense high. */
export async function askGemini({system,payload,maxTokens=2400,temperature=0.25,model,timeoutMs=30000,thinkingLevel='low',schema=null},transport=fetch){
 const key=process.env.GEMINI_API_KEY||process.env.GOOGLE_AI_STUDIO_API_KEY;
 if(!key)throw new ProviderFailure('gemini_not_configured',503);
 const selected=modelName(model,models().interview);
 const generationConfig={maxOutputTokens:maxTokens,responseMimeType:'application/json'};
 if(schema)generationConfig.responseSchema=schema;
 if(selected==='gemini-3.8-flash'){
  // Gemini 3.8 does NOT accept minimal. Its output budget includes thinking tokens.
  if(!['low','medium','high'].includes(thinkingLevel))throw new ProviderFailure('invalid_thinking_level',400);
  generationConfig.thinkingConfig={thinkingLevel};
 }else{
  // Optional legacy override: older Gemini models use a different API contract.
  generationConfig.temperature=temperature;
 }
 const result=await makeRequest(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(selected)}:generateContent`,{'x-goog-api-key':key},
 {systemInstruction:{parts:[{text:system}]},contents:[{role:'user',parts:[{text:JSON.stringify(payload)}]}],generationConfig},timeoutMs,transport);
 const raw=(result?.candidates?.[0]?.content?.parts||[]).filter(p=>!p.thought).map(p=>p.text||'').join('');
 return parseAIJson(raw);
}
/** Free Groq account: distinct per-model quotas, one server-side key for deduction and lab.
 * GPT-OSS 120B is optimized for reasoning; Llama 3.1 8B is for short lab narration only.
 * No OpenRouter or Cerebras requests, and no implicit paid fallback.
 */
export async function askGroq({system,payload,model,timeoutMs=18000,maxTokens=950,temperature=0.1,role='deduction',reasoningEffort='medium'},transport=fetch){
 const key=process.env.GROQ_API_KEY;
 if(!key)throw new ProviderFailure('groq_not_configured',503);
 const selected=modelName(model,role==='laboratory'?models().laboratory:models().deduction);
 // Only known, confirmed Groq Free-plan models are allowed. Avoid arbitrary paid or
 // discontinued models via environment variables.
 const permitted=role==='laboratory'
  ? new Set(['llama-3.1-8b-instant'])
  : new Set(['openai/gpt-oss-120b','openai/gpt-oss-20b']);
 if(!permitted.has(selected))throw new ProviderFailure('groq_model_not_allowed',400);
 const data=await makeRequest('https://api.groq.com/openai/v1/chat/completions',
  {Authorization:`Bearer ${key}`},{
   model:selected,
   messages:[{role:'system',content:system},{role:'user',content:JSON.stringify(payload)}],
   temperature,max_tokens:maxTokens,stream:false,
   response_format:{type:'json_object'},
   ...(role==='deduction'?{reasoning_effort:['low','medium','high'].includes(reasoningEffort)?reasoningEffort:'medium'}:{})
  },timeoutMs,transport);
 return parseAIJson(data?.choices?.[0]?.message?.content);
}
