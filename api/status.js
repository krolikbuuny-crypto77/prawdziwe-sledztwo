// Public service status. No secrets or internal provider configuration.
export default function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({ok:false,error:'method_not_allowed'});
 return res.status(200).json({ok:true,service:'Prawdziwe Śledztwo',api:'6.36',release:'6.36-WITNESS-KNOWLEDGE-RC5',aiPolicy:'required',providers:['zai','groq']});
}
