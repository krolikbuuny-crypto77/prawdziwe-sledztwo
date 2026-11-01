"""Chromium regression: offline events survive reload, then sync with server mock."""
import json,threading,functools,shutil,time
from pathlib import Path
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
RULES=json.loads((ROOT/'lib/approved-rules.json').read_text())
RECEIVED=[]
class Server(SimpleHTTPRequestHandler):
 def log_message(self,*args):pass
 def do_GET(self):
  if self.path=='/api/game-state':
   data=json.dumps({'ok':True,'revision':len(RECEIVED),'state':{'approvedEvidence':RULES['initial']}}).encode()
   self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(data)));self.end_headers();self.wfile.write(data)
  else:super().do_GET()
 def do_POST(self):
  if self.path=='/api/game-state':
   data=json.loads(self.rfile.read(int(self.headers.get('Content-Length','0'))));
   if data.get('revision')!=len(RECEIVED):
    self.send_response(409);self.end_headers();return
   RECEIVED.extend(data['actions'])
   body=json.dumps({'ok':True,'revision':len(RECEIVED),'decisions':[{'id':x['id'],'ok':True} for x in data['actions']],'state':{}}).encode()
   self.send_response(200);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
  else:self.send_error(404)
try:
 with sync_playwright() as p:
  browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium') or None,args=['--no-sandbox'])
  ctx=browser.new_context(viewport={'width':390,'height':844})
  def route(request):
   from urllib.parse import urlparse,unquote
   u=urlparse(request.request.url);name=unquote(u.path).lstrip('/') or 'index.html'
   if u.path=='/api/game-state':
    if request.request.method=='GET':
     request.fulfill(status=200,content_type='application/json',body=json.dumps({'ok':True,'revision':len(RECEIVED),'state':{'approvedEvidence':RULES['initial']}}))
    else:
     data=json.loads(request.request.post_data)
     if data.get('revision')!=len(RECEIVED):request.fulfill(status=409,body='{}');return
     RECEIVED.extend(data['actions'])
     request.fulfill(status=200,content_type='application/json',body=json.dumps({'ok':True,'revision':len(RECEIVED),'decisions':[{'id':x['id'],'ok':True} for x in data['actions']],'state':{}}))
   elif (ROOT/name).is_file():
    suffix=(ROOT/name).suffix
    kind={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.mp3':'audio/mpeg'}.get(suffix,'application/octet-stream')
    request.fulfill(status=200,content_type=kind,body=(ROOT/name).read_bytes())
   else:request.fulfill(status=404,body='missing')
  ctx.route('https://ps617.test/**',route)
  page=ctx.new_page();errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  page.goto('https://ps617.test/',wait_until='domcontentloaded',timeout=30000)
  page.wait_for_function('!!window.PS617_SYNC',timeout=15000)
  ctx.set_offline(True)
  result=page.evaluate('''() => {
   const id=DOCS.find(d=>window.PS_EVIDENCE_PATHS.searchable(d.id)&&!STATE.found.has(d.id)).id;
   STATE.area=byId[id].area; STATE.found.add(id); PS_EVENTS.evidence(id,'area-search');
   return {id,pending:PS617_SYNC.pending,local:STATE.found.has(id)};
  }''')
  assert result['pending']>=1 and result['local'],result
  assert not RECEIVED
  ctx.set_offline(False)
  page.reload(wait_until='domcontentloaded',timeout=30000)
  page.wait_for_function('window.PS617_SYNC && PS617_SYNC.pending===0',timeout=12000)
  assert len(RECEIVED)==1,RECEIVED
  assert RECEIVED[0]['action']['docId']==result['id'],RECEIVED
  assert not errs,errs
  print('PASS browser 6.17: offline evidence event queued, persisted, replayed after reload, no JS exceptions')
  browser.close()
except Exception as e:
 print('BROWSER_TEST_UNVERIFIED:',e)
 raise
