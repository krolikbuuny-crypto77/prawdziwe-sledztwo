# Pakiet 6.20 — Żywe reakcje i ciągłość postaci

**Baza:** 6.19. Zmiany naniesiono bezpośrednio na pliki gry, backendu Vercel i kompilowany `index.html`.

## Co wprowadzono

1. **Sześć odrębnych reakcji scenicznych w przesłuchaniu.** Marek, Tomasz, Janusz, Elżbieta, Kamil i Magdalena mają odmienne opisy zachowania zależne od dotychczasowego dialogu. Sceny są subtelne, zwięzłe i nie zawierają nowych zdarzeń kanonicznych.
2. **Reakcja na sposób prowadzenia rozmowy.** Dla każdej postaci wyliczane są wyłącznie pochodne sygnały: powtórzenie tematu, bezpośrednie oskarżenia oraz pytania o źródła informacji. Niczego nie zapisują do zatwierdzonego stanu i nie wpływają na warunki osiągnięcia finału.
3. **Reakcje związane z dowodami są warunkowe.** Teksty o konkretnym źródle i sugerowane dalsze pytania wymagają uprzedniego posiadania przypisanych dokumentów. Samo wpisanie ich nazw do pytania nie odblokowuje sceny.
4. **Sześć opcjonalnych pytań wynikających z odkryć.** Gracz może przygotować pytanie do właściwego świadka po zdobyciu odpowiednich materiałów. Przycisk nie wysyła pytania i nie nadpisuje już wpisanego tekstu; nie jest warunkiem przejścia.
5. **Jedna tożsamość stylistyczna w obu API.** `lib/dialogue-continuity-620.js` generuje ograniczone do stylu wskazówki na podstawie historii rozmowy dostępnej na serwerze. Backend dodaje ten sam tekst do `deliveryGuide` Z.ai i Groq. Historia świadka nie jest uznawana automatycznie za prawdziwą.
6. **Bezpieczne wejście/wyjście.** Brak nowych kluczy API, zmian schematu Supabase, zmian reguł postępu, dowodów, werdyktów i minigier. W trybie offline działa dotychczasowy WitnessEngine.

## Granice narracji

- Wygląd zachowania i ton są **inscenizacją scenariuszową**, a nie nowym zeznaniem czy potwierdzonym faktem.
- Wskaźniki emocji nie są punktami rozgrywki; nie ma kar, progów zaufania ani ukrytych odblokowań.
- Pytania o źródło oraz oskarżenia wpływają na sposób wypowiedzi, ale **nie dowodzą** kłamstwa, winy lub błędnego alibi.
- Gdy gracz wraca do tematu, nie zachodzi automatyczne sprostowanie. Oficjalne sprostowania nadal wymagają dotychczasowych reguł.
- Moduł wyświetla opis na podstawie lokalnego, roboczego stanu gry. Potwierdzenie faktów i postępu pozostaje po stronie serwera.

## Zmodyfikowane pliki

- `src/story/77-living-witnesses-620.js` — nowa warstwa zachowań, bez zmian w logicznych funkcjach śledztwa.
- `src/styles/77-living-witnesses-620.css` — dyskretne opisy, responsywność i obsługa ograniczonego ruchu.
- `lib/dialogue-continuity-620.js` — wspólne instrukcje stylu.
- `api/interview.js` — przekazanie instrukcji do obu modeli z jednego miejsca.
- `src/build-manifest.json` — dopięcie kodu do istniejących 61 sekcji JS i 64 CSS.
- `src/compatibility-contracts.json` — aktualizacja kontrolnych liczników warstw.
- `tools/test-narrative620.py`, `tools/test-api620.mjs` oraz zaktualizowane historyczne testy kontraktów.
- `index.html` — przebudowany artefakt gotowy do uruchomienia.

## Wdrożenie

Rozpakować ZIP w gałęzi testowej repozytorium, zachować istniejące niezależne endpointy (szczególnie `api/evaluate`) i konfigurację prywatnych sekretów Vercel. Uruchomić `npm run build`, `npm run check`, `npm run test:living-story` oraz testy regresyjne. Nowy moduł nie wymaga migracji Supabase ani dodatkowych zmiennych środowiskowych.
