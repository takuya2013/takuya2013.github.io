(() => {
  if (window.__jpTTSLoaded) return;
  window.__jpTTSLoaded = true;

  const synth = window.speechSynthesis;
  let voices = [];

  function loadVoices() {
    voices = synth ? synth.getVoices() : [];
  }

  if (synth) {
    loadVoices();
    if (typeof synth.onvoiceschanged !== 'undefined') {
      synth.onvoiceschanged = loadVoices;
    }
  }

  function pickJapaneseVoice() {
    if (!voices.length) loadVoices();
    return (
      voices.find(v => /^ja[-_]/i.test(v.lang) && /female|woman|kyoko|otoya|haruka|sayaka|japan/i.test(v.name)) ||
      voices.find(v => /^ja[-_]/i.test(v.lang)) ||
      null
    );
  }

  function speakText(text, btn) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;

    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    const voice = pickJapaneseVoice();
    if (voice) u.voice = voice;
    u.lang = voice?.lang || 'ja-JP';
    u.rate = 0.92;
    u.pitch = 1.04;

    const clear = () => {
      document.querySelectorAll('.jp-tts.is-speaking').forEach(el => el.classList.remove('is-speaking'));
    };

    u.onstart = () => {
      clear();
      if (btn) btn.classList.add('is-speaking');
    };
    u.onend = clear;
    u.onerror = clear;

    window.speechSynthesis.speak(u);
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.jp-tts');
    if (!btn) return;
    e.preventDefault();
    const text = btn.getAttribute('data-reading') || btn.getAttribute('data-text') || '';
    if (text.trim()) speakText(text.trim(), btn);
  }, { passive: false });
})();
