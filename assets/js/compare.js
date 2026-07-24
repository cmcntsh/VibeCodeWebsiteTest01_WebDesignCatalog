
(() => {
  'use strict';
  const trends = Array.isArray(window.WDTC_TRENDS) ? window.WDTC_TRENDS : [];
  const root = document.body.dataset.root || '';
  const selectA = document.querySelector('[data-compare-a]');
  const selectB = document.querySelector('[data-compare-b]');
  const output = document.querySelector('[data-comparison-output]');
  if (!selectA || !selectB || !output || !trends.length) return;
  const bySlug = new Map(trends.map(trend => [trend.slug, trend]));
  const params = new URLSearchParams(location.search);
  const stored = (() => { try { return JSON.parse(localStorage.getItem('wdtc-compare') || '[]'); } catch (_) { return []; } })();
  const defaults = ['skeuomorphism','flat-design'];
  const a = params.get('a') || stored[0] || defaults[0];
  const b = params.get('b') || stored[1] || defaults[1];
  selectA.innerHTML = trends.map(t => `<option value="${t.slug}">${t.code} — ${t.title}</option>`).join('');
  selectB.innerHTML = selectA.innerHTML;
  selectA.value = bySlug.has(a) ? a : defaults[0];
  selectB.value = bySlug.has(b) ? b : defaults[1];

  const escape = value => String(value).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const list = values => `<ul class="compare-list">${values.map(value => `<li>${escape(value)}</li>`).join('')}</ul>`;
  function render() {
    const one = bySlug.get(selectA.value);
    const two = bySlug.get(selectB.value);
    if (!one || !two) return;
    const rows = [
      ['Trend', `<h2 class="compare-title"><a href="${root}trends/${one.slug}.html">${escape(one.title)}</a></h2>`, `<h2 class="compare-title"><a href="${root}trends/${two.slug}.html">${escape(two.title)}</a></h2>`],
      ['Specimen', `<img class="compare-image" src="${root}${one.image.src}" alt="${escape(one.image.alt)}">`, `<img class="compare-image" src="${root}${two.image.src}" alt="${escape(two.image.alt)}">`],
      ['Main period', escape(one.popular), escape(two.popular)],
      ['Catalog family', escape(one.familyName), escape(two.familyName)],
      ['Definition', `<p>${escape(one.fullDescription)}</p>`, `<p>${escape(two.fullDescription)}</p>`],
      ['Common names', list(one.commonNames), list(two.commonNames)],
      ['Typical elements', list(one.typicalElements), list(two.typicalElements)]
    ];
    output.innerHTML = rows.map(([label,left,right]) => `<div class="compare-row"><div class="compare-row__label">${label}</div><div>${left}</div><div>${right}</div></div>`).join('');
    const url = new URL(location.href);
    url.searchParams.set('a', one.slug);
    url.searchParams.set('b', two.slug);
    history.replaceState(null, '', url);
    try { localStorage.setItem('wdtc-compare', JSON.stringify([one.slug,two.slug])); } catch (_) {}
  }
  selectA.addEventListener('change', render);
  selectB.addEventListener('change', render);
  render();
})();
