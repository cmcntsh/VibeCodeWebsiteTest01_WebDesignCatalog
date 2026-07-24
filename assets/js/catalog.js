
(() => {
  'use strict';
  const form = document.querySelector('[data-catalog-filters]');
  const cards = [...document.querySelectorAll('[data-trend-card]')];
  if (!form || !cards.length) return;
  const count = document.querySelector('[data-result-count]');
  const noResults = document.querySelector('[data-no-results]');
  const activeContainer = document.querySelector('[data-active-filters]');
  const clearButton = document.querySelector('[data-clear-filters]');
  const search = form.querySelector('[name="q"]');
  const normalize = value => String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).map(token => token.length > 4 && token.endsWith('s') && !token.endsWith('ss') ? token.slice(0, -1) : token).join(' ');
  const searchStopWords = new Set(['a','an','and','for','in','of','site','style','the','web','website','with']);
  const searchSynonyms = {
    shiny: ['glossy','gloss','reflective'], huge: ['large','oversized','extra'], text: ['type','typography','headline'],
    old: ['retro','early','vintage'], computer: ['browser','operating','digital','pixel'], ui: ['interface','dialog','window','control'],
    soft: ['neumorphism','rounded','pastel'], glass: ['glassmorphism','frosted','translucent'], raw: ['default','unstyled','brutalism'],
    boxes: ['card','tile','module'], colorful: ['saturated','bright','color']
  };
  const searchTokens = value => normalize(value).split(/\s+/).filter(token => token && !searchStopWords.has(token));
  const matchesSearch = (haystack, query) => {
    const normalizedHaystack = normalize(haystack);
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return true;
    if (normalizedHaystack.includes(normalizedQuery)) return true;
    const tokens = searchTokens(normalizedQuery);
    return tokens.length > 0 && tokens.every(token => [token, ...(searchSynonyms[token] || [])].some(candidate => normalizedHaystack.includes(candidate)));
  };

  const params = new URLSearchParams(window.location.search);
  if (params.get('q') && search) search.value = params.get('q');
  ['era','family'].forEach(name => {
    params.getAll(name).forEach(value => {
      const input = form.querySelector(`[name="${name}"][value="${CSS.escape(value)}"]`);
      if (input) input.checked = true;
    });
  });
  const initialSort = params.get('sort');
  if (initialSort && form.elements.sort) form.elements.sort.value = initialSort;

  function selectedValues(name) {
    return [...form.querySelectorAll(`[name="${name}"]:checked`)].map(input => input.value);
  }
  function apply() {
    const query = normalize(search?.value.trim());
    const eras = selectedValues('era');
    const families = selectedValues('family');
    const sort = form.elements.sort?.value || 'chronological';
    let visible = cards.filter(card => {
      const matchesQuery = matchesSearch(card.dataset.search || '', query);
      const cardEras = (card.dataset.eras || '').split(' ');
      const cardFamilies = (card.dataset.families || '').split(' ');
      const matchesEra = !eras.length || eras.some(era => cardEras.includes(era));
      const matchesFamily = !families.length || families.some(family => cardFamilies.includes(family));
      const show = matchesQuery && matchesEra && matchesFamily;
      card.hidden = !show;
      return show;
    });

    visible.sort((a,b) => {
      if (sort === 'alphabetical') return a.dataset.title.localeCompare(b.dataset.title);
      if (sort === 'newest') return Number(b.dataset.start) - Number(a.dataset.start) || Number(a.dataset.id) - Number(b.dataset.id);
      return Number(a.dataset.start) - Number(b.dataset.start) || Number(a.dataset.id) - Number(b.dataset.id);
    });
    const grid = document.querySelector('[data-catalog-grid]');
    visible.forEach(card => grid.appendChild(card));

    if (count) count.textContent = `${visible.length} trend${visible.length === 1 ? '' : 's'} shown`;
    noResults?.classList.toggle('is-visible', visible.length === 0);
    renderChips(query, eras, families);
    syncUrl(query, eras, families, sort);
  }

  function renderChips(query, eras, families) {
    if (!activeContainer) return;
    const labels = [];
    if (query) labels.push(`Search: ${search.value.trim()}`);
    eras.forEach(value => labels.push(value));
    families.forEach(value => {
      const input = form.querySelector(`[name="family"][value="${CSS.escape(value)}"]`);
      labels.push(input?.dataset.label || value);
    });
    activeContainer.innerHTML = labels.map(label => `<span class="filter-chip">${label}</span>`).join('');
    activeContainer.hidden = labels.length === 0;
  }

  function syncUrl(query, eras, families, sort) {
    const next = new URLSearchParams();
    if (query) next.set('q', search.value.trim());
    eras.forEach(value => next.append('era', value));
    families.forEach(value => next.append('family', value));
    if (sort !== 'chronological') next.set('sort', sort);
    const url = `${window.location.pathname}${next.toString() ? `?${next}` : ''}`;
    history.replaceState(null, '', url);
  }

  let timer;
  form.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(apply, 80);
  });
  form.addEventListener('change', apply);
  form.addEventListener('submit', event => {
    event.preventDefault();
    apply();
  });
  clearButton?.addEventListener('click', () => {
    form.reset();
    if (search) search.value = '';
    apply();
    search?.focus();
  });
  apply();
})();
