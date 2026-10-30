// Kompatybilność z dawnym adresem. Wszystkie analizy przechodzą
// przez tę samą walidację sesji, zaufanych źródeł i limity Supabase.
// Nie przywracaj starej nieautoryzowanej implementacji API.
import evidenceReview from './evidence-review.js';
export default evidenceReview;
