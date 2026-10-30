// Runs before first paint: marks JavaScript as available and enables entrance
// animations unless the visitor prefers reduced motion.
(function () {
  document.documentElement.classList.add('js');
  try {
    if (!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('motion');
    }
  } catch (e) { /* no animations */ }
})();
