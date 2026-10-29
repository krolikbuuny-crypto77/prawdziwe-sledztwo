# Uzupełnienie — Pakiet 6.20

Rozpakuj paczkę **do katalogu głównego repozytorium na gałęzi testowej**. Zawiera nowy plik `lib/dialogue-continuity-620.js`, rozszerzoną integrację `api/interview.js` i wygenerowany `index.html`. Zachowaj istniejący backend Cloudflare (`api/evaluate`) i inne pliki `lib`, jeśli nie występują w paczce. Nie zamieszczaj kluczy API w repozytorium. Nowe migracje Supabase nie są potrzebne. Po wdrożeniu uruchom test rozmowy na Vercel Preview.

> **Aktualizacja 6.19:** Paczka zawiera pełną wersję 6.18 wraz z fabułą 2.0. Nie dodano tabel Supabase. Zobacz README-PAKIET-6.19.md. Nie umieszczaj żadnych kluczy API w repozytorium.

# Pakiet 6.17 — wdrożenie GitHub + Vercel + Supabase

1. Rozpakuj ZIP i skopiuj jego zawartość do katalogu głównego repozytorium.
   Najbezpieczniej na nowej gałęzi i w Vercel Preview. **Nie nadpisuj ani nie
   usuwaj** istniejącego `/api/evaluate` i `/lib` bez porównania zmian —
   zachowaj dodatkowe pliki z poprzedniego wdrożenia.
2. W Supabase utwórz projekt i uruchom w SQL Editor:
   `supabase/001_game_sessions.sql`. Tabela używa RLS; anon i authenticated
   nie mają prawa zatwierdzania progresu. Funkcję CAS wywołuje tylko backend
   z kluczem service_role.
3. W Vercel ustaw sekrety środowiskowe ZAI_API_KEY, ZAI_MODEL,
   GROQ_API_KEY, GROQ_MODEL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
   GAME_SESSION_SECRET (minimum 32 losowe znaki). Istniejące zmienne
   CLOUDFLARE_ACCOUNT_ID i CLOUDFLARE_API_TOKEN zachowaj bez zmian.
   **Nigdy nie wklejaj sekretów do GitHuba, index.html ani repozytorium.**
4. Upewnij się, że trasy Vercel `api/interview.js`, `api/game-state.js`,
   `api/game-session-reset.js` oraz `api/evidence-review.js` są wdrożone.
   Backend korzysta z ESM w `api/package.json` i `lib/package.json`.
5. Na Vercel Preview przetestuj w kolejności: zwykłe pytanie do świadka,
   wymuszoną niedostępność Z.ai, awarię obu dostawców, zapis i wznawianie,
   offline i powrót połączenia, świadome wyzerowanie gry, analizę Cloudflare.
   Sprawdź też z realnymi kluczami, że API nie ujawnia sekretów.
6. Po aktualizacji fabuły uruchom `node tools/generate-server-rules.mjs`,
   porównaj wygenerowane reguły z bramkami, potem `npm run build` i `npm run check`.

**Nie oznaczaj ukończenia sprawy jako „zatwierdzone przez Supabase”.** Na tym etapie
backend zatwierdza wyłącznie obsługiwane podstawowe pozyskiwanie materiałów
oraz prowadzi dziennik zweryfikowanych odpowiedzi AI. Pełny serwerowy finał,
minigry i pozostałe warunki rozgrywki wymagają kolejnego etapu migracji.


## Nowość 6.18 — zatwierdzanie postępu przez serwer

1. Wgraj również `lib/progression-618.js`, `lib/server-canon-618.json` i zmienione
   `lib/server-state.js` oraz `api/game-state.js` (bez usuwania innych endpointów).
