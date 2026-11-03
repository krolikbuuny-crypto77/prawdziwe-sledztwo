/* RC57.10.49: reorganizuje jedynie elementy DOM; nie dotyka AI, zapisów ani postępu. */
(()=>{'use strict';
function init(){
  const nav=document.getElementById('nav');
  if(nav&&!nav.querySelector('.ps49-nav-group')){
    [['overview','SPRAWA I ROZMOWY'],['timeline','ANALIZA MATERIAŁU'],['final','ZAMKNIĘCIE SPRAWY']].forEach(([tab,label])=>{
      const target=nav.querySelector(`[data-tab="${tab}"]`);
      if(!target)return;
      const title=document.createElement('span');title.className='ps49-nav-group';title.textContent=label;
      nav.insertBefore(title,target);
    });
  }
  const front=document.querySelector('#overview .ps38-front-grid');
  const welcome=document.getElementById('ps2Welcome');
  if(front&&welcome&&!document.getElementById('ps49StartHelp')){
    const fold=document.createElement('details');fold.className='ps49-help-fold';fold.id='ps49StartHelp';
    const summary=document.createElement('summary');summary.textContent='Pierwsze trzy czynności — pokaż wskazówki';
    fold.append(summary);welcome.before(fold);fold.append(welcome);
    // Skrót nawigacji wewnątrz Pulpitu ma nadal otwierać sekcję.
    document.querySelectorAll('#overview .ps36-section-index button').forEach(btn=>{
      if(/pierwsze kroki/i.test(btn.textContent||'')) btn.addEventListener('click',()=>{fold.open=true;},{capture:true});
    });
  }
  const chat=document.querySelector('#interview .chat');
  const tools=chat?.querySelector(':scope > .ps21-tools');
  const foot=chat?.querySelector(':scope > .chatfoot');
  if(chat&&tools&&foot&&!chat.querySelector(':scope > .ps49-interview-tools')){
    const fold=document.createElement('details');fold.className='ps49-interview-tools';
    const summary=document.createElement('summary');summary.textContent='Narzędzia rozmowy, sposób przesłuchania i dowody';
    fold.append(summary);foot.after(fold);fold.append(tools);
    // Narzędzia pozostają otwarte, gdy gracz korzysta z ich formularzy.
    tools.querySelectorAll('input,select,button,textarea').forEach(el=>el.addEventListener('focus',()=>{fold.open=true}));
  }
  window.PS49_LAYOUT=Object.freeze({inspect:()=>({
    navGroups:document.querySelectorAll('#nav .ps49-nav-group').length,
    caseHelp:!!document.getElementById('ps49StartHelp'),
    interviewTools:!!document.querySelector('#interview .ps49-interview-tools'),
    tabs:document.querySelectorAll('#nav button[data-tab]').length
  })});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>requestAnimationFrame(init),{once:true});
else requestAnimationFrame(init);
})();
