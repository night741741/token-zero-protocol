/* =============================================================
 * ui.js · HUD / 手记本 / 天赋壳 / 日志页
 * 低频同步，避免每帧写 DOM。
 * ============================================================= */
(function (root) {
  'use strict';
  const C = root.CONTENT;
  const Num = root.TokenNum;
  const $ = id => document.getElementById(id);

  let st = null, api = null;
  let el = {};
  let last = {};
  let journalPage = 0;
  let talTab = 'early';
  const JOURNAL_PAGE = 12;

  const fmt = n => Math.max(0, Math.round(n)).toLocaleString('en-US');
  const wan = n => (n >= 10000 ? (n / 10000) + ' 万' : String(n));
  const tokenLabel = n => Num ? Num.compact(n) : fmt(n);
  const dataLabel = n => {
    if (n >= 1000000000000) return (n / 1000000000000).toFixed(1) + ' 万亿 GB';
    if (n >= 100000000) return (n / 100000000).toFixed(1) + ' 亿 GB';
    if (n >= 10000) return (n / 10000).toFixed(1) + ' 万 GB';
    return n.toFixed(1) + ' GB';
  };
  const mmss = t => {
    const s = Math.max(0, Math.round(t));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  };

  /* 实时消耗：最近 1 秒的燃烧增量（点击与被动一并计入） */
  const RATE_WINDOW = 1000;
  const rate = { state: null, last: 0, samples: [], value: 0 };

  const rateLabel = n => Num ? Num.rate(n) : (n > 0 ? Math.round(n) + '/s' : '0/s');

  function trackBurn(state, now) {
    if (!state) return;
    now = now == null ? performance.now() : now;
    if (rate.state !== state) {
      rate.state = state;
      rate.last = state.burned;
      rate.samples.length = 0;
      rate.value = 0;
      setText(el.burnRate, 'burnRate', '0/s');
      return;
    }
    const delta = state.burned - rate.last;
    rate.last = state.burned;
    if (delta !== 0) rate.samples.push([now, delta]);
    const cut = now - RATE_WINDOW;
    while (rate.samples.length && rate.samples[0][0] < cut) rate.samples.shift();
    let sum = 0;
    for (let i = 0; i < rate.samples.length; i++) sum += rate.samples[i][1];
    rate.value = Math.max(0, sum / (RATE_WINDOW / 1000));
    setText(el.burnRate, 'burnRate', rateLabel(rate.value));
  }

  function init(state, callbacks) {
    st = state;
    api = callbacks;
    el = {
      money: $('hudMoney'),
      data: $('hudData'),
      compute: $('hudCompute'),
      ai: $('hudAi'),
      auto: $('hudAuto'),
      burnRate: $('hudBurnRate'),
      talent: $('hudTalent'),
      act: $('hudAct'),
      actProgress: $('actProgress'),
      actNext: $('actNext'),
      actGoal: $('actGoal'),
      actGift: $('actGift'),
      actProgressText: $('actProgressText'),
      actProgressFill: $('actProgressFill'),
      hudTitle: $('hudTitleText'),
      worldNews: $('worldNews'),
      wnName: $('wnName'),
      wnBrief: $('wnBrief'),
      wnTime: $('wnTime'),
      j1: $('jLine1'),
      j2: $('jLine2'),
      jTitle: $('jTitle'),
      talPts: $('talPts'),
      talChip1: $('talChip1'),
      talChip2: $('talChip2'),
      talMile: $('talMilestones'),
      talCols: $('talCols'),
      jLogs: $('journalLogs'),
      srvHint: $('srvHint'),
      jPrev: $('jPrev'),
      jNext: $('jNext'),
      jPage: $('jPage'),
      jChip: $('jChip'),
    };
    if (el.jPrev) el.jPrev.addEventListener('click', () => {
      if (journalPage > 0) { journalPage--; renderJournal(st); }
    });
    if (el.jNext) el.jNext.addEventListener('click', () => {
      const total = Math.max(1, Math.ceil(st.logs.length / JOURNAL_PAGE));
      if (journalPage < total - 1) { journalPage++; renderJournal(st); }
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-tal-tab]'), btn => {
      btn.addEventListener('click', () => setTalTab(btn.dataset.talTab));
    });
    buildTalent();
    buildTalentTree();
  }

  function setText(node, key, value) {
    if (!node) return;
    if (last[key] === value) return;
    last[key] = value;
    node.textContent = value;
  }

  function setHtml(node, key, value) {
    if (!node) return;
    if (last[key] === value) return;
    last[key] = value;
    node.innerHTML = value;
  }

  function sync(state) {
    if (!state) return;
    st = state;
    setText(el.money, 'money', '¥' + Math.floor(st.money).toLocaleString('en-US'));
    setText(el.data, 'data', dataLabel(st.data));
    const con = root.Sim.currentContract(st);
    setText(el.hudTitle, 'hudTitle', st.endless ? '无尽运行 · 目标已解除' : con.def.name);
    setText(el.compute, 'compute', st.act1Done
      ? Math.round(root.Sim.totalStats(st).compute) + '/s'
      : '—');
    setText(el.ai, 'ai', '×' + root.Sim.aiCount(st));
    setText(el.auto, 'auto', root.Sim.autoBurn(st) + '/s');
    setText(el.talent, 'talent', root.Sim.talentPoints(st) + ' / ' + root.Sim.talentTotal(st));
    const ch = root.Sim.chapter(st);
    const actName = ch.endless
      ? '累计消耗 ' + tokenLabel(st.burned)
      : '第 ' + ch.num + ' 幕 · ' + ch.def.name;
    const actStage = ch.endless ? '无尽运行 · 目标解除' : actName;
    setText(el.act, 'act', actName);
    if (el.actProgress) {
      const span = Math.max(1, ch.end - ch.start);
      el.actProgress.classList.remove('hidden');
      el.actProgress.classList.toggle('gate', ch.gate);
      el.actProgress.classList.toggle('endless', !!ch.endless);
      el.actProgress.setAttribute('aria-label', ch.endless ? '累计 Token 消耗' : actName + ' Token 进度');
      el.actProgress.setAttribute('aria-valuemax', String(ch.endless ? 0 : span));
      el.actProgress.setAttribute('aria-valuenow', String(ch.endless
        ? 0
        : Math.max(0, Math.floor(st.burned - ch.start))));
      el.actProgress.setAttribute('aria-valuetext', ch.endless
        ? '累计消耗 ' + tokenLabel(st.burned)
        : Math.round(ch.pct * 100) + '%');
    }
    const actBurned = Math.max(0, Math.min(ch.end - ch.start, st.burned - ch.start));
    const actPct = ch.endless ? 0 : ch.pct * 100;
    const gpuStage = ch.gate && !ch.endless ? root.Sim.gpuState(st) : '';
    const gateGoal = gpuStage === 'shelf'
      ? '目标达成 · RTX 3060 已到快递架，拆箱解锁'
      : gpuStage === 'transit'
        ? '目标达成 · RTX 3060 正在路上，到货后拆箱'
        : '目标达成 · 去商店买 RTX 3060 并拆箱';
    setText(el.actNext, 'actNext', actStage);
    setText(el.actGoal, 'actGoal', ch.endless
      ? '目标已解除 · 只记录累计 Token 消耗'
      : ch.gate ? gateGoal : '目标：' + ch.def.goal);
    const nextGift = C.GIFTS.find(g => !g.rescue && (st.gifts || []).indexOf(g.id) === -1);
    setText(el.actGift, 'actGift', nextGift
      ? '下一份 ' + tokenLabel(nextGift.at)
      : ch.endless ? '无尽运行' : '补给已领完');
    setText(el.actProgressText, 'actProgressText', ch.endless
      ? '累计消耗 ' + tokenLabel(st.burned) + ' Token'
      : tokenLabel(actBurned) + ' / ' + tokenLabel(ch.end - ch.start) + ' Token');
    if (el.actProgressFill && last.actProgressFill !== actPct) {
      last.actProgressFill = actPct;
      el.actProgressFill.style.width = actPct.toFixed(2) + '%';
    }
    const we = root.Sim.activeWorldEvent(st);
    if (el.worldNews) {
      el.worldNews.classList.toggle('hidden', !we);
      ['tone-good', 'tone-bad', 'tone-neutral'].forEach(c => el.worldNews.classList.remove(c));
      if (we) {
        el.worldNews.classList.add('tone-' + (we.def.tone || 'neutral'));
        setText(el.wnName, 'wnName', we.def.name);
        setText(el.wnBrief, 'wnBrief', we.def.brief);
        setText(el.wnTime, 'wnTime', Math.ceil(we.remain) + 's');
      }
    }
    setText(el.jTitle, 'jTitle', ch.endless ? '清零手记 · 无尽运行' : '清零手记 · 第 ' + ch.num + ' 幕');

    const line1 = ch.endless
      ? '累计消耗 ' + tokenLabel(st.burned) + ' Token。<br>目标已解除。'
      : '已烧 ' + tokenLabel(st.burned) + ' Token，<br>还剩 ' + tokenLabel(st.token) + '。';
    setHtml(el.j1, 'j1', line1);
    const recent = st.logs.length ? st.logs[0].msg : '';
    const line2 = recent ? (recent.length > 28 ? recent.slice(0, 27) + '…' : recent) : '先点电脑，<br>让它跑起来。';
    setHtml(el.j2, 'j2', line2);

    syncTalent();
    setPcTerm();
  }

  function setTalTab(id) {
    if (id === talTab) return;
    if (id === 'late' && !(st && root.Sim.lateTalentProgress(st).unlocked)) {
      if (root.Scene) root.Scene.toast('续签百亿后解锁续签蓝图');
      if (root.Audio) root.Audio.error();
      return;
    }
    talTab = id;
    if (root.Audio) root.Audio.click();
    Array.prototype.forEach.call(document.querySelectorAll('[data-tal-tab]'), btn => {
      btn.classList.toggle('on', btn.dataset.talTab === talTab);
    });
    buildTalent();
    buildTalentTree();
    last = {};
    if (st) syncTalent();
  }

  function talentTabCols() {
    return talTab === 'late' ? C.TALENT_COLS_LATE : C.TALENT_COLS;
  }

  function buildTalent() {
    if (!el.talMile) return;
    el.talMile.innerHTML = '';
    if (talTab === 'late') {
      const rows = [{ label: '签约', pct: 0, val: '+1' }];
      C.TALENT_LATE_THRESHOLDS.forEach(t => {
        rows.push({ label: Math.round(t * 100) + '%', pct: t, val: '+1' });
      });
      rows.forEach(row => {
        const d = document.createElement('div');
        d.className = 'tmi late';
        d.dataset.pct = String(row.pct);
        const t = document.createElement('span');
        t.textContent = row.label;
        const b = document.createElement('b');
        b.textContent = row.val;
        d.appendChild(t); d.appendChild(b);
        el.talMile.appendChild(d);
      });
      return;
    }
    C.TALENT_MILESTONES.forEach((at, i) => {
      const d = document.createElement('div');
      d.className = 'tmi';
      d.dataset.at = at;
      const t = document.createElement('span');
      t.textContent = wan(at);
      const b = document.createElement('b');
      b.textContent = (i + 1) + ' 点';
      d.appendChild(t); d.appendChild(b);
      el.talMile.appendChild(d);
    });
  }

  /* ---------------- 天赋节点图（Blueprint 工作流） ---------------- */
  const BP = {
    root: { x: 20, y: 322, w: 170, h: 108 },
    cols: [220, 490, 760, 1030],
    nodeX: 25, nodeW: 200, nodeH: 88,
    tops: [176, 318, 460],
    comment: { y: 100, w: 250, h: 472 },
  };

  function bpWire(x1, y1, x2, y2, cls) {
    const dx = Math.max(46, Math.abs(x2 - x1) * 0.55);
    const c1 = x2 >= x1 ? x1 + dx : x1 - dx;
    const c2 = x2 >= x1 ? x2 - dx : x2 + dx;
    return '<path class="tw ' + cls + '" d="M' + x1 + ',' + y1 +
      ' C' + c1 + ',' + y1 + ' ' + c2 + ',' + y2 + ' ' + x2 + ',' + y2 + '"/>';
  }

  function buildTalentTree() {
    if (!el.talCols) return;
    el.talCols.classList.add('tgraph');
    el.talCols.innerHTML = '';
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'twires');
    svg.setAttribute('viewBox', '0 0 1320 748');
    svg.setAttribute('preserveAspectRatio', 'none');
    el.talCols.appendChild(svg);

    const rootNode = document.createElement('div');
    rootNode.className = 'bproot';
    rootNode.style.cssText = 'left:' + BP.root.x + 'px;top:' + BP.root.y + 'px;width:' +
      BP.root.w + 'px;height:' + BP.root.h + 'px';
    const late = talTab === 'late';
    rootNode.innerHTML = late
      ? '<div class="brt">RENEW · 续签协议</div>' +
        '<div class="brb">签约 +1，进度 10 / 25 / 50 / 75 / 100% 各 +1。' +
        '<small>本期已发 <b id="bpEarned">0</b> / 6 · 续签天赋共 12 点</small></div>' +
        '<i class="pin rout"></i>'
      : '<div class="brt">EVENT · 烧 Token</div>' +
        '<div class="brb">每到里程碑，发 1 个天赋点。' +
        '<small>已发 <b id="bpEarned">0</b> / ' + C.TALENT_MILESTONES.length + ' · 无失败</small></div>' +
        '<i class="pin rout"></i>';
    el.talCols.appendChild(rootNode);

    let paths = '';
    talentTabCols().forEach((col, ci) => {
      const defs = C.TALENTS[col.key];
      const x = BP.cols[ci];
      const com = document.createElement('div');
      com.className = 'tcomment ' + col.cls;
      com.dataset.key = col.key;
      com.dataset.max = String(defs.length);
      com.style.cssText = 'left:' + x + 'px;top:' + BP.comment.y + 'px;width:' +
        BP.comment.w + 'px;height:' + BP.comment.h + 'px';
      com.innerHTML = '<div class="ch"><span>' + col.name + '</span><em>0 / ' + defs.length + '</em></div>';
      el.talCols.appendChild(com);

      const firstY = BP.tops[0];
      paths += bpWire(BP.root.x + BP.root.w, BP.root.y + BP.root.h / 2,
        x + BP.nodeX, firstY + BP.nodeH / 2, 'tw-exec');

      defs.forEach((node, i) => {
        const y = BP.tops[i];
        if (i) {
          paths += bpWire(x + BP.nodeX + BP.nodeW / 2, BP.tops[i - 1] + BP.nodeH,
            x + BP.nodeX + BP.nodeW / 2, y, 'tw-' + col.key);
        }
        const n = document.createElement('div');
        n.className = 'tnode ' + col.cls;
        n.dataset.key = col.key;
        n.dataset.lvl = String(i + 1);
        n.style.cssText = 'left:' + (x + BP.nodeX) + 'px;top:' + y + 'px;width:' +
          BP.nodeW + 'px;height:' + BP.nodeH + 'px';
        n.innerHTML = '<div class="nt"><span class="nname">' + node.name + '</span>' +
          '<em class="ncost">1 点</em></div>' +
          '<div class="ndesc">' + node.desc + '</div>' +
          '<div class="nstate">需前置</div>' +
          '<i class="pin tin"></i><i class="pin tout"></i>' +
          (i === 0 ? '<i class="pin lin"></i>' : '');
        n.addEventListener('click', function () {
          if (n.classList.contains('next')) {
            if (api && api.spendTalent) api.spendTalent(col.key);
          } else if (n.classList.contains('locked')) {
            if (root.Scene) root.Scene.toast('先点亮上一节点');
            if (root.Audio) root.Audio.error();
          }
        });
        el.talCols.appendChild(n);
      });
    });
    svg.innerHTML = paths;
  }

  function syncTalent() {
    if (!st) return;
    const earned = root.Sim.talentPoints(st);
    const spent = root.Sim.talentSpent(st);
    const avail = root.Sim.talentAvailable(st);
    const total = root.Sim.talentTotal(st);
    const late = root.Sim.lateTalentProgress(st);
    if (talTab === 'late' && !late.unlocked) {
      talTab = 'early';
      Array.prototype.forEach.call(document.querySelectorAll('[data-tal-tab]'), btn => {
        btn.classList.toggle('on', btn.dataset.talTab === talTab);
        btn.classList.toggle('locked', btn.dataset.talTab === 'late');
      });
      buildTalent();
      buildTalentTree();
      last = {};
    }
    const lateTab = document.querySelector('[data-tal-tab="late"]');
    if (lateTab) lateTab.classList.toggle('locked', !late.unlocked);

    setText(el.talPts, 'talPts', '可用天赋点 ' + avail + ' · 已点亮 ' + spent + ' / ' + total);
    setText(el.talChip1, 'talChip1', '可用 ' + avail + ' / ' + total);
    setText(el.talChip2, 'talChip2', root.Sim.nextTalentInfo(st).label);
    setText(el.talent, 'talent', earned + ' / ' + total);
    if (el.talMile) {
      Array.prototype.forEach.call(el.talMile.children, d => {
        if (talTab === 'late') {
          const need = Number(d.dataset.pct) || 0;
          d.classList.toggle('got', need === 0 ? late.unlocked : late.pct + 1e-9 >= need);
        } else {
          d.classList.toggle('got', st.burned >= Number(d.dataset.at));
        }
      });
    }
    const earnedEl = document.getElementById('bpEarned');
    if (earnedEl) earnedEl.textContent = String(talTab === 'late' ? late.points : earned);
    if (el.talCols) {
      Array.prototype.forEach.call(el.talCols.querySelectorAll('.tnode[data-key]'), n => {
        const key = n.dataset.key;
        const lvl = Number(n.dataset.lvl);
        const has = root.Sim.talentLvl(st, key);
        const lit = has >= lvl;
        const nextOn = !lit && has === lvl - 1 && avail > 0;
        n.classList.toggle('on', lit);
        n.classList.toggle('next', nextOn);
        n.classList.toggle('locked', !lit && !nextOn);
        const stEl = n.querySelector('.nstate');
        if (stEl) {
          const value = lit ? '已点亮'
            : nextOn ? '点一下 · 消耗 1 点'
              : '需先点亮上一节点';
          if (stEl.textContent !== value) stEl.textContent = value;
        }
      });
      Array.prototype.forEach.call(el.talCols.querySelectorAll('.tcomment'), com => {
        const has = root.Sim.talentLvl(st, com.dataset.key);
        const max = Number(com.dataset.max) || 3;
        com.classList.toggle('on', has > 0);
        com.classList.toggle('done', has >= max);
        const em = com.querySelector('.ch em');
        if (em) em.textContent = has + ' / ' + max;
      });
    }
  }

  function renderJournal(state, resetPage) {
    st = state || st;
    if (!el.jLogs) return;
    const total = Math.max(1, Math.ceil(st.logs.length / JOURNAL_PAGE));
    if (resetPage) journalPage = 0;
    if (journalPage > total - 1) journalPage = total - 1;
    const start = journalPage * JOURNAL_PAGE;
    const logs = st.logs.slice(start, start + JOURNAL_PAGE);
    let html = '';
    if (!logs.length) {
      html = '<div class="jempty">还没有记录。<br>点电脑烧 Token，里程碑会写在这里。</div>';
    } else {
      logs.forEach(x => {
        html += '<div class="jl"><i>' + mmss(x.t) + '</i><span>' + x.msg + '</span></div>';
      });
    }
    el.jLogs.innerHTML = html;
    setText(el.jPage, 'jPage', (journalPage + 1) + ' / ' + total);
    setText(el.jChip, 'jChip', '第 ' + (journalPage + 1) + ' / ' + total + ' 页 · 共 ' + st.logs.length + ' 条');
    if (el.jPrev) el.jPrev.disabled = journalPage === 0;
    if (el.jNext) el.jNext.disabled = journalPage >= total - 1;
  }

  function setPcTerm() {
    if (!root.Scene) return;
    root.Scene.setPcTerm('&gt; AI 烧掉 ' + tokenLabel(st.burned) + '<i>_</i>');
  }

  root.UI = { init, sync, trackBurn, renderJournal, syncTalent, setPcTerm };
})(window);