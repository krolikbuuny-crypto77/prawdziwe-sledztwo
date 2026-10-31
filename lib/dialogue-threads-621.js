/* Pakiet 6.21: informacja o powracających tematach, nie o faktach.
 * Wyłącznie zatwierdzona historia pojedynczego świadka. Żadnych nowych zeznań.
 */
const labels=Object.freeze({chronology:'kolejność i czas zdarzeń',documents:'dokumentacja i obieg informacji',access:'karty dostępu i logi',lena:'Lena i ostatnie kontakty',alibi:'alibi i obecność',technical:'stan techniczny TW-217',motive:'powody działań',responsibility:'odpowiedzialność i zarzuty',sources:'źródła wiedzy'});
const rules=[
 ['access',/(?:t[ -]?17|kart[ayę]|identyfikat|log(?:i|ów|ow|owanie)|sesj|wejści|wejsci)/],
 ['technical',/(?:tw[ -]?217|l[ -]?[23]\b|wagon|usterk|podzespo|warsztat|napraw|odbior)/],
 ['documents',/(?:protok[oó]ł|dokument|zgłosze|zglosze|bhp|ostrzeż|ostrzez|wysył|wysyl|raport)/],
 ['chronology',/(?:kiedy|godzin|czasie|przed|później|pozniej|następn|nastepn|kolejno|noc[yi]|dyżur|dyzur)/],
 ['lena',/(?:lena|leny|lenie|wiadomoś|wiadomos|kontakt)/],
 ['alibi',/(?:alibi|obecnoś|obecnos|widział|widzial|spotkał|spotkal|byłeś|byles|byłaś|bylas)/],
 ['motive',/(?:dlaczego|po co|motyw|pow[oó]d|zdecydowa|zależało|zalezalo)/],
 ['responsibility',/(?:zabił|zabil|zabój|zaboj|wina|odpowiedzial|przyzna|kłam|klam|ukrywa)/],
 ['sources',/(?:skąd|skad|źródł|zrodl|potwierdz|wiesz|dowód|dowod)/]
];
const plain=s=>String(s||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
export function questionTopics(question){const text=plain(question);return rules.filter(([_,pat])=>pat.test(text)).map(([key])=>key).slice(0,5);}
export function buildThreadCue(witnessId,history,currentQuestion){
 const valid=new Set(['MAREK','TOMASZ','JANUSZ','ELZBIETA','KAMIL','MAGDALENA']);
 if(!valid.has(witnessId)||!Array.isArray(history))return '';
 const questions=history.filter(row=>row?.role==='player'||row?.role==='śledczy'||row?.role==='investigator')
  .slice(-40).map(row=>questionTopics(row.text));
 const current=questionTopics(currentQuestion);
 if(questions.length<3)return '';
 const counts=Object.fromEntries(Object.keys(labels).map(k=>[k,questions.filter(row=>row.includes(k)).length]));
 const repeated=current.filter(k=>counts[k]>=2).slice(0,3);
 const previous=[...new Set(questions.slice(-8).flat())].filter(k=>!current.includes(k)).slice(-3);
 const compound=current.length>1;
 const recentRepeated=questions.slice(-4).filter(row=>row.some(k=>current.includes(k))).length>=2;
 const earlierRestatement=history.slice(-16).filter(row=>row?.role==='witness'&&row?.narrativeStatus==='scripted_correction').length>0;
 const chunks=['Kontekst wielowątkowej rozmowy (to WYŁĄCZNIE tematy pytań, nie nowe fakty):'];
 if(compound)chunks.push('Pytanie dotyczy kilku zagadnień: '+current.map(k=>labels[k]).join('; ')+'. Odpowiedz na każdą istotną część w granicach zatwierdzonych faktów.');
 if(repeated.length)chunks.push('Śledczy wraca do: '+repeated.map(k=>labels[k]).join(', ')+'. Możesz nawiązać do wcześniejszej rozmowy, ale bez wymyślania jej dosłownej treści.');
 if(previous.length&&recentRepeated)chunks.push('W rozmowie pojawiały się również: '+previous.map(k=>labels[k]).join(', ')+'. Nie zacieraj różnic między tematami i źródłami.');
 if(earlierRestatement)chunks.push('W historii jest zatwierdzone sprostowanie. Nie cofaj go ani nie twórz kolejnego bez podstaw fabularnych.');
 chunks.push('Historia zeznań jest relacją wypowiedzi, nie dowodem prawdziwości. Kanon i udostępniony bank faktów mają pierwszeństwo.');
 return chunks.join(' ').slice(0,1150);
}
export const THREAD_LABELS=labels;
