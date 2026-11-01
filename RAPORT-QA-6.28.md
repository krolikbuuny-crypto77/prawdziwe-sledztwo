# Raport QA — wersja 6.28 (30.10.2026)

## Poprawki z testów

1. **Pamięć Marka** — `ps68` rozpoznaje pytanie o własne alibi i przedział czasu, nawet jeśli pytanie zawiera zaprzeczenie dotyczące spotkania z Leną. W trakcie odczytu starszego zapisu błędnie zaklasyfikowane epizody z tematu `lena` są przenoszone do `alibi`, a kotwice odtwarzane bez przepisywania odpowiedzi.
2. **Etapy oględzin** — karty fotograficzne, wskazówki i panel procedury wskazują osobno punkt odkryty, zbadany oraz materiał zabezpieczony w aktach. Po ocenie widnieje informacja „pozostało zabezpieczenie”.
3. **Liczniki** — licznik punktów zbadanych jest niezależny od licznika dokumentów zabezpieczonych. Obie wartości są wyświetlane razem, z etykietami, a odświeżenie następuje przy zmianie stanu.
4. **Wznowienie** — przed pokazaniem pustego pulpitu jest modalne pytanie „Kontynuuj śledztwo / Nowe śledztwo”. Kliknięcie poza pytaniem nie rozpoczyna nowej sesji i nie resetuje synchronizacji serwerowej.
5. **Powiadomienia** — wczytanie sesji nie uruchamia efektu „Zabezpieczono nowy materiał”; komunikat jest dopuszczalny po nowej czynności gracza.
6. **Diagnostyka AI** — widoczna po uruchomieniu gry z `?debugAI=1` i wysłaniu pytania do świadka. Zawiera dostawcę (`zai`, `groq`, `local`, a w wypadku błędu sieciowego `unknown`), model, kod przyczyny przełączenia, czas obsługi odpowiedzi API w ms i UUID żądania. Trafia do `dialogues[*][].ai` w eksporcie. Nigdy nie zapisuje sekretów API.

## Zweryfikowane testy lokalne

- `node tools/build.mjs` i `npm run check` — PASS: 61 sekcji JS, 64 sekcje CSS, zgodność wygenerowanego `index.html`, 75 WebP, 9 MP3, kontrola kanonu fabularnego.
- `python tools/test-quality628.py` — PASS: fotografia / etap zabezpieczenia / osobne liczniki; ekran wyboru zapisu przed pulpitem; rzeczywiste wznowienie zatwierdzonego etapu; brak ponownego powiadomienia; rozpoznanie pytania Marka; migracja błędnie oznaczonego zapisu.
- `node tools/test-api627.mjs` i `python tools/test-diagnostics627.py` — PASS: identyfikacja źródła odpowiedzi, fallback, czas odpowiedzi, eksport i odtworzenie; spójność lokalnej historii i pamięci.
- `node tools/test-interview626.mjs`, `python tools/test-quality626.py` — PASS: alibi, alarm Tomasza, zabezpieczenia semantyczne, zgodność zapisów `dialogues`, `ps67`, `ps68`.
- `node tools/test-security624.mjs`, `node tools/test-state618.mjs`, `node tools/test-sync617.mjs` — PASS: kanon, werdykt, synchronizacja, bez odblokowywania materiałów przez AI.

## Ograniczenia

- Testy API korzystały z mocków — nie wykazują, czy rzeczywiście aktywne są klucze i limity Z.ai/Groq w produkcyjnym Vercel.
- Przeglądarka testowa działała na lokalnie załadowanej kopii strony, bez produkcyjnego Supabase. Należy po wdrożeniu sprawdzić jedną nową sesję testową na Vercel z `?debugAI=1` oraz poprawny zapis zmian `revision`.
- Przy błędzie sieciowym bez poprawnej odpowiedzi HTTP może być `provider: unknown`. Jest to świadome oznaczenie braku potwierdzenia, a nie wskazanie użycia lokalnego silnika.
