# RC31 – immersyjne oczekiwanie podczas przesłuchań

Ta paczka jest oparta bezpośrednio na pełnej RC30.

## Zmiana

- Usunięto widoczny komunikat „Świadek przygotowuje odpowiedź przez AI…”.
- W trakcie oczekiwania w rozmowie pozostaje neutralne „Formułuje odpowiedź…”.
- Nie zmieniono działania modeli AI, walidacji, historii dialogów ani Supabase.
- Komunikaty o rzeczywistych błędach i limicie nadal pojawiają się, żeby nie ukrywać problemów przed graczem.

## Wdrożenie

Rozpakuj pełną paczkę i wgraj zawartość do aktualnego repozytorium gry, bez tworzenia nowego projektu Vercel. Po wdrożeniu zrób Ctrl+Shift+R.

Alternatywnie podmień tylko `src/integrations/35-zai-client.js`, jeśli Twoja aktualna wersja bazuje na RC30. Wtedy Vercel musi ponownie wykonać `npm run build`, ponieważ produkcyjny `index.html` jest generowany z plików w katalogu `src`.

## Uwaga

Paczka bazuje na wcześniejszej wersji RC30, która nie została przetestowana end-to-end na produkcyjnym API. Ta zmiana nie poprawia ani nie pogarsza jakości generowanych wypowiedzi — dotyczy tylko komunikatu oczekiwania.

## Testy

- `npm run build` – OK.
- `npm run check` – OK.
- `node tools/test-rc31-immersive.mjs` – OK (oczekiwanie bez ujawniania AI; błędy nadal widoczne).
