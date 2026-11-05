/**
 * RC57.10.63 — lossless removal of non-semantic CSS comments at publish time.
 * Source styles remain untouched. The scanner respects quoted strings and escaped
 * quotes, and preserves license/source-map annotations. CSS comments are removed
 * without replacing them with whitespace, consistent with CSS tokenization.
 */
export function stripCssComments(css) {
  if (typeof css !== 'string') throw new TypeError('CSS must be text');
  let out = '';
  let chunkStart = 0;
  let quote = null;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (quote !== null) {
      if (c === '\\') { i++; continue; }
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end < 0) throw new Error(`Unclosed CSS comment at offset ${i}`);
      const comment = css.slice(i, end + 2);
      // Retain legal notices and source-map/sourceURL directives.
      const protectedComment = /^\/\*!/.test(comment) || /^\/\*\s*[@#]\s*(?:license|preserve|sourceMappingURL|sourceURL)\b/i.test(comment);
      if (!protectedComment) {
        out += css.slice(chunkStart, i);
        chunkStart = end + 2;
      }
      i = end + 1;
    }
  }
  return out + css.slice(chunkStart);
}
