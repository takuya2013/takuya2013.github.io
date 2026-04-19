(() => {
  if (window.__jpPronounceStrictLoaded) return;
  window.__jpPronounceStrictLoaded = true;

  function cleanText(text) {
    return (text || '')
      .replace(/\r/g, '')
      .replace(/\u200b/g, '')
      .replace(/\u200e|\u200f|\u202a|\u202b|\u202c|\u202d|\u202e/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function hasKana(text) {
    return /[ぁ-ゖァ-ヿー]/.test(text || '');
  }

  function hasJapanese(text) {
    return /[\u3040-\u30ff\u3400-\u9fff]/.test(text || '');
  }

  function getJapaneseVoice() {
    const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    return (
      voices.find(v => /^ja(-|_)?/i.test(v.lang || '')) ||
      voices.find(v => /japanese|日本/i.test((v.name || '') + ' ' + (v.lang || ''))) ||
      null
    );
  }

  function speak(text) {
    const t = cleanText(text);
    if (!t || !window.speechSynthesis || typeof window.SpeechSynthesisUtterance === 'undefined') return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(t);
    utter.lang = 'ja-JP';
    utter.rate = 0.94;
    utter.pitch = 1.0;
    utter.volume = 1.0;
    const voice = getJapaneseVoice();
    if (voice) utter.voice = voice;
    window.speechSynthesis.speak(utter);
  }

  function setFaIcon(btn) {
    btn.innerHTML = '<i class="fa fa-volume-up" aria-hidden="true"></i>';
    btn.setAttribute('aria-label', '播放发音');
    btn.setAttribute('title', '播放发音');
  }

  function makeBtn(reading) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'jp-pronounce-btn';
    btn.setAttribute('data-reading', reading);
    setFaIcon(btn);
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      speak(reading);
    });
    return btn;
  }

  function removeWrongButtons(scope) {
    scope.querySelectorAll('p .jp-pronounce-btn, li .jp-pronounce-btn').forEach(btn => {
      btn.remove();
    });
  }

  function extractReadingFromNextLines(heading) {
    let node = heading.nextElementSibling;
    let steps = 0;

    while (node && steps < 6) {
      const text = cleanText(node.innerText || '');

      // 优先匹配“读音：そうこ”
      let m = text.match(/^(?:读音|假名|読み|かな)[：:]\s*([ぁ-ゖァ-ヿー]+)/);
      if (m) return cleanText(m[1]);

      // 兼容“倉庫｜そうこ｜中文”这种
      if (text.includes('｜') || text.includes('|')) {
        const parts = text.split(/[｜|]/).map(cleanText).filter(Boolean);
        if (parts.length >= 2 && hasJapanese(parts[0]) && hasKana(parts[1])) {
          return parts[1];
        }
      }

      // 遇到下一个标题就停
      if (/^H[2-4]$/.test(node.tagName)) break;

      node = node.nextElementSibling;
      steps++;
    }

    return '';
  }

  function normalizeHeadingWord(text) {
    return cleanText(text)
      .replace(/^\d+[.\s、]*/, '')
      .replace(/^第[一二三四五六七八九十0-9]+.*/, '')
      .trim();
  }

  function addButtonsToHeadings(scope) {
    scope.querySelectorAll('h2,h3,h4').forEach(h => {
      const old = h.querySelector('.jp-pronounce-btn');
      if (old) old.remove();

      const word = normalizeHeadingWord(h.innerText || '');
      if (!hasJapanese(word)) return;

      const reading = extractReadingFromNextLines(h);
      if (!reading || !hasKana(reading)) return;

      h.appendChild(makeBtn(reading));
    });
  }

  function addButtonsToPipeParagraphs(scope) {
    scope.querySelectorAll('p').forEach(p => {
      if (p.querySelector('.jp-pronounce-btn')) return;

      const text = cleanText(p.innerText || '');
      if (!text.includes('｜') && !text.includes('|')) return;

      const parts = text.split(/[｜|]/).map(cleanText).filter(Boolean);
      if (parts.length < 2) return;

      const word = parts[0];
      const reading = parts[1];

      if (!hasJapanese(word) || !hasKana(reading)) return;

      const span = document.createElement('span');
      span.textContent = word + ' ';
      span.appendChild(makeBtn(reading));

      p.innerHTML = '';
      p.appendChild(span);

      const rest = document.createTextNode('｜' + parts.slice(1).join('｜'));
      p.appendChild(rest);
    });
  }

  function scan() {
    const scopes = document.querySelectorAll(
      'article, .post-content, .kratos-post-content, .entry-content, .markdown-body, .post-body, .content, .post, .article'
    );
    const targetScopes = scopes.length ? scopes : [document];

    targetScopes.forEach(scope => {
      removeWrongButtons(scope);
      addButtonsToHeadings(scope);
      addButtonsToPipeParagraphs(scope);
    });
  }

  document.addEventListener('DOMContentLoaded', scan);
  window.addEventListener('pjax:success', scan);

  const mo = new MutationObserver(() => {
    clearTimeout(window.__jpPronounceScanTimer);
    window.__jpPronounceScanTimer = setTimeout(scan, 180);
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

  if (window.speechSynthesis && 'onvoiceschanged' in window.speechSynthesis) {
    window.speechSynthesis.onvoiceschanged = () => {};
  }

  setTimeout(scan, 300);
  setTimeout(scan, 1000);
  setTimeout(scan, 2200);
})();
