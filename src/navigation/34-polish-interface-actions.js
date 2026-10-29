
(function(){
 'use strict';
 function ready(){
  const sidebar=document.getElementById('ui14Sidebar');
  const fab=document.getElementById('psFab');
  const panel=document.getElementById('psPanel');
  if(sidebar&&fab){
   let tools=document.getElementById('ps76Tools');
   if(!tools){
    tools=document.createElement('div');tools.id='ps76Tools';tools.className='ps76-tools';
    const caption=document.createElement('div');caption.className='ps76-caption';caption.textContent='POSTĘP I WSKAZÓWKI';
    tools.append(caption);sidebar.append(tools);
   }
   tools.append(fab);
   fab.setAttribute('aria-controls','psPanel');
   fab.setAttribute('aria-label','Otwórz postęp śledztwa i wskazówki');
   fab.setAttribute('aria-expanded',panel&&!panel.hidden?'true':'false');
   fab.addEventListener('click',function(){
    if(document.body.classList.contains('ui14-nav-open')){
     document.getElementById('ui14Close')?.click();
    }
    fab.setAttribute('aria-expanded',panel&&!panel.hidden?'true':'false');
   });
   if(panel){
    panel.setAttribute('aria-modal','false');
    const observer=new MutationObserver(()=>fab.setAttribute('aria-expanded',panel.hidden?'false':'true'));
    observer.observe(panel,{attributes:true,attributeFilter:['hidden']});
   }
  }
  // Loading another investigation is destructive. Ask before replacing current progress.
  const file=document.getElementById('loadFile');
  if(file){
   file.addEventListener('change',async function(event){
    event.stopImmediatePropagation();
    const picked=file.files&&file.files[0];
    if(!picked)return;
    file.value='';
    try{
     if(picked.size>25*1024*1024)throw new Error('Plik zapisu przekracza limit 25 MB.');
     const loaded=JSON.parse(await picked.text());
     psAsk('Wczytanie pliku zastąpi aktualny postęp śledztwa. Jeżeli chcesz go zachować, najpierw anuluj i zapisz swoją grę. Czy kontynuować?',function(){
      try{
       safeLoad(loaded);
       if(typeof psSessionActive!=='undefined')psSessionActive=true;
       document.getElementById('psResumeOffer')?.remove();
       toast('Wczytano zapis sprawy.');
      }catch(err){toast('Nie udało się odczytać zapisu: '+err.message);}
     });
    }catch(err){toast('Nie udało się odczytać zapisu: '+err.message);}
   },true);
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});
 else ready();
})();
