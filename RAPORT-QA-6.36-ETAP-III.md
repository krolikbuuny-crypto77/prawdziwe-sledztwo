# Raport QA — Prawdziwe Śledztwo 6.36 / Etap III

Data: 30.10.2026. Baza: paczka testowa 6.36 Etap II. Nowa wersja: `6.36-III`.

## Zakres i wyniki

| Obszar | Wynik | Dowód / granica |
|---|---|---|
| Jeden budżet czasu | PASS, testy jednostkowe | `phaseTimeout` obejmuje generowanie, korektę i audyt; nie przekracza globalnego limitu |
| Rozdzielenie okna Z.ai i Groq | PASS, kod + symulacje | Z.ai ma pierwszeństwo, po nim Groq, a na końcu lokalny fallback |
| Rezerwa na zapis | PASS, kod | 1,1 s odjęte od puli wywołań modeli, lecz rzeczywisty Supabase może potrzebować więcej |
| Blokada URL źródeł projektu | PASS, walidacja konfiguracji | Dopasowanie reguł 404 dla kanonu/źródeł i brak blokowania `/`/`/api`/`/assets`; Vercel jeszcze nietestowany |
| Usunięcie jawnego testu osoby w finale | PASS, kontrola źródeł | Brak bezpośredniego porównania z zapisanym w JS prawidłowym sprawcą w trzech aktywnych modułach finału |
| Werdykt serwerowy dla bieżącego aktu | PASS, kontrola kontraktu | `actorStatusFor` wymaga `serverApproved`, zgodności osoby, mechanizmu, alibi, dowodu, kwalifikacji |
| Kompilacja i kontrola manifestu | PASS | `npm run build`, `npm run check`: 61 modułów JS, 64 sekcje CSS, kontrola assetów |
| Etap I + Etap II | PASS | `npm run test:stage2-636`, w tym 78/78 mapowań oraz 720 tur testowych |
| Starsze regresje przesłuchań | PASS | `npm run test:unified633`, `npm run test:priority1`, `npm run test:witnesses` |
| Test zapisu w przeglądarce `test:saves` | NIEUKOŃCZONY | Proces Playwright/Node zakończył się `EPIPE` w trakcie długiego uruchomienia; nie zaliczono |
| Z.ai / Groq w produkcji | NIEPRZETESTOWANE | Brak rzeczywistych pomiarów opóźnień, rate limitów i skuteczności odpowiedzi |
| Dostęp HTTP na Vercel | NIEPRZETESTOWANY | Konfiguracja zgodna ze sprawdzonym schematem, wymaga testu po wdrożeniu |
| Kompletny finał w Supabase | NIEPRZETESTOWANY | Nie sprawdzono realnego zatwierdzenia i odtworzenia z drugiego urządzenia |

## Ograniczenia i ryzyka do usunięcia przed premierą

1. **To nadal nie jest pełne ukrycie fabuły:** kod i dane lokalne są częścią publicznego `index.html`; pozostałe sekrety należy w dalszej kolejności przenieść do API albo zaakceptować możliwość analizy offline.
2. **Twardsze limity mogą częściej uruchamiać model rezerwowy lub odpowiedź lokalną** przy wolnym dostawcy. Bez pomiaru stagingowego nie można stwierdzić, czy średni czas i jakość w praktyce wzrosły.
3. **Zatwierdzenie osoby przez serwer jest teraz warunkiem pozytywnego finału:** offline możliwa jest lokalna symulacja i zapis, ale nie autorytatywny werdykt. Należy sprawdzić przebieg od złożenia aktu do odczytu wyniku na stagingu.
4. Reguły `vercel.json` chronią żądania HTTP, nie szyfrują kodu i nie wpływają na tekst już włączony do strony.
5. Zapisu z rzeczywistym Supabase oraz testów obciążenia nadal nie wykonano.

## Werdykt QA

**Wersja testowa do stagingu, nie produkcja.** Etapy I i II zachowane; Etap III obejmuje mierzalne ograniczenia budżetu i wyraźniejsze rozdzielenie wyniku lokalnego od serwerowego. Brak dowodu na poprawę średniego czasu odpowiedzi ani na całkowite ukrycie zakończenia.
