
(() => {
  'use strict';

  const body = document.body;
  const root = body.dataset.root || '';
  const trends = Array.isArray(window.WDTC_TRENDS) ? window.WDTC_TRENDS : [];
  const qs = (selector, scope = document) => scope.querySelector(selector);
  const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

  const safeStorage = {
    get(key, fallback) {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
      } catch (_) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
    }
  };

  const toast = qs('[data-toast]');
  let toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
  }
  window.WDTCToast = showToast;

  const menuButton = qs('[data-menu-toggle]');
  const nav = qs('[data-primary-nav]');
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = nav.classList.toggle('is-open');
      menuButton.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) {
        nav.classList.remove('is-open');
        menuButton.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const storedTheme = safeStorage.get('wdtc-theme', null);
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (storedTheme === 'dark' || (!storedTheme && systemDark)) document.documentElement.dataset.theme = 'dark';
  const themeButton = qs('[data-theme-toggle]');
  if (themeButton) {
    const updateThemeLabel = () => {
      const dark = document.documentElement.dataset.theme === 'dark';
      themeButton.setAttribute('aria-label', dark ? 'Use light theme' : 'Use dark theme');
      themeButton.setAttribute('title', dark ? 'Use light theme' : 'Use dark theme');
    };
    updateThemeLabel();
    themeButton.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      safeStorage.set('wdtc-theme', next);
      updateThemeLabel();
    });
  }

  const searchDialog = qs('#site-search');
  const searchInput = qs('[data-site-search-input]');
  const searchResults = qs('[data-site-search-results]');
  const searchOpeners = qsa('[data-search-open]');
  const searchClose = qs('[data-search-close]');

  const normalize = value => String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).map(token => token.length > 4 && token.endsWith('s') && !token.endsWith('ss') ? token.slice(0, -1) : token).join(' ');
  const searchStopWords = new Set(['a','an','and','for','in','of','site','style','the','web','website','with']);
  const searchSynonyms = {
    shiny: ['glossy','gloss','reflective'],
    huge: ['large','oversized','extra'],
    text: ['type','typography','headline'],
    old: ['retro','early','vintage'],
    computer: ['browser','operating','digital','pixel'],
    ui: ['interface','dialog','window','control'],
    soft: ['neumorphism','rounded','pastel'],
    glass: ['glassmorphism','frosted','translucent'],
    raw: ['default','unstyled','brutalism'],
    boxes: ['card','tile','module'],
    colorful: ['saturated','bright','color'],
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
  const trendSearchText = trend => normalize([
    trend.title, trend.popular, trend.familyName, ...(trend.commonNames || []), ...(trend.typicalElements || []), ...(trend.keywords || [])
  ].join(' '));
  const trendSearchScore = (trend, query) => {
    const needle = normalize(query);
    if (!needle) return trend.featured ? 1 : 0;
    const title = normalize(trend.title);
    const commonNames = (trend.commonNames || []).map(normalize);
    const haystack = trendSearchText(trend);
    let score = 0;
    if (title === needle) score += 1200;
    else if (title.includes(needle)) score += 900;
    if (commonNames.some(name => name === needle)) score += 1100;
    else if (commonNames.some(name => name.includes(needle))) score += 800;
    if (haystack.includes(needle)) score += 500;
    searchTokens(needle).forEach(token => {
      if (title.includes(token)) score += 80;
      if (commonNames.some(name => name.includes(token))) score += 65;
      if (haystack.includes(token)) score += 20;
      const synonymMatches = (searchSynonyms[token] || []).filter(candidate => haystack.includes(candidate)).length;
      score += synonymMatches * 8;
    });
    return score;
  };

  function renderSearchResults(query = '') {
    if (!searchResults) return;
    const needle = normalize(query.trim());
    let matches = needle
      ? trends
          .filter(trend => matchesSearch(trendSearchText(trend), needle))
          .sort((a, b) => trendSearchScore(b, needle) - trendSearchScore(a, needle) || a.id - b.id)
      : trends.filter(trend => trend.featured);
    matches = matches.slice(0, 10);
    if (!matches.length) {
      searchResults.innerHTML = `<li class="search-empty">No direct match. Try an era, a visual element such as “glossy buttons,” or a common term such as “soft UI.”</li>`;
      return;
    }
    searchResults.innerHTML = matches.map(trend => `
      <li class="search-result">
        <a href="${root}trends/${trend.slug}.html">
          <img src="${root}${trend.image.src}" width="220" height="138" alt="" loading="lazy" decoding="async">
          <span><strong>${escapeHtml(trend.title)}</strong><span>${escapeHtml(trend.popular)} · ${escapeHtml(trend.familyName)}</span></span>
          <span aria-hidden="true">↗</span>
        </a>
      </li>`).join('');
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[char]));
  }

  searchOpeners.forEach(button => button.addEventListener('click', () => {
    if (!searchDialog) return;
    renderSearchResults('');
    if (typeof searchDialog.showModal === 'function') searchDialog.showModal();
    else searchDialog.setAttribute('open', '');
    setTimeout(() => searchInput?.focus(), 30);
  }));
  searchClose?.addEventListener('click', () => searchDialog?.close());
  searchDialog?.addEventListener('click', event => {
    if (event.target === searchDialog) searchDialog.close();
  });
  searchInput?.addEventListener('input', event => renderSearchResults(event.target.value));

  qsa('[data-home-search-form]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      const value = new FormData(form).get('q');
      const query = String(value || '').trim();
      window.location.href = `${root}catalog.html${query ? `?q=${encodeURIComponent(query)}` : ''}`;
    });
  });

  qsa('[data-random-trend]').forEach(button => button.addEventListener('click', () => {
    if (!trends.length) return;
    const trend = trends[Math.floor(Math.random() * trends.length)];
    window.location.href = `${root}trends/${trend.slug}.html`;
  }));

  const savedKey = 'wdtc-saved';
  function getSaved() { return safeStorage.get(savedKey, []); }
  function setSaved(values) { safeStorage.set(savedKey, [...new Set(values)]); }
  function updateSaveButtons() {
    const saved = getSaved();
    qsa('[data-save-trend]').forEach(button => {
      const active = saved.includes(button.dataset.saveTrend);
      button.classList.toggle('is-saved', active);
      button.setAttribute('aria-pressed', String(active));
      const label = active ? 'Remove from saved study list' : 'Save to study list';
      button.setAttribute('aria-label', label);
      const labelNode = button.querySelector('[data-save-label]');
      if (labelNode) labelNode.textContent = active ? 'Saved' : 'Save';
    });
  }
  updateSaveButtons();
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-save-trend]');
    if (!button) return;
    const slug = button.dataset.saveTrend;
    const saved = getSaved();
    const next = saved.includes(slug) ? saved.filter(item => item !== slug) : [...saved, slug];
    setSaved(next);
    updateSaveButtons();
    showToast(saved.includes(slug) ? 'Removed from study list' : 'Saved to study list');
  });

  const compareKey = 'wdtc-compare';
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-add-compare]');
    if (!button) return;
    const slug = button.dataset.addCompare;
    let values = safeStorage.get(compareKey, []);
    values = values.filter(value => value !== slug);
    values.push(slug);
    values = values.slice(-2);
    safeStorage.set(compareKey, values);
    showToast(values.length === 1 ? 'Added. Choose one more trend to compare.' : 'Comparison ready.');
    if (values.length === 2 && button.dataset.compareRedirect !== 'false') {
      setTimeout(() => { window.location.href = `${root}compare.html?a=${encodeURIComponent(values[0])}&b=${encodeURIComponent(values[1])}`; }, 450);
    }
  });

  qsa('[data-copy-citation]').forEach(button => button.addEventListener('click', async () => {
    const citation = button.dataset.copyCitation || '';
    try {
      await navigator.clipboard.writeText(citation);
      showToast('Citation copied');
    } catch (_) {
      const textarea = document.createElement('textarea');
      textarea.value = citation;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
      showToast('Citation copied');
    }
  }));

  const revealItems = qsa('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {rootMargin: '0px 0px -10% 0px', threshold: .08});
    revealItems.forEach(item => observer.observe(item));
  } else revealItems.forEach(item => item.classList.add('is-visible'));

  const lightbox = qs('#image-lightbox');
  const lightboxImage = qs('[data-lightbox-image]');
  const lightboxCaption = qs('[data-lightbox-caption]');
  qsa('[data-lightbox-src]').forEach(button => button.addEventListener('click', () => {
    if (!lightbox || !lightboxImage) return;
    lightboxImage.src = button.dataset.lightboxSrc;
    lightboxImage.alt = button.dataset.lightboxAlt || '';
    if (lightboxCaption) lightboxCaption.textContent = button.dataset.lightboxCaption || '';
    lightbox.showModal();
  }));
  qs('[data-lightbox-close]')?.addEventListener('click', () => lightbox?.close());
  lightbox?.addEventListener('click', event => { if (event.target === lightbox) lightbox.close(); });

  document.addEventListener('keydown', event => {
    if (event.key === '/' && !/input|textarea|select/i.test(document.activeElement?.tagName || '')) {
      event.preventDefault();
      searchOpeners[0]?.click();
    }
    if (event.key === 'Escape' && nav?.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      menuButton?.setAttribute('aria-expanded', 'false');
      menuButton?.focus();
    }
  });
})();
