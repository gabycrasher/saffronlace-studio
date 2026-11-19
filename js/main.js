/* Saffronlace Studio: service menu with a live visit total, style finder, draggable lookbook,
   chair booking and a gift card designer. Nothing is ever sent or paid (concept site). */
(function () {
  'use strict';
  var gsap = window.gsap, ST = window.ScrollTrigger;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (gsap && ST) gsap.registerPlugin(ST);
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var ugx = function (n) { return 'UGX ' + Math.round(n).toLocaleString('en-US'); };
  // Requests go to WhatsApp with the details pre-filled (opened from the click, so pop-up blockers allow it).
  var WA_NUMBER = '256756728345';
  function whatsapp(lines) {
    var url = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(lines.filter(function (l) { return l !== null && l !== undefined; }).join('\n'));
    var a = document.createElement('a'); a.href = url; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    return url;
  }
  var safe = function (t) { return String(t).replace(/[<>&"]/g, ''); };
  var fallback = function (url) { return ' <a href="' + url + '" target="_blank" rel="noopener">Didn\'t open? Tap here.</a>'; };
  var mins = function (m) { var h = Math.floor(m / 60), r = m % 60; return (h ? h + ' h ' : '') + (r ? r + ' min' : (h ? '' : '0 min')); };

  /* ---------- Header + menu ---------- */
  var header = $('[data-header]');
  var onScroll = function () { header.classList.toggle('is-solid', window.scrollY > 30); };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  var menuBtn = $('[data-menu-btn]'), menu = $('[data-mobile-menu]');
  function setMenu(open) { menuBtn.setAttribute('aria-expanded', String(open)); menu.hidden = !open; document.body.style.overflow = open ? 'hidden' : ''; }
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });

  /* ---------- Hero reveal ---------- */
  function revealHero() { $$('.hero .reveal').forEach(function (el, i) { setTimeout(function () { el.classList.add('is-in'); }, 90 * i); }); }
  if (window.__openingDone) revealHero(); else { window.addEventListener('opening:reveal', revealHero, { once: true }); window.addEventListener('opening:done', revealHero, { once: true }); }
  if (gsap && ST && !reduce) {
    gsap.to('[data-hero-media] img', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    $$('.studio figure').forEach(function (f, i) { gsap.from(f, { y: 60 + i * 20, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: f, start: 'top 88%' } }); });
  }

  /* Kampala time (UTC+3) for "next chair" and "open now" */
  var now = new Date(Date.now() + (new Date().getTimezoneOffset() + 180) * 60000);
  var hours = { 0: [11, 18], 1: [8, 20], 2: [8, 20], 3: [8, 20], 4: [8, 20], 5: [8, 20], 6: [7, 21] };
  var today = hours[now.getDay()], hr = now.getHours() + now.getMinutes() / 60;
  var openNow = hr >= today[0] && hr < today[1];
  $('[data-open-now]').textContent = (openNow ? '● Open now · until ' + (today[1] > 12 ? today[1] - 12 + ' pm' : today[1] + ' am') : '● Closed now · opens ' + (hours[(now.getDay() + (hr >= today[1] ? 1 : 0)) % 7][0]) + ' am') + ' (Kampala time)';
  var nextSlot = Math.max(Math.ceil((hr + 1) * 2) / 2, today[0] + 1);
  var nextChair = $('[data-next-chair]');
  if (openNow && nextSlot < today[1] - 1) {
    var h12 = Math.floor(nextSlot) > 12 ? Math.floor(nextSlot) - 12 : Math.floor(nextSlot);
    nextChair.textContent = 'Today, ' + h12 + ':' + (nextSlot % 1 ? '30' : '00') + (nextSlot >= 12 ? ' pm' : ' am');
  } else nextChair.textContent = 'Tomorrow, ' + hours[(now.getDay() + 1) % 7][0] + ':00 am';

  /* ---------- Service menu + visit builder ---------- */
  var menuData = {
    'Hair': [['Silk press', 90, 120000, 'Wash, treatment, blow-out and press'], ['Wash & go', 60, 70000, 'Define and diffuse your natural pattern'], ['Twist out', 120, 110000, 'Two-strand set for a soft, defined finish'], ['Colour refresh', 150, 260000, 'Gloss or semi-permanent tone'], ['Trim & shape', 45, 60000, 'Dry cut to keep ends healthy']],
    'Braids & locs': [['Knotless braids, medium', 270, 280000, 'Mid-back length, hair included'], ['Cornrows & beads', 120, 120000, 'Up to 10 rows, beads included'], ['Loc retwist', 120, 140000, 'Wash, retwist and style'], ['Starter locs', 210, 250000, 'Comb coils or two-strand twists']],
    'Nails': [['Gel manicure', 60, 70000, 'Shape, cuticle care and gel colour'], ['Builder gel', 90, 110000, 'Strength overlay with a milky finish'], ['Spa pedicure', 75, 90000, 'Soak, scrub, massage and polish'], ['Nail art (per set)', 30, 30000, 'Hand-painted detail on any set']],
    'Skin': [['Glow facial', 60, 150000, 'Cleanse, enzyme peel, mask and massage'], ['Scalp ritual', 45, 80000, 'Exfoliation, oil and steam for the scalp'], ['Brow shape & tint', 30, 45000, 'Thread, shape and tint']]
  };
  var tabs = $('[data-tabs]'), list = $('[data-services]'), picked = [];
  var cats = Object.keys(menuData);
  tabs.innerHTML = cats.map(function (c, i) { return '<button type="button" class="tab" role="tab" aria-selected="' + (i === 0) + '" data-cat="' + c + '">' + c + '</button>'; }).join('');
  function renderCat(cat) {
    $$('.tab', tabs).forEach(function (t) { t.setAttribute('aria-selected', String(t.dataset.cat === cat)); });
    list.innerHTML = menuData[cat].map(function (s) {
      var on = picked.some(function (p) { return p[0] === s[0]; });
      return '<li><button type="button" class="svc" aria-pressed="' + on + '" data-svc="' + s[0] + '"><strong>' + s[0] + '</strong><small>' + mins(s[1]) + ' · ' + s[3] + '</small><span class="price">' + ugx(s[2]).replace('UGX ', '') + '<span class="add" aria-hidden="true">+</span></span></button></li>';
    }).join('');
    if (gsap && !reduce) gsap.from($$('.svc', list), { x: -14, opacity: 0, duration: .45, stagger: .05, ease: 'power2.out' });
  }
  function find(name) { var hit = null; cats.forEach(function (c) { menuData[c].forEach(function (s) { if (s[0] === name) hit = s; }); }); return hit; }
  function renderVisit() {
    var vl = $('[data-visit-list]');
    vl.innerHTML = picked.length ? picked.map(function (s) { return '<li><span>' + s[0] + '</span><span>' + ugx(s[2]).replace('UGX ', '') + '</span></li>'; }).join('') : '<li class="visit-empty">Nothing added yet.</li>';
    var t = picked.reduce(function (a, s) { return a + s[1]; }, 0), p = picked.reduce(function (a, s) { return a + s[2]; }, 0);
    $('[data-visit-time]').textContent = mins(t);
    $('[data-visit-price]').textContent = ugx(p);
    $('[data-book-services]').innerHTML = picked.length ? picked.map(function (s) { return '<b>' + s[0] + '</b>'; }).join(', ') + ' · about ' + mins(t) + ' · ' + ugx(p) : 'Add services from the menu above, or we\'ll plan it together at the chair.';
  }
  tabs.addEventListener('click', function (e) { var t = e.target.closest('.tab'); if (t) renderCat(t.dataset.cat); });
  list.addEventListener('click', function (e) {
    var b = e.target.closest('.svc'); if (!b) return;
    var s = find(b.dataset.svc), i = picked.findIndex(function (p) { return p[0] === s[0]; });
    if (i >= 0) picked.splice(i, 1); else picked.push(s);
    b.setAttribute('aria-pressed', String(i < 0));
    renderVisit();
    if (gsap && !reduce && i < 0) gsap.fromTo('[data-visit-price]', { scale: 1.25 }, { scale: 1, duration: .5, ease: 'back.out(3)' });
  });
  renderCat(cats[0]);
  renderVisit();

  /* ---------- Style finder ---------- */
  var finder = $('[data-finder]'), result = $('[data-finder-result]');
  var recipes = {
    protect: { months: 'Knotless braids, medium', weeks: 'Cornrows & beads', days: 'Scalp ritual' },
    event: { months: 'Knotless braids, medium', weeks: 'Silk press', days: 'Twist out' },
    everyday: { months: 'Starter locs', weeks: 'Twist out', days: 'Wash & go' }
  };
  finder.addEventListener('submit', function (e) {
    e.preventDefault();
    var hair = finder.hair.value, last = finder.last.value, use = finder.for.value;
    if (!hair || !last || !use) { result.innerHTML = '<p>Choose one answer in each of the three rows.</p>'; return; }
    var pick = hair === 'locs' ? (last === 'days' ? 'Scalp ritual' : 'Loc retwist') : hair === 'relaxed' && use !== 'protect' ? 'Silk press' : recipes[use][last];
    var s = find(pick);
    result.innerHTML = '<div><p class="eyebrow">We\'d suggest</p><h3>' + s[0] + '</h3><p>' + s[3] + '. Lasts ' + ({ days: 'a few days', weeks: 'two to three weeks', months: 'six weeks or more' })[last] + ' with the aftercare we show you at the chair.</p><div class="meta"><span>' + mins(s[1]) + '</span><span>' + ugx(s[2]) + '</span></div></div><div class="finder-actions"><button class="btn" type="button" data-add-suggest="' + s[0] + '">Add to my visit</button><button class="btn btn-wa" type="button" data-ask-finder="' + s[0] + '">Ask a stylist on WhatsApp</button></div>';
    if (gsap && !reduce) gsap.from(result, { y: 16, opacity: 0, duration: .5, ease: 'power3.out' });
  });
  result.addEventListener('click', function (e) {
    var ask = e.target.closest('[data-ask-finder]');
    if (ask) {
      var label = function (n) { var r = $('input[name=' + n + ']:checked', finder); return r ? r.nextElementSibling.textContent : ''; };
      var sg = find(ask.dataset.askFinder);
      whatsapp(['Hello Saffronlace, the style finder suggested ' + sg[0] + ' (' + mins(sg[1]) + ', ' + ugx(sg[2]) + ') for me.', 'My hair today: ' + label('hair'), 'Should last: ' + label('last'), 'For: ' + label('for'), '', 'Is this the right choice for my hair?']);
      ask.textContent = 'WhatsApp opened ✓';
      return;
    }
    var b = e.target.closest('[data-add-suggest]'); if (!b) return;
    var s = find(b.dataset.addSuggest);
    if (!picked.some(function (p) { return p[0] === s[0]; })) picked.push(s);
    renderVisit();
    var cat = cats.filter(function (c) { return menuData[c].indexOf(s) >= 0; })[0];
    renderCat(cat);
    b.textContent = 'Added ✓';
  });

  /* ---------- Lookbook: drag to scroll ---------- */
  var look = $('[data-look]'), down = false, startX = 0, startL = 0, moved = false;
  look.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; moved = false; startX = e.clientX; startL = look.scrollLeft; look.classList.add('is-dragging'); });
  window.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - startX; if (Math.abs(dx) > 4) moved = true; look.scrollLeft = startL - dx; });
  window.addEventListener('pointerup', function () { if (!down) return; down = false; look.classList.remove('is-dragging'); });
  look.addEventListener('click', function (e) { if (moved) e.preventDefault(); }, true);
  look.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') look.scrollBy({ left: 300, behavior: 'smooth' }); if (e.key === 'ArrowLeft') look.scrollBy({ left: -300, behavior: 'smooth' }); });

  /* ---------- Booking ---------- */
  var book = $('[data-book]'), daysEl = $('[data-days]'), timesEl = $('[data-times]'), note = $('[data-book-note]');
  var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var days = [];
  for (var d = 0; d < 7; d++) { var dt = new Date(now); dt.setDate(now.getDate() + d); days.push(dt); }
  daysEl.innerHTML = days.map(function (dt, i) { return '<label class="day"><input type="radio" name="day" value="' + i + '"' + (i === 0 ? ' checked' : '') + '><span><small>' + (i === 0 ? 'Today' : dayNames[dt.getDay()]) + '</small><b>' + dt.getDate() + '</b></span></label>'; }).join('');
  function renderTimes() {
    var i = +book.day.value, dt = days[i], h = hours[dt.getDay()], html = '';
    for (var t = h[0]; t < h[1] - 1; t += 1.5) {
      var label = (Math.floor(t) > 12 ? Math.floor(t) - 12 : Math.floor(t)) + ':' + (t % 1 ? '30' : '00') + (t >= 12 ? ' pm' : ' am');
      var past = i === 0 && t <= hr + .5;
      var taken = ((dt.getDate() * 7 + t * 3) % 5) < 1.2; // a few slots look booked
      html += '<label class="time"><input type="radio" name="time" value="' + label + '"' + (past || taken ? ' disabled' : '') + '><span>' + label + '</span></label>';
    }
    timesEl.innerHTML = html || '<p class="book-services">No times left today. Choose another day.</p>';
    var first = $('input:not(:disabled)', timesEl); if (first) first.checked = true;
  }
  daysEl.addEventListener('change', renderTimes);
  renderTimes();
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pick-stylist]'); if (!b) return;
    var r = $('input[name=stylist][value="' + b.dataset.pickStylist + '"]'); if (r) r.checked = true;
    $('#book').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });
  book.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    ['name', 'phone'].forEach(function (n) { var good = book[n].value.trim().length > 2; book[n].setAttribute('aria-invalid', String(!good)); ok = ok && good; });
    var time = $('input[name=time]:checked', timesEl);
    note.classList.toggle('is-error', !ok || !time);
    if (!ok) { note.textContent = 'Please add your name and phone number.'; book.name.focus(); return; }
    if (!time) { note.textContent = 'Please choose a time.'; return; }
    var day = days[+book.day.value];
    var tMin = picked.reduce(function (a, s) { return a + s[1]; }, 0), tPrice = picked.reduce(function (a, s) { return a + s[2]; }, 0);
    var when = dayNames[day.getDay()] + ' ' + day.getDate() + ' ' + day.toLocaleString('en', { month: 'long' }) + ', ' + time.value;
    var url = whatsapp(['Hello Saffronlace, I would like to book a chair.',
      'Services: ' + (picked.length ? picked.map(function (p) { return p[0]; }).join(', ') + ' (about ' + mins(tMin) + ', ' + ugx(tPrice) + ')' : 'not sure yet, please advise'),
      'Stylist: ' + book.stylist.value, 'When: ' + when, 'Name: ' + book.name.value.trim(), 'Phone: ' + book.phone.value.trim()]);
    note.innerHTML = 'Thank you, ' + safe(book.name.value.trim().split(' ')[0]) + '. WhatsApp has opened with your booking for ' + safe(when) + ' with ' + safe(book.stylist.value) + '. Just press send.' + fallback(url);
  });

  /* ---------- Gift card ---------- */
  var gift = $('[data-gift]'), card = $('[data-gift-card]');
  var code = String(1000 + Math.floor(Math.random() * 9000));
  $('[data-gc-code]').textContent = code;
  function giftUpdate() {
    var to = gift.to.value.trim() || 'someone special', from = gift.from.value.trim() || 'a friend';
    $('[data-gc-to]').textContent = to; $('[data-gc-to2]').textContent = to; $('[data-gc-from]').textContent = from;
    $('[data-gc-amount]').textContent = ugx(+gift.amount.value).replace('UGX ', 'UGX ');
    card.className = 'gift-card theme-' + gift.theme.value + (card.classList.contains('is-flipped') ? ' is-flipped' : '');
  }
  gift.addEventListener('input', giftUpdate);
  gift.addEventListener('change', giftUpdate);
  var flipBtn = $('[data-flip]', gift), giftNote = $('[data-gift-note]');
  flipBtn.addEventListener('click', function () {
    card.style.transform = '';
    card.classList.toggle('is-flipped');
    flipBtn.textContent = card.classList.contains('is-flipped') ? 'Show the front' : 'Preview the back';
  });
  gift.addEventListener('submit', function (e) {
    e.preventDefault();
    var to = gift.to.value.trim(), from = gift.from.value.trim();
    var url = whatsapp(['Hello Saffronlace, I would like to buy a gift card.', 'Amount: ' + ugx(+gift.amount.value), 'For: ' + (to || '(name to follow)'), 'From: ' + (from || '(name to follow)'), 'Card design: ' + gift.theme.value.charAt(0).toUpperCase() + gift.theme.value.slice(1), 'Preview code: SL-' + code]);
    giftNote.innerHTML = 'WhatsApp has opened with your gift card request. Just press send.' + fallback(url);
  });
  card.addEventListener('click', function () { card.style.transform = ''; card.classList.toggle('is-flipped'); });
  giftUpdate();
  if (!reduce) {
    card.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      card.style.transform = (card.classList.contains('is-flipped') ? 'rotateY(180deg) ' : '') + 'rotateX(' + (-y * 10) + 'deg) rotateY(' + (x * 12) + 'deg)';
    });
    card.addEventListener('pointerleave', function () { card.style.transform = ''; });
  }
})();
