(function () {
  const start = new Date('2026-01-01T00:00:00+08:00').getTime();

  function updateRuntime() {
    const now = Date.now();
    let diff = Math.max(0, now - start);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    diff -= days * 1000 * 60 * 60 * 24;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    diff -= hours * 1000 * 60 * 60;

    const minutes = Math.floor(diff / (1000 * 60));
    diff -= minutes * 1000 * 60;

    const seconds = Math.floor(diff / 1000);

    const el = document.getElementById('site-runtime');
    if (el) {
      el.textContent = `${days}天${hours}小时${minutes}分${seconds}秒`;
    }
  }

  updateRuntime();
  setInterval(updateRuntime, 1000);
})();
