/* RC35.3: show guidance controls inline on mobile; never use a floating helper. */
(()=>{
 'use strict';
 const tools=document.getElementById('ps76Tools');
 const sidebar=document.getElementById('ui14Sidebar');
 const main=document.querySelector('.main');
 if(!tools||!sidebar||!main)return;
 const move=()=>{
  if(window.innerWidth<=1000){
   const coop=main.querySelector('.ps-coop-bar');
   const anchor=coop||main.querySelector('.topbar');
   if(anchor&&tools.previousElementSibling!==anchor)anchor.insertAdjacentElement('afterend',tools);
   tools.classList.add('ps353-mobile-tools');
  }else{
   if(tools.parentElement!==sidebar)sidebar.append(tools);
   tools.classList.remove('ps353-mobile-tools');
  }
 };
 move();
 window.addEventListener('resize',move,{passive:true});
})();
