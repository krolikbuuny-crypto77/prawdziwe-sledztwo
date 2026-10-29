
/* Etap 6.3: odciążenie renderowania rozmów; nie zmienia stanu śledztwa,
   zapisu, wiedzy NPC, progów, zasad dowodowych ani żadnego zakończenia. */
(function(){'use strict';
 const witness=document.getElementById('interview');
 if(!witness||typeof STATE==='undefined'||typeof renderChat!=='function')return;
 // Historia nadal pozostaje w STATE.dialogues, a przycisk „Pokaż wcześniejsze”
 // pozwala doczytać pozostałe wiadomości w partiach po 120.
 const narrow=window.matchMedia('(max-width:620px)').matches;
 const visibleDefault=narrow?48:84;
 try{
  if(typeof CHAT_VISIBLE!=='undefined' && typeof CONTENT!=='undefined'){
   for(const c of CONTENT.characters){
    if(!Object.prototype.hasOwnProperty.call(CHAT_VISIBLE,c.id)) CHAT_VISIBLE[c.id]=visibleDefault;
   }
  }
 }catch(e){ /* Utrzymanie oryginalnego renderowania, jeżeli stan nie istnieje. */ }
 // Inicjuj asynchroniczne dekodowanie statycznych fotografii; nie zmieniaj
 // adresu, rozdzielczości ani jakości żadnego obrazu.
 document.querySelectorAll('img').forEach(img=>{
  img.decoding='async';
  if(!img.hasAttribute('loading'))img.loading='lazy';
 });
 // Zduplikowany panel jest jedynie wizualizacją, nie źródłem stanu NPC.
 // CSS ukrywa go, więc nie trzeba usuwać procedur ani zmieniać ich efektów.
 window.PS63_QA=Object.freeze({
  version:'6.3',
  status:()=>({
   documents:STATE.found?.size??0,
   active:STATE.tab,
   characters:typeof CONTENT!=='undefined'?CONTENT.characters.length:0,
   hiddenDuplicateMeters:!!document.getElementById('psMeter'),
   npcMetrics:document.querySelectorAll('#npc4Meters .npc4-metric').length,
   mobileBatch:narrow?visibleDefault:null,
   images:document.querySelectorAll('img').length
  })
 });
})();
