/** Deterministic witness objectives and response policy; never a disclosure authority. */
import {registry} from './witness-engine-rc22.js';
const goals={
 MAREK:{protect:'wiarygodność decyzji kierowniczych',face:'wyjaśnienie rozliczenia bez utożsamiania go z ruchem osób',voice:'rzeczowo, z nazwaniem własnej decyzji'},
 TOMASZ:{protect:'rzetelność prowadzenia ruchu i łączności',face:'rozdzielenie dyspozycji od znalezienia Leny',voice:'krótko, według kolejności zdarzeń'},
 JANUSZ:{protect:'odpowiedzialność warsztatu za rzeczywiście wykonaną pracę',face:'różnica między pomiarem a zamknięciem formularza',voice:'konkretnie, językiem warsztatowym'},
 ELZBIETA:{protect:'własna ocena reakcji na ostrzeżenie Leny',face:'różnica między rozmową, projektem a doręczeniem',voice:'uważnie i osobiście, bez nadmiernej skruchy'},
 KAMIL:{protect:'poprawne przypisanie czynności technicznych i uprawnień',face:'odróżnienie urządzenia, konta, karty i człowieka',voice:'technicznie, lecz bez pouczania'},
 MAGDALENA:{protect:'wiarygodność zatwierdzenia zgodności dokumentacji',face:'osobne wyjaśnienie podpisu, oznaczenia części i fizycznej obecności',voice:'precyzyjnie i oszczędnie'}
};
export function chooseWitnessStrategy(id,state,ledger,question,presentedEvidence=null){
 const goal=goals[id];if(!goal)return null;
 const owned=state?.approvedEvidence||registry.rules.initial;
 const gates=registry.rules.scriptedCorrections[id]?.gates||[];
 const ready=gates.some(g=>g.every(key=>owned.includes(key)));
 const relevantExhibit=!!presentedEvidence&&gates.some(g=>g.includes(presentedEvidence.id));
 const earlier=(ledger?.recent||[]).at(-1);
 const correctionUsed=(ledger?.corrections||[]).length>0;
 const correctionQuoted=(ledger?.corrections||[]).some(e=>e.verbatimCorrection===true);
 const follow=/^(?:a\s+)?(?:dlaczego|czemu|po co)[ ?!.]*$/i.test(question);
 const repeatLimit=earlier?.status==='reported-knowledge-limit'&&earlier.question.toLowerCase()===String(question).toLowerCase();
 const stage=correctionQuoted?'explain_recorded_correction':correctionUsed?'review_prior_supported_statement':ready&&relevantExhibit?'answer_evidence_confrontation':'protect_role_without_inventing';
 const action=presentedEvidence?'address_presented_evidence':follow?'explain_last_declaration':repeatLimit?'state_specific_limit_and_verifiable_source':earlier?.status==='clarification-request'?'resolve_clarification_or_ask_one_focused_question':'answer_current_request';
 return {version:2,authority:'behavior-policy-not-facts-or-unlocks',goal,stage,action,
  previouslyUsedCorrectionSource:correctionUsed,previouslyQuotedCorrection:correctionQuoted,
  invariants:['Nie zaprzeczaj poprzedniej wypowiedzi bez wyraźnego sprostowania opartego na factBank.','Nie recytuj obowiązków zamiast odpowiedzi na własną czynność.','Wstyd, nacisk i powtórzenie pytania nie są warunkiem przyznania się.','Użycie źródła sprostowania w przeszłości nie dowodzi wypowiedzenia całej jego treści; sprawdź cytat w dzienniku.','Wolno ujawnić tylko fakty obecne w bieżącym factBank.'],
  correctionPolicy:ready?'Bramki dowodowe są spełnione; odpowiadaj na konkretny zarzut z dozwolonych źródeł.':'Nie zastępuj brakującej konfrontacji emocjonalnym wyznaniem.'};
}
