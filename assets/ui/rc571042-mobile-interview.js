/* RC57.10.42 — view-only interview organization; does not touch STATE. */
(()=>{'use strict';
 const init=()=>{
  const interview=document.getElementById('interview');
  const existing=document.getElementById('ps43Confrontation');
  if(!interview||!existing)return;
  const mq=matchMedia('(max-width: 899px) and (orientation: portrait), (max-width:599px)');
  const frame=document.createElement('details');
  frame.className='ps42-confrontation-wrap';
  const label=document.createElement('summary');
  label.textContent='Konfrontacja zeznań — dodatkowe narzędzie';
  frame.append(label);
  existing.before(frame); frame.append(existing);
  function sync(){
   // Desktop should never lose access to an existing control.
   if(!mq.matches)frame.open=true;
   else if(!frame.dataset.ps42MobileInit){frame.open=false;frame.dataset.ps42MobileInit='1';}
  }
  mq.addEventListener?.('change',sync);sync();
  const portrait=interview.querySelector('.psm-portrait-toggle');
  const portraitOpen=interview.classList.contains('psm-portrait-open');
  if(mq.matches&&portraitOpen&&portrait){
   interview.classList.remove('psm-portrait-open');
   portrait.setAttribute('aria-expanded','false');
   portrait.textContent='Pokaż portret i stan rozmowy';
  }
  window.PS42_UI=Object.freeze({inspect:()=>({mobile:mq.matches,interviewView:interview.classList.contains('psm-show-witnesses')?'witnesses':'chat',confrontationOpen:frame.open,portraitOpen:interview.classList.contains('psm-portrait-open')})});
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
