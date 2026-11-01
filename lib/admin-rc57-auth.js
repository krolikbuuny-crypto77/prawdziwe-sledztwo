/* RC57 private test dashboard. Server side only: never import this into the game UI. */
import crypto from 'node:crypto';

const COOKIE='__Host-ps57';
const LIFE=4*60*60*1000;
const loginFailures=new Map(); // additional best-effort control, NOT shared across serverless instances
const digest=v=>crypto.createHash('sha256').update(String(v)).digest();
const equal=(a,b)=>a.length===b.length&&crypto.timingSafeEqual(a,b);
const key=()=>process.env.RC57_ADMIN_SECRET||'';
export const configured=()=>typeof process.env.RC57_ADMIN_PASSWORD==='string'&&process.env.RC57_ADMIN_PASSWORD.length>=20&&key().length>=32&&process.env.RC57_ADMIN_SECRET!==process.env.RC57_ADMIN_PASSWORD;
function sign(body){return crypto.createHmac('sha256',key()).update('rc57-auth-v1:'+body).digest('base64url');}
function cookie(req){return String(req.headers?.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='))?.slice(COOKIE.length+1)||'';}
export function authorized(req){
 if(!configured())return false;
 const pieces=cookie(req).split('.');if(pieces.length!==3)return false;
 const [issued,nonce,sig]=pieces;
 if(!/^\d{13}$/.test(issued)||!/^[a-f0-9]{32}$/.test(nonce)||!/^[A-Za-z0-9_-]{43}$/.test(sig))return false;
 const age=Date.now()-Number(issued);if(age<0||age>=LIFE)return false;
 return equal(Buffer.from(sig),Buffer.from(sign(issued+'.'+nonce)));
}
export function verifyPassword(input){return configured()&&typeof input==='string'&&input.length<=256&&equal(digest(input),digest(process.env.RC57_ADMIN_PASSWORD));}
function fingerprint(req){const ip=String(req.headers?.['x-real-ip']||req.headers?.['x-forwarded-for']||req.socket?.remoteAddress||'unknown').split(',')[0].slice(0,100);return crypto.createHash('sha256').update(ip).digest('hex').slice(0,24);}
export function loginAllowed(req){const id=fingerprint(req),current=loginFailures.get(id);return !current||current.until<=Date.now()||current.count<5;}
export function registerLogin(req,success){const id=fingerprint(req);if(success){loginFailures.delete(id);return;}const now=Date.now(),p=loginFailures.get(id);const state=!p||p.until<now?{count:1,until:now+10*60*1000}:{count:p.count+1,until:p.until};loginFailures.set(id,state);if(loginFailures.size>500)loginFailures.clear();}
export function setSession(res){const issued=String(Date.now()),nonce=crypto.randomBytes(16).toString('hex'),body=issued+'.'+nonce;
 res.setHeader('Set-Cookie',`${COOKIE}=${body}.${sign(body)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=14400`);
}
export function clearSession(res){res.setHeader('Set-Cookie',`${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`);}
export function sameOrigin(req){
 const origin=String(req.headers?.origin||'');if(!origin)return false; // a login/batch POST must originate from the admin page
 try{const u=new URL(origin);const host=String(req.headers?.host||'').toLowerCase();const forwarded=String(req.headers?.['x-forwarded-proto']||'https').split(',')[0].toLowerCase();
  const local=/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host);
  return u.host.toLowerCase()===host&&((u.protocol==='https:'&&forwarded==='https')||(local&&u.protocol==='http:'));
 }catch{return false;}
}
export function securityHeaders(res){res.setHeader('Cache-Control','no-store, max-age=0');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');}
