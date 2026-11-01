# RC57.1 — naprawa raportu: negacje i nacisk (Hobby, bez Gemini)

## Co naprawiono
- `lib/interview-rc50.js`: rozpoznawanie sprostowań „Nie o X, tylko o Y”, także z odmianą imion i innymi tematami; rozpoznawanie kilku wariantów „nie pytam”, „miałam na myśli”.
- `lib/interview-rc50.js`: rozpoznawanie odmienionych sformułowań nacisku i zarzutów, np. „kłamiesz”, „oszukujesz”, „ukrywasz”, „manipulujesz”, „zataiłeś”.
- Odróżnianie jawnego zaprzeczenia oskarżeniu („Nie twierdzę, że kłamiesz”) od oskarżenia, a także zdania zawierającego negację oraz późniejszy osobny zarzut.
- `tools/test-rc57.mjs`: regresja wymaga wyniku 600/600. Nowy `tools/test-rc57-corrections-pressure.mjs` sprawdza przypadki dodatnie i fałszywe alarmy.

Nie zmieniono kanonu, reguł dowodowych, werdyktu, zapisów, stanów kooperacji, konfiguracji dostawców AI ani ekranu gry. Klasyfikator jest jedynie nieautorytatywną wskazówką dla odpowiedzi AI.

## Instalacja na GitHub (na wersję RC57 Hobby bez Gemini)

1. Wykonaj kopię zapasową repozytorium.
2. Zastosuj poprawkę ZIP, zachowując strukturę katalogów i podmieniając zawarte pliki, **albo** wgraj pełne archiwum RC57.1.
3. Sprawdź, że katalog `api/` zawiera dokładnie 12 plików JavaScript. Jeżeli w GitHub nadal istnieją stare `api/admin-rc57-ui.js` i `api/status.js`, usuń je; samo wgranie nowej paczki nie usuwa wcześniejszych plików.
4. Zatwierdź zmiany w GitHub i sprawdź status wdrożenia w Vercel.
5. Otwórz prywatny panel `/admin/testy`, zaloguj się i uruchom **Pełny — 600 scenariuszy**.
6. Oczekiwany wynik tej deterministycznej wersji: `600 pass / 0 warning / 0 fail`.

Nie trzeba edytować zmiennych środowiskowych, kluczy ani Supabase; brak nowego SQL. Kontynuuj używanie istniejących `RC57_ADMIN_PASSWORD` i `RC57_ADMIN_SECRET`.

## Co testy faktycznie potwierdzają
Odtwarzają 600 przypadków (100 na każdego świadka), ocenianych lokalnymi regułami bez zapytań do modeli AI; sprawdzają klasyfikację, ograniczenia wiedzy i niektóre mechanizmy pomocnicze. **Nie** weryfikują jakości generowanych wypowiedzi przez Apinex, Z.ai lub Groq, a testy offline/kooperacji RC57 nie są 600 rzeczywistymi sesjami przeglądarki.
