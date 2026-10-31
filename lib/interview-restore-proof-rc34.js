/** RC34: authenticates the *wording* of a past server response, never case facts. */
import {createHmac,timingSafeEqual,createHash} from 'node:crypto';
const canon=x=>JSON.stringify([x.witnessId,x.question,x.text,x.turnId,x.provider,x.model||'',x.evidenceId||null]);
export function signInterviewExcerpt(x){
 const secret=process.env.GAME_SESSION_SECRET;
 if(typeof secret!=='string'||secret.length<32)return null;
 return createHmac('sha256',secret).update('ps-rc34-interview-quote-v1\n'+canon(x)).digest('base64url');
}
export function verifyInterviewExcerpt(x,proof){
 if(typeof proof!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(proof))return false;
 const actual=signInterviewExcerpt(x);if(!actual)return false;
 const a=Buffer.from(actual),b=Buffer.from(proof);
 return a.length===b.length&&timingSafeEqual(a,b);
}
export function restoreHash(witnessId,question,text){return createHash('sha256').update(JSON.stringify([witnessId,question,text])).digest('hex');}
