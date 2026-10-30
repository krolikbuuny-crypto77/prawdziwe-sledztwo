# Prawdziwe Śledztwo — pakiet 6.27 (GitHub + Vercel)

Pełny pakiet do zastąpienia zawartości repozytorium. Zawiera wszystkie poprawki z 6.26; nie usuwa zasobów, API ani mechanizmów Supabase.

## Najpierw zgodność historii i pamięci

- Zatwierdzone przez serwer zeznanie jest pokazywane graczowi w tej samej postaci, w której serwer zatwierdził je w Supabase.
- Usunięto dodatkowe odrzucanie odpowiedzi **po** zatwierdzeniu na serwerze. To odrzucanie mogło powodować rozbieżność: baza pamiętała wypowiedź AI, a przeglądarka pokazywała lokalną. Serwer nadal przeprowadza własną kontrolę trafności i zgodności z faktami **przed** zatwierdzeniem.
- Mechanizmy z 6.26 nadal synchronizują `dialogues`, `ps67.approved` i `ps68.episodes` przy niezmiennym kanonie fabularnym.
- Przestarzały lub niezaufany backend nadal przechodzi przez kontrolę bezpieczeństwa przeglądarki.

## Rozumienie pytań

Zachowane i przetestowane poprawki 6.26: własne alibi Marka, rozdzielenie zgłoszenia alarmu przez Tomasza od ostatniego spotkania z Leną, pytania z doprecyzowaniem, przeciwdziałanie powtórzeniu nieodpowiedniej wypowiedzi.

## Skąd pochodzi odpowiedź?

Serwer `/api/interview` dołącza do każdej udanej odpowiedzi cztery pola:

```json
{
  "provider": "groq",
  "model": "llama-3.3-70b-versatile",
  "fallbackReason": "zai_rate_limited",
  "requestId": "a29b27cf-135e-4ef0-9c47-93eb9872df05"
}
```

To tylko przykład; identyfikator jest nowy dla każdego żądania. Pole `fallbackReason` jest `null`, gdy nie było przełączenia.

- `zai`: serwer zaakceptował odpowiedź modelu Z.ai.
- `groq`: serwer zaakceptował odpowiedź Groq po niepowodzeniu pierwszej usługi.
- `local`: serwer zastosował bezpieczną odpowiedź lokalną, gdy obaj dostawcy zawiedli, albo klient użył własnego wariantu lokalnego.
- `unknown`: nie otrzymano odpowiedzi HTTP, więc nie da się potwierdzić, który dostawca ostatecznie odpowiedział.

**Widok dla testera:** otwórz grę, dopisując do adresu `?debugAI=1`. Przy wiadomościach świadka będą małym drukiem widoczne: dostawca, model, przyczyna przełączenia i ID żądania. Bez parametru diagnostyka nie jest widoczna i nie wpływa na immersję.

**Eksport zapisu:** w pliku `Ostatni_kurs_zapis_sprawy.json` metadane każdej nowej odpowiedzi znajdują się w `dialogues.<ID_SWIADKA>[i].ai`. Pozostają w pliku po ponownym imporcie. Starsze zeznania nie otrzymują zmyślonych metadanych historycznych.

**Logi Vercel:** szukaj `interview-diagnostic` i `requestId`. Zapisujemy tylko cztery pola diagnostyczne, bez pytań, transkryptów i kluczy.

## Wdrożenie

1. Rozpakuj ZIP i **skopiuj zawartość** do katalogu lokalnego repozytorium (`index.html`, `api/`, `lib/`, `src/`, `assets/`, ...), zastępując istniejące pliki. Nie twórz dodatkowego katalogu nadrzędnego.
2. GitHub Desktop: **Commit to main** → **Push origin**.
3. Vercel: poczekaj na **Ready**; jeżeli automatyczne wdrożenie nie nastąpi, wykonaj Redeploy.
4. Wejdź na stronę z `?debugAI=1`, zadaj pytanie i sprawdź diagnostykę. Po jednym przesłuchaniu wyeksportuj zapis i porównaj `dialogues`, `ps67` oraz `ps68`.

Nie umieszczaj sekretów w repozytorium. Wersja nadal oczekuje serwerowych zmiennych: `ZAI_API_KEY`, `ZAI_MODEL`, `GROQ_API_KEY`, `GROQ_MODEL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GAME_SESSION_SECRET`, opcjonalnie Cloudflare.

## Testy

```sh
npm run build
npm run check
node tools/test-api627.mjs
python tools/test-diagnostics627.py
node tools/test-interview626.mjs
python tools/test-quality626.py
python tools/test-quality625.py
python tools/test-saves.py
```

Wszystkie te testy przeprowadzono lokalnie z symulowanym backendem. Testy nie potwierdzają poprawności produkcyjnych kluczy ani rzeczywistych odpowiedzi Z.ai/Groq na Vercel. Nie uruchamiano migracji danych ani nie zmieniano repozytorium użytkownika.
