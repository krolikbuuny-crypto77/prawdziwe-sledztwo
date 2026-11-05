import fs from 'node:fs';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const buildManifest=JSON.parse(fs.readFileSync(path.join(root,'src/build-manifest.json'),'utf8'));
const baseline=JSON.parse(fs.readFileSync(path.join(root,'src/css-important-baseline.json'),'utf8'));
const files=[...new Set(buildManifest.sections.filter(e=>e.kind==='style').flatMap(e=>e.parts))].sort();
const audit=files.map(file=>{
  const source=fs.readFileSync(path.join(root,file),'utf8');
  return {file,bytes:Buffer.byteLength(source),important:(source.match(/!important\b/gi)||[]).length,
    maxLineLength:Math.max(...source.split('\n').map(l=>l.length))};
});
const total=audit.reduce((x,y)=>x+y.important,0);
const previous=Object.values(baseline.files).reduce((x,y)=>x+y,0);
const changes=audit.filter(r=>r.important>(baseline.files[r.file]??0));
const missing=audit.filter(r=>!Object.hasOwn(baseline.files,r.file));
const ranked=[...audit].sort((a,b)=>b.important-a.important);
const report={schemaVersion:1,kind:'CSS cascade audit',baselineImportant:previous,currentImportant:total,
  improvementSinceBaseline:previous-total,fileCount:files.length,
  filesWithImportance:audit.filter(x=>x.important>0).length,
  changedFileCounts:audit.filter(r=>r.important!==baseline.files[r.file]),
  hotspots:ranked.slice(0,12),files:audit};
if(process.argv.includes('--json')){
  const filename=path.join(root,'QA-RC571062','css-cascade-inventory.json');
  fs.mkdirSync(path.dirname(filename),{recursive:true});
  fs.writeFileSync(filename,JSON.stringify(report,null,2)+'\n');
}
console.log('CSS important audit: '+files.length+' files / '+total+' !important (baseline '+previous+')');
console.log('Largest hotspots:\n'+ranked.slice(0,7).map(x=>`  ${x.important.toString().padStart(5)}  ${x.file}`).join('\n'));
if(process.argv.includes('--check') && (changes.length||missing.length||total>previous)){
  console.error('FAIL: new or increased !important requires explicit cascade review and baseline update.');
  for(const x of [...changes,...missing])console.error(x.file+': '+x.important+' / '+(baseline.files[x.file]??'NEW'));
  process.exitCode=1;
}
