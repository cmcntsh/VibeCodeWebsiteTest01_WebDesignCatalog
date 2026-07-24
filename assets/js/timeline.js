
(() => {
  'use strict';
  const navLinks = [...document.querySelectorAll('[data-timeline-link]')];
  const sections = navLinks.map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);
  if (!('IntersectionObserver' in window) || !sections.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => link.removeAttribute('aria-current'));
      document.querySelector(`[data-timeline-link][href="#${entry.target.id}"]`)?.setAttribute('aria-current','true');
    });
  }, {rootMargin: '-35% 0px -55% 0px'});
  sections.forEach(section => observer.observe(section));
})();
