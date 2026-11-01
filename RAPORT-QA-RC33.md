# Raport jakości RC33 (lokalnie)

## Zakres
- Kontrola kompletności paczki i build-manifest; wygenerowany `index.html` musi odpowiadać źródłom.
- Syntaktyczna kontrola Node.js nowych adapterów, routera i czterech endpointów.
- Testy sterowania łańcuchem: 10 APINEX + Z.ai + lokalny, wspólne 429, weryfikacja JSON, niepoprawne odpowiedzi, niezależne Google, Groq Qwen bez `reasoning_effort`.
- Przeglądarkowa akceptacja dawnych i nowych dostawców, metadane odpowiedzi, brak komunikatu „przez AI”.
- Testy RC30, RC31, RC32 dialogów i przekazywania kontekstu.

## Znane granice dowodu
Nie wykonywano rzeczywistych wywołań produkcyjnych APINEX, Z.ai, Google, Groq ani zapisu do Supabase. Przetestowano ich kontrakty i reakcje na symulowane błędy. Poprawność pracy po wdrożeniu i jakość polskich wypowiedzi wymagają testu rzeczywistych modeli z dostępnymi kluczami użytkownika.
