(function () {
  var S = window.SITE || {};

  /* ---------- tracking ---------- */
  if (S.metaPixelId) {
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', S.metaPixelId); fbq('track', 'PageView');
  }
  if (S.googleTagId) {
    var g = document.createElement('script'); g.async = true;
    g.src = 'https://www.googletagmanager.com/gtag/js?id=' + S.googleTagId;
    document.head.appendChild(g);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', S.googleTagId);
  }

  /* ---------- mobile menu ---------- */
  var mb = document.querySelector('.menu-btn'), nav = document.querySelector('nav.main');
  if (mb) mb.addEventListener('click', function () { nav.classList.toggle('open'); });
  if (nav) nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') nav.classList.remove('open'); });

  /* ---------- whatsapp links ---------- */
  function waLink(text) {
    return 'https://wa.me/' + S.whatsapp + '?text=' + encodeURIComponent(text);
  }
  var uniName = document.body.getAttribute('data-uni') || '';
  var defaultMsg = uniName
    ? 'Hi, I want free counselling for ' + uniName + '.'
    : 'Hi, I want free counselling for online degree admissions.';
  document.querySelectorAll('[data-wa]').forEach(function (a) {
    a.href = waLink(a.getAttribute('data-wa') || defaultMsg);
    a.target = '_blank'; a.rel = 'noopener';
    a.addEventListener('click', function () {
      if (window.fbq) fbq('track', 'Contact');
      if (window.gtag) gtag('event', 'whatsapp_click');
    });
  });
  document.querySelectorAll('[data-tel]').forEach(function (a) { a.href = 'tel:+' + S.whatsapp; });
  document.querySelectorAll('[data-mail]').forEach(function (a) { a.href = 'mailto:' + S.email; a.textContent = S.email; });
  document.querySelectorAll('[data-phone-text]').forEach(function (a) { a.textContent = S.phoneDisplay; });

  /* ---------- lead forms ---------- */
  document.querySelectorAll('form.lead-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var msg = form.querySelector('.form-msg');
      var d = {
        name: form.elements['name'].value.trim(),
        phone: form.elements['phone'].value.replace(/\D/g, '').slice(-10),
        email: form.elements['email'] ? form.elements['email'].value.trim() : '',
        program: form.elements['program'].value,
        university: form.elements['university'] ? form.elements['university'].value : uniName,
        page: location.pathname,
        source: new URLSearchParams(location.search).get('utm_source') || '',
        campaign: new URLSearchParams(location.search).get('utm_campaign') || '',
        time: new Date().toISOString()
      };
      if (form.elements['website'] && form.elements['website'].value) return;            // honeypot
      if (d.name.length < 2) return err('Please enter your full name.');
      if (!/^[6-9]\d{9}$/.test(d.phone)) return err('Please enter a valid 10-digit mobile number.');
      if (!d.program) return err('Please select a program.');
      function err(t) { msg.textContent = t; msg.style.display = 'block'; }
      msg.style.display = 'none';

      var btn = form.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Submitting…';

      function done() {
        if (window.fbq) fbq('track', 'Lead');
        if (window.gtag) {
          gtag('event', 'generate_lead');
          if (S.googleAdsConversion) gtag('event', 'conversion', { send_to: S.googleAdsConversion });
        }
        var u = '/thank-you.html?n=' + encodeURIComponent(d.name.split(' ')[0]);
        // if no sheet endpoint is set, open WhatsApp so the lead is never lost
        if (!S.formEndpoint) {
          var t = 'Hi, I am ' + d.name + '. I want free counselling for ' + d.program +
            (d.university ? ' (' + d.university + ')' : '') + '. My number: ' + d.phone;
          window.open(waLink(t), '_blank');
        }
        location.href = u;
      }

      if (S.formEndpoint) {
        fetch(S.formEndpoint, { method: 'POST', mode: 'no-cors', body: JSON.stringify(d) })
          .then(done).catch(done);
      } else { done(); }
    });
  });

  /* ---------- thank-you page name ---------- */
  var tn = document.getElementById('tname');
  if (tn) { var n = new URLSearchParams(location.search).get('n'); if (n) tn.textContent = ', ' + n; }
  if (document.body.hasAttribute('data-thanks')) {
    if (window.fbq) fbq('track', 'CompleteRegistration');
  }
})();
