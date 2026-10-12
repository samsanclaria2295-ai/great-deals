// Great Finds: small progressive enhancements. No tracking, no cookies, no storage.
(function () {
  var doc = document.documentElement;
  doc.classList.remove('no-js');

  // Year in footer
  var y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();

  // Header shadow on scroll
  var header = document.querySelector('.site-header');
  var onScroll = function () { if (header) header.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  var btn = document.querySelector('.menu-btn');
  if (btn) {
    btn.addEventListener('click', function () {
      var open = doc.classList.toggle('menu-open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.mobile-menu a').forEach(function (a) {
      a.addEventListener('click', function () { doc.classList.remove('menu-open'); btn.setAttribute('aria-expanded', 'false'); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && doc.classList.contains('menu-open')) { doc.classList.remove('menu-open'); btn.setAttribute('aria-expanded', 'false'); btn.focus(); }
    });
  }

  // Scroll reveal, staggered within groups
  var items = [].slice.call(document.querySelectorAll('[data-reveal]'));
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    [].slice.call(group.querySelectorAll('[data-reveal]')).forEach(function (el, i) { el.style.setProperty('--d', (i * 0.09) + 's'); });
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }

  // Guide filters (guides index)
  var filters = document.querySelector('.filters');
  if (filters) {
    var cards = [].slice.call(document.querySelectorAll('.cards .card[data-cat]'));
    var empty = document.querySelector('.empty-note');
    var apply = function (cat) {
      var shown = 0;
      filters.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.cat === cat ? 'true' : 'false'); });
      cards.forEach(function (c) {
        var on = cat === 'all' || c.dataset.cat.split(' ').indexOf(cat) > -1;
        c.classList.toggle('hide', !on);
        if (on) { shown++; c.classList.add('in'); }
      });
      if (empty) {
        empty.classList.toggle('show', shown === 0);
        var label = filters.querySelector('button[data-cat="' + cat + '"]');
        var nameEl = empty.querySelector('[data-name]');
        if (nameEl && label) nameEl.textContent = label.textContent;
      }
    };
    filters.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      apply(b.dataset.cat);
      history.replaceState(null, '', b.dataset.cat === 'all' ? location.pathname : '#' + b.dataset.cat);
    });
    var fromHash = function () {
      var cat = (location.hash || '').replace('#', '');
      apply(filters.querySelector('button[data-cat="' + cat + '"]') ? cat : 'all');
    };
    window.addEventListener('hashchange', fromHash);
    fromHash();
  }

  // Table of contents highlight
  var tocLinks = [].slice.call(document.querySelectorAll('.toc a'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    tocLinks.forEach(function (a) { map[a.getAttribute('href').slice(1)] = a; });
    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { tocLinks.forEach(function (a) { a.classList.remove('active'); }); if (map[e.target.id]) map[e.target.id].classList.add('active'); }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    Object.keys(map).forEach(function (id) { var el = document.getElementById(id); if (el) tio.observe(el); });
  }
})();
