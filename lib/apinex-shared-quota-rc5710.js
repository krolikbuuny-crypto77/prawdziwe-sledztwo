/* RC57.10 — opt-in globally coordinated upstream CALL quota, not user questions.
 * Supabase 007 is required before enabling. Fail closed if selected and DB unavailable.
 * Independent of (and in addition to) existing per-game-session limits.
 */
import {ProviderFailure} from './ai-providers-rc7.js';
const enabled=()=>process.env.APINEX_SHARED_QUOTA_ENABLED==='true';
const limit=()=>{const n=Number(process.env.APINEX_MAX_UPSTREAM_CALLS_PER_MINUTE||18);return Number.isSafeInteger(n)&&n>=1&&n<=60?n:18;};
export function upstreamQuotaInfo(){return {enabled:enabled(),maxCallsPerMinute:limit(),scope:'globalny (konto Apinex; wszystkie modele i sesje)',migration:'supabase/007_apinex_upstream_quota.sql',failClosedWhenEnabled:true};}
const reject=(code,status=503)=>new ProviderFailure(code,status);
export async function takeApinexSlot({scope='game',transport=fetch}={}){
 if(!enabled())return {enforced:false,allowed:true};
 if(!['game','tester'].includes(scope))throw reject('apinex_quota_invalid_scope',400);
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!/^https:\/\//.test(url)||!key)throw reject('apinex_quota_not_configured');
 let response;
 try{response=await transport(url.replace(/\/$/,'')+'/rest/v1/rpc/ps_take_apinex_slot',{method:'POST',headers:{apikey:key,Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({p_scope:scope,p_max_calls:limit()}),signal:AbortSignal.timeout(5500)});}
 catch{throw reject('apinex_quota_unavailable');}
 if(!response.ok)throw reject('apinex_quota_migration_missing_or_unavailable');
 let value;try{value=await response.json();}catch{throw reject('apinex_quota_invalid_response');}
 if(value===false){const error=reject('apinex_shared_rate_limit',429);error.diagnostic={retryAfterSeconds:60,quotaKind:'requests_per_minute',upstreamStatus:429};throw error;}
 if(value!==true)throw reject('apinex_quota_invalid_response');
 return {enforced:true,allowed:true};
}
