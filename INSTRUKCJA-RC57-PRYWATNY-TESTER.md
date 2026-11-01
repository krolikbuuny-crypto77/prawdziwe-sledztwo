# Prawdziwe Śledztwo 6.38 — RC57: prywatny tester śledztwa (wersja 1)

## Gdzie otworzyć panel?
Po wgraniu RC57 na GitHub i udanym wdrożeniu Vercel:

**https://prawdziwe-sledztwo-mg15.vercel.app/admin/testy**

Ta ścieżka jest osobnym panelem admina. Nie występuje w menu gry, a plik `index.html` gracza nie został zmieniony.
Osoba bez hasła może zobaczyć jedynie stronę logowania. Pobieranie wyników i uruchamianie testów sprawdza podpisaną sesję na serwerze.

## Instalacja
1. Zachowaj kopię RC54 (pełną paczkę) i swoich zapisów.
2. Zainstaluj pełną RC57 albo poprawkę **RC54 → RC57**. Podczas wgrywania na GitHub zachowaj katalogi `api`, `lib`, `tools` oraz `vercel.json`.
3. Wejdź w Vercel → projekt → **Settings → Environment Variables** i dodaj **dwie osobne, tajne zmienne** dla Production (oraz Preview, jeżeli testujesz Preview):
   - `RC57_ADMIN_PASSWORD` — Twoje unikalne, mocne hasło o długości przynajmniej **20 znaków**.
   - `RC57_ADMIN_SECRET` — **inny** niezależny losowy sekret o długości przynajmniej **32 znaków**.
4. Dla `RC57_ADMIN_SECRET` możesz użyć PowerShell na swoim komputerze (wynik wklej tylko do Vercel):
   ```powershell
   $bytes = New-Object byte[] 32
   $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
   $rng.GetBytes($bytes)
   [Convert]::ToBase64String($bytes)
   ```
5. Po dodaniu zmiennych wykonaj **Redeploy**; nowe zmienne nie aktywują się w starym wdrożeniu.
6. Otwórz adres `/admin/testy`, wpisz hasło, wybierz **Szybki — 60** albo **Pełny — 600** i kliknij **Uruchom test**.
7. Po zakończeniu możesz zapisać raport przyciskiem **Eksportuj JSON**. Po 4 godzinach wygasa sesja logowania; użyj **Wyloguj**, gdy skończysz.

**Nie wpisuj hasła ani sekretu do GitHub, `.env.example`, ZIP-ów, czatu ani kodu klienta.**

## Co rzeczywiście sprawdza RC57 v1?
- 600 powtarzalnych przypadków (6 postaci × 10 kategorii × 10 wariantów), uruchamianych po 20 przypadków na żądanie.
- Oryginalny parser RC50: rozpoznawanie wątków, korekt, negacji i nacisku.
- RC51/RC52: styl odpowiedzi, pamięć 40–76 wcześniejszych wymian, izolację wiedzy postaci.
- Reguły `validateAction` i `verifyOfflineTurn`: odrzucenie nieuprawnionego odblokowania, status lokalnej wypowiedzi.
- Sprawdzenie odmowy dla fałszywych tokenów kooperacji i obcego `Origin`.

**Ograniczenia (ważne):**
- RC57 v1 **nie wysyła 600 rozmów do dostawców AI**. Testy są deterministyczne i służą wykrywaniu regresji w prawdziwych funkcjach serwerowych.
- Bezpośrednio z panelu nie uruchamia dwóch produkcyjnych przeglądarek, nie zrywa faktycznego internetu i nie wykonuje operacji na istniejących pokojach. Osobne lokalne testy kooperacji i zapisów pozostają w katalogu `tools`.
- Nie ma współdzielonej bazy wyników: po odświeżeniu panelu nieukończony raport zostaje utracony, chyba że go wyeksportowano. Panel działa w serwerless bez kolejnej migracji Supabase.
- Testy produkcyjne z rzeczywistym AI i pełny test w dwóch przeglądarkach to kolejny zakres prac; nie są włączane automatycznie, by nie zużywać limitów API ani nie ruszać zapisów użytkowników.

## Wynik referencyjny RC54 → RC57
Pełny zestaw w kontrolowanym środowisku: 540 zaliczonych, 42 ostrzeżenia i 18 błędów analizatora. Problemy dotyczą ograniczonego rozpoznawania niektórych postaci pytań negujących i presji słownej; są raportowane zamiast maskowane. RC57 nie zmienia parsera ani kanonu gry, żeby tester mierzył istniejące zachowanie.

## Bezpieczeństwo
- Dwie zmienne tylko na serwerze Vercel.
- `HttpOnly; Secure; SameSite=Strict`, 4-godzinna sesja podpisana HMAC-SHA-256.
- Constant-time porównanie skrótów haseł, podstawowy lokalny limit nieudanych logowań (limiter działa per instancja; **nie** jest globalnym WAF).
- Serwerowa autoryzacja każdego żądania testowego; `Origin` i typ `application/json` sprawdzane przy POST.
- CSP, noindex, no-store, brak łącza do panelu na ekranie gry.
- Nie ma odczytu/zapisu Supabase ani wywołań API modeli podczas testów, brak zmiany reguł werdyktu.

**Zastrzeżenie:** samo niewidoczne menu nie chroni panelu; po poznaniu adresu osoba postronna zobaczy formularz logowania. Dostęp do danych/testów wymaga poprawnego hasła i sesji. W przypadku udostępniania aplikacji publicznie warto dodatkowo użyć Vercel Firewall/WAF dla `/admin/testy` i `/api/admin-rc57`.
