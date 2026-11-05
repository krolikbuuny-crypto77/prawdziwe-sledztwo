import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root=path.resolve(import.meta.dirname,'..');
const descriptor=path.join(root,'src/core/case-engine-parts.json');
const target=path.join(root,'src/core/case-engine.js');
const sha256=x=>crypto.createHash('sha256').update(x).digest('hex');

export function readCaseEngineParts(){
  const manifest=JSON.parse(fs.readFileSync(descriptor,'utf8'));
  if(manifest.schemaVersion!==1||!Array.isArray(manifest.parts)||manifest.parts.length<2)
    throw Error('Invalid case-engine authoring manifest');
  const chunks=manifest.parts.map((entry,i)=>{
    const file=path.resolve(root,entry.file);
    if(!file.startsWith(path.join(root,'src/core/case-engine-parts')+path.sep))
      throw Error('Unexpected case-engine part location: '+entry.file);
    const content=fs.readFileSync(file,'utf8');
    const digest=sha256(content);
    if(digest!==entry.sha256 || Buffer.byteLength(content)!==entry.bytes)
      throw Error('Case-engine part '+(i+1)+' modified: review part hash/size before building');
    return content;
  });
  const code=chunks.join('');
  if(sha256(code)!==manifest.referenceSha256)
    throw Error('Case-engine assembled digest mismatch: update manifest after reviewed changes');
  return {code,parts:manifest.parts.length,sha256:sha256(code)};
}

export function checkCaseEngineSync(){
  const {code,parts,sha256:digest}=readCaseEngineParts();
  if(!fs.existsSync(target) || fs.readFileSync(target,'utf8')!==code)
    throw Error('Generated src/core/case-engine.js differs from authoring parts: run npm run build');
  return {parts,sha256:digest};
}

export function acceptReviewedCaseEngineChanges(){
  const meta=JSON.parse(fs.readFileSync(descriptor,'utf8'));
  if(meta.schemaVersion!==1 || !Array.isArray(meta.parts) || meta.parts.length<2)
    throw Error('Unexpected case-engine parts manifest');
  const code=meta.parts.map(entry=>{
    const filepath=path.resolve(root,entry.file);
    if(!filepath.startsWith(path.join(root,'src/core/case-engine-parts')+path.sep))
      throw Error('Unsafe case-engine part path: '+entry.file);
    const source=fs.readFileSync(filepath,'utf8');
    entry.bytes=Buffer.byteLength(source);
    entry.chars=source.length;
    entry.sha256=sha256(source);
    return source;
  }).join('');
  meta.referenceSha256=sha256(code);
  fs.writeFileSync(descriptor,JSON.stringify(meta,null,2)+'\n');
  fs.writeFileSync(target,code);
  // The classic browser script combines this generated source with four companion files.
  // Refresh the build-manifest fingerprint only after the reviewed source update.
  const manifestPath=path.join(root,'src/build-manifest.json');
  const buildManifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  const section=buildManifest.sections.find(entry=>entry.kind==='script' && entry.index===0);
  if(!section || !section.parts.includes('src/core/case-engine.js'))
    throw Error('Case engine missing from build manifest');
  const source=section.parts.map(part=>fs.readFileSync(path.join(root,part),'utf8')).join('');
  section.size=Buffer.byteLength(source);
  section.sha256=sha256(source);
  fs.writeFileSync(manifestPath,JSON.stringify(buildManifest,null,2)+'\n');
  return {parts:meta.parts.length,sha256:meta.referenceSha256};
}

export function writeCaseEngine(){
  const {code,parts,sha256:digest}=readCaseEngineParts();
  if(!fs.existsSync(target)||fs.readFileSync(target,'utf8')!==code)
    fs.writeFileSync(target,code,'utf8');
  return {parts,sha256:digest};
}

if(process.argv[1] && path.resolve(process.argv[1])===new URL(import.meta.url).pathname){
  const result=process.argv.includes('--accept')?acceptReviewedCaseEngineChanges():(process.argv.includes('--check')?checkCaseEngineSync():writeCaseEngine());
  console.log(`Case engine: ${result.parts} authoring parts / SHA-256 ${result.sha256} — OK`);
}
