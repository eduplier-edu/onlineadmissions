(function () {
  'use strict';

  // ====== CHANGE THIS: your Google Apps Script Web App URL (ends with /exec) ======
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbyfuYYj-fYGA0kHOhSIXoxOeKp0b6Fr1BspYiVOhT7T46GdsA1qF9-Kw7oSLj4bMbFP/exec';
  // =================================================================================

  var pageLoadedAt = Date.now();
  // UTM capture: URL se padho aur session me save karo
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'];
  (function () {
    var params = new URLSearchParams(window.location.search);
    UTM_KEYS.forEach(function (k) {
      var v = params.get(k);
      if (v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
    });
  })();

  function getUtm(k) {
    try { return sessionStorage.getItem(k) || ''; } catch (e) { return ''; }
  }
  var UNIVERSITY_BY_PATH = {
    '/amity-university-online/': 'Amity University Online',
    '/lpu-online/': 'LPU Online',
    '/chandigarh-university-online/': 'Chandigarh University Online',
    '/online-manipal/': 'Online Manipal',
    '/gla-university-online/': 'GLA University',
    '/shoolini-university-online/': 'Shoolini University'
  };

  function field(form, names) {
    for (var i = 0; i < names.length; i++) {
      var el = form.elements[names[i]];
      if (el && typeof el.value === 'string') return el.value;
    }
    return '';
  }

  function normalizePhone(raw) {
    var n = String(raw || '').replace(/[\s\-().]/g, '');
    return n.replace(/^(\+91|0091|91|0)(?=\d{10}$)/, '');
  }

  function cleanPath() {
    var p = location.pathname.replace(/index\.html$/, '');
    if (p.charAt(p.length - 1) !== '/') p += '/';
    return p;
  }

  function getMsgBox(form) {
    var box = form.querySelector('.form-msg');
    if (!box) {
      box = document.createElement('div');
      box.className = 'form-msg';
      box.setAttribute('role', 'alert');
      box.style.cssText = 'margin-top:8px;font-size:.9rem;font-weight:600;text-align:center';
      form.appendChild(box);
    }
    return box;
  }

  function showMsg(form, text, ok) {
    var box = getMsgBox(form);
    box.textContent = text;
    box.style.display = 'block';
    box.style.color = ok ? '#15803d' : '#b91c1c';
  }

  // Capture phase on document: runs before the page's own handlers,
  // so the old "open WhatsApp" code is skipped and leads go to Gmail only.
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || form.tagName !== 'FORM') return;
    if (!form.elements['phone'] && !form.elements['mobile']) return; // not a lead form

    e.preventDefault();
    e.stopImmediatePropagation();

    var name = field(form, ['name']).trim();
    var phone = normalizePhone(field(form, ['phone', 'mobile']));
    var email = field(form, ['email']).trim();
    var program = field(form, ['program']);
    var path = cleanPath();
    var university = field(form, ['university']) || UNIVERSITY_BY_PATH[path] || '';
    var trap = field(form, ['website']);

    if (name.length < 2) return showMsg(form, 'Please enter your full name.', false);
    if (!/^[6-9]\d{9}$/.test(phone)) return showMsg(form, 'Please enter a valid 10-digit mobile number.', false);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showMsg(form, 'Please enter a valid email or leave it blank.', false);
    if (!program) return showMsg(form, 'Please select the program you are interested in.', false);

    // Bots: filled hidden field or submitted within 3 seconds of page load
    if (trap || Date.now() - pageLoadedAt < 3000) {
      form.reset();
      return showMsg(form, 'Thank you! Our counsellor will contact you shortly.', true);
    }

    var btn = form.querySelector('button[type="submit"]');
    if (btn && btn.disabled) return;
    var oldText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Submitting...'; }

    var data = new URLSearchParams();
    data.append('name', name);
    data.append('phone', phone);
    data.append('email', email);
    data.append('program', program);
    data.append('university', university);
    data.append('page', path);
        UTM_KEYS.forEach(function (k) { data.append(k, getUtm(k)); });
    data.append('website', '');

    fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: data })
      .then(function () {
        form.reset();
        showMsg(form, 'Thank you! Our counsellor will contact you shortly.', true);
        if (window.gtag) window.gtag('event', 'generate_lead', { program: program, university: university });
        if (window.fbq) window.fbq('track', 'Lead');
        // If the form is inside a popup, close it after a moment
        var modal = form.closest('.modal');
        if (modal) {
          var closeBtn = modal.querySelector('.modal-x');
          if (closeBtn) setTimeout(function () { closeBtn.click(); }, 1800);
        }
      })
      .catch(function () {
        showMsg(form, 'Something went wrong. Please call or WhatsApp us on +91 93155 94429.', false);
      })
      .finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = oldText; }
      });
  }, true);
})();
