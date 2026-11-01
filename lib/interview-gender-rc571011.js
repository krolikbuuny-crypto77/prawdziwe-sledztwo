/** RC57.10.11: small deterministic morphology guard, not a source of facts.
 * Only first-person past tense common verbs; third-person male references are not flagged. */
const FEMALE=new Set(['ELZBIETA','MAGDALENA']);
const MALE=new Set(['MAREK','TOMASZ','JANUSZ','KAMIL']);
// Explicit patterns avoid false positives from broad stems and ł/łem variants.
const MALE_WORDS=/\b(?:powiedziałem|byłem|widziałem|mówiłem|słyszałem|miałem|chciałem|pracowałem|rozmawiałem|wiedziałem|przebywałem|organizowałem|znalazłem|wyszedłem|poszedłem|zacząłem|zrobiłem|pamiętałem|odpowiadałem|zgłosiłem|potwierdziłem|wychodziłem|sprawdzałem|zauważyłem|ustaliłem|zapisałem)\b/iu;
const FEMALE_WORDS=/\b(?:powiedziałam|byłam|widziałam|mówiłam|słyszałam|miałam|chciałam|pracowałam|rozmawiałam|wiedziałam|przebywałam|organizowałam|znalazłam|wyszłam|poszłam|zaczęłam|zrobiłam|pamiętałam|odpowiadałam|zgłosiłam|potwierdziłam|wychodziłam|sprawdzałam|zauważyłam|ustaliłam|zapisałam)\b/iu;
/** Ignore a quoted utterance only when explicitly attributed to another speaker.
 * Unattributed quotation does NOT exempt a witness from grammar validation.
 * Do not treat this as an AI fact or canonical statement verifier. */
function nonSpeakerDirectSpeech(value){
 let output=String(value||'');
 const patterns=[/„[^”\n]*”/gu,/“[^”\n]*”/gu,/«[^»\n]*»/gu,/"[^"\n]*"/gu,/‘[^’\n]*’/gu];
 for(const pattern of patterns){
  output=output.replace(pattern,(quote,index,full)=>{
   const prefix=full.slice(Math.max(0,index-110),index).trimEnd();
   // A clear attribution, or explicit citation introduced by the witness.
   const attributed=/(?:\b(?:powiedzial|mowil|stwierdzil|zeznal|napisal|odparl|twierdzil|cytuje|cytowal|przytoczyl|uslyszalam|uslyszalem)\w*|\b(?:wedlug|cytujac|slowa|wypowiedz))\b[^.!?\n]{0,65}(?:[:,-]?\s*)$/iu
    .test(prefix.toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l'));
   return attributed?' '.repeat(quote.length):quote;
  });
 }
 return output;
}
export function witnessGenderIssue(id,answer){
 const text=nonSpeakerDirectSpeech(answer);
 const witness=String(id||'').toUpperCase();
 if(FEMALE.has(witness))return MALE_WORDS.test(text)?'female_speaker_male_verb':null;
 if(MALE.has(witness))return FEMALE_WORDS.test(text)?'male_speaker_female_verb':null;
 return null;
}
