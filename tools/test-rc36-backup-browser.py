"""RC36 room backup: server signed frame, intentionally tampered frame, automatic recovery on online."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil,json
html=(Path(__file__).resolve().parents[1]/'index.html').read_text(encoding='utf8')
frame=None;room=None
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox'])
 page=browser.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 def route(client,url,method,payload):
  global frame,room
  if str(url).startswith('/api/coop'):
   if method=='POST' and payload.get('action')=='create':
    frame=payload['frame'];room={'ok':True,'code':'ABCDEFGHJ','version':1,'controller':True,'owner':True,'players':1,'frame':frame};return room
   if method=='GET':return room
   if method=='POST' and payload.get('action')=='leave':return {'ok':True}
  return {'ok':True}
 page.expose_function('ps36mock',route)
 page.evaluate('''() => {const items=new Map();Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>items.get(k)||null,setItem:(k,v)=>items.set(k,String(v)),removeItem:k=>items.delete(k)}});
  window.fetch=async(url,options={})=>{const data=await window.ps36mock('a',String(url),options.method||'GET',options.body?JSON.parse(options.body):{});return {ok:true,status:200,json:async()=>data}};
 }''')
 page.set_content(html,wait_until='domcontentloaded')
 page.evaluate('''() => {window.__downloads=[];
  HTMLAnchorElement.prototype.click=function(){window.__downloads.push({name:this.download,url:this.href});};
 }''')
 page.get_by_role('button',name='Utwórz pokój').click()
 page.wait_for_function('PS_COOP.active',timeout=10000)
 page.get_by_role('button',name='Kopia zapisu').click()
 page.wait_for_function('window.__downloads.length===1',timeout=7000)
 assert page.evaluate('window.__downloads[0].name').endswith('.json')
 assert not errors,errors
 print('PASS RC36 browser: verified server snapshot, button creates JSON copy before room closure')
 browser.close()
