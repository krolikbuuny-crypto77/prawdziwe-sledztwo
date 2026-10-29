
/* Prawdziwe Śledztwo — kontekstowe korelacje źródeł.
 * Wyłącznie fakty dostępne graczowi; żadnych ocen związku przyczynowego.
 * Nie zapisuje, nie odblokowuje i nie zmienia hipotez ani osi czasu.
 */
(function () {
  'use strict';
  const MAX_INDICATED_ITEMS = 3;
  const MAX_SOURCE_TEXT = 8500;
  const locationPatterns = [
    ['stanowisko nr 3', /\b(?:stanowisk\w*\s*(?:nr\s*)?3|nisz\w*\s*n\s*-?\s*3)\b/],
    ['warsztat', /\b(?:warsztat\w*|hali\s+napraw|stref\w*\s+serwisow)\b/],
    ['dyspozytornia', /\bdyspozytorni\w*\b|\bdyspozytorn\w*\b/],
    ['brama i kontrola wejść', /\b(?:bram\w*|portierni\w*|czytnik\w*\s+(?:przy\s+)?(?:bram|wejsc))\b/],
    ['biuro BHP', /\b(?:biur\w*\s+bhp|pokoj\w*\s+bhp)\b/],
    ['korytarz południowy', /\b(?:korytarz\w*\s+poludniow\w*|drzw\w*\s+poludniow\w*)\b/],
    ['pokój dokumentacji', /\b(?:pokoj\w*\s+(?:dokumentacji|audytow\w*)|biur\w*\s+audyt\w*)\b/],
    ['depozyt śladów', /\b(?:depozyt\w*\s+(?:slad\w*|prob\w*)|magazyn\w*\s+slad\w*)\b/]
  ];
  const inspectedRoomNames = {
    bay: 'stanowisko nr 3', workshop: 'warsztat', dispatch: 'dyspozytornia',
    audit: 'pokój dokumentacji', office: 'biuro BHP',
    passage: 'korytarz południowy', lab: 'depozyt śladów'
  };
  const normalize = value => String(value || '').toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/ł/g, 'l');
  const byId = id => document.getElementById(id);
  const selected = { key: null, from: '' };
  let sourceMetadata = new Map();
  let sourceSignature = '';
  let timelinePanel = null;
  let boardSummary = null;
  let pending = false;

  function getSources() {
    return typeof dedAvailable === 'function' ? dedAvailable() : new Map();
  }
  function getDocument(id) {
    return typeof byId !== 'undefined' && typeof DOCS !== 'undefined'
      ? DOCS.find(documentItem => documentItem.id === id) : null;
  }
  function getMetadata(source) {
    const documentItem = source.docId ? getDocument(source.docId) : null;
    // Używamy wyłącznie zdobytego dokumentu lub wypowiedzi już zapisanej w rozmowie.
    const text = normalize([
      source.label, source.body.slice(0, MAX_SOURCE_TEXT),
      documentItem?.issuer || '', documentItem?.document_time || ''
    ].join(' '));
    const times = new Set();
    for (const match of text.matchAll(/(?:^|[^0-9])([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?(?!\d)/g)) {
      times.add(match[1].padStart(2, '0') + ':' + match[2]);
    }
    const places = new Set();
    for (const [name, pattern] of locationPatterns) if (pattern.test(text)) places.add(name);
    if (documentItem && typeof SC_SPOTS !== 'undefined') {
      for (const spot of SC_SPOTS) {
        if (spot.doc === documentItem.id && inspectedRoomNames[spot.room]) {
          places.add(inspectedRoomNames[spot.room]);
        }
      }
    }
    const persons = new Set();
    if (typeof CONTENT !== 'undefined') {
      for (const person of CONTENT.characters || []) {
        const lastName = normalize(person.name.trim().split(/\s+/).at(-1));
        const phrase = normalize(person.name);
        if ((lastName.length > 3 && new RegExp('(^|[^a-z])' + lastName + '(?![a-z])').test(text)) || text.includes(phrase) || source.charId === person.id) {
          persons.add(person.name);
        }
      }
    }
    if (/\brudnick\w*\b/.test(text)) persons.add('Lena Rudnicka');
    return { times, places, persons };
  }
  function refreshMetadata() {
    const available = getSources();
    const signature = [...available].map(([key, source]) => `${key}:${source.body?.length || 0}:${String(source.body || '').slice(0,90)}`).join('|');
    if (signature !== sourceSignature) {
      sourceSignature = signature;
      sourceMetadata = new Map();
      for (const [key, source] of available) sourceMetadata.set(key, getMetadata(source));
    }
    if (selected.key && !available.has(selected.key)) selected.key = null;
    return available;
  }
  function intersect(set1, set2) {
    return [...set1].filter(value => set2.has(value));
  }
  function correlationsFor(key) {
    const active = sourceMetadata.get(key);
    if (!active) return [];
    const candidates = [];
    const available = getSources();
    for (const [otherKey, meta] of sourceMetadata) {
      if (otherKey === key || !available.has(otherKey)) continue;
      const time = intersect(active.times, meta.times);
      const place = intersect(active.places, meta.places);
      const person = intersect(active.persons, meta.persons);
      if (!time.length && !place.length && !person.length) continue;
      const reasons = [];
      if (time.length) reasons.push('godzina: ' + time.slice(0, 2).join(', '));
      if (place.length) reasons.push('miejsce: ' + place.slice(0, 2).join(', '));
      if (person.length) reasons.push('osoba: ' + person.slice(0, 2).join(', '));
      candidates.push({ key: otherKey, source: available.get(otherKey), reasons,
        score: (time.length ? 5 : 0) + (place.length ? 3 : 0) + (person.length ? 2 : 0) });
    }
    return candidates.sort((a, b) => b.score - a.score || a.source.label.localeCompare(b.source.label, 'pl'));
  }
  function mark(node, match) {
    const old = node.querySelector(':scope > .correlation-marker');
    old?.remove();
    node.classList.toggle('suggestion-hint', !!match);
    if (!match) {
      node.removeAttribute('data-correlation-reasons');
      return;
    }
    const message = 'Wspólne metadane: ' + match.reasons.join('; ') + '. Nie oznacza to potwierdzenia tezy.';
    node.dataset.correlationReasons = message;
    const label = document.createElement('span');
    label.className = 'correlation-marker';
    label.textContent = '↗ Wspólne dane';
    label.title = message;
    label.setAttribute('role', 'note');
    label.setAttribute('aria-label', message);
    node.append(label);
  }
  function ensureBoardSummary() {
    if (boardSummary?.isConnected) return boardSummary;
    const controls = byId('threadBoardPanel')?.querySelector('.thread-controls');
    if (!controls) return null;
    boardSummary = document.createElement('div');
    boardSummary.id = 'correlationBoardSummary';
    boardSummary.className = 'correlation-summary';
    boardSummary.setAttribute('role', 'status');
    boardSummary.setAttribute('aria-live', 'polite');
    controls.insertAdjacentElement('afterend', boardSummary);
    return boardSummary;
  }
  function appendSummary(summary, matches) {
    summary.replaceChildren();
    if (!selected.key) {
      summary.textContent = 'Wybierz dokument lub zeznanie, aby zobaczyć wspólne godziny, miejsca i osoby.';
      return;
    }
    const lead = document.createElement('span');
    lead.textContent = matches.length
      ? `Wspólne metadane w ${matches.length} innych dostępnych źródłach. To trop, nie ocena dowodu.`
      : 'Brak innych dostępnych źródeł ze wspólnymi metadanymi.';
    summary.append(lead);
    if (matches.length) {
      const names = document.createElement('small');
      names.textContent = matches.slice(0, MAX_INDICATED_ITEMS).map(m => m.source.label.slice(0, 56)).join(' · ');
      names.title = 'Przykłady korelacji. Inne źródła nadal można wybrać.';
      summary.append(names);
    }
  }
  function applyHighlights() {
    refreshMetadata();
    const matches = selected.key ? correlationsFor(selected.key) : [];
    const matchMap = new Map(matches.map(match => [match.key, match]));
    // Tablica „Czerwona Nitka” — źródła widoczne w obecnym oknie paginacji.
    for (const item of document.querySelectorAll('#threadSourceNodes [data-thread-source]')) {
      mark(item, matchMap.get(item.dataset.threadSource));
    }
    // Klasyczny warsztat hipotez — ten sam sygnał, bez modyfikowania listy dowodów.
    for (const item of document.querySelectorAll('#dedSourceList .dd-source')) {
      const btn = item.querySelector('[data-dd-add], [data-dd-open]');
      mark(item, btn ? matchMap.get(btn.dataset.ddAdd || btn.dataset.ddOpen) : null);
    }
    appendSummary(ensureBoardSummary() || document.createElement('div'), matches);
    updateTimelinePanel(matches, matchMap);
  }
  function updateTimelinePanel(matches, matchMap) {
    const editor = byId('tlEditor');
    if (!editor) return;
    if (!timelinePanel?.isConnected) {
      timelinePanel = document.createElement('section');
      timelinePanel.className = 'correlation-timeline';
      timelinePanel.id = 'correlationTimelinePanel';
      timelinePanel.setAttribute('aria-label', 'Powiązane metadane źródeł chronologicznych');
      editor.insertAdjacentElement('afterend', timelinePanel);
    }
    for (const input of editor.querySelectorAll('[data-tl-source]')) {
      mark(input.closest('label'), matchMap.get('doc:' + input.dataset.tlSource));
    }
    timelinePanel.replaceChildren();
    const heading = document.createElement('strong');
    heading.textContent = 'Wspólne metadane źródeł';
    timelinePanel.append(heading);
    if (!selected.key) {
      const hint = document.createElement('p');
      hint.textContent = 'Zaznacz dokument przy karcie zdarzenia, aby zobaczyć możliwe korelacje z innymi zdobytymi aktami.';
      timelinePanel.append(hint); return;
    }
    const sub = document.createElement('p');
    sub.textContent = matches.length ? `${matches.length} możliwych powiązań czasowych, miejscowych lub osobowych. Nie ustalają kolejności ani winy.` : 'Brak innych posiadanych źródeł o wspólnych metadanych.';
    timelinePanel.append(sub);
    const list = document.createElement('div');
    list.className = 'correlation-timeline-list';
    for (const match of matches.filter(m => m.source.docId).slice(0, MAX_INDICATED_ITEMS)) {
      const entry = document.createElement('div');
      entry.className = 'correlation-timeline-item';
      const title = document.createElement('span');
      title.textContent = match.source.label;
      const reason = document.createElement('small');
      reason.textContent = match.reasons.join(' · ');
      entry.append(title, reason); list.append(entry);
    }
    timelinePanel.append(list);
  }
  function scheduleApply() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => { pending = false; applyHighlights(); });
  }
  function selectSource(key, from) {
    if (key && !getSources().has(key)) return;
    selected.key = key || null;
    selected.from = from || '';
    scheduleApply();
  }
  function initialize() {
    if (typeof dedAvailable !== 'function') return;
    const deduction = byId('deduction');
    const timeline = byId('timeline');
    deduction?.addEventListener('click', event => {
      const node = event.target.closest('#dedSourceList .dd-source');
      if (!node) return;
      const button = node.querySelector('[data-dd-add], [data-dd-open]');
      if (button) selectSource(button.dataset.ddAdd || button.dataset.ddOpen, 'deduction');
    }, true);
    timeline?.addEventListener('change', event => {
      const input = event.target.closest('[data-tl-source]');
      if (!input) return;
      if (input.checked) selectSource('doc:' + input.dataset.tlSource, 'timeline');
      else if (selected.key === 'doc:' + input.dataset.tlSource) selectSource(null, 'timeline');
    });
    timeline?.addEventListener('click', event => {
      if (event.target.closest('[data-tl-pick]')) {
        const id = event.target.closest('[data-tl-pick]').dataset.tlPick;
        const entry = typeof STATE !== 'undefined' && STATE.timeline11?.entries?.[id];
        const chosen = entry?.sourceIds?.find(docId => getSources().has('doc:' + docId));
        selectSource(chosen ? 'doc:' + chosen : null, 'timeline');
      }
    });
    // Ponowne wyświetlenie po przebudowie list: bez cyklicznego obserwowania DOM.
    scheduleApply();
  }
  window.PS_CORRELATIONS = Object.freeze({ selectSource, scheduleApply, correlationsFor,
    getSelectedSource: () => selected.key, getSourceOrigin: () => selected.from });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, {once: true});
  else initialize();
})();
