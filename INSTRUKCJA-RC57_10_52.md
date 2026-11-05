# RC57.10.52 — optymalizacja zakładek i układu

## Wersja
Aktualizacja wizualna RC57.10.51 → RC57.10.52. Nie zmienia historii, AI, wymagań dowodowych ani zapisów.

## Instalacja
1. Zachowaj kopię poprzedniego projektu i (jeśli masz) eksport zapisu gry.
2. Wybierz jedną opcję:
   - **Pełna paczka** `Prawdziwe_Sledztwo_RC57_10_52_OPTYMALIZACJA_ZAKLADEK_PELNA.zip`: rozpakuj jako kompletny projekt.
   - **Aktualizacja** `Prawdziwe_Sledztwo_RC57_10_52_AKTUALIZACJA_DO_RC57_10_51.zip`: rozpakuj do katalogu **RC57.10.51**, zachowując podkatalogi i nadpisując pliki.
3. Na Vercel wdrażaj najpierw w środowisku **Preview**, nie bezpośrednio produkcyjnie.
4. Wykonaj `npm run build` i `npm run check` z katalogu projektu, jeśli korzystasz z repozytorium.
5. Sprawdź szczególnie okno 1366×768 i 1536×864 oraz powiększenie 125% w przeglądarce.
6. W Osi czasu dodatkowe analizy są pod rozwijanym nagłówkiem **„Automatyczna rekonstrukcja — analizy i korelacje”**. W Oględzinach narzędzia filtrów obrazu są zwijane. W Notatniku dodatkowe adnotacje, diagnostyka i pochodzenie źródeł są w jednej rozwijanej grupie.
7. Sprawdź w Preview rzeczywiste API dostawcy AI i Supabase; testy lokalne nie weryfikują tych usług.

## Zakres według zakładek
- **Pulpit:** spójny układ startowy, czytelniejsze działania w dwóch kolumnach.
- **Akta:** mniej miejsca zajmują wprowadzenie i filtry, szerszy podgląd dokumentów.
- **Poszukiwania:** zwięźlejsze obszary, formularz i wyniki lepiej widoczne.
- **Przesłuchania:** więcej miejsca na protokół, formularz pytania i listę świadków.
- **Oś czasu:** ręczne ustalanie kolejności pozostaje na pierwszym planie, automatykę można rozwinąć.
- **Oględziny:** filtry obrazu za nagłówkiem, panel badania śladu pozostaje dostępny przy przewijaniu na dużym ekranie.
- **Notatnik:** spójne kolumny pól, dodatkowe narzędzia w rozwijanej sekcji.
- **Laboratorium:** karty pracowni w czytelnej siatce na laptopie.
- **Dedukcja:** uporządkowane kroki, krótszy nagłówek, ograniczenie wysokości sieci źródeł.
- **Finał:** czytelne karty trzech warunków, bez zerowej dodatkowej kolumny.

## Kontrole
- `python tools/test-rc571052-layout.py`
- `python tools/test-navigation.py`
- `python tools/test-saves.py`
- `node tools/test-rc57.mjs`
- `node tools/test-rc571048-retrieval.mjs`
- `node tools/check.mjs`
- `node tools/audit-overrides.mjs`
