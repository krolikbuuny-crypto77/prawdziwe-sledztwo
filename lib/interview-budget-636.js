/** RC26: one deadline for three APINEX models -> Z.ai, with time left to commit a local reply. */
export const INTERVIEW_BUDGET=Object.freeze({
 totalMs:90000, apinexWindowMs:16000, commitReserveMs:18000,
 minCallMs:950,
 phaseMs:Object.freeze({
  'apinex-luna':Object.freeze({generate:10000,rewrite:2000,'semantic-audit':5000}),
  'apinex-glm':Object.freeze({generate:10000,rewrite:2000,'semantic-audit':5000}),
  'apinex-deepseek':Object.freeze({generate:10000,rewrite:2000,'semantic-audit':5000}),
  gemini:Object.freeze({generate:26000,rewrite:7000,'semantic-audit':6000}),
  zai:Object.freeze({generate:16000,rewrite:4000,'semantic-audit':6000}),
  mistral:Object.freeze({generate:10000,rewrite:3500,'semantic-audit':4500}),
  groq:Object.freeze({generate:13000,rewrite:4500,'semantic-audit':5500})
 })
});
export function phaseTimeout({provider,phase,now=Date.now(),turnDeadline,providerDeadline}){
 const base=INTERVIEW_BUDGET.phaseMs[provider]?.[phase];
 if(!base)return 0;
 const overall=Number.isFinite(turnDeadline)?turnDeadline-now-INTERVIEW_BUDGET.commitReserveMs:base;
 const allowance=Number.isFinite(providerDeadline)?providerDeadline-now:base;
 const timeout=Math.floor(Math.min(base,overall,allowance));
 return timeout>=INTERVIEW_BUDGET.minCallMs?timeout:0;
}
