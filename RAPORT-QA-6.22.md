# Raport QA — Pakiet 6.22

## Wyniki przeprowadzone w tej paczce

| Test | Wynik | Zakres |
|---|---|---|
| `npm run build` | PASS | Jednoplikowy `index.html` odtworzony z manifestu |
| `npm run check` | PASS | Składnia, integralność manifestu, 61 sekcji JS, 64 CSS, 75 WebP, 9 MP3, brak dublowania kontrolerów |
| `python tools/test-faces622.py` | PASS | 6 postaci z animowalnymi oczami, brwiami i ustami, 8 scen oraz finał na 320, 390, 768, 1440 px |
| Test dokumentu źródłowego | PASS | Nieznany/niezdobyty dokument nie uruchamia reakcji „potwierdzonej konfrontacji” |
| Test stanu gry | PASS | Brak zmian w zbiorze dowodów, dedukcji i werdykcie w trakcie symulacji mimiki |
| `npm run test:architecture` | PASS | Kolejność Z.ai → Groq → lokalnie, Supabase — mock |
| `npm run test:progression` | PASS | Serwerowe reguły postępu i odmowa sfałszowanego werdyktu |
| `npm run test:ai-primary` | PASS | Obsługa API/fallback w testach symulowanych |
| `npm run test:saves` | PASS | Import, eksport, reset i przywracanie pamięci |
| `npm run test:witnesses` | PASS | 720 tur, sześciu świadków, konfrontacje i brak fikcyjnych dowodów |
| `npm run test:reasoning` | PASS | Dedukcja i separacja opinii Cloudflare |
| `npm run test:events` | PASS | Brak pozornych odblokowań |
| `npm run test:navigation` | PASS | 40 przejść: 320/390/768/1440 px |
| `npm run test:living-story` | PASS | Reakcje indywidualne i zgodność kontekstu Z.ai/Groq |
| `npm run test:cinematic` | PASS | 8 scen i pamięć wątków, opt-in audio, reduced motion |
| `npm run test:inspections-puzzles` | PASS | Pięć minigier × dwie szerokości |

## Co **nie** jest potwierdzone

- Rzeczywista płynność animacji na słabym fizycznym telefonie i pomiar FPS/pamięci podczas 2–3-godzinnej sesji.
- Realne wywołania Z.ai, Groq, Cloudflare AI oraz działający produkcyjny Supabase.
- Ocena wrażenia naturalności mimiki przez niezależnych testerów.
- Fotorealistyczne twarze, pełne mikroekspresje motion capture, ruchy żuchwy zsynchronizowane z fonemami — tekstowy czat nie posiada syntezy mowy.

**Uwaga:** testy automatyczne sprawdzają istnienie animowanych elementów, wybranie stanów oraz brak zmian progresji. Nie dowodzą realizmu filmowego.
