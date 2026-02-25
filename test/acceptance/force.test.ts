/**
 * PARANOIC ACCEPTANCE TESTS — FORCE DIMENSION
 *
 * Units under test (5 total):
 *   N, kN, lbf, dyn, pfo
 *
 * Coverage strategy:
 *   - Factory creation for every unit
 *   - Conversion to/from SI base (N) for every unit
 *   - Roundtrip conversions
 *   - All meaningful pairwise conversions
 *   - add/sub for every unit
 *   - format for every unit
 *   - Real-world: 1 kg weight, dyn definition, etc.
 */

import { describe, it, expect } from 'vitest';
import {
  N, kN, lbf, dyn, pfo,
  add, sub, mul, div, to, valueOf, format, scalar,
} from '../../src/index.js';

// ---------------------------------------------------------------------------
// SECTION A — Factory creation
// ---------------------------------------------------------------------------

describe('Force — Factory creation', () => {
  const factories = [
    { name: 'N',   fn: N,   label: 'N' },
    { name: 'kN',  fn: kN,  label: 'kN' },
    { name: 'lbf', fn: lbf, label: 'lbf' },
    { name: 'dyn', fn: dyn, label: 'dyn' },
    { name: 'pfo', fn: pfo, label: 'pfo' },
  ] as const;

  for (const { name, fn, label } of factories) {
    it(`${name}(100) creates quantity with value 100 and label "${label}"`, () => {
      const q = fn(100);
      expect(valueOf(q)).toBe(100);
      expect(q._l).toBe(label);
      expect(q._o).toBe(0);
    });

    it(`${name}("9.807") creates quantity from string`, () => {
      expect(valueOf(fn('9.807'))).toBe(9.807);
    });

    it(`${name}(0) handles zero`, () => {
      expect(valueOf(fn(0))).toBe(0);
    });

    it(`${name}(-5) handles negative`, () => {
      expect(valueOf(fn(-5))).toBe(-5);
    });
  }

  it('all force factories share dimension [1,1,-2,0,0,0,0,0]', () => {
    for (const { fn } of factories) {
      expect(fn._dim).toEqual([1, 1, -2, 0, 0, 0, 0, 0]);
    }
  });
});

// ---------------------------------------------------------------------------
// SECTION B — Conversion to N and roundtrip
// ---------------------------------------------------------------------------

describe('Force — Conversion to SI (N) and roundtrip', () => {
  const units = [
    { name: 'kN',  fn: kN,  scale: 1000,             testVal: 5 },
    { name: 'lbf', fn: lbf, scale: 4.4482216152605,   testVal: 10 },
    { name: 'dyn', fn: dyn, scale: 1e-5,             testVal: 1e5 },
    { name: 'pfo', fn: pfo, scale: 1.21027e44,        testVal: 1 },
  ];

  for (const { name, fn, scale, testVal } of units) {
    it(`${name}(${testVal}) -> N gives ${testVal} * ${scale}`, () => {
      const result = valueOf(to(N, fn(testVal)));
      const expected = testVal * scale;
      if (Math.abs(expected) > 1e6) {
        expect(result / expected).toBeCloseTo(1, 5);
      } else {
        expect(result).toBeCloseTo(expected, 4);
      }
    });

    it(`roundtrip: ${name} -> N -> ${name} preserves value`, () => {
      const original = fn(testVal);
      const inN = to(N, original);
      const back = to(fn, inN);
      expect(valueOf(back)).toBeCloseTo(testVal, 6);
    });
  }

  it('N -> N is identity', () => {
    expect(valueOf(to(N, N(9.807)))).toBe(9.807);
  });
});

// ---------------------------------------------------------------------------
// SECTION C — Pairwise conversions
// ---------------------------------------------------------------------------

describe('Force — Pairwise conversions', () => {
  it('1 kN = 1000 N', () => {
    expect(valueOf(to(N, kN(1)))).toBe(1000);
  });

  it('1000 N = 1 kN', () => {
    expect(valueOf(to(kN, N(1000)))).toBe(1);
  });

  it('1 lbf = 4.44822 N', () => {
    expect(valueOf(to(N, lbf(1)))).toBeCloseTo(4.44822, 3);
  });

  it('1 N = 0.22481 lbf', () => {
    expect(valueOf(to(lbf, N(1)))).toBeCloseTo(0.22481, 3);
  });

  it('1 dyn = 1e-5 N', () => {
    expect(valueOf(to(N, dyn(1)))).toBe(1e-5);
  });

  it('1 N = 1e5 dyn', () => {
    expect(valueOf(to(dyn, N(1)))).toBeCloseTo(1e5, 0);
  });

  it('1 kN = 224.809 lbf', () => {
    expect(valueOf(to(lbf, kN(1)))).toBeCloseTo(224.809, 0);
  });

  it('1 lbf = 444822.16 dyn', () => {
    expect(valueOf(to(dyn, lbf(1)))).toBeCloseTo(444822.16, -1);
  });

  it('1 kN = 1e8 dyn', () => {
    expect(valueOf(to(dyn, kN(1)))).toBeCloseTo(1e8, 0);
  });

  it('pfo -> N gives Planck force', () => {
    const result = valueOf(to(N, pfo(1)));
    expect(result).toBeCloseTo(1.21027e44, -38);
  });
});

