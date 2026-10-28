export function json(res, status, data) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(status).json(data);
}
export function validatePost(req, res, limit = 36000) {
  if (req.method !== 'POST') { json(res, 405, { error: 'Użyj POST' }); return false; }
  const size = Number(req.headers['content-length'] || 0);
  if (size > limit) { json(res, 413, { error: 'Zapytanie jest za duże' }); return false; }
  if (!String(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) {
    json(res, 415, { error: 'Wymagany Content-Type: application/json' }); return false;
  }
  // Blokada cross-site w zwykłej przeglądarce; nie zastępuje WAF i limitowania API.
  const origin = req.headers.origin;
  if (origin && new URL(origin).host !== req.headers.host) {
    json(res, 403, { error: 'Zapytanie spoza tej strony' }); return false;
  }
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
    json(res, 400, { error: 'Niepoprawny JSON' }); return false;
  }
  return true;
}
export async function upstream(url, headers, body, timeout = 17000) {
  const resp = await fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body), signal: AbortSignal.timeout(timeout),
  });
  const raw = await resp.text();
  if (!resp.ok) {
    // Nie przekazujemy do publicznej gry odpowiedzi dostawcy (mogą zawierać szczegóły konta).
    const err = new Error('Dostawca AI jest chwilowo niedostępny');
    err.status = resp.status === 429 ? 429 : 503;
    throw err;
  }
  try { return JSON.parse(raw); }
  catch { throw new Error('Niepoprawna odpowiedź dostawcy AI'); }
}
export function txt(value, limit) { return String(value ?? '').trim().slice(0, limit); }
