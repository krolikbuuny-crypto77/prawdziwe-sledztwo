/* RC57.10.1 — independent, POST-INFERENCE scoring. NEVER serialize this module,
 * verdict authority or scoring heuristics in a blind model prompt.
 * Three dimensions are intentionally separate: canon identity, cited documents,
 * and semantic reasoning. A heuristic warning is a review lead, not a finding of guilt.
 */
const EXPECTED='MAGDALENA';
const SOURCE_CODES=new Set(['unknown_document_in_text','document_not_available_at_stage',
 'unknown_document_in_evidence_list','document_not_available_in_evidence_list']);
const label={
 matches_canon:'Wskazany sprawca jest zgodny z kanonem',
 different_suspect:'Podejrzany różni się od kanonu',
 undetermined:'Brak rozstrzygnięcia',
 not_graded:'Bez oceny nazwiska na etapie początkowym',
 invalid_sources:'Wykryto nieistniejące lub niedostępne źródła',
 insufficient_citations:'Za mało niezależnie wymienionych identyfikatorów źródeł',
 references_valid:'Identyfikatory źródeł są poprawne; interpretacja wymaga kontroli',
 flagged:'Wykryto twierdzenia wymagające kontroli rozumowania',
 manual_review_required:'Brak wykrytych naruszeń heurystycznych — wymagana ręczna ocena'
};
export function evaluateBlindDecision({phase,decision,validIds,qa={}}){
 const staged=phase==='complete', selected=decision?.suspectId||null;
 const citations=Array.isArray(decision?.evidenceIds)?decision.evidenceIds:[];
 const invalid=citations.filter(id=>!validIds.has(id));
 const minSources=new Set(citations.filter(id=>validIds.has(id))).size>=3;
 const alternative=!!(decision?.alternativeId&&decision.alternativeId!==selected);
 const match=staged&&selected===EXPECTED;
 const findings=Array.isArray(qa?.findings)?qa.findings:[];
 const sourceFindings=findings.filter(f=>SOURCE_CODES.has(f.code));
 const reasoningFindings=findings.filter(f=>!SOURCE_CODES.has(f.code));
 const sourceStatus=(invalid.length||sourceFindings.length)?'invalid_sources':!minSources?'insufficient_citations':'references_valid';
 const reasoningStatus=reasoningFindings.length?'flagged':'manual_review_required';
 const verdictStatus=!staged?'not_graded':!selected?'undetermined':match?'matches_canon':'different_suspect';
 const dimensions={
  verdict:{status:verdictStatus,label:label[verdictStatus],canonMatch:staged?match:null},
  evidence:{status:sourceStatus,label:label[sourceStatus],invalidSourceIds:[...new Set([...invalid,...sourceFindings.map(f=>f.evidence).filter(Boolean)])],
   sourceFindings:sourceFindings.length,sufficientCitations:minSources,alternativeExamined:alternative},
  reasoning:{status:reasoningStatus,label:label[reasoningStatus],warningCount:reasoningFindings.length,
   reviewRequired:true,issueCodes:[...new Set(reasoningFindings.map(f=>f.code))]}
 };
 const assessment=!staged?'not_graded':!selected?'undetermined':invalid.length?'invalid_evidence':!match?'different_suspect':
   sourceStatus==='invalid_sources'?'canon_match_with_source_errors':
   reasoningStatus==='flagged'?'canon_match_with_reasoning_warnings':
   !minSources||!alternative?'incomplete_reasoning':'canon_match_requires_manual_review';
 return {graded:staged,canonMatch:staged?match:null,sourceIdsValid:sourceStatus!=='invalid_sources',
  invalidSourceIds:dimensions.evidence.invalidSourceIds,sufficientCitations:minSources,
  alternativeExamined:alternative,assessment,dimensions,reasoningReviewRequired:true,
  ...(staged?{}:{reason:'Etap początkowy ma ograniczone dowody — nie oceniamy zgodności z kanonem.'}),
  note:'Trafne nazwisko nie potwierdza poprawności źródeł ani jakości argumentacji. Kontrola semantyczna jest heurystyczna; weryfikacja człowieka pozostaje konieczna.'};
}
