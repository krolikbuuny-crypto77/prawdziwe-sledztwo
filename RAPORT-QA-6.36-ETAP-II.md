# Raport QA — Prawdziwe Śledztwo 6.36 / Etap II

Data: 30.10.2026. Baza: 6.36 Etap I. Wersja: `6.36-II` (osobna paczka testowa).

## Wdrożone i zweryfikowane zmiany

| Obszar | Zmiana | Wynik |
|---|---|---|
| Rejestr dowodów | Wspólny serwerowy widok `verifiedExhibit` | 78/78 dokumentów w obu rejestrach; brak zgadywania tytułu lub typu z przeglądarki |
| Uprawnienia | Materiał musi należeć do `approvedEvidence` sesji | Testy dla każdego dokumentu: bez zatwierdzenia zwracane `null` |
| Sfałszowane treści | Klient nie może podmienić tytułu/tekstu dokumentu w analizie | Testy 78/78 dla analizy Cloudflare i konfrontacji |
| Konfrontacje | Z.ai/Groq mają serwerowy opis materiału, w tym jego rodzaj, a jakość odpowiedzi podlega istniejącym bramkom | Symulacje regresyjne VIS-02 i 6.35; bez realnych API |
| Nowy materiał | Ograniczone oczekiwanie na zapis serwerowy przed wykorzystaniem w AI | Przeglądarka z mockiem: zatwierdzenie -> dostęp, odrzucenie -> brak dostępu |
| Dedukcja | Oddzielne wskazanie punktów lokalnego audytu, braków formalnych i doradczej interpretacji AI | Kontrola kompilacji oraz test kontraktowy etykiet; AI nie zmienia punktów ani werdyktu |

## Wykonane testy

- `npm run build` i `npm run check` — **PASS** (61 sekcji JS, 64 CSS; kontrola zasobów i centralnych właścicieli API).
- `node tools/test-stage2-636.mjs` — **PASS**.
- `python tools/test-stage2-sync636.py` — **PASS**; izolowana przeglądarka, symulowany stan serwera, dwa warianty akceptacja/odrzucenie.
- `npm run test:stage1-636` — **PASS** po aktualizacji makiety przeglądarkowej o serwerowe zatwierdzenie dowodu.
- `npm run test:api629`, `npm run test:fast-evidence`, `npm run test:unified633`, `npm run test:priority1`, `npm run test:witnesses` — **PASS**.

## Niezweryfikowane w produkcji

1. Żadne próby Z.ai / Groq z prawdziwymi kluczami, limitami, opóźnieniami ani błędami 429.
2. Brak testu zapisów i konfliktów na prawdziwym Supabase po zmianie urządzenia oraz importowaniu starych zapisów.
3. Brak niezależnej ręcznej konfrontacji wszystkich 78 dokumentów; sprawdzono spójność ich danych i reguł autoryzacji.
4. Lokalna punktacja argumentacji może niedoceniać poprawnych polskich parafraz; teraz wyświetla się jasno, że analiza AI bada inne kryterium. Uspójniono prezentację, nie zastąpiono heurystyk modelem.
5. Niedostępny serwer lub brak zatwierdzenia materiału powoduje działanie lokalne, a nie fałszywe dopuszczenie AI — to świadoma degradacja funkcji.

**Werdykt:** nadaje się do prób na stagingu. Nie oznaczono jako zweryfikowana produkcja.
