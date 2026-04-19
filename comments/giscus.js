(() => {
  const initGiscus = () => {
    const container = document.getElementById('giscus-container');
    if (!container) return;

    container.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'takuya2013/takuya2013.github.io');
    script.setAttribute('data-repo-id', 'R_kgDORm1FyQ');
    script.setAttribute('data-category', 'Announcements');
    script.setAttribute('data-category-id', 'DIC_kwDORm1Fyc4C4cRT');
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', 'preferred_color_scheme');
    script.setAttribute('data-lang', 'zh-CN');
    script.setAttribute('data-loading', 'lazy');
    script.setAttribute('crossorigin', 'anonymous');
    script.async = true;

    container.appendChild(script);
  };

  document.addEventListener('DOMContentLoaded', initGiscus);
  window.addEventListener('pjax:success', initGiscus);
})();