2. W Vercel włącz Node.js 22, skonfiguruj `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
   `GAME_SESSION_SECRET` (min. 32 znaki). Nie publikuj wartości kluczy w repozytorium.
3. Uruchom istniejącą migrację `supabase/*.sql` z Pakietu 6.17, jeśli nie została wykonana.
   Pakiet 6.18 rozbudowuje JSONB `approved_state`, nie wymaga nowej tabeli.
4. Sprawdź `/api/game-state` po wdrożeniu: bez konfiguracji zwróci 503, co oznacza
   tryb wyłącznie lokalny; gotowe API ma zwracać stan serwerowy dla sesji.
5. Sprawdź grę na Vercel Preview, najpierw 5 minigier, potem oś czasu i finał;
   obserwuj komunikat zatwierdzenia serwera. Zapis lokalny nie oznacza zatwierdzenia.
6. Porównaj aktualny kod repozytorium przed nadpisaniem. **Nie usuwaj** istniejącego
   `api/evaluate` ani dodatkowych plików w `lib/`.

Przypomnienie: reguły sprawdzają poprawność przesłanych rozwiązań, lecz rozwiązania
znajdujące się w kliencie mogą zostać odczytane przez zaawansowanego użytkownika.
Do przeciwdziałania takiemu obejściu potrzebne byłyby wyzwania generowane i
rozliczane całkowicie po stronie serwera.

## Dodatkowe uwagi dotyczące wersji 6.21

1. Wgraj **rozpakowaną zawartość** paczki, nie sam plik ZIP. Najlepiej przygotować osobną gałąź i wdrożenie Vercel Preview.
2. Zastąp zmienione `api/interview.js` i `lib/server-state.js` razem z nowym `lib/dialogue-threads-621.js`.
3. Zachowaj wszystkie istniejące zmienne środowiskowe Z.ai, Groq, Cloudflare i Supabase; **6.21 nie wymaga nowych sekretów ani migracji SQL**.
4. Uruchom `npm run build`, `npm run check` i `npm run test:cinematic` oraz regresję.
5. Sprawdź lokalnie sceny przełomowe, a po wdrożeniu w Vercel Preview wykonaj test rozmów z oboma prawdziwymi API (jeśli są skonfigurowane). Brak wdrożenia produkcyjnego w tym pakiecie.

## Pakiet 6.22 — dodatkowa mimika świadków

1. Wgraj zawartość pełnego ZIP-a do gałęzi testowej na GitHubie; zachowaj istniejące dodatkowe pliki API i `lib`, których paczka nie zawiera (np. istniejący `/api/evaluate`).
2. Nowe pliki: `src/story/80-animated-faces-622.js`, `src/styles/80-animated-faces-622.css`, `tools/test-faces622.py`; zmieniono też `src/core/case-engine.js`, manifest i wygenerowany `index.html`.
3. Nie są potrzebne nowe sekrety API, nowe pakiety NPM ani migracje Supabase.
4. Uruchom `npm run check` i `npm run test:faces`. Sprawdź na Vercel Preview przesłuchania oraz istniejące sceny przełomowe, a na telefonie `prefers-reduced-motion`.
5. Po wdrożeniu konieczne jest potwierdzenie rzeczywistej wydajności i jakości ruchu. Do tego czasu nie oznaczaj animacji jako fotorealistycznej.

## Aktualizacja 6.23 — naturalniejsze przesłuchania

Wgraj `api/interview.js` razem z `lib/spoken-dialogue-623.js` do Vercel. Nowy moduł nie wymaga dodatkowych kluczy ani migracji. Kontrola sztucznego stylu może częściej przełączyć rozmowę z Z.ai na Groq; należy sprawdzić produkcyjny koszt i limity dostawców. Najpierw wdrożenie Preview i ręczny test jakości polskich dialogów, następnie ewentualne wdrożenie produkcyjne. Nie nadpisuj cudzych niestandardowych endpointów w istniejącym repozytorium.

## Pakiet 6.24 — bezpieczeństwo źródeł AI

1. Wgraj nowy `api/interview.js`, `lib/trusted-interview-624.js` oraz `lib/trusted-witness-canon-624.json` razem. Sam frontend bez backendu 6.24 nie zamyka podatności P0.
2. Zaktualizuj `src/integrations/35-zai-client.js`, `src/witnesses/81-out-of-scope-624.js`, `lib/server-state.js`, `index.html` i manifest.
3. Nie trzeba nowych sekretów ani migracji SQL. Do serwerowego zatwierdzania bramek wiedzy konieczne są prawidłowe zmienne Supabase i tajny klucz sesji na Vercel.
4. Po zmianach treści sprawy wykonaj `npm run generate:canon` i `npm run check`; eksport faktów ma pochodzić z autorskiego źródła, nigdy z żądania gracza.
5. Sprawdź w Vercel Preview: próbę fałszywego `factBank`, Z.ai→Groq, lokalny fallback, synchronizację offline i standardowy finał. Przed publikacją bezwzględnie porównaj aktualne pliki serwera z istniejącą produkcją.

## Pakiet 6.25 — dwa ulepszenia przesłuchań

Wgraj całą rozpakowaną paczkę na gałąź testową. Nowa warstwa `src/witnesses/82-relevance-and-voice-625.js` jest dołączona do istniejącej sekcji JS nr 60, a gotowy plik `index.html` został ponownie wygenerowany. **Nie są wymagane** zmiany w Supabase, kluczach Z.ai, Groq ani Cloudflare. Dla podglądu Vercel Preview wykonaj serię pytań o L-2, L-3, T-17 i sprzeczności bez okazywania dowodów, a następnie powtórz po okazaniu zatwierdzonych materiałów.
