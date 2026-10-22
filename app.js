(() => {
  const S = window.SITE || {};
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };

  // ── fill in config ──────────────────────────
  const pick = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), S);
  $$('[data-cfg]').forEach((el) => {
    const v = pick(el.dataset.cfg);
    if (v !== undefined && v !== null && v !== '') el.textContent = v;
  });
  if (S.name) document.title = `${S.name}, bartender for hire`;
  if (S.name && S.name.trim().length <= 3) $('.name').classList.add('short');
  $('#year').textContent = new Date().getFullYear();
  const showLink = (el, href) => { if (href) { el.href = href; el.hidden = false; } };
  showLink($('#calLink'), S.calendarLink);
  showLink($('#abcProof'), S.abc && S.abc.proof);
  showLink($('#insta'), S.instagram);

  // ── photo, plus the fighter-card portrait (a pixelated copy for the arcade style) ──
  if (S.photo) {
    const img = new Image();
    img.onload = () => {
      const hero = $('#photo');
      hero.src = img.src;
      hero.alt = `${S.name || 'The bartender'} behind the bar`;
      $('#photoFrame').classList.add('has-photo');
      $('#portraitImg').src = img.src;
      const c = $('#portrait'), ctx = c.getContext('2d');
      const r = Math.max(c.width / img.width, c.height / img.height);
      const sw = c.width / r, sh = c.height / r;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) * 0.15, sw, sh, 0, 0, c.width, c.height);
      $('#portraitBox').classList.add('has-photo');
    };
    img.src = S.photo;
  }

  // ── stat bars fill once when the screen comes into view ──
  const stats = $('#stats');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) { stats.classList.add('in'); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(stats);
  } else stats.classList.add('in');

  // ── toast ───────────────────────────────────
  let toastTimer;
  function toast(msg, ms = 4200) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  }

  // ── music: lo-fi chiptune made live in the browser (no audio file) ──
  const Music = (() => {
    let ctx, master, out, sfx, timer, nextTime = 0, step = 0, pulse25, pulse12, noiseBuf;
    let on = false;
    const SPB = 60 / 76 / 4;              // one 16th note at 76 bpm
    const VOL = 0.1;                       // "low in the background"
    const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
    // Fmaj7 → Em7 → Dm7 → Cmaj7, a bar each
    const CHORDS = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
    const BASS = [41, 40, 38, 36];
    const ARP = [0, 1, 2, 3, 2, 1, 0, 2];
    const MELODY = new Map([[0, [76, 4]], [6, [74, 2]], [8, [72, 6]], [18, [71, 2]], [20, [74, 4]], [26, [76, 4]],
      [32, [77, 3]], [36, [76, 2]], [38, [74, 6]], [50, [72, 2]], [52, [71, 2]], [54, [67, 8]]]);

    function pulse(duty) {
      const n = 32, re = new Float32Array(n), im = new Float32Array(n);
      for (let i = 1; i < n; i++) re[i] = (2 / (i * Math.PI)) * Math.sin(i * Math.PI * duty);
      return ctx.createPeriodicWave(re, im);
    }
    function init() {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      out = ctx.createGain(); out.gain.value = 0;
      const warm = ctx.createBiquadFilter(); warm.type = 'lowpass'; warm.frequency.value = 3000; warm.Q.value = 0.4;
      master = ctx.createGain();
      master.connect(warm); warm.connect(out); out.connect(ctx.destination);
      sfx = ctx.createGain(); sfx.gain.value = 0.16; sfx.connect(ctx.destination);
      pulse25 = pulse(0.25); pulse12 = pulse(0.125);
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      // vinyl crackle bed
      const cb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), cd = cb.getChannelData(0);
      for (let i = 0; i < cd.length; i++) cd[i] = Math.random() < 0.0006 ? (Math.random() * 2 - 1) * 0.5 : (Math.random() * 2 - 1) * 0.004;
      const crackle = ctx.createBufferSource(); crackle.buffer = cb; crackle.loop = true;
      crackle.connect(master); crackle.start();
      ctx.onstatechange = () => { if (on && ctx.state === 'running' && !store.get('musicToastShown')) {
        store.set('musicToastShown', '1');
        toast('Music is playing quietly. Turn it off with Music at the top.');
      } };
      document.addEventListener('visibilitychange', () => {
        if (!on) return;
        document.hidden ? ctx.suspend() : ctx.resume();
      });
    }
    function tone(t, freq, dur, o = {}) {
      const osc = ctx.createOscillator();
      if (o.wave) osc.setPeriodicWave(o.wave); else osc.type = o.type || 'square';
      osc.frequency.value = freq;
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.cutoff || 2000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(o.gain || 0.2, t + (o.attack || 0.005));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      if (o.vib) {
        const lfo = ctx.createOscillator(), lg = ctx.createGain();
        lfo.frequency.value = 5; lg.gain.value = o.vib;
        lfo.connect(lg); lg.connect(osc.frequency); lfo.start(t); lfo.stop(t + dur + 0.05);
      }
      osc.connect(f); f.connect(g); g.connect(o.dest || master);
      osc.start(t); osc.stop(t + dur + 0.05);
    }
    function noise(t, dur, type, freq, gain) {
      const s = ctx.createBufferSource(); s.buffer = noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(master);
      s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
    }
    function kick(t) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      g.gain.setValueAtTime(0.6, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g); g.connect(master); o.start(t); o.stop(t + 0.32);
    }
    function play(s, t) {
      const bar = Math.floor(s / 16) % 4, b = s % 16, loop = Math.floor(s / 64);
      const lofi = document.documentElement.dataset.music === 'lofi';
      if (b % 2 === 0) {
        const n = mtof(CHORDS[bar][ARP[b / 2]] + 12);
        lofi ? tone(t, n, SPB * 3, { type: 'triangle', gain: 0.09, cutoff: 1000, attack: 0.02 })
             : tone(t, n, SPB * 1.6, { wave: pulse25, gain: 0.07, cutoff: 1400 });
      }
      if (b === 0 || b === 6 || b === 10) tone(t, mtof(BASS[bar]), SPB * (b === 0 ? 5 : 3), { type: 'triangle', gain: 0.3, cutoff: 900, attack: 0.01 });
      if (b === 0 || b === 7 || b === 10) kick(t);
      if (b === 4 || b === 12) noise(t, 0.18, 'bandpass', 1800, 0.12);
      if (b % 2 === 0) noise(t, 0.04, 'highpass', 7000, b % 4 === 0 ? 0.035 : 0.02);
      const m = MELODY.get(s % 64);
      if (m && loop % 3 !== 2) {
        lofi ? tone(t, mtof(m[0]), SPB * m[1], { type: 'sine', gain: 0.1, cutoff: 1800, attack: 0.04, vib: 4 })
             : tone(t, mtof(m[0]), SPB * m[1], { wave: pulse12, gain: 0.06, cutoff: 2200, attack: 0.02, vib: 3 });
      }
    }
    function tick() {
      while (nextTime < ctx.currentTime + 0.15) {
        play(step, nextTime + (step % 2 ? SPB * 0.16 : 0)); // a little swing
        nextTime += SPB; step++;
      }
    }
    return {
      get on() { return on; },
      start() {
        if (!ctx) init();
        on = true;
        ctx.resume();
        if (!timer) { nextTime = ctx.currentTime + 0.08; timer = setInterval(tick, 30); }
        out.gain.cancelScheduledValues(ctx.currentTime);
        out.gain.setTargetAtTime(VOL, ctx.currentTime, 0.8);
      },
      stop() {
        on = false;
        if (!ctx) return;
        out.gain.cancelScheduledValues(ctx.currentTime);
        out.gain.setTargetAtTime(0, ctx.currentTime, 0.12);
        setTimeout(() => { if (!on) { clearInterval(timer); timer = null; ctx.suspend(); } }, 600);
      },
      resume() { if (on && ctx && ctx.state !== 'running') ctx.resume(); },
      // short chiptune stings for the easter eggs; silent when music is off
      sting(notes, len = 0.08) {
        if (!on || !ctx) return;
        const t = ctx.currentTime + 0.01;
        notes.forEach((n, i) => tone(t + i * len, mtof(n), len * 1.3, { wave: pulse25, gain: 0.3, cutoff: 6000, dest: sfx }));
      },
    };
  })();

  const musicBtn = $('#music');
  function setMusic(want) {
    want ? Music.start() : Music.stop();
    musicBtn.setAttribute('aria-pressed', String(want));
    $('#musicState').textContent = want ? ' on' : ' off';
    store.set('music', want ? 'on' : 'off');
  }
  musicBtn.addEventListener('click', () => setMusic(!Music.on));
  // Auto-play unless the visitor turned it off before. Browsers hold audio until the
  // first tap or key press, so the music begins at that moment.
  if (store.get('music') !== 'off') {
    setMusic(true);
    const unlock = (e) => {
      if (musicBtn.contains(e.target)) return; // the button handles itself
      Music.resume();
      ['pointerdown', 'keydown', 'touchend'].forEach((ev) => removeEventListener(ev, unlock, true));
    };
    ['pointerdown', 'keydown', 'touchend'].forEach((ev) => addEventListener(ev, unlock, true));
  }

  // ── easter egg: the logo ────────────────────
  const REACTIONS = [
    ['ヽ(°〇°)ﾉ', 'KANPAI!!'],
    ['Σ(°ロ°)', 'Nani?! A bartender who travels?'],
    ['(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧', 'Sugoi! Twelve years of pours!'],
    ['(っ˘ڡ˘ς)', 'Oishii~'],
    ['(⁄ ⁄>⁄ ▽ ⁄<⁄ ⁄)', "I-it's not like I made this drink for you…"],
    ['(｀・ω・´)ゞ', 'Bartender-san, reporting for duty!'],
    ['( ✧Д✧)', 'Omae wa mou… shaken.'],
  ];
  const FACTS = [
    'The first printed definition of "cocktail" ran in a New York newspaper in 1806: spirits, sugar, water and bitters.',
    'Tonic water glows under a black light. The quinine in it is fluorescent.',
    'The Old Fashioned got its name from drinkers asking for a whiskey cocktail made "the old-fashioned way."',
    "Angostura bitters' famously oversized label started as a mix-up. The company liked it and kept it.",
    'Big ice cubes melt slower than small ones, so your drink stays strong for longer.',
    'A bottle of Champagne holds about 5 to 6 atmospheres of pressure, roughly twice what is in a car tyre.',
    '"Neat" means straight from the bottle at room temperature. "On the rocks" means poured over ice.',
    'A shaken cocktail needs about 10 to 15 seconds of shaking to get properly cold and diluted.',
  ];
  const egg = $('#egg'), eggBody = $('#eggBody');
  let lastPick = -1, lastFocus = null, eggTimer;
  const randomIndex = (n) => { let i; do { i = Math.floor(Math.random() * n); } while (n > 1 && i === lastPick); return (lastPick = i); };

  function openEgg(html, isFact) {
    lastFocus = document.activeElement;
    eggBody.innerHTML = html;
    egg.classList.toggle('fact', isFact);
    egg.hidden = false;
    egg.tabIndex = -1; egg.focus();
    clearTimeout(eggTimer);
    if (!isFact) eggTimer = setTimeout(closeEgg, 2600);
  }
  function closeEgg() {
    if (egg.hidden) return;
    egg.hidden = true; clearTimeout(eggTimer);
    if (lastFocus) lastFocus.focus();
  }
  egg.addEventListener('click', closeEgg);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closeEgg(); });

  let combo = 0, comboTimer;
  $('#logo').addEventListener('click', () => {
    combo++;
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => { combo = 0; $('#combo').classList.remove('show'); }, 1400);
    if (combo >= 2) { const c = $('#combo'); c.textContent = `${combo} hit combo!`; c.classList.add('show'); }

    if (Math.random() < 0.6) {
      const [face, say] = REACTIONS[randomIndex(REACTIONS.length)];
      openEgg(`<div class="egg-face" aria-hidden="true">${face}</div><p class="egg-say" id="eggText">${say}</p>`, false);
      Music.sting([72, 76, 79, 84]);
      if (!reduceMotion) { const m = document.querySelector('main'); m.classList.remove('shake'); void m.offsetWidth; m.classList.add('shake'); }
    } else {
      openEgg(`<p class="egg-label">Bar fact</p><p class="egg-fact" id="eggText">${FACTS[Math.floor(Math.random() * FACTS.length)]}</p>`, true);
      Music.sting([84, 79]);
    }
  });

  // ── easter egg: ↑↑↓↓←→←→BA ──────────────────
  const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let k = 0;
  addEventListener('keydown', (e) => {
    k = e.key === KONAMI[k] ? k + 1 : (e.key === KONAMI[0] ? 1 : 0);
    if (k < KONAMI.length) return;
    k = 0;
    toast('Secret unlocked: happy hour mode.');
    Music.sting([60, 64, 67, 72, 76, 79, 84], 0.06);
    if (reduceMotion) return;
    const drinks = ['🍸', '🍹', '🥂', '🍋', '🍒', '🧊', '🍾'];
    for (let i = 0; i < 40; i++) {
      const d = document.createElement('span');
      d.className = 'rain'; d.textContent = drinks[i % drinks.length];
      d.style.left = Math.random() * 100 + 'vw';
      d.style.animationDuration = 2.2 + Math.random() * 2 + 's';
      d.style.animationDelay = Math.random() * 1.2 + 's';
      document.body.appendChild(d);
      setTimeout(() => d.remove(), 5600);
    }
  });

  // ── select this bartender ───────────────────
  $('#selectBtn').addEventListener('click', () => {
    const screen = $('#screen');
    screen.classList.remove('flash'); void screen.offsetWidth; screen.classList.add('flash');
    Music.sting([67, 72, 76, 79, 84, 88], 0.07);
    toast('Bartender selected. Now pick your date.', 3000);
    setTimeout(() => {
      $('#book').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      setTimeout(() => $('#f-date').focus({ preventScroll: true }), reduceMotion ? 0 : 600);
    }, reduceMotion ? 0 : 700);
  });

  // ── booking form ────────────────────────────
  const form = $('#bookForm'), status = $('#status'), submitBtn = $('#submitBtn');
  const rate = Number(S.rate) || 50;
  const money = (n) => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  $('#f-date').min = today.toISOString().slice(0, 10);

  function updateTotal() {
    const h = parseFloat($('#f-hours').value);
    const ok = h > 0;
    $('#totalMath').textContent = ok ? `${h} hour${h === 1 ? '' : 's'} × ${money(rate)}` : `${money(rate)} an hour`;
    $('#total').textContent = ok ? money(h * rate) : '–';
    return ok ? money(h * rate) : '';
  }
  $('#f-hours').addEventListener('input', updateTotal);
  updateTotal();

  function say(msg, kind) { status.className = 'f-6 status ' + (kind || ''); status.innerHTML = msg; }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const firstBad = [...form.elements].find((el) => el.willValidate && !el.checkValidity());
    if (firstBad) {
      const label = form.querySelector(`label[for="${firstBad.id}"]`);
      const name = label ? label.childNodes[0].textContent.trim() : 'A field';
      say(`${name} needs a valid answer before this can be sent.`, 'err');
      firstBad.focus();
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    if (data._honey) return; // a bot filled the hidden field

    if (!S.email) {
      say('Booking requests are not connected yet. The site owner needs to add an email address in config.js.', 'err');
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending request…';
    say('');
    const payload = {
      ...data,
      Estimate: updateTotal(),
      _subject: `Bartending request: ${data['Event type']} on ${data['Event date']} in ${data.Location}`,
      _template: 'table',
    };
    try {
      const r = await fetch(`https://formsubmit.co/ajax/${S.email.trim()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || String(j.success) === 'false') throw new Error(j.message || 'send failed');
      form.reset(); updateTotal();
      say(`Request sent. I'll reply to ${escapeHtml(data.email)} to confirm the date.`, 'ok');
      Music.sting([72, 76, 79, 84, 79, 84], 0.09);
    } catch {
      const body = Object.entries(data).filter(([k, v]) => v && k !== '_honey').map(([k, v]) => `${k}: ${v}`).join('\n');
      const mail = `mailto:${S.email}?subject=${encodeURIComponent('Bartending request')}&body=${encodeURIComponent(body + '\nEstimate: ' + updateTotal())}`;
      say(`The request didn't go through. Check your connection and try again, or <a href="${mail}">send it by email instead</a>.`, 'err');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Request this date';
    }
  });
  // ── style picker ────────────────────────────
  const THEMES = window.THEMES || [];
  if (S.showStylePicker !== false && THEMES.length > 1) {
    const html = document.documentElement;
    const wrap = document.createElement('div');
    wrap.className = 'picker';
    wrap.innerHTML = `
      <div class="picker-panel" id="pickerPanel" hidden>
        <h2>Pick a style</h2>
        <p>Same content and booking form in every style. Tap one to try it.</p>
        <ul class="picker-list">${THEMES.map((t) => `
          <li><button type="button" data-id="${t.id}">
            <span class="sw">${t.swatch.map((c) => `<i style="background:${c}"></i>`).join('')}</span>
            <span><b>${t.name}</b><small>${t.blurb}</small></span>
          </button></li>`).join('')}
        </ul>
        <div class="picker-nav">
          <button type="button" data-step="-1">Previous style</button>
          <button type="button" data-step="1">Next style</button>
        </div>
      </div>
      <button class="picker-toggle" type="button" aria-expanded="false" aria-controls="pickerPanel">
        <span class="dots" aria-hidden="true"></span><span class="picker-name"></span>
      </button>`;
    document.body.appendChild(wrap);
    const panel = wrap.querySelector('.picker-panel'), toggle = wrap.querySelector('.picker-toggle');

    const current = () => THEMES.findIndex((t) => t.id === html.dataset.theme);
    function show(t) {
      wrap.querySelector('.dots').innerHTML = t.swatch.map((c) => `<i style="background:${c}"></i>`).join('');
      wrap.querySelector('.picker-name').textContent = `Style: ${t.name}`;
      wrap.querySelectorAll('[data-id]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.id === t.id)));
    }
    function apply(t) {
      html.dataset.theme = t.id;
      html.dataset.music = t.music;
      $('#fontCss').href = `https://fonts.googleapis.com/css2?${t.fonts}&display=swap`;
      $('#themeCss').href = `themes/${t.id}.css`;
      store.set('style', t.id);
      const url = new URL(location.href);
      url.searchParams.set('style', t.id);
      history.replaceState(null, '', url);
      show(t);
    }
    const open = (yes) => { panel.hidden = !yes; toggle.setAttribute('aria-expanded', String(yes)); };
    toggle.addEventListener('click', () => open(panel.hidden));
    panel.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.id) apply(THEMES.find((t) => t.id === b.dataset.id));
      if (b.dataset.step) apply(THEMES[(current() + Number(b.dataset.step) + THEMES.length) % THEMES.length]);
    });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) { open(false); toggle.focus(); } });
    document.addEventListener('pointerdown', (e) => { if (!wrap.contains(e.target)) open(false); });
    show(THEMES[Math.max(0, current())]);
  }

  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
})();
