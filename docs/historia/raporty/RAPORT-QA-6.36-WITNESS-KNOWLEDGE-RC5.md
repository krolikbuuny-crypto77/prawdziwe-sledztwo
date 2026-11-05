# Raport QA — Prawdziwe Śledztwo 6.36 Witness Knowledge RC5

## Weryfikowane zadanie

Rozbudowa i uporządkowanie serwerowej wiedzy sześciu świadków bez tworzenia nowych zdarzeń; zwiększenie naturalności odpowiedzi przez lepszy dostęp do już autoryzowanych faktów i charakterystyki postaci. Z.ai pozostaje odpowiedzialne za rozumienie pytania i generowanie wypowiedzi, Groq jest rezerwą.

## Zakres wykonany

- Osobny, prywatny serwerowy dossier dla każdego świadka z mapą zagadnień i granicami wiedzy.
- Dosłowne fragmenty zdań wydzielane wyłącznie z publicznych, zatwierdzonych kanonicznych wypowiedzi. Bez generowania historii.
- Niezależny od klienta i bezpieczny styl oraz faza rozmowy liczona wyłącznie z przechowywanych na serwerze pytań; nie zwiększa to wiedzy o faktach.
- Serwerowy bank faktów dostępny dla obu modeli w tej samej postaci; model ma obowiązek wybrać `factIds`.
- Zapisany kontrakt: brak automatycznego lokalnego zeznania po awarii obu modeli.

## Wyniki testów lokalnych

| Kontrola | Wynik |
|---|---|
| `npm run build`, `npm run check` | PASS |
| `tools/test-witness-dossiers-rc5.mjs` | PASS: 6 świadków × 10 sformułowań = 60 kombinacji |
| Źródłowe pochodzenie fragmentów i brak niezaufanych danych klienta | PASS |
| Brak dostępu do nieodblokowanych korekt i dokumentów | PASS |
| Z.ai/Groq: niezależny od heurystyk wybór faktów, symulowany | PASS |
| `test-ai-understanding637`, `test-followup-rc4` | PASS |
| `test-stage1-636`, `test-stage2-636`, `test-stage3-636` | PASS |
| `test-release-candidate636`, `test-pre-github636`, `test-dialogue635`, `test-interview626` | PASS |
| `tools/test-saves.py` | PASS: eksport, import, autosave, reset, migracje 11 wersji |
| `tools/test-navigation.py` | PASS: 320, 390, 768, 1440 px |
| `tools/test-witnesses.py` | PASS: 6 świadków, 24 tury UI z symulowanym AI, 720 tur stres-testu silnika lokalnego |
| Stare testy `test-api624-integration`, `test-api629`, `test-interview630` | FAIL: oczekują dawnego API bez obowiązkowego `turnId` / aktualnej sesji. Nie użyto jako regresji RC5 |
| Rzeczywiste Z.ai/Groq | NIEPRZETESTOWANE |
| Rzeczywiste Vercel + Supabase, HTTP 503 | NIEPRZETESTOWANE |

## Rzeczywista wiedza kontra brakujące informacje

Baza RC5 ma 20–24 **fragmenty** na świadka, ale nie zawiera 20–24 nowych wydarzeń. Fragmentacja pomaga modelowi cytować precyzyjniej dostępne fakty. Nie ma wystarczających podstaw, by dopisać rodzinę, wykształcenie, miejsca zamieszkania, nazwiska świadków obecności, dokładne trasy i nieudokumentowane godziny. Taka rozbudowa wymaga decyzji autora fabuły; nie należy pozwalać AI wymyślać ich bez kontroli.

## Co sprawdzić na Vercel Preview

1. Migracja `supabase/003_interview_limits.sql` na właściwym testowym projekcie; wynik `to_regprocedure('public.ps_allow_interview(uuid,text)')` musi nie być `NULL`.
2. Rzeczywista sekwencja Z.ai → Groq, przyczyna ewentualnego HTTP 503 w odpowiedzi `/api/interview` (`error`, `fallbackReason`, `requestId`).
3. Alibi → pytania o osobowych świadków i połączenia, relacja z Leną, pytania o dokumenty, długie rozmowy, sprostowania.
4. Czas odpowiedzi, koszty i niezawodność; pełniejszy kontekst zwiększa liczbę tokenów w zapytaniu i może wpływać na opóźnienia.
5. Utrzymanie właściwego wybranego dowodu i brak dostępu do niego przed autoryzacją Supabase.

Żaden wynik testu lokalnego nie dowodzi, że produkcyjny HTTP 503 ustąpił.
