/* Takuya Hero Typewriter v1.0.0 — no requests, no dependencies, no loops. */
(() => {
  'use strict';
  if (window.TakuyaHeroTypewriter) { window.TakuyaHeroTypewriter.mount(); return; }
  const doc = document, mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const played = new WeakSet();
  let active = null;
  const removePending = () => {
    doc.documentElement.removeAttribute('data-takuya-hero-pending');
    if (window.__tkyHeroBoot) clearTimeout(window.__tkyHeroBoot.timer);
  };
  function split(text) {
    if (typeof Intl.Segmenter === 'function') {
      return Array.from(new Intl.Segmenter(undefined, {granularity: 'grapheme'}).segment(text), x => x.segment);
    }
    // Preserve code points, combining marks, variation selectors and ZWJ sequences.
    const out = [];
    for (const c of Array.from(text)) {
      if (out.length && (/\p{Mark}/u.test(c) || /[\uFE00-\uFE0F\u200D]/u.test(c) || out[out.length - 1].endsWith('\u200D'))) out[out.length - 1] += c;
      else out.push(c);
    }
    return out;
  }
  function mount() {
    const configNode = doc.getElementById('takuya-hero-options');
    if (!configNode) { removePending(); return; }
    let options;
    try { options = JSON.parse(configNode.textContent); } catch (_) { removePending(); return; }
    const root = options.root || '/';
    if (location.pathname !== root && location.pathname !== root + 'index.html') { removePending(); return; }
    const host = doc.querySelector('#page-header #site-info');
    const title = host && host.querySelector('h1#site-title');
    if (!host || !title || played.has(host)) { removePending(); return; }
    if (active) active.finish();
    played.add(host);
    const styleNode = doc.getElementById('takuya-hero-style');
    if (!styleNode || !styleNode.sheet || mq.matches || doc.hidden || (window.__tkyHeroBoot && window.__tkyHeroBoot.expired)) {
      host.dataset.tkyTypeState = 'static'; removePending(); return;
    }
    const subtitle = host.querySelector('#site-subtitle #subtitle');
    const targets = [title, subtitle].filter(el => el && el.textContent.trim());
    const rows = [], timers = new Set();
    let currentRow = null, lastGlyph = null, cancelled = false;
    const caret = doc.createElement('span'); caret.className = 'tky-type-caret'; caret.setAttribute('aria-hidden', 'true');
    caret.hidden = true;
    function later(fn, ms) {
      const id = setTimeout(() => { timers.delete(id); if (!cancelled) fn(); }, ms); timers.add(id);
    }
    function position() {
      if (!lastGlyph || !lastGlyph.isConnected) return;
      const r = lastGlyph.getBoundingClientRect(), h = host.getBoundingClientRect();
      caret.style.left = Math.max(0, Math.min(host.clientWidth - 3, r.right - h.left - host.clientLeft + 2)) + 'px';
      caret.style.top = (r.top - h.top - host.clientTop + r.height * .12) + 'px';
      caret.style.height = Math.max(8, r.height * .76) + 'px';
      caret.style.color = getComputedStyle(currentRow.el).color;
      caret.hidden = false;
    }
    function restore(row) { if (row && !row.restored) { row.el.replaceChildren(...row.original); row.restored = true; } }
    function finish() {
      if (cancelled) return;
      cancelled = true; timers.forEach(clearTimeout); timers.clear();
      rows.forEach(restore); caret.remove();
      window.removeEventListener('resize', position); doc.removeEventListener('keydown', escape);
      host.dataset.tkyTypeState = 'done'; removePending(); active = null;
    }
    function escape(e) { if (e.key === 'Escape') finish(); }
    try {
      for (const el of targets) {
        const text = el.textContent, original = Array.from(el.childNodes);
        const accessible = doc.createElement('span'); accessible.className = 'tky-type-accessible'; accessible.textContent = text;
        const visual = doc.createElement('span'); visual.setAttribute('aria-hidden', 'true');
        const glyphs = split(text).map(c => { const s = doc.createElement('span'); s.className = 'tky-type-glyph'; s.textContent = c; visual.append(s); return s; });
        rows.push({el, original, glyphs, restored: false}); el.replaceChildren(accessible, visual);
      }
      host.append(caret); host.dataset.tkyTypeState = 'running'; removePending();
      active = {finish}; window.addEventListener('resize', position, {passive: true}); doc.addEventListener('keydown', escape);
      function run(rowIndex) {
        if (rowIndex >= rows.length) {
          caret.dataset.idle = '1';
          later(() => { caret.dataset.fade = '1'; later(finish, 210); }, 1000); return;
        }
        const row = rows[rowIndex]; currentRow = row; let i = 0;
        function step() {
          if (!host.isConnected) { finish(); return; }
          const glyph = row.glyphs[i++]; glyph.dataset.visible = '1'; lastGlyph = glyph;
          delete caret.dataset.idle; position();
          if (i < row.glyphs.length) {
            const rhythm = [0, -7, 4, 9, -3, 3][i % 6];
            const punctuation = /[、。，．！？!?]/u.test(glyph.textContent) ? 110 : 0;
            later(step, (rowIndex === 0 ? 150 : 65) + rhythm + punctuation);
          } else if (rowIndex + 1 < rows.length) {
            caret.dataset.idle = '1'; later(() => { restore(row); caret.hidden = true; run(rowIndex + 1); }, 220);
          } else run(rowIndex + 1);
        }
        if (row.glyphs.length) step(); else run(rowIndex + 1);
      }
      later(() => run(0), 240);
      // Hard upper bound even if text is unusually long or timers are throttled.
      later(finish, 6500);
    } catch (error) {
      finish(); console.warn('Homepage typing skipped; static text kept.', error);
    }
  }
  window.TakuyaHeroTypewriter = {version: '1.0.0', mount, finish: () => active && active.finish()};
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', mount, {once: true}); else mount();
  doc.addEventListener('pjax:complete', mount); doc.addEventListener('pjax:success', mount);
  doc.addEventListener('visibilitychange', () => { if (doc.hidden && active) active.finish(); });
  const change = () => { if (mq.matches && active) active.finish(); };
  if (mq.addEventListener) mq.addEventListener('change', change); else if (mq.addListener) mq.addListener(change);
})();
