# Aktualizacja RC12 — Gemini medium

Przesłuchania: thinking `medium` (wcześniej `high`). Audyt pozostaje `medium`, finał pozostaje `high`.

Budżet Gemini przed rezerwą Groq: 28 s zamiast 22 s. Cały budżet AI: 52 s zamiast 46 s. Limit klienta: 60 s zamiast 54 s. Limit funkcji Vercel: 60 s.

Generowanie Gemini: do 20 s, aby pozostawić do 8 s na audyt w ramach okna 28 s. Są to limity maksymalne; odpowiedź jest zwracana od razu po zatwierdzeniu.

Poniższy opis RC11 dokumentuje poprzednią wersję; aktualne limity podano powyżej. Status nowego wdrożenia: `6.37-MEDIUM-RC12`.

# Naprawa przesłuchań — 6.37 RC11

## Co zmieniono

- Po błędzie, limicie, niedostępności lub odrzuceniu odpowiedzi Gemini serwer próbuje Groq (`openai/gpt-oss-20b`, istniejące ustawienie `GROQ_DEDUCTION_BACKUP_MODEL`).
- Gdy dostępny jest Groq, Gemini otrzymuje maksymalnie 22 sekundy na generowanie, poprawki i audyt razem. Cała część AI zachowuje budżet 46 sekund i rezerwę na zapis. Limit przeglądarki wynosi 54 sekundy; funkcji Vercel 60 sekund.
- Groq przechodzi ten sam zestaw kontroli jakości i audyt semantyczny. Klient akceptuje zatwierdzoną, zapisaną przez serwer odpowiedź z pasującym identyfikatorem tury.
- Oczekujące pytanie i komunikat odpowiedzi są odtwarzane po przejściu do innego modułu i powrocie. Nie są dopisywane do zatwierdzonej historii przed sukcesem.
- Ponowne renderowanie rozmowy utrzymuje blokadę wysyłania podczas żądania. Po zakończeniu odświeżane są statystyki.
- Diagnostyka zachowuje poprawną nazwę Gemini zamiast zastępować ją nazwą „server”.

## Wdrożenie

1. Wgraj zawartość paczki do głównego katalogu projektu: obejmuje `index.html`, `api/`, `lib/`, `src/`, `tools/` i dotychczasowe zasoby. Sam `index.html` nie naprawi serwera.
2. W ustawieniach Vercel musi istnieć `GROQ_API_KEY`. Pozostaw ustawienia Gemini oraz istniejące zmienne Supabase i sekret sesji. Nie umieszczaj kluczy w plikach gry.
3. Uruchom nowe wdrożenie Vercel. `/api/status` powinno pokazywać `6.37-AI-REPAIR-RC11`.
4. Zadaj pytanie świadkowi, przejdź do Akt i wróć do Przesłuchań. Oczekujące pytanie powinno pozostać widoczne, a po odpowiedzi ponowne wysyłanie powinno być dostępne.

## Sprawdzenie

Zaliczone: budowa i kontrola projektu, składnia, zgodność zasobów i kanonu, testy adapterów RC8/RC9/RC10, serwerowy test RC11 (błąd, timeout, limit, brak modelu Gemini, brak klucza Gemini, przejęcie przez Groq i brak odpowiedzi obu dostawców), testy wiedzy świadków, rozumienia pytań i pytań uzupełniających.

Test wykonania pełnego HTML w JSDOM potwierdził zachowanie pytania podczas nawigacji, brak zmian stanu podczas oczekiwania, przyjęcie odpowiedzi Groq dokładnie raz, odblokowanie formularza i przywrócenie pytania po błędzie. Brak błędów JavaScript w tym teście.

Nie wykonano testu nowych plików w Chromium: pobranie przeglądarki w środowisku testowym zwracało nieprawidłowe archiwum. Test `tools/test-pending-rc11.cjs` jest dołączony do uruchomienia z Playwright i zainstalowanym Chromium. Test DOM wymaga pakietu `jsdom`.

Próby API używały kontrolowanych odpowiedzi testowych, bez prawdziwych kluczy i bez zapisów do produkcyjnego Supabase. Dostępność modeli, limity kont i konfiguracja produkcyjnego Vercel wymagają sprawdzenia po wdrożeniu. Ta paczka nie została wdrożona na publiczną stronę.

Po awarii obu dostawców gra zachowuje pytanie i umożliwia ponowienie; nie dopisuje niezweryfikowanej wypowiedzi lokalnej do historii świadka.
