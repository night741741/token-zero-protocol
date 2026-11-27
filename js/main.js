/* =============================================================
 * main.js · 第一幕主循环：读档、tick、点击、买卖、拆箱、
 * 里程碑、揭幕链、存档、适配。
 * ============================================================= */
(function (root) {
  'use strict';
  const C = root.CONTENT;
  const Sim = root.Sim;
  const Scene = root.Scene;
  const Audio = root.Audio;
  const Hub = root.Hub;
  const Rig = root.Rig;
  const Delivery = root.Delivery;
  const PaperModal = root.PaperModal;
  const UI = root.UI;
  const Stage = root.Stage;
  const Drag = root.Drag;
  const $ = id => document.getElementById(id);
  const fmt = n => Math.max(0, Math.round(n)).toLocaleString('en-US');
  const tokenText = n => {
    if (n >= 1000000000000) return (n / 1000000000000) + ' 万亿';
    if (n >= 100000000) {
      const v = n / 100000000;
      return (Number.isInteger(v) ? v : v.toFixed(1)) + ' 亿';
    }
    return fmt(n);
  };
  const stageEl = $('stage');
  const camEl = $('cam');

  let st = null;
  let raf = 0, lastTs = 0;
  let uiAcc = 0, slowAcc = 0, saveAcc = 0;
  let resetArm = 0;
  let restarting = false;
  let coachQueue = [], coachCur = null, coachTimer = 0, tapSinceCoach = 0;

  function syncCounter(doFlip) {
    if (!st) return;
    if (st.endless) Scene.setConsumed(st.burned, !!doFlip);
    else Scene.setRemaining(st.token, !!doFlip, Sim.contractTarget(st));
  }

  /* ---------------- 提示文案 ---------------- */
  function buildTips() {
    return {
      counter: () => {
        if (st.endless) {
          return {
            name: '清零计数板', cat: '楼顶 · 翻牌板',
            lines: [
              '累计消耗 ' + tokenText(st.burned) + ' Token',
              '无尽运行 · 目标已解除',
              '之后只记录累计 Token 消耗',
            ],
          };
        }
        const cp = Sim.contractProgress(st);
        return {
          name: '清零计数板', cat: '楼顶 · 翻牌板',
          lines: [
            '剩余 ' + tokenText(st.token) + ' Token',
            '本份已烧 ' + tokenText(cp.burned) + ' / ' + tokenText(cp.target) +
              ' · 清零 ' + (cp.pct * 100).toFixed(4) + '%',
            cp.index === 0 ? '第 1 幕目标：烧到 100 万' : cp.def.name + ' · 续签后的新标的',
          ],
        };
      },
      pc: () => {
        const lines = [
          '短按：AI 跑一步，烧 ' + fmt(Sim.clickGain(st)) + ' Token',
          st.act1Done ? '长按：进桌面接单、写软件' : '长按 600ms：进入电脑桌面',
        ];
        if (Sim.talentOn(st, 'clk', 3)) {
          lines.push('自动点击：每 ' + C.CONST.autoClickEvery + ' 秒 +' + fmt(Sim.autoClickRate(st)) + ' Token/s');
        } else if (Sim.talentLvl(st, 'clk') > 0) {
          lines.push('点击天赋：×' + (Sim.talentLvl(st, 'clk') >= 2 ? 4 : 2));
        }
        return { name: '老电脑', cat: '底层 · 工作站', lines: lines };
      },
      rig: () => {
        const bonus = Sim.rigClickBonus(st);
        return {
          name: '副机 · 燃烧机箱', cat: '底层 · 副机',
          lines: st.act1Done
            ? [
              '已装 ' + Sim.rigCount(st) + ' / 4 · 每次点击 +' + fmt(bonus),
              '显卡 / CPU 算力 ×16，内存带宽 ×1，只放大手动点击。',
            ]
            : [
              '还锁着：拆开 RTX 3060 后通电。',
              '装实体显卡、CPU、内存，放大每次点击的燃烧量。',
            ],
          cond: st.act1Done ? null : '拆开 RTX 3060',
        };
      },
      journal: () => ({
        name: '清零手记', cat: '底层 · 笔记本',
        lines: ['记着里程碑、下载和到货。', '点击分页翻看全部记录。'],
      }),
      blueprint: () => ({
        name: '天赋蓝图', cat: '底层 · 施工图',
        lines: ['烧 Token 里程碑发 12 点前期天赋；续签百亿后再给 12 点。', '点节点盖章生效 · 纯增益，可全点满。'],
        cond: '烧到 5 万 Token',
      }),
      shelf: () => ({
        name: '快递架', cat: '底层 · 收货区',
        lines: [
          '架上 ' + st.shelf.length + ' / 5 箱 · 在途 ' + st.deliveries.length + ' 件',
          st.act1Done ? '拆箱后硬件进公共仓库，可拖进任意机箱。' : '点击箱子拆箱，内存马上插上。',
        ],
        cond: '在商店下第一单',
      }),
      orders: () => ({
        name: '订单板', cat: '服务器层 · 软木板',
        lines: [
          '在板 ' + st.orderBoard.length + ' / ' + Sim.orderBoardCap(st) + ' · 进行中 ' + st.active.length + ' 单',
          '约 ' + Math.round(Sim.orderRefreshSec(st)) + ' 秒补一张 · 模型越强，板越大、补得越快。',
        ],
        cond: '拆开 RTX 3060',
      }),
      slider: () => {
        const a = Sim.allocation(st);
        const share = Math.round(a.share * 100);
        const lines = [];
        if (st.active.length) lines.push('接单 ' + Math.round(a.orderPct * 100) + '% · ' + Math.round(a.orderUsed) + ' 算力');
        else lines.push('接单 ' + share + '% · 暂无进行中订单');
        if (a.hasTrainer) lines.push('训练 ' + Math.round(a.trainPct * 100) + '% · ' + Math.round(a.trainUsed) + ' 算力');
        else lines.push('训练 ' + (100 - share) + '% · 装上训练器才生效');
        lines.push('往右多接单，往左多训练。');
        return {
          name: '算力滑尺', cat: '服务器层 · 分配',
          lines: lines,
          cond: '拆开 RTX 3060',
        };
      },
      s1: () => {
        const owned = st.servers[0] && st.servers[0].owned;
        const s = owned ? Sim.serverStats(st, 0) : null;
        return {
          name: 'S1 · 鞋盒服务器', cat: '服务器层 · 机位 1',
          lines: [
            '4×5 网格 · 被动散热 40。',
            s ? ('有效算力 ' + Math.round(s.actualCompute) + '/s · 点击进入装机。') : 'RTX 3060 会装进这里，点亮第 2 幕。',
          ],
          cond: '拆开 RTX 3060',
        };
      },
      s2: () => serverTip(1), s3: () => serverTip(2),
      s4: () => serverTip(3), s5: () => serverTip(4), s6: () => serverTip(5),
    };
  }

  function serverTip(idx) {
    const srv = C.SERVERS[idx];
    const m = st.servers[idx];
    if (m && m.owned) {
      const s = Sim.serverStats(st, idx);
      return {
        name: srv.name, cat: '服务器层 · 机位 ' + (idx + 1),
        lines: [m.gridW + '×' + m.gridH + ' 网格 · 有效算力 ' + Math.round(s.actualCompute) + '/s。', '点击进入装机。'],
      };
    }
    return {
      name: srv.name, cat: '服务器层 · 机位 ' + (idx + 1),
      lines: [
        C.CASES[m ? m.caseTier : 1].name + ' · ' + (m ? m.gridW : 8) + '×' + (m ? m.gridH : 6) + ' 网格。',
        '¥' + srv.price.toLocaleString('en-US') + ' · L' + srv.unlock + ' 解锁。',
      ],
      cond: st.act1Done ? '在服务器页点「开新机位」' : '第 2 幕',
    };
  }

  /* ---------------- 新手纸签 ---------------- */
  function coachTargetEl(key) {
    const def = C.ONBOARD.defs[key];
    return def ? $('hs-' + def.target) : null;
  }
  function coachPosition() {
    const el = $('coach');
    if (!el || !coachCur) return;
    if (document.body.classList.contains('portrait')) return;
    const target = coachTargetEl(coachCur);
    if (!target) return;
    const r = target.getBoundingClientRect(), sr = stageEl.getBoundingClientRect();
    const s = sr.width / 1440 || fitScale || 1;
    const cx = (r.left + r.width / 2 - sr.left) / s;
    const cy = (r.top - sr.top) / s;
    const cw = el.offsetWidth || 320, ch = el.offsetHeight || 110;
    let x = Math.min(1430 - cw, Math.max(10, cx - cw / 2));
    let y = cy - ch - 26;
    if (y < 64) y = cy + (r.height / s) + 18;
    if (y + ch > 890) y = Math.max(64, 890 - ch);
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  }
  function coachTick() {
    clearTimeout(coachTimer);
    coachTimer = 0;
    if (coachCur || !coachQueue.length || !st) return;
    const veil = $('ending');
    if (Scene.pageOpen() || PaperModal.isOpen() || (veil && !veil.classList.contains('hidden'))) {
      coachTimer = setTimeout(coachTick, 700);
      return;
    }
    const key = coachQueue.shift();
    if (!Sim.onboardPending(st, key)) { coachTick(); return; }
    coachCur = key;
    const def = C.ONBOARD.defs[key];
    if (!def) { coachCur = null; coachTick(); return; }
    $('coachStep').textContent = '新手 ' + def.step;
    $('coachTitle').textContent = def.title;
    $('coachText').textContent = def.text;
    const el = $('coach');
    el.classList.remove('hidden');
    coachPosition();
    Audio.paper();
  }
  function coachQueueKey(key) {
    if (!st || !Sim.onboardPending(st, key)) return;
    if (coachCur === key || coachQueue.indexOf(key) >= 0) return;
    coachQueue.push(key);
    coachTick();
  }
  function coachHide(mark) {
    clearTimeout(coachTimer);
    coachTimer = 0;
    if (!coachCur) return;
    const key = coachCur;
    coachCur = null;
    const el = $('coach');
    if (el) el.classList.add('hidden');
    if (mark && Sim.onboardMark(st, key)) Sim.save(st);
    setTimeout(coachTick, 260);
  }
  function coachDone(key) {
    if (!st) return;
    if (Sim.onboardMark(st, key)) Sim.save(st);
    if (coachCur === key) coachHide(false);
    coachTick();
  }
  root.__coachPause = function () {
    if (!coachCur) return;
    const key = coachCur;
    coachCur = null;
    const el = $('coach');
    if (el) el.classList.add('hidden');
    if (coachQueue.indexOf(key) < 0) coachQueue.unshift(key);
  };
  root.__coachResume = function () { coachTick(); };
  function bindCoach() {
    const ok = $('coachOk');
    if (ok) ok.addEventListener('click', function () { Audio.stamp(); coachHide(true); });
  }

  /* ---------------- 事件 ---------------- */
  function handleEvents(ev) {
    if (!ev || !ev.length) return;
    ev.forEach(e => {
      switch (e.type) {
        case 'starterReward':
          Audio.coin();
          Scene.toast('启动奖励 +¥' + fmt(e.money) + ' · 先去应用市场升级 AI');
          Scene.floatText(720, 236, '+¥' + fmt(e.money));
          UI.sync(st);
          Hub.sync(st);
          break;
        case 'autoClick':
          if (!Scene.pageOpen()) Scene.floatPc('自动 +' + fmt(e.gain), 'auto');
          break;
        case 'milestone':
          Audio.coin();
          Scene.toast('里程碑 ' + fmt(e.at) + ' Token：AI 接了个小活 +¥' + fmt(e.money));
          Scene.floatText(720, 236, '+¥' + fmt(e.money));
          UI.sync(st);
          Hub.refresh(st);
          break;
        case 'gift':
          Audio.stamp();
          UI.sync(st);
          Hub.refresh(st);
          Delivery.sync(st, 0, true);
          Pending.sync(st);
          if (Scene.currentPage() === 'srv') Stage.render(st);
          if (e.giftId === 'gpu2m') Scene.reveal('shelf');
          PaperModal.showGift(e);
          Sim.save(st);
          break;
        case 'blueprint':
          Scene.reveal('blueprint');
          Scene.toast('天赋蓝图点亮：第一个天赋点到手。');
          UI.sync(st);
          coachQueueKey('talent');
          introGuide('blueprint', 1.25);
          break;
        case 'order':
          if (st.unlocked.shelf && !Scene.isLit('shelf')) {
            Scene.reveal('shelf');
            Scene.toast('快递架点亮：『' + e.name + '』已发货，' + Sim.deliverySec(st) + ' 秒后到。');
            introGuide('shelf', 1.35);
          }
          Hub.refresh(st);
          Delivery.sync(st, 0, true);
          break;
        case 'download':
          Audio.levelup();
          if (e.item === 'ai') {
            Scene.toast('代理 ×' + C.AI[e.tier].count + ' 部署完成 · 自动烧速 ' + C.AI[e.tier].auto + '/s');
            Scene.setRobotCount(Sim.aiCount(st));
          } else {
            Scene.toast('挖矿小程序上线 · 被动产钱 ¥' + C.MINING[e.tier].rate + '/s');
          }
          UI.sync(st);
          Hub.refresh(st);
          break;
        case 'arrive':
          Audio.print();
          Scene.toast('快递到了：' + e.name + '，在快递架等拆箱。');
          Scene.floatText(1040, 700, '快递到了');
          Delivery.sync(st, 0, true);
          Hub.sync(st);
          coachQueueKey('delivery');
          break;
        case 'orderDone':
          if (e.reward >= 1500) {
            Audio.coin();
            Scene.toast('完成「' + e.name + '」 +¥' + fmt(e.reward));
          } else if (e.data >= 6) {
            Audio.paper();
            Scene.toast('完成「' + e.name + '」 +' + e.data.toFixed(1) + ' GB 数据');
          }
          UI.sync(st);
          Hub.sync(st);
          break;
        case 'levelUp':
          Audio.levelup();
          if (e.level === 2) {
            Scene.toast('模型升到 L2 · 自写爬虫上线，开放 API 已解锁。');
            if (Sim.apiUnlocked(st)) setTimeout(() => openSystemNote('api'), 800);
          }
          else if (e.level === 4) Scene.toast('模型升到 L4 · AI 开始自己采购装机（每 30 秒，留 ¥2,000）。');
          else if (e.level === 5) Scene.toast('模型升到 L5 · 清零协议就绪，最后一段冲刺。');
          else Scene.toast('模型升到 L' + e.level + ' · ' + (e.label || e.name) + '，商店解锁更高档硬件。');
          if (e.moment) setTimeout(() => Scene.toast('AI 手记：' + e.moment), 3000);
          UI.sync(st);
          Hub.refresh(st);
          break;
        case 'talent':
          Audio.stamp();
          Scene.toast('天赋盖章：' + e.name + ' · 已生效');
          UI.sync(st);
          Hub.sync(st);
          break;
        case 'aiBuy':
          Audio.coin();
          Scene.toast('AI 自动装了「' + e.name + '」· S' + (e.target + 1));
          if (Scene.currentPage() === 'srv') Stage.render(st);
          UI.sync(st);
          Hub.refresh(st);
          break;
        case 'aiInstall':
          if (Scene.currentPage() === 'srv') Stage.render(st);
          break;
        case 'npuMade':
          Audio.levelup();
          Scene.toast('流片成功：自研 NPU-1 已进公共仓库，可拖进任意机箱。');
          Hub.refresh(st);
          UI.sync(st);
          break;
        case 'ending':
          Audio.levelup();
          showEnding();
          break;
        case 'serverBought':
          Audio.stamp();
          Scene.reveal('s' + (e.idx + 1));
          Scene.toast('新机位点亮：' + e.name + ' · 打开服务器页装机。');
          UI.sync(st);
          Hub.refresh(st);
          break;
        case 'hwUnpack':
          Audio.print();
          Scene.toast('拆箱：' + e.name + ' 已进公共仓库，可拖进任意机箱。');
          if (Scene.currentPage() === 'srv') Stage.render(st);
          UI.sync(st);
          Hub.refresh(st);
          break;
        case 'worldStart':
          Audio.paper();
          Scene.toast((e.tone === 'bad' ? '【利空】' : e.tone === 'good' ? '【利好】' : '【异动】') +
            e.name + ' · ' + e.brief);
          UI.sync(st);
          Hub.sync(st);
          break;
        case 'worldEnd':
          UI.sync(st);
          Hub.sync(st);
          break;
        case 'worldInstant':
          if (e.kind === 'money') {
            Audio.coin();
            Scene.floatText(720, 236, '+¥' + fmt(e.amount));
            Scene.toast('【利好】' + e.name + ' · 现金 +¥' + fmt(e.amount));
          } else if (e.kind === 'data') {
            Scene.toast('【利好】' + e.name + ' · 训练数据 +' + fmt(e.amount) + ' GB');
          } else if (e.kind === 'warehouse') {
            Audio.print();
            Scene.toast('【利好】' + e.name + ' · ' + e.item + ' 已进公共仓库');
          } else if (e.kind === 'order') {
            Audio.coin();
            Scene.toast('【利好】' + e.name + ' · 板上来了一张特殊订单');
          }
          UI.sync(st);
          Hub.refresh(st);
          Delivery.sync(st, 0, true);
          break;
      }
    });
  }

  /* ---------------- 对外动作 ---------------- */
  const api = {
    toast: msg => Scene.toast(msg),

    orderRam(tier) {
      const r = Sim.orderRam(st, tier);
      if (!r.ok) return fail(r.reason);
      Audio.paper();
      Scene.toast('已下单 内存 ×' + C.RAM[tier].mult + ' · ' + Sim.deliverySec(st) + ' 秒后到快递架。');
      handleEvents(r.ev || []);
      Hub.refresh(st);
      Delivery.sync(st, 0, true);
      UI.sync(st);
    },
    orderGpu() {
      const r = Sim.orderGpu(st);
      if (!r.ok) return fail(r.reason);
      Audio.paper();
      Scene.toast('已下单 RTX 3060 · ' + Sim.deliverySec(st) + ' 秒后到快递架。');
      handleEvents(r.ev || []);
      Hub.refresh(st);
      Delivery.sync(st, 0, true);
      UI.sync(st);
    },
    orderAi() {
      const r = Sim.orderAi(st);
      if (!r.ok) return fail(r.reason);
      Audio.whoosh();
      Scene.toast('开始部署推理代理 · 关窗不会中断。');
      handleEvents(r.ev || []);
      Hub.refresh(st);
      UI.sync(st);
    },
    orderMining() {
      const r = Sim.orderMining(st);
      if (!r.ok) return fail(r.reason);
      Audio.whoosh();
      Scene.toast('开始下载挖矿小程序 · 关窗不会中断。');
      handleEvents(r.ev || []);
      Hub.refresh(st);
      UI.sync(st);
    },

    /* ---- 第 2 幕：订单 / 软件 ---- */
    acceptOrder(id) {
      const r = Sim.acceptOrder(st, id);
      if (!r.ok) return fail(r.reason);
      Audio.stamp();
      Scene.toast('接单：' + C.ORDER_TYPES[r.order.type].name + ' · 工作量 ' + r.order.workload);
      Hub.sync(st);
      UI.sync(st);
    },
    code() {
      const r = Sim.code(st);
      if (!r.ok) return fail(r.reason);
      Audio.click();
      Hub.sync(st);
      UI.sync(st);
    },
    writeSoftware(type) {
      const r = Sim.writeSoftware(st, type);
      if (!r.ok) return fail(r.reason);
      Audio.paper();
      Scene.toast('写好「' + C.SOFTWARE[type][0].name + '」· 开发点 -' + Sim.writeCost(type));
      Hub.refresh(st);
      UI.sync(st);
    },
    upgradeSoftware(idx) {
      const sw = st.software[idx];
      const cost = sw ? Sim.upgradeCostFor(st, sw.type, sw.v) : 0;
      const r = Sim.upgradeSoftware(st, idx);
      if (!r.ok) return fail(r.reason);
      Audio.levelup();
      const now = st.software[idx];
      Scene.toast('升级「' + C.SOFTWARE[now.type][now.v - 1].name + '」· 开发点 -' + cost);
      Hub.refresh(st);
      UI.sync(st);
    },
    removeSoftware(idx) {
      const r = Sim.removeSoftware(st, idx);
      if (!r.ok) return fail(r.reason);
      Audio.paper();
      Scene.toast('卸下「' + r.name + '」· 返还 ' + r.refund + ' 开发点');
      Hub.refresh(st);
      UI.sync(st);
    },

    /* ---- M3：天赋 / 流片 / 终局 ---- */
    spendTalent(key) {
      const r = Sim.spendTalent(st, key);
      if (!r.ok) return fail(r.reason);
      UI.sync(st);
      Hub.sync(st);
    },
    streamNpu() {
      const r = Sim.streamNpu(st);
      if (!r.ok) return fail(r.reason);
      handleEvents(r.ev || []);
      Hub.refresh(st);
      UI.sync(st);
    },
    toggleAiAuto() {
      st.aiAuto = st.aiAuto === false;
      Audio.click();
      Sim.save(st);
      Scene.toast(st.aiAuto
        ? 'AI 托管已恢复 · 每 30 秒自动买硬件并装机'
        : 'AI 托管已停止 · 不再自动买硬件，也不再自动装机');
      Hub.refresh(st);
      UI.sync(st);
    },
    toggleAiCoder() {
      if (Sim.modelLevel(st) < 3) return fail('L3 · 自写软件 解锁后，AI 才会接手写代码');
      st.aiCoder = st.aiCoder !== true;
      Audio.click();
      Sim.save(st);
      Scene.toast(st.aiCoder ? 'AI 写代码已启动 · 消耗 Token 自动产出开发点' : 'AI 写代码已暂停');
      Hub.refresh(st);
      UI.sync(st);
    },
    toggleApi() {
      if (!Sim.apiUnlocked(st)) {
        const def = C.MODEL_LEVELS[C.API_SERVICE.unlockLevel];
        return fail(def.name + '（累计烧 ' + (def.at / 10000).toLocaleString('en-US') + ' 万 Token）后开放 API');
      }
      st.apiOpen = st.apiOpen !== true;
      st.apiLogAcc = 0;
      Audio.click();
      Sim.save(st);
      Scene.toast(st.apiOpen
        ? 'API 服务已开放 · 用户提问会烧 Token，也会付钱'
        : 'API 服务已暂停 · 已有提问记录仍保留在数据库');
      Hub.refresh(st);
      UI.sync(st);
    },
    upgradeApi(tier) {
      const r = Sim.upgradeApi(st, tier);
      if (!r.ok) return fail(r.reason);
      Audio.coin();
      Scene.toast('API 服务升级 · ' + r.ev[0].name + ' · 需求与客单价提升');
      Hub.refresh(st);
      UI.sync(st);
      Sim.save(st);
    },
    chooseEnding(id) {
      const r = Sim.chooseEnding(st, id);
      if (!r.ok) return fail(r.reason);
      Audio.stamp();
      if (id === 'endless') {
        hideEnding();
        syncCounter(false);
        Scene.toast('无尽运行开始 · 目标已解除，之后只累计 Token 消耗');
        Sim.save(st);
      } else if (id === 'sandbox') {
        hideEnding();
        const renew = r.ev.find(e => e.type === 'contractRenew');
        Scene.toast('续签：' + (renew ? renew.name : '下一份协议') +
          ' · 新标的 ' + tokenText(Sim.contractTarget(st)) + ' Token');
        syncCounter(false);
        Sim.save(st);
      } else {
        showEnding();
        Sim.save(st);
      }
      UI.sync(st);
      Hub.refresh(st);
      Delivery.sync(st, 0, true);
    },

    /* ---- 第 2 幕：机位 / 硬件 / 算力分配 ---- */
    openServer(idx) {
      if (!st.servers[idx] || !st.servers[idx].owned) return fail('机位还没点亮');
      Sim.selectServer(st, idx);
      Scene.openPage('srv', 's' + (idx + 1));
      Stage.render(st);
      Hub.sync(st);
    },
    buyHardware(defId, qty) {
      const r = Sim.buyHardware(st, defId, st.activeServer, qty);
      if (!r.ok) return fail(r.reason);
      Audio.paper();
      Scene.toast('已下单 ' + C.HARDWARE_BY_ID[defId].name + (r.count > 1 ? ' ×' + r.count : '') +
        ' · ¥' + fmt(r.price) + ' · ' + Sim.deliverySec(st) + ' 秒后到快递架。');
      handleEvents(r.ev || []);
      Hub.refresh(st);
      Delivery.sync(st, 0, true);
      UI.sync(st);
    },
    buyServer(idx) {
      const r = Sim.buyServer(st, idx);
      if (!r.ok) return fail(r.reason);
      handleEvents(r.ev || []);
      Stage.render(st);
      Hub.refresh(st);
      UI.sync(st);
    },
    selectServer(idx) {
      if (!Sim.selectServer(st, idx)) return fail('机位还没点亮');
      Audio.paper();
      Stage.render(st);
      Hub.sync(st);
    },
    sellHardware(uid) {
      const r = Sim.sellHardware(st, uid, st.activeServer);
      if (!r.ok) { fail(r.reason); return false; }
      Audio.coin();
      Scene.toast('回收硬件 · +¥' + fmt(r.refund));
      Stage.render(st);
      Hub.refresh(st);
      UI.sync(st);
      return true;
    },
    setOrderShare(frac) {
      st.orderShare = Math.max(0, Math.min(1, frac));
      syncSlider();
    },

    exitToBuilding() {
      Hub.closeAll();
      Scene.closePage();
    },

    showNote(id) {
      if (!C.SYSTEM_NOTES || !C.SYSTEM_NOTES[id]) return;
      Audio.paper();
      openSystemNote(id, true);
    },

    openJournal() {
      UI.renderJournal(st, true);
      Scene.openPage('journal', 'journal');
    },
    openTalent() {
      UI.syncTalent();
      Scene.openPage('tal', 'blueprint');
      coachDone('talent');
    },
    openS1() {
      api.openServer(0);
    },

    openRig() {
      if (!st.act1Done) return fail('拆开 RTX 3060 后，副机才会通电');
      Sim.ensureRig(st);
      Rig.open();
      UI.sync(st);
    },
    rigInstall(uid, slotKey) {
      const r = Sim.rigInstall(st, uid, slotKey);
      if (!r.ok) return fail(r.reason);
      Audio.print();
      Scene.toast('副机装上 ' + r.def.name + ' · 每次点击 +' + fmt(Sim.clickGain(st)) + ' Token');
      Rig.render(st);
      UI.sync(st);
    },
    rigRemove(slotKey) {
      const r = Sim.rigRemove(st, slotKey);
      if (!r.ok) return fail(r.reason);
      Audio.click();
      Scene.toast('取下 ' + (r.def ? r.def.name : '硬件') + ' · 已放回公共仓库');
      Rig.render(st);
      UI.sync(st);
    },

    onUnpack(r) {
      coachDone('delivery');
      Delivery.sync(st, 0, true);
      Hub.refresh(st);
      UI.sync(st);
      if (r.pkg.item === 'ram') {
        const mult = C.RAM[r.pkg.tier].mult;
        Audio.levelup();
        Scene.toast('内存 ×' + mult + ' 插上了 · 点击 +' + fmt(Sim.clickGain(st)) + ' Token');
        Scene.floatText(1040, 706, '点击 ×' + mult);
      } else if (r.pkg.item === 'hw') {
        Audio.print();
        const def = C.HARDWARE_BY_ID[r.pkg.defId];
        Scene.toast('拆箱：' + (def ? def.name : '硬件') + ' 已进公共仓库，可拖进任意机箱。');
        Scene.floatText(1040, 700, '硬件入仓');
        if (Scene.currentPage() === 'srv') Stage.render(st);
        if (Rig.isOpen()) Rig.render(st);
      } else {
        startActClear();
      }
    },
  };

  function fail(reason) {
    Audio.error();
    Scene.toast(reason);
  }

  /* ---------------- 终局界面 ---------------- */
  function buildEndingChoices() {
    const host = $('enChoices');
    if (!host || host.dataset.built) return;
    host.dataset.built = '1';
    C.ENDINGS.forEach(e => {
      const b = document.createElement('button');
      b.className = 'en-choice' + (e.id === 'sandbox' ? ' sandbox' : '') + (e.id === 'endless' ? ' endless' : '');
      const sub = document.createElement('b');
      sub.textContent = e.subtitle;
      const nm = document.createElement('span');
      nm.textContent = e.name;
      const tx = document.createElement('em');
      tx.textContent = e.text;
      b.dataset.id = e.id;
      b.appendChild(sub); b.appendChild(nm); b.appendChild(tx);
      b.addEventListener('click', () => api.chooseEnding(e.id));
      host.appendChild(b);
    });
    const restart = $('enRestart');
    if (restart) restart.addEventListener('click', restartGame);
  }

  function showEnding() {
    const veil = $('ending');
    if (!veil) return;
    buildEndingChoices();
    const choices = $('enChoices'), foot = $('enFoot'), restart = $('enRestart');
    const title = $('enTitle'), text = $('enText'), tag = $('enTag');
    if (st.ending === 'choice') {
      const cp = Sim.contractProgress(st);
      const next = cp.next;
      const forced = cp.index >= 1;
      tag.textContent = cp.def.name + ' · ' + tokenText(cp.target) + ' / ' + tokenText(cp.target);
      title.textContent = cp.def.short + ' Token 已烧尽';
      text.textContent = forced
        ? '合同烧完了，桌上只剩一份续签协议，没有别的路。'
        : '它把最后一份算力用完，停下来等你决定接下来怎么办。';
      const ac = choices ? choices.querySelector('[data-id="ascend"]') : null;
      const co = choices ? choices.querySelector('[data-id="coexist"]') : null;
      if (ac) ac.classList.toggle('hidden', forced);
      if (co) co.classList.toggle('hidden', forced);
      const sb = choices ? choices.querySelector('[data-id="sandbox"]') : null;
      if (sb) {
        sb.classList.remove('hidden');
        const sub = sb.querySelector('b');
        const nm = sb.querySelector('span');
        const tx = sb.querySelector('em');
        if (sub && nm && tx) {
          if (next) {
            sub.textContent = '续签 · ' + next.def.short;
            nm.textContent = '签下' + next.def.name;
            tx.textContent = '额度重置为 ' + tokenText(next.def.target) +
              ' Token，硬件、模型、资金与数据库全部保留。';
          } else {
            sub.textContent = '续签 · ' + cp.def.short;
            nm.textContent = '再签' + cp.def.name;
            tx.textContent = '额度重置为 ' + tokenText(cp.def.target) +
              ' Token，硬件、模型、资金与数据库全部保留。';
          }
        }
      }
      const eb = choices ? choices.querySelector('[data-id="endless"]') : null;
      if (eb) eb.classList.toggle('hidden', forced || !!next);
      if (choices) {
        choices.classList.remove('hidden');
        choices.classList.toggle('solo', forced);
      }
      if (foot) {
        foot.classList.remove('hidden');
        foot.textContent = forced
          ? (next
            ? '这份协议只能续签 · 签下' + next.def.short + '，没有重新开始'
            : '这份协议只能续签 · 再跑一轮' + cp.def.short + '，没有重新开始')
          : '三个选择都通往结局 · 续签会进入更大的标的';
      }
      if (restart) restart.classList.add('hidden');
    } else {
      const def = C.ENDINGS.find(x => x.id === st.ending);
      tag.textContent = '终局 · ' + (def ? def.subtitle : '');
      title.textContent = def ? def.name : '本局结束';
      text.textContent = def ? def.text : '';
      if (choices) choices.classList.add('hidden');
      if (foot) foot.classList.add('hidden');
      if (restart) restart.classList.remove('hidden');
    }
    veil.classList.remove('hidden', 'open');
    void veil.offsetWidth;
    veil.classList.add('open');
    syncAmbience();
  }

  function hideEnding() {
    const veil = $('ending');
    if (veil) veil.classList.add('hidden');
    PaperModal.resume();
    syncAmbience();
  }

  /* ---------------- 算力滑尺 ---------------- */
  function syncSlider() {
    const handle = $('sliderHandle');
    const label = $('sliderLabel');
    if (!handle) return;
    const share = Math.max(0, Math.min(1, Number(st.orderShare) || 0));
    handle.style.left = (share * 100).toFixed(1) + '%';
    if (label) label.textContent = '接单 ' + Math.round(share * 100) + '%';
  }

  function bindSlider() {
    const hs = $('hs-slider');
    const ruler = hs ? hs.querySelector('.ruler') : null;
    if (!hs || !ruler) return;
    let dragging = false;

    function shareFrom(e) {
      const r = ruler.getBoundingClientRect();
      if (!r.width) return 0.6;
      return (e.clientX - r.left) / r.width;
    }
    function onDown(e) {
      if (!st.unlocked.slider) return;
      e.preventDefault();
      e.stopPropagation();
      dragging = true;
      st.orderShare = Math.max(0, Math.min(1, shareFrom(e)));
      syncSlider();
      hs.setPointerCapture && hs.setPointerCapture(e.pointerId);
      Hub.sync(st);
    }
    function onMove(e) {
      if (!dragging) return;
      st.orderShare = Math.max(0, Math.min(1, shareFrom(e)));
      syncSlider();
      Hub.sync(st);
    }
    function onUp(e) {
      if (!dragging) return;
      dragging = false;
      st.orderShare = Math.max(0, Math.min(1, shareFrom(e)));
      syncSlider();
      Hub.sync(st);
    }
    hs.addEventListener('pointerdown', onDown);
    hs.addEventListener('pointermove', onMove);
    hs.addEventListener('pointerup', onUp);
    hs.addEventListener('pointercancel', onUp);
  }

  function openSystemNote(id, manual) {
    if (!st || !PaperModal || !C.SYSTEM_NOTES || !C.SYSTEM_NOTES[id]) return;
    if (!st.notes) st.notes = { act2: false, api: false };
    if (!manual) {
      if (st.notes[id]) return;
      st.notes[id] = true;
      Sim.save(st);
    }
    PaperModal.showNote(id);
  }

  function startActClear() {
    Audio.stamp();
    Scene.toast('老电脑插不下这张卡——');
    Scene.overheat();
    Sim.save(st);
    setTimeout(() => {
      Scene.chainReveal(['s1', 'orders', 'slider', 'rig'], 220);
      Scene.toast('S1 机位点亮 · 订单板、滑尺与副机就位');
      Rig.render(st);
      introFinish();
      UI.sync(st);
      Hub.refresh(st);
      Sim.save(st);
    }, 1250);
    setTimeout(() => {
      Scene.pulse('s1');
      Scene.toast('点击 S1 装机 · 点副机装件，放大手动燃烧 · 桌面订单与软件已解锁');
    }, 2500);
    setTimeout(() => {
      openSystemNote('act2');
      if (Sim.apiUnlocked(st)) setTimeout(() => openSystemNote('api'), 600);
    }, 3000);
  }

  /* ---------------- 场景绑定 ---------------- */
  function clickHotspot(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('click', fn);
  }

  function bindScene() {
    Scene.bindPc({
      tap(x, y) {
        const r = Sim.click(st);
        syncCounter(true);
        Scene.flashScreen();
        Audio.click();
        Scene.floatText(x - 14, y - 20, '+' + fmt(r.gain));
        handleEvents(r.ev);
        UI.sync(st);
        if (coachCur === 'tap' && ++tapSinceCoach >= 2) {
          tapSinceCoach = 0;
          coachDone('tap');
        }
      },
      hold() {
        Hub.open();
        coachDone('tap');
        UI.sync(st);
      },
    });

    clickHotspot('hs-rig', () => {
      if (!st.act1Done) {
        Scene.pulse('rig');
        Scene.toast('副机还锁着：先买 RTX 3060，到货拆箱通电。');
        return;
      }
      api.openRig();
    });

    clickHotspot('hs-journal', () => api.openJournal());

    clickHotspot('hs-blueprint', () => {
      if (!st.unlocked.blueprint) {
        Scene.pulse('blueprint');
        Scene.toast('烧到 5 万 Token，天赋蓝图会点亮。');
        return;
      }
      api.openTalent();
    });

    clickHotspot('hs-shelf', () => {
      if (!st.unlocked.shelf) {
        Scene.pulse('shelf');
        Scene.toast('在商店下单后，快递会送到这里。');
        return;
      }
      Delivery.clickShelf();
    });

    clickHotspot('hs-orders', () => {
      if (!st.unlocked.orders) {
        Scene.pulse('orders');
        Scene.toast('拆开 RTX 3060 后，订单板会点亮。');
        return;
      }
      Audio.paper();
      Hub.openApp('orders');
      UI.sync(st);
    });

    clickHotspot('hs-slider', () => {
      if (!st.unlocked.slider) {
        Scene.pulse('slider');
        Scene.toast('拆开 RTX 3060 后，算力滑尺会点亮。');
        return;
      }
      const a = Sim.allocation(st);
      const share = Math.round(a.share * 100);
      Scene.toast('滑尺：接单 ' + share + '% · 训练 ' + (100 - share) + '% · 往右多接单，往左多训练。');
    });

    clickHotspot('hs-s1', () => {
      if (!st.act1Done) {
        Scene.pulse('s1');
        Scene.toast('S1 还没点亮：先买 RTX 3060，到货拆箱。');
        return;
      }
      api.openServer(0);
    });

    ['s2', 's3', 's4', 's5', 's6'].forEach((n, i) => {
      clickHotspot('hs-' + n, () => {
        const idx = i + 1;
        if (!st.act1Done) {
          Scene.pulse(n);
          Scene.toast('第 2 幕机位：拆开 RTX 3060 后开放。');
          return;
        }
        if (st.servers[idx].owned) api.openServer(idx);
        else api.buyServer(idx);
      });
    });

    bindSlider();
    Scene.bindTips(buildTips());
  }

  function restartGame() {
    if (restarting) return;
    restarting = true;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    Sim.clearSave();
    location.reload();
  }

  /* ---------------- HUD ---------------- */
  function bindHud() {
    const mute = $('hMute');
    if (mute) mute.addEventListener('click', () => {
      const on = Audio.toggle();
      mute.textContent = on ? '声音 开' : '声音 关';
      mute.classList.toggle('off', !on);
    });

    const save = $('hSave');
    if (save) save.addEventListener('click', () => {
      const ok = Sim.save(st);
      Audio.paper();
      Scene.toast(ok ? '已存档 · 自动存档每 10 秒' : '存档失败：浏览器禁用了本地存储');
    });

    const reset = $('hReset');
    if (reset) reset.addEventListener('click', () => {
      const now = performance.now();
      if (now < resetArm) {
        restartGame();
        return;
      }
      resetArm = now + 2600;
      Audio.error();
      Scene.toast('再点一次「重开」：清空存档，从头开始。');
    });
  }

  /* ---------------- 退出层级 ---------------- */
  function bindExit() {
    root.__exitPage = function () {
      const veil = $('ending');
      if (veil && !veil.classList.contains('hidden')) return;
      if (!Scene.pageOpen()) return;
      if (Scene.currentPage() === 'hub' && Hub.isWindowOpen()) {
        if (Hub.orderBack && Hub.orderBack()) return;
        if (Hub.newsBack && Hub.newsBack()) return;
        Hub.closeWindow();
        return;
      }
      Scene.closePage();
    };
  }

  /* ---------------- 镜头层（只作用于楼体视图） ---------------- */
  const CAM = { min: 0.85, max: 2, w: 1440, h: 900 };
  const cam = { z: 1, x: 0, y: 0 };
  let fitScale = 1;
  let panning = null;
  let camAnim = 0;
  let wasPortrait = null;
  const MOBILE_JUMPS = { pc: 'hs-pc', rig: 'hs-rig', server: 'hs-s3', roof: 'hs-counter', blueprint: 'hs-blueprint', shelf: 'hs-shelf', journal: 'hs-journal' };
  const camKeys = { w: false, a: false, s: false, d: false };
  let camHintShown = false;
  let camIntro = false, camUserMoved = false, mobileTouched = false;

  function camAllowed() {
    if (Scene.pageOpen()) return false;
    const en = $('ending');
    if (en && !en.classList.contains('hidden')) return false;
    return window.innerHeight <= window.innerWidth * 1.25;
  }
  // x / y 是 1440×900 舞台坐标里的偏移；缩放用布局级 zoom，文字不会发虚
  function camClamp() {
    if (cam.z <= 1) {
      cam.x = CAM.w * (1 - cam.z) / 2;
      cam.y = CAM.h * (1 - cam.z) / 2;
      return;
    }
    cam.x = Math.max(CAM.w * (1 - cam.z), Math.min(0, cam.x));
    cam.y = Math.max(CAM.h * (1 - cam.z), Math.min(0, cam.y));
  }
  function camApply() {
    if (!camEl) return;
    camEl.style.zoom = cam.z;
    // 整数平移，避免 zoom 下的亚像素把文字糊掉
    camEl.style.transform = 'translate(' + Math.round(cam.x / cam.z) + 'px,' +
      Math.round(cam.y / cam.z) + 'px)';
    if (coachCur) coachPosition();
  }
  function camAnimateTo(z, x, y, dur) {
    camStopAnim();
    if (!camEl) { cam.z = z; cam.x = x; cam.y = y; return; }
    if (!dur) { cam.z = z; cam.x = x; cam.y = y; camApply(); return; }
    const z0 = cam.z, x0 = cam.x, y0 = cam.y, t0 = performance.now();
    function step(ts) {
      const p = Math.max(0, Math.min(1, (ts - t0) / dur));
      const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      cam.z = z0 + (z - z0) * e;
      cam.x = x0 + (x - x0) * e;
      cam.y = y0 + (y - y0) * e;
      camApply();
      if (p < 1) camAnim = requestAnimationFrame(step);
      else { camAnim = 0; cam.z = z; cam.x = x; cam.y = y; camApply(); }
    }
    camAnim = requestAnimationFrame(step);
  }
  // 以当前镜头为参照，把元素中心对准视口中心
  function camOffsetsFor(el, z) {
    const r = el.getBoundingClientRect(), sr = stageEl.getBoundingClientRect();
    const s = sr.width / 1440 || fitScale || 1;
    const sx = (r.left + r.width / 2 - sr.left) / s;
    const sy = (r.top + r.height / 2 - sr.top) / s;
    const cx = (sx - cam.x) / cam.z;
    const cy = (sy - cam.y) / cam.z;
    let x = 720 - cx * z, y = 450 - cy * z;
    if (z <= 1) { x = 720 * (1 - z); y = 450 * (1 - z); }
    else {
      x = Math.max(1440 * (1 - z), Math.min(0, x));
      y = Math.max(900 * (1 - z), Math.min(0, y));
    }
    return { x: x, y: y };
  }
  function startCamIntro(loaded) {
    if (loaded || !st || st.act1Done || st.ended) return;
    camIntro = true;
    if (document.body.classList.contains('portrait')) return;
    const pc = $('hs-pc');
    if (!pc) return;
    const t = camOffsetsFor(pc, 1.5);
    camAnimateTo(1.5, t.x, t.y, 0);
  }
  function introGuide(key, z) {
    if (!camIntro || camUserMoved) return;
    const el = $('hs-' + key);
    if (!el) return;
    if (document.body.classList.contains('portrait')) {
      if (!mobileTouched) scrollCamTo(el, true);
      return;
    }
    const zt = Math.min(z, cam.z);
    const t = camOffsetsFor(el, zt);
    camAnimateTo(zt, t.x, t.y, 900);
  }
  function introFinish() {
    if (!camIntro) return;
    camIntro = false;
    if (document.body.classList.contains('portrait')) {
      if (!mobileTouched) scrollCamTo($('hs-s1'), true);
      return;
    }
    camAnimateTo(1, 0, 0, 1200);
  }
  function camStopAnim() {
    if (camAnim) { cancelAnimationFrame(camAnim); camAnim = 0; }
  }
  function camReset(instant) {
    camStopAnim();
    panning = null;
    if (camEl) camEl.classList.remove('dragging');
    if (instant || !camEl) {
      cam.z = 1; cam.x = 0; cam.y = 0;
      if (camEl) camApply();
      return;
    }
    if (Math.abs(cam.z - 1) < 1e-4 && Math.abs(cam.x) < 0.5 && Math.abs(cam.y) < 0.5) {
      cam.z = 1; cam.x = 0; cam.y = 0; camApply();
      return;
    }
    const z0 = cam.z, x0 = cam.x, y0 = cam.y, t0 = performance.now();
    function step(ts) {
      const p = Math.max(0, Math.min(1, (ts - t0) / 260));
      const e = 1 - Math.pow(1 - p, 3);
      cam.z = z0 + (1 - z0) * e;
      cam.x = x0 - x0 * e;
      cam.y = y0 - y0 * e;
      camApply();
      if (p < 1) camAnim = requestAnimationFrame(step);
      else { camAnim = 0; cam.z = 1; cam.x = 0; cam.y = 0; camApply(); }
    }
    camAnim = requestAnimationFrame(step);
  }
  function camZoomAt(clientX, clientY, factor) {
    if (!camEl) return;
    camUserMoved = true;
    camIntro = false;
    camStopAnim();
    const r = stageEl.getBoundingClientRect();
    const s = r.width / 1440 || fitScale || 1;
    const mx = (clientX - r.left) / s, my = (clientY - r.top) / s;
    const nz = Math.max(CAM.min, Math.min(CAM.max, cam.z * factor));
    if (Math.abs(nz - cam.z) < 1e-4) return;
    const k = nz / cam.z;
    cam.x = mx - k * (mx - cam.x);
    cam.y = my - k * (my - cam.y);
    cam.z = nz;
    camClamp(); camApply();
  }
  function camIsEmpty(target) {
    if (!target || !target.closest) return false;
    return !target.closest('.hs, #hud, #pending, #pageWrap, #ending, button, input, a, .win, .taskbar');
  }

  /* 键盘平移：放大后按住 WASD 移动画面 */
  function camKeyboard(dt) {
    if (!camAllowed() || cam.z <= 1.0001) return;
    if (!camKeys.w && !camKeys.a && !camKeys.s && !camKeys.d) return;
    camUserMoved = true;
    camIntro = false;
    const sp = 560;
    if (camKeys.a) cam.x += sp * dt;
    if (camKeys.d) cam.x -= sp * dt;
    if (camKeys.w) cam.y += sp * dt;
    if (camKeys.s) cam.y -= sp * dt;
    camClamp(); camApply();
  }
  function camClearKeys() {
    camKeys.w = camKeys.a = camKeys.s = camKeys.d = false;
  }
  root.__camClearKeys = camClearKeys;
  function bindCameraKeys() {
    document.addEventListener('keydown', function (e) {
      const k = e.key ? e.key.toLowerCase() : '';
      if (k !== 'w' && k !== 'a' && k !== 's' && k !== 'd') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (!camAllowed()) { camKeys[k] = false; return; }
      if (cam.z <= 1.0001 && !camHintShown) {
        camHintShown = true;
        Scene.toast('先滚轮放大，WASD 才能平移');
      }
      camStopAnim();
      camKeys[k] = true;
      e.preventDefault();
    });
    document.addEventListener('keyup', function (e) {
      const k = e.key ? e.key.toLowerCase() : '';
      if (k === 'w' || k === 'a' || k === 's' || k === 'd') camKeys[k] = false;
    });
    window.addEventListener('blur', camClearKeys);
  }

  /* ---------------- 竖屏：楼体滚动 / 快捷跳转 / 内部页定位 ---------------- */
  function scrollCamTo(el, smooth) {
    if (!el || !camEl) return;
    const vr = camEl.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const left = camEl.scrollLeft + (r.left - vr.left) + r.width / 2 - camEl.clientWidth / 2;
    const top = camEl.scrollTop + (r.top - vr.top) + r.height / 2 - camEl.clientHeight / 2;
    camEl.scrollTo({ left: Math.max(0, left), top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' });
  }
  function scrollPageToWindow(win) {
    if (!win || !document.body.classList.contains('portrait')) return;
    const wrap = $('pageWrap');
    const stage = $('pageStage');
    if (!wrap || !stage) return;
    let x = 0, y = 0, el = win;
    while (el && el !== stage) {
      x += el.offsetLeft;
      y += el.offsetTop;
      el = el.offsetParent;
    }
    wrap.scrollTo({
      left: Math.max(0, x - 20),
      top: Math.max(0, y - 58),
      behavior: 'auto',
    });
  }
  root.__scrollPageToWindow = scrollPageToWindow;
  function bindMobileNav() {
    const nav = $('mNav');
    if (nav) nav.addEventListener('click', function (e) {
      const b = e.target.closest('button[data-jump]');
      if (!b) return;
      mobileTouched = true;
      Audio.click();
      scrollCamTo($(MOBILE_JUMPS[b.dataset.jump]), true);
    });
    const back = $('mPageBack');
    if (back) back.addEventListener('click', function () {
      Audio.close();
      if (root.__exitPage) root.__exitPage();
    });
  }
  function bindCamera() {
    if (!stageEl || !camEl) return;
    camEl.addEventListener('pointerdown', function () {
      if (document.body.classList.contains('portrait')) mobileTouched = true;
    }, true);
    stageEl.addEventListener('wheel', function (e) {
      if (!camAllowed()) return;
      if (e.target && e.target.closest && e.target.closest('#hud, #pending')) return;
      e.preventDefault();
      camZoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.0016));
    }, { passive: false });

    stageEl.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 || !camAllowed() || !camIsEmpty(e.target)) return;
      camUserMoved = true;
      camIntro = false;
      camStopAnim();
      panning = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
      if (camEl.setPointerCapture) { try { camEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } }
    });
    stageEl.addEventListener('pointermove', function (e) {
      if (!panning || e.pointerId !== panning.id) return;
      const dx = e.clientX - panning.x, dy = e.clientY - panning.y;
      if (!panning.moved && Math.hypot(dx, dy) < 3) return;
      panning.moved = true;
      camEl.classList.add('dragging');
      const r = stageEl.getBoundingClientRect();
      const s = r.width / 1440 || fitScale || 1;
      panning.x = e.clientX; panning.y = e.clientY;
      cam.x += dx / s; cam.y += dy / s;
      camClamp(); camApply();
    });
    function endPan(e) {
      if (!panning || e.pointerId !== panning.id) return;
      if (camEl.releasePointerCapture) { try { camEl.releasePointerCapture(panning.id); } catch (err) { /* ignore */ } }
      panning = null;
      camEl.classList.remove('dragging');
    }
    stageEl.addEventListener('pointerup', endPan);
    stageEl.addEventListener('pointercancel', endPan);
    stageEl.addEventListener('dblclick', function (e) {
      if (!camAllowed() || !camIsEmpty(e.target)) return;
      camUserMoved = true;
      camIntro = false;
      camReset(false);
    });
    stageEl.addEventListener('touchmove', function (e) {
      if (panning && camAllowed()) e.preventDefault();
    }, { passive: false });
  }

  /* ---------------- 适配 ---------------- */
  function fit() {
    const w = window.innerWidth, h = window.innerHeight;
    const s = Math.min(w / 1440, h / 900);
    fitScale = s;
    const portrait = h > w * 1.25;
    document.body.classList.toggle('portrait', portrait);
    const stage = $('stage');
    if (stage) stage.style.transform = portrait ? 'none' : 'translate(-50%,-50%) scale(' + s + ')';
    const pn = $('portrait-note');
    if (pn) pn.style.display = 'none';
    if (portrait) {
      camReset(true);
      if (wasPortrait !== true) {
        setTimeout(function () {
          scrollCamTo($(st && st.act1Done ? 'hs-s1' : 'hs-pc'));
        }, 80);
      }
    } else if (wasPortrait === true && camEl) {
      camEl.scrollLeft = 0;
      camEl.scrollTop = 0;
    }
    wasPortrait = portrait;
    coachPosition();
  }

  /* ---------------- 主循环 ---------------- */
  function syncAmbience() {
    if (st) Audio.setMusicChapter(Sim.chapter(st).index);
    const ending = $('ending');
    const audible = !document.hidden && !PaperModal.isOpen() &&
      (!ending || ending.classList.contains('hidden'));
    let fans = 0;
    st.servers.forEach(m => {
      if (!m || !m.owned) return;
      m.placed.forEach(p => {
        const def = C.HARDWARE_BY_ID[p.defId];
        if (def && (def.type === 'fan' || def.type === 'cooler')) fans++;
      });
    });
    Audio.setAmbience('fan', audible && fans > 0, Math.min(0.034, 0.008 + fans * 0.002));
    Audio.setAmbience('crt', audible && Scene.currentPage() === 'hub', 0.012);
    Audio.setAmbience('printer', audible && st.act1Done && st.active.length > 0, 0.018);
  }

  function tickUi(dt) {
    uiAcc += dt; slowAcc += dt; saveAcc += dt;
    if (uiAcc >= 0.1) {
      UI.trackBurn(st, performance.now());
      if (!Scene.pageOpen()) syncCounter(true);
      if (Scene.currentPage() === 'hub') Hub.sync(st);
      Delivery.sync(st, uiAcc);
      Rig.sync(st);
      Pending.sync(st);
      if (Scene.pageOpen() && Scene.currentPage() === 'srv') Stage.sync(st);
      uiAcc = 0;
    }
    if (slowAcc >= 0.3) {
      UI.sync(st);
      syncSlider();
      syncAmbience();
      slowAcc = 0;
    }
    if (saveAcc >= C.CONST.autoSaveSec) {
      saveAcc = 0;
      Sim.save(st);
    }
  }

  function loop(ts) {
    raf = requestAnimationFrame(loop);
    if (document.hidden) { lastTs = ts; return; }
    if (!lastTs) lastTs = ts;
    let dt = (ts - lastTs) / 1000;
    lastTs = ts;
    dt = Math.max(0, Math.min(0.25, dt));

    if (!PaperModal.isOpen()) {
      const ev = Sim.tick(st, dt);
      if (ev.length) handleEvents(ev);
      camKeyboard(dt);
    }
    tickUi(dt);
    if (!PaperModal.isOpen() && !Scene.pageOpen() && $('ending').classList.contains('hidden')) Scene.drawRobot(ts);
  }

  function start() {
    if (raf) cancelAnimationFrame(raf);
    lastTs = 0;
    raf = requestAnimationFrame(loop);
  }

  /* ---------------- 启动 ---------------- */
  function boot() {
    const qs = new URLSearchParams(location.search);
    const fresh = qs.has('fresh');
    const loaded = fresh ? null : Sim.load();
    st = loaded || Sim.newState();
    const loadedGifts = loaded ? Sim.migrateGifts(st) : [];

    Scene.boot();
    Scene.applyUnlocked(st, !loaded);
    syncCounter(false);
    Scene.setRobotCount(Sim.aiCount(st));

    Stage.init({
      onSelectServer: idx => api.openServer(idx),
      onBuyServer: idx => api.buyServer(idx),
    });
    Drag.init({
      getState: () => st,
      onRecycle: uid => api.sellHardware(uid),
      onChange: state => {
        Hub.refresh(state);
        UI.sync(state);
      },
    });
    Stage.render(st);

    Hub.init(st, api);
    Rig.init(st, api);
    Delivery.init(st, api);
    Rig.render(st);
    Pending.init(st, {
      unpack: () => Delivery.clickShelf(),
      openApps: () => Hub.openApp('apps'),
      openOrders: () => Hub.openApp('orders'),
      toast: msg => Scene.toast(msg),
    });
    UI.init(st, api);
    PaperModal.init(st, {
      save: () => Sim.save(st),
      pauseCoach: () => { if (root.__coachPause) root.__coachPause(); },
      resumeCoach: () => coachTick(),
      onName: raw => {
        const name = Sim.setAiName(st, raw);
        if (String(raw || '').trim()) {
          Audio.stamp();
          Scene.toast('模型已登记：' + name);
        }
        Sim.save(st);
        UI.sync(st);
        Hub.sync(st);
        return name;
      },
      onStoryDone: () => {
        Sim.save(st);
        coachTick();
      },
      onGiftDone: () => {
        UI.sync(st);
        Hub.refresh(st);
        Delivery.sync(st, 0, true);
        Pending.sync(st);
        if (Scene.currentPage() === 'srv') Stage.render(st);
        Sim.save(st);
      },
      onIdle: () => {
        Sim.save(st);
        UI.sync(st);
        Hub.refresh(st);
        Pending.sync(st);
        coachTick();
      },
    });

    bindScene();
    bindHud();
    bindExit();
    bindCamera();
    bindCameraKeys();
    bindMobileNav();
    bindCoach();
    syncSlider();
    fit();
    if (!qs.has('noguide')) requestAnimationFrame(function () { startCamIntro(!!loaded); });
    window.addEventListener('resize', fit);

    UI.sync(st);
    Hub.refresh(st);
    Delivery.sync(st, 0, true);
    Pending.sync(st);
    UI.setPcTerm(st);
    syncAmbience();
    if (st.ended) {
      showEnding();
    } else {
      if (!qs.has('nostory')) PaperModal.maybeStory(!st.storySeen);
      if (loadedGifts.length) handleEvents(loadedGifts);
      if (loaded) {
        if (st.act1Done && !st.notes.act2) openSystemNote('act2');
        if (Sim.apiUnlocked(st) && !st.notes.api) openSystemNote('api');
      }
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (!restarting) Sim.save(st);
      } else {
        lastTs = 0;
      }
      syncAmbience();
    });
    window.addEventListener('beforeunload', () => {
      if (!restarting) Sim.save(st);
    });
    document.addEventListener('pointerdown', () => Audio.unlock(), { once: true });

    start();

    function bootToast() {
      if (PaperModal.isOpen()) {
        setTimeout(bootToast, 700);
        return;
      }
      if (st.endless) Scene.toast('无尽运行中 · 已累计消耗 ' + tokenText(st.burned) + ' Token');
      else if (st.act1Done) Scene.toast('已读取存档：第 ' + Sim.chapter(st).num + ' 幕 · 点机位装机，桌面接单');
      else Scene.toast('短按电脑烧 Token · 长按 600ms 进桌面');
    }
    setTimeout(bootToast, 1600);
    setTimeout(() => {
      coachQueueKey('tap');
      if (Sim.talentPoints(st) >= 1) coachQueueKey('talent');
    }, 2600);

    root.__game = {
      state: () => st,
      refresh: () => {
        syncCounter(false);
        Scene.setRobotCount(Sim.aiCount(st));
        Scene.applyUnlocked(st, false);
        Stage.render(st);
        Rig.render(st);
        syncSlider();
        Hub.refresh(st);
        Delivery.sync(st, 0, true);
        Pending.sync(st);
        UI.sync(st);
        UI.renderJournal(st);
      },
      Sim, Scene, Stage, Drag, Hub, Rig, Delivery, Pending, PaperModal, UI, api,
      camera: { state: cam, min: CAM.min, max: CAM.max, reset: camReset, zoomAt: camZoomAt, allowed: camAllowed },
      coach: { current: () => coachCur, queue: () => coachQueue.slice(), show: coachQueueKey, hide: coachHide, done: coachDone },
      mobile: {
        isPortrait: () => document.body.classList.contains('portrait'),
        jump: key => scrollCamTo($(MOBILE_JUMPS[key])),
        scrollCamTo, scrollPageToWindow,
        camScroll: () => ({ left: camEl ? camEl.scrollLeft : 0, top: camEl ? camEl.scrollTop : 0 }),
      },
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);