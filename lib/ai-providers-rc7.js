/** RC7: isolated, server-only provider adapters. Never import in browser code. */
export const providerConfig=Object.freeze({
 interview:{provider:'google',defaultModel:'gemini-3.8-flash'},
 deduction:{provider:'groq',defaultModel:'openai/gpt-oss-120b',backupModel:'openai/gpt-oss-20b'},
 laboratory:{provider:'groq',defaultModel:'llama-3.1-8b-instant'},
 defense:{provider:'google',defaultModel:'gemini-3.8-flash'}
});
export class ProviderFailure extends Error{
 constructor(code,status=502){super(code);this.name='ProviderFailure';this.code=code;this.status=status;}
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
  if(!res.ok){let code='upstream_unavailable';if(res.status===401||res.status===403)code='upstream_authorization';else if(res.status===429)code='upstream_rate_limit';else if(res.status===404)code='model_not_available';throw new ProviderFailure(code,res.status>=500?503:res.status);}
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
export async function askGroq({system,payload,model,timeoutMs=18000,maxTokens=950,temperature=0.1,role='deduction'},transport=fetch){
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
   ...(role==='deduction'?{reasoning_effort:'medium'}:{})
  },timeoutMs,transport);
 return parseAIJson(data?.choices?.[0]?.message?.content);
}
