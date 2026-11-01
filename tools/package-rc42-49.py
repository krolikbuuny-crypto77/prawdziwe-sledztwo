"""Reproducible, local-only staged packages for RC42–RC49. Does NOT deploy."""
from pathlib import Path
from zipfile import ZipFile,ZIP_DEFLATED
import hashlib,json,subprocess,copy,os
root=Path(__file__).resolve().parents[1]
base=Path('/mnt/data/rc41_work')
manifest_path=root/'src/build-manifest.json';compat_path=root/'src/compatibility-contracts.json'
base_manifest=json.loads((base/'src/build-manifest.json').read_text())
base_compat=json.loads((base/'src/compatibility-contracts.json').read_text())
additions={
42:'src/integrations/102-interview-memory-rc42.js',
43:'src/integrations/103-confrontation-rc43.js',
44:'src/story/104-breakthrough-review-rc44.js',
45:'src/integrations/105-timeline-analysis-rc45.js',
46:'src/integrations/106-coop-annotations-rc46.js',
47:'src/integrations/107-psychology-rc47.js',
48:'src/finale/108-review-report-rc48.js',
49:'src/integrations/109-quality-audit-rc49.js'
}
changed_all={
 'lib/interview-psychology-rc37.js',
 'src/styles/102-109-next-stages.css',
 'tools/test-navigation.py',
 'tools/test-saves.py',
 'tools/test-rc42-49.py',
 'INSTRUKCJA-ETAPY-RC42-RC49.md',
 'RAPORT-QA-RC42-RC49.md',
 *additions.values(),
}
patches=[];last_manifest=None
for stage in range(42,50):
 man=copy.deepcopy(base_manifest);css=next(x for x in man['sections'] if x['kind']=='style' and x['index']==63)
 js=next(x for x in man['sections'] if x['kind']=='script' and x['index']==60)
 css['parts'].append('src/styles/102-109-next-stages.css')
 js['parts'].extend(additions[i] for i in range(42,stage+1))
 for part in man['sections']:
  raw=''.join((root/p).read_text(encoding='utf-8') for p in part['parts']).encode()
  part['sha256']=hashlib.sha256(raw).hexdigest();part['size']=len(raw)
 manifest_path.write_text(json.dumps(man,ensure_ascii=False,indent=2)+'\n')
 compat=copy.deepcopy(base_compat);compat['navigation']['hookCount']=32+(stage-41)
 compat['saveManager']['moduleCount']=50+(1 if stage>=46 else 0)
 compat_path.write_text(json.dumps(compat,ensure_ascii=False,indent=2)+'\n')
 # Keep exact stage-specific versions of test assertions rather than forcing later hooks to exist.
 nav=(base/'tools/test-navigation.py').read_text()
 nav=nav.replace("len(start['hooks']) == 32",f"len(start['hooks']) == {32+stage-41}")
 nav=nav.replace("len(set(start['hooks'])) == 32",f"len(set(start['hooks'])) == {32+stage-41}")
 nav=nav.replace("'hooks':32",f"'hooks':{32+stage-41}")
 (root/'tools/test-navigation.py').write_text(nav)
 if stage>=46:
  sav=(base/'tools/test-saves.py').read_text().replace("len(result['hooks'])==50", "len(result['hooks'])==51").replace("len(set(result['hooks']))==50", "len(set(result['hooks']))==51").replace('50 unique hooks','51 unique hooks').replace("SaveManager.inspect().hooks.length')==50", "SaveManager.inspect().hooks.length')==51")
  (root/'tools/test-saves.py').write_text(sav)
 else:(root/'tools/test-saves.py').write_text((base/'tools/test-saves.py').read_text())
 built=subprocess.run(['node','tools/build.mjs'],cwd=root,capture_output=True,text=True)
 if built.returncode!=0:raise RuntimeError(f'build {stage}: {built.stderr}')
 change_paths={'index.html','src/build-manifest.json','src/compatibility-contracts.json','tools/test-navigation.py',additions[stage]}
 if stage==42:change_paths.update({'lib/interview-psychology-rc37.js','src/styles/102-109-next-stages.css'})
 if stage==46:change_paths.add('tools/test-saves.py')
 if stage==49:change_paths.update({'tools/test-rc42-49.py','INSTRUKCJA-ETAPY-RC42-RC49.md','RAPORT-QA-RC42-RC49.md'})
 prev='RC41' if stage==42 else f'RC{stage-1}'
 output=Path('/mnt/data')/f'Prawdziwe_Sledztwo_6_38_RC{stage}_POPRAWKA_DO_{prev}.zip'
 with ZipFile(output,'w',ZIP_DEFLATED,compresslevel=7) as z:
  for p in sorted(change_paths):z.write(root/p,p)
 with ZipFile(output) as z:assert z.testzip() is None
 patches.append((stage,str(output),output.stat().st_size))
 print(f'PASS RC{stage} -> {output.name}: {output.stat().st_size:,} bytes',flush=True)
 last_manifest=man
# all stages have been activated; return final tests and compatibility metadata.
allpatch=Path('/mnt/data/Prawdziwe_Sledztwo_6_38_RC49_POPRAWKA_Z_RC41_CALY_PLAN.zip')
with ZipFile(allpatch,'w',ZIP_DEFLATED,compresslevel=7) as z:
 for p in sorted(changed_all|{'index.html','src/build-manifest.json','src/compatibility-contracts.json'}):z.write(root/p,p)
with ZipFile(allpatch) as z:assert z.testzip() is None
# only the final version is a full distribution (includes original HTML, APIs, assets, tests).
full=Path('/mnt/data/Prawdziwe_Sledztwo_6_38_RC49_PELNA_WERSJA.zip')
ignored_prefixes=('node_modules/','.git/','__pycache__/')
with ZipFile(full,'w',ZIP_DEFLATED,compresslevel=6) as z:
 for f in sorted(root.rglob('*')):
  if not f.is_file():continue
  rel=f.relative_to(root).as_posix()
  if any(rel==p[:-1] or rel.startswith(p) for p in ignored_prefixes):continue
  if any(part in {'.git','node_modules','__pycache__','.pytest_cache'} for part in f.relative_to(root).parts):continue
  if rel.startswith('.tmp-') or rel.endswith('.pyc'):continue
  z.write(f,rel)
with ZipFile(full) as z:assert z.testzip() is None
print('PASS cumulative patch',allpatch.stat().st_size,flush=True)
print('PASS full final',full.stat().st_size,flush=True)
