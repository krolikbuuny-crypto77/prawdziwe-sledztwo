# Prawdziwe Śledztwo 6.35 — raport implementacji i QA

Data: 30 października 2026. Bazą była kompletna paczka 6.34 testowa. Nie zmieniono GitHub, Vercel, Supabase ani oryginalnego ZIP-a.

## Najważniejsze poprawki

- Naprawiono wcześniejszą blokadę Z.ai/Groq przy okazaniu dowodu.
- Zweryfikowane `presentedEvidenceId` jest niezależnie rozstrzygane przez serwer na podstawie `approvedEvidence` i zaufanego rejestru 78 dokumentów. Brak serwerowego potwierdzenia = HTTP 409 i odpowiedź lokalna.
- AI otrzymuje tytuł i treść konkretnego okazanego materiału. Tytuł z klienta nie jest autorytetem; wcześniejsze zeznanie nie jest nowym faktem.
- Ochrona przed identyczną lub niemal identyczną odpowiedzią na inne pytanie. Jedna ograniczona próba naprawy przez bieżącego dostawcę; następnie dostawca zapasowy.
- Dodatkowy filtr dokumentów i osobny audyt semantyczny, także dla wypowiedzi dosłownej dotyczącej okazanego dokumentu.
- Krótszy limit dla próby korekty; globalny limit czasu dla wywołań chmurowych w ramach jednej tury.
- Zachowana hierarchia Z.ai → Groq → lokalny oraz niezmienialność stanów dowodowych i reguł werdyktu.

## Testy

Testy są lokalne, z symulowanymi odpowiedziami dostawców. Potwierdzają kontrakt implementacyjny, nie rzeczywistą jakość modeli na produkcji.

- `npm run build` oraz `npm run check`: zgodność źródeł, składni i zasobów.
- `node tools/test-dialogue635.mjs`: pytania uzupełniające, blokada powtórzeń, korekta przez ten sam model, zgodny rodzaj fotografii VIS-02, odrzucenie niezatwierdzonego dowodu, HTTP 409 bez stanu serwera.
- `python tools/test-cloud-evidence635.py`: przeglądarkowa ścieżka wysłania zapytania z fotografią VIS-02 do symulowanego API, właściwy identyfikator, brak błędów JS.
- `python tools/test-audit634.py`: wcześniejsze poprawki i blokady TCMS, reakcja na VIS-02.
- Regresje: analiza 6.33, bezpieczeństwo i kolejność modeli, reguły API, ślady, sześciu świadków i 720 tur lokalnych rozmów.

## Nadal otwarte

- Wymagane testy rzeczywistych odpowiedzi Z.ai/Groq na Vercel, także odmowy i parafrazy po długiej historii.
- Wersja nie gwarantuje 100% trafności odpowiedzi ani braku powtórzeń przy niedostępności modeli.
- Blokady TCMS z 6.34 pozostają; rozbieżność ocen dedukcji i drobne błędy UI czekają na osobną poprawkę.
- Nie potwierdzono produkcyjnej trwałości Supabase ani wpływu nowego etapu korekty na czas odpowiedzi.

**Status: wersja do testów stagingowych; niepotwierdzona produkcyjnie.**
