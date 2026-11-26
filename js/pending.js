/* =============================================================
 * pending.js · 进行中托盘：快递 / 待拆箱 / 下载 / 订单进度
 * ============================================================= */
(function (root) {
  'use strict';
  const C = root.CONTENT;
  const $ = id => document.getElementById(id);

  let st = null, api = null;
  let panel = null, list = null, countEl = null;
  let rows = [];
  let lastSig = null;
  let visible = false;
  let bound = false;

  const KIND_STAMP = { shelf: '拆', ship: '快', dl: '载', order: '单' };

  function init(state, callbacks) {
    st = state;
    api = callbacks;
    panel = $('pending');
    list = $('pdList');
    countEl = $('pdCount');
    if (!panel || !list || bound) return;
    bound = true;
    list.addEventListener('click', onClick);
  }

  function serverLabel(target) {
    const srv = C.SERVERS[target];
    return srv ? srv.id.toUpperCase() : '';
  }

  function qualityName(id) {
    const q = C.ORDER_QUALITY.find(x => x.id === id);
    return q ? q.name : '普通';
  }

  function buildVm(state) {
    const vm = [];
    const shelfN = state.shelf.length;
    const overN = state.overflow.length;
    if (shelfN || overN) {
      vm.push({
        kind: 'shelf', key: 'shelf', act: 'unpack', stamp: KIND_STAMP.shelf,
        title: '待拆箱 · ' + shelfN + ' 件',
        sub: overN ? '另有 ' + overN + ' 件暂存 · 点此拆一件' : '快递架 · 点此拆一件',
        val: '拆一件', pct: 0, bar: false,
      });
    }

    const groups = [], groupMap = {};
    state.deliveries.forEach(p => {
      const target = p.target == null ? null : p.target;
      const key = p.item + '|' + (p.defId || p.tier || '') + '|' + (target == null ? '' : target);
      let g = groupMap[key];
      if (!g) {
        g = groupMap[key] = {
          key: key, name: root.Sim.deliveryName(p), target: target,
          count: 0, minRemain: Infinity,
        };
        groups.push(g);
      }
      g.count++;
      g.minRemain = Math.min(g.minRemain, Math.max(0, p.remain));
    });
    const total = Math.max(0.001, root.Sim.deliverySec(state));
    groups.forEach(g => {
      const label = serverLabel(g.target);
      const sub = label ? '在途 · 送至 ' + label : '在途 · 即将到架';
      vm.push({
        kind: 'ship', key: g.key, act: 'ship', stamp: KIND_STAMP.ship,
        title: g.name + (g.count > 1 ? ' ×' + g.count : ''),
        sub: sub,
        val: Math.max(0, Math.ceil(g.minRemain)) + 's',
        pct: Math.max(0, Math.min(1, 1 - g.minRemain / total)),
        bar: true,
      });
    });

    state.downloads.forEach((d, i) => {
      const active = i === 0;
      let name = '下载', dur = d.dur || 1;
      if (d.item === 'ai') {
        const def = C.AI[d.tier];
        name = def ? '代理 ×' + def.count : '推理代理';
      } else {
        const def = C.MINING[d.tier];
        name = def ? '矿机 ¥' + def.rate + '/s' : '挖矿小程序';
      }
      const pct = active ? Math.max(0, Math.min(1, 1 - d.remain / dur)) : 0;
      const sub = d.item === 'ai'
        ? (active ? '推理代理 · 部署中' : '推理代理 · 排队中')
        : (active ? '应用市场 · 下载中' : '应用市场 · 排队中');
      vm.push({
        kind: 'dl', key: d.item + '|' + d.tier, act: 'apps', stamp: KIND_STAMP.dl,
        title: name,
        sub: sub,
        val: active ? Math.round(pct * 100) + '%' : '排队',
        pct: pct, bar: true,
      });
    });

    const orderCompute = state.active.length ? root.Sim.orderCompute(state) : 1;
    state.active.forEach(o => {
      const t = C.ORDER_TYPES[o.type] || { name: '订单' };
      const stalled = orderCompute <= 0;
      const pct = Math.max(0, Math.min(1, 1 - o.workLeft / Math.max(1, o.workload)));
      let extra = '';
      if (o.newbie) extra = '新手';
      else if (o.quality !== 'normal' && o.type !== 'rush') extra = qualityName(o.quality);
      vm.push({
        kind: 'order', key: 'o' + o.id, act: 'orders', stamp: KIND_STAMP.order,
        title: t.name,
        sub: stalled ? '等算力 · 调高订单滑尺' : (extra ? extra + ' · 订单板' : '订单板'),
        val: stalled ? '等算力' : Math.round(pct * 100) + '%',
        pct: pct, bar: true, stalled: stalled,
      });
    });

    return vm;
  }

  function maybeText(el, text) {
    if (el && el.textContent !== text) el.textContent = text;
  }

  function rebuild(vm) {
    if (!list) return;
    list.innerHTML = '';
    rows = vm.map(r => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'pd-row pd-' + r.kind + (r.stalled ? ' stalled' : '');
      btn.dataset.act = r.act;

      const stamp = document.createElement('span');
      stamp.className = 'pd-stamp pd-stamp-' + r.kind;
      stamp.textContent = r.stamp;

      const body = document.createElement('span');
      body.className = 'pd-body';
      const line = document.createElement('span');
      line.className = 'pd-line';
      const name = document.createElement('span');
      name.className = 'pd-name';
      const val = document.createElement('span');
      val.className = 'pd-val';
      line.appendChild(name);
      line.appendChild(val);
      const sub = document.createElement('span');
      sub.className = 'pd-sub';
      body.appendChild(line);
      body.appendChild(sub);

      let fill = null;
      if (r.bar) {
        const bar = document.createElement('span');
        bar.className = 'pd-bar';
        fill = document.createElement('i');
        bar.appendChild(fill);
        body.appendChild(bar);
      }

      btn.appendChild(stamp);
      btn.appendChild(body);
      list.appendChild(btn);
      return { el: btn, name: name, val: val, sub: sub, fill: fill };
    });
  }

  function paint(vm) {
    vm.forEach((r, i) => {
      const ref = rows[i];
      if (!ref) return;
      ref.el.classList.toggle('stalled', !!r.stalled);
      maybeText(ref.name, r.title);
      maybeText(ref.val, r.val);
      maybeText(ref.sub, r.sub);
      if (ref.fill) ref.fill.style.width = (r.pct * 100).toFixed(1) + '%';
    });
  }

  function setVisible(on) {
    if (on === visible) return;
    visible = on;
    if (!panel) return;
    panel.classList.toggle('on', on);
    panel.setAttribute('aria-hidden', on ? 'false' : 'true');
  }

  function sync(state, force) {
    if (!state || !panel) return;
    st = state;
    const vm = buildVm(state);
    const sig = vm.map(r => r.kind + ':' + r.key).join('|');
    if (force || sig !== lastSig) {
      lastSig = sig;
      rebuild(vm);
    }
    paint(vm);

    const counted = state.shelf.length + state.overflow.length + state.deliveries.length +
      state.downloads.length + state.active.length;
    maybeText(countEl, counted + ' 项');
    setVisible(vm.length > 0);
  }

  function shipTip() {
    if (!st || !st.deliveries.length) return;
    let min = Infinity;
    st.deliveries.forEach(p => { if (p.remain < min) min = p.remain; });
    api.toast('快递在途 ' + st.deliveries.length + ' 件，最快约 ' +
      Math.max(0, Math.ceil(min)) + ' 秒到快递架。');
  }

  function onClick(e) {
    const btn = e.target && e.target.closest ? e.target.closest('.pd-row') : null;
    if (!btn || !list.contains(btn)) return;
    e.stopPropagation();
    const act = btn.dataset.act;
    if (act === 'unpack') {
      api.unpack();
      sync(st);
    } else if (act === 'apps') {
      root.Audio.click();
      api.openApps();
    } else if (act === 'orders') {
      root.Audio.click();
      api.openOrders();
    } else if (act === 'ship') {
      root.Audio.click();
      shipTip();
    }
  }

  root.Pending = { init, sync };
})(window);
