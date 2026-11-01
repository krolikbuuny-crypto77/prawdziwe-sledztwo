/** RC57.10.5: no client trust, no witness-knowledge filtering. Audit sees the
 * full independent evidence selected for the claim, plus its dialogue context.
 * It does NOT need style/coaching that only guides the witness generator.
 */
import {interviewWirePayload as factualWire} from './interview-wire-rc23.js';
export function semanticAuditWire(scene){
 const wire=factualWire(scene);
 // The audit must retain: proposed text, all selected facts, question parts,
 // reference/negation cues, last turns, declaration ledger and strategy.
 return wire;
}

/** Values returned by the provider are authoritative ONLY if its JSON usage
 * metadata includes them. A missing value must remain null (not a guess).
 */
export function safeUsage(data){
 const u=data?.usage;
 const value=(n)=>Number.isSafeInteger(n)&&n>=0?n:null;
 return {inputTokens:value(u?.prompt_tokens??u?.input_tokens),outputTokens:value(u?.completion_tokens??u?.output_tokens)};
}

export function safeModelContextStats(system,payload){
 const context=JSON.stringify(payload);
 return {contextSize:Buffer.byteLength(context,'utf8'),inputCharacters:system.length+context.length,
  inputUtf8Bytes:Buffer.byteLength(system,'utf8')+Buffer.byteLength(context,'utf8')};
}
