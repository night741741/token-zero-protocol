/* =============================================================
 * scene.js · 纸片楼体：夜幕光洞、热点、贴纸、翻牌、桌面壳
 * 负责：建筑层视觉与场景交互，不含玩法数值。
 * ============================================================= */
(function (root) {
  'use strict';

  const TOTAL = 100000000;
  const $ = id => document.getElementById(id);

  const LIGHTS = {
    counter: { cx: 720, cy: 150, rx: 302, ry: 134 },
    pc: { cx: 480, cy: 762, rx: 274, ry: 174 },
    rig: { cx: 724, cy: 780, rx: 118, ry: 130, stamp: '副机', sx: 790, sy: 618 },
    journal: { cx: 1285, cy: 782, rx: 180, ry: 144 },
    blueprint: { cx: 184, cy: 714, rx: 174, ry: 142, stamp: '天赋蓝图', sx: 116, sy: 690 },
    shelf: { cx: 1040, cy: 776, rx: 168, ry: 148, stamp: '快递', sx: 948, sy: 636 },
    orders: { cx: 160, cy: 322, rx: 174, ry: 114, stamp: '订单', sx: 92, sy: 300 },
    slider: { cx: 610, cy: 580, rx: 382, ry: 78, stamp: '滑尺', sx: 966, sy: 566 },
    s1: { cx: 380, cy: 452, rx: 128, ry: 152, stamp: '服务器', sx: 322, sy: 502 },
    s2: { cx: 566, cy: 452, rx: 128, ry: 152, stamp: 'S2', sx: 508, sy: 508 },
    s3: { cx: 752, cy: 452, rx: 128, ry: 152, stamp: 'S3', sx: 694, sy: 508 },
    s4: { cx: 938, cy: 452, rx: 128, ry: 152, stamp: 'S4', sx: 880, sy: 508 },
    s5: { cx: 1124, cy: 452, rx: 128, ry: 152, stamp: 'S5', sx: 1066, sy: 508 },
    s6: { cx: 1310, cy: 452, rx: 128, ry: 152, stamp: 'S6', sx: 1252, sy: 508 },
  };

  const AREAS = {
    roof: { x: 24, y: 56, width: 1392, height: 166, ready: () => true },
    server: {
      x: 24, y: 244, width: 1392, height: 316,
      ready: st => !!st.servers && st.servers.length >= 6 && st.servers.every(s => s && s.owned),
    },
    ground: {
      x: 24, y: 600, width: 1392, height: 284,
      ready: st => !!st.unlocked && ['blueprint', 'shelf', 'slider', 's1'].every(n => st.unlocked[n]),
    },
  };

  let stage, holesG, ambientG, lampsG, stampsEl, tipEl, toastEl, pageWrap, pageStage;
  const lit = new Set();
  const litAreas = new Set();
  const holes = {};
  const areaEls = {};
  let currentPage = null;
  let tipsMap = {};
  let tipTimer = 0, tipVisible = false, ptX = 0, ptY = 0;
  let toastTimer = 0;
  let pc = null;
  let termLockUntil = 0;

  /* ---------------- 翻牌计数板 ---------------- */
  const cells = [];
  let total = TOTAL;
  let remaining = TOTAL;
  let lastRemaining = null;
  let counterEndless = false;

  function fmt(n) { return Math.max(0, Math.round(n)).toLocaleString('en-US'); }

  function bigLabel(n) {
    if (n >= 1000000000000) return (Math.round(n / 1000000000000 * 100) / 100) + ' 万亿';
    if (n > 100000000) return (Math.round(n / 100000000 * 100) / 100) + ' 亿';
    return fmt(n);
  }

  function counterPattern(target) {
    if (target <= TOTAL) return '100,000,000';
    const unit = target >= 1000000000000 ? 1000000000000 : 100000000;
    const suffix = target >= 1000000000000 ? ' 万亿' : ' 亿';
    return (target / unit).toFixed(4) + suffix;
  }

  function buildFlipText(pattern) {
    const flipEl = $('flip');
    flipEl.innerHTML = '';
    cells.length = 0;
    for (const ch of pattern) {
      const c = document.createElement('div');
      c.className = 'cell' + (ch === ',' || ch === ' ' || ch === '.' ? ' sep' : '');
      const n = document.createElement('span');
      n.className = 'num';
      n.textContent = ch;
      c.appendChild(n);
      flipEl.appendChild(c);
      cells.push({ el: c, num: n, ch: ch });
    }
  }

  function buildFlip(target) {
    buildFlipText(counterPattern(target == null ? total : target));
  }

  function consumedPattern(n) {
    if (n < TOTAL) return fmt(n);
    const unit = n >= 1000000000000 ? 1000000000000 : 100000000;
    const suffix = n >= 1000000000000 ? ' 万亿' : ' 亿';
    return (n / unit).toFixed(4) + suffix;
  }

  function setCounterMode(endless) {
    if (counterEndless === endless) return false;
    counterEndless = endless;
    lastRemaining = null;
    const label = $('counterLabel');
    if (label) label.textContent = endless ? '累计消耗' : '剩余 TOKEN';
    return true;
  }

  function writeFlip(s, doFlip) {
    s = s.padStart(cells.length, ' ');
    for (let i = 0; i < cells.length; i++) {
      const ch = s[i] === ' ' ? '' : s[i];
      const cell = cells[i];
      if (cell.ch === ch) continue;
      cell.ch = ch;
      cell.num.textContent = ch;
      if (doFlip && ch && cell.el.className.indexOf('sep') < 0 && cell.num.animate) {
        cell.num.getAnimations().forEach(animation => animation.cancel());
        cell.num.animate([
          { transform: 'rotateX(0)' },
          { transform: 'rotateX(-88deg)', offset: 0.45 },
          { transform: 'rotateX(88deg)', offset: 0.55 },
          { transform: 'rotateX(0)' },
        ], { duration: 180, easing: 'ease-out' });
      }
    }
  }

  function setCounterTotal(target) {
    total = target;
    buildFlip(target);
    lastRemaining = null;
    remaining = total;
    const label = $('targetTxt');
    if (label) label.textContent = '目标 ' + bigLabel(total);
  }

  function setRemaining(v, doFlip, target) {
    const switched = setCounterMode(false);
    if (target != null && target !== total) setCounterTotal(target);
    else if (switched) {
      const label = $('targetTxt');
      if (label) label.textContent = '目标 ' + bigLabel(total);
    }
    remaining = Math.max(0, Math.min(total, v));
    if (remaining === lastRemaining) return;
    lastRemaining = remaining;
    const burned = total - remaining;
    let s;
    if (total <= TOTAL) {
      s = Math.round(remaining).toLocaleString('en-US');
    } else {
      const unit = total >= 1000000000000 ? 1000000000000 : 100000000;
      s = (remaining / unit).toFixed(4) + (total >= 1000000000000 ? ' 万亿' : ' 亿');
    }
    writeFlip(s, doFlip);
    $('pfill').style.width = (burned / total * 100).toFixed(4) + '%';
    $('burnedTxt').textContent = '已烧 ' + fmt(burned);
    $('pctTxt').textContent = '清零 ' + (burned / total * 100).toFixed(4) + '%';
  }

  function setConsumed(v, doFlip) {
    setCounterMode(true);
    const value = Math.max(0, Math.round(v));
    if (value === lastRemaining) return;
    lastRemaining = value;
    const s = consumedPattern(value);
    if (s.length !== cells.length) buildFlipText(s);
    writeFlip(s, doFlip);
    $('pfill').style.width = '100%';
    $('pctTxt').textContent = '无尽运行';
    $('burnedTxt').textContent = '累计消耗 ' + fmt(value);
    $('targetTxt').textContent = '目标已解除';
  }

  /* ---------------- 区域底光 / 光洞 / 光池 / 盖章 ---------------- */
  function makeArea(name) {
    const A = AREAS[name];
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    el.setAttribute('x', A.x);
    el.setAttribute('y', A.y);
    el.setAttribute('width', A.width);
    el.setAttribute('height', A.height);
    el.setAttribute('data-area', name);
    el.classList.add('area-hole');
    ambientG.appendChild(el);
    areaEls[name] = el;
  }

  function syncAreas(st, animate) {
    ambientG.classList.toggle('instant', !animate);
    Object.keys(AREAS).forEach(name => {
      const ready = AREAS[name].ready(st);
      const el = areaEls[name];
      if (ready) litAreas.add(name);
      else litAreas.delete(name);
      el.classList.toggle('on', ready);
    });
    if (!animate) {
      void ambientG.getBoundingClientRect();
      ambientG.classList.remove('instant');
    }
  }

  /* ---------------- 光洞 / 光池 / 盖章 ---------------- */
  function makeLight(name) {
    const L = LIGHTS[name];
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    el.setAttribute('cx', L.cx);
    el.setAttribute('cy', L.cy);
    el.setAttribute('rx', 0);
    el.setAttribute('ry', 0);
    holesG.appendChild(el);
    holes[name] = el;
    const lamp = document.createElement('div');
    lamp.className = 'lamp';
    lamp.style.left = (L.cx - L.rx * 1.7) + 'px';
    lamp.style.top = (L.cy - L.ry * 1.7) + 'px';
    lamp.style.width = (L.rx * 3.4) + 'px';
    lamp.style.height = (L.ry * 3.4) + 'px';
    lampsG.appendChild(lamp);
    L._lamp = lamp;
  }

  function growHole(name, instant) {
    const L = LIGHTS[name], el = holes[name];
    if (!el) return;
    const k = L.ry / L.rx;
    if (instant) {
      el.setAttribute('rx', L.rx);
      el.setAttribute('ry', L.ry);
      return;
    }
    let done = false, t0 = null;
    function step(ts) {
      if (done) return;
      if (t0 === null) t0 = ts;
      const p = Math.max(0, Math.min(1, (ts - t0) / 600));
      const e = 1 - Math.pow(1 - p, 3);
      const rx = 40 + (L.rx - 40) * e;
      el.setAttribute('rx', rx);
      el.setAttribute('ry', rx * k);
      if (p < 1) requestAnimationFrame(step);
      else done = true;
    }
    requestAnimationFrame(step);
    setTimeout(function () {
      if (done) return;
      done = true;
      el.setAttribute('rx', L.rx);
      el.setAttribute('ry', L.ry);
    }, 700);
  }

  function addStamp(name, quiet) {
    const L = LIGHTS[name];
    if (!L || !L.stamp) return;
    const d = document.createElement('div');
    d.className = 'stamp';
    d.textContent = L.stamp;
    d.style.left = L.sx + 'px';
    d.style.top = L.sy + 'px';
    stampsEl.appendChild(d);
    requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add('on')));
    if (!quiet) setTimeout(() => root.Audio.stamp(), 130);
  }

  function animateHotspot(name) {
    const hs = $('hs-' + name);
    if (!hs) return;
    hs.classList.remove('reveal-in');
    void hs.offsetWidth;
    hs.classList.add('reveal-in');
    setTimeout(() => hs.classList.remove('reveal-in'), 650);
  }

  function reveal(name, quiet) {
    if (!LIGHTS[name] || lit.has(name)) return false;
    lit.add(name);
    growHole(name);
    animateHotspot(name);
    const hs = $('hs-' + name);
    if (hs) hs.classList.add('lit');
    LIGHTS[name]._lamp.classList.add('on');
    if (!quiet) {
      root.Audio.lift();
      setTimeout(() => addStamp(name), 110);
    }
    return true;
  }

  function chainReveal(names, step) {
    names.forEach((n, i) => setTimeout(() => reveal(n), i * (step || 220)));
  }

  function pulse(name) {
    const hs = $('hs-' + name);
    if (!hs) return;
    hs.classList.add('dimhint');
    setTimeout(() => hs.classList.remove('dimhint'), 420);
    root.Audio.error();
  }

  function applyUnlocked(st, animate) {
    syncAreas(st, animate);
    ['counter', 'pc', 'journal'].forEach(n => {
      lit.add(n);
      $('hs-' + n).classList.add('lit');
      LIGHTS[n]._lamp.classList.add('on');
    });
    if (animate) {
      setTimeout(() => ['counter', 'pc', 'journal'].forEach(n => {
        growHole(n);
        animateHotspot(n);
      }), 260);
    } else {
      ['counter', 'pc', 'journal'].forEach(n => growHole(n, true));
    }
    ['shelf', 'blueprint', 's1', 'orders', 'slider'].forEach(n => {
      if (!st.unlocked[n]) return;
      const fresh = !lit.has(n);
      lit.add(n);
      growHole(n, true);
      LIGHTS[n]._lamp.classList.add('on');
      const hs = $('hs-' + n);
      if (hs) hs.classList.add('lit');
      if (fresh && LIGHTS[n].stamp) addStamp(n, true);
    });
    if (st.act1Done) {
      const fresh = !lit.has('rig');
      lit.add('rig');
      growHole('rig', true);
      LIGHTS.rig._lamp.classList.add('on');
      const hs = $('hs-rig');
      if (hs) hs.classList.add('lit');
      if (fresh) addStamp('rig', true);
    }
    ['s2', 's3', 's4', 's5', 's6'].forEach((n, i) => {
      if (!st.servers || !st.servers[i + 1] || !st.servers[i + 1].owned) return;
      const fresh = !lit.has(n);
      lit.add(n);
      growHole(n, true);
      LIGHTS[n]._lamp.classList.add('on');
      const hs = $('hs-' + n);
      if (hs) hs.classList.add('lit');
      if (fresh && LIGHTS[n].stamp) addStamp(n, true);
    });
  }

  /* ---------------- 浮动字 / 吐司 ---------------- */
  function floatText(x, y, text, cls) {
    const d = document.createElement('div');
    d.className = 'float' + (cls ? ' ' + cls : '');
    d.textContent = text;
    d.style.left = x + 'px';
    d.style.top = y + 'px';
    stage.appendChild(d);
    setTimeout(() => d.remove(), 900);
  }

  function floatPc(text, cls) {
    const anchor = $('pcScreen');
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();
    if (!r.width) return;
    const p = toStage(
      r.left + r.width * (0.32 + Math.random() * 0.36),
      r.top + r.height * (0.04 + Math.random() * 0.12)
    );
    floatText(p.x, p.y - 8, text, cls);
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('on'), 2300);
  }

  /* ---------------- 像素 AI 小人 ---------------- */
  const RMAP = [
    '......#.......',
    '......#.......',
    '...#######....',
    '..#.......#...',
    '..#.o...o.#...',
    '..#.......#...',
    '..#..+++..#...',
    '...#######....',
    '....#...#.....',
    '...##...##....',
    '..#.......#...',
    '..#.......#...',
    '...##...##....',
  ];
  const robot = { cv: null, ctx: null, n: 1, last: 0 };

  function buildRobot() {
    robot.cv = $('robot');
    robot.ctx = robot.cv ? robot.cv.getContext('2d') : null;
  }

  function drawRobot(t) {
    if (t - robot.last < 32) return;
    robot.last = t;
    const ctx = robot.ctx;
    if (!ctx) return;
    const n = Math.max(1, Math.min(8, robot.n));
    const px = n === 1 ? 3 : 2;
    const cols = n === 1 ? 1 : Math.min(4, n);
    const rows = Math.ceil(n / cols);
    const rw = 14 * px, rh = 13 * px;
    const gapX = 2, gapY = 2;
    const totalW = cols * rw + (cols - 1) * gapX;
    const totalH = rows * rh + (rows - 1) * gapY;
    const ox0 = Math.round((120 - totalW) / 2);
    const oy0 = Math.round((60 - totalH) / 2);

    ctx.clearRect(0, 0, 120, 60);
    ctx.fillStyle = 'rgba(123,224,123,.10)';
    ctx.fillRect(0, 58, 120, 2);

    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      if (idx >= n) break;
      const ox = ox0 + c * (rw + gapX);
      const oy = oy0 + r * (rh + gapY) + ((Math.floor((t + idx * 260) / 520) % 2) ? 0 : 1);
      const lampOn = ((t + idx * 400) % 1300) < 760;
      ctx.shadowColor = 'rgba(123,224,123,.75)';
      ctx.shadowBlur = 4;
      for (let ry = 0; ry < RMAP.length; ry++) {
        for (let rx = 0; rx < RMAP[ry].length; rx++) {
          const ch = RMAP[ry][rx];
          if (ch === '.') continue;
          if (ch === 'o') { ctx.fillStyle = '#0B140C'; ctx.shadowBlur = 0; }
          else if (ch === '+') { ctx.fillStyle = '#DFF7E2'; ctx.shadowBlur = 0; }
          else if (ry === 0) { ctx.fillStyle = lampOn ? '#DFF7E2' : '#3F8F5B'; ctx.shadowBlur = lampOn ? 5 : 0; }
          else { ctx.fillStyle = '#59C97E'; ctx.shadowBlur = 4; }
          ctx.fillRect(ox + rx * px, oy + ry * px, px, px);
        }
      }
    }
    ctx.shadowBlur = 0;
  }

  function setRobotCount(n) {
    robot.n = Math.max(1, Math.min(8, n || 1));
  }

  /* ---------------- 悬停贴纸 ---------------- */
  function toStage(cx, cy) {
    const r = stage.getBoundingClientRect();
    if (document.body.classList.contains('portrait')) {
      return { x: cx - r.left, y: cy - r.top };
    }
    const s = r.width / 1440;
    return { x: (cx - r.left) / s, y: (cy - r.top) / s };
  }

  function positionTip() {
    if (!tipVisible) return;
    const p = toStage(ptX, ptY);
    const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
    const portrait = document.body.classList.contains('portrait');
    const W = portrait ? stage.clientWidth : 1440;
    const H = portrait ? stage.clientHeight : 900;
    let x = p.x + 18, y = p.y + 20;
    if (x + w > W - 8) x = p.x - w - 18;
    if (y + h > H - 8) y = p.y - h - 16;
    tipEl.style.left = Math.max(8, x) + 'px';
    tipEl.style.top = Math.max(52, y) + 'px';
  }

  function showTip(key) {
    const make = tipsMap[key];
    if (!make) return;
    const info = make();
    const on = lit.has(key);
    const lines = on ? info.lines : [info.cat];
    let html = '<div class="tt"><span>' + info.name + '</span><span class="st">' + (on ? '已点亮' : '未点亮') + '</span></div>';
    lines.forEach(l => { html += '<div class="ln">' + l + '</div>'; });
    if (!on && info.cond) html += '<div class="cond">解锁：' + info.cond + '</div>';
    tipEl.innerHTML = html;
    tipEl.classList.toggle('locked', !on);
    tipEl.classList.add('on');
    tipVisible = true;
    positionTip();
  }

  function hideTip() {
    tipVisible = false;
    clearTimeout(tipTimer);
    tipEl.classList.remove('on');
  }

  function bindTips(map) {
    tipsMap = map || {};
    Object.keys(tipsMap).forEach(key => {
      const el = $('hs-' + key);
      if (!el) return;
      el.addEventListener('pointerenter', () => {
        if (pageWrap.classList.contains('on')) return;
        clearTimeout(tipTimer);
        tipTimer = setTimeout(() => showTip(key), 200);
      });
      el.addEventListener('pointerleave', () => {
        clearTimeout(tipTimer);
        hideTip();
      });
    });
  }

  /* ---------------- 老电脑：短按 / 长按 ---------------- */
  let pressing = false, longFired = false, holdTimer = 0, downAt = 0, downX = 0, downY = 0;
  let lastX = 0, lastY = 0;
  let pcHandlers = {};

  function endPress(cancelled) {
    if (!pressing) return;
    pressing = false;
    clearTimeout(holdTimer);
    pc.classList.remove('holding');
    if (cancelled) return;
    if (longFired) { longFired = false; return; }
    const dt = performance.now() - downAt;
    if (dt < 400 && pcHandlers.tap) {
      const p = toStage(lastX, lastY);
      pcHandlers.tap(p.x, p.y);
    }
  }

  function bindPc(handlers) {
    pcHandlers = handlers || {};
    pc = $('hs-pc');
    pc.addEventListener('contextmenu', e => e.preventDefault());
    pc.addEventListener('pointerdown', e => {
      if (pageWrap.classList.contains('on')) return;
      e.preventDefault();
      root.Audio.unlock();
      pressing = true;
      longFired = false;
      downAt = performance.now();
      downX = lastX = e.clientX;
      downY = lastY = e.clientY;
      pc.classList.add('holding');
      holdTimer = setTimeout(() => {
        longFired = true;
        pressing = false;
        pc.classList.remove('holding');
        if (pcHandlers.hold) pcHandlers.hold();
      }, 600);
    });
    pc.addEventListener('pointermove', e => {
      lastX = e.clientX; lastY = e.clientY;
      if (!pressing) return;
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 26) endPress(true);
    });
    pc.addEventListener('pointerup', e => {
      lastX = e.clientX; lastY = e.clientY;
      endPress(false);
    });
    pc.addEventListener('pointercancel', () => endPress(true));
    pc.addEventListener('pointerleave', () => { if (pressing) endPress(true); });
    window.addEventListener('pointerup', () => { if (pressing) endPress(false); });
    document.addEventListener('pointermove', e => {
      ptX = e.clientX; ptY = e.clientY;
      if (tipVisible) positionTip();
    });
  }

  function flashScreen() {
    const scr = $('pcScreen');
    if (!scr) return;
    scr.classList.remove('on');
    void scr.offsetWidth;
    scr.classList.add('on');
  }

  function setPcTerm(text, force) {
    if (!force && performance.now() < termLockUntil) return;
    const el = $('pcTerm');
    if (el) el.innerHTML = text;
  }

  function overheat() {
    const hs = $('hs-pc');
    const scr = $('pcScreen');
    if (!hs || !scr) return;
    termLockUntil = performance.now() + 1950;
    hs.classList.add('overheat');
    scr.classList.add('overheat');
    setPcTerm('&gt; GPU 过热 89°C', true);
    root.Audio.overheat();
    setTimeout(() => {
      hs.classList.remove('overheat');
      scr.classList.remove('overheat');
      setPcTerm('&gt; S1 已就位<i>_</i>', true);
    }, 1800);
  }

  /* ---------------- 内部页 ---------------- */
  function originFor(key) {
    const hs = $('hs-' + key);
    const pr = pageStage.getBoundingClientRect();
    if (!hs || !pr.width) return '50% 50%';
    const r = hs.getBoundingClientRect();
    const x = ((r.left + r.width / 2) - pr.left) / pr.width * 100;
    const y = ((r.top + r.height / 2) - pr.top) / pr.height * 100;
    return Math.max(0, Math.min(100, x)).toFixed(1) + '% ' + Math.max(0, Math.min(100, y)).toFixed(1) + '%';
  }

  function openPage(name, key) {
    const target = $('page-' + name);
    if (!target) return;
    hideTip();
    pageStage.style.transformOrigin = key ? originFor(key) : '50% 50%';
    document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
    target.classList.add('on');
    pageWrap.classList.add('on');
    document.body.classList.add('page-open');
    if (root.__coachPause) root.__coachPause();
    if (root.__camClearKeys) root.__camClearKeys();
    if (document.body.classList.contains('portrait')) {
      pageWrap.scrollTop = 0;
      pageWrap.scrollLeft = 0;
    }
    currentPage = name;
    root.Audio.open();
  }

  function closePage(instant) {
    if (!pageWrap.classList.contains('on')) {
      currentPage = null;
      document.body.classList.remove('page-open');
      if (root.__coachResume) root.__coachResume();
      return;
    }
    pageWrap.classList.remove('on');
    document.body.classList.remove('page-open');
    currentPage = null;
    hideTip();
    if (root.__coachResume) root.__coachResume();
    if (!instant) root.Audio.close();
  }

  function pageOpen() { return pageWrap.classList.contains('on'); }

  /* ---------------- 启动 ---------------- */
  function boot() {
    stage = $('stage');
    holesG = $('holes');
    ambientG = $('ambientHoles');
    lampsG = $('lamps');
    stampsEl = $('stamps');
    tipEl = $('tip');
    toastEl = $('toast');
    pageWrap = $('pageWrap');
    pageStage = $('pageStage');

    Object.keys(AREAS).forEach(makeArea);
    Object.keys(LIGHTS).forEach(makeLight);
    buildFlip();
    buildRobot();
    setRemaining(TOTAL, false);

    pageWrap.addEventListener('pointerdown', e => {
      if (e.target === pageWrap) {
        if (root.__exitPage) root.__exitPage();
      }
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && root.__exitPage) root.__exitPage();
    });

    document.querySelectorAll('[data-back]').forEach(b => {
      b.addEventListener('click', () => { if (root.__exitPage) root.__exitPage(); });
    });
  }

  const Scene = {
    boot, setRemaining, setConsumed, reveal, chainReveal, applyUnlocked, pulse,
    isLit: n => lit.has(n),
    isAreaLit: n => litAreas.has(n),
    growHole, addStamp,
    floatText, floatPc, toast,
    bindTips, showTip, hideTip,
    bindPc, flashScreen, setPcTerm, overheat,
    setRobotCount, drawRobot,
    openPage, closePage, pageOpen, currentPage: () => currentPage, originFor,
    fmt,
  };
  root.Scene = Scene;
})(window);