# QA 6.36 AI First RC2 — pytania o relację z ofiarą

## Odtworzony błąd

`analyzeQuestion('Kim była dla ciebie ofiara?')` w RC zwracał `primary: clarification`, `subject: unspecified`. Wskutek tego serwer nie wybierał specyficznego banku faktów o relacji z Leną. Model mógł odpowiadać tautologią.

## Zmiany

1. Parser rozpoznaje siedem wariantów pytania jako `relationship`; `subject: victim` obejmuje odmiany „ofiara”.
2. Zatwierdzone źródła o Lenie i roli Marka trafiają do serwerowego banku faktów. Inni świadkowie korzystają z istniejącego kanonu.
3. Kontrola jakości wykrywa tautologiczne „Nie wiem, kim była dla mnie ofiara” i wywołuje jedną poprawkę AI. Nie generuje sztywnej odpowiedzi lokalnej.
4. Spójne oznaczenie `6.36-AI-FIRST-RC2` w interfejsie i `/api/status`.

## Testy lokalne

- `node tools/test-victim-relationship636.mjs` — PASS (7 wariantów, 6 świadków, korekta symulowanego modelu).
- `npm run build` — PASS.
- `npm run check` — PASS (spójność manifestu, bezpieczeństwo, kanon, dowody).
- `node tools/test-stage1-636.mjs` — PASS.
- `node tools/test-stage2-636.mjs` — PASS.
- `node tools/test-pre-github636.mjs` — PASS.
- `node tools/test-release-candidate636.mjs` — PASS.

Jeden test historyczny `tools/test-interview630.mjs` nie przechodzi, ponieważ wymaga starego kontraktu bez `turnId` (odpowiedź 400 zamiast 200); nie jest to regresja tej poprawki.

## Niezweryfikowane

Nie mierzono działania prawdziwego Z.ai, Groq, połączeń Vercel/Supabase ani długich sesji po aktualizacji. Zaakceptowana odpowiedź AI pozostaje probabilistyczna i nadal może być nietrafna w innym sformułowaniu. Zalecane testy na gałęzi Preview, bez publikacji do `main` bez QA.
