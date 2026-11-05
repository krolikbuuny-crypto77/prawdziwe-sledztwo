# RC57.10.38 — Akta Śledcze Premium

## Cel
Odwzorować język wizualny zaakceptowanej ilustracji bez używania ilustracji jako nieruchomego ekranu gry: rzeczywiste komponenty nadal działają i prezentują prawdziwy stan śledztwa.

## Poprawione elementy
- Granatowo-złota oprawa, ciemna nawigacja, czytelne bordowe stany aktywne i ikonografia przycisków.
- Dekoracyjny nocny baner z tramwajem, oddzielny od treści sprawy.
- Pergaminowa karta sprawy z istniejącymi zdjęciami tramwaju i zajezdni (prawidłowo przywrócony układ trzech zdjęć).
- Trzy rzeczywiste pierwsze czynności umieszczone obok karty sprawy na dużych ekranach.
- Sekcje „Bieg sprawy”, „Wątki śledztwa” oraz skróty do modułów z działającymi odsyłaczami.
- Pozostałe dziewięć zakładek zachowuje czytelne formularze i dostaje spójną ramę, kolorystykę i szczegóły.
- Mobile: kolumny układają się pionowo; skróty, przyciski i narzędzia pomocy pozostają dostępne.

## Zasady bezpieczeństwa zmian
- Nie zmieniono historii, wypowiedzi, statusów świadków, materiałów dowodowych, progresji, warunków odblokowań, werdyktu ani API.
- W koncepcji pojawiały się przykładowe procenty postępu i tropy. Nie przeniesiono ich do gry. Interfejs używa realnych danych generowanych przez grę.
- Nocny obraz w nagłówku oraz mały obrazek w nawigacji to **wyłącznie ilustracyjne dekoracje** wycięte z zaakceptowanego wzoru; nie stanowią dowodów.
- Zdjęcia w karcie sprawy to zachowane pliki z oryginalnej wersji.

## Kontrole lokalne
- `npm run build`: PASS
- `npm run check`: PASS (61 sekcji skryptów, 64 sekcje CSS, 81 assetów WebP i 9 MP3, zgodność z kanonem świadków i rejestrem dowodów)
- `tools/test-rc571038-visual.py`: **266/266** — 10 zakładek i 7 szerokości od 320 do 1920 px; brak poziomego wyjścia poza ekran, obrazy załadowane.
- `tools/test-rc571036-long-chat.py`: **3/3** — 100 wiadomości, telefon i komputer.
- Dodatkowe kliknięcia: **4/4** — skrót do Dedukcji i działający przycisk „Otwórz akta” z rzeczywistego panelu pierwszych czynności na 390 i 1440 px.
- Brak błędów JS zgłoszonych przez Playwright w przebadanych widokach.

## Ograniczenia
- Testy wykonano lokalnie w Chromium; nie obejmują prawdziwego urządzenia, połączenia Apinex, Supabase ani rzeczywistej produkcji Vercel.
- Wersja jest **interpretacją funkcjonalną** zaakceptowanej ilustracji — nie kopią piksel po pikselu.
- Na hostingu zablokowany localStorage może wyświetlić informację o zapisie ręcznym. Jest to istniejąca funkcja bezpieczeństwa i nie została usunięta.

## Wdrożenie
- Pełny ZIP: zawartość jest kompletnym projektem.
- Aktualizacja: tylko do RC57.10.37; pliki z poprawki rozpakować z zachowaniem struktury katalogów i nadpisać wskazane pliki.
- Najpierw sprawdzić na Vercel Preview i porównać Pulpit, Przesłuchania, Oględziny i Dedukcję na komputerze i telefonie.
