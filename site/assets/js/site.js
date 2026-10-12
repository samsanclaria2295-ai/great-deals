// Great Finds: small progressive enhancements. No tracking, no cookies, no storage.
(function () {
  var doc = document.documentElement;
  doc.classList.remove('no-js');

  var y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();

  // Header shadow on scroll
  var header = document.querySelector('.site-header');
  var onScroll = function () { if (header) header.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Dropdown (mega) menus: hover on pointer devices, chevron button for click/keyboard/touch
  var items = [].slice.call(document.querySelectorAll('.nav-item.has-mega'));
  var closeTimer = null;
  var setOpen = function (item, open) {
    items.forEach(function (it) {
      var on = open && it === item;
      it.classList.toggle('open', on);
      if (!on) delete it.dataset.via;
      var b = it.querySelector('.nav-chev');
      if (b) b.setAttribute('aria-expanded', on ? 'true' : 'false');
    });
    if (header) header.classList.toggle('mega-open', !!open);
  };
  var canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  items.forEach(function (item) {
    var chev = item.querySelector('.nav-chev');
    if (canHover) {
      item.addEventListener('mouseenter', function () {
        clearTimeout(closeTimer);
        if (!item.classList.contains('open')) { item.dataset.via = 'hover'; setOpen(item, true); }
      });
      item.addEventListener('mouseleave', function () {
        if (item.dataset.via === 'click') return;
        closeTimer = setTimeout(function () { setOpen(item, false); }, 160);
      });
    }
    if (chev) chev.addEventListener('click', function (e) {
      e.preventDefault();
      clearTimeout(closeTimer);
      var isOpen = item.classList.contains('open');
      // A click right after a hover-open pins the menu open instead of closing it.
      if (isOpen && item.dataset.via === 'hover') { item.dataset.via = 'click'; }
      else { item.dataset.via = 'click'; setOpen(item, !isOpen); }
      if (item.classList.contains('open')) { var first = item.querySelector('.mega a'); if (first) first.focus(); }
    });
    item.addEventListener('focusout', function (e) { if (!item.contains(e.relatedTarget)) setOpen(item, false); });
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.nav-item.has-mega')) setOpen(null, false); });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var open = document.querySelector('.nav-item.open');
    if (open) { setOpen(null, false); var b = open.querySelector('.nav-chev'); if (b) b.focus(); }
    if (doc.classList.contains('menu-open')) toggleMenu(false);
  });

  // Mobile menu
  var btn = document.querySelector('.menu-btn');
  var toggleMenu = function (open) {
    doc.classList.toggle('menu-open', open);
    if (btn) { btn.setAttribute('aria-expanded', open ? 'true' : 'false'); btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); }
  };
  if (btn) {
    btn.addEventListener('click', function () { toggleMenu(!doc.classList.contains('menu-open')); });
    document.querySelectorAll('.mobile-menu a').forEach(function (a) { a.addEventListener('click', function () { toggleMenu(false); }); });
  }

  // Scroll reveal, staggered within groups
  var reveal = [].slice.call(document.querySelectorAll('[data-reveal]'));
  document.querySelectorAll('[data-stagger]').forEach(function (group) {
    [].slice.call(group.querySelectorAll('[data-reveal]')).forEach(function (el, i) { el.style.setProperty('--d', Math.min(i * 0.08, 0.4) + 's'); });
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    reveal.forEach(function (el) { io.observe(el); });
  } else {
    reveal.forEach(function (el) { el.classList.add('in'); });
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
