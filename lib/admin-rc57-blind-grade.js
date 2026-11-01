/* RC57.5: Separate answer key. NEVER import or serialize this in model evidence payload. */
const EXPECTED='MAGDALENA'; // Server-side verdict authority; evaluation only after the model commits.
export function evaluateBlindDecision({phase,decision,validIds}) {
 if(phase!=='complete')return {graded:false,reason:'Etap początkowy ma ograniczone dowody — nie oceniamy zgodności z kanonem.'};
 const selected=decision.suspectId;
 const citations=Array.isArray(decision.evidenceIds)?decision.evidenceIds:[];
 const invalid=citations.filter(id=>!validIds.has(id));
 const minSources=new Set(citations).size>=3;
 const alternative=decision.alternativeId&&decision.alternativeId!==selected;
 const match=selected===EXPECTED;
 return {graded:true,canonMatch:match,sourceIdsValid:!invalid.length,invalidSourceIds:invalid,
  sufficientCitations:minSources,alternativeExamined:!!alternative,
  assessment:!selected?'undetermined':invalid.length?'invalid_evidence':!match?'different_suspect':
    !minSources||!alternative?'incomplete_reasoning':'canon_match_requires_manual_review',
  reasoningReviewRequired:true,
  note:'Zgodność nazwiska nie oznacza udowodnienia winy. Ocena mocy dowodów i alternatyw wymaga przeglądu człowieka.'};
}
