# Raport QA — Pakiet 6.21

Wersja bazowa: 6.20. Kontrola dotyczy **kodu zbudowanego i uruchomionego lokalnie**, bez wdrożenia produkcyjnego.

## Testy i wyniki

| Test | Wynik | Zakres |
|---|---|---|
| `npm run build` | PASS | Kompilacja pojedynczego `index.html` z manifestu źródeł |
| `npm run check` | PASS | 61 sekcji JS, 64 CSS, 75 WebP, 9 MP3; kontrakty architektury |
| `npm run test:cinematic` | PASS | 390/768/1280 px, osiem scen, długi wątek, obsługa zamknięcia, reduced motion, domyślnie wyłączone audio |
| `tools/test-api621.mjs` | PASS | 6 świadków × 26 tur, historia 48 wiadomości, wspólny kontekst Z.ai/Groq, sprostowanie, fallback |
| `npm run test:architecture` | PASS | Z.ai/Groq i mock Supabase, serwerowy zapis |
| `npm run test:progression` | PASS | Reguły serwerowego finału i zabezpieczenia postępu |
| `npm run test:ai-primary` | PASS | Serwerowa kontrola odpowiedzi, awarie i zapasowy silnik |
| `npm run test:living-story` | PASS | Psychologia sześciu świadków i zgodność dostawców |
| `npm run test:saves` | PASS | Zapis, wczytanie, reset |
| `npm run test:witnesses` | PASS | 720 tur przesłuchań, fallback |
| `npm run test:dialogue` | PASS | 1200 mieszanych tur, pytania następcze |
| `npm run test:reasoning` | PASS | Dedukcja, Cloudflare jako nieautorytatywna opinia |
| `npm run test:events` | PASS | Zdarzenia i brak pozornych odblokowań |
| `npm run test:story` | PASS | Fabuła i źródłowe bramki |
| `npm run test:personality` | PASS | Wrażliwe przyznania i psychologia |
| `npm run test:memory` | PASS | Pamięć lokalna, import, odległe wspomnienia |
| `npm run test:inspections-puzzles` | PASS | Pięć minigier × dwie szerokości |
| `npm run test:navigation` | PASS | 40 rzeczywistych przejść, 320/390/768/1440 px |

## Ustalenia bezpieczeństwa

- Test 6.21: **0 zmian w stanie dowodów, dedukcji i werdyktu** wywołanych przez nowe warstwy prezentacyjne.
- Wspólne instrukcje dla obu dostawców AI pochodzą z tego samego, dozwolonego banku faktów.
- Na backendzie wydłużono przechowywanie zatwierdzonej historii świadka do 48 wpisów; do żądania modelu trafia ostatnie 12 plus ograniczona mapa tematów.
- Dźwięk przełomów wymaga świadomego kliknięcia, w testach jest domyślnie wyłączony.
- Korekta historycznego testu nawigacji: oczekiwane 28 zamiast 27 hooków (nowy hook `long-interviews-621`). Brak zmian w kontrolerze nawigacji.

## Co nadal nie jest potwierdzone

- Jakość dialogów na prawdziwym Z.ai i Groq, opóźnienia, limity i koszty produkcyjne.
- Realne połączenie Supabase na Vercel i późniejsza synchronizacja sieciowa w produkcji.
- Niezależna ocena naturalności i emocjonalnej wiarygodności długich rozmów przez testerów.
- Wydajność w bardzo słabych telefonach; testy obejmowały symulowane szerokości w Chromium, nie fizyczne urządzenia.
- Pełna zgodność semantyczna nieprzewidzianych parafraz: heurystyki nie zapewniają stuprocentowego rozpoznania intencji.
