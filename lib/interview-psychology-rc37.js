/** RC42/47 — deterministic, bounded style guidance only. Never a case fact, identity or unlock. */
const text=(value,max=90)=>String(value||'').replace(/[<>\u0000-\u001f]/g,' ').trim().slice(0,max);
const fold=s=>text(s,900).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
export function psychologicalDelivery(scene){
 const action=text(scene?.witnessStrategy?.action,80),stage=text(scene?.witnessStrategy?.stage,48),goal=text(scene?.witnessStrategy?.goal,80);
 const prior=Array.isArray(scene?.dialogueMemory?.previousPairs)?scene.dialogueMemory.previousPairs.slice(-24):[];
 const question=fold(scene?.question);
 const repeated=!!scene?.dialogueMemory?.repeatRequested;
 const pressure=/(klam|oszuk|ukryw|przecz|przyznaj|zabil)/.test(question);
 const correction=/(przed chwila|wczesniej|cofn|sprost|popraw|powiedziales)/.test(question);
 const sourced=/(dowod|dokument|log|zapis|rejestr|potwierd)/.test(question);
 const count=prior.length;
 const phase=count>=14?'dluga_rozmowa':count>=5?'pogłębienie':'początek';
 const interlocutor=String(typeof scene?.identity==='string'?scene.identity:scene?.identity?.id||scene?.identity?.name||'').toLowerCase();
 const individual=/(nowicki|marek)/.test(interlocutor)?'rzeczowy, odpowiedzialność za zmianę; rozróżnia kontrolę od osobistej obecności':
  /(krawczyk|tomasz)/.test(interlocutor)?'precyzyjny w logistyce, nie przypisuje rejestrom ludzkich intencji':
  /(wojcik|janusz)/.test(interlocutor)?'konkretny technicznie, oddziela procedurę od obserwacji':
  /(zieba|elzbieta)/.test(interlocutor)?'ostrożna w granicach procedury BHP, oddziela zgłoszenie od decyzji':
  /(brzozowski|kamil)/.test(interlocutor)?'powściągliwy, rozróżnia system i fizyczną obecność':
  /(kaczmarek|magdalena)/.test(interlocutor)?'dokładna, odróżnia zapis audytowy od obrazu osoby':'zachowaj odrębny styl postaci zgodnie z dossier';
 return Object.freeze({authority:'style_only_not_fact',action,goal,stage,phase,individual,
  pressure:pressure?'odpowiedz na zarzut bez automatycznego przyznawania winy':'zwykły kontakt',
  continuity:correction?'odnieś się do konkretnej wcześniejszej odpowiedzi':repeated?'doprecyzuj bez ponownego recytowania':count>=4?'kontynuuj dłuższą rozmowę':'odpowiedz na ostatnie pytanie',
  tension:pressure?'nacisk rozmówcy; odpowiedz na konkretny zarzut bez przyznania nowego faktu':sourced?'wymagane odniesienie do rzeczywiście dostępnego źródła':'zwykłe pytanie',
  trustSignal:correction?'gracz kwestionuje wcześniejszą wypowiedź; wyjaśnij ją, nie zmieniaj faktów':repeated?'pytanie powtórzone; bez mechanicznego recytowania':'brak nowego sygnału',
  fatigueCue:count>15?'zwięźlej i konkretniej, nie utrudniaj graczowi dostępu do już znanych faktów':'naturalny rytm',
  cadence:'krótka odpowiedź na istotę pytania, dopiero potem ograniczenie wiedzy; różne długości wypowiedzi, bez didaskaliów',
  limitation:'To omylny opis stylu, nigdy rzeczywiste emocje lub źródło wiedzy. Nie wymyślaj wydarzeń, czasu, intencji, motywów ani alibi.'});
}
