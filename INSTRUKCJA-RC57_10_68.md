# RC57.10.68 — uporządkowanie projektu

Baza aktualizacji: **wyłącznie RC57.10.67**. Zmiana organizacyjna, bez modyfikacji fabuły, skryptów klienta, silnika AI, zapisów ani kanonu. Zmieniono reguły ochrony statycznych ścieżek w `vercel.json` (wymagają kontroli na Vercel Preview).

## Pełna paczka

Rozpakuj do pustego folderu. Uruchom:

```bash
npm run build
npm run check
npm run project:doctor
npm run test:current
```

Aktualna dokumentacja zaczyna się od `README.md` oraz `INSTRUKCJA-GLOWNA.md`. Stare raporty nie zostały usunięte: są pod `docs/historia/`, indeks pod `docs/HISTORIA-WYDAN.md`.

## Aktualizacja z RC57.10.67

1. Zapisz kopię repozytorium.
2. Rozpakuj małą paczkę do katalogu bazowej RC57.10.67, zachowując ścieżki.
3. Uruchom `npm run migrate:rc571068` — przeniesione dokumenty zostaną usunięte z dawnej lokalizacji tylko wtedy, gdy ich kopie w archiwum oraz stare źródła mają zgodne SHA-256. Każda samodzielnie zmieniona wersja pozostanie nietknięta i zostanie zgłoszona jako konflikt.
4. Uruchom cztery polecenia z sekcji pełnej paczki.
5. Przed wdrożeniem produkcyjnym sprawdź na Vercel Preview dostępność API i assetów oraz brak publicznego dostępu do materiałów fabularnych, testowych i historycznych.

**Nie trzeba nowych kluczy, migracji SQL ani migracji zapisów.** Aktualizacja nie uruchamia się sama; żadne zewnętrzne wdrożenie nie jest wykonywane.
