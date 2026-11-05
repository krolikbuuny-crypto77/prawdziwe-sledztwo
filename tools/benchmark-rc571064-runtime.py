"""RC57.10.64 local navigation stress baseline. No API keys; intercept all remote HTTP.\n\nUsage: python tools/benchmark-rc571064-runtime.py [--cycles 6] [--widths 390,1366,1920] [--output path]\nLocal synthetic instrumentation, not a production Lighthouse report.\n"""
from pathlib import Path
import argparse, json, mimetypes, statistics, shutil, sys
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parent.parent
TABS=['overview','evidence','search','interview','timeline','inspection12','notebook','labs','deduction','final']

def q(vals, pct):
    if not vals: return None
    vals=sorted(vals)
    return round(vals[min(len(vals)-1, int((len(vals)-1)*pct))],3)

def summarize(items):
    return {'count':len(items),'medianMs':round(statistics.median(items),3) if items else None,
            'p95Ms':q(items,.95),'maxMs':round(max(items),3) if items else None}

def main():
    cli=argparse.ArgumentParser();cli.add_argument('--cycles',type=int,default=6);cli.add_argument('--widths',default='390,1366,1920');cli.add_argument('--output',default='QA-RC571064/runtime-benchmark.json');args=cli.parse_args()
    widths=[int(x) for x in args.widths.split(',')]
    if args.cycles<2: raise ValueError('Use >=2 cycles to check longevity')
    html=(ROOT/'index.html').read_text('utf8')
    errors=[];data=[]
    with sync_playwright() as p:
        browser=p.chromium.launch(executable_path=shutil.which('chromium'),headless=True,
                                  args=['--no-sandbox','--disable-dev-shm-usage','--enable-precise-memory-info'])
        for width in widths:
            height=844 if width==390 else 768 if width==1366 else 1080
            ctx=browser.new_context(viewport={'width':width,'height':height},device_scale_factor=1,reduced_motion='reduce',locale='pl-PL',timezone_id='Europe/Warsaw')
            page=ctx.new_page();page.on('pageerror',lambda error,width=width:errors.append(f'{width}px {error}'))
            requestCounts={'local':0,'blocked':0}
            def respond(route):
                url=route.request.url
                if not url.startswith('https://qa.game/'):
                    requestCounts['blocked']+=1
                    route.abort('blockedbyclient');return
                requestCounts['local']+=1
                rel=url.split('qa.game/',1)[-1].split('#')[0].split('?')[0]
                target=(ROOT/rel).resolve()
                if target.is_relative_to(ROOT) and target.is_file():
                    route.fulfill(status=200,body=target.read_bytes(),content_type=mimetypes.guess_type(str(target))[0] or 'application/octet-stream')
                else: route.fulfill(status=404,body='')
            page.route('**/*',respond)
            # The base is important when using set_content: all real hashed CSS/JS must load.
            source=html.replace('<head>','<head><base href="https://qa.game/">',1)
            page.set_content(source,wait_until='load',timeout=60000)
            assert page.evaluate("() => typeof showTab==='function' && typeof STATE==='object'"),f'{width}: game did not load'
            cdp=ctx.new_cdp_session(page)
            cdp.send('Performance.enable')
            def metrics():
                cdp.send('HeapProfiler.collectGarbage')
                pmetrics={x['name']:x['value'] for x in cdp.send('Performance.getMetrics')['metrics']}
                return {'jsHeapUsedMB':round(pmetrics.get('JSHeapUsedSize',0)/1024/1024,4),
                        'domNodes':int(pmetrics.get('Nodes',0)),
                        'domListeners':int(pmetrics.get('JSEventListeners',0)),
                        'layoutCount':int(pmetrics.get('LayoutCount',0)),
                        'recalcStyleCount':int(pmetrics.get('RecalcStyleCount',0))}
            base=metrics();timings=[];progress=[]
            for cycle in range(args.cycles):
                for tab in TABS:
                    sample=page.evaluate('''tab=>{
                      const t=performance.now();showTab(tab);
                      const active=document.querySelectorAll('.section.active');
                      // Force a layout flush to include any synchronous style/layout cost.
                      const layout=active[0]?.getBoundingClientRect().width;
                      return {tab,ms:performance.now()-t,ok:STATE.tab===tab && active.length===1 && active[0]?.id===tab,
                              layout,nodeCount:document.getElementsByTagName('*').length,
                              overflow:document.documentElement.scrollWidth > document.documentElement.clientWidth+2};
                    }''',tab)
                    timings.append({'cycle':cycle,**sample})
                progress.append({'cycle':cycle+1,**metrics()})
            after=metrics()
            ctx.close()
            samples=[t['ms'] for t in timings[10:]] # drop the first warm-up cycle
            byTab={tab:summarize([t['ms'] for t in timings[10:] if t['tab']==tab]) for tab in TABS}
            data.append({'width':width,'runs':len(timings),'navigation':summarize(samples),'byTab':byTab,
                         'baseline':base,'after':after,'progress':progress,
                         'nodeDelta':after['domNodes']-base['domNodes'],
                         'listenerDelta':after['domListeners']-base['domListeners'],
                         'heapDeltaMB':round(after['jsHeapUsedMB']-base['jsHeapUsedMB'],4),
                         'failureCount':sum(not x['ok'] or x['overflow'] for x in timings),
                         'localRequests':requestCounts['local'],'blockedRequests':requestCounts['blocked'],
                         'cycles':args.cycles})
            print(f'{width}px: {len(timings)} tab switches; median {summarize(samples)["medianMs"]}ms; '
                  f'p95 {summarize(samples)["p95Ms"]}ms; nodes {base["domNodes"]}->{after["domNodes"]}; '
                  f'listeners {base["domListeners"]}->{after["domListeners"]}; '
                  f'heap {base["jsHeapUsedMB"]}->{after["jsHeapUsedMB"]}MB; failures {data[-1]["failureCount"]}',flush=True)
        browser.close()
    report={'version':'RC57.10.64','method':'local Chromium with Playwright-fulfilled static resources; no paid API',
            'warning':'Timings are local synchronous tab-switch + layout-flush estimates; JS heap is forced-GC and does not include native/browser memory. No real-network FCP/LCP or memory-leak proof.',
            'errors':errors,'results':data}
    output=ROOT/args.output;output.parent.mkdir(parents=True,exist_ok=True)
    output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print('Page JS errors:', errors[:5],flush=True)
    return 1 if errors or any(r['failureCount'] for r in data) else 0

if __name__=='__main__':sys.exit(main())
