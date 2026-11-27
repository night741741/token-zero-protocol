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
  let browserPane = 'home';
  let browserSite = 'news';
  let browserDocKey = '';
  let browserStack = [];
  let browserQuery = '';
  let browserResults = [];
  let browserHomeRefs = {};
  let searchTab = 'all';
  const searchVisited = new Set();
  let voicePostId = 0;
  let voiceListScroll = 0;

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
    browser: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="11"/><path d="M5.4 12h21.2M5.4 20h21.2"/><path d="M16 5c-3.4 3.2-3.4 18.8 0 22M16 5c3.4 3.2 3.4 18.8 0 22"/></svg>',
    trash: '<svg viewBox="0 0 32 32"><path d="M6.5 9.5h19M12.5 9.5v-3h7v3M9 9.5l1.4 16.5h11.2L23 9.5"/><path d="M13.5 14v8M18.5 14v8"/></svg>',
  };

  const ICONS = [
    { key: 'shop', name: '商店', sub: '硬件目录' },
    { key: 'apps', name: '应用市场', sub: '代理与矿机' },
    { key: 'orders', name: '订单', sub: '第 2 幕' },
    { key: 'software', name: '软件', sub: '第 2 幕' },
    { key: 'api', name: 'API 服务', sub: C.MODEL_LEVELS[C.API_SERVICE.unlockLevel].name.split(' · ')[0] + ' · 开放模型' },
    { key: 'browser', name: '浏览器', sub: '头条 / 声浪' },
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
      browserTitle: $('browserTitle'),
      browserAddr: $('browserAddr'),
      bAddrForm: $('bAddrForm'),
      browserBack: $('browserBack'),
      browserHome: $('browserHome'),
      bSearchForm: $('bSearchForm'),
      bSearchInput: $('bSearchInput'),
      bMeta: $('bMeta'),
      bHot: $('bHot'),
      bShortcuts: $('bShortcuts'),
      bQuery: $('bQuery'),
      bResults: $('bResults'),
      bDocBody: $('bDocBody'),
      bSiteNews: $('bsite-news'),
      bSiteVoice: $('bsite-voice'),
      panes: {
        home: $('bpane-home'),
        search: $('bpane-search'),
        site: $('bpane-site'),
        doc: $('bpane-doc'),
      },
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
    ['shop', 'apps', 'orders', 'software', 'api', 'browser'].forEach(name => {
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
    if (els.browserBack) els.browserBack.addEventListener('click', () => browserBack());
    if (els.browserHome) els.browserHome.addEventListener('click', () => goBrowserHome());
    if (els.bAddrForm) {
      els.bAddrForm.addEventListener('submit', e => {
        e.preventDefault();
        submitAddress(els.browserAddr ? els.browserAddr.value : '');
      });
    }
    if (els.browserAddr) {
      els.browserAddr.addEventListener('focus', () => els.browserAddr.select());
      els.browserAddr.addEventListener('keydown', e => {
        if (e.key === 'Escape') { updateBrowserChrome(); els.browserAddr.blur(); }
      });
    }
    if (els.bSearchForm) {
      els.bSearchForm.addEventListener('submit', e => {
        e.preventDefault();
        submitSearch(els.bSearchInput ? els.bSearchInput.value : '');
      });
    }
    if (els.bShortcuts) {
      els.bShortcuts.addEventListener('click', e => {
        const b = e.target.closest('[data-shortcut]');
        if (!b) return;
        const def = C.BROWSER.SHORTCUTS[Number(b.dataset.shortcut)];
        if (def) runShortcut(def);
      });
    }
    if (els.bHot) {
      els.bHot.addEventListener('click', e => {
        const b = e.target.closest('[data-hot]');
        if (!b) return;
        const item = C.BROWSER.HOT[Number(b.dataset.hot)];
        if (item) runHotTarget(item.go);
      });
    }
    if (els.bResults) {
      els.bResults.addEventListener('click', e => {
        const b = e.target.closest('[data-q]');
        if (b) {
          if (els.bSearchInput) els.bSearchInput.value = b.dataset.q;
          submitSearch(b.dataset.q);
          return;
        }
        const hit = e.target.closest('[data-hit]');
        if (!hit) return;
        const found = browserResults[Number(hit.dataset.hit)];
        if (found) openSearchHit(found);
      });
    }
    if (els.bDocBody) {
      els.bDocBody.addEventListener('click', e => {
        const b = e.target.closest('[data-doc]');
        if (!b) return;
        runDocAction(b.dataset.doc);
      });
    }
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
    else if (name === 'browser') {
      browserPane = 'home';
      browserSite = 'news';
      browserDocKey = '';
      browserStack = [];
      browserQuery = '';
      browserResults = [];
      newsFilter = 'all';
      newsOpen = 0;
      newsListScroll = 0;
      opinionFilter = 'all';
      voicePostId = 0;
      if (els.bSearchInput) els.bSearchInput.value = '';
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
        name === 'api' ? els.apiBody : null;
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
        const n = def.key === 'browser' ? unread + root.Sim.opinionUnread(st) : 0;
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
    else if (current === 'browser') renderBrowser();
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
    return [o.seq || 0, (o.reviews || []).length, opinionFilter, voicePostId,
      (o.liked || []).length, (o.likedComments || []).length, (o.notes || []).length,
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

  function isVerified(source, user) {
    const v = C.BROWSER.VERIFIED;
    if (source === 'media') return v.media !== false;
    return Array.isArray(v[source]) && v[source].indexOf(user) >= 0;
  }

  function voiceSeed(id) {
    let x = ((id | 0) * 2654435761) >>> 0;
    x ^= x >>> 15;
    x = Math.imul(x, 2246822519) >>> 0;
    x ^= x >>> 13;
    return x >>> 0;
  }

  function voiceStat(id) {
    const s = voiceSeed(id);
    return {
      likes: 3 + s % 97,
      reposts: 1 + (s >>> 7) % 23,
      comments: 3 + (s >>> 13) % 7,
    };
  }

  function voiceComments(rec) {
    const seed = voiceSeed(rec.id + 77);
    const total = voiceStat(rec.id).comments;
    const base = rec.tone === 'bad' ? 'bad' : rec.tone === 'good' ? 'good' : 'neutral';
    const pools = C.BROWSER.COMMENTS;
    const sources = ['dev', 'biz', 'user', 'media'];
    const out = [];
    let prev = '';
    for (let i = 0; i < total; i++) {
      const s = voiceSeed(seed + i * 29);
      const source = sources[s % sources.length];
      const users = C.OPINION_USERS[source] || C.OPINION_USERS.user;
      const user = users[(s >>> 5) % users.length];
      let pool = pools[base];
      if (i > 1 && (s >>> 11) % 3 === 0) pool = pools.neutral;
      let text = pool[(s >>> 17) % pool.length];
      if (prev && (s >>> 23) % 4 === 0) text = '@' + prev + ' ' + text;
      out.push({
        key: rec.id + '-' + i,
        user: user,
        source: source,
        text: text,
        verified: isVerified(source, user),
        likes: 1 + (s >>> 9) % 34,
        minutes: 2 + (s >>> 3) % 55,
        reply: prev && text.charAt(0) === '@',
      });
      prev = user;
    }
    return out;
  }

  function voiceAvatar(cls, text) {
    const av = document.createElement('span');
    av.className = 'vc-av ' + cls;
    av.textContent = text;
    return av;
  }

  function vBadge() {
    const b = document.createElement('i');
    b.className = 'vbadge';
    b.textContent = '✓';
    b.title = '已认证';
    return b;
  }

  function rerenderVoice(keep) {
    const top = keep ? els.opinionBody.scrollTop : 0;
    renderOpinion();
    if (els.opinionBody) els.opinionBody.scrollTop = top;
  }

  function renderVoiceDetail(body, rec) {
    const stat = voiceStat(rec.id);
    const comments = voiceComments(rec);
    const notes = root.Sim.opinionNotes(st, rec.id);
    const likedPost = root.Sim.opinionLiked(st, rec.id);
    const tone = rec.tone === 'good' || rec.tone === 'bad' ? rec.tone : 'neutral';
    const totalComments = comments.length + notes.length;

    const bar = document.createElement('div');
    bar.className = 'vd-bar';
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'vd-back';
    back.textContent = '← 回声浪';
    back.addEventListener('click', () => { if (!browserBack()) voiceBackToList(); });
    const issue = document.createElement('span');
    issue.className = 'vd-issue';
    issue.textContent = '帖子 #' + rec.id + ' · ' + opinionSourceName(rec.source) + ' · ' + opinionClock(rec.at);
    const me = document.createElement('span');
    me.className = 'vd-me';
    me.textContent = '内部观察员 · 只读身份';
    bar.appendChild(back);
    bar.appendChild(issue);
    bar.appendChild(me);
    body.appendChild(bar);

    const post = document.createElement('article');
    post.className = 'vd-post tone-' + tone;
    const head = document.createElement('div');
    head.className = 'vd-head';
    const av = voiceAvatar(rec.source, ({ dev: '研', biz: '企', user: '用', media: '媒' })[rec.source] || '用');
    av.classList.add('vd-av');
    av.classList.remove('vc-av');
    const name = document.createElement('div');
    name.className = 'vd-name';
    const who = document.createElement('b');
    who.textContent = rec.user;
    if (isVerified(rec.source, rec.user)) who.appendChild(vBadge());
    const meta = document.createElement('span');
    meta.textContent = opinionSourceName(rec.source) + ' · ' + opinionClock(rec.at) + ' · 来自机房内网';
    name.appendChild(who);
    name.appendChild(meta);
    head.appendChild(av);
    head.appendChild(name);

    const text = document.createElement('p');
    text.className = 'vd-text';
    text.textContent = rec.text;

    post.appendChild(head);
    post.appendChild(text);
    if (rec.event) {
      const ev = document.createElement('span');
      ev.className = 'vd-event';
      ev.textContent = rec.event;
      post.appendChild(ev);
    }

    const metrics = document.createElement('div');
    metrics.className = 'vd-metrics';
    const repost = document.createElement('span');
    repost.textContent = '转发 ' + stat.reposts + ' · 静态';
    const like = document.createElement('button');
    like.type = 'button';
    like.className = 'vd-like' + (likedPost ? ' on' : '');
    like.setAttribute('aria-pressed', likedPost ? 'true' : 'false');
    like.textContent = (likedPost ? '♥ 已赞 ' : '♥ 赞 ') + (stat.likes + (likedPost ? 1 : 0));
    like.addEventListener('click', () => {
      root.Sim.toggleOpinionLike(st, rec.id);
      root.Audio.click();
      rerenderVoice(true);
    });
    const cmt = document.createElement('span');
    cmt.textContent = '评论 ' + totalComments + ' · 星 ' + (rec.stars || 3);
    metrics.appendChild(repost);
    metrics.appendChild(like);
    metrics.appendChild(cmt);
    post.appendChild(metrics);
    body.appendChild(post);

    const head2 = document.createElement('div');
    head2.className = 'vd-sec';
    head2.textContent = '评论 · ' + totalComments + ' 条' + (notes.length ? ' · 含我的 ' + notes.length + ' 条观察' : '');
    body.appendChild(head2);

    const list = document.createElement('div');
    list.className = 'vd-comments';

    notes.forEach(n => {
      const item = document.createElement('div');
      item.className = 'vd-comment own';
      const top = document.createElement('div');
      top.className = 'vc-top';
      const cav = voiceAvatar('user', '我');
      const cm = document.createElement('div');
      cm.className = 'vc-meta';
      const cb = document.createElement('b');
      cb.textContent = '内部观察员';
      const tag = document.createElement('em');
      tag.className = 'vc-tag';
      tag.textContent = '我';
      cb.appendChild(tag);
      const cs = document.createElement('span');
      cs.textContent = '机房内网 · ' + opinionClock(n.at) + ' · 仅自己可见';
      cm.appendChild(cb);
      cm.appendChild(cs);
      const mine = document.createElement('span');
      mine.className = 'vc-like own-tag';
      mine.textContent = '观察笔记';
      top.appendChild(cav);
      top.appendChild(cm);
      top.appendChild(mine);
      const p = document.createElement('p');
      p.textContent = n.text;
      item.appendChild(top);
      item.appendChild(p);
      list.appendChild(item);
    });

    comments.forEach(c => {
      const item = document.createElement('div');
      item.className = 'vd-comment';
      const top = document.createElement('div');
      top.className = 'vc-top';
      const cav = voiceAvatar(c.source, ({ dev: '研', biz: '企', user: '用', media: '媒' })[c.source] || '用');
      const cm = document.createElement('div');
      cm.className = 'vc-meta';
      const cb = document.createElement('b');
      cb.textContent = c.user;
      if (c.verified) cb.appendChild(vBadge());
      const cs = document.createElement('span');
      cs.textContent = opinionSourceName(c.source) + ' · ' + c.minutes + ' 分钟前';
      cm.appendChild(cb);
      cm.appendChild(cs);
      const liked = root.Sim.opinionCommentLiked(st, c.key);
      const likeBtn = document.createElement('button');
      likeBtn.type = 'button';
      likeBtn.className = 'vc-like' + (liked ? ' on' : '');
      likeBtn.setAttribute('aria-pressed', liked ? 'true' : 'false');
      likeBtn.textContent = (liked ? '♥ ' : '♡ ') + (c.likes + (liked ? 1 : 0));
      likeBtn.addEventListener('click', () => {
        root.Sim.toggleOpinionCommentLike(st, c.key);
        root.Audio.click();
        rerenderVoice(true);
      });
      top.appendChild(cav);
      top.appendChild(cm);
      top.appendChild(likeBtn);
      const p = document.createElement('p');
      if (c.reply) {
        const at = document.createElement('span');
        at.className = 'vc-reply';
        const space = c.text.indexOf(' ');
        at.textContent = c.text.slice(0, space + 1);
        p.appendChild(at);
        p.appendChild(document.createTextNode(c.text.slice(space + 1)));
      } else {
        p.textContent = c.text;
      }
      item.appendChild(top);
      item.appendChild(p);
      list.appendChild(item);
    });
    body.appendChild(list);

    const form = document.createElement('form');
    form.className = 'vd-compose';
    const memo = document.createElement('div');
    memo.className = 'vd-compose-note';
    memo.textContent = '内部观察员 · 写下的内容只留在本机存档，不改变口碑';
    const row = document.createElement('div');
    row.className = 'vd-compose-row';
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.maxLength = 120;
    inp.placeholder = '写一条观察笔记…';
    inp.setAttribute('aria-label', '观察笔记');
    const send = document.createElement('button');
    send.type = 'submit';
    send.textContent = '记录';
    row.appendChild(inp);
    row.appendChild(send);
    form.appendChild(memo);
    form.appendChild(row);
    form.addEventListener('submit', e => {
      e.preventDefault();
      const res = root.Sim.addOpinionNote(st, rec.id, inp.value);
      if (!res.ok) {
        root.Audio.error();
        api.toast(res.reason || '记不下来');
        return;
      }
      root.Audio.paper();
      api.toast('观察笔记已记录在本机');
      rerenderVoice(true);
    });
    body.appendChild(form);
  }

  function openVoicePost(id) {
    const rec = (st.opinion.reviews || []).find(r => r.id === id);
    if (!rec) return false;
    if (current === 'browser') browserPush();
    if (!voicePostId && els.opinionBody) voiceListScroll = els.opinionBody.scrollTop;
    voicePostId = rec.id;
    renderOpinion();
    updateBrowserChrome();
    if (els.opinionBody) els.opinionBody.scrollTop = 0;
    root.Audio.paper();
    return true;
  }

  function voiceBackToList() {
    if (!voicePostId) return false;
    voicePostId = 0;
    renderOpinion();
    updateBrowserChrome();
    if (els.opinionBody) els.opinionBody.scrollTop = voiceListScroll;
    root.Audio.paper();
    return true;
  }

  function renderOpinion() {
    const body = els.opinionBody;
    if (!body) return;
    if (voicePostId) {
      const rec = (st.opinion.reviews || []).find(r => r.id === voicePostId);
      if (rec) {
        body.innerHTML = '';
        lastChrome = {};
        opinionRefs = {};
        renderVoiceDetail(body, rec);
        root.Sim.markOpinionRead(st);
        opinionSig = opinionSignature();
        updateOpinionChrome();
        return;
      }
      voicePostId = 0;
    }
    body.innerHTML = '';
    lastChrome = {};
    opinionRefs = {};
    const score = root.Sim.opinionScore(st);
    const target = st.opinion ? st.opinion.target || score : score;
    const band = root.Sim.opinionBand(st);
    const counts = root.Sim.opinionCounts(st);
    const total = counts.good + counts.neutral + counts.bad;
    const avg = root.Sim.opinionStars(st);
    const reviews = st.opinion.reviews || [];
    const likedN = (st.opinion.liked || []).length;
    const notes = st.opinion.notes || [];
    const unread = root.Sim.opinionUnread(st);
    const myName = root.Sim.aiName(st);

    const wrap = document.createElement('div');
    wrap.className = 'voice-wrap';

    /* 左栏：模型名片与口碑 */
    const side = document.createElement('aside');
    side.className = 'voice-side';
    const card = document.createElement('div');
    card.className = 'vs-card';
    const who = document.createElement('div');
    who.className = 'vs-who';
    const av = document.createElement('span');
    av.className = 'vs-ava';
    av.textContent = Array.from(myName)[0] || '零';
    const idBox = document.createElement('div');
    idBox.className = 'vs-id';
    const name = document.createElement('b');
    name.textContent = myName;
    name.appendChild(vBadge());
    const sub = document.createElement('span');
    sub.textContent = 'L' + root.Sim.modelLevel(st) + ' · ' + band.name;
    idBox.appendChild(name);
    idBox.appendChild(sub);
    who.appendChild(av);
    who.appendChild(idBox);
    card.appendChild(who);

    const me = document.createElement('div');
    me.className = 'vs-me';
    me.innerHTML = '<b>内部观察员</b><span>只读身份 · 点赞与笔记只留在本机</span>';
    card.appendChild(me);

    const scoreBox = document.createElement('div');
    scoreBox.className = 'opi-score vs-score' + (score >= 60 ? ' good' : score <= 40 ? ' bad' : '');
    const scoreNum = document.createElement('b');
    scoreNum.textContent = String(Math.round(score));
    const scoreMax = document.createElement('span');
    scoreMax.textContent = '/ 100';
    const mood = document.createElement('em');
    mood.textContent = opinionMood(score, target);
    scoreBox.appendChild(scoreNum);
    scoreBox.appendChild(scoreMax);
    scoreBox.appendChild(mood);
    card.appendChild(scoreBox);

    const metrics = document.createElement('div');
    metrics.className = 'opi-metrics vs-metrics';
    const stars = document.createElement('div');
    stars.className = 'opi-stars';
    stars.textContent = opinionStarsText(avg) + ' ' + avg.toFixed(1);
    const countText = document.createElement('div');
    countText.className = 'opi-counts';
    countText.textContent = '好评 ' + counts.good + ' · 中立 ' + counts.neutral + ' · 差评 ' + counts.bad;
    metrics.appendChild(stars);
    metrics.appendChild(countText);
    card.appendChild(metrics);

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
    card.appendChild(bars);

    const mineStats = document.createElement('div');
    mineStats.className = 'vs-stats';
    [['点赞', likedN], ['观察笔记', notes.length], ['未读', unread]].forEach(x => {
      const d = document.createElement('div');
      const n = document.createElement('b');
      n.textContent = String(x[1]);
      const s = document.createElement('span');
      s.textContent = x[0];
      d.appendChild(n);
      d.appendChild(s);
      mineStats.appendChild(d);
    });
    card.appendChild(mineStats);
    side.appendChild(card);

    if (notes.length) {
      const memo = document.createElement('div');
      memo.className = 'vs-notes';
      const mh = document.createElement('h3');
      mh.textContent = '我的观察';
      memo.appendChild(mh);
      notes.slice(0, 3).forEach(n => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = n.text;
        b.title = opinionClock(n.at);
        b.addEventListener('click', () => openVoicePost(n.postId));
        memo.appendChild(b);
      });
      side.appendChild(memo);
    }
    wrap.appendChild(side);

    /* 中栏：时间线 */
    const main = document.createElement('main');
    main.className = 'voice-main';
    const mhead = document.createElement('div');
    mhead.className = 'vm-head';
    const mt = document.createElement('div');
    const h2 = document.createElement('h2');
    h2.textContent = '声浪';
    const ms = document.createElement('span');
    ms.textContent = 'OPINION · 公共时间线 · 每条发言都有温度';
    mt.appendChild(h2);
    mt.appendChild(ms);
    const badge = document.createElement('em');
    badge.textContent = opinionFilter === 'all' ? total + ' 条' : opinionSourceName(opinionFilter);
    mhead.appendChild(mt);
    mhead.appendChild(badge);
    main.appendChild(mhead);

    renderCategoryTabs(main, C.OPINION_SOURCES, opinionFilter, cat => {
      if (cat.id === 'all') return total;
      return reviews.filter(r => r.source === cat.id).length;
    }, id => {
      opinionFilter = id;
      renderOpinion();
      body.scrollTop = 0;
      centerActiveTab(body);
    });

    const list = reviews.filter(r => opinionFilter === 'all' || r.source === opinionFilter);
    const feed = document.createElement('div');
    feed.className = 'opi-list voice-feed';
    const secLabel = document.createElement('div');
    secLabel.className = 'vm-sec';
    secLabel.textContent = '最新声浪 · ' + list.length + ' 条' +
      (opinionFilter === 'all' ? '' : ' · ' + opinionSourceName(opinionFilter));
    main.appendChild(secLabel);

    if (!list.length) {
      const empty = document.createElement('div');
      empty.className = 'opi-empty';
      empty.textContent = total
        ? '这个来源下还没有评价，换个标签看看。'
        : '还没有公开评价。模型升到 L1 后，外面会开始有人讨论它。';
      main.appendChild(empty);
    } else {
      list.forEach((r, i) => {
        const stat = voiceStat(r.id);
        const liked = root.Sim.opinionLiked(st, r.id);
        const noteN = notes.filter(n => n.postId === r.id).length;
        const item = document.createElement('article');
        item.className = 'opi-card voice-card tone-' + (r.tone || 'neutral') + (i === 0 ? ' fresh' : '');
        item.tabIndex = 0;
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', '查看评论：' + r.user);
        item.addEventListener('click', () => openVoicePost(r.id));
        item.addEventListener('keydown', e => {
          if (e.key !== 'Enter' && e.key !== ' ') return;
          e.preventDefault();
          openVoicePost(r.id);
        });

        const top = document.createElement('div');
        top.className = 'opi-card-top';
        const cav = document.createElement('span');
        cav.className = 'opi-av ' + r.source;
        cav.textContent = ({ dev: '研', biz: '企', user: '用', media: '媒' })[r.source] || '用';
        const meta = document.createElement('div');
        meta.className = 'opi-meta';
        const user = document.createElement('b');
        user.textContent = r.user;
        if (isVerified(r.source, r.user)) user.appendChild(vBadge());
        const info = document.createElement('span');
        info.textContent = opinionSourceName(r.source) + ' · ' + opinionClock(r.at);
        meta.appendChild(user);
        meta.appendChild(info);
        const star = document.createElement('em');
        star.className = 'opi-card-stars';
        star.textContent = opinionStarsText(r.stars || 3);
        top.appendChild(cav);
        top.appendChild(meta);
        top.appendChild(star);

        const text = document.createElement('p');
        text.textContent = r.text;

        const foot = document.createElement('div');
        foot.className = 'opi-card-foot vc-foot';
        if (r.event) {
          const ev = document.createElement('span');
          ev.className = 'opi-event';
          ev.textContent = r.event;
          foot.appendChild(ev);
        }
        const acts = document.createElement('div');
        acts.className = 'vc-acts';
        const likeBtn = document.createElement('button');
        likeBtn.type = 'button';
        likeBtn.className = 'vc-act' + (liked ? ' on' : '');
        likeBtn.setAttribute('aria-pressed', liked ? 'true' : 'false');
        likeBtn.textContent = (liked ? '♥ ' : '♡ ') + (stat.likes + (liked ? 1 : 0)) + ' 赞';
        likeBtn.addEventListener('click', e => {
          e.stopPropagation();
          root.Sim.toggleOpinionLike(st, r.id);
          root.Audio.click();
          rerenderVoice(true);
        });
        const cmtBtn = document.createElement('button');
        cmtBtn.type = 'button';
        cmtBtn.className = 'vc-act';
        cmtBtn.textContent = '✎ ' + (stat.comments + noteN) + ' 评论';
        cmtBtn.addEventListener('click', e => {
          e.stopPropagation();
          openVoicePost(r.id);
        });
        const repost = document.createElement('span');
        repost.className = 'vc-static';
        repost.textContent = '⇄ ' + stat.reposts + ' 转发';
        acts.appendChild(likeBtn);
        acts.appendChild(cmtBtn);
        acts.appendChild(repost);
        foot.appendChild(acts);

        item.appendChild(top);
        item.appendChild(text);
        item.appendChild(foot);
        feed.appendChild(item);
      });
      main.appendChild(feed);
    }
    wrap.appendChild(main);

    /* 右栏：热帖与推荐 */
    const rail = document.createElement('aside');
    rail.className = 'voice-rail';
    const hotBox = document.createElement('section');
    hotBox.className = 'vr-box';
    const hotHead = document.createElement('h3');
    hotHead.textContent = '热帖';
    hotBox.appendChild(hotHead);
    reviews.slice().sort((a, b) => voiceStat(b.id).likes - voiceStat(a.id).likes)
      .slice(0, 5).forEach((r, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'vr-hot';
        const rank = document.createElement('i');
        rank.textContent = String(i + 1);
        const txt = document.createElement('span');
        txt.textContent = r.text;
        const heat = document.createElement('small');
        heat.textContent = voiceStat(r.id).likes + ' 赞';
        b.appendChild(rank);
        b.appendChild(txt);
        b.appendChild(heat);
        b.addEventListener('click', () => openVoicePost(r.id));
        hotBox.appendChild(b);
      });
    rail.appendChild(hotBox);

    const followBox = document.createElement('section');
    followBox.className = 'vr-box';
    const fhead = document.createElement('h3');
    fhead.textContent = '推荐关注';
    followBox.appendChild(fhead);
    const seen = new Set();
    reviews.forEach(r => {
      if (seen.size >= 5 || !isVerified(r.source, r.user) || seen.has(r.user)) return;
      seen.add(r.user);
      const row = document.createElement('div');
      row.className = 'vr-follow';
      const a = document.createElement('span');
      a.className = 'opi-av ' + r.source;
      a.textContent = ({ dev: '研', biz: '企', user: '用', media: '媒' })[r.source] || '用';
      const inf = document.createElement('div');
      const nm = document.createElement('b');
      nm.textContent = r.user;
      nm.appendChild(vBadge());
      const ds = document.createElement('span');
      ds.textContent = opinionSourceName(r.source);
      inf.appendChild(nm);
      inf.appendChild(ds);
      row.appendChild(a);
      row.appendChild(inf);
      followBox.appendChild(row);
    });
    if (!seen.size) {
      const none = document.createElement('p');
      none.className = 'vr-empty';
      none.textContent = '还没有可关注的认证账号。';
      followBox.appendChild(none);
    }
    rail.appendChild(followBox);

    const rule = document.createElement('section');
    rule.className = 'vr-box vr-rule';
    rule.innerHTML = '<h3>版规</h3><p>点赞不改变口碑；观察笔记只写在本机。真实评价来自模型升级、API 波动与世界事件。</p>';
    rail.appendChild(rule);
    wrap.appendChild(rail);

    body.appendChild(wrap);

    opinionRefs.score = scoreNum;
    opinionRefs.scoreBox = scoreBox;
    opinionRefs.mood = mood;
    opinionRefs.stars = stars;
    opinionRefs.counts = countText;
    opinionRefs.bars = { good: goodBar, neutral: neutralBar, bad: badBar };

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
    if (current === 'browser') browserPush();
    if (!newsOpen && els.newsBody) newsListScroll = els.newsBody.scrollTop;
    newsOpen = rec.id;
    renderNews();
    updateBrowserChrome();
    if (els.newsBody) els.newsBody.scrollTop = 0;
    root.Audio.paper();
    return true;
  }

  function newsBackToList(restoreScroll) {
    if (!newsOpen) return false;
    newsOpen = 0;
    renderNews();
    updateBrowserChrome();
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
    back.addEventListener('click', () => { if (!browserBack()) newsBackToList(true); });
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
    brand.textContent = '头条';
    const section = document.createElement('span');
    section.textContent = catName + ' · ' + (rec.source || '头条');
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
    bottomBack.addEventListener('click', () => { if (!browserBack()) newsBackToList(true); });
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
    banner.innerHTML = '<div><b>头条</b><span>HEADLINES · ROOM 404</span></div>' +
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
        cat.textContent = newsCatName(n.cat) + ' · ' + (n.source || '头条');
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

  /* ---------------- 浏览器：路由 / 首页 / 搜索 / 文档 ---------------- */
  const BICON = {
    news: ART.news,
    voice: ART.opinion,
    guide: '<svg viewBox="0 0 32 32"><path d="M6 5.5h8a4 4 0 0 1 4 4V27a4 4 0 0 0-4-4H6z"/><path d="M26 5.5h-8a4 4 0 0 0-4 4V27a4 4 0 0 1 4-4h8z"/></svg>',
    about: '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="11"/><path d="M16 14.5V23"/><circle cx="16" cy="10" r="1.4"/></svg>',
    freebies: '<svg viewBox="0 0 32 32"><path d="M5 12.5h22v6H5zM7 18.5V27h18v-8.5M16 12.5V27"/><path d="M16 12.5c-4.5 0-6.5-2-6.5-4s2.5-2.5 4-1.2c1.2 1 2.5 5.2 2.5 5.2Zm0 0c4.5 0 6.5-2 6.5-4s-2.5-2.5-4-1.2c-1.2 1-2.5 5.2-2.5 5.2Z"/></svg>',
    hot: '<svg viewBox="0 0 32 32"><path d="M16 4c1.6 5.2-3.2 6.6-3.2 10.4 0 1.8 1.1 3 2.4 3 2 0 3-1.7 2.6-4.4 2.8 2.2 4.2 4.8 4.2 7.6A8 8 0 0 1 8 20.6C8 15 12.2 11.4 16 4Z"/></svg>',
    maker: '<svg viewBox="0 0 32 32"><path d="M20.5 5.5 26.5 11.5 12 26H6v-6z"/><path d="m17.5 8.5 6 6"/></svg>',
    changelog: '<svg viewBox="0 0 32 32"><path d="M8 5h16v22H8z"/><path d="M12 10h8M12 15h8M12 20h5"/><circle cx="22" cy="23" r="2.2"/></svg>',
  };

  function browserMetaText() {
    if (!st) return 'AI-OS 0.9 · 本地索引';
    const num = root.Sim.chapter(st).num;
    return '第 ' + num + ' 幕 · ' + (st.endless
      ? '累计消耗 ' + big(st.burned)
      : '剩余 ' + big(st.token) + ' Token');
  }

  function browserShortcutLocked(def) {
    if (def.kind !== 'app') return false;
    return isLocked({ key: def.app });
  }

  function browserHotItems() {
    return (C.BROWSER.HOT || []).slice(0, 6);
  }

  function runHotTarget(go) {
    if (!go) return;
    if (go.site) { showBrowserSite(go.site); return; }
    if (go.doc) { openBrowserDoc(go.doc); return; }
    if (go.q) submitSearch(go.q);
  }

  function syncBrowserHome() {
    if (!st) return;
    if (browserHomeRefs.meta) browserHomeRefs.meta.textContent = browserMetaText();
    const newsN = root.Sim.newsUnread(st);
    const voiceN = root.Sim.opinionUnread(st);
    if (browserHomeRefs.newsBadge) {
      browserHomeRefs.newsBadge.textContent = newsN > 99 ? '99+' : String(newsN);
      browserHomeRefs.newsBadge.classList.toggle('hidden', newsN <= 0);
    }
    if (browserHomeRefs.voiceBadge) {
      browserHomeRefs.voiceBadge.textContent = voiceN > 99 ? '99+' : String(voiceN);
      browserHomeRefs.voiceBadge.classList.toggle('hidden', voiceN <= 0);
    }
  }

  function renderBrowserHome() {
    if (!els.bMeta || !els.bHot || !els.bShortcuts) return;
    browserHomeRefs = {};
    els.bMeta.textContent = browserMetaText();
    browserHomeRefs.meta = els.bMeta;

    els.bHot.innerHTML = '';
    const hot = document.createElement('div');
    hot.className = 'bhot-head';
    hot.innerHTML = '<b>热搜榜</b><span>TRENDING</span>';
    els.bHot.appendChild(hot);
    browserHotItems().forEach((item, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'bhot-row' + (i < 3 ? ' top' : '');
      b.dataset.hot = String(i);
      const rank = document.createElement('i');
      rank.textContent = String(item.rank || i + 1);
      const tag = document.createElement('em');
      tag.textContent = item.tag || '';
      const title = document.createElement('span');
      title.textContent = item.title;
      const heat = document.createElement('small');
      heat.textContent = item.heat || '';
      b.appendChild(rank);
      b.appendChild(tag);
      b.appendChild(title);
      b.appendChild(heat);
      els.bHot.appendChild(b);
    });

    els.bShortcuts.innerHTML = '';
    const newsN = root.Sim.newsUnread(st);
    const voiceN = root.Sim.opinionUnread(st);
    C.BROWSER.SHORTCUTS.forEach((def, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'bshort' + (browserShortcutLocked(def) ? ' locked' : '');
      b.dataset.key = def.id;
      b.dataset.shortcut = String(i);
      b.title = def.title;
      const icon = document.createElement('span');
      icon.className = 'bicon';
      icon.innerHTML = BICON[def.id] || BICON.about;
      const name = document.createElement('span');
      name.textContent = def.title;
      const badge = document.createElement('i');
      badge.className = 'sbadge hidden';
      b.appendChild(icon);
      b.appendChild(name);
      b.appendChild(badge);
      if (def.id === 'news') browserHomeRefs.newsBadge = badge;
      if (def.id === 'voice') browserHomeRefs.voiceBadge = badge;
      els.bShortcuts.appendChild(b);
    });
    syncBrowserHome();
  }

  function runShortcut(def) {
    if (!def) return;
    if (def.kind === 'site') { showBrowserSite(def.site); return; }
    if (def.kind === 'doc') { openBrowserDoc(def.doc); return; }
    if (def.kind === 'app') {
      if (isLocked({ key: def.app })) {
        root.Audio.error();
        api.toast(def.app === 'api'
          ? 'API 服务：' + apiUnlockText() + '后开放。'
          : def.title + '：拆开 RTX 3060 后才会亮。');
        return;
      }
      root.Audio.click();
      openWindow(def.app, iconEls[def.app]);
    }
  }

  function browserSnapshot() {
    return {
      pane: browserPane, site: browserSite, doc: browserDocKey,
      newsOpen: newsOpen, voicePostId: voicePostId,
      query: browserQuery, tab: searchTab, results: browserResults,
      nScroll: els.newsBody ? els.newsBody.scrollTop : 0,
      vScroll: els.opinionBody ? els.opinionBody.scrollTop : 0,
      sScroll: els.bResults ? els.bResults.scrollTop : 0,
    };
  }

  function browserPush() {
    browserStack.push(browserSnapshot());
    if (browserStack.length > 24) browserStack.shift();
  }

  function browserRestore(snap) {
    if (!snap) return false;
    browserPane = snap.pane;
    browserSite = snap.site;
    browserDocKey = snap.doc;
    newsOpen = snap.newsOpen;
    voicePostId = snap.voicePostId;
    if (typeof snap.query === 'string') browserQuery = snap.query;
    if (snap.tab) searchTab = snap.tab;
    if (Array.isArray(snap.results)) browserResults = snap.results;
    renderBrowser();
    if (browserPane === 'site' && browserSite === 'news' && els.newsBody) {
      els.newsBody.scrollTop = snap.nScroll;
    }
    if (browserPane === 'site' && browserSite === 'voice' && els.opinionBody) {
      els.opinionBody.scrollTop = snap.vScroll;
    }
    if (browserPane === 'search' && els.bResults) els.bResults.scrollTop = snap.sScroll || 0;
    return true;
  }

  function browserBack() {
    if (current !== 'browser') return false;
    if (browserStack.length) return browserRestore(browserStack.pop());
    if (browserPane === 'site' && browserSite === 'news' && newsOpen) {
      newsOpen = 0;
      renderBrowser();
      if (els.newsBody) els.newsBody.scrollTop = newsListScroll;
      return true;
    }
    if (browserPane === 'site' && browserSite === 'voice' && voicePostId) {
      voicePostId = 0;
      renderBrowser();
      if (els.opinionBody) els.opinionBody.scrollTop = voiceListScroll;
      return true;
    }
    if (browserPane !== 'home') return goBrowserHome();
    return false;
  }

  function browserEsc() {
    if (current !== 'browser') return false;
    if (browserPane === 'site') {
      if (browserSite === 'news' && newsOpen) return browserBack();
      if (browserSite === 'voice' && voicePostId) return browserBack();
      return false;
    }
    if ((browserPane === 'search' || browserPane === 'doc') && browserStack.length) {
      const top = browserStack[browserStack.length - 1];
      if (top.pane === 'home') return false;
      return browserRestore(browserStack.pop());
    }
    return false;
  }

  function goBrowserHome() {
    if (current !== 'browser') return false;
    browserPane = 'home';
    browserSite = 'news';
    browserDocKey = '';
    browserStack = [];
    browserQuery = '';
    newsOpen = 0;
    voicePostId = 0;
    if (els.bSearchInput) els.bSearchInput.value = '';
    renderBrowser();
    root.Audio.paper();
    return true;
  }

  function showBrowserSite(site) {
    const def = C.BROWSER.sites[site];
    if (!def) return false;
    if (browserPane !== 'site' || browserSite !== site) browserPush();
    browserPane = 'site';
    browserSite = site;
    browserDocKey = '';
    if (site === 'news') {
      newsOpen = 0;
      if (st) root.Sim.markNewsRead(st);
    } else {
      voicePostId = 0;
      if (st) root.Sim.markOpinionRead(st);
    }
    renderBrowser();
    root.Audio.paper();
    return true;
  }

  function openBrowserDoc(key) {
    if (!key) return false;
    if (browserPane === 'doc' && browserDocKey === key) return true;
    browserPush();
    browserPane = 'doc';
    browserDocKey = key;
    renderBrowser();
    root.Audio.paper();
    return true;
  }

  function docKeyParts(key) {
    const i = key.indexOf(':');
    return i < 0 ? { kind: key, id: '' } : { kind: key.slice(0, i), id: key.slice(i + 1) };
  }

  function browserAddr() {
    if (browserPane === 'search') return 'search/' + browserQuery;
    if (browserPane === 'doc') return 'doc/' + browserDocKey.replace(':', '/');
    if (browserPane === 'site') {
      return browserSite + (browserSite === 'news' && newsOpen ? '/' + newsOpen :
        browserSite === 'voice' && voicePostId ? '/' + voicePostId : '');
    }
    return 'home';
  }

  function submitAddress(raw) {
    if (current !== 'browser') return false;
    let s = String(raw || '').trim().replace(/^aios:\/\//i, '').replace(/^\/+/, '');
    if (!s || s === 'home') return goBrowserHome();
    if (s.indexOf('search/') === 0) return submitSearch(decodeURIComponent(s.slice(7)));
    if (s.indexOf('doc/') === 0) {
      return openBrowserDoc(s.slice(4).replace(/\//g, ':'));
    }
    if (s === 'news' || s === 'voice') return showBrowserSite(s);
    if (s.indexOf('news/') === 0) {
      const id = Number(s.slice(5)) | 0;
      const rec = (st.news || []).find(n => n.id === id);
      if (!rec) { root.Audio.error(); return false; }
      browserPush();
      browserPane = 'site';
      browserSite = 'news';
      newsOpen = id;
      renderBrowser();
      if (els.newsBody) els.newsBody.scrollTop = 0;
      return true;
    }
    if (s.indexOf('voice/') === 0) return openVoicePost(Number(s.slice(6)) | 0);
    return submitSearch(s);
  }

  function browserTitle() {
    if (browserPane === 'search') return '搜索 · ' + C.BROWSER.brand;
    if (browserPane === 'doc') {
      const parts = docKeyParts(browserDocKey);
      if (parts.kind === 'about') return C.BROWSER.DOCS.about.title + ' · ' + C.BROWSER.brand;
      if (parts.kind === 'guide') return '机房攻略 · ' + C.BROWSER.brand;
      if (parts.kind === 'hot' || parts.kind === 'changelog') {
        return C.BROWSER.DOCS[parts.kind].title + ' · ' + C.BROWSER.brand;
      }
      const egg = C.BROWSER.EASTER.find(e => e.id === parts.id);
      return (egg ? egg.title : '文档') + ' · ' + C.BROWSER.brand;
    }
    if (browserPane === 'site') {
      return (browserSite === 'news' ? '头条' : '声浪') + ' · ' + C.BROWSER.brand;
    }
    return '浏览器 · ' + C.BROWSER.brand;
  }

  function updateBrowserChrome() {
    if (current !== 'browser') return;
    if (els.browserAddr && document.activeElement !== els.browserAddr) {
      els.browserAddr.value = browserAddr();
    }
    if (els.browserTitle) els.browserTitle.textContent = browserTitle();
    if (els.browserBack) els.browserBack.disabled = browserPane === 'home' && !browserStack.length;
  }

  function renderBrowser() {
    if (!els.panes) return;
    Object.keys(els.panes).forEach(key => {
      if (els.panes[key]) els.panes[key].classList.toggle('hidden', key !== browserPane);
    });
    if (els.bSiteNews) els.bSiteNews.classList.toggle('on', browserSite === 'news');
    if (els.bSiteVoice) els.bSiteVoice.classList.toggle('on', browserSite === 'voice');
    updateBrowserChrome();

    if (browserPane === 'home') renderBrowserHome();
    else if (browserPane === 'search') renderSearchResults();
    else if (browserPane === 'site') {
      if (browserSite === 'news') renderNews();
      else renderOpinion();
    } else if (browserPane === 'doc') renderDoc();
  }

  /* ---------- 本地搜索 ---------- */
  const SEARCH_TYPES = {
    site: '站内', doc: '文档', guide: '攻略', easter: '彩蛋', news: '头条', voice: '声浪',
  };
  const SEARCH_ORDER = ['site', 'doc', 'guide', 'easter', 'news', 'voice'];

  function searchNorm(text) {
    return String(text || '').toLowerCase().replace(/[\s·,，。！？!?、:：;；'"“”‘’()（）\[\]【】<>《》]/g, '');
  }

  function buildSearchIndex() {
    const out = [];
    out.push({
      type: 'site', title: '头条 · 机房编辑部', desc: C.BROWSER.sites.news.sub,
      kw: ['头条', '新闻', '快讯', '机房日报', '世界事件', '编辑部', '404'],
      site: 'news',
    });
    out.push({
      type: 'site', title: '声浪 · 公共时间线', desc: C.BROWSER.sites.voice.sub,
      kw: ['声浪', '舆论', '微博', '评价', '口碑', '评论', '时间线'],
      site: 'voice',
    });
    const about = C.BROWSER.DOCS.about;
    out.push({
      type: 'doc', title: about.title, desc: about.paras[0],
      kw: about.kw.concat(about.paras), doc: 'about',
    });
    out.push({
      type: 'doc', title: C.BROWSER.DOCS.guide.title, desc: C.BROWSER.DOCS.guide.intro,
      kw: (C.BROWSER.DOCS.guide.kw || []).concat(['攻略', '怎么玩', '新手', '教程', '玩法', '窍门']),
      doc: 'guide',
    });
    ['hot', 'changelog'].forEach(k => {
      const d = C.BROWSER.DOCS[k];
      out.push({
        type: 'doc', title: d.title, desc: d.intro || d.sub,
        kw: (d.kw || []).concat(k === 'hot' ? (C.BROWSER.HOT || []).map(h => h.title) : []),
        doc: k,
      });
    });
    C.BROWSER.GUIDES.forEach(g => {
      const extra = g.body || [];
      (g.steps || []).forEach(s => extra.push(s));
      (g.sections || []).forEach(s => {
        if (s.p) extra.push(s.p);
        if (s.h) extra.push(s.h);
        (s.list || []).forEach(x => extra.push(x));
      });
      (g.tips || []).forEach(t => extra.push(t));
      out.push({
        type: 'guide', title: g.title, desc: g.desc,
        kw: g.kw.concat([g.title, g.desc, g.lead || '', g.stage || ''], extra), doc: 'guide:' + g.id,
      });
    });
    C.BROWSER.EASTER.forEach(e => {
      out.push({
        type: 'easter', title: e.title, desc: e.desc,
        kw: e.kw.concat([e.title, e.desc], e.body || []), doc: 'easter:' + e.id,
      });
    });
    (st.news || []).forEach(n => {
      out.push({
        type: 'news', title: n.title || '机房快讯',
        desc: (n.body || '') + ' · ' + newsCatName(n.cat),
        kw: [n.title || '', n.body || '', n.tag || '', n.source || '', newsCatName(n.cat)],
        newsId: n.id,
      });
    });
    ((st.opinion && st.opinion.reviews) || []).forEach(r => {
      out.push({
        type: 'voice', title: r.user + '：' + String(r.text || '').slice(0, 22),
        desc: r.text,
        kw: [r.user, r.text, r.event || '', opinionSourceName(r.source)],
        voiceId: r.id,
      });
    });
    return out;
  }

  function searchLocal(query) {
    const q = searchNorm(query);
    if (!q) return [];
    const scored = [];
    buildSearchIndex().forEach(item => {
      let score = 0;
      (item.kw || []).forEach(k => {
        const nk = searchNorm(k);
        if (!nk) return;
        if (nk === q) score += 60;
        else if (nk.indexOf(q) === 0) score += 26;
        else if (nk.indexOf(q) >= 0) score += 12;
      });
      const nt = searchNorm(item.title);
      if (nt === q) score += 50;
      else if (nt.indexOf(q) >= 0) score += 20;
      if (searchNorm(item.desc).indexOf(q) >= 0) score += 8;
      if (score > 0) scored.push({ item: item, score: score });
    });
    scored.sort((a, b) => b.score - a.score || String(a.item.title).localeCompare(String(b.item.title)));
    return scored.slice(0, 40).map(x => x.item);
  }

  function submitSearch(raw) {
    if (current !== 'browser') return false;
    const q = String(raw || '').replace(/\s+/g, ' ').trim();
    if (!q) { goBrowserHome(); return false; }
    if (browserPane !== 'search') browserPush();
    browserPane = 'search';
    browserQuery = q;
    searchTab = 'all';
    if (els.bSearchInput) els.bSearchInput.value = q;
    browserResults = searchLocal(q);
    renderBrowser();
    if (els.bResults) els.bResults.scrollTop = 0;
    if (els.browserAddr) els.browserAddr.blur();
    root.Audio.click();
    return true;
  }

  function searchSuggestions() {
    return ['订单 并发', '白嫖 3060', '内存 带宽', '散热 风扇', '续签 百亿', '制作名单', '彩蛋'];
  }

  function hitKey(item) {
    if (!item) return '';
    if (item.site) return 'site:' + item.site;
    if (item.doc) return 'doc:' + item.doc;
    if (item.newsId) return 'news:' + item.newsId;
    if (item.voiceId) return 'voice:' + item.voiceId;
    return '';
  }

  function hitUrl(item) {
    if (item.site) return 'aios://' + item.site + '.local';
    if (item.newsId) return 'aios://news.local/p/' + item.newsId;
    if (item.voiceId) return 'aios://voice.local/p/' + item.voiceId;
    if (item.doc) return 'aios://kb/' + item.doc.replace(':', '/') + '.html';
    return 'aios://kb';
  }

  function highlightInto(el, text, q) {
    const raw = String(text || '');
    const needle = String(q || '').trim();
    if (!needle) { el.textContent = raw; return; }
    const lower = raw.toLowerCase();
    const find = needle.toLowerCase();
    let at = 0, i;
    while ((i = lower.indexOf(find, at)) >= 0) {
      if (i > at) el.appendChild(document.createTextNode(raw.slice(at, i)));
      const mark = document.createElement('mark');
      mark.textContent = raw.slice(i, i + needle.length);
      el.appendChild(mark);
      at = i + needle.length;
    }
    if (at < raw.length) el.appendChild(document.createTextNode(raw.slice(at)));
    if (!el.childNodes.length) el.textContent = raw;
  }

  function renderSearchHeader(counts) {
    if (!els.bQuery) return;
    els.bQuery.innerHTML = '';
    const form = document.createElement('form');
    form.className = 'bq-form';
    const brand = document.createElement('span');
    brand.className = 'bq-brand';
    brand.textContent = C.BROWSER.brand;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = browserQuery;
    input.maxLength = 40;
    input.setAttribute('aria-label', '搜索');
    const go = document.createElement('button');
    go.type = 'submit';
    go.textContent = '搜索';
    form.appendChild(brand);
    form.appendChild(input);
    form.appendChild(go);
    form.addEventListener('submit', e => {
      e.preventDefault();
      submitSearch(input.value);
    });
    els.bQuery.appendChild(form);

    const line = document.createElement('div');
    line.className = 'bq-line';
    const lead = document.createElement('span');
    lead.textContent = '本地索引 · 约 0.04 秒 · 共 ' + browserResults.length + ' 条';
    line.appendChild(lead);
    const tip = document.createElement('span');
    tip.className = 'bq-tip';
    tip.textContent = '地址栏可直接输入 aios://doc/guide/hardware';
    line.appendChild(tip);
    els.bQuery.appendChild(line);

    const nav = document.createElement('nav');
    nav.className = 'bq-tabs';
    nav.setAttribute('aria-label', '搜索结果分类');
    const tabs = [{ id: 'all', name: '全部', n: browserResults.length }];
    SEARCH_ORDER.forEach(type => {
      if (counts[type]) tabs.push({ id: type, name: SEARCH_TYPES[type] || type, n: counts[type] });
    });
    tabs.forEach(def => {
      const tab = document.createElement('button');
      tab.type = 'button';
      tab.className = 'bq-tab' + (searchTab === def.id ? ' on' : '');
      tab.textContent = def.name;
      const n = document.createElement('small');
      n.textContent = String(def.n);
      tab.appendChild(n);
      tab.addEventListener('click', () => {
        if (searchTab === def.id) return;
        searchTab = def.id;
        root.Audio.click();
        renderSearchResults();
        if (els.bResults) els.bResults.scrollTop = 0;
      });
      nav.appendChild(tab);
    });
    els.bQuery.appendChild(nav);
  }

  function searchResultRow(item, idx) {
    const visited = searchVisited.has(hitKey(item));
    const row = document.createElement('article');
    row.className = 'bres' + (visited ? ' visited' : '');
    row.dataset.hit = String(idx);

    const url = document.createElement('div');
    url.className = 'bres-url';
    const fav = document.createElement('i');
    fav.className = 'bres-fav t-' + item.type;
    fav.textContent = ({ site: '站', doc: '档', guide: '略', easter: '蛋', news: '头', voice: '浪' })[item.type] || '页';
    const path = document.createElement('span');
    path.className = 'bres-path';
    path.textContent = hitUrl(item);
    const kind = document.createElement('em');
    kind.textContent = SEARCH_TYPES[item.type] || item.type;
    url.appendChild(fav);
    url.appendChild(path);
    url.appendChild(kind);

    const title = document.createElement('button');
    title.type = 'button';
    title.className = 'bres-title';
    title.dataset.hit = String(idx);
    highlightInto(title, item.title, browserQuery);

    const desc = document.createElement('p');
    desc.className = 'bres-desc';
    highlightInto(desc, item.desc || '', browserQuery);

    row.appendChild(url);
    row.appendChild(title);
    row.appendChild(desc);
    return row;
  }

  function renderSiteCluster(list) {
    const box = document.createElement('section');
    box.className = 'bsite-cluster';
    const head = document.createElement('h4');
    head.textContent = '站内站点';
    box.appendChild(head);
    const grid = document.createElement('div');
    grid.className = 'bsite-cards';
    list.forEach(item => {
      const idx = browserResults.indexOf(item);
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'bsite-card';
      card.dataset.hit = String(idx);
      const top = document.createElement('span');
      top.className = 'bsite-name';
      highlightInto(top, item.title, browserQuery);
      const sub = document.createElement('i');
      sub.textContent = hitUrl(item);
      const p = document.createElement('span');
      p.className = 'bsite-desc';
      p.textContent = item.desc || '';
      card.appendChild(top);
      card.appendChild(sub);
      card.appendChild(p);
      grid.appendChild(card);
    });
    box.appendChild(grid);
    return box;
  }

  function renderRelated() {
    const box = document.createElement('section');
    box.className = 'brelated';
    const head = document.createElement('h4');
    head.textContent = '相关搜索';
    box.appendChild(head);
    const grid = document.createElement('div');
    grid.className = 'brelated-grid';
    const seen = new Set([browserQuery]);
    searchSuggestions().concat([browserQuery + ' 攻略', browserQuery + ' 彩蛋']).forEach(q => {
      if (seen.has(q) || seen.size > 8) return;
      seen.add(q);
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.q = q;
      b.textContent = q;
      grid.appendChild(b);
    });
    box.appendChild(grid);
    return box;
  }

  function renderSearchResults() {
    const body = els.bResults;
    if (!body) return;
    const counts = {};
    browserResults.forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });
    renderSearchHeader(counts);
    body.innerHTML = '';

    if (!browserResults.length) {
      const empty = document.createElement('div');
      empty.className = 'bempty';
      const b = document.createElement('b');
      b.textContent = '没有找到这一页';
      empty.appendChild(b);
      empty.appendChild(document.createTextNode('本地索引只收机房里的东西。检查地址，或者换个词：'));
      const sugg = document.createElement('div');
      sugg.className = 'bsugg';
      searchSuggestions().forEach(q => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.q = q;
        btn.textContent = q;
        sugg.appendChild(btn);
      });
      empty.appendChild(sugg);
      body.appendChild(empty);
      return;
    }

    if (searchTab === 'all') {
      const sites = browserResults.filter(r => r.type === 'site');
      if (sites.length) body.appendChild(renderSiteCluster(sites));
    }
    const list = searchTab === 'all'
      ? browserResults.filter(r => r.type !== 'site')
      : browserResults.filter(r => r.type === searchTab);

    if (!list.length && searchTab === 'all') {
      const only = document.createElement('div');
      only.className = 'bonly-sites';
      only.textContent = '全部命中都是站内页面，已在上面列出。';
      body.appendChild(only);
    }

    if (list.length) {
      const wrap = document.createElement('div');
      wrap.className = 'bres-list';
      list.forEach(item => wrap.appendChild(searchResultRow(item, browserResults.indexOf(item))));
      body.appendChild(wrap);
    } else if (searchTab !== 'all') {
      const empty = document.createElement('div');
      empty.className = 'bempty small';
      empty.textContent = '这个分类下没有结果，切回「全部」看看。';
      body.appendChild(empty);
    }
    body.appendChild(renderRelated());
  }

  function openSearchHit(item) {
    if (!item) return;
    searchVisited.add(hitKey(item));
    if (item.site) { showBrowserSite(item.site); return; }
    if (item.doc) { openBrowserDoc(item.doc); return; }
    if (item.newsId) {
      browserPush();
      browserPane = 'site';
      browserSite = 'news';
      newsOpen = item.newsId;
      renderBrowser();
      if (els.newsBody) els.newsBody.scrollTop = 0;
      root.Audio.paper();
      return;
    }
    if (item.voiceId) {
      browserPush();
      browserPane = 'site';
      browserSite = 'voice';
      voicePostId = item.voiceId;
      renderBrowser();
      if (els.opinionBody) els.opinionBody.scrollTop = 0;
      root.Audio.paper();
    }
  }

  /* ---------- 文档 / 攻略 / 彩蛋 ---------- */
  function docBar(kicker) {
    return '<div class="bdoc-bar"><button type="button" class="bdoc-back" data-doc="back">← 返回</button>' +
      '<span class="bdoc-kicker">' + kicker + '</span></div>';
  }

  function guideTable(kind) {
    const hw = id => C.HARDWARE_BY_ID[id] || {};
    let head = '', rows = [];
    if (kind === 'software') {
      head = '<tr><th>程序</th><th>写入开发点</th><th>作用</th></tr>';
      ['order', 'optimizer', 'trainer', 'crawler', 'scheduler', 'pipeline', 'gateway'].forEach(type => {
        const first = (C.SOFTWARE[type] || [])[0];
        if (!first) return;
        rows.push('<tr><td><b>' + C.SOFTWARE_TYPE_NAME[type] + ' v1</b></td><td class="num">' +
          root.Sim.writeCost(type) + '<small>／原 ' + first.dev + '</small></td><td>' +
          C.SOFTWARE_DESC[type] + '</td></tr>');
      });
    } else if (kind === 'hardware') {
      head = '<tr><th>类型</th><th>作用</th><th>代表型号 / 关键数</th></tr>';
      const g = hw('gpu3060'), g2 = hw('gpu4090'), g3 = hw('gpu_h200');
      const r1 = hw('ram16'), r2 = hw('ram64'), r3 = hw('ram512');
      const c1 = hw('cpu_i3'), c2 = hw('cpu_i9');
      const p = hw('psu1200'), f = hw('fan2'), k = hw('cooler480');
      const s1 = hw('ssd512'), s2 = hw('ssd32t');
      const n2 = hw('nic2'), n4 = hw('nic4');
      [
        ['显卡 / NPU', '提供算力，订单、训练、点击都吃', g.name + ' ' + g.compute + ' → ' + g2.name + ' ' + g2.compute + ' → ' + g3.name + ' ' + g3.compute],
        ['CPU', '提供算力与开发点/秒；贴内存 +10% 带宽，贴网卡 +10% 订单报酬', c1.name + ' dev ' + c1.dev + ' → ' + c2.name + ' dev ' + c2.dev],
        ['内存', '带宽封顶有效算力', r1.name + ' ' + r1.bandwidth + ' → ' + r2.name + ' ' + r2.bandwidth + ' → ' + r3.name + ' ' + r3.bandwidth],
        ['电源', '必须贴机箱最底行；功率不足按比例扣算力', '500W → ' + p.name + ' ' + p.watt + 'W → 4000W'],
        ['散热', '风扇覆盖所在行和列，重叠只算 30%', f.name + ' ' + f.cooling + ' → ' + k.name + ' ' + k.cooling],
        ['固态', '训练数据容量上限', s1.name + ' ' + s1.capacity + 'GB → ' + s2.name + ' ' + s2.capacity + 'GB'],
        ['网卡', '订单报酬与爬虫产出加成', n2.name + ' 订单 +15% → ' + n4.name + ' 订单 +60%'],
      ].forEach(r => {
        rows.push('<tr><td><b>' + r[0] + '</b></td><td>' + r[1] + '</td><td class="mono">' + r[2] + '</td></tr>');
      });
    } else if (kind === 'gifts') {
      head = '<tr><th>触发</th><th>补给</th><th>说明</th></tr>';
      C.GIFTS.forEach(gf => {
        rows.push('<tr><td class="num">累计 ' + big(gf.at) + '</td><td><b>' + gf.item + '</b></td><td>' + gf.title + '</td></tr>');
      });
    }
    if (!rows.length) return '';
    return '<div class="bdoc-tablewrap"><table class="bdoc-table"><thead>' + head +
      '</thead><tbody>' + rows.join('') + '</tbody></table></div>';
  }

  function renderGuideIndex() {
    const d = C.BROWSER.DOCS.guide;
    let html = docBar('aios://doc/guide') +
      '<article class="bdoc-card guide-index"><h2>' + d.title + '</h2>' +
      '<div class="bdoc-sub">' + d.sub + '</div><div class="bdoc-rule"></div>' +
      '<p class="bdoc-lead">' + d.intro + '</p>' +
      (d.note ? '<p class="bdoc-note">' + d.note + '</p>' : '');
    (C.BROWSER.GUIDE_GROUPS || []).forEach(group => {
      const list = C.BROWSER.GUIDES.filter(g => g.group === group.id);
      if (!list.length) return;
      html += '<section class="bdoc-group"><h3>' + group.name +
        '<small>' + list.length + ' 篇</small></h3><div class="bdoc-list">';
      list.forEach(g => {
        html += '<button type="button" data-doc="guide:' + g.id + '">' +
          '<b>' + g.title + '<em>' + (g.stage || '') + '</em></b>' +
          '<span>' + g.desc + '</span></button>';
      });
      html += '</div></section>';
    });
    html += '<div class="bdoc-footnote">攻略里的数字会随版本调整；带表格的页会直接读取当前数值。</div></article>';
    return html;
  }

  function renderGuideDetail(g) {
    const group = (C.BROWSER.GUIDE_GROUPS || []).find(x => x.id === g.group);
    let html = docBar('aios://doc/guide/' + g.id) +
      '<article class="bdoc-card guide-detail"><div class="bdoc-eyebrow">GUIDE · ' +
      (group ? group.name : '机房') + ' · ' + (g.stage || '全程') + '</div>' +
      '<h2>' + g.title + '</h2><div class="bdoc-rule"></div>' +
      (g.lead ? '<p class="bdoc-lead">' + g.lead + '</p>' : '');
    if (g.steps && g.steps.length) {
      html += '<ol class="bdoc-steps">' + g.steps.map(s => '<li>' + s + '</li>').join('') + '</ol>';
    }
    (g.sections || []).forEach(sec => {
      html += '<section class="bdoc-sec"><h3>' + sec.h + '</h3>';
      if (sec.p) html += '<p>' + sec.p + '</p>';
      if (sec.list) html += '<ul>' + sec.list.map(x => '<li>' + x + '</li>').join('') + '</ul>';
      html += '</section>';
    });
    if (g.table) html += guideTable(g.table);
    if (g.tips && g.tips.length) {
      html += '<aside class="bdoc-tips"><b>小抄</b><ul>' +
        g.tips.map(t => '<li>' + t + '</li>').join('') + '</ul></aside>';
    }
    if (!g.lead && !g.steps && !(g.sections || []).length) {
      (g.body || []).forEach(p => { html += '<p>' + p + '</p>'; });
    }
    let act = '<button type="button" data-doc="guide">攻略目录</button>';
    if (g.target && g.target.app) {
      act = '<button type="button" data-doc="app:' + g.target.app + '">打开对应窗口</button>' + act;
    } else if (g.target && g.target.page) {
      act = '<button type="button" data-doc="page:' + g.target.page + '">去现场看看</button>' + act;
    }
    html += '<div class="bdoc-act">' + act + '</div>';
    html += '<div class="bdoc-pager">' + guidePager(g) + '</div></article>';
    return html;
  }

  function guidePager(g) {
    const list = C.BROWSER.GUIDES;
    const i = list.indexOf(g);
    const prev = list[i - 1], next = list[i + 1];
    return (prev ? '<button type="button" data-doc="guide:' + prev.id + '">← ' + prev.title + '</button>' : '<span></span>') +
      (next ? '<button type="button" data-doc="guide:' + next.id + '">' + next.title + ' →</button>' : '<span></span>');
  }

  function renderDoc() {
    const body = els.bDocBody;
    if (!body) return;
    const parts = docKeyParts(browserDocKey);
    if (parts.kind === 'about') {
      const d = C.BROWSER.DOCS.about;
      body.innerHTML = docBar('aios://doc/about') +
        '<article class="bdoc-card about-sheet"><h2>' + d.title + '</h2>' +
        '<div class="bdoc-sub">' + d.sub + '</div><div class="bdoc-rule"></div>' +
        d.paras.map(p => '<p>' + p + '</p>').join('') +
        '<div class="bdoc-credits"><b>制作名单</b><span>' + (d.foot || '') + '</span></div>' +
        '<div class="bdoc-act"><button type="button" data-doc="guide">打开机房攻略</button>' +
        '<button type="button" data-doc="easter:maker">看制作名单</button>' +
        '<button type="button" data-doc="search:彩蛋">搜索「彩蛋」</button></div></article>';
      return;
    }
    if (parts.kind === 'hot') {
      const d = C.BROWSER.DOCS.hot;
      body.innerHTML = docBar('aios://doc/hot') +
        '<article class="bdoc-card hot-sheet"><h2>' + d.title + '</h2>' +
        '<div class="bdoc-sub">' + d.sub + '</div><div class="bdoc-rule"></div>' +
        '<p>' + d.intro + '</p><ol class="bdoc-hotlist">' +
        C.BROWSER.HOT.map((h, i) => '<li><button type="button" data-doc="hot:' + i + '">' +
          '<i>' + (h.rank || i + 1) + '</i><em>' + (h.tag || '') + '</em>' +
          '<b>' + h.title + '</b><small>' + h.heat + '</small></button></li>').join('') +
        '</ol><div class="bdoc-act"><button type="button" data-doc="guide">去攻略目录</button>' +
        '<button type="button" data-doc="back">返回</button></div></article>';
      return;
    }
    if (parts.kind === 'changelog') {
      const d = C.BROWSER.DOCS.changelog;
      body.innerHTML = docBar('aios://doc/changelog') +
        '<article class="bdoc-card changelog"><h2>' + d.title + '</h2>' +
        '<div class="bdoc-sub">' + d.sub + '</div><div class="bdoc-rule"></div>' +
        '<p>' + d.intro + '</p>' +
        d.entries.map(e => '<section class="bdoc-ver"><h3>v' + e.v.replace(/^v/, '') +
          '<time>' + e.date + '</time></h3><ul>' +
          e.items.map(x => '<li>' + x + '</li>').join('') + '</ul></section>').join('') +
        '<div class="bdoc-act"><button type="button" data-doc="about">关于本作</button>' +
        '<button type="button" data-doc="back">返回</button></div></article>';
      return;
    }
    if (parts.kind === 'guide' && !parts.id) {
      body.innerHTML = renderGuideIndex();
      return;
    }
    if (parts.kind === 'guide') {
      const g = C.BROWSER.GUIDES.find(x => x.id === parts.id);
      if (!g) { browserDocKey = 'guide'; renderDoc(); return; }
      body.innerHTML = renderGuideDetail(g);
      return;
    }
    if (parts.kind === 'easter') {
      const e = C.BROWSER.EASTER.find(x => x.id === parts.id);
      if (!e) { browserDocKey = 'guide'; renderDoc(); return; }
      const locked = e.gate === 'late' && !(st && st.endless);
      const lines = locked ? [e.locked || '档案已封存。'] : e.body;
      body.innerHTML = docBar('aios://doc/' + browserDocKey) +
        '<article class="bdoc-card terminal"><h2>' + e.title + '</h2>' +
        '<div class="bdoc-sub">TERMINAL · ' + e.id.toUpperCase() + '</div><div class="bdoc-rule"></div>' +
        lines.map(p => '<p>' + (p || '&nbsp;') + '</p>').join('') +
        '<div class="bdoc-act"><button type="button" data-doc="search:彩蛋">继续找彩蛋</button>' +
        '<button type="button" data-doc="back">返回</button></div></article>';
      return;
    }
    browserDocKey = 'guide';
    renderDoc();
  }

  function runDocAction(action) {
    if (!action) return;
    const parts = docKeyParts(action);
    if (parts.kind === 'back') { browserBack(); return; }
    if (parts.kind === 'guide') {
      openBrowserDoc(parts.id ? 'guide:' + parts.id : 'guide');
      return;
    }
    if (parts.kind === 'search') { submitSearch(parts.id); return; }
    if (parts.kind === 'hot') {
      const item = C.BROWSER.HOT[Number(parts.id)];
      if (item) runHotTarget(item.go);
      return;
    }
    if (parts.kind === 'app') {
      if (isLocked({ key: parts.id })) {
        root.Audio.error();
        api.toast(parts.id === 'api'
          ? 'API 服务：' + apiUnlockText() + '后开放。'
          : '这个窗口还没解锁。');
        return;
      }
      openWindow(parts.id, iconEls[parts.id]);
      return;
    }
    if (parts.kind === 'page' && parts.id === 'tal') {
      hardClose();
      root.Scene.openPage('tal', 'blueprint');
    }
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
    if (current === 'browser') {
      if (browserPane === 'home') syncBrowserHome();
      else if (browserPane === 'site' && browserSite === 'news') {
        if (newsSignature() !== newsSig) renderNews();
        else updateNewsChrome();
      } else if (browserPane === 'site' && browserSite === 'voice') {
        if (opinionSignature() !== opinionSig) renderOpinion();
        else updateOpinionChrome();
      }
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
    if (name === 'news' || name === 'opinion' || name === 'voice') {
      openWindow('browser', iconEls.browser);
      showBrowserSite(name === 'news' ? 'news' : 'voice');
      return;
    }
    if (iconEls[name]) openWindow(name, iconEls[name]);
  }

  root.Hub = {
    init, open, openApp, refresh, sync, closeAll,
    closeWindow, isWindowOpen, syncIcons,
    openWindow, currentWindow: () => current,
    browserBack: () => browserBack(),
    browserEsc: () => browserEsc(),
    openBrowserSite: site => current === 'browser' && showBrowserSite(site),
    search: q => current === 'browser' && submitSearch(q),
    searchLocal: q => (st ? searchLocal(q) : []),
    newsBack: () => current === 'browser' && browserSite === 'news' && !!newsOpen && browserBack(),
    orderBack: () => current === 'orders' && orderBackToList(true),
  };
})(window);