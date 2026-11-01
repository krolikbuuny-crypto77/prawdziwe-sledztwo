# Prawdziwe Śledztwo — RC57.10.8

## Co zmieniono
- Generowanie przesłuchań korzysta z krótkiej wskazówki stylu opartej wyłącznie na **wcześniejszych zatwierdzonych wypowiedziach tego świadka**. Model dostaje informację, których gotowych formułek już używał, bez nowych faktów i bez kolejnego wywołania AI.
- Instrukcja główna zaczyna od odpowiedzi na konkretne pytanie, ogranicza urzędowe frazy, długie powtórki i sztuczne metafory o raportach.
- Pojawił się sygnał `stock_phrase_repetition` w audycie jakościowym, odróżniony od błędów fabularnych. W niektórych przypadkach rażąco nienaturalne zdanie jest odrzucane przed audytem semantycznym, w ramach istniejącej pojedynczej próby korekty.
- Tester dokładniej opisuje stały błąd konfiguracji/modelu, płatności lub wyczerpania dziennej puli i nie zaleca bezsensownych ponowień. Dla chwilowego 429 i timeoutu nadal pozwala wznowić to samo pytanie, bez zmiany podpisanej historii.

## Instalacja
1. Jeśli aktualną bazą jest dokładnie **RC57.10.7**, rozpakuj `Prawdziwe_Sledztwo_RC57_10_8_POPRAWKA_DO_RC57_10_7.zip` do katalogu źródłowego gry, nadpisując ścieżki `lib/...`. Nowy plik `lib/interview-style-cue-rc57108.js` musi zostać dodany. Plik testowy w `tools/` jest pomocniczy.
2. Jeśli wersja repozytorium jest niepewna lub starsza, użyj pełnej paczki `Prawdziwe_Sledztwo_RC57_10_8_HOBBY_PELNA.zip` i wgraj **rozpakowane pliki**, a nie ZIP jako pojedynczy plik.
3. `npm run check && npm run build`, a następnie test na **gałęzi Preview** w Vercel. Zachowaj istniejące zmienne środowiskowe. Brak nowych sekretów i migracji SQL.
4. W prywatnym panelu uruchom test 18 pytań, najlepiej jeden na raz. W razie `blocked` zachowaj raport JSON: odczytaj `failureDiagnostics.code`, `phase`, `upstreamStatus`, `quotaKind`, `retryAfterSeconds`. Resume dla błędów przejściowych jest ręczne i dotyczy tego samego pytania.
5. Oceń naturalność ręcznie, zwłaszcza Marka i Tomasza. `pass` w audycie faktów nie gwarantuje ludzkiej naturalności dialogu.

## Bezpieczeństwo i ograniczenia
Nie zmieniono kanonu, dokumentów, reguł odblokowań, werdyktu, identyfikatorów dowodów, formatu zapisu ani bazy Supabase. Nie uruchomiono prawdziwych połączeń z Apinex; zewnętrzne limity i jakość modelu wymagają testu po wdrożeniu. Nie uruchamiaj równolegle wielu testerów, aby omijać limity dostawcy.
