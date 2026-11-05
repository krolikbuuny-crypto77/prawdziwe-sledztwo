# RC23 — rozmiar żądań i prawidłowa diagnoza dostawców

## Co wynika z dwóch logów użytkownika
Obie próby zakończyły się przed uzyskaniem odpowiedzi: Gemini 503 UNAVAILABLE w fazie generate, a następnie Groq 413 z rate_limit_exceeded i tokens_per_minute. Nie było odrzuceń jakości, audytu ani prób poprawienia odpowiedzi. Nie ma zatem podstaw przypisywać tych dwóch błędów odrzuceniu wiedzy przez audytora.

Google dokumentuje 503 jako czasową niedostępność/przeciążenie. Groq dokumentuje HTTP 413 jako zbyt duże żądanie wymagające zmniejszenia. Limity tokenów dotyczą organizacji i mogą być współdzielone przez użytkowników. Dokładny limit konta trzeba odczytać z jego ustawień lub odpowiedzi dostawcy.

Źródła: https://ai.google.dev/gemini-api/docs/troubleshooting oraz https://console.groq.com/docs/errors oraz https://console.groq.com/docs/rate-limits

## Poprawki
1. HTTP 413 jest klasyfikowane jako request_too_large, a nie upstream_unavailable. HTTP 429 pozostaje rate_limited. Klient pokazuje odrębny opis. Sam Retry-After z 413 nie wyznacza komunikatu „odczekaj i ponów identyczne żądanie”.
2. Adapter odczytuje jedynie bezpieczne liczby: tokenLimit i requestedTokens, jeśli są w nagłówku lub komunikacie dostawcy. Nie zapisuje surowego komunikatu, klucza ani treści pytania. Przy błędzie dodaje liczbę znaków, bajtów wejścia i limit wyjścia.
3. Usunięto rozrastające się, powtarzane instrukcje i zastąpiono je jednym krótszym kontraktem generowania i jednym kontraktem niezależnego audytu. Nie ma drugiej, ignorowanej wersji instrukcji.
4. Pakiet przewodowy przekazuje wszystkie identyfikatory i pełne teksty faktów. Ogranicza metadane techniczne, powtórzone instrukcje i duplikat treści presentedEvidence.summary. Cała treść okazanego dokumentu pozostaje w faktach. Zachowano oryginalne pytanie, rozmowę, istotne dawne deklaracje, korekty, informacje o negacji/ironii, strategię i części pytania dla audytora.
5. Dla przesłuchań Groq ustawiono reasoning_effort=low, limit generowania 1200 zamiast 2200 oraz audytu 900 zamiast 1100. Inne zastosowania Groq zachowują domyślny medium. Ustawienia Gemini low/medium i jego budżety wyjścia pozostają jak dotąd.
6. Nie usunięto niezależnego audytu, warunków ujawniania, walidacji factIds, sprawdzania liczb ani trwałego zapisu deklaracji. Nie dodano lokalnej odpowiedzi zamiast AI i nie zwiększono liczby ponowień.

## Pomiar
W reprezentatywnym teście „Masz alibi?” → „Kto to potwierdzi?” rzeczywisty pakiet HTTP do Groq zawierał 36 faktów i 11557 znaków instrukcji oraz JSON wejścia. Sprawdzono równość każdej pary [id, pełny tekst] przed i po pakowaniu. Wcześniejszy porównywalny pomiar RC22 wynosił około 28,5 tys. znaków. Nie jest to dokładny pomiar tokenów dostawcy ani rzeczywistej sesji użytkownika.

## Weryfikacja
Nowy test obejmuje pełny handler z kontrolowanymi odpowiedziami HTTP: Gemini 503, następnie zatwierdzona odpowiedź i audyt Groq; zachowanie wszystkich faktów; niskie reasoning i limity wyjścia; Groq 413 z bezpiecznie odczytanymi liczbami 8000/12345 i bez błędnego zalecenia samego oczekiwania.

Przeszły kompilacja, kontrola integralności kanonu/rejestru/chronologii, testy diagnostyki dostawców, awarii, ponawiania zapisanych odpowiedzi, równoległych zmian rozmowy, polszczyzny, trwałego dziennika i dostępu do dokumentów. Test wiedzy 830 pytań × 6 świadków potwierdził przekazywanie kontekstów po zmianie instrukcji.

Nie wywołano prawdziwego Gemini/Groq. Patch nie gwarantuje dostępności Google, dopasowania do każdego indywidualnego limitu konta ani usunięcia 429 przy kolejnych pytaniach. Jeśli problem wróci, nowe liczbowe pola diagnostyczne pozwolą odróżnić za duże pojedyncze żądanie od wykorzystanego budżetu.

## Wdrożenie
Wgraj pełną paczkę zamiast RC22, wykonaj Redeploy Vercel i odśwież grę. `/api/status` powinno wskazać `6.38-REQUEST-BUDGET-RC23`. SQL i klucze nie wymagają zmiany. Nie opublikowano paczki na Vercel.
