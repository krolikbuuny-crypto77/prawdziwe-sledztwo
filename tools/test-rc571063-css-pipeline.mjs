import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {stripCssComments} from './strip-css-comments.mjs';
import {buildPage} from './build.mjs';
const root=path.resolve(import.meta.dirname,'..');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const cases=[
  ['a/* comment */{display:block}', 'a{display:block}'],
  ['a/**/.b{color:red}', 'a.b{color:red}'],
  ['a{content:"a/* not a comment */b"}', 'a{content:"a/* not a comment */b"}'],
  ["a{content:'escaped \\\'/* not comment */'}", "a{content:'escaped \\\'/* not comment */'}"],
  ['a{url:url("data:image/svg+xml,/*KEEP*/")}', 'a{url:url("data:image/svg+xml,/*KEEP*/")}'],
  ['/*! license */a{color:red}/* regular */', '/*! license */a{color:red}'],
  ['/*# sourceMappingURL=foo.css.map */a{}', '/*# sourceMappingURL=foo.css.map */a{}'],
  ['a/**/b{color:red}', 'ab{color:red}'],
];
for(const [src,expected] of cases)assert.equal(stripCssComments(src),expected);
assert.throws(()=>stripCssComments('a{/* unclosed'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'src/build-manifest.json'),'utf8'));
const allStyles=manifest.sections.filter(x=>x.kind==='style').map(entry=>entry.parts.map(file=>fs.readFileSync(path.join(root,file),'utf8')).join('')).join('\n');
const published=buildPage().externalFiles.find(e=>e.kind==='style');
const optimized=stripCssComments(allStyles);
assert.equal(published.content,optimized,'Published CSS must be derived only by comment removal');
assert.equal(hash(published.content).slice(0,16),published.filename.match(/^ps-css-([a-f0-9]{16})\.css$/)?.[1]);
for(const file of manifest.sections.filter(x=>x.kind==='style').flatMap(x=>x.parts)){
 const src=fs.readFileSync(path.join(root,file),'utf8');
 const manifestItem=manifest.sections.find(x=>x.kind==='style'&&x.parts.includes(file));
 assert.equal(manifestItem.sha256,hash(manifestItem.parts.map(p=>fs.readFileSync(path.join(root,p),'utf8')).join('')));
}
// Later releases may change script 60 independently of this historical CSS audit.
// Keep its content-hashed bundle verified while pinning the unchanged core script.
const external=buildPage().externalFiles;
const runtime=external.find(a=>a.filename.startsWith('ps-js-60-'));
assert.ok(runtime);
assert.equal(hash(runtime.content).slice(0,16),runtime.filename.match(/^ps-js-60-([a-f0-9]{16})\.js$/)?.[1]);
assert.equal(fs.readFileSync(path.join(root,runtime.filename),'utf8'),runtime.content);
assert.equal(hash(fs.readFileSync(path.join(root,'ps-js-00-e004ce923f722887.js'),'utf8')),
 'e004ce923f722887d6ef73f1dd291567663cfbc9a01c604cc542d5d98eab3cab');
const stats={version:'RC57.10.63',sourceCssBytes:Buffer.byteLength(allStyles),publishedCssBytes:Buffer.byteLength(published.content),removedBytes:Buffer.byteLength(allStyles)-Buffer.byteLength(published.content),commentsRemoved:(allStyles.match(/\/\*[\s\S]*?\*\//g)||[]).length-(published.content.match(/\/\*[\s\S]*?\*\//g)||[]).length,coreJsUnchanged:true,companionJsHashVerified:true};
fs.mkdirSync(path.join(root,'QA-RC571063'),{recursive:true});
fs.writeFileSync(path.join(root,'QA-RC571063/css-pipeline.json'),JSON.stringify(stats,null,2)+'\n');
console.log('RC57.10.63 CSS pipeline — PASS',stats);
