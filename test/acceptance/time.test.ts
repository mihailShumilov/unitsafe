/**
 * PARANOIC ACCEPTANCE TESTS — TIME DIMENSION
 *
 * Units under test (13 total):
 *   s, ms, min, h, ns, us, d, week, month, yr, decade, century, plt
 *
 * Coverage strategy:
 *   - Factory creation (numeric + string) for every unit
 *   - Conversion to/from SI base (s) for every unit
 *   - Roundtrip conversions
 *   - Chain: ns -> us -> ms -> s -> min -> h -> d -> week
 *   - Calendar chain: month -> d, yr -> d, decade -> yr, century -> yr
 *   - add/sub for every unit
 *   - format for every unit
 *   - Real-world reference values (Julian year, etc.)
 */

import { describe, it, expect } from 'vitest';
import {
  s, ms, min, h, ns, us, d, week, month, yr, decade, century, plt,
  add, sub, mul, div, to, valueOf, format, scalar,
} from '../../src/index.js';

// ---------------------------------------------------------------------------
// SECTION A — Factory creation
// ---------------------------------------------------------------------------

describe('Time — Factory creation', () => {
  const factories = [
    { name: 's',       fn: s,       label: 's' },
    { name: 'ms',      fn: ms,      label: 'ms' },
    { name: 'min',     fn: min,     label: 'min' },
    { name: 'h',       fn: h,       label: 'h' },
    { name: 'ns',      fn: ns,      label: 'ns' },
    { name: 'us',      fn: us,      label: 'us' },
    { name: 'd',       fn: d,       label: 'd' },
    { name: 'week',    fn: week,    label: 'week' },
    { name: 'month',   fn: month,   label: 'month' },
    { name: 'yr',      fn: yr,      label: 'yr' },
    { name: 'decade',  fn: decade,  label: 'decade' },
    { name: 'century', fn: century, label: 'century' },
    { name: 'plt',     fn: plt,     label: 'plt' },
  ] as const;

  for (const { name, fn, label } of factories) {
    it(`${name}(30) creates quantity with value 30 and label "${label}"`, () => {
      const q = fn(30);
      expect(valueOf(q)).toBe(30);
      expect(q._l).toBe(label);
      expect(q._o).toBe(0);
    });

    it(`${name}("5.5") creates quantity from string`, () => {
      expect(valueOf(fn('5.5'))).toBe(5.5);
    });

    it(`${name}(0) handles zero`, () => {
      expect(valueOf(fn(0))).toBe(0);
    });

    it(`${name}(-10) handles negative`, () => {
      expect(valueOf(fn(-10))).toBe(-10);
    });
  }

  it('all time factories share dimension [0,0,1,0,0,0,0,0]', () => {
    for (const { fn } of factories) {
      expect(fn._dim).toEqual([0, 0, 1, 0, 0, 0, 0, 0]);
    }
  });
});

// ---------------------------------------------------------------------------
// SECTION B — Conversion to SI (s) and roundtrip
// ---------------------------------------------------------------------------

