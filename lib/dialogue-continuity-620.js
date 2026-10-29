/* Wyłącznie reżyseria stylu. Nie źródło faktów ani ocena uczciwości świadka. */
const normalize=s=>String(s||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
const temperament=Object.freeze({
 MAREK:'Gdy wraca temat własnej decyzji, rozdziel obowiązek od osobistej oceny; bez przesadnej skruchy.',
 TOMASZ:'Gdy wraca pytanie o godzinę, nie rekonstruuj z pamięci nieudokumentowanych minut.',
 JANUSZ:'Przy powrocie do tego samego protokołu odróżniaj wykonanie czynności od jej zapisu.',
 ELZBIETA:'Przy powrocie do ostrzeżenia oddziel poczucie odpowiedzialności od faktycznego doręczenia.',
 KAMIL:'Kiedy wraca sprawa logów, spokojnie odróżniaj urządzenie i konto od człowieka.',
 MAGDALENA:'Przy ponownej konfrontacji pilnuj precyzji sformułowań; nie traktuj niewygodnego pytania jako automatycznej podstawy wyznania.'
});
export function dialogueContinuity(witnessId,history){
 if(!temperament[witnessId]||!Array.isArray(history))return '';
 const qs=history.filter(t=>t&&['player','śledczy'].includes(t.role)).slice(-12).map(t=>normalize(t.text));
 if(!qs.length)return '';
 const accusation=qs.filter(q=>/\b(?:przyznaj sie|przyznajesz sie|zabiles|zabilas|zamordowales|zamordowalas|klamiesz)\b/.test(q)).length;
 const verifying=qs.filter(q=>/(?:skad wiesz|jakie zrod|co potwierdz|co widzial|co widziala|nie mam pewnosci)/.test(q)).length;
 const keys=qs.map(q=>['alibi','godzin','kart','protokol','lena','ostrzez','odbior','obecn','wiadom'].find(x=>q.includes(x))||'');
 const repeats=keys.at(-1)&&keys.slice(0,-1).includes(keys.at(-1));
 let cue=temperament[witnessId];
 if(accusation>verifying+1)cue+=' Zareaguj ostrożnością wobec niepopartego zarzutu, ale kontynuuj odpowiedź na pytanie.';
 else if(verifying>accusation)cue+=' Doceniaj konkretne pytanie o źródła, bez dopowiadania nowych faktów.';
 if(repeats)cue+=' Śledczy ponownie pyta o znany temat; możesz zauważyć powtórzenie, ale nie zmieniaj zeznania bez kanonicznej podstawy.';
 return cue;
}
