// Public service status. No secrets or internal provider configuration.
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({ok:false,error:'method_not_allowed'});
 return res.status(200).json({ok:true,service:'Prawdziwe Śledztwo',api:'6.38',release:'6.38-RC33-MULTI-MODEL',interviewMaxResponseSeconds:270,aiPolicy:'cloud_with_local_fallback',providers:['apinex-luna','apinex-minimax','apinex-mimo','apinex-glm','apinex-deepseek','apinex-glmx','apinex-muse','apinex-gemini','apinex-deepseekpro','apinex-glmpro','zai','local']});
}
