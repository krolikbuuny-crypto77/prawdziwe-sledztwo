# Raport QA RC35.1 — czat prywatnego pokoju

- `npm run build` — PASS
- `npm run check` — PASS
- `node tools/test-rc35-coop.mjs` — PASS (brak regresji pokoju)
- `node tools/test-rc351-chat.mjs` — PASS (dostęp dwóch członków, odmowa obcym, sprawdzanie Origin, niezależny czat obserwatora, limity, idempotentne wiadomości, ponowne pobieranie, zamykanie pokoju i brak wywołań AI)
- `python tools/test-rc351-chat-browser.py` — PASS (dwa okna Chromium: czat w obu kierunkach, obserwator może pisać, bezpieczny tekst HTML, wspólny ekran i przekazanie sterowania)
- Pełny zbiorczy przebieg testów `python tools/test-navigation.py` i `python tools/test-saves.py` nie został zakończony w ograniczeniu czasu środowiska; nie oznaczono go jako PASS.
- Brak bezpośredniego testu integracji z prawdziwą bazą Supabase (migracja SQL nie była uruchamiana).

## Zasady bezpieczeństwa

Czat jest osobnym interfejsem i API. Słowa użytkowników nie są faktami kanonicznymi; AI ich nie otrzymuje. Tabela i funkcja SQL nie są dostępne z klienta anon/authenticated. Serwer wymaga członkostwa z podpisanego cookie i bezpiecznego Origin. Wysłanie wiadomości nie wymaga sterowania grą. Liczniki, wiadomości i stan pokoju nie są wstrzykiwane jako HTML.
