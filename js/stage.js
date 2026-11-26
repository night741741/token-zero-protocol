/* =============================================================
 * stage.js · 服务器页机箱网格：画布格子、硬件纸片卡、仓库托盘、
 * 热力/风区、机位备忘与下一台。
 * 依赖 window.CONTENT / window.Sim；坐标以 #pageStage 1320×800 为准。
 * ============================================================= */
(function (root) {
  'use strict';
  const C = root.CONTENT;
  const $ = id => document.getElementById(id);

  const CELL = 48;
  const PAD = { t: 26, r: 8, b: 10, l: 8 };
  const CASE_LABEL = ['鞋盒', '侧透 ATX', '服务器机架'];
  const CASE_PAPER = ['#E2D3AF', '#F2EAD8', '#36373D'];

  let el = {};
  let wind = null;
  let lastState = null;
  let heatPat = null;
  let gridCanvas = null;
  let gridKey = '';
  let api = {};

  const money = n => '¥' + Math.floor(n).toLocaleString('en-US');

  function machine(state) { return state.servers[state.activeServer]; }
  function isOpen() {
    const p = $('page-srv');
    return !!(p && p.classList.contains('on'));
  }

  /* ---------- 组件纸片卡 innerHTML ---------- */
  function tierOf(def) {
    const raw = def && def.unlock != null ? def.unlock : 0;
    return Math.max(0, Math.min(3, raw | 0));
  }

  function cardInner(def, opts) {
    const tier = tierOf(def);
    const label = '<span class="label">' + def.name + '</span>';
    const mark = opts && opts.mark && def.mark
      ? '<span class="mark">' + def.mark + '</span>' : '';
    switch (def.type) {
      case 'gpu': {
        let pwr = '';
        for (let i = 0; i < Math.min(4, tier + 1); i++) pwr += '<i></i>';
        if (def.arch === 'h') {
          return '<div class="bracket"></div><div class="fingers"></div>' +
            '<div class="hfins"></div><div class="hbm"><i></i><i></i><i></i><i></i></div>' +
            '<span class="hsilk">' + (def.mark || 'H') + '</span>' +
            '<div class="pwr">' + pwr + '</div>' + label;
        }
        return '<div class="bracket"></div><div class="fingers"></div>' +
          '<div class="fans">' + '<div class="fan-c"></div>'.repeat(def.fans || 2) + '</div>' +
          '<div class="pwr">' + pwr + '</div>' + mark + label;
      }
      case 'npu': return '<div class="npu-pins"></div><div class="npu-die"></div>' + mark + label;
      case 'cpu': return '<div class="die"></div><div class="corner"></div>' + mark + label;
      case 'ram': return '<div class="fingers"></div><div class="notch"></div><i class="ledbar"></i>' + mark + label;
      case 'psu': {
        let mod = '';
        for (let i = 0; i < 2 + tier; i++) mod += '<i></i>';
        return '<div class="fan-c"></div><div class="mod">' + mod + '</div>' + mark + label;
      }
      case 'ssd': {
        let chips = '';
        for (let i = 0; i < 1 + tier; i++) chips += '<i></i>';
        return '<div class="contacts"></div><div class="chips">' + chips + '</div>' + label;
      }
      case 'fan': return '<div class="blades"></div><div class="hub"></div>' + label;
      case 'cooler': return '<div class="fans"><div class="fan-c"></div><div class="fan-c"></div></div><div class="hose"></div>' + mark + label;
      case 'nic': {
        let ports = '';
        for (let i = 0; i < (tier >= 2 ? 2 : 1); i++) ports += '<i></i>';
        return '<div class="ports">' + ports + '</div><div class="led"></div>' +
          (def.sink ? '<div class="sink"></div>' : '') + label;
      }
      default: return label;
    }
  }

  function makeCard(uid, def, pos) {
    const card = document.createElement('div');
    card.className = 'card ' + def.type + ' tier' + tierOf(def) + (def.arch ? ' arch-' + def.arch : '');
    card.dataset.uid = String(uid);
    card.dataset.defId = def.id;
    card.style.width = (def.size[0] * CELL) + 'px';
    card.style.height = (def.size[1] * CELL) + 'px';
    if (pos) { card.style.left = (pos.x * CELL) + 'px'; card.style.top = (pos.y * CELL) + 'px'; }
    card.innerHTML = cardInner(def);
    return card;
  }

  /* ---------- 画布 ---------- */
  function gridBackground(W, H, tier) {
    const key = W + ':' + H + ':' + tier;
    if (gridCanvas && gridKey === key) return gridCanvas;
    const cw = W * CELL, ch = H * CELL;
    if (!gridCanvas) gridCanvas = document.createElement('canvas');
    gridCanvas.width = cw * 2; gridCanvas.height = ch * 2;
    const ctx = gridCanvas.getContext('2d');
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.fillStyle = CASE_PAPER[tier] || CASE_PAPER[0];
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = tier === 2 ? 'rgba(207,200,182,.20)' : 'rgba(47,93,138,.16)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x++) { ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, ch); ctx.stroke(); }
    for (let y = 0; y <= H; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(cw, y * CELL); ctx.stroke(); }
    gridKey = key;
    return gridCanvas;
  }

  function draw(state, stats) {
    const canvas = el.canvas;
    const m = machine(state);
    if (!canvas || !m) return;
    const W = m.gridW, H = m.gridH;
    const cw = W * CELL, ch = H * CELL;
    if (canvas.width !== cw * 2 || canvas.height !== ch * 2) {
      canvas.width = cw * 2; canvas.height = ch * 2;
    }
    canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(2, 0, 0, 2, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(gridBackground(W, H, m.caseTier), 0, 0, cw, ch);

    if (stats && !stats.psuOk) {
      ctx.strokeStyle = '#C44536';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(7, 7, cw - 14, ch - 14);
      ctx.setLineDash([]);
    }

    if (stats && stats.cellHeat) {
      if (!heatPat) {
        const t = document.createElement('canvas'); t.width = 8; t.height = 8;
        const tc = t.getContext('2d');
        tc.strokeStyle = '#C44536'; tc.lineWidth = 2;
        tc.beginPath(); tc.moveTo(-1, 9); tc.lineTo(9, -1); tc.stroke();
        heatPat = ctx.createPattern(t, 'repeat');
      }
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const over = Math.max(0, stats.cellHeat[i] - stats.cellCool[i]);
        if (over > 0.01) {
          ctx.globalAlpha = Math.min(0.5, over / 120);
          ctx.fillStyle = heatPat;
          ctx.fillRect(x * CELL + 3, y * CELL + 3, CELL - 6, CELL - 6);
        }
      }
      ctx.globalAlpha = 1;
    }

    if (wind) {
      const d = wind.def;
      ctx.strokeStyle = 'rgba(47,93,138,.75)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      for (let dy = 0; dy < d.size[1]; dy++) ctx.strokeRect(0, (wind.y + dy) * CELL, cw, CELL);
      for (let dx = 0; dx < d.size[0]; dx++) ctx.strokeRect((wind.x + dx) * CELL, 0, CELL, ch);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(47,93,138,.12)';
      ctx.fillRect(wind.x * CELL, wind.y * CELL, d.size[0] * CELL, d.size[1] * CELL);
    }
  }

  /* ---------- 尺寸与全量渲染 ---------- */
  function render(state) {
    if (!state || !el.caseWrap) return;
    lastState = state;
    setRecycleState(null);
    const m = machine(state);
    if (!m) return;
    const cw = m.gridW * CELL, ch = m.gridH * CELL;
    const leftcol = el.caseWrap.closest('.leftcol');
    if (leftcol) leftcol.classList.toggle('rack-compact', m.gridH >= 8);
    el.caseWrap.style.width = (cw + PAD.l + PAD.r) + 'px';
    el.caseWrap.style.height = (ch + PAD.t + PAD.b) + 'px';
    el.caseWrap.className = 'tier' + m.caseTier;
    if (el.label) el.label.textContent = CASE_LABEL[m.caseTier] + ' · ' + C.SERVERS[state.activeServer].id.toUpperCase();
    el.canvas.style.left = PAD.l + 'px';
    el.canvas.style.top = PAD.t + 'px';
    el.cardLayer.style.left = PAD.l + 'px';
    el.cardLayer.style.top = PAD.t + 'px';
    el.cardLayer.style.width = cw + 'px';
    el.cardLayer.style.height = ch + 'px';
    el.cardLayer.innerHTML = '';
    m.placed.forEach(p => {
      const def = C.HARDWARE_BY_ID[p.defId];
      if (!def) return;
      el.cardLayer.appendChild(makeCard(p.uid, def, { x: p.x, y: p.y }));
    });

    if (el.trayItems) {
      el.trayItems.innerHTML = '';
      state.warehouse.forEach(w => {
        const def = C.HARDWARE_BY_ID[w.defId];
        if (!def) return;
        const c = makeCard(w.uid, def, null);
        c.classList.add('tray-card');
        el.trayItems.appendChild(c);
      });
      if (!state.warehouse.length) {
        el.trayItems.innerHTML = '<span class="tray-hint">空 · 全部机位共用，拆箱后会放进这里</span>';
      }
    }

    const stats = root.Sim.serverStats(state, state.activeServer);
    draw(state, stats);
    renderMeta(state, stats);
    renderChrome(state);
  }

  /* ---------- 机位列表 / 下一台（全量渲染时重建） ---------- */
  function nextServerIdx(state) {
    for (let i = 1; i < C.SERVERS.length; i++) {
      if (!state.servers[i] || !state.servers[i].owned) return i;
    }
    return -1;
  }

  function renderChrome(state) {
    const list = $('srvList');
    if (list) {
      list.innerHTML = '';
      C.SERVERS.forEach((srv, i) => {
        const m = state.servers[i];
        const b = document.createElement('button');
        if (m && m.owned) {
          b.textContent = 'S' + (i + 1);
          b.classList.toggle('on', state.activeServer === i);
          b.addEventListener('click', () => { if (api.onSelectServer) api.onSelectServer(i); });
        } else {
          b.className = 'locked';
          b.textContent = 'S' + (i + 1) + ' · ¥' + srv.price.toLocaleString('en-US');
          b.disabled = true;
        }
        list.appendChild(b);
      });
    }

    const card = document.querySelector('.nextcard');
    const t = $('nextTitle'), sub = $('nextSub'), buy = $('nextBuy');
    const idx = nextServerIdx(state);
    if (card) card.classList.toggle('done', idx < 0);
    if (idx < 0) {
      if (t) t.textContent = '六台机位全部点亮';
      if (sub) sub.textContent = '接着堆硬件，把算力拉满。';
      return;
    }
    const srv = C.SERVERS[idx];
    const m = state.servers[idx];
    const lvl = root.Sim.modelLevel(state);
    if (t) t.textContent = srv.name;
    if (sub) sub.textContent = 'L' + srv.unlock + ' 解锁 · ¥' + srv.price.toLocaleString('en-US') +
      ' · ' + m.gridW + '×' + m.gridH + ' 网格';
    if (buy) {
      buy.disabled = !state.act1Done || lvl < srv.unlock;
      buy.textContent = lvl < srv.unlock ? ('L' + srv.unlock + ' 解锁') : '开新机位';
    }
  }

  /* ---------- 轻量同步：卡片状态 + 画布 ---------- */
  function sync(state) {
    if (!state || !isOpen() || !lastState) return;
    if (lastState !== state) return;
    const s = root.Sim.serverStats(state, state.activeServer);
    const m = machine(state);
    if (!s || !m) return;
    el.cardLayer.querySelectorAll('.card').forEach(card => {
      const uid = Number(card.dataset.uid);
      const p = m.placed.find(pp => pp.uid === uid);
      if (!p) return;
      const def = C.HARDWARE_BY_ID[p.defId];
      if (!def) return;
      const on = s.psuOk && s.actualCompute > 0;
      card.classList.toggle('running', on && ['fan', 'nic', 'gpu', 'cpu', 'npu', 'psu', 'cooler'].indexOf(def.type) >= 0);
      let hot = false;
      for (let dx = 0; dx < def.size[0] && !hot; dx++) for (let dy = 0; dy < def.size[1] && !hot; dy++) {
        const i = (p.y + dy) * m.gridW + (p.x + dx);
        if (s.cellHeat[i] - s.cellCool[i] > 0.01) hot = true;
      }
      card.classList.toggle('overheat', hot);
      card.classList.toggle('power-warn', def.type === 'psu' && s.powerCoef < 1 && s.psuOk);
    });
    draw(state, s);
    renderMeta(state, s);
  }

  /* ---------- 机位文案 ---------- */
  function renderMeta(state, s) {
    const m = machine(state);
    if (!m || !s) return;
    const srv = C.SERVERS[state.activeServer];
    const cs = C.CASES[m.caseTier];
    const used = m.placed.reduce((n, p) => {
      const d = C.HARDWARE_BY_ID[p.defId];
      return n + (d ? d.size[0] * d.size[1] : 0);
    }, 0);
    const totalCells = m.gridW * m.gridH;

    set('srvTitle', srv.name + ' 服务器');
    set('srvHint', m.gridW + '×' + m.gridH + ' · 装机 ' + used + ' 格 · 算力 ' + Math.round(s.actualCompute) + '/s');
    set('srvChip1', '第 2 幕 · 机位 ' + (state.activeServer + 1));
    set('srvChip2', s.bottleneck ? ('瓶颈 ' + s.bottleneck.name + ' ' + s.bottleneck.pct + '%') : '运转正常');
    set('gridName', '机箱内部 · ' + CASE_LABEL[m.caseTier] + ' ' + m.gridW + '×' + m.gridH);
    set('gridStat', '已装机 ' + used + ' / ' + totalCells + ' 格 · 公共仓库 ' + state.warehouse.length);

    set('memoModel', srv.name);
    set('memoGrid', m.gridW + ' × ' + m.gridH);
    set('memoCool', String(cs.builtinCool || 0));
    set('memoDisk', (cs.builtin ? '板载 ' + cs.builtin.data + 'G' : '无') + ' + ' + (s.ssdCap - (cs.builtin ? cs.builtin.data : 0)) + 'G');
    set('memoPower', Math.round(s.totalPower) + ' W / ' + (s.psuWatt || 0) + ' W');
    set('memoBand', Math.round(s.sumBandwidth) + ' / ' + Math.round(s.sumCompute));
    set('memoCompute', Math.round(s.actualCompute) + ' /s');
    set('memoBottleneck', s.bottleneck ? s.bottleneck.name + ' ' + s.bottleneck.pct + '%' : '无');
    set('memoStamp', s.psuOk ? '第 2 幕 · 运转中' : '电源未贴底边');

    set('trayCount', String(state.warehouse.length));
    set('workNoteCompute', '有效算力 ' + Math.round(s.actualCompute) + ' /s（全体 ×优化器）');
  }

  function set(id, text) {
    const n = $(id);
    if (n && n.textContent !== text) n.textContent = text;
  }

  /* ---------- 坐标换算 ---------- */
  function designScale() {
    const r = el.pageStage.getBoundingClientRect();
    return (r.width / 1320) || 1;
  }
  function caseDesignRect() {
    const r = el.canvas.getBoundingClientRect();
    const pr = el.pageStage.getBoundingClientRect();
    const s = designScale();
    return {
      left: (r.left - pr.left) / s, top: (r.top - pr.top) / s,
      width: r.width / s, height: r.height / s,
    };
  }
  function trayDesignRect() {
    const r = el.tray.getBoundingClientRect();
    const pr = el.pageStage.getBoundingClientRect();
    const s = designScale();
    return {
      left: (r.left - pr.left) / s, top: (r.top - pr.top) / s,
      width: r.width / s, height: r.height / s,
    };
  }
  function recycleDesignRect() {
    const r = el.recycleBin.getBoundingClientRect();
    const pr = el.pageStage.getBoundingClientRect();
    const s = designScale();
    return {
      left: (r.left - pr.left) / s, top: (r.top - pr.top) / s,
      width: r.width / s, height: r.height / s,
    };
  }
  function designPoint(clientX, clientY) {
    const pr = el.pageStage.getBoundingClientRect();
    const s = designScale();
    return { x: (clientX - pr.left) / s, y: (clientY - pr.top) / s };
  }

  function setWind(info) { wind = info; }
  function setRecycleState(mode) {
    if (!el.recycleBin) return;
    el.recycleBin.classList.toggle('ready', mode === 'ready');
    el.recycleBin.classList.toggle('blocked', mode === 'blocked');
    if (el.recycleNote) el.recycleNote.textContent = mode === 'blocked' ? '自研不可回收' : (mode === 'ready' ? '松手回收' : '退 50%');
  }

  function init(callbacks) {
    api = callbacks || {};
    el = {
      pageStage: $('pageStage'),
      caseWrap: $('case-wrap'),
      canvas: $('grid-canvas'),
      cardLayer: $('card-layer'),
      label: $('case-label'),
      tray: $('tray'),
      trayItems: $('tray-items'),
      recycleBin: $('recycle-bin'),
      recycleNote: $('recycleNote'),
    };
    const nextBuy = $('nextBuy');
    if (nextBuy && !nextBuy.__bound) {
      nextBuy.__bound = true;
      nextBuy.addEventListener('click', () => {
        const state = lastState;
        if (!state || !api.onBuyServer) return;
        const idx = nextServerIdx(state);
        if (idx > 0) api.onBuyServer(idx);
      });
    }
  }

  root.Stage = {
    init, render, sync, setWind, setRecycleState,
    caseDesignRect, trayDesignRect, recycleDesignRect, designPoint,
    cell: () => CELL, cardInner, tierOf, isOpen,
  };
})(window);