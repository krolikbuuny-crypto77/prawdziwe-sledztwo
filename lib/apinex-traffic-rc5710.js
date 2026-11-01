/** RC57.10. Process-local guard; NOT a global quota in serverless Vercel. */
import {ProviderFailure} from './ai-providers-rc7.js';
const timestamps=[];
const MAX=Number.isInteger(Number(process.env.APINEX_LOCAL_HTTP_RPM)) ? Math.max(1,Math.min(30,Number(process.env.APINEX_LOCAL_HTTP_RPM))) : 30;
let blockedUntil=0;
export function trafficState(now=Date.now()){
 while(timestamps.length&&timestamps[0]<=now-60000)timestamps.shift();
 return {countLastMinute:timestamps.length,maxPerMinute:MAX,retryAfterSeconds:Math.max(0,Math.ceil((blockedUntil-now)/1000)),scope:'single-serverless-instance'};
}
export function reserveApinexRequest(now=Date.now()){
 const s=trafficState(now);
 if(now<blockedUntil||timestamps.length>=MAX){
  const pause=Math.max(blockedUntil-now,timestamps.length?timestamps[0]+60000-now:0);
  const err=new ProviderFailure('upstream_rate_limit',429);
  err.diagnostic={upstreamStatus:429,quotaKind:'local_requests_per_minute',retryAfterSeconds:Math.max(1,Math.ceil(pause/1000))};
  throw err;
 }
 timestamps.push(now);
 return trafficState(now);
}
export function noteApinex429(retryAfterSeconds=60,now=Date.now()){
 const delay=Math.max(1,Math.min(300,Number(retryAfterSeconds)||60));
 blockedUntil=Math.max(blockedUntil,now+delay*1000);
}
export function resetTrafficForTests(){timestamps.splice(0);blockedUntil=0;}
