**Aktualizacja 6.29 (API):** przed wdrożeniem uruchom `supabase/002_ai_review_limits.sql`, następnie przeczytaj `README-PAKIET-6.29.md`. Groq: `openai/gpt-oss-120b`; bez migracji analiza Cloudflare jest blokowana, ale lokalna gra pozostaje dostępna.

# Pakiet 6.22 — animowane portrety sześciu świadków

Mimika wektorowa twarzy podczas przesłuchań, ośmiu scen przełomowych i finału. Zachowana architektura 6.21, bez nowych zagadek i faktów. Raport: `RAPORT-QA-6.22.md`.

# Prawdziwe Śledztwo — wersja 6.20

Pakiet 6.20: dodatkowe, różne dla sześciu świadków reakcje sceniczne, opcjonalne pytania źródłowe i wspólne prowadzenie stylu Z.ai/Groq. Bez zmian kanonu i warunków ukończenia. Szczegóły: `PAKIET-6.20-ZYWE-REAKCJE-I-CIAGLOSC-POSTACI.md` oraz `RAPORT-QA-6.20.md`.

> **Pakiet 6.19 — Fabuła 2.0 i finał 3.0.** Zobacz [README-PAKIET-6.19.md](README-PAKIET-6.19.md), [RAPORT-QA-6.19.md](RAPORT-QA-6.19.md) i [biblię fabularną](story-bible/BIBLIA_FABULARNA_619.md).

# Prawdziwe Śledztwo — Ostatni kurs, Pakiet 6.18

**Z.ai → Groq → lokalny WitnessEngine** w przesłuchaniach; **Cloudflare** tylko jako
analityk dowodów; **Supabase** jako serwerowy dziennik sprawdzanych działań,
z offline-first SaveManager.

Pierwszy krok: [GITHUB-WGRYWANIE.md](GITHUB-WGRYWANIE.md). Szczegółowy opis,
zakres zatwierdzania i ograniczenia: [PAKIET-6.17-TRZY-SILNIKI-I-SUPABASE.md](PAKIET-6.17-TRZY-SILNIKI-I-SUPABASE.md).

**Uwaga:** Pełne zatwierdzanie finału, minigier i postępu fabularnego na serwerze
wymaga dalszej migracji; po tej paczce nie jest jeszcze ukończone.

---

# Prawdziwe Śledztwo — Ostatni kurs (Pakiet 6.16)

Polska gra detektywistyczna HTML/CSS/JavaScript. Pakiet bazuje na wersji 6.15.

**Z.ai = wyłącznie przesłuchania. Cloudflare Workers AI = wyłącznie pomocnicza ocena zebranych dowodów i hipotez.**

W 6.16 opinie Cloudflare są łatwiejsze do zrozumienia: rozdzielają potwierdzone elementy od niepewności, podają nazwy już zebranych źródeł i proponują co najwyżej jeden opcjonalny następny krok. Nie zwiększono trudności, nie zmieniono warunków wygranej, dowodów ani fabuły.

## Uruchomienie i testy

```bash
npm run build
npm run check
npm run test:evidence-quality
npm run test:reasoning
```

`index.html` jest gotową stroną. Kod źródłowy: `src/`. Endpointy: `api/interview.js` (Z.ai) i nowy `api/evidence-review.js` (Cloudflare). Starszego `api/evaluate` na repozytorium **nie usuwaj**.

Konfiguracja Vercel: `ZAI_API_KEY`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (wartości wyłącznie w serwerowych zmiennych środowiskowych). Bez chmury działają lokalne oceny i rozmowy awaryjne.

Dokumenty: `PAKIET-6.16-JAKOSC-ANALIZ-CLOUDFLARE.md`, `RAPORT-QA-6.16.md`, `GITHUB-WGRYWANIE.md`.

API były testowane z mockami, a nie rzeczywistymi kluczami. 


### Pakiet 6.18 — walidacja chronologii, minigier i finału

