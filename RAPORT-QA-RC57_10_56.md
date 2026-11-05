# Raport QA — RC57.10.56 (4 listopada 2026)

## Zakres

Baza: kompletna paczka `RC57.10.55_STALY_UKLAD_LAPTOP`. Zmiany prezentacyjne w CSS i pomocniczym JS, plus zawężenie **widoczności** wątków na Pulpicie do zdobytych źródeł. Prawdziwe reguły śledztwa i uprawnienia do dokumentów bez zmian.

## Kontrole wykonane w tej sesji

| Kontrola | Wynik |
|---|---|
| 10 zakładek × 6 rozmiarów: 1920×1080, 1536×864, 1366×768, 1280×720, 1024×768, 390×844 | **407/407** sprawdzeń układu i nawigacji |
| Nieujawnianie wątków: bez źródeł, częściowo odkryte, skompletowane | **12/12** sprawdzeń |
| Reguły śledztwa i administracyjne testy deterministyczne | **600 PASS** |
| Wyszukiwanie wiedzy sześciu świadków | **2228 PASS** |
| Pytania o inne osoby i relacje | **1325 PASS** |
| Zapisy, migracje, eksport, import, przywracanie i reset sesji | **PASS** |
| Rzeczywiste kliknięcia 10 zakładek na 320, 390, 768 i 1440 px | **PASS** |
| Kompilacja, integralność i własność kontrolerów | **PASS** |
| Błędy JavaScript w sześciu przebiegach UI | **0** |

## Obserwacje wizualne

- Menu nie łamie etykiet, nie nachodzi na sąsiednie przyciski; wygodna szerokość paska na laptopach.
- Pulpit: cztery skróty widoczne przed drugorzędnymi wątkami, bez przycinania opisu sprawy.
- Poszukiwania: formularz nad paskiem wskazówek i filtrami; wyniki na żądanie.
- Przesłuchania: rozmowa i karty świadków nie nachodzą na siebie przy badanych szerokościach.
- Pozostałe zakładki: zmniejszone odstępy/padding, przejście do narzędzi z mniejszą liczbą zbędnych pustych bloków.
- Wątki nie odkrywają treści niewidzianych dokumentów: w pustym stanie informacja o rozpoczęciu, w częściowym tylko bezpieczny temat, po skompletowaniu fakty z kanonu.

## Ograniczenia

- Zrzuty są z lokalnego Chromium, nie z konkretnego fizycznego laptopa ani z produkcyjnej strony Vercel.
- Nie przeprowadzono produkcyjnego testu AI (Z.ai/Groq) ani zapisu do prawdziwej bazy Supabase.
- Kontrole geometrii nie wykrywają wszystkich możliwych problemów typografii i interakcji po powiększeniu elementów przeglądarki.
- Wątek jest widoczny, gdy gracz zdobył przynajmniej jeden materiał z jego zestawu; jego pełne wyjaśnienie wymaga kompletnej listy materiałów. To zasada **prezentacji**, a nie nowa mechanika odblokowywania.
- Przed publikacją produkcyjną sprawdzić Preview z prawdziwym zapisem i przesłuchaniami oraz na laptopie 1920×1080 przy 100%.
