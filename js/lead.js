/**
 * OnlineAdmissions – Lead form handler
 * Upload to /js/lead.js and load it AFTER main.js on every page:
 *   <script src="/js/main.js"></script>
 *   <script src="/js/lead.js"></script>
 */
(function () {
  'use strict';

  // ====== CHANGE THIS: your Google Apps Script Web App URL (ends with /exec) ======
  var ENDPOINT = 'https://script.google.com/macros/s/AKfycbyfuYYj-fYGA0kHOhSIXoxOeKp0b6Fr1BspYiVOhT7T46GdsA1qF9-Kw7oSLj4bMbFP/exec';
  // =================================================================================

  var pageLoadedAt = Date.now();

  function showMsg(form, text, ok) {
    var box = form.querySelector('.form-msg');
    if (!box) return;
    box.textContent = text;
    box.style.display = 'block';
    box.style.color = ok ? '#15803d' : '#b91c1c';
  }

  function normalizePhone(raw) {
    var n = String(raw || '').replace(/[\s\-().]/g, '');
    n = n.replace(/^(\+91|0091|91|0)(?=\d{10}$)/, '');
    return n;
  }

  // Capture phase on document: runs before any other submit handler,
  // so the lead is sent only once and never by the old handler.
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || !form.classList || !form.classList.contains('lead-form')) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    var f = form.elements;
    var name = (f['name'] ? f['name'].value : '').trim();
    var phone = normalizePhone(f['phone'] ? f['phone'].value : '');
    var email = (f['email'] ? f['email'].value : '').trim();
    var program = f['program'] ? f['program'].value : '';
    var university = f['university'] ? f['university'].value : '';
    var trap = f['website'] ? f['website'].value : '';

    // Validation
    if (name.length < 2) return showMsg(form, 'Please enter your full name.', false);
    if (!/^[6-9]\d{9}$/.test(phone)) return showMsg(form, 'Please enter a valid 10-digit mobile number.', false);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showMsg(form, 'Please enter a valid email or leave it blank.', false);
    if (!program) return showMsg(form, 'Please select the program you are interested in.', false);

    // Spam protection: filled honeypot or form submitted in under 3 seconds = bot
    if (trap || Date.now() - pageLoadedAt < 3000) {
      form.reset();
      return showMsg(form, 'Thank you! Our counsellor will contact you shortly.', true);
    }

    // Prevent double submit
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
    data.append('page', location.pathname);
    data.append('website', '');

    fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: data })
      .then(function () {
        form.reset();
        showMsg(form, 'Thank you! Our counsellor will contact you shortly.', true);
        // Optional tracking hooks (only fire if you use them)
        if (window.gtag) window.gtag('event', 'generate_lead', { program: program, university: university });
        if (window.fbq) window.fbq('track', 'Lead');
      })
      .catch(function () {
        showMsg(form, 'Something went wrong. Please call or WhatsApp us on +91 93155 94429.', false);
      })
      .finally(function () {
        if (btn) { btn.disabled = false; btn.textContent = oldText; }
      });
  }, true);
})();
