# RC57.10.7 — instalacja i interpretacja zatrzymanych prób

## Wybór pliku
- Jeśli nie wdrożono jeszcze ostatniej wersji: użyj pełnego ZIP RC57.10.7.
- Jeśli na serwerze jest **RC57.10.6 z nagłówkiem „Przesłuchania”**: można nałożyć małą poprawkę RC57.10.7, zachowując strukturę katalogów.
- W innym przypadku zalecana jest pełna paczka. Nie należy kopiować tylko `index.html` lub mieszać niepowiązanych patchy.

## Publikacja
1. Prześlij rozpakowane pliki gry do odpowiedniego repozytorium GitHub, najlepiej gałęzi Preview.
2. W Vercel sprawdź konfigurację `RC57_LIVE_TEST_ENABLED` i klucza `APINEX_API_KEY`; nie publikuj sekretów w przeglądarce.
3. Uruchom test 18 pytań. Jeśli zatrzyma się na pytaniu, zapisz **kod i fazę wstrzymania** z sekcji wyników i pobierz JSON.
4. Gdy powód to `provider_rate_limited`, respektuj podany czas, zwłaszcza `Retry-After`. Gdy to `provider_timeout` — zgłoś czy timeout wystąpił podczas `generate` czy `semantic-audit`.
5. Wznawiaj ręcznie. Każde wznowienie obejmuje to samo niezaliczone pytanie; licznik ukończonych pytań się nie zwiększa do uzyskania zatwierdzonej odpowiedzi.

Nie uruchamiaj równolegle kilku testów AI ani nie resetuj licznika przez otwieranie wielu kart w celu obejścia limitu.

## SQL i zgodność
Zmiana nie wymaga migracji SQL. Zapis gry, dowody, fabuła, werdykt i ograniczenia dostępu nie zostały zmodyfikowane. Opcjonalny globalny limit Supabase 007 działa według dotychczasowej konfiguracji.
