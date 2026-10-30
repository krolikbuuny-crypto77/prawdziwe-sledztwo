/* Styl naturalnych przesłuchań. Nie jest źródłem faktów, dowodów ani zeznań.
 * Bezpieczne źródło wiedzy: tylko factBank i zatwierdzona historia.
 */
const VOICES=Object.freeze({
 MAREK:'Marek: opanowany kierownik. Nie recytuje procedur; odpowiada konkretnie, czasem niechętnie. Gdy czegoś nie wie, mówi to bez usprawiedliwiającego wykładu.',
 TOMASZ:'Tomasz: mówi krótkimi zdaniami. Zmęczenie wyraża wahanie, nie automatyczny lęk. Nie odtwarza z pamięci nieznanych minut.',
 JANUSZ:'Janusz: potoczne, warsztatowe słownictwo, bez korporacyjnego języka. Może zapytać, o jaki wpis chodzi, zamiast od razu wygłaszać obronę.',
 ELZBIETA:'Elżbieta: dokładna i oszczędna w słowach. Nawet przy trudnym temacie Leny nie mówi jak protokół sądowy; smutek nie stanowi przyznania się.',
 KAMIL:'Kamil: rzeczowy technik. Mówi naturalnie: karta, zapis, log, człowiek. Nie musi za każdym razem wygłaszać definicji tych pojęć.',
 MAGDALENA:'Magdalena: spokojna, uważna i kontrolująca własne słowa. Nie jest maszyną do zaprzeczania. Może poprosić o dokument, dopytać o podstawę wniosku albo krótko powiedzieć, czego nie widziała — tylko zgodnie z faktami.'
});
export function spokenStyleGuide(witnessId,question,parts=[]){
 if(!VOICES[witnessId])return '';
 const compound=Array.isArray(parts)&&parts.length>1;
 return [
  VOICES[witnessId],
  'Odpowiadasz żywemu człowiekowi w przesłuchaniu, nie piszesz uzasadnienia prawnego ani streszczenia akt. Zareaguj najpierw na sens ostatniego pytania.',
  compound?'Pytanie ma kilka części: odnieś się do każdej, krótko i bez zmyślania informacji.':'Przy pojedynczym pytaniu preferuj jedno lub dwa krótkie zdania (zwykle do 45 słów). Nie rozwijaj wykładu.',
  'Naturalna polszczyzna: czasem wystarczy „Nie wiem”, „Nie pamiętam” lub „Tego nie widziałam” — ale wyłącznie jeśli jest to zgodne z dozwolonymi faktami. Bez zaprogramowanych kwestii.',
  'Jeżeli pytanie zakłada nieudowodniony fakt, nie potwierdzaj założenia. Powiedz krótko, na czym polega luka. Nie oznacza to oskarżenia gracza o kłamstwo.',
  'Możesz zadać JEDNO krótkie pytanie zwrotne, jeśli ma ono sens i nie ujawnia żadnej nieznanej informacji. Nie używaj go zamiast odpowiedzi, gdy dozwolone fakty pozwalają odpowiedzieć.',
  'Unikaj formułek: „wyciąga pan zbyt daleko idące wnioski”, „w świetle przedstawionych materiałów”, „na podstawie dostępnych informacji”, „pragnę podkreślić”, „niniejszym”, „należy zauważyć”.',
  'Nie sygnalizuj emocji didaskaliami typu „*spogląda nerwowo*”. Mimika jest obsługiwana osobno. Napięcie wyrażaj doborem słów, jeśli wynika z kontekstu.',
  'Nie wyjaśniaj graczowi mechaniki dowodów, silników AI ani reguł fabularnych. Nie używaj każdego pytania jako okazji do wygłoszenia przemowy.',
  'Bez średników w dialogu. W mowie używaj naturalnych krótkich zdań oddzielonych kropką.',
  'Wypowiedź musi pozostać zgodna z factBank, wcześniej udokumentowanymi sprostowaniami i granicami wiedzy; stylista nigdy nie może tworzyć nowego faktu.'
 ].join(' ');
}
const BUREAUCRATIC=[
 /wyciąga(?:\s+pan|\s+pani)?\s+z(?:\s+tego|\s+niego)?\s+zbyt\s+daleko\s+idące\s+wnioski/i,
 /w świetle (?:przedstawionych|zgromadzonych|dostępnych) (?:materiałów|dowodów)/i,
 /na podstawie dostępnych (?:mi |nam )?informacji (?:nie |mogę|uważam)/i,
 /pragnę (?:podkreślić|zaznaczyć|wyjaśnić)/i,
 /należy (?:wyraźnie )?zauważyć,? że/i,
 /niniejszym (?:oświadczam|stwierdzam)/i,
 /to zagadnienie wymaga (?:szerszego|dogłębnego|kompleksowego)/i,
 /nie jestem w stanie jednoznacznie (?:stwierdzić|potwierdzić),? (?:że|czy)/i
];
/** To filtr szczególnie sztucznych odpowiedzi, NIE sprawdzenie prawdziwości.
 * Zgodność z faktami sprawdza osobny hardGuard + audyt semantyczny.
 */
export function reviewSpokenReply(text,{compound=false}={}){
 if(typeof text!=='string'||!text.trim())return {ok:false,reason:'empty'};
 const words=text.trim().split(/\s+/).filter(Boolean);
 if(words.length>(compound?130:85))return {ok:false,reason:'overlong'};
 if((text.match(/\?/g)||[]).length>1&&!compound)return {ok:false,reason:'too_many_questions'};
 if(/[<>]/.test(text)||/\*[^*\n]+\*/.test(text)||/^\s*(?:świadek|magdalena|marek|tomasz|elżbieta|janusz|kamil)\s*:/im.test(text))return {ok:false,reason:'stage_directions'};
 if(BUREAUCRATIC.some(x=>x.test(text)))return {ok:false,reason:'bureaucratic'};
 const phrases=text.split(/[.!?]+/).map(x=>x.trim()).filter(Boolean);
 if(!compound&&phrases.length>5)return {ok:false,reason:'lecture'};
 return {ok:true,reason:'spoken'};
}
export const SPOKEN_STYLE_VERSION='6.23';

/** Interpunkcja w mowie świadka, bez ingerowania w fakty, nazwy i liczby. */
export function normalizeWitnessSpeech(text){
 if(typeof text!=='string')return '';
 return text.replace(/\s*;\s*([a-ząćęłńóśźż])/g,(_,letter)=>'. '+letter.toLocaleUpperCase('pl')).replace(/\s*;\s*/g,'. ').replace(/\s+/g,' ').trim();
}
