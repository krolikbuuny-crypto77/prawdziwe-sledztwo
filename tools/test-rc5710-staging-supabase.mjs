/* OPTIONAL REAL staging integration; intentionally never targets production by default.
 * Needs isolated test Supabase with migrations 001–007, and explicit consent.
 * This file does not contain API keys and never gets executed automatically on deployment.
 */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
const target=process.env.RC5710_STAGING_SUPABASE_URL;
const credential=process.env.RC5710_STAGING_SERVICE_ROLE_KEY;
if(!target||!credential||process.env.RC5710_STAGING_CONFIRM!=='I_CONFIRM_TEST_DATABASE'){
 console.log('SKIP RC57.10: brak oddzielnego Supabase staging / jawnego potwierdzenia. Produkcyjnych zapisów nie zmieniono.');process.exit(0);
}
if(!/^https:\/\/[^/]+\.supabase\.co\/?$/.test(target))throw Error('Only an explicit isolated Supabase project URL is permitted');
process.env.SUPABASE_URL=target;
process.env.SUPABASE_SERVICE_ROLE_KEY=credential;
process.env.GAME_SESSION_SECRET='RC5710_STAGING_TEST_SECRET_PROTECTED_DO_NOT_DEPLOY';
const {loadSession,commitSession,deleteSession,initialState}=await import('../lib/server-state.js');
const uuid=crypto.randomUUID();
try{
 const first=await loadSession(uuid);assert.equal(first.revision,0);
 const state={...initialState(),visitedAreas:['med']};
 const [a,b]=await Promise.all([commitSession(uuid,0,state),commitSession(uuid,0,state)]);
 assert.equal(Number(a)+Number(b),1,'Concurrent writes must CAS');
 const after=await loadSession(uuid);assert.equal(after.revision,1);assert.deepEqual(after.state.visitedAreas,['med']);
 console.log('PASS RC57.10: Supabase staging CAS conflict, readback and migration-compatible state.');
}finally{await deleteSession(uuid);}
