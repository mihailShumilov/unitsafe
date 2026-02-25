/**
 * PARANOIC ACCEPTANCE TESTS — PRESSURE DIMENSION
 *
 * Units under test (7 total):
 *   Pa, kPa, bar, psi, atm, mmHg, ppre
 *
 * Coverage strategy:
 *   - Factory creation for every unit
 *   - Conversion to/from SI base (Pa) for every unit
 *   - Roundtrip conversions
 *   - All meaningful pairwise conversions
 *   - add/sub for every unit
 *   - format for every unit
 *   - Real-world: 1 atm = 101325 Pa, blood pressure, tire pressure
 */

import { describe, it, expect } from 'vitest';
import {
  Pa, kPa, bar, psi, atm, mmHg, ppre,
  add, sub, mul, div, to, valueOf, format, scalar,
} from '../../src/index.js';

// ---------------------------------------------------------------------------
// SECTION A — Factory creation
// ---------------------------------------------------------------------------

describe('Pressure — Factory creation', () => {
  const factories = [
    { name: 'Pa',   fn: Pa,   label: 'Pa' },
    { name: 'kPa',  fn: kPa,  label: 'kPa' },
    { name: 'bar',  fn: bar,  label: 'bar' },
    { name: 'psi',  fn: psi,  label: 'psi' },
    { name: 'atm',  fn: atm,  label: 'atm' },
    { name: 'mmHg', fn: mmHg, label: 'mmHg' },
    { name: 'ppre', fn: ppre, label: 'ppre' },
  ] as const;

  for (const { name, fn, label } of factories) {
    it(`${name}(101325) creates quantity with value 101325 and label "${label}"`, () => {
      const q = fn(101325);
      expect(valueOf(q)).toBe(101325);
      expect(q._l).toBe(label);
      expect(q._o).toBe(0);
    });

    it(`${name}("14.696") creates quantity from string`, () => {
      expect(valueOf(fn('14.696'))).toBe(14.696);
    });

    it(`${name}(0) handles zero`, () => {
      expect(valueOf(fn(0))).toBe(0);
    });

    it(`${name}(-1) handles negative`, () => {
      expect(valueOf(fn(-1))).toBe(-1);
    });
  }

  it('all pressure factories share dimension [-1,1,-2,0,0,0,0,0]', () => {
    for (const { fn } of factories) {
      expect(fn._dim).toEqual([-1, 1, -2, 0, 0, 0, 0, 0]);
    }
  });
});

// ---------------------------------------------------------------------------
// SECTION B — Conversion to Pa and roundtrip
// ---------------------------------------------------------------------------

describe('Pressure — Conversion to SI (Pa) and roundtrip', () => {
  const units = [
    { name: 'kPa',  fn: kPa,  scale: 1000,                 testVal: 101.325 },
    { name: 'bar',  fn: bar,  scale: 100000,                testVal: 1.01325 },
    { name: 'psi',  fn: psi,  scale: 6894.757293168361,     testVal: 14.696 },
    { name: 'atm',  fn: atm,  scale: 101325,                testVal: 1 },
    { name: 'mmHg', fn: mmHg, scale: 133.322387415,         testVal: 760 },
    { name: 'ppre', fn: ppre, scale: 4.63309e113,           testVal: 1 },
  ];

  for (const { name, fn, scale, testVal } of units) {
    it(`${name}(${testVal}) -> Pa gives ${testVal} * ${scale}`, () => {
      const result = valueOf(to(Pa, fn(testVal)));
      const expected = testVal * scale;
      if (Math.abs(expected) > 1e6) {
        expect(result / expected).toBeCloseTo(1, 5);
      } else {
        expect(result).toBeCloseTo(expected, 0);
      }
    });

    it(`roundtrip: ${name} -> Pa -> ${name} preserves value`, () => {
      const original = fn(testVal);
      const inPa = to(Pa, original);
      const back = to(fn, inPa);
      expect(valueOf(back)).toBeCloseTo(testVal, 4);
    });
  }

  it('Pa -> Pa is identity', () => {
    expect(valueOf(to(Pa, Pa(101325)))).toBe(101325);
  });
});

// ---------------------------------------------------------------------------
// SECTION C — Pairwise conversions
// ---------------------------------------------------------------------------

