/* ============================================================
   부산 로컬노트 · ASCII TERMINAL EDITION
   실시간 ASCII 장면 엔진 (5 scenes, 캔버스 문자 그리드)
   ============================================================ */
(function () {
  'use strict';

  var cvs = document.getElementById('ascii');
  if (!cvs) return;
  var ctx = cvs.getContext('2d', { alpha: false });
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var FS = 12;                 // 글자 크기(css px)
  var LH = 1.18;               // 행 간격 배수
  var FONT = FS + 'px "IBM Plex Mono","Nanum Gothic Coding",ui-monospace,SFMono-Regular,Menlo,Consolas,monospace';

  var W = 0, H = 0, dpr = 1, cw = 7.2, ch = 14, cols = 0, rows = 0;
  var charBuf = null, slotBuf = null;
  var bgGrad = null;

  /* ---------- 유틸 ---------- */
  function hash(x, y) {
    var n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function smooth(v) { return v * v * (3 - 2 * v); }

  /* ---------- 문자 그리드 ---------- */
  var g = {
    cols: 0, rows: 0,
    put: function (cx, cy, chr, slot) {
      if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return;
      var i = cy * cols + cx;
      var s = slotBuf[i];
      if (s === 255 || slot >= s) { slotBuf[i] = slot; charBuf[i] = typeof chr === 'number' ? chr : chr.charCodeAt(0); }
    },
    clear: function (cx, cy) {
      if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return;
      slotBuf[cy * cols + cx] = 255;
    },
    glow: function (cx, cy, rc, color) {
      var px = cx * cw, py = cy * ch, r = rc * cw;
      if (r < 1) return;
      var grd = ctx.createRadialGradient(px, py, 0, px, py, r);
      grd.addColorStop(0, color);
      grd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = grd;
      ctx.fillRect(px - r, py - r, r * 2, r * 2);
      ctx.globalCompositeOperation = 'source-over';
    },
    hash: hash
  };

  /* ============================================================
     1. 광안대교 밤바다 · GWANGAN NIGHT SEA
     ============================================================ */
  var gwangan = {
    name: 'GWANGAN NIGHT SEA',
    sky: ['#02060c', '#05131e', '#0a2432'],
    pal: ['#12303c','#17495a','#1f667a','#2a8496','#38a4b4','#52c4ce','#8ee6e6','#d8f8f6', '#7a4a22','#c07c28','#ffc07a','#fff0d6'],
    draw: function (t) {
      var hz = Math.round(rows * 0.66);
      var deck = hz - 7;
      var t1 = Math.round(cols * 0.295), t2 = Math.round(cols * 0.705);
      var top = Math.max(2, deck - Math.round(rows * 0.21));
      var xa = Math.round(cols * 0.02), xb = Math.round(cols * 0.98);
      var x, y;

      /* 별 */
      for (y = 0; y < deck - 2; y++) {
        for (x = 0; x < cols; x++) {
          var r = hash(x, y);
          if (r > 0.9955) {
            var tw = 0.5 + 0.5 * Math.sin(t * 1.7 + r * 90);
            g.put(x, y, r > 0.9985 ? '+' : '.', tw > 0.72 ? 6 : 2);
          }
        }
      }
      /* 달 */
      var mx = cols * 0.865, my = rows * 0.125;
      for (var yy = Math.floor(my) - 3; yy <= my + 3; yy++) {
        for (var xx = Math.floor(mx) - 4; xx <= mx + 4; xx++) {
          var d = Math.sqrt(Math.pow((xx - mx) * 0.55, 2) + Math.pow(yy - my, 2));
          if (d < 1.05) g.put(xx, yy, 'O', 7);
          else if (d < 1.85) g.put(xx, yy, 'o', 6);
          else if (d < 2.9 && hash(xx, yy) > 0.55) g.put(xx, yy, '.', 3);
        }
      }

      /* 주탑 */
      var deckY = function (cx) { return deck + Math.round(Math.abs(cx - cols / 2) / (cols * 0.5) * 1.5); };
      var towers = [t1, t2];
      for (var ti = 0; ti < towers.length; ti++) {
        var tx = towers[ti];
        for (y = top; y <= deckY(tx); y++) g.put(tx, y, y === top ? '#' : '|', 4);
        g.put(tx, top - 1, (Math.sin(t * 1.2 + ti) > -0.4) ? 'o' : '.', 11);
        g.put(tx - 1, top, '=', 6); g.put(tx + 1, top, '=', 6);
        g.put(tx - 1, top + 2, ':', 3); g.put(tx + 1, top + 2, ':', 3);
        g.glow(tx, top - 1, 3, 'rgba(255,150,80,0.18)');
      }

      /* 케이블 */
      var seg = function (from, to, fn) {
        var step = from <= to ? 1 : -1;
        for (var cx = from; step > 0 ? cx <= to : cx >= to; cx += step) {
          var y0 = Math.round(fn(cx));
          var y1 = Math.round(fn(cx + step));
          g.put(cx, y0, y1 > y0 ? '\\' : (y1 < y0 ? '/' : '-'), 3);
        }
      };
      seg(xb, t2, function (cx) { var u = (cx - t2) / (xb - t2); return top + (deckY(cx) - top) * Math.pow(u, 1.6); });
      seg(t2, t1, function (cx) { var u = (cx - t1) / (t2 - t1); return top + (deckY(cx) - top - 3) * Math.pow(Math.sin(Math.PI * u), 0.65); });
      seg(t1, xa, function (cx) { var u = (t1 - cx) / (t1 - xa); return top + (deckY(cx) - top) * Math.pow(u, 1.6); });

      /* 상판 */
      for (x = xa; x <= xb; x++) {
        var dy = deckY(x);
        if (x % 7 === 0) {
          g.put(x, dy, '=', 4);
          g.put(x, dy - 1, 'o', 10);
        } else {
          g.put(x, dy, '-', 3);
          if (x % 3 === 0) g.put(x, dy - 1, '.', 2);
        }
      }
      /* 수직 케이블(hanger) */
      for (x = t1 + 3; x < t2 - 2; x += 6) {
        var hy = Math.round(top + (deckY(x) - top - 3) * Math.pow(Math.sin(Math.PI * (x - t1) / (t2 - t1)), 0.65));
        for (var hy2 = hy + 1; hy2 < deckY(x); hy2++) g.put(x, hy2, '|', 1);
      }

      /* 수면 */
      var wlen = Math.max(1, rows - hz);
      for (y = hz; y < rows; y++) {
        var dep = (y - hz) / wlen;
        var rph = hash(y, 41) * 6.28;
        var rfq = 0.055 + hash(y, 7) * 0.10;
        for (x = 0; x < cols; x++) {
          var v = Math.sin(x * rfq + rph + t * 0.85) + 0.45 * Math.sin(x * rfq * 2.7 - t * 1.5 + rph * 1.7);
          var chr, slot;
          if (hash(x >> 2, y + 5) > 0.955) continue;
          if (v > 0.95) { chr = '~'; slot = 6; }
          else if (v > 0.35) { chr = '-'; slot = 5; }
          else if (v > -0.3) { chr = '.'; slot = 4; }
          else if (hash(x, y) > 0.94) { chr = '.'; slot = 3; }
          else continue;
          slot = Math.max(0, slot - Math.round(dep * 3));
          g.put(x, y, chr, slot);
        }
      }
      /* 등불 반사 */
      for (var lx = xa; lx <= xb; lx += 7) {
        var base = deckY(lx) + 1;
        for (var k = 0; k < 4; k++) {
          var ry = base + k;
          if (ry >= rows) break;
          var wob = Math.round(Math.sin(t * 2.0 + k * 1.3 + lx * 0.45));
          if (k > 2 && hash(lx, k) > 0.6) continue;
          g.put(lx + wob, ry, k < 2 ? 'o' : (k < 4 ? ':' : '.'), k < 2 ? 10 : (k < 4 ? 9 : 5));
        }
      }
      g.glow(cols * 0.5, deck, cols * 0.45, 'rgba(255,168,92,0.09)');
      g.glow(cols * 0.5, deck, cols * 0.15, 'rgba(255,190,120,0.09)');
      g.glow(mx, my, cols * 0.05, 'rgba(160,220,235,0.09)');
    }
  };


  /* ============================================================
     2. 영도 비 오는 밤 · YEONGDO RAIN
     ============================================================ */
  var yeongdo = {
    name: 'YEONGDO RAIN',
    sky: ['#020708', '#05100f', '#081a19'],
    pal: ['#0c3336','#124a4d','#1a6365','#26807f','#36a09e','#56c2bd','#8edcd6','#e0f8f2', '#3d5570','#7e9cbb','#bcd6ee','#f0f8ff'],
    state: null,
    draw: function (t, m) {
      var s = this.state;
      if (!s) {
        s = this.state = { drops: [], splash: [], last: t };
        for (var i = 0; i < 210; i++) {
          s.drops.push({
            x: Math.random() * cols,
            y: Math.random() * rows,
            v: 24 + Math.random() * 34,
            l: 2 + (Math.random() * 2 | 0)
          });
        }
      }
      var dt = Math.min(0.05, Math.max(0.001, t - s.last));
      s.last = t;

      var ground = function (x) {
        return rows * (0.655 + 0.075 * Math.sin(x * 0.035 + 1.1) + 0.035 * Math.sin(x * 0.11 + 0.4));
      };

      /* 별 (비구름 사이) */
      for (var y = 0; y < rows * 0.4; y++) {
        for (var x = 0; x < cols; x++) {
          if (hash(x, y) > 0.9972) g.put(x, y, '.', 3);
        }
      }

      /* 지형: 어두운 덩어리 + 능선 + 풀 */
      for (var gx = 0; gx < cols; gx++) {
        var gy = Math.round(ground(gx));
        g.put(gx, gy, hash(gx, 1) > 0.55 ? '#' : '%', 4);
        for (var yy = gy + 1; yy < rows; yy++) {
          var rr = hash(gx, yy);
          if (yy < gy + 3) {
            if (rr > 0.42) g.put(gx, yy, rr > 0.75 ? '%' : '&', 2);
          } else {
            var span = hash(gx, yy);
            if (span > 0.86) g.put(gx, yy, span > 0.96 ? '#' : '%', 1);
          }
        }
        if (hash(gx, 3) > 0.6) g.put(gx, gy - 1, hash(gx, 5) > 0.5 ? '"' : "'", 3);
        if (hash(gx, 7) > 0.86) g.put(gx, gy - 2, ',', 2);
        if (hash(gx, 9) > 0.45) {
          var py = gy + 1 + (hash(gx, 11) > 0.7 ? 1 : 0);
          if (hash(gx, 13) > 0.55) g.put(gx, py, hash(gx, 15) > 0.5 ? '~' : '.', 2);
        }
      }

      /* 빗줄기 */
      for (var di = 0; di < s.drops.length; di++) {
        var d = s.drops[di];
        d.y += d.v * dt;
        d.x += d.v * dt * 0.05;
        var cx = Math.round(d.x);
        if (d.y > rows + 1 || cx >= cols) {
          d.y = -Math.random() * rows * 0.5;
          d.x = Math.random() * cols;
        }
        for (var k = 0; k < d.l; k++) {
          g.put(cx - (k > 0 ? 1 : 0), Math.round(d.y) - k, k === 0 ? '|' : '/', k === 0 ? 7 : 5);
        }
        var hit = Math.round(ground(clamp(cx, 0, cols - 1)));
        if (Math.round(d.y) >= hit) {
          s.splash.push({ x: d.x, y: hit, t: t });
          d.y = -Math.random() * rows * 0.5;
          d.x = Math.random() * cols;
        }
        if (s.splash.length > 120) s.splash.shift();
      }
      if (m.active && Math.random() < 0.2) {
        var mgx = Math.round(m.x * cols);
        s.splash.push({ x: mgx, y: Math.round(ground(clamp(mgx, 0, cols - 1))), t: t });
      }

      /* 파문 */
      var keep = [];
      for (var si = 0; si < s.splash.length; si++) {
        var p = s.splash[si];
        var age = (t - p.t) / 0.95;
        if (age > 1) continue;
        keep.push(p);
        var rad = age * 3.0 + 0.35;
        var n = Math.max(5, Math.round(rad * 3.2));
        for (var i2 = 0; i2 < n; i2++) {
          var ang = i2 / n * Math.PI * 2;
          var px = Math.round(p.x + Math.cos(ang) * rad * 1.9);
          var py2 = Math.round(p.y + Math.sin(ang) * rad * 0.45);
          var slot = age < 0.25 ? 11 : (age < 0.5 ? 10 : (age < 0.75 ? 8 : 6));
          g.put(px, py2, rad < 1.1 ? '*' : (rad < 2 ? 'o' : (rad < 2.8 ? '.' : "'")), slot);
        }
      }
      s.splash = keep;

      g.glow(cols * 0.5, rows * 0.75, cols * 0.5, 'rgba(80,160,165,0.06)');
    }
  };

  /* ============================================================
     3. 황령산 부산 야경 · HWANGNYEONGSAN
     ============================================================ */
  var hwangnyeong = {
    name: 'HWANGNYEONGSAN CITYLIGHT',
    sky: ['#03040c', '#080a1c', '#131030'],
    pal: ['#141636','#20225a','#2e2f76','#43429a','#5d5ab8','#837fd6','#b6b2e8','#eeebfb', '#7a4c1e','#c4852a','#ffcf7d','#fff6da'],
    draw: function (t, m) {
      var cityTop = Math.round(rows * 0.42);
      var cityBot = Math.round(rows * 0.90);
      var x, y;

      /* 별 */
      for (y = 0; y < rows * 0.3; y++) {
        for (x = 0; x < cols; x++) {
          var r = hash(x, y);
          if (r > 0.994) {
            var tw = 0.5 + 0.5 * Math.sin(t * 1.8 + r * 70);
            g.put(x, y, r > 0.999 ? '+' : '.', tw > 0.66 ? 6 : 3);
          }
        }
      }
      /* 먼 산 능선 */
      for (x = 0; x < cols; x++) {
        var ry = Math.round(rows * (0.385 + 0.022 * Math.sin(x * 0.045 + 1.3) + 0.012 * Math.sin(x * 0.17 + 0.5)));
        g.put(x, ry, '^', 3);
        for (var k = 1; k < 3; k++) if (hash(x, k) > 0.4) g.put(x, ry + k, '#', 1);
      }
      /* 도시 불빛: 구역(블록) 단위로 모여 빛난다 */
      for (y = cityTop; y < cityBot; y++) {
        var band = (y - cityTop) / (cityBot - cityTop);
        var bandFade = Math.exp(-Math.pow((band - 0.45) * 2.2, 2));
        var cellY = Math.floor((y - cityTop) / 5);
        for (x = 0; x < cols; x++) {
          var cellX = Math.floor(x / 9);
          var seed = hash(cellX, cellY + 101);
          var dens = (seed > 0.45 ? 0.34 : 0.035) * bandFade;
          if (hash(x, y) < dens) {
            var rr2 = hash(y, x);
            var tw2 = 0.5 + 0.5 * Math.sin(t * (0.6 + rr2 * 3.2) + rr2 * 60 + seed * 9);
            var warm = rr2 > 0.2;
            var chr = rr2 > 0.8 ? 'o' : (rr2 > 0.42 ? '*' : '.');
            g.put(x, y, chr, tw2 > 0.7 ? (warm ? 10 : 5) : (warm ? 9 : 4));
          }
        }
      }
      /* 도로: 어두운 선 위로 차 불빛이 흐른다 */
      for (var ri = 0; ri < 2; ri++) {
        for (x = 0; x < cols; x++) {
          var roadY = Math.round(rows * ((ri ? 0.615 : 0.755) + 0.035 * Math.sin(x * 0.013 + ri * 2.4)));
          if (roadY < cityTop || roadY > cityBot) continue;
          var phase = (x * 0.55 + t * (ri ? 9 : 13) + ri * 5) % 14;
          if (phase < 2.2) g.put(x, roadY, 'o', 10);
          else if (hash(x >> 1, roadY) > 0.35) g.put(x, roadY, '.', 3);
        }
      }
      /* 안개 */
      for (var bi = 0; bi < 3; bi++) {
        var by = Math.round(rows * (0.545 + 0.1 * bi));
        for (x = 0; x < cols; x++) {
          var f = Math.sin(x * 0.028 + t * 0.22 + bi * 2.1);
          if (f > 0.74 && hash(x, by) > 0.4) g.put(x, by, f > 0.94 ? '-' : '~', 2);
        }
      }
      /* 앞쪽 능선 + 전망 타워 */
      var nearY = function (x2) { return rows * (0.885 + 0.012 * Math.sin(x2 * 0.05)); };
      for (x = 0; x < cols; x++) {
        var ny = Math.round(nearY(x));
        g.put(x, ny, '^', 2);
        for (var k2 = 1; k2 < 5; k2++) if (hash(x, k2 + 5) > 0.35) g.put(x, ny + k2, '#', 1);
      }
      var tw3 = Math.round(cols * 0.615);
      var baseY = Math.round(nearY(tw3));
      for (var ty = baseY - 9; ty <= baseY; ty++) g.put(tw3, ty, ty === baseY - 9 ? '+' : '|', 4);
      var blink = Math.sin(t * 2.2) > 0.15;
      g.put(tw3, baseY - 10, blink ? '*' : '.', 11);
      g.glow(tw3, baseY - 10, 4, blink ? 'rgba(255,110,80,0.3)' : 'rgba(255,110,80,0.1)');
      g.glow(cols * 0.5, rows * 0.66, cols * 0.55, 'rgba(255,170,90,0.07)');
    }
  };

  /* ============================================================
     4. 해운대 윤슬 · HAEUNDAE MOONLIGHT
     ============================================================ */
  var haeundae = {
    name: 'HAEUNDAE MOONLIGHT',
    sky: ['#02040d', '#040b18', '#08152c'],
    pal: ['#0f1e33','#162e4a','#20406a','#2e5a8c','#417cb0','#64a0c8','#b0d2e6','#f0f8ff', '#8a7440','#c9b078','#ffeeb0','#fffff0'],
    draw: function (t, m) {
      var hz = Math.round(rows * 0.54);
      var mx = cols * 0.735, my = rows * 0.17;
      var x, y;

      /* 별 */
      for (y = 0; y < hz - 2; y++) {
        for (x = 0; x < cols; x++) {
          var r = hash(x, y);
          if (r > 0.9935) {
            var tw = 0.5 + 0.5 * Math.sin(t * 1.3 + r * 80);
            g.put(x, y, r > 0.9986 ? '+' : '.', tw > 0.7 ? 6 : 3);
          }
        }
      }
      /* 달 */
      for (var yy = Math.floor(my) - 4; yy <= my + 4; yy++) {
        for (var xx = Math.floor(mx) - 5; xx <= mx + 5; xx++) {
          var d = Math.sqrt(Math.pow((xx - mx) * 0.52, 2) + Math.pow(yy - my, 2));
          if (d < 1.0) g.put(xx, yy, 'O', 11);
          else if (d < 1.9) g.put(xx, yy, 'o', 10);
          else if (d < 2.7 && hash(xx, yy) > 0.2) g.put(xx, yy, '.', 7);
        }
      }
      /* 왼쪽 스카이라인 (마린시티) */
      var blds = [[0.035, 6, 3], [0.068, 3, 2], [0.095, 8, 2], [0.122, 5, 3], [0.158, 7, 2],
                  [0.19, 2, 4], [0.222, 5, 2], [0.25, 3, 3], [0.28, 6, 2], [0.315, 2, 3]];
      for (var bi = 0; bi < blds.length; bi++) {
        var bx = Math.round(cols * blds[bi][0]);
        var bh = blds[bi][1];
        var bw = Math.max(2, blds[bi][2] + Math.round(hash(bi, 3) * 2));
        for (var by = hz - bh; by < hz; by++) {
          for (var bxx = bx; bxx < bx + bw; bxx++) {
            if (by === hz - bh) g.put(bxx, by, '-', 3);
            else if (hash(bxx * 2, by * 3) > 0.74) g.put(bxx, by, 'o', 8);
            else if (bxx === bx && hash(bxx, by) > 0.4) g.put(bxx, by, '|', 1);
          }
        }
      }
      /* 수면 */
      var wlen = Math.max(1, rows - hz);
      for (y = hz; y < rows; y++) {
        var dep = (y - hz) / wlen;
        var pathW = 0.02 + 0.26 * Math.pow(dep, 0.8);
        for (x = 0; x < cols; x++) {
          var dist = Math.abs(x / cols - mx / cols);
          if (dist < pathW) {
            var near = 1 - dist / pathW;
            var flick = hash(x, y * 5 + Math.floor(t * 8));
            if (flick < 0.16 + 0.62 * near) {
              var chr = near > 0.55 ? (flick < 0.28 ? '*' : "'") : (flick < 0.45 ? '.' : ',');
              g.put(x, y, chr, near > 0.5 ? 11 : (near > 0.22 ? 10 : 9));
              continue;
            }
          }
          var hph = hash(y, 23) * 6.28;
          var v = Math.sin(x * (0.05 + hash(y, 31) * 0.09) + hph + t * 0.7) + 0.4 * Math.sin(x * 0.27 - t * 1.2 + hph);
          var c2, s2;
          if (v > 0.85) { c2 = '~'; s2 = 6; }
          else if (v > 0.2) { c2 = '-'; s2 = 5; }
          else if (v > -0.5) { c2 = '.'; s2 = 4; }
          else if (hash(x, y) > 0.94) { c2 = '.'; s2 = 3; }
          else continue;
          g.put(x, y, c2, Math.max(0, s2 - Math.round(dep * 3)));
        }
      }
      /* 마우스 잔물결 */
      if (m.active) {
        var rr3 = (t * 0.9) % 1;
        var cy2 = hz + 1 + Math.round(rr3 * (rows - hz - 2));
        var width = 2 + rr3 * 5;
        var mcx = Math.round(m.x * cols);
        for (var i = -width; i <= width; i++) {
          if (hash(mcx + i, cy2) > 0.4) g.put(mcx + i, cy2, rr3 < 0.5 ? '*' : '.', 8);
        }
      }
      g.glow(mx, my, cols * 0.07, 'rgba(255,240,200,0.14)');
      g.glow(mx, rows * 0.76, cols * 0.1, 'rgba(200,230,255,0.06)');
    }
  };

  /* ============================================================
     5. 남포·감천 바람 · GAMCHEON BREEZE
     ============================================================ */
  var gamcheon = {
    name: 'GAMCHEON BREEZE',
    sky: ['#05030f', '#0e081c', '#1b0f28'],
    pal: ['#1e1536','#2e1d4e','#422866','#5a357c','#774799','#9a639f','#c08fae','#f0d0d2', '#7a4119','#c4712a','#ffc070','#fff0d2'],
    state: null,
    draw: function (t, m) {
      var s = this.state;
      if (!s) {
        s = this.state = { blocks: [], wind: [] };
        for (var band = 0; band < 5; band++) {
          var baseY = Math.round(rows * (0.535 + 0.098 * band));
          var xcur = Math.round(cols * (0.02 + 0.012 * band));
          while (xcur < cols) {
            var w = 3 + Math.round(hash(band, xcur) * 3);
            var h = 2 + Math.round(hash(band + 7, xcur) * 3);
            s.blocks.push({ x: xcur, y: baseY, w: w, h: h, band: band });
            xcur += w + 4 + Math.round(hash(band + 3, xcur) * 5);
          }
        }
        for (var i = 0; i < 34; i++) {
          s.wind.push({
            x: Math.random() * cols, y: 0.08 + Math.random() * 0.5,
            v: 7 + Math.random() * 13, len: 3 + (Math.random() * 4 | 0),
            ph: Math.random() * 6
          });
        }
      }
      /* 별 */
      for (var y = 0; y < rows * 0.42; y++) {
        for (var x = 0; x < cols; x++) {
          var r = hash(x, y);
          if (r > 0.994) {
            var tw = 0.5 + 0.5 * Math.sin(t * 1.5 + r * 60);
            g.put(x, y, r > 0.998 ? '+' : '.', tw > 0.7 ? 6 : 3);
          }
        }
      }
      /* 뒤쪽 언덕 실루엣 */
      for (var hx = 0; hx < cols; hx++) {
        var hillY = Math.round(rows * (0.475 + 0.03 * Math.sin(hx * 0.02 + 0.6)));
        g.put(hx, hillY, hash(hx, 61) > 0.5 ? '^' : '.', 3);
        if (hash(hx, 63) > 0.7) g.put(hx, hillY + 1, '#', 2);
      }
      /* 계단/담장 선 */
      for (var band2 = 0; band2 < 5; band2++) {
        var ly = Math.round(rows * (0.535 + 0.098 * band2)) + 1;
        for (var lx = 0; lx < cols; lx++) {
          if (hash(lx >> 1, ly) > 0.3) g.put(lx, ly, '_', 4);
        }
      }
      /* 계단식 마을 */
      for (var bi = 0; bi < s.blocks.length; bi++) {
        var b = s.blocks[bi];
        var topY = b.y - b.h;
        for (var by = topY; by <= b.y; by++) {
          for (var bx = b.x; bx < b.x + b.w; bx++) {
            if (by === topY) g.put(bx, by, '=', 6);
            else if (bx === b.x || bx === b.x + b.w - 1) g.put(bx, by, '#', 5);
            else if (hash(bx * 3, by * 5 + bi) > 0.74) g.put(bx, by, 'o', 10);
            else if (hash(bx, by + bi) > 0.55) g.put(bx, by, '.', 1);
          }
        }
      }
      /* 바람 */
      var dt = 1 / 60;
      for (var wi = 0; wi < s.wind.length; wi++) {
        var wd = s.wind[wi];
        wd.x += wd.v * dt;
        if (wd.x > cols + 10) { wd.x = -10; wd.y = 0.08 + Math.random() * 0.5; }
        var wy = Math.round(wd.y * rows);
        for (var k = 0; k < wd.len; k++) {
          var xx = Math.round(wd.x) - k;
          var lift = Math.round(Math.sin(t * 1.5 + wd.ph + k * 0.6) * 1.2);
          var chs = '~-..,';
          g.put(xx, wy + lift, chs.charAt(Math.min(k, 4)), k === 0 ? 7 : (k === 1 ? 6 : (k === 2 ? 4 : 3)));
        }
        if (hash(wi, Math.floor(t * 0.4)) > 0.972) g.put(Math.round(wd.x), wy - 1, '*', 7);
      }
      /* 마우스 바람 */
      if (m.active) {
        var mcx = Math.round(m.x * cols), mcy = Math.round(m.y * rows);
        for (var k2 = 0; k2 < 6; k2++) {
          if (hash(k2, Math.floor(t * 4)) > 0.35) {
            g.put(mcx - k2 * 2, mcy + Math.round(Math.sin(t * 2.6 + k2 * 0.7)), k2 === 0 ? '~' : '.', 5);
            g.put(mcx + k2 * 2, mcy + Math.round(Math.cos(t * 2.6 + k2 * 0.7)), k2 === 0 ? '~' : '.', 5);
          }
        }
      }
      g.glow(cols * 0.5, rows * 0.98, cols * 0.7, 'rgba(255,150,90,0.10)');
    }
  };
  gamcheon.sky = ['#05030f', '#100920', '#1c1029'];

  var scenes = [gwangan, yeongdo, hwangnyeong, haeundae, gamcheon];
  var cur = 0;

  /* ---------- 마우스 ---------- */
  var m = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, active: false, idle: 99 };

  function onMove(cx, cy) {
    m.tx = cx / window.innerWidth;
    m.ty = cy / window.innerHeight;
    m.active = true;
    m.idle = 0;
  }

  /* ---------- 렌더 ---------- */
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cvs.width = Math.round(W * dpr);
    cvs.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = FONT;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    cw = Math.max(6, Math.round(ctx.measureText('M').width * 100) / 100);
    ch = Math.round(FS * LH * 100) / 100;
    cols = Math.ceil(W / cw) + 1;
    rows = Math.ceil(H / ch) + 1;
    g.cols = cols; g.rows = rows;
    charBuf = new Uint8Array(cols * rows);
    slotBuf = new Uint8Array(cols * rows);
    for (var si = 0; si < scenes.length; si++) scenes[si].state = null;
    buildBg();
    render(performance.now() / 1000, true);
  }

  function buildBg() {
    var sc = scenes[cur];
    var grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, sc.sky[0]);
    grd.addColorStop(0.55, sc.sky[1]);
    grd.addColorStop(1, sc.sky[2]);
    bgGrad = grd;
  }

  function flush() {
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.font = FONT;
    var pal = scenes[cur].pal;
    for (var y = 0; y < rows; y++) {
      var base = y * cols;
      var x = 0;
      while (x < cols) {
        var slot = slotBuf[base + x];
        if (slot === 255) { x++; continue; }
        var x2 = x + 1;
        while (x2 < cols && slotBuf[base + x2] === slot) x2++;
        var str = '';
        for (var k = base + x; k < base + x2; k++) str += String.fromCharCode(charBuf[k]);
        ctx.fillStyle = pal[slot] || pal[0];
        ctx.fillText(str, x * cw, y * ch);
        x = x2;
      }
    }
  }

  function render(t, force) {
    if (!cols || !rows) return;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    slotBuf.fill(255);
    charBuf.fill(32);

    var sc = scenes[cur];
    try { sc.draw(t, m); } catch (e) { /* 장면 오류가 페이지를 막지 않게 */ }

    /* 마우스 반응: 커서 주변 기호가 살짝 밝아진다 */
    if (m.active) {
      var mcx = m.x * cols, mcy = m.y * rows;
      var R = Math.max(7, cols * 0.05);
      var x0 = Math.max(0, Math.floor(mcx - R)), x1 = Math.min(cols, Math.ceil(mcx + R));
      var y0 = Math.max(0, Math.floor(mcy - R)), y1 = Math.min(rows, Math.ceil(mcy + R));
      for (var y = y0; y < y1; y++) {
        for (var x = x0; x < x1; x++) {
          var dx = (x - mcx) / R, dy = (y - mcy) / R;
          var d2 = dx * dx + dy * dy;
          if (d2 > 1) continue;
          var i = y * cols + x;
          if (slotBuf[i] === 255 || slotBuf[i] < 6) continue;
          if (Math.random() < 0.18 * (1 - d2)) slotBuf[i] = Math.min(11, slotBuf[i] + 1);
        }
      }
      /* 커서 바로 밑은 또렷하게 */
      var ix = clamp(Math.round(mcx), 0, cols - 1), iy = clamp(Math.round(mcy), 0, rows - 1);
      if (slotBuf[iy * cols + ix] !== 255) slotBuf[iy * cols + ix] = 11;
    }

    flush();
  }

  /* ---------- 애니메이션 루프 ---------- */
  var last = 0, acc = 0, samples = 0, tickNo = 0, skip = 0, running = false;

  function loop(now) {
    if (!running) return;
    var ms = now - (last || now);
    last = now;
    acc += ms; samples++; tickNo++;
    if (samples >= 15) {
      var avg = acc / samples;
      skip = avg > 30 ? 2 : (avg > 22 ? 1 : 0);
      acc = 0; samples = 0;
    }
    if (!skip || (tickNo % (skip + 1)) === 0) {
      /* 마우스 보간 */
      m.x += (m.tx - m.x) * 0.08;
      m.y += (m.ty - m.y) * 0.08;
      m.idle += ms / 1000;
      if (m.idle > 6) m.active = false;
      render(now / 1000);
    }
    requestAnimationFrame(loop);
  }

  function start() {
    if (reduce) { render(0.5, true); return; }
    if (running) return;
    running = true; last = 0;
    requestAnimationFrame(loop);
  }
  function stop() { running = false; }

  /* ---------- 장면 전환 ---------- */
  var btns = Array.prototype.slice.call(document.querySelectorAll('.scene-btns button[data-i]'));
  var codeEl = document.getElementById('scene-code');
  var nameEl = document.getElementById('scene-name');

  function syncUI() {
    for (var i = 0; i < btns.length; i++) {
      var on = Number(btns[i].getAttribute('data-i')) === cur;
      btns[i].classList.toggle('on', on);
      btns[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    if (codeEl) codeEl.textContent = ('0' + (cur + 1)).slice(-2) + ' / 0' + scenes.length;
    if (nameEl) nameEl.textContent = scenes[cur].name;
  }

  function setScene(i, animate) {
    i = (i + scenes.length) % scenes.length;
    if (i === cur) return;
    cur = i;
    syncUI();
    if (animate === false) { buildBg(); render(performance.now() / 1000, true); return; }
    cvs.classList.add('is-dim');
    setTimeout(function () {
      buildBg();
      render(performance.now() / 1000, true);
      cvs.classList.remove('is-dim');
    }, 180);
  }

  for (var bi2 = 0; bi2 < btns.length; bi2++) {
    btns[bi2].addEventListener('click', function () {
      setScene(Number(this.getAttribute('data-i')));
    });
  }
  var shuffle = document.querySelector('.scene-btns .shuffle');
  if (shuffle) {
    shuffle.addEventListener('click', function () {
      var n = cur;
      while (n === cur) n = Math.floor(Math.random() * scenes.length);
      setScene(n);
      this.classList.remove('spin');
      void this.offsetWidth;
      this.classList.add('spin');
    });
  }

  /* ---------- 초기화 ---------- */
  var startIdx = Math.floor(Math.random() * scenes.length);
  cur = startIdx;
  syncUI();
  resize();
  buildBg();
  render(performance.now() / 1000, true);
  start();

  window.addEventListener('resize', function () {
    clearTimeout(window.__ascT);
    window.__ascT = setTimeout(resize, 120);
  });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { resize(); });
  }
  window.addEventListener('pointermove', function (e) { onMove(e.clientX, e.clientY); }, { passive: true });
  window.addEventListener('pointerdown', function (e) { onMove(e.clientX, e.clientY); }, { passive: true });

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  /* 클럭 · 스크롤 · 카드 등장 */
  var clock = document.getElementById('kst');
  function tick() {
    if (!clock) return;
    var d = new Date();
    var hh = ('0' + d.getHours()).slice(-2), mm = ('0' + d.getMinutes()).slice(-2), ss = ('0' + d.getSeconds()).slice(-2);
    clock.textContent = hh + ':' + mm + ':' + ss;
  }
  tick(); setInterval(tick, 1000);

  var bar = document.querySelector('.topbar');
  function onScroll() {
    if (!bar) return;
    bar.classList.toggle('is-stuck', window.scrollY > 6);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var cards = document.querySelectorAll('.card');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          var idx = Array.prototype.indexOf.call(cards, el);
          el.style.transitionDelay = Math.min(idx, 8) * 45 + 'ms';
          el.classList.add('in');
          io.unobserve(el);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    for (var ci = 0; ci < cards.length; ci++) io.observe(cards[ci]);
  } else {
    for (var cj = 0; cj < cards.length; cj++) cards[cj].classList.add('in');
  }
})();