// ---------------------------------------------------------------------------
// SECTION D — add/sub for every unit
// ---------------------------------------------------------------------------

describe('Force — Arithmetic (add/sub)', () => {
  it('add: N(100) + N(50) = N(150)', () => {
    expect(valueOf(add(N(100), N(50)))).toBe(150);
  });

  it('sub: kN(10) - kN(3) = kN(7)', () => {
    expect(valueOf(sub(kN(10), kN(3)))).toBe(7);
  });

  it('add: lbf(100) + lbf(50) = lbf(150)', () => {
    expect(valueOf(add(lbf(100), lbf(50)))).toBe(150);
  });

  it('sub: dyn(1e5) - dyn(5e4) = dyn(50000)', () => {
    expect(valueOf(sub(dyn(1e5), dyn(5e4)))).toBe(50000);
  });

  it('add: pfo(1) + pfo(1) = pfo(2)', () => {
    expect(valueOf(add(pfo(1), pfo(1)))).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// SECTION E — format for every unit
// ---------------------------------------------------------------------------

describe('Force — format()', () => {
  it('format(N(9.807)) = "9.807 N"', () => expect(format(N(9.807))).toBe('9.807 N'));
  it('format(kN(5)) = "5 kN"', () => expect(format(kN(5))).toBe('5 kN'));
  it('format(lbf(10)) = "10 lbf"', () => expect(format(lbf(10))).toBe('10 lbf'));
  it('format(dyn(100000)) = "100000 dyn"', () => expect(format(dyn(100000))).toBe('100000 dyn'));
  it('format(pfo(1)) = "1 pfo"', () => expect(format(pfo(1))).toBe('1 pfo'));
  it('format with precision', () => {
    expect(format(N(9.80665), { precision: 2 })).toBe('9.81 N');
    expect(format(lbf(2.20462), { precision: 1 })).toBe('2.2 lbf');
  });
});

// ---------------------------------------------------------------------------
// SECTION F — Real-world reference values
// ---------------------------------------------------------------------------

describe('Force — Real-world reference values', () => {
  it('1 kg weight at Earth surface: ~9.807 N', () => {
    // F = m * g; g ~ 9.80665 m/s^2
    const weight = N(9.80665);
    expect(valueOf(weight)).toBeCloseTo(9.807, 2);
  });

  it('1 lbf = weight of 1 pound at Earth surface', () => {
    // 1 lbf = 0.45359237 kg * 9.80665 m/s^2 = 4.44822 N
    expect(valueOf(to(N, lbf(1)))).toBeCloseTo(4.44822, 2);
  });

  it('dyn is CGS force unit: 1 dyn = 1 g * cm/s^2 = 1e-5 N', () => {
    expect(dyn._scale).toBe(1e-5);
  });

  it('apple falling: ~1 N (mass ~102 g)', () => {
    // F = 0.102 kg * 9.81 m/s^2 ~ 1 N
    const force = N(0.102 * 9.81);
    expect(valueOf(force)).toBeCloseTo(1, 0);
  });

  it('car engine thrust: ~2 kN at highway speed', () => {
    expect(valueOf(to(N, kN(2)))).toBe(2000);
  });

  it('Saturn V thrust at liftoff: ~7600 kN = 7.6e6 N', () => {
    expect(valueOf(to(N, kN(7600)))).toBe(7600000);
  });
});

// ---------------------------------------------------------------------------
// SECTION G — Boundary and edge cases
// ---------------------------------------------------------------------------

describe('Force — Boundary and edge cases', () => {
  it('zero force converts to zero', () => {
    expect(valueOf(to(N, kN(0)))).toBe(0);
    expect(valueOf(to(lbf, N(0)))).toBe(0);
  });

  it('negative force converts correctly', () => {
    expect(valueOf(to(N, kN(-5)))).toBe(-5000);
  });

  it('Infinity propagates', () => {
    expect(valueOf(to(N, kN(Infinity)))).toBe(Infinity);
  });

  it('string throws on non-numeric', () => {
    expect(() => N('abc')).toThrow(TypeError);
    expect(() => kN('')).toThrow(TypeError);
  });

  it('scalar mul/div works', () => {
    expect(valueOf(mul(scalar(3), N(10)))).toBe(30);
    expect(valueOf(div(kN(10), scalar(2)))).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// SECTION H — Scale metadata
// ---------------------------------------------------------------------------

describe('Force — Scale metadata', () => {
  it('N._scale = 1', () => expect(N._scale).toBe(1));
  it('kN._scale = 1000', () => expect(kN._scale).toBe(1000));
  it('lbf._scale = 4.4482216152605', () => expect(lbf._scale).toBe(4.4482216152605));
  it('dyn._scale = 1e-5', () => expect(dyn._scale).toBe(1e-5));
  it('pfo._scale = 1.21027e44', () => expect(pfo._scale).toBe(1.21027e44));
});
