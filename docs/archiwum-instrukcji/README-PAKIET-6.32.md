# Prawdziwe Śledztwo 6.32 — korekta lokalnych odpowiedzi i podpisów fotografii

**Podstawa:** pełna paczka 6.31. **Nie zmienia** kluczy, tabel Supabase, reguł odblokowywania dowodów, historii fabuły ani tras Z.ai → Groq → lokalny. Nie zmienia produkcji ani GitHuba.

## Poprawki

1. `src/witnesses/84-precise-question-scope-632.js` — dodatkowa, ograniczona warstwa korekty odpowiedzi lokalnych dla pytań o brak wpisu w dokumentach Janusza, wysłanie zgłoszenia BHP Elżbiety, autoryzację testu Kamila oraz zgłoszenie alarmu / alibi Tomasza. Wykorzystuje tylko jawne fakty z `NPC94_FACTS`. Nie dotyka odpowiedzi Z.ai/Groq i odrzuca pytania zawierające wielowątkowe oskarżenia, okazane dowody, przyznania, korekty oraz odmowy proceduralne. Sprostowania trafiają do bieżącej pamięci rozmowy.
2. `src/inspection/03-visual-asset-bridge.js` i szablon — podpis fotografii wynika z `STATE.scene12.inspected` oraz `STATE.found`, a nie ze stałego tekstu. Rozróżnia: przed badaniem, zbadano (bez zabezpieczenia), zabezpieczono do akt oraz obserwację bez oddzielnego dokumentu.
3. Zaktualizowano manifest kompilacji i kontrolowaną liczbę warstw w `src/compatibility-contracts.json`.

## Testy

```bash
npm run build
npm run check
npm run test:regression632
npm run test:priority1
npm run test:fast-evidence
npm run test:api629
```

Test `test:regression632` wymaga Python Playwright i Chromium; wykonuje 14 pytań w Chromium (390 i 1280 px), kontrole ochrony konfrontacji, spójności historii i trzech podpisów fotografii. Pozostałe testy API wykorzystują mocki, **nie prawdziwe klucze**.

## Nadal do zweryfikowania na produkcji

- Rzeczywisty czas odpowiedzi Z.ai / Groq (istniejące pola `provider`, `durationMs`, `fallbackReason`, `requestId` w diagnostyce); limit kaskadowy nadal może być wysoki.
- Trwałość zapisu Supabase po otwarciu nowej sesji i konflikty rewizji.
- Szersze, otwarte rozmowy z każdym świadkiem (testy 14 pytań nie oznaczają pełnego rozumienia polskiego języka).

## Wdrożenie

Rozpakuj ZIP do kopii repozytorium, pozostawiając `.git`; commit/push wykonaj tylko po weryfikacji. Nie uruchamiaj migracji Supabase. Zachowaj odrębny zapis testowy podczas sprawdzania produkcji.
