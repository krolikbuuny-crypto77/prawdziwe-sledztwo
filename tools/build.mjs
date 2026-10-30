import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'src/build-manifest.json'), 'utf8'));
const template = fs.readFileSync(path.join(root, 'src/index.template.html'), 'utf8');
const sha256 = (text) => crypto.createHash('sha256').update(text).digest('hex');

export function buildPage() {
  let html = template;
  const scripts = [];
  const styles = [];
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
        if (file === 'lib/question-intent-633.js') {
          // The browser and Vercel execute exactly the same parser source.
          code += '\n(()=>{\n' + contents.replace(/\bexport\s+(?=(?:const|function)\b)/g, '') +
            '\nwindow.PS633_INTENT=Object.freeze({analyzeQuestion,classifyQuestionPart,legacyQuestionPlan,foldQuestion,INTENT_VERSION});\n})();\n';
        } else code += contents;
      }
      scripts.push(code);
      const occurrences = html.split(entry.marker).length - 1;
      if (occurrences !== 1) throw Error(`${entry.marker}: expected one insertion point, found ${occurrences}`);
      html = html.replace(entry.marker, () => code);
    } else if (entry.kind === 'style') {
      // Inspect the exact historical wrapper, rather than deleting unknown HTML.
      const escaped = entry.marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const wrapper = new RegExp(`<style\\b[^>]*>\\s*${escaped}\\s*<\\/style>`, 'g');
      const found = html.match(wrapper);
      if (!found || found.length !== 1) throw Error(`${entry.marker}: expected one style wrapper, found ${found?.length || 0}`);
      if (entry.index === styleEntries[0].index) {
        styles.push(...combinedStyles);
        html = html.replace(wrapper, `<style id="ps-consolidated-styles">${combinedStyles.join('\n')}</style>`);
      } else {
        html = html.replace(wrapper, '');
      }
    }
  }
  if (/__PS_SOURCE_(?:SCRIPT|STYLE)_\d+__/.test(html)) throw Error('Unresolved source marker');
  return {html, scripts, styles, fingerprint: sha256(html)};
}

if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const result = buildPage();
  fs.writeFileSync(path.join(root, 'index.html'), result.html, 'utf8');
  console.log(`Generated index.html: ${Buffer.byteLength(result.html)} bytes / ${result.scripts.length} scripts / ${result.styles.length} CSS source sections in one production style element`);
  console.log(`SHA-256: ${result.fingerprint}`);
}
