/* =============================================================
 * audio.js · WebAudio 合成音效、氛围音与背景音乐（无音频文件）
 * ============================================================= */
(function (root) {
  'use strict';
  let ctx = null, master = null, enabled = true;
  const ambience = { fan: false, crt: false, printer: false };
  const ambientLevels = { fan: 0.02, crt: 0.012, printer: 0.018 };
  const loops = {};
  const buffers = {};

  /* ---------------- 背景音乐：五幕程序化曲目 ---------------- */
  const MUSIC_LEVEL = 0.4;
  const music = { timer: null, next: 0, step: 0, chord: 0, chapter: 0, pending: -1, cur: null, arpSeq: 0 };
  let musicIn = null, musicGain = null;
  const MUSIC_TRACKS = [
    /* 第 1 幕 底层单机：冷、稀、留白 */
    { bpm: 64, wave: 'triangle', cut: 720, padVol: 0.050, pluckVol: 0.055, bassVol: 0.080, pluckOct: 12,
      chords: [[45, 57, 60, 64], [41, 53, 57, 60], [36, 48, 52, 55], [43, 55, 59, 62]],
      arp: [0, 6, 12], bassSteps: [0], bassLen: 15 },
    /* 第 2 幕 第一桶金：暖起来，开始有呼吸 */
    { bpm: 72, wave: 'triangle', cut: 900, padVol: 0.050, pluckVol: 0.055, bassVol: 0.085, pluckOct: 12,
      chords: [[45, 55, 60, 64], [41, 52, 57, 60], [36, 52, 55, 59], [40, 50, 55, 59]],
      arp: [0, 4, 8, 12], bassSteps: [0, 8], bassLen: 7 },
    /* 第 3 幕 爬虫工坊：推进感 */
    { bpm: 78, wave: 'triangle', cut: 1000, padVol: 0.046, pluckVol: 0.050, bassVol: 0.090, pluckOct: 12,
      chords: [[45, 57, 60, 64], [43, 55, 59, 62], [41, 52, 57, 60], [40, 52, 56, 59]],
      arp: [0, 3, 6, 9, 12, 15], bassSteps: [0, 4, 8, 12], bassLen: 3.2 },
    /* 第 4 幕 自动机房：工业脉冲 */
    { bpm: 90, wave: 'sawtooth', cut: 560, padVol: 0.034, pluckVol: 0.040, bassVol: 0.085, pluckOct: 12,
      chords: [[38, 50, 53, 57], [46, 58, 62, 65], [41, 53, 57, 60], [36, 48, 52, 55]],
      arp: [0, 2, 4, 7, 9, 12, 14], bassSteps: [0, 2, 4, 6, 8, 10, 12, 14], bassLen: 1.6 },
    /* 第 5 幕 清零协议：收束 */
    { bpm: 60, wave: 'sine', cut: 1400, padVol: 0.058, pluckVol: 0.045, bassVol: 0.075, pluckOct: 24,
      chords: [[45, 57, 60, 64], [41, 53, 57, 60], [36, 48, 52, 55], [43, 55, 59, 62]],
      arp: [0, 5, 10, 15], bassSteps: [0], bassLen: 15 },
  ];

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = enabled ? 0.5 : 0;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(f0, f1, dur, type, vol) {
    if (!enabled) return;
    const c = ensure(); if (!c) return;
    try {
      const t = c.currentTime;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(f0, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
      g.gain.setValueAtTime(vol || 0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.02);
    } catch (e) { /* ignore */ }
  }
  function noise(dur, type, f0, f1, vol) {
    if (!enabled) return;
    const c = ensure(); if (!c) return;
    try {
      const t = c.currentTime;
      const len = Math.max(1, Math.floor(c.sampleRate * dur));
      const buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = c.createBufferSource(); src.buffer = buf;
      const f = c.createBiquadFilter(); f.type = type || 'lowpass';
      f.frequency.setValueAtTime(f0, t);
      f.frequency.exponentialRampToValueAtTime(Math.max(60, f1), t + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(vol || 0.2, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t);
    } catch (e) { /* ignore */ }
  }

  function ambientBuffer(kind, c) {
    if (buffers[kind]) return buffers[kind];
    const dur = kind === 'fan' ? 2 : 0.48;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const random = Math.random() * 2 - 1;
      if (kind === 'printer') {
        const phase = (i / len) % 0.25;
        d[i] = phase < 0.13 ? random * Math.sin(Math.PI * phase / 0.13) : 0;
      } else {
        d[i] = random;
      }
    }
    buffers[kind] = buf;
    return buf;
  }

  function startAmbient(kind) {
    if (loops[kind] || !enabled) return;
    const c = ensure(); if (!c) return;
    let source, filter, gain;
    if (kind === 'crt') {
      source = c.createOscillator();
      source.type = 'sawtooth';
      source.frequency.value = 60;
      filter = c.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 260;
    } else {
      source = c.createBufferSource();
      source.buffer = ambientBuffer(kind, c);
      source.loop = true;
      filter = c.createBiquadFilter();
      filter.type = kind === 'fan' ? 'lowpass' : 'bandpass';
      filter.frequency.value = kind === 'fan' ? 720 : 1450;
      filter.Q.value = kind === 'fan' ? 0.5 : 0.7;
    }
    gain = c.createGain();
    gain.gain.value = 0;
    source.connect(filter); filter.connect(gain); gain.connect(master);
    source.start();
    loops[kind] = { source, gain };
  }

  function applyAmbient(kind) {
    const loop = loops[kind];
    if (!loop) return;
    const target = enabled && ambience[kind] ? ambientLevels[kind] : 0;
    loop.gain.gain.cancelScheduledValues(ctx.currentTime);
    loop.gain.gain.setTargetAtTime(target, ctx.currentTime, 0.08);
  }

  function syncAmbience() {
    Object.keys(ambience).forEach(kind => {
      if (ambience[kind]) startAmbient(kind);
      applyAmbient(kind);
    });
  }

  /* ---------------- 背景音乐调度 ---------------- */
  function midiHz(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function reverbImpulse(c, sec, decay) {
    const len = Math.max(1, Math.floor(c.sampleRate * sec));
    const buf = c.createBuffer(2, len, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  function initMusicGraph(c) {
    if (musicGain) return;
    musicGain = c.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(master);
    musicIn = c.createGain();
    const dry = c.createGain();
    dry.gain.value = 0.82;
    musicIn.connect(dry); dry.connect(musicGain);
    const rev = c.createConvolver();
    rev.buffer = reverbImpulse(c, 2.2, 3.1);
    const wet = c.createGain();
    wet.gain.value = 0.38;
    musicIn.connect(rev); rev.connect(wet); wet.connect(musicGain);
  }

  function padNote(c, freq, at, dur, cfg) {
    const o = c.createOscillator(), o2 = c.createOscillator();
    o.type = cfg.wave; o2.type = 'sine';
    o.frequency.setValueAtTime(freq, at);
    o2.frequency.setValueAtTime(freq, at);
    o.detune.setValueAtTime(-5, at);
    o2.detune.setValueAtTime(6, at);
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.Q.value = 0.6;
    f.frequency.setValueAtTime(Math.max(180, cfg.cut * 0.55), at);
    f.frequency.linearRampToValueAtTime(cfg.cut, at + dur * 0.55);
    const g = c.createGain();
    const attack = Math.min(1.8, dur * 0.24);
    const release = Math.min(3.2, dur * 0.36);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(cfg.padVol, at + attack);
    g.gain.setValueAtTime(cfg.padVol, Math.max(at + attack + 0.01, at + dur - release));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(f); o2.connect(f); f.connect(g); g.connect(musicIn);
    o.start(at); o2.start(at);
    o.stop(at + dur + 0.05); o2.stop(at + dur + 0.05);
  }

  function pluckNote(c, freq, at, cfg) {
    const o = c.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(freq, at);
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(3600, at);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(cfg.pluckVol, at + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 1.25);
    o.connect(f); f.connect(g); g.connect(musicIn);
    o.start(at); o.stop(at + 1.3);
  }

  function bassNote(c, freq, at, dur, cfg) {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(freq, at);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(cfg.bassVol, at + 0.06);
    g.gain.setValueAtTime(cfg.bassVol, at + Math.max(0.08, dur * 0.7));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(musicIn);
    o.start(at); o.stop(at + dur + 0.05);
  }

  function musicTick() {
    if (!enabled || !ctx || !musicGain || ctx.state !== 'running') return;
    const c = ctx;
    if (document.hidden) { music.next = c.currentTime + 0.3; return; }
    let guard = 0;
    while (music.next < c.currentTime + 0.8 && guard++ < 32) {
      const step = music.step;
      if (step === 0) {
        if (music.pending >= 0) {
          music.chapter = music.pending;
          music.pending = -1;
          music.chord = 0;
          music.arpSeq = 0;
        }
        const cfg = MUSIC_TRACKS[music.chapter];
        const chord = cfg.chords[music.chord % cfg.chords.length];
        music.chord++;
        const stepDur = 30 / cfg.bpm;
        const at = music.next + 0.01;
        music.cur = { cfg, chord, stepDur, at };
        for (let i = 1; i < chord.length; i++) padNote(c, midiHz(chord[i]), at, stepDur * 16 * 0.99, cfg);
      }
      const cur = music.cur;
      if (!cur) break;
      if (cur.cfg.bassSteps.indexOf(step) >= 0) {
        bassNote(c, midiHz(cur.chord[0]), music.next + 0.01, cur.cfg.bassLen * cur.stepDur * 0.95, cur.cfg);
      }
      if (cur.cfg.arp.indexOf(step) >= 0) {
        const tones = cur.chord.length - 1;
        const note = cur.chord[1 + (music.arpSeq++ % tones)];
        pluckNote(c, midiHz(note + cur.cfg.pluckOct), music.next + 0.01, cur.cfg);
      }
      music.next += cur.stepDur;
      music.step = (step + 1) % 16;
    }
  }

  function startMusic() {
    if (!enabled || music.timer) return;
    const c = ensure();
    if (!c) return;
    initMusicGraph(c);
    music.step = 0;
    music.chord = 0;
    music.cur = null;
    music.arpSeq = 0;
    music.next = c.currentTime + 0.12;
    musicGain.gain.cancelScheduledValues(c.currentTime);
    musicGain.gain.setTargetAtTime(MUSIC_LEVEL, c.currentTime, 1.2);
    music.timer = setInterval(musicTick, 160);
    musicTick();
  }

  function stopMusic() {
    if (music.timer) {
      clearInterval(music.timer);
      music.timer = null;
    }
    const dead = musicGain;
    if (dead && ctx) {
      dead.gain.cancelScheduledValues(ctx.currentTime);
      dead.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
      setTimeout(function () { try { dead.disconnect(); } catch (e) { /* ignore */ } }, 800);
    }
    musicGain = null;
    musicIn = null;
    music.cur = null;
    music.pending = -1;
  }

  const Audio = {
    unlock() {
      ensure();
      if (enabled) {
        syncAmbience();
        startMusic();
      }
    },
    toggle() {
      enabled = !enabled;
      if (enabled) {
        ensure();
        if (master) master.gain.setTargetAtTime(0.5, ctx.currentTime, 0.04);
        syncAmbience();
        startMusic();
        tone(900, 900, 0.05, 'sine', 0.04);
      } else {
        stopMusic();
        if (master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
      }
      return enabled;
    },
    isOn() { return enabled; },
    setMusicChapter(idx) {
      idx = Math.max(0, Math.min(MUSIC_TRACKS.length - 1, idx | 0));
      if (!music.timer) {
        music.chapter = idx;
        music.pending = -1;
        return;
      }
      if (idx !== music.chapter) music.pending = idx;
    },
    musicState() {
      return {
        active: !!music.timer,
        chapter: music.chapter,
        pending: music.pending,
        context: ctx ? ctx.state : 'uninitialized',
      };
    },
    setAmbience(kind, on, level) {
      if (!(kind in ambience)) return;
      ambience[kind] = !!on;
      if (Number.isFinite(level)) ambientLevels[kind] = Math.max(0, Math.min(0.08, level));
      if (ctx) syncAmbience();
    },
    ambientState() {
      return {
        enabled,
        context: ctx ? ctx.state : 'uninitialized',
        active: Object.keys(loops).filter(kind => enabled && ambience[kind]),
      };
    },
    click() { tone(1400, 900, 0.045, 'square', 0.05); },
    flip() { tone(1600, 1250, 0.022, 'square', 0.012); },
    paper() { noise(0.16, 'bandpass', 2400, 1400, 0.12); },
    stamp() { noise(0.16, 'lowpass', 1100, 160, 0.18); tone(150, 70, 0.14, 'sine', 0.1); },
    lift() { noise(0.3, 'bandpass', 520, 1700, 0.08); },
    whoosh() { noise(0.34, 'lowpass', 320, 1300, 0.11); },
    open() { tone(520, 780, 0.12, 'triangle', 0.05); },
    close() { tone(720, 420, 0.12, 'triangle', 0.04); },
    coin() { tone(880, 880, 0.08, 'triangle', 0.14); tone(1320, 1320, 0.12, 'triangle', 0.11); },
    print() { noise(0.4, 'highpass', 3200, 2600, 0.08); },
    error() { tone(180, 140, 0.14, 'square', 0.14); },
    levelup() { tone(520, 520, 0.1, 'triangle', 0.16); tone(780, 780, 0.1, 'triangle', 0.16); tone(1040, 1040, 0.22, 'triangle', 0.16); },
    overheat() { noise(0.7, 'highpass', 900, 2600, 0.14); tone(240, 90, 0.6, 'sawtooth', 0.10); },
  };

  root.Audio = Audio;
})(window);
