// The site's only script: a shadow under the menu once the page scrolls, the phone menu closing after a
// choice, and content rising into place once as it scrolls in. The page reads the same without it.
(function () {
  var root = document.documentElement;
  root.classList.add('js');

  document.addEventListener('DOMContentLoaded', function () {
    var nav = document.querySelector('.nav');
    var onScroll = function () {
      if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    var menu = document.querySelector('.menu');
    if (menu) {
      menu.addEventListener('click', function (event) {
        if (event.target.closest('a')) menu.removeAttribute('open');
      });
      document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && menu.hasAttribute('open')) {
          menu.removeAttribute('open');
          menu.querySelector('summary').focus();
        }
      });
    }

    // Only what starts below the fold waits to be revealed; what is on screen at load is shown at rest.
    if (!('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var items = document.querySelectorAll('.reveal');
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.remove('pre');
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -8% 0px' },
    );
    items.forEach(function (item) {
      if (item.getBoundingClientRect().top > window.innerHeight) {
        item.classList.add('pre');
        observer.observe(item);
      }
    });
  });
  // Ekam's speech bubble: one true line at a time (held still for reduced motion).
  document.addEventListener('DOMContentLoaded', function () {
    var mascot = document.querySelector('.mascot');
    if (!mascot || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var lines = JSON.parse(mascot.getAttribute('data-lines') || '[]');
    var bubble = mascot.querySelector('.bubble');
    var at = 0;
    if (lines.length > 1) setInterval(function () {
      bubble.classList.add('fade');
      setTimeout(function () { at = (at + 1) % lines.length; bubble.textContent = lines[at]; bubble.classList.remove('fade'); }, 280);
    }, 4800);
  });
})();
