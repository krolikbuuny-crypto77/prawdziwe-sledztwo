/** 6.36 III: one monotonic (wall-clock) allowance for an entire interview turn.
 * Reserve time for Groq, and leave time for writing the accepted testimony.
 * Never launch Groq unless Z.ai failed/rejected; never accept an unaudited paraphrase.
 */
export const INTERVIEW_BUDGET=Object.freeze({
 totalMs:46000, zaiWindowMs:25000, commitReserveMs:1500,
 minCallMs:950,
 phaseMs:Object.freeze({
  gemini:Object.freeze({generate:27000,rewrite:7000,'semantic-audit':8000}),
  zai:Object.freeze({generate:22000,rewrite:5500,'semantic-audit':6500}),
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
