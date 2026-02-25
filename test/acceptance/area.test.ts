/**
 * PARANOIC ACCEPTANCE TESTS — AREA DIMENSION
 *
 * Units under test (11 total):
 *   mm2, cm2, m2, ha, km2, in2, ft2, yd2, ac, mi2, pla
 *
 * Coverage strategy:
 *   - Factory creation (numeric + string) for every unit
 *   - Conversion to/from SI base (m2) for every unit
 *   - Roundtrip conversions
 *   - Metric chain: mm2 -> cm2 -> m2 -> ha -> km2
 *   - Imperial chain: in2 -> ft2 -> yd2 -> ac -> mi2
 *   - Cross-system: ft2 -> m2, ac -> ha, mi2 -> km2
 *   - add/sub for every unit
 *   - format for every unit
 *   - Real-world: football field, house lot, etc.
 */

import { describe, it, expect } from 'vitest';
import {
  mm2, cm2, m2, ha, km2, in2, ft2, yd2, ac, mi2, pla,
  add, sub, mul, div, to, valueOf, format, scalar,
} from '../../src/index.js';

// ---------------------------------------------------------------------------
// SECTION A — Factory creation
// ---------------------------------------------------------------------------

describe('Area — Factory creation', () => {
  const factories = [
    { name: 'mm2', fn: mm2, label: 'mm2' },
    { name: 'cm2', fn: cm2, label: 'cm2' },
    { name: 'm2',  fn: m2,  label: 'm2' },
    { name: 'ha',  fn: ha,  label: 'ha' },
    { name: 'km2', fn: km2, label: 'km2' },
    { name: 'in2', fn: in2, label: 'in2' },
    { name: 'ft2', fn: ft2, label: 'ft2' },
    { name: 'yd2', fn: yd2, label: 'yd2' },
    { name: 'ac',  fn: ac,  label: 'ac' },
    { name: 'mi2', fn: mi2, label: 'mi2' },
    { name: 'pla', fn: pla, label: 'pla' },
  ] as const;

  for (const { name, fn, label } of factories) {
    it(`${name}(50) creates quantity with value 50 and label "${label}"`, () => {
      const q = fn(50);
      expect(valueOf(q)).toBe(50);
      expect(q._l).toBe(label);
      expect(q._o).toBe(0);
    });

    it(`${name}("12.5") creates quantity from string`, () => {
      expect(valueOf(fn('12.5'))).toBe(12.5);
    });

    it(`${name}(0) handles zero`, () => {
      expect(valueOf(fn(0))).toBe(0);
    });
  }

  it('all area factories share dimension [2,0,0,0,0,0,0,0]', () => {
    for (const { fn } of factories) {
      expect(fn._dim).toEqual([2, 0, 0, 0, 0, 0, 0, 0]);
    }
  });
});

// ---------------------------------------------------------------------------
// SECTION B — Conversion to m2 and roundtrip
// ---------------------------------------------------------------------------

