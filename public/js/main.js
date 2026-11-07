(function () {
  'use strict';
  document.documentElement.classList.add('js');

  // ---------- Mobile navigation ----------
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    var label = toggle.querySelector('.sr-only');
    var setOpen = function (open) {
      nav.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (label) label.textContent = open ? 'Close menu' : 'Open menu';
    };
    toggle.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setOpen(false); toggle.focus(); }
    });
  }

  // ---------- Header shadow on scroll ----------
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---------- Back to top ----------
  var toTop = document.querySelector('.to-top');
  if (toTop) {
    var ring = toTop.querySelector('.to-top-ring circle');
    var ringLen = ring ? 2 * Math.PI * 24 : 0;
    if (ring) { ring.style.strokeDasharray = ringLen; ring.style.strokeDashoffset = ringLen; }
    var ticking = false;
    var updateTop = function () {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var y = window.scrollY || window.pageYOffset;
      toTop.classList.toggle('show', y > 500);
      if (ring && max > 0) ring.style.strokeDashoffset = ringLen * (1 - Math.min(y / max, 1));
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(updateTop); }
    }, { passive: true });
    window.addEventListener('resize', updateTop);
    updateTop();
    toTop.addEventListener('click', function (e) {
      e.preventDefault();
      var reduce = !document.documentElement.classList.contains('motion');
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
      // Move keyboard focus back to the top of the page as well
      var brand = document.querySelector('.brand');
      if (brand) brand.focus({ preventScroll: true });
      if (history.replaceState) history.replaceState(null, '', window.location.pathname + window.location.search);
    });
  }

  // ---------- Scroll reveal ----------
  // Elements fade up as they come into view. Anything already on screen when the
  // page loads is left alone, so nothing flickers. Disabled for reduced motion.
  (function () {
    var root = document.documentElement;
    if (!root.classList.contains('motion') || !('IntersectionObserver' in window)) return;

    var groups = ['.card-grid', '.service-grid', '.process', '.reasons', '.footer-grid'];
    var singles = ['.team-member', '.section-head', '.section-head-row', '.clients-inner', '.feature', '.panel', '.two-col > *',
      '.credentials > *', '.cta-inner', '.next-steps', '.prose'];
    var skip = '.hero, .page-hero';
    var viewH = window.innerHeight || document.documentElement.clientHeight;
    var targets = [];

    function belowFold(el) { return el.getBoundingClientRect().top > viewH * 0.92; }

    function tag(el, delay) {
      if (el.closest(skip) || el.classList.contains('reveal') || el.closest('.reveal') || el.querySelector('.reveal')) return;
      if (!belowFold(el)) return;
      el.classList.add('reveal');
      if (delay) el.style.setProperty('--reveal-delay', delay + 's');
      targets.push(el);
    }

    groups.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (parent) {
        Array.prototype.forEach.call(parent.children, function (child, i) {
          tag(child, Math.min(i, 5) * 0.08);
        });
      });
    });
    singles.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el, i) {
        // Side-by-side columns: let the second one follow slightly after the first
        var idx = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
        tag(el, /> \*$/.test(sel) ? Math.min(idx, 2) * 0.12 : 0);
      });
    });

    function cleanup(el) {
      // Once the entrance has played, hand the element back to its normal styles (e.g. hover effects)
      el.classList.remove('reveal', 'is-visible');
      el.style.removeProperty('--reveal-delay');
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        el.classList.add('is-visible');
        var delay = parseFloat(el.style.getPropertyValue('--reveal-delay')) || 0;
        setTimeout(function () { cleanup(el); }, (delay + 1.2) * 1000);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    targets.forEach(function (el) { io.observe(el); });

    // Safety net: never leave content hidden (e.g. very tall elements, print, odd browsers)
    window.addEventListener('beforeprint', function () { targets.forEach(cleanup); });
    setTimeout(function () {
      targets.forEach(function (el) {
        if (el.classList.contains('reveal') && !el.classList.contains('is-visible') && el.getBoundingClientRect().top < viewH) {
          el.classList.add('is-visible');
        }
      });
    }, 4000);
  })();

  // ---------- Enquiry form ----------
  var form = document.getElementById('enquiry');
  if (!form) return;

  var status = form.querySelector('.form-status');
  var button = form.querySelector('button[type="submit"]');
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var PHONE_RE = /^[0-9+()\-.\s]{6,40}$/;

  var rules = {
    name: function (v) { return v ? '' : 'Please enter your full name.'; },
    email: function (v) { return !v ? 'Please enter your email address.' : EMAIL_RE.test(v) ? '' : 'Please enter a valid email address.'; },
    phone: function (v) { return !v || PHONE_RE.test(v) ? '' : 'Please enter a valid phone number.'; },
    service: function (v) { return v ? '' : 'Please choose what you need help with.'; },
    message: function (v) { return v ? '' : 'Please tell us a little about what you need.'; }
  };

  function setFieldError(name, msg) {
    var el = form.elements[name];
    var err = document.getElementById('f-' + name + '-err');
    if (!el) return;
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) {
      err.textContent = msg || '';
      if (msg) el.setAttribute('aria-describedby', err.id); else el.removeAttribute('aria-describedby');
    }
  }

  function validateField(name) {
    var msg = rules[name](String(form.elements[name].value || '').trim());
    setFieldError(name, msg);
    return msg;
  }

  function setStatus(msg, kind) {
    status.textContent = msg || '';
    status.className = 'form-status' + (kind ? ' ' + kind : '');
  }

  // Re-validate a field once the user has interacted with it
  Object.keys(rules).forEach(function (name) {
    var el = form.elements[name];
    if (!el) return;
    el.addEventListener('blur', function () { if (el.value) validateField(name); });
    el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') validateField(name); });
    el.addEventListener('change', function () { if (el.getAttribute('aria-invalid') === 'true') validateField(name); });
  });

  // If we arrived back from a no-JS submission, bring the message into view
  if (status.textContent.trim()) status.focus();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      if (validateField(name) && !firstInvalid) firstInvalid = form.elements[name];
    });
    if (firstInvalid) {
      setStatus('Please check the highlighted fields.', 'err');
      firstInvalid.focus();
      return;
    }

    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });

    button.disabled = true;
    var original = button.textContent;
    button.textContent = 'Sending…';
    setStatus('');

    fetch('/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (res) {
        if (res.ok) {
          form.reset();
          Object.keys(rules).forEach(function (n) { setFieldError(n, ''); });
          setStatus('Thank you, your enquiry has been sent. We’ll be in touch shortly.', 'ok');
        } else {
          if (res.errors) Object.keys(res.errors).forEach(function (n) { setFieldError(n, res.errors[n]); });
          setStatus(res.error || 'Sorry, we couldn’t send your enquiry. Please email info@thebridgeconsults.com.', 'err');
        }
        status.focus();
      })
      .catch(function () {
        setStatus('Sorry, we couldn’t send your enquiry. Please check your connection or email info@thebridgeconsults.com.', 'err');
      })
      .then(function () {
        button.disabled = false;
        button.textContent = original;
      });
  });
})();
