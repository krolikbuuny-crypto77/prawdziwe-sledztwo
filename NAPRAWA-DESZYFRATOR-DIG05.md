# Naprawa Deszyfratora — dokument metadanych (RC57.10.58)

## Problem
Pole „Niezależny dokument metadanych” wymagało wyłącznie wewnętrznego identyfikatora `DIG-05`, odrzucając pełny, prawidłowy tytuł dokumentu z akt: „Dane operatora o wiadomości z godz. 01:32”.

## Zakres poprawki
- Pole przyjmuje zarówno identyfikator `DIG-05`, jak i **pełny, dokładny tytuł dokumentu**, opcjonalnie wraz z identyfikatorem.
- Ignorowane są wielkość liter, polskie znaki, spacje i znaki interpunkcyjne.
- Tytuł jest odczytywany z kanonicznego rejestru dokumentów, nie z duplikowanej listy aliasów.
- Krótkie, przypadkowe fragmenty tytułu i inne dokumenty **nie** przechodzą kontroli.
- Opis pola wyraźnie dopuszcza kod lub pełny tytuł.
- Pozostałe warunki ukończenia (bloki, dekodowanie, czas, konto, urządzenie, uzasadnienie, posiadanie dokumentów) są bez zmian.
- Istniejące zapisy gry nadal są zgodne.

## Testy
`node tools/test-msg-document-title.mjs` — 8 zaakceptowanych i 10 odrzuconych wariantów, zachowanie warunków raportu i zgodność buildu.
`npm run check` — PASS.
`node tools/test-rc57-whole-game.mjs` — PASS: 380 kontroli reguł w 13 grupach.

## Wdrożenie
Wersja pełna ZIP zawiera cały projekt gry. Paczka aktualizacji zawiera tylko zmienione pliki i test. Zmiany nie są automatycznie przesyłane na GitHub ani Vercel. Przed nadpisaniem plików wykonaj kopię aktualnego repozytorium.
