# Przegląd błędów i 100 pytań — RC16

## Co wynika z materiału użytkownika i kodu

1. Odpowiedź Marka „której zgłaszałem zastrzeżenia” odwraca kierunek czynności. Publiczny kanon mówi: Lena zgłaszała zastrzeżenia do bezpieczeństwa wagonu. RC15 dodawał wąską kontrolę tego błędu i silniejsze instrukcje audytu. Kontrola nie zastępuje pełnego sprawdzania semantycznego.
2. Odpowiedź na „Kto to potwierdzi?” wymieniała dokumenty i nieokreślone „służby biurowe”. Nie wyjaśniała, czy istnieje osobowy świadek. Publiczne fakty o Marku nie podają osoby obserwującej go przez całą noc. Brak takiego faktu nie oznacza jednak dowodu, że nikt nigdy go nie widział.
3. Pierwsza odpowiedź o alibi mogła nadmiernie wzmacniać rejestr i połączenia: kontakt telefoniczny nie potwierdza fizycznego miejsca pobytu. Pytania muszą osobno sprawdzać zakres alibi i zakres każdego źródła.
4. „Znany mi był pracownik […] Lena” ma błąd rodzaju i nienaturalny styl. Nie należy naprawiać tego automatycznym podmienianiem faktów.
5. Dotychczasowe testy z kontrolowanymi odpowiedziami nie mierzyły realnego rozumienia wszystkich wariantów pytań. Sam pozytywny wynik transportu ani udany audyt testowy nie dowodzą jakości modelu produkcyjnego.
6. Przegląd RC15 wykazał fałszywe odrzucenie negacji: „Nie zgłaszałem jej zastrzeżeń”. RC16 wyłącza negowane formy z wąskiej kontroli odwrócenia ról. Nadal odrzuca zdanie zawierające osobną dodatnią deklarację zgłaszania. Dodano kontrastowe testy.
7. Timeout Gemini i HTTP 429 Groq są odrębnymi problemami dostępności. Dodanie pytań do testów nie usuwa limitów usług.

## Nowa baza

`tools/fixtures/interview-questions-rc16.json` zawiera dokładnie 100 nowych, unikatowych pytań: 10 grup po 10 przypadków. Każdy ma ID, kategorię, świadka, potrzebną historię rozmowy, wymagane publiczne źródła i kryteria oceny. Czytelna lista jest w `BAZA-PYTAN-RC16.md`.

Kategorie: zakres alibi; osobowy świadek; rejestry; telefon i miejsce pobytu; relacja z Leną; kierunek zgłoszenia; źródło wiedzy; krótkie dopytania; przeczenia; pytania złożone.

To zestaw regresyjny, nie szablony dialogów ani słownik sterujący odpowiedziami. Pytań nie dodano do promptu produkcyjnego ani do interfejsu gry. Modele nadal otrzymują własne pytanie gracza i autorytatywne fakty.

## Co rzeczywiście sprawdzono

`npm run test:question-corpus` sprawdza 100 przypadków: unikatowość, źródła dostępne od początku gry, zachowanie historii i pełnego pytania, przesłanie faktów do warstwy AI oraz bezpieczną obsługę jawnej odmowy modelu. Obejmuje też regresję negacji wykrytą w RC15.

Nie jest to 100 udanych rozmów z prawdziwym API. Każdy przypadek ma `liveResult.status: not_run`. Ocena języka, trafności i semantyki wymaga rzeczywistej odpowiedzi i kryteriów zapisanych w `rubric`. Nie wykonano płatnych ani produkcyjnych wywołań API.

## Wdrożenie

Ta paczka zastępuje RC15. Wgraj całą zawartość i wykonaj Redeploy Vercel. `/api/status` powinno wskazywać `6.37-QUESTION-CORPUS-RC16`. Zachowano Gemini low przy generowaniu, medium przy audycie i Groq jako rezerwę. Stare wypowiedzi w zapisie gry pozostają niezmienione.
