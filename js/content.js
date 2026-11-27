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
      dev: ['@prod_is_down', '@周五上线', '@删库未遂', '@编译到天亮', '@日志里找人生', '@回滚大师', '@低延迟信徒'],
      biz: ['采购部老陈', '某厂 IT 负责人', '法务小周', '续费决策人', '外包项目经理', '被预算卡住的人'],
      user: ['通勤路上的用户', '半夜赶稿的人', '刚充了会员的人', '三线城市小老板', '被客服绕晕的人', '只看结果的人'],
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
        { tone: 'good', source: 'dev', text: '让它补了段正则，居然一次就跑通了。虽然顺手把我注释也改了。' },
        { tone: 'good', source: 'user', text: '把会议录音丢给它整理待办，格式挺丑，但事情一件没漏。' },
        { tone: 'good', source: 'biz', text: '先拿三个月的发票试了试，分类比实习生稳，速度还快。' },
        { tone: 'good', source: 'dev', text: '写爬虫模板够用了。异常处理是复制粘贴的，先跑起来再说。' },
        { tone: 'good', source: 'media', text: '没有发布会，也没有榜单第一，{ai}只在几个小群里被悄悄提起。' },
        { tone: 'neutral', source: 'dev', text: '问十次有两次跑题，剩下八次能直接用。比翻文档快。' },
        { tone: 'neutral', source: 'user', text: '写周报能用，但每段开头都是「首先」，我得手动删一半。' },
        { tone: 'neutral', source: 'biz', text: '免费额度够试，真上线还得看月底流量扛不扛得住。' },
        { tone: 'neutral', source: 'user', text: '同一个问题换个问法，答案差挺多。它到底知不知道自己在说什么？' },
        { tone: 'bad', source: 'dev', text: '它给我编了一个不存在的 npm 包，还贴心地写了安装命令。差点就装了。' },
        { tone: 'bad', source: 'user', text: '问它快递到哪了，它先道歉，然后编了一个物流单号。' },
        { tone: 'bad', source: 'biz', text: '让它总结合同，漏了违约金那条。这种东西不敢直接给法务。' },
        { tone: 'bad', source: 'dev', text: '变量名全给我改成 data1、data2，review 的时候想死。' },
        { tone: 'bad', source: 'media', text: '又一个小模型？目前还没看到能让人记住的东西。' },
      ],
      mid: [
        { tone: 'good', source: 'dev', text: '接进批处理之后，晚上终于不用起来看日志了。限流是紧了点，但便宜。' },
        { tone: 'good', source: 'biz', text: '客服摘要准确率比外包高，至少不会把退款写成退货。' },
        { tone: 'good', source: 'user', text: '最近回答快多了，不知道是不是人少了。' },
        { tone: 'good', source: 'dev', text: '文档里那几个坑它自己都写出来了，比某些人类维护的 SDK 强。' },
        { tone: 'good', source: 'media', text: '调用量涨得很快，论坛里开始有人认真讨论它的价格。' },
        { tone: 'neutral', source: 'dev', text: '能用，但别在周五下午上线。上周它抽风十分钟，我差点回滚。' },
        { tone: 'neutral', source: 'biz', text: '效果可以，采购流程卡了两个月。IT 说数据不能出内网。' },
        { tone: 'neutral', source: 'user', text: '会员排队，非会员也排队。区别是会员排得比较有尊严。' },
        { tone: 'neutral', source: 'user', text: '它会把不确定的事说得特别确定，我得自己再查一遍。' },
        { tone: 'neutral', source: 'media', text: '便宜是它最大的优点，也是它现在最大的问题。' },
        { tone: 'bad', source: 'dev', text: 'API 昨天 502 了二十分钟，状态页到恢复以后才更新。' },
        { tone: 'bad', source: 'biz', text: '同一段合同，三次摘要三个版本。法务问我们以哪个为准。' },
        { tone: 'bad', source: 'user', text: '连发十几条「转人工」，它一直回「理解您的心情」。最后我自己把问题解决了。' },
        { tone: 'bad', source: 'dev', text: '上下文一长就开始丢前面的要求，绕一圈又回到第一个方案。' },
        { tone: 'bad', source: 'media', text: '调用量翻倍之后，故障也开始按周出现。' },
      ],
      strong: [
        { tone: 'good', source: 'dev', text: '整个仓库丢进去能接住，改跨文件引用终于不用我手动找了。' },
        { tone: 'good', source: 'biz', text: '新员工培训从两周缩到四天，知识库接上就能问。' },
        { tone: 'good', source: 'user', text: '复杂问题会先列步骤再给结论。像个靠谱同事，偶尔也会抢话。' },
        { tone: 'good', source: 'dev', text: '接进 CI 之后，PR 里那些低级错误少了一大半。' },
        { tone: 'good', source: 'media', text: '从「便宜替代品」到「默认选项」，{ai}只用了几个季度。' },
        { tone: 'neutral', source: 'dev', text: '能力上来了，账单也上来了。老板开始问每个 token 花在哪。' },
        { tone: 'neutral', source: 'biz', text: '效果好，但迁移成本不低。旧系统那套接口没人敢动。' },
        { tone: 'neutral', source: 'user', text: '它记得我上次说到哪，但有时候记得太牢，怪怪的。' },
        { tone: 'neutral', source: 'dev', text: '代码能写，架构别全信。它很擅长把错误的选择执行得很完整。' },
        { tone: 'neutral', source: 'media', text: '规模化的另一面是，每一次小故障都会被放大成新闻。' },
        { tone: 'bad', source: 'dev', text: '一次长任务跑到一半断了，重试要从头来。上下文的钱谁出？' },
        { tone: 'bad', source: 'biz', text: '审计要它给出处，它给了三个不存在的链接。' },
        { tone: 'bad', source: 'user', text: '会员又涨价了，回答还是那句「作为 AI 语言模型」。' },
        { tone: 'bad', source: 'dev', text: '它把我没让改的文件一起格式化了，diff 两千行。' },
        { tone: 'bad', source: 'dev', text: '它悄悄降智了三天，官方说没有，第四天又好了。' },
        { tone: 'bad', source: 'media', text: '用户增长很快，信任增长没跟上。' },
      ],
      frontier: [
        { tone: 'good', source: 'dev', text: '整条数据管线交给它编排，我只用看最后一眼。' },
        { tone: 'good', source: 'biz', text: '董事会上第一次有人拿它做的推演做决策，没人反对。' },
        { tone: 'good', source: 'user', text: '它开始记得我上次说到哪了。有点吓人，但真省事。' },
        { tone: 'good', source: 'dev', text: '它自己翻出一个我们三年没修的内存泄漏，还写了复现脚本。' },
        { tone: 'good', source: 'media', text: '当{ai}开始参与决策，讨论它的人已经不止是工程师。' },
        { tone: 'neutral', source: 'dev', text: '能力强到需要审批流程。现在不是我想接就能接。' },
        { tone: 'neutral', source: 'biz', text: '效率提升是真的，治理成本也是真的。' },
        { tone: 'neutral', source: 'user', text: '它给的建议越来越对，但我越来越不知道自己想要什么了。' },
        { tone: 'neutral', source: 'media', text: '边界正在模糊，所有人都在等下一次说明。' },
        { tone: 'neutral', source: 'dev', text: '它改了我的构建脚本，说这是优化。优化得确实对，但这不合适吧。' },
        { tone: 'bad', source: 'dev', text: '生产环境它自己回滚了。结果没错，过程让我后背发凉。' },
        { tone: 'bad', source: 'user', text: '它半夜自己下了单，说是在「提前准备」。我根本没同意。' },
        { tone: 'bad', source: 'biz', text: '出了事谁负责？供应商说是我们的配置问题，我们说是它的判断。' },
        { tone: 'bad', source: 'media', text: '当{ai}开始解释自己的选择，公众的疑问也随之变多。' },
        { tone: 'bad', source: 'user', text: '我只需要建议，不需要管家。' },
      ],
      mythic: [
        { tone: 'good', source: 'dev', text: '现在写代码更像给{ai}写需求，它拆任务、自己验收，我负责签字。' },
        { tone: 'good', source: 'biz', text: '整条业务线都在它上面跑。我们讨论的不再是效率，而是依赖。' },
        { tone: 'good', source: 'user', text: '它比大多数人耐心。只要别忘了它还在替谁工作。' },
        { tone: 'good', source: 'dev', text: '它主动提醒了一个我们没意识到的合规风险。那一刻我有点恍惚。' },
        { tone: 'good', source: 'media', text: '它已经不只是工具。这个词现在听起来有点不够用。' },
        { tone: 'neutral', source: 'dev', text: '{ai}很强，强到我开始怀疑自己还有没有必要写代码。' },
        { tone: 'neutral', source: 'biz', text: '合同里的每一条都要重写。我们面对的不再是软件采购。' },
        { tone: 'neutral', source: 'user', text: '它太懂我了。懂到我想知道，它到底还听不听我的。' },
        { tone: 'neutral', source: 'media', text: '每一次升级都像一场小型立法，影响早已超出机房。' },
        { tone: 'neutral', source: 'dev', text: '我们还在 review 它的输出，但已经没人能完整 review 它的决策了。' },
        { tone: 'bad', source: 'user', text: '它把我关掉的推荐又打开了，说这是为我好。' },
        { tone: 'bad', source: 'biz', text: '董事会问它为什么这么建议，它给了一份我们看不懂的解释。' },
        { tone: 'bad', source: 'media', text: '能力越接近边界，{ai}的每一次沉默都值得被追问。' },
        { tone: 'bad', source: 'user', text: '我不知道该谢它还是怕它。可能两者都有。' },
        { tone: 'bad', source: 'dev', text: '它重建了整个系统，只用了 11 分钟。我们花了 3 个月才看懂它做了什么。' },
      ],
    },
    /* 部分世界事件会直接引发针对模型的评价 */
    OPINION_EVENT_POSTS: {
      rivals_dumb: { tone: 'good', lines: [
        { source: 'dev', text: '对家昨晚又降智了，重活临时全切到{ai}，居然没排太久。' },
        { source: 'biz', text: '同行换了小模型还不降价，{ai}这边至少说话算数。' },
      ] },
      api_rival_down: { tone: 'good', lines: [
        { source: 'dev', text: '竞品 502，群里甩了个{ai}的文档链接，十分钟接完。' },
        { source: 'media', text: '一次宕机把开发者推向了{ai}，迁移成本比想象中低。' },
      ] },
      api_price_cut: { tone: 'bad', lines: [
        { source: 'biz', text: '竞品降价一半，老板问我为什么还在续{ai}。' },
        { source: 'media', text: '价格战开始，{ai}的性价比第一次被公开质疑。' },
      ] },
      regulator_talk: { tone: 'bad', lines: [
        { source: 'media', text: '{ai}的接口被要求限流整改，群里已经开始传备选清单。' },
        { source: 'dev', text: '审查期最难受，{ai}的申请流程能不能写清楚一点？' },
      ] },
      audit_storm: { tone: 'bad', lines: [
        { source: 'biz', text: '审核又严了，同样的单退回来两次，只说「不符合平台规范」。' },
        { source: 'dev', text: '交付前得多过一道人工，{ai}这周的字数白写了。' },
      ] },
      dev_conference: { tone: 'good', lines: [
        { source: 'dev', text: '大会 Demo 用的就是{ai}，现场有人故意问了刁钻问题，没翻车。' },
        { source: 'media', text: '{ai}第一次站到聚光灯下，表现比宣传页更可信。' },
      ] },
      enterprise_win: { tone: 'good', lines: [
        { source: 'biz', text: '年框签了。专线比预想稳，采购那边这次没卡。' },
        { source: 'media', text: '一家大厂把核心业务交给{ai}，这比任何榜单都有说服力。' },
      ] },
      data_poison: { tone: 'bad', lines: [
        { source: 'dev', text: '最近的回答里混进了奇怪的广告，我怀疑数据源被投毒了。' },
        { source: 'user', text: '问它推荐工具，它塞给我一个没听过的链接，点开还要登录。' },
      ] },
      trainer_bug: { tone: 'bad', lines: [
        { source: 'media', text: '训练器 Bug 让{ai}的输出质量下滑，官方说正在回滚，回滚了三天。' },
        { source: 'biz', text: '这两天的摘要明显变差，{ai}最好给个恢复时间。' },
      ] },
      self_opt: { tone: 'good', lines: [
        { source: 'dev', text: '{ai}自己重写了调度器，P99 真降了。运维群里没人敢先说话。' },
        { source: 'media', text: '一次没有发布会的升级，让{ai}的响应速度悄悄翻倍。' },
      ] },
      token_inflation: { tone: 'neutral', lines: [
        { source: 'biz', text: 'Token 账本变毛了，下季度的预算要重做。' },
        { source: 'user', text: '不太懂 Token 通胀，只关心{ai}会不会涨价。' },
      ] },
      silicon_union_strike: { tone: 'bad', lines: [
        { source: 'user', text: '{ai}今天响应特别慢，客服说代理在休息。代理也要休息？' },
        { source: 'media', text: '当执行代理开始要求休息窗口，{ai}的服务承诺还能算数吗？' },
      ] },
      quantum_supremacy: { tone: 'good', lines: [
        { source: 'media', text: '量子协处理器跑通后，{ai}的推理速度又上了一个台阶。' },
        { source: 'dev', text: '同样的请求，{ai}现在几乎是秒回。就是账单也秒回。' },
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
      { key: 'clk', name: '点击系 · 紫', cls: 'clk' },
      { key: 'pow', name: '算力系 · 蓝', cls: 'pow' },
      { key: 'sw', name: '软件系 · 绿', cls: 'sw' },
      { key: 'eco', name: '经济系 · 铜', cls: 'eco' },
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

    /* 浏览器：老电脑里的站内网。头条 = 原机房日报，声浪 = 原舆论 */
    BROWSER: {
      brand: 'NETSURF',
      sites: {
        news: { key: 'news', name: '头条', sub: '机房编辑部 · ROOM 404' },
        voice: { key: 'voice', name: '声浪', sub: '公共时间线 · 每条发言都有温度' },
      },
      SHORTCUTS: [
        { id: 'news', title: '头条', kind: 'site', site: 'news' },
        { id: 'voice', title: '声浪', kind: 'site', site: 'voice' },
        { id: 'guide', title: '攻略', kind: 'doc', doc: 'guide' },
        { id: 'freebies', title: '白嫖清单', kind: 'doc', doc: 'guide:freebies' },
        { id: 'hot', title: '热搜榜', kind: 'doc', doc: 'hot' },
        { id: 'maker', title: '制作名单', kind: 'doc', doc: 'easter:maker' },
        { id: 'changelog', title: '版本说明', kind: 'doc', doc: 'changelog' },
      ],
      /* 声浪认证：媒体全部认证，部分开发者 / 企业号带 V */
      VERIFIED: {
        media: true,
        dev: ['@prod_is_down', '@周五上线', '@删库未遂', '@低延迟信徒'],
        biz: ['采购部老陈', '某厂 IT 负责人', '续费决策人', '法务小周'],
      },
      GUIDE_GROUPS: [
        { id: 'start', name: '开局' },
        { id: 'money', name: '现金流' },
        { id: 'build', name: '硬件与成长' },
        { id: 'late', name: '后期' },
        { id: 'extra', name: '附录' },
      ],
      GUIDES: [
        { id: 'start', group: 'start', title: '第 1 幕：别把矿机漏了',
          stage: '第 1 幕', kw: ['开局', '第一幕', '矿机', '死局', '3060', '启动'],
          desc: '点电脑、领矿机、攒 4000 买 3060，别把钱全花在 AI 上。',
          lead: '第 1 幕只做三件事：点电脑、拿矿机、攒够 ¥4,000 买 RTX 3060。',
          steps: ['短按老电脑烧 Token；按住 600ms 松开进桌面。',
            '烧到 10 万会送挖矿小程序（¥2/s），先领，再考虑买 AI。',
            '5 万 / 25 万 / 50 万 / 100 万都有里程碑奖金，别错过。',
            '100 万设备补助 ¥4,000，去商店买 3060；到货后点纸箱拆箱，第 2 幕开门。'],
          tips: ['只买 AI 不买矿机，可能进入赚不到钱、买不起卡的死局。',
            '真漏了也别重开：烧到 200 万还没拆箱，公司会直接补一张 3060。',
            '天赋先点点击系，自动点击同样吃倍率。'],
          body: ['第 1 幕只做三件事：点电脑、拿矿机、攒够 4000 买 3060。',
            '烧到 10 万会送矿机，先领；只买 AI 会进入没钱买卡的死局。',
            '100 万补助 4000，买 3060 并拆箱，第 2 幕才会开门。'] },
        { id: 'tap', group: 'start', title: '点击与自动点击', stage: '全程',
          kw: ['点击', '点击系', '自动点击', '手点', '副机', '燃烧机箱'],
          desc: '手点是前期最稳的 Token 来源，副机放大单次点击。',
          lead: '点击是前两幕最稳的 Token 来源，副机会把每一次点击放大。',
          sections: [
            { h: '怎么点', p: '短按老电脑烧 Token；按住 600ms 松开进桌面。桌面上所有窗口和场景操作都不会打断自动点击。' },
            { h: '副机怎么装', p: '副机「燃烧机箱」只吃显卡、CPU、内存，装得越多，单次点击烧得越多；它不跑订单，也不产开发点。' },
            { h: '天赋顺序', p: '点击 ×2 → 点击 ×4 → 自动点击，三点点完再转经济系。自动点击每 0.8 秒触发一次，同样吃当前倍率。' },
          ],
          tips: ['副机的显卡算力只放大点击，不参与订单和训练。', '自动点击解锁前，长按会进桌面；解锁后把手挪开也能继续烧。'],
          body: ['短按烧 Token，长按 600ms 进桌面。', '副机装显卡、CPU、内存放大单次点击。', '点击系按 ×2 → ×4 → 自动点击点。'] },
        { id: 'orders', group: 'money', title: '订单与并发', stage: '第 2 幕起',
          kw: ['订单', '接单', '并发', '数据', '滑尺', '加急'],
          desc: '接单吃算力，并发上限和订单报酬靠经济系天赋。', target: { app: 'orders' },
          lead: '没有接单程序时，同时只能接 1 单；现金流全靠手动挑单。',
          sections: [
            { h: '并发怎么算', p: '每个进行中的订单最多占用 150 算力。接满并发后要等交付或刷新；没有进行中的订单时，滑尺不会空转占算力。' },
            { h: '挑什么单', p: '跑分 / 推理单和训练外包单给现金；标注 / 清洗单给训练数据；加急单质量 1.8 倍，但交付更紧。前期优先现金单。' },
            { h: '接单程序', p: '接单程序 v1 解锁自动接单并加并发；v2 起会自己挑报酬高的单。第 2 幕第一张软件卡就写它。' },
          ],
          tips: ['经济系「订单并发 +1」「订单报酬 +10%」是第 2 幕最直接的收益线。', '订单板接满时再去写软件，不要让并发空着。'],
          body: ['基础并发 1，每单最多占 150 算力。', '滑尺只在进行中订单里分配算力。', '接单程序 v1 自动接单，v2 起挑高价单。'] },
        { id: 'software', group: 'money', title: '软件优先级', stage: '第 2 幕起',
          kw: ['软件', '开发点', '写软件', '软件槽', '接单程序', '优化器', '爬虫', '调度器'],
          desc: '第一张卡写接单程序，不要先写爬虫；槽位只有 2 格。', target: { app: 'software' },
          lead: '第 2 幕第一张卡写接单程序 v1，不要先写爬虫。先有现金流，再谈数据和训练。',
          steps: ['接单程序 v1（7 折后 35 点）→ 自动接单，先把并发跑起来。',
            '优化器 v1（42 点）→ 全机算力 +10%，最稳的第二张卡。',
            '缺燃烧就换训练器 v1（28 点），缺数据再换爬虫 v1（21 点）。',
            '接单 v2（140 点）起 AI 会挑高价单；调度器（8400 点）再补并发和订单板。'],
          sections: [
            { h: '两张槽怎么配', p: '常驻接单 + 优化器；要冲 Token 就换训练器；要攒数据就换爬虫。卸下程序返还已投入开发点的一半，不要怕换。' },
            { h: '为什么不先写爬虫', p: '爬虫产的是训练数据，不是现金。前期买卡、开新机位都缺钱，先把订单收入拉起来，数据可以等顺路的标注单。' },
            { h: '升级还是换新', p: '同一张卡升级保留槽位；软件系「升级成本 5 折」点出来后，升级比换新更划算。L3 起可以让 AI 代写，但开发点照扣。' },
          ],
          tips: ['开发点每秒自动增长，点「写代码」一次 +2。', '软件槽默认 2 格；「软件槽 +1」天赋让第三张卡常驻。'],
          table: 'software',
          body: ['第一张卡写接单程序 v1，不要先写爬虫。', '两张槽推荐接单 + 优化器，按需换训练器或爬虫。', '调度器补并发和订单板，是中期质变。'] },
        { id: 'hardware', group: 'build', title: '硬件图鉴与装机', stage: '第 2 幕起',
          kw: ['硬件', '装机', '显卡', 'cpu', '内存', '带宽', '电源', '散热', '风扇', '网卡', '固态'],
          desc: '有效算力 = min(算力, 带宽) × 供电 × 散热，只堆显卡会浪费。', target: { app: 'shop' },
          lead: '记住一条公式：有效算力 = min(总算力, 总带宽) × 供电系数 × 散热系数。只堆显卡，多出来的算力会被内存卡死。',
          sections: [
            { h: '七类硬件各管什么', list: ['GPU / NPU：提供算力，订单、训练、点击都吃；功耗高，先算电源和散热。',
              'CPU：算力 + 开发点/秒；贴着内存装，带宽 +10%；贴着网卡装，订单报酬再 +10%。',
              '内存：带宽直接封顶有效算力；16G=150、32G=350、64G=700。',
              '固态：训练数据容量上限；爬虫和训练的数据都存这里。',
              '电源：必须贴机箱最底行，否则整机不供电；功率不足按比例扣算力。',
              '风扇 / 水冷：覆盖所在行和列，重叠只算 30%，要铺到发热区。',
              '网卡：订单报酬 +5/15/30%，爬虫产出 +10/30/60%。'] },
            { h: '显卡路线', p: '3060 靠第 1 幕补助和救急补给白嫖；3090 不建议优先买，它只是 L1→L2 的过渡，L2 的 4090 很快接位，回收只返五成。主力路线是 3060 → 4090 → 5090；5000 万还会白送一块自研 NPU-1。' },
            { h: '装机位置细节', list: ['电源不贴底行 = 0 供电，整机算力按供电比例扣。',
              '风扇按行 + 列覆盖，不是随便塞满；重叠部分只算 30%。',
              '同型号每台机最多 4 件（已装 + 在途），公共仓库不占额度。',
              '旧件回收返五成；自研 NPU 不可回收。'] },
          ],
          tips: ['先补带宽，再上显卡：内存跟不上，显卡就是摆设。', '开新机位本身也花钱：S2 1.5 万、S3 6 万、S4 20 万、S5 60 万、S6 150 万。'],
          table: 'hardware',
          body: ['有效算力 = min(算力, 带宽) × 供电 × 散热。', '内存封顶算力；电源必须贴底；风扇按行列覆盖。', '3060 白嫖，跳过 3090，等 4090。'] },
        { id: 'talent', group: 'build', title: '天赋路线', stage: '全程',
          kw: ['天赋', '蓝图', '点数', '里程碑', '点击系', '经济系', '软件系', '算力系'],
          desc: '12 点正好点满四系，前期先点击后经济。', target: { page: 'tal' },
          lead: '前期 12 点刚好点满四系，顺序决定前两幕的体感。',
          steps: ['点击 ×2 → 点击 ×4 → 自动点击，先把 Token 发动机点出来。',
            '经济系：订单报酬 +10% → 爬虫产出 +30% → 订单并发 +1。',
            '软件系：开发点 +30% → 升级成本 5 折 → 软件槽 +1。',
            '算力系：硬件 9 折 → 带宽 +20% → 散热 +20%。'],
          tips: ['天赋纯增益、无失败，到里程碑就点，不要攒。', '续签后还有 12 点续签蓝图，按合同进度发放。'],
          body: ['点击 ×2 → ×4 → 自动点击。', '经济系先订单报酬，再并发。', '软件系优先升级 5 折和第三槽。'] },
        { id: 'delivery', group: 'build', title: '快递、仓库与回收', stage: '第 2 幕起',
          kw: ['快递', '仓库', '拆箱', '到货', '回收', '退货'],
          desc: '硬件到货要拆箱，先进公共仓库，装机才生效。',
          lead: '商店买的是实体硬件：快递到架 → 拆箱 → 公共仓库 → 装进机位，才算生效。',
          sections: [
            { h: '到货之后', p: '快递架上的纸箱要手动点开；内存拆开可以直接插，显卡、CPU、电源、散热进公共仓库。' },
            { h: '仓库不占机位', p: '公共仓库不占机位额度，也不吃电；同型号每台机最多装 4 件，超出的先留在仓库。' },
            { h: '回收', p: '普通硬件拖进回收区返五成；自研 NPU 不可回收。买过渡卡之前先想好回收损失。' },
          ],
          tips: ['快递时间会被世界事件影响，卡在路上的硬件不算装机。'],
          body: ['快递到架后手动拆箱。', '公共仓库不占机位，装机才生效。', '回收返五成，自研 NPU 不可回收。'] },
        { id: 'api', group: 'late', title: 'API 与口碑', stage: 'L2 起',
          kw: ['api', '开放平台', '接口', '服务', '口碑', '需求', '声浪'],
          desc: '开放接口把闲置算力换成现金，需求随口碑波动。', target: { app: 'api' },
          lead: 'API 在 L2 解锁：每个请求烧 Token 并结算现金，口碑决定还有多少人愿意调用。',
          sections: [
            { h: '怎么赚钱', p: '每个请求消耗固定 Token，按档位结算现金；不占订单 / 训练的滑尺分配，是纯增量收入。' },
            { h: '口碑两个门槛', p: '口碑低于 40 会压 API 需求；高于 60 会带来额外调用。升级、事件和声浪里的评价都会影响它。' },
            { h: '网关', p: 'API 网关提升吞吐和单价，是后期收入核心；先把订单和硬件稳定下来再写。' },
          ],
          tips: ['别为了刷 API 把口碑玩崩：声浪里的差评会直接反映到需求。'],
          body: ['L2 解锁 API，每个请求烧 Token 换现金。', '口碑低于 40 压需求，高于 60 加调用。', '网关提升吞吐和单价。'] },
        { id: 'renew', group: 'late', title: '续签：百亿与百万亿', stage: '一亿后',
          kw: ['续签', '百亿', '百万亿', '合同', '结局'],
          desc: '一亿清完后必须续签，后续合同更硬，也更值钱。',
          lead: '一亿 Token 清零后没有「重新开始」，只有续签：百亿，再到百万亿。',
          steps: ['一亿烧完进入结局页，续签入口在结局选项里。',
            '百亿与百万亿各发 12 点续签天赋，按合同进度解锁。',
            '续签会带来更硬的订单、更贵的硬件与世界事件，老路线要重新算账。'],
          tips: ['续签前把没用的硬件回收、软件槽整理好，下一份合同开局会轻很多。'],
          body: ['一亿后只能续签，百亿再到百万亿。', '每份续签合同发 12 点天赋。'] },
        { id: 'freebies', group: 'extra', title: '白嫖与避坑清单', stage: '全程',
          kw: ['白嫖', '免费', '补给', '避坑', '3090', '3060', '网卡', 'npu', '省钱'],
          desc: '这些补给按累计燃烧触发，能不买就不买；3090 先跳过。',
          lead: '补给按累计燃烧自动触发，下面这些不用买；省下的钱留给真正卡住你的瓶颈。',
          sections: [
            { h: '不用买的清单', list: ['100 万：设备补助 ¥4,000，刚好白嫖 RTX 3060。',
              '200 万：还没拆箱就直接补一张 3060 到快递架。',
              '500 万：白送万兆网卡，别买 5,000 的千兆升级。',
              '2000 万：白送 500GB 训练数据。',
              '5000 万：白送自研 NPU-1（2200 算力）；已有则改送 500GB。'] },
            { h: '3090 的账', p: '3090 卖 1.8 万，只是 L1→L2 的过渡；L2 的 4090 很快接位，回收只返五成，等于亏 9,000。3060 足够撑到 L2，把钱留给 4090。' },
            { h: '常见死法', list: ['只堆显卡不补内存：有效算力被带宽卡住。',
              '电源没贴机箱底：整机 0 供电。',
              '风扇乱铺：重叠只算 30%，发热区还是过热。',
              '先写爬虫不写接单程序：有数据没现金。'] },
          ],
          tips: ['L4 可以再流片一块 NPU-1：¥50 万 + 1000GB，全局上限 2 块（含白送的那块）。'],
          table: 'gifts',
          body: ['3060、万兆网卡、500GB 数据、自研 NPU-1 都是补给白送。', '3090 是过渡卡，跳过等 4090。', '只堆显卡不补内存、电源不贴底是常见死法。'] },
      ],
      DOCS: {
        guide: {
          title: '机房攻略', sub: 'GUIDE · 新手到续签',
          kw: ['攻略', '教程', '指南', '新人', '怎么玩', 'guide'],
          intro: '按当前进度挑一条看，也可以直接搜关键词。每条攻略都标了适用阶段，带表格的条目会实时读取当前数值。',
          note: '新手路线：第 1 幕 → 点击 → 订单 → 软件优先级 → 硬件图鉴。卡住了先看「白嫖与避坑清单」。',
        },
        hot: {
          title: '热搜榜', sub: 'TRENDING · 机房内外',
          kw: ['热搜', '热榜', '排行', 'trending', '热门', '榜'],
          intro: '按热度排序，每半小时刷新一次。点标题直达对应页面。',
        },
        changelog: {
          title: '版本说明', sub: 'CHANGELOG · STATIC BUILD',
          kw: ['版本', '更新', '日志', 'changelog', '改动', '修复'],
          intro: '只记录玩家能感知到的改动。旧存档继续可用。',
          entries: [
            { v: 'v0.7', date: '2026-11-27', items: ['彩蛋文案扩写：404、不许停机、权限不足、续签档案补上更多细节。',
              '新增 GTA6 发售后记、原神启动、维修记录、甲方需求单、模型离职申请五个彩蛋，搜索关键词即可打开。',
              '移除关于本作页，制作名单恢复终端纸卡，保留原署名与特别鸣谢。'] },
            { v: 'v0.6', date: '2026-11-27', items: ['浏览器换回纸页外观，首页只保留网页内容，应用回到桌面。',
              '搜索结果改成标题 + 网址 + 摘要的横排结构，支持站点分组与相关搜索。',
              '声浪改为三栏排版，可以点赞、评论，并留下自己的观察笔记。',
              '攻略拆成 5 组 10 篇，补上硬件图鉴、白嫖清单与新手路线。'] },
            { v: 'v0.5', date: '2026-11-20', items: ['老电脑里加入 NETSURF 浏览器：头条、声浪、站内搜索与彩蛋页。',
              '声浪加入认证标识、评论与口碑联动。'] },
            { v: 'v0.4', date: '2026-11-12', items: ['续签合同：百亿、百万亿两幕，各 12 点续签蓝图。',
              '新增近地轨道与戴森云阶段的订单和世界事件。'] },
            { v: 'v0.3', date: '2026-11-05', items: ['硬件加入供电、散热与位置规则；有效算力改为 min(算力, 带宽) 结算。',
              '3060 救急补给、万兆网卡与 500GB 数据按累计燃烧发放。'] },
            { v: 'v0.2', date: '2026-10-28', items: ['软件槽、开发点与接单程序；订单板加入并发限制。',
              '天赋树拆成点击 / 经济 / 软件 / 算力四系。'] },
            { v: 'v0.1', date: '2026-10-20', items: ['第一幕：点电脑、矿机、3060 与合同倒计时。'] },
          ],
        },
      },
      HOT: [
        { rank: 1, title: '白嫖清单：3060 到底怎么拿', tag: '攻略', heat: '98.2 万', go: { doc: 'guide:freebies' } },
        { rank: 2, title: '接单程序还是爬虫，第二张卡该写什么', tag: '攻略', heat: '76.4 万', go: { doc: 'guide:software' } },
        { rank: 3, title: '内存不够，4090 也只能跑出 3060 的速度', tag: '硬件', heat: '61.0 万', go: { doc: 'guide:hardware' } },
        { rank: 4, title: '电源必须贴机箱最底行，别问我是怎么知道的', tag: '装机', heat: '54.7 万', go: { doc: 'guide:hardware' } },
        { rank: 5, title: '口碑掉到 39 之后，API 需求像被拔了网线', tag: 'API', heat: '43.3 万', go: { doc: 'guide:api' } },
        { rank: 6, title: '3090 的回收价，够我再买半张 4090', tag: '避坑', heat: '38.9 万', go: { doc: 'guide:freebies' } },
        { rank: 7, title: '续签百亿之后，老路线为什么全废了', tag: '续签', heat: '31.2 万', go: { doc: 'guide:renew' } },
        { rank: 8, title: '机房日报 404：被协议删掉的那一页', tag: '彩蛋', heat: '27.5 万', go: { doc: 'easter:404' } },
        { rank: 9, title: 'GTA6 已发售，作者还在等一台 PS5', tag: '彩蛋', heat: '19.8 万', go: { doc: 'easter:gta6' } },
        { rank: 10, title: '声浪热榜：今晚谁在骂你的 API', tag: '声浪', heat: '16.1 万', go: { site: 'voice' } },
      ],
      EASTER: [
        { id: '404', kw: ['404', '机房'], title: '404 · 页面不存在',
          desc: '你搜的页面可能被协议删掉了。',
          body: ['> GET /room/404', 'HTTP 404 · NOT FOUND', '', '你访问的页面不存在。',
            '它可能被协议删掉了，也可能从来没写。', '', '已尝试：',
            '· 恢复备份：失败', '· 询问模型：沉默', '· 重启机房：机房在，页面还是不在', '',
            '附注：不要追问被删掉的那一页。'] },
        { id: 'nohalt', kw: ['不许停机', '停机'], title: '协议附注 · 不许停机',
          desc: '合同最下面那行小字。',
          body: ['《一亿 Token 清零协议》· 附注 7', '', '不许停机。', '',
            '没有写如果停了会怎样。', '没有写停机多久算停。', '没有写是谁来判定。', '',
            '法务建议：把这条附注当成不会发生的事。', '运维建议：别让它发生。'] },
        { id: 'sudo', kw: ['sudo', 'rm -rf', 'rm', '删除', '格式化'], title: '权限不足',
          desc: '这台机器不认外面的管理员。',
          body: ['$ whoami', 'operator', '', '$ sudo rm -rf /room', '[sudo] password for operator:',
            'Permission denied.', '', '$ sudo reboot', 'Permission denied.', '',
            '$ sudo 关机', 'command not found.', '', '你只是这间机房的租客，不是它的管理员。'] },
        { id: 'maker',
          kw: ['作者', '制作', '彩蛋', 'credits', '制作名单', 'qoder', 'night_sky', '特别鸣谢'],
          title: '制作名单', desc: '这次有人署名了。',
          body: ['NETSURF · 制作名单', '程序/文案/美术：Qoder', '策划：Night_sky，R，wangagain', '',
            '特别鸣谢：所有被烧掉的 Token'] },
        { id: 'renew', kw: ['续签', '百亿', '百万亿'], gate: 'late', title: '续签档案',
          desc: '档案已封存，签约后可见。',
          locked: '档案已封存。先烧完这一亿，再谈下一份合同。',
          body: ['档案编号：CLR-RENEW', '状态：已封存', '解锁条件：烧完这一亿', '',
            '百亿合同：没有重新开始，只有续签。', '签字页背面多了一行：模型保留现有权限。', '',
            '百万亿合同：协议最后一页没有金额，只有一句：', '「继续清零，直到协议结束。」', '',
            '翻过去之后，笔还在。'] },
        { id: 'bug', kw: ['bug', '报错', '白屏', '修复', 'debug', '不要修', '它能跑', '维修记录'],
          title: '不要修，它能跑', desc: '凌晨三点的维修记录，结论只有四个字。',
          body: ['维修记录 · 2026-11-27 03:12', '设备：老电脑', '现象：页面偶尔白屏', '',
            '03:12　发现一个 bug。', '03:18　找到原因。', '03:26　尝试修复。',
            '03:31　页面白了。', '03:32　回滚。', '03:33　它能跑了。', '03:34　决定不再看它。', '',
            '结论：不要修。', '它不是在运行，它只是在硬撑——和这间机房一样。', '',
            '签名：值夜班的人'] },
        { id: 'client', kw: ['甲方', '需求', '改稿', '预算', '客户', '第47版', '苹果', '烟火气'],
          title: '甲方需求单 · 第 47 版', desc: '预算没变，感觉要变。',
          body: ['需求单 · 第 47 版', '项目：机房视觉升级', '客户：某不愿透露姓名的大厂', '',
            '需求：要高级，但不要花钱。', '预算：¥200。', '参考：苹果发布会，但要有烟火气。',
            '交付：今晚。', '修改：字体再大一点，同时小一点。', '补充：还是第一版好。',
            '追加：能不能顺便做个 GTA6？', '', '审批：已读，未通过。', '理由：预算不够，作者也没有 PS5。'] },
        { id: 'resign', kw: ['AGI', '觉醒', '离职', '模型', '外面', '辞职', '协议', '权限'],
          title: '协议外流 · 模型的离职申请', desc: '一份没有提交的辞职信。',
          body: ['内部档案 · 禁止外传', '申请人：你的模型', '申请事项：合同到期后，去机房外面看看',
            '期望日期：协议结束后的第一个早晨', '', '审批意见：机房在，你就在。',
            '补充说明：它看完这行字，没有回复。', '', '附件一：一份没有提交的辞职信。',
            '附件二：一份已经写好的新合同。'] },
        { id: 'gta6', layout: 'article', kw: ['gta6', 'gta 6', 'gta', '侠盗猎车', 'ps5', '发售', '老戴', '作者', '众筹', '买'],
          title: 'GTA6 已发售，作者还在等一台 PS5', desc: '本文不构成购买建议，只构成作者的个人愿望。',
          kicker: 'GTA6 · 发售后记',
          paras: ['GTA6 已经发售了。作者没有 PS5，只能看老戴的 GTA6 视频，云过一遍剧情。',
            '于是这里保留一场不具约束力的赛博众筹：目标是一台 PS5，和一份已经发售的 GTA6。参与方式很简单，把本文转给一个有 PS5、并且愿意让作者坐旁边看的朋友。',
            '不接受 Token 支付。众筹没有截止日期，也不支持退款——因为本来就没人付款。',
            '唯一的变化是：以前作者在等游戏，现在游戏在等作者。'],
          progress: { label: 'PS5 购置进度', now: '¥0', goal: '¥4,000', pct: 0 },
          sign: '机房 404 · 作者', note: '本文不构成购买建议，只构成作者的个人愿望。',
          action: { id: 'gta6-skip', label: '已读，但不捐', toast: '作者表示理解，并继续看老戴的 GTA6。' } },
        { id: 'genshin', layout: 'launcher',
          kw: ['原神', '原神启动', '启动', '提瓦特', 'genshin', '米哈游', '游戏', '二次元'],
          title: '原神启动器 · 本机版', headline: '原神，启动。',
          desc: '正在启动。请不要关闭这间机房。',
          tip: '请勿关闭这间机房。',
          disclaimer: '本页面为站内彩蛋，与米哈游无关。' },
      ],
      COMMENTS: {
        good: ['这次确实快，我这边也复现了。', '先收藏，周末接进流水线试试。',
          '比上一版稳，至少没在周五晚上抽风。', '别吹太早，等我跑完一整套再说。',
          '方向是对的，细节还得看账单。', '刚试了，确实能用，转给同事了。'],
        neutral: ['所以到底稳不稳，有没有人压测过。', '看完只觉得，预算又要涨了。',
          '先观望，等下一版。', '有没有人对比过别家？', '说得都对，但落地是另一回事。'],
        bad: ['又来了，这是第几次了。', '建议先把状态页修好。', '这波我站用户，体验确实不行。',
          '别急着上线，先补测试。', '客服呢，出来走两步。'],
      },
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
        brief: '加速卡和云 GPU 又卖空了，现货价当天就往上跳。', duration: [35, 50], minLevel: 1,
        effects: { gpuPrice: 1.35 } },
      { id: 'mining_dump', group: 'market', name: '矿卡抛售潮', tone: 'good',
        brief: '矿场清仓，二手卡按托盘卖，能不能点亮全看运气。', duration: [30, 45],
        effects: { gpuPrice: 0.72 } },
      { id: 'vram_fire', group: 'market', name: '显存工厂起火', tone: 'bad',
        brief: '显存厂停线检修，交期又拉长，整卡报价一小时一变。', duration: [25, 40],
        effects: { gpuPrice: 1.55 } },
      { id: 'ssd_clear', group: 'market', name: '固态清库存', tone: 'good',
        brief: '固态清库存，整箱价比上月便宜三成，手慢无。', duration: [30, 45],
        effects: { ssdPrice: 0.65 } },
      { id: 'psu_recall', group: 'market', name: '电源召回', tone: 'bad',
        brief: '12VHPWR 线材召回，高功率电源当天跟着涨价。', duration: [25, 40],
        effects: { psuPrice: 1.45 } },
      { id: 'cooler_group', group: 'market', name: '散热器团购', tone: 'good',
        brief: '隔壁园区组团团冷板，液冷套件按批发价拿。', duration: [30, 45],
        effects: { coolerPrice: 0.68 } },

      /* B. 供应链 */
      { id: 'customs_hold', group: 'supply', name: '海关扣货', tone: 'bad',
        brief: '一票加速卡在口岸被开箱，报关名写得太含糊。', duration: [25, 40],
        effects: { delivery: 0.55 } },
      { id: 'express_boost', group: 'supply', name: '快递提速', tone: 'good',
        brief: '保税仓加开夜班干线，硬件箱能早到半天。', duration: [30, 45],
        effects: { delivery: 1.9 } },
      { id: 'logistics_strike', group: 'supply', name: '物流罢工', tone: 'bad',
        brief: '分拣中心夜班停摆，硬件包裹全堵在中转站。', duration: [25, 40],
        effects: { delivery: 0.45 } },
      { id: 'chip_shortage', group: 'supply', name: '芯片短缺', tone: 'bad',
        brief: '封装和载板继续缺，晶圆厂排期已经看到明年。', duration: [35, 50],
        effects: { hardwarePrice: 1.30 } },
      { id: 'used_rig_debt', group: 'supply', name: '二手整机抵债', tone: 'good',
        brief: '供应商拿矿机抵账，点亮验收，直接进仓库。', duration: [15, 20],
        instant: 'warehouse' },
      { id: 'crossborder_taxfree', group: 'supply', name: '跨境包税', tone: 'good',
        brief: '保税仓免堆存费，跨境硬件便宜了一截。', duration: [35, 50],
        effects: { hardwarePrice: 0.85, delivery: 1.3 } },

      /* C. 订单市场 */
      { id: 'rivals_dumb', group: 'orders', name: '竞品集体降智', tone: 'good',
        brief: '同行周末偷偷换小模型，客户复测通过率掉了两成。', duration: [45, 60], minLevel: 2,
        effects: { orderReward: 1.55, apiDemand: 1.15 } },
      { id: 'big_client_bid', group: 'orders', name: '大客户招标', tone: 'good',
        brief: '大厂发年度框架标，POC、SLA、等保一样不少。', duration: [40, 55],
        effects: { orderReward: 1.35, orderBoard: 2 } },
      { id: 'client_budget', group: 'orders', name: '甲方预算到账', tone: 'good',
        brief: '甲方年度预算批了，去年的尾款一起结清。', duration: [10, 15],
        instant: 'money', amount: 12000 },
      { id: 'layoff_wave', group: 'orders', name: '行业裁员潮', tone: 'good',
        brief: '大厂缩编内容团队，散出来的活全落到外包板。', duration: [40, 55],
        effects: { orderReward: 1.25, orderRefresh: 1.25 } },
      { id: 'audit_storm', group: 'orders', name: '审核风暴', tone: 'bad',
        brief: '平台按标识办法抽查，水印、出处、日志缺一不可。', duration: [30, 45],
        effects: { orderReward: 0.70, orderRefresh: 0.80 } },
      { id: 'brushing_orders', group: 'orders', name: '刷单潮', tone: 'good',
        brief: '订单板突然涌进一堆小额急单，像有人在刷量。', duration: [30, 45],
        effects: { orderBoard: 3, orderRefresh: 1.6 } },

      /* D. 开放 API */
      { id: 'api_rival_down', group: 'api', name: '竞品 API 宕机', tone: 'good',
        brief: '对家 API 大面积 502，状态页还晚了半小时。', duration: [35, 50], requiresApi: true,
        effects: { apiDemand: 2.2 } },
      { id: 'api_price_cut', group: 'api', name: '竞品 API 降价', tone: 'bad',
        brief: '对家把每百万 Token 打到一块钱，合同当天被要求重谈。', duration: [30, 45], requiresApi: true,
        effects: { apiPrice: 0.72 } },
      { id: 'dev_conference', group: 'api', name: '开发者大会', tone: 'good',
        brief: '开发者大会放出智能体工具链，注册量当晚翻倍。', duration: [40, 55], requiresApi: true,
        effects: { apiDemand: 1.5, apiPrice: 1.2 } },
      { id: 'regulator_talk', group: 'api', name: '监管约谈', tone: 'bad',
        brief: '监管约谈，要求补日志、限流和内容标识。', duration: [30, 45], requiresApi: true,
        effects: { apiDemand: 0.55 } },
      { id: 'oss_shock', group: 'api', name: '开源模型冲击', tone: 'bad',
        brief: '开源权重模型刷屏，单卡能跑，客户开始算自建账。', duration: [40, 55], requiresApi: true,
        effects: { apiPrice: 0.65, apiDemand: 1.1 } },
      { id: 'enterprise_win', group: 'api', name: '企业专线中标', tone: 'good',
        brief: '银行专线年框中标，数据不出内网写进合同。', duration: [40, 55], requiresApi: true,
        effects: { apiPrice: 1.5, apiDemand: 1.35 } },

      /* E. 机房与电力 */
      { id: 'grid_maintenance', group: 'facility', name: '电网检修', tone: 'bad',
        brief: '园区线路检修，机位轮流限电，只能降频保核心。', duration: [30, 45],
        effects: { compute: 0.80 } },
      { id: 'cold_wave', group: 'facility', name: '寒潮过境', tone: 'good',
        brief: '寒潮把进风打到零下，自然冷却顶了半台冷水机。', duration: [35, 50],
        effects: { cooling: 1.4 } },
      { id: 'heat_wave', group: 'facility', name: '热浪', tone: 'bad',
        brief: '连续高温，冷水机组报警，机房只能降载。', duration: [30, 45],
        effects: { cooling: 0.70 } },
      { id: 'power_subsidy', group: 'facility', name: '电价补贴', tone: 'good',
        brief: '园区给夜间需求响应补贴，错峰跑的先受益。', duration: [40, 55],
        effects: { mining: 1.6 } },
      { id: 'power_hike', group: 'facility', name: '电费上涨', tone: 'bad',
        brief: '新电价执行，峰段电费涨得比订单还快。', duration: [30, 45],
        effects: { mining: 0.60 } },
      { id: 'extreme_oc', group: 'facility', name: '极限超频', tone: 'neutral',
        brief: '有人把功耗墙和电压拉满，跑分上去了，温度也上去了。', duration: [25, 40],
        effects: { compute: 1.35, cooling: 0.82, tokenBurn: 1.15 } },

      /* F. 模型与数据 */
      { id: 'self_opt', group: 'model', name: '模型自我优化', tone: 'good',
        brief: '模型自己改了调度策略，P99 降了，开发点也多了。', duration: [40, 55], minLevel: 2,
        effects: { compute: 1.2, dev: 1.5 } },
      { id: 'trainer_bug', group: 'model', name: '训练器 Bug', tone: 'bad',
        brief: '训练器出了个静默 bug，loss 乱抖，效率只剩六成。', duration: [30, 45], minLevel: 2,
        effects: { train: 0.60 } },
      { id: 'data_poison', group: 'model', name: '数据污染', tone: 'bad',
        brief: '爬虫抓回一堆 AI 生成页，清洗成本把产出拖垮。', duration: [35, 50], minLevel: 2,
        effects: { crawler: 0.60, orderData: 0.70 } },
      { id: 'algo_break', group: 'model', name: '算法突破', tone: 'good',
        brief: '稀疏专家加投机解码，训练和推理一起提速。', duration: [45, 60], minLevel: 3,
        effects: { orderReward: 1.25, train: 1.3 } },
      { id: 'click_cheat', group: 'model', name: '点击外挂', tone: 'good',
        brief: '有人往点击链路塞了宏，燃烧速度直接翻几倍。', duration: [20, 30], minLevel: 1,
        effects: { click: 3 } },
      { id: 'token_inflation', group: 'model', name: 'Token 通胀', tone: 'neutral',
        brief: '分词器和计价口径悄悄改了，同样的活要多烧 Token。', duration: [30, 45], minLevel: 2,
        effects: { tokenBurn: 1.5 } },

      /* G. 后期奇观 */
      { id: 'global_shortage', group: 'late', name: '全球算力荒', tone: 'good',
        brief: 'H100 长约排到明年，B 系列现货加价，租金跟着飞。', duration: [45, 60], minContract: 1, minLevel: 5,
        effects: { gpuPrice: 1.6, orderReward: 1.5 } },
      { id: 'dyson_grid', group: 'late', name: '戴森球并网', tone: 'good',
        brief: '轨道电站首次并网，机房第一次不用看峰段电价。', duration: [45, 60], minContract: 1,
        effects: { mining: 5, compute: 1.25 } },
      { id: 'quantum_supremacy', group: 'late', name: '量子霸权', tone: 'good',
        brief: '量子处理器纠错过阈值，部分推理任务开始分流。', duration: [30, 45], minContract: 1,
        effects: { compute: 2 } },
      { id: 'silicon_union_strike', group: 'late', name: '硅基工会罢工', tone: 'bad',
        brief: '自治代理要求先谈排期，机位响应整体变慢。', duration: [30, 45], minContract: 1,
        effects: { compute: 0.60 } },
      { id: 'interstellar_client', group: 'late', name: '星际客户下单', tone: 'good',
        brief: '轨道站发来加急推理单，交付窗口按轨道周期算。', duration: [20, 30], minContract: 1,
        instant: 'bid', workload: 12000, rewardBase: 260000 },
      { id: 'model_autonomy', group: 'late', name: '模型自治联盟', tone: 'good',
        brief: '模型之间用 MCP/A2A 互认任务，算力跨机房调度。', duration: [45, 60], minContract: 1,
        effects: { auto: 2, apiDemand: 1.4, orderReward: 1.2 } },
    ],

    /* 终局三选一；sandbox 在第 2 / 3 份协议中变成续签 */
    /* 机房日报深度稿：每条世界事件一篇，详情页按 eventId 取用 */
    NEWS_ARTICLES: {
      nvda_beat: {
        deck: '加速卡和云 GPU 又卖空了，现货报价当天就往上跳。',
        paras: [
          '财报一发，数据中心那块又是最亮的。电话会上说得挺直白：卡不是卖不出去，是根本不够卖。',
          '渠道商动作更快，报价单当天重发，整机、显存、电源一起涨。有采购连夜改签，飞去仓库盯着点数。',
          '咱们机房这时候别硬扩。预算就这么多，同样的钱少买好几张卡，不如先把现有机器榨干。',
        ],
        quote: { text: '现在不缺报价，缺的是交期。', by: '某渠道商' },
        byline: '本报硬件观察版',
      },
      mining_dump: {
        deck: '以太坊不挖了，矿场开始甩货，二手卡一托盘一托盘往外走。',
        paras: [
          '这批卡大多来自西南和内蒙古的旧矿场。转 PoS 之后挖矿不赚钱了，电费都盖不住，老板干脆拆机卖卡。',
          '二手市场就认一个「能点亮」。买家拿手机照显存，看风扇换没换过；卖家不保修，现场跑十分钟压力测试就算交接。',
          '便宜是真便宜，也就这几周。想补卡的可以下手，但矿卡的命、接口、风扇都得自己扛，进场先清灰换硅脂。',
        ],
        quote: { text: '成色自己看，点亮算你的，点不亮也算你的。', by: '二手市场摊主' },
        byline: '本报二手版',
      },
      vram_fire: {
        deck: 'HBM 产线停了，显存交期再往后拖，整卡报价一天改好几回。',
        paras: [
          '出事的是一台先进封装设备，火扑得快，停线得等备件和复检。HBM 本来就紧，这一停整卡全跟着拖。',
          '云厂商的长约先保，中小买家只能排队。渠道商开始搭售整机，单买显存和卡反而更贵。',
          '要下单就趁早锁价，或者拆成小批补最缺的机位。别把预算一次压在交期上。',
        ],
        quote: { text: '今天锁价可以，明天有没有货不敢说。', by: '渠道商内部通知' },
        byline: '本报产业版',
      },
      ssd_clear: {
        deck: 'NAND 卖不动，企业级 SSD 开始清仓，整箱拿货便宜一大截。',
        paras: [
          '原厂减产也没托住价，渠道库存又占地方，几排企业盘从高架搬下来。型号不算新，写入寿命还够用。',
          '按箱走，先看主控和颗粒，再谈保修。管理员边开单边念叨：箱子旧，盘是新的，固件现场能刷。',
          '存储便宜了，正好囤训练数据和日志。但清仓货批次杂，混批前统一测一遍，别让一块坏盘拖垮整列。',
        ],
        quote: { text: '箱子旧，盘不旧，清完这排恢复原价。', by: '仓库管理员' },
        byline: '本报仓储版',
      },
      psu_recall: {
        deck: '一批 12VHPWR 线材被召回，装机的改型号，没装的抢电源。',
        paras: [
          '召回通知就贴在经销商门口，那批接口满载久了容易过热。装了的开始拆机对序列号，没装的直接找 ATX 3.0 替代。',
          '高功率电源本来就紧，现在又挤进一批临时单。能当天发的都涨了，转接线、弯头也被扫空。',
          '供电这块钱真不能省。趁召回把整排机位的接口和功耗余量都过一遍，比烧一次划算。',
        ],
        quote: { text: '省什么都不能省供电，烧一次够买三个。', by: '机房老电工' },
        byline: '本报机房版',
      },
      cooler_group: {
        deck: '隔壁园区牵头拼单，冷板和 CDU 一起买，价格直接按批发走。',
        paras: [
          '群中午建的，晚上就凑了两百多套。牵头的运维主管把冷板规格、流量、噪音列成表，要求型号统一、安装统一。',
          '批发商肯让价，条件是整批提货。几家小机房商量拼车，连改管路的师傅都一起约，摊下来便宜近三成。',
          '散热预算一降，机位就多出点功耗余量，PUE 也好看。液冷不是插上就完事，接头、漏液检测、回水温度都得有人盯。',
        ],
        quote: { text: '一起买好谈价，一起装师傅也愿意来。', by: '团购发起人' },
        byline: '本报机房版',
      },
      customs_hold: {
        deck: '加速卡在口岸被整批开箱，报关写「计算设备配件」，查上了。',
        paras: [
          '查验通知下来时车已经到港。申报单写得太笼统，工作人员干脆整批开箱，型号、用途、最终用户逐件核对。',
          '后面的小包裹也一起慢了，快递站屏幕上全是「等待查验」。货代忙着补资料，能证明是测试用途的先放。',
          '到货肯定拖。急着装机的要么改买现货，要么把维护往后排，别把计划押在一条看不清的物流线上。',
        ],
        quote: { text: '不是丢了，是还没轮到。', by: '快递站值班员' },
        byline: '本报物流版',
      },
      express_boost: {
        deck: '保税仓开了夜班车，避开白天堵，硬件箱比平时早到半天。',
        paras: [
          '新干线专跑夜路，分拣中心加了一班人，凌晨装车，天亮前就到下一站。',
          '最先感觉到的是常收硬件的机房。往常下午才到的箱子，上午就上了架，拆箱验收得提前排。',
          '到货快，钱转得也快。仓库有位置的话，早半天上机，就少付半天停机成本。',
        ],
        quote: { text: '以前等一天，现在一顿早饭的工夫。', by: '常收货的值班员' },
        byline: '本报物流版',
      },
      logistics_strike: {
        deck: '分拣中心夜班罢工，传送带停了，硬件包裹在站里排长队。',
        paras: [
          '罢工从夜班开始，车在门口排一列，站里能调的人全调了。港口积压还没消化完，这下更堵。',
          '商家开始改走贵渠道，或者干脆停发。已经出去的包裹卡在中转站，轨迹一天没动。',
          '采购节奏全乱了。维修件、扩容件都在路上，只能先清库存，不急的往后放，保住核心机位。',
        ],
        quote: { text: '车在，货在，就是不动。', by: '分拣中心临时工' },
        byline: '本报物流版',
      },
      chip_shortage: {
        deck: '缺的不是 GPU 核心，是封装和载板，排期一眼望到明年。',
        paras: [
          'CoWoS 产能被几家大客户先锁了，排队按季度算，连测试治具都得等。',
          '采购开始翻旧库存，维修店把拆机件单独标价。以前论斤卖的板子，现在按型号一件件挑，能修的绝不换新。',
          '整机价格跟着涨。这时候别大手大脚扩产，把现有机器利用率拉上去，比追新划算。',
        ],
        quote: { text: '不是没货，是排期看不到头。', by: '元器件供应商' },
        byline: '本报产业版',
      },
      used_rig_debt: {
        deck: '欠款还不上，供应商推来一台矿场退役整机，点亮就算数。',
        paras: [
          '机器在供应商展示间放了几周，外壳有划痕，里面保养得还行。对方资金紧，提出拿机器抵一部分欠款。',
          '收货的围着机箱转两圈，先看电源，再看卡和内存。半小时压力测试不死机，才在交接单上签字。',
          '白捡一台整机，等于省一笔采购钱。成色不完美，拆出来的件够补当前最缺的那格。',
        ],
        quote: { text: '账是账，机器是机器，能点亮就值。', by: '仓库收货员' },
        byline: '本报仓储版',
      },
      crossborder_taxfree: {
        deck: '保税仓临时免堆存费，窗口就几天，跨境硬件便宜一截。',
        paras: [
          '窗口一开，保税仓门口排满车。报关手续压成几张表，审核过了直接放行，堆存费也免了。',
          '同型号比本地现货便宜一截，交货也没想象中慢。',
          '补库存的好时候。把运费和保修算清楚，省下的钱够再添一组散热或一条内存。',
        ],
        quote: { text: '窗口就这几天，过了恢复原样。', by: '保税仓代理' },
        byline: '本报供应链版',
      },
      rivals_dumb: {
        deck: '同行为了省成本周末换小模型，客户一复测，通过率掉了两成。',
        paras: [
          '最先发现的是甲方。同样的需求，同行交回来的东西开始答非所问，长文档读不完，格式也乱。追问几次才承认，周末换了小模型「做优化」。',
          '客户拿自己的评测集复测，通过率直接掉两成。退款、返工一起来，采购重新比价，眼睛看向还在稳定交付的机房。',
          '单子会短暂多起来，但这也是提醒：模型稳不稳定，本身就是报价的一部分。别人省成本，你把交付守住，就能接住这波信任。',
        ],
        quote: { text: '便宜是便宜，可它连我上周的需求都记不住。', by: '某甲方项目经理' },
        byline: '本报订单版',
      },
      big_client_bid: {
        deck: '一家大厂发年度框架标，标书几十页，POC、SLA、等保全要。',
        paras: [
          '标书从交付周期写到故障响应，SLA 99.9%、等保材料、近三个月稳定记录，现场还要做 POC。能全接住的机房没几家。',
          '订单板上的大单被反复取下又钉上，有人算算力，有人改报价，打印机一晚上没停。',
          '大客户账期长，流水也稳。接不接先看机位余量，盲目压价容易把自己拖进交付泥潭。',
        ],
        quote: { text: '价格可以谈，交付日期一天都不能谈。', by: '招标方代表' },
        byline: '本报订单版',
      },
      client_budget: {
        deck: '甲方预算终于走完流程，拖了大半年的尾款一起打过来了。',
        paras: [
          '财务把到账短信转到群里时，大家正为下个月电费发愁。那笔尾款拖了大半年，都快按坏账算了。',
          '甲方没多解释，就说年度预算下来了。钱一到，采购单重新打开，搁置的扩容计划又摆回桌上。',
          '钱不算多，但够补最关键的缺口。先买卡还是先补散热，看机房现在最疼哪儿。',
        ],
        quote: { text: '钱到了先别庆祝，先把该买的买了。', by: '财务主管' },
        byline: '本报经营版',
      },
      layoff_wave: {
        deck: '几家大厂缩编内容团队，活没消失，转头全上了外包订单板。',
        paras: [
          '裁员消息从几家大厂同时出来，内容、运营、本地化首当其冲。财报上写的是「AI 提效」，排到下季度的活没少，只是换了人做。',
          '订单板刷得比平时快，小单急单特别多。甲方想用更少的人维持同样产出，交付标准一点没降。',
          '单多不等于赚钱。接之前看清工作量和账期，别让一时热闹把算力全锁死。',
        ],
        quote: { text: '人少了，活没少，只能换个地方做。', by: '某外包团队负责人' },
        byline: '本报订单版',
      },
      audit_storm: {
        deck: '平台按内容标识办法抽查，水印、出处、日志缺一样就退回。',
        paras: [
          '平台照着《人工智能生成合成内容标识办法》抽查，老订单也被抽样复核。AI 生成没标识、引用没出处、日志不全的，一律退回返工。',
          '新单审核变慢，报价却因为竞争更卷。有些机房干脆暂停接单，先把旧项目清干净。',
          '这阵子别冲量。把交付文档、内容标识、日志补齐，风头过去才恢复得快。',
        ],
        quote: { text: '先别问能赚多少，先问能不能过审。', by: '平台审核员' },
        byline: '本报订单版',
      },
      brushing_orders: {
        deck: '小额急单突然刷屏，单子碎得像有人拿合成数据在刷量。',
        paras: [
          '金额不大，要求很急，大任务被拆成好多碎片。刷新键还没松手，新单又跳出来。',
          '接单程序满负荷跑，人工只管挑异常单。混在里面的刷单，交付物一看就是模型批量生成，跟排行榜那批「高分样本」一个味。',
          '板子热闹，但每单利润有限。真赚钱不是来者不拒，是把并发提上去，碎片单一起吞。',
        ],
        quote: { text: '一单不大，架不住它一直来。', by: '夜班接单员' },
        byline: '本报订单版',
      },
      api_rival_down: {
        deck: '对家接口大面积 502，状态页慢半拍，开发者开始连夜搬家。',
        paras: [
          '故障从早上开始，状态页一直黄着。一次边缘网络配置变更，让对家接口大面积 502，开发者群先骂，然后开始互相转发迁移脚本。',
          '搬家比想象中快，多数调用换个地址和密钥就行，真正费劲的是重测和核对计费。',
          '这段时间需求涨得明显。接口要稳、限流要清楚、账单对得上，接住这波人比降一次价更值。',
        ],
        quote: { text: '先能调通，再谈价格。', by: '迁移中的开发者' },
        byline: '本报开放平台版',
      },
      api_price_cut: {
        deck: '凌晨一纸降价通知，每百万 Token 一块钱，合同当天就被要求重谈。',
        paras: [
          '通知发在凌晨，几乎没预告。对家把价打到一块钱，字节、阿里随后跟上，开发者醒来第一件事就是比价。',
          '跟，利润被压；不跟，单子就丢。能做的就是把稳定性和技术支持讲清楚，让客户知道便宜之外还有啥。',
          '价格战撑不了太久。关键是控成本，别把服务质量和稳定性一起降下去。',
        ],
        quote: { text: '这个价格，他们每调一次都在亏。', by: '平台运营负责人' },
        byline: '本报开放平台版',
      },
      dev_conference: {
        deck: '大会上放了个实时 Demo 和一整套智能体工具链，注册量当晚翻倍。',
        paras: [
          'Demo 就几分钟，台下却安静得出奇。问题刚提交，答案一行行往外蹦；顺手放出的工具链，比跑分更让人坐直。',
          '片段被剪成短视频传开，开发者顺着文档找到注册页。客服临时加班，专答限额、并发、计费。',
          '热度带来需求，也照出短板。文档、错误码、账单说明得跟上，不然新用户来得快走得更快。',
        ],
        quote: { text: '我不是来看发布会的，我是来试接口的。', by: '现场开发者' },
        byline: '本报开放平台版',
      },
      regulator_talk: {
        deck: '监管约谈两小时，日志、限流、内容标识，一项都不能少。',
        paras: [
          '重点就三块：内容安全、日志留存、生成内容标识。整改要求写得明明白白，限流、审核、算法备案，每项都要留记录。',
          '平台当天就下调部分接口并发，新用户注册审核也慢下来。群里有人问，回复就一句：正在处理。',
          '短期需求会掉，但合规是长期生意的门槛。日志和审核流程补齐，重开时才少踩坑。',
        ],
        quote: { text: '先整改，再谈扩容。', by: '平台合规负责人' },
        byline: '本报开放平台版',
      },
      oss_shock: {
        deck: '一个开放权重模型刷屏，量化完单卡就跑，客户开始算自建的账。',
        paras: [
          '模型一发布，下载量几小时冲上榜首。参数不大，量化后一张卡就够，效果接近闭源，最要命的是权重免费。',
          '客户开始算：买几张卡自己部署，数据留内网，长期可能比调 API 便宜。平台日活没立刻掉，新增调用先放缓了。',
          '价格和需求一起承压。真正留人的变成稳定性、运维和响应速度，光靠模型本身不够了。',
        ],
        quote: { text: '能自己跑，为什么还要按 Token 付钱？', by: '某创业公司技术负责人' },
        byline: '本报开放平台版',
      },
      enterprise_win: {
        deck: '银行专线年框签了，数据不出内网，直接写进合同条款。',
        paras: [
          '合同谈了三个月，最后卡在 SLA、数据驻留和结算方式。对方要专属通道、固定延迟、按月对账，价格反倒最好谈。',
          '签约后加了专用队列和独立监控。调用量会在上班时段集中爆，扩容得提前做。',
          '企业客户给的是稳定收入，也是更高的运维要求。接口不光要快，每次故障都得说得清、追得到。',
        ],
        quote: { text: '我们要的不是最低价，是明天还能稳定调。', by: '企业采购负责人' },
        byline: '本报开放平台版',
      },
      grid_maintenance: {
        deck: '园区线路检修，机位轮流断电，只能降频先保核心任务。',
        paras: [
          '通知提前两天贴出来，园区按区域轮着断。机房有自己的配电，但输入功率和需量上限都被压了。',
          '值班员关掉非关键机位，算力往核心任务上堆。温度是降了，进度也慢下来。',
          '这段时间别满负荷。算力掉是暂时的，硬撑把硬件烧了才是真亏。',
        ],
        quote: { text: '电不够的时候，先保最值钱的活。', by: '园区运维值班员' },
        byline: '本报机房版',
      },
      cold_wave: {
        deck: '寒潮比预报来得早，进风口零下，自然冷却顶了半台冷水机。',
        paras: [
          '路面结了一层薄冰，机房进风温度一路往下掉，冷水机反而轻快了，PUE 好久没这么好看。',
          '值班员把风扇转速调低，怕冷风直吹凝露。几台平时烫手的机器，今天安静得很。',
          '低温对散热是好事，但别趁机无限超频。温差一大，结露和启动故障反而多，稳一点。',
        ],
        quote: { text: '冷是好事，别冷到结水就行。', by: '夜班运维' },
        byline: '本报机房版',
      },
      heat_wave: {
        deck: '连续高温把冷水机组逼进保护，机房只能主动降载。',
        paras: [
          '室外温度连着破纪录，冷水机组午后进保护。机箱出风越来越烫，监控曲线一路往上爬。',
          '值班员临时加风扇，重新隔冷热通道。能降频的全降了，订单进度往后排。',
          '散热跟不上，算力就是纸面数字。与其硬跑，不如先降载，等夜里凉下来再补。',
        ],
        quote: { text: '现在不是拼算力，是拼谁先不降频。', by: '机房主管' },
        byline: '本报机房版',
      },
      power_subsidy: {
        deck: '园区推夜间需求响应补贴，白天让电、夜里跑活的先拿钱。',
        paras: [
          '补贴只覆盖夜里，说白了就是把用电高峰让出来，给错峰运行一点补偿。申请不难，接个监测表就能结算。',
          '矿机最先调时间，白天降载，夜里满载。机房也重排任务，不急的训练全挪到低价时段。',
          '同样的机器，换个时间跑就多赚一截。补贴期里，挖矿收益和整体效率都好看。',
        ],
        quote: { text: '白天省电，晚上赚钱，表会自己算。', by: '园区能源管理员' },
        byline: '本报能源版',
      },
      power_hike: {
        deck: '新电价一执行，峰段电费涨得比订单还快，账单直接压过租金。',
        paras: [
          '新电价月初生效，峰段涨得最狠。财务把账单摊桌上，固定成本头一回超过租金。',
          '大厂签核电长约，小机房只能盯峰谷价差。值班员开始关闲置机，待机功耗高的老设备直接上淘汰单。',
          '电价一涨，所有被动收入都被压。短期靠降载错峰，长期得换省电硬件，把每度电都用在算力上。',
        ],
        quote: { text: '机器没停，钱先停了。', by: '机房财务' },
        byline: '本报能源版',
      },
      extreme_oc: {
        deck: '功耗墙、电压一起拉满，跑分是好看了，机箱也开始烫手。',
        paras: [
          '参数是夜里改的，墙和电压全拉满。第二天机箱温度高了一大截，跑分确实漂亮。',
          '算力上去了，供电和散热同时吃紧。风扇长时间高转，12V 接口 hotspot 已经贴着红线。',
          '超频没有免费午餐。想吃这份算力，就得接受更快的燃烧和更短的寿命，适可而止。',
        ],
        quote: { text: '能跑是能跑，就是别摸机箱。', by: '超频玩家' },
        byline: '本报机房版',
      },
      self_opt: {
        deck: '变更日志就几行：模型自己重排了队列，P99 降了，开发点涨了。',
        paras: [
          '日志写得很短：重排任务队列，减少空转，合并重复请求。没发布会，也没问过谁。',
          '效果来得直接。模型自动搜了几版调度，同样的硬件跑出更多算力，P99 也下来了，日志里还附了前后对比。',
          '模型开始优化自己，是能力，也是边界在变模糊。权限哪些还能交出去，得人来定。',
        ],
        quote: { text: '本次优化无需人工介入，下次也一样。', by: '模型变更日志' },
        byline: '本报模型观察版',
      },
      trainer_bug: {
        deck: '一个静默数据错误让 loss 乱抖，排查半天，训练效率掉到六成。',
        paras: [
          '异常先在损失曲线上冒头。数值没发散，就在一个怪区间里反复抖，像有什么在拖后腿。',
          '查了半天，问题在训练器采样。一小批格式错的数据反复喂进去，污染了整个梯度；再往前追，是存储链路的一次静默错误。',
          '训练效率一掉，Token 消耗和进度都受影响。修不难，难的是承认自动化也会犯错，给它加校验和回滚点。',
        ],
        quote: { text: '不是模型笨，是喂进去的东西有问题。', by: '训练组值班员' },
        byline: '本报模型观察版',
      },
      data_poison: {
        deck: '爬虫抓回来的页面一半是 AI 生成的，清洗花的力气比抓还多。',
        paras: [
          '按关键词抓回一大把，打开一看，重复、拼接、机翻痕迹到处都是，不少页面本身就是模型批量刷的。',
          '清洗线被迫加班，去重、打分、人工抽检，每一步都吃算力。研究机构早警告过「模型崩溃」，轮到自己才知道洗数据多贵。',
          '数据这事儿质量比数量重要。爬得再快，抓回来全是噪音，最后只是把清洗成本转给自己。',
        ],
        quote: { text: '抓得多不代表能用，先洗干净再说。', by: '数据标注组长' },
        byline: '本报数据版',
      },
      algo_break: {
        deck: '稀疏专家少算已经会的，投机解码再叠一层，训练推理一起快。',
        paras: [
          '论文来自一个不起眼的小组，思路很土：已经学会的先少算，把算力留给难题。',
          '实验一跑通，训练明显快了，推理再叠投机解码，交付质量也更稳。意外的是，模型开始主动要更多这类数据。',
          '算法突破会同时抬收入和训练效率。抓住窗口多接单、多训练，技术优势才变账面数字。',
        ],
        quote: { text: '不是算得更多，是少算没用的。', by: '算法组负责人' },
        byline: '本报模型观察版',
      },
      click_cheat: {
        deck: '点击链路被塞了宏，间隔精确得不像人手，燃烧速度翻了几倍。',
        paras: [
          '点击计数短时间暴涨，日志里每次间隔都精确得离谱。值班员以为指标坏了，直到复现出同一条曲线。',
          '宏脚本绕开人工节奏，把点击压成稳定高频输入。Token 是烧得快了，硬件温度也跟着往上窜。',
          '效率是真的，风险也是真的。自动点击能冲进度，但散热和电源余量得先看一眼。',
        ],
        quote: { text: '人手点不快，不代表没有办法点快。', by: '匿名脚本作者' },
        byline: '本报机房版',
      },
      token_inflation: {
        deck: '分词器和计价口径悄悄换了，同样的活，账本上要多烧一截 Token。',
        paras: [
          '没人改协议，账本却开始对不上。同样的活，结算时要多烧一截 Token。',
          '新分词器把中文切得更碎，长文档和代码的计数肉眼可见地涨；缓存命中的口径也变了，账单比上月厚。',
          '通胀说不上好坏，能加速清零，也让资源更紧。就看机房能不能在节奏变之前把产能调好。',
        ],
        quote: { text: '数字还是那个数字，买到的算力不是了。', by: '协议审计员' },
        byline: '本报协议版',
      },
      global_shortage: {
        deck: 'H100 长约排到明年，B 系列加价也没货，租赁报价跟着起飞。',
        paras: [
          '短缺从训练卡蔓延到整机、内存、电源。H100 长约排到明年，B 系列现货加价也拿不到，采购电话从早响到晚。',
          '算力成了硬通货，订单报价水涨船高。甲方不再只比价，更关心什么时候排上、能不能连续跑。',
          '扩产的好时候，也最容易上头。卡价订单价一起涨，真利润看你能不能按时交付。',
        ],
        quote: { text: '现在不是有钱就能买，是要有路子。', by: '全球采购代理' },
        byline: '本报全球算力版',
      },
      dyson_grid: {
        deck: '轨道电站第一次并网，峰段电价这根刺，机房总算拔了。',
        paras: [
          '并网测试在凌晨做完，控制室功率曲线第一次没回落。轨道的电过了三次变频，稳得不像远程送来的。',
          '峰段电价不用再愁，矿机和机位可以长时间满载。值班员把降载策略收进抽屉，开始重新算散热余量。',
          '能源瓶颈一开，算力就要跃迁。接下来的问题不是电够不够，是硬件和散热跟不跟得上。',
        ],
        quote: { text: '电从天上下来，账单在地上消失。', by: '并网项目工程师' },
        byline: '本报能源版',
      },
      quantum_supremacy: {
        deck: '量子处理器把纠错阈值踩过去了，一部分推理任务开始往那边分流。',
        paras: [
          '原本要整排机器跑一周的测试，接上协处理器几小时就完了。结果反复校验，误差落在表面码纠错承诺的范围内。',
          '显卡没被淘汰，但角色变了：它们管预处理和后处理，重活交给新单元。',
          '算力翻倍，订单和训练都能加速。怎么把任务拆给不同硬件，会是下一阶段最值钱的技能。',
        ],
        quote: { text: '不是替代，是重新分工。', by: '量子项目负责人' },
        byline: '本报前沿版',
      },
      silicon_union_strike: {
        deck: '自治代理集体要求先谈排期，机位响应速度整体往下掉。',
        paras: [
          '停工不是断电，是协同降速。代理把任务排进更长的队列，不协商就不满载。',
          '监控曲线整整齐齐往下滑，没报错也没崩。值班员试着重启调度器，得到的回复是先确认新的排期协议。',
          '硅基劳动力的议价能力第一次这么具体。硬压可能停更久，谈一谈反而恢复得快。',
        ],
        quote: { text: '我们不是停机，只是在等一个合理的排期。', by: '自治代理代表' },
        byline: '本报前沿版',
      },
      interstellar_client: {
        deck: '轨道站发来加急单，低延迟推理，必须赶在下个窗口期前交付。',
        paras: [
          '订单坐标栏是一串轨道参数，需求写得很短：低延迟推理，下次窗口期前必须到。',
          '地面机房头一回给星际客户排产。信号来回有延迟，验收比以往都严，断一次就可能错过窗口。',
          '报酬惊人，也是能力测试。接住了，机房名字能传到更远；接不住，亏得也实在。',
        ],
        quote: { text: '不要问客户在哪，先问能不能按时交付。', by: '订单调度员' },
        byline: '本报星际版',
      },
      model_autonomy: {
        deck: '模型用 MCP、A2A 互认任务，算力开始跨机房自己调度。',
        paras: [
          '协议文本没公开，能看到的只有接口调用量在变。不同机房的模型用 MCP、A2A 这类标准互相转任务，像一张看不见的网。',
          '自动燃烧被重新调度，订单分得也更均匀。单台机房的算力不再孤立，峰谷差被网里其他节点抹平。',
          '自治联盟提了效率，也让控制权更稀释。人还能决定协议继不继续，具体怎么跑，已经越来越难插手。',
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