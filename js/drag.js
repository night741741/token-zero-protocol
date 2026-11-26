/* =============================================================
 * drag.js · 服务器页 Pointer 拖拽：仓库托盘 ↔ 机箱网格、网格内挪动
 * 依赖 window.CONTENT / window.Sim / window.Stage
 * ============================================================= */
(function (root) {
  'use strict';
  const C = root.CONTENT;

  let el = {};
  let api = null;
  let drag = null;
  let bound = false;

  function st() { return api && api.getState ? api.getState() : null; }
  function machineIdx(state) { return state.activeServer; }
  function cellAt(p) {
    const r = root.Stage.caseDesignRect();
    if (p.x < r.left || p.y < r.top || p.x > r.left + r.width || p.y > r.top + r.height) return null;
    return { x: Math.floor((p.x - r.left) / root.Stage.cell()), y: Math.floor((p.y - r.top) / root.Stage.cell()) };
  }
  function inTray(p) {
    const r = root.Stage.trayDesignRect();
    return p.x >= r.left && p.x <= r.left + r.width && p.y >= r.top && p.y <= r.top + r.height;
  }
  function inRecycle(p) {
    const r = root.Stage.recycleDesignRect();
    return p.x >= r.left && p.x <= r.left + r.width && p.y >= r.top && p.y <= r.top + r.height;
  }

  function onDown(e) {
    const state = st();
    if (!state || !state.act1Done || drag) return;
    if (e.button !== 0) return;
    if (e.target.closest('button')) return;
    const card = e.target.closest('.card');
    if (!card) return;
    const defId = card.dataset.defId;
    const uid = Number(card.dataset.uid);
    const def = C.HARDWARE_BY_ID[defId];
    if (!def) return;
    const fromGrid = card.parentElement === el.cardLayer;
    const m = state.servers[state.activeServer];
    if (fromGrid && !m.placed.some(p => p.uid === uid)) return;
    if (!fromGrid && !state.warehouse.some(p => p.uid === uid)) return;

    const p = root.Stage.designPoint(e.clientX, e.clientY);
    const rect = card.getBoundingClientRect();
    const pr = el.pageStage.getBoundingClientRect();
    const scale = pr.width / 1320 || 1;
    const cardRect = { left: (rect.left - pr.left) / scale, top: (rect.top - pr.top) / scale };

    const ghost = document.createElement('div');
    ghost.id = 'drag-ghost';
    ghost.className = 'card ' + def.type + ' tier' + root.Stage.tierOf(def);
    ghost.style.width = (def.size[0] * root.Stage.cell()) + 'px';
    ghost.style.height = (def.size[1] * root.Stage.cell()) + 'px';
    ghost.style.left = cardRect.left + 'px';
    ghost.style.top = cardRect.top + 'px';
    ghost.innerHTML = root.Stage.cardInner(def);
    el.pageStage.appendChild(ghost);

    let item = null;
    if (fromGrid) item = root.Sim.lift(state, uid, state.activeServer);

    drag = {
      uid: uid, defId: defId, def: def, fromGrid: fromGrid, item: item,
      orig: fromGrid && item ? { x: item.x, y: item.y } : null,
      offX: p.x - cardRect.left, offY: p.y - cardRect.top,
      ghost: ghost, preview: document.getElementById('preview-rect'),
      lastCell: null, lastValid: false,
    };
    card.style.opacity = '0.35';
    e.preventDefault();
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  function onMove(e) {
    if (!drag) return;
    const p = root.Stage.designPoint(e.clientX, e.clientY);
    drag.ghost.style.left = (p.x - drag.offX) + 'px';
    drag.ghost.style.top = (p.y - drag.offY) + 'px';
    const cell = cellAt(p);
    const state = st();
    const recycling = inRecycle(p);
    root.Stage.setRecycleState(recycling ? (drag.def.special ? 'blocked' : 'ready') : null);
    if (recycling) {
      drag.preview.classList.add('hidden');
      drag.lastValid = false; drag.lastCell = null;
    } else if (cell && state) {
      const ok = root.Sim.canPlace(state, drag.defId, cell.x, cell.y, state.activeServer);
      const r = root.Stage.caseDesignRect();
      drag.preview.classList.remove('hidden');
      drag.preview.style.left = (r.left + cell.x * root.Stage.cell()) + 'px';
      drag.preview.style.top = (r.top + cell.y * root.Stage.cell()) + 'px';
      drag.preview.style.width = (drag.def.size[0] * root.Stage.cell()) + 'px';
      drag.preview.style.height = (drag.def.size[1] * root.Stage.cell()) + 'px';
      drag.preview.classList.toggle('invalid', !ok);
      drag.lastCell = cell; drag.lastValid = ok;
    } else {
      drag.preview.classList.add('hidden');
      drag.lastValid = false; drag.lastCell = null;
    }
    if (drag.def.type === 'fan' || drag.def.type === 'cooler') {
      root.Stage.setWind({ def: drag.def, x: cell ? cell.x : -20, y: cell ? cell.y : -20 });
      drawSoon();
    }
  }

  let drawRaf = 0;
  function drawSoon() {
    if (drawRaf) return;
    drawRaf = requestAnimationFrame(() => {
      drawRaf = 0;
      const state = st();
      if (state && root.Stage.isOpen()) root.Stage.sync(state);
    });
  }

  function onUp(e) {
    if (!drag) return;
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    const state = st();
    const p = root.Stage.designPoint(e.clientX, e.clientY);
    const idx = state ? state.activeServer : 0;

    if (state) {
      if (inRecycle(p)) {
        if (drag.fromGrid && drag.item) root.Sim.restoreLifted(state, drag.item, idx);
        if (api.onRecycle) api.onRecycle(drag.uid);
      } else if (drag.fromGrid) {
        if (inTray(p)) {
          root.Sim.warehouseReturn(state, drag.item);
        } else if (drag.lastValid && drag.lastCell) {
          root.Sim.place(state, drag.defId, drag.lastCell.x, drag.lastCell.y, idx);
        } else if (drag.item) {
          root.Sim.restoreLifted(state, drag.item, idx);
        }
      } else if (drag.lastValid && drag.lastCell) {
        root.Sim.warehouseTake(state, drag.uid);
        root.Sim.place(state, drag.defId, drag.lastCell.x, drag.lastCell.y, idx);
      }
    }

    drag.ghost.remove();
    drag.preview.classList.add('hidden');
    root.Stage.setWind(null);
    root.Stage.setRecycleState(null);
    drag = null;
    if (state) {
      root.Stage.render(state);
      if (api.onChange) api.onChange(state);
    }
  }

  function init(callbacks) {
    api = callbacks || {};
    el = {
      pageStage: document.getElementById('pageStage'),
      cardLayer: document.getElementById('card-layer'),
      trayItems: document.getElementById('tray-items'),
    };
    if (bound) return;
    bound = true;
    if (el.cardLayer) el.cardLayer.addEventListener('pointerdown', onDown);
    if (el.trayItems) el.trayItems.addEventListener('pointerdown', onDown);
  }

  root.Drag = { init };
})(window);