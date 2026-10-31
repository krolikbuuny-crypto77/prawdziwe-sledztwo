/** RC33: 270s request budget on Vercel Hobby with Fluid Compute (300s max).
 * Limits are ceilings; a successful interview responds immediately.
 * Preserve 60s (Z.ai + commit) after the APINEX window. */
export const INTERVIEW_BUDGET=Object.freeze({
 totalMs:270000, apinexWindowMs:210000, zaiWindowMs:35000, commitReserveMs:25000,
 perApinexMs:19500, perZaiMs:34000, minCallMs:950,
 phaseMs:Object.freeze(Object.fromEntries([
  'apinex-luna','apinex-minimax','apinex-mimo','apinex-glm','apinex-deepseek','apinex-glmx','apinex-muse','apinex-gemini','apinex-deepseekpro','apinex-glmpro'
 ].map(id=>[id,Object.freeze({generate:11500,rewrite:2500,'semantic-audit':6500})]).concat([
  ['zai',Object.freeze({generate:17000,rewrite:4000,'semantic-audit':7000})],
  ['gemini',Object.freeze({generate:26000,rewrite:7000,'semantic-audit':6000})],
  ['groq',Object.freeze({generate:13000,rewrite:4500,'semantic-audit':5500})],
  ['mistral',Object.freeze({generate:10000,rewrite:3500,'semantic-audit':4500})]
 ])))
});
export function phaseTimeout({provider,phase,now=Date.now(),turnDeadline,providerDeadline}){
 const base=INTERVIEW_BUDGET.phaseMs[provider]?.[phase];
 if(!base)return 0;
 const overall=Number.isFinite(turnDeadline)?turnDeadline-now-INTERVIEW_BUDGET.commitReserveMs:base;
 const allowance=Number.isFinite(providerDeadline)?providerDeadline-now:base;
 const timeout=Math.floor(Math.min(base,overall,allowance));
 return timeout>=INTERVIEW_BUDGET.minCallMs?timeout:0;
}
