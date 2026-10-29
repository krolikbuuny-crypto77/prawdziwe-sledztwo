# Raport QA — Pakiet 6.19

## Testy wykonane (lokalnie, 29.10.2026)

| Test | Wynik | Co rzeczywiście sprawdzono |
|---|---:|---|
| `npm run build` | PASS | Wygenerowany HTML z kodu źródłowego |
| `npm run check` | PASS | 61 sekcji JS, 64 sekcje stylów, składnia, 75 WebP, 9 MP3, zgodność kontraktów |
| `python tools/test-narrative619.py` | PASS | **1200 tur lokalnego `npc4Answer`**, 0 pustych odpowiedzi, 0 wyjątków, 495 różnych tekstów; sześć indywidualnych profili |
| Testy rozdziałów Leny | PASS | Sześć kart ukrytych do momentu zdobycia ich istniejących źródeł, brak nowych materiałów z samego odczytania |
| Testy epilogu | PASS | Sześć wariantów prezentacji na danych symulowanych: brak wyjątków i zmian decyzji |
| Przeglądarka 390/768/1280px | PASS | Wczytanie warstwy 6.19 bez nieobsłużonych wyjątków JS na trzech szerokościach |
| `npm run test:progression` | PASS | 51 testów serwerowego postępu 6.18, 15 etapów, kolejność, odrzucenie sfałszowanych zgłoszeń |
| `npm run test:architecture` | PASS | Priorytet Z.ai → Groq → lokalnie; wspólny kontekst i dziennik, mock Supabase, offline |
| `npm run test:ai-primary` | PASS | Klient, Enter, awaria API, lokalny fallback, zabezpieczenia halucynacji — symulacja |
| `python tools/test-witnesses.py` | PASS | 24 prawdziwe interakcje UI i 720 tur, sześć osób, spójność pamięci i brak nieuprawnionych dowodów |
| `python tools/test-saves.py` | PASS | Import, reset, zapis automatyczny, starsze stany, uszkodzone dane |
| `python tools/test-events.py` | PASS | Rejestr zdarzeń i niewygenerowanie fikcyjnych przełomów po odczycie zapisu |
| `python tools/test-reasoning.py` | PASS | Hipotezy, kontradyktoryjność, pięć kwalifikacji, brak samowolnych werdyktów Cloudflare |
| `npm run test:story` | PASS | Istniejące zwroty i bramki na 390/768/1440px |
| `npm run test:inspections-puzzles` | PASS | Pięć minigier, ekran, nawigacja, zapis, brak przypadkowego przyznania dowodu |

## Co liczby oznaczają, a czego nie dowodzą

- 1200 testów dialogowych wykonywano **na silniku lokalnym**, nie na żywym Z.ai/Groq. Unikatowość 495/1200 to różnorodność tekstowa, nie ocena semantycznej trafności.
- Nie prowadzono niezależnego panelu ludzkich recenzentów naturalności dialogów.
- Testy wariantów epilogu w 6.19 sprawdzają **renderowanie**, nie przejście wszystkich ścieżek przez rzeczywistą rozgrywkę. Logika finału ma osobne testy 6.18.
- W testach użyto symulacji dostawców oraz Supabase. Nie wykonano połączenia do produkcyjnego Vercel, Supabase, Cloudflare, Groq ani Z.ai.
- Nie prowadzono pomiarów FPS na fizycznych smartfonach. Sprawdzono skrypty na trzech rozdzielczościach i zachowano aktualne zasoby.
- Nie przeprowadzono pełnego testu użyteczności przez nowego gracza ani nie zweryfikowano czasu przejścia 2–3 godziny.

## Niezaimplementowane części rozległego promptu

1. Nie stworzono całkowicie nowego scenariusza wszystkich istniejących scen ani nowych renderów twarzy i mikroanimacji 3D. Dotychczasowa oprawa wizualna pozostaje; nowa warstwa wykorzystuje istniejące lokalizacje interfejsu.
2. Nie dodano osobnego, zaawansowanego grafu wiedzy między wszystkimi osobami ani nowego schematu Supabase. Obecne serwerowe uprawnienia wiedzy pozostają niezmienione.
3. Nie wprowadzono dosłownych nowych wypowiedzi będących faktami kanonicznymi, bez wystarczających podstaw w istniejących dokumentach.
4. Nie zastąpiono starej logiki finału nową; dodano nowy epilog **nad** sprawdzonymi regułami, zgodnie z wymaganiem zachowania ustalonej prawdy i kwalifikacji.
5. Nie wykonano niezależnej, ręcznej oceny 1000 realnych odpowiedzi modeli. Wymagane skonfigurowane API i zewnętrzna ocena ekspercka.

## Zabezpieczenia

- Żadna część `src/story/76-narrative-depth-619.js` nie wywołuje funkcji przyznających dowód ani decydujących o wyniku.
- Serwerowy przewodnik stylu `lib/narrative-voice-619.js` jest własnością backendu, nie przeglądarki.
- Model nie otrzymał nowego katalogu sekretów fabularnych do samowolnego odtwarzania; `factBank` nie został rozszerzony.
- Dotychczasowe kontrolery Supabase i postępu przeszły swoje testy negatywne.
