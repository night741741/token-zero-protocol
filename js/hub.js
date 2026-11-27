/* =============================================================
 * hub.js · 老电脑桌面：图标、单窗口、商店 / 应用市场 / 订单 / 软件
 * 只负责桌面层展示与行状态，买卖一律走 main 提供的 api。
 * ============================================================= */
(function (root) {
  'use strict';
  const C = root.CONTENT;
  const $ = id => document.getElementById(id);

  let st = null, api = null;
  let current = null;
  let rows = {};
  let iconEls = {};
  let els = {};
  let lastChrome = {};
  let orderRefs = {};
  let orderSig = '';
  let orderOpen = 0;
  let orderListScroll = 0;
  let orderDetailRefs = null;
  let swRefs = {};
  let swSig = '';
  let shopCategory = 'all';
  let hwQty = {};
  let appCategory = 'all';
  let orderCategory = 'all';
  let softwareCategory = 'all';
  let apiTab = 'console';
  let apiRefs = {};
  let apiSig = '';
  let newsFilter = 'all';
  let newsOpen = 0;
  let newsListScroll = 0;
  let newsSig = '';
  let newsLiveRefs = [];
  let opinionFilter = 'all';
  let opinionSig = '';
  let opinionRefs = {};
  let iconBadges = {};

  const SHOP_CATEGORIES = [
    { id: 'all', name: '全部', types: C.HW_SHOP_GROUPS },
    { id: 'gpu', name: '显卡', types: ['gpu'] },
    { id: 'npu', name: 'NPU', types: ['npu'] },
    { id: 'cpu', name: 'CPU', types: ['cpu'] },
    { id: 'ram', name: '内存', types: ['ram'] },
    { id: 'psu', name: '供电', types: ['psu'] },
    { id: 'ssd', name: '存储', types: ['ssd'] },
    { id: 'cooling', name: '散热', types: ['fan', 'cooler'] },
    { id: 'nic', name: '网络', types: ['nic'] },
  ];

  const APP_CATEGORIES = [
    { id: 'all', name: '全部', kinds: ['ai', 'mining'] },
    { id: 'ai', name: '推理代理', kinds: ['ai'] },
    { id: 'mining', name: '挖矿', kinds: ['mining'] },
  ];

  const ORDER_CATEGORIES = [
    { id: 'all', name: '全部', types: ['bench', 'train', 'data', 'rush'] },
    { id: 'bench', name: '跑分', types: ['bench'] },
    { id: 'train', name: '训练', types: ['train'] },
    { id: 'data', name: '数据', types: ['data'] },
    { id: 'rush', name: '加急', types: ['rush'] },
  ];

  const SOFTWARE_CATEGORIES = [
    { id: 'all', name: '全部', types: ['crawler', 'trainer', 'order', 'optimizer', 'scheduler', 'pipeline', 'gateway'] },
    { id: 'crawler', name: '爬虫', types: ['crawler'] },
    { id: 'trainer', name: '训练器', types: ['trainer'] },
    { id: 'order', name: '接单程序', types: ['order'] },
    { id: 'optimizer', name: '优化器', types: ['optimizer'] },
    { id: 'scheduler', name: '调度器', types: ['scheduler'] },
    { id: 'pipeline', name: '数据管道', types: ['pipeline'] },
    { id: 'gateway', name: 'API 网关', types: ['gateway'] },
  ];

  const fmt = n => Math.max(0, Math.round(n)).toLocaleString('en-US');
  const money = n => '¥' + Math.floor(n).toLocaleString('en-US');
  const wan = n => (n >= 10000 ? (n / 10000).toFixed(n % 10000 ? 1 : 0) + ' 万' : String(n));
  const apiUnlockText = () => {
    const def = C.MODEL_LEVELS[C.API_SERVICE.unlockLevel];
    return def.name + '（累计烧 ' + wan(def.at) + ' Token）';
  };
  const big = n => {
    if (n >= 1000000000000) return (n / 1000000000000).toFixed(1) + ' 万亿';
    if (n >= 100000000) return (n / 100000000).toFixed(1) + ' 亿';
    if (n >= 10000) return (n / 10000).toFixed(1) + ' 万';
    return fmt(n);
  };

  const ART = {
    shop: '<svg viewBox="0 0 32 32"><path d="M3.5 6.5h3.2l3 13.2a2.2 2.2 0 0 0 2.2 1.7h9.4a2.2 2.2 0 0 0 2.1-1.6l2.1-8.3H8.2"/><circle cx="13" cy="26" r="1.7"/><circle cx="23" cy="26" r="1.7"/></svg>',
    apps: '<svg viewBox="0 0 32 32"><rect x="5" y="5" width="9" height="9" rx="2"/><rect x="18" y="5" width="9" height="9" rx="2"/><rect x="5" y="18" width="9" height="9" rx="2"/><rect x="18" y="18" width="9" height="9" rx="2"/></svg>',
    orders: '<svg viewBox="0 0 32 32"><path d="M11 6h10a2 2 0 0 1 2 2v18a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/><path d="M13 6V4.5h6V6"/><path d="M13 13h6M13 18h6M13 23h3"/></svg>',
    software: '<svg viewBox="0 0 32 32"><rect x="4" y="6" width="24" height="20" rx="2.5"/><path d="M9.5 12.5 14 16l-4.5 3.5M16.5 20.5h6"/></svg>',
    api: '<svg viewBox="0 0 32 32"><path d="M8 21a4.5 4.5 0 0 1 .8-8.9A6 6 0 0 1 20.4 12 4 4 0 0 1 24 19.8V21"/><path d="M12 25.5 16 29l4-3.5M16 22v7"/></svg>',
    news: '<svg viewBox="0 0 32 32"><path d="M5 7h22v19H5z"/><path d="M8 11h9M8 15h9M8 19h6M20 11h3M20 15h3M20 19h3M20 23h3M8 23h6"/></svg>',
    opinion: '<svg viewBox="0 0 32 32"><path d="M6 6.5h20a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-9l-6.5 5v-5H6a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2Z"/><path d="M10 13.5h12M10 18h8"/></svg>',
    trash: '<svg viewBox="0 0 32 32"><path d="M6.5 9.5h19M12.5 9.5v-3h7v3M9 9.5l1.4 16.5h11.2L23 9.5"/><path d="M13.5 14v8M18.5 14v8"/></svg>',
  };

  const ICONS = [
    { key: 'shop', name: '商店', sub: '硬件目录' },
    { key: 'apps', name: '应用市场', sub: '代理与矿机' },
    { key: 'orders', name: '订单', sub: '第 2 幕' },
    { key: 'software', name: '软件', sub: '第 2 幕' },
    { key: 'api', name: 'API 服务', sub: C.MODEL_LEVELS[C.API_SERVICE.unlockLevel].name.split(' · ')[0] + ' · 开放模型' },
    { key: 'news', name: '机房日报', sub: '世界快讯' },
    { key: 'opinion', name: '舆论', sub: '公开评价' },
    { key: 'trash', name: '回收站', sub: '硬件回收' },
  ];

  const API_TABS = [
    { id: 'console', name: '服务控制台' },
    { id: 'db', name: '用户数据库' },
  ];

  function isLocked(def) {
    if (def.key === 'orders' || def.key === 'software') return !(st && st.unlocked.orders);
    if (def.key === 'api') return !(st && root.Sim.apiUnlocked(st));
    return false;
  }

  /* ---------------- 骨架 ---------------- */
  function init(state, callbacks) {
    st = state;
    api = callbacks;
    els = {
      icons: $('deskIcons'),
      shopBody: $('shopBody'),
      appBody: $('appBody'),
      orderBody: $('orderBody'),
      orderFoot: $('orderFoot'),
      swBody: $('swBody'),
      swFoot: $('swFoot'),
      apiBody: $('apiBody'),
      apiFoot: $('apiFoot'),
      newsBody: $('newsBody'),
      newsFoot: $('newsFoot'),
      opinionBody: $('opinionBody'),
      opinionFoot: $('opinionFoot'),
      hint: $('hubHint'),
      chip1: $('hubChip1'),
      chip2: $('hubChip2'),
      tbMem: $('tbMem'),
      tbProc: $('tbProc'),
      tbBurn: $('tbBurn'),
      tbMine: $('tbMine'),
      tbToken: $('tbToken'),
      tbAi: $('tbAi'),
      goal: $('goalNote'),
      shopFoot: $('shopFoot'),
    };
    buildIcons();
    bindShell();
  }

  function buildIcons() {
    if (!els.icons) return;
    els.icons.innerHTML = '';
    iconEls = {};
    iconBadges = {};
    ICONS.forEach(def => {
      const d = document.createElement('div');
      d.className = 'dicon' + (isLocked(def) ? ' locked' : '');
      d.dataset.key = def.key;
      d.title = def.name + ' · ' + def.sub;
      const art = document.createElement('div');
      art.className = 'art';
      art.innerHTML = ART[def.key];
      const nm = document.createElement('span');
      nm.textContent = def.name;
      d.appendChild(art); d.appendChild(nm);
      const lk = document.createElement('i');
      lk.className = 'lock';
      lk.textContent = '锁';
      d.appendChild(lk);
      const badge = document.createElement('b');
      badge.className = 'dicon-badge hidden';
      d.appendChild(badge);
      d.addEventListener('click', () => onIcon(def));
      els.icons.appendChild(d);
      iconEls[def.key] = d;
      iconBadges[def.key] = badge;
    });
  }

  function onIcon(def) {
    if (def.key === 'trash') {
      root.Audio.click();
      api.toast(st && st.act1Done
        ? '回收站：普通硬件拖进机箱旁的回收区，退五成；自研 NPU 不可回收。'
        : '回收站是空的。第 2 幕打开机箱后，机箱旁才有回收区。');
      return;
    }
    if (isLocked(def)) {
      root.Audio.error();
      api.toast(def.key === 'api'
        ? 'API 服务：' + apiUnlockText() + '后开放。'
        : def.name + '：拆开 RTX 3060 后才会亮。');
      return;
    }
    toggleWindow(def.key);
  }

  function bindShell() {
    ['shop', 'apps', 'orders', 'software', 'api', 'news', 'opinion'].forEach(name => {
      const win = $('win-' + name);
      if (!win) return;
      const x = win.querySelector('.x');
      if (x) x.addEventListener('click', e => { e.stopPropagation(); closeWindow(); });
      const help = win.querySelector('.tb-help');
      if (help) help.addEventListener('click', e => {
        e.stopPropagation();
        if (st && api.showNote) api.showNote(help.dataset.help);
      });
      makeDraggable(win);
    });
    const back = $('tbBack');
    if (back) back.addEventListener('click', () => api.exitToBuilding());
    const tbAi = $('tbAi');
    if (tbAi) {
      tbAi.addEventListener('click', () => {
        if (st && root.Sim.modelLevel(st) >= 4) api.toggleAiAuto();
      });
    }
  }

  /* ---------------- 窗口拖动 ---------------- */
  const winPos = {};
  let zTop = 20;

  function bringToFront(win) {
    if (win) win.style.zIndex = String(++zTop);
  }

  function makeDraggable(win) {
    if (!win || win.__dragBound) return;
    win.__dragBound = true;
    const tb = win.querySelector('.tb');
    if (!tb) return;
    let drag = null;

    tb.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      if (e.target.closest('.x')) return;
      if (e.target.closest('.tb-help')) return;
      const parent = win.offsetParent;
      if (!parent) return;
      bringToFront(win);
      const scale = parent.getBoundingClientRect().width / parent.offsetWidth || 1;
      drag = {
        id: e.pointerId,
        sx: e.clientX, sy: e.clientY,
        left: win.offsetLeft, top: win.offsetTop,
        maxL: Math.max(0, parent.clientWidth - win.offsetWidth),
        maxT: Math.max(0, parent.clientHeight - win.offsetHeight),
      };
      try { tb.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
      win.classList.add('dragging');
      e.preventDefault();
    });

    tb.addEventListener('pointermove', e => {
      if (!drag || e.pointerId !== drag.id) return;
      const nl = Math.min(drag.maxL, Math.max(0, drag.left + (e.clientX - drag.sx) / dragScale(win)));
      const nt = Math.min(drag.maxT, Math.max(0, drag.top + (e.clientY - drag.sy) / dragScale(win)));
      win.style.left = nl + 'px';
      win.style.top = nt + 'px';
    });

    const end = e => {
      if (!drag || (e && e.pointerId !== drag.id)) return;
      win.classList.remove('dragging');
      if (tb.hasPointerCapture(drag.id)) tb.releasePointerCapture(drag.id);
      winPos[win.id] = { left: win.offsetLeft, top: win.offsetTop };
      drag = null;
    };
    tb.addEventListener('pointerup', end);
    tb.addEventListener('pointercancel', end);

    win.addEventListener('pointerdown', () => bringToFront(win));
  }

  function dragScale(win) {
    const parent = win.offsetParent;
    if (!parent || !parent.offsetWidth) return 1;
    return parent.getBoundingClientRect().width / parent.offsetWidth || 1;
  }

  /* ---------------- 窗口 ---------------- */
  function toggleWindow(name) {
    if (current === name) { closeWindow(); return; }
    openWindow(name, iconEls[name]);
  }

  function openWindow(name, icon) {
    closeWindow(true);
    const win = $('win-' + name);
    if (!win) return;
    current = name;
    if (name === 'shop') shopCategory = 'all';
    else if (name === 'apps') appCategory = 'all';
    else if (name === 'orders') {
      orderCategory = 'all';
      orderOpen = 0;
      orderListScroll = 0;
    }
    else if (name === 'software') softwareCategory = 'all';
    else if (name === 'api') apiTab = 'console';
    else if (name === 'news') {
      newsFilter = 'all';
      newsOpen = 0;
      newsListScroll = 0;
      if (st) root.Sim.markNewsRead(st);
    } else if (name === 'opinion') {
      opinionFilter = 'all';
      if (st) root.Sim.markOpinionRead(st);
    }
    const pos = winPos[win.id];
    if (pos) {
      win.style.left = pos.left + 'px';
      win.style.top = pos.top + 'px';
    }
    win.classList.add('on');
    bringToFront(win);
    renderWindow();
    const body = name === 'shop' ? els.shopBody : name === 'apps' ? els.appBody :
      name === 'orders' ? els.orderBody : name === 'software' ? els.swBody :
        name === 'api' ? els.apiBody : name === 'news' ? els.newsBody :
          name === 'opinion' ? els.opinionBody : null;
    if (body) {
      body.scrollTop = 0;
      const tabs = body.querySelector('.shop-tabs');
      if (tabs) tabs.scrollLeft = 0;
    }
    syncIcons();
    if (icon && win.animate) {
      const r = win.getBoundingClientRect(), ir = icon.getBoundingClientRect();
      const dx = (ir.left + ir.width / 2) - (r.left + r.width / 2);
      const dy = (ir.top + ir.height / 2) - (r.top + r.height / 2);
      win.animate([
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.08)', opacity: 0 },
        { transform: 'translate(0,0) scale(1)', opacity: 1 }
      ], { duration: 220, easing: 'cubic-bezier(.2,.9,.2,1)' });
      root.Audio.paper();
    }
    sync(st);
    if (root.__scrollPageToWindow) root.__scrollPageToWindow(win);
  }

  function closeWindow(instant) {
    if (!current) return false;
    const name = current;
    const win = $('win-' + name);
    const icon = iconEls[name];
    current = null;
    syncIcons();
    if (!win) return true;
    if (instant || document.hidden || !win.animate || !icon) {
      win.classList.remove('on');
      return true;
    }
    const r = win.getBoundingClientRect(), ir = icon.getBoundingClientRect();
    const dx = (ir.left + ir.width / 2) - (r.left + r.width / 2);
    const dy = (ir.top + ir.height / 2) - (r.top + r.height / 2);
    win.style.pointerEvents = 'none';
    const a = win.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.08)', opacity: 0 }
    ], { duration: 160, easing: 'cubic-bezier(.4,0,.8,.3)' });
    a.onfinish = () => {
      win.classList.remove('on');
      win.style.opacity = '';
      win.style.pointerEvents = '';
    };
    root.Audio.close();
    return true;
  }

  function hardClose() {
    document.querySelectorAll('.win.on').forEach(w => {
      w.classList.remove('on');
      w.style.opacity = '';
      w.style.pointerEvents = '';
    });
    current = null;
    syncIcons();
  }

  function closeAll() { hardClose(); }

  function isWindowOpen() { return !!current; }

  function syncIcons() {
    const unread = root.Sim.newsUnread(st);
    ICONS.forEach(def => {
      const el = iconEls[def.key];
      if (!el) return;
      const locked = isLocked(def);
      el.classList.toggle('locked', locked);
      el.classList.toggle('open', !locked && current === def.key);
      const badge = iconBadges[def.key];
      if (badge) {
        const n = def.key === 'news' ? unread : def.key === 'opinion' ? root.Sim.opinionUnread(st) : 0;
        badge.textContent = n > 99 ? '99+' : String(n);
        badge.classList.toggle('hidden', n <= 0);
      }
    });
  }

  function renderWindow() {
    if (current === 'shop') renderShop();
    else if (current === 'apps') renderApps();
    else if (current === 'orders') renderOrders();
    else if (current === 'software') renderSoftware();
    else if (current === 'api') renderApi();
    else if (current === 'opinion') renderOpinion();
  }

  function refresh(state) {
    st = state;
    syncIcons();
    renderWindow();
    sync(st);
  }

  /* ---------------- 行组件 ---------------- */
  function makeRow(o) {
    const row = document.createElement('div');
    row.className = 'row' + (o.cls ? ' ' + o.cls : '');
    const nm = document.createElement('div');
    nm.className = 'nm'; nm.textContent = o.nm;
    const sp = document.createElement('div');
    sp.className = 'sp'; sp.textContent = o.sp;
    row.appendChild(nm); row.appendChild(sp);
    let badge = null, fill = null, pct = null, btn = null, pr = null;
    if (o.badge) {
      badge = document.createElement('span');
      badge.className = 'badge ' + (o.badgeCls || '');
      badge.textContent = o.badge;
      row.appendChild(badge);
    }
    if (o.dl) {
      const bar = document.createElement('div');
      bar.className = 'dlbar';
      fill = document.createElement('i');
      pct = document.createElement('b');
      pct.textContent = '0%';
      bar.appendChild(fill); bar.appendChild(pct);
      row.appendChild(bar);
    }
    if (o.pr) {
      pr = document.createElement('div');
      pr.className = 'pr'; pr.textContent = o.pr;
      row.appendChild(pr);
    }
    if (o.btn) {
      btn = document.createElement('button');
      btn.className = 'buy';
      btn.textContent = o.btn;
      if (o.disabled) btn.disabled = true;
      else if (o.onClick) btn.addEventListener('click', o.onClick);
      row.appendChild(btn);
    }
    if (o.key) {
      row.dataset.key = o.key;
      rows[o.key] = {
        row: row, btn: btn, pr: pr, badge: badge, fill: fill, pct: pct,
        purchasable: !!o.funds && !o.disabled && !!o.onClick, buyLabel: o.btn,
      };
    }
    return row;
  }

  function sec(text) {
    const d = document.createElement('div');
    d.className = 'sec';
    d.textContent = text;
    return d;
  }

  function ladder(defs, upto, key) {
    const d = document.createElement('div');
    d.className = 'ladder';
    defs.forEach((x, i) => {
      const s = document.createElement('i');
      if (i <= upto) s.className = 'on';
      d.appendChild(s);
    });
    const t = document.createElement('em');
    t.textContent = (upto + 1) + ' / ' + defs.length;
    d.appendChild(t);
    rows[key + 'Ladder'] = { el: d };
    return d;
  }

  /* ---------------- 商店 ---------------- */
  function gridBox() {
    const grid = document.createElement('div');
    grid.className = 'hw-grid';
    return grid;
  }

  function renderShop() {
    const body = els.shopBody;
    if (!body) return;
    body.innerHTML = '';
    rows = {};
    if (st.act1Done) { renderAct2Shop(body); return; }

    const shipSec = root.Sim.deliverySec(st);
    body.appendChild(sec('内存条 · 点击倍率 · 快递 ' + shipSec + ' 秒'));
    const ramGrid = gridBox();
    for (let i = 1; i < C.RAM.length; i++) {
      const def = C.RAM[i];
      const key = 'ram' + i;
      const art = { type: 'ram', size: [3, 1], name: '内存 ×' + def.mult, unlock: i, mark: '×' + def.mult };
      const inTransit = st.deliveries.find(d => d.item === 'ram' && d.tier === i);
      const spec = '点击倍率 ×' + def.mult;
      let opt;
      if (i <= st.ramTier) {
        opt = {
          key: key, cls: 'owned dim', sp: spec + ' · 已插上',
          badge: '已装上', badgeCls: 'jit', sizeText: '实体件 · 已装入',
          pr: money(def.price), btn: '已装', disabled: true,
        };
      } else if (inTransit) {
        opt = {
          key: key, cls: 'transit', sp: spec,
          badge: '在途', badgeCls: 'ship', sizeText: '实体件 · 快递中',
          pr: money(def.price), btn: '在途', disabled: true,
        };
      } else if (i > st.ramTier + 1) {
        opt = {
          key: key, cls: 'dim', sp: spec + ' · 先升前一档',
          badge: '未解锁', sizeText: '实体件 · 等前一档',
          pr: money(def.price), btn: '锁', disabled: true,
        };
      } else {
        opt = {
          key: key, cls: 'next', sp: spec,
          sizeText: '实体件 · 快递 ' + shipSec + ' 秒',
          pr: money(def.price), btn: '下单', funds: true,
          onClick: () => api.orderRam(i),
        };
      }
      ramGrid.appendChild(makeHwCard(art, opt));
    }
    body.appendChild(ramGrid);

    body.appendChild(sec('幕终硬件'));
    const gpuGrid = gridBox();
    const gpuDef = C.HARDWARE_BY_ID[C.GPU.id] || { type: 'gpu', size: [4, 1], name: C.GPU.name, fans: 2, unlock: 0, mark: '3060' };
    const gs = root.Sim.gpuState(st);
    const gateLeft = Math.max(0, C.GPU.gate - st.burned);
    let gOpt = {
      key: 'gpu', sp: '幕终目标 · 拆箱进入第 2 幕',
      pr: money(C.GPU.price), btn: '下单', funds: true,
      onClick: () => api.orderGpu(),
    };
    if (gs === 'installed') {
      gOpt = { key: 'gpu', cls: 'owned dim', sp: '已装进 S1 · 第 2 幕', badge: '已装', badgeCls: 'jit', pr: money(C.GPU.price), btn: '已装', disabled: true };
    } else if (gs === 'shelf') {
      gOpt = { key: 'gpu', cls: 'transit', sp: '在快递架上，去拆箱', badge: '等拆箱', badgeCls: 'ship', pr: money(C.GPU.price), btn: '已到货', disabled: true };
    } else if (gs === 'transit') {
      gOpt = { key: 'gpu', cls: 'transit', sp: '快递在路上', badge: '在途', badgeCls: 'ship', pr: money(C.GPU.price), btn: '在途', disabled: true };
    } else if (st.burned < C.GPU.gate) {
      gOpt = { key: 'gpu', cls: 'dim', sp: '烧到 100 万解锁 · 还差 ' + wan(gateLeft), badge: 'L1 锁定', pr: money(C.GPU.price), btn: '未解锁', disabled: true };
    }
    gpuGrid.appendChild(makeHwCard(gpuDef, gOpt));

    const teaser = document.createElement('div');
    teaser.className = 'shop-teaser';
    const tb = document.createElement('b');
    tb.textContent = '第 2 幕 · 越玩越大';
    const tags = document.createElement('div');
    tags.className = 'st-tags';
    C.LOCKED_GEAR.forEach(g => {
      const t = document.createElement('em');
      t.textContent = g.name;
      tags.appendChild(t);
    });
    const th = document.createElement('i');
    th.textContent = '拆开 RTX 3060 后解锁';
    teaser.appendChild(tb);
    teaser.appendChild(tags);
    teaser.appendChild(th);
    gpuGrid.appendChild(teaser);
    body.appendChild(gpuGrid);
  }

  /* ---------------- 商店：第 2 幕硬件目录 ---------------- */
  function hwSpec(d) {
    switch (d.type) {
      case 'gpu': return '算力 ' + d.compute + ' · ' + d.power + 'W' + (d.dev ? ' · 研发 +' + d.dev + '/s' : '');
      case 'cpu': return '算力 ' + d.compute + ' · 开发 +' + d.dev + '/s';
      case 'ram': return '带宽 ' + d.bandwidth;
      case 'psu': return d.watt + 'W · 必须贴底';
      case 'ssd': return '容量 ' + d.capacity + 'G';
      case 'fan':
      case 'cooler': return '散热 ' + d.cooling;
      case 'nic': return '订单 +' + Math.round(d.orderBonus * 100) + '% · 爬虫 +' +
        Math.round(d.crawlerBonus * 100) + '%';
      case 'npu': return '算力 ' + d.compute + ' · ' + d.power + 'W';
      default: return '';
    }
  }

  function renderShopTabs(body) {
    const nav = document.createElement('nav');
    nav.className = 'shop-tabs';
    nav.setAttribute('aria-label', '硬件分类');
    SHOP_CATEGORIES.forEach(cat => {
      const count = C.HARDWARE.filter(d => cat.types.indexOf(d.type) >= 0 && !d.special).length;
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'shop-tab' + (shopCategory === cat.id ? ' on' : '');
      tab.dataset.category = cat.id;
      const name = document.createElement('span');
      name.textContent = cat.name;
      const num = document.createElement('small');
      num.textContent = String(count);
      tab.appendChild(name); tab.appendChild(num);
      tab.addEventListener('click', () => {
        if (shopCategory === cat.id) return;
        shopCategory = cat.id;
        root.Audio.click();
        renderShop();
        els.shopBody.scrollTop = 0;
        const active = els.shopBody.querySelector('.shop-tab.on');
        if (active) {
          const bar = active.parentElement;
          bar.scrollLeft = active.offsetLeft - (bar.clientWidth - active.clientWidth) / 2;
        }
      });
      nav.appendChild(tab);
    });
    body.appendChild(nav);
  }

  function makeHwCard(d, o) {
    const row = document.createElement('article');
    row.className = 'hw-product' + (o.cls ? ' ' + o.cls : '');
    row.dataset.key = o.key;

    const preview = document.createElement('div');
    preview.className = 'hw-preview';
    const part = document.createElement('div');
    part.className = 'card ' + d.type + ' tier' + root.Stage.tierOf(d) + (d.arch ? ' arch-' + d.arch : '');
    part.style.width = d.size[0] * 48 + 'px';
    part.style.height = d.size[1] * 48 + 'px';
    part.innerHTML = root.Stage.cardInner(d, { mark: true });
    const label = part.querySelector('.label');
    if (label) label.remove();
    preview.appendChild(part);
    row.appendChild(preview);

    const head = document.createElement('div');
    head.className = 'hw-head';
    const name = document.createElement('div');
    name.className = 'hw-name';
    name.textContent = d.name;
    head.appendChild(name);
    let badge = null;
    if (o.badge) {
      badge = document.createElement('span');
      badge.className = 'badge ' + (o.badgeCls || '');
      badge.textContent = o.badge;
      head.appendChild(badge);
    }
    row.appendChild(head);

    const spec = document.createElement('div');
    spec.className = 'hw-spec';
    spec.textContent = o.sp || hwSpec(d);
    row.appendChild(spec);
    const size = document.createElement('div');
    size.className = 'hw-size';
    size.textContent = o.sizeText || ('占 ' + d.size[0] + '×' + d.size[1] + ' 格');
    row.appendChild(size);

    let qtyVal = null, qtyMinus = null, qtyPlus = null;
    if (o.qty) {
      const qty = document.createElement('div');
      qty.className = 'hw-qty';
      const label = document.createElement('span');
      label.textContent = '数量';
      qtyMinus = document.createElement('button');
      qtyMinus.type = 'button';
      qtyMinus.className = 'qminus';
      qtyMinus.textContent = '−';
      qtyMinus.setAttribute('aria-label', '减少购买数量');
      qtyMinus.addEventListener('click', () => stepHwQty(o.qty.id, -1));
      qtyVal = document.createElement('b');
      qtyVal.className = 'qval';
      qtyVal.textContent = String(o.qty.value);
      qtyPlus = document.createElement('button');
      qtyPlus.type = 'button';
      qtyPlus.className = 'qplus';
      qtyPlus.textContent = '+';
      qtyPlus.setAttribute('aria-label', '增加购买数量');
      qtyPlus.addEventListener('click', () => stepHwQty(o.qty.id, 1));
      qty.appendChild(label);
      qty.appendChild(qtyMinus);
      qty.appendChild(qtyVal);
      qty.appendChild(qtyPlus);
      row.appendChild(qty);
    }

    const buy = document.createElement('div');
    buy.className = 'hw-buy';
    const price = document.createElement('div');
    price.className = 'pr';
    price.textContent = o.pr;
    buy.appendChild(price);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'buy';
    btn.textContent = o.btn;
    if (o.disabled) btn.disabled = true;
    else if (o.onClick) btn.addEventListener('click', o.onClick);
    buy.appendChild(btn);
    row.appendChild(buy);

    rows[o.key] = {
      row: row, btn: btn, pr: price, badge: badge,
      qtyCard: o.qty ? { id: o.qty.id } : null,
      qtyVal: qtyVal, qtyMinus: qtyMinus, qtyPlus: qtyPlus,
      purchasable: !!o.funds && !o.disabled && !!o.onClick, buyLabel: o.btn,
    };
    return row;
  }

  function makeProductCard(o) {
    const row = document.createElement('article');
    row.className = 'hw-product' + (o.cls ? ' ' + o.cls : '');
    if (o.key) row.dataset.key = o.key;

    const preview = document.createElement('div');
    preview.className = 'hw-preview';
    preview.innerHTML = o.art || '';
    row.appendChild(preview);

    const head = document.createElement('div');
    head.className = 'hw-head';
    const name = document.createElement('div');
    name.className = 'hw-name';
    name.textContent = o.nm;
    head.appendChild(name);
    let badge = null;
    if (o.badge) {
      badge = document.createElement('span');
      badge.className = 'badge ' + (o.badgeCls || '');
      badge.textContent = o.badge;
      head.appendChild(badge);
    }
    row.appendChild(head);

    const spec = document.createElement('div');
    spec.className = 'hw-spec';
    spec.textContent = o.sp;
    row.appendChild(spec);

    let fill = null, pct = null;
    if (o.dl) {
      const bar = document.createElement('div');
      bar.className = 'dlbar';
      fill = document.createElement('i');
      pct = document.createElement('b');
      pct.textContent = '0%';
      bar.appendChild(fill); bar.appendChild(pct);
      row.appendChild(bar);
    }

    const buy = document.createElement('div');
    buy.className = 'hw-buy';
    const price = document.createElement('div');
    price.className = 'pr';
    price.textContent = o.pr;
    buy.appendChild(price);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'buy';
    btn.textContent = o.btn;
    if (o.disabled) btn.disabled = true;
    else if (o.onClick) btn.addEventListener('click', o.onClick);
    buy.appendChild(btn);
    row.appendChild(buy);

    if (o.key) rows[o.key] = {
      row: row, btn: btn, pr: price, badge: badge, fill: fill, pct: pct,
      purchasable: !!o.funds && !o.disabled && !!o.onClick, buyLabel: o.btn,
    };
    return row;
  }

  function renderCategoryTabs(body, categories, active, countOf, onSelect) {
    const nav = document.createElement('nav');
    nav.className = 'shop-tabs';
    nav.setAttribute('aria-label', '分类');
    categories.forEach(cat => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'shop-tab' + (active === cat.id ? ' on' : '');
      tab.dataset.category = cat.id;
      const name = document.createElement('span');
      name.textContent = cat.name;
      const num = document.createElement('small');
      num.textContent = String(countOf(cat));
      tab.appendChild(name); tab.appendChild(num);
      tab.addEventListener('click', () => {
        if (active === cat.id) return;
        root.Audio.click();
        onSelect(cat.id);
      });
      nav.appendChild(tab);
    });
    body.appendChild(nav);
  }

  function centerActiveTab(body) {
    const active = body.querySelector('.shop-tab.on');
    if (!active) return;
    const bar = active.parentElement;
    bar.scrollLeft = active.offsetLeft - (bar.clientWidth - active.clientWidth) / 2;
  }

  function aiArt(count) {
    return '<svg class="market-svg ai-art" viewBox="0 0 120 72" aria-hidden="true">' +
      '<g class="ai-pins"><path d="M44 8v6M60 8v6M76 8v6M44 58v6M60 58v6M76 58v6M30 20h6M30 36h6M30 52h6M84 20h6M84 36h6M84 52h6"/></g>' +
      '<rect class="ai-body" x="36" y="14" width="48" height="44" rx="5"/>' +
      '<rect class="ai-screen" x="42" y="20" width="36" height="27" rx="2"/>' +
      '<circle class="ai-eye" cx="52" cy="31" r="2.4"/><circle class="ai-eye" cx="68" cy="31" r="2.4"/>' +
      '<path class="ai-mouth" d="M53 39q7 5 14 0"/>' +
      '<text x="60" y="65" text-anchor="middle">代理 ×' + count + '</text></svg>';
  }

  function miningArt(rate) {
    return '<svg class="market-svg mining-art" viewBox="0 0 120 72" aria-hidden="true">' +
      '<path class="rig-frame" d="M17 17h86v40H17z"/>' +
      '<rect class="rig-screen" x="23" y="23" width="20" height="20" rx="2"/><rect class="rig-screen" x="50" y="23" width="20" height="20" rx="2"/>' +
      '<path class="rig-lines" d="M28 29h10M28 34h7M55 29h10M55 34h7M23 49h47M23 53h31"/>' +
      '<circle class="rig-fan" cx="88" cy="35" r="12"/><path class="rig-blade" d="M88 25q8 5 4 10M99 35q-5 8-10 4M88 45q-8-5-4-10M77 35q5-8 10-4"/>' +
      '<circle class="rig-coin" cx="101" cy="55" r="9"/><text x="101" y="59" text-anchor="middle">¥</text>' +
      '<text x="60" y="69" text-anchor="middle">矿机 ¥' + rate + '/s</text></svg>';
  }

  function softwareArt(type) {
    const label = {
      crawler: 'DATA', trainer: 'TRAIN', order: 'ORDER', optimizer: 'OPT',
      scheduler: 'SCHED', pipeline: 'PIPE', gateway: 'GATE', empty: 'EMPTY',
    }[type] || 'CODE';
    return '<svg class="market-svg soft-art" viewBox="0 0 120 72" aria-hidden="true">' +
      '<rect class="punch-body" x="20" y="8" width="80" height="56" rx="4"/>' +
      '<g class="punch-holes"><circle cx="27" cy="15" r="2"/><circle cx="93" cy="15" r="2"/><circle cx="27" cy="57" r="2"/><circle cx="93" cy="57" r="2"/></g>' +
      '<rect class="punch-screen" x="31" y="17" width="58" height="31" rx="2"/>' +
      '<path class="punch-code" d="M39 25h10M39 31h18M39 37h13M55 25h24M55 31h16"/>' +
      '<text x="60" y="58" text-anchor="middle">' + label + '</text></svg>';
  }

  function orderArt(o) {
    const t = C.ORDER_TYPES[o.type];
    return '<div class="ticket-art" style="--c:' + t.color + '">' +
      '<i>' + t.stamp + '</i><span></span><span></span><span></span><b>WORK ' + o.workload + '</b></div>';
  }

  function renderShopGroup(body, label, defs, lvl) {
    if (!defs.length) return;
    body.appendChild(sec(label + ' · ' + defs.length + ' 件'));
    const grid = document.createElement('div');
    grid.className = 'hw-grid';
    defs.forEach(d => {
      const key = 'hw:' + d.id;
      const inTransit = st.deliveries.filter(x => x.item === 'hw' && x.defId === d.id && x.target === st.activeServer).length;
      const cnt = root.Sim.hwCount(st, d.id, st.activeServer);
      const price = root.Sim.hardwarePrice(st, d);
      const room = C.CONST.hwPerMachine - cnt;
      let opt = {
        key: key, cls: 'next', sp: hwSpec(d),
        pr: money(price), btn: '下单',
        onClick: () => api.buyHardware(d.id, hwQty[d.id] || 1),
      };
      if (d.unlock > lvl) {
        opt = {
          key: key, cls: 'dim', sp: hwSpec(d) + ' · L' + d.unlock + ' 解锁',
          badge: 'L' + d.unlock, pr: money(price), btn: '锁', disabled: true,
        };
      } else if (room <= 0) {
        opt = {
          key: key, cls: 'dim', sp: hwSpec(d),
          badge: cnt + ' / ' + C.CONST.hwPerMachine, pr: '—', btn: '已满', disabled: true,
        };
      } else {
        const q = Math.max(1, Math.min(hwQty[d.id] || 1, room));
        hwQty[d.id] = q;
        opt = {
          key: key, cls: inTransit ? 'transit' : 'next', sp: hwSpec(d),
          pr: money(price * q), btn: '下单' + (q > 1 ? ' ×' + q : ''), funds: true,
          badge: inTransit ? '在途' : undefined, badgeCls: 'ship',
          qty: { id: d.id, value: q },
          onClick: () => api.buyHardware(d.id, hwQty[d.id] || 1),
        };
      }
      grid.appendChild(makeHwCard(d, opt));
    });
    body.appendChild(grid);
  }

  function renderAct2Shop(body) {
    const lvl = root.Sim.modelLevel(st);
    const srv = C.SERVERS[st.activeServer];
    renderShopTabs(body);
    renderAiAutoRow(body, lvl);
    body.appendChild(sec('硬件目录 · 公共仓库 · 当前 ' + (srv ? srv.name : 'S1') + ' · 模型 L' + lvl));

    const selected = SHOP_CATEGORIES.find(cat => cat.id === shopCategory) || SHOP_CATEGORIES[0];
    const groups = selected.id === 'all' ? SHOP_CATEGORIES.slice(1) : [selected];
    groups.forEach(cat => {
      const defs = C.HARDWARE.filter(d => cat.types.indexOf(d.type) >= 0 && !d.special);
      renderShopGroup(body, cat.name, defs, lvl);
    });

    renderNpuRow(body, lvl);
  }

  function renderAiAutoRow(body, lvl) {
    if (lvl < 4) return;
    const on = st.aiAuto !== false;
    body.appendChild(sec('AI 托管 · 自动买硬件 + 自动装机'));
    body.appendChild(makeRow({
      key: 'aiAuto', cls: on ? 'owned' : 'next',
      nm: on ? 'AI 托管 · 运行中' : 'AI 托管 · 已停止',
      sp: on
        ? '每 ' + C.CONST.aiL4ActEvery + ' 秒自动挑瓶颈硬件买下并装进机箱 · 留 ¥' +
          C.CONST.keepCash.toLocaleString('en-US') + ' · 停止后不影响手动采购'
        : '已停止自动买硬件，也不会自动往机箱里放硬件 · 需要时自己下单选件',
      badge: on ? '运行中' : '已停止', badgeCls: on ? 'jit' : '',
      pr: '—', btn: on ? '一键停止' : '恢复托管',
      onClick: () => api.toggleAiAuto(),
    }));
  }

  function renderNpuRow(body, lvl) {
    const made = root.Sim.npuCount(st);
    const max = C.CONST.npuMax;
    const d = C.HARDWARE_BY_ID.npu1;
    const spec = '算力 2200 · 600W · 需 ' + C.CONST.npuStreamData.toLocaleString('en-US') + ' GB';
    body.appendChild(sec('自研流片 · 自研 NPU-1'));
    const grid = document.createElement('div');
    grid.className = 'hw-grid shop-npu-grid';
    let opt;
    if (lvl < 4) {
      opt = {
        key: 'npu', cls: 'dim', sp: spec + ' · L4 解锁',
        badge: 'L4', pr: '¥' + C.CONST.npuStreamCost.toLocaleString('en-US'),
        btn: '锁', disabled: true,
      };
    } else if (made >= max) {
      opt = {
        key: 'npu', cls: 'owned dim', sp: spec,
        badge: made + ' / ' + max, badgeCls: 'jit', pr: '—', btn: '已满', disabled: true,
      };
    } else {
      const enough = st.money >= C.CONST.npuStreamCost && st.data >= C.CONST.npuStreamData;
      opt = {
        key: 'npu', cls: enough ? 'next' : '', sp: spec,
        badge: made + ' / ' + max, pr: '¥' + C.CONST.npuStreamCost.toLocaleString('en-US'),
        btn: '流片', disabled: !enough, onClick: () => api.streamNpu(),
      };
    }
    grid.appendChild(makeHwCard(d, opt));
    body.appendChild(grid);
  }

  /* ---------------- 应用市场 ---------------- */
  function renderApps() {
    const body = els.appBody;
    if (!body) return;
    body.innerHTML = '';
    rows = {};

    renderCategoryTabs(body, APP_CATEGORIES, appCategory,
      cat => cat.kinds.reduce((n, kind) => n + (kind === 'ai' ? C.AI.length : C.MINING.length), 0),
      id => {
        appCategory = id;
        renderApps();
        body.scrollTop = 0;
        centerActiveTab(body);
      });

    const selected = APP_CATEGORIES.find(cat => cat.id === appCategory) || APP_CATEGORIES[0];
    body.appendChild(sec('数字程序 · ' + root.Sim.aiName(st) + ' 的代理 ×' + C.AI[st.aiTier].count +
      ' · 矿机 ¥' + C.MINING[st.miningTier].rate + '/s'));

    if (selected.kinds.indexOf('ai') >= 0) {
      const note = document.createElement('div');
      note.className = 'app-note';
      note.textContent = '模型本体不卖。你在机房里烧 Token 自训的 ' + root.Sim.aiName(st) +
        ' 是大脑；这里购买的是替它跑任务、点页面、发请求的执行代理，属于运行时授权。代理越多，自动燃烧越快。';
      body.appendChild(note);
      body.appendChild(sec('推理代理 · ' + C.AI.length + ' 档'));
      const grid = document.createElement('div');
      grid.className = 'hw-grid';
      C.AI.forEach((d, i) => {
        const current = i === st.aiTier;
        const past = i < st.aiTier;
        const next = i === st.aiTier + 1;
        const dl = next ? st.downloads.find(x => x.item === 'ai' && x.tier === i) : null;
        let opt = {
          key: 'ai' + i, cls: 'dim', art: aiArt(d.count), nm: '代理 ×' + d.count,
          sp: '执行进程 ×' + d.count + ' · 自动 ' + d.auto + '/s · 先升前一档',
          badge: '未解锁', pr: money(d.price), btn: '锁', disabled: true,
        };
        if (current || past) {
          opt = {
            key: 'ai' + i, cls: current ? 'owned' : 'owned dim', art: aiArt(d.count), nm: '代理 ×' + d.count,
            sp: '执行进程 ×' + d.count + ' · 自动 ' + d.auto + '/s' + (current ? ' · 运行中' : ' · 已部署'),
            badge: current ? '运行中' : '已部署', badgeCls: current ? 'jit' : '',
            pr: '已装', btn: '已装', disabled: true,
          };
        } else if (next && dl) {
          opt = {
            key: 'aiNext', cls: 'downloading', art: aiArt(d.count), nm: '代理 ×' + d.count,
            sp: '执行进程 ×' + d.count + ' · 自动 ' + d.auto + '/s · 部署 ' + d.dl + ' 秒',
            badge: st.downloads[0] === dl ? '部署中' : '排队', pr: money(d.price), btn: '部署中', disabled: true, dl: true,
          };
        } else if (next) {
          opt = {
            key: 'aiNext', cls: 'next', art: aiArt(d.count), nm: '代理 ×' + d.count,
            sp: '执行进程 ×' + d.count + ' · 自动 ' + d.auto + '/s · 部署 ' + d.dl + ' 秒',
            pr: money(d.price), btn: '部署', funds: true, onClick: () => api.orderAi(),
          };
        }
        grid.appendChild(makeProductCard(opt));
      });
      body.appendChild(grid);
    }

    if (selected.kinds.indexOf('mining') >= 0) {
      body.appendChild(sec('挖矿小程序 · ' + C.MINING.length + ' 档'));
      const grid = document.createElement('div');
      grid.className = 'hw-grid';
      C.MINING.forEach((d, i) => {
        const current = i === st.miningTier;
        const past = i < st.miningTier;
        const next = i === st.miningTier + 1;
        const dl = next ? st.downloads.find(x => x.item === 'mining' && x.tier === i) : null;
        let opt = {
          key: 'mining' + i, cls: 'dim', art: miningArt(d.rate), nm: '矿机 ¥' + d.rate + '/s',
          sp: '被动产钱 · 关窗照常 · 先升前一档',
          badge: '未解锁', pr: money(d.price), btn: '锁', disabled: true,
        };
        if (current || past) {
          opt = {
            key: 'mining' + i, cls: current ? 'owned' : 'owned dim', art: miningArt(d.rate), nm: '矿机 ¥' + d.rate + '/s',
            sp: '被动产钱 · 关窗照常' + (current ? ' · 产钱中' : ' · 已安装'),
            badge: current ? '产钱中' : '已装', badgeCls: current ? 'jit' : '',
            pr: '已装', btn: '已装', disabled: true,
          };
        } else if (next && dl) {
          opt = {
            key: 'miningNext', cls: 'downloading', art: miningArt(d.rate), nm: '矿机 ¥' + d.rate + '/s',
            sp: '被动产钱 · 下载 ' + d.dl + ' 秒',
            badge: st.downloads[0] === dl ? '下载中' : '排队', pr: money(d.price), btn: '下载中', disabled: true, dl: true,
          };
        } else if (next) {
          opt = {
            key: 'miningNext', cls: 'next', art: miningArt(d.rate), nm: '矿机 ¥' + d.rate + '/s',
            sp: '被动产钱 · 下载 ' + d.dl + ' 秒',
            pr: money(d.price), btn: '下载', funds: true, onClick: () => api.orderMining(),
          };
        }
        grid.appendChild(makeProductCard(opt));
      });
      body.appendChild(grid);
    }
  }

  /* ---------------- 订单窗口 ---------------- */
  function tag(cls, text) {
    const em = document.createElement('em');
    em.className = 'tag ' + cls;
    em.textContent = text;
    return em;
  }

  function orderQualityName(id) {
    const q = C.ORDER_QUALITY.find(x => x.id === id);
    return q ? q.name : '普通';
  }

  function orderShare() {
    return Math.max(1, root.Sim.orderCompute(st) / Math.max(1, st.active.length));
  }

  function makeTicket(o, doing) {
    const t = C.ORDER_TYPES[o.type];
    const el = document.createElement('article');
    el.className = 'hw-product order-product' + (doing ? ' doing' : '');
    el.dataset.key = 'order-' + o.id;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', '查看订单详情：' + t.name);
    el.addEventListener('click', () => openOrderDetail(o.id));
    el.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      openOrderDetail(o.id);
    });

    const preview = document.createElement('div');
    preview.className = 'hw-preview';
    preview.innerHTML = orderArt(o);
    el.appendChild(preview);

    const head = document.createElement('div');
    head.className = 'hw-head';
    const nm = document.createElement('div');
    nm.className = 'hw-name';
    nm.appendChild(document.createTextNode(t.name));
    if (o.newbie) nm.appendChild(tag('newbie', '新手'));
    if (o.quality !== 'normal' && o.type !== 'rush') nm.appendChild(tag(o.quality, orderQualityName(o.quality)));
    head.appendChild(nm);
    if (doing) {
      const badge = document.createElement('span');
      badge.className = 'badge jit';
      badge.textContent = '进行中';
      head.appendChild(badge);
    }
    el.appendChild(head);

    const osub = document.createElement('div');
    osub.className = 'hw-spec osub';
    el.appendChild(osub);

    let fill = null, pct = null;
    if (doing) {
      const bar = document.createElement('div');
      bar.className = 'obar';
      fill = document.createElement('i');
      pct = document.createElement('b');
      bar.appendChild(fill); bar.appendChild(pct);
      el.appendChild(bar);
    }

    const rew = document.createElement('div');
    rew.className = 'orew';
    const rb = document.createElement('b');
    const rs = document.createElement('span');
    if (o.dataReward) { rb.textContent = '+' + o.dataReward.toFixed(1) + ' GB'; rs.textContent = '数据'; }
    else { rb.textContent = money(o.reward); rs.textContent = '报酬'; }
    rew.appendChild(rb); rew.appendChild(rs);

    const buy = document.createElement('div');
    buy.className = 'hw-buy';
    buy.appendChild(rew);
    if (doing) {
      const badge = document.createElement('span');
      badge.className = 'badge jit';
      badge.textContent = '加工中';
      buy.appendChild(badge);
      orderRefs[o.id] = { fill: fill, pct: pct, osub: osub };
      updateTicket(o, orderRefs[o.id]);
    } else {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'buy';
      btn.textContent = '接单';
      btn.disabled = st.active.length >= root.Sim.orderConcurrency(st);
      btn.addEventListener('click', e => {
        e.stopPropagation();
        api.acceptOrder(o.id);
      });
      buy.appendChild(btn);
      const share = root.Sim.orderPreviewShare(st);
      osub.textContent = '工作量 ' + o.workload + ' · ' +
        (share > 0 ? '约 ' + Math.ceil(o.workload / share) + ' 秒' : '暂无算力');
    }
    el.appendChild(buy);
    return el;
  }

  function updateTicket(o, ref) {
    if (!ref) return;
    const prog = Math.max(0, Math.min(1, 1 - o.workLeft / o.workload));
    if (ref.fill) ref.fill.style.width = (prog * 100).toFixed(1) + '%';
    if (ref.pct) setText(ref.pct, Math.round(prog * 100) + '%', 'pct-' + o.id + '-' + Math.round(prog * 100));
    if (ref.osub) {
      const eta = Math.ceil(Math.max(0, o.workLeft) / orderShare());
      setText(ref.osub,
        '剩余 ' + Math.ceil(o.workLeft) + ' / ' + o.workload + ' · 约 ' + eta + ' 秒',
        'eta-' + o.id + '-' + eta);
    }
  }

  function orderSignature() {
    return st.orderBoard.map(o => o.id).join(',') + '|' +
      st.active.map(o => o.id).join(',') + '|' + root.Sim.orderConcurrency(st) +
      '|open:' + orderOpen;
  }

  function updateOrderChrome() {
    if (!els.orderFoot) return;
    if (orderOpen) {
      const o = st.orderBoard.find(x => x.id === orderOpen) || st.active.find(x => x.id === orderOpen);
      if (o) {
        const eta = root.Sim.orderInfo(st, o).eta;
        setText(els.orderFoot, '订单 #' + o.id + ' · 预计 ' + eta + ' 秒 · Esc 返回订单列表', 'orderFoot');
        return;
      }
    }
    const prog = root.Sim.orderProgram(st);
    const conc = root.Sim.orderConcurrency(st);
    const mode = prog ? '接单程序 v' + prog.v + ' 自动' : '手动接单';
    const sec = Math.max(0, Math.ceil(st.orderTimer));
    setText(els.orderFoot,
      '在板 ' + st.orderBoard.length + ' / ' + root.Sim.orderBoardCap(st) + ' · 进行中 ' + st.active.length + ' / ' + conc +
      ' · ' + mode + ' · 下一张 ' + sec + 's', 'orderFoot');
  }

  function openOrderDetail(id) {
    if (!st.orderBoard.some(o => o.id === id) && !st.active.some(o => o.id === id)) return false;
    if (!orderOpen && els.orderBody) orderListScroll = els.orderBody.scrollTop;
    orderOpen = id;
    renderOrders();
    if (els.orderBody) els.orderBody.scrollTop = 0;
    root.Audio.paper();
    return true;
  }

  function orderBackToList(restoreScroll) {
    if (!orderOpen) return false;
    orderOpen = 0;
    renderOrders();
    if (restoreScroll && els.orderBody) els.orderBody.scrollTop = orderListScroll;
    root.Audio.paper();
    return true;
  }

  function orderNumText(o) {
    if (o.dataReward) return '+' + o.dataReward.toFixed(1) + ' GB';
    return money(o.reward);
  }

  function renderOrderDetail(body, o) {
    const info = root.Sim.orderInfo(st, o);
    const conc = root.Sim.orderConcurrency(st);
    const full = st.active.length >= conc;

    const bar = document.createElement('div');
    bar.className = 'od-bar';
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'od-back';
    back.textContent = '← 返回订单板';
    back.addEventListener('click', () => orderBackToList(true));
    const no = document.createElement('span');
    no.className = 'od-no';
    no.textContent = '订单 #' + o.id + ' · ' + info.typeName + ' · ' + (info.qualityName || '普通');
    bar.appendChild(back);
    bar.appendChild(no);
    body.appendChild(bar);

    const sheet = document.createElement('article');
    sheet.className = 'od-sheet ' + (info.event ? 'event' : o.type);

    const hero = document.createElement('header');
    hero.className = 'od-hero';
    const art = document.createElement('div');
    art.className = 'od-art';
    art.innerHTML = orderArt(o);
    const intro = document.createElement('div');
    intro.className = 'od-intro';
    const kicker = document.createElement('div');
    kicker.className = 'od-kicker';
    const stamp = document.createElement('b');
    stamp.textContent = info.newbie ? '新手' : info.event ? '事件' : info.qualityName;
    stamp.className = 'stamp';
    const status = document.createElement('em');
    status.textContent = info.doing ? '进行中' : '待接单';
    status.className = info.doing ? 'doing' : '';
    kicker.appendChild(stamp);
    kicker.appendChild(status);
    const title = document.createElement('h2');
    title.textContent = info.typeName;
    const brief = document.createElement('p');
    brief.className = 'od-brief';
    brief.textContent = info.brief;
    intro.appendChild(kicker);
    intro.appendChild(title);
    intro.appendChild(brief);
    hero.appendChild(art);
    hero.appendChild(intro);
    sheet.appendChild(hero);

    const stats = document.createElement('div');
    stats.className = 'od-stats';
    [
      ['甲方', info.client],
      ['交接', info.contact],
      ['工作量', String(info.workload)],
      ['预计耗时', info.eta > 0 ? info.eta + ' 秒' : '暂无算力'],
      ['报酬', orderNumText(o) + (o.dataReward ? ' 数据' : '')],
    ].forEach(pair => {
      const item = document.createElement('div');
      const k = document.createElement('span');
      k.textContent = pair[0];
      const v = document.createElement('b');
      v.textContent = pair[1];
      item.appendChild(k);
      item.appendChild(v);
      stats.appendChild(item);
    });
    sheet.appendChild(stats);

    const tasks = document.createElement('section');
    tasks.className = 'od-block';
    const tasksHead = document.createElement('h3');
    tasksHead.textContent = '具体要做什么';
    tasks.appendChild(tasksHead);
    const ol = document.createElement('ol');
    ol.className = 'od-list';
    info.duties.forEach(line => {
      const li = document.createElement('li');
      li.textContent = line;
      ol.appendChild(li);
    });
    tasks.appendChild(ol);
    sheet.appendChild(tasks);

    const bottom = document.createElement('div');
    bottom.className = 'od-bottom';
    const deliv = document.createElement('section');
    deliv.className = 'od-block';
    const delivHead = document.createElement('h3');
    delivHead.textContent = '交付物';
    deliv.appendChild(delivHead);
    const chips = document.createElement('div');
    chips.className = 'od-chips';
    info.deliver.forEach(name => {
      const c = document.createElement('span');
      c.textContent = name;
      chips.appendChild(c);
    });
    deliv.appendChild(chips);
    bottom.appendChild(deliv);

    const check = document.createElement('section');
    check.className = 'od-block warn';
    const checkHead = document.createElement('h3');
    checkHead.textContent = '验收与注意';
    const checkText = document.createElement('p');
    checkText.textContent = info.check;
    check.appendChild(checkHead);
    check.appendChild(checkText);
    bottom.appendChild(check);
    sheet.appendChild(bottom);

    if (info.doing) {
      const prog = document.createElement('div');
      prog.className = 'od-progress';
      const top = document.createElement('div');
      const label = document.createElement('span');
      label.textContent = '交付进度';
      const pct = document.createElement('b');
      pct.textContent = Math.round(info.progress * 100) + '%';
      top.appendChild(label);
      top.appendChild(pct);
      const track = document.createElement('div');
      track.className = 'od-track';
      const fill = document.createElement('i');
      fill.style.width = (info.progress * 100).toFixed(1) + '%';
      track.appendChild(fill);
      prog.appendChild(top);
      prog.appendChild(track);
      sheet.appendChild(prog);
      orderDetailRefs = { fill: fill, pct: pct, progress: prog };
    }

    const actions = document.createElement('div');
    actions.className = 'od-actions';
    const hint = document.createElement('span');
    hint.textContent = info.doing ? '订单正在消耗接单算力，关窗不会中断。' : '接单后订单会移到「进行中」，按接单算力推进。';
    actions.appendChild(hint);
    if (info.doing) {
      const badge = document.createElement('b');
      badge.className = 'od-doing';
      badge.textContent = '加工中';
      actions.appendChild(badge);
    } else {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'od-buy';
      btn.textContent = full ? '并发已满' : '接下这张单';
      btn.disabled = full;
      btn.addEventListener('click', () => api.acceptOrder(o.id));
      actions.appendChild(btn);
    }
    sheet.appendChild(actions);
    body.appendChild(sheet);
  }

  function updateOrderDetail(o) {
    if (!orderDetailRefs || !o) return;
    const prog = Math.max(0, Math.min(1, 1 - o.workLeft / Math.max(1, o.workload)));
    orderDetailRefs.fill.style.width = (prog * 100).toFixed(1) + '%';
    setText(orderDetailRefs.pct, Math.round(prog * 100) + '%', 'odPct-' + o.id + '-' + Math.round(prog * 100));
  }

  function renderOrders() {
    const body = els.orderBody;
    if (!body) return;
    body.innerHTML = '';
    orderRefs = {};
    orderDetailRefs = null;
    lastChrome = {};
    if (orderOpen) {
      const open = st.orderBoard.find(o => o.id === orderOpen) || st.active.find(o => o.id === orderOpen);
      if (open) {
        renderOrderDetail(body, open);
        orderSig = orderSignature();
        updateOrderChrome();
        return;
      }
      orderOpen = 0;
    }
    const conc = root.Sim.orderConcurrency(st);
    const compute = root.Sim.orderCompute(st);

    renderCategoryTabs(body, ORDER_CATEGORIES, orderCategory,
      cat => st.orderBoard.concat(st.active).filter(o => cat.types.indexOf(o.type) >= 0).length,
      id => {
        orderCategory = id;
        renderOrders();
        body.scrollTop = 0;
        centerActiveTab(body);
      });

    const selected = ORDER_CATEGORIES.find(cat => cat.id === orderCategory) || ORDER_CATEGORIES[0];
    const matches = o => selected.types.indexOf(o.type) >= 0;
    const board = st.orderBoard.filter(matches);
    const active = st.active.filter(matches);

    body.appendChild(sec('在板订单 · ' + st.orderBoard.length + ' / ' + root.Sim.orderBoardCap(st) +
      ' · 并发 ' + st.active.length + ' / ' + conc));
    if (!board.length) {
      const e = document.createElement('div');
      e.className = 'otk-empty';
      e.textContent = st.orderBoard.length ? '这个分类暂时没有订单。' : '订单板暂时空了。约 ' + Math.round(root.Sim.orderRefreshSec(st)) + ' 秒会钉一张新的。';
      body.appendChild(e);
    }
    const boardGrid = document.createElement('div');
    boardGrid.className = 'hw-grid';
    board.forEach(o => boardGrid.appendChild(makeTicket(o, false)));
    if (board.length) body.appendChild(boardGrid);

    body.appendChild(sec('进行中 · 接单算力 ' + Math.round(compute) + '/s'));
    if (!active.length) {
      const e = document.createElement('div');
      e.className = 'otk-empty';
      e.textContent = st.active.length ? '这个分类没有进行中的订单。' :
        conc > 1 ? '接单程序会自动接单；也可以手动点「接单」。' : '点小票上的「接单」开工。';
      body.appendChild(e);
    }
    const activeGrid = document.createElement('div');
    activeGrid.className = 'hw-grid';
    active.forEach(o => activeGrid.appendChild(makeTicket(o, true)));
    if (active.length) body.appendChild(activeGrid);

    orderSig = orderSignature();
    updateOrderChrome();
  }

  /* ---------------- 软件窗口 ---------------- */
  function swEffectText(sw) {
    if (sw.type === 'crawler') {
      const d = C.SOFTWARE.crawler[sw.v - 1];
      const decayRate = root.Sim.crawlerDecayRate(st);
      const decay = Math.max(0.15, 1 - decayRate * sw.age);
      return '数据 +' + (d.rate * decay).toFixed(2) + ' GB/s · 衰减 ×' + decay.toFixed(2);
    }
    if (sw.type === 'trainer') {
      const d = C.SOFTWARE.trainer[sw.v - 1];
      const rate = Math.round(root.Sim.trainTokenRate(st).tokenPerSec);
      return '训练效率 ×' + d.eff + ' · 当前训练 ' + rate + ' Token/s';
    }
    if (sw.type === 'order') {
      const d = C.SOFTWARE.order[sw.v - 1];
      return '自动接单 · 并发 ' + d.concurrency + ' · 报酬 ×' + d.bonus;
    }
    if (sw.type === 'scheduler') {
      const d = C.SOFTWARE.scheduler[sw.v - 1];
      return '并发 +' + d.concurrency + ' · 订单板 +' + d.board +
        ' · 每单算力 -' + Math.round(d.slotSave * 100) + '%';
    }
    if (sw.type === 'pipeline') {
      const d = C.SOFTWARE.pipeline[sw.v - 1];
      return '爬虫衰减 -' + Math.round(d.decay * 100) + '% · 数据上限 ×' + d.capMult;
    }
    if (sw.type === 'gateway') {
      const d = C.SOFTWARE.gateway[sw.v - 1];
      return 'API 吞吐 ×' + d.throughput + ' · 结算单价 ×' + d.price;
    }
    const d = C.SOFTWARE.optimizer[sw.v - 1];
    return '全体算力 ×' + (1 + d.bonus).toFixed(2);
  }

  function swTagCls(type) {
    if (type === 'crawler' || type === 'pipeline') return 'data';
    if (type === 'trainer') return 'train';
    if (type === 'order' || type === 'scheduler') return 'order';
    return 'opt';
  }

  function makeSwCard(sw, idx) {
    const defs = C.SOFTWARE[sw.type];
    const d = defs[sw.v - 1];
    const card = document.createElement('article');
    card.className = 'hw-product soft-product';
    card.dataset.key = 'sw-' + idx;

    const preview = document.createElement('div');
    preview.className = 'hw-preview';
    preview.innerHTML = softwareArt(sw.type);
    card.appendChild(preview);

    const top = document.createElement('div');
    top.className = 'hw-head swtop';
    const nm = document.createElement('b');
    nm.textContent = d.name;
    const tg = document.createElement('span');
    tg.className = 'tag ' + swTagCls(sw.type);
    tg.textContent = C.SOFTWARE_TYPE_NAME[sw.type];
    top.appendChild(nm); top.appendChild(tg);

    const line = document.createElement('div');
    line.className = 'hw-spec swline';
    line.textContent = swEffectText(sw);

    const act = document.createElement('div');
    act.className = 'hw-buy swact';
    const next = defs[sw.v];
    if (next) {
      const cost = root.Sim.upgradeCostFor(st, sw.type, sw.v);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'buy';
      btn.textContent = '升级 v' + next.v + ' · ' + cost + ' 开发点';
      btn.addEventListener('click', () => api.upgradeSoftware(idx));
      act.appendChild(btn);
      swRefs.ups.push({ btn: btn, cost: cost });
    } else {
      const b = document.createElement('span');
      b.className = 'badge jit';
      b.textContent = '满级';
      act.appendChild(b);
    }
    const refund = Math.floor(Math.max(0, sw.spent || 0) * C.CONST.softwareRefund);
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.className = 'buy swrm';
    rm.textContent = '卸下 +' + refund;
    rm.title = '返还已投入开发点的一半';
    rm.addEventListener('click', () => api.removeSoftware(idx));
    act.appendChild(rm);

    card.appendChild(top); card.appendChild(line); card.appendChild(act);
    swRefs['line-' + idx] = line;
    return card;
  }

  function makeEmptyCard() {
    const c = document.createElement('article');
    c.className = 'hw-product soft-product empty';
    const preview = document.createElement('div');
    preview.className = 'hw-preview';
    preview.innerHTML = softwareArt('empty');
    const text = document.createElement('div');
    text.className = 'hw-spec';
    text.textContent = '空槽 · 写一张新卡';
    c.appendChild(preview); c.appendChild(text);
    return c;
  }

  function updateSwChrome() {
    if (!swRefs.dev) return;
    setText(swRefs.dev, String(Math.floor(st.devPoints)), 'swDev');
    setText(swRefs.data, st.data.toFixed(1) + ' / ' + root.Sim.dataCap(st) + ' GB', 'swData');
    const slots = root.Sim.softwareSlots(st);
    const used = st.software.slice(0, slots).filter(Boolean).length;
    setText(swRefs.slots, used + ' / ' + slots, 'swSlots');
    setText(swRefs.conc, String(root.Sim.orderConcurrency(st)), 'swConc');

    const full = used >= slots;
    Object.keys(swRefs).forEach(k => {
      if (k.indexOf('w-') !== 0) return;
      const r = swRefs[k];
      r.btn.disabled = full || st.devPoints < r.cost;
    });
    (swRefs.ups || []).forEach(r => { r.btn.disabled = st.devPoints < r.cost; });

    st.software.slice(0, slots).forEach((sw, i) => {
      if (!sw) return;
      const line = swRefs['line-' + i];
      if (line) line.textContent = swEffectText(sw);
    });
  }

  function swSignature() {
    const slots = root.Sim.softwareSlots(st);
    return st.software.slice(0, slots).map(x => x ? x.type + x.v : '-').join(',') + '|' + slots +
      '|L' + root.Sim.modelLevel(st) + '|' + (st.aiCoder === true ? 1 : 0);
  }

  function renderSoftware() {
    const body = els.swBody;
    if (!body) return;
    body.innerHTML = '';
    rows = {};
    swRefs = { ups: [] };
    lastChrome = {};
    const slots = root.Sim.softwareSlots(st);

    renderCategoryTabs(body, SOFTWARE_CATEGORIES, softwareCategory, cat => cat.types.length,
      id => {
        softwareCategory = id;
        renderSoftware();
        body.scrollTop = 0;
        centerActiveTab(body);
      });

    const dev = document.createElement('div');
    dev.className = 'devbar';
    dev.innerHTML = '<div><span>开发点</span><b id="swDev">0</b></div>' +
      '<div><span>数据</span><b id="swData">0 GB</b></div>' +
      '<div><span>槽位</span><b id="swSlots">0 / ' + slots + '</b></div>' +
      '<div><span>接单并发</span><b id="swConc">' + root.Sim.orderConcurrency(st) + '</b></div>';
    const codeBtn = document.createElement('button');
    codeBtn.className = 'buy codebtn';
    codeBtn.textContent = '写代码 +' + C.CONST.devPerClick;
    codeBtn.addEventListener('click', () => api.code());
    dev.appendChild(codeBtn);
    body.appendChild(dev);

    const lvl = root.Sim.modelLevel(st);
    const aiOn = st.aiCoder === true;
    const aiUnlocked = lvl >= 3;
    const aiRate = root.Sim.aiCoderRate(st);
    const perDev = C.AI_CODER.tokenPerDev;
    body.appendChild(sec('AI 写代码 · 自动开发'));
    body.appendChild(makeRow({
      key: 'aiCoder',
      cls: aiUnlocked ? (aiOn ? 'owned' : 'next') : 'dim',
      nm: 'AI 写代码 · ' + (aiOn ? '开' : '关'),
      sp: aiUnlocked
        ? '每秒 +' + aiRate.toFixed(1) + ' 开发点 · 每点 ' + perDev + ' Token（约 ' + Math.round(aiRate * perDev) + ' Token/s）'
        : 'L3 · 自写软件 解锁 · 累计烧 2,000 万 Token',
      badge: aiUnlocked ? (aiOn ? '运行中' : '待机') : 'L3',
      badgeCls: aiOn ? 'jit' : '',
      pr: '—',
      btn: aiUnlocked ? (aiOn ? '停止' : '启动') : '锁',
      disabled: !aiUnlocked,
      onClick: () => api.toggleAiCoder(),
    }));

    const selected = SOFTWARE_CATEGORIES.find(cat => cat.id === softwareCategory) || SOFTWARE_CATEGORIES[0];
    body.appendChild(sec('软件槽 · 穿孔卡'));
    const grid = document.createElement('div');
    grid.className = 'hw-grid';
    let shown = 0;
    for (let i = 0; i < slots; i++) {
      const sw = st.software[i];
      if (sw && selected.types.indexOf(sw.type) >= 0) {
        grid.appendChild(makeSwCard(sw, i));
        shown++;
      } else if (!sw && softwareCategory === 'all') {
        grid.appendChild(makeEmptyCard());
        shown++;
      }
    }
    if (shown) body.appendChild(grid);
    else {
      const e = document.createElement('div');
      e.className = 'otk-empty';
      e.textContent = '这个分类还没有安装软件，可以在下面写一张。';
      body.appendChild(e);
    }

    body.appendChild(sec('写新软件 · 开发成本 7 折'));
    const write = document.createElement('div');
    write.className = 'hw-grid';
    selected.types.forEach(type => {
      const cost = root.Sim.writeCost(type);
      const card = makeProductCard({
        key: 'w-' + type, cls: 'next', art: softwareArt(type), nm: C.SOFTWARE_TYPE_NAME[type],
        sp: C.SOFTWARE_DESC[type] + ' · v1', pr: cost + ' 开发点', btn: '写入',
        onClick: () => api.writeSoftware(type),
      });
      write.appendChild(card);
      swRefs['w-' + type] = { btn: card.querySelector('.buy'), cost: cost };
    });
    body.appendChild(write);

    const note = document.createElement('div');
    note.className = 'swnote';
    note.textContent = '爬虫产出数据（随时间衰减）；优化器放大全体算力；接单程序自动接单并提高报酬；训练器用滑尺分到的算力烧 Token；调度器叠并发、扩订单板；数据管道减衰减、抬上限；API 网关提高吞吐与单价；卸下程序返还一半开发点。';
    body.appendChild(note);

    swRefs.dev = dev.querySelector('#swDev');
    swRefs.data = dev.querySelector('#swData');
    swRefs.slots = dev.querySelector('#swSlots');
    swRefs.conc = dev.querySelector('#swConc');
    swSig = swSignature();
    updateSwChrome();
  }

  /* ---------------- 舆论 ---------------- */
  function opinionSourceName(id) {
    const src = C.OPINION_SOURCES.find(s => s.id === id);
    return src ? src.name : '普通用户';
  }

  function opinionClock(at) {
    const d = Math.max(0, Math.round((st.t || 0) - (at || 0)));
    if (d < 10) return '刚刚';
    if (d < 60) return d + ' 秒前';
    if (d < 3600) return Math.floor(d / 60) + ' 分钟前';
    return Math.floor(d / 3600) + ' 小时前';
  }

  function opinionStarsText(avg) {
    const n = Math.max(0, Math.min(5, Math.round(avg)));
    return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
  }

  function opinionSignature() {
    const o = st.opinion || {};
    return [o.seq || 0, (o.reviews || []).length, opinionFilter,
      root.Sim.modelLevel(st), root.Sim.aiName(st)].join('|');
  }

  function opinionMood(score, target) {
    if (target - score > 4) return '回升中';
    if (score - target > 4) return '回落中';
    if (score >= 70) return '口碑良好';
    if (score <= 30) return '争议较大';
    return '大致平稳';
  }

  function updateOpinionChrome() {
    if (!els.opinionFoot) return;
    const score = root.Sim.opinionScore(st);
    const target = st.opinion ? st.opinion.target || score : score;
    const avg = root.Sim.opinionStars(st);
    const counts = root.Sim.opinionCounts(st);
    const total = counts.good + counts.neutral + counts.bad;
    const mood = opinionMood(score, target);
    if (opinionRefs.score) setText(opinionRefs.score, String(Math.round(score)), 'opiScore');
    if (opinionRefs.scoreBox) {
      opinionRefs.scoreBox.classList.toggle('good', score >= 60);
      opinionRefs.scoreBox.classList.toggle('bad', score <= 40);
    }
    if (opinionRefs.mood) setText(opinionRefs.mood, mood, 'opiMood');
    if (opinionRefs.stars) setText(opinionRefs.stars, opinionStarsText(avg) + ' ' + avg.toFixed(1), 'opiStars');
    if (opinionRefs.counts) {
      setText(opinionRefs.counts, '好评 ' + counts.good + ' · 中立 ' + counts.neutral +
        ' · 差评 ' + counts.bad, 'opiCounts');
    }
    if (opinionRefs.bars) {
      const pct = n => total ? (n / total * 100).toFixed(1) + '%' : '0%';
      opinionRefs.bars.good.style.width = pct(counts.good);
      opinionRefs.bars.neutral.style.width = pct(counts.neutral);
      opinionRefs.bars.bad.style.width = pct(counts.bad);
    }
    setText(els.opinionFoot, '口碑 ' + Math.round(score) + ' / 100 · ' +
      root.Sim.opinionBand(st).name + ' · 低于 40 会压 API 需求，高于 60 会带来额外调用', 'opinionFoot');
  }

  function renderOpinion() {
    const body = els.opinionBody;
    if (!body) return;
    body.innerHTML = '';
    lastChrome = {};
    opinionRefs = {};
    const score = root.Sim.opinionScore(st);
    const target = st.opinion ? st.opinion.target || score : score;
    const band = root.Sim.opinionBand(st);
    const counts = root.Sim.opinionCounts(st);
    const total = counts.good + counts.neutral + counts.bad;
    const avg = root.Sim.opinionStars(st);

    renderCategoryTabs(body, C.OPINION_SOURCES, opinionFilter, cat => {
      if (cat.id === 'all') return total;
      return (st.opinion.reviews || []).filter(r => r.source === cat.id).length;
    }, id => {
      opinionFilter = id;
      renderOpinion();
      body.scrollTop = 0;
      centerActiveTab(body);
    });

    const head = document.createElement('section');
    head.className = 'opi-head';
    const who = document.createElement('div');
    who.className = 'opi-who';
    const name = document.createElement('b');
    name.textContent = root.Sim.aiName(st);
    const sub = document.createElement('span');
    sub.textContent = 'L' + root.Sim.modelLevel(st) + ' · ' + band.name + ' · 公开评价';
    who.appendChild(name);
    who.appendChild(sub);

    const scoreBox = document.createElement('div');
    scoreBox.className = 'opi-score' + (score >= 60 ? ' good' : score <= 40 ? ' bad' : '');
    const scoreNum = document.createElement('b');
    scoreNum.textContent = String(Math.round(score));
    const scoreMax = document.createElement('span');
    scoreMax.textContent = '/ 100';
    const mood = document.createElement('em');
    mood.textContent = opinionMood(score, target);
    scoreBox.appendChild(scoreNum);
    scoreBox.appendChild(scoreMax);
    scoreBox.appendChild(mood);
    head.appendChild(who);
    head.appendChild(scoreBox);

    const metrics = document.createElement('div');
    metrics.className = 'opi-metrics';
    const stars = document.createElement('div');
    stars.className = 'opi-stars';
    stars.textContent = opinionStarsText(avg) + ' ' + avg.toFixed(1);
    const countText = document.createElement('div');
    countText.className = 'opi-counts';
    countText.textContent = '好评 ' + counts.good + ' · 中立 ' + counts.neutral + ' · 差评 ' + counts.bad;
    metrics.appendChild(stars);
    metrics.appendChild(countText);
    head.appendChild(metrics);

    const bars = document.createElement('div');
    bars.className = 'opi-bars';
    const goodBar = document.createElement('i');
    goodBar.className = 'good';
    const neutralBar = document.createElement('i');
    neutralBar.className = 'neutral';
    const badBar = document.createElement('i');
    badBar.className = 'bad';
    const pct = n => total ? (n / total * 100).toFixed(1) + '%' : '0%';
    goodBar.style.width = pct(counts.good);
    neutralBar.style.width = pct(counts.neutral);
    badBar.style.width = pct(counts.bad);
    bars.appendChild(goodBar);
    bars.appendChild(neutralBar);
    bars.appendChild(badBar);
    head.appendChild(bars);

    const note = document.createElement('p');
    note.className = 'opi-note';
    note.textContent = '名字写进协议之后，外面的声音就会跟着模型一起变。升级、API 波动与突发世界事件都会留下评价。';
    head.appendChild(note);
    body.appendChild(head);

    opinionRefs.score = scoreNum;
    opinionRefs.scoreBox = scoreBox;
    opinionRefs.mood = mood;
    opinionRefs.stars = stars;
    opinionRefs.counts = countText;
    opinionRefs.bars = { good: goodBar, neutral: neutralBar, bad: badBar };

    const list = (st.opinion.reviews || []).filter(r => opinionFilter === 'all' || r.source === opinionFilter);
    body.appendChild(sec('最新评价 · ' + list.length + ' 条' + (opinionFilter === 'all' ? '' : ' · ' + opinionSourceName(opinionFilter))));
    if (!list.length) {
      const empty = document.createElement('div');
      empty.className = 'opi-empty';
      empty.textContent = total
        ? '这个来源下还没有评价，换个标签看看。'
        : '还没有公开评价。模型升到 L1 后，外面会开始有人讨论它。';
      body.appendChild(empty);
    } else {
      const feed = document.createElement('div');
      feed.className = 'opi-list';
      list.forEach((r, i) => {
        const card = document.createElement('article');
        card.className = 'opi-card tone-' + (r.tone || 'neutral') + (i === 0 ? ' fresh' : '');
        const top = document.createElement('div');
        top.className = 'opi-card-top';
        const av = document.createElement('span');
        av.className = 'opi-av ' + r.source;
        av.textContent = ({ dev: '研', biz: '企', user: '用', media: '媒' })[r.source] || '用';
        const meta = document.createElement('div');
        meta.className = 'opi-meta';
        const user = document.createElement('b');
        user.textContent = r.user;
        const info = document.createElement('span');
        info.textContent = opinionSourceName(r.source) + ' · ' + opinionClock(r.at);
        meta.appendChild(user);
        meta.appendChild(info);
        const star = document.createElement('em');
        star.className = 'opi-card-stars';
        star.textContent = opinionStarsText(r.stars || 3);
        top.appendChild(av);
        top.appendChild(meta);
        top.appendChild(star);

        const text = document.createElement('p');
        text.textContent = r.text;

        const foot = document.createElement('div');
        foot.className = 'opi-card-foot';
        if (r.event) {
          const ev = document.createElement('span');
          ev.className = 'opi-event';
          ev.textContent = r.event;
          foot.appendChild(ev);
        }
        const likes = document.createElement('span');
        likes.className = 'opi-likes';
        likes.textContent = '有用 ' + (2 + (r.id * 7) % 29);
        foot.appendChild(likes);

        card.appendChild(top);
        card.appendChild(text);
        card.appendChild(foot);
        feed.appendChild(card);
      });
      body.appendChild(feed);
    }

    root.Sim.markOpinionRead(st);
    opinionSig = opinionSignature();
    updateOpinionChrome();
  }

  /* ---------------- 机房日报 ---------------- */
  function newsClock(sec) {
    const s = Math.max(0, sec | 0);
    const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60;
    return (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  }

  function newsCatName(id) {
    const cat = C.NEWS_CATEGORIES.find(c => c.id === id);
    return cat ? cat.name : '公告';
  }

  function newsSignature() {
    return [st.newsSeq || 0, st.news.length, newsFilter, newsOpen,
      st.worldEvent ? st.worldEvent.id : '', st.eventRev || 0].join('|');
  }

  function updateNewsChrome() {
    if (!st) return;
    const open = newsOpen ? st.news.find(n => n.id === newsOpen) : null;
    if (open) {
      setText(els.newsFoot, '正在阅读第 ' + open.id + ' 期 · 返回列表查看全部 ' +
        st.news.length + ' 条', 'newsFoot');
    } else {
      setText(els.newsFoot, '共 ' + st.news.length + ' 条 · 未读 ' +
        root.Sim.newsUnread(st) + ' · 世界事件自动收录', 'newsFoot');
    }
    newsLiveRefs.forEach(ref => {
      const active = st.worldEvent && ref.eventId === st.worldEvent.id &&
        ref.rev === (st.eventRev | 0);
      const text = active ? '进行中 · ' + Math.ceil(st.worldEvent.remain) + 's' : '已结束';
      if (ref.el.textContent !== text) ref.el.textContent = text;
      ref.el.classList.toggle('live', !!active);
    });
  }

  function openNewsDetail(id) {
    const rec = st.news.find(n => n.id === id);
    if (!rec) return false;
    if (!newsOpen && els.newsBody) newsListScroll = els.newsBody.scrollTop;
    newsOpen = rec.id;
    renderNews();
    if (els.newsBody) els.newsBody.scrollTop = 0;
    root.Audio.paper();
    return true;
  }

  function newsBackToList(restoreScroll) {
    if (!newsOpen) return false;
    newsOpen = 0;
    renderNews();
    if (restoreScroll && els.newsBody) els.newsBody.scrollTop = newsListScroll;
    root.Audio.paper();
    return true;
  }

  function newsMoreLabel() {
    const more = document.createElement('span');
    more.className = 'news-more';
    more.textContent = '阅读全文 ▸';
    return more;
  }

  function addNewsState(el, n, cls) {
    if (!n.eventId) return;
    const state = document.createElement('span');
    state.className = cls || 'news-state';
    state.textContent = '已结束';
    el.appendChild(state);
    newsLiveRefs.push({ el: state, eventId: n.eventId, rev: n.eventRev || 0 });
  }

  function renderNewsDetail(body, rec) {
    body.innerHTML = '';
    const story = root.Sim.newsDetail(st, rec) || { deck: rec.body || '', paras: [], quote: null, byline: '' };
    const catName = newsCatName(rec.cat);
    const tone = rec.tone === 'good' || rec.tone === 'bad' ? rec.tone : 'neutral';

    const bar = document.createElement('div');
    bar.className = 'na-bar';
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'na-back';
    back.textContent = '← 返回列表';
    back.addEventListener('click', () => newsBackToList(true));
    const issue = document.createElement('span');
    issue.className = 'na-issue';
    issue.textContent = '第 ' + rec.id + ' 期 · ' + catName + ' · ' + (rec.tag || '快讯');
    bar.appendChild(back);
    bar.appendChild(issue);
    body.appendChild(bar);

    const sheet = document.createElement('article');
    sheet.className = 'na-sheet tone-' + tone;
    sheet.dataset.id = String(rec.id);

    const kicker = document.createElement('div');
    kicker.className = 'na-kicker';
    const brand = document.createElement('b');
    brand.textContent = '机房日报';
    const section = document.createElement('span');
    section.textContent = catName + ' · ' + (rec.source || '机房日报');
    kicker.appendChild(brand);
    kicker.appendChild(section);

    const title = document.createElement('h2');
    title.textContent = rec.title || '机房快讯';

    const deck = document.createElement('p');
    deck.className = 'na-deck';
    deck.textContent = story.deck || '';

    const dateline = document.createElement('div');
    dateline.className = 'na-dateline';
    const time = document.createElement('time');
    time.textContent = newsClock(rec.at);
    const byline = document.createElement('span');
    byline.textContent = story.byline || '本报编辑部';
    const stamp = document.createElement('b');
    stamp.textContent = rec.tone === 'good' ? '利好' : rec.tone === 'bad' ? '利空' : '记录';
    dateline.appendChild(time);
    dateline.appendChild(byline);
    dateline.appendChild(stamp);

    const rule = document.createElement('div');
    rule.className = 'na-rule';

    const text = document.createElement('div');
    text.className = 'na-text';
    (story.paras || []).forEach((para, i) => {
      const p = document.createElement('p');
      if (i === 0) p.className = 'na-lede';
      p.textContent = para;
      text.appendChild(p);
    });
    if (!text.childElementCount) {
      const p = document.createElement('p');
      p.className = 'na-lede';
      p.textContent = rec.body || '这条消息没有留下更多细节。';
      text.appendChild(p);
    }

    sheet.appendChild(kicker);
    sheet.appendChild(title);
    sheet.appendChild(deck);
    sheet.appendChild(dateline);
    sheet.appendChild(rule);
    sheet.appendChild(text);

    if (story.quote && story.quote.text) {
      const quote = document.createElement('blockquote');
      quote.className = 'na-quote';
      const q = document.createElement('p');
      q.textContent = '“' + story.quote.text + '”';
      quote.appendChild(q);
      if (story.quote.by) {
        const cite = document.createElement('cite');
        cite.textContent = '—— ' + story.quote.by;
        quote.appendChild(cite);
      }
      sheet.appendChild(quote);
    }

    const impact = document.createElement('aside');
    impact.className = 'na-impact tone-' + tone;
    const impactHead = document.createElement('div');
    const impactTitle = document.createElement('b');
    impactTitle.textContent = '本报影响';
    const impactSub = document.createElement('span');
    impactSub.textContent = '数值与现场';
    impactHead.appendChild(impactTitle);
    impactHead.appendChild(impactSub);
    const impactText = document.createElement('p');
    impactText.textContent = rec.fx ? '影响：' + rec.fx : '本条暂无直接的数值修正，影响以机房实际状态为准。';
    impact.appendChild(impactHead);
    impact.appendChild(impactText);
    addNewsState(impact, rec, 'news-state');
    sheet.appendChild(impact);

    const related = st.news
      .filter(n => n.id !== rec.id)
      .sort((a, b) => ((b.cat === rec.cat ? 1 : 0) - (a.cat === rec.cat ? 1 : 0)) || (b.id - a.id))
      .slice(0, 3);
    if (related.length) {
      const rel = document.createElement('section');
      rel.className = 'na-related';
      const relHead = document.createElement('div');
      relHead.className = 'na-related-head';
      relHead.textContent = '同版追踪';
      rel.appendChild(relHead);
      related.forEach(n => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'na-related-item';
        const meta = document.createElement('span');
        meta.textContent = newsCatName(n.cat) + ' · 第 ' + n.id + ' 期 · ' + newsClock(n.at);
        const name = document.createElement('b');
        name.textContent = n.title || '机房快讯';
        const brief = document.createElement('em');
        brief.textContent = n.body || '';
        item.appendChild(meta);
        item.appendChild(name);
        item.appendChild(brief);
        item.addEventListener('click', () => openNewsDetail(n.id));
        rel.appendChild(item);
      });
      sheet.appendChild(rel);
    }

    const actions = document.createElement('div');
    actions.className = 'na-actions';
    const bottomBack = document.createElement('button');
    bottomBack.type = 'button';
    bottomBack.className = 'na-back bottom';
    bottomBack.textContent = '← 返回列表';
    bottomBack.addEventListener('click', () => newsBackToList(true));
    const hint = document.createElement('span');
    hint.textContent = 'Esc 返回列表 · 分类与滚动位置会保留';
    actions.appendChild(bottomBack);
    actions.appendChild(hint);
    sheet.appendChild(actions);

    body.appendChild(sheet);
  }

  function renderNews() {
    const body = els.newsBody;
    if (!body) return;
    const keepScroll = body.scrollTop;
    newsLiveRefs = [];
    lastChrome = {};

    if (newsOpen) {
      const rec = st.news.find(n => n.id === newsOpen);
      if (rec) {
        renderNewsDetail(body, rec);
        newsSig = newsSignature();
        root.Sim.markNewsRead(st);
        updateNewsChrome();
        return;
      }
      newsOpen = 0;
    }

    body.innerHTML = '';
    const unread = root.Sim.newsUnread(st);

    renderCategoryTabs(body, C.NEWS_CATEGORIES, newsFilter, cat => {
      if (cat.id === 'all') return st.news.length;
      return st.news.filter(n => n.cat === cat.id).length;
    }, id => {
      newsFilter = id;
      renderNews();
      body.scrollTop = 0;
      centerActiveTab(body);
    });

    const banner = document.createElement('div');
    banner.className = 'news-banner';
    banner.innerHTML = '<div><b>机房日报</b><span>NEWSROOM · ROOM 404</span></div>' +
      '<em>第 ' + (st.newsSeq || 1) + ' 期 · 纸面记录，盖章为准</em>';
    body.appendChild(banner);

    const list = st.news.filter(n => newsFilter === 'all' || n.cat === newsFilter);
    if (!list.length) {
      const empty = document.createElement('div');
      empty.className = 'news-empty';
      empty.textContent = '这个版面还没有消息。世界事件、续签和模型升级会自动写进来。';
      body.appendChild(empty);
    } else {
      const grid = document.createElement('div');
      grid.className = 'news-grid';
      list.forEach((n, i) => {
        const card = document.createElement('article');
        card.className = 'news-card tone-' + (n.tone || 'neutral') +
          (n.id > (st.newsRead || 0) ? ' unread' : '') + (i % 3 === 1 ? ' tilt' : '');
        card.dataset.id = String(n.id);
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', '阅读：' + (n.title || '机房快讯'));
        card.addEventListener('click', () => openNewsDetail(n.id));
        card.addEventListener('keydown', e => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          openNewsDetail(n.id);
        });

        const meta = document.createElement('div');
        meta.className = 'news-meta';
        const tag = document.createElement('b');
        tag.textContent = n.tag || '快讯';
        const cat = document.createElement('span');
        cat.textContent = newsCatName(n.cat) + ' · ' + (n.source || '机房日报');
        const time = document.createElement('time');
        time.textContent = newsClock(n.at);
        meta.appendChild(tag); meta.appendChild(cat); meta.appendChild(time);

        const title = document.createElement('h3');
        title.textContent = n.title || '机房快讯';
        const text = document.createElement('p');
        text.textContent = n.body || '';

        card.appendChild(meta); card.appendChild(title); card.appendChild(text);
        if (n.fx) {
          const fx = document.createElement('div');
          fx.className = 'news-fx';
          fx.textContent = '影响：' + n.fx;
          card.appendChild(fx);
        }
        addNewsState(card, n, 'news-state');
        card.appendChild(newsMoreLabel());
        const mark = document.createElement('i');
        mark.className = 'news-stamp';
        mark.textContent = n.tone === 'good' ? '利好' : n.tone === 'bad' ? '利空' : '记录';
        card.appendChild(mark);

        grid.appendChild(card);
      });
      body.appendChild(grid);
    }

    body.scrollTop = keepScroll;
    newsSig = newsSignature();
    root.Sim.markNewsRead(st);
    updateNewsChrome();
    if (unread > 0) root.Audio.paper();
  }

  /* ---------------- API 服务 ---------------- */
  function apiSignature() {
    return [apiTab, st.apiOpen === true ? 1 : 0, st.apiTier,
      root.Sim.modelLevel(st), root.Sim.apiUnlocked(st) ? 1 : 0].join('|');
  }

  function apiClock(sec) {
    const s = Math.max(0, sec | 0);
    const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, ss = s % 60;
    return (h ? h + ':' : '') + String(m).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
  }

  function apiStat(label) {
    const box = document.createElement('div');
    box.className = 'api-stat';
    const lab = document.createElement('span');
    lab.textContent = label;
    const val = document.createElement('b');
    val.textContent = '0';
    const sub = document.createElement('small');
    sub.textContent = '—';
    box.appendChild(lab); box.appendChild(val); box.appendChild(sub);
    return { box, val, sub };
  }

  function apiTotals() {
    const wrap = document.createElement('div');
    wrap.className = 'api-totals';
    const add = (label, key) => {
      const d = document.createElement('div');
      const s = document.createElement('span');
      s.textContent = label;
      const b = document.createElement('b');
      b.textContent = '0';
      d.appendChild(s); d.appendChild(b);
      wrap.appendChild(d);
      apiRefs[key] = b;
    };
    add('累计请求', 'totalReq');
    add('累计收入', 'totalRev');
    add('累计燃烧', 'totalBurn');
    add('入库提问', 'dbCount');
    return wrap;
  }

  function renderApiTabs(body) {
    const nav = document.createElement('nav');
    nav.className = 'shop-tabs api-tabs';
    nav.setAttribute('aria-label', 'API 服务页面');
    API_TABS.forEach(def => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'shop-tab' + (apiTab === def.id ? ' on' : '');
      const name = document.createElement('span');
      name.textContent = def.name;
      tab.appendChild(name);
      if (def.id === 'db') {
        const num = document.createElement('small');
        num.textContent = String(st.apiDb.length);
        tab.appendChild(num);
        apiRefs.dbTabCount = num;
      }
      tab.addEventListener('click', () => {
        if (apiTab === def.id) return;
        apiTab = def.id;
        root.Audio.click();
        renderApi();
        if (els.apiBody) els.apiBody.scrollTop = 0;
      });
      nav.appendChild(tab);
    });
    body.appendChild(nav);
  }

  function renderApiConsole(body) {
    const dash = document.createElement('div');
    dash.className = 'api-dash';

    const head = document.createElement('div');
    head.className = 'api-head';
    const led = document.createElement('i');
    led.className = 'api-led';
    const title = document.createElement('div');
    title.className = 'api-title';
    const name = document.createElement('b');
    const status = document.createElement('small');
    title.appendChild(name); title.appendChild(status);
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'api-toggle';
    toggle.addEventListener('click', () => api.toggleApi());
    head.appendChild(led); head.appendChild(title); head.appendChild(toggle);
    dash.appendChild(head);

    const stats = document.createElement('div');
    stats.className = 'api-stats';
    const req = apiStat('请求 /s');
    const yen = apiStat('收入 /s');
    const tok = apiStat('Token /s');
    stats.appendChild(req.box); stats.appendChild(yen.box); stats.appendChild(tok.box);
    dash.appendChild(stats);
    dash.appendChild(apiTotals());

    body.appendChild(dash);
    body.appendChild(sec('服务档位'));

    const lvl = root.Sim.modelLevel(st);
    C.API_SERVICE.tiers.forEach((def, i) => {
      const n = i + 1;
      const current = n === st.apiTier;
      const next = n === (st.apiTier || 1) + 1;
      const levelOk = lvl >= def.level;
      const cls = current ? 'owned' : (next && levelOk ? 'next' : 'dim');
      const badge = current ? '当前' : (next && levelOk ? '可升级' : 'L' + def.level);
      body.appendChild(makeRow({
        key: 'apiUp' + n,
        cls: cls,
        nm: def.name,
        sp: def.desc + ' · 需求 ' + def.demand + ' 单/s · ¥' + def.yenPerToken + '/Token' +
          (levelOk ? '' : ' · 需 L' + def.level),
        badge: badge,
        badgeCls: current || (next && levelOk) ? 'jit' : '',
        pr: current ? '—' : money(def.cost),
        btn: current ? '—' : (next && levelOk ? '升级' : '锁'),
        disabled: !(next && levelOk),
        funds: next && levelOk,
        onClick: next && levelOk ? () => api.upgradeApi(n) : null,
      }));
    });

    const note = document.createElement('div');
    note.className = 'api-note';
    note.textContent = '并发 = ' + C.API_SERVICE.capacityBase + ' + 有效算力 ÷ ' + C.API_SERVICE.computePerSlot +
      '；实际速率取「并发」与「客户需求」的较小值。API 不占订单/训练滑尺，成本是 Token。';
    body.appendChild(note);

    apiRefs.led = led;
    apiRefs.title = name;
    apiRefs.status = status;
    apiRefs.toggle = toggle;
    apiRefs.reqRate = req.val; apiRefs.reqSub = req.sub;
    apiRefs.yenRate = yen.val; apiRefs.yenSub = yen.sub;
    apiRefs.tokRate = tok.val; apiRefs.tokSub = tok.sub;
  }

  function makeApiQRow(rec) {
    const row = document.createElement('article');
    row.className = 'api-q';
    row.dataset.id = rec.id;
    const time = document.createElement('span');
    time.className = 'api-q-time';
    time.textContent = apiClock(rec.at);
    const who = document.createElement('span');
    who.className = 'api-q-who';
    const user = document.createElement('b');
    user.textContent = rec.user;
    const tag = document.createElement('em');
    tag.className = 'api-tag ' + rec.topic;
    tag.textContent = rec.topicName;
    who.appendChild(user); who.appendChild(tag);
    const text = document.createElement('span');
    text.className = 'api-q-text';
    text.textContent = rec.q;
    const pay = document.createElement('span');
    pay.className = 'api-q-pay';
    const yen = document.createElement('b');
    yen.textContent = '+¥' + fmt(rec.yen);
    const tok = document.createElement('small');
    tok.textContent = rec.tokens + ' Token';
    pay.appendChild(yen); pay.appendChild(tok);
    row.appendChild(time); row.appendChild(who); row.appendChild(text); row.appendChild(pay);
    return row;
  }

  function renderApiDb(body) {
    const dash = document.createElement('div');
    dash.className = 'api-dash';
    dash.appendChild(apiTotals());
    body.appendChild(dash);

    body.appendChild(sec('用户数据库 · 抽样'));
    const head = document.createElement('div');
    head.className = 'api-db-head';
    ['时间', '用户', '问题', '结算'].forEach(t => {
      const s = document.createElement('span');
      s.textContent = t;
      head.appendChild(s);
    });
    body.appendChild(head);

    const list = document.createElement('div');
    list.className = 'api-db';
    st.apiDb.forEach(rec => list.appendChild(makeApiQRow(rec)));
    body.appendChild(list);
    apiRefs.dbList = list;
    apiRefs.dbLastId = st.apiDb.length ? st.apiDb[0].id : 0;

    if (!st.apiDb.length) {
      const empty = document.createElement('div');
      empty.className = 'api-db-empty';
      empty.textContent = '服务还没开，数据库是空的。开放 API 后，用户提问会在这里留下记录。';
      body.appendChild(empty);
      apiRefs.dbEmpty = empty;
    }

    const note = document.createElement('div');
    note.className = 'api-note';
    note.textContent = '每 ' + C.API_SERVICE.logEvery + ' 秒抽样一条请求入库，最多保留 ' + C.API_SERVICE.dbMax +
      ' 条。用户与问题均为本地生成的虚构样本。';
    body.appendChild(note);
  }

  function syncApiDb() {
    if (!apiRefs.dbList) return;
    const last = apiRefs.dbLastId || 0;
    let cut = 0;
    while (cut < st.apiDb.length && st.apiDb[cut].id > last) cut++;
    if (!cut) return;
    if (apiRefs.dbEmpty) {
      apiRefs.dbEmpty.remove();
      apiRefs.dbEmpty = null;
    }
    for (let i = cut - 1; i >= 0; i--) {
      apiRefs.dbList.insertBefore(makeApiQRow(st.apiDb[i]), apiRefs.dbList.firstChild);
    }
    while (apiRefs.dbList.children.length > C.API_SERVICE.dbMax) {
      apiRefs.dbList.removeChild(apiRefs.dbList.lastChild);
    }
    apiRefs.dbLastId = st.apiDb[0].id;
  }

  function updateApiChrome() {
    const rate = root.Sim.apiRate(st);
    const cap = root.Sim.apiCapacity(st);
    const demand = root.Sim.apiDemand(st);
    const def = root.Sim.apiTierDef(st);
    const perReq = root.Sim.apiTokenPerReq();
    const price = root.Sim.apiPricePerReq(st);
    const lvl = root.Sim.modelLevel(st);
    const on = st.apiOpen === true;
    const status = !on ? '已暂停' : (rate > 0 ? '运行中 · ' + rate.toFixed(1) + ' 单/s' : '等待算力');

    if (apiRefs.title) setText(apiRefs.title, '模型 API · ' + def.name, 'apiTitle');
    if (apiRefs.status) setText(apiRefs.status, status + ' · ' + C.MODEL_LEVELS[lvl].short + ' · ' + root.Sim.levelName(C.MODEL_LEVELS[lvl]), 'apiStatus');
    if (apiRefs.led) apiRefs.led.classList.toggle('on', on && rate > 0);
    if (apiRefs.toggle) {
      setText(apiRefs.toggle, on ? '暂停服务' : '开放服务', 'apiToggle');
      apiRefs.toggle.classList.toggle('on', on);
    }
    if (apiRefs.reqRate) setText(apiRefs.reqRate, rate.toFixed(1), 'apiReqRate');
    if (apiRefs.reqSub) {
      const gw = root.Sim.gatewayOf(st);
      setText(apiRefs.reqSub, '上限 ' + cap + ' · 需求 ' + demand + ' 单/s' +
        (gw ? ' · 网关 ×' + gw.throughput : ''), 'apiReqSub');
    }
    if (apiRefs.yenRate) setText(apiRefs.yenRate, '¥' + fmt(rate * price), 'apiYenRate');
    if (apiRefs.yenSub) setText(apiRefs.yenSub, '每单 ' + money(price), 'apiYenSub');
    if (apiRefs.tokRate) setText(apiRefs.tokRate, fmt(rate * perReq) + '/s', 'apiTokRate');
    if (apiRefs.tokSub) setText(apiRefs.tokSub, perReq + ' Token/单', 'apiTokSub');
    if (apiRefs.totalReq) setText(apiRefs.totalReq, Math.floor(st.apiRequests).toLocaleString('en-US'), 'apiTotalReq');
    if (apiRefs.totalRev) setText(apiRefs.totalRev, money(st.apiRevenue), 'apiTotalRev');
    if (apiRefs.totalBurn) setText(apiRefs.totalBurn, fmt(st.apiBurned), 'apiTotalBurn');
    if (apiRefs.dbCount) setText(apiRefs.dbCount, String(st.apiDb.length), 'apiDbCount');
    if (apiRefs.dbTabCount) setText(apiRefs.dbTabCount, String(st.apiDb.length), 'apiDbTabCount');
    if (els.apiFoot) {
      setText(els.apiFoot, apiTab === 'db'
        ? '每 ' + C.API_SERVICE.logEvery + ' 秒抽样一条 · 最多 ' + C.API_SERVICE.dbMax + ' 条 · 全部为本地生成的虚构提问'
        : '每个请求消耗 ' + perReq + ' Token · 收入按实际燃烧结算 · 关窗不中断', 'apiFoot');
    }
  }

  function renderApi() {
    const body = els.apiBody;
    if (!body) return;
    body.innerHTML = '';
    rows = {};
    apiRefs = {};
    lastChrome = {};
    renderApiTabs(body);

    if (!root.Sim.apiUnlocked(st)) {
      const note = document.createElement('div');
      note.className = 'otk-empty';
      note.textContent = 'API 服务尚未开放：' + apiUnlockText() + '后解锁。';
      body.appendChild(note);
      if (els.apiFoot) els.apiFoot.textContent = C.MODEL_LEVELS[C.API_SERVICE.unlockLevel].name.split(' · ')[0] + ' 解锁 · 客户提问会烧 Token，也会付钱';
      apiSig = apiSignature();
      return;
    }

    if (apiTab === 'db') renderApiDb(body);
    else renderApiConsole(body);
    apiSig = apiSignature();
    updateApiChrome();
  }

  /* ---------------- 每 tick 轻量同步 ---------------- */
  function setText(el, value, cacheKey) {
    if (!el) return;
    if (lastChrome[cacheKey] === value) return;
    lastChrome[cacheKey] = value;
    el.textContent = value;
  }

  function sync(state) {
    if (!state) return;
    st = state;
    const ai = root.Sim.aiCount(st);
    const auto = root.Sim.autoBurn(st);
    const mine = root.Sim.miningRate(st);

    if (st.act1Done) {
      const al = root.Sim.allocation(st);
      let split;
      if (st.active.length && al.hasTrainer) split = '接单 ' + Math.round(al.orderUsed) + '/s · 训练 ' + Math.round(al.trainUsed) + '/s';
      else if (st.active.length) split = '接单 ' + Math.round(al.orderUsed) + '/s · 未装训练器';
      else if (al.hasTrainer) split = '训练 ' + Math.round(al.trainUsed) + '/s · 无进行中订单';
      else split = '滑尺 接单 ' + Math.round(al.share * 100) + '% / 训练 ' + Math.round((1 - al.share) * 100) + '%';
      setText(els.hint, '总算力 ' + Math.round(al.total) + '/s · ' + split + ' · 开发点 ' + Math.floor(st.devPoints), 'hint');
      setText(els.chip2, '在板 ' + st.orderBoard.length + ' / ' + root.Sim.orderBoardCap(st) +
        ' · 数据 ' + big(st.data) + ' / ' + big(root.Sim.dataCap(st)) + ' GB', 'chip2');
      if (els.shopFoot) {
        const lvl = root.Sim.modelLevel(st);
        const aiOn = st.aiAuto !== false;
        const note = lvl >= 4
          ? (aiOn
            ? 'L4 · AI 托管中：每 ' + C.CONST.aiL4ActEvery + ' 秒自动买硬件 + 装机（留 ¥' +
              C.CONST.keepCash.toLocaleString('en-US') + '）'
            : 'AI 托管已停止：不自动买硬件，也不自动装机')
          : lvl >= 3
            ? 'L3 · AI 自己谈价：订单报酬 ×1.1 · 硬件走快递'
            : '实体硬件走快递 · ' + root.Sim.deliverySec(st) + ' 秒后到快递架，拆箱进公共仓库';
        setText(els.shopFoot, note, 'shopFoot');
      }
    } else {
      setText(els.hint, '代理 ×' + ai + ' · 点击 +' + fmt(root.Sim.clickGain(st)) + ' Token · 自动烧速 ' + auto + '/s', 'hint');
      setText(els.chip2, '快递 ' + root.Sim.deliverySec(st) + ' 秒送达', 'chip2');
    }
    setText(els.chip1, st.act1Done ? '第 ' + root.Sim.chapter(st).num + ' 幕' : '第 1 幕', 'chip1');
    setText(els.tbMem, '内存 ×' + root.Sim.ramMult(st), 'tbMem');
    setText(els.tbProc, '代理 ' + ai, 'tbProc');
    setText(els.tbBurn, '自动 ' + auto + '/s', 'tbBurn');
    setText(els.tbMine, '挖矿 ¥' + fmt(mine) + '/s', 'tbMine');
    setText(els.tbToken, st.endless ? '累计消耗 ' + big(st.burned) : '剩余 ' + big(st.token), 'tbToken');
    if (els.tbAi) {
      const showAi = st.act1Done && root.Sim.modelLevel(st) >= 4;
      const aiOn = st.aiAuto !== false;
      els.tbAi.classList.toggle('hidden', !showAi);
      els.tbAi.classList.toggle('off', showAi && !aiOn);
      if (showAi) setText(els.tbAi, aiOn ? 'AI托管 开' : 'AI托管 停', 'tbAi');
    }
    if (els.goal) els.goal.classList.toggle('hidden', st.act1Done);

    const poor = st.money;
    Object.keys(rows).forEach(key => {
      const r = rows[key];
      if (!r || !r.row) return;
      if (r.qtyCard) {
        updateHwQtyRow(r);
      } else {
        if (r.pr) {
          const price = priceOf(key);
          const actionable = r.purchasable || (r.btn && !r.btn.disabled);
          if (price !== null) r.row.classList.toggle('poor', actionable && poor < price && !r.row.classList.contains('owned'));
        }
        if (r.purchasable && r.btn) {
          const price = priceOf(key);
          const short = price !== null && poor < price;
          r.btn.disabled = short;
          setText(r.btn, short ? '差 ' + money(Math.ceil(price - poor)) : r.buyLabel, 'buy-' + key);
          r.btn.title = short ? '资金不足 · 还差 ' + money(Math.ceil(price - poor)) : '';
        }
      }
      if (r.badge && r.badge.classList.contains('ship')) {
        const p = transitOf(key);
        if (p) {
          const sec = Math.max(0, Math.ceil(p.remain));
          const n = r.qtyCard ? st.deliveries.filter(d => d.item === 'hw' && d.defId === r.qtyCard.id && d.target === st.activeServer).length : 0;
          setText(r.badge, '在途 ' + sec + 's' + (n > 1 ? ' ×' + n : ''), 'badge-' + key + '-' + sec + '-' + n);
        }
      }
      if (r.fill) {
        const cur = downloadFor(key);
        if (cur) {
          const prog = cur.dur > 0 ? Math.max(0, Math.min(1, 1 - cur.remain / cur.dur)) : 1;
          r.fill.style.width = (prog * 100).toFixed(1) + '%';
          setText(r.pct, Math.round(prog * 100) + '%', 'pct-' + key + '-' + Math.round(prog * 100));
        }
      }
    });

    if (current === 'orders') {
      if (orderSignature() !== orderSig) renderOrders();
      else {
        st.active.forEach(o => updateTicket(o, orderRefs[o.id]));
        if (orderOpen) updateOrderDetail(st.active.find(o => o.id === orderOpen));
        updateOrderChrome();
      }
    }
    if (current === 'software') {
      if (swSignature() !== swSig) renderSoftware();
      else updateSwChrome();
    }
    if (current === 'api') {
      if (apiSignature() !== apiSig) renderApi();
      else {
        if (apiTab === 'db') syncApiDb();
        updateApiChrome();
      }
    }
    if (current === 'news') {
      if (newsSignature() !== newsSig) renderNews();
      else updateNewsChrome();
    }
    if (current === 'opinion') {
      if (opinionSignature() !== opinionSig) renderOpinion();
      else updateOpinionChrome();
    }
    syncIcons();
  }

  function priceOf(key) {
    if (key.indexOf('ram') === 0) {
      const i = parseInt(key.slice(3), 10);
      return C.RAM[i] ? C.RAM[i].price : null;
    }
    if (key === 'gpu') return C.GPU.price;
    if (key === 'aiNext') {
      const i = st.aiTier + 1;
      return C.AI[i] ? C.AI[i].price : null;
    }
    if (key === 'miningNext') {
      const i = st.miningTier + 1;
      return C.MINING[i] ? C.MINING[i].price : null;
    }
    if (key.indexOf('hw:') === 0) {
      const d = C.HARDWARE_BY_ID[key.slice(3)];
      return d ? root.Sim.hardwarePrice(st, d) : null;
    }
    if (key.indexOf('apiUp') === 0) {
      const i = parseInt(key.slice(5), 10);
      const def = C.API_SERVICE.tiers[i - 1];
      return def ? def.cost : null;
    }
    return null;
  }

  function transitOf(key) {
    if (key.indexOf('ram') === 0) {
      const i = parseInt(key.slice(3), 10);
      return st.deliveries.find(d => d.item === 'ram' && d.tier === i) || null;
    }
    if (key === 'gpu') return st.deliveries.find(d => d.item === 'gpu') || null;
    if (key.indexOf('hw:') === 0) {
      const id = key.slice(3);
      return st.deliveries.find(d => d.item === 'hw' && d.defId === id && d.target === st.activeServer) || null;
    }
    return null;
  }

  function downloadFor(key) {
    const item = key === 'aiNext' ? 'ai' : key === 'miningNext' ? 'mining' : null;
    if (!item) return null;
    return st.downloads.find(d => d.item === item) || null;
  }

  function stepHwQty(id, delta) {
    hwQty[id] = Math.max(1, (Number(hwQty[id]) || 1) + delta);
    const r = rows['hw:' + id];
    if (r) updateHwQtyRow(r);
    root.Audio.click();
  }

  function updateHwQtyRow(r) {
    if (!r || !r.qtyCard) return;
    const def = C.HARDWARE_BY_ID[r.qtyCard.id];
    if (!def) return;
    const price = root.Sim.hardwarePrice(st, def);
    const cnt = root.Sim.hwCount(st, r.qtyCard.id, st.activeServer);
    const room = Math.max(0, C.CONST.hwPerMachine - cnt);
    if (room <= 0) {
      if (r.pr) r.pr.textContent = '—';
      if (r.qtyVal) r.qtyVal.textContent = '1';
      if (r.qtyMinus) r.qtyMinus.disabled = true;
      if (r.qtyPlus) r.qtyPlus.disabled = true;
      if (r.btn) { r.btn.disabled = true; r.btn.textContent = '已满'; }
      if (r.row) r.row.classList.remove('poor');
      return;
    }
    const afford = price > 0 ? Math.floor(st.money / price) : room;
    const cap = Math.max(0, Math.min(room, afford));
    let q = Math.max(1, Math.min(Number(hwQty[r.qtyCard.id]) || 1, room));
    if (cap >= 1) q = Math.min(q, cap);
    else q = 1;
    hwQty[r.qtyCard.id] = q;
    const total = price * q;
    const totalText = money(total);
    const qtyText = String(q);
    if (r.pr && r.pr.textContent !== totalText) r.pr.textContent = totalText;
    if (r.qtyVal && r.qtyVal.textContent !== qtyText) r.qtyVal.textContent = qtyText;
    if (r.qtyMinus) r.qtyMinus.disabled = q <= 1;
    if (r.qtyPlus) r.qtyPlus.disabled = cap < 1 || q >= cap;
    const short = st.money < total;
    if (r.btn) {
      const label = short ? '差 ' + money(total - st.money) : '下单' + (q > 1 ? ' ×' + q : '');
      r.btn.disabled = short;
      if (r.btn.textContent !== label) r.btn.textContent = label;
      r.btn.title = short ? '资金不足 · 还差 ' + money(total - st.money) : '';
    }
    if (r.row) r.row.classList.toggle('poor', short);
  }

  /* ---------------- 入口 ---------------- */
  function open() {
    Scene.openPage('hub', 'pc');
    hardClose();
    refresh(st);
  }

  // 从楼体墙面直达某个桌面窗口（订单板等）
  function openApp(name) {
    root.Scene.openPage('hub', 'pc');
    hardClose();
    refresh(st);
    if (iconEls[name]) openWindow(name, iconEls[name]);
  }

  root.Hub = {
    init, open, openApp, refresh, sync, closeAll,
    closeWindow, isWindowOpen, syncIcons,
    openWindow, currentWindow: () => current,
    newsBack: () => current === 'news' && newsBackToList(true),
    orderBack: () => current === 'orders' && orderBackToList(true),
  };
})(window);