/* =============================================================
 * rig.js · 副机 · 燃烧机箱：场景机箱状态、内部页、点击装卸
 * 只负责展示与点击；状态变更走 main 提供的 api。
 * ============================================================= */
(function (root) {
  'use strict';
  const C = root.CONTENT;
  const $ = id => document.getElementById(id);

  let st = null, api = null;
  let els = {};
  let bound = false;
  let drag = null, dropEl = null, suppressClickUntil = 0;
  let lastSig = '';
  let lastNote = '';
  let lastHint = '';
  let lastChip1 = '';
  let lastChip2 = '';

  const fmt = n => Math.max(0, Math.round(n)).toLocaleString('en-US');

  function isOpen() {
    const p = $('page-rig');
    return !!(p && p.classList.contains('on'));
  }

  function compatible() {
    if (!st) return [];
    return st.warehouse
      .filter(w => root.Sim.rigAllows(C.HARDWARE_BY_ID[w.defId]))
      .slice()
      .sort((a, b) => {
        const da = C.HARDWARE_BY_ID[a.defId], db = C.HARDWARE_BY_ID[b.defId];
        const order = { gpu: 0, cpu: 1, ram: 2 };
        const diff = order[da.type] - order[db.type];
        if (diff) return diff;
        return root.Sim.rigPartClick(db) - root.Sim.rigPartClick(da);
      });
  }

  function canFit(def) {
    const rig = st && st.rig;
    if (!rig || !def) return false;
    if (def.type === 'ram') return !rig.ram[0] || !rig.ram[1];
    return !rig[def.type];
  }

  function slotOfType(def) {
    const slots = root.Sim.rigSlots(st);
    return slots.find(s => s.type === def.type && !s.part) || null;
  }

  /* ---------------- 拖动装机 ---------------- */
  function clearDropMarks() {
    els.slots.forEach(el => el.classList.remove('drop-hint', 'drop-ok', 'drop-bad'));
    dropEl = null;
  }

  function canDropOn(def, slotEl) {
    if (!slotEl || !st) return false;
    const slot = root.Sim.rigSlotOf(st, slotEl.dataset.rigSlot);
    return !!slot && !slot.part && slot.type === def.type;
  }

  function rejectDrop(def, slotEl) {
    if (!slotEl) return '把硬件拖到副机槽位里才能安装。';
    const slot = root.Sim.rigSlotOf(st, slotEl.dataset.rigSlot);
    if (!slot) return '这里不是副机槽位。';
    if (slot.part) return slot.label + '已经有硬件了，先取下再换。';
    const need = slot.type === 'gpu' ? '显卡' : slot.type === 'cpu' ? 'CPU' : '内存';
    return slot.label + '只能装' + need + '。';
  }

  function onPartDown(e) {
    if (e.button !== 0 || drag) return;
    suppressClickUntil = 0;
    if (e.pointerType === 'touch') return;
    const card = e.target.closest('.rig-part');
    if (!card || card.classList.contains('full') || !st) return;
    const uid = Number(card.dataset.uid);
    const item = st.warehouse.find(w => w.uid === uid);
    const def = item && C.HARDWARE_BY_ID[item.defId];
    if (!def) return;
    const ghost = document.createElement('div');
    ghost.className = 'rig-ghost';
    ghost.style.display = 'none';
    ghost.appendChild(partArt(def));
    document.body.appendChild(ghost);
    drag = { uid, def, card, ghost, started: false, x0: e.clientX, y0: e.clientY, offX: 44, offY: 29 };
    window.addEventListener('pointermove', onPartMove);
    window.addEventListener('pointerup', onPartUp);
    window.addEventListener('pointercancel', onPartCancel);
  }

  function onPartMove(e) {
    if (!drag) return;
    if (!drag.started) {
      const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
      if (dx * dx + dy * dy < 25) return;
      drag.started = true;
      drag.card.classList.add('dragging');
      document.body.classList.add('rig-dragging');
      els.slots.forEach(el => {
        const slot = root.Sim.rigSlotOf(st, el.dataset.rigSlot);
        el.classList.toggle('drop-hint', !!slot && !slot.part && slot.type === drag.def.type);
      });
    }
    e.preventDefault();
    drag.ghost.style.left = (e.clientX - drag.offX) + 'px';
    drag.ghost.style.top = (e.clientY - drag.offY) + 'px';
    if (drag.ghost.style.display === 'none') drag.ghost.style.display = 'block';
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const slotEl = hit && hit.closest ? hit.closest('#page-rig .rigcard') : null;
    if (slotEl === dropEl) return;
    dropEl = slotEl;
    els.slots.forEach(el => el.classList.remove('drop-ok', 'drop-bad'));
    if (slotEl) slotEl.classList.add(canDropOn(drag.def, slotEl) ? 'drop-ok' : 'drop-bad');
  }

  function cleanupDrag() {
    if (!drag) return;
    window.removeEventListener('pointermove', onPartMove);
    window.removeEventListener('pointerup', onPartUp);
    window.removeEventListener('pointercancel', onPartCancel);
    clearDropMarks();
    document.body.classList.remove('rig-dragging');
    drag.card.classList.remove('dragging');
    drag.ghost.remove();
    drag = null;
  }

  function onPartUp() {
    if (!drag) return;
    const d = drag;
    const target = dropEl;
    const ok = !!(target && canDropOn(d.def, target));
    const reason = target ? rejectDrop(d.def, target) : '把硬件拖到副机槽位里才能安装。';
    const slotKey = target ? target.dataset.rigSlot : null;
    cleanupDrag();
    if (!d.started) return;
    suppressClickUntil = performance.now() + 400;
    if (ok) api.rigInstall(d.uid, slotKey);
    else {
      Audio.error();
      api.toast(reason);
    }
  }

  function onPartCancel() {
    if (!drag) return;
    cleanupDrag();
    suppressClickUntil = performance.now() + 400;
  }

  function init(state, callbacks) {
    st = state;
    api = callbacks || {};
    els = {
      sceneBays: Array.prototype.slice.call(document.querySelectorAll('.rig-bay')),
      sceneNote: $('rigNote'),
      sceneLock: $('rigLock'),
      slots: Array.prototype.slice.call(document.querySelectorAll('#page-rig [data-rig-slot]')),
      parts: $('rigParts'),
      empty: $('rigEmpty'),
      whCount: $('rigWhCount'),
      total: $('rigTotal'),
      hint: $('rigHint'),
      chip1: $('rigChip1'),
      chip2: $('rigChip2'),
    };
    if (bound) return;
    bound = true;

    document.querySelectorAll('#page-rig [data-rig-slot]').forEach(btn => {
      btn.addEventListener('click', () => {
        const slot = btn.dataset.rigSlot;
        const info = root.Sim.rigSlotOf(st, slot);
        if (!info || !info.part) {
          Audio.error();
          api.toast('这个槽还是空的。点右边的仓库卡片装上硬件。');
          return;
        }
        api.rigRemove(slot);
      });
    });

    if (els.parts) {
      els.parts.addEventListener('pointerdown', onPartDown);
      els.parts.addEventListener('click', e => {
        if (performance.now() < suppressClickUntil) return;
        const card = e.target.closest('.rig-part');
        if (!card) return;
        if (card.classList.contains('full')) {
          Audio.error();
          api.toast(card.dataset.full || '这个类型的槽位已经满了。');
          return;
        }
        api.rigInstall(Number(card.dataset.uid));
      });
    }
  }

  /* ---------------- 场景机箱 ---------------- */
  function syncScene() {
    if (!st) return;
    const unlocked = !!st.act1Done;
    const bonus = root.Sim.rigClickBonus(st);
    if (els.sceneLock) els.sceneLock.classList.toggle('off', unlocked);
    els.sceneBays.forEach(el => {
      const slot = root.Sim.rigSlotOf(st, el.dataset.rigSlot);
      const def = slot && slot.part ? C.HARDWARE_BY_ID[slot.part.defId] : null;
      el.classList.toggle('filled', !!def);
      const b = el.querySelector('b');
      if (b) b.textContent = def ? (def.mark || def.name) : '空';
      if (def) el.dataset.full = def.name;
      else delete el.dataset.full;
    });
    const note = !unlocked ? '副机 · 未通电' : (bonus > 0 ? '副机 · 加成 +' + fmt(bonus) : '副机 · 待装机');
    if (els.sceneNote && note !== lastNote) {
      lastNote = note;
      els.sceneNote.textContent = note;
    }
    const hs = $('hs-rig');
    if (hs) hs.classList.toggle('off', !unlocked);
  }

  /* ---------------- 内部页 ---------------- */
  function partArt(def) {
    const art = document.createElement('div');
    art.className = 'rp-art';
    const mini = document.createElement('div');
    mini.className = 'card ' + def.type + ' tier' + root.Stage.tierOf(def);
    mini.style.width = def.size[0] * 48 + 'px';
    mini.style.height = def.size[1] * 48 + 'px';
    mini.innerHTML = root.Stage.cardInner(def, { mark: true });
    const label = mini.querySelector('.label');
    if (label) label.remove();
    art.appendChild(mini);
    return art;
  }

  function partCard(item) {
    const def = C.HARDWARE_BY_ID[item.defId];
    if (!def) return null;
    const click = root.Sim.rigPartClick(def);
    const fit = canFit(def);
    const card = document.createElement('article');
    card.className = 'rig-part' + (fit ? '' : ' full');
    card.dataset.uid = String(item.uid);
    if (!fit) card.dataset.full = def.type === 'ram' ? '两个内存槽都满了，先取下一根。' : '这个类型的槽位已经满了，先取下旧件。';

    card.appendChild(partArt(def));

    const main = document.createElement('div');
    main.className = 'rp-main';
    const nm = document.createElement('b');
    nm.textContent = def.name;
    const spec = document.createElement('span');
    spec.textContent = def.type === 'ram'
      ? '带宽 ' + def.bandwidth + ' · 点击 +' + fmt(click)
      : '算力 ' + def.compute + ' · 点击 +' + fmt(click);
    const tag = document.createElement('em');
    tag.textContent = fit ? '拖到槽位或点击' : '槽已满';
    main.appendChild(nm); main.appendChild(spec); main.appendChild(tag);
    card.appendChild(main);

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rp-btn';
    btn.textContent = fit ? '装上' : '槽满';
    btn.disabled = true;
    card.appendChild(btn);
    return card;
  }

  function renderSlots() {
    els.slots.forEach(el => {
      const slot = root.Sim.rigSlotOf(st, el.dataset.rigSlot);
      const def = slot && slot.part ? C.HARDWARE_BY_ID[slot.part.defId] : null;
      el.classList.toggle('filled', !!def);
      const b = el.querySelector('b');
      const em = el.querySelector('em');
      const i = el.querySelector('i');
      if (def) {
        b.textContent = def.name;
        em.textContent = '+' + fmt(root.Sim.rigPartClick(def)) + ' / 次';
        if (i) i.textContent = '点击取下 · 放回仓库';
      } else {
        b.textContent = '空';
        em.textContent = '+0 / 次';
        if (i) i.textContent = '拖入安装';
      }
    });
  }

  function renderParts() {
    if (!els.parts) return;
    els.parts.innerHTML = '';
    const list = compatible();
    list.forEach(item => {
      const card = partCard(item);
      if (card) els.parts.appendChild(card);
    });
    if (els.empty) els.empty.classList.toggle('off', list.length > 0);
    if (els.whCount) els.whCount.textContent = String(list.length);
  }

  function syncChrome() {
    const bonus = root.Sim.rigClickBonus(st);
    const total = root.Sim.clickGain(st);
    const count = root.Sim.rigCount(st);
    const chip1 = '总点击 +' + fmt(total) + ' / 次';
    const chip2 = '已装 ' + count + ' / 4';
    if (els.total) {
      const text = '当前总点击 +' + fmt(total);
      if (els.total.textContent !== text) els.total.textContent = text;
    }
    if (els.chip1 && chip1 !== lastChip1) { lastChip1 = chip1; els.chip1.textContent = chip1; }
    if (els.chip2 && chip2 !== lastChip2) { lastChip2 = chip2; els.chip2.textContent = chip2; }
    let hint = '把仓库里的实体显卡、CPU、内存拖进对应槽位，提高每次点击的燃烧量';
    if (!st.act1Done) hint = '拆开 RTX 3060 后，副机才会通电';
    else if (!count) hint = '机箱通了电，但还没装件。从仓库拖一张显卡或一根内存进槽位';
    else if (count >= 4) hint = '四个槽都满了。想换更强的件，先点槽位取下旧件';
    if (els.hint && hint !== lastHint) {
      lastHint = hint;
      els.hint.textContent = hint;
    }
  }

  function render(state) {
    if (!state) return;
    st = state;
    root.Sim.ensureRig(st);
    syncScene();
    syncChrome();
    renderSlots();
    renderParts();
    lastSig = signature();
  }

  function signature() {
    if (!st) return '';
    const w = st.warehouse.map(x => x.uid + ':' + x.defId).join(',');
    const r = root.Sim.rigSlots(st).map(s => s.part ? s.part.uid + ':' + s.part.defId : '-').join(',');
    return (st.act1Done ? '1' : '0') + '|' + w + '|' + r;
  }

  function sync(state) {
    if (!state) return;
    st = state;
    syncScene();
    if (!isOpen()) return;
    const sig = signature();
    if (sig !== lastSig) {
      lastSig = sig;
      syncChrome();
      renderSlots();
      renderParts();
    }
  }

  function open() {
    root.Scene.openPage('rig', 'rig');
    render(st);
  }

  root.Rig = { init, render, sync, open, isOpen };
})(window);