describe('Time — Conversion to SI (s) and roundtrip', () => {
  const units = [
    { name: 'ms',      fn: ms,      scale: 0.001,         testVal: 1000 },
    { name: 'min',     fn: min,     scale: 60,             testVal: 5 },
    { name: 'h',       fn: h,       scale: 3600,           testVal: 2 },
    { name: 'ns',      fn: ns,      scale: 1e-9,           testVal: 1e6 },
    { name: 'us',      fn: us,      scale: 1e-6,           testVal: 1000 },
    { name: 'd',       fn: d,       scale: 86400,          testVal: 1 },
    { name: 'week',    fn: week,    scale: 604800,         testVal: 1 },
    { name: 'month',   fn: month,   scale: 2629800,        testVal: 1 },
    { name: 'yr',      fn: yr,      scale: 31557600,       testVal: 1 },
    { name: 'decade',  fn: decade,  scale: 315576000,      testVal: 1 },
    { name: 'century', fn: century, scale: 3155760000,     testVal: 1 },
    { name: 'plt',     fn: plt,     scale: 5.391247e-44,   testVal: 1 },
  ];

  for (const { name, fn, scale, testVal } of units) {
    it(`${name}(${testVal}) -> s gives ${testVal} * ${scale}`, () => {
      const result = valueOf(to(s, fn(testVal)));
      const expected = testVal * scale;
      if (Math.abs(expected) > 1e6 || Math.abs(expected) < 1e-6) {
        expect(result / expected).toBeCloseTo(1, 6);
      } else {
        expect(result).toBeCloseTo(expected, 6);
      }
    });

    it(`roundtrip: ${name} -> s -> ${name} preserves value`, () => {
      const original = fn(testVal);
      const inSeconds = to(s, original);
      const back = to(fn, inSeconds);
      expect(valueOf(back)).toBeCloseTo(testVal, 6);
    });
  }

  it('s -> s is identity', () => {
    expect(valueOf(to(s, s(42)))).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// SECTION C — SI prefix chain
// ---------------------------------------------------------------------------

describe('Time — SI prefix chain (ns -> us -> ms -> s)', () => {
  it('1000 ns = 1 us', () => {
    expect(valueOf(to(us, ns(1000)))).toBeCloseTo(1, 6);
  });

  it('1000 us = 1 ms', () => {
    expect(valueOf(to(ms, us(1000)))).toBeCloseTo(1, 6);
  });

  it('1000 ms = 1 s', () => {
    expect(valueOf(to(s, ms(1000)))).toBe(1);
  });

  it('full chain: 1e9 ns = 1 s', () => {
    expect(valueOf(to(s, ns(1e9)))).toBeCloseTo(1, 4);
  });
});

// ---------------------------------------------------------------------------
// SECTION D — Calendar chain (s -> min -> h -> d -> week)
// ---------------------------------------------------------------------------

describe('Time — Calendar chain (s -> min -> h -> d -> week)', () => {
  it('60 s = 1 min', () => {
    expect(valueOf(to(min, s(60)))).toBe(1);
  });

  it('60 min = 1 h', () => {
    expect(valueOf(to(h, min(60)))).toBe(1);
  });

  it('24 h = 1 d', () => {
    expect(valueOf(to(d, h(24)))).toBe(1);
  });

  it('7 d = 1 week', () => {
    expect(valueOf(to(week, d(7)))).toBe(1);
  });

  it('1 h = 3600 s', () => {
    expect(valueOf(to(s, h(1)))).toBe(3600);
  });

  it('1 d = 86400 s', () => {
    expect(valueOf(to(s, d(1)))).toBe(86400);
  });

  it('1 week = 604800 s', () => {
    expect(valueOf(to(s, week(1)))).toBe(604800);
  });

  it('1 d = 1440 min', () => {
    expect(valueOf(to(min, d(1)))).toBe(1440);
  });

  it('1 week = 168 h', () => {
    expect(valueOf(to(h, week(1)))).toBe(168);
  });
});

// ---------------------------------------------------------------------------
// SECTION E — Long duration conversions
// ---------------------------------------------------------------------------

describe('Time — Long duration (month, yr, decade, century)', () => {
  it('1 yr = 365.25 d (Julian year)', () => {
    expect(valueOf(to(d, yr(1)))).toBeCloseTo(365.25, 4);
  });

  it('1 yr = 8765.82 h', () => {
    expect(valueOf(to(h, yr(1)))).toBeCloseTo(8765.82, 0);
  });

  it('1 yr = 31557600 s (Julian year)', () => {
    expect(valueOf(to(s, yr(1)))).toBe(31557600);
  });

  it('1 decade = 10 yr', () => {
    expect(valueOf(to(yr, decade(1)))).toBeCloseTo(10, 6);
  });

  it('1 century = 100 yr', () => {
    expect(valueOf(to(yr, century(1)))).toBeCloseTo(100, 4);
  });

  it('1 century = 10 decades', () => {
    expect(valueOf(to(decade, century(1)))).toBeCloseTo(10, 6);
  });

  it('1 month = 2629800 s (Julian month = yr/12)', () => {
    expect(valueOf(to(s, month(1)))).toBe(2629800);
  });

  it('12 months = 1 yr', () => {
    expect(valueOf(to(yr, month(12)))).toBeCloseTo(1, 6);
  });

  it('1 month = ~30.4375 d', () => {
    expect(valueOf(to(d, month(1)))).toBeCloseTo(30.4375, 2);
  });
});

// ---------------------------------------------------------------------------
// SECTION F — Planck time
// ---------------------------------------------------------------------------

describe('Time — Planck time', () => {
  it('1 plt = 5.391247e-44 s', () => {
    expect(valueOf(to(s, plt(1)))).toBeCloseTo(5.391247e-44, 50);
  });

  it('roundtrip: plt -> s -> plt preserves value', () => {
    const inS = to(s, plt(42));
    const back = to(plt, inS);
    expect(valueOf(back)).toBeCloseTo(42, 6);
  });

  it('Planck time is extremely small', () => {
    expect(plt._scale).toBeLessThan(1e-40);
  });
});

// ---------------------------------------------------------------------------
// SECTION G — add/sub for every unit
// ---------------------------------------------------------------------------

describe('Time — Arithmetic (add/sub)', () => {
  it('add: s(30) + s(30) = s(60)', () => {
    expect(valueOf(add(s(30), s(30)))).toBe(60);
  });

  it('sub: ms(1000) - ms(500) = ms(500)', () => {
    expect(valueOf(sub(ms(1000), ms(500)))).toBe(500);
  });

  it('add: min(30) + min(30) = min(60)', () => {
    expect(valueOf(add(min(30), min(30)))).toBe(60);
  });

  it('sub: h(8) - h(2) = h(6)', () => {
    expect(valueOf(sub(h(8), h(2)))).toBe(6);
  });

  it('add: ns(500) + ns(500) = ns(1000)', () => {
    expect(valueOf(add(ns(500), ns(500)))).toBe(1000);
  });

  it('add: us(250) + us(750) = us(1000)', () => {
    expect(valueOf(add(us(250), us(750)))).toBe(1000);
  });

  it('add: d(3) + d(4) = d(7)', () => {
    expect(valueOf(add(d(3), d(4)))).toBe(7);
  });

  it('sub: week(4) - week(1) = week(3)', () => {
    expect(valueOf(sub(week(4), week(1)))).toBe(3);
  });

  it('add: month(6) + month(6) = month(12)', () => {
    expect(valueOf(add(month(6), month(6)))).toBe(12);
  });

  it('sub: yr(2026) - yr(2000) = yr(26)', () => {
    expect(valueOf(sub(yr(2026), yr(2000)))).toBe(26);
  });

  it('add: decade(1) + decade(2) = decade(3)', () => {
    expect(valueOf(add(decade(1), decade(2)))).toBe(3);
  });

  it('sub: century(21) - century(1) = century(20)', () => {
    expect(valueOf(sub(century(21), century(1)))).toBe(20);
  });

  it('add: plt(50) + plt(50) = plt(100)', () => {
    expect(valueOf(add(plt(50), plt(50)))).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// SECTION H — format for every unit
// ---------------------------------------------------------------------------

describe('Time — format()', () => {
  it('format(s(30)) = "30 s"', () => expect(format(s(30))).toBe('30 s'));
  it('format(ms(250)) = "250 ms"', () => expect(format(ms(250))).toBe('250 ms'));
  it('format(min(5)) = "5 min"', () => expect(format(min(5))).toBe('5 min'));
  it('format(h(2)) = "2 h"', () => expect(format(h(2))).toBe('2 h'));
  it('format(ns(100)) = "100 ns"', () => expect(format(ns(100))).toBe('100 ns'));
  it('format(us(500)) = "500 us"', () => expect(format(us(500))).toBe('500 us'));
  it('format(d(7)) = "7 d"', () => expect(format(d(7))).toBe('7 d'));
  it('format(week(2)) = "2 week"', () => expect(format(week(2))).toBe('2 week'));
  it('format(month(6)) = "6 month"', () => expect(format(month(6))).toBe('6 month'));
  it('format(yr(1)) = "1 yr"', () => expect(format(yr(1))).toBe('1 yr'));
  it('format(decade(3)) = "3 decade"', () => expect(format(decade(3))).toBe('3 decade'));
  it('format(century(21)) = "21 century"', () => expect(format(century(21))).toBe('21 century'));
  it('format(plt(1)) = "1 plt"', () => expect(format(plt(1))).toBe('1 plt'));
  it('format with precision', () => {
    expect(format(s(3.14159), { precision: 2 })).toBe('3.14 s');
    expect(format(h(1.5), { precision: 0 })).toBe('2 h');
  });
});

// ---------------------------------------------------------------------------
// SECTION I — Real-world reference values
// ---------------------------------------------------------------------------

describe('Time — Real-world reference values', () => {
  it('Julian year = 365.25 days exactly', () => {
    expect(valueOf(to(d, yr(1)))).toBeCloseTo(365.25, 8);
  });

  it('Julian year = 31557600 seconds exactly', () => {
    expect(valueOf(to(s, yr(1)))).toBe(31557600);
  });

  it('1 minute = 60 seconds (exact)', () => {
    expect(valueOf(to(s, min(1)))).toBe(60);
  });

  it('1 hour = 60 minutes (exact)', () => {
    expect(valueOf(to(min, h(1)))).toBe(60);
  });

  it('1 day = 24 hours (exact)', () => {
    expect(valueOf(to(h, d(1)))).toBe(24);
  });

  it('1 week = 7 days (exact)', () => {
    expect(valueOf(to(d, week(1)))).toBe(7);
  });

  it('human heartbeat: ~1000 ms', () => {
    expect(valueOf(to(s, ms(1000)))).toBe(1);
  });

  it('network latency: 50 ms = 50000 us', () => {
    expect(valueOf(to(us, ms(50)))).toBeCloseTo(50000, 2);
  });

  it('CPU clock cycle at 3 GHz: ~0.333 ns', () => {
    const cycleNs = 1 / 3; // ns
    expect(valueOf(to(s, ns(cycleNs)))).toBeCloseTo(3.33e-10, 12);
  });

  it('age of universe: ~13.8 billion years in seconds', () => {
    const result = valueOf(to(s, yr(13.8e9)));
    expect(result).toBeCloseTo(13.8e9 * 31557600, -10);
  });
});

// ---------------------------------------------------------------------------
// SECTION J — Boundary and edge cases
// ---------------------------------------------------------------------------

describe('Time — Boundary and edge cases', () => {
  it('zero seconds converts to zero in any unit', () => {
    expect(valueOf(to(min, s(0)))).toBe(0);
    expect(valueOf(to(yr, s(0)))).toBe(0);
  });

  it('negative time converts correctly', () => {
    expect(valueOf(to(s, min(-5)))).toBe(-300);
  });

  it('Infinity propagates', () => {
    expect(valueOf(to(s, h(Infinity)))).toBe(Infinity);
  });

  it('string input: s("30") works', () => {
    expect(valueOf(s('30'))).toBe(30);
  });

  it('string throws on non-numeric', () => {
    expect(() => s('abc')).toThrow(TypeError);
    expect(() => h('')).toThrow(TypeError);
  });

  it('mul with scalar', () => {
    expect(valueOf(mul(scalar(2), s(30)))).toBe(60);
  });

  it('div with scalar', () => {
    expect(valueOf(div(h(8), scalar(2)))).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// SECTION K — Scale factor metadata
// ---------------------------------------------------------------------------

describe('Time — Scale factor metadata', () => {
  it('s._scale = 1', () => expect(s._scale).toBe(1));
  it('ms._scale = 0.001', () => expect(ms._scale).toBe(0.001));
  it('min._scale = 60', () => expect(min._scale).toBe(60));
  it('h._scale = 3600', () => expect(h._scale).toBe(3600));
  it('ns._scale = 1e-9', () => expect(ns._scale).toBe(1e-9));
  it('us._scale = 1e-6', () => expect(us._scale).toBe(1e-6));
  it('d._scale = 86400', () => expect(d._scale).toBe(86400));
  it('week._scale = 604800', () => expect(week._scale).toBe(604800));
  it('month._scale = 2629800', () => expect(month._scale).toBe(2629800));
  it('yr._scale = 31557600', () => expect(yr._scale).toBe(31557600));
  it('decade._scale = 315576000', () => expect(decade._scale).toBe(315576000));
  it('century._scale = 3155760000', () => expect(century._scale).toBe(3155760000));
  it('plt._scale = 5.391247e-44', () => expect(plt._scale).toBe(5.391247e-44));
});
