# Raport QA — RC57.10.10

## Dane wejściowe

Raport testu użytkowniczki: AI-001…AI-012, powtarzające się wypowiedzi Marka; po wcześniejszej akceptacji AI-011 kolejne próby dla tego samego pytania blokowane przez `dialogue_memory_evasion`, `dialogue_self_order_contradiction`, `dialogue_near_repetition`, `hard_guard`; AI-012 blokowane przez `poor_style`, `fact_ids_count`, `dialogue_near_repetition`. Brak surowych propozycji odrzuconych przez walidatory — nie można stwierdzić, które z tych konkretnych tekstów były fałszywe.

## Ustalenia w kodzie

- `priorDistinctAnswers()` i audyt podobieństwa dopuszczały przypomnienie pierwszych słów, ale **nie** podsumowanie wcześniejszych wypowiedzi (AI-011, AI-012); dlatego nowy model mógł być karany za uzasadnione powtórzenie.
- `memory_evasion` używał zarówno słów związanych z wcześniejszą wypowiedzią, jak i odmowy odtwarzania dokładnych godzin; to dawało fałszywie dodatni wynik.
- Pre-acceptance blokował `near_repetition` i `overformal_answer`, choć były to wykrycia stylu / powtórzenia wymagające oceny kontekstu; twardy audyt zgodności faktów i semantyki nadal działa osobno.
- `fact_ids_count`, `hard_guard` oraz jasna sprzeczność co do kolejności pozostają błędami blokującymi. Nie ma automatycznego przypisywania brakujących factIds.

## Zmodyfikowano

- `lib/dialogue-memory-636.js` — kontekstowy typ pytania o podsumowanie własnych zeznań; bez promowania historii do wiedzy o sprawie.
- `lib/interview-quality-635.js` — wyjątek od zakazu dosłownego powtarzania na żądanie; korekta instrukcji naprawczej.
- `lib/admin-rc57-claim-audit.js` — precyzyjniejsze wykrywanie evasion oraz rozróżnienie zamówionych cytatów i recapu od zbędnej powtórki.
- `lib/interview-rc57103-gate.js` — czysto stylistyczne `near_repetition` i `overformal_answer` pozostają ostrzeżeniami QA; blokady faktycznych sprzeczności/nieprawidłowości nadal obowiązują.
- `lib/interview-style-cue-rc57108.js` i `lib/interview-prompt-rc57106.js` — instrukcja krótkiego, naturalnego streszczenia i precyzyjnych granic wiedzy.
- `lib/admin-rc57-live.js`, `lib/admin-rc57-ui.js` — oznaczenie wydania RC57.10.10.
- `tools/test-rc571010-testimony-recap.mjs` — nowe regresje oparte na dokładnych pytaniach AI-011/012 i ścieżce produkcyjnej z transportem zastępczym.

## Testy lokalne

PASS: `npm run check`, `npm run build`, `node tools/test-rc571010-testimony-recap.mjs`, `node tools/test-rc57103-preacceptance.mjs`, `node tools/test-rc57109-live-recall.mjs`, `node tools/test-rc57104-reports.mjs`, `node tools/test-rc57108-naturalness-quota.mjs`, `node tools/test-rc57-whole-game.mjs` (380 kontroli), `node tools/test-rc57-playthrough.mjs` (580 działań), `node tools/test-rc57-quality.mjs`, `node tools/test-rc57102-live-audit.mjs`, `node tools/test-rc57-live.mjs`, `python tools/test-saves.py`, `python tools/test-rc57107-pauses-browser.py`, `python tools/test-rc57-quality-browser.py` (390 i 1440 px).

Nowy test sprawdza dla obu pytań przejście **generate → semantic-audit** bez niepotrzebnej korekty, a ponadto blokadę wymyślonego `factId`, rzeczywistą sprzeczność i niewłaściwą repetycję przy innym pytaniu. Testy korzystają z zastępczego modelu / prawdziwego kodu gry, nie z Apinex.

## Granice pewności

Nie przetestowano prawdziwych odpowiedzi Luna/Jev po wdrożeniu. Dostawca może nadal wytwarzać sztywne lub błędne wypowiedzi, a mechanizm semantyczny może blokować wypowiedź nieopartą na faktach. Ostrzeżenia stylu nadal mogą się pojawiać w raporcie i wymagają interpretacji. HTTP 504 może być skutkiem zewnętrznych ograniczeń dostawcy niezależnie od tej poprawki.
