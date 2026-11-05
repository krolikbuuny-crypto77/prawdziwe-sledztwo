# RC10 — raport zmian i testów

## Zakres
- Zamiana OpenRouter/DeepSeek na Groq GPT-OSS 120B (rezerwa: GPT-OSS 20B) w `/api/evidence-review`.
- Zamiana Cerebras/Llama 4 na Groq Llama 3.1 8B w `/api/lab-narrative`.
- Jeden klucz `GROQ_API_KEY`, bez potrzeby karty płatniczej w Groq Free.
- Aktualizacja adapterów, tekstów interfejsu, `/api/status`, `.env.example` i dokumentacji.
- Gemini 3.8 Flash nadal: przesłuchania thinking `high`, audyt `medium`, finał `high`.
- Serwerowa autoryzacja dowodów, zapisy sesji i SQL bez zmian.

## Ryzyka i ograniczenia
- Darmowe limity Groq są przydzielane organizacji i modelom; 14 400 zapytań do 8B to limit teoretyczny, dodatkowo 500 tys. tokenów na dzień i 6 tys. na minutę.
- Dostępność i limity konkretnego konta trzeba sprawdzić w panelu Groq.
- Laboratorium nie generuje rzeczywistych pomiarów: jedynie komentarze do istniejących dokumentów.
- Nie podawano prawdziwych kluczy, testy API wykonywano z symulowanymi odpowiedziami.

## Testy
ZALICZONE:

- `node tools/test-free-groq-rc10.mjs`: jeden klucz Groq, modele darmowe, poprawne ustawienia JSON, brak płatnego fallbacku, API status, brak wycieku klucza do klienta.
- `node tools/test-specialized-rc7.mjs` (uaktualniony): kontrakty Gemini/Groq, kontrola uprawnień do dokumentów laboratoryjnych, 6 zarzutów obrony, ocena dedukcji po stronie serwera.
- `node tools/test-gemini38-rc8.mjs` (uaktualniony): konfiguracja Gemini i Groq; odrzucenie niedozwolonych modeli.
- `node tools/test-interview-high-rc9.mjs`: Gemini high dla przesłuchań, medium dla audytu, high w finale.
- `npm run build` i `npm run check`: wygenerowany interfejs, manifest źródeł, syntax, 75 obrazów WebP, 9 MP3, kontrakty i kanon dowodów.
- `python tools/test-navigation.py`: 320, 390, 768, 1440 px.
- `python tools/test-saves.py`: eksport/import, checksum, 11 migracji, autosave, reset i rollback.
- `node tools/test-witness-dossiers-rc5.mjs`: pytania i kanon wszystkich sześciu świadków.

NIEZALICZONY TEST HISTORYCZNY:

- `node tools/test-release-candidate636.mjs` — oczekuje starego dostawcy `zai` i symuluje stary format odpowiedzi. Obecne przesłuchania wymagają Gemini, więc ten test nie jest dowodem awarii Groq ani nowej wersji. Nie był modyfikowany tylko w celu pozornego zaliczenia.

BRAK TESTU PRODUKCYJNEGO: nie mam kluczy ani dostępu do kont dostawców; symulowane testy nie potwierdzają realnego połączenia na Vercel.
