/**
 * PARANOIC ACCEPTANCE TESTS — POWER DIMENSION
 *
 * Units under test (5 total):
 *   W, kW, MW, hp, ppow
 *
 * Coverage strategy:
 *   - Factory creation for every unit
 *   - Conversion to/from SI base (W) for every unit
 *   - Roundtrip conversions
 *   - Chain: MW -> kW -> W
 *   - All pairwise conversions
 *   - add/sub for every unit
 *   - format for every unit
 *   - Real-world: 1 hp ~ 746 W, household power in kW
 */

import { describe, it, expect } from 'vitest';
import {
  W, kW, MW, hp, ppow,
  add, sub, mul, div, to, valueOf, format, scalar,
} from '../../src/index.js';

// ---------------------------------------------------------------------------
// SECTION A — Factory creation
// ---------------------------------------------------------------------------

describe('Power — Factory creation', () => {
  const factories = [
    { name: 'W',    fn: W,    label: 'W' },
    { name: 'kW',   fn: kW,   label: 'kW' },
    { name: 'MW',   fn: MW,   label: 'MW' },
    { name: 'hp',   fn: hp,   label: 'hp' },
    { name: 'ppow', fn: ppow, label: 'ppow' },
  ] as const;

  for (const { name, fn, label } of factories) {
    it(`${name}(500) creates quantity with value 500 and label "${label}"`, () => {
      const q = fn(500);
      expect(valueOf(q)).toBe(500);
      expect(q._l).toBe(label);
      expect(q._o).toBe(0);
    });

    it(`${name}("745.7") creates quantity from string`, () => {
      expect(valueOf(fn('745.7'))).toBe(745.7);
    });

    it(`${name}(0) handles zero`, () => {
      expect(valueOf(fn(0))).toBe(0);
    });

    it(`${name}(-100) handles negative`, () => {
      expect(valueOf(fn(-100))).toBe(-100);
    });
  }

  it('all power factories share dimension [2,1,-3,0,0,0,0,0]', () => {
    for (const { fn } of factories) {
      expect(fn._dim).toEqual([2, 1, -3, 0, 0, 0, 0, 0]);
    }
  });
});

// ---------------------------------------------------------------------------
// SECTION B — Conversion to W and roundtrip
// ---------------------------------------------------------------------------

describe('Power — Conversion to SI (W) and roundtrip', () => {
  const units = [
    { name: 'kW',   fn: kW,   scale: 1000,              testVal: 5 },
    { name: 'MW',   fn: MW,   scale: 1e6,               testVal: 1 },
    { name: 'hp',   fn: hp,   scale: 745.69987158227,    testVal: 1 },
    { name: 'ppow', fn: ppow, scale: 3.62831e52,         testVal: 1 },
  ];

  for (const { name, fn, scale, testVal } of units) {
    it(`${name}(${testVal}) -> W gives ${testVal} * ${scale}`, () => {
      const result = valueOf(to(W, fn(testVal)));
      const expected = testVal * scale;
      if (Math.abs(expected) > 1e6) {
        expect(result / expected).toBeCloseTo(1, 5);
      } else {
        expect(result).toBeCloseTo(expected, 2);
      }
    });

    it(`roundtrip: ${name} -> W -> ${name} preserves value`, () => {
      const original = fn(testVal);
      const inW = to(W, original);
      const back = to(fn, inW);
      expect(valueOf(back)).toBeCloseTo(testVal, 6);
    });
  }

  it('W -> W is identity', () => {
    expect(valueOf(to(W, W(746)))).toBe(746);
  });
});

// ---------------------------------------------------------------------------
// SECTION C — Chain: MW -> kW -> W
// ---------------------------------------------------------------------------

describe('Power — Chain conversions (MW -> kW -> W)', () => {
  it('1 MW = 1000 kW', () => {
    expect(valueOf(to(kW, MW(1)))).toBe(1000);
  });

  it('1 kW = 1000 W', () => {
    expect(valueOf(to(W, kW(1)))).toBe(1000);
  });

  it('1 MW = 1e6 W', () => {
    expect(valueOf(to(W, MW(1)))).toBe(1e6);
  });

  it('1 W = 0.001 kW', () => {
    expect(valueOf(to(kW, W(1)))).toBe(0.001);
  });

  it('1 kW = 0.001 MW', () => {
    expect(valueOf(to(MW, kW(1)))).toBe(0.001);
  });

  it('1 W = 1e-6 MW', () => {
    expect(valueOf(to(MW, W(1)))).toBe(1e-6);
  });
});

// ---------------------------------------------------------------------------
// SECTION D — Pairwise conversions
// ---------------------------------------------------------------------------

describe('Power — Pairwise conversions', () => {
  it('1 hp = ~745.7 W', () => {
    expect(valueOf(to(W, hp(1)))).toBeCloseTo(745.7, 0);
  });

  it('1 hp = ~0.7457 kW', () => {
    expect(valueOf(to(kW, hp(1)))).toBeCloseTo(0.7457, 3);
  });

  it('1 kW = 1.341 hp', () => {
    expect(valueOf(to(hp, kW(1)))).toBeCloseTo(1.341, 2);
  });

  it('1 MW = 1341 hp', () => {
    expect(valueOf(to(hp, MW(1)))).toBeCloseTo(1341, 0);
  });

  it('746 W = ~1 hp', () => {
    expect(valueOf(to(hp, W(746)))).toBeCloseTo(1, 2);
  });

  it('ppow -> W gives Planck power', () => {
    const result = valueOf(to(W, ppow(1)));
    expect(result).toBeCloseTo(3.62831e52, -46);
  });

  it('ppow -> kW', () => {
    const result = valueOf(to(kW, ppow(1)));
    expect(result).toBeCloseTo(3.62831e49, -43);
  });

  it('ppow -> hp', () => {
    const result = valueOf(to(hp, ppow(1)));
    expect(result / (3.62831e52 / 745.69987158227)).toBeCloseTo(1, 3);
  });
});

