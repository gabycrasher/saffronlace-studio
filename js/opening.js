/* Saffronlace signature opening: strands of hair fall down the screen and sway, a saffron comb
   glints across them, then the hair parts down the middle, like a comb drawing a parting, to reveal
   the studio. About 3 seconds, once per visit, skippable; skipped for reduced motion. */
(function () {
  'use strict';
  var root = document.documentElement;
  var overlay = document.querySelector('[data-opening]');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var seen = false;
  try { seen = sessionStorage.getItem('sl-opening') === '1'; } catch (e) { /* storage blocked */ }

  function done() {
    root.classList.remove('opening-on');
    if (overlay) overlay.remove();
    window.__openingDone = true;
    window.dispatchEvent(new Event('opening:done'));
  }
  if (!overlay || reduce || seen || !window.gsap) { done(); return; }
  try { sessionStorage.setItem('sl-opening', '1'); } catch (e) { /* ignore */ }

  overlay.hidden = false;
  root.classList.add('opening-on');
  var gsap = window.gsap;
  var NS = 'http://www.w3.org/2000/svg';
  var W = window.innerWidth, H = window.innerHeight;
  var svg = overlay.querySelector('[data-op-strands]');
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

  // Strand colours: mostly deep browns and blacks, with a few saffron highlights.
  var colours = ['#120a0c', '#1d1013', '#2b1a17', '#3a2219', '#4a2c1c', '#1a0f12', '#e0a33a', '#f2c66d'];
  var count = Math.round(Math.min(90, Math.max(46, W / 16)));
  var strands = [];
  for (var i = 0; i < count; i++) {
    var x = (i + .5) / count * W + (Math.random() - .5) * 10;
    var highlight = Math.random() < .14;
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('stroke', highlight ? colours[6 + (i % 2)] : colours[i % 6]);
    p.setAttribute('stroke-width', (highlight ? 1.6 : 2.4 + Math.random() * 3.6).toFixed(1));
    p.setAttribute('opacity', highlight ? .9 : (.75 + Math.random() * .25).toFixed(2));
    svg.appendChild(p);
    strands.push({ el: p, x: x, amp: 10 + Math.random() * 22, freq: 1.2 + Math.random() * 1.2, ph: Math.random() * 6.28, side: x < W / 2 ? -1 : 1, dist: Math.abs(x - W / 2) / (W / 2) });
  }

  var state = { t: 0, part: 0 };
  function shape(s) {
    // Each strand is a wavy vertical line; while parting, strands near the middle bend outwards the most.
    var push = state.part * (1 - s.dist * .55) * (W * .62) * s.side;
    var d = '', steps = 14;
    for (var k = 0; k <= steps; k++) {
      var v = k / steps, y = -20 + v * (H + 40);
      var sway = Math.sin(v * Math.PI * s.freq + s.ph + state.t) * s.amp * (0.35 + v);
      var bend = push * Math.pow(v, .55);
      d += (k ? 'L' : 'M') + (s.x + sway + bend).toFixed(1) + ' ' + y.toFixed(1);
    }
    s.el.setAttribute('d', d);
  }
  function draw() { for (var i = 0; i < strands.length; i++) shape(strands[i]); }
  draw();
  strands.forEach(function (s) { var L = s.el.getTotalLength(); s.el.style.strokeDasharray = L; s.el.style.strokeDashoffset = L; });

  var brand = overlay.querySelector('[data-op-brand]');
  var comb = overlay.querySelector('[data-op-comb]');
  var tl = gsap.timeline({ onUpdate: draw, onComplete: done });
  tl.to(strands.map(function (s) { return s.el; }), { strokeDashoffset: 0, duration: .9, ease: 'power2.out', stagger: { each: .006, from: 'random' } })
    .to(state, { t: 2.4, duration: 2.1, ease: 'sine.inOut' }, 0)
    .to(comb, { opacity: 1, left: '108%', duration: .75, ease: 'power2.inOut' }, .75)
    .to(brand, { opacity: 1, scale: 1, duration: .6, ease: 'power3.out' }, 1.05)
    // Once drawn, drop the dash pattern so strands stay whole as they bend and lengthen.
    .call(function () { strands.forEach(function (s) { s.el.style.strokeDasharray = 'none'; }); }, null, 1.5)
    .addLabel('part', 1.75)
    .to(state, { part: 1, duration: .95, ease: 'expo.inOut' }, 'part')
    .to(brand, { opacity: 0, scale: 1.06, duration: .5, ease: 'power2.in' }, 'part+=.2')
    .to(overlay, { backgroundColor: 'rgba(42, 26, 31, 0)', duration: .6, ease: 'power2.out' }, 'part+=.2')
    .to(svg, { opacity: 0, duration: .35 }, 'part+=.7')
    .call(function () { window.dispatchEvent(new Event('opening:reveal')); }, null, 'part+=.3');
  gsap.set(brand, { scale: .96 });

  function skip() { tl.kill(); gsap.to(overlay, { opacity: 0, duration: .35, onComplete: done }); }
  overlay.querySelector('[data-skip]').addEventListener('click', skip);
  document.addEventListener('keydown', function onKey(e) { if (e.key === 'Escape') { document.removeEventListener('keydown', onKey); skip(); } });
})();
