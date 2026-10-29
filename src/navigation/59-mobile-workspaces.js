
(function(){
  'use strict';
  const mobileQuery=window.matchMedia('(max-width: 899px) and (orientation: portrait), (max-width: 599px)');
  const deduction=document.getElementById('deduction');
  const interview=document.getElementById('interview');
  const sourcePanel=deduction?.querySelector('.dd-source-panel');
  const editorPanel=deduction?.querySelector('.dd-editor-panel');
  const characterList=interview?.querySelector('#characterList');
  const chat=interview?.querySelector('.chat');
  if(!deduction||!interview||!sourcePanel||!editorPanel||!characterList||!chat)return;

  function makeTabs(parent,first,second,onSelect){
    const bar=document.createElement('div');bar.className='psm-mobile-tabs';
    bar.setAttribute('role','tablist');bar.setAttribute('aria-label','Przełącznik paneli');
    [first,second].forEach(({id,label,target})=>{
      if(!target.id)target.id='psm-panel-'+id;
      const button=document.createElement('button');button.type='button';button.id='psm-tab-'+id;
      button.textContent=label;button.setAttribute('role','tab');button.setAttribute('aria-controls',target.id);
      button.setAttribute('aria-selected','false');button.dataset.psmView=id;
      target.setAttribute('role','tabpanel');target.setAttribute('aria-labelledby',button.id);
      button.addEventListener('click',()=>onSelect(id,true));bar.append(button);
    });
    bar.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      const buttons=[...bar.querySelectorAll('button')];
      const current=buttons.indexOf(document.activeElement);
      let next=event.key==='Home'?0:event.key==='End'?buttons.length-1:
        (current+(event.key==='ArrowRight'?1:buttons.length-1))%buttons.length;
      event.preventDefault();buttons[next].focus();buttons[next].click();
    });
    parent.parentNode.insertBefore(bar,parent);return bar;
  }

  const deductionTabs=makeTabs(deduction.querySelector('.dd-work'),
    {id:'sources',label:'Źródła i zeznania',target:sourcePanel},
    {id:'editor',label:'Warsztat hipotezy',target:editorPanel},setDeductionView);
  const interviewTabs=makeTabs(interview.querySelector('.charactergrid'),
    {id:'witnesses',label:'Wybór świadka',target:characterList},
    {id:'chat',label:'Przesłuchanie',target:chat},setInterviewView);
  let deductionView='sources',interviewView='witnesses';
  function syncButtons(bar,view){bar.querySelectorAll('button').forEach(b=>{const active=b.dataset.psmView===view;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1;});}
  function setDeductionView(view,focus=false){
    deductionView=view==='sources'?'sources':'editor';
    deduction.classList.toggle('psm-show-sources',deductionView==='sources');
    deduction.classList.toggle('psm-show-editor',deductionView==='editor');
    syncButtons(deductionTabs,deductionView);
    if(focus&&mobileQuery.matches){deductionTabs.scrollIntoView({block:'start',behavior:'smooth'});}
  }
  function setInterviewView(view,focus=false){
    interviewView=view==='witnesses'?'witnesses':'chat';
    interview.classList.toggle('psm-show-witnesses',interviewView==='witnesses');
    interview.classList.toggle('psm-show-chat',interviewView==='chat');
    syncButtons(interviewTabs,interviewView);
    if(focus&&mobileQuery.matches){interviewTabs.scrollIntoView({block:'start',behavior:'smooth'});}
  }
  setDeductionView('sources');setInterviewView('witnesses');
  // UX4's three-step flow already gates the source list; only show tabs at step 2.
  let sourcesWereAvailable=!sourcePanel.hidden;
  function syncDeductionStep(){
    const available=!sourcePanel.hidden;
    deductionTabs.hidden=!available;
    // At steps 1 and 3, sourcePanel is hidden by the existing walkthrough.
    // Never hide the only visible editor behind the mobile tab state.
    if(!available&&deductionView!=='editor')setDeductionView('editor');
    if(available&&!sourcesWereAvailable)setDeductionView('sources');
    sourcesWereAvailable=available;
  }
  new MutationObserver(syncDeductionStep).observe(sourcePanel,{attributes:true,attributeFilter:['hidden']});
  deduction.addEventListener('click',event=>{
    // Selecting a source keeps the source picker usable; switch manually using the visible tab.
    if(event.target.closest('[data-ux4-step="2"]')){setDeductionView('sources');setTimeout(syncDeductionStep,0);}
    if(event.target.closest('[data-ux4-step="1"],[data-ux4-step="3"]'))setTimeout(syncDeductionStep,0);
  });
  // If a source list is dynamically rebuilt, the panel remains mounted and accessible.
  syncDeductionStep();
  characterList.addEventListener('click',event=>{
    if(!mobileQuery.matches)return;
    if(event.target.closest('button,[data-id],.character'))setTimeout(()=>setInterviewView('chat',true),0);
  });
  const portraitToggle=document.createElement('button');portraitToggle.type='button';
  portraitToggle.className='psm-portrait-toggle';portraitToggle.textContent='Pokaż portret i stan rozmowy';
  portraitToggle.setAttribute('aria-expanded','false');
  portraitToggle.setAttribute('aria-controls','witnessStage npc4Panel');
  chat.querySelector('.chathead').append(portraitToggle);
  portraitToggle.addEventListener('click',()=>{
    const open=interview.classList.toggle('psm-portrait-open');
    portraitToggle.setAttribute('aria-expanded',String(open));
    portraitToggle.textContent=open?'Ukryj portret i stan rozmowy':'Pokaż portret i stan rozmowy';
  });
  const updateViewport=()=>{
    if(!mobileQuery.matches){deductionTabs.hidden=true;interviewTabs.hidden=true;return;}
    interviewTabs.hidden=false;syncDeductionStep();
  };
  if(mobileQuery.addEventListener)mobileQuery.addEventListener('change',updateViewport);else mobileQuery.addListener(updateViewport);
  updateViewport();
  window.PS_MOBILE_WORKSPACES={setDeductionView,setInterviewView,inspect:()=>({deductionView,interviewView,mobile:mobileQuery.matches})};
})();
