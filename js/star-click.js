(() => {
  const COLORS = ['#FFD54F', '#FFC107', '#FFE082', '#FFF3B0', '#FFEE58'];
  const SHAPES = ['★', '★', '✦', '⭐'];
  const STAR_COUNT = 9;
  const GRAVITY = 0.11;
  const LIFE = 82;

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function makeTrail(x, y, color) {
    const t = document.createElement('span');
    t.textContent = '•';
    t.style.position = 'fixed';
    t.style.left = x + 'px';
    t.style.top = y + 'px';
    t.style.pointerEvents = 'none';
    t.style.userSelect = 'none';
    t.style.zIndex = '999998';
    t.style.fontSize = rand(2, 4.5) + 'px';
    t.style.color = color;
    t.style.opacity = '0.42';
    t.style.textShadow = '0 0 6px rgba(255,215,64,.35), 0 0 12px rgba(255,235,120,.18)';
    t.style.transform = 'translate(-50%, -50%) scale(1)';
    t.style.transition = 'transform 0.36s ease, opacity 0.36s ease';
    document.body.appendChild(t);

    requestAnimationFrame(() => {
      t.style.opacity = '0';
      t.style.transform = 'translate(-50%, -50%) scale(0.2)';
    });

    setTimeout(() => t.remove(), 360);
  }

  function makeFlash(x, y) {
    const f = document.createElement('span');
    f.textContent = '✦';
    f.style.position = 'fixed';
    f.style.left = x + 'px';
    f.style.top = y + 'px';
    f.style.pointerEvents = 'none';
    f.style.userSelect = 'none';
    f.style.zIndex = '999997';
    f.style.fontSize = '12px';
    f.style.color = '#FFF8C6';
    f.style.opacity = '0.9';
    f.style.textShadow = '0 0 10px rgba(255,215,64,.7), 0 0 18px rgba(255,245,180,.45)';
    f.style.transform = 'translate(-50%, -50%) scale(0.4)';
    f.style.transition = 'transform 0.28s ease, opacity 0.28s ease';
    document.body.appendChild(f);

    requestAnimationFrame(() => {
      f.style.opacity = '0';
      f.style.transform = 'translate(-50%, -50%) scale(1.8)';
    });

    setTimeout(() => f.remove(), 280);
  }

  function createStar(x, y) {
    const el = document.createElement('span');
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    el.textContent = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    el.style.position = 'fixed';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.pointerEvents = 'none';
    el.style.userSelect = 'none';
    el.style.zIndex = '999999';
    el.style.fontSize = rand(8.5, 12.5) + 'px';
    el.style.color = color;
    el.style.textShadow = '0 0 6px rgba(255,215,64,.52), 0 0 14px rgba(255,235,120,.22)';
    el.style.transform = 'translate(-50%, -50%) rotate(0deg) scale(0.85)';
    el.style.willChange = 'transform, opacity, left, top';
    document.body.appendChild(el);

    return {
      el,
      color,
      x,
      y,
      vx: rand(-1.6, 1.6),
      vy: rand(-2.2, -0.8),   // 轻微上扬
      rot: rand(-12, 12),
      vr: rand(-3.5, 3.5),
      life: LIFE,
      maxLife: LIFE,
      trailTick: 0
    };
  }

  function burst(x, y) {
    makeFlash(x, y);

    const stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push(createStar(x + rand(-4, 4), y + rand(-4, 4)));
    }

    function tick() {
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.life -= 1;
        s.vy += GRAVITY;
        s.x += s.vx;
        s.y += s.vy;
        s.rot += s.vr;
        s.trailTick++;

        // 轨迹尾巴：像流星，但别太密
        if (s.trailTick % 3 === 0 && s.life > 14) {
          makeTrail(s.x, s.y, s.color);
        }

        // 提前淡出：还没真正掉下去就慢慢消失
        const opacity = Math.max((s.life / s.maxLife) * 0.95, 0);

        // 微闪烁
        const flicker = 0.92 + Math.sin((s.maxLife - s.life) * 0.34) * 0.10;
        const scale = (0.78 + opacity * 0.30) * flicker;

        s.el.style.left = s.x + 'px';
        s.el.style.top = s.y + 'px';
        s.el.style.opacity = opacity.toFixed(3);
        s.el.style.transform = `translate(-50%, -50%) rotate(${s.rot}deg) scale(${scale})`;

        if (s.life <= 0 || s.y > window.innerHeight + 18) {
          s.el.remove();
          stars.splice(i, 1);
        }
      }

      if (stars.length) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  document.addEventListener('click', (e) => {
    burst(e.clientX, e.clientY);
  }, { passive: true });
})();
