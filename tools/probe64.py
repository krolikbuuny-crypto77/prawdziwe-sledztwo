from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil
html=(Path(__file__).resolve().parent.parent/'index.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox']);pg=b.new_page(viewport={'width':390,'height':840});pg.set_content(html)
 print(pg.evaluate('''() => {const arc=PS53_QA.arcs.find(x=>x.id==='pressure'), arc2=PS53_QA.arcs.find(x=>x.id==='service');for(const a of [arc,arc2]){for(const id of a.paths[0]){STATE.found.add(id);if(SIM_DEGRADED[id])STATE.sim.verified.push(id);}const e=ps53Entry(a.id);e.choice='careful';e.path=0;}PS64_CONSEQUENCES.render();showTab('deduction');PS64_CONSEQUENCES.prepare('work','MAREK');const b=document.getElementById('chatSend');return {tab:STATE.tab,button:b.outerHTML,rect:b.getBoundingClientRect().toJSON(),ancestors:(()=>{const r=[];let n=b;while(n&&r.length<14){r.push({id:n.id,display:getComputedStyle(n).display,visibility:getComputedStyle(n).visibility,hidden:n.hidden,cls:typeof n.className==='string'?n.className.slice(0,65):''});n=n.parentElement;}return r})()};}'''))
 b.close()