// ---------------------------------------------------------------------------
// SECTION E — add/sub for every unit
// ---------------------------------------------------------------------------

describe('Power — Arithmetic (add/sub)', () => {
  it('add: W(500) + W(250) = W(750)', () => {
    expect(valueOf(add(W(500), W(250)))).toBe(750);
  });

  it('sub: kW(10) - kW(3) = kW(7)', () => {
    expect(valueOf(sub(kW(10), kW(3)))).toBe(7);
  });

  it('add: MW(1) + MW(0.5) = MW(1.5)', () => {
    expect(valueOf(add(MW(1), MW(0.5)))).toBe(1.5);
  });

  it('sub: hp(200) - hp(50) = hp(150)', () => {
    expect(valueOf(sub(hp(200), hp(50)))).toBe(150);
  });

  it('add: ppow(1) + ppow(1) = ppow(2)', () => {
    expect(valueOf(add(ppow(1), ppow(1)))).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// SECTION F — format for every unit
// ---------------------------------------------------------------------------

describe('Power — format()', () => {
  it('format(W(500)) = "500 W"', () => expect(format(W(500))).toBe('500 W'));
  it('format(kW(1.5)) = "1.5 kW"', () => expect(format(kW(1.5))).toBe('1.5 kW'));
  it('format(MW(10)) = "10 MW"', () => expect(format(MW(10))).toBe('10 MW'));
  it('format(hp(200)) = "200 hp"', () => expect(format(hp(200))).toBe('200 hp'));
  it('format(ppow(1)) = "1 ppow"', () => expect(format(ppow(1))).toBe('1 ppow'));
  it('format with precision', () => {
    expect(format(W(745.69987), { precision: 0 })).toBe('746 W');
    expect(format(hp(1.341), { precision: 2 })).toBe('1.34 hp');
  });
});

// ---------------------------------------------------------------------------
// SECTION G — Real-world reference values
// ---------------------------------------------------------------------------

describe('Power — Real-world reference values', () => {
  it('1 mechanical horsepower = ~745.7 W', () => {
    expect(valueOf(to(W, hp(1)))).toBeCloseTo(745.7, 0);
  });

  it('average US household: ~1.2 kW average consumption', () => {
    expect(valueOf(to(W, kW(1.2)))).toBe(1200);
  });

  it('electric car motor: ~150 kW = ~201 hp', () => {
    expect(valueOf(to(hp, kW(150)))).toBeCloseTo(201, 0);
  });

  it('microwave oven: ~1000 W = 1 kW', () => {
    expect(valueOf(to(kW, W(1000)))).toBe(1);
  });

  it('nuclear power plant: ~1000 MW = 1 GW', () => {
    expect(valueOf(to(W, MW(1000)))).toBe(1e9);
  });

  it('human body at rest: ~80 W = ~0.107 hp', () => {
    expect(valueOf(to(hp, W(80)))).toBeCloseTo(0.107, 2);
  });

  it('V8 engine: ~300 hp = ~223.7 kW', () => {
    expect(valueOf(to(kW, hp(300)))).toBeCloseTo(223.7, 0);
  });

  it('LED light bulb: 10 W = 0.01 kW', () => {
    expect(valueOf(to(kW, W(10)))).toBe(0.01);
  });
});

// ---------------------------------------------------------------------------
// SECTION H — Boundary and edge cases
// ---------------------------------------------------------------------------

describe('Power — Boundary and edge cases', () => {
  it('zero power converts to zero', () => {
    expect(valueOf(to(W, kW(0)))).toBe(0);
    expect(valueOf(to(hp, W(0)))).toBe(0);
  });

  it('negative power converts correctly', () => {
    expect(valueOf(to(W, kW(-5)))).toBe(-5000);
  });

  it('Infinity propagates', () => {
    expect(valueOf(to(W, MW(Infinity)))).toBe(Infinity);
  });

  it('string throws on non-numeric', () => {
    expect(() => W('abc')).toThrow(TypeError);
    expect(() => hp('')).toThrow(TypeError);
  });

  it('scalar mul/div works', () => {
    expect(valueOf(mul(scalar(2), W(500)))).toBe(1000);
    expect(valueOf(div(kW(10), scalar(2)))).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// SECTION I — Scale metadata
// ---------------------------------------------------------------------------

describe('Power — Scale metadata', () => {
  it('W._scale = 1', () => expect(W._scale).toBe(1));
  it('kW._scale = 1000', () => expect(kW._scale).toBe(1000));
  it('MW._scale = 1e6', () => expect(MW._scale).toBe(1e6));
  it('hp._scale = 745.69987158227', () => expect(hp._scale).toBe(745.69987158227));
  it('ppow._scale = 3.62831e52', () => expect(ppow._scale).toBe(3.62831e52));
});
