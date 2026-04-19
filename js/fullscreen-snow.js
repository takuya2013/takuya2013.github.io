(() => {
  if (window.__fullScreenSnowLoaded) return;
  window.__fullScreenSnowLoaded = true;

  const start = () => {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', start, { once: true });
      return;
    }

    const old = document.getElementById('fullscreen-snow');
    if (old) old.remove();

    const canvas = document.createElement('canvas');
    canvas.id = 'fullscreen-snow';
    canvas.style.position = 'fixed';
    canvas.style.left = '0';
    canvas.style.top = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.pointerEvents = 'none';
    canvas.style.zIndex = '99990';
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0;
    let h = 0;
    let flakes = [];

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    function makeFlake(resetTop = false) {
      return {
        x: Math.random() * w,
        y: resetTop ? -Math.random() * h : Math.random() * h,
        r: Math.random() * 2.2 + 1.2,
        vx: Math.random() * 0.4 - 0.2,
        vy: Math.random() * 0.8 + 0.5,
        sway: Math.random() * 0.02 + 0.004,
        phase: Math.random() * Math.PI * 2,
        alpha: Math.random() * 0.45 + 0.35
      };
    }

    function seed() {
      const count = window.innerWidth < 768 ? 55 : 95;
      flakes = Array.from({ length: count }, () => makeFlake());
    }

    function step() {
      ctx.clearRect(0, 0, w, h);

      for (const f of flakes) {
        f.phase += f.sway;
        f.x += f.vx + Math.sin(f.phase) * 0.35;
        f.y += f.vy;

        if (f.y > h + 12 || f.x < -20 || f.x > w + 20) {
          Object.assign(f, makeFlake(true), { x: Math.random() * w });
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${f.alpha})`;
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(step);
    }

    resize();
    seed();
    step();

    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resize();
        seed();
      }, 120);
    }, { passive: true });
  };

  start();
})();
