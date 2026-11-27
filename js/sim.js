/* =============================================================
 * 《一亿 Token 清零协议》v3.1 · sim.js
 * 第一幕：点击烧 Token、自动烧、挖矿、下载、快递、里程碑、
 * 天赋点、拆箱、3060 幕终、存档 v3。
 * 第二幕：六机位网格装机、供电/散热/带宽/邻接、跨机算力汇总、
 * 滑尺分配（订单 / 训练）、订单板、开发点、软件、爬虫数据、
 * 硬件商店快递与仓库、旧存档迁移。
 * 不依赖 DOM，可在 node 里无渲染模拟。
 * ============================================================= */
(function (root) {
  'use strict';
  const C = (typeof require !== 'undefined') ? require('./content.js') : root.CONTENT;

  /* ---------------- 机位 ---------------- */
  function newServer(i) {
    const srv = C.SERVERS[i];
    const cs = C.CASES[srv.caseTier];
    return {
      owned: false,
      caseTier: srv.caseTier,
      gridW: cs.grid[0],
      gridH: cs.grid[1],
      placed: [],
    };
  }

  function newState() {
    return {
      v: 3,
      t: 0,
      act: 1,
      money: 0,
      token: C.CONST.startToken,
      burned: 0,
      aiTier: 0,
      ramTier: 0,
      miningTier: 0,
      downloads: [],   // {item:'ai'|'mining', tier, remain, dur}
      deliveries: [],  // {uid, item:'ram'|'gpu'|'hw', tier?, defId?, target?, remain}
      shelf: [],       // 待拆箱
      overflow: [],    // 快递架满时暂存
      warehouse: [],   // 全部机位共用的待装硬件
      claimed: [],     // 已领里程碑下标
      starterRewardClaimed: false,
      unlocked: { shelf: false, blueprint: false, s1: false, orders: false, slider: false },
      act1Done: false,
      uid: 1,
      logs: [],

      /* 第 2 幕 */
      devPoints: 0,
      aiCoder: false,        // AI 写代码：L3 解锁，消耗 Token 产出开发点
      apiOpen: false,        // 开放 API：L2 解锁，用户提问烧 Token 并付钱
      apiTier: 1,
      apiRequests: 0,
      apiRevenue: 0,
      apiBurned: 0,
      apiLogAcc: 0,
      apiDb: [],
      apiDbSeq: 0,
      data: 0,
      clickAcc: 0,           // 点击系自动点击的累计计时
      software: [null, null],
      orderBoard: [],
      active: [],
      orderSeq: 0,
      orderTimer: C.CONST.orderRefresh,
      rngSeed: 20261124,
      orderShare: 0.6,        // 滑尺：分给订单的算力比例（0 = 全训练）
      servers: [0, 1, 2, 3, 4, 5].map(newServer),
      activeServer: 0,
      starterSeeded: false,
      lastLevel: 0,
      stats: null,
      split: { order: 0, train: 0 },

      /* M3：天赋 / 自主度 / NPU / 终局 */
      talents: { pow: 0, sw: 0, eco: 0, clk: 0, lpow: 0, leco: 0, lburn: 0, levent: 0 },
      aiAuto: true,
      l4Timer: C.CONST.aiL4ActEvery,
      npuMade: 0,
      ended: false,
      ending: null,
      endless: false,

      /* M4：新手纸签是否已看过 */
      onboard: { tap: false, delivery: false, talent: false },

      /* 系统说明纸是否已读 */
      notes: { act2: false, api: false },

      /* 开场故事 / 一次性补给 */
      storySeen: false,
      gifts: [],

      /* 模型命名 / 舆论 */
      aiName: '',
      aiNamed: false,
      opinion: emptyOpinion(),

      /* 副机 · 燃烧机箱 */
      rig: emptyRig(),

      /* 续签协议 / 世界事件 */
      contract: 0,
      contractBase: 0,
      worldEvent: null,
      worldTimer: C.CONST.worldFirstDelay,
      worldRecent: [],
      worldNeg: 0,
      eventRev: 0,

      /* 机房日报 */
      news: [{
        id: 1, at: 0, cat: 'notice', tag: '创刊', tone: 'neutral',
        source: '机房日报', title: '机房日报创刊号',
        body: '从今天起，这里记录硬件市场、订单、模型和机房里的风吹草动。',
        eventId: null, eventRev: 0, fx: '', story: newsStory('start'),
      }],
      newsSeq: 1,
      newsRead: 0,
    };
  }

  function emptyRig() {
    return { gpu: null, cpu: null, ram: [null, null] };
  }

  function emptyOpinion() {
    return {
      score: 48, target: 48, timer: 20,
      seq: 0, readSeq: 0, reviews: [],
    };
  }

  function sanitizeAiName(raw) {
    const s = String(raw == null ? '' : raw)
      .replace(/[\u0000-\u001f\u007f<>]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    return Array.from(s).slice(0, 10).join('');
  }

  function aiName(st) {
    return (st && st.aiName) || C.AI_DEFAULT_NAME;
  }

  function setAiName(st, raw) {
    const name = sanitizeAiName(raw) || C.AI_DEFAULT_NAME;
    const first = !st.aiNamed || st.aiName !== name;
    st.aiName = name;
    st.aiNamed = true;
    if (!st.opinion) st.opinion = emptyOpinion();
    if (first && !st.opinion.reviews.length) {
      st.opinion.score = Math.max(50, st.opinion.score);
      addOpinionReview(st, {
        source: 'dev', tone: 'neutral', stars: 4,
        user: '模型监看员', postId: 'naming',
        text: '新模型登记：' + name + '。编号 CLR-01，从今天起开始跑第一轮任务。',
      });
      st.opinion.readSeq = st.opinion.seq;
    }
    return name;
  }

  /* ---------------- 续签协议 ---------------- */
  function contractIndex(st) {
    return Math.max(0, Math.min(C.CONTRACTS.length - 1, (st && st.contract) | 0));
  }
  function currentContract(st) {
    const index = contractIndex(st);
    return { index, def: C.CONTRACTS[index] };
  }
  function nextContract(st) {
    const i = contractIndex(st) + 1;
    return i < C.CONTRACTS.length ? { index: i, def: C.CONTRACTS[i] } : null;
  }
  function contractTarget(st) { return currentContract(st).def.target; }
  function contractEco(st) { return currentContract(st).def.eco; }
  function contractBaseOf(st) { return Math.max(0, Number(st && st.contractBase) || 0); }
  function contractBurned(st) {
    return Math.max(0, Math.min(contractTarget(st), st.burned - contractBaseOf(st)));
  }
  function contractProgress(st) {
    const con = currentContract(st);
    const target = con.def.target;
    const burned = contractBurned(st);
    return {
      index: con.index,
      def: con.def,
      target, burned,
      remaining: Math.max(0, target - burned),
      pct: target > 0 ? burned / target : 0,
      next: nextContract(st),
    };
  }
  function contractLabel(st) {
    const con = currentContract(st);
    return con.index === 0 ? ('第 ' + chapter(st).num + ' 幕 · ' + con.def.short) : ('续签 ' + con.index + ' · ' + con.def.short);
  }

  /* ---------------- 世界事件 ---------------- */
  function activeWorldEvent(st) {
    const e = st && st.worldEvent;
    if (!e) return null;
    const def = C.WORLD_EVENT_BY_ID[e.id];
    if (!def || !(e.remain > 0)) return null;
    return { id: e.id, def, remain: e.remain, duration: e.duration || e.remain };
  }
  function worldEventMult(st, key, fallback) {
    const a = activeWorldEvent(st);
    const v = a && a.def.effects ? a.def.effects[key] : null;
    if (typeof v !== 'number') return fallback == null ? 1 : fallback;
    if (a.def.tone === 'good' && talentOn(st, 'levent', 1)) return 1 + (v - 1) * 1.2;
    if (a.def.tone === 'bad' && talentOn(st, 'levent', 2)) return 1 + (v - 1) * 0.8;
    return v;
  }
  function worldEventAdd(st, key) {
    const a = activeWorldEvent(st);
    const v = a && a.def.effects ? a.def.effects[key] : null;
    if (typeof v !== 'number') return 0;
    if (a.def.tone === 'good' && talentOn(st, 'levent', 1)) return v * 1.2;
    if (a.def.tone === 'bad' && talentOn(st, 'levent', 2)) return v * 0.8;
    return v;
  }
  function burnScale(st) {
    return contractEco(st) * worldEventMult(st, 'tokenBurn');
  }

  function worldNearPool(st) {
    const lvl = modelLevel(st);
    const con = contractIndex(st);
    return C.WORLD_EVENTS.filter(e => {
      if (!st.act1Done) return false;
      if (e.minLevel != null && lvl < e.minLevel) return false;
      if (e.minContract != null && con < e.minContract) return false;
      if (e.requiresApi && st.apiOpen !== true) return false;
      return true;
    });
  }

  function fillEventOrder(st, def) {
    const lvl = modelLevel(st);
    const eco = contractEco(st);
    const workload = Math.max(100, Math.round(def.workload || (1500 + lvl * 900)));
    const base = def.rewardBase || 18000;
    const reward = Math.round(base * eco * (1 + lvl * 0.35) * worldEventMult(st, 'orderReward') *
      (talentOn(st, 'leco', 1) ? 1.25 : 1));
    return {
      id: ++st.orderSeq, type: 'rush', quality: 'rush',
      workload, reward, dataReward: 0, workLeft: workload, event: true,
      eventName: def.name,
    };
  }

  function applyWorldInstant(st, def, ev) {
    if (!def.instant) return;
    const eco = contractEco(st);
    if (def.instant === 'money' || def.instant === 'prepay') {
      const amount = Math.round((def.amount || 10000) * eco);
      st.money += amount;
      log(st, '【' + def.name + '】现金 +¥' + amount.toLocaleString('en-US'));
      ev.push({ type: 'worldInstant', kind: 'money', id: def.id, name: def.name, amount });
      return;
    }
    if (def.instant === 'data') {
      const amount = (def.amount || 300) * eco;
      st.data = Math.min(dataCap(st), st.data + amount);
      log(st, '【' + def.name + '】训练数据 +' + amount.toLocaleString('en-US') + ' GB');
      ev.push({ type: 'worldInstant', kind: 'data', id: def.id, name: def.name, amount });
      return;
    }
    if (def.instant === 'warehouse') {
      const lvl = modelLevel(st);
      const pool = C.HARDWARE.filter(d => !d.special && d.unlock <= lvl);
      const pick = pool.length ? pool[Math.min(pool.length - 1, Math.floor(rand(st) * pool.length))] : null;
      if (pick) {
        st.warehouse.push({ uid: st.uid++, defId: pick.id });
        log(st, '【' + def.name + '】' + pick.name + ' 已进公共仓库。');
        ev.push({ type: 'worldInstant', kind: 'warehouse', id: def.id, name: def.name, defId: pick.id, item: pick.name });
      }
      return;
    }
    if (def.instant === 'bid') {
      const o = fillEventOrder(st, def);
      st.orderBoard.push(o);
      log(st, '【' + def.name + '】特殊订单已钉上订单板：' + o.workload + ' 工作量。');
      ev.push({ type: 'worldInstant', kind: 'order', id: def.id, name: def.name, orderId: o.id, reward: o.reward });
    }
  }

  function startWorldEvent(st, def, ev) {
    const span = def.duration || [35, 45];
    const duration = span[0] + rand(st) * Math.max(0, span[1] - span[0]);
    st.worldEvent = { id: def.id, remain: duration, duration };
    st.worldNeg = def.tone === 'bad' ? (st.worldNeg || 0) + 1 : 0;
    if (!Array.isArray(st.worldRecent)) st.worldRecent = [];
    st.worldRecent.push(def.id);
    while (st.worldRecent.length > C.CONST.worldRecentMax) st.worldRecent.shift();
    if (!st.eventRev) st.eventRev = 0;
    st.eventRev++;
    applyWorldInstant(st, def, ev);
    log(st, '【世界事件】' + def.name + '：' + def.brief);
    addNews(st, {
      cat: newsCatForGroup(def.group), tag: '突发', tone: def.tone,
      source: '世界事件', title: def.name, body: def.brief,
      eventId: def.id, fx: newsFx(def),
      story: C.NEWS_ARTICLES && C.NEWS_ARTICLES[def.id],
    });
    opinionEventBurst(st, def);
    ev.push({
      type: 'worldStart', id: def.id, name: def.name, brief: def.brief,
      tone: def.tone || 'neutral', duration, instant: def.instant || '',
    });
  }

  function worldTick(st, dt, ev) {
    const active = activeWorldEvent(st);
    if (active) {
      active.remain -= dt;
      st.worldEvent.remain = active.remain;
      if (active.remain <= 0) {
        st.worldEvent = null;
        st.eventRev = (st.eventRev || 0) + 1;
        st.worldTimer = (C.CONST.worldCooldownMin +
          rand(st) * Math.max(0, C.CONST.worldCooldownMax - C.CONST.worldCooldownMin)) *
          (talentOn(st, 'levent', 3) ? 0.8 : 1);
        log(st, '【世界事件】' + active.def.name + ' 结束。');
        addNews(st, {
          cat: newsCatForGroup(active.def.group), tag: '收尾', tone: 'neutral',
          source: '世界事件', title: '「' + active.def.name + '」结束',
          body: '事件影响消退，机房报价与订单回到常态。',
          eventId: active.id,
          story: newsStory('wrap', { def: active.def, duration: active.duration }),
        });
        ev.push({ type: 'worldEnd', id: active.id, name: active.def.name });
      }
      return;
    }
    if (!st.act1Done) return;
    st.worldTimer = (isFinite(st.worldTimer) ? st.worldTimer : C.CONST.worldFirstDelay) - dt;
    if (st.worldTimer > 0) return;

    let pool = worldNearPool(st);
    if (Array.isArray(st.worldRecent)) {
      const fresh = pool.filter(e => st.worldRecent.indexOf(e.id) === -1);
      if (fresh.length) pool = fresh;
    }
    if ((st.worldNeg || 0) >= 2) {
      const calm = pool.filter(e => e.tone !== 'bad');
      if (calm.length) pool = calm;
    }
    if (!pool.length) {
      st.worldTimer = 25;
      return;
    }
    let total = 0;
    pool.forEach(e => { total += e.weight || 1; });
    let r = rand(st) * total;
    let pick = pool[pool.length - 1];
    for (let i = 0; i < pool.length; i++) {
      r -= (pool[i].weight || 1);
      if (r <= 0) { pick = pool[i]; break; }
    }
    startWorldEvent(st, pick, ev);
  }

  /* ---------------- 第一幕派生 ---------------- */
  function aiCount(st) { return C.AI[st.aiTier].count; }
  function ramMult(st) { return C.RAM[st.ramTier].mult; }
  function clickMult(st) {
    const early = talentOn(st, 'clk', 2) ? 4 : (talentOn(st, 'clk', 1) ? 2 : 1);
    return early * (talentOn(st, 'lburn', 1) ? 3 : 1);
  }
  function clickGain(st) {
    const base = C.CONST.clickPerAi * aiCount(st) * ramMult(st);
    return (base + (st.act1Done ? rigClickBonus(st) : 0)) * clickMult(st) *
      burnScale(st) * worldEventMult(st, 'click');
  }

  /* ---------------- 副机 · 燃烧机箱 ---------------- */
  function rigPartClick(def) {
    if (!def) return 0;
    if (def.type === 'ram') return (def.bandwidth || 0) * C.RIG.clickPerBandwidth;
    if (def.type === 'gpu' || def.type === 'cpu') return (def.compute || 0) * C.RIG.clickPerCompute;
    return 0;
  }

  function ensureRig(st) {
    if (!st.rig) st.rig = emptyRig();
    if (!Array.isArray(st.rig.ram)) st.rig.ram = [null, null];
    return st.rig;
  }

  function rigSlots(st) {
    const rig = st && st.rig ? st.rig : emptyRig();
    return [
      { key: 'gpu', type: 'gpu', label: '显卡槽', part: rig.gpu },
      { key: 'cpu', type: 'cpu', label: 'CPU 槽', part: rig.cpu },
      { key: 'ram0', type: 'ram', label: '内存槽 1', part: rig.ram && rig.ram[0] },
      { key: 'ram1', type: 'ram', label: '内存槽 2', part: rig.ram && rig.ram[1] },
    ];
  }

  function rigSlotOf(st, key) {
    return rigSlots(st).find(s => s.key === key) || null;
  }

  function rigAllows(def) {
    return !!def && (def.type === 'gpu' || def.type === 'cpu' || def.type === 'ram') && !def.special;
  }

  function rigClickBonus(st) {
    let bonus = 0;
    rigSlots(st).forEach(s => {
      const def = s.part && C.HARDWARE_BY_ID[s.part.defId];
      if (def && rigAllows(def)) bonus += rigPartClick(def);
    });
    return bonus;
  }

  function rigCount(st) {
    return rigSlots(st).filter(s => s.part).length;
  }

  function rigInstall(st, uid, slotKey) {
    if (!st.act1Done) return { ok: false, reason: '拆开 RTX 3060 后，副机才会通电' };
    ensureRig(st);
    const wi = st.warehouse.findIndex(w => w.uid === uid);
    if (wi === -1) return { ok: false, reason: '公共仓库里没有这件硬件' };
    const item = st.warehouse[wi];
    const def = C.HARDWARE_BY_ID[item.defId];
    if (!rigAllows(def)) return { ok: false, reason: '副机只收显卡、CPU、内存' };
    let key = def.type;
    if (slotKey) {
      const slot = rigSlotOf(st, slotKey);
      if (!slot) return { ok: false, reason: '副机没有这个槽位' };
      if (slot.type !== def.type) return { ok: false, reason: slot.label + '只能装' + (slot.type === 'gpu' ? '显卡' : slot.type === 'cpu' ? 'CPU' : '内存') };
      if (slot.part) return { ok: false, reason: slot.label + '已经有硬件了' };
      key = slotKey;
    } else if (def.type === 'ram') {
      if (!st.rig.ram[0]) key = 'ram0';
      else if (!st.rig.ram[1]) key = 'ram1';
      else return { ok: false, reason: '副机内存槽已满' };
    } else if (st.rig[def.type]) {
      return { ok: false, reason: (def.type === 'gpu' ? '显卡槽' : 'CPU 槽') + '已满' };
    }
    st.warehouse.splice(wi, 1);
    const part = { uid: item.uid, defId: item.defId };
    if (def.type === 'ram') st.rig.ram[key === 'ram0' ? 0 : 1] = part;
    else st.rig[key] = part;
    log(st, '副机装上 ' + def.name + ' · 点击 +' + rigPartClick(def).toLocaleString('en-US') + '。');
    return { ok: true, slotKey: key, part: part, def: def, click: rigPartClick(def) };
  }

  function rigRemove(st, slotKey) {
    ensureRig(st);
    const slot = rigSlotOf(st, slotKey);
    if (!slot || !slot.part) return { ok: false, reason: '这个槽是空的' };
    const def = C.HARDWARE_BY_ID[slot.part.defId];
    const part = slot.part;
    if (slotKey === 'ram0') st.rig.ram[0] = null;
    else if (slotKey === 'ram1') st.rig.ram[1] = null;
    else st.rig[slotKey] = null;
    st.warehouse.push({ uid: part.uid != null ? part.uid : st.uid++, defId: part.defId });
    log(st, '副机取下 ' + (def ? def.name : '硬件') + ' · 已放回公共仓库。');
    return { ok: true, slotKey: slotKey, part: part, def: def };
  }
  function autoClickRate(st) {
    return talentOn(st, 'clk', 3) ? clickGain(st) / C.CONST.autoClickEvery : 0;
  }
  function autoBurn(st) {
    return C.AI[st.aiTier].auto * burnScale(st) * worldEventMult(st, 'auto') *
      (talentOn(st, 'lburn', 2) ? 1.5 : 1);
  }
  function miningRate(st) {
    return C.MINING[st.miningTier].rate * burnScale(st) * worldEventMult(st, 'mining');
  }
  function talentPoints(st) {
    let n = 0;
    C.TALENT_MILESTONES.forEach((at, i) => { if (st.burned >= at) n = i + 1; });
    return n + lateTalentPoints(st);
  }
  function talentTotal(st) {
    return contractIndex(st) >= 1 ? C.TALENT_TOTAL : C.TALENT_MILESTONES.length;
  }
  function lateTalentProgress(st) {
    const con = contractIndex(st);
    if (con < 1) {
      return { unlocked: false, pct: 0, points: 0, progress: 0, next: null, earnedTotal: 0 };
    }
    const pct = contractProgress(st).pct;
    let progress = 0;
    C.TALENT_LATE_THRESHOLDS.forEach(t => { if (pct + 1e-9 >= t) progress++; });
    return {
      unlocked: true, pct, progress, points: 1 + progress,
      next: progress < C.TALENT_LATE_THRESHOLDS.length ? C.TALENT_LATE_THRESHOLDS[progress] : null,
      earnedTotal: (con - 1) * C.TALENT_LATE_PER_CONTRACT + 1 + progress,
    };
  }
  function lateTalentPoints(st) { return lateTalentProgress(st).earnedTotal; }
  function nextTalentAt(st) {
    const p = (() => {
      let n = 0;
      C.TALENT_MILESTONES.forEach((at, i) => { if (st.burned >= at) n = i + 1; });
      return n;
    })();
    return p < C.TALENT_MILESTONES.length ? C.TALENT_MILESTONES[p] : null;
  }
  function nextTalentInfo(st) {
    const early = nextTalentAt(st);
    if (early !== null) {
      return { kind: 'early', at: early, label: '下一里程碑 ' + wanLabel(early) };
    }
    const late = lateTalentProgress(st);
    if (!late.unlocked) return { kind: 'locked', label: '续签百亿解锁续签蓝图' };
    if (late.next !== null) {
      return { kind: 'late', pct: late.next, label: '本期进度 ' + Math.round(late.next * 100) + '% 再得 1 点' };
    }
    return { kind: 'max', label: '续签天赋已集齐' };
  }
  function wanLabel(n) {
    return n >= 10000 ? (n / 10000).toFixed(n % 10000 ? 1 : 0) + ' 万' : String(n);
  }
  function deliveryBaseSec(st) {
    return st.act1Done ? C.CONST.deliveryAct2 : C.CONST.deliveryAct1;
  }
  function deliverySec(st) {
    return deliveryBaseSec(st) / Math.max(0.1, worldEventMult(st, 'delivery'));
  }

  /* ---------------- M4：新手纸签 ---------------- */
  function onboardPending(st, key) { return !!(st && st.onboard && !st.onboard[key]); }
  function onboardMark(st, key) {
    if (!st) return false;
    if (!st.onboard) st.onboard = { tap: false, delivery: false, talent: false };
    if (st.onboard[key]) return false;
    st.onboard[key] = true;
    return true;
  }

  /* ---------------- 天赋（M3 生效） ---------------- */
  function talentSpent(st) {
    const t = st.talents || {};
    return Object.keys(C.TALENTS).reduce((n, key) => n + (t[key] || 0), 0);
  }
  function talentAvailable(st) { return Math.max(0, talentPoints(st) - talentSpent(st)); }
  function talentLvl(st, key) {
    const t = st.talents || {};
    const defs = C.TALENTS[key];
    const max = defs ? defs.length : 3;
    return Math.max(0, Math.min(max, t[key] || 0));
  }
  function talentOn(st, key, n) { return talentLvl(st, key) >= n; }
  function spendTalent(st, key) {
    const defs = C.TALENTS[key];
    if (!defs) return { ok: false, reason: '没有这一系天赋' };
    if (key.charAt(0) === 'l' && contractIndex(st) < 1) {
      return { ok: false, reason: '续签百亿后才能点亮续签天赋' };
    }
    const lvl = talentLvl(st, key);
    if (lvl >= defs.length) return { ok: false, reason: '这一系已经点满' };
    if (talentAvailable(st) <= 0) {
      return { ok: false, reason: '没有可用天赋点 · ' + nextTalentInfo(st).label };
    }
    if (!st.talents) st.talents = {};
    st.talents[key] = lvl + 1;
    const def = defs[lvl];
    log(st, '天赋点亮：' + def.name + ' · ' + def.desc);
    return { ok: true, key: key, lvl: lvl + 1, name: def.name, ev: [{ type: 'talent', key: key, lvl: lvl + 1, name: def.name }] };
  }

  const HW_PRICE_KEY = {
    gpu: 'gpuPrice', npu: 'gpuPrice', ssd: 'ssdPrice',
    psu: 'psuPrice', fan: 'coolerPrice', cooler: 'coolerPrice',
  };
  function hardwarePrice(st, def) {
    if (!def) return 0;
    const tone = (talentOn(st, 'pow', 1) ? 0.9 : 1) * (talentOn(st, 'leco', 3) ? 0.85 : 1);
    const key = HW_PRICE_KEY[def.type];
    const ev = key ? worldEventMult(st, key) : 1;
    const all = worldEventMult(st, 'hardwarePrice');
    return Math.round(def.price * tone * ev * all * contractEco(st));
  }

  function modelLevel(st) {
    let lvl = 0;
    for (let i = 1; i < C.MODEL_LEVELS.length; i++) if (st.burned >= C.MODEL_LEVELS[i].at) lvl = i;
    return lvl;
  }
  function modelDef(st) { return C.MODEL_LEVELS[modelLevel(st)]; }
  function levelName(def) {
    return String(def && def.name || '').replace(/^L\d+\s*·\s*/, '');
  }

  /* ---------------- 五幕章节 + 续签幕 ---------------- */
  function chapter(st) {
    const ci = contractIndex(st);
    if (st.endless) {
      const start = contractBaseOf(st);
      const target = C.CONTRACTS[ci].target;
      return {
        index: 4,
        num: 5 + ci,
        def: {
          id: 5 + ci, name: '无尽运行', start: start, end: start + target,
          goal: '持续累计 Token 消耗', level: 4,
        },
        start: start,
        end: start + target,
        pct: 1,
        done: true,
        gate: false,
        contract: true,
        endless: true,
      };
    }
    if (ci > 0) {
      const con = C.CONTRACTS[ci];
      const start = contractBaseOf(st);
      const end = start + con.target;
      const burned = Math.max(0, Math.min(con.target, st.burned - start));
      const last = ci === C.CONTRACTS.length - 1;
      const def = {
        id: 5 + ci,
        name: con.short + (last ? ' Token 终局' : ' Token 续签'),
        start: start,
        end: end,
        goal: '再烧 ' + con.short + ' Token',
        level: 4,
      };
      return {
        index: 4,
        num: def.id,
        def: def,
        start: start,
        end: end,
        pct: con.target > 0 ? burned / con.target : 0,
        done: burned >= con.target,
        gate: false,
        contract: true,
      };
    }
    let idx = 0;
    if (st.act1Done) {
      for (let i = C.CHAPTERS.length - 1; i >= 1; i--) {
        if (st.burned >= C.CHAPTERS[i].start) { idx = i; break; }
      }
    }
    const def = C.CHAPTERS[idx];
    const gate = idx === 0 && !st.act1Done && st.burned >= def.end;
    const raw = (st.burned - def.start) / Math.max(1, def.end - def.start);
    const pct = gate ? 1 : Math.max(0, Math.min(1, raw));
    return {
      index: idx,
      num: def.id,
      def: def,
      start: def.start,
      end: def.end,
      pct: pct,
      done: idx === 0 ? !!st.act1Done : st.burned >= def.end,
      gate: gate,
    };
  }

  /* ---------------- 软件 ---------------- */
  function softwareSlots(st) {
    return C.CONST.softwareSlotsAct2 + (talentOn(st, 'sw', 3) ? 1 : 0) +
      (contractIndex(st) >= 1 ? 1 : 0) + (contractIndex(st) >= 2 ? 1 : 0);
  }
  function ensureSoftware(st) {
    if (!Array.isArray(st.software)) st.software = [];
    while (st.software.length < softwareSlots(st)) st.software.push(null);
  }
  function effectiveSoftware(st) {
    ensureSoftware(st);
    const out = [];
    const slots = softwareSlots(st);
    for (let i = 0; i < slots && i < st.software.length; i++) if (st.software[i]) out.push(st.software[i]);
    return out;
  }
  function softwareOf(st, type) {
    let best = null;
    effectiveSoftware(st).forEach(sw => {
      if (sw.type !== type) return;
      if (!best || sw.v > best.v) best = sw;
    });
    return best;
  }
  function optimizerMult(st) {
    let m = 1;
    effectiveSoftware(st).forEach(sw => {
      if (sw.type === 'optimizer') m += C.SOFTWARE.optimizer[sw.v - 1].bonus;
    });
    return m;
  }
  function orderProgram(st) {
    const sw = softwareOf(st, 'order');
    return sw ? C.SOFTWARE.order[sw.v - 1] : null;
  }
  function schedulerOf(st) {
    const sw = softwareOf(st, 'scheduler');
    return sw ? C.SOFTWARE.scheduler[sw.v - 1] : null;
  }
  function pipelineOf(st) {
    const sw = softwareOf(st, 'pipeline');
    return sw ? C.SOFTWARE.pipeline[sw.v - 1] : null;
  }
  function gatewayOf(st) {
    const sw = softwareOf(st, 'gateway');
    return sw ? C.SOFTWARE.gateway[sw.v - 1] : null;
  }
  function orderConcurrency(st) {
    const p = orderProgram(st);
    const sched = schedulerOf(st);
    const base = p ? p.concurrency : C.CONST.orderConcurrencyBase;
    return base + (sched ? sched.concurrency : 0) + (talentOn(st, 'eco', 3) ? 1 : 0);
  }
  function orderSlotCompute(st) {
    const sched = schedulerOf(st);
    return C.CONST.orderSlotCompute * (1 - (sched ? sched.slotSave : 0));
  }
  function crawlerDecayRate(st) {
    const pipe = pipelineOf(st);
    return C.CONST.crawlerDecay * (1 - (pipe ? pipe.decay : 0));
  }
  function trainerEff(st) {
    const sw = softwareOf(st, 'trainer');
    return sw ? C.SOFTWARE.trainer[sw.v - 1].eff : 0;
  }
  function hasTrainer(st) { return !!softwareOf(st, 'trainer'); }
  function trainingMult(st) { return talentOn(st, 'lburn', 3) ? 1.3 : 1; }

  /* ---------------- 机位几何 ---------------- */
  function cellIndex(x, y, w) { return y * w + x; }

  // 两组件是否正交边相邻
  function adjacent(a, b, da, db) {
    for (let ax = 0; ax < da.size[0]; ax++) for (let ay = 0; ay < da.size[1]; ay++)
      for (let bx = 0; bx < db.size[0]; bx++) for (let by = 0; by < db.size[1]; by++) {
        const dx = Math.abs((a.x + ax) - (b.x + bx));
        const dy = Math.abs((a.y + ay) - (b.y + by));
        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) return true;
      }
    return false;
  }

  /* ---------------- 单机派生：供电/散热/带宽/邻接 ---------------- */
  const machineStatsCache = new WeakMap();

  function machineStats(machine, st) {
    const W = machine.gridW, H = machine.gridH;
    const pow2 = !!(st && talentOn(st, 'pow', 2));
    const pow3 = !!(st && talentOn(st, 'pow', 3));
    const lpow1 = !!(st && talentOn(st, 'lpow', 1));
    const lpow2 = !!(st && talentOn(st, 'lpow', 2));
    const lpow3 = !!(st && talentOn(st, 'lpow', 3));
    const layout = machine.placed.map(p => p.uid + ':' + p.defId + ':' + p.x + ',' + p.y).join('|');
    const signature = machine.caseTier + ':' + W + ':' + H + ':' + pow2 + ':' + pow3 +
      ':' + lpow1 + ':' + lpow2 + ':' + lpow3 +
      ':' + (st ? st.eventRev | 0 : 0) + '|' + layout;
    const cached = machineStatsCache.get(machine);
    if (cached && cached.signature === signature) return cached.stats;
    const bwMult = pow2 ? 1.2 : 1;
    const coolMult = (pow3 ? 1.2 : 1) * (lpow3 ? 1.25 : 1);
    const gpuMult = lpow1 ? 1.15 : 1;
    const comps = machine.placed.map(p => ({ uid: p.uid, x: p.x, y: p.y, defId: p.defId, def: C.HARDWARE_BY_ID[p.defId] }))
      .filter(c => c.def);

    let sumCompute = 0;
    let sumBandwidth = 0;
    let totalPower = 0, totalHeat = 0;
    let nicOrder = 0, nicCrawler = 0, nicAdjCpu = false;
    let psuWatt = 0, psuOk = true;
    let devPerSec = 0;
    let ssdCap = 0;
    const heatList = new Array(comps.length).fill(0);

    if (C.CASES[machine.caseTier].builtin) {
      const b = C.CASES[machine.caseTier].builtin;
      ssdCap += b.data;
      totalPower += 5; // 板载 M.2 5W
    }

    comps.forEach((c, i) => {
      const d = c.def;
      let cm = 1;
      let heat = d.heat || 0;
      totalPower += (d.power || 0);

      const has = (j, types) => j !== i && types.includes(comps[j].def.type) && adjacent(c, comps[j], d, comps[j].def);

      switch (d.type) {
        case 'gpu':
          if (comps.some((o, j) => has(j, ['ram']))) cm += 0.08;
          if (comps.some((o, j) => has(j, ['gpu']))) cm += 0.15;
          if (comps.some((o, j) => has(j, ['fan', 'cooler']))) heat *= 0.85;
          if (lpow2 && d.arch === 'h') cm *= 1.2;
          sumCompute += d.compute * cm * gpuMult;
          devPerSec += (d.dev || 0);
          break;
        case 'npu':
          if (comps.some((o, j) => has(j, ['cpu']))) cm *= 1.25;
          sumCompute += d.compute * cm;
          break;
        case 'cpu':
          sumCompute += d.compute;
          devPerSec += (d.dev || 0);
          if (comps.some((o, j) => has(j, ['cooler']))) heat *= 0.80;
          break;
        case 'ram': {
          let bm = 1;
          if (comps.some((o, j) => has(j, ['cpu']))) bm += 0.10;
          sumBandwidth += d.bandwidth * bm;
          break;
        }
        case 'psu':
          psuWatt += (d.watt || 0);
          if (c.y + d.size[1] !== H) psuOk = false;
          break;
        case 'ssd':
          ssdCap += (d.capacity || 0);
          break;
        case 'nic':
          nicOrder += (d.orderBonus || 0);
          nicCrawler += (d.crawlerBonus || 0);
          if (comps.some((o, j) => has(j, ['cpu']))) nicAdjCpu = true;
          break;
      }
      totalHeat += heat;
      heatList[i] = heat;
    });

    // 每格发热（组件发热均摊到每一格）
    const cellHeat = new Array(W * H).fill(0);
    comps.forEach((c, i) => {
      const d = c.def;
      const per = heatList[i] / (d.size[0] * d.size[1]);
      for (let dx = 0; dx < d.size[0]; dx++) for (let dy = 0; dy < d.size[1]; dy++)
        cellHeat[cellIndex(c.x + dx, c.y + dy, W)] += per;
    });

    // 每格散热（风扇/水冷覆盖所在行+列；重叠：第一个全额，其后每个 30%）
    const contribs = new Array(W * H).fill(null).map(() => []);
    comps.forEach(c => {
      const d = c.def;
      if (d.type !== 'fan' && d.type !== 'cooler') return;
      const rows = new Set(), cols = new Set();
      for (let dy = 0; dy < d.size[1]; dy++) rows.add(c.y + dy);
      for (let dx = 0; dx < d.size[0]; dx++) cols.add(c.x + dx);
      for (let gy = 0; gy < H; gy++) for (let gx = 0; gx < W; gx++)
        if (rows.has(gy) || cols.has(gx)) contribs[cellIndex(gx, gy, W)].push(d.cooling);
    });
    const passiveCool = C.CASES[machine.caseTier].builtinCool || 0;
    const cellCool = new Array(W * H).fill(0);
    let totalEffCool = 0;
    for (let i = 0; i < W * H; i++) {
      const cs = contribs[i].sort((a, b) => b - a);
      let cc = 0;
      cs.forEach((v, k) => { cc += (k === 0 ? v : v * C.CONST.fanOverlapDecay); });
      cellCool[i] = (cc + passiveCool) * coolMult;
      totalEffCool += Math.min(cellCool[i], cellHeat[i]);
    }

    const bandwidth = sumBandwidth * bwMult;
    const powerCoef = (psuOk && totalPower > 0) ? Math.min(1, psuWatt / totalPower) : (totalPower === 0 ? 1 : 0);
    const coolScale = st ? worldEventMult(st, 'cooling') : 1;
    totalEffCool *= coolScale;
    const coolingCoef = totalHeat > 0 ? Math.min(1, totalEffCool / totalHeat) : 1;
    const effectiveCompute = Math.min(sumCompute, bandwidth);
    const compScale = st ? worldEventMult(st, 'compute') : 1;
    const actualCompute = effectiveCompute * powerCoef * coolingCoef * compScale;

    let bottleneck = null;
    const ratios = [
      { name: '带宽', val: bandwidth > 0 ? Math.min(1, bandwidth / Math.max(sumCompute, 1e-9)) : 0 },
      { name: '供电', val: powerCoef },
      { name: '散热', val: coolingCoef },
    ];
    const minVal = Math.min(...ratios.map(r => r.val));
    if (minVal < 0.999) {
      const b = ratios.find(r => Math.abs(r.val - minVal) < 1e-9);
      bottleneck = { name: b.name, pct: Math.round(minVal * 100) };
    }

    const stats = {
      comps, sumCompute, sumBandwidth: bandwidth, totalPower, totalHeat, totalEffCool,
      psuWatt, psuOk, powerCoef, coolingCoef,
      effectiveCompute, actualCompute,
      nicOrder, nicCrawler, nicAdjCpu,
      devPerSec, ssdCap, cellHeat, cellCool, bottleneck,
    };
    machineStatsCache.set(machine, { signature, stats });
    return stats;
  }

  function serverStats(st, idx) {
    const i = (idx == null) ? st.activeServer : idx;
    const m = st.servers[i];
    return m ? machineStats(m, st) : null;
  }

  function ownedServers(st) {
    const out = [];
    st.servers.forEach((m, i) => { if (m.owned) out.push(i); });
    return out;
  }

  /* ---------------- 全机汇总 ---------------- */
  function totalStats(st) {
    let raw = 0, bandwidth = 0, devBase = 0, cap = 0, nicOrder = 0, nicCrawler = 0;
    let nicAdjCpu = false, psuOk = true, machines = 0;
    st.servers.forEach(m => {
      if (!m.owned) return;
      machines++;
      const s = machineStats(m, st);
      raw += s.actualCompute;
      bandwidth += s.sumBandwidth;
      devBase += s.devPerSec;
      cap += s.ssdCap;
      nicOrder += s.nicOrder;
      nicCrawler += s.nicCrawler;
      nicAdjCpu = nicAdjCpu || s.nicAdjCpu;
      psuOk = psuOk && s.psuOk;
    });
    const opt = optimizerMult(st);
    const devMult = (talentOn(st, 'sw', 1) ? 1.3 : 1) * worldEventMult(st, 'dev');
    return {
      machines, rawCompute: raw, compute: raw * opt, optimizerMult: opt,
      bandwidth, dataCap: cap,
      devPerSec: ((st.act1Done ? C.CONST.devPerSec : 0) + devBase) * devMult,
      nicOrder, nicCrawler, nicAdjCpu, psuOk,
    };
  }

  function totalCompute(st) { return totalStats(st).compute; }
  function dataCap(st) {
    if (!st) return 0;
    const pipe = pipelineOf(st);
    return totalStats(st).dataCap * contractEco(st) * (pipe ? pipe.capMult : 1);
  }
  function devRate(st) { return st && st.act1Done ? totalStats(st).devPerSec : 0; }

  function aiCoderRate(st) {
    if (!st || !st.act1Done) return 0;
    const lvl = modelLevel(st);
    const base = C.AI_CODER.rates[lvl] || 0;
    return base * (talentOn(st, 'sw', 1) ? 1.3 : 1) * worldEventMult(st, 'dev');
  }

  /* ---------------- 开放 API ---------------- */
  function apiUnlocked(st) {
    return !!st && !!st.act1Done && modelLevel(st) >= C.API_SERVICE.unlockLevel;
  }

  function apiTierDef(st) {
    const i = Math.max(0, Math.min(C.API_SERVICE.tiers.length - 1, (st.apiTier || 1) - 1));
    return C.API_SERVICE.tiers[i];
  }

  function apiCapacity(st) {
    if (!st || !st.act1Done) return 0;
    return (C.API_SERVICE.capacityBase +
      Math.floor(totalStats(st).compute / C.API_SERVICE.computePerSlot)) * contractEco(st);
  }

  function apiDemand(st) {
    return apiTierDef(st).demand * contractEco(st) * worldEventMult(st, 'apiDemand') *
      opinionDemandMult(st);
  }

  function apiRate(st) {
    if (!apiUnlocked(st) || st.apiOpen !== true) return 0;
    const gw = gatewayOf(st);
    return Math.min(apiCapacity(st), apiDemand(st)) * (gw ? gw.throughput : 1);
  }

  function apiTokenPerReq() { return C.API_SERVICE.tokenPerReq; }
  function apiPricePerReq(st) {
    const gw = gatewayOf(st);
    return apiTokenPerReq() * apiTierDef(st).yenPerToken * worldEventMult(st, 'apiPrice') *
      (gw ? gw.price : 1) * (talentOn(st, 'leco', 2) ? 1.25 : 1);
  }
  function apiTokenRate(st) { return apiRate(st) * apiTokenPerReq(); }
  function apiRevenueRate(st) { return apiRate(st) * apiPricePerReq(st); }

  function pushApiQuestion(st) {
    const pool = C.API_QUESTIONS;
    if (!pool.length) return;
    const item = pool[Math.min(pool.length - 1, Math.floor(rand(st) * pool.length))];
    const topic = C.API_TOPICS.find(t => t.id === item.topic) || C.API_TOPICS[0];
    const user = 'user_' + Math.floor(rand(st) * 0x10000).toString(16).padStart(4, '0');
    const def = apiTierDef(st);
    const tokens = apiTokenPerReq();
    st.apiDb.unshift({
      id: ++st.apiDbSeq,
      at: Math.round(st.t),
      user: user,
      topic: topic.id,
      topicName: topic.name,
      q: item.q,
      tokens: tokens,
      yen: Math.round(apiPricePerReq(st)),
      tier: def.name,
    });
    if (st.apiDb.length > C.API_SERVICE.dbMax) st.apiDb.pop();
  }

  function upgradeApi(st, tier) {
    tier = tier | 0;
    if (!apiUnlocked(st)) return { ok: false, reason: 'API 服务尚未开放' };
    if (tier !== (st.apiTier || 1) + 1) return { ok: false, reason: '只能逐级升级 API 服务' };
    const def = C.API_SERVICE.tiers[tier - 1];
    if (!def) return { ok: false, reason: '没有这个档位' };
    if (modelLevel(st) < def.level) {
      return { ok: false, reason: '需要 ' + C.MODEL_LEVELS[def.level].short + ' · ' + levelName(C.MODEL_LEVELS[def.level]) };
    }
    if (st.money < def.cost) return { ok: false, reason: '资金不足' };
    st.money -= def.cost;
    st.apiTier = tier;
    log(st, 'API 服务升级：' + def.name + ' · 需求 ' + def.demand + ' 单/s，每 Token ¥' + def.yenPerToken + '。');
    addNews(st, {
      cat: 'industry', tag: '产业', tone: 'good', source: '开放平台',
      title: 'API 服务升级 · ' + def.name,
      body: '需求 ' + def.demand + ' 单/s，每 Token ¥' + def.yenPerToken + '。',
      story: newsStory('api', { def: def }),
    });
    opinionApiUpgrade(st, def);
    return { ok: true, ev: [{ type: 'apiUpgrade', tier: tier, name: def.name }] };
  }

  /* 滑尺：订单 / 训练 分算力 */
  function allocationFrom(st, ts) {
    const total = ts.compute;
    let share = Number(st.orderShare);
    if (!isFinite(share)) share = 0.6;
    share = Math.max(0, Math.min(1, share));
    const conc = orderConcurrency(st);
    const orderCap = st.active.length > 0 ? conc * orderSlotCompute(st) : 0;
    let orderUsed = Math.min(total * share, orderCap);
    let trainUsed = 0;
    if (hasTrainer(st)) trainUsed = Math.max(0, total - orderUsed);
    else orderUsed = Math.min(total, orderCap);
    return {
      total, share, orderUsed, trainUsed, orderCap, hasTrainer: hasTrainer(st),
      orderPct: total > 0 ? orderUsed / total : 0,
      trainPct: total > 0 ? trainUsed / total : 0,
    };
  }
  function allocation(st) { return allocationFrom(st, totalStats(st)); }
  function orderCompute(st) { return allocation(st).orderUsed; }
  /* 接单前的预估算力：不受「当前没有进行中订单」影响 */
  function orderPreviewShare(st) {
    const total = totalStats(st).compute;
    if (!(total > 0)) return 0;
    const cap = orderConcurrency(st) * orderSlotCompute(st);
    const share = Math.max(0, Math.min(1, Number(st.orderShare) || 0));
    const used = hasTrainer(st) ? Math.min(total * share, cap) : Math.min(total, cap);
    return used / Math.max(1, st.active.length + 1);
  }

  /* 训练烧速（Token / 秒）：仅当写入训练器且分到算力 */
  function trainTokenRate(st) {
    const a = allocation(st);
    if (!a.hasTrainer || a.trainUsed <= 0) return { tokenPerSec: 0, dataPerSec: 0, split: a };
    const tokenPerSec = a.trainUsed * C.CONST.trainTokenEff * trainerEff(st) *
      trainingMult(st) * burnScale(st) * worldEventMult(st, 'train');
    return { tokenPerSec, dataPerSec: tokenPerSec * C.CONST.dataPerToken, split: a };
  }

  function crawlerMult(st) { return talentOn(st, 'eco', 2) ? 1.3 : 1; }

  function crawlerRate(st) {
    let rate = 0;
    const decayRate = crawlerDecayRate(st);
    effectiveSoftware(st).forEach(sw => {
      if (sw.type !== 'crawler') return;
      const d = C.SOFTWARE.crawler[sw.v - 1];
      const decay = Math.max(0.15, 1 - decayRate * sw.age);
      rate += d.rate * decay;
    });
    rate *= crawlerMult(st) * contractEco(st) * worldEventMult(st, 'crawler');
    if (!st.act1Done) return rate;
    return rate * (1 + totalStats(st).nicCrawler);
  }

  function gpuState(st) {
    if (st.act1Done) return 'installed';
    if (st.shelf.some(p => p.item === 'gpu') || st.overflow.some(p => p.item === 'gpu')) return 'shelf';
    if (st.deliveries.some(p => p.item === 'gpu')) return 'transit';
    return 'none';
  }

  /* 固定种子的轻量随机：存档可复现订单 */
  function rand(st) {
    st.rngSeed = (st.rngSeed + 0x6D2B79F5) | 0;
    let t = st.rngSeed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /* ---------------- 机房日报 ---------------- */
  function cleanStory(src) {
    if (!src || typeof src !== 'object') return null;
    const deck = typeof src.deck === 'string' ? src.deck.slice(0, 180) : '';
    const paras = Array.isArray(src.paras) ? src.paras
      .filter(p => typeof p === 'string' && p.trim())
      .slice(0, 4).map(p => p.slice(0, 320)) : [];
    let quote = null;
    if (src.quote && typeof src.quote === 'object' && typeof src.quote.text === 'string') {
      quote = {
        text: src.quote.text.slice(0, 180),
        by: typeof src.quote.by === 'string' ? src.quote.by.slice(0, 30) : '',
      };
    }
    const byline = typeof src.byline === 'string' ? src.byline.slice(0, 30) : '';
    if (!deck && !paras.length && !quote && !byline) return null;
    return { deck: deck, paras: paras, quote: quote, byline: byline };
  }

  function newsStory(kind, data) {
    data = data || {};
    if (kind === 'start') {
      return {
        deck: '一份只印在机房里的报纸，从第一度电开始记录。',
        paras: [
          '这里没有编辑部，只有一台老电脑、一卷打印纸和随时可能跳闸的电源。创刊号的头版留给机房的日常：硬件、订单、模型，以及那些说变就变的外部消息。',
          '从今天起，世界事件、协议续签、模型升级和补给到账都会写成短讯。重要的消息会留出整版，换成更长的稿子。',
          '本报不保证消息永远准确，只保证每一条都留下时间、来源和影响。纸面记录，盖章为准。',
        ],
        quote: { text: '先把今天记下来，明天才有的对照。', by: '值班编辑' },
        byline: '本报编辑部',
      };
    }
    if (kind === 'migrate') {
      return {
        deck: '旧存档接入，本报补发第一份机房门牌。',
        paras: [
          '系统翻出了旧账本，硬件型号、协议进度和订单记录都被重新核对。有几页字迹已经模糊，但关键数字还在。',
          '从今天起，所有新的世界事件、续签、模型升级和补给都会写进新的版面，不再只留在日志里。',
          '旧消息不会补写，新的记录从现在开始。翻回前面的报纸，能看到机房是怎么一步步走到今天的。',
        ],
        quote: { text: '账可以旧，消息得新。', by: '机房日报编辑' },
        byline: '本报编辑部',
      };
    }
    if (kind === 'level') {
      const name = data.name || '新模型';
      return {
        deck: name + ' 上线，模型监看室第一次主动发来稿子。',
        paras: [
          data.moment || '模型能力提升，订单与硬件解锁继续推进。',
          '升级不是简单换一个版本号。推理速度、软件权限和自动任务都会重新分配，机房需要一点时间适应新的节奏。',
          '模型越强，能替人做的决定越多。每一次升级都值得记录下来，因为后面的许多变化，都从这一页开始。',
        ],
        quote: { text: '它没有开发布会，只在日志里留了一行。', by: '模型监看员' },
        byline: '本报模型观察版',
      };
    }
    if (kind === 'api') {
      const def = data.def || {};
      return {
        deck: '开放平台升到新档位，接口需求和单价一起调整。',
        paras: [
          '本次升级后，接口需求来到 ' + (def.demand || 0) + ' 单/s，每 Token 结算 ¥' + (def.yenPerToken || 0) + '。',
          '新档位不只是价格变化，限流、并发和日志也会重新配置。开发者需要重新核对文档，老调用可以继续，但账单会按新价计算。',
          '开放服务真正卖的是稳定。接口越忙，越要把错误码、重试和限流说明写清楚。',
        ],
        quote: { text: '价格写在文档里，稳定写在监控里。', by: '开放平台值班员' },
        byline: '本报开放平台版',
      };
    }
    if (kind === 'supply') {
      return {
        deck: '公司批下的物资到了前台，纸箱上还带着仓库的灰。',
        paras: [
          '补给是按燃烧进度发放的，烧到 ' + humanWan(data.burned || 0) + ' Token 时触发。这次到手的是：' + (data.won || '一批物资') + '。',
          '物资不多，却总在最缺的时候出现。前台把它登记入册，仓库则催着尽快拆箱，别让纸箱占着通道。',
          '补给只能救急，不能代替长期规划。把它用在最卡脖子的环节，才能把这点运气换成更长的进度。',
        ],
        quote: { text: '签字，搬走，别堵着门。', by: '公司前台' },
        byline: '本报后勤版',
      };
    }
    if (kind === 'renew') {
      const def = data.def || {};
      const repeat = data.repeat === true;
      return {
        deck: repeat ? '原合同再签一轮，标的照旧，楼里的灯还亮着。' : '新协议盖章生效，标的更大，楼里的灯还亮着。',
        paras: [
          repeat
            ? (def.name || '续签协议') + '再签一轮，标的仍是 ' + Number(def.target || 0).toLocaleString('en-US') + ' Token。进度全部保留，直接接着跑。'
            : (def.name || '续签协议') + '已签署，新标的 ' + Number(def.target || 0).toLocaleString('en-US') + ' Token。前一阶段的进度保留，软件槽与续签天赋重新结算。',
          '订单板被重新铺开，世界事件恢复计时。旧合同留下的硬件还在原位，新的任务已经从更高处压下来。',
          repeat
            ? '后面已经没有更大的合同了，想接着烧，就只能把这一份再跑一遍。'
            : '续签不是回到起点，而是把已经建好的机房推上更大的跑道。接下来每一度电、每一次燃烧，都记在新合同名下。',
        ],
        quote: { text: '签完这一份，继续烧。', by: '协议中心' },
        byline: '本报协议版',
      };
    }
    if (kind === 'arrival') {
      const hw = data.hw || {};
      return {
        deck: '训练卡进了快递架，纸箱比普通硬件沉得多。',
        paras: [
          (hw.name || 'H 系列训练卡') + '已经到货，外箱上印着醒目的型号和功耗标识。按规矩，它还不能直接进机位，得先拆箱、登记，再从公共仓库取用。',
          '这类卡的算力高，发热和供电要求也高。装机之前最好先看机箱里还有没有位置，电源和散热够不够。',
          '卡价不便宜，运输也慢。既然到了，就尽快让它跑起来，别让它在快递架上继续吃灰。',
        ],
        quote: { text: '这箱别压，里面是训练卡。', by: '快递站分拣员' },
        byline: '本报物流版',
      };
    }
    if (kind === 'wrap') {
      const def = data.def || {};
      return {
        deck: '影响消退，机房报价与订单回到常态。',
        paras: [
          '「' + (def.name || '世界事件') + '」持续了约 ' + Math.round(data.duration || 0) + ' 秒，期间相关指标出现明显波动，现在已经结束。',
          '值班员重新核对报价、订单与硬件状态。临时调整正在撤回，之前压后的任务可以重新排上日程。',
          '世界事件不会只来一次。把这次的应对写进交接班记录，下次遇到同类消息，机房能反应得更快。',
        ],
        quote: { text: '风头过了，先把表调回来。', by: '值班员' },
        byline: '本报编辑部',
      };
    }
    return null;
  }

  function fallbackStory(n) {
    const catLine = {
      market: '市场端的波动还没有完全传导到机房，采购与报价都需要重新核对。',
      industry: '产业消息仍在发酵，硬件、接口与订单会沿各自的节奏受到影响。',
      room: '机房现场已经按临时方案调整，温度、供电和机位状态都在继续观察。',
      frontier: '前沿变化不会立刻写进账面，但模型与算力的边界正在移动。',
      notice: '这是一条机房内部记录，细节以当天的交接班日志为准。',
    }[n.cat] || '消息已记录，后续影响以机房实际状态为准。';
    return {
      deck: n.body || '机房日报留下了一条简短记录。',
      paras: [
        n.body || '这条消息没有留下更多细节。',
        catLine,
        '本报会继续跟踪相关变化，新的进展会写进后续版面。',
      ],
      quote: null,
      byline: '本报编辑部',
    };
  }

  function newsDetail(st, n) {
    if (!n) return null;
    let story = cleanStory(n.story);
    if (!story && n.eventId && n.tag !== '收尾') {
      story = cleanStory(C.NEWS_ARTICLES && C.NEWS_ARTICLES[n.eventId]);
    }
    if (!story) story = cleanStory(fallbackStory(n)) || { deck: '', paras: [], quote: null, byline: '' };
    return {
      deck: story.deck || n.body || '',
      paras: story.paras.length ? story.paras : (n.body ? [n.body] : []),
      quote: story.quote,
      byline: story.byline || '本报编辑部',
    };
  }

  function addNews(st, item) {
    if (!st || !item) return null;
    if (!Array.isArray(st.news)) st.news = [];
    st.newsSeq = Math.max(1, (st.newsSeq || 0) + 1);
    const rec = {
      id: st.newsSeq,
      at: Math.max(0, Math.round(st.t || 0)),
      cat: item.cat || 'notice',
      tag: item.tag || '快讯',
      tone: item.tone === 'good' || item.tone === 'bad' ? item.tone : 'neutral',
      source: item.source || '机房日报',
      title: item.title || '机房快讯',
      body: item.body || '',
      eventId: item.eventId || null,
      eventRev: Math.max(0, st.eventRev || 0),
      fx: item.fx || '',
      story: cleanStory(item.story),
    };
    st.news.unshift(rec);
    if (st.news.length > 60) st.news.length = 60;
    return rec;
  }
  function newsUnread(st) {
    if (!st || !Array.isArray(st.news)) return 0;
    const seen = st.newsRead || 0;
    return st.news.filter(n => n && n.id > seen).length;
  }
  function markNewsRead(st) {
    if (!st) return 0;
    st.newsRead = st.newsSeq || 0;
    return newsUnread(st);
  }
  function newsFx(def) {
    const effects = def && def.effects ? def.effects : {};
    const out = [];
    Object.keys(effects).forEach(k => {
      const v = effects[k];
      const label = C.NEWS_EFFECT_LABEL[k] || k;
      if (k === 'orderBoard') out.push(label + ' +' + v);
      else out.push(label + ' ×' + (Math.round(v * 100) / 100));
    });
    return out.slice(0, 4).join(' · ');
  }
  function newsCatForGroup(group) {
    return C.NEWS_GROUP_CAT[group] || 'market';
  }

  /* ---------------- 舆论 ---------------- */
  function opinionBand(st) {
    const lvl = modelLevel(st);
    return C.OPINION_BANDS.find(b => lvl >= b.min && lvl <= b.max) ||
      C.OPINION_BANDS[C.OPINION_BANDS.length - 1];
  }

  function opinionScore(st) {
    const v = st && st.opinion ? Number(st.opinion.score) : 48;
    return Math.max(0, Math.min(100, isFinite(v) ? v : 48));
  }

  function opinionTarget(st) {
    const lvl = modelLevel(st);
    let t = 43 + lvl * 2.2;
    if (apiUnlocked(st)) {
      t -= 2;
      if (st.apiOpen === true) {
        const cap = apiCapacity(st);
        const dem = apiTierDef(st).demand * contractEco(st) * worldEventMult(st, 'apiDemand');
        const ratio = dem > 0 ? cap / dem : 2;
        t += ratio >= 1.15 ? 4 : ratio < 0.75 ? -12 : ratio < 0.95 ? -5 : 0;
      }
    }
    const a = activeWorldEvent(st);
    if (a) {
      if (a.def.tone === 'good') t += 3;
      else if (a.def.tone === 'bad') t -= 4;
    }
    if ((st.worldNeg || 0) >= 2) t -= 2;
    return Math.round(Math.max(5, Math.min(96, t)));
  }

  function reviewStars(st, tone) {
    if (tone === 'good') return rand(st) < 0.45 ? 5 : 4;
    if (tone === 'bad') return rand(st) < 0.4 ? 1 : 2;
    return 3;
  }

  function addOpinionReview(st, opt) {
    if (!st || !opt || !opt.text) return null;
    if (!st.opinion) st.opinion = emptyOpinion();
    const o = st.opinion;
    const tone = opt.tone === 'good' || opt.tone === 'bad' ? opt.tone : 'neutral';
    const source = ['dev', 'biz', 'user', 'media'].indexOf(opt.source) >= 0 ? opt.source : 'user';
    const pool = C.OPINION_USERS[source] || C.OPINION_USERS.user;
    const user = typeof opt.user === 'string' && opt.user
      ? opt.user.slice(0, 24)
      : pool[Math.floor(rand(st) * pool.length)];
    const rec = {
      id: ++o.seq,
      at: Math.max(0, Math.round(st.t || 0)),
      source: source,
      user: user,
      tone: tone,
      stars: Math.max(1, Math.min(5, Number(opt.stars) || reviewStars(st, tone))),
      postId: typeof opt.postId === 'string' ? opt.postId.slice(0, 40) : '',
      event: typeof opt.event === 'string' ? opt.event.slice(0, 24) : '',
      text: String(opt.text).replace(/\s+/g, ' ').trim().slice(0, 160),
    };
    o.reviews.unshift(rec);
    if (o.reviews.length > 40) o.reviews.length = 40;
    return rec;
  }

  function pickOpinionPost(st, tone, lvl) {
    const band = C.OPINION_BANDS.find(b => lvl >= b.min && lvl <= b.max) ||
      C.OPINION_BANDS[C.OPINION_BANDS.length - 1];
    const all = C.OPINION_POSTS[band.key] || C.OPINION_POSTS.early;
    let pool = all.filter(p => p.tone === tone);
    if (!pool.length) pool = all;
    const recent = new Set((st.opinion.reviews || []).slice(0, 8).map(r => r.postId));
    const fresh = pool.filter(p => !recent.has(p.text));
    const source = fresh.length ? fresh : pool;
    return source[Math.min(source.length - 1, Math.floor(rand(st) * source.length))];
  }

  function addAutoOpinionReview(st, lvl) {
    const score = opinionScore(st);
    const norm = (score - 50) / 50;
    const goodP = Math.max(0.08, Math.min(0.72, 0.30 + norm * 0.28));
    const badP = Math.max(0.04, Math.min(0.55, 0.26 - norm * 0.20));
    const r = rand(st);
    const tone = r < goodP ? 'good' : r < goodP + badP ? 'bad' : 'neutral';
    const post = pickOpinionPost(st, tone, lvl);
    if (!post) return null;
    return addOpinionReview(st, {
      source: post.source, tone: tone, postId: post.text,
      text: post.text.replace(/\{ai\}/g, aiName(st)),
    });
  }

  function opinionLevelBurst(st, lvl) {
    if (lvl < 1) return;
    if (!st.opinion) st.opinion = emptyOpinion();
    st.opinion.score = Math.max(0, Math.min(100, opinionScore(st) + 4));
    for (let i = 0; i < 2; i++) {
      const post = pickOpinionPost(st, 'good', lvl);
      if (post) {
        addOpinionReview(st, {
          source: post.source, tone: 'good', postId: post.text, event: 'L' + lvl + ' 升级',
          text: post.text.replace(/\{ai\}/g, aiName(st)),
        });
      }
    }
    st.opinion.timer = Math.max(st.opinion.timer, 8);
  }

  function opinionEventBurst(st, def) {
    if (!def) return;
    if (!st.opinion) st.opinion = emptyOpinion();
    const custom = C.OPINION_EVENT_POSTS[def.id];
    const tone = custom ? custom.tone : (def.tone === 'good' || def.tone === 'bad' ? def.tone : 'neutral');
    const delta = tone === 'good' ? 3 : tone === 'bad' ? -4 : 0;
    st.opinion.score = Math.max(0, Math.min(100, opinionScore(st) + delta));
    const lines = custom ? custom.lines : [{
      source: def.tone === 'bad' ? 'media' : 'biz',
      text: def.tone === 'bad'
        ? '「' + def.name + '」的影响传到了{ai}身上，用户开始讨论备选方案。'
        : def.tone === 'good'
          ? '听说「' + def.name + '」之后，{ai}的档期更满了。'
          : '「' + def.name + '」上了热搜，但普通用户只关心{ai}今天稳不稳。',
    }];
    lines.slice(0, 2).forEach(line => {
      addOpinionReview(st, {
        source: line.source, tone: tone, event: def.name,
        text: line.text.replace(/\{ai\}/g, aiName(st)),
      });
    });
  }

  function opinionApiUpgrade(st, def) {
    if (!st.opinion) st.opinion = emptyOpinion();
    st.opinion.score = Math.max(0, Math.min(100, opinionScore(st) + 2));
    addOpinionReview(st, {
      source: 'dev', tone: 'good', event: 'API 升级',
      text: aiName(st) + '升到「' + (def.name || '新档位') + '」，控制台终于把限流和账单分开了。',
    });
  }

  function opinionDemandMult(st) {
    const s = opinionScore(st);
    if (s >= 60) return 1 + Math.min(0.12, (s - 50) * 0.0025);
    if (s <= 40) return 1 - Math.min(0.10, (50 - s) * 0.002);
    return 1;
  }

  function opinionTick(st, dt) {
    if (!st.opinion) st.opinion = emptyOpinion();
    const target = opinionTarget(st);
    st.opinion.target = target;
    const diff = target - opinionScore(st);
    st.opinion.score = Math.max(0, Math.min(100,
      opinionScore(st) + diff * Math.min(1, dt * (diff >= 0 ? 0.06 : 0.04))));
    const lvl = modelLevel(st);
    if (lvl < 1) {
      st.opinion.timer = Math.max(st.opinion.timer, 20);
      return;
    }
    st.opinion.timer -= dt;
    if (st.opinion.timer <= 0) {
      addAutoOpinionReview(st, lvl);
      st.opinion.timer = Math.max(10, 24 - lvl * 0.5) + rand(st) * 12;
    }
  }

  function opinionUnread(st) {
    if (!st || !st.opinion || !Array.isArray(st.opinion.reviews)) return 0;
    const read = st.opinion.readSeq || 0;
    return st.opinion.reviews.filter(r => r.id > read).length;
  }
  function markOpinionRead(st) {
    if (!st || !st.opinion) return 0;
    st.opinion.readSeq = st.opinion.seq || 0;
    return 0;
  }
  function opinionStars(st) {
    if (!st || !st.opinion || !st.opinion.reviews.length) return Math.round(opinionScore(st) / 20 * 10) / 10;
    const recent = st.opinion.reviews.slice(0, 20);
    const avg = recent.reduce((s, r) => s + (Number(r.stars) || 3), 0) / recent.length;
    return Math.round(avg * 10) / 10;
  }
  function opinionCounts(st) {
    const out = { good: 0, neutral: 0, bad: 0 };
    ((st && st.opinion && st.opinion.reviews) || []).forEach(r => {
      out[r.tone === 'good' || r.tone === 'bad' ? r.tone : 'neutral']++;
    });
    return out;
  }

  function normalizeOpinion(st, raw) {
    const o = emptyOpinion();
    if (raw && typeof raw === 'object') {
      o.score = Math.max(0, Math.min(100, isFinite(raw.score) ? Number(raw.score) : 48));
      o.timer = isFinite(raw.timer) ? Math.max(1, Math.min(90, Number(raw.timer))) : 20;
      o.readSeq = Math.max(0, Number(raw.readSeq) || 0);
      const seen = new Set();
      o.reviews = (Array.isArray(raw.reviews) ? raw.reviews : []).map(x => {
        if (!x || typeof x !== 'object') return null;
        const id = Number(x.id) | 0;
        if (id <= 0 || seen.has(id)) return null;
        seen.add(id);
        const tone = x.tone === 'good' || x.tone === 'bad' ? x.tone : 'neutral';
        return {
          id: id,
          at: isFinite(x.at) ? Math.max(0, Math.round(x.at)) : 0,
          source: ['dev', 'biz', 'user', 'media'].indexOf(x.source) >= 0 ? x.source : 'user',
          user: typeof x.user === 'string' ? x.user.slice(0, 24) : '匿名用户',
          tone: tone,
          stars: Math.max(1, Math.min(5, Number(x.stars) || 3)),
          postId: typeof x.postId === 'string' ? x.postId.slice(0, 40) : '',
          event: typeof x.event === 'string' ? x.event.slice(0, 24) : '',
          text: typeof x.text === 'string' ? x.text.slice(0, 160) : '',
        };
      }).filter(Boolean).sort((a, b) => b.id - a.id).slice(0, 40);
      const maxId = o.reviews.reduce((m, r) => Math.max(m, r.id), 0);
      o.seq = Math.max(maxId, Number(raw.seq) || 0);
      o.readSeq = Math.max(0, Math.min(o.seq, o.readSeq));
    }
    st.opinion = o;
    const lvl = modelLevel(st);
    if (lvl >= 1) {
      if (!o.reviews.length) {
        o.score = opinionTarget(st);
        o.target = o.score;
        for (let i = 0; i < 3; i++) addAutoOpinionReview(st, lvl);
        o.readSeq = o.seq;
      }
      o.target = opinionTarget(st);
    }
  }

  /* ---------------- 日志 ---------------- */
  function log(st, msg) {
    st.logs.unshift({ t: Math.round(st.t), msg });
    if (st.logs.length > 60) st.logs.pop();
  }

  /* ---------------- 一次性补给 ---------------- */
  function giftById(id) {
    return C.GIFTS.find(g => g.id === id) || null;
  }

  function needsGpuRescue(st) {
    return !st.act1Done && gpuState(st) === 'none';
  }

  function applyGift(st, def, ev) {
    let fallback = false;
    if (def.id === 'mine100k') {
      fallback = st.miningTier > 0 || st.downloads.some(d => d.item === 'mining');
      if (fallback) st.money += 1000;
      else st.miningTier = 1;
    } else if (def.id === 'gpu1m') {
      fallback = gpuState(st) !== 'none';
      st.money += fallback ? 1000 : C.GPU.price;
    } else if (def.id === 'gpu2m') {
      const pkg = { uid: st.uid++, item: 'gpu', tier: 0 };
      if (st.shelf.length < C.CONST.shelfMax) st.shelf.push(pkg);
      else st.overflow.push(pkg);
      st.unlocked.shelf = true;
    } else if (def.id === 'nic5m') {
      st.warehouse.push({ uid: st.uid++, defId: 'nic2' });
    } else if (def.id === 'data20m') {
      st.data += 500;
    } else if (def.id === 'npu50m') {
      fallback = npuCount(st) >= C.CONST.npuMax;
      if (fallback) st.data += 500;
      else {
        st.npuMade = npuCount(st) + 1;
        st.warehouse.push({ uid: st.uid++, defId: 'npu1' });
      }
    }
    const won = fallback ? (def.fallbackItem || def.item) : def.item;
    log(st, '补给到账：' + won + '。');
    addNews(st, {
      cat: 'notice', tag: '补给', tone: 'good', source: '公司前台',
      title: '补给到账 · ' + won,
      body: '烧到 ' + humanWan(st.burned) + ' Token，公司又批了一批物资。',
      story: newsStory('supply', { won: won, burned: st.burned }),
    });
    ev.push({ type: 'gift', giftId: def.id, fallback: fallback });
  }

  function checkGifts(st, ev, prevBurned) {
    if (!Array.isArray(st.gifts)) st.gifts = [];
    C.GIFTS.forEach(g => {
      if (st.gifts.indexOf(g.id) !== -1) return;
      if (prevBurned < g.at && st.burned >= g.at) {
        if (g.rescue && !needsGpuRescue(st)) return;
        st.gifts.push(g.id);
        applyGift(st, g, ev);
      }
    });
  }

  /* 读档补发：只救真正会卡死的旧档，其他越过的补给不追溯 */
  function migrateGifts(st) {
    const ev = [];
    if (!Array.isArray(st.gifts)) st.gifts = [];
    const has = id => st.gifts.indexOf(id) !== -1;

    if (!has('mine100k') && st.burned >= 100000 && st.miningTier === 0 &&
      !st.downloads.some(d => d.item === 'mining')) {
      st.gifts.push('mine100k');
      applyGift(st, giftById('mine100k'), ev);
    }
    if (!has('gpu1m') && st.burned >= C.GPU.gate && gpuState(st) === 'none' &&
      st.money < C.GPU.price) {
      st.gifts.push('gpu1m');
      applyGift(st, giftById('gpu1m'), ev);
    }
    if (!has('gpu2m') && st.burned >= 2000000 && needsGpuRescue(st)) {
      st.gifts.push('gpu2m');
      applyGift(st, giftById('gpu2m'), ev);
    }

    C.GIFTS.forEach(g => {
      if (g.at <= st.burned && !has(g.id)) st.gifts.push(g.id);
    });
    return ev;
  }

  /* ---------------- 烧 Token ---------------- */
  function humanWan(n) {
    if (n >= 10000) return (n / 10000) + ' 万';
    return String(n);
  }

  function burn(st, n, ev) {
    if (!(n > 0)) return 0;
    if (!st.endless && st.token <= 0) return 0;
    const prevBurned = st.burned;
    const real = st.endless ? n : Math.min(n, st.token);
    if (!st.endless) st.token -= real;
    st.burned += real;

    const reward = C.STARTER_REWARD;
    if (st.burned >= reward.at && !st.starterRewardClaimed) {
      st.starterRewardClaimed = true;
      st.money += reward.money;
      log(st, '启动资金到账：+¥' + reward.money.toLocaleString('en-US') + '（先升级 AI，再补内存和矿机）');
      ev.push({ type: 'starterReward', at: reward.at, money: reward.money });
    }

    C.MILESTONES.forEach((m, i) => {
      if (st.burned >= m.at && st.claimed.indexOf(i) === -1) {
        st.claimed.push(i);
        st.money += m.money;
        log(st, 'AI 接了个小活：+¥' + m.money.toLocaleString('en-US') + '（烧到 ' + humanWan(m.at) + '）');
        ev.push({ type: 'milestone', at: m.at, money: m.money });
      }
    });
    if (st.burned >= C.TALENT_MILESTONES[0] && !st.unlocked.blueprint) {
      st.unlocked.blueprint = true;
      log(st, '天赋蓝图点亮：第一个天赋点到手。');
      ev.push({ type: 'blueprint' });
    }
    checkGifts(st, ev, prevBurned);
    return real;
  }

  function click(st) {
    const ev = [];
    const gain = clickGain(st);
    burn(st, gain, ev);
    checkLevelUp(st, ev);
    return { gain: gain, ev: ev };
  }

  function checkLevelUp(st, ev) {
    const lvl = modelLevel(st);
    if (lvl > (st.lastLevel || 0)) {
      st.lastLevel = lvl;
      const def = C.MODEL_LEVELS[lvl];
      const named = aiName(st);
      const label = levelName(def);
      log(st, '模型升级：' + named + ' → ' + def.short + ' · ' + label + '。');
      if (C.AI_MOMENTS[lvl]) log(st, C.AI_MOMENTS[lvl]);
      addNews(st, {
        cat: 'frontier', tag: '升级', tone: 'good', source: '模型监看',
        title: '模型升级 · ' + named + ' / ' + def.short + ' · ' + label,
        body: C.AI_MOMENTS[lvl] || '模型能力提升，订单与硬件解锁继续推进。',
        story: newsStory('level', {
          name: named + ' / ' + def.short + ' · ' + label,
          moment: C.AI_MOMENTS[lvl] || '',
        }),
      });
      opinionLevelBurst(st, lvl);
      ev.push({ type: 'levelUp', level: lvl, name: def.name, label: label, moment: C.AI_MOMENTS[lvl] || '' });
    }
  }

  /* ---------------- 软件：开发点 / 写入 / 升级 ---------------- */
  function code(st) {
    if (!st.act1Done) return { ok: false, reason: '第 2 幕才能写代码' };
    st.devPoints += C.CONST.devPerClick;
    return { ok: true, gain: C.CONST.devPerClick };
  }

  function writeCost(type) {
    const defs = C.SOFTWARE[type];
    if (!defs) return null;
    return Math.round(defs[0].dev * C.CONST.softwareDiscount);
  }
  function upgradeCost(type, v) {
    const defs = C.SOFTWARE[type];
    if (!defs || !defs[v]) return null;
    return Math.round(defs[v].dev * C.CONST.softwareDiscount);
  }
  function upgradeCostFor(st, type, v) {
    const base = upgradeCost(type, v);
    if (base === null) return null;
    return Math.round(base * (talentOn(st, 'sw', 2) ? 0.5 : 1));
  }

  function writeSoftware(st, type) {
    const defs = C.SOFTWARE[type];
    if (!defs) return { ok: false, reason: '类型错误' };
    if (!st.act1Done) return { ok: false, reason: '第 2 幕才能写软件' };
    ensureSoftware(st);
    const slots = softwareSlots(st);
    if (st.software.slice(0, slots).filter(Boolean).length >= slots) return { ok: false, reason: '软件槽已满' };
    const cost = writeCost(type);
    if (st.devPoints < cost) return { ok: false, reason: '开发点不足 · 还差 ' + Math.ceil(cost - st.devPoints) };
    st.devPoints -= cost;
    const sw = { type: type, v: 1, age: 0, spent: cost };
    for (let i = 0; i < slots; i++) if (!st.software[i]) { st.software[i] = sw; break; }
    log(st, '写好「' + defs[0].name + '」· 开发点 -' + cost);
    return { ok: true, idx: st.software.indexOf(sw), ev: [{ type: 'software', action: 'write', type: type, v: 1 }] };
  }

  function upgradeSoftware(st, idx) {
    ensureSoftware(st);
    const sw = st.software[idx];
    if (!sw) return { ok: false, reason: '空槽' };
    const defs = C.SOFTWARE[sw.type];
    if (sw.v >= defs.length) return { ok: false, reason: '已满级' };
    const cost = upgradeCostFor(st, sw.type, sw.v);
    if (st.devPoints < cost) return { ok: false, reason: '开发点不足 · 还差 ' + Math.ceil(cost - st.devPoints) };
    st.devPoints -= cost;
    sw.v += 1;
    sw.age = 0;
    sw.spent = (sw.spent || 0) + cost;
    log(st, '升级「' + defs[sw.v - 1].name + '」· 开发点 -' + cost);
    return { ok: true, ev: [{ type: 'software', action: 'upgrade', type: sw.type, v: sw.v }] };
  }

  function removeSoftware(st, idx) {
    ensureSoftware(st);
    const sw = st.software[idx];
    if (!sw) return { ok: false, reason: '这个槽是空的' };
    const spent = Math.max(0, Number(sw.spent) || 0);
    const refund = Math.floor(spent * C.CONST.softwareRefund);
    st.devPoints += refund;
    st.software[idx] = null;
    const name = (C.SOFTWARE[sw.type] && C.SOFTWARE[sw.type][sw.v - 1])
      ? C.SOFTWARE[sw.type][sw.v - 1].name : sw.type;
    log(st, '卸下「' + name + '」· 返还 ' + refund + ' 开发点');
    return { ok: true, refund: refund, name: name, ev: [{ type: 'software', action: 'remove', type: sw.type, v: sw.v }] };
  }

  /* ---------------- 订单：生成 / 接单 / 完成 ---------------- */
  function rollType(lvl, st) {
    const w = {
      bench: Math.max(0.10, 0.30 - lvl * 0.04),
      train: 0.20 + lvl * 0.08,
      data: Math.max(0.10, 0.40 - lvl * 0.06),
      rush: 0.05 + lvl * 0.05,
    };
    const total = w.bench + w.train + w.data + w.rush;
    let r = rand(st) * total;
    const types = ['bench', 'train', 'data', 'rush'];
    for (let i = 0; i < types.length; i++) { r -= w[types[i]]; if (r <= 0) return types[i]; }
    return 'bench';
  }
  function rollQuality(lvl, type, st) {
    if (type === 'rush') return 'rush';
    if (type === 'data') return 'normal';
    const good = Math.min(0.45, 0.08 + lvl * 0.07);
    return rand(st) < good ? 'good' : 'normal';
  }
  function rollWorkload(type, lvl, st) {
    switch (type) {
      case 'bench': return Math.round((120 + rand(st) * 280) * (1 + lvl * 0.25));
      case 'train': return Math.round((2000 + rand(st) * 4000) * (1 + lvl * 0.4));
      case 'data': return Math.round(100 + rand(st) * 150);
      case 'rush': return Math.round(800 + rand(st) * 1700);
    }
    return 100;
  }
  function qualityMult(q) { return (C.ORDER_QUALITY.find(x => x.id === q) || C.ORDER_QUALITY[0]).mult; }

  function orderBoardCap(st) {
    const sched = schedulerOf(st);
    const add = Math.floor(modelLevel(st) / 2) + worldEventAdd(st, 'orderBoard') +
      contractIndex(st) * 2 + (sched ? sched.board : 0);
    return Math.max(1, Math.min(C.CONST.orderBoardHardMax, C.CONST.orderBoardMax + add));
  }
  function orderRefreshSec(st) {
    const base = Math.max(6, C.CONST.orderRefresh - modelLevel(st) * 1.2);
    return base / Math.max(0.1, worldEventMult(st, 'orderRefresh'));
  }

  function genOrder(st) {
    const ts = st.act1Done ? totalStats(st) : { nicOrder: 0, nicCrawler: 0, nicAdjCpu: false };
    const lvl = modelLevel(st);
    const type = rollType(lvl, st);
    const quality = rollQuality(lvl, type, st);
    const workload = rollWorkload(type, lvl, st);
    const qm = qualityMult(quality);
    const eco = contractEco(st);
    const talk = (lvl >= 3 ? 1 + C.CONST.l3OrderBonus : 1) * (talentOn(st, 'eco', 1) ? 1.1 : 1);
    const latePay = talentOn(st, 'leco', 1) ? 1.25 : 1;
    let reward = 0, dataReward = 0;
    if (type === 'data') {
      const mult = (1 + C.CONST.levelOrderBonus * lvl) * (1 + ts.nicCrawler) * qm * talk;
      dataReward = workload * C.CONST.dataOrderRate * mult * eco * worldEventMult(st, 'orderData');
    } else {
      const nic = ts.nicOrder + (ts.nicAdjCpu ? 0.10 : 0);
      const prog = orderProgram(st);
      const mult = (1 + C.CONST.levelOrderBonus * lvl) * (1 + nic) * (prog ? prog.bonus : 1) * qm * talk;
      reward = workload * C.CONST.baseOrderRate * mult * eco * worldEventMult(st, 'orderReward') * latePay;
    }
    return { id: ++st.orderSeq, type: type, quality: quality, workload: workload, reward: reward, dataReward: dataReward, workLeft: workload };
  }

  function seedOrders(st) {
    const eco = contractEco(st);
    st.orderBoard.push({
      id: ++st.orderSeq, type: 'bench', quality: 'normal',
      workload: C.CONST.newbieWorkload, reward: Math.round(C.CONST.newbieReward * eco),
      dataReward: 0, workLeft: C.CONST.newbieWorkload, newbie: true,
    });
    while (st.orderBoard.length < orderBoardCap(st)) st.orderBoard.push(genOrder(st));
    st.orderTimer = orderRefreshSec(st);
  }

  function acceptOrder(st, id) {
    const i = st.orderBoard.findIndex(o => o.id === id);
    if (i === -1) return { ok: false, reason: '订单已经不在了' };
    if (st.active.length >= orderConcurrency(st)) {
      return { ok: false, reason: '并发已满（当前 ' + orderConcurrency(st) + '）' };
    }
    const o = st.orderBoard.splice(i, 1)[0];
    o.workLeft = o.workload;
    st.active.push(o);
    return { ok: true, order: o, ev: [{ type: 'accept', id: o.id, name: C.ORDER_TYPES[o.type].name }] };
  }

  function completeOrder(st, id) {
    const i = st.active.findIndex(o => o.id === id);
    if (i === -1) return null;
    const o = st.active.splice(i, 1)[0];
    if (o.dataReward) {
      st.data = Math.min(dataCap(st), st.data + o.dataReward);
      log(st, '完成「' + C.ORDER_TYPES[o.type].name + '」：+' + o.dataReward.toFixed(1) + ' GB 数据');
      return { type: 'orderDone', id: o.id, name: C.ORDER_TYPES[o.type].name, reward: 0, data: o.dataReward };
    }
    st.money += o.reward;
    log(st, '完成「' + C.ORDER_TYPES[o.type].name + '」：+¥' + Math.round(o.reward).toLocaleString('en-US'));
    return { type: 'orderDone', id: o.id, name: C.ORDER_TYPES[o.type].name, reward: o.reward, data: 0 };
  }

  function orderRewardOf(o) { return o.reward > 0 ? o.reward : o.dataReward; }

  function orderInfo(st, o) {
    if (!o) return null;
    const def = C.ORDER_TYPES[o.type] || C.ORDER_TYPES.bench;
    const detail = C.ORDER_DETAILS[o.type] || C.ORDER_DETAILS.bench;
    const doing = st.active.some(x => x.id === o.id);
    const share = doing
      ? orderCompute(st) / Math.max(1, st.active.length)
      : orderPreviewShare(st);
    const eta = share > 0
      ? Math.max(1, Math.ceil(Math.max(0, doing ? o.workLeft : o.workload) / share))
      : 0;
    const clients = detail.clients;
    const client = o.newbie
      ? '公司内推 · 新人练手'
      : o.event
        ? (o.eventName || '世界事件') + ' · 紧急委托'
        : clients[(Math.max(1, o.id) - 1) % clients.length];
    const brief = o.newbie
      ? '第一张单，客户只要求把流程跑通：按脚本出结果，留下日志，别把机器弄停。'
      : o.event
        ? '世界事件带来的特殊委托，交付时间紧、报酬高，内容和常规加急单不同。'
        : detail.brief;
    const duties = o.newbie
      ? ['按客户给的脚本跑完一轮基础测试。', '记录耗时和异常，确认结果能复现。', '把结果交回订单板，完成第一次交付。']
      : o.event
        ? ['先确认客户最急的交付格式。', '只做核心部分，砍掉可以延后的步骤。', '交付后立刻回传，并说明做了哪些取舍。']
        : detail.duties.slice();
    const deliver = o.event ? ['应急结果', '取舍说明', '回执'] : detail.deliver.slice();
    return {
      id: o.id,
      type: o.type,
      typeName: def.name,
      color: def.color,
      quality: o.quality,
      qualityName: (C.ORDER_QUALITY.find(q => q.id === o.quality) || C.ORDER_QUALITY[0]).name,
      newbie: !!o.newbie,
      event: !!o.event,
      eventName: o.eventName || '',
      client: client,
      contact: o.event ? '世界事件专线 · 一次性交接' : detail.contact,
      brief: brief,
      duties: duties,
      deliver: deliver,
      check: o.event ? '特殊订单只此一张，不补单；交付后奖励自动结算。' : detail.check,
      workload: o.workload,
      workLeft: o.workLeft,
      reward: o.reward,
      dataReward: o.dataReward,
      eta: eta,
      doing: doing,
      progress: Math.max(0, Math.min(1, 1 - o.workLeft / Math.max(1, o.workload))),
    };
  }

  /* ---------------- 第 2 幕推进 ---------------- */
  function act2Tick(st, dt, ev) {
    const ts = totalStats(st);
    st.stats = serverStats(st, st.activeServer);
    st.devPoints += ts.devPerSec * dt;

    ensureSoftware(st);
    let inflow = 0;
    st.software.forEach(sw => {
      if (!sw || sw.type !== 'crawler') return;
      sw.age += dt;
      const d = C.SOFTWARE.crawler[sw.v - 1];
      const decay = Math.max(0.15, 1 - C.CONST.crawlerDecay * sw.age);
      inflow += d.rate * decay;
    });
    inflow *= crawlerMult(st) * (1 + ts.nicCrawler) * contractEco(st) * worldEventMult(st, 'crawler');
    const cap = dataCap(st);
    if (inflow > 0) st.data = Math.min(cap, st.data + inflow * dt);

    st.orderTimer -= dt;
    if (st.orderTimer <= 0) {
      st.orderTimer = orderRefreshSec(st);
      const boardCap = orderBoardCap(st);
      if (st.orderBoard.length < boardCap) st.orderBoard.push(genOrder(st));
    }

    const prog = orderProgram(st);
    const sched = schedulerOf(st);
    if (prog || sched) {
      const cands = st.orderBoard.slice().sort((a, b) => orderRewardOf(b) / b.workload - orderRewardOf(a) / a.workload);
      const cap = orderConcurrency(st);
      while (st.active.length < cap && cands.length) {
        const o = cands.shift();
        if (st.orderBoard.some(x => x.id === o.id)) acceptOrder(st, o.id);
      }
    }

    const alloc = allocationFrom(st, ts);
    st.split = { order: alloc.orderPct, train: alloc.trainPct };

    if (st.active.length && alloc.orderUsed > 0) {
      const per = alloc.orderUsed / st.active.length;
      const done = [];
      st.active.forEach(o => { o.workLeft -= per * dt; if (o.workLeft <= 0) done.push(o.id); });
      done.forEach(id => { const r = completeOrder(st, id); if (r) ev.push(r); });
    }

    // 训练：分到的算力 × 训练器效率烧 Token，受数据供给限制
    if (alloc.hasTrainer && alloc.trainUsed > 0) {
      const tokenRate = alloc.trainUsed * C.CONST.trainTokenEff * trainerEff(st) *
        trainingMult(st) * burnScale(st) * worldEventMult(st, 'train');
      const dataNeed = tokenRate * C.CONST.dataPerToken * dt;
      const produced = inflow * dt;
      const dataAvail = st.data + produced;
      let burned = burn(st, tokenRate * dt, ev);
      let dataUsed = dataNeed;
      if (dataNeed > dataAvail && dataNeed > 0) {
        const scale = dataAvail / dataNeed;
        dataUsed = dataAvail;
        if (burned > 0) {
          // 数据不够时按比例回退 Token，避免无数据照样烧
          const refund = burned * (1 - scale);
          if (!st.endless) st.token = Math.min(contractTarget(st), st.token + refund);
          st.burned -= refund;
          burned *= scale;
        }
      }
      st.data = Math.max(0, Math.min(cap, dataAvail - dataUsed));
    }

    if (modelLevel(st) >= 4 && st.aiAuto !== false) {
      st.l4Timer = (st.l4Timer == null ? C.CONST.aiL4ActEvery : st.l4Timer) - dt;
      if (st.l4Timer <= 0) {
        st.l4Timer = C.CONST.aiL4ActEvery;
        autoInstallWarehouse(st).forEach(e => ev.push(e));
        const bought = aiAutoProcure(st);
        if (bought) ev.push(bought);
      }
    }

    checkLevelUp(st, ev);
  }

  /* ---------------- 主 tick ---------------- */
  function tick(st, dt) {
    const ev = [];
    if (st.ended && st.ending !== 'sandbox') return ev;
    dt = Math.min(dt, 5);
    st.t += dt;

    const m = miningRate(st) * dt;
    if (m > 0) st.money += m;

    const auto = autoBurn(st) * dt;
    if (auto > 0) { burn(st, auto, ev); checkLevelUp(st, ev); }

    // 点击系：自动点击（受当前点击倍率影响）
    if (talentOn(st, 'clk', 3)) {
      st.clickAcc = (st.clickAcc || 0) + dt;
      const step = C.CONST.autoClickEvery;
      let fired = false;
      while (st.clickAcc >= step) {
        st.clickAcc -= step;
        const burned = burn(st, clickGain(st), ev);
        if (burned > 0) ev.push({ type: 'autoClick', gain: burned });
        fired = true;
      }
      if (fired) checkLevelUp(st, ev);
    } else if (st.clickAcc) {
      st.clickAcc = 0;
    }

    // AI 写代码：用 Token 换开发点，Token 不够时按实际燃烧比例结算
    if (st.aiCoder) {
      const rate = aiCoderRate(st);
      if (rate > 0) {
        const dev = rate * dt;
        const want = dev * C.AI_CODER.tokenPerDev * burnScale(st);
        const burned = burn(st, want, ev);
        if (burned > 0) {
          st.devPoints += dev * (burned / want);
          checkLevelUp(st, ev);
        }
      }
    }

    // 开放 API：用户提问烧 Token，按实际燃烧比例结算收入
    if (st.apiOpen === true && apiUnlocked(st)) {
      const rate = apiRate(st);
      if (rate > 0) {
        const served = rate * dt;
        const perReq = apiTokenPerReq();
        const want = served * perReq;
        const burned = burn(st, want, ev);
        if (burned > 0) {
          const actual = served * (burned / want);
          const income = actual * apiPricePerReq(st);
          st.apiRequests += actual;
          st.apiBurned += burned;
          st.apiRevenue += income;
          st.money += income;
          st.apiLogAcc = (st.apiLogAcc || 0) + dt;
          while (st.apiLogAcc >= C.API_SERVICE.logEvery) {
            st.apiLogAcc -= C.API_SERVICE.logEvery;
            pushApiQuestion(st);
          }
          checkLevelUp(st, ev);
        }
      }
    }

    if (st.downloads.length) {
      const d = st.downloads[0];
      d.remain -= dt;
      if (d.remain <= 0) {
        st.downloads.shift();
        if (d.item === 'ai') {
          st.aiTier = d.tier;
          log(st, '代理 ×' + C.AI[d.tier].count + ' 部署完成，自动烧速 ' + C.AI[d.tier].auto + '/s。');
        } else {
          st.miningTier = d.tier;
          log(st, '挖矿小程序上线：+¥' + C.MINING[d.tier].rate + '/s。');
        }
        ev.push({ type: 'download', item: d.item, tier: d.tier });
      }
    }

    const shipSpeed = Math.max(0.1, worldEventMult(st, 'delivery'));
    for (let i = st.deliveries.length - 1; i >= 0; i--) {
      const p = st.deliveries[i];
      p.remain -= dt * shipSpeed;
      if (p.remain > 0) continue;
      st.deliveries.splice(i, 1);
      const name = deliveryName(p);
      if (st.shelf.length < C.CONST.shelfMax) st.shelf.push(p);
      else st.overflow.push(p);
      log(st, '快递到了：' + name + '，在快递架等拆箱。');
      const hwDef = p.item === 'hw' ? C.HARDWARE_BY_ID[p.defId] : null;
      if (hwDef && hwDef.arch === 'h') {
        addNews(st, {
          cat: 'industry', tag: '到货', tone: 'good', source: '快递站',
          title: 'H 系列到货 · ' + hwDef.name,
          body: '训练卡已进快递架，拆箱后就能装进服务器。',
          story: newsStory('arrival', { hw: hwDef }),
        });
      }
      ev.push({ type: 'arrive', item: p.item, tier: p.tier, name: name, defId: p.defId, target: p.target });
    }

    if (st.act1Done) act2Tick(st, dt, ev);
    worldTick(st, dt, ev);
    opinionTick(st, dt);
    const end = endingChoice(st);
    if (end) ev.push(end);
    return ev;
  }

  function deliveryName(p) {
    if (p.item === 'ram') return '内存 ×' + C.RAM[p.tier].mult;
    if (p.item === 'gpu') return C.GPU.name;
    if (p.item === 'hw') {
      const d = C.HARDWARE_BY_ID[p.defId];
      return d ? d.name : '硬件';
    }
    return '快递';
  }

  /* ---------------- 商店：第一幕实体件 ---------------- */
  function orderRam(st, tier) {
    if (tier <= st.ramTier) return { ok: false, reason: '已装上更高倍率' };
    if (tier !== st.ramTier + 1) return { ok: false, reason: '先升级前一档' };
    if (st.deliveries.some(d => d.item === 'ram' && d.tier === tier)) return { ok: false, reason: '已在途' };
    const def = C.RAM[tier];
    if (st.money < def.price) return { ok: false, reason: '资金不足' };
    st.money -= def.price;
    st.deliveries.push({ uid: st.uid++, item: 'ram', tier: tier, remain: deliveryBaseSec(st) });
    if (!st.unlocked.shelf) st.unlocked.shelf = true;
    log(st, '已下单内存 ×' + def.mult + ' · ¥' + def.price.toLocaleString('en-US') + '，快递 ' + deliverySec(st) + ' 秒。');
    return { ok: true, ev: [{ type: 'order', item: 'ram', tier: tier, name: '内存 ×' + def.mult }] };
  }

  function orderGpu(st) {
    const gs = gpuState(st);
    if (gs !== 'none') return { ok: false, reason: gs === 'installed' ? '已装进 S1' : '已经下单' };
    if (st.burned < C.GPU.gate) return { ok: false, reason: 'L1 解锁 · 还差 ' + Math.ceil((C.GPU.gate - st.burned) / 10000) + ' 万 Token' };
    if (st.money < C.GPU.price) return { ok: false, reason: '资金不足' };
    st.money -= C.GPU.price;
    st.deliveries.push({ uid: st.uid++, item: 'gpu', tier: 0, remain: deliveryBaseSec(st) });
    if (!st.unlocked.shelf) st.unlocked.shelf = true;
    log(st, '已下单 RTX 3060 · ¥4,000，快递 ' + deliverySec(st) + ' 秒。');
    return { ok: true, ev: [{ type: 'order', item: 'gpu', tier: 0, name: 'RTX 3060' }] };
  }

  /* ---------------- 商店：第 2 幕硬件 ---------------- */
  function hwCount(st, defId, idx) {
    const i = idx == null ? st.activeServer : idx;
    const m = st.servers[i];
    if (!m) return 0;
    let n = m.placed.filter(p => p.defId === defId).length;
    n += st.deliveries.filter(d => d.item === 'hw' && d.defId === defId && d.target === i).length;
    n += st.shelf.filter(d => d.item === 'hw' && d.defId === defId && d.target === i).length;
    n += st.overflow.filter(d => d.item === 'hw' && d.defId === defId && d.target === i).length;
    return n;
  }

  function buyHardware(st, defId, target, qty) {
    const def = C.HARDWARE_BY_ID[defId];
    if (!def) return { ok: false, reason: '没有这件硬件' };
    if (def.special) return { ok: false, reason: '自研件不走商店' };
    const lvl = modelLevel(st);
    if (def.unlock > lvl) return { ok: false, reason: '需要 L' + def.unlock };
    if (!st.act1Done) return { ok: false, reason: '第 2 幕才能装机' };
    const idx = target == null ? st.activeServer : target;
    if (!st.servers[idx] || !st.servers[idx].owned) return { ok: false, reason: '该机位还没点亮' };
    const room = C.CONST.hwPerMachine - hwCount(st, defId, idx);
    if (room <= 0) {
      return { ok: false, reason: '每台机同型号最多 ' + C.CONST.hwPerMachine + ' 件' };
    }
    const price = hardwarePrice(st, def);
    const want = Math.max(1, Math.min(room, Math.floor(Number(qty) || 1)));
    const afford = price > 0 ? Math.floor(st.money / price) : want;
    const count = Math.min(want, afford);
    if (count <= 0) return { ok: false, reason: '资金不足' };
    const total = price * count;
    st.money -= total;
    for (let i = 0; i < count; i++) {
      st.deliveries.push({ uid: st.uid++, item: 'hw', defId: def.id, target: idx, remain: deliveryBaseSec(st) });
    }
    if (!st.unlocked.shelf) st.unlocked.shelf = true;
    log(st, '已下单 ' + def.name + (count > 1 ? ' ×' + count : '') + ' · ¥' + total.toLocaleString('en-US') + '，快递中。');
    return {
      ok: true, price: total, unitPrice: price, count: count,
      ev: [{ type: 'hwOrder', defId: def.id, name: def.name, target: idx, count: count }],
    };
  }

  function buyServer(st, idx) {
    const srv = C.SERVERS[idx];
    if (!srv) return { ok: false, reason: '没有这个机位' };
    if (idx === 0) return { ok: false, reason: 'S1 已在第 2 幕点亮' };
    if (!st.act1Done) return { ok: false, reason: '第 2 幕才能开新机位' };
    const m = st.servers[idx];
    if (m.owned) return { ok: false, reason: '已拥有' };
    const lvl = modelLevel(st);
    if (srv.unlock > lvl) return { ok: false, reason: '需要 L' + srv.unlock };
    if (st.money < srv.price) return { ok: false, reason: '资金不足 · 还差 ¥' + Math.ceil(srv.price - st.money).toLocaleString('en-US') };
    st.money -= srv.price;
    m.owned = true;
    st.activeServer = idx;
    log(st, '新机位就位：' + srv.name + ' · ¥' + srv.price.toLocaleString('en-US') + '。');
    return { ok: true, ev: [{ type: 'serverBought', idx: idx, name: srv.name }] };
  }

  function selectServer(st, idx) {
    if (!st.servers[idx] || !st.servers[idx].owned) return false;
    st.activeServer = idx;
    st.stats = serverStats(st, idx);
    return true;
  }

  /* ---------------- 装机：放置 / 仓库 / 回收 ---------------- */
  function machineOf(st, machineIdx) {
    const i = (machineIdx == null) ? st.activeServer : machineIdx;
    return st.servers[i] || null;
  }

  function canPlace(st, defId, x, y, machineIdx) {
    const m = machineOf(st, machineIdx);
    const def = C.HARDWARE_BY_ID[defId];
    if (!m || !m.owned || !def) return false;
    if (m.placed.filter(p => p.defId === defId).length >= C.CONST.hwPerMachine) return false;
    const w = def.size[0], h = def.size[1];
    if (x < 0 || y < 0 || x + w > m.gridW || y + h > m.gridH) return false;
    for (const p of m.placed) {
      const d = C.HARDWARE_BY_ID[p.defId];
      if (!d) continue;
      if (x < p.x + d.size[0] && p.x < x + w && y < p.y + d.size[1] && p.y < y + h) return false;
    }
    if (def.type === 'psu' && (y + h) !== m.gridH) return false;
    return true;
  }

  function place(st, defId, x, y, machineIdx) {
    const m = machineOf(st, machineIdx);
    if (!m || !canPlace(st, defId, x, y, machineIdx)) return false;
    m.placed.push({ uid: st.uid++, defId: defId, x: x, y: y });
    return true;
  }

  // 从机箱拿起（不落仓库），供拖拽预览
  function lift(st, uid, machineIdx) {
    const m = machineOf(st, machineIdx);
    if (!m) return null;
    const i = m.placed.findIndex(p => p.uid === uid);
    if (i === -1) return null;
    return m.placed.splice(i, 1)[0];
  }

  function restoreLifted(st, item, machineIdx) {
    const m = machineOf(st, machineIdx);
    if (!m || !item) return false;
    m.placed.push(item);
    return true;
  }

  function toWarehouse(st, uid, machineIdx) {
    const m = machineOf(st, machineIdx);
    if (!m) return false;
    const i = m.placed.findIndex(p => p.uid === uid);
    if (i === -1) return false;
    const p = m.placed.splice(i, 1)[0];
    st.warehouse.push({ uid: p.uid, defId: p.defId });
    return true;
  }

  function warehouseTake(st, uid) {
    const i = st.warehouse.findIndex(w => w.uid === uid);
    if (i === -1) return null;
    return st.warehouse.splice(i, 1)[0];
  }

  function warehouseReturn(st, item) {
    if (!item) return false;
    st.warehouse.push({ uid: item.uid, defId: item.defId });
    return true;
  }

  function sellHardware(st, uid, machineIdx) {
    const m = machineOf(st, machineIdx);
    if (!m) return { ok: false, reason: '机位不存在' };
    let list = m.placed;
    let i = list.findIndex(p => p.uid === uid);
    if (i === -1) { list = st.warehouse; i = list.findIndex(w => w.uid === uid); }
    if (i === -1) return { ok: false, reason: '找不到这件硬件' };
    const item = list[i];
    const def = C.HARDWARE_BY_ID[item.defId];
    if (def && def.special) return { ok: false, reason: '自研 NPU 不可回收' };
    list.splice(i, 1);
    const refund = Math.round((def ? def.price : 0) * C.CONST.sellRatio);
    st.money += refund;
    log(st, '回收 ' + (def ? def.name : '硬件') + '：+¥' + refund.toLocaleString('en-US'));
    return { ok: true, refund: refund };
  }

  function findSpot(st, defId, machineIdx) {
    const m = machineOf(st, machineIdx);
    const def = C.HARDWARE_BY_ID[defId];
    if (!m || !def) return null;
    for (let y = 0; y <= m.gridH - def.size[1]; y++)
      for (let x = 0; x <= m.gridW - def.size[0]; x++)
        if (canPlace(st, defId, x, y, machineIdx)) return { x: x, y: y };
    return null;
  }

  /* ---------------- L4：AI 自主装机 ---------------- */
  function freeCells(m) {
    let used = 0;
    m.placed.forEach(p => {
      const d = C.HARDWARE_BY_ID[p.defId];
      if (d) used += d.size[0] * d.size[1];
    });
    return m.gridW * m.gridH - used;
  }

  // 把仓库里的硬件自动塞进有空位的机箱（L4 每周期一次）
  function autoInstallWarehouse(st) {
    const ev = [];
    st.servers.forEach((m, idx) => {
      if (!m.owned) return;
      let moved = true;
      while (moved) {
        moved = false;
        for (let i = 0; i < st.warehouse.length; i++) {
          const w = st.warehouse[i];
          const pos = findSpot(st, w.defId, idx);
          if (!pos) continue;
          m.placed.push({ uid: w.uid, defId: w.defId, x: pos.x, y: pos.y });
          st.warehouse.splice(i, 1);
          moved = true;
          ev.push({ type: 'aiInstall', defId: w.defId, target: idx });
          break;
        }
      }
    });
    return ev;
  }

  // 给一台机挑最该补的件：按瓶颈严重度 + 空位评分
  function machineNeed(st, idx) {
    const m = st.servers[idx];
    if (!m || !m.owned) return null;
    const free = freeCells(m);
    if (free < 1) return null;
    const s = machineStats(m, st);
    const hasCompute = m.placed.some(p => {
      const d = C.HARDWARE_BY_ID[p.defId];
      return d && (d.type === 'gpu' || d.type === 'npu' || d.type === 'cpu');
    });
    const ratios = [
      s.psuWatt > 0 ? s.powerCoef : 0,
      s.coolingCoef,
      s.sumCompute > 0 ? Math.min(1, s.sumBandwidth / s.sumCompute) : 0,
    ];
    const worst = hasCompute ? Math.min.apply(null, ratios) : 0;
    return { idx, score: (1 - worst) + free * 0.005 + (hasCompute ? 0 : 0.5), free, s, hasCompute };
  }

  function candidateFor(st, type, idx, cash) {
    const m = st.servers[idx];
    const free = freeCells(m);
    const lvl = modelLevel(st);
    return C.HARDWARE
      .filter(d => d.type === type && !d.special && d.unlock <= lvl &&
        hardwarePrice(st, d) <= cash &&
        d.size[0] * d.size[1] <= free &&
        hwCount(st, d.id, idx) < C.CONST.hwPerMachine &&
        !!findSpot(st, d.id, idx))
      .sort((a, b) => hardwarePrice(st, b) - hardwarePrice(st, a))[0] || null;
  }

  function aiAutoProcure(st) {
    const cash = st.money - C.CONST.keepCash;
    if (cash <= 0) return null;
    let best = null;
    st.servers.forEach((m, i) => {
      const n = machineNeed(st, i);
      if (n && (!best || n.score > best.score)) best = n;
    });
    if (!best) return null;

    let type = 'gpu';
    if (best.hasCompute) {
      const s = best.s;
      if (s.psuWatt <= 0 || s.powerCoef < 0.99) type = 'psu';
      else if (s.sumBandwidth < Math.max(1, s.sumCompute * 0.99)) type = 'ram';
      else if (s.coolingCoef < 0.99) type = 'cooler';
    }
    let pick = candidateFor(st, type, best.idx, cash);
    const order = ['gpu', 'ram', 'fan', 'psu', 'cpu', 'ssd', 'nic'];
    for (let i = 0; !pick && i < order.length; i++) {
      if (order[i] === type) continue;
      pick = candidateFor(st, order[i], best.idx, cash);
    }
    if (!pick) return null;
    const price = hardwarePrice(st, pick);
    st.money -= price;
    const pos = findSpot(st, pick.id, best.idx);
    const m = st.servers[best.idx];
    if (pos) m.placed.push({ uid: st.uid++, defId: pick.id, x: pos.x, y: pos.y });
    else st.warehouse.push({ uid: st.uid++, defId: pick.id });
    log(st, 'AI 自动购入并安装「' + pick.name + '」· S' + (best.idx + 1) + '。');
    return { type: 'aiBuy', defId: pick.id, name: pick.name, target: best.idx, price: price };
  }

  /* ---------------- 自研 NPU 流片 ---------------- */
  function npuCount(st) { return st.npuMade || 0; }

  function streamNpu(st) {
    const lvl = modelLevel(st);
    if (lvl < 4) return { ok: false, reason: '需要 L4 · 还差 ' + Math.ceil((C.MODEL_LEVELS[4].at - st.burned)).toLocaleString('en-US') + ' Token' };
    if (npuCount(st) >= C.CONST.npuMax) return { ok: false, reason: '流片已达上限（' + C.CONST.npuMax + ' 块）' };
    if (st.money < C.CONST.npuStreamCost) {
      return { ok: false, reason: '资金不足 · 还差 ¥' + Math.ceil(C.CONST.npuStreamCost - st.money).toLocaleString('en-US') };
    }
    if (st.data < C.CONST.npuStreamData) {
      return { ok: false, reason: '数据不足 · 还差 ' + (C.CONST.npuStreamData - st.data).toFixed(1) + ' GB' };
    }
    if (!ownedServers(st).length) return { ok: false, reason: '先点亮一台机位' };
    st.money -= C.CONST.npuStreamCost;
    st.data -= C.CONST.npuStreamData;
    st.npuMade = npuCount(st) + 1;
    st.warehouse.push({ uid: st.uid++, defId: 'npu1' });
    log(st, '流片成功：自研 NPU-1 已进公共仓库。');
    return {
      ok: true,
      ev: [{ type: 'npuMade', made: st.npuMade }],
    };
  }

  /* ---------------- 终局三选一 ---------------- */
  function endingChoice(st) {
    if (st.endless || st.token > 0 || st.ended) return null;
    st.token = 0;
    st.ended = true;
    st.ending = 'choice';
    log(st, contractIndex(st) >= 1
      ? '【' + currentContract(st).def.name + '】Token 已烧尽，合同只能续签。'
      : '【' + currentContract(st).def.name + '】Token 已烧尽。三选一摆在桌上。');
    return { type: 'ending' };
  }

  function chooseEnding(st, id) {
    if (st.ending !== 'choice') return { ok: false, reason: '现在没有要做的选择' };
    const def = C.ENDINGS.find(x => x.id === id);
    if (!def) return { ok: false, reason: '没有这个结局' };
    if (contractIndex(st) >= 1 && id !== 'sandbox') {
      return { ok: false, reason: '这份协议只能续签' };
    }
    if (id === 'endless') {
      if (nextContract(st)) return { ok: false, reason: '还能续签更大的协议' };
      st.endless = true;
      st.ended = false;
      st.ending = 'endless';
      st.token = 0;
      log(st, '目标已解除，进入无尽运行：之后只累计 Token 消耗。');
      return {
        ok: true, id: id,
        ev: [{ type: 'endingChosen', id: id }, { type: 'endlessStart', burned: st.burned }],
      };
    }
    if (id === 'sandbox') {
      const nc = nextContract(st);
      const tgt = nc ? nc.def : currentContract(st).def;
      const index = nc ? nc.index : contractIndex(st);
      st.contractBase = st.burned;
      st.contract = index;
      st.token = tgt.target;
      st.ended = false;
      st.ending = 'sandbox';
      st.orderBoard = [];
      st.active = [];
      st.worldEvent = null;
      st.worldTimer = C.CONST.worldFirstDelay;
      st.worldRecent = [];
      st.worldNeg = 0;
      st.eventRev = (st.eventRev || 0) + 1;
      seedOrders(st);
      log(st, '续签：' + tgt.name + ' 已生效，新标的 ' + tgt.target.toLocaleString('en-US') + ' Token。');
      addNews(st, {
        cat: 'notice', tag: '公告', tone: 'good', source: '协议中心',
        title: '续签 · ' + tgt.name,
        body: nc
          ? '新标的 ' + tgt.target.toLocaleString('en-US') + ' Token。软件槽 +1，续签天赋点到账。'
          : '新标的 ' + tgt.target.toLocaleString('en-US') + ' Token。全部进度保留，再跑一轮。',
        story: newsStory('renew', { def: tgt, repeat: !nc }),
      });
      return {
        ok: true, id: id, contract: index,
        ev: [{ type: 'endingChosen', id: id }, {
          type: 'contractRenew', index: index, id: tgt.id,
          name: tgt.name, short: tgt.short, target: tgt.target,
        }],
      };
    }
    st.ended = true;
    st.ending = id;
    log(st, '终局 · ' + def.subtitle + '：' + def.text);
    return { ok: true, id: id, ev: [{ type: 'endingChosen', id: id }] };
  }

  /* ---------------- 应用市场：数字件 ---------------- */
  function orderAi(st) {
    const next = st.aiTier + 1;
    if (next >= C.AI.length) return { ok: false, reason: '已是最新版本' };
    if (st.downloads.some(d => d.item === 'ai')) return { ok: false, reason: '代理部署中' };
    const def = C.AI[next];
    if (st.money < def.price) return { ok: false, reason: '资金不足' };
    st.money -= def.price;
    st.downloads.push({ item: 'ai', tier: next, remain: def.dl, dur: def.dl });
    log(st, '开始部署推理代理 ×' + def.count + ' · ¥' + def.price.toLocaleString('en-US') + '。');
    return { ok: true, ev: [{ type: 'downloadStart', item: 'ai', tier: next }] };
  }

  function orderMining(st) {
    const next = st.miningTier + 1;
    if (next >= C.MINING.length) return { ok: false, reason: '已是最高档' };
    if (st.downloads.some(d => d.item === 'mining')) return { ok: false, reason: '下载中' };
    const def = C.MINING[next];
    if (st.money < def.price) return { ok: false, reason: '资金不足' };
    st.money -= def.price;
    st.downloads.push({ item: 'mining', tier: next, remain: def.dl, dur: def.dl });
    log(st, '开始下载挖矿小程序 · ¥' + def.price.toLocaleString('en-US') + '。');
    return { ok: true, ev: [{ type: 'downloadStart', item: 'mining', tier: next }] };
  }

  /* ---------------- S1 套件 / 拆箱 ---------------- */
  function seedStarter(st) {
    if (st.starterSeeded) return;
    const m = st.servers[0];
    m.owned = true;
    C.STARTER_LAYOUT.forEach(([defId, x, y]) => {
      if (canPlace(st, defId, x, y, 0)) place(st, defId, x, y, 0);
    });
    st.starterSeeded = true;
    st.activeServer = 0;
    st.stats = serverStats(st, 0);
  }

  function unpack(st) {
    if (!st.shelf.length) return { ok: false, reason: '快递架上没有箱子' };
    const p = st.shelf.shift();
    if (st.overflow.length) st.shelf.push(st.overflow.shift());
    const ev = [{ type: 'unpack', item: p.item, tier: p.tier }];
    if (p.item === 'ram') {
      st.ramTier = p.tier;
      log(st, '拆箱：内存 ×' + C.RAM[p.tier].mult + ' 已插上，点击倍率 ×' + C.RAM[p.tier].mult + '。');
      ev.push({ type: 'ramInstalled', tier: p.tier });
    } else if (p.item === 'gpu') {
      st.act1Done = true;
      st.act = 2;
      st.unlocked.s1 = true;
      st.unlocked.orders = true;
      st.unlocked.slider = true;
      log(st, '拆箱：RTX 3060 插不进老电脑——S1 机位就位。第 2 幕开始。');
      seedStarter(st);
      seedOrders(st);
      log(st, '订单板点亮：新手单已钉上，接一单试试。');
      ev.push({ type: 'act1clear' });
    } else {
      st.warehouse.push({ uid: p.uid != null ? p.uid : st.uid++, defId: p.defId });
      const def = C.HARDWARE_BY_ID[p.defId];
      log(st, '拆箱：' + (def ? def.name : '硬件') + ' 已放进公共仓库，可拖进任意机箱。');
      ev.push({ type: 'hwUnpack', defId: p.defId, name: def ? def.name : '硬件' });
    }
    return { ok: true, pkg: p, ev: ev };
  }

  /* ---------------- 存档 ---------------- */
  function toJSON(st) {
    const copy = {};
    Object.keys(st).forEach(k => { copy[k] = st[k]; });
    return JSON.stringify(copy);
  }

  function normalizeServers(st, incoming) {
    const shared = Array.isArray(st.warehouse) ? st.warehouse : [];
    const seen = new Set();
    st.warehouse = [];
    const addShared = p => {
      if (!p || !C.HARDWARE_BY_ID[p.defId]) return;
      const uid = p.uid != null ? p.uid : st.uid++;
      if (seen.has(uid)) return;
      seen.add(uid);
      st.warehouse.push({ uid: uid, defId: p.defId });
    };
    shared.forEach(addShared);
    st.servers = [0, 1, 2, 3, 4, 5].map(i => {
      const base = newServer(i);
      const src = Array.isArray(incoming) ? incoming[i] : null;
      if (!src) return base;
      const m = {
        owned: !!src.owned,
        caseTier: base.caseTier,
        gridW: base.gridW,
        gridH: base.gridH,
        placed: Array.isArray(src.placed) ? src.placed : [],
      };
      m.placed = m.placed.filter(p => p && C.HARDWARE_BY_ID[p.defId]);
      (Array.isArray(src.warehouse) ? src.warehouse : []).forEach(addShared);
      return m;
    });
  }

  function normalizeRig(st, source) {
    const rig = emptyRig();
    const src = source && typeof source === 'object' ? source : {};
    const used = new Set();
    st.warehouse.forEach(w => used.add(w.uid));
    st.servers.forEach(m => m.placed.forEach(p => used.add(p.uid)));
    let maxUid = 0;
    used.forEach(uid => { if (isFinite(uid)) maxUid = Math.max(maxUid, uid); });

    const toWarehouse = part => {
      if (!part || !C.HARDWARE_BY_ID[part.defId]) return;
      let uid = Number(part.uid);
      if (!isFinite(uid) || used.has(uid)) uid = Math.max(maxUid, Number(st.uid) || 0) + 1;
      used.add(uid);
      maxUid = Math.max(maxUid, uid);
      st.warehouse.push({ uid: uid, defId: part.defId });
    };
    const take = (part, type) => {
      if (!part) return null;
      const def = C.HARDWARE_BY_ID[part.defId];
      if (!def || !rigAllows(def) || def.type !== type) {
        toWarehouse(part);
        return null;
      }
      let uid = Number(part.uid);
      if (!isFinite(uid) || used.has(uid)) uid = Math.max(maxUid, Number(st.uid) || 0) + 1;
      used.add(uid);
      maxUid = Math.max(maxUid, uid);
      return { uid: uid, defId: part.defId };
    };

    if (st.act1Done) {
      rig.gpu = take(src.gpu, 'gpu');
      rig.cpu = take(src.cpu, 'cpu');
      rig.ram[0] = take(Array.isArray(src.ram) ? src.ram[0] : null, 'ram');
      rig.ram[1] = take(Array.isArray(src.ram) ? src.ram[1] : null, 'ram');
    } else {
      ['gpu', 'cpu'].forEach(k => toWarehouse(src[k]));
      if (Array.isArray(src.ram)) src.ram.forEach(toWarehouse);
    }
    st.rig = rig;
    st.uid = Math.max(Number(st.uid) || 1, maxUid + 1);
  }

  const HW_ID_MIGRATION = { gpu6090: 'gpu_h100', gpu7090: 'gpu_h200' };
  function migrateHardwarePart(p) {
    if (p && typeof p === 'object' && HW_ID_MIGRATION[p.defId]) p.defId = HW_ID_MIGRATION[p.defId];
  }
  function migrateHardwareIds(s) {
    ['warehouse', 'shelf', 'overflow', 'deliveries'].forEach(k => {
      if (Array.isArray(s[k])) s[k].forEach(migrateHardwarePart);
    });
    if (Array.isArray(s.servers)) {
      s.servers.forEach(m => {
        if (!m || typeof m !== 'object') return;
        ['placed', 'warehouse'].forEach(k => {
          if (Array.isArray(m[k])) m[k].forEach(migrateHardwarePart);
        });
      });
    }
    if (s.rig && typeof s.rig === 'object') {
      migrateHardwarePart(s.rig.gpu);
      migrateHardwarePart(s.rig.cpu);
      if (Array.isArray(s.rig.ram)) s.rig.ram.forEach(migrateHardwarePart);
    }
  }

  function softwareEstimateSpent(type, v) {
    let total = writeCost(type) || 0;
    for (let i = 1; i < v; i++) total += upgradeCost(type, i) || 0;
    return total;
  }
  function normalizeSoftware(st) {
    if (!Array.isArray(st.software)) st.software = [];
    st.software = st.software.map(sw => {
      if (!sw || typeof sw !== 'object') return null;
      const defs = C.SOFTWARE[sw.type];
      if (!defs) return null;
      const v = Math.max(1, Math.min(defs.length, Number(sw.v) || 1));
      return {
        type: sw.type,
        v: v,
        age: isFinite(sw.age) ? Math.max(0, Number(sw.age)) : 0,
        spent: isFinite(sw.spent) ? Math.max(0, Number(sw.spent)) : softwareEstimateSpent(sw.type, v),
      };
    });
    ensureSoftware(st);
  }

  function fromJSON(raw) {
    let s = null;
    try { s = JSON.parse(raw); } catch (e) { return null; }
    if (!s || s.v !== 3) return null;
    migrateHardwareIds(s);
    const st = newState();
    Object.keys(st).forEach(k => { if (s[k] !== undefined && k !== 'servers') st[k] = s[k]; });
    st.unlocked = Object.assign(newState().unlocked, s.unlocked || {});

    const rawNews = Array.isArray(s.news) ? s.news : null;
    const newsCats = C.NEWS_CATEGORIES.map(c => c.id);
    if (rawNews && rawNews.length) {
      const seenNews = new Set();
      st.news = rawNews.map(x => {
        if (!x || typeof x !== 'object') return null;
        const id = Number(x.id) | 0;
        if (id <= 0 || seenNews.has(id)) return null;
        seenNews.add(id);
        return {
          id: id,
          at: isFinite(x.at) ? Math.max(0, Math.round(x.at)) : 0,
          cat: newsCats.indexOf(x.cat) >= 0 && x.cat !== 'all' ? x.cat : 'notice',
          tag: typeof x.tag === 'string' ? x.tag.slice(0, 8) : '快讯',
          tone: x.tone === 'good' || x.tone === 'bad' ? x.tone : 'neutral',
          source: typeof x.source === 'string' ? x.source.slice(0, 12) : '机房日报',
          title: typeof x.title === 'string' ? x.title.slice(0, 60) : '机房快讯',
          body: typeof x.body === 'string' ? x.body.slice(0, 180) : '',
          eventId: typeof x.eventId === 'string' ? x.eventId : null,
          eventRev: isFinite(x.eventRev) ? Math.max(0, x.eventRev | 0) : 0,
          fx: typeof x.fx === 'string' ? x.fx.slice(0, 120) : '',
          story: cleanStory(x.story),
        };
      }).filter(Boolean).sort((a, b) => b.id - a.id).slice(0, 60);
      const maxNews = st.news.reduce((m, n) => Math.max(m, n.id), 0);
      st.newsSeq = Math.max(1, maxNews, Number(s.newsSeq) || 0);
      st.newsRead = Math.max(0, Math.min(st.newsSeq, Number(s.newsRead) || 0));
    } else {
      st.news = [];
      st.newsSeq = 0;
      st.newsRead = 0;
      addNews(st, {
        cat: 'notice', tag: '接入', tone: 'neutral', source: '机房日报',
        title: '机房日报已接入旧存档',
        body: '从现在起，世界事件、续签、模型升级和补给都会记在这里。',
        story: newsStory('migrate'),
      });
    }

    // M3 字段与旧档兼容（含续签天赋）
    const tal = s.talents || {};
    st.talents = {};
    Object.keys(C.TALENTS).forEach(key => {
      const max = C.TALENTS[key].length;
      st.talents[key] = Math.max(0, Math.min(max, Number(tal[key]) || 0));
    });
    let spent = talentSpent(st);
    const earned = talentPoints(st);
    if (spent > earned) {
      let over = spent - earned;
      ['levent', 'lburn', 'leco', 'lpow', 'clk', 'eco', 'sw', 'pow'].forEach(k => {
        while (over > 0 && st.talents[k] > 0) { st.talents[k]--; over--; }
      });
    }
    st.npuMade = Math.max(0, Math.min(C.CONST.npuMax, Number(s.npuMade) || 0));
    st.aiAuto = s.aiAuto !== false;
    st.aiCoder = s.aiCoder === true;
    st.l4Timer = isFinite(s.l4Timer) ? s.l4Timer : C.CONST.aiL4ActEvery;
    st.apiTier = Math.max(1, Math.min(C.API_SERVICE.tiers.length, Number(s.apiTier) || 1));
    let apiMaxTier = 1;
    C.API_SERVICE.tiers.forEach((t, i) => { if (modelLevel(st) >= t.level) apiMaxTier = i + 1; });
    st.apiTier = Math.min(st.apiTier, apiMaxTier);
    st.apiOpen = s.apiOpen === true && apiUnlocked(st);
    st.apiRequests = isFinite(s.apiRequests) ? Math.max(0, s.apiRequests) : 0;
    st.apiRevenue = isFinite(s.apiRevenue) ? Math.max(0, s.apiRevenue) : 0;
    st.apiBurned = isFinite(s.apiBurned) ? Math.max(0, s.apiBurned) : 0;
    st.apiLogAcc = isFinite(s.apiLogAcc) ? Math.max(0, Math.min(C.API_SERVICE.logEvery, s.apiLogAcc)) : 0;
    st.apiDb = Array.isArray(s.apiDb)
      ? s.apiDb.filter(x => x && typeof x.q === 'string').slice(0, C.API_SERVICE.dbMax)
      : [];
    const apiMaxId = st.apiDb.reduce((mx, x) => Math.max(mx, Number(x.id) || 0), 0);
    st.apiDbSeq = Math.max(isFinite(s.apiDbSeq) ? Math.max(0, s.apiDbSeq) : 0, apiMaxId, st.apiDb.length);
    const ob = s.onboard || {};
    st.onboard = { tap: !!ob.tap, delivery: !!ob.delivery, talent: !!ob.talent };
    if (st.act1Done) { st.onboard.tap = true; st.onboard.delivery = true; }
    const nt = s.notes && typeof s.notes === 'object' ? s.notes : null;
    st.notes = {
      act2: nt ? nt.act2 === true : st.act1Done,
      api: nt ? nt.api === true : apiUnlocked(st),
    };
    st.storySeen = s.storySeen === true;
    const giftIds = new Set(C.GIFTS.map(g => g.id));
    st.gifts = Array.isArray(s.gifts) ? s.gifts.filter(id => giftIds.has(id)) : [];
    st.endless = s.endless === true || st.ending === 'endless';
    if (['choice', 'ascend', 'coexist', 'sandbox', 'endless'].indexOf(st.ending) === -1) st.ending = null;
    st.ended = st.ending === 'choice' || st.ending === 'ascend' || st.ending === 'coexist';

    // 续签协议 / 世界事件归一化（旧档无这些字段时保持默认）
    st.contract = Math.max(0, Math.min(C.CONTRACTS.length - 1,
      isFinite(s.contract) ? (s.contract | 0) : 0));
    st.contractBase = isFinite(s.contractBase) ? Math.max(0, Number(s.contractBase)) : 0;
    if (st.contract === 0) st.contractBase = 0;
    else {
      if (st.contractBase <= 0) st.contractBase = Math.max(0, st.burned);
      if (st.contractBase > st.burned) st.contractBase = st.burned;
    }
    if (st.endless) {
      st.contract = C.CONTRACTS.length - 1;
      st.ending = 'endless';
      st.ended = false;
      st.token = 0;
    }
    const we = s.worldEvent;
    const weDef = we && C.WORLD_EVENT_BY_ID[we.id];
    if (weDef && isFinite(we.remain) && we.remain > 0) {
      const span = Array.isArray(weDef.duration) ? weDef.duration[1] : 45;
      st.worldEvent = {
        id: weDef.id,
        remain: Math.min(span, Math.max(0.5, we.remain)),
        duration: isFinite(we.duration) && we.duration > 0 ? we.duration : span,
      };
    } else {
      st.worldEvent = null;
    }
    st.worldTimer = isFinite(s.worldTimer) ? Math.max(0, s.worldTimer) : C.CONST.worldFirstDelay;
    st.worldRecent = Array.isArray(s.worldRecent)
      ? s.worldRecent.filter(id => C.WORLD_EVENT_BY_ID[id]).slice(-C.CONST.worldRecentMax)
      : [];
    st.worldNeg = isFinite(s.worldNeg) ? Math.max(0, s.worldNeg | 0) : 0;
    st.eventRev = isFinite(s.eventRev) ? Math.max(0, s.eventRev | 0) : 0;

    ['downloads', 'deliveries', 'shelf', 'overflow', 'claimed', 'logs', 'orderBoard', 'active', 'software'].forEach(k => {
      if (!Array.isArray(st[k])) st[k] = [];
    });
    normalizeSoftware(st);
    normalizeServers(st, s.servers);
    normalizeRig(st, s.rig);

    // 旧沙盒档：token 已归零但还没续签，直接进入下一份协议
    if (!st.endless && st.ending === 'sandbox' && st.token <= 0) {
      const nc = nextContract(st);
      if (nc) {
        st.contractBase = st.burned;
        st.contract = nc.index;
        st.token = nc.def.target;
        st.ended = false;
        st.orderBoard = [];
        st.active = [];
        st.worldEvent = null;
        st.worldTimer = C.CONST.worldFirstDelay;
        st.worldRecent = [];
        st.worldNeg = 0;
        st.eventRev = (st.eventRev || 0) + 1;
        if (st.act1Done) seedOrders(st);
      } else {
        const con = currentContract(st);
        st.contractBase = st.burned;
        st.token = con.def.target;
        st.ended = false;
        st.orderBoard = [];
        st.active = [];
        st.worldEvent = null;
        st.worldTimer = C.CONST.worldFirstDelay;
        st.worldRecent = [];
        st.worldNeg = 0;
        st.eventRev = (st.eventRev || 0) + 1;
        st.ending = 'sandbox';
        if (st.act1Done) seedOrders(st);
      }
    }

    // 旧第 2 幕存档：S1 点亮并补套件
    if (st.act1Done) {
      st.servers[0].owned = true;
      const s1 = st.servers[0];
      if (!st.starterSeeded && !s1.placed.length) seedStarter(st);
      st.starterSeeded = true;
      if (st.orderSeq === 0) seedOrders(st);
    }
    if (!st.servers[st.activeServer] || !st.servers[st.activeServer].owned) {
      const own = ownedServers(st);
      st.activeServer = own.length ? own[0] : 0;
    }
    if (!isFinite(st.orderShare)) st.orderShare = 0.6;
    st.orderShare = Math.max(0, Math.min(1, st.orderShare));
    st.aiName = sanitizeAiName(s.aiName);
    st.aiNamed = s.aiNamed === true || !!st.aiName;
    normalizeOpinion(st, s.opinion);
    st.lastLevel = modelLevel(st);
    if (st.act1Done) st.stats = serverStats(st, st.activeServer);
    return st;
  }

  function save(st) {
    try { localStorage.setItem(C.CONST.saveKey, toJSON(st)); return true; }
    catch (e) { return false; }
  }
  function load() {
    try {
      const raw = localStorage.getItem(C.CONST.saveKey);
      return raw ? fromJSON(raw) : null;
    } catch (e) { return null; }
  }
  function clearSave() {
    try { localStorage.removeItem(C.CONST.saveKey); return true; }
    catch (e) { return false; }
  }

  const Sim = {
    newState, tick, click,
    orderRam, orderGpu, orderAi, orderMining, unpack,
    aiCount, ramMult, clickGain, autoClickRate, autoBurn, miningRate,
    talentPoints, nextTalentAt, nextTalentInfo, talentTotal, lateTalentPoints, lateTalentProgress,
    talentSpent, talentAvailable, talentLvl, talentOn,
    onboardPending, onboardMark,
    addNews, newsUnread, markNewsRead, newsDetail,
    aiName, setAiName, sanitizeAiName,
    opinionBand, opinionScore, opinionTarget, opinionStars, opinionCounts,
    opinionUnread, markOpinionRead, opinionDemandMult,
    addOpinionReview, opinionLevelBurst, opinionEventBurst,
    spendTalent, hardwarePrice, deliverySec, gpuState, deliveryName,
    modelLevel, modelDef, levelName, chapter, giftById, migrateGifts,
    rigPartClick, ensureRig, rigSlots, rigSlotOf, rigClickBonus, rigCount, rigAllows, rigInstall, rigRemove,

    /* 软件 / 订单 */
    softwareSlots, effectiveSoftware, optimizerMult, orderProgram, orderConcurrency,
    orderSlotCompute, schedulerOf, pipelineOf, gatewayOf, crawlerDecayRate, trainingMult,
    trainerEff, hasTrainer, crawlerRate, devRate, aiCoderRate,
    apiUnlocked, apiTierDef, apiCapacity, apiDemand, apiRate,
    apiTokenPerReq, apiPricePerReq, apiTokenRate, apiRevenueRate, upgradeApi,
    code, writeSoftware, upgradeSoftware, removeSoftware, writeCost, upgradeCost, upgradeCostFor,
    genOrder, acceptOrder, completeOrder, seedOrders, crawlerMult,
    orderBoardCap, orderRefreshSec, orderInfo,

    /* 续签协议 / 世界事件 */
    currentContract, nextContract, contractTarget, contractEco, contractBurned,
    contractProgress, contractLabel, burnScale,
    activeWorldEvent, worldEventMult, worldEventAdd, worldTick, startWorldEvent,
    worldNearPool,

    /* 机位 / 算力 / 滑尺 */
    serverStats, machineStats, totalStats, totalCompute, ownedServers,
    allocation, orderCompute, orderPreviewShare, trainTokenRate, dataCap,
    buyServer, selectServer,

    /* 装机 */
    adjacent, canPlace, place, lift, restoreLifted, toWarehouse, warehouseTake, warehouseReturn,
    sellHardware, findSpot, buyHardware, hwCount, seedStarter,
    aiAutoProcure, autoInstallWarehouse, machineNeed, freeCells,

    /* 后期与终局 */
    npuCount, streamNpu, endingChoice, chooseEnding,

    toJSON, fromJSON, save, load, clearSave,
    log,
  };
  root.Sim = Sim;
  if (typeof module !== 'undefined' && module.exports) module.exports = Sim;
})(typeof window !== 'undefined' ? window : globalThis);