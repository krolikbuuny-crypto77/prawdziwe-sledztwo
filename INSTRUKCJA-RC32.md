# Prawdziwe Śledztwo 6.38 RC32 – żywsze przesłuchania

## Co zmieniono

- AI reaguje na **rodzaj pytania**: alibi, świadek potwierdzający, miejsce, zarzut niejasnej wypowiedzi, nieufność, zarzut przemocy i okazany dowód.
- Podejrzenie „coś ukrywasz” nie jest automatycznie traktowane jak oskarżenie o zabójstwo.
- Przy dopytywaniu o miejsce, godzinę lub powód świadek nie powinien automatycznie powtarzać formuły o dokumentach.
- Każdy z sześciu świadków ma indywidualne wskazówki rytmu i sposobu reagowania, z uwzględnieniem przebiegu rozmowy.
- Model otrzymuje zasadę: **fakty służą do uzasadnienia odpowiedzi, nie do recytowania ich całej treści**.
- Zmiany służą wyłącznie generowaniu lepszego języka: nie dopisują wydarzeń, motywów ani nowych dowodów.
- Bez dodatkowego wywołania AI dla poprawiania samej naturalności. Pozostają stare próby naprawy odpowiedzi niezgodnych z faktami lub nie na temat.

## Jak wgrać

Pełną paczkę rozpakuj i wgraj do tego samego repozytorium GitHub, z którym połączony jest istniejący projekt Vercel. Nie twórz nowego projektu. Zachowaj kopię poprzedniej wersji.

Dla aktualnej wersji RC31 wystarczy podmienić/dodać trzy pliki z **małej poprawki**:
- `api/interview.js` (podmień),
- `lib/interview-naturalness-rc28.js` (podmień),
- `lib/dialogue-direction-rc32.js` (dodaj).

Wersja pełna zawiera wszystkie pliki RC31 oraz nową warstwę RC32. Skrypt `npm run build` nadal generuje `index.html`; konfiguracji Vercel, kluczy i Supabase nie zmieniano.

## Test w grze

Zadaj Markowi po kolei: „Masz alibi?”, „Kto może to potwierdzić?”, „Nie pytam o dokumenty. Gdzie dokładnie byłeś?”, „Dlaczego wcześniej mi tego nie powiedziałeś?”, „Mam wrażenie, że coś przede mną ukrywasz”.

Sprawdź, czy odpowiada na właściwy szczegół, nie wraca w każdej turze do rejestrów i nie interpretuje nieufności jako zarzutu przemocy. Powtórz krótkie testy z pozostałymi pięcioma świadkami. To test po wdrożeniu: bez rzeczywistych wywołań do Twoich modeli nie da się potwierdzić wzrostu naturalności.

## Testy techniczne

- `npm run check`: OK.
- `npm run build`: OK.
- `node tools/test-rc32-dialogue.mjs`: OK – 8 typów pytań, 6 świadków, przesyłanie wskazówek i brak zbędnej próby AI.
- `node tools/test-rc30-nonblocking-naturalness.mjs`: OK.
- `node tools/test-rc31-immersive.mjs`: OK.
- `node tools/test-ai-understanding637.mjs`: OK.
- `node tools/test-followup-rc4.mjs`: OK.
- `node tools/test-release-candidate636.mjs`: OK.
- `node tools/test-provider-acceptance-rc29.py`: OK.
- `python tools/test-navigation.py`: OK.

**Wciąż nieprzechodzące starsze testy:** `test-dialogue635.mjs`, `test-api624-integration.mjs`, `test-security624.mjs`, `test-witness-dossiers-rc5.mjs`. Wszystkie cztery nie przechodzą także w oryginalnej RC31 z tymi samymi błędami; nie należy przedstawiać tego zestawu jako pełnej zielonej regresji.

Nie przeprowadzono testów na produkcyjnym API, ponieważ klucze użytkownika są poza środowiskiem testowym. Paczka jest kandydatem do wdrożenia, nie niezależnie potwierdzoną produkcją.
