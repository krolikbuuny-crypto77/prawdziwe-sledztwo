# Pakiet 6.19 — Fabuła 2.0, żywi świadkowie, finał 3.0

**Baza:** 6.18. Jest to **modyfikacja działającego kodu**, nie projekt nowej gry. Zachowano 78 dokumentów, 75 grafik WebP, 9 ścieżek MP3, pięć minigier, sześciu świadków oraz obecne wyznaczniki sprawstwa i finału.

## Zrealizowane zmiany

1. **Historia Leny z dostępnych źródeł.** W zakładce dedukcji pojawia się sześć krótkich fragmentów jej pracy, sporu o diagnostykę, rozmowy o BHP, rozbieżności L-2/L-3 i kontaktu przed śmiercią. Każdy pojawia się dopiero po zdobyciu określonych już istniejących dokumentów. Nie tworzy nowych dowodów.
2. **Osiem zwrotów akcji — pięć wymiarów każdego.** Dla wcześniejszych odblokowywanych scen dodano wcześniejszą przesłankę, odkrycie, zmianę znaczenia, reakcję postaci i dalszą możliwość. Nie zmieniono żadnej bramki dostępu.
3. **Psychologia sześciu świadków.** Zdefiniowano odrębne sposoby mówienia, mechanizmy obronne, pamięć ograniczeń wiedzy oraz konsekwencje wcześniej ustalonych błędów. Charakterystykę Z.ai i Groq dostają z **tego samego, serwerowo kontrolowanego** katalogu `lib/narrative-voice-619.js`; browser nie może przedstawić nowej historii jako dowodu.
4. **Reakcja na dotychczasową rozmowę.** Backend dostosowuje styl odpowiedzi do wcześniejszych pytań (np. rzeczowych próśb o źródło, przedwczesnych zarzutów), bez zmiany dopuszczonych faktów. Po włączeniu Supabase korzysta z zatwierdzonego dziennika.
5. **Epilog 3.0.** Zależnie od aktualnego rodzaju rozstrzygnięcia dodano konsekwencje dla sześciu postaci, ślad pamięci o Lenie i przypomnienie granic wyroku. Istniejący mechanizm aktu oskarżenia jest nadal jedynym rozstrzygającym.
6. **Opcjonalność i dostępność.** Nie dołożono zagadek ani wymaganych dialogów. Układ kart jest responsywny; tekst nie zawiera agresywnych animacji; przewidziano `prefers-reduced-motion`.
7. **Audyt fabularny.** Opracowano `story-bible/KANON_ZRODLOWY.json` (78 pełnych dokumentów, 6 profili wypowiedzi, 9 bramek) i trzy dokumenty fabularne obejmujące czas, niepewności, motywy oraz zależności.

## Istniejące rzeczy, które zachowano bez zmian

- Z.ai → Groq → lokalny WitnessEngine, oba API wyłącznie przez Vercel;
- Cloudflare jako pomocniczy analityk bez władzy nad dowodami;
- serwerowy walidator postępu i werdyktu z 6.18;
- Supabase jako stan zatwierdzony, lokalny zapis i synchronizacja offline;
- mechanika przesłuchań, scen oględzin, minigier, dedukcji i pięciu wariantów kwalifikacji;
- źródłowe fakty o zabójstwie oraz istniejący graficzny, mroczny styl.

## Zmodyfikowane lub nowe pliki główne

- `src/story/76-narrative-depth-619.js` — dynamiczne rozdziały, zwroty, profile, retrospekcja finału.
- `src/styles/76-narrative-depth-619.css` — mobilny układ rozszerzonych scen.
- `lib/narrative-voice-619.js` — serwerowo kontrolowana tożsamość językowa świadków.
- `api/interview.js` — zgodny dla obu dostawców kontekst stylu i reakcja na zapisaną historię.
- `src/build-manifest.json`, `src/compatibility-contracts.json`, przebudowany `index.html`.
- `story-bible/*`, `tools/test-narrative619.py`, `QA-619/*`.

## Zasada „nie tworzyć nowych faktów”

Rozszerzone opisy są **interpretacją narracyjną** z istniejących materiałów. Nie trafiają do banku `factBank` jako nowy dowód. Postacie mogą reagować emocjonalnie w granicach zatwierdzonej historii, ale formalne konfrontacje i kanoniczne sprostowania nadal są pilnowane przez wcześniejsze moduły i serwer. Finał 3.0 **nie zmienia** wyniku wyliczonego przez reguły.
