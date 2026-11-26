/* =============================================================
 * delivery.js · 快递架：在途倒计时、纸箱堆放、点击拆箱
 * ============================================================= */
(function (root) {
  'use strict';
  const C = root.CONTENT;
  const $ = id => document.getElementById(id);

  let st = null, api = null;
  let host = null, tag = null;
  let hostBuilt = false;
  let lastSig = '';
  let lastTag = '';

  const SLOTS = [
    { x: 28, y: 44, w: 78, h: 58, r: -1.5 },
    { x: 114, y: 42, w: 72, h: 60, r: 1.8 },
    { x: 12, y: 112, w: 62, h: 62, r: -1 },
    { x: 80, y: 114, w: 64, h: 60, r: 1.2 },
    { x: 148, y: 116, w: 46, h: 58, r: -2 },
  ];

  function init(state, callbacks) {
    st = state;
    api = callbacks;
    host = $('shelfPkgs');
    tag = $('shipTag');
    if (!hostBuilt && host) {
      hostBuilt = true;
      host.addEventListener('click', e => { e.stopPropagation(); clickShelf(); });
    }
  }

  function pkgName(p) {
    if (p.item === 'ram') return '内存 ×' + C.RAM[p.tier].mult;
    if (p.item === 'hw') {
      const d = C.HARDWARE_BY_ID[p.defId];
      return d ? d.name : '硬件';
    }
    return 'RTX 3060';
  }

  function renderPkgs() {
    if (!host) return;
    host.innerHTML = '';
    st.shelf.forEach((p, i) => {
      const slot = SLOTS[i];
      if (!slot) return;
      const d = document.createElement('div');
      d.className = 'pkg' + (p.item === 'gpu' ? ' pkg-gpu' : '');
      d.style.left = slot.x + 'px';
      d.style.top = slot.y + 'px';
      d.style.width = slot.w + 'px';
      d.style.height = slot.h + 'px';
      d.style.transform = 'rotate(' + slot.r + 'deg)';
      const lbl = document.createElement('span');
      lbl.className = 'lbl';
      lbl.textContent = pkgName(p);
      d.appendChild(lbl);
      host.appendChild(d);
      requestAnimationFrame(() => d.classList.add('in'));
    });
  }

  function sync(state, dt, force) {
    if (!state) return;
    st = state;
    const sig = st.shelf.map(p => p.item + (p.tier || '') + (p.defId || '')).join(',') + '|' + st.overflow.length;
    if (force || sig !== lastSig) {
      lastSig = sig;
      renderPkgs();
    }
    if (!tag) return;
    let text = '';
    if (st.deliveries.length) {
      let min = Infinity;
      st.deliveries.forEach(p => { if (p.remain < min) min = p.remain; });
      text = '在途 ' + st.deliveries.length + ' 件 · ' + Math.max(0, Math.ceil(min)) + 's';
    }
    if (st.overflow.length) text += (text ? ' · ' : '') + '暂存 ' + st.overflow.length;
    if (text !== lastTag) {
      lastTag = text;
      if (text) {
        tag.textContent = text;
        tag.classList.add('on');
      } else {
        tag.classList.remove('on');
      }
    }
  }

  function clickShelf() {
    if (!st.shelf.length) {
      if (st.deliveries.length) {
        let min = Infinity;
        st.deliveries.forEach(p => { if (p.remain < min) min = p.remain; });
        api.toast('快递还在路上，约 ' + Math.max(0, Math.ceil(min)) + ' 秒。');
        root.Audio.error();
      } else {
        root.Audio.error();
        api.toast('空架子。商店下单后，快递会送到这里。');
      }
      return false;
    }
    const r = root.Sim.unpack(st);
    if (!r.ok) { api.toast(r.reason); return false; }
    api.onUnpack(r, st);
    return true;
  }

  root.Delivery = { init, sync, clickShelf };
})(window);