/** 6.26: scope checks for unusually easy-to-confuse question types.
 * Does not produce new case facts or unlock evidence. Both providers are gated.
 */
const fold=s=>String(s||'').toLocaleLowerCase('pl').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/[^a-z0-9: -]+/g,' ').replace(/\s+/g,' ').trim();
export function questionFocus(question){
 const q=fold(question);
 const finding=/(?:zglosz|zawiadom|powiadom|wezw|alarm|znalezien|znalaz|odkryc|odnalaz)/.test(q);
 const event=/(?:len[ayie]|rudnick|ofiar|cial|pomoc|alarm|znalezien|znalaz|smierc)/.test(q);
 const query=/(?:\bkto\b|\bkim\b|ktorej|godzin|kiedy|komu|czy|kto pierwszy|o jakiej)/.test(q);
 const aboutVictim=/(?:gdzie\s+(?:byla|przebywala)\s+(?:lena|ona)|gdzie\s+(?:byla|przebywala)\s+ofiara)/.test(q);
 const self=/(?:\balibi\b|twoj\w*\s+(?:pobyt|obecnosc|alibi)|swoj\w*\s+(?:pobyt|obecnosc)|\b(?:ty|pan|pani)\s+(?:byl|byla|przebywal)|\b(?:byles|bylas|przebywales|przebywalas)\b|gdzie\s+(?:byles|bylas|przebywales|przebywalas|pan|pani)|\b(?:twoje|pana|pani)\s+(?:miejsce|obecnosc)|co\s+(?:robiles|robilas)\s+(?:miedzy|od|o))/i.test(q);
 if(finding&&event&&query)return 'alarm_report';
 if(self&&!aboutVictim)return 'self_alibi';
 return null;
}
export function relevantForQuestion(question,reply){
 const kind=questionFocus(question),a=fold(reply);
 if(kind==='alarm_report')return /(?:alarm|zglosz|zawiadom|wezw|znalaz|znalezion|odnalaz|powiadom|02:02)/.test(a)&&
    !(/(?:ostatni\w*\s+(?:raz|razem)|ostatni\w*\s+(?:widzial|spotkal))/.test(a)&&!/alarm|zglosz|02:02/.test(a));
 if(kind==='self_alibi')return /(?:\balibi\b|dyzur|zmian|biur|obecnos|przebyw|miejsce|stanowisk|warsztat|zajezd|prac|dyspozytor|sluzb|sesj|nie\s+(?:wiem|pamietam|potrafie|moge)|nie\s+potwierdz|polozen)/.test(a)&&
  !(/(?:len[ayie]|rudnick)/.test(a)&&!/(?:\bja\b|biur|zmian|dyzur|alibi|obecnosc|przebyw|miejsce|prac|polozen)/.test(a));
 return true;
}
