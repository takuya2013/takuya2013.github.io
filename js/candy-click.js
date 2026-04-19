(() => {
  if (window.__tinyCandyLoaded) return;
  window.__tinyCandyLoaded = true;

  const COLORS = [
    '#ff5c8a', '#ff7aa2', '#ff9f1c', '#ffd166',
    '#06d6a0', '#4cc9f0', '#1982c4', '#7b2cbf',
    '#c77dff', '#ff595e', '#8ac926', '#f15bb5'
  ];

  const GRAVITY = 0.33;
  const AIR = 0.996;
  const BOUNCE = 0.68;
  const FLOOR_PAD = 6;
  const dots = [];
  let ticking = false;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function makeDot(x, y) {
    const size = rand(4, 8);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const el = document.createElement('span');

    el.style.position = 'fixed';
    el.style.left = '0';
    el.style.top = '0';
    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.borderRadius = '999px';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '999999';
    el.style.willChange = 'transform, opacity';
    el.style.background = `radial-gradient(circle at 30% 30%, rgba(255,255,255,.95) 0%, rgba(255,255,255,.75) 18%, ${color} 42%, ${color} 100%)`;
    el.style.boxShadow = `0 1px 5px rgba(0,0,0,.14), 0 0 6px ${color}55`;

    document.body.appendChild(el);

    return {
      el,
      x,
      y,
      size,
      vx: rand(-7.5, 7.5),
      vy: rand(-11.5, -4.5),
      life: 0,
      maxLife: rand(95, 145),
      bounces: 0
    };
  }

  function burst(x, y) {
    const count = 24;
    for (let i = 0; i < count; i++) {
      const p = makeDot(x, y);
      const angle = (Math.PI * 2 * i) / count + rand(-0.18, 0.18);
      const speed = rand(3.8, 8.8);
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - rand(2.5, 6.5);
      dots.push(p);
    }

    if (!ticking) {
      ticking = true;
      requestAnimationFrame(step);
    }
  }

  function step() {
    const floor = window.innerHeight - FLOOR_PAD;

    for (let i = dots.length - 1; i >= 0; i--) {
      const p = dots[i];
      p.life += 1;

      p.vx *= AIR;
      p.vy += GRAVITY;

      p.x += p.vx;
      p.y += p.vy;

      const bottom = p.y + p.size * 0.5;
      if (bottom >= floor) {
        p.y = floor - p.size * 0.5;
        p.vy = -Math.abs(p.vy) * BOUNCE;
        p.vx *= 0.92;
        p.bounces += 1;

        if (Math.abs(p.vy) < 0.9) p.vy = 0;
      }

      const fade = 1 - Math.max(0, p.life - p.maxLife * 0.55) / (p.maxLife * 0.45);
      const alpha = Math.max(0, Math.min(1, fade));

      p.el.style.opacity = String(alpha);
      p.el.style.transform = `translate(${p.x}px, ${p.y}px) translate(-50%, -50%)`;

      const outX = p.x < -40 || p.x > window.innerWidth + 40;
      const dead = p.life > p.maxLife || (p.bounces > 5 && Math.abs(p.vy) < 0.2) || alpha <= 0 || outX;

      if (dead) {
        p.el.remove();
        dots.splice(i, 1);
      }
    }

    if (dots.length) {
      requestAnimationFrame(step);
    } else {
      ticking = false;
    }
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('.aplayer')) return;
    burst(e.clientX, e.clientY);
  }, { passive: true });
})();
