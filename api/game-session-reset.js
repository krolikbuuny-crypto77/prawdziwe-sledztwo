import {hasCoopCookie} from '../lib/coop-session-rc35.js';
// Świadomie nowa gra = nowa sesja; brak przejęcia postępu poprzedniej rozgrywki.
import {configured,checkOrigin,sessionId,clearSessionCookie,deleteSession} from '../lib/server-state.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).json({ok:false,error:'method_not_allowed'});
 if(!checkOrigin(req))return res.status(403).json({ok:false,error:'origin_rejected'});
 if(req.headers?.['x-ps-client']!=='game'||req.headers?.['content-type']?.split(';')[0]!=='application/json')return res.status(415).json({ok:false,error:'invalid_content_type'});
 if(!configured())return res.status(503).json({ok:false,error:'supabase_not_configured'});
 if(hasCoopCookie(req))return res.status(409).json({ok:false,error:'leave_coop_before_reset'});
 try{const id=sessionId(req,res);await deleteSession(id);clearSessionCookie(req,res);return res.status(200).json({ok:true});}
 catch{return res.status(503).json({ok:false,error:'state_store_unavailable'});}
}
