/* GitHub Pages compatibility shim for the static Butterfly mirror.
 * Preserves public theme preference, contact popovers and uptime labels.
 * Does NOT add a dead /admin/ link or load FastAPI-only comments endpoints.
 */
(() => {
  'use strict';
  if (window.__takuyaPagesStaticEntry) return;
  window.__takuyaPagesStaticEntry = true;
  const get = (selector, root=document) => root.querySelector(selector);
  function mode() {
    const config = get('script[src*="/local-admin/entry.js"]');
    const preference = config?.dataset.defaultMode || 'auto';
    try {
      const saved = JSON.parse(localStorage.getItem('theme') || 'null');
      if (saved && saved.expiry > Date.now() && ['dark','light'].includes(saved.value)) return;
    } catch {}
    document.documentElement.setAttribute('data-theme', preference === 'auto' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : preference);
  }
  function runTime() {
    document.querySelectorAll('[data-studio-runtime]').forEach(element => {
      const start = Date.parse(element.dataset.studioRuntime + 'T00:00:00+08:00');
      if (!Number.isFinite(start)) return;
      let seconds = Math.max(0, Math.floor((Date.now() - start) / 1000));
      const days = Math.floor(seconds / 86400); seconds %= 86400;
      const hours = Math.floor(seconds / 3600); seconds %= 3600;
      const minutes = Math.floor(seconds / 60);
      element.textContent = `${days} 天 ${hours} 小时 ${minutes} 分 ${seconds%60} 秒`;
    });
  }
  let dialog;
  function contact(button) {
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'studio-contact-dialog';
      dialog.setAttribute('aria-labelledby', 'static-contact-title');
      dialog.innerHTML = '<div class="studio-contact-heading"><h2 id="static-contact-title"></h2><button class="studio-contact-close" type="button" aria-label="关闭">×</button></div><p class="studio-contact-value"></p><img class="studio-contact-qr" alt="联系二维码"><div class="studio-contact-actions"><button class="studio-contact-copy" type="button">复制号码</button><a class="studio-contact-go" rel="noopener noreferrer" target="_blank">打开链接</a></div><p class="studio-contact-result" role="status"></p>';
      document.body.append(dialog);
      get('.studio-contact-close',dialog).addEventListener('click', () => dialog.close());
    }
    const d = button.dataset;
    get('h2', dialog).textContent = d.contactTitle || '联系我';
    const value = get('.studio-contact-value',dialog); value.textContent = d.contactValue || ''; value.hidden = !d.contactValue;
    const qr = get('.studio-contact-qr',dialog); qr.hidden = !d.contactQr;
    if (d.contactQr) qr.src = d.contactQr; else qr.removeAttribute('src');
    const link = get('.studio-contact-go',dialog); link.hidden = !d.contactUrl;
    if (d.contactUrl) link.href = d.contactUrl; else link.removeAttribute('href');
    const copy = get('.studio-contact-copy',dialog); copy.hidden = !d.contactValue;
    const result = get('.studio-contact-result',dialog); result.textContent = '';
    copy.onclick = async () => {
      try { await navigator.clipboard.writeText(d.contactValue); result.textContent = '已复制'; }
      catch { result.textContent = '请长按上方号码复制'; }
    };
    if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open','');
  }
  document.addEventListener('click',event => {
    const trigger = event.target.closest('button[data-contact-title]');
    if (!trigger) return;
    event.preventDefault(); contact(trigger);
  });
  function init() {
    mode(); runTime();
    // This mirror intentionally has no admin server; no /admin/ button is generated.
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
  document.addEventListener('pjax:complete', init);
  document.addEventListener('pjax:success', init);
  setInterval(runTime, 1000);
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', mode);
})();
