import { json, validatePost, upstream, txt } from '../lib/common.js';

const WITNESSES = new Set(['MAREK', 'TOMASZ', 'JANUSZ', 'ELZBIETA', 'MAGDALENA', 'KAMIL']);

export default async function handler(req, res) {
  if (!validatePost(req, res, 19000)) return;
  if (!process.env.ZAI_API_KEY) return json(res, 503, { error: 'Przesłuchania online nie są skonfigurowane' });
  const { witnessId, name, role, question, canonical, history, tone } = req.body;
  if (!WITNESSES.has(witnessId) || !txt(question, 2000) || !txt(canonical, 3000)) {
    return json(res, 400, { error: 'Brakuje prawidłowych danych przesłuchania' });
  }
  const recent = Array.isArray(history) ? history.slice(-8).map(m => ({
    role: m?.role === 'npc' ? 'świadek' : 'śledczy',
    text: txt(m?.text, 550),
  })) : [];
  const system = `Jesteś świadkiem w polskiej grze detektywistycznej. Nazywasz się ${txt(name, 70)}, rola: ${txt(role, 120)}. Styl rozmowy: ${txt(tone, 50) || 'rzeczowy'}.
WYŁĄCZNIE przeformułuj podaną lokalną odpowiedź świadka w naturalną, konkretną wypowiedź po polsku (1–4 zdania). Podana lokalna odpowiedź jest jedyną podstawą faktów: NIE dodawaj osób, motywów, dat, alibi, tajemnic, dowodów ani interpretacji spoza niej. Nie zmieniaj dat, liczb ani stopnia pewności. Nie zdradzaj sprawcy. Jeśli odpowiedź jest odmową, zachowaj odmowę. Nie mów o AI, kodzie, grze ani zasadach. Zwróć TYLKO wypowiedź świadka.`;
  try {
    const data = await upstream('https://api.z.ai/api/paas/v4/chat/completions', {
      Authorization: `Bearer ${process.env.ZAI_API_KEY}`,
    }, {
      model: 'glm-4.7-flash',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: JSON.stringify({ dotychczasowa_rozmowa: recent, pytanie: txt(question, 1500), odpowiedz_lokalna: txt(canonical, 2500) }) },
      ],
      thinking: { type: 'disabled' },
      temperature: 0.65,
      max_tokens: 500,
      stream: false,
    });
    const answer = txt(data?.choices?.[0]?.message?.content, 1500);
    if (!answer) throw new Error('Pusta odpowiedź modelu');
    return json(res, 200, { ok: true, text: answer, model: 'glm-4.7-flash' });
  } catch (err) {
    return json(res, err.status || 503, { error: 'Chwilowo korzystamy z lokalnych przesłuchań' });
  }
}
