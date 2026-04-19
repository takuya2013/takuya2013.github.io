(() => {
  if (window.__spriteFollowerLoaded) return;
  window.__spriteFollowerLoaded = true;

  const old = document.getElementById('cursor-sprite');
  if (old) old.remove();

  const root = document.createElement('div');
  root.id = 'cursor-sprite';

  const body = document.createElement('div');
  body.className = 'sprite-body';
  root.appendChild(body);
  document.body.appendChild(root);

  let mouseX = window.innerWidth * 0.5;
  let mouseY = window.innerHeight * 0.5;
  let x = mouseX;
  let y = mouseY;
  let lastX = x;
  let facing = 1;

  const offsetX = 28;
  const offsetY = 20;
  const ease = 0.14;

  function onMove(e) {
    mouseX = e.clientX + offsetX;
    mouseY = e.clientY + offsetY;
  }

  function loop() {
    x += (mouseX - x) * ease;
    y += (mouseY - y) * ease;

    const dx = x - lastX;
    if (Math.abs(dx) > 0.2) {
      facing = dx >= 0 ? 1 : -1;
    }
    lastX = x;

    root.style.transform = `translate(${x}px, ${y}px)`;
    body.style.transform = `scaleX(${facing})`;

    requestAnimationFrame(loop);
  }

  document.addEventListener('mousemove', onMove, { passive: true });
  requestAnimationFrame(loop);
})();


/* === JP vocab pronounce addon === */
(() => {
  if (window.__jpVocabPronounceLoaded) return;
  window.__jpVocabPronounceLoaded = true;

  const BTN_STYLE = [
    'display:inline-flex',
    'align-items:center',
    'justify-content:center',
    'width:1.45em',
    'height:1.45em',
    'margin-left:.4em',
    'border:none',
    'border-radius:999px',
    'cursor:pointer',
    'font-size:.9em',
    'line-height:1',
    'background:rgba(255,255,255,.16)',
    'box-shadow:0 1px 4px rgba(0,0,0,.12)',
    'vertical-align:middle'
  ].join(';');

  function looksJapanese(text) {
    return /[\u3040-\u30ff\u3400-\u9fff]/.test(text || '');
  }

  function cleanText(text) {
    return (text || '')
      .replace(/（.*?）/g, ' ')
      .replace(/\(.*?\)/g, ' ')
      .replace(/[|｜]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function pickJapaneseVoice() {
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
    utter.rate = 0.95;
    utter.pitch = 1.0;
    utter.volume = 1.0;

    const voice = pickJapaneseVoice();
    if (voice) utter.voice = voice;

    window.speechSynthesis.speak(utter);
  }

  function makeBtn(text) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'jp-pronounce-btn';
    btn.textContent = '🔊';
    btn.setAttribute('aria-label', '播放发音');
    btn.setAttribute('title', '播放发音');
    btn.setAttribute('style', BTN_STYLE);
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      speak(text);
    });
    return btn;
  }

  function extractKanaFromText(text) {
    if (!text) return null;

    let m = text.match(/(?:假名|読み|かな)[：:]\s*([^\n]+)/);
    if (m) return cleanText(m[1]);

    m = text.match(/^[^｜|\n]+[｜|]\s*([^｜|\n]+)\s*[｜|]/m);
    if (m && looksJapanese(m[1])) return cleanText(m[1]);

    return null;
  }

  function enhanceListItems(scope) {
    scope.querySelectorAll('li').forEach(li => {
      if (li.querySelector('.jp-pronounce-btn')) return;

      const strong = li.querySelector('strong');
      const text = li.innerText || '';
      const kana = extractKanaFromText(text);

      let targetNode = strong;
      let speakText = kana;

      if (!targetNode) {
        const firstText = cleanText(text.split('\n')[0] || '');
        if (looksJapanese(firstText)) {
          targetNode = li;
          speakText = kana || firstText.split('：')[0];
        }
      } else {
        speakText = kana || cleanText(strong.innerText);
      }

      if (!targetNode || !speakText || !looksJapanese(speakText)) return;
      targetNode.appendChild(makeBtn(speakText));
    });
  }

  function enhanceTables(scope) {
    scope.querySelectorAll('table tr').forEach(tr => {
      if (tr.querySelector('.jp-pronounce-btn')) return;

      const cells = tr.querySelectorAll('th,td');
      if (cells.length < 2) return;

      const word = cleanText(cells[0].innerText);
      const kana = cleanText(cells[1].innerText);

      if (!looksJapanese(word) || !looksJapanese(kana)) return;

      cells[0].appendChild(makeBtn(kana || word));
    });
  }

  function enhancePipeParagraphs(scope) {
    scope.querySelectorAll('p').forEach(p => {
      if (p.querySelector('.jp-pronounce-btn')) return;
      const text = p.innerText || '';
      if (!text.includes('｜') && !text.includes('|')) return;

      const parts = text.split(/[｜|]/).map(s => cleanText(s));
      if (parts.length < 2) return;

      const word = parts[0];
      const kana = parts[1];

      if (!looksJapanese(word) || !looksJapanese(kana)) return;

      const span = document.createElement('span');
      span.textContent = word + ' ';
      span.appendChild(makeBtn(kana));
      p.innerHTML = p.innerHTML.replace(word, span.outerHTML);
    });
  }

  function enhanceRuby(scope) {
    scope.querySelectorAll('ruby').forEach(rb => {
      if (rb.querySelector('.jp-pronounce-btn')) return;
      const rt = rb.querySelector('rt');
      const base = cleanText(rb.childNodes[0] && rb.childNodes[0].textContent ? rb.childNodes[0].textContent : rb.textContent);
      const kana = rt ? cleanText(rt.textContent) : '';
      const text = kana || base;
      if (!looksJapanese(text)) return;
      rb.appendChild(makeBtn(text));
    });
  }

  function scan() {
    const scopes = document.querySelectorAll(
      'article, .post-content, .kratos-post-content, .entry-content, .markdown-body, .post-body, .content'
    );

    if (!scopes.length) {
      enhanceListItems(document);
      enhanceTables(document);
      enhancePipeParagraphs(document);
      enhanceRuby(document);
      return;
    }

    scopes.forEach(scope => {
      enhanceListItems(scope);
      enhanceTables(scope);
      enhancePipeParagraphs(scope);
      enhanceRuby(scope);
    });
  }

  document.addEventListener('DOMContentLoaded', scan);
  window.addEventListener('pjax:success', scan);

  // voices 可能异步加载
  if (window.speechSynthesis && typeof window.speechSynthesis.onvoiceschanged !== 'undefined') {
    window.speechSynthesis.onvoiceschanged = () => {};
  }

  setTimeout(scan, 300);
})();