describe('Pressure — Pairwise conversions', () => {
  // kPa <-> Pa
  it('1 kPa = 1000 Pa', () => {
    expect(valueOf(to(Pa, kPa(1)))).toBe(1000);
  });

  it('1000 Pa = 1 kPa', () => {
    expect(valueOf(to(kPa, Pa(1000)))).toBe(1);
  });

  // bar <-> Pa
  it('1 bar = 100000 Pa', () => {
    expect(valueOf(to(Pa, bar(1)))).toBe(100000);
  });

  it('100000 Pa = 1 bar', () => {
    expect(valueOf(to(bar, Pa(100000)))).toBe(1);
  });

  // atm <-> Pa
  it('1 atm = 101325 Pa', () => {
    expect(valueOf(to(Pa, atm(1)))).toBe(101325);
  });

  it('101325 Pa = 1 atm', () => {
    expect(valueOf(to(atm, Pa(101325)))).toBe(1);
  });

  // psi <-> Pa
  it('1 psi = 6894.757 Pa', () => {
    expect(valueOf(to(Pa, psi(1)))).toBeCloseTo(6894.757, 0);
  });

  it('6894.757 Pa = 1 psi', () => {
    expect(valueOf(to(psi, Pa(6894.757293168361)))).toBeCloseTo(1, 6);
  });

  // mmHg <-> Pa
  it('1 mmHg = 133.322 Pa', () => {
    expect(valueOf(to(Pa, mmHg(1)))).toBeCloseTo(133.322, 1);
  });

  it('133.322 Pa = 1 mmHg', () => {
    expect(valueOf(to(mmHg, Pa(133.322387415)))).toBeCloseTo(1, 6);
  });

  // atm <-> bar
  it('1 atm = 1.01325 bar', () => {
    expect(valueOf(to(bar, atm(1)))).toBeCloseTo(1.01325, 4);
  });

  it('1 bar = 0.986923 atm', () => {
    expect(valueOf(to(atm, bar(1)))).toBeCloseTo(0.986923, 4);
  });

  // atm <-> psi
  it('1 atm = 14.696 psi', () => {
    expect(valueOf(to(psi, atm(1)))).toBeCloseTo(14.696, 1);
  });

  it('14.696 psi = ~1 atm', () => {
    expect(valueOf(to(atm, psi(14.696)))).toBeCloseTo(1, 2);
  });

  // atm <-> mmHg
  it('1 atm = 760 mmHg', () => {
    expect(valueOf(to(mmHg, atm(1)))).toBeCloseTo(760, 0);
  });

  it('760 mmHg = ~1 atm', () => {
    expect(valueOf(to(atm, mmHg(760)))).toBeCloseTo(1, 2);
  });

  // atm <-> kPa
  it('1 atm = 101.325 kPa', () => {
    expect(valueOf(to(kPa, atm(1)))).toBeCloseTo(101.325, 2);
  });

  // bar <-> psi
  it('1 bar = 14.5038 psi', () => {
    expect(valueOf(to(psi, bar(1)))).toBeCloseTo(14.5038, 2);
  });

  // psi <-> mmHg
  it('1 psi = 51.7149 mmHg', () => {
    expect(valueOf(to(mmHg, psi(1)))).toBeCloseTo(51.7149, 1);
  });

  // bar <-> kPa
  it('1 bar = 100 kPa', () => {
    expect(valueOf(to(kPa, bar(1)))).toBe(100);
  });

  // ppre <-> Pa
  it('ppre -> Pa gives Planck pressure', () => {
    const result = valueOf(to(Pa, ppre(1)));
    expect(result).toBeCloseTo(4.63309e113, -107);
  });
});

// ---------------------------------------------------------------------------
// SECTION D — add/sub for every unit
// ---------------------------------------------------------------------------

