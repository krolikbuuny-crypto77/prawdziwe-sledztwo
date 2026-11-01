# Prawdziwe Śledztwo 6.38 RC35.5 — czat u dołu i naprawa przejmowania sterowania

## Zmiany

1. Czat jest zwijanym panelem w **dolnym prawym rogu**. Przycisk „Czat graczy” pozostaje dostępny przy przewijaniu śledztwa. Rozwijany panel ma wewnętrzne przewijanie i nie wymaga wracania na górę strony.
2. **Sterowanie** jest wyraźnie pokazane w dolnym lewym panelu. Osoba obserwująca ma przycisk **Przejmij sterowanie** i informację o wyniku operacji; osoba sterująca widzi status „Sterujesz wspólną grą”. Jest to również widoczne po przewinięciu strony.
3. Przycisk przejmowania kontroli nie ignoruje kliknięcia podczas automatycznego pobierania danych pokoju. Konflikty wersji są ponawiane po stronie klienta i w `/api/coop`; starsza odpowiedź z odświeżania nie cofa potwierdzonego przejęcia.
4. Błąd odtworzenia widoku po przekazaniu kontroli nie maskuje udanego przekazania; użytkownik otrzymuje komunikat.
5. W trakcie generowania odpowiedzi AI serwer nadal blokuje przejęcie do końca odpowiedzi / wygaśnięcia blokady. Komunikat widoczny jest w dolnym panelu.
6. Na telefonach otwarty czat pojawia się **nad** panelem sterowania, a nie nad przyciskiem przejęcia. Zarezerwowano przestrzeń do przewijania dokumentów za elementami dolnymi.

## Wdrożenie

- **Jeżeli masz RC35.4**, rozpakuj małą poprawkę RC35.5 nad plikami RC35.4 w GitHub; zatwierdź zmiany.
- **Jeżeli nie masz RC35.4**, wgraj pełną wersję RC35.5.
- Poczekaj na Vercel → Deployments → Ready; użyj Ctrl+Shift+R.
- SQL 004 i 005 pozostają bez zmian — **nie wykonuj ich ponownie**.

## Szybki test w dwóch przeglądarkach

1. Gracz A tworzy pokój, B dołącza, wpisując kod.
2. Gracz B przewija do środka dokumentu; dolny przycisk **Przejmij sterowanie** jest dostępny.
3. B klika przycisk. Po potwierdzeniu widzi „Sterujesz wspólną grą”, A widzi „Steruje drugi gracz”.
4. B przechodzi do innej zakładki: A powinien zobaczyć zmianę.
5. Otwórzcie przyciskiem **Czat graczy** dolny panel; wyślijcie wiadomości w obie strony.
6. Jeżeli trwa generowanie przesłuchania, przejęcie jest tymczasowo blokowane. Po zakończeniu odpowiedzi działa ponownie.

## Co sprawdzono

- Build, check, lokalna integracja dwubrowserowa, czat, przejęcie podczas wolnego odświeżania, układ na ekranach 320/375/390/640/768/1024/1440 px.
- To nie zastępuje testu z rzeczywistą bazą Supabase i wdrożeniem Vercel, do których nie wykonywano produkcyjnych zapytań.
