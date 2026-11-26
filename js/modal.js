/* =============================================================
 * modal.js · 开场合同 / 一次性补给 / 系统说明纸质弹窗
 * 同一时间只显示一张纸；故事优先，补给与说明排队。
 * ============================================================= */
(function (root) {
  'use strict';
  const C = root.CONTENT;
  const $ = id => document.getElementById(id);

  let st = null, cb = {}, els = {};
  let queue = [];
  let cur = null;
  let page = 0;
  let prevFocus = null;
  let bound = false;

  function init(state, callbacks) {
    st = state;
    cb = callbacks || {};
    els.root = $('paperModal');
    els.kicker = $('pmKicker');
    els.stamp = $('pmStamp');
    els.title = $('pmTitle');
    els.body = $('pmBody');
    els.item = $('pmItem');
    els.name = $('pmName');
    els.nameInput = $('pmNameInput');
    els.nameChips = $('pmNameChips');
    els.page = $('pmPage');
    els.skip = $('pmSkip');
    els.next = $('pmNext');
    els.close = $('pmClose');
    if (!els.root || bound) return;
    bound = true;
    els.next.addEventListener('click', onNext);
    els.skip.addEventListener('click', onSkip);
    els.close.addEventListener('click', onClose);
    if (els.nameInput) els.nameInput.addEventListener('keydown', e => {
      if (e.key !== 'Enter' || e.isComposing) return;
      e.preventDefault();
      onNext();
    });
    buildNameChips();
    document.addEventListener('keydown', onKey);
  }

  function isOpen() { return !!cur; }

  function endingOpen() {
    const veil = $('ending');
    return !!(veil && !veil.classList.contains('hidden'));
  }

  function maybeStory(on) {
    if (!on || !st || st.storySeen || st.ended) return false;
    enqueue({ kind: 'story' });
    return true;
  }

  function showGift(e) {
    const def = e && C.GIFTS.find(g => g.id === e.giftId);
    if (!def) return;
    enqueue({ kind: 'gift', def: def, fallback: !!e.fallback });
  }

  function showNote(id) {
    const def = C.SYSTEM_NOTES && C.SYSTEM_NOTES[id];
    if (!def) return;
    if (cur && cur.kind === 'note' && cur.id === id) return;
    if (queue.some(x => x.kind === 'note' && x.id === id)) return;
    enqueue({ kind: 'note', id: id, def: def });
  }

  function enqueue(item) {
    queue.push(item);
    if (!cur) pump();
  }

  function pump() {
    if (cur || !els.root || endingOpen() || !queue.length) return;
    if (!queue.length) { cb.onIdle && cb.onIdle(); return; }
    cur = queue.shift();
    page = 0;
    prevFocus = document.activeElement;
    render();
    els.root.classList.remove('hidden');
    els.root.setAttribute('aria-hidden', 'false');
    void els.root.offsetWidth;
    els.root.classList.add('open');
    if (cb.pauseCoach) cb.pauseCoach();
    focusPrimary();
  }

  function buildNameChips() {
    if (!els.nameChips || els.nameChips.dataset.built) return;
    els.nameChips.dataset.built = '1';
    C.AI_NAME_SUGGESTIONS.forEach(name => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pm-name-chip';
      b.textContent = name;
      b.addEventListener('click', () => {
        if (!els.nameInput) return;
        els.nameInput.value = name;
        els.nameChips.querySelectorAll('.pm-name-chip').forEach(x => {
          x.classList.toggle('on', x === b);
        });
        els.nameInput.focus();
      });
      els.nameChips.appendChild(b);
    });
  }

  function currentStoryPage() {
    if (!cur || cur.kind !== 'story') return null;
    return C.STORY.pages[Math.min(page, C.STORY.pages.length - 1)];
  }

  function focusPrimary() {
    requestAnimationFrame(function () {
      if (!cur) return;
      const p = currentStoryPage();
      const focus = cur.kind === 'gift' || cur.kind === 'note' ? els.close :
        p && p.naming && els.nameInput ? els.nameInput : els.next;
      if (focus && !focus.classList.contains('hidden')) focus.focus();
    });
  }

  function commitName() {
    if (!els.nameInput || !cb.onName) return '';
    const final = cb.onName(els.nameInput.value);
    if (final) {
      els.nameInput.value = final;
      els.nameInput.classList.remove('bad');
    }
    return final;
  }

  function render() {
    if (!cur) return;
    if (cur.kind === 'story') {
      const story = C.STORY;
      const p = story.pages[Math.min(page, story.pages.length - 1)];
      els.kicker.textContent = story.kicker;
      els.stamp.textContent = p.stamp;
      els.title.textContent = p.title;
      els.body.textContent = p.body;
      els.item.classList.add('hidden');
      els.item.textContent = '';
      const naming = !!p.naming;
      if (els.name) els.name.classList.toggle('hidden', !naming);
      if (naming && els.nameInput && !els.nameInput.value) {
        els.nameInput.value = st && st.aiName ? st.aiName : '';
      }
      if (els.nameChips) {
        els.nameChips.querySelectorAll('.pm-name-chip').forEach(x => {
          x.classList.toggle('on', !!(els.nameInput && x.textContent === els.nameInput.value));
        });
      }
      els.skip.classList.remove('hidden');
      els.skip.textContent = naming ? '先用默认名' : story.skip;
      els.close.classList.add('hidden');
      els.next.classList.remove('hidden');
      els.next.textContent = page < story.pages.length - 1 ? story.next : (p.button || story.start);
      els.page.textContent = '第 ' + (page + 1) + ' / ' + story.pages.length + ' 页';
    } else if (cur.kind === 'note') {
      if (els.name) els.name.classList.add('hidden');
      const d = cur.def;
      els.kicker.textContent = d.kicker;
      els.stamp.textContent = d.stamp;
      els.title.textContent = d.title;
      els.body.textContent = '';
      (d.sections || []).forEach(sec => {
        const wrap = document.createElement('div');
        wrap.className = 'pm-sec';
        const h = document.createElement('b');
        h.textContent = sec.h;
        const p = document.createElement('p');
        p.textContent = sec.p;
        wrap.appendChild(h);
        wrap.appendChild(p);
        els.body.appendChild(wrap);
      });
      if (d.item) {
        els.item.textContent = d.item;
        els.item.classList.remove('hidden');
      } else {
        els.item.textContent = '';
        els.item.classList.add('hidden');
      }
      els.skip.classList.add('hidden');
      els.next.classList.add('hidden');
      els.close.classList.remove('hidden');
      els.close.textContent = '知道了';
      els.page.textContent = '系统说明';
    } else {
      if (els.name) els.name.classList.add('hidden');
      const d = cur.def;
      const fb = cur.fallback;
      els.kicker.textContent = d.kicker;
      els.stamp.textContent = d.stamp;
      els.title.textContent = fb && d.fallbackTitle ? d.fallbackTitle : d.title;
      els.body.textContent = fb && d.fallbackBody ? d.fallbackBody : d.body;
      els.item.textContent = fb && d.fallbackItem ? d.fallbackItem : d.item;
      els.item.classList.remove('hidden');
      els.skip.classList.add('hidden');
      els.next.classList.add('hidden');
      els.close.classList.remove('hidden');
      els.close.textContent = '收下';
      els.page.textContent = '一次性补给';
    }
  }

  function finishStory() {
    if (st && !st.aiNamed && cb.onName) cb.onName('');
    if (st && !st.storySeen) {
      st.storySeen = true;
      if (cb.save) cb.save();
    }
    if (cb.onStoryDone) cb.onStoryDone();
  }

  function next() {
    if (!cur) return;
    if (cur.kind === 'story' && page < C.STORY.pages.length - 1) {
      page++;
      render();
      focusPrimary();
      return;
    }
    if (cur.kind === 'story') {
      const p = currentStoryPage();
      if (p && p.naming) commitName();
      finishStory();
    }
    else if (cur.kind === 'gift' && cb.onGiftDone) cb.onGiftDone(cur);
    const done = cur;
    const nextItem = queue.shift();
    if (nextItem) {
      cur = nextItem;
      page = 0;
      render();
      focusPrimary();
      return;
    }
    closeAll();
    return done;
  }

  function closeAll() {
    if (!els.root) return;
    els.root.classList.add('hidden');
    els.root.classList.remove('open');
    els.root.setAttribute('aria-hidden', 'true');
    cur = null;
    page = 0;
    if (prevFocus && prevFocus.focus) {
      try { prevFocus.focus(); } catch (e) { /* ignore */ }
    }
    prevFocus = null;
    if (cb.resumeCoach) cb.resumeCoach();
    if (cb.onIdle) cb.onIdle();
  }

  function onNext() { next(); }
  function onSkip() {
    if (!cur) return;
    if (cur.kind === 'story') {
      finishStory();
      const nextItem = queue.shift();
      if (nextItem) {
        cur = nextItem;
        page = 0;
        render();
        focusPrimary();
        return;
      }
      closeAll();
    } else {
      onClose();
    }
  }
  function onClose() {
    if (!cur || (cur.kind !== 'gift' && cur.kind !== 'note')) return;
    next();
  }
  function onKey(e) {
    if (!cur) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (cur.kind === 'story') onSkip();
      else onClose();
    }
  }

  function resume() {
    if (!cur) pump();
  }

  root.PaperModal = {
    init, isOpen, maybeStory, showGift, showNote, resume,
    queue: () => queue.slice(),
    current: () => cur,
  };
})(window);