describe('Area — Conversion to SI (m2) and roundtrip', () => {
  const units = [
    { name: 'mm2', fn: mm2, scale: 1e-6,           testVal: 1e6 },
    { name: 'cm2', fn: cm2, scale: 1e-4,           testVal: 10000 },
    { name: 'ha',  fn: ha,  scale: 10000,          testVal: 1 },
    { name: 'km2', fn: km2, scale: 1e6,            testVal: 1 },
    { name: 'in2', fn: in2, scale: 6.4516e-4,      testVal: 144 },
    { name: 'ft2', fn: ft2, scale: 0.09290304,     testVal: 100 },
    { name: 'yd2', fn: yd2, scale: 0.83612736,     testVal: 100 },
    { name: 'ac',  fn: ac,  scale: 4046.8564224,   testVal: 1 },
    { name: 'mi2', fn: mi2, scale: 2589988.110336, testVal: 1 },
    { name: 'pla', fn: pla, scale: 2.61228e-70,    testVal: 1 },
  ];

  for (const { name, fn, scale, testVal } of units) {
    it(`${name}(${testVal}) -> m2 gives ${testVal} * ${scale}`, () => {
      const result = valueOf(to(m2, fn(testVal)));
      const expected = testVal * scale;
      if (Math.abs(expected) > 1e6 || Math.abs(expected) < 1e-6) {
        expect(result / expected).toBeCloseTo(1, 5);
      } else {
        expect(result).toBeCloseTo(expected, 4);
      }
    });

    it(`roundtrip: ${name} -> m2 -> ${name} preserves value`, () => {
      const original = fn(testVal);
      const inM2 = to(m2, original);
      const back = to(fn, inM2);
      expect(valueOf(back)).toBeCloseTo(testVal, 4);
    });
  }

  it('m2 -> m2 is identity', () => {
    expect(valueOf(to(m2, m2(100)))).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// SECTION C — Metric chain: mm2 -> cm2 -> m2 -> ha -> km2
// ---------------------------------------------------------------------------

describe('Area — Metric chain', () => {
  it('100 mm2 = 1 cm2', () => {
    expect(valueOf(to(cm2, mm2(100)))).toBeCloseTo(1, 6);
  });

  it('10000 cm2 = 1 m2', () => {
    expect(valueOf(to(m2, cm2(10000)))).toBeCloseTo(1, 4);
  });

  it('10000 m2 = 1 ha', () => {
    expect(valueOf(to(ha, m2(10000)))).toBe(1);
  });

  it('100 ha = 1 km2', () => {
    expect(valueOf(to(km2, ha(100)))).toBe(1);
  });

  it('1e6 m2 = 1 km2', () => {
    expect(valueOf(to(km2, m2(1e6)))).toBe(1);
  });

  it('1 km2 = 1e6 m2', () => {
    expect(valueOf(to(m2, km2(1)))).toBe(1e6);
  });

  it('1 m2 = 1e6 mm2', () => {
    expect(valueOf(to(mm2, m2(1)))).toBeCloseTo(1e6, 0);
  });
});

// ---------------------------------------------------------------------------
// SECTION D — Imperial chain: in2 -> ft2 -> yd2 -> ac -> mi2
// ---------------------------------------------------------------------------

describe('Area — Imperial chain', () => {
  it('144 in2 = 1 ft2', () => {
    expect(valueOf(to(ft2, in2(144)))).toBeCloseTo(1, 4);
  });

  it('9 ft2 = 1 yd2', () => {
    expect(valueOf(to(yd2, ft2(9)))).toBeCloseTo(1, 4);
  });

  it('4840 yd2 = 1 ac', () => {
    expect(valueOf(to(ac, yd2(4840)))).toBeCloseTo(1, 3);
  });

  it('640 ac = 1 mi2', () => {
    expect(valueOf(to(mi2, ac(640)))).toBeCloseTo(1, 3);
  });

  it('1 mi2 = 640 ac', () => {
    expect(valueOf(to(ac, mi2(1)))).toBeCloseTo(640, 2);
  });

  it('1 ac = 43560 ft2', () => {
    expect(valueOf(to(ft2, ac(1)))).toBeCloseTo(43560, 0);
  });

  it('1 mi2 = 27878400 ft2', () => {
    expect(valueOf(to(ft2, mi2(1)))).toBeCloseTo(27878400, -2);
  });

  it('1 ft2 = 144 in2', () => {
    expect(valueOf(to(in2, ft2(1)))).toBeCloseTo(144, 2);
  });

  it('1 yd2 = 1296 in2', () => {
    expect(valueOf(to(in2, yd2(1)))).toBeCloseTo(1296, 0);
  });
});

// ---------------------------------------------------------------------------
// SECTION E — Cross-system conversions
// ---------------------------------------------------------------------------

describe('Area — Cross-system conversions', () => {
  it('1 ft2 = 0.09290304 m2', () => {
    expect(valueOf(to(m2, ft2(1)))).toBeCloseTo(0.09290304, 6);
  });

  it('1 m2 = 10.7639 ft2', () => {
    expect(valueOf(to(ft2, m2(1)))).toBeCloseTo(10.7639, 2);
  });

  it('1 ac = 0.404686 ha', () => {
    expect(valueOf(to(ha, ac(1)))).toBeCloseTo(0.404686, 4);
  });

  it('1 ha = 2.47105 ac', () => {
    expect(valueOf(to(ac, ha(1)))).toBeCloseTo(2.47105, 3);
  });

  it('1 mi2 = 2.58999 km2', () => {
    expect(valueOf(to(km2, mi2(1)))).toBeCloseTo(2.58999, 3);
  });

  it('1 km2 = 0.386102 mi2', () => {
    expect(valueOf(to(mi2, km2(1)))).toBeCloseTo(0.386102, 4);
  });

  it('1 in2 = 6.4516 cm2', () => {
    expect(valueOf(to(cm2, in2(1)))).toBeCloseTo(6.4516, 4);
  });

  it('1 yd2 = 0.836127 m2', () => {
    expect(valueOf(to(m2, yd2(1)))).toBeCloseTo(0.836127, 4);
  });
});

// ---------------------------------------------------------------------------
// SECTION F — add/sub for every unit
// ---------------------------------------------------------------------------

describe('Area — Arithmetic (add/sub)', () => {
  it('add: mm2(500) + mm2(500) = mm2(1000)', () => {
    expect(valueOf(add(mm2(500), mm2(500)))).toBe(1000);
  });

  it('sub: cm2(10000) - cm2(5000) = cm2(5000)', () => {
    expect(valueOf(sub(cm2(10000), cm2(5000)))).toBe(5000);
  });

  it('add: m2(50) + m2(50) = m2(100)', () => {
    expect(valueOf(add(m2(50), m2(50)))).toBe(100);
  });

  it('sub: ha(10) - ha(3) = ha(7)', () => {
    expect(valueOf(sub(ha(10), ha(3)))).toBe(7);
  });

  it('add: km2(1) + km2(1.5) = km2(2.5)', () => {
    expect(valueOf(add(km2(1), km2(1.5)))).toBe(2.5);
  });

  it('add: in2(100) + in2(44) = in2(144)', () => {
    expect(valueOf(add(in2(100), in2(44)))).toBe(144);
  });

  it('sub: ft2(1000) - ft2(400) = ft2(600)', () => {
    expect(valueOf(sub(ft2(1000), ft2(400)))).toBe(600);
  });

  it('add: yd2(4840) + yd2(4840) = yd2(9680)', () => {
    expect(valueOf(add(yd2(4840), yd2(4840)))).toBe(9680);
  });

  it('sub: ac(640) - ac(40) = ac(600)', () => {
    expect(valueOf(sub(ac(640), ac(40)))).toBe(600);
  });

  it('add: mi2(1) + mi2(1) = mi2(2)', () => {
    expect(valueOf(add(mi2(1), mi2(1)))).toBe(2);
  });

  it('add: pla(10) + pla(5) = pla(15)', () => {
    expect(valueOf(add(pla(10), pla(5)))).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// SECTION G — format for every unit
// ---------------------------------------------------------------------------

describe('Area — format()', () => {
  it('format(mm2(100)) = "100 mm2"', () => expect(format(mm2(100))).toBe('100 mm2'));
  it('format(cm2(50)) = "50 cm2"', () => expect(format(cm2(50))).toBe('50 cm2'));
  it('format(m2(100)) = "100 m2"', () => expect(format(m2(100))).toBe('100 m2'));
  it('format(ha(2.5)) = "2.5 ha"', () => expect(format(ha(2.5))).toBe('2.5 ha'));
  it('format(km2(1)) = "1 km2"', () => expect(format(km2(1))).toBe('1 km2'));
  it('format(in2(144)) = "144 in2"', () => expect(format(in2(144))).toBe('144 in2'));
  it('format(ft2(1000)) = "1000 ft2"', () => expect(format(ft2(1000))).toBe('1000 ft2'));
  it('format(yd2(4840)) = "4840 yd2"', () => expect(format(yd2(4840))).toBe('4840 yd2'));
  it('format(ac(10)) = "10 ac"', () => expect(format(ac(10))).toBe('10 ac'));
  it('format(mi2(1)) = "1 mi2"', () => expect(format(mi2(1))).toBe('1 mi2'));
  it('format(pla(1)) = "1 pla"', () => expect(format(pla(1))).toBe('1 pla'));
  it('format with precision', () => {
    expect(format(m2(123.456), { precision: 1 })).toBe('123.5 m2');
    expect(format(ac(2.471), { precision: 2 })).toBe('2.47 ac');
  });
});

// ---------------------------------------------------------------------------
// SECTION H — Real-world reference values
// ---------------------------------------------------------------------------

describe('Area — Real-world reference values', () => {
  it('American football field: 57600 ft2 = ~5351 m2', () => {
    // 100 yd x 160 ft = 48000 ft2 is playing field
    // Full field with end zones: 120 yd x 160 ft = 57600 ft2
    // But 100yd * 160ft = let's use yd2: 100yd * 53.33yd = 5333 yd2
    expect(valueOf(to(m2, ft2(57600)))).toBeCloseTo(5351, -1);
  });

  it('soccer pitch: ~7140 m2 (typical 105m x 68m)', () => {
    const pitch = m2(105 * 68);
    expect(valueOf(pitch)).toBe(7140);
  });

  it('house lot: 0.25 ac = ~1011.7 m2', () => {
    expect(valueOf(to(m2, ac(0.25)))).toBeCloseTo(1011.7, 0);
  });

  it('house lot: 0.25 ac = ~10890 ft2', () => {
    expect(valueOf(to(ft2, ac(0.25)))).toBeCloseTo(10890, -1);
  });

  it('Manhattan: ~22.8 mi2 = ~59 km2', () => {
    expect(valueOf(to(km2, mi2(22.8)))).toBeCloseTo(59, 0);
  });

  it('tennis court: 2808 ft2 = ~260.87 m2', () => {
    expect(valueOf(to(m2, ft2(2808)))).toBeCloseTo(260.87, 0);
  });

  it('A4 paper: 62370 mm2 = 623.7 cm2', () => {
    expect(valueOf(to(cm2, mm2(62370)))).toBeCloseTo(623.7, 1);
  });
});

// ---------------------------------------------------------------------------
// SECTION I — Boundary and edge cases
// ---------------------------------------------------------------------------

describe('Area — Boundary and edge cases', () => {
  it('zero area converts to zero', () => {
    expect(valueOf(to(m2, ft2(0)))).toBe(0);
    expect(valueOf(to(km2, m2(0)))).toBe(0);
  });

  it('negative area (mathematical, not physical)', () => {
    expect(valueOf(to(m2, ft2(-100)))).toBeCloseTo(-9.290304, 4);
  });

  it('Infinity propagates', () => {
    expect(valueOf(to(m2, km2(Infinity)))).toBe(Infinity);
  });

  it('string input works', () => {
    expect(valueOf(m2('100'))).toBe(100);
  });

  it('string throws on non-numeric', () => {
    expect(() => m2('abc')).toThrow(TypeError);
    expect(() => ft2('')).toThrow(TypeError);
  });

  it('scalar mul/div works', () => {
    expect(valueOf(mul(scalar(2), m2(50)))).toBe(100);
    expect(valueOf(div(m2(100), scalar(4)))).toBe(25);
  });
});

// ---------------------------------------------------------------------------
// SECTION J — Scale metadata
// ---------------------------------------------------------------------------

describe('Area — Scale metadata', () => {
  it('mm2._scale = 1e-6', () => expect(mm2._scale).toBe(1e-6));
  it('cm2._scale = 1e-4', () => expect(cm2._scale).toBe(1e-4));
  it('m2._scale = 1', () => expect(m2._scale).toBe(1));
  it('ha._scale = 10000', () => expect(ha._scale).toBe(10000));
  it('km2._scale = 1e6', () => expect(km2._scale).toBe(1e6));
  it('in2._scale = 6.4516e-4', () => expect(in2._scale).toBe(6.4516e-4));
  it('ft2._scale = 0.09290304', () => expect(ft2._scale).toBe(0.09290304));
  it('yd2._scale = 0.83612736', () => expect(yd2._scale).toBe(0.83612736));
  it('ac._scale = 4046.8564224', () => expect(ac._scale).toBe(4046.8564224));
  it('mi2._scale = 2589988.110336', () => expect(mi2._scale).toBe(2589988.110336));
  it('pla._scale = 2.61228e-70', () => expect(pla._scale).toBe(2.61228e-70));
});
