
(() => {
  'use strict';
  const root = document.body.dataset.root || '';
  const trends = Array.isArray(window.WDTC_TRENDS) ? window.WDTC_TRENDS : [];
  const grid = document.querySelector('[data-saved-grid]');
  const empty = document.querySelector('[data-saved-empty]');
  if (!grid) return;
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem('wdtc-saved') || '[]'); } catch (_) {}
  const selected = saved.map(slug => trends.find(trend => trend.slug === slug)).filter(Boolean);
  empty.hidden = selected.length > 0;
  grid.innerHTML = selected.map(trend => `
    <article class="trend-card" data-trend-card>
      <a class="trend-card__image" href="${root}trends/${trend.slug}.html"><img src="${root}${trend.image.src}" alt="${trend.image.alt}" loading="lazy" width="1200" height="750"></a>
      <div class="trend-card__body"><div class="trend-card__meta"><span>${trend.code}</span><span>${trend.popular}</span></div><h3><a href="${root}trends/${trend.slug}.html">${trend.title}</a></h3><p>${trend.shortDescription}</p><div class="trend-card__footer"><button class="button button--secondary button--small" type="button" data-save-trend="${trend.slug}"><span data-save-label>Saved</span></button><span class="trend-card__arrow">↗</span></div></div>
    </article>`).join('');
})();
