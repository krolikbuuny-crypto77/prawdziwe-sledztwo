# RC57.10.45 — audyt uporządkowania Przesłuchań
Data: 2026-11-03. Baza: pełny projekt RC57.10.44.

## Zakres
- Dla 6 świadków centralny plan bieżącej rozmowy: rozpoznanie celu pytania, wskazówki tematyczne do serwerowego rejestru faktów, ton z istniejącej kartoteki, granice wiedzy, odróżnianie dokumentu od obserwacji i ograniczenie dosłownych powtórzeń.
- Plan powstaje wyłącznie na serwerze po zastąpieniu danych klienta kanonem (`trustedScene`) i po odczycie serwerowo zatwierdzonej historii. Wydzielony indeks nie przyznaje dostępu do nowych faktów i nie zastępuje kontroli jakości/semantyki.
- Poprawiono rezerwę lokalną: odróżnia własny pobyt od „zdarzenia na stanowisku”; kiedy pyta się o źródło wiedzy, może użyć dosłownego autoryzowanego fragmentu dotyczącego potwierdzeń, zamiast odczytywać pełny przebieg nocy.
- Utrzymano wykrywanie zaprzeczonego tematu (np. „Nie pytam o Lenę, tylko ...”) i pamięć wcześniejszych słów świadka.
- Użyto istniejących dossier (`witness-dossiers-rc5.js`) — bez nowego, równoległego zestawu cech psychologicznych.
- Nie zmieniano trybu odblokowywania, zawartości case-content, rejestru dowodów, Supabase, modeli AI, endpointów ani UI.

## Testy lokalne zaliczone
- `npm run build`, `npm run check` — PASS; powtarzalność kompilacji, zgodność rejestrów, bezpieczeństwo źródeł i 12 funkcji.
- `node tools/test-rc571045-interrogations.mjs` — **778** sprawdzeń: 6 osób × 11 typów pytań, brak pozostałości cudzych faktów, prawidłowa karta i styl, negacje, presja, historia, lokalne odpowiedzi z dozwolonych źródeł.
- `node tools/test-rc571044-local-fallback.mjs` — **12** wcześniejszych scenariuszy lokalnej rezerwy, PASS.
- `node tools/test-rc571013-negations.mjs` — **600/600 + 60/60** odmian negacji i kontekstu, PASS.
- `node tools/test-rc57-whole-game.mjs` — **380** reguł fabuły i dowodów, PASS.
- `node tools/test-rc57.mjs` — **600** deterministycznych testów bezpieczeństwa i reguł, PASS.
- `node tools/test-ai-understanding637.mjs` — 6 osób × 6 wersji pytania, PASS.
- `node tools/test-followup-rc4.mjs` — PASS, naturalne doprecyzowania oraz audyt semantyczny.
- `node tools/test-rc33-models.mjs` — PASS, modele, retry i limity, użyte mocki.
- `python tools/test-witnesses.py` — PASS: 24 tur UI i 720 testów silnika faktów.
- `python tools/test-navigation.py` — PASS: 10 zakładek przy 320/390/768/1440 px.
- `python tools/test-saves.py` — PASS: eksport/import, migracje, wycofanie po błędzie, autosave.
- `python tools/test-rc571036-long-chat.py` — PASS: 3 warianty po 100 wiadomości.
- Dodatkowo `test-rc571014-excluded-focus.mjs`, `test-rc571010-testimony-recap.mjs`, `test-rc57108-naturalness-quota.mjs` i `test-rc57103-preacceptance.mjs`: PASS.

## Historyczne testy niezgodne już z bazą RC57.10.44
Nie raportujemy ich jako zaliczone:
- `tools/test-rc57102-live-audit.mjs` oczekuje konkretnego znacznika `RC57.10.2` w `spokenStyleGuide`, którego nie ma już w bazie 10.44.
- `tools/test-dialogue635.mjs` oczekuje `repeated_previous_reply`, podczas gdy wcześniejsza walidacja zwraca `corroboration_nonanswer` — identycznie w bazie 10.44.
- `tools/test-witness-dossiers-rc5.mjs` oczekuje jednokrokowej fazy modelu, a aktualny kontrakt uruchamia drugą próbę `rewrite` — identycznie w bazie 10.44.
Testy te wymagają aktualizacji historycznych fixture'ów, ale nie zmieniano ich tylko po to, by raportować zielony wynik.

## Ograniczenia
1. Testy AI wykonane na autoryzowanych danych i z mockami. **Nie uruchomiono nowego rzeczywistego 72-pytaniowego testu Apinex na Vercel**; nie ma dowodu, że naturalność chmury lub rate limit HTTP 429 zostały naprawione.
2. Nie włączano nowych źródeł wiedzy, nie edytowano fabuły i nie przerabiano psychologii na automatyczne ujawnianie tajemnic. To porządkowanie, nie nowe sceny.
3. Trzeba sprawdzić przy aktywnej sesji Supabase przede wszystkim długie rozmowy, kolejne doprecyzowania, konfrontacje z dokumentami i zgodność pierwszej oraz kolejnych wypowiedzi.
4. W tej wersji nie zmieniano widoków graficznych; zrzuty ekranu RC57.10.44 pozostają reprezentatywne dla wyglądu.
