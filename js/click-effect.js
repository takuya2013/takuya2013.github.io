(() => {
  if (window.__candyClickLoaded) return;
  window.__candyClickLoaded = true;

  const COLORS = [
    '#ff5c8a', '#ff9f1c', '#ffd166', '#06d6a0',
    '#4cc9f0', '#7b2cbf', '#f15bb5', '#8ac926',
    '#1982c4', '#ff595e', '#c77dff', '#ffca3a'
  ];

  const GRAVITY = 0.45;
  const AIR = 0.995;
  const BOUNCE = 0.62;
  const SPIN_DAMP = 0.985;
  const GROUND_PADDING = 10;

  const items = [];
  let ticking = false;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createCandy(x, y) {
    const el = document.createElement('span');
    const w = rand(10, 18);
    const h = rand(16, 28);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const shine = 'rgba(255,255,255,.92)';

    el.style.position = 'fixed';
    el.style.left = '0';
    el.style.top = '0';
    el.style.width = `${w}px`;
    el.style.height = `${h}px`;
    el.style.pointerEvents = 'none';
    el.style.zIndex = '999999';
    el.style.borderRadius = `${Math.max(w, h)}px`;
    el.style.background = `linear-gradient(145deg, ${shine} 0%, ${color} 26%, ${color} 72%, rgba(0,0,0,.10) 100%)`;
    el.style.boxShadow = `0 2px 8px rgba(0,0,0,.18), inset 0 1px 0 rgba(255,255,255,.45)`;
    el.style.willChange = 'transform, opacity';
    document.body.appendChild(el);

    return {
      el,
      x,
      y,
      vx: rand(-7.2, 7.2),
      vy: rand(-11.5, -4.8),
      rot: rand(-180, 180),
      vr: rand(-18, 18),
      scale: rand(0.9, 1.15),
      life: 0,
      maxLife: rand(95, 145),
      floorBounces: 0,
      w,
      h
    };
  }

  function spawnBurst(x, y) {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const c = createCandy(x, y);
      const angle = (Math.PI * 2 * i) / count + rand(-0.12, 0.12);
      const speed = rand(4.5, 9.5);
      c.vx = Math.cos(angle) * speed;
      c.vy = Math.sin(angle) * speed - rand(3.5, 7.5);
      items.push(c);
    }
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(step);
    }
  }

  function step() {
    const ground = window.innerHeight - GROUND_PADDING;
    for (let i = items.length - 1; i >= 0; i--) {
      const p = items[i];
      p.life += 1;

      p.vx *= AIR;
      p.vy += GRAVITY;
      p.vr *= SPIN_DAMP;

      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;

      const bottom = p.y + p.h * p.scale * 0.5;

      if (bottom >= ground) {
        p.y = ground - p.h * p.scale * 0.5;
        p.vy = -Math.abs(p.vy) * BOUNCE;
        p.vx *= 0.9;
        p.vr *= 0.9;
        p.floorBounces += 1;

        if (Math.abs(p.vy) < 1.2) {
          p.vy = 0;
        }
      }

      const alphaLife = 1 - Math.max(0, p.life - p.maxLife * 0.55) / (p.maxLife * 0.45);
      const alpha = Math.max(0, Math.min(1, alphaLife));
      p.el.style.opacity = String(alpha);
      p.el.style.transform =
        `translate(${p.x}px, ${p.y}px) translate(-50%, -50%) rotate(${p.rot}deg) scale(${p.scale})`;

      const outX = p.x < -40 || p.x > window.innerWidth + 40;
      const dead = p.life > p.maxLife || (p.floorBounces > 4 && Math.abs(p.vy) < 0.2) || alpha <= 0 || outX;

      if (dead) {
        p.el.remove();
        items.splice(i, 1);
      }
    }

    if (items.length) {
      requestAnimationFrame(step);
    } else {
      ticking = false;
    }
  }

  document.addEventListener('click', (e) => {
    if (e.target.closest('.aplayer')) return;
    spawnBurst(e.clientX, e.clientY);
  }, { passive: true });
})();
