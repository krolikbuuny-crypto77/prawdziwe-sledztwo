# Pakiet 6.17 — Z.ai / Groq / lokalnie + serwerowy dziennik Supabase

## Przesłuchania: niewidoczny wybór modelu

Kolejność jest deterministyczna: Z.ai → Groq → lokalny WitnessEngine. Oba modele
używają **tego samego** system prompt, zatwierdzonego w kontekście banku faktów,
profilu świadka oraz tej samej zapisanej na serwerze historii zatwierdzonych
odpowiedzi (gdy Supabase jest skonfigurowane). Nie ogłaszamy zmiany dostawcy w UI.
Odpowiedź Z.ai nie przechodzi dalej wyłącznie dlatego, że HTTP 200: musi jeszcze
zaliczyć kontrolę trafności całego pytania, kompletności, faktów, godzin,
niepewności i niedozwolonych przyznań. Dopiero wtedy zostaje zapisana jako
**relacja świadka**, nie „bezsporny fakt”.

Próba Groq używa identycznej sceny. Gdy którykolwiek model zwraca błędny JSON,
nie odpowiada lub nie przechodzi walidacji semantycznej, następuje kolejna próba.
Gdy oba API nie mogą udzielić bezpiecznej odpowiedzi, gracz widzi wcześniej
wyliczoną odpowiedź lokalną bez utraty tury.

Zeznania są danymi: nawet zapisany tekst modelu nie zmienia ukrytych faktów
narracyjnych, bramek ani rozwiązania sprawy. „Model error” oznacza niezgodność
nowej odpowiedzi z wybranymi dozwolonymi źródłami. Fabularne sprostowanie
jest wyróżniane jedynie przy zgodności z **autorskim** skryptem i wymaganym
stanem dowodów. Brak tych przesłanek pozostaje „nierozstrzygniętą rozbieżnością”;
nie kwalifikujemy automatycznie jako celowego kłamstwa.

## Rozdzielenie kompetencji

- Z.ai: główna rozmowa ze świadkiem.
- Groq: zapasowa rozmowa ze świadkiem, gdy Z.ai zawiedzie również semantycznie.
- WitnessEngine: lokalne odpowiedzi i autorskie fakty / warunki fabularne.
- Cloudflare Workers AI: TYLKO pomocnicza analiza materiałów, bez praw do odblokowań,
  zmiany postępu czy werdyktu. Dotychczasowa trasa `/api/evidence-review` została zachowana.
- Supabase: osobny, serwerowo walidowany dziennik i zatwierdzone wypowiedzi.

## Bezpieczeństwo i integralność

`/api/game-state` nie przyjmuje dowolnego `STATE`, listy `found` ani gotowego
werdyktu jako stanu zatwierdzonego. Serwer korzysta z własnego katalogu 78
materiałów, 29 miejsc oględzin, dopuszczonych źródeł wyszukiwania oraz zależności
między materiałami. Weryfikuje znane metody i poprawną odpowiedź przy zabezpieczeniu
materiału po oględzinach. Stany po stronie Supabase mają kontrolę współbieżności
(revision/CAS). Sesje są odseparowane podpisanym ciasteczkiem HttpOnly.

Lokalny SaveManager zachowuje dotychczasowy format v11 i pozwala grać offline.
Sprawdzone zdarzenia są kolejkowane lokalnie, a przy ponownym połączeniu
przesyłane jako **propozycje** do walidacji. Niezaakceptowany zapis lokalny nie
staje się automatycznie serwerowym dowodem. Potwierdzony restart gry usuwa
zatwierdzony zapis poprzedniej sesji, gdy serwer jest dostępny; offline reset
czeka na synchronizację.

### Ważne ograniczenia — świadoma migracja etapowa

1. **Nie przeniesiono jeszcze pełnych reguł fabuły na serwer.** Zaawansowane
   minigry, pełna rekonstrukcja chronologii, wszystkie konfrontacje, analiza
   specjalistyczna i końcowa poprawność aktu oskarżenia nadal są wyliczane
   lokalnie. Serwer **odmawia zatwierdzania** ich jako stanu autorytatywnego,
   dopóki nie zostaną odwzorowane po stronie backendu.
2. Zapis offline i ręczny import pliku nadal zapewniają rozgrywkę lokalną,
   ale nie są automatycznym dowodem ukończenia dla Supabase. Niezatwierdzone
   zdarzenia mogą pozostać tylko lokalne.
3. Baza historii AI zawiera odpowiedzi sprawdzone z faktami przekazanymi
   przez lokalny silnik, **nie** pełną odtworzoną na serwerze wiedzę postaci.
   Aby uzyskać całkowicie zaufany, odporny na podmianę danych klienta kanon,
   kolejnym etapem jest port serwerowy lokalnych bramek i źródeł faktów.
4. Podpisana sesja przeglądarki nie jest logowaniem konta. Synchronizacja
   między urządzeniami wymaga Supabase Auth lub odrębnego konta gracza.
5. Żadnego prawdziwego klucza Z.ai, Groq, Cloudflare ani Supabase nie użyto
   w testach. Nie ma potwierdzenia zachowania na żywych API ani działającym
   projekcie Supabase.

## Najważniejsze pliki

- `api/interview.js` — wybór Z.ai → Groq, kontrola semantyczna, dziennik wypowiedzi.
- `api/game-state.js` — wejście do zatwierdzonego postępu (GET/POST).
- `api/game-session-reset.js` — reset sesji na serwerze.
- `lib/server-state.js` — podpis sesji, walidacja materiałów, Supabase i CAS.
- `lib/story-consistency.js` — błąd modelu vs autorski wątek sprostowania.
- `lib/approved-rules.js/json` — wyeksportowane reguły fabularne.
- `tools/generate-server-rules.mjs` — generator reguł po zmianie scenariusza.
- `src/integrations/75-verified-state-sync.js` — kolejka zdarzeń offline.
- `supabase/001_game_sessions.sql` — RLS, tabela, atomowa funkcja CAS.

## Testy

`npm run build`, `npm run check`, `npm run test:architecture`,
`npm run test:ai-primary`, `npm run test:saves`, `npm run test:witnesses`,
`npm run test:reasoning`, `npm run test:events`.
