
(() => {
  'use strict';
  const input = document.querySelector('[data-glossary-search]');
  const entries = [...document.querySelectorAll('[data-glossary-entry]')];
  const count = document.querySelector('[data-glossary-count]');
  if (!input || !entries.length) return;
  const normalize = value => String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).map(token => token.length > 4 && token.endsWith('s') && !token.endsWith('ss') ? token.slice(0, -1) : token).join(' ');
  const apply = () => {
    const query = normalize(input.value.trim());
    let shown = 0;
    entries.forEach(entry => {
      const visible = !query || normalize(entry.dataset.search).includes(query);
      entry.hidden = !visible;
      if (visible) shown++;
    });
    if (count) count.textContent = `${shown} term${shown === 1 ? '' : 's'}`;
  };
  input.addEventListener('input', apply);
  apply();
})();
