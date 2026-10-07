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
  // Ekam, the guardian, drawn on a canvas from two sprite sheets (plain images, loaded like any other): his take-off,
  // which played backwards is his landing, and his shield-and-cape loop. The landing ends in the pose the loop
  // starts from, so one runs into the other without a jump. Reduced motion keeps the still picture.
  document.addEventListener('DOMContentLoaded', function () {
    var canFly = !window.matchMedia('(prefers-reduced-motion: reduce)').matches && 'Promise' in window &&
      !!document.createElement('canvas').getContext;
    if (!canFly) return;
    var W = 328, H = 440;
    var SHEETS = {
      takeoff: { src: 'assets/mascot/ekam-takeoff-sheet.webp', n: 47, cols: 8 },
      idle: { src: 'assets/mascot/ekam-idle-sheet.webp', n: 50, cols: 8 },
    };
    var CLIP = { land: 2611, takeoff: 3133 }; // 47 frames at 18 and 15 a second
    var loaded = {};
    var sheet = function (name) {
      return loaded[name] || (loaded[name] = new Promise(function (ok, no) {
        var im = new Image();
        im.onload = function () { ok(im); };
        im.onerror = no;
        im.src = SHEETS[name].src;
      }));
    };
    var ready = function () { return Promise.all([sheet('takeoff'), sheet('idle')]); };
    var draw = function (cv, im, i, cols) {
      var ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(im, (i % cols) * W, Math.floor(i / cols) * H, W, H, 0, 0, W, H);
    };
    // Plays a sheet on a canvas at fps, forwards or backwards, once (resolves at the end) or looping until replaced.
    var play = function (cv, name, fps, reverse, loop) {
      var run = (cv.ekamRun = (cv.ekamRun || 0) + 1);
      return sheet(name).then(function (im) {
        var s = SHEETS[name], t0 = null;
        return new Promise(function (ok) {
          var tick = function (t) {
            if (cv.ekamRun !== run) return ok();
            if (t0 === null) t0 = t;
            var f = Math.floor(((t - t0) / 1000) * fps);
            if (!loop && f >= s.n) { draw(cv, im, reverse ? 0 : s.n - 1, s.cols); return ok(); }
            f = f % s.n;
            draw(cv, im, reverse ? s.n - 1 - f : f, s.cols);
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      });
    };
    // Swaps a still <img class="ekam"> for a canvas in the same place, keeping its description for screen readers.
    var stage = function (img) {
      if (!img) return null;
      var cv = document.createElement('canvas');
      cv.width = W; cv.height = H; cv.className = img.className + ' away';
      if (img.alt) { cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', img.alt); }
      img.replaceWith(cv);
      return cv;
    };
    var restart = function (cv, cls) {
      cv.classList.remove('dropin', 'launch', 'away');
      void cv.offsetWidth;
      if (cls) cv.classList.add(cls);
    };
    var land = function (cv) {
      cv.ekamBusy = true;
      return ready().then(function () {
        restart(cv, 'dropin');
        return play(cv, 'takeoff', 18, true, false);
      }).then(function () {
        cv.ekamBusy = false;
        play(cv, 'idle', 10, false, true);
      });
    };
    var takeoff = function (cv) {
      cv.ekamBusy = true;
      restart(cv, 'launch');
      return play(cv, 'takeoff', 15, false, false).then(function () {
        cv.classList.add('away'); cv.ekamBusy = false; cv.ekamRun++;
      });
    };

    // Hero: he drops in from the sky, then says his first line.
    var mascot = document.querySelector('.mascot');
    var hero = mascot && getComputedStyle(mascot).display !== 'none' ? stage(mascot.querySelector('.ekam')) : null;
    var heroLand = function () {
      if (!hero) return;
      mascot.classList.add('waiting'); hero.classList.add('away');
      land(hero).then(function () { mascot.classList.remove('waiting'); });
    };
    heroLand();
    // Header: a small Ekam lands in the bar as the page opens, just after the big one.
    var mini = stage(document.querySelector('.mini-ekam .ekam'));
    if (mini) setTimeout(function () { land(mini); }, 900);
    // Footer: he lands on guard when you reach him.
    var guard = 'IntersectionObserver' in window ? stage(document.querySelector('.guard .ekam')) : null;
    if (guard) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting && guard.classList.contains('away') && !guard.ekamBusy) land(guard); });
      }, { threshold: 0.6 }).observe(guard.parentNode);
    }
    // "Fly to the top" and the small Ekam: he takes off, the page follows him up, and he lands back at the top.
    var flyUp = function (img) {
      return function (ev) {
        ev.preventDefault();
        if (img.ekamBusy) return;
        takeoff(img);
        setTimeout(function () {
          window.scrollTo({ top: 0, behavior: 'smooth' });
          var arrive = function () {
            if (window.scrollY > 60) return;
            window.removeEventListener('scroll', arrive);
            heroLand();
            if (mini && mini.classList.contains('away') && !mini.ekamBusy) setTimeout(function () { land(mini); }, 900);
          };
          window.addEventListener('scroll', arrive, { passive: true });
          arrive();
        }, 1700);
      };
    };
    var fly = document.querySelector('.guard .fly');
    if (fly && guard) fly.addEventListener('click', flyUp(guard));
    var miniLink = document.querySelector('.mini-ekam');
    if (miniLink && mini) miniLink.addEventListener('click', flyUp(mini));
    // The company link: Ekam takes off from beside it and Ashtadeep's site opens, where Vyom lands.
    // Ctrl/Cmd-click and middle-click still open it the usual way.
    var company = document.querySelector('.nav-cta .company');
    if (company && mini) company.addEventListener('click', function (ev) {
      if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button !== 0) return;
      ev.preventDefault();
      if (company.classList.contains('flying')) return;
      company.classList.add('flying');
      var go = function () { window.location.href = company.href; };
      if (mini.ekamBusy || mini.classList.contains('away')) { setTimeout(go, 700); return; }
      takeoff(mini);
      setTimeout(go, 2700);
    });
    window.addEventListener('pageshow', function (ev) {
      if (!ev.persisted) return;
      if (company) company.classList.remove('flying');
      if (mini && mini.classList.contains('away')) land(mini);
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
