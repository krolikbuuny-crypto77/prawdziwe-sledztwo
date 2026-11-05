import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {writeCaseEngine} from './sync-case-engine.mjs';
import {stripCssComments} from './strip-css-comments.mjs';

const root = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/build-manifest.json'), 'utf8'));
const template = fs.readFileSync(path.join(root, 'src/index.template.html'), 'utf8');
const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

export function buildPage() {
  let html = template;
  const scripts = [];
  const styles = [];
  const externalFiles = [];
  // Stage 6: combine the 64 historical CSS sections in their exact manifest order.
  // Remove their legacy <style> wrappers (including wrappers inserted after scripts).
  // The single production stylesheet reduces CSSOM entry points without changing
  // the relative order/specificity of the original CSS rules.
  const styleEntries = manifest.sections.filter(entry => entry.kind === 'style');
  const combinedStyles = styleEntries.map(entry => entry.parts.map(file => {
    const resolved = path.resolve(root, file);
    if (!resolved.startsWith(root + path.sep)) throw Error(`Outside project: ${file}`);
    return fs.readFileSync(resolved, 'utf8');
  }).join(''));
  for (const entry of manifest.sections) {
    let code = '';
    if (entry.kind === 'script') {
      for (const file of entry.parts) {
        const resolved = path.resolve(root, file);
        if (!resolved.startsWith(root + path.sep)) throw Error(`Outside project: ${file}`);
        const contents = fs.readFileSync(resolved, 'utf8');
        if (file === 'lib/question-typos-rc578.js') {
          // Embedded directly before the shared browser parser below.
          continue;
        } else if (file === 'lib/question-intent-633.js') {
          // The browser and Vercel execute exactly the same parser source.
          const typoSource = fs.readFileSync(path.join(root, 'lib/question-typos-rc578.js'), 'utf8')
            .replace(/\bexport\s+(?=(?:const|function)\b)/g, '');
          const browserIntent = contents.replace(/^import[^\n]*question-typos-rc578[^\n]*\n/m, '')
            .replace(/\bexport\s+(?=(?:const|function)\b)/g, '');
          code += '\n(()=>{\n' + typoSource + '\n' + browserIntent +
            '\nwindow.PS633_INTENT=Object.freeze({analyzeQuestion,classifyQuestionPart,legacyQuestionPlan,foldQuestion,INTENT_VERSION});\n})();\n';
        } else code += contents;
      }
      scripts.push(code);
      const occurrences = html.split(entry.marker).length - 1;
      if (occurrences !== 1) throw Error(`${entry.marker}: expected one insertion point, found ${occurrences}`);
      // Cache the two largest classic-script sections. They retain their original
      // synchronous execution order and global script scope (no defer/module).
      if (entry.index === 0 || entry.index === 60) {
        const filename = `ps-js-${String(entry.index).padStart(2, '0')}-${sha256(code).slice(0, 16)}.js`;
        const escaped = entry.marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wrapper = new RegExp(`<script\\b([^>]*)>\\s*${escaped}\\s*<\\/script>`, 'g');
        const found = html.match(wrapper);
        if (!found || found.length !== 1) throw Error(`Missing classic script wrapper: ${entry.marker}`);
        externalFiles.push({filename, content:code, kind:'script'});
        html = html.replace(wrapper, (_, attrs) => `<script${attrs} src="${filename}"></script>`);
      } else {
        html = html.replace(entry.marker, () => code);
      }
    } else if (entry.kind === 'style') {
      // Inspect the exact historical wrapper, rather than deleting unknown HTML.
      const escaped = entry.marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const wrapper = new RegExp(`<style\\b[^>]*>\\s*${escaped}\\s*<\\/style>`, 'g');
      const found = html.match(wrapper);
      if (!found || found.length !== 1) throw Error(`${entry.marker}: expected one style wrapper, found ${found?.length || 0}`);
      if (entry.index === styleEntries[0].index) {
        styles.push(...combinedStyles);
        // Keep the stylesheet at the site root so existing relative url(assets/...)
        // references resolve exactly as they did from the inline style in index.html.
        const css = stripCssComments(combinedStyles.join('\n')); // RC57.10.63: strip comments in delivery only
        const filename = `ps-css-${sha256(css).slice(0, 16)}.css`;
        externalFiles.push({filename, content:css, kind:'style'});
        html = html.replace(wrapper, `<link id="ps-consolidated-styles" rel="stylesheet" href="${filename}">`);
      } else {
        html = html.replace(wrapper, '');
      }
    }
  }
  if (/__PS_SOURCE_(?:SCRIPT|STYLE)_\d+__/.test(html)) throw Error('Unresolved source marker');
  const coreAsset = externalFiles.find(file => file.filename.startsWith('ps-js-00-'));
  const preload = `<link rel="preload" as="script" href="${coreAsset.filename}">`;
  html = html.replace('</head>', `${preload}</head>`);
  // Self-contained copy for historical headless tests that use page.set_content().
  // Never deploy this fixture: /tools is blocked by Vercel routing rules.
  let inlineTestHtml = html.replace(preload, '');
  for (const asset of externalFiles) {
    if (asset.kind === 'style') {
      inlineTestHtml = inlineTestHtml.replace(
        `<link id="ps-consolidated-styles" rel="stylesheet" href="${asset.filename}">`,
        () => `<style id="ps-consolidated-styles">${asset.content}</style>`);
    } else {
      const escaped = asset.filename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`<script([^>]*) src="${escaped}"><\\/script>`);
      inlineTestHtml = inlineTestHtml.replace(re,
        (_whole, attrs) => `<script${attrs}>${asset.content}</script>`);
    }
  }
  return {html, inlineTestHtml, scripts, styles, externalFiles, fingerprint: sha256(html)};
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  writeCaseEngine(); // Regenerate legacy-compatible source before assembling the runtime bundle.
  const result = buildPage();
  fs.writeFileSync(path.join(root, 'index.html'), result.html, 'utf8');
  fs.writeFileSync(path.join(root, 'tools/.test-index-inline.html'), result.inlineTestHtml, 'utf8');
  // Remove stale content-hashed bundles from a previous local build.
  for (const name of fs.readdirSync(root)) {
    if (/^ps-(?:css|js)-[a-z0-9-]+\.(?:css|js)$/.test(name) &&
        !result.externalFiles.some(f => f.filename === name)) fs.unlinkSync(path.join(root, name));
  }
  for (const asset of result.externalFiles)
    fs.writeFileSync(path.join(root, asset.filename), asset.content, 'utf8');
  console.log(`Generated index.html: ${Buffer.byteLength(result.html)} bytes / ${result.scripts.length} scripts / ${result.styles.length} CSS sections / ${result.externalFiles.length} cached bundles`);
  console.log(`SHA-256: ${result.fingerprint}`);
}
