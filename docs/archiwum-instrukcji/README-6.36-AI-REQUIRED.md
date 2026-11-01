# Prawdziwe Śledztwo 6.36 — poprawka AI-required

## Zachowanie przesłuchań

- Z.ai jest pierwszym dostawcą odpowiedzi AI; Groq rezerwowym. Nie uruchamia się ich równolegle.
- Cała tura ma budżet **46 sekund**, z czego główny dostawca otrzymuje okno do **25 sekund**. Obejmuje to generowanie, ewentualną korektę, audyt semantyczny i czas na zapis.
- Jeśli żaden dostawca nie zwróci zatwierdzonej odpowiedzi, **API zwraca HTTP 503**, a nie lokalne zeznanie. Wpis na serwerze nie jest tworzony.
- Przeglądarka przywraca pytanie do pola tekstowego, usuwa roboczą odpowiedź i czyści jej wpisy z rejestrów pamięci etapów 6.5 i 6.8. Gracz może ponowić pytanie.
- Offline lub przy niepotwierdzonym dowodzie zamiast fikcyjnej odpowiedzi pojawia się informacja o blokadzie i możliwość ponowienia.
- Scenariuszowe reakcje wymagane przez stan postaci (np. odmowa przy zablokowanym przesłuchaniu) pozostają wykonywane lokalnie. To nie są swobodne odpowiedzi AI.
- Klucze API nadal są wyłącznie zmiennymi środowiskowymi na Vercel. Kontrola serwerowego kanonu, blokady dowodów i Supabase nie zostały zniesione.

## Limity i konfiguracja

- `lib/interview-budget-636.js` — 46 000 ms całej tury, 25 000 ms okna Z.ai, rezerwa na Groq i zapis.
- `vercel.json` — `api/interview.js` ma `maxDuration: 60` sekund.
- Przeglądarka czeka do 54 sekund na odpowiedź HTTP.
- `PS_INTERVIEW_AI_ONLY` jest przełącznikiem historycznym, usuniętym z wydania **6.36 AI First — poprawki przed GitHubem**; jego wartość nie włącza lokalnych zeznań.

## Testy

```
npm run build
npm run check
node tools/test-ai-required637.mjs
python tools/test-ai-required-browser637.py
python tools/test-cloud-evidence635.py
node tools/test-stage2-636.mjs
node tools/test-stage3-636.mjs
```

Testy starszego kontraktu, które specjalnie oczekują lokalnego fallbacku, wymagają `PS_INTERVIEW_AI_ONLY=false` i nie opisują zachowania nowego trybu. Nie wykonano jeszcze testów z rzeczywistymi Z.ai/Groq ani testów wydajności Vercel.

## Ograniczenia

Silnik lokalny nadal wyznacza roboczy, bezpieczny kanon i obsługuje zamknięte sceny fabularne. Odmowa odpowiedzi chmurowej nie jest zaliczana jako wypowiedź świadka w widocznym zapisie, ale część wewnętrznych liczników gry może zmienić się podczas przygotowywania roboczej tury; to obszar do dalszego testu transakcyjnego. Połączenia chmurowe mogą zostać przerwane przez zewnętrzny serwis lub Vercel — wówczas gra prosi o ponowienie, nie obiecuje natychmiastowej odpowiedzi.
