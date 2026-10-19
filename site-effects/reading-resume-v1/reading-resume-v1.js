/**
 * Takuya Reading Resume 1.0.0
 * Opt-in continuation only: NEVER scrolls on initial page load.
 * Stores just position metadata in this browser's localStorage; no network calls.
 */
(() => {
  'use strict';
  const GLOBAL = '__TakuyaReadingResumeV1';
  if (window[GLOBAL]) { window[GLOBAL].mount(); return; }
  const PREFIX = 'takuya:reading:v1:';
  const TTL_MS = 180 * 86400 * 1000;
  const MIN_OFFSET = 360;
  const VERSION = 1;
  const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)');
  let cleanup = () => {};
  let mountedPath = '';
  let initialized = false;
  let active = false;

  function normalizePath() {
    // Do not use query string or fragment as identity; exclude admin routes.
    const p = location.pathname.replace(/\/+$/, '') || '/';
    try { return decodeURI(p); } catch { return p; }
  }
  function getRoot() {
    const article = document.querySelector('#post article#article-container, #post #article-container');
    if (!article || !document.querySelector('#post')?.contains(article)) return null;
    if (location.pathname.startsWith('/admin/') || location.pathname === '/') return null;
    return article;
  }
  function read(key) {
    try {
      const item = JSON.parse(localStorage.getItem(key) || 'null');
      if (!item || item.v !== VERSION || !Number.isFinite(item.offset) ||
        !Number.isFinite(item.ratio) || !Number.isFinite(item.ts) ||
        item.offset < 0 || item.ratio < 0 || item.ratio > 1 ||
        Date.now() - item.ts > TTL_MS || item.ts > Date.now() + 86400000) return null;
      return item;
    } catch { return null; }
  }
  function prune() {
    // Only our own keys. Never inspect or alter other site's data.
    try {
      const old = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key?.startsWith(PREFIX)) continue;
        const data = read(key);
        if (!data) old.push([key, 0]);
        else old.push([key, data.ts]);
      }
      old.sort((a,b) => b[1] - a[1]);
      for (const [key] of old.slice(120)) localStorage.removeItem(key);
      for (const [key,ts] of old) if (!ts) localStorage.removeItem(key);
    } catch { /* disabled storage/private mode: UI remains usable */ }
  }
  function percent(item) { return Math.max(1, Math.min(99, Math.round(item.ratio * 100))); }
  function top(el) { return el.getBoundingClientRect().top + scrollY; }
  function headingCandidates(article) {
    return [...article.querySelectorAll('h2[id],h3[id],h4[id],h5[id],section[id],.grammar-card[id],.jlpt-question[id],[id^="question-"],[id^="q-"]')]
      .filter(el => el.id && el.getClientRects().length).slice(0, 500);
  }
  function closestHeading(article, y) {
    let best = null;
    // Find the most recently passed heading within a moderate distance.
    for (const el of headingCandidates(article)) {
      const t = top(el);
      if (t <= y + 90 && (!best || t > best.pos)) best = {el,pos:t};
    }
    if (!best || y - best.pos > 2800) return {id:'',delta:0};
    return {id: best.el.id.slice(0,160), delta: Math.max(-90, Math.min(2800, Math.round(y-best.pos)))};
  }
  function createWidget() {
    const wrap = document.createElement('section');
    wrap.className = 'tky-reading-resume';
    wrap.dataset.tkyReadingResume = '';
    wrap.setAttribute('aria-label', '上次阅读记录');
    wrap.innerHTML = '<span class="tky-reading-resume__mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 4.5h11v15l-5.5-4-5.5 4z"/></svg></span>' +
      '<div class="tky-reading-resume__body"><span class="tky-reading-resume__name">上次读到这里</span><span class="tky-reading-resume__sub"></span></div>' +
      '<button class="tky-reading-resume__go" type="button">继续阅读 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg></button>' +
      '<button type="button" class="tky-reading-resume__close" aria-label="暂时关闭继续阅读提示">×</button>' +
      '<span class="tky-reading-resume__progress" aria-hidden="true"></span>';
    return wrap;
  }
  function mount() {
    const article = getRoot();
    const path = normalizePath();
    if (!article || path === '/') { cleanup(); mountedPath = ''; return; }
    if (mountedPath === path && active) return;
    cleanup(); prune();
    const key = PREFIX + encodeURIComponent(path);
    const prior = read(key);
    mountedPath = path;
    active = true;
    let widget = null;
    let closed = false;
    let touched = false;
    let timer = 0;
    let restoring = false;
    let resumeTarget = null;
    const subscriptions = [];
    const on = (target,event,handler,opts) => {
      target.addEventListener(event,handler,opts);
      subscriptions.push(() => target.removeEventListener(event,handler,opts));
    };
    const dismiss = () => { closed = true; widget?.remove(); widget = null; };
    function validResume(item) {
      if (!item || item.offset < MIN_OFFSET || item.ratio > .995) return false;
      const scrollable = Math.max(0, document.documentElement.scrollHeight - innerHeight);
      return scrollable > 620 && article.offsetHeight > 800;
    }
    function refreshResume(item) {
      if (!widget || !item) return;
      widget.querySelector('.tky-reading-resume__sub').textContent = `已读约 ${percent(item)}%`;
      widget.querySelector('.tky-reading-resume__progress').style.width = `${percent(item)}%`;
    }
    function calculate(item) {
      const articleTop = top(article);
      const articleHeight = Math.max(1,article.offsetHeight);
      let target = articleTop + Math.max(0,item.offset);
      if (item.anchor) {
        const head = document.getElementById(item.anchor);
        if (head && article.contains(head)) target = top(head) + Math.max(-90,Math.min(2800,Number(item.delta)||0));
      } else if (item.height && Math.abs(articleHeight-item.height) / Math.max(1,item.height) > .22) {
        target = articleTop + item.ratio * articleHeight;
      }
      return Math.max(0, Math.min(document.documentElement.scrollHeight-innerHeight, Math.round(target)));
    }
    function save() {
      if (!touched || restoring) return;
      const articleTop = top(article);
      const offset = scrollY - articleTop;
      if (offset < MIN_OFFSET || article.offsetHeight < 800) return;
      const ratio = Math.max(0,Math.min(1,offset/Math.max(1,article.offsetHeight)));
      const anchor = closestHeading(article,scrollY);
      const record = {v:VERSION, offset:Math.round(offset),ratio, height:Math.round(article.offsetHeight),anchor:anchor.id,delta:anchor.delta,ts:Date.now()};
      try { localStorage.setItem(key,JSON.stringify(record)); } catch { /* Safari private or quota */ }
    }
    function queueSave() {
      if (!touched || restoring) return;
      clearTimeout(timer);
      timer=setTimeout(save,500);
    }
    function showPrior() {
      if (!validResume(prior) || closed || widget) return;
      // An explicit #section link takes priority over the previous reading record.
      if (location.hash) return;
      // If the browser itself restored the position, don't show a redundant CTA.
      if (Math.abs(scrollY-calculate(prior)) < 180) return;
      widget=createWidget();refreshResume(prior);
      article.before(widget);
      const click = async () => {
        dismiss();restoring=true;touched=true;
        // Only navigate when explicitly clicked. Wait for stable fonts when possible.
        try { await Promise.race([document.fonts?.ready || Promise.resolve(),new Promise(r=>setTimeout(r,550))]); } catch {}
        if (!active || mountedPath!==path) return;
        const dest = calculate(prior);
        const behavior = REDUCED.matches || Math.abs(scrollY-dest) > innerHeight * 2 ? 'instant':'smooth';
        try { scrollTo({top:dest,behavior}); } catch { scrollTo(0,dest); }
        setTimeout(() => { restoring=false; save(); },behavior==='smooth'?1000:200);
      };
      on(widget.querySelector('.tky-reading-resume__go'),'click',click);
      on(widget.querySelector('.tky-reading-resume__close'),'click',dismiss);
    }
    if (prior && validResume(prior)) {
      // Late layout / lazy image changes must not cause an automatic jump.
      if (document.readyState === 'complete') showPrior();
      else on(window,'load',showPrior,{once:true});
      const fallback=setTimeout(showPrior,900);
      subscriptions.push(() => clearTimeout(fallback));
    }
    // Only a genuine user interaction allows updates, not browser native restoration.
    for(const e of ['wheel','touchstart','pointerdown']) on(window,e,()=>{touched=true;},{passive:true});
    on(window,'keydown',e=>{if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End',' '].includes(e.key) && !/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||''))touched=true;});
    on(window,'scroll',queueSave,{passive:true});
    on(document,'visibilitychange',()=>{if(document.hidden){clearTimeout(timer);save();}});
    on(window,'pagehide',()=>{clearTimeout(timer);save();});
    cleanup=()=>{
      clearTimeout(timer);save();
      subscriptions.forEach(fn=>fn());widget?.remove();widget=null;
      active=false;
    };
  }
  window[GLOBAL]={mount,unmount:()=>{cleanup();mountedPath='';},version:'1.0.0'};
  document.addEventListener('pjax:send',()=>{cleanup();mountedPath='';});
  document.addEventListener('pjax:complete',mount);
  window.addEventListener('pageshow',e=>{if(e.persisted){cleanup();mountedPath='';mount();}});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();
