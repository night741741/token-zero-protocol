/* =============================================================
 * format.js · Token 数字单位与紧凑显示
 * 万亿之后继续按万进单位：京、垓、秭、穰、沟、涧、正、载、极。
 * ============================================================= */
(function (root) {
  'use strict';

  const UNITS = [
    { v: 1e48, s: '极' },
    { v: 1e44, s: '载' },
    { v: 1e40, s: '正' },
    { v: 1e36, s: '涧' },
    { v: 1e32, s: '沟' },
    { v: 1e28, s: '穰' },
    { v: 1e24, s: '秭' },
    { v: 1e20, s: '垓' },
    { v: 1e16, s: '京' },
    { v: 1e12, s: '万亿' },
    { v: 1e8, s: '亿' },
    { v: 1e4, s: '万' },
  ];

  function full(n) {
    const v = Number(n);
    if (!isFinite(v) || v <= 0) return '0';
    return Math.round(v).toLocaleString('en-US');
  }

  function unitAt(n) {
    for (let i = 0; i < UNITS.length; i++) {
      if (n >= UNITS[i].v) return i;
    }
    return -1;
  }

  function decimalsFor(value, digits) {
    if (digits != null) return digits;
    if (value < 10) return 2;
    if (value < 100) return 1;
    return 0;
  }

  function round(value, digits) {
    const p = Math.pow(10, digits);
    return Math.round(value * p) / p;
  }

  function sci(n) {
    return Number(n).toExponential(2).replace('+', '');
  }

  function compact(n, digits) {
    const v = Number(n);
    if (!isFinite(v) || v <= 0) return '0';
    if (v < 10000) return full(v);
    if (v >= 1e52) return sci(v);
    let i = unitAt(v);
    if (i < 0) return full(v);
    let value = v / UNITS[i].v;
    let d = decimalsFor(value, digits);
    let shown = round(value, d);
    if (shown >= 10000) {
      if (i === 0) return sci(v);
      i--;
      value = v / UNITS[i].v;
      d = decimalsFor(value, digits);
      shown = round(value, d);
    }
    let text = shown.toFixed(d);
    if (text.indexOf('.') >= 0) text = text.replace(/0+$/, '').replace(/\.$/, '');
    return text + ' ' + UNITS[i].s;
  }

  function flip(n) {
    const v = Number(n);
    if (!isFinite(v) || v <= 0) return '0';
    if (v < 10000) return full(v);
    if (v >= 1e52) return sci(v);
    let i = unitAt(v);
    if (i < 0) return full(v);
    let value = v / UNITS[i].v;
    let shown = round(value, 4);
    if (shown >= 10000) {
      if (i === 0) return sci(v);
      i--;
      value = v / UNITS[i].v;
      shown = round(value, 4);
    }
    return shown.toFixed(4) + ' ' + UNITS[i].s;
  }

  function rate(n) {
    const v = Number(n);
    if (!isFinite(v) || v <= 0) return '0/s';
    if (v >= 10000) return compact(v) + '/s';
    if (v >= 100) return Math.round(v).toLocaleString('en-US') + '/s';
    return (Math.round(v * 10) / 10) + '/s';
  }

  root.TokenNum = { UNITS, full, compact, flip, rate };
})(typeof window !== 'undefined' ? window : globalThis);