describe('Pressure — Arithmetic (add/sub)', () => {
  it('add: Pa(50000) + Pa(51325) = Pa(101325)', () => {
    expect(valueOf(add(Pa(50000), Pa(51325)))).toBe(101325);
  });

  it('sub: kPa(200) - kPa(100) = kPa(100)', () => {
    expect(valueOf(sub(kPa(200), kPa(100)))).toBe(100);
  });

  it('add: bar(1) + bar(0.5) = bar(1.5)', () => {
    expect(valueOf(add(bar(1), bar(0.5)))).toBe(1.5);
  });

  it('sub: psi(35) - psi(3) = psi(32)', () => {
    expect(valueOf(sub(psi(35), psi(3)))).toBe(32);
  });

  it('add: atm(1) + atm(0.5) = atm(1.5)', () => {
    expect(valueOf(add(atm(1), atm(0.5)))).toBe(1.5);
  });

  it('sub: mmHg(760) - mmHg(120) = mmHg(640)', () => {
    expect(valueOf(sub(mmHg(760), mmHg(120)))).toBe(640);
  });

  it('add: ppre(1) + ppre(1) = ppre(2)', () => {
    expect(valueOf(add(ppre(1), ppre(1)))).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// SECTION E — format for every unit
// ---------------------------------------------------------------------------

describe('Pressure — format()', () => {
  it('format(Pa(101325)) = "101325 Pa"', () => expect(format(Pa(101325))).toBe('101325 Pa'));
  it('format(kPa(101.325)) = "101.325 kPa"', () => expect(format(kPa(101.325))).toBe('101.325 kPa'));
  it('format(bar(1.01325)) = "1.01325 bar"', () => expect(format(bar(1.01325))).toBe('1.01325 bar'));
  it('format(psi(14.696)) = "14.696 psi"', () => expect(format(psi(14.696))).toBe('14.696 psi'));
  it('format(atm(1)) = "1 atm"', () => expect(format(atm(1))).toBe('1 atm'));
  it('format(mmHg(760)) = "760 mmHg"', () => expect(format(mmHg(760))).toBe('760 mmHg'));
  it('format(ppre(1)) = "1 ppre"', () => expect(format(ppre(1))).toBe('1 ppre'));
  it('format with precision', () => {
    expect(format(Pa(101325), { precision: 0 })).toBe('101325 Pa');
    expect(format(psi(14.6959), { precision: 1 })).toBe('14.7 psi');
  });
});

// ---------------------------------------------------------------------------
// SECTION F — Real-world reference values
// ---------------------------------------------------------------------------

describe('Pressure — Real-world reference values', () => {
  it('standard atmosphere: 1 atm = 101325 Pa (exact by definition)', () => {
    expect(atm._scale).toBe(101325);
  });

  it('standard atmosphere: 1 atm = 760 mmHg', () => {
    expect(valueOf(to(mmHg, atm(1)))).toBeCloseTo(760, 0);
  });

  it('blood pressure: 120/80 mmHg in kPa', () => {
    expect(valueOf(to(kPa, mmHg(120)))).toBeCloseTo(16.0, 0);
    expect(valueOf(to(kPa, mmHg(80)))).toBeCloseTo(10.7, 0);
  });

  it('blood pressure: 120 mmHg in psi', () => {
    expect(valueOf(to(psi, mmHg(120)))).toBeCloseTo(2.32, 1);
  });

  it('tire pressure: 32 psi = ~2.21 bar', () => {
    expect(valueOf(to(bar, psi(32)))).toBeCloseTo(2.21, 1);
  });

  it('tire pressure: 32 psi = ~220.6 kPa', () => {
    expect(valueOf(to(kPa, psi(32)))).toBeCloseTo(220.6, 0);
  });

  it('sea level pressure: ~14.696 psi = 1 atm', () => {
    expect(valueOf(to(atm, psi(14.696)))).toBeCloseTo(1, 2);
  });

  it('SCUBA: ~3 atm at 20m depth = ~303975 Pa', () => {
    expect(valueOf(to(Pa, atm(3)))).toBe(303975);
  });

  it('vacuum: 0 Pa = 0 atm', () => {
    expect(valueOf(to(atm, Pa(0)))).toBe(0);
  });

  it('Mariana Trench: ~1100 bar = ~110000 kPa', () => {
    expect(valueOf(to(kPa, bar(1100)))).toBe(110000);
  });
});

// ---------------------------------------------------------------------------
// SECTION G — Boundary and edge cases
// ---------------------------------------------------------------------------

describe('Pressure — Boundary and edge cases', () => {
  it('zero pressure converts to zero', () => {
    expect(valueOf(to(Pa, atm(0)))).toBe(0);
    expect(valueOf(to(psi, Pa(0)))).toBe(0);
  });

  it('negative pressure (gauge) converts correctly', () => {
    expect(valueOf(to(Pa, atm(-1)))).toBe(-101325);
  });

  it('Infinity propagates', () => {
    expect(valueOf(to(Pa, bar(Infinity)))).toBe(Infinity);
  });

  it('string throws on non-numeric', () => {
    expect(() => Pa('abc')).toThrow(TypeError);
    expect(() => psi('')).toThrow(TypeError);
  });

  it('scalar mul/div works', () => {
    expect(valueOf(mul(scalar(2), Pa(1000)))).toBe(2000);
    expect(valueOf(div(atm(2), scalar(2)))).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// SECTION H — Scale metadata
// ---------------------------------------------------------------------------

describe('Pressure — Scale metadata', () => {
  it('Pa._scale = 1', () => expect(Pa._scale).toBe(1));
  it('kPa._scale = 1000', () => expect(kPa._scale).toBe(1000));
  it('bar._scale = 100000', () => expect(bar._scale).toBe(100000));
  it('psi._scale = 6894.757293168361', () => expect(psi._scale).toBe(6894.757293168361));
  it('atm._scale = 101325', () => expect(atm._scale).toBe(101325));
  it('mmHg._scale = 133.322387415', () => expect(mmHg._scale).toBe(133.322387415));
  it('ppre._scale = 4.63309e113', () => expect(ppre._scale).toBe(4.63309e113));
});
