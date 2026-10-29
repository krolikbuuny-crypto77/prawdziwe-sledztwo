import rules from './approved-rules.js';
// Sprzeczność NAPISANA PRZEZ AUTORA to nie to samo, co halucynacja modelu.
// Weryfikujemy zgodność z kanonem i odblokowanymi źródłami; nie nazywamy
// automatycznie każdego przemilczenia celowym kłamstwem.
export function classifyCanonicalStatement(witnessId,canonical,approvedEvidence){
 const authored=rules.scriptedCorrections[witnessId];
 if(!authored||!canonical||!Array.isArray(approvedEvidence))return 'unresolved_statement';
 const unlocked=authored.gates.some(list=>list.length&&list.every(id=>approvedEvidence.includes(id)));
 if(unlocked&&authored.text&&canonical.includes(authored.text))return 'scripted_correction';
 return 'unresolved_statement';
}
export function classifyModelReply(semanticAudit,hardGuardPassed){
 return semanticAudit?.relevant===true&&semanticAudit?.entailed===true&&semanticAudit?.complete===true&&hardGuardPassed
  ?'grounded_reply':'model_error';
}
