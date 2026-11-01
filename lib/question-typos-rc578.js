/* RC57.8: conservative OCR-free spelling tolerance for Polish questions.
 * Only the read-only intent interpretation is normalized. Original input, names,
 * times, evidence IDs and player transcript remain UNCHANGED.
 */
const VOCAB=Object.freeze([
 'gdzie','kiedy','dlaczego','skad','ktorej','godzinie','godzina','byles','bylas',
 'przebywales','przebywalas','polnocy','potwierdzic','potwierdzi','potwierdzisz',
 'widziales','widzialas','pamietasz','pamietam','powiedziales','powiedzialas',
 'wczesniej','zeznania','dokumenty','dokument','przesluchanie','alibi',
 'byliscie','spotkales','spotkalas','zgodnosc','obecnosc','warsztacie',
 'dyspozytorni','wychodziles','wychodzilas','zglosiles','zglosilas',
 'rozmawiales','rozmawialas','dowody','dowodu','swiadek','swiadkowie'
]);
const EXACT=new Set(VOCAB);
const BLOCKED=new Set([
 // Valid words near question vocabulary must never be silently rewritten.
 'gdzies','kiedys','godziny','godzine','godzin','dlatego','gdzieniegdzie',
 'skoro','wczoraj','ktory','ktorej','ktora','bylo','byly','bylam','bylamy',
 'byles','bylas','miales','mialas','widzialem','widzialam','powiedzialem',
 'powiedzialam','potwierdzam','pamietaja','pamietala','pamietalem',
 'obecnosci','dokumentacji','warsztatu','dyspozytor','dyspozytora'
]);
const EXPLICIT=new Map([
 ['gdze','gdzie'],['gdzue','gdzie'],['gdzuee','gdzie'],['kiedyy','kiedy'],
 ['polnoccy','polnocy'],['pamietaszz','pamietasz'],['potwirdzic','potwierdzic'],
 ['nei','nie'],['nnie','nie'],['niie','nie'],['pytm','pytam']
]);
// Damerau-Levenshtein distance <= 1, no unbounded fuzzy matching and no corrections
// for tokens shorter than 4 characters (except explicit, unambiguous negation).
const distanceOne=(a,b)=>{
 if(a===b)return true;
 if(Math.abs(a.length-b.length)>1)return false;
 if(a.length===b.length){let diffs=[];for(let i=0;i<a.length;i++)if(a[i]!==b[i])diffs.push(i);
  return diffs.length===1||(diffs.length===2&&diffs[1]===diffs[0]+1&&a[diffs[0]]===b[diffs[1]]&&a[diffs[1]]===b[diffs[0]]);
 }
 let shorter=a.length<b.length?a:b,longer=a.length<b.length?b:a,i=0,j=0,skips=0;
 while(j<longer.length){if(i<shorter.length&&shorter[i]===longer[j]){i++;j++;}else{skips++;j++;if(skips>1)return false;}}
 return true;
};
export function correctIntentTypos(folded){
 const substitutions=[];
 // Compounds, IDs and numeric tokens must remain untouched.
 const text=String(folded||'').replace(/\b[a-z]{3,24}\b/g,(word,offset,source)=>{
  const before=source[offset-1]||'',after=source[offset+word.length]||'';
  if(/[a-z0-9:_-]/.test(before)||/[a-z0-9:_-]/.test(after)||EXACT.has(word)||BLOCKED.has(word))return word;
  const direct=EXPLICIT.get(word);
  if(direct){substitutions.push({from:word,to:direct});return direct;}
  if(word.length<4)return word;
  const matches=VOCAB.filter(v=>Math.abs(v.length-word.length)<=1&&distanceOne(word,v));
  if(matches.length!==1)return word; // Ambiguity -> leave intact, never guess.
  substitutions.push({from:word,to:matches[0]});return matches[0];
 });
 return {text,substitutions};
}
