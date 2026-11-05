"""Reproducible local CSS data-size and parser microbenchmark. NOT a real-site page-load benchmark."""
from pathlib import Path
import json, gzip, brotli, statistics, random, shutil
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parent.parent
QA=ROOT/'QA-RC571063';QA.mkdir(exist_ok=True)
manifest=json.loads((ROOT/'src/build-manifest.json').read_text(encoding='utf8'))
raw='\n'.join(''.join((ROOT/part).read_text(encoding='utf8') for part in sec['parts']) for sec in manifest['sections'] if sec['kind']=='style')
prod=next(ROOT.glob('ps-css-*.css')).read_text('utf8')
stats={}
for mode,css in [('before',raw),('after',prod)]:
 b=css.encode('utf8')
 stats[mode]={'rawBytes':len(b),'gzip9Bytes':len(gzip.compress(b,compresslevel=9,mtime=0)),'brotli9Bytes':len(brotli.compress(b,quality=9))}
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=shutil.which('chromium'),args=['--no-sandbox','--disable-dev-shm-usage'])
 page=browser.new_page()
 page.set_content('<html><head><title>CSS parser microbenchmark</title></head><body></body></html>')
 samples=page.evaluate("""([before, after])=>{
   const run=(css)=>{const t=performance.now();const s=new CSSStyleSheet();s.replaceSync(css);return {ms:performance.now()-t,rules:s.cssRules.length};};
   for(let i=0;i<3;i++){run(before);run(after);}
   const result={before:[],after:[]};
   // Alternating order limits systematic warm-up drift.
   for(let i=0;i<24;i++){
     const pair=i%2===0?['before','after']:['after','before'];
     for(const mode of pair){const x=run(mode==='before'?before:after);result[mode].push(x);}
   }
   return result;
 }""",[raw,prod])
 browser.close()
for mode in ('before','after'):
 ms=[v['ms'] for v in samples[mode]]
 stats[mode].update({'ruleCount':samples[mode][0]['rules'],'parserMedianMs':round(statistics.median(ms),3),'parserP95Ms':round(sorted(ms)[int(len(ms)*0.95)],3),'parserRuns':len(ms)})
report={'version':'RC57.10.63','kind':'local synthetic CSS parser microbenchmark, not Vercel performance','runsPerMode':24,'statistics':stats,
 'delta':{k:stats['after'][k]-stats['before'][k] for k in ('rawBytes','gzip9Bytes','brotli9Bytes','ruleCount','parserMedianMs')},
 'limitations':'Local Chromium parser microbenchmark and offline compression; no live HTTP transfer, cache hit or real-user FCP/LCP measured. Do not infer a production speedup.'}
(QA/'css-transfer-and-parser.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(json.dumps(report,ensure_ascii=False,indent=2))
