# Prawdziwe Śledztwo — RC41: Automatyczna oś czasu

## Co zostało dodane

- Nowa **automatyczna oś czasu** w module **Oś czasu**, ponad dotychczasową ręczną rekonstrukcją.
- Dokumenty: maksymalnie 20 kanonicznych punktów chronologii, widocznych **dopiero po zdobyciu źródła**; dokładna godzina lub przedział z dokumentu, ostrzeżenia metodologiczne, bez automatycznego przypisywania osób.
- Zeznania: wykrywanie **dosłownych godzin** wypowiedzianych przez świadka i wyświetlanie cytowanego fragmentu, zawsze jako niepotwierdzone twierdzenie; przyporządkowanie do nocy 17/18 listopada jest tylko pomocą wizualną, a nie ustaleniem daty. Wyrażenia „około”, „po”, „przed” itp. mają oznaczenie przybliżenia.
- Przyciski **Otwórz dokument** i **Otwórz wypowiedź** przechodzą do konkretnego źródła.
- Filtry: wszystkie / dokumenty / świadkowie / wymagające porównania; wyszukiwarka.
- Wykrywanie rozbieżności między godziną wpisaną ręcznie a źródłową oraz ostrożne sygnalizowanie godzin podawanych przy konkretnych kategoriach zdarzeń w zeznaniach. To sugestie do weryfikacji, nie automatyczne stwierdzenie kłamstwa.
- Automatyczna aktualizacja na podstawie stanu sesji, w tym istniejącej synchronizacji wspólnego ekranu dla dwóch graczy. Brak osobnych tabel lub nowych wywołań AI.

## Instalacja

1. **Zostaw RC35.6 w archiwum** jako ostatnią wersję bazową potwierdzoną na produkcji. Zachowaj także ostatnią paczkę RC40 przed aktualizacją.
2. Jeśli w repozytorium jest **RC40**, możesz użyć małej paczki **RC41_POPRAWKA_DO_RC40.zip** i zastąpić wskazane pliki. Dla innej wersji wgraj **RC41_PELNA_WERSJA.zip**.
3. Wgraj do GitHub zawartość rozpakowanej paczki **bez dodatkowego katalogu nadrzędnego**; zatwierdź commit.
4. Vercel > Deployments: sprawdź stan Ready. Otwórz stronę gry i naciśnij Ctrl+Shift+R.
5. Przejdź do **Oś czasu** i sprawdź nowe pole **Automatyczna oś czasu**. Zdobywaj materiały, porównuj zeznania i otwieraj źródła.
6. W trybie dwuosobowym sprawdź widok po przekazaniu sterowania, odzyskaniu pokoju i odświeżeniu strony.

**Supabase:** RC41 nie wymaga żadnej nowej migracji SQL. Zależy od istniejących zmian kooperacji (004,005 i, dla uzgodnień RC39, 006).

## Bezpieczeństwo fabuły i zapisów

Oś jest tylko widokiem. Nie dodaje dowodów, nie ustawia automatycznie dat w ręcznej rekonstrukcji, nie potwierdza alibi, nie zmienia wartościowania finału i nie tworzy nowych wpisów w zapisie. Wypowiedzi świadków **nie są uznawane za fakty**, nawet gdy zawierają dokładną godzinę. Zmienione i nieprawidłowe zapisy nadal kontroluje istniejący SaveManager.

## Ograniczenia

Automatyczne rozpoznawanie zeznań jest deterministyczne, bez AI: wychwytuje godziny HH:MM w tekstach, nie rozumie wszystkich językowych odniesień ani zaimków, może pominąć zapis typu „za kwadrans druga”. Przypisany porządek dni jest orientacyjny dla zeznań. Ostrzeżenia o sprzecznościach wymagają decyzji śledczego. Testy wykonano lokalnie; produkcja Vercel/Supabase wymaga weryfikacji po wdrożeniu.
