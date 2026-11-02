/* RC57.10.23: presentation only; facts and progress come from existing UI. */
(()=>{'use strict';
 const init=()=>{
  const toolbar=document.querySelector('.topbar'); if(!toolbar)return;
  const label=document.getElementById('ps23ProgressLabel');
  const fill=document.getElementById('ps23ProgressFill');
  const sync=()=>{
   const track=document.querySelector('#overview .ui14-progress-track span');
   const meter=track?.style?.width||'';
   if(fill)fill.style.width=/^\d+(?:\.\d+)?%$/.test(meter)?meter:'0%';
   const stage=document.querySelector('.sidebar');
   const stageMatch=(stage?.textContent||'').match(/Etap\s+(\d+)\s*\/\s*(\d+)/i);
   if(stageMatch){
    if(label)label.textContent='Etap '+stageMatch[1]+'/'+stageMatch[2];
    if(fill && (!/^\d+(?:\.\d+)?%$/.test(meter) || meter==='0%')) fill.style.width=(Math.min(100,Math.round(100*Number(stageMatch[1])/Number(stageMatch[2]))))+'%';
   }else if(label)label.textContent='Śledztwo w toku';
  };
  sync();
  // Cosmetic progress read from the existing UI, never from a fabricated counter.
  const src=document.querySelector('#overview .ui14-progress-track');
  if(src)new MutationObserver(sync).observe(src,{subtree:true,attributes:true,childList:true,characterData:true});
  const stage=document.querySelector('.sidebar');
  if(stage)new MutationObserver(sync).observe(stage,{subtree:true,attributes:false,characterData:true,childList:true});
  const chat=document.querySelector('#interview .chat');
  const extras=['ps47Psychology','ps42Memory','ps620WitnessBeat','ps621ThreadCue','psbPanel'];
  if(chat&&!chat.querySelector('.ps23-extras')){
   const fold=document.createElement('details');fold.className='ps23-extras';
   const sum=document.createElement('summary');sum.textContent='Szczegóły psychologii i pamięci rozmowy';fold.append(sum);
   extras.forEach(id=>{let node=document.getElementById(id);if(node&&chat.contains(node))fold.append(node);});
   if(fold.children.length>1)chat.append(fold);
  }
  const root=document.querySelector('.ps-coop-bar');
  if(root && !document.querySelector('.ps23-coop-fold')){
   const panel=document.createElement('details');panel.className='ps23-coop-fold';
   const summary=document.createElement('summary');summary.textContent='Wspólna gra';panel.append(summary,root);
   toolbar.append(panel);
  }
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
