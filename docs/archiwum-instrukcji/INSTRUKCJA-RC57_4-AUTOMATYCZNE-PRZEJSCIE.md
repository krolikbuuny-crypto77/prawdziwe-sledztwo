# RC57.4 — automatyczne przejście gry, Vercel Hobby

## Co robi symulator

W prywatnym panelu `/admin/testy` pojawia się przycisk **Przejdź automatycznie całą sprawę**.
Wykonuje trzy **oddzielne** przebiegi na izolowanym stanie serwera:

1. **Prawidłowa ścieżka**: od 13 początkowych dokumentów, przez odwiedziny, 29 oględzin, 20 wyszukiwań, analizy TCMS/wiadomości/CCTV/kryminalistyczne/dostępu, 20 punktów chronologii, sześciu świadków offline, akt oskarżenia, sześć obron i werdykt. Oczekiwany wynik: `solid`.
2. **Błędne oskarżenie**: te same rzeczywiste mechanizmy postępu, ale oskarżenie niewłaściwej osoby. Oczekiwany wynik: `returned`, a nigdy `solid`.
3. **Wznowienie**: po pozyskaniu dokumentów symulacja przechodzi przez serializację i odtworzenie struktury stanu, następnie kończy śledztwo. Oczekiwany wynik: `solid`.

Każda akcja trafia do historii: faza, nazwa operacji, status, liczba dokumentów, liczba zweryfikowanych zdarzeń, komunikat. **Jeżeli akcja się nie powiedzie, ścieżka zatrzymuje się i pokazuje krok powodujący błąd.** Przebiegi można wyeksportować do jednego pliku JSON. Żadna funkcja nie nadaje dokumentów testowi wprost. Wszystkie wyniki pochodzą z rzeczywistych walidatorów serwerowych.

## Instalacja

- Jeśli aktualną bazą jest **RC57.3 Hobby**, wystarczy poprawka `Prawdziwe_Sledztwo_RC57_4_HOBBY_POPRAWKA_DO_RC57_3.zip`. Wgraj jej pliki do odpowiednich katalogów GitHub i zatwierdź zmianę.
- Jeśli aktualna wersja jest starsza lub niepewna, użyj `Prawdziwe_Sledztwo_RC57_4_HOBBY_PELNA.zip` jako kompletnego zestawu projektu. Zabezpiecz starszy projekt i zapisy.
- W `api/` ma pozostać **12 plików funkcji `.js`**. Jeśli repozytorium zawiera stare `api/admin-rc57-ui.js` oraz `api/status.js`, usuń je z GitHub — aktualna funkcjonalność znajduje się w module administratora.
- Nie trzeba nowego SQL, klucza AI ani zmiennej środowiskowej. Zachowaj `RC57_ADMIN_PASSWORD` i `RC57_ADMIN_SECRET`.
- Po wdrożeniu na Vercel, otwórz `https://prawdziwe-sledztwo-mg15.vercel.app/admin/testy`, zaloguj się, kliknij **Przejdź automatycznie całą sprawę**, pobierz **dziennik JSON**.

## Jak rozumieć wyniki

- **Ukończona** = wszystkie oczekiwane działania i odmowy zostały rozpoznane przez walidatory, zakończenie wygenerowano zgodnie z regułami.
- **Nieukończona** = określony krok nie przeszedł i dalsza ścieżka została zatrzymana; raport pokaże jego nazwę.
- Raport ma trzy niezależne ścieżki. Stary audyt 380 przypadków, 600 testów dialogowych i tryb prawdziwego AI pozostają osobne.

## Czego NIE sprawdza automatyczne przejście na Vercel

To **serwerowa symulacja reguł**, a nie bot klikający wszystkie ekrany gry. Wyniki nie dowodzą, że przyciski, animacje, pliki zapisów, rzeczywiste API, autentyczny transport Supabase, współdzielone pokoje i wszystkie gałęzie fabularne działają w produkcji. Zeznania offline nie są faktami. Test wznowienia jest testem struktury JSON, nie podpisu zapisu SaveManager.

Rzeczywiste testy przeglądarki wymagają uruchomienia lokalnie lub w CI z Playwright. Do projektu dołączono `tools/test-rc57-playthrough-browser.py`, `tools/test-navigation.py` i starsze testy kooperacji. `npm run test:rc57-playthrough` uruchamia nowy zestaw regresji lokalnej. Nie uruchamia API produkcyjnego ani nie modyfikuje danych użytkowników.
