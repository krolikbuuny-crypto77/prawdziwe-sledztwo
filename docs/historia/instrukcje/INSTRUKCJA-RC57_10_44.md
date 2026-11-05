# Instalacja RC57.10.44

1. **Zachowaj kopię działającej wersji** oraz wyeksportuj zapis gry z interfejsu.
2. Najprościej: użyj pełnego ZIP-a `Prawdziwe_Sledztwo_RC57_10_44_CZYTELNOSC_I_DIALOGI_PELNA.zip` jako nowego wdrożenia Vercel Preview. Zachowaj własne zmienne środowiskowe projektu — nie znajdują się w ZIP.
3. Jeśli masz dokładnie **RC57.10.43**, możesz zamiast tego rozpakować `Prawdziwe_Sledztwo_RC57_10_44_AKTUALIZACJA_DO_RC57_10_43.zip` do katalogu projektu, nadpisując pliki z zachowaniem struktury.
4. W katalogu projektu uruchom `npm run build` oraz `npm run check`.
5. Zweryfikuj Vercel Preview: grafikę pod Finałem, 10 zakładek, Przesłuchania na telefonie, dłuższą rozmowę, zapis gry, odpowiedź AI przy normalnej pracy i przy awarii dostawcy.
6. Publikuj wersję produkcyjną dopiero po porównaniu rzeczywistego wyglądu i przejściu prób z AI/Supabase.

Zakres i wyniki testów: `RAPORT-QA-RC57_10_44.md`.
