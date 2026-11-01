"""RC35 browser smoke: two real Chromium pages with shared mocked API, UI snapshot and control takeover."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil, json, time
ROOT=Path(__file__).resolve().parent.parent
HTML=(ROOT/'index.html').read_text(encoding='utf8')
frame=None
room=None
code='ABCDEFGHJ'
clients={}
responses=[]
chat_messages=[]
chat_msg_counter=0
def api(client,path,verb,payload):
 global frame,room,chat_msg_counter
 if path.startswith('/api/coop-chat'):
  if room is None or client not in clients:return {'ok':False,'status':403,'error':'not_in_coop_room'}
  if verb=='GET':
   import urllib.parse
   qs=urllib.parse.parse_qs(urllib.parse.urlparse(path).query)
   after=int(qs.get('after',['0'])[0]); selected=[m for m in chat_messages if m['id']>after]
   return {'ok':True,'messages':[{**m,'own':(m['author']==('Gospodarz' if clients[client]=='owner' else 'Gość'))} for m in selected[-80:]]}
  chat_msg_counter+=1
  role=clients[client]
  m={'id':chat_msg_counter,'author':'Gospodarz' if role=='owner' else 'Gość','own':True,'text':payload['text'],'createdAt':'2026-10-31T14:00:00Z'}
  chat_messages.append(m)
  return {'ok':True,'message':m}
 if not path.startswith('/api/coop'):
  if path=='/api/game-state':return {'ok':False,'status':503}
  if path=='/api/game-session-reset':return {'ok':True}
  return {'ok':False,'status':503}
 action='status' if verb=='GET' else payload.get('action')
 if action=='create':
  frame=payload['frame'];room={'version':1,'controller':'owner','members':{'owner':client},'roomId':'mock-room'}
  clients[client]='owner'
  return {'ok':True,'code':code,'roomId':room['roomId'],'version':1,'controller':True,'owner':True,'players':1,'frame':frame}
 if action=='join':
  if room is None or payload.get('code')!=code:return {'ok':False,'status':404,'error':'room_not_found'}
  if 'guest' in room['members']:return {'ok':False,'status':409,'error':'room_full'}
  room['members']['guest']=client;clients[client]='guest';room['version']+=1
 elif action=='status':
  if room is None or client not in clients:return {'ok':False,'status':404,'error':'not_in_coop_room'}
 elif action=='frame':
  if room is None:return {'ok':False,'status':404}
  if clients[client]!=room['controller']:return {'ok':False,'status':423,'error':'observer'}
  if payload['version']!=room['version']:return {'ok':False,'status':409,'error':'version_conflict'}
  frame=payload['frame'];room['version']+=1
 elif action=='take':
  room['controller']=clients[client];room['version']+=1
 elif action=='leave':
  if clients[client]=='owner':room=None
  else:room['members'].pop('guest',None);room['controller']='owner'
  clients.pop(client,None)
  return {'ok':True}
 elif action not in ['join','status','frame','take']:
  return {'ok':False,'status':400}
 return {'ok':True,'version':room['version'],'controller':clients[client]==room['controller'],'owner':clients[client]=='owner','players':len(room['members']),'frame':frame}
SHIM="""(client) => {
 const memory=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)}});
 window.fetch=async(url,init={})=>{
  const response=await window.rc35Mock(client,String(url),init.method||'GET',init.body?JSON.parse(init.body):{});
  return {ok:response.ok,status:response.status||200,json:async()=>response};
 };
} """
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
 a=browser.new_page();b=browser.new_page()
 errors=[]
 for who,page in [('a',a),('b',b)]:
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.expose_function('rc35Mock',lambda client,path,verb,payload:api(client,path,verb,payload))
  page.evaluate(f'({SHIM})("{who}")')
  page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
  page.evaluate("Object.defineProperty(document,'hidden',{configurable:true,get:()=>false})")
 a.get_by_role('button',name='Utwórz pokój').click()
 a.wait_for_function('window.PS_COOP.active===true',timeout=12000)
 assert a.get_by_text('Kod: '+code).count()==1
 b.get_by_role('button',name='Dołącz').click()
 b.locator('.ps-coop-join input').fill(code)
 b.locator('.ps-coop-join button').click()
 b.wait_for_function('window.PS_COOP.active===true && !window.PS_COOP.controller',timeout=12000)
 # Both users can chat, including the non-controller, without changing game state.
 a.get_by_role('button',name='Czat').click()
 b.get_by_role('button',name='Czat').click()
 a.locator('.ps-coop-chat-input').fill('Sprawdźmy monitoring przed przesłuchaniem.')
 a.evaluate("document.querySelector('.ps-coop-chat-form').addEventListener('submit',()=>{window.chatSubmitObserved=(window.chatSubmitObserved||0)+1;},true);document.querySelector('.ps-coop-chat-form').requestSubmit()")
 try:
  b.wait_for_function("document.querySelector('.ps-coop-chat-items')?.textContent.includes('Sprawdźmy monitoring')",timeout=11000)
 except Exception:
  print('CHAT_DEBUG', {'messages':chat_messages,'a':a.evaluate("({field:document.querySelector('.ps-coop-chat-input')?.value,status:document.querySelector('.ps-coop-chat-status')?.textContent,items:document.querySelector('.ps-coop-chat-items')?.textContent,active:PS_COOP.active})"),'b':b.evaluate("({status:document.querySelector('.ps-coop-chat-status')?.textContent,items:document.querySelector('.ps-coop-chat-items')?.textContent,active:PS_COOP.active})"),'errors':errors,'events':a.evaluate("({observed:window.chatSubmitObserved,html:document.querySelector('.ps-coop-chat-form')?.outerHTML,panel:document.querySelector('.ps-coop-chat-panel')?.hidden})")})
  raise
 b.locator('.ps-coop-chat-input').fill('Tak. Zacznijmy od Marka.')
 b.evaluate("document.querySelector('.ps-coop-chat-form').requestSubmit()")
 a.wait_for_function("document.querySelector('.ps-coop-chat-items')?.textContent.includes('Zacznijmy od Marka')",timeout=11000)
 # Content is displayed as text, not injected HTML.
 a.locator('.ps-coop-chat-input').fill('<img src=x onerror=alert(1)>')
 a.evaluate("document.querySelector('.ps-coop-chat-form').requestSubmit()")
 b.wait_for_function("document.querySelector('.ps-coop-chat-items')?.textContent.includes('<img src=x')",timeout=11000)
 assert b.locator('.ps-coop-chat-items img').count()==0
 assert b.evaluate("document.body.classList.contains('ps-coop-observer')")
 a.evaluate("() => {STATE.notes='Wspólna notatka';document.getElementById('notes').value=STATE.notes;STATE.activeChar='JANUSZ';PS_NAV.open('interview');PS_COOP.mark();}")
 a.evaluate('async()=>{await PS_COOP.flush()}')
 b.evaluate('async()=>{await PS_COOP.refresh()}')
 
 try: b.wait_for_function("PS_NAV.getActive()==='interview' && STATE.notes==='Wspólna notatka' && STATE.activeChar==='JANUSZ'",timeout=9000)
 except Exception as err:
  print('DEBUG',{'room':room,'a':a.evaluate('({active:PS_COOP.active,controller:PS_COOP.controller,tab:STATE.tab,notes:STATE.notes,version:document.querySelector(".ps-coop-info")?.textContent,msg:document.querySelector(".ps-coop-message")?.textContent})'),'b':b.evaluate('({active:PS_COOP.active,controller:PS_COOP.controller,tab:STATE.tab,notes:STATE.notes,version:document.querySelector(".ps-coop-info")?.textContent,msg:document.querySelector(".ps-coop-message")?.textContent})'),'errors':errors,'events':a.evaluate("({observed:window.chatSubmitObserved,html:document.querySelector('.ps-coop-chat-form')?.outerHTML,panel:document.querySelector('.ps-coop-chat-panel')?.hidden})")})
  raise
 assert b.evaluate("document.body.classList.contains('ps-coop-observer')")
 b.get_by_role('button',name='Przejmij sterowanie').click()
 b.wait_for_function('window.PS_COOP.controller',timeout=10000)
 a.wait_for_function('window.PS_COOP.active && !window.PS_COOP.controller',timeout=10000)
 b.evaluate("() => {STATE.notes='Zmiana drugiego gracza';document.getElementById('notes').value=STATE.notes;PS_NAV.open('evidence');PS_COOP.mark();}")
 a.wait_for_function("PS_NAV.getActive()==='evidence' && STATE.notes==='Zmiana drugiego gracza'",timeout=16000)
 assert not errors,errors
 print('PASS RC35.1 Chromium: create, join, shared screen/notes/witness, viewer shield, handoff, reverse mirror, no JS errors')
 browser.close()
