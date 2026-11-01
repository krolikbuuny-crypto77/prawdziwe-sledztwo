# PRAWDZIWE ŚLEDZTWO — PAKIET 6.26 (GitHub / Vercel)

Paczka jest **pełnym zestawem plików repozytorium**, nie samą łatką. Rozpakuj zawartość ZIP **bezpośrednio do katalogu istniejącego lokalnego repozytorium** (tam, gdzie znajdują się `index.html`, `src/`, `api/`, `lib/`, `assets/` i `vercel.json`). Zatwierdź i wypchnij zmiany przez GitHub Desktop.

## Naprawione usterki z testu produkcyjnego

1. **Jeden zapis wypowiedzi dla gracza**: po zakończeniu żądania AI tekst prezentowany w `dialogues` jest synchronizowany z `ps67.approved` i `ps68.witnesses[...].episodes` / `anchors`. Gdy AI nie jest dostępne, rejestrowane są także tury lokalne. Wymuszany jest dodatkowy autosave po zakończeniu odpowiedzi asynchronicznej.
2. **Niezmienny kanon**: osobne `ps67.canonical` i `canonical` w odcinkach pamięci `ps68` chronią oryginalne, lokalne zeznania przed promowaniem wypowiedzi AI do faktów. Serwerowe bramki dowodów i werdyktu są niezmienione.
3. **Pytania o alibi Marka**: rozpoznawanie miejsca pobytu osoby przesłuchiwanej, w tym doprecyzowań i zakresów godzin; nie miesza pytań o Lenę z pobytem świadka.
4. **Zgłoszenie alarmu przez Tomasza**: rozdzielenie znalezienia Leny i alarmu `02:02` od ostatniego spotkania z Leną żywą. Identyczne ograniczenie relewantności na serwerze dla Z.ai i Groq oraz na kliencie dla odpowiedzi lokalnych.
5. **Ostrzeżenie o drugiej karcie**: identyfikator karty zachowywany przy odświeżeniu, a ostrzeżenie powstaje tylko przy świeżym zapisie z odrębnego identyfikatora i aktywnej sesji.
6. **Odmiana po polsku**: `1 pytanie`, `2 pytania`, `5 pytań`, `1 zapis`, `2 zapisy`, `5 zapisów`.
7. **Diagnostyka providera**: odpowiedź `/api/interview` zawiera jawne, niesekretne pole `provider`: `zai`, `groq` lub `local` (dla fallbacku serwera).
8. **Zgodność starych zapisów**: import starszych `ps67` / `ps68` uzupełnia widoczną część pamięci na podstawie istniejącego zapisu dialogów, z pozostawieniem kanonicznej wersji jako osobnej informacji.

## Instalacja (GitHub Desktop)

1. W programie GitHub Desktop otwórz repozytorium `krolikbuuny-crypto77/prawdziwe-sledztwo` (gałąź `main`).
2. Wybierz **Repository → Show in Explorer**; w Eksploratorze Windows wejdź do katalogu repozytorium.
3. Zrób kopię folderu repozytorium na własny dysk (zalecane).
4. **Wypakuj ZAWARTOŚĆ archiwum ZIP do głównego katalogu repozytorium**, potwierdzając `Zastąp pliki w miejscu docelowym`. Nie wypakowuj dodatkowego katalogu `Prawdziwe_Sledztwo_6_26` do środka repozytorium. Nie kasuj folderu `.git`.
5. W GitHub Desktop przejrzyj zmiany, wpisz opis `Aktualizacja 6.26 - pamięć świadków i trafność przesłuchań`, kliknij **Commit to main** i **Push origin**.
6. Po wdrożeniu Vercel wykonaj nowy test na osobnej sesji gry. **Nie trzeba ponawiać SQL ani zmieniać kluczy API**, jeżeli obecna konfiguracja jest sprawna.

**Uwaga:** GitHub nie rozpakowuje automatycznie przesłanego ZIP-a. Nie przesyłaj tam samego archiwum jako pliku repozytorium — najpierw je wypakuj.

## Testy

- `npm run build`
- `npm run check`
- `python tools/test-quality626.py` (Playwright + Chromium)
- `node tools/test-interview626.mjs`
- `python tools/test-package68.py`
- `python tools/test-package67.py`
- `node tools/test-api624-integration.mjs`
- `node tools/test-security624.mjs`

Testy API z atrapami odpowiedzi **nie dowodzą**, że produkcyjne klucze Z.ai / Groq są poprawne. Po wdrożeniu zewnętrzne integracje należy zweryfikować w odpowiedzi `/api/interview` (pole `provider`) i logach Vercel. Nie ujawniaj wartości `Authorization` ani kluczy API.
