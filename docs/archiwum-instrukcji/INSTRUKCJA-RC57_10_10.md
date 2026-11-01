# Prawdziwe Śledztwo — RC57.10.10 (naprawa testów AI-011/AI-012)

## Wybór paczki

- Pełna paczka `Prawdziwe_Sledztwo_RC57_10_10_HOBBY_PELNA.zip`: jeśli nie masz pewności co do wersji na GitHub lub nie wgrywano wcześniej RC57.10.9.
- Paczka różnicowa `Prawdziwe_Sledztwo_RC57_10_10_POPRAWKA_DO_RC57_10_9.zip`: tylko jeśli źródło na GitHub odpowiada **dokładnie** RC57.10.9. Rozpakuj i nadpisz pliki, zachowując katalogi `lib/` i `tools/`.
- Nie wrzucaj pliku ZIP do repozytorium jako pojedynczego pliku. Wgrywa się **rozpakowaną zawartość**. Najpierw użyj gałęzi Preview / Vercel Preview.

## Co naprawiono

1. Pytania AI-011 „Wrócę do wcześniejszej odpowiedzi: co jest potwierdzone, a co nie?” i AI-012 „Proszę podsumować, jakie granice swojej wiedzy wskazałeś w trakcie rozmowy” są teraz rozpoznawane jako prośby o streszczenie zatwierdzonych słów. Ich sensowne powtórzenie nie jest automatycznie błędem `dialogue_near_repetition`.
2. Kontrola `memory_evasion` odnosi się teraz do faktycznej odmowy przypomnienia **własnych słów**, a nie do braku pamięci godzin lub kolejności wydarzeń. Rzeczywiste unikanie przypomnienia własnej wypowiedzi pozostaje wykrywalne.
3. Formalny styl i semantyczne podobieństwo są nadal raportowane jako ostrzeżenia QA. Nie odrzuca się bezpiecznej wypowiedzi tylko dlatego, że może brzmieć sztywno. Nie zmieniono twardej kontroli faktów ani niezależnego audytu semantycznego.
4. Pytanie o dosłowne przypomnienie wcześniejszej wypowiedzi (AI-007) nie dostaje ostrzeżenia wyłącznie z powodu powtórzenia koniecznej frazy.
5. Dodano wskazówki dla modelu, by przy podsumowaniu rozdzielał **co potwierdza** od **czego nie wie**, bez recytowania całego alibi ani tworzenia nowej wiedzy.

## Kontrola po wdrożeniu

1. Przed przeładowaniem strony eksportuj obecny raport JSON z testu. Wznowienie po przeładowaniu może utracić token i postęp w karcie.
2. Na Vercel Preview uruchom `npm run check` i `npm run build` oraz `node tools/test-rc571010-testimony-recap.mjs`.
3. Uruchom test `72 pytań` w jednej karcie, obserwując AI-007, AI-011, AI-012; jeśli pojawi się `blocked`, pobierz JSON z przyczyną (`qualityDiagnostics`, `rejectedChecks`).
4. Sprawdź ręcznie naturalność, a w szczególności powtarzanie „nie odtwarzam ich kolejności”. `pass` oznacza wynik kontroli automatycznej, a nie gwarancję naturalności dialogu.
5. Po teście na produkcji można wyłączyć `RC57_LIVE_TEST_ENABLED`, jeśli nie ma potrzeby zużywania puli API.

## Czego nie zmieniono

Nie zmieniono kluczy, zmiennych środowiskowych, Supabase, SQL, zapisów, kanonu, reguł dowodów, werdyktu ani liczby funkcji `api/`. Nie wywoływano rzeczywistego dostawcy Apinex. Nie gwarantuje się 0 ostrzeżeń ani braku zewnętrznych timeoutów. Nie zmieniano schematu tokena wznowienia.
