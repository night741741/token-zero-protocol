/* =============================================================
 * editor.js · 桌面编辑器
 * 三份长代码循环：JS 推理核心 → FastAPI 边缘接口 → LangChain 智能体。
 * 手动字母键或 AI 托管都会逐字出码，行满换行，文件完自动编译。
 * DOM 固定，Hub.refresh 只同步状态，不重建编辑区。
 * ============================================================= */
(function (root) {
  'use strict';

  const JS_CODE = [
    '// zero-core.js · 零号推理核心',
    'const { gpu, meter, bus } = require("@zero/runtime");',
    'const LANES = { free: 1, pro: 4, fleet: 16 };',
    'const LIMITS = { free: 8, pro: 32, fleet: 128 };',
    'const RETRY = { base: 120, max: 2400, tries: 4 };',
    'const state = { rpm: 0, errors: 0, burned: 0, peak: 0 };',
    'const users = new Set();',
    '// [1] 握手：确认显卡、显存和计费表都在线',
    'function handshake() {',
    '  const gpus = gpu.list().filter(card => card.mem > 0);',
    '  if (!gpus.length) throw new Error("no gpu online");',
    '  meter.reset("zero-1");',
    '  bus.emit("ready", { gpus: gpus.length });',
    '  return gpus;',
    '}',
    '// [2] 解码：把用户输入压进 token 流',
    'function encode(prompt) {',
    '  const text = String(prompt || "").trim();',
    '  if (!text) throw new Error("empty prompt");',
    '  return text.split("").map(ch => ch.charCodeAt(0) % 32000);',
    '}',
    'function decode(ids) {',
    '  return ids.map(id => String.fromCharCode(32 + (id % 90))).join("");',
    '}',
    '// [3] 路由：按套餐分流，别让散户挤爆专线',
    'function weight(req) {',
    '  const lane = LANES[req.plan] || 1;',
    '  return (req.priority || 1) * lane;',
    '}',
    'function route(queue) {',
    '  queue.sort((a, b) => weight(b) - weight(a));',
    '  return queue.filter(req => {',
    '    const cap = LIMITS[req.plan] || LIMITS.free;',
    '    return (req.rpm || 0) < cap;',
    '  });',
    '}',
    '// [4] 推理：压进显存，再把每一步账记清楚',
    'async function infer(req) {',
    '  const prompt = req.prompt.trim();',
    '  if (!prompt) throw new Error("empty prompt");',
    '  const tokens = encode(prompt);',
    '  const out = await gpu.run("zero-1", tokens);',
    '  state.burned += out.tokens.length;',
    '  meter.burn(out.tokens);',
    '  meter.bill(req.user, out.tokens);',
    '  users.add(req.user);',
    '  state.peak = Math.max(state.peak, users.size);',
    '  return { text: decode(out.tokens), tokens: out.tokens };',
    '}',
    '// [5] 重试：显存抖动时先退让，再排队重来',
    'async function guarded(req) {',
    '  let wait = RETRY.base;',
    '  for (let i = 0; i < RETRY.tries; i++) {',
    '    try {',
    '      return await infer(req);',
    '    } catch (err) {',
    '      state.errors++;',
    '      await new Promise(done => setTimeout(done, wait));',
    '      wait = Math.min(wait * 2, RETRY.max);',
    '    }',
    '  }',
    '  throw new Error("infer failed after retry");',
    '}',
    '// [6] 结算：按 token 出账，顺便记下峰值',
    'function settle(user, tokens) {',
    '  const price = tokens.length * meter.price(user.plan);',
    '  meter.post(user.id, price);',
    '  state.rpm = Math.min(state.rpm + 1, 9999);',
    '  return { user: user.id, tokens: tokens.length, price };',
    '}',
    '// [7] 巡检：每十秒回收一次空闲显存',
    'function patrol() {',
    '  const idle = gpu.list().filter(card => card.busy === false);',
    '  idle.forEach(card => gpu.release(card.id));',
    '  return idle.length;',
    '}',
    '// [8] 训练：夜间把新样本喂给下一版模型',
    'async function train(samples) {',
    '  const batch = samples.slice(0, 512);',
    '  const loss = await gpu.train("zero-1", batch);',
    '  meter.log("train", { batch: batch.length, loss });',
    '  return loss;',
    '}',
    '// [9] 导出：交给调度器统一接单',
    'module.exports = {',
    '  handshake, encode, decode, route,',
    '  infer, guarded, settle, patrol, train,',
    '  state, users, LIMITS, LANES,',
    '};',
  ];

  const API_CODE = [
    '# edge_api.py · 零号边缘推理接口',
    'from __future__ import annotations',
    'import asyncio',
    'import time',
    'from contextlib import asynccontextmanager',
    'from typing import AsyncIterator',
    'from fastapi import FastAPI, Header, HTTPException',
    'from fastapi.responses import StreamingResponse',
    'from pydantic import BaseModel, Field',
    'from .meter import Meter',
    'from .runtime import GpuPool',
    '',
    'GPU = GpuPool(cards=4)',
    'METER = Meter(price=0.0021)',
    'LIMITS = {"free": 8, "pro": 32, "fleet": 128}',
    '',
    '',
    'class ChatRequest(BaseModel):',
    '    user: str = Field(min_length=1, max_length=64)',
    '    plan: str = "free"',
    '    prompt: str = Field(min_length=1, max_length=8000)',
    '    temperature: float = 0.7',
    '',
    '',
    'class Usage(BaseModel):',
    '    prompt_tokens: int',
    '    output_tokens: int',
    '    cost: float',
    '',
    '',
    '@asynccontextmanager',
    'async def lifespan(app: FastAPI) -> AsyncIterator[None]:',
    '    await GPU.warmup("zero-1")',
    '    METER.reset("edge-api")',
    '    yield',
    '    await GPU.drain()',
    '',
    '',
    'app = FastAPI(title="Zero Edge API", version="1.4", lifespan=lifespan)',
    '',
    '',
    '@app.get("/health")',
    'async def health() -> dict:',
    '    cards = await GPU.snapshot()',
    '    return {"ok": True, "cards": len(cards), "rpm": METER.rpm}',
    '',
    '',
    '@app.get("/v1/limits/{plan}")',
    'async def limits(plan: str) -> dict:',
    '    if plan not in LIMITS:',
    '        raise HTTPException(status_code=404, detail="unknown plan")',
    '    return {"plan": plan, "rpm": LIMITS[plan]}',
    '',
    '',
    'async def token_stream(req: ChatRequest) -> AsyncIterator[str]:',
    '    started = time.monotonic()',
    '    used = 0',
    '    async for chunk in GPU.stream("zero-1", req.prompt, req.temperature):',
    '        used += len(chunk)',
    '        METER.burn(chunk)',
    '        yield "data: " + chunk.replace("\\n", " ") + "\\n\\n"',
    '    METER.post(req.user, used)',
    '    METER.log("latency", time.monotonic() - started)',
    '',
    '',
    '@app.post("/v1/chat")',
    'async def chat(req: ChatRequest, x_trace: str = Header(default="")) -> Usage:',
    '    cap = LIMITS.get(req.plan)',
    '    if cap is None:',
    '        raise HTTPException(status_code=402, detail="plan not enabled")',
    '    if METER.rpm >= cap:',
    '        raise HTTPException(status_code=429, detail="rate limited")',
    '    prompt_tokens = len(req.prompt.split())',
    '    output = await GPU.run("zero-1", req.prompt, req.temperature)',
    '    cost = METER.bill(req.user, output.tokens)',
    '    METER.trace(x_trace or req.user)',
    '    return Usage(prompt_tokens=prompt_tokens,',
    '                 output_tokens=len(output.tokens), cost=cost)',
    '',
    '',
    '@app.post("/v1/stream")',
    'async def stream(req: ChatRequest) -> StreamingResponse:',
    '    return StreamingResponse(token_stream(req), media_type="text/event-stream")',
    '',
    '',
    '@app.get("/v1/usage/{user}")',
    'async def usage(user: str) -> dict:',
    '    row = await METER.usage(user)',
    '    if row is None:',
    '        raise HTTPException(status_code=404, detail="no usage")',
    '    return {"user": user, "tokens": row.tokens, "cost": row.cost}',
    '',
    '',
    'def main() -> None:',
    '    import uvicorn',
    '    uvicorn.run("edge_api:app", host="127.0.0.1", port=8000, reload=False)',
    '',
    '',
    'if __name__ == "__main__":',
    '    main()',
  ];

  const AGENT_CODE = [
    '# agent_core.py · 零号调度智能体',
    'from __future__ import annotations',
    'import asyncio',
    'from dataclasses import dataclass, field',
    'from typing import Any',
    'from langchain.agents import AgentExecutor, create_tool_calling_agent',
    'from langchain_core.prompts import ChatPromptTemplate',
    'from langchain_core.tools import tool',
    'from langchain_openai import ChatOpenAI',
    'from .meter import Meter',
    'from .runtime import GpuPool',
    '',
    'GPU = GpuPool(cards=4)',
    'METER = Meter(price=0.0021)',
    'LIMITS = {"free": 8, "pro": 32, "fleet": 128}',
    '',
    '',
    '@dataclass',
    'class Task:',
    '    user: str',
    '    plan: str',
    '    goal: str',
    '    budget: int = 4096',
    '    trace: list[str] = field(default_factory=list)',
    '',
    '',
    '@tool',
    'def probe_gpu() -> str:',
    '    """Return the number of idle inference cards."""',
    '    cards = GPU.idle()',
    '    return "idle cards: " + str(len(cards))',
    '',
    '',
    '@tool',
    'def quote_tokens(count: int) -> str:',
    '    """Quote the token cost before a long run."""',
    '    price = round(METER.price("pro") * count, 4)',
    '    return "tokens " + str(count) + " cost " + str(price)',
    '',
    '',
    '@tool',
    'def release_card(card_id: str) -> str:',
    '    """Release a card after the agent finishes a batch."""',
    '    GPU.release(card_id)',
    '    return "released " + card_id',
    '',
    '',
    'SYSTEM = """你是零号机房的调度智能体。',
    '先看显存，再报价，最后才执行长任务。',
    '每烧一笔 Token 都要留痕，禁止透支。"""',
    '',
    'PROMPT = ChatPromptTemplate.from_messages([',
    '    ("system", SYSTEM),',
    '    ("human", "{goal}"),',
    '    ("placeholder", "{agent_scratchpad}"),',
    '])',
    '',
    '',
    'def build_agent() -> AgentExecutor:',
    '    llm = ChatOpenAI(model="zero-1", temperature=0.2)',
    '    agent = create_tool_calling_agent(',
    '        llm, [probe_gpu, quote_tokens, release_card], PROMPT',
    '    )',
    '    return AgentExecutor(agent=agent, tools=[probe_gpu, quote_tokens, release_card],',
    '                         max_iterations=6, verbose=False)',
    '',
    '',
    'async def run_task(task: Task) -> dict[str, Any]:',
    '    cap = LIMITS.get(task.plan)',
    '    if cap is None:',
    '        raise ValueError("plan not enabled: " + task.plan)',
    '    if METER.rpm >= cap:',
    '        raise RuntimeError("rate limited")',
    '    executor = build_agent()',
    '    result = await executor.ainvoke({"goal": task.goal})',
    '    used = METER.last_usage(task.user)',
    '    if used > task.budget:',
    '        METER.warn(task.user, "budget exceeded")',
    '    task.trace.append("done")',
    '    return {"answer": result.get("output", ""), "tokens": used}',
    '',
    '',
    'async def review_queue(tasks: list[Task]) -> list[dict[str, Any]]:',
    '    done: list[dict[str, Any]] = []',
    '    for task in tasks:',
    '        try:',
    '            done.append(await run_task(task))',
    '        except RuntimeError as err:',
    '            METER.warn(task.user, str(err))',
    '            await asyncio.sleep(0.4)',
    '    return done',
    '',
    '',
    'def main() -> None:',
    '    tasks = [Task(user="u-101", plan="pro", goal="给边缘接口压测 200 次")]',
    '    result = asyncio.run(review_queue(tasks))',
    '    print(result)',
    '',
    '',
    'if __name__ == "__main__":',
    '    main()',
  ];

  const FILES = [
    { name: 'zero-core.js', lang: 'JS', term: 'NODE', editor: '代码', code: JS_CODE,
      check: 'node --check zero-core.js', run: 'node zero-core.js' },
    { name: 'edge_api.py', lang: 'PY', term: 'PYTHON · FASTAPI', editor: '代码', code: API_CODE,
      check: 'python -m py_compile edge_api.py',
      run: 'uvicorn edge_api:app --host 127.0.0.1 --port 8000' },
    { name: 'agent_core.py', lang: 'PY', term: 'PYTHON · LANGCHAIN', editor: '代码', code: AGENT_CODE,
      check: 'python -m py_compile agent_core.py', run: 'python agent_core.py' },
  ];

  let st = null;
  let apiRef = null;
  let els = null;
  let file = null;
  let fileIndex = 0;
  let cycle = 1;
  let sessionGain = 0;
  let compiles = 0;
  let typing = false;
  let keySound = 0;
  let curLine = null;
  let curText = null;
  let curCaret = null;
  let termTimer = 0;
  let roundTimer = 0;
  let gainTimer = 0;
  let introDone = false;
  let bound = false;
  let imeHinted = false;
  let imeTimer = 0;
  let aiAcc = 0;
  let aiPumpTimer = 0;
  let manualUntil = 0;

  function $(id) { return document.getElementById(id); }

  function makeFile(index) {
    const def = FILES[index];
    return {
      name: def.name,
      lang: def.lang,
      term: def.term,
      check: def.check,
      run: def.run,
      lines: def.code.slice(),
      pos: 0,
      typed: 0,
      lineDone: false,
      done: false,
    };
  }

  function cur() { return file; }

  function defOf(f) {
    return FILES.find(d => d.name === (f && f.name)) || FILES[fileIndex] || FILES[0];
  }

  function init(state, api) {
    st = state;
    apiRef = api || (root.__game && root.__game.api) || null;
    els = {
      body: $('editorBody'),
      lang: $('edLang'),
      name: $('edName'),
      code: $('edCode'),
      lines: $('edLines'),
      empty: $('edEmpty'),
      term: $('edTermOut'),
      termLang: $('edTermLang'),
      gain: $('edGain'),
      round: $('edRound'),
      ime: $('edIme'),
      aiInfo: $('edAiInfo'),
      aiBtn: $('edAiBtn'),
    };
    if (!els.body || !els.code) return;
    fileIndex = 0;
    cycle = 1;
    file = makeFile(fileIndex);
    typing = true;
    buildCode();
    bind();
    refreshGain();
    refreshChrome();
    refreshAi();
    if (aiPumpTimer) clearInterval(aiPumpTimer);
    aiPumpTimer = setInterval(pumpAi, 60);
  }

  function bind() {
    if (bound) return;
    bound = true;
    els.code.addEventListener('click', e => {
      els.code.focus({ preventScroll: true });
      if (isTouch()) {
        e.preventDefault();
        manualTouch();
        typeChar();
      }
    });
    if (els.aiBtn) {
      els.aiBtn.addEventListener('click', () => {
        if (!apiRef || !apiRef.toggleAiCoder) return;
        apiRef.toggleAiCoder();
        refreshAi();
        refreshGain();
      });
    }
    document.addEventListener('keydown', onKey, true);
  }

  function isTouch() {
    return document.body.classList.contains('portrait') ||
      !!(root.matchMedia && root.matchMedia('(pointer: coarse)').matches);
  }

  function manualTouch() {
    manualUntil = Date.now() + 1200;
    aiAcc = 0;
  }

  function refreshChrome() {
    const f = cur();
    const def = defOf(f);
    if (els.lang) els.lang.textContent = def.lang;
    if (els.termLang) els.termLang.textContent = def.term;
    if (els.name) els.name.textContent = def.name;
    if (els.round) {
      const total = f ? f.lines.length : def.code.length;
      const pos = f ? f.pos : 0;
      els.round.textContent = '第 ' + cycle + ' 圈 · 文件 ' + (fileIndex + 1) + '/' + FILES.length + ' · ' +
        (f && f.done ? '编译完成' : pos + ' / ' + total + ' 行');
    }
  }

  function refreshGain() {
    if (!els || !els.gain) return;
    const dev = st && Number.isFinite(st.devPoints) ? Math.floor(st.devPoints) : 0;
    const ai = !!(st && st.aiCoder === true);
    els.gain.textContent = '开发点 ' + dev + ' · ' + (ai ? '手动本轮 +' : '本轮 +') + sessionGain;
  }

  function refreshAi() {
    if (!els || !els.aiBtn) return;
    const lvl = st && root.Sim ? root.Sim.modelLevel(st) : 0;
    const unlocked = lvl >= 3;
    const on = !!(st && st.aiCoder === true);
    if (!on) aiAcc = 0;
    els.aiBtn.disabled = !unlocked;
    els.aiBtn.classList.toggle('on', unlocked && on);
    els.aiBtn.textContent = !unlocked ? 'AI · L3 解锁' : (on ? '停止 AI' : 'AI 托管');
    if (!els.aiInfo) return;
    if (!unlocked) {
      els.aiInfo.textContent = '累计烧 2,000 万 Token · L3 解锁 AI 写代码';
      els.aiInfo.title = '';
      return;
    }
    if (!root.Sim || !root.Sim.aiCoderInfo) {
      els.aiInfo.textContent = on ? '托管中' : '待机';
      return;
    }
    const info = root.Sim.aiCoderInfo(st);
    els.aiInfo.textContent = (on ? '托管中' : '待机') + ' · +' + info.rate.toFixed(1) +
      ' 开发点/s · ' + Math.round(info.tokenRate) + ' Token/s';
    els.aiInfo.title = '基础 ' + info.base.toFixed(1) +
      ' × 代理 ' + info.agentMult.toFixed(2) +
      ' × 天赋 ' + info.talentMult.toFixed(2) +
      ' × 事件 ' + info.eventMult.toFixed(2) +
      ' · 代理 ' + info.agents + ' 个';
  }

  function flashGain(text) {
    if (!els || !els.gain) return;
    if (gainTimer) clearTimeout(gainTimer);
    els.gain.textContent = text;
    gainTimer = setTimeout(() => { gainTimer = 0; refreshGain(); }, 900);
  }

  function showImeHint() {
    if (imeHinted || !els || !els.ime) return;
    imeHinted = true;
    els.ime.classList.add('hot');
    appendTerm('! 检测到中文输入法：请用英文输入法；直接按字母键也能出码。');
    imeTimer = setTimeout(() => {
      imeTimer = 0;
      if (els && els.ime) els.ime.classList.remove('hot');
    }, 8000);
  }

  function buildCode() {
    const f = cur();
    if (!f || !els.lines) return;
    els.lines.innerHTML = '';
    curLine = curText = curCaret = null;
    const end = f.done ? f.lines.length : f.pos;
    for (let i = 0; i < end; i++) appendLine(i, f.lines[i], true);
    if (!f.done && f.pos < f.lines.length) appendLine(f.pos, f.lines[f.pos].slice(0, f.typed), false);
    if (els.empty) {
      els.empty.classList.toggle('hidden', f.done || f.pos > 0 || f.typed > 0);
    }
    els.code.scrollTop = els.code.scrollHeight;
  }

  function appendLine(i, text, done) {
    const f = cur();
    const row = document.createElement('div');
    row.className = 'ed-line' + (done ? ' done' : ' cur');
    const ln = document.createElement('span');
    ln.className = 'ed-ln';
    ln.textContent = String(i + 1);
    const code = document.createElement('span');
    code.className = 'ed-lc';
    const srcLine = f ? f.lines[i] : '';
    if (/^\s*(\/\/|#)/.test(srcLine)) code.classList.add('cmt');
    const txt = document.createElement('span');
    txt.className = 'ed-txt';
    txt.textContent = text;
    code.appendChild(txt);
    if (!done) {
      const caret = document.createElement('span');
      caret.className = 'ed-caret';
      code.appendChild(caret);
      curLine = row;
      curText = txt;
      curCaret = caret;
    }
    row.appendChild(ln);
    row.appendChild(code);
    els.lines.appendChild(row);
  }

  function updateCurrentLine() {
    const f = cur();
    if (!f || !curText) return;
    const src = f.lines[f.pos] || '';
    curText.textContent = src.slice(0, f.typed);
    if (els.empty) els.empty.classList.add('hidden');
    els.code.scrollTop = els.code.scrollHeight;
  }

  function reward(kind) {
    if (!root.Sim || !root.Sim.editorReward) return 0;
    const r = root.Sim.editorReward(st, kind);
    return r && r.ok ? r.gain : 0;
  }

  function typeChar(auto) {
    const f = cur();
    if (!f || f.done || !typing) return;
    if (auto && Date.now() < manualUntil) return;
    const src = f.lines[f.pos] || '';
    if (f.typed >= src.length) {
      completeLine(auto);
      return;
    }
    f.typed++;
    if (!auto) sessionGain += reward('key');
    updateCurrentLine();
    refreshChrome();
    if (!auto) {
      keySound++;
      if (keySound % 3 === 0) root.Audio.click();
    }
    if (f.typed >= src.length) completeLine(auto);
    else if (!auto) refreshGain();
  }

  function completeLine(auto) {
    const f = cur();
    if (!f || f.done) return;
    if (auto && Date.now() < manualUntil) return;
    const gain = awardLine(f, auto);
    if (curLine) curLine.classList.add('done');
    if (curCaret && curCaret.parentNode) curCaret.parentNode.removeChild(curCaret);
    curCaret = null;
    if (f.pos >= f.lines.length - 1) {
      compile(auto);
      return;
    }
    f.pos++;
    f.typed = 0;
    f.lineDone = false;
    curLine = curText = null;
    appendLine(f.pos, '', false);
    if (els.empty) els.empty.classList.add('hidden');
    els.code.scrollTop = els.code.scrollHeight;
    refreshChrome();
    if (gain) flashGain('+ ' + gain + ' 开发点 · 自动换行');
    else if (!auto) refreshGain();
  }

  function awardLine(f, auto) {
    if (f.lineDone) return 0;
    f.lineDone = true;
    if (auto) return 0;
    const gain = reward('line');
    sessionGain += gain;
    return gain;
  }

  function compile(auto) {
    const f = cur();
    if (!f || f.done) return;
    awardLine(f, auto === true);
    f.done = true;
    typing = false;
    compiles++;
    const gain = auto ? 0 : reward('compile');
    if (!auto) sessionGain += gain;
    const nextIndex = (fileIndex + 1) % FILES.length;
    const nextCycle = nextIndex === 0 ? cycle + 1 : cycle;
    const nextDef = FILES[nextIndex];
    buildCode();
    writeTerm([
      '$ ' + f.check,
      '$ ' + f.run,
      '✓ 编译通过 · 0 error · 0 warning',
      '✓ 第 ' + cycle + ' 圈 · 文件 ' + (fileIndex + 1) + '/' + FILES.length + ' · ' + f.name + ' 完成' +
        (auto ? ' · AI 托管' : ' · 开发点 +' + gain),
      '$ 1.6 秒后切换到 ' + nextDef.name,
    ]);
    if (!auto) root.Audio.levelup();
    if (!auto) flashGain('编译通过 · 开发点 +' + gain);
    else refreshGain();
    refreshChrome();
    refreshAi();
    if (roundTimer) clearTimeout(roundTimer);
    roundTimer = setTimeout(() => {
      roundTimer = 0;
      if (file !== f) return;
      cycle = nextCycle;
      fileIndex = nextIndex;
      file = makeFile(fileIndex);
      sessionGain = 0;
      typing = true;
      buildCode();
      refreshChrome();
      refreshGain();
      refreshAi();
      appendTerm('$ 第 ' + cycle + ' 圈 · 文件 ' + (fileIndex + 1) + '/' + FILES.length +
        ' · ' + file.name + ' 开始');
    }, 1600);
  }

  function writeTerm(lines) {
    if (!els.term) return;
    if (termTimer) { clearInterval(termTimer); termTimer = 0; }
    els.term.textContent = '';
    const list = lines.filter(x => x !== '');
    let i = 0;
    function put() {
      if (i >= list.length) { termTimer = 0; return; }
      els.term.textContent += list[i] + '\n';
      els.term.scrollTop = els.term.scrollHeight;
      i++;
    }
    put();
    if (list.length > 1) termTimer = setInterval(put, 110);
  }

  function appendTerm(text) {
    if (!els.term) return;
    if (termTimer) { clearInterval(termTimer); termTimer = 0; }
    els.term.textContent += text + '\n';
    els.term.scrollTop = els.term.scrollHeight;
  }

  function onKey(e) {
    if (!root.Hub || root.Hub.currentWindow() !== 'editor') return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const letterKey = /^[a-zA-Z]$/.test(e.key || '');
    const letterCode = /^Key[A-Z]$/.test(e.code || '');
    const composing = e.isComposing || e.keyCode === 229 ||
      e.key === 'Process' || (letterCode && !letterKey);
    if (composing) showImeHint();
    if (!letterKey && !letterCode) return;
    e.preventDefault();
    e.stopPropagation();
    manualTouch();
    typeChar();
  }

  function feedAi(chars) {
    if (!els || !els.body || !st || st.aiCoder !== true) return;
    if (root.Hub && root.Hub.currentWindow && root.Hub.currentWindow() !== 'editor') return;
    if (Date.now() < manualUntil) return;
    if (file && file.done) return;
    const n = Number(chars) || 0;
    if (n > 0) aiAcc = Math.min(500, aiAcc + n);
  }

  function pumpAi() {
    if (!els || !els.body || !st || st.aiCoder !== true) return;
    if (root.Hub && root.Hub.currentWindow && root.Hub.currentWindow() !== 'editor') return;
    if (file && file.done) return;
    if (!typing) return;
    if (Date.now() < manualUntil) return;
    const n = Math.min(80, Math.floor(aiAcc));
    if (n <= 0) return;
    aiAcc -= n;
    for (let i = 0; i < n; i++) {
      if (!typing || !file || file.done) break;
      typeChar(true);
    }
  }

  function render(state) {
    if (state) st = state;
    if (!els || !els.body) return;
    if (!introDone) {
      introDone = true;
      writeTerm([
        '零号编辑器 · 就绪',
        '$ 在代码区随便按字母键，编辑器会自己往下写。',
        '$ zero-core.js → edge_api.py → agent_core.py 循环编译。',
        '$ 输入法请保持英文；中文输入法直接按字母也能出码。',
      ]);
    }
    refreshGain();
    refreshChrome();
    refreshAi();
  }

  function sync(state) {
    if (state) st = state;
    if (!els || !els.body) return;
    refreshGain();
    refreshChrome();
    refreshAi();
  }

  function currentFile() {
    const f = cur();
    if (!f) return null;
    const src = f.lines[f.pos] || '';
    return {
      name: f.name,
      lang: f.lang,
      fileIndex: fileIndex,
      filesTotal: FILES.length,
      pos: f.pos,
      typed: f.typed,
      lineLen: src.length,
      ready: f.typed >= src.length,
      lines: f.lines.length,
      done: f.done,
      round: cycle,
      cycle: cycle,
      sessionGain: sessionGain,
      compiles: compiles,
    };
  }

  root.Editor = { init, render, sync, currentFile, feedAi, round: () => cycle };
})(window);
