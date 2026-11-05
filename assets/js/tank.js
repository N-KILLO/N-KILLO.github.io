/* 부산 바다 어항 — 메인 화면 장식 (2026-11-05)
 * - 하늘·바다 색: 부산 시간(KST) 기준 아침/낮/노을/야경, 시각 사이는 색을 섞는다.
 * - 폰 기울기(deviceorientation)로 물이 출렁이고 배·물고기가 쏠린다. 아이폰은 버튼으로 허용.
 * - PC는 마우스 좌우 위치로 기울기 흉내. 손을 안 대면 잔잔히 흔들림.
 * - 동작 줄이기 설정이면 정지 그림 한 장. 화면 밖이거나 탭이 숨으면 멈춘다.
 */
(function () {
  const tank = document.querySelector('.tank');
  if (!tank) return;
  const cv = tank.querySelector('canvas');
  const ctx = cv.getContext('2d');
  const label = tank.querySelector('.tank-label');
  const btn = tank.querySelector('.tilt-btn');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const L = tank.dataset;

  // ── 시간대 팔레트 (KST 시각 → 색) ──
  const P = {
    night:   { s1: '#0b1530', s2: '#1d2b55', w1: '#0d2240', w2: '#050d1c', city: '#141c33', bridge: '#2a3558', fish: '#6fd3c9', phase: 'night' },
    morning: { s1: '#f6b7a0', s2: '#fbe0c2', w1: '#5d8fb0', w2: '#1f4766', city: '#7a7f97', bridge: '#5b6380', fish: '#ffb27a', phase: 'morning' },
    day:     { s1: '#5fb3e8', s2: '#c9ecff', w1: '#2a8fc0', w2: '#0b4f7a', city: '#8aa3b8', bridge: '#55697d', fish: '#ffd166', phase: 'day' },
    sunset:  { s1: '#f08a4b', s2: '#ffcf8f', w1: '#9b5a6a', w2: '#2b2348', city: '#5a4560', bridge: '#46385a', fish: '#ffe08a', phase: 'sunset' },
  };
  const KEYS = [[0, 'night'], [5, 'night'], [6.5, 'morning'], [8, 'day'], [16.5, 'day'], [18, 'sunset'], [19.5, 'night'], [24, 'night']];
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`; };
  function kstHour() { const d = new Date(); return ((d.getUTCHours() + 9) % 24) + d.getUTCMinutes() / 60; }
  function palette(h) {
    for (let i = 0; i < KEYS.length - 1; i++) {
      const [h0, k0] = KEYS[i], [h1, k1] = KEYS[i + 1];
      if (h >= h0 && h <= h1) {
        const t = h1 === h0 ? 0 : (h - h0) / (h1 - h0), a = P[k0], b = P[k1], o = {};
        for (const c of ['s1', 's2', 'w1', 'w2', 'city', 'bridge', 'fish']) o[c] = mix(a[c], b[c], t);
        o.phase = h < 5 ? 'night' : h < 8 ? 'morning' : h < 17 ? 'day' : h < 19 ? 'sunset' : 'night'; // 라벨 경계 05·08·17·19시(색은 사이에서 서서히)
        o.dark = (k0 === 'night' ? 1 - t : 0) + (k1 === 'night' ? t : 0);
        return o;
      }
    }
    return Object.assign({ dark: 1 }, P.night, { phase: 'night' });
  }

  // ── 크기 ──
  let W = 0, H = 0, dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = tank.clientWidth; H = tank.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!running) draw(0);
  }

  // ── 고정 요소(빌딩 창문, 물고기) — 결정적 난수 ──
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const towers = Array.from({ length: 7 }, (_, i) => ({ x: 0.62 + i * 0.045 + rnd() * 0.01, w: 0.022 + rnd() * 0.012, h: 0.18 + rnd() * 0.2 }));
  const windows = towers.map((t) => Array.from({ length: 10 }, () => [rnd(), rnd()]));
  const fish = Array.from({ length: 6 }, () => ({ x: rnd(), y: 0.68 + rnd() * 0.26, v: (0.02 + rnd() * 0.03) * (rnd() < 0.5 ? -1 : 1), s: 0.7 + rnd() * 0.6, p: rnd() * 6 }));

  // ── 기울기 물리 ──
  let target = 0, tilt = 0, tv = 0, boatX = 0.3, boatV = 0, touched = false;
  const MAX = 0.2; // 최대 수면 기울기(라디안)
  function onOrient(e) {
    if (e.gamma == null) return;
    const ang = (screen.orientation && screen.orientation.angle) || 0;
    const g = ang === 90 ? e.beta : ang === 270 || ang === -90 ? -e.beta : e.gamma;
    target = Math.max(-1, Math.min(1, g / 40)) * MAX; touched = true;
  }
  if (!reduce) {
    const needAsk = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';
    if (needAsk && btn) {
      btn.hidden = false;
      btn.addEventListener('click', () => {
        DeviceOrientationEvent.requestPermission().then((s) => { if (s === 'granted') { addEventListener('deviceorientation', onOrient); btn.hidden = true; } }).catch(() => { btn.hidden = true; });
      });
    } else {
      addEventListener('deviceorientation', onOrient);
    }
    tank.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const r = tank.getBoundingClientRect();
      target = ((e.clientX - r.left) / r.width * 2 - 1) * MAX; touched = true;
    });
    tank.addEventListener('pointerleave', () => { if (!('ontouchstart' in window)) touched = false; });
  }

  function surfaceY(x, t) {
    const base = H * 0.56;
    return base - (x - W / 2) * Math.tan(tilt) + Math.sin(x * 0.018 + t * 1.4) * 2.2 + Math.sin(x * 0.047 - t * 2.1) * 1.2;
  }

  // ── 그리기 ──
  function draw(t) {
    const c = palette(kstHour());
    if (label) label.textContent = `${L.now} · ${L[c.phase]}`;
    // 하늘
    let g = ctx.createLinearGradient(0, 0, 0, H * 0.6);
    g.addColorStop(0, c.s1); g.addColorStop(1, c.s2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 해·달
    const h = kstHour();
    if (c.dark > 0.5) {
      ctx.fillStyle = 'rgba(255,248,220,.9)'; ctx.beginPath(); ctx.arc(W * 0.16, H * 0.2, 9, 0, 7); ctx.fill();
      ctx.fillStyle = c.s1; ctx.beginPath(); ctx.arc(W * 0.16 + 4, H * 0.2 - 2, 8, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      for (let i = 0; i < 18; i++) { const sx = (i * 97.3 % W), sy = (i * 41.7 % (H * 0.35)); ctx.fillRect(sx, sy, 1.2, 1.2); }
    } else {
      const k = Math.max(0, Math.min(1, (h - 6) / 13)), sx = W * (0.1 + k * 0.8), sy = H * (0.5 - Math.sin(k * Math.PI) * 0.36);
      ctx.fillStyle = c.phase === 'day' ? 'rgba(255,244,190,.95)' : 'rgba(255,214,150,.95)';
      ctx.beginPath(); ctx.arc(sx, sy, 11, 0, 7); ctx.fill();
    }
    // 마린시티 빌딩
    const hz = H * 0.56;
    towers.forEach((tw, i) => {
      const x = tw.x * W, w = tw.w * W, th = tw.h * H;
      ctx.fillStyle = c.city; ctx.fillRect(x, hz - th, w, th);
      if (c.dark > 0.3) {
        ctx.fillStyle = `rgba(255,220,140,${0.75 * c.dark})`;
        windows[i].forEach(([a, b]) => ctx.fillRect(x + 2 + a * (w - 5), hz - th + 3 + b * (th - 8), 1.6, 1.6));
      }
    });
    // 광안대교(현수교): 상판 + 주탑 2개 + 케이블
    const deck = hz - 6, t1 = W * 0.3, t2 = W * 0.56, top = deck - H * 0.2;
    ctx.strokeStyle = c.bridge; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-5, deck); ctx.lineTo(W + 5, deck); ctx.stroke();
    ctx.lineWidth = 4;
    [t1, t2].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, deck + 4); ctx.lineTo(x, top); ctx.stroke(); });
    ctx.lineWidth = 1.3;
    const cable = (x0, y0, x1, y1, sag) => { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + sag, x1, y1); ctx.stroke(); };
    cable(t1, top, t2, top, H * 0.17); cable(W * 0.02, deck - 2, t1, top, 2); cable(t2, top, W * 0.86, deck - 2, 2);
    // 다리 조명(야경)
    if (c.dark > 0.3) {
      for (let i = 0; i <= 40; i++) {
        const x = i / 40 * W, hue = (i * 9 + t * 40) % 360;
        ctx.fillStyle = `hsla(${hue},90%,65%,${0.85 * c.dark})`;
        ctx.fillRect(x, deck - 2, 2, 2);
      }
    }
    // 바다
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 6) ctx.lineTo(x, surfaceY(x, t));
    ctx.lineTo(W, H); ctx.closePath();
    g = ctx.createLinearGradient(0, hz - 20, 0, H);
    g.addColorStop(0, c.w1); g.addColorStop(1, c.w2);
    ctx.fillStyle = g; ctx.fill();
    // 물에 비친 불빛(야경)
    if (c.dark > 0.3) {
      for (let i = 0; i < 14; i++) {
        const x = (i + 0.5) / 14 * W, y0 = surfaceY(x, t) + 4, hue = (i * 26 + t * 40) % 360;
        ctx.fillStyle = `hsla(${hue},90%,65%,${0.25 * c.dark * (0.6 + 0.4 * Math.sin(t * 3 + i))})`;
        ctx.fillRect(x - 1, y0, 2, 10 + 6 * Math.sin(t * 2 + i));
      }
    }
    // 수면 하이라이트
    ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.2; ctx.beginPath();
    for (let x = 0; x <= W; x += 6) { const y = surfaceY(x, t); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.stroke();
    // 물고기
    fish.forEach((f) => {
      const x = f.x * W, y = Math.max(surfaceY(x, t) + 10, f.y * H + Math.sin(t * 1.5 + f.p) * 3), s = 6 * f.s, d = f.v < 0 ? -1 : 1;
      ctx.fillStyle = c.fish;
      ctx.beginPath(); ctx.ellipse(x, y, s, s * 0.5, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - d * s * 0.8, y); ctx.lineTo(x - d * s * 1.6, y - s * 0.5); ctx.lineTo(x - d * s * 1.6, y + s * 0.5); ctx.closePath(); ctx.fill();
    });
    // 배
    const bx = boatX * W, by = surfaceY(bx, t), slope = (surfaceY(bx + 4, t) - surfaceY(bx - 4, t)) / 8;
    ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.atan(slope));
    ctx.fillStyle = c.dark > 0.5 ? '#e9eef7' : '#1f2a36';
    ctx.beginPath(); ctx.moveTo(-14, -3); ctx.lineTo(14, -3); ctx.lineTo(10, 3); ctx.lineTo(-10, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c.dark > 0.5 ? '#ffd27a' : '#0f7a6c';
    ctx.beginPath(); ctx.moveTo(-1, -4); ctx.lineTo(-1, -20); ctx.lineTo(-11, -4); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(1, -6); ctx.lineTo(1, -17); ctx.lineTo(9, -6); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ── 움직임 ──
  let running = false, last = 0, clock = 0;
  function step(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; clock += dt;
    const goal = touched ? target : Math.sin(clock * 0.6) * 0.05;
    tv += ((goal - tilt) * 6 - tv * 2.2) * dt; tilt += tv * dt * 6;
    // tilt>0이면 오른쪽 수면이 높아지므로(surfaceY) 배·물고기는 낮은 왼쪽으로
    boatV -= Math.sin(tilt) * 0.9 * dt; boatV *= 0.985; boatX += boatV * dt;
    if (boatX < 0.06) { boatX = 0.06; boatV = Math.abs(boatV) * 0.4; }
    if (boatX > 0.94) { boatX = 0.94; boatV = -Math.abs(boatV) * 0.4; }
    fish.forEach((f) => { f.x += (f.v - Math.sin(tilt) * 0.05) * dt; if (f.x < -0.05) f.x = 1.05; if (f.x > 1.05) f.x = -0.05; });
    draw(clock);
    requestAnimationFrame(step);
  }
  function play(on) {
    if (reduce) return;
    if (on && !running) { running = true; last = 0; requestAnimationFrame(step); }
    if (!on) running = false;
  }
  new ResizeObserver(resize).observe(tank);
  resize();
  draw(0);
  if (!reduce) {
    let visible = true;
    new IntersectionObserver((es) => { visible = es[0].isIntersecting; play(visible && !document.hidden); }).observe(tank);
    document.addEventListener('visibilitychange', () => play(visible && !document.hidden));
    setInterval(() => { if (!running) draw(clock); }, 60000); // 멈춰 있어도 1분마다 시간대 갱신
  }
})();