Serwer `api/game-state.js` zatwierdza teraz `verify_puzzle_stage`, `verify_timeline`,
`file_indictment`, `defend_objection`, `request_verdict`. Walidatory znajdują się
w `lib/progression-618.js`, a kanoniczne parametry są w `lib/server-canon-618.json`.
Przeglądarka przesyła dowody wykonania czynności, a nie flagę `solved` czy gotowy werdykt.
Połączenie offline przez kolejkę `PS617_SYNC` pozostaje obsługiwane.
Do uruchomienia: `npm run build && npm run check && npm run test:progression`.
Zachowaj `api/interview.js` (Z.ai→Groq→lokalnie) oraz `api/evidence-review.js` (Cloudflare).

## Pakiet 6.21

Długie, wielowątkowe rozmowy i filmowe oświetlenie scen przełomowych, bez nowych zagadek. Z.ai → Groq → lokalny silnik; zatwierdzona historia na backendzie do 48 wiadomości, do AI ostatnie 12 oraz mapa tematów. Dźwięk scen jest opcjonalny i domyślnie wyłączony. Szczegóły w `README-PAKIET-6.21.md`, `RAPORT-QA-6.21.md`.

## Pakiet 6.23 — naturalniejszy dialog

Nowe dyrektywy mówionego polskiego, ograniczanie sztucznych formułek i bardziej elastyczna, ale bezpieczna kontrola liczb w `api/interview.js`. Z.ai pozostaje pierwszym dostawcą; Groq rezerwą, lokalny silnik ostatnim wariantem. Szczegóły i ograniczenia w `RAPORT-QA-6.23.md`.

## Pakiet 6.24 — poprawki krytyczne po audycie

Serwer sam przygotowuje zaufany bank faktów; klient nie może autoryzować własnego `factBank`. Poprawiono lokalne odpowiedzi o karcie T-17 u wszystkich sześciu świadków oraz zapis niezweryfikowanych tur offline. Pełny opis: `PAKIET-6.24-POPRAWKI-PO-AUDYCIE.md`, raport: `RAPORT-QA-6.24.md`.

## Pakiet 6.25

Poprawa trafności lokalnych odpowiedzi na pytania o L-2/L-3, protokoły, dyspozycję i sprzeczne zeznania; sześć indywidualnych wariantów głosu. Bez zmian kanonu i zagadek. Uruchom `npm run test:relevance625`. Szczegóły w `README-PAKIET-6.25.md`.

## Aktualizacja 6.26

Kompletny pakiet GitHub/Vercel 6.26 opisano w `README-PAKIET-6.26.md`.
Regresje dla pamięci i intencji pytań: `python tools/test-quality626.py` i `node tools/test-interview626.mjs`.

## Aktualizacja 6.27 — diagnostyka Z.ai / Groq / lokalny i spójne zeznania

Dodano `provider`, `model`, `fallbackReason`, `requestId` do `/api/interview`; metadane są widoczne w trybie `?debugAI=1`, zapisywane w `dialogues[*][].ai` i dostępne po imporcie. Odpowiedź zweryfikowana na serwerze nie jest ponownie odrzucana przez przeglądarkę po zatwierdzeniu w Supabase. Dokumentacja: `README-PAKIET-6.27.md`, `RAPORT-QA-6.27.md`.

## Aktualizacja 6.28 — oględziny, pamięć świadka i wznowienie

Uwzględniono sześć uwag z testów 6.27: priorytet pytania o własne alibi wobec zanegowanych wzmianek o Lenie; dwa czytelne liczniki (zbadane i zabezpieczone), zgodne karty etapów oględzin, brak ponawiania powiadomienia o odkryciu podczas wznowienia, modalny wybór zapisanej sesji oraz pomiar czasu odpowiedzi w `?debugAI=1`. Szczegóły i testy w `README-PAKIET-6.28.md`, `RAPORT-QA-6.28.md`.
