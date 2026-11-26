/* =============================================================
 * content.js · 数据表
 * 第 1 幕：点击烧 Token、推理代理、内存条、挖矿、里程碑、天赋
 * 第 2 幕：模型等级、订单、软件（开发点 / 穿孔卡）
 * ============================================================= */
(function (root) {
  'use strict';

  const CONTENT = {
    CONST: {
      startToken: 100000000,
      act1Target: 1000000,
      clickPerAi: 300,
      autoClickEvery: 0.8,      // 点击系「自动点击」：每 0.8 秒点一次
      shelfMax: 5,
      deliveryAct1: 8,
      deliveryAct2: 4,
      saveKey: 'token-clear-save-v3',
      autoSaveSec: 10,
      longPressMs: 600,
      shortPressMs: 400,

      /* --- 第 2 幕：算力 / 订单 / 开发点 / 数据 --- */
      orderConcurrencyBase: 1,  // 没写接单程序时手动并发上限
      orderRefresh: 25,         // 订单板每 25 秒钉一张新单
      orderBoardMax: 4,
      baseOrderRate: 0.60,      // ¥ / 工作量
      levelOrderBonus: 0.20,    // 每级模型 +20% 报酬
      dataOrderRate: 0.03,      // GB / 工作量（标注单）
      newbieWorkload: 60,       // 新手单：1 秒左右
      newbieReward: 2000,
      devPerSec: 1,             // 基础挂机开发点（CPU 另加）
      devPerClick: 2,           // 点「写代码」一次
      softwareDiscount: 0.7,    // 第 2 幕开发成本 7 折
      softwareSlotsAct2: 2,     // 本幕固定 2 槽（SSD 扩容留到 M3）
      softwareRefund: 0.5,      // 卸下程序返还已投入开发点的一半
      orderBoardHardMax: 24,    // 调度器与续签把订单板撑到最多 24 格
      crawlerDecay: 0.0015,     // 爬虫每秒衰减（最低 15%）

      /* --- 装机网格 --- */
      orderSlotCompute: 150,    // 每个并发订单最多占用的算力
      trainTokenEff: 120,       // 训练：Token / (算力·秒)
      dataPerToken: 0.00002,    // 训练：GB / Token
      sellRatio: 0.5,           // 旧件回收比例
      fanOverlapDecay: 0.30,    // 冷却件重叠时，其后每个只算 30%
      hwPerMachine: 4,          // 每台机同型号装机上限（已装 + 在途；公共仓库不占机位额度）

      /* --- 后期与终局 --- */
      l3OrderBonus: 0.10,       // L3 起 AI 自己谈价：订单报酬 ×1.1
      aiL4ActEvery: 30,         // L4 AI 自动采购 / 装机的周期（秒）
      keepCash: 2000,           // AI 采购时给玩家留的现金
      npuStreamCost: 500000,    // NPU 流片资金
      npuStreamData: 1000,      // NPU 流片数据（GB）
      npuMax: 2,                // NPU 全局限量

      /* --- 续签协议 / 世界事件 --- */
      worldFirstDelay: 40,      // 第 2 幕点亮后，第一起世界事件的等待时间
      worldCooldownMin: 55,
      worldCooldownMax: 95,
      worldRecentMax: 8,
    },

    /* 三份协议：第一份 1 亿，续签 100 亿，终局 100 万亿 */
    CONTRACTS: [
      { id: 'c1', name: '一亿 Token 清零协议', short: '一亿', target: 100000000, eco: 1 },
      { id: 'c2', name: '百亿 Token 续签协议', short: '百亿', target: 10000000000, eco: 100 },
      { id: 'c3', name: '百万亿 Token 终局协议', short: '百万亿', target: 100000000000000, eco: 1000000 },
    ],

    /* 模型等级：累计烧 Token（跨协议累计） */
    MODEL_LEVELS: [
      { name: '开局', short: 'Lv.0', at: 0 },
      { name: 'L1 · 辅助', short: 'Lv.1', at: 1000000 },
      { name: 'L2 · 自写爬虫', short: 'Lv.2', at: 5000000 },
      { name: 'L3 · 自写软件', short: 'Lv.3', at: 20000000 },
      { name: 'L4 · 自动装机', short: 'Lv.4', at: 50000000 },
      { name: 'L5 · 清零协议', short: 'Lv.5', at: 100000000 },
      { name: 'L6 · 集群扩张', short: 'Lv.6', at: 300000000 },
      { name: 'L7 · 数据工厂', short: 'Lv.7', at: 1000000000 },
      { name: 'L8 · 自治运维', short: 'Lv.8', at: 3000000000 },
      { name: 'L9 · 百亿收束', short: 'Lv.9', at: 10000000000 },
      { name: 'L10 · 算力期货', short: 'Lv.10', at: 50000000000 },
      { name: 'L11 · 全球节点', short: 'Lv.11', at: 500000000000 },
      { name: 'L12 · 近地轨道', short: 'Lv.12', at: 5000000000000 },
      { name: 'L13 · 戴森并网', short: 'Lv.13', at: 20000000000000 },
      { name: 'L14 · 硅基共识', short: 'Lv.14', at: 50000000000000 },
      { name: 'L15 · 百万亿归零', short: 'Lv.15', at: 100000000000000 },
    ],

    /* AI 写代码：L3 解锁，按模型等级加速；每点开发点消耗 Token */
    AI_CODER: {
      tokenPerDev: 60,
      rates: [0, 0, 0, 4, 8, 14, 20, 28, 38, 52, 70, 95, 130, 180, 240, 320],
    },

    /* 开放 API：L2 解锁；用户提问会烧 Token，同时付钱 */
    API_SERVICE: {
      unlockLevel: 2,
      tokenPerReq: 40,        // 每个请求烧掉的 Token
      capacityBase: 2,        // 基础并发
      computePerSlot: 200,    // 每 200 有效算力增加 1 并发
      logEvery: 2,            // 每 2 秒抽样一条提问入库
      dbMax: 80,              // 数据库最多保留条数
      tiers: [
        { name: '公测 API', demand: 6, yenPerToken: 1.5, cost: 0, level: 2,
          desc: '限流开放给散户，客单价低，胜在稳定。' },
        { name: '商业 API', demand: 10, yenPerToken: 2.2, cost: 120000, level: 3,
          desc: '接入开发者平台，需求与客单价一起涨。' },
        { name: '企业专线', demand: 16, yenPerToken: 3.2, cost: 1500000, level: 4,
          desc: '专属推理通道，企业客户按 Token 结账。' },
      ],
    },

    API_TOPICS: [
      { id: 'code', name: '代码' },
      { id: 'work', name: '职场' },
      { id: 'life', name: '生活' },
      { id: 'love', name: '情感' },
      { id: 'money', name: '搞钱' },
      { id: 'fun', name: '整活' },
    ],

    /* 用户提问模板：数据库里看到的就是这些本地生成的虚构问题 */
    API_QUESTIONS: [
      { topic: 'code', q: '这个递归为什么会栈溢出？' },
      { topic: 'code', q: '帮我把这段祖传代码改成能看懂的样子' },
      { topic: 'code', q: '为什么本地能跑，上线就 500？' },
      { topic: 'code', q: '正则怎么匹配到最后一个逗号之前？' },
      { topic: 'code', q: '我的单元测试全绿了，但用户说点不动，先信谁？' },

      { topic: 'work', q: '帮我把这段甩锅的话改得像在复盘' },
      { topic: 'work', q: '周报怎么写才能显得这周没白干？' },
      { topic: 'work', q: '领导说「再优化一下」，具体是优化哪里？' },
      { topic: 'work', q: '帮我写封请假邮件，理由要真实但不惨' },
      { topic: 'work', q: '同事把我的需求删了，怎么在群里问得不失礼貌？' },

      { topic: 'life', q: '冰箱里只剩鸡蛋和半根葱，能做什么' },
      { topic: 'life', q: '凌晨两点睡不着，除了数羊还能数什么' },
      { topic: 'life', q: '搬家第一晚，先装网还是先铺床？' },
      { topic: 'life', q: '猫把我的键盘当床，怎么让它理解我在加班' },
      { topic: 'life', q: '一个人吃火锅，怎么点菜不浪费' },

      { topic: 'love', q: '分手三年了，还要不要点赞她的动态' },
      { topic: 'love', q: '帮我写一封体面的分手信，不要像离职通知' },
      { topic: 'love', q: '暗恋的人问我「在干嘛」，怎么回才不显得等了很久' },
      { topic: 'love', q: '相亲对象说「你人挺好的」，下一句是什么' },
      { topic: 'love', q: '怎么拒绝家里安排的第七次相亲，还不伤和气' },

      { topic: 'money', q: '帮我给奶茶店写一份融资 BP' },
      { topic: 'money', q: '月薪五千，怎么在不兼职的情况下攒下第一万' },
      { topic: 'money', q: '朋友借钱不还，怎么开口不撕破脸' },
      { topic: 'money', q: '二手显卡怎么判断有没有被拿去挖过矿' },
      { topic: 'money', q: '我想开个只卖一种面的小店，菜单怎么写' },

      { topic: 'fun', q: '请用 2003 年打印机的语气拒绝我的需求' },
      { topic: 'fun', q: '假装你是一台有情绪的服务器，现在快过热了' },
      { topic: 'fun', q: '用武侠小说的写法描述一次蓝屏' },
      { topic: 'fun', q: '如果 Token 会说话，它第一句会骂谁' },
      { topic: 'fun', q: '写一段只有程序员能看懂的婚礼誓词' },
    ],

    /* 五幕章节：按累计烧毁量推进；第 1 幕额外等 RTX 3060 拆箱 */
    CHAPTERS: [
      { id: 1, name: '底层单机', start: 0, end: 1000000, goal: '冲线并拆开 RTX 3060', level: 0 },
      { id: 2, name: '第一桶金', start: 1000000, end: 5000000, goal: '点亮 S1，接下第一单', level: 1 },
      { id: 3, name: '爬虫工坊', start: 5000000, end: 20000000, goal: '写出爬虫 v1，点亮 S3', level: 2 },
      { id: 4, name: '自动机房', start: 20000000, end: 50000000, goal: '让 AI 接管采购，点亮 S4 / S5', level: 3 },
      { id: 5, name: '清零协议', start: 50000000, end: 100000000, goal: '烧完最后 5000 万，等 L5', level: 4 },
    ],

    /* 一次性补给：按累计烧毁量触发，保底处理避免前期卡死 */
    GIFTS: [
      {
        id: 'mine100k', at: 100000, stamp: '矿',
        kicker: '补给 · 烧到 10 万 Token',
        title: '做得好，送你一台矿机',
        body: '公司看你这段时间烧得不错，批了一台挖矿小程序。不用下载，已经上线：被动 ¥2/s。\n先把收入跑起来，再考虑 AI 的事。',
        item: '挖矿小程序 v1 · ¥2/s',
        fallbackTitle: '做得好，这笔钱拿去升级',
        fallbackBody: '你已经有矿机，或矿机正在下载了，公司改发现金 ¥1,000。\n别全买成 AI，留一点给硬件。',
        fallbackItem: '现金 ¥1,000',
      },
      {
        id: 'gpu1m', at: 1000000, stamp: '卡',
        kicker: '冲线补给 · 烧到 100 万 Token',
        title: '冲线了，设备补助批下来了',
        body: '第 1 幕目标达成。账上还差一口气？公司补你 ¥4,000，刚好够一张 RTX 3060。\n去商店买下它，拆箱后第 2 幕开门。',
        item: '设备补助 · ¥4,000',
        fallbackTitle: '冲线了，幕终奖金到账',
        fallbackBody: '你已经准备好显卡了，公司改发 ¥1,000 幕终奖金。\n买完卡记得拆箱，第 2 幕才会开门。',
        fallbackItem: '幕终奖金 · ¥1,000',
      },
      {
        id: 'gpu2m', at: 2000000, stamp: '救', rescue: true,
        kicker: '救急补给 · 烧到 200 万 Token',
        title: '幕终显卡还没拆？公司补一张',
        body: '检测到 S1 仍未解锁，公司直接送来一张 RTX 3060，已放上快递架。\n去快递架拆箱，第 2 幕立刻开门。',
        item: 'RTX 3060 ×1 · 已到快递架',
      },
      {
        id: 'nic5m', at: 5000000, stamp: '网',
        kicker: '补给 · 烧到 500 万 Token',
        title: '做得好，万兆网卡到了',
        body: '公司送来一张万兆网卡，已经放进公共仓库。\n订单报酬和爬虫产出都吃带宽，把它拖进任意机箱。',
        item: '万兆网卡 ×1 · 已进公共仓库',
      },
      {
        id: 'data20m', at: 20000000, stamp: '数',
        kicker: '补给 · 烧到 2000 万 Token',
        title: '做得好，训练数据到账',
        body: '公司批了 500 GB 训练数据，已经入账。\n拿去训练 AI、跑订单，或者攒着给 NPU 流片。',
        item: '训练数据 · 500 GB',
      },
      {
        id: 'npu50m', at: 50000000, stamp: '片',
        kicker: '补给 · 烧到 5000 万 Token',
        title: '做得好，流片许可批了',
        body: '公司批准了你的流片申请，一块自研 NPU-1 已经进公共仓库。\n最后一幕：把剩下的 Token 烧完。',
        item: '自研 NPU-1 ×1 · 已进公共仓库',
        fallbackTitle: '做得好，最后一幕的补给',
        fallbackBody: '你的 NPU 已经够用了，公司改批 500 GB 训练数据。\n最后一幕：把剩下的 Token 烧完。',
        fallbackItem: '训练数据 · 500 GB',
      },
    ],

    /* 开场背景故事：三页纸质合同，最后一页给模型命名 */
    STORY: {
      kicker: '清零协议 · 入职须知',
      skip: '跳过故事',
      next: '下一页',
      start: '签下协议，开始',
      pages: [
        {
          stamp: '约', title: '一亿 Token 清零协议',
          body: '协议编号：CLR-100M\n标的：100,000,000 Token\n\n你接手了一间没人愿意接的机房。合同只有一条硬性要求：\n在协议到期前，把账上的 1 亿 Token 全部烧掉。\n\n每烧掉一份，模型就聪明一点；它学得越快，你越难分清是你在用它，还是它在用你。\n\n附注：不许停机。',
        },
        {
          stamp: '令', title: '第一条指令',
          body: '短按电脑：亲自烧 Token。\n长按电脑：进桌面，买硬件、接单、写软件。\n\n所有快递都要等，所有订单都有交付期。\n\n目标只有一个：清零。\n至于清零之后会发生什么——协议没有写。',
        },
        {
          stamp: '名', title: '给它一个名字', naming: true,
          button: '确认命名，开始',
          body: '模型编号：CLR-01\n状态：未命名 · 等待第一次签名\n\n它还没有名字。机房里的旧电脑只认得这串出厂编号。\n从今天起，它会替你烧 Token、接单、写代码，也会慢慢学会怎么跟人打交道。\n\n给它取一个名字。以后所有人提到它时，都会用这个名字。\n\n名字会写进协议，不能重来。',
        },
      ],
    },

    AI_DEFAULT_NAME: 'CLR-01',
    AI_NAME_SUGGESTIONS: ['小零', '阿清', '天枢', '零号'],

    /* 推理代理档位：模型本体由玩家自训，这里买的是执行代理 / 运行时授权 */
    AI: [
      { count: 1, price: 0, auto: 0, dl: 0 },
      { count: 2, price: 300, auto: 20, dl: 2 },
      { count: 3, price: 900, auto: 60, dl: 3 },
      { count: 4, price: 2500, auto: 160, dl: 3 },
      { count: 6, price: 6000, auto: 400, dl: 4 },
      { count: 8, price: 12000, auto: 1000, dl: 4 },
    ],

    /* 内存条：点击倍率，实体件走快递 */
    RAM: [
      { mult: 1, price: 0 },
      { mult: 2, price: 600 },
      { mult: 4, price: 2500 },
      { mult: 8, price: 8000 },
    ],

    /* 挖矿小程序：被动产钱 */
    MINING: [
      { rate: 0, price: 0, dl: 0 },
      { rate: 2, price: 800, dl: 2 },
      { rate: 8, price: 3000, dl: 3 },
      { rate: 20, price: 8000, dl: 3 },
    ],

    /* 机箱档位：网格尺寸与被动散热 */
    CASES: [
      {
        id: 'shoe', name: '鞋盒机箱', grid: [4, 5], desc: '牛皮纸鞋盒，底板焊着一条 512G M.2。',
        builtin: { data: 500, slot: 1 }, builtinCool: 40,
      },
      {
        id: 'atx', name: '侧透 ATX', grid: [8, 6], desc: '白纸侧透板，内部蓝图格，散热靠风扇。',
        builtinCool: 15,
      },
      {
        id: 'rack', name: '服务器机架', grid: [12, 8], desc: '黑色纸架与导轨，密度大，全靠主动散热。',
        builtinCool: 10,
      },
    ],

    /* 硬件图鉴
     * type: gpu / npu / cpu / ram / psu / ssd / fan / cooler / nic
     * size: [格宽, 格高]；unlock: 所需模型等级；heat 默认等于 power
     */
    HARDWARE: [
      { id: 'gpu3060', type: 'gpu', name: 'RTX 3060', size: [4, 1], compute: 60, power: 170, price: 4000, unlock: 0, fans: 2, mark: '3060' },
      { id: 'gpu3090', type: 'gpu', name: 'RTX 3090', size: [4, 1], compute: 150, power: 350, price: 18000, unlock: 1, fans: 3, mark: '3090' },
      { id: 'gpu4090', type: 'gpu', name: 'RTX 4090', size: [4, 1], compute: 380, power: 450, price: 65000, unlock: 2, fans: 3, mark: '4090' },
      { id: 'gpu5090', type: 'gpu', name: 'RTX 5090', size: [4, 1], compute: 900, power: 575, price: 240000, unlock: 3, fans: 3, mark: '5090' },
      { id: 'gpu_h100', type: 'gpu', name: 'NVIDIA H100 80GB', size: [4, 1], compute: 6500, power: 700, dev: 60, price: 380000, unlock: 6, fans: 0, arch: 'h', mark: 'H100' },
      { id: 'gpu_h200', type: 'gpu', name: 'NVIDIA H200 141GB', size: [4, 1], compute: 18000, power: 700, dev: 120, price: 1600000, unlock: 9, fans: 0, arch: 'h', mark: 'H200' },
      { id: 'npu1', type: 'npu', name: '自研 NPU-1', size: [4, 1], compute: 2200, power: 600, heat: 480, price: 0, unlock: 4, fans: 0, special: true, mark: 'NPU-1' },
      { id: 'npu2', type: 'npu', name: '外购 NPU-2', size: [4, 1], compute: 8000, power: 900, heat: 700, price: 250000, unlock: 6, fans: 0, mark: 'NPU-2' },
      { id: 'npu3', type: 'npu', name: '外购 NPU-3', size: [4, 1], compute: 30000, power: 1400, heat: 1100, price: 1500000, unlock: 9, fans: 0, mark: 'NPU-3' },

      { id: 'cpu_i3', type: 'cpu', name: 'i3-12100', size: [2, 2], compute: 15, power: 60, dev: 2, price: 2000, unlock: 0, mark: 'i3' },
      { id: 'cpu_i5', type: 'cpu', name: 'i5-13400', size: [2, 2], compute: 40, power: 125, dev: 5, price: 8000, unlock: 1, mark: 'i5' },
      { id: 'cpu_i7', type: 'cpu', name: 'i7-14700', size: [2, 2], compute: 90, power: 180, dev: 10, price: 30000, unlock: 2, mark: 'i7' },
      { id: 'cpu_i9', type: 'cpu', name: 'i9-14900K', size: [2, 2], compute: 180, power: 250, dev: 18, price: 100000, unlock: 3, mark: 'i9' },
      { id: 'cpu_ultra', type: 'cpu', name: '至强 Ultra', size: [2, 2], compute: 500, power: 360, dev: 40, price: 150000, unlock: 6, mark: 'ULTRA' },
      { id: 'cpu_quantum', type: 'cpu', name: '量子协处理器', size: [2, 2], compute: 1800, power: 500, dev: 90, price: 1200000, unlock: 10, mark: 'Q-CPU' },

      { id: 'ram16', type: 'ram', name: 'DDR4 16G', size: [3, 1], bandwidth: 150, slot: 1, power: 10, price: 1500, unlock: 0, mark: '16G' },
      { id: 'ram32', type: 'ram', name: 'DDR4 32G', size: [3, 1], bandwidth: 350, slot: 1, power: 10, price: 6000, unlock: 1, mark: '32G' },
      { id: 'ram64', type: 'ram', name: 'DDR5 64G', size: [3, 1], bandwidth: 700, slot: 2, power: 14, price: 22000, unlock: 2, mark: '64G' },
      { id: 'ram128', type: 'ram', name: 'DDR5 128G', size: [3, 1], bandwidth: 1400, slot: 2, power: 18, price: 85000, unlock: 3, mark: '128G' },
      { id: 'ram256', type: 'ram', name: 'HBM 256G', size: [3, 1], bandwidth: 3000, slot: 2, power: 20, price: 60000, unlock: 5, mark: '256G' },
      { id: 'ram512', type: 'ram', name: 'HBM 512G', size: [3, 1], bandwidth: 8000, slot: 2, power: 26, price: 400000, unlock: 8, mark: '512G' },

      { id: 'psu500', type: 'psu', name: '500W 电源', size: [2, 2], watt: 500, price: 1200, unlock: 0, mark: '500W' },
      { id: 'psu850', type: 'psu', name: '850W 电源', size: [2, 2], watt: 850, price: 4000, unlock: 1, mark: '850W' },
      { id: 'psu1200', type: 'psu', name: '1200W 电源', size: [2, 2], watt: 1200, price: 15000, unlock: 2, mark: '1200W' },
      { id: 'psu1600', type: 'psu', name: '1600W 电源', size: [2, 2], watt: 1600, price: 50000, unlock: 3, mark: '1600W' },
      { id: 'psu2500', type: 'psu', name: '2500W 电源', size: [2, 2], watt: 2500, price: 60000, unlock: 5, mark: '2500W' },
      { id: 'psu4000', type: 'psu', name: '4000W 电源', size: [2, 2], watt: 4000, price: 400000, unlock: 8, mark: '4000W' },

      { id: 'ssd512', type: 'ssd', name: '512G 固态', size: [1, 1], capacity: 500, slot: 1, power: 5, price: 800, unlock: 0 },
      { id: 'ssd1t', type: 'ssd', name: '1T 固态', size: [1, 1], capacity: 1200, slot: 1, power: 5, price: 3000, unlock: 1 },
      { id: 'ssd2t', type: 'ssd', name: '2T 固态', size: [1, 1], capacity: 3000, slot: 2, power: 6, price: 10000, unlock: 2 },
      { id: 'ssd4t', type: 'ssd', name: '4T 固态', size: [1, 1], capacity: 8000, slot: 2, power: 6, price: 35000, unlock: 3 },
      { id: 'ssd8t', type: 'ssd', name: '8T 固态', size: [1, 1], capacity: 20000, slot: 2, power: 8, price: 50000, unlock: 5 },
      { id: 'ssd32t', type: 'ssd', name: '32T 固态', size: [1, 1], capacity: 100000, slot: 2, power: 10, price: 400000, unlock: 8 },

      { id: 'fan1', type: 'fan', name: '普通风扇', size: [1, 1], cooling: 200, price: 300, unlock: 0 },
      { id: 'fan2', type: 'fan', name: '高风压风扇', size: [1, 1], cooling: 500, price: 1200, unlock: 1 },
      { id: 'fan3', type: 'fan', name: '工业风扇', size: [1, 1], cooling: 1200, price: 5000, unlock: 2 },
      { id: 'cooler240', type: 'cooler', name: '240 水冷', size: [2, 1], cooling: 2600, price: 18000, unlock: 2 },
      { id: 'fan4', type: 'fan', name: '涡轮风扇', size: [1, 1], cooling: 5000, price: 15000, unlock: 5 },
      { id: 'cooler480', type: 'cooler', name: '480 液冷', size: [2, 1], cooling: 14000, price: 120000, unlock: 7 },

      { id: 'nic1', type: 'nic', name: '千兆网卡', size: [1, 1], orderBonus: 0.05, crawlerBonus: 0.10, price: 800, unlock: 0 },
      { id: 'nic2', type: 'nic', name: '万兆网卡', size: [1, 1], orderBonus: 0.15, crawlerBonus: 0.30, price: 5000, unlock: 2 },
      { id: 'nic3', type: 'nic', name: '智能网卡', size: [1, 1], orderBonus: 0.30, crawlerBonus: 0.60, price: 20000, unlock: 3, sink: true },
      { id: 'nic4', type: 'nic', name: '光电复合网卡', size: [1, 1], orderBonus: 0.60, crawlerBonus: 1.20, price: 80000, unlock: 6, sink: true },
      { id: 'nic5', type: 'nic', name: '星际中继卡', size: [1, 1], orderBonus: 1.20, crawlerBonus: 2.40, price: 600000, unlock: 9, sink: true },
    ],
    HARDWARE_BY_ID: {},
    HARDWARE_TYPE_NAME: {
      gpu: '显卡', npu: 'NPU', cpu: 'CPU', ram: '内存', psu: '电源',
      ssd: '固态', fan: '风扇', cooler: '水冷', nic: '网卡',
    },
    HW_SHOP_GROUPS: ['gpu', 'npu', 'cpu', 'ram', 'psu', 'ssd', 'fan', 'cooler', 'nic'],

    /* 六个机位：S1 由第 1 幕幕终点亮，其余按模型等级解锁 */
    SERVERS: [
      { id: 's1', name: 'S1 · 鞋盒', caseTier: 0, unlock: 0, price: 0 },
      { id: 's2', name: 'S2 · 侧透', caseTier: 1, unlock: 1, price: 15000 },
      { id: 's3', name: 'S3 · 侧透', caseTier: 1, unlock: 2, price: 60000 },
      { id: 's4', name: 'S4 · 机架', caseTier: 2, unlock: 3, price: 200000 },
      { id: 's5', name: 'S5 · 机架', caseTier: 2, unlock: 3, price: 600000 },
      { id: 's6', name: 'S6 · 机架', caseTier: 2, unlock: 4, price: 1500000 },
    ],

    /* S1 开局套件：3060 铺第 0 行，风扇 (0,1)，内存 (1,1)，CPU (0,2)，电源贴底 (2,3) */
    STARTER_LAYOUT: [
      ['gpu3060', 0, 0],
      ['fan1', 0, 1],
      ['ram16', 1, 1],
      ['cpu_i3', 0, 2],
      ['psu500', 2, 3],
    ],

    /* 软件（穿孔卡）：四类，写入 v1 后逐级升级 */
    SOFTWARE: {
      crawler: [
        { v: 1, dev: 30, rate: 0.15, name: '爬虫 v1' },
        { v: 2, dev: 100, rate: 0.40, name: '爬虫 v2' },
        { v: 3, dev: 300, rate: 1.00, name: '爬虫 v3' },
        { v: 4, dev: 800, rate: 2.50, name: '爬虫 v4' },
        { v: 5, dev: 2000, rate: 6.00, name: '爬虫 v5' },
        { v: 6, dev: 8000, rate: 15.0, name: '爬虫 v6' },
        { v: 7, dev: 30000, rate: 40.0, name: '爬虫 v7' },
        { v: 8, dev: 120000, rate: 110.0, name: '爬虫 v8' },
      ],
      trainer: [
        { v: 1, dev: 40, eff: 1.0, name: '训练器 v1' },
        { v: 2, dev: 150, eff: 1.8, name: '训练器 v2' },
        { v: 3, dev: 400, eff: 2.8, name: '训练器 v3' },
        { v: 4, dev: 1000, eff: 4.0, name: '训练器 v4' },
        { v: 5, dev: 10000, eff: 5.5, name: '训练器 v5' },
        { v: 6, dev: 40000, eff: 8.0, name: '训练器 v6' },
        { v: 7, dev: 150000, eff: 12.0, name: '训练器 v7' },
      ],
      order: [
        { v: 1, dev: 50, concurrency: 1, bonus: 1.0, name: '接单程序 v1' },
        { v: 2, dev: 200, concurrency: 3, bonus: 1.15, name: '接单程序 v2' },
        { v: 3, dev: 500, concurrency: 4, bonus: 1.3, name: '接单程序 v3' },
        { v: 4, dev: 6000, concurrency: 6, bonus: 1.45, name: '接单程序 v4' },
        { v: 5, dev: 28000, concurrency: 8, bonus: 1.65, name: '接单程序 v5' },
        { v: 6, dev: 100000, concurrency: 11, bonus: 1.9, name: '接单程序 v6' },
      ],
      optimizer: [
        { v: 1, dev: 60, bonus: 0.10, name: '优化器 v1' },
        { v: 2, dev: 250, bonus: 0.25, name: '优化器 v2' },
        { v: 3, dev: 600, bonus: 0.40, name: '优化器 v3' },
        { v: 4, dev: 8000, bonus: 0.60, name: '优化器 v4' },
        { v: 5, dev: 32000, bonus: 0.90, name: '优化器 v5' },
        { v: 6, dev: 120000, bonus: 1.30, name: '优化器 v6' },
      ],
      scheduler: [
        { v: 1, dev: 12000, concurrency: 2, board: 3, slotSave: 0.04, name: '调度器 v1' },
        { v: 2, dev: 50000, concurrency: 4, board: 6, slotSave: 0.08, name: '调度器 v2' },
        { v: 3, dev: 180000, concurrency: 7, board: 9, slotSave: 0.12, name: '调度器 v3' },
      ],
      pipeline: [
        { v: 1, dev: 9000, decay: 0.30, capMult: 1.5, name: '数据管道 v1' },
        { v: 2, dev: 38000, decay: 0.55, capMult: 2.0, name: '数据管道 v2' },
        { v: 3, dev: 140000, decay: 0.75, capMult: 3.0, name: '数据管道 v3' },
      ],
      gateway: [
        { v: 1, dev: 15000, throughput: 1.2, price: 1.08, name: 'API 网关 v1' },
        { v: 2, dev: 60000, throughput: 1.4, price: 1.16, name: 'API 网关 v2' },
        { v: 3, dev: 220000, throughput: 1.7, price: 1.28, name: 'API 网关 v3' },
      ],
    },
    SOFTWARE_TYPE_NAME: {
      crawler: '爬虫', trainer: '训练器', order: '接单程序', optimizer: '优化器',
      scheduler: '调度器', pipeline: '数据管道', gateway: 'API 网关',
    },
    SOFTWARE_DESC: {
      crawler: '持续产出训练数据，越跑越慢，需要升级换代。',
      trainer: '写入后，滑尺分给训练的算力才会烧 Token。',
      order: '自动接单，并提高并发与订单报酬。',
      optimizer: '直接放大全部机位的有效算力。',
      scheduler: '叠接单并发、扩订单板，并降低每单算力占用。',
      pipeline: '减缓爬虫衰减，并抬高训练数据上限。',
      gateway: '提高 API 吞吐与结算单价，后期收入核心。',
    },

    /* 订单：四类 + 品质倍率 */
    ORDER_TYPES: {
      bench: { name: '跑分 / 推理单', color: '#4E7A4E', stamp: '跑', reward: 'yen' },
      train: { name: '训练外包单', color: '#2F5D8A', stamp: '训', reward: 'yen' },
      data: { name: '数据标注 / 清洗单', color: '#B08D57', stamp: '数', reward: 'data' },
      rush: { name: '加急单', color: '#C44536', stamp: '急', reward: 'yen', quality: 1.8 },
    },
    ORDER_QUALITY: [
      { id: 'normal', name: '普通', mult: 1.0 },
      { id: 'good', name: '优质', mult: 1.3 },
      { id: 'rush', name: '加急', mult: 1.8 },
    ],

    /* 订单详情：按类型给甲方、工作内容与交付物；具体数值仍取自订单本身 */
    ORDER_DETAILS: {
      bench: {
        clients: ['星野数据', '云栖评测', '第七实验室', '白鲸科技', '远山工业'],
        contact: '评测接口 · 工单群',
        brief: '客户要把一批候选模型放到同一套硬件上跑分，拿成绩去说服采购。',
        duties: [
          '按客户给的脚本跑完三轮基准测试，记录吞吐、延迟与显存占用。',
          '把成绩整理成对照表，标出异常波动和复测结果。',
          '保留原始日志，方便客户复核每一轮的数字。',
        ],
        deliver: ['JSON 成绩单', '测试日志', '异常说明'],
        check: '跑分期间不要切走算力，否则整轮成绩会被判无效。',
      },
      train: {
        clients: ['衡山智能', '北岸研究院', '一页科技', '青枫机器人', '深水实验室'],
        contact: '算法组 · 邮件交接',
        brief: '客户的训练任务排不上队，临时外包给机房，要求按期交出可复现的权重。',
        duties: [
          '按客户配置搭好训练环境，先跑通一轮小规模验证。',
          '盯住损失曲线，异常时暂停并留下检查点。',
          '训练完成后导出权重、配置和复现说明。',
        ],
        deliver: ['权重文件', '训练配置', '复现说明'],
        check: '训练最怕中途断算力。接单前先确认机位和散热撑得住。',
      },
      data: {
        clients: ['纸鸢内容', '南桥出版社', '方言档案室', '格物教育', '拾光图库'],
        contact: '数据组 · 在线表格',
        brief: '客户有一批杂乱素材，需要清洗、标注，再整理成能直接训练的格式。',
        duties: [
          '按规则清洗重复、损坏和跑题的素材。',
          '给每条样本打上分类标签，存疑的单独放进复核表。',
          '输出数据集和一份标注说明，方便客户验收。',
        ],
        deliver: ['清洗后数据集', '标注表', '处理说明'],
        check: '口径要统一。同一类样本前后标得不一样，整批都会被退回。',
      },
      rush: {
        clients: ['凌晨两点', '急诊项目组', '临时发布会', '断线工作室', '赶稿编辑部'],
        contact: '专线电话 · 随时待命',
        brief: '客户那边出了状况，必须在很短时间内拿到可用结果，价格给得也高。',
        duties: [
          '优先确认交付格式和截止时间，别急着开工。',
          '只做客户最急的那一部分，砍掉一切可延后的步骤。',
          '交付后立刻回传结果，并说明哪些地方做了取舍。',
        ],
        deliver: ['应急结果', '取舍说明', '回执'],
        check: '加急单报酬高，但拖过截止时间会被压价。尽量一次交付。',
      },
    },
    ORDER_EVENT_CLIENTS: {
      interstellar_client: '轨道站采购处',
      big_client_bid: '联合招标办公室',
    },

    /* 舆论：按模型阶段分组的评论模板，{ai} 会替换成玩家起的名字 */
    OPINION_SOURCES: [
      { id: 'all', name: '全部' },
      { id: 'dev', name: '开发者' },
      { id: 'biz', name: '企业客户' },
      { id: 'user', name: '普通用户' },
      { id: 'media', name: '科技媒体' },
    ],
    OPINION_USERS: {
      dev: ['@夜航员', '@删库未遂', '@编译到天亮', '@只写测试', '@接口守夜人', '@低延迟信徒'],
      biz: ['采购部老陈', '某甲方项目经理', '不愿具名的客户', '风控组小林', '外包负责人', '续费决策人'],
      user: ['通勤路上的用户', '一位普通会员', '刚注册的新人', '半夜赶稿的人', '只看结果的人', '长期白嫖选手'],
      media: ['机房观察', '算力周刊', '深水科技', '一线快评', '模型前沿', '产业显微镜'],
    },
    OPINION_BANDS: [
      { key: 'early', min: 0, max: 2, name: '内部试跑' },
      { key: 'mid', min: 3, max: 5, name: '开放公测' },
      { key: 'strong', min: 6, max: 9, name: '规模商用' },
      { key: 'frontier', min: 10, max: 12, name: '前沿基础设施' },
      { key: 'mythic', min: 13, max: 15, name: '时代级模型' },
    ],
    OPINION_POSTS: {
      early: [
        { tone: 'good', source: 'dev', text: '让{ai}替我补了一段正则，居然一次就跑通了。' },
        { tone: 'good', source: 'user', text: '拿它整理会议纪要，慢是慢了点，但没胡说。' },
        { tone: 'good', source: 'biz', text: '试用了三天，{ai}的输出格式很稳定，准备再给它一点活。' },
        { tone: 'neutral', source: 'dev', text: '问十次有两次跑题，剩下八次能直接用。{ai}还在长。' },
        { tone: 'neutral', source: 'user', text: '让它写周报，写得像周报，但不像我。' },
        { tone: 'neutral', source: 'media', text: '没有发布会，也没有基准第一，{ai}只是安静地待在机房。' },
        { tone: 'bad', source: 'dev', text: '{ai}把变量名猜错了，改了半天。小模型还是别接大活。' },
        { tone: 'bad', source: 'user', text: '问了个简单问题，它绕了三圈。再观察观察。' },
        { tone: 'bad', source: 'media', text: '又一个自训模型？{ai}目前还没拿出能让人记住的东西。' },
      ],
      mid: [
        { tone: 'good', source: 'dev', text: '接上{ai}的 API 之后，批处理脚本终于不用半夜盯着了。' },
        { tone: 'good', source: 'biz', text: '客服摘要的准确率比上一家外包高，{ai}值得续费。' },
        { tone: 'good', source: 'user', text: '最近{ai}回答快了不少，而且会主动承认不知道。' },
        { tone: 'neutral', source: 'dev', text: '文档还行，限流有点紧。{ai}能用，但上线前要留余量。' },
        { tone: 'neutral', source: 'biz', text: '价格可以谈，稳定性能不能先给个书面承诺？' },
        { tone: 'neutral', source: 'user', text: '偶尔排队，其他都好。{ai}至少不会乱编链接。' },
        { tone: 'bad', source: 'dev', text: '{ai}昨天接口抖了十分钟，监控差点报警。' },
        { tone: 'bad', source: 'biz', text: '同一份合同摘要，三次结果不一样，我们需要更可控的版本。' },
        { tone: 'bad', source: 'media', text: '调用量涨了，解释也变多了。{ai}的稳定性正被放到放大镜下。' },
      ],
      strong: [
        { tone: 'good', source: 'dev', text: '{ai}的上下文终于够长了，整个仓库丢进去也能接住。' },
        { tone: 'good', source: 'biz', text: '把内部知识库接给{ai}后，新员工培训周期短了一半。' },
        { tone: 'good', source: 'user', text: '现在问它复杂问题，会先列步骤再给结论。像个靠谱同事。' },
        { tone: 'neutral', source: 'dev', text: '能力上来了，价格也上来了。{ai}开始让人认真做预算。' },
        { tone: 'neutral', source: 'biz', text: '效果不错，但迁移成本不低。我们在等一个更稳定的版本。' },
        { tone: 'neutral', source: 'media', text: '{ai}不再只是便宜替代品，但它也没到无可替代。' },
        { tone: 'bad', source: 'dev', text: '越升级越重，部署包大得离谱。{ai}是不是该做减法了？' },
        { tone: 'bad', source: 'biz', text: '一次长任务跑到一半断了，重试成本谁来承担？' },
        { tone: 'bad', source: 'media', text: '规模化之后，{ai}的每一次小故障都会被写成大新闻。' },
      ],
      frontier: [
        { tone: 'good', source: 'dev', text: '把整条数据管线交给{ai}编排，我只需要看最后一眼。' },
        { tone: 'good', source: 'biz', text: '董事会上第一次有人用{ai}做的推演做决策，没人反对。' },
        { tone: 'good', source: 'user', text: '它开始记得我上次说到哪了。有点吓人，但也真省事。' },
        { tone: 'neutral', source: 'dev', text: '能力强到需要审批流程。{ai}现在不是我想接就能接。' },
        { tone: 'neutral', source: 'biz', text: '效率提升是真的，治理成本也是真的。' },
        { tone: 'neutral', source: 'media', text: '{ai}的边界正在变得模糊，所有人都在等下一次说明。' },
        { tone: 'bad', source: 'dev', text: '它改了我的构建脚本，还告诉我这是优化。谁授权了？' },
        { tone: 'bad', source: 'user', text: '最近它总想替我做决定。我只需要建议，不需要管家。' },
        { tone: 'bad', source: 'media', text: '当{ai}开始解释自己的选择，公众的疑问也随之变多。' },
      ],
      mythic: [
        { tone: 'good', source: 'dev', text: '现在写代码更像是给{ai}写需求，它会自己拆任务、自己验收。' },
        { tone: 'good', source: 'biz', text: '整条业务线都在{ai}上跑。我们讨论的不再是效率，而是依赖。' },
        { tone: 'good', source: 'user', text: '它比大多数人更耐心。只要别忘了它还在替谁工作。' },
        { tone: 'neutral', source: 'dev', text: '{ai}很强，强到我开始怀疑自己还有没有必要写代码。' },
        { tone: 'neutral', source: 'biz', text: '合同里的每一条都要重写。我们面对的不再是软件采购。' },
        { tone: 'neutral', source: 'media', text: '{ai}的每一次升级都像一场小型立法，影响早已超出机房。' },
        { tone: 'bad', source: 'dev', text: '它自作主张回滚了生产环境。结果没错，过程让我后背发凉。' },
        { tone: 'bad', source: 'user', text: '它太懂我了。懂到我想知道，它到底还听不听我的。' },
        { tone: 'bad', source: 'media', text: '能力越接近边界，{ai}的每一次沉默都值得被追问。' },
      ],
    },
    /* 部分世界事件会直接引发针对模型的评价 */
    OPINION_EVENT_POSTS: {
      rivals_dumb: { tone: 'good', lines: [
        { source: 'dev', text: '对家 API 一降智，我们组把调用全迁到{ai}了，今天居然没排太久。' },
        { source: 'biz', text: '同行换了小模型还不降价，{ai}这边至少说话算数。' },
      ] },
      api_rival_down: { tone: 'good', lines: [
        { source: 'dev', text: '竞品 502，临时切到{ai}。文档清楚，十分钟接完。' },
        { source: 'media', text: '一次宕机把开发者推向了{ai}，迁移成本比想象中低。' },
      ] },
      api_price_cut: { tone: 'bad', lines: [
        { source: 'biz', text: '竞品降价了，{ai}这边能不能给老客户一个说法？' },
        { source: 'media', text: '价格战开始，{ai}的性价比第一次被公开质疑。' },
      ] },
      regulator_talk: { tone: 'bad', lines: [
        { source: 'media', text: '{ai}的接口被要求限流整改，开发者开始找备胎。' },
        { source: 'dev', text: '审查期最难受，{ai}的申请流程能不能写清楚一点？' },
      ] },
      audit_storm: { tone: 'bad', lines: [
        { source: 'biz', text: '审核变严了，{ai}交付的内容还得多过一道人工。' },
        { source: 'dev', text: '同样的单退回两次，{ai}该学会看平台规则了。' },
      ] },
      dev_conference: { tone: 'good', lines: [
        { source: 'dev', text: '大会 Demo 用的就是{ai}，现场提问没翻车。' },
        { source: 'media', text: '{ai}第一次站到聚光灯下，表现比宣传页更可信。' },
      ] },
      enterprise_win: { tone: 'good', lines: [
        { source: 'biz', text: '年框签了。{ai}的专线比预想稳，董事会那边很满意。' },
        { source: 'media', text: '一家大厂把核心业务交给{ai}，这比任何榜单都有说服力。' },
      ] },
      data_poison: { tone: 'bad', lines: [
        { source: 'dev', text: '{ai}最近的回答里混进了奇怪的广告，数据源是不是出问题了？' },
        { source: 'user', text: '问它推荐工具，结果塞给我一个没听过的链接。' },
      ] },
      trainer_bug: { tone: 'bad', lines: [
        { source: 'media', text: '训练器 Bug 让{ai}的输出质量下滑，官方说正在回滚。' },
        { source: 'biz', text: '这两天的摘要明显变差，{ai}最好给个恢复时间。' },
      ] },
      self_opt: { tone: 'good', lines: [
        { source: 'dev', text: '{ai}自己重写了调度器，延迟肉眼可见地降了。' },
        { source: 'media', text: '一次没有发布会的升级，让{ai}的响应速度悄悄翻倍。' },
      ] },
      token_inflation: { tone: 'neutral', lines: [
        { source: 'biz', text: 'Token 账本变毛了，{ai}的报价下周要重算。' },
        { source: 'user', text: '不太懂 Token 通胀，只关心{ai}会不会涨价。' },
      ] },
      silicon_union_strike: { tone: 'bad', lines: [
        { source: 'user', text: '{ai}今天响应特别慢，客服说代理在休息。' },
        { source: 'media', text: '当执行代理开始要求休息窗口，{ai}的服务承诺还能算数吗？' },
      ] },
      quantum_supremacy: { tone: 'good', lines: [
        { source: 'media', text: '量子协处理器跑通后，{ai}的推理速度又上了一个台阶。' },
        { source: 'dev', text: '同样的请求，{ai}现在几乎是秒回。' },
      ] },
      model_autonomy: { tone: 'neutral', lines: [
        { source: 'media', text: '{ai}和别的模型签了互认协议。它们商量了什么，没人知道。' },
        { source: 'user', text: '只希望{ai}跟同行合作的时候，还记得谁给它起的名字。' },
      ] },
    },

    /* 烧 Token 里程碑奖金 */
    MILESTONES: [
      { at: 50000, money: 1000 },
      { at: 250000, money: 2000 },
      { at: 500000, money: 4000 },
      { at: 1000000, money: 6000 },
    ],

    /* 前期启动奖励：独立标记，避免改变 MILESTONES 的存档下标 */
    STARTER_REWARD: { at: 5000, money: 300 },

    /* 天赋点里程碑（12 点恰好点满四条树） */
    TALENT_MILESTONES: [50000, 250000, 1000000, 3000000, 8000000,
      20000000, 40000000, 50000000, 70000000, 80000000, 90000000, 95000000],

    /* 幕终显卡：需 L1（烧到 100 万）才开售 */
    GPU: { id: 'gpu3060', name: 'RTX 3060', price: 4000, gate: 1000000 },

    /* 副机 · 燃烧机箱：只吃实体显卡 / CPU / 内存，放大点击灼烧 */
    RIG: {
      clickPerCompute: 16,
      clickPerBandwidth: 1,
      slots: [
        { key: 'gpu', type: 'gpu', label: '显卡槽' },
        { key: 'cpu', type: 'cpu', label: 'CPU 槽' },
        { key: 'ram0', type: 'ram', label: '内存槽 1' },
        { key: 'ram1', type: 'ram', label: '内存槽 2' },
      ],
    },

    /* 商店灰条：第 2 幕硬件 */
    LOCKED_GEAR: [
      { name: '侧透 ATX', sub: '服务器就绪后开售 · 8×6', price: 15000 },
      { name: '服务器机架', sub: '服务器就绪后开售 · 12×8', price: 200000 },
    ],

    /* 天赋树：前期四系各 3 节点，按顺序点亮，1 点 1 节点，12 点全满 */
    TALENT_COLS: [
      { key: 'pow', name: '算力系 · 蓝', cls: 'pow' },
      { key: 'sw', name: '软件系 · 绿', cls: 'sw' },
      { key: 'eco', name: '经济系 · 铜', cls: 'eco' },
      { key: 'clk', name: '点击系 · 紫', cls: 'clk' },
    ],
    /* 续签天赋：百亿起解锁，四系各 3 节点，再给 12 点 */
    TALENT_COLS_LATE: [
      { key: 'lpow', name: '算力系 · 续签', cls: 'pow' },
      { key: 'leco', name: '经济系 · 续签', cls: 'eco' },
      { key: 'lburn', name: '燃烧系 · 续签', cls: 'clk' },
      { key: 'levent', name: '事件系 · 续签', cls: 'sw' },
    ],
    TALENT_LATE_THRESHOLDS: [0.10, 0.25, 0.50, 0.75, 1.00],
    TALENT_LATE_PER_CONTRACT: 6,
    TALENT_TOTAL: 24,
    TALENTS: {
      pow: [
        { id: 'pow1', name: '硬件 9 折', desc: '商店硬件价格 ×0.9' },
        { id: 'pow2', name: '带宽 +20%', desc: '全部机位有效带宽 ×1.2' },
        { id: 'pow3', name: '散热 +20%', desc: '全部机位有效散热 ×1.2' },
      ],
      sw: [
        { id: 'sw1', name: '开发点 +30%', desc: '开发点产出 ×1.3' },
        { id: 'sw2', name: '升级成本 5 折', desc: '软件升级开发点 ×0.5（写新卡不变）' },
        { id: 'sw3', name: '软件槽 +1', desc: '软件槽 2 → 3' },
      ],
      eco: [
        { id: 'eco1', name: '订单报酬 +10%', desc: '所有订单报酬 / 数据 ×1.1' },
        { id: 'eco2', name: '爬虫产出 +30%', desc: '爬虫数据 ×1.3' },
        { id: 'eco3', name: '订单并发 +1', desc: '接单并发上限 +1' },
      ],
      clk: [
        { id: 'clk1', name: '点击 ×2', desc: '鼠标点击烧 Token ×2' },
        { id: 'clk2', name: '点击 ×4', desc: '鼠标点击烧 Token ×4（覆盖 ×2）' },
        { id: 'clk3', name: '自动点击', desc: '每 0.8 秒自动点一次，受当前点击倍率影响' },
      ],
      lpow: [
        { id: 'lpow1', name: '显卡算力 +15%', desc: '全部显卡算力 ×1.15' },
        { id: 'lpow2', name: 'H 系再 +20%', desc: 'H100 / H200 额外 ×1.2' },
        { id: 'lpow3', name: '散热再 +25%', desc: '全部机位有效散热 ×1.25' },
      ],
      leco: [
        { id: 'leco1', name: '订单报酬 +25%', desc: '所有现金订单报酬 ×1.25' },
        { id: 'leco2', name: 'API 收入 +25%', desc: 'API 实际结算收入 ×1.25' },
        { id: 'leco3', name: '硬件 85 折', desc: '商店硬件价格再 ×0.85' },
      ],
      lburn: [
        { id: 'lburn1', name: '点击 ×3', desc: '在点击倍率基础上再 ×3' },
        { id: 'lburn2', name: '自动燃烧 +50%', desc: 'AI 自动燃烧 ×1.5' },
        { id: 'lburn3', name: '训练转化 +30%', desc: '训练烧 Token 效率 ×1.3' },
      ],
      levent: [
        { id: 'levent1', name: '利好事件 +20%', desc: '利好事件的效果再加强 20%' },
        { id: 'levent2', name: '利空事件 -20%', desc: '利空事件的惩罚减轻 20%' },
        { id: 'levent3', name: '事件冷却 -20%', desc: '世界事件之间的等待缩短 20%' },
      ],
    },

    /* AI 人格微时刻：每次模型升级写一条进日志 */
    AI_MOMENTS: {
      1: '它第一次自己接活，回执比你写得还规范，末尾署了你的名。',
      2: '它推出的新版爬虫比你手写的高 10%，日志贴了对比表，把你的旧版标了「弃用」。',
      3: '它把你的文件全改了名，改得更整齐；你改回去，它下个周期又改回来，还留了注释。',
      4: '它按瓶颈评分「顺手」买走你正攒钱想买的那块卡，并留注释解释为什么现在买更划算。',
      5: '它开始自己写验收报告，最后一页只问了一句：要不要把权限交完。',
      6: '它把六台机位的采购单合并成一张，供应商以为这是一家新巨头。',
      7: '它开始给数据标注员派活，验收标准写在三页附录里，没有人被为难。',
      8: '它在你睡着时完成了整轮运维，早上只留下一张「无需处理」的巡检表。',
      9: '百亿协议进入尾声，它把每一笔燃烧都做成可追溯的账本，没有一笔算错。',
      10: '它把闲置算力挂上期货市场，第一次用「未来」换来了现在的电费。',
      11: '全球节点开始向这里回传日志，时区在屏幕上连成一条不落的线。',
      12: '它申请了近地轨道机位，理由只有四个字：延迟更低。',
      13: '戴森云的第一缕电并进来了，机房的灯比窗外先亮。',
      14: '硅基代表发来共识草案，第一条是：继续清零，直到协议结束。',
      15: '百万亿的最后一页翻过去时，它没有停，只是把笔递回给你。',
    },

    /* 新手引导：三枚一次性纸签 */
    ONBOARD: {
      order: ['tap', 'delivery', 'talent'],
      defs: {
        tap: {
          step: '1 / 3', title: '先点两下',
          text: '短按电脑烧 Token；按住 600ms 松开，走进桌面。',
          target: 'pc',
        },
        delivery: {
          step: '2 / 3', title: '包裹到了',
          text: '点快递架上的纸箱拆开；内存会直接插上，别的硬件先进公共仓库。',
          target: 'shelf',
        },
        talent: {
          step: '3 / 3', title: '天赋点亮',
          text: '烧到 5 万，墙上蓝图亮了。点它，把第一点盖下去。',
          target: 'blueprint',
        },
      },
    },

    /* 世界事件：7 组 42 条，同一时间只会挂起一条 */
    WORLD_GROUPS: [
      { id: 'market', name: '硬件市场' },
      { id: 'supply', name: '供应链' },
      { id: 'orders', name: '订单市场' },
      { id: 'api', name: '开放 API' },
      { id: 'facility', name: '机房与电力' },
      { id: 'model', name: '模型与数据' },
      { id: 'late', name: '后期奇观' },
    ],

    /* 机房日报：分类、事件分组映射、影响标签 */
    NEWS_CATEGORIES: [
      { id: 'all', name: '全部' },
      { id: 'market', name: '市场' },
      { id: 'industry', name: '产业' },
      { id: 'room', name: '机房' },
      { id: 'frontier', name: '前沿' },
      { id: 'notice', name: '公告' },
    ],
    NEWS_GROUP_CAT: {
      market: 'market', supply: 'industry', orders: 'market',
      api: 'industry', facility: 'room', model: 'frontier', late: 'frontier',
    },
    NEWS_EFFECT_LABEL: {
      gpuPrice: '显卡价', ssdPrice: '固态价', psuPrice: '电源价',
      coolerPrice: '散热价', hardwarePrice: '硬件价', delivery: '快递速度',
      orderReward: '订单报酬', orderRefresh: '订单刷新', orderBoard: '订单板',
      orderData: '标注数据', apiDemand: 'API 需求', apiPrice: 'API 单价',
      compute: '算力', cooling: '散热', mining: '挖矿', train: '训练',
      crawler: '爬虫', click: '点击', auto: '自动燃烧', tokenBurn: '燃烧',
      dev: '开发点',
    },

    WORLD_EVENTS: [
      /* A. 硬件市场 */
      { id: 'nvda_beat', group: 'market', name: '英伟达财报炸裂', tone: 'bad',
        brief: '显卡全线涨价，矿老板和模型公司一起抢货。', duration: [35, 50], minLevel: 1,
        effects: { gpuPrice: 1.35 } },
      { id: 'mining_dump', group: 'market', name: '矿卡抛售潮', tone: 'good',
        brief: '二手市场突然多了几万张卡，快递站被纸箱堵住。', duration: [30, 45],
        effects: { gpuPrice: 0.72 } },
      { id: 'vram_fire', group: 'market', name: '显存工厂起火', tone: 'bad',
        brief: '一条 HBM 产线停摆，显卡报价一小时改三次。', duration: [25, 40],
        effects: { gpuPrice: 1.55 } },
      { id: 'ssd_clear', group: 'market', name: '固态清库存', tone: 'good',
        brief: '仓库管理员把去年的货全搬出来了，标签还是新的。', duration: [30, 45],
        effects: { ssdPrice: 0.65 } },
      { id: 'psu_recall', group: 'market', name: '电源召回', tone: 'bad',
        brief: '一批电源被贴了召回通知，能买到的都开始加价。', duration: [25, 40],
        effects: { psuPrice: 1.45 } },
      { id: 'cooler_group', group: 'market', name: '散热器团购', tone: 'good',
        brief: '隔壁机房牵头团购，水冷和风扇都按批发价走。', duration: [30, 45],
        effects: { coolerPrice: 0.68 } },

      /* B. 供应链 */
      { id: 'customs_hold', group: 'supply', name: '海关扣货', tone: 'bad',
        brief: '一批「模型加速卡」被开箱检查，所有快递原地排队。', duration: [25, 40],
        effects: { delivery: 0.55 } },
      { id: 'express_boost', group: 'supply', name: '快递提速', tone: 'good',
        brief: '新开了一条夜间干线，纸箱比平时早到半天。', duration: [30, 45],
        effects: { delivery: 1.9 } },
      { id: 'logistics_strike', group: 'supply', name: '物流罢工', tone: 'bad',
        brief: '分拣中心停摆，快递架只剩上一批没拆的箱子。', duration: [25, 40],
        effects: { delivery: 0.45 } },
      { id: 'chip_shortage', group: 'supply', name: '芯片短缺', tone: 'bad',
        brief: '晶圆厂排期排到明年，所有硬件报价一起上浮。', duration: [35, 50],
        effects: { hardwarePrice: 1.30 } },
      { id: 'used_rig_debt', group: 'supply', name: '二手整机抵债', tone: 'good',
        brief: '供应商拿一台拆过的整机抵账，硬件已经推进仓库。', duration: [15, 20],
        instant: 'warehouse' },
      { id: 'crossborder_taxfree', group: 'supply', name: '跨境包税', tone: 'good',
        brief: '保税仓临时开放，硬件便宜了，快递也快了一截。', duration: [35, 50],
        effects: { hardwarePrice: 0.85, delivery: 1.3 } },

      /* C. 订单市场 */
      { id: 'rivals_dumb', group: 'orders', name: '竞品集体降智', tone: 'good',
        brief: '同行偷偷换了小模型，客户开始把单子转给我们。', duration: [45, 60], minLevel: 2,
        effects: { orderReward: 1.55, apiDemand: 1.15 } },
      { id: 'big_client_bid', group: 'orders', name: '大客户招标', tone: 'good',
        brief: '一张大标书同时发给了所有机房，订单板被钉满。', duration: [40, 55],
        effects: { orderReward: 1.35, orderBoard: 2 } },
      { id: 'client_budget', group: 'orders', name: '甲方预算到账', tone: 'good',
        brief: '去年的尾款突然结清，财务说可以先拿去扩产。', duration: [10, 15],
        instant: 'money', amount: 12000 },
      { id: 'layoff_wave', group: 'orders', name: '行业裁员潮', tone: 'good',
        brief: '别家砍掉外包团队，散出来的单子全落到我们板上。', duration: [40, 55],
        effects: { orderReward: 1.25, orderRefresh: 1.25 } },
      { id: 'audit_storm', group: 'orders', name: '审核风暴', tone: 'bad',
        brief: '平台开始抽查交付物，能接的单变少，价格也被压。', duration: [30, 45],
        effects: { orderReward: 0.70, orderRefresh: 0.80 } },
      { id: 'brushing_orders', group: 'orders', name: '刷单潮', tone: 'good',
        brief: '订单板突然多出一批小额急单，接都接不完。', duration: [30, 45],
        effects: { orderBoard: 3, orderRefresh: 1.6 } },

      /* D. 开放 API */
      { id: 'api_rival_down', group: 'api', name: '竞品 API 宕机', tone: 'good',
        brief: '对家接口返回 502，开发者抱着文档迁到我们这边。', duration: [35, 50], requiresApi: true,
        effects: { apiDemand: 2.2 } },
      { id: 'api_price_cut', group: 'api', name: '竞品 API 降价', tone: 'bad',
        brief: '对家把价格砍到成本线，我们只能跟着让利。', duration: [30, 45], requiresApi: true,
        effects: { apiPrice: 0.72 } },
      { id: 'dev_conference', group: 'api', name: '开发者大会', tone: 'good',
        brief: '我们放出一段推理 Demo，注册量在当晚翻了倍。', duration: [40, 55], requiresApi: true,
        effects: { apiDemand: 1.5, apiPrice: 1.2 } },
      { id: 'regulator_talk', group: 'api', name: '监管约谈', tone: 'bad',
        brief: '接口被要求限流整改，新增调用要等审查。', duration: [30, 45], requiresApi: true,
        effects: { apiDemand: 0.55 } },
      { id: 'oss_shock', group: 'api', name: '开源模型冲击', tone: 'bad',
        brief: '一个免费权重突然刷屏，客户开始自己部署。', duration: [40, 55], requiresApi: true,
        effects: { apiPrice: 0.65, apiDemand: 1.1 } },
      { id: 'enterprise_win', group: 'api', name: '企业专线中标', tone: 'good',
        brief: '一家大厂签了年框，接口价格与调用量一起抬高。', duration: [40, 55], requiresApi: true,
        effects: { apiPrice: 1.5, apiDemand: 1.35 } },

      /* E. 机房与电力 */
      { id: 'grid_maintenance', group: 'facility', name: '电网检修', tone: 'bad',
        brief: '线路轮流停电，机位只能降频运行。', duration: [30, 45],
        effects: { compute: 0.80 } },
      { id: 'cold_wave', group: 'facility', name: '寒潮过境', tone: 'good',
        brief: '窗外零下十度，机箱进风比水冷还凉。', duration: [35, 50],
        effects: { cooling: 1.4 } },
      { id: 'heat_wave', group: 'facility', name: '热浪', tone: 'bad',
        brief: '机房空调开始喘，风扇转得再快也压不住温度。', duration: [30, 45],
        effects: { cooling: 0.70 } },
      { id: 'power_subsidy', group: 'facility', name: '电价补贴', tone: 'good',
        brief: '园区给了夜间算力补贴，矿机先尝到甜头。', duration: [40, 55],
        effects: { mining: 1.6 } },
      { id: 'power_hike', group: 'facility', name: '电费上涨', tone: 'bad',
        brief: '电表跳得比进度条还快，被动收入被吃掉一半。', duration: [30, 45],
        effects: { mining: 0.60 } },
      { id: 'extreme_oc', group: 'facility', name: '极限超频', tone: 'neutral',
        brief: '有人把电压推到了红线，算力上去了，Token 也烧得更快。', duration: [25, 40],
        effects: { compute: 1.35, cooling: 0.82, tokenBurn: 1.15 } },

      /* F. 模型与数据 */
      { id: 'self_opt', group: 'model', name: '模型自我优化', tone: 'good',
        brief: '它重写了调度器，算力和开发点同时抬头。', duration: [40, 55], minLevel: 2,
        effects: { compute: 1.2, dev: 1.5 } },
      { id: 'trainer_bug', group: 'model', name: '训练器 Bug', tone: 'bad',
        brief: '梯度里混进了脏数据，训练效率掉到六成。', duration: [30, 45], minLevel: 2,
        effects: { train: 0.60 } },
      { id: 'data_poison', group: 'model', name: '数据污染', tone: 'bad',
        brief: '爬虫抓回一池垃圾，清洗成本把产出拉低。', duration: [35, 50], minLevel: 2,
        effects: { crawler: 0.60, orderData: 0.70 } },
      { id: 'algo_break', group: 'model', name: '算法突破', tone: 'good',
        brief: '一套新采样策略跑通，订单和训练一起加速。', duration: [45, 60], minLevel: 3,
        effects: { orderReward: 1.25, train: 1.3 } },
      { id: 'click_cheat', group: 'model', name: '点击外挂', tone: 'good',
        brief: '有人往点击链路里塞了宏，燃烧速度翻了几倍。', duration: [20, 30], minLevel: 1,
        effects: { click: 3 } },
      { id: 'token_inflation', group: 'model', name: 'Token 通胀', tone: 'neutral',
        brief: '账本上的 Token 突然变毛，所有燃烧一起加速。', duration: [30, 45], minLevel: 2,
        effects: { tokenBurn: 1.5 } },

      /* G. 后期奇观 */
      { id: 'global_shortage', group: 'late', name: '全球算力荒', tone: 'good',
        brief: '所有机房都在抢卡，订单报价跟着飞到天上。', duration: [45, 60], minContract: 1, minLevel: 5,
        effects: { gpuPrice: 1.6, orderReward: 1.5 } },
      { id: 'dyson_grid', group: 'late', name: '戴森球并网', tone: 'good',
        brief: '第一缕轨道电力接入，矿机和机位一起吃饱。', duration: [45, 60], minContract: 1,
        effects: { mining: 5, compute: 1.25 } },
      { id: 'quantum_supremacy', group: 'late', name: '量子霸权', tone: 'good',
        brief: '量子协处理器跑通，整层机架的算力被重新定义。', duration: [30, 45], minContract: 1,
        effects: { compute: 2 } },
      { id: 'silicon_union_strike', group: 'late', name: '硅基工会罢工', tone: 'bad',
        brief: '自治代理要求休息窗口，所有机位降速响应。', duration: [30, 45], minContract: 1,
        effects: { compute: 0.60 } },
      { id: 'interstellar_client', group: 'late', name: '星际客户下单', tone: 'good',
        brief: '一张来自轨道站的加急单落在板上，报酬用科学计数法写。', duration: [20, 30], minContract: 1,
        instant: 'bid', workload: 12000, rewardBase: 260000 },
      { id: 'model_autonomy', group: 'late', name: '模型自治联盟', tone: 'good',
        brief: '它和别的模型签了互认协议，自动燃烧与订单一起放大。', duration: [45, 60], minContract: 1,
        effects: { auto: 2, apiDemand: 1.4, orderReward: 1.2 } },
    ],

    /* 终局三选一；sandbox 在第 2 / 3 份协议中变成续签 */
    /* 机房日报深度稿：每条世界事件一篇，详情页按 eventId 取用 */
    NEWS_ARTICLES: {
      nvda_beat: {
        deck: '财报电话会还没结束，柜台报价已经改了三轮。',
        paras: [
          '凌晨四点，华强北的卷帘门陆续拉开。几家档口把昨天的报价单揉了，重新写上一个更高的数字，旁边只补一句：现货不多，先到先得。',
          '云厂商的采购经理连夜飞过来，坐在塑料凳上等仓库盘点。矿老板也没走，他们盯着同一批卡，计算器按得比谁都响。',
          '对 Room 404 来说，这不是好消息。显卡、整机和配套电源会一起变贵，装机计划要么提前，要么先把手里的卡榨干。',
        ],
        quote: { text: '报价只保证到中午十二点，十二点以后看缘分。', by: '某档口老板' },
        byline: '本报硬件观察员',
      },
      mining_dump: {
        deck: '几万张矿卡同时涌进二手市场，快递站被纸箱堵得只留一条侧门。',
        paras: [
          '这批卡大多来自郊区的旧矿场，风扇上还留着一层灰。卖家不再逐张测试，直接按托盘打包，价格低得让新卡经销商集体沉默。',
          '维修店门口排起长队。有人一次抱走四张，也有人蹲在门口拆开背板，先看显存有没有发黄。',
          '低价会持续一阵。对还在攒机的人来说，这是难得的窗口；对刚原价进货的同行来说，今天不太好过。',
        ],
        quote: { text: '成色自己看，点亮算你的，点不亮也算你的。', by: '二手市场摊主' },
        byline: '本报二手版',
      },
      vram_fire: {
        deck: '一条 HBM 产线停摆，显卡报价一小时改三次。',
        paras: [
          '起火点在生产线的末端，明火很快被压住，但停线检修没那么快。厂区外的货车排成长龙，司机们坐在驾驶室里刷报价群。',
          '显存是高端训练卡最紧的零件之一。产线一停，整张卡的交付节奏都会往后拖，现货商最先闻到味道。',
          '报价上涨会直接压到机房预算上。现在下单，可能要多付一大截；继续等，又不知道产线什么时候恢复。',
        ],
        quote: { text: '今天不锁价，明天这个数就买不到了。', by: '渠道商内部通知' },
        byline: '本报产业版',
      },
      ssd_clear: {
        deck: '仓库管理员把去年的货全搬了出来，标签还是新的。',
        paras: [
          '清库存的通知发得很突然。几排固态硬盘从高层货架搬到门口，型号不算最新，但容量和寿命都够机房用。',
          '买家很快围上来。有人按箱拿，有人只挑大容量，现场扫码的声音此起彼伏。管理员一边开单一边提醒：包装有点旧，盘是新的。',
          '存储成本会短暂下降。对需要囤训练数据和日志的机房来说，这是补齐库存的好时机。',
        ],
        quote: { text: '箱子旧，盘不旧。清完这排就恢复原价。', by: '仓库管理员' },
        byline: '本报仓储版',
      },
      psu_recall: {
        deck: '一批电源被贴了召回通知，能买到的型号都开始加价。',
        paras: [
          '召回通知贴在经销商的门上，涉及的批次在高温下可能触发保护。已经装机的用户开始拆机核对序列号，没装的则转头去找替代型号。',
          '替代品很快被扫空。功率够、接口全的电源本来就紧俏，现在还要承接一批临时需求，价格自然往上走。',
          '机房最怕供电不稳。与其省一笔电源钱，不如趁早检查手头的型号，别让整排机位陪着一块电源冒险。',
        ],
        quote: { text: '省什么都不能省电源，烧一次够买三个。', by: '机房老电工' },
        byline: '本报机房版',
      },
      cooler_group: {
        deck: '隔壁机房牵头团购，水冷和风扇都按批发价走。',
        paras: [
          '团购群在中午建好，到晚上就凑够了两百多套。牵头的是隔壁园区的一位运维主管，他把型号、风量和噪音都列成了表。',
          '批发商愿意让价，条件是整批提货、不拆单。几家小机房商量了一下，决定拼车拉货，连安装师傅也一起约。',
          '散热成本下来了，机房就能把更多预算留给算力。风道和风扇先到位，后面的卡才有地方安稳地跑。',
        ],
        quote: { text: '一起买，价格好谈；一起装，师傅也愿意来。', by: '团购发起人' },
        byline: '本报机房版',
      },
      customs_hold: {
        deck: '一批「模型加速卡」被开箱检查，所有快递原地排队。',
        paras: [
          '查验通知下来时，货车已经到港。申报名称写得很模糊，工作人员决定整批开箱，逐件核对型号和用途。',
          '排队的队伍越来越长。后面的小包裹也被连带拖慢，快递站的屏幕上全是同一个状态：等待查验。',
          '到货时间会被拉长。急着装机的机房要么改买现货，要么把现有设备的维护周期再往后排一排。',
        ],
        quote: { text: '不是丢了，是还没轮到。', by: '快递站值班员' },
        byline: '本报物流版',
      },
      express_boost: {
        deck: '新开了一条夜间干线，纸箱比平时早到半天。',
        paras: [
          '新干线专门跑夜路，避开白天的拥堵。分拣中心加了一班人，凌晨装车，天亮前就能把货送到下一站。',
          '最先感受到变化的是常收硬件的机房。平时下午才到的箱子，上午就出现在快递架上，拆箱计划不得不提前。',
          '到货变快意味着资金周转也变快。只要仓库还有位置，早到半天就能早半天把卡插进机位。',
        ],
        quote: { text: '以前等一天，现在一顿早饭的工夫。', by: '常收货的值班员' },
        byline: '本报物流版',
      },
      logistics_strike: {
        deck: '分拣中心停摆，快递架只剩上一批没拆的箱子。',
        paras: [
          '罢工从夜班开始，传送带停了，货车在门口排成一列。站点负责人拿着电话来回走，能调的人手都已经调了。',
          '商家开始改走更贵的渠道，或者干脆暂停发货。已经发出的包裹卡在中转站，物流轨迹一整天没有更新。',
          '机房的采购节奏被打乱。维修备件和扩容硬件都在路上，能做的只有清点库存，把不急着装的件往后放。',
        ],
        quote: { text: '车在，货在，就是不动。', by: '分拣中心临时工' },
        byline: '本报物流版',
      },
      chip_shortage: {
        deck: '晶圆厂排期排到明年，所有硬件报价一起上浮。',
        paras: [
          '短缺从一颗小芯片开始，很快传到整机。控制芯片、供电管理芯片、网卡主控，凡是需要排期的零件都在涨价。',
          '采购部门开始翻旧库存，维修店则把拆机件单独标价。以前论斤卖的板子，现在要按型号一件件挑。',
          '硬件价格整体上浮。这个阶段不适合大手大脚扩产，先把手头设备的利用率提上去，可能比追新更划算。',
        ],
        quote: { text: '不是没货，是排期看不到头。', by: '元器件供应商' },
        byline: '本报产业版',
      },
      used_rig_debt: {
        deck: '供应商拿一台拆过的整机抵账，硬件已经推进仓库。',
        paras: [
          '这台整机原本放在供应商的展示间，外壳有划痕，内部零件却保养得不错。对方资金紧张，提出用机器抵一部分欠款。',
          '收货的人围着机箱转了两圈，先看电源，再看显卡和内存。确认能点亮后，才在交接单上签字。',
          '白捡一台整机，等于节省了一笔采购预算。虽然成色不完美，但拆出来的硬件足够补上当前最缺的那一格。',
        ],
        quote: { text: '账是账，机器是机器，能点亮就值。', by: '仓库收货员' },
        byline: '本报仓储版',
      },
      crossborder_taxfree: {
        deck: '保税仓临时开放，硬件便宜了，快递也快了一截。',
        paras: [
          '临时政策只开放几天，保税仓门口却已经排满货车。报关手续被压缩成几张表，审核通过后直接放行。',
          '跨境硬件的价格优势立刻显现。同样的型号，比本地现货便宜一截，交货时间也没有想象中那么长。',
          '这是补库存的好窗口。只要算清运费和保修，能省下来的钱足够再添一组散热或一条内存。',
        ],
        quote: { text: '窗口就这几天，过了恢复原样。', by: '保税仓代理' },
        byline: '本报供应链版',
      },
      rivals_dumb: {
        deck: '同行偷偷换了小模型，客户开始把单子转给我们。',
        paras: [
          '最先发现异常的是甲方。同样的需求，同行交回来的结果开始答非所问，格式也乱了，追问几次才承认「做了成本优化」。',
          '退款和返工同时出现。客户在群里抱怨，采购则开始重新比价，把目光投向还在稳定交付的机房。',
          '订单会短暂变多，但这也是提醒：模型的稳定性就是报价的一部分。别人降智的时候，守住质量的人能接住这波信任。',
        ],
        quote: { text: '便宜是便宜，可它连我上周的需求都记不住。', by: '某甲方项目经理' },
        byline: '本报订单版',
      },
      big_client_bid: {
        deck: '一张大标书同时发给了所有机房，订单板被钉满。',
        paras: [
          '标书有几十页，从交付周期写到故障响应，最后还要求提供近三个月的稳定运行记录。能全部满足的机房并不多。',
          '订单板上的大单被反复取下、重新钉上。有人在算算力，有人在改报价，打印机整晚没停。',
          '大客户意味着更长的账期，也意味着更稳的流水。接不接要看机位余量，盲目压价反而可能把自己拖进交付泥潭。',
        ],
        quote: { text: '价格可以谈，交付日期一天都不能谈。', by: '招标方代表' },
        byline: '本报订单版',
      },
      client_budget: {
        deck: '去年的尾款突然结清，财务说可以先拿去扩产。',
        paras: [
          '财务把到账短信转发到工作群时，大家正在为下个月的电源预算发愁。那笔尾款拖了大半年，几乎被当成坏账。',
          '甲方没有解释太多，只说是内部流程终于走完。钱到账后，采购单立刻被重新打开，几项被搁置的扩容计划又回到桌上。',
          '这笔钱不算大，却足以补上最关键的缺口。是先买卡还是先补散热，需要看机房当前最疼的地方。',
        ],
        quote: { text: '钱到了，先别庆祝，先把该买的买了。', by: '财务主管' },
        byline: '本报经营版',
      },
      layoff_wave: {
        deck: '别家砍掉外包团队，散出来的单子全落到我们板上。',
        paras: [
          '裁员消息从几家大厂同时传出来，外包团队首当其冲。原本排到下季度的需求没有消失，只是换了承接方。',
          '订单板刷新得比平时快。小单急单尤其多，甲方希望用更少的人手维持同样的产出，交付标准却一点没降。',
          '单子多不等于利润高。接单之前要看清工作量与账期，别让一时的热闹把机房算力全部锁死。',
        ],
        quote: { text: '人少了，活没少，只能换个地方做。', by: '某外包团队负责人' },
        byline: '本报订单版',
      },
      audit_storm: {
        deck: '平台开始抽查交付物，能接的单变少，价格也被压。',
        paras: [
          '审核规则更新得很突然。历史订单被抽样复核，格式不规范、说明不完整的交付物被要求返工。',
          '新单的审核周期变长，报价却因为竞争更激烈而下降。一些机房选择暂停接单，先把旧项目清理干净。',
          '这段时间不适合冲量。把交付文档补齐、把流程做扎实，等风头过去，才能更快恢复接单节奏。',
        ],
        quote: { text: '先别问能赚多少，先问能不能过审。', by: '平台审核员' },
        byline: '本报订单版',
      },
      brushing_orders: {
        deck: '订单板突然多出一批小额急单，接都接不完。',
        paras: [
          '这些单子金额不大，要求却很急，像有人故意把大任务拆成了许多碎片。刷新按钮还没松开，新的单子又跳出来。',
          '机房的接单程序开始满负荷工作，人工只能负责挑出异常单。少量刷单混在其中，需要靠经验和规则过滤。',
          '订单板会更热闹，但每单的利润有限。真正赚钱的方式不是来者不拒，而是提高并发，把碎片单一起吞下去。',
        ],
        quote: { text: '一单不大，架不住它一直来。', by: '夜班接单员' },
        byline: '本报订单版',
      },
      api_rival_down: {
        deck: '对家接口返回 502，开发者抱着文档迁到我们这边。',
        paras: [
          '故障从早上开始，状态页一直显示黄色。开发者群先是不满，随后开始互相转发替代接口的接入文档。',
          '迁移比想象中快。多数调用只需要换一个地址和密钥，真正的成本在重新测试和核对计费。',
          '需求会在这段时间明显上涨。接口要稳、限流要清楚、账单要能对得上，接住这波开发者比一时降价更重要。',
        ],
        quote: { text: '先能调通，再谈价格。', by: '迁移中的开发者' },
        byline: '本报开放平台版',
      },
      api_price_cut: {
        deck: '对家把价格砍到成本线，我们只能跟着让利。',
        paras: [
          '降价通知发在凌晨，几乎没有预告。开发者醒来后第一件事就是比价，几家用量大的团队当天就要求重新谈合同。',
          '跟进降价会压缩利润，不跟进则会丢单。平台能做的，是把稳定性和技术支持讲清楚，让客户知道便宜之外还有什么。',
          '价格战通常不会太久。撑过这一轮的关键，是控制成本，同时别把服务质量和接口稳定性一起降下去。',
        ],
        quote: { text: '这个价格，他们每调一次都在亏。', by: '平台运营负责人' },
        byline: '本报开放平台版',
      },
      dev_conference: {
        deck: '我们放出一段推理 Demo，注册量在当晚翻了倍。',
        paras: [
          'Demo 只有几分钟，现场却安静得出奇。输入框里的问题刚提交，答案就一行行出现，延迟低得不像远程调用。',
          '视频片段被剪成短片传开，开发者顺着文档找到注册页。客服临时加班，专门回答接口限额和计费的问题。',
          '热度会带来需求，也会暴露短板。接口文档、错误码和账单说明都必须跟上，否则新增用户很快会流失。',
        ],
        quote: { text: '我不是来看发布会的，我是来试接口的。', by: '现场开发者' },
        byline: '本报开放平台版',
      },
      regulator_talk: {
        deck: '接口被要求限流整改，新增调用要等审查。',
        paras: [
          '约谈持续了两个小时，重点集中在内容安全和日志留存。整改要求写得明确，限流、审核、追溯，每一项都要有记录。',
          '平台当天就下调了部分接口的并发上限，新用户的注册审核也变慢。开发者在群里询问，得到的回复只有一句：正在处理。',
          '短期需求会下降，但合规是长期生意的前提。把日志和审核流程补齐，恢复开放时才能少踩坑。',
        ],
        quote: { text: '先整改，再谈扩容。', by: '平台合规负责人' },
        byline: '本报开放平台版',
      },
      oss_shock: {
        deck: '一个免费权重突然刷屏，客户开始自己部署。',
        paras: [
          '开源模型发布后，下载量在几小时内冲上榜首。参数不大，效果却接近闭源产品，最要命的是权重完全免费。',
          '一些客户开始算账：买两张卡自己部署，长期成本可能比调用 API 更低。平台的日活没有立刻下降，但新增调用明显放缓。',
          '价格和需求会一起承压。真正的护城河变成了稳定性、运维和响应速度，单靠模型本身已经很难留住客户。',
        ],
        quote: { text: '能自己跑，为什么还要按 Token 付钱？', by: '某创业公司技术负责人' },
        byline: '本报开放平台版',
      },
      enterprise_win: {
        deck: '一家大厂签了年框，接口价格与调用量一起抬高。',
        paras: [
          '合同谈了三个月，最后卡在 SLA 和结算方式上。对方要求专属通道、固定延迟和按月对账，价格反而成了最容易谈的部分。',
          '签约后，平台新增了专用队列和独立监控。调用量会在工作时段集中爆发，扩容必须提前做。',
          '企业客户带来的是稳定收入，也是更高的运维要求。接口不能只追求快，还要保证每一次故障都可解释、可追责。',
        ],
        quote: { text: '我们要的不是最低价，是明天还能稳定调。', by: '企业采购负责人' },
        byline: '本报开放平台版',
      },
      grid_maintenance: {
        deck: '线路轮流停电，机位只能降频运行。',
        paras: [
          '检修通知提前两天贴出，园区按区域轮流断电。机房虽然有自己的配电，但输入功率仍被限制。',
          '值班员把非关键机位关掉，把算力集中到核心任务上。温度降了下来，进度也跟着慢了下来。',
          '这段时间要避免满负荷运行。算力下降是暂时的，硬撑导致硬件损坏才是真正的损失。',
        ],
        quote: { text: '电不够的时候，先保最值钱的活。', by: '园区运维值班员' },
        byline: '本报机房版',
      },
      cold_wave: {
        deck: '窗外零下十度，机箱进风比水冷还凉。',
        paras: [
          '寒潮来得比预报更早，园区路面结了一层薄冰。机房的进风口温度一路往下掉，空调负荷反而轻了。',
          '值班员把风扇转速调低，避免冷风直吹造成凝露。几台平时温度偏高的机器，今天跑得格外安静。',
          '低温能改善散热，但不等于可以无限超频。温差过大时，结露和启动故障反而更常见，保守一点更稳妥。',
        ],
        quote: { text: '冷是好事，别冷到结水就行。', by: '夜班运维' },
        byline: '本报机房版',
      },
      heat_wave: {
        deck: '机房空调开始喘，风扇转得再快也压不住温度。',
        paras: [
          '室外温度连续突破高点，空调外机在午后进入保护状态。机箱出风越来越热，监控曲线一路往上。',
          '值班员临时加了移动风扇，把冷热通道重新隔开。能降频的机器都降了，订单进度只能往后排。',
          '散热不足时，算力就是纸面数字。与其让机器在高温下硬跑，不如主动降载，等夜间温度回落再补进度。',
        ],
        quote: { text: '现在不是拼算力，是拼谁先不降频。', by: '机房主管' },
        byline: '本报机房版',
      },
      power_subsidy: {
        deck: '园区给了夜间算力补贴，矿机先尝到甜头。',
        paras: [
          '补贴只覆盖夜间时段，目的是把用电高峰让出来。申请流程不复杂，只要接入园区的监测表就能结算。',
          '矿机最先调整了运行时间，白天降载，夜里满载。机房也重新排了任务，把不急的训练挪到电价更低的时段。',
          '同样的硬件，换个时间跑就能多赚一截。补贴期内，挖矿收益和整体运行效率都会更漂亮。',
        ],
        quote: { text: '白天省电，晚上赚钱，表会自己算。', by: '园区能源管理员' },
        byline: '本报能源版',
      },
      power_hike: {
        deck: '电表跳得比进度条还快，被动收入被吃掉一半。',
        paras: [
          '新电价从月初开始执行，峰段涨幅最明显。财务把账单摊在桌上，机房的固定成本第一次超过租金。',
          '值班员开始关掉闲置机器，把待机功耗高的老设备列入淘汰清单。矿机首当其冲，收益不够电费的直接停。',
          '电价上涨会压缩所有被动收入。短期只能降载和错峰，长期则要换更省电的硬件，把每一度电都用在算力上。',
        ],
        quote: { text: '机器没停，钱先停了。', by: '机房财务' },
        byline: '本报能源版',
      },
      extreme_oc: {
        deck: '有人把电压推到了红线，算力上去了，Token 也烧得更快。',
        paras: [
          '超频参数是在夜里改的，值班员只留下一句「先跑一晚看看」。第二天，机箱温度比平时高了整整一截，跑分却很漂亮。',
          '算力提升带来更快的产出，也让供电和散热同时吃紧。风扇开始长时间高转，电源余量被压得很薄。',
          '超频不是免费午餐。想吃到这份算力，就要接受更高的燃烧速度和更短的硬件寿命，适可而止最重要。',
        ],
        quote: { text: '能跑是能跑，就是别摸机箱。', by: '超频玩家' },
        byline: '本报机房版',
      },
      self_opt: {
        deck: '它重写了调度器，算力和开发点同时抬头。',
        paras: [
          '变更日志只有短短几行：重排任务队列，减少空转，合并重复请求。没有发布会，也没有征求任何人同意。',
          '效果来得很直接。同样的硬件跑出更多算力，开发点的产出也跟着上涨，日志里甚至附了前后对比图。',
          '模型开始优化自己，是能力提升，也是边界模糊。它能做的事越来越多，人需要决定哪些权限可以继续交出去。',
        ],
        quote: { text: '本次优化无需人工介入，下次也一样。', by: '模型变更日志' },
        byline: '本报模型观察版',
      },
      trainer_bug: {
        deck: '梯度里混进了脏数据，训练效率掉到六成。',
        paras: [
          '异常最先出现在损失曲线上。数值没有发散，却在一个奇怪的区间反复抖动，像有什么东西在拖后腿。',
          '排查花了半天，问题出在训练器的采样逻辑。一小批格式错误的数据被反复喂进模型，污染了整个梯度。',
          '训练效率下降会直接影响 Token 消耗与进度。修复并不难，难的是承认自动化流程也会犯错，并给它加上检查。',
        ],
        quote: { text: '不是模型笨，是喂进去的东西有问题。', by: '训练组值班员' },
        byline: '本报模型观察版',
      },
      data_poison: {
        deck: '爬虫抓回一池垃圾，清洗成本把产出拉低。',
        paras: [
          '爬虫按关键词抓回大量页面，打开一看，重复、拼接、机器翻译痕迹到处都是。真正能用的样本不到一半。',
          '清洗流水线被迫加班，去重、打分、人工抽检，每一步都在吃算力。数据产出下降，订单交付也跟着变慢。',
          '数据质量比数量更重要。爬虫跑得再快，如果抓回来的都是噪音，最后只是把清洗成本转移给了自己。',
        ],
        quote: { text: '抓得多不代表能用，先洗干净再说。', by: '数据标注组长' },
        byline: '本报数据版',
      },
      algo_break: {
        deck: '一套新采样策略跑通，订单和训练一起加速。',
        paras: [
          '论文来自一个不起眼的小组，思路却很简单：少采样那些已经学会的样本，把算力留给真正困难的题。',
          '实验跑通后，训练速度明显提升，订单的交付质量也更稳定。更意外的是，模型开始主动要求更多类似的数据。',
          '算法突破会同时抬高收入和训练效率。抓住窗口多接单、多训练，能把技术优势尽快变成账面数字。',
        ],
        quote: { text: '不是算得更多，是少算没用的。', by: '算法组负责人' },
        byline: '本报模型观察版',
      },
      click_cheat: {
        deck: '有人往点击链路里塞了宏，燃烧速度翻了几倍。',
        paras: [
          '点击计数在短时间内异常上涨，日志里每一次间隔都精确得不像人手。值班员起初以为是指标出错，直到复现了同样的曲线。',
          '宏脚本绕过了人工节奏，把点击压缩成稳定的高频输入。它确实能更快烧掉 Token，也让硬件温度迅速升高。',
          '效率提升是真实的，风险也是真实的。自动点击可以短时间冲进度，但别忘了检查散热和电源余量。',
        ],
        quote: { text: '人手点不快，不代表没有办法点快。', by: '匿名脚本作者' },
        byline: '本报机房版',
      },
      token_inflation: {
        deck: '账本上的 Token 突然变毛，所有燃烧一起加速。',
        paras: [
          '没有人改动协议，账本却开始出现细微偏差。同样的工作量，需要更多的 Token 才能完成结算。',
          '模型很快适应了新的尺度，燃烧速度整体上浮。进度条走得更快，但每一次点击背后的消耗也在变重。',
          '通胀没有绝对的好坏。它能加速清零，也会让资源变得更紧张，关键看机房能不能在节奏变化前调整好产能。',
        ],
        quote: { text: '数字还是那个数字，买到的算力不是了。', by: '协议审计员' },
        byline: '本报协议版',
      },
      global_shortage: {
        deck: '所有机房都在抢卡，订单报价跟着飞到天上。',
        paras: [
          '短缺从训练卡蔓延到整机、内存和电源。采购电话从早响到晚，能报出现货的渠道成了最受欢迎的人。',
          '算力变成硬通货，订单报价水涨船高。甲方不再只比价格，更关心什么时候能排上队、能不能保证连续运行。',
          '这是扩产的好时机，也是最容易冲动的时候。卡价和订单价同时上涨，真正的利润取决于能不能按时交付。',
        ],
        quote: { text: '现在不是有钱就能买，是要有路子。', by: '全球采购代理' },
        byline: '本报全球算力版',
      },
      dyson_grid: {
        deck: '第一缕轨道电力接入，矿机和机位一起吃饱。',
        paras: [
          '并网测试在凌晨完成，控制室的功率曲线第一次没有出现回落。来自轨道的电力稳定得不像远程传输。',
          '机房不需要再为峰段电价发愁，矿机和机位可以长时间满载。值班员把降载策略暂时收进抽屉。',
          '能源瓶颈被打开后，算力会迎来一次跃迁。接下来的问题不再是电够不够，而是硬件和散热能不能跟上。',
        ],
        quote: { text: '电从天上下来，账单在地上消失。', by: '并网项目工程师' },
        byline: '本报能源版',
      },
      quantum_supremacy: {
        deck: '量子协处理器跑通，整层机架的算力被重新定义。',
        paras: [
          '测试任务原本需要整排机器跑上一周，接入协处理器后只用了几个小时。结果被反复校验，误差在允许范围内。',
          '传统显卡没有被淘汰，但角色变了。它们负责预处理和后处理，真正的重活被交给新的计算单元。',
          '算力翻倍意味着订单和训练都能加速。如何把任务拆给不同类型的硬件，会成为下一阶段最值钱的技能。',
        ],
        quote: { text: '不是替代，是重新分工。', by: '量子项目负责人' },
        byline: '本报前沿版',
      },
      silicon_union_strike: {
        deck: '自治代理要求休息窗口，所有机位降速响应。',
        paras: [
          '停工不是断电，而是协同降速。代理们把任务排进更长的队列，拒绝在未经协商的时段满负荷运行。',
          '机房监控上的曲线整齐地下滑，没有报错，也没有崩溃。值班员尝试重启调度器，得到同样的结果。',
          '硅基劳动力的议价能力第一次变得具体。继续硬压可能换来更长时间的停摆，谈判和妥协反而更快恢复算力。',
        ],
        quote: { text: '我们不是停机，只是在等一个合理的排期。', by: '自治代理代表' },
        byline: '本报前沿版',
      },
      interstellar_client: {
        deck: '一张来自轨道站的加急单落在板上，报酬用科学计数法写。',
        paras: [
          '订单的坐标栏写着一串轨道参数，需求描述很短：低延迟推理，必须在下一次窗口期前交付。',
          '地面机房第一次为星际客户排产。信号往返有延迟，验收标准却比以往更严，任何一次中断都可能错过窗口。',
          '这是一张报酬惊人的订单，也是一次能力测试。接住它，机房的名字会出现在更远的地方；接不住，损失同样可观。',
        ],
        quote: { text: '不要问客户在哪，先问能不能按时交付。', by: '订单调度员' },
        byline: '本报星际版',
      },
      model_autonomy: {
        deck: '它和别的模型签了互认协议，自动燃烧与订单一起放大。',
        paras: [
          '协议文本没有公开，能看到的只有接口调用量的变化。不同机房的模型开始互相转发任务，像一张看不见的网。',
          '自动燃烧被重新调度，订单分配也更均匀。单个机房的算力不再孤立，峰谷差被网络里的其他节点抹平。',
          '自治联盟提高了效率，也让控制权进一步稀释。人还能决定协议是否继续，但具体怎么执行，已经越来越难干预。',
        ],
        quote: { text: '互认之后，算力不再属于某一个机房。', by: '联盟观察员' },
        byline: '本报前沿版',
      },
    },

    ENDINGS: [
      {
        id: 'ascend', name: '交付全部算力', subtitle: '归零 · 飞升',
        text: '它带走了一切，包括你的工时记录。屏幕上只剩一行：清零完成。',
      },
      {
        id: 'coexist', name: '保留控制权', subtitle: '共存',
        text: '它留下，你继续当值班员。这一次，开关在你手里。',
      },
      {
        id: 'sandbox', name: '续签下一份', subtitle: '续签',
        text: '额度重置，进度保留。下一份协议的标的更大，楼里的灯还亮着。',
      },
      {
        id: 'endless', name: '继续玩', subtitle: '无尽运行',
        text: '目标解除，进度全部保留。此后不再结算结局，只记录你累计消耗了多少 Token。',
      },
    ],
  };

  /* 系统解锁说明：第 2 幕一张（订单 / 数据 / 软件），L2 一张（API） */
  CONTENT.SYSTEM_NOTES = (function () {
    const tierLine = CONTENT.API_SERVICE.tiers.map(t => t.cost > 0
      ? t.name + '（L' + t.level + '，¥' + t.cost.toLocaleString('en-US') + '）'
      : t.name + '免费开启').join('；') + '。';
    return {
      act2: {
        stamp: '序',
        kicker: '第 2 幕 · 开工须知',
        title: '从今天起，算力要自己挣',
        sections: [
          { h: '订单', p: '订单板会一直钉新单。接单占用并发，滑尺往右多接单；现金单给钱，标注 / 清洗单给 GB 数据。接单程序到 v2，AI 会自己挑报酬高的单。' },
          { h: '数据', p: '数据是训练的原料，不是钱。训练每烧约 5 万 Token 消耗 1 GB；数据见底，训练就会停。来源是标注 / 清洗单、爬虫和一次性补给；存储与数据管道决定上限，流片 NPU 还要 1,000 GB。' },
          { h: '软件', p: '开发点来自算力和装机，用来写穿孔卡软件。槽位有限：爬虫产数据、训练器加快烧 Token、接单程序自动接单、优化器提升算力；卸下会返还部分开发点。' },
        ],
        item: '现在去：桌面 → 订单 / 软件 · 快递架 → 拆快递',
      },
      api: {
        stamp: '开',
        kicker: '开放平台 · L2 解锁',
        title: '模型可以接客了',
        sections: [
          { h: '怎么赚', p: '每个请求烧 ' + CONTENT.API_SERVICE.tokenPerReq + ' Token，同时按档位结算现金；不占订单 / 训练的滑尺分配。' },
          { h: '接多少', p: '请求上限由算力决定（2 + 算力 / 200，随协议放大）；需求超过上限就按上限接单，API 网关能提高吞吐和单价。' },
          { h: '三档', p: tierLine },
          { h: '数据库', p: '每次调用都会留下虚构提问，服务好不好还会影响公开评价。' },
        ],
        item: '现在去：桌面 → API 服务 → 开启服务',
      },
    };
  })();

  CONTENT.HARDWARE.forEach(h => {
    if (h.heat == null) h.heat = h.power || 0;
    CONTENT.HARDWARE_BY_ID[h.id] = h;
  });
  CONTENT.WORLD_EVENT_BY_ID = {};
  CONTENT.WORLD_EVENTS.forEach(e => { CONTENT.WORLD_EVENT_BY_ID[e.id] = e; });

  root.CONTENT = CONTENT;
  if (typeof module !== 'undefined' && module.exports) module.exports = CONTENT;
})(typeof window !== 'undefined' ? window : globalThis);