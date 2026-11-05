"""Browser-only transcript layout verification, synthetic dialogue (no API calls)."""
from playwright.sync_api import sync_playwright
from pathlib import Path
import json, mimetypes, urllib.parse, sys
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'QA-RC571058'; OUT.mkdir(exist_ok=True)
TEST_DIALOG=[
 ('npc','Jestem kierownikiem zajezdni. Powiem panu, co robiła zmiana i które dokumenty mogę za to poświadczyć.'),
 ('player','Jakie masz alibi?'),
 ('npc','Nie powiedziałem, że przez całą noc byłem w biurze. Powiedziałem, że odpowiadałem za zmianę i byłem dostępny.'),
 ('player','A co wiesz o Lenie Rudnickiej i jej rozmowach z Januszem Wójcikiem? Czy ktoś jeszcze potwierdza te okoliczności?'),
 ('npc','Znam ludzi z zajezdni, ale nie będę zgadywał. To, co pamiętam osobiście, trzeba oddzielić od dokumentów i od wypowiedzi innych pracowników. Mogę powiedzieć tylko o tym, co zaobserwowałem i za co odpowiadałem.'),
 ('player','Powiedz konkretnie: z kim rozmawiałeś o stanie technicznym tramwaju TW-217?'),
 ('npc','W takim pytaniu trzeba odróżnić ustalenia techniczne od przypuszczeń. Nie potwierdzę rozmowy, której nie pamiętam; sprawdźmy dokumentację zmiany. '*3),
 ('player','Dziękuję.'),
]
checks=[];issues=[];errors=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium', headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page(viewport={'width':1920,'height':1080},device_scale_factor=1,reduced_motion='reduce')
 page.on('pageerror',lambda e:errors.append(str(e)))
 def route(r):
  rel=urllib.parse.unquote(r.request.url.split('qa.game/',1)[-1].split('?')[0].split('#')[0]);f=(ROOT/rel).resolve()
  if f.is_relative_to(ROOT) and f.is_file():r.fulfill(status=200,body=f.read_bytes(),content_type=mimetypes.guess_type(f.name)[0] or 'application/octet-stream')
  else:r.fulfill(status=404,body='')
 page.route('https://qa.game/**',route)
 html=(ROOT/'index.html').read_text().replace('<head>','<head><base href="https://qa.game/">',1)
 page.set_content(html,wait_until='domcontentloaded',timeout=90000)
 page.evaluate('''(sample)=>{ showTab('interview'); const id=STATE.activeChar;STATE.dialogues[id]=sample.map(([role,text])=>({role,text}));renderChat();}''',TEST_DIALOG)
 for w,h in [(1920,1080),(1536,864),(1366,768),(1280,720),(1024,768),(390,844)]:
  page.set_viewport_size({'width':w,'height':h}); page.wait_for_timeout(60)
  if w<=680:
   page.locator('#characterList .character').first.click();page.wait_for_timeout(160)
  dat=page.evaluate('''()=>{
   const el=document.querySelector('#chatLog'), foot=document.querySelector('#interview .chatfoot'),field=document.querySelector('#chatInput'),chat=document.querySelector('#interview .charactergrid>.chat');
   const R=x=>{let r=x.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height}};
   const r=R(el); const bubbles=[...el.querySelectorAll('.bubble')].map(e=>{
    let x=R(e),a=getComputedStyle(e,'::before'),width=parseFloat(a.width)||0;
    const l=parseFloat(a.left),rr=parseFloat(a.right);
    const avatarX=Number.isFinite(l)?x.x+l:(Number.isFinite(rr)?x.right-rr-width:x.x);
    return {...x,role:e.classList.contains('npc')?'npc':'player',font:getComputedStyle(e).fontSize,avatarX,avatarRight:avatarX+width};
   });
   const scroller=()=>{const s=getComputedStyle(el);return [s.display,s.gridTemplateColumns,s.overflowX,s.overflowY]};
   return {view:innerWidth,docScrollWidth:document.documentElement.scrollWidth,log:r,foot:R(foot),input:R(field),chat:R(chat),bubbles,css:scroller(),count:bubbles.length,scrollable:el.scrollHeight>el.clientHeight};
   }''')
  is_big=w>=1025
  def ck(name,ok,details=''):
   checks.append((f'{w}x{h}',name,ok,details))
   if not ok:issues.append((w,h,name,details))
  ck('chat_loaded',dat['count']==len(TEST_DIALOG))
  ck('no_page_overflow',dat['docScrollWidth']<=w+2,dat['docScrollWidth'])
  ck('bubbles_inside_log',all(x['x']>=dat['log']['x']-2 and x['right']<=dat['log']['right']+2 for x in dat['bubbles']))
  ck('bubble_no_collisions',all(a['bottom']<=c['y']+1 for a,c in zip(dat['bubbles'],dat['bubbles'][1:])))
  ck('input_in_chat',dat['input']['x']>=dat['chat']['x']-1 and dat['input']['right']<=dat['chat']['right']+1)
  ck('input_min_height',dat['input']['height']>=40,dat['input']['height'])
  ck('avatars_within_log',all(x['avatarX']>=dat['log']['x']-1 and x['avatarRight']<=dat['log']['right']+1 for x in dat['bubbles']),[(x['role'],round(x['avatarX']),round(x['avatarRight'])) for x in dat['bubbles']])
  if is_big:
   ck('bubble_content_column',all(x['width']<=690 for x in dat['bubbles']))
   ck('central_lane',all(x['x']>dat['log']['x']+33 and x['right']<dat['log']['right']-33 for x in dat['bubbles']))
   ck('chat_width',dat['log']['width']>400,dat['log']['width'])
  if w in (1920,1366):
   # full page screenshot intentionally skipped (expensive)
   page.locator('#chatLog').screenshot(path=str(OUT/f'PROTOKOL-{w}.png'),timeout=12000)
  print(f'CHECK {w}x{h}: log width {dat["log"]["width"]:.0f} columns={dat["css"][1]}, chat input={dat["input"]["height"]:.0f}, bubbles {dat["count"]}',flush=True)
 page.set_viewport_size({'width':1920,'height':1080})
 page.evaluate('''()=>{
  showTab('interview');const id=STATE.activeChar;
  STATE.dialogues[id]=Array.from({length:100},(_,i)=>({role:i%2?'player':'npc',text:(i%2?'Pytanie o okoliczności i dokumenty — ':'Odpowiedź w granicach wiedzy świadka — ')+(i+1)+'; '.repeat(10)}));
  renderChat();
 }''')
 long=page.evaluate('''()=>{const el=document.querySelector('#chatLog'),rows=el.querySelectorAll('.bubble'),last=rows[rows.length-1];return {count:rows.length,stored:STATE.dialogues[STATE.activeChar].length,older:!!el.querySelector('#chatOlder'),scrollTop:el.scrollTop,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight,lastBottom:last.getBoundingClientRect().bottom,logBottom:el.getBoundingClientRect().bottom}}''')
 checks.append(('1920x1080','100_messages_rendered',long['stored']==100 and 50<=long['count']<=100,long))
 checks.append(('1920x1080','long_conversation_scrolls',long['scrollHeight']>long['clientHeight']+200,long))
 checks.append(('1920x1080','latest_message_visible',long['lastBottom']<=long['logBottom']+1,long))
 if long['older']:
  page.evaluate("document.getElementById('chatOlder').click()")
  expanded=page.evaluate("document.querySelectorAll('#chatLog .bubble').length")
  checks.append(('1920x1080','older_history_loads',expanded==100,expanded))
  if expanded!=100:issues.append((1920,1080,'older_history_loads',expanded))
 for name,passed in [('100_messages_rendered',long['stored']==100 and 50<=long['count']<=100),('long_conversation_scrolls',long['scrollHeight']>long['clientHeight']+200),('latest_message_visible',long['lastBottom']<=long['logBottom']+1)]:
  if not passed:issues.append((1920,1080,name,long))
 (OUT/'WYNIKI.json').write_text(json.dumps({'checks':checks,'failures':issues,'errors':errors},ensure_ascii=False,indent=2))
 b.close()
print('RESULT',len(checks), 'PASS',len(checks)-len(issues),'FAIL',issues[:10],'JSERROR',errors[:4],flush=True)
if issues or errors:sys.exit(1)
