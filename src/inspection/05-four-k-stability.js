
/* Etap 4: full 4K photo inspection, without selectable lightweight mode. */
(function(){
 'use strict';
 const photos=document.getElementById('et1Photos');
 const img=document.getElementById('et1SceneImage');
 if(photos&&img){
  const warning=document.createElement('p');
  warning.id='et4ImageWarning';
  warning.className='et1-warning';
  warning.hidden=true;
  warning.setAttribute('role','status');
  warning.textContent='Nie udało się wyświetlić fotografii 4K. Badanie i zabezpieczanie dowodów pozostają dostępne na planie oględzin poniżej.';
  const stage=photos.querySelector('.et1-photo-stage');
  if(stage)stage.insertAdjacentElement('afterend',warning);
  img.addEventListener('error',()=>{img.style.visibility='hidden';warning.hidden=false;});
  img.addEventListener('load',()=>{img.style.visibility='';warning.hidden=true;});
 }
 document.getElementById('chatInput')?.setAttribute('maxlength','2000');
 window.PS_ETAP4_QA={
  check:()=>({...(window.PS_ETAP2_QA?.check()||{}),minigames:['tcmsPanel','msgPanel','cctvPanel','forensicPanel','accessPanel'].every(id=>!!document.getElementById(id)),audits:window.stage3?.count()}),
  chatVisible:()=>document.getElementById('chatLog')?.querySelectorAll('.bubble').length||0
 };
})();
