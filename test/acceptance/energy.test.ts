/**
 * PARANOIC ACCEPTANCE TESTS — ENERGY DIMENSION
 *
 * Units under test (9 total):
 *   J, kJ, cal, kcal, Wh, kWh, eV, BTU, pene
 *
 * Coverage strategy:
 *   - Factory creation for every unit
 *   - Conversion to/from SI base (J) for every unit
 *   - Roundtrip conversions
 *   - All meaningful pairwise conversions
 *   - add/sub for every unit
 *   - format for every unit
 *   - Real-world: 1 cal = 4.184 J, 1 BTU ~ 1055 J, 1 kWh = 3.6 MJ
 */

import { describe, it, expect } from 'vitest';
import {
  J, kJ, cal, kcal, Wh, kWh, eV, BTU, pene,
  add, sub, mul, div, to, valueOf, format, scalar,
} from '../../src/index.js';

// ---------------------------------------------------------------------------
// SECTION A — Factory creation
// ---------------------------------------------------------------------------

describe('Energy — Factory creation', () => {
  const factories = [
    { name: 'J',    fn: J,    label: 'J' },
    { name: 'kJ',   fn: kJ,   label: 'kJ' },
    { name: 'cal',  fn: cal,  label: 'cal' },
    { name: 'kcal', fn: kcal, label: 'kcal' },
    { name: 'Wh',   fn: Wh,   label: 'Wh' },
    { name: 'kWh',  fn: kWh,  label: 'kWh' },
    { name: 'eV',   fn: eV,   label: 'eV' },
    { name: 'BTU',  fn: BTU,  label: 'BTU' },
    { name: 'pene', fn: pene, label: 'pene' },
  ] as const;

  for (const { name, fn, label } of factories) {
    it(`${name}(1000) creates quantity with value 1000 and label "${label}"`, () => {
      const q = fn(1000);
      expect(valueOf(q)).toBe(1000);
      expect(q._l).toBe(label);
      expect(q._o).toBe(0);
    });

    it(`${name}("4.184") creates quantity from string`, () => {
      expect(valueOf(fn('4.184'))).toBe(4.184);
    });

    it(`${name}(0) handles zero`, () => {
      expect(valueOf(fn(0))).toBe(0);
    });

    it(`${name}(-10) handles negative`, () => {
      expect(valueOf(fn(-10))).toBe(-10);
    });
  }

  it('all energy factories share dimension [2,1,-2,0,0,0,0,0]', () => {
    for (const { fn } of factories) {
      expect(fn._dim).toEqual([2, 1, -2, 0, 0, 0, 0, 0]);
    }
  });
});

// ---------------------------------------------------------------------------
// SECTION B — Conversion to J and roundtrip
// ---------------------------------------------------------------------------

describe('Energy — Conversion to SI (J) and roundtrip', () => {
  const units = [
    { name: 'kJ',   fn: kJ,   scale: 1000,                testVal: 5 },
    { name: 'cal',  fn: cal,  scale: 4.184,               testVal: 1000 },
    { name: 'kcal', fn: kcal, scale: 4184,                testVal: 2 },
    { name: 'Wh',   fn: Wh,   scale: 3600,                testVal: 1 },
    { name: 'kWh',  fn: kWh,  scale: 3600000,             testVal: 1 },
    { name: 'eV',   fn: eV,   scale: 1.602176634e-19,     testVal: 1e20 },
    { name: 'BTU',  fn: BTU,  scale: 1055.06,             testVal: 1 },
    { name: 'pene', fn: pene, scale: 1.9561e9,            testVal: 1 },
  ];

  for (const { name, fn, scale, testVal } of units) {
    it(`${name}(${testVal}) -> J gives ${testVal} * ${scale}`, () => {
      const result = valueOf(to(J, fn(testVal)));
      const expected = testVal * scale;
      if (Math.abs(expected) > 1e6) {
        expect(result / expected).toBeCloseTo(1, 5);
      } else {
        expect(result).toBeCloseTo(expected, 2);
      }
    });

    it(`roundtrip: ${name} -> J -> ${name} preserves value`, () => {
      const original = fn(testVal);
      const inJ = to(J, original);
      const back = to(fn, inJ);
      expect(valueOf(back)).toBeCloseTo(testVal, 4);
    });
  }

  it('J -> J is identity', () => {
    expect(valueOf(to(J, J(4184)))).toBe(4184);
  });
});

// ---------------------------------------------------------------------------
// SECTION C — Pairwise conversions
// ---------------------------------------------------------------------------

describe('Energy — Pairwise conversions', () => {
  // kJ <-> J
  it('1 kJ = 1000 J', () => {
    expect(valueOf(to(J, kJ(1)))).toBe(1000);
  });

  it('1000 J = 1 kJ', () => {
    expect(valueOf(to(kJ, J(1000)))).toBe(1);
  });

  // cal <-> J
  it('1 cal = 4.184 J (thermochemical)', () => {
    expect(valueOf(to(J, cal(1)))).toBe(4.184);
  });

  it('4.184 J = 1 cal', () => {
    expect(valueOf(to(cal, J(4.184)))).toBeCloseTo(1, 8);
  });

  // kcal <-> cal
  it('1 kcal = 1000 cal', () => {
    expect(valueOf(to(cal, kcal(1)))).toBe(1000);
  });

  it('1000 cal = 1 kcal', () => {
    expect(valueOf(to(kcal, cal(1000)))).toBe(1);
  });

  // kcal <-> J
  it('1 kcal = 4184 J', () => {
    expect(valueOf(to(J, kcal(1)))).toBe(4184);
  });

  // kcal <-> kJ
  it('1 kcal = 4.184 kJ', () => {
    expect(valueOf(to(kJ, kcal(1)))).toBeCloseTo(4.184, 4);
  });

  // Wh <-> J
  it('1 Wh = 3600 J', () => {
    expect(valueOf(to(J, Wh(1)))).toBe(3600);
  });

  it('3600 J = 1 Wh', () => {
    expect(valueOf(to(Wh, J(3600)))).toBe(1);
  });

  // kWh <-> J
  it('1 kWh = 3600000 J = 3.6 MJ', () => {
    expect(valueOf(to(J, kWh(1)))).toBe(3600000);
  });

  // kWh <-> kJ
  it('1 kWh = 3600 kJ', () => {
    expect(valueOf(to(kJ, kWh(1)))).toBe(3600);
  });

  // kWh <-> Wh
  it('1 kWh = 1000 Wh', () => {
    expect(valueOf(to(Wh, kWh(1)))).toBe(1000);
  });

  // eV <-> J
  it('1 eV = 1.602176634e-19 J', () => {
    expect(valueOf(to(J, eV(1)))).toBeCloseTo(1.602176634e-19, 28);
  });

  // BTU <-> J
  it('1 BTU = 1055.06 J', () => {
    expect(valueOf(to(J, BTU(1)))).toBeCloseTo(1055.06, 0);
  });

  it('1 BTU = 1.05506 kJ', () => {
    expect(valueOf(to(kJ, BTU(1)))).toBeCloseTo(1.05506, 3);
  });

  // BTU <-> kcal
  it('1 BTU = ~0.252 kcal', () => {
    expect(valueOf(to(kcal, BTU(1)))).toBeCloseTo(0.252, 2);
  });

  // BTU <-> Wh
  it('1 BTU = ~0.29307 Wh', () => {
    expect(valueOf(to(Wh, BTU(1)))).toBeCloseTo(0.29307, 3);
  });

  // eV <-> BTU
  it('1 BTU in eV', () => {
    const result = valueOf(to(eV, BTU(1)));
    // 1055.06 / 1.602176634e-19 ~ 6.585e21
    expect(result).toBeCloseTo(6.585e21, -18);
  });

  // pene <-> J
  it('1 pene = 1.9561e9 J', () => {
    const result = valueOf(to(J, pene(1)));
    expect(result).toBeCloseTo(1.9561e9, -3);
  });
});

// ---------------------------------------------------------------------------
// SECTION D — add/sub for every unit
// ---------------------------------------------------------------------------

describe('Energy — Arithmetic (add/sub)', () => {
  it('add: J(1000) + J(500) = J(1500)', () => {
    expect(valueOf(add(J(1000), J(500)))).toBe(1500);
  });

  it('sub: kJ(10) - kJ(3) = kJ(7)', () => {
    expect(valueOf(sub(kJ(10), kJ(3)))).toBe(7);
  });

  it('add: cal(500) + cal(500) = cal(1000)', () => {
    expect(valueOf(add(cal(500), cal(500)))).toBe(1000);
  });

  it('sub: kcal(2000) - kcal(500) = kcal(1500)', () => {
    expect(valueOf(sub(kcal(2000), kcal(500)))).toBe(1500);
  });

  it('add: Wh(100) + Wh(50) = Wh(150)', () => {
    expect(valueOf(add(Wh(100), Wh(50)))).toBe(150);
  });

  it('sub: kWh(10) - kWh(3) = kWh(7)', () => {
    expect(valueOf(sub(kWh(10), kWh(3)))).toBe(7);
  });

  it('add: eV(1e10) + eV(5e9) = eV(1.5e10)', () => {
    expect(valueOf(add(eV(1e10), eV(5e9)))).toBe(1.5e10);
  });

  it('sub: BTU(100) - BTU(30) = BTU(70)', () => {
    expect(valueOf(sub(BTU(100), BTU(30)))).toBe(70);
  });

  it('add: pene(1) + pene(1) = pene(2)', () => {
    expect(valueOf(add(pene(1), pene(1)))).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// SECTION E — format for every unit
// ---------------------------------------------------------------------------

describe('Energy — format()', () => {
  it('format(J(4184)) = "4184 J"', () => expect(format(J(4184))).toBe('4184 J'));
  it('format(kJ(4.184)) = "4.184 kJ"', () => expect(format(kJ(4.184))).toBe('4.184 kJ'));
  it('format(cal(1000)) = "1000 cal"', () => expect(format(cal(1000))).toBe('1000 cal'));
  it('format(kcal(2000)) = "2000 kcal"', () => expect(format(kcal(2000))).toBe('2000 kcal'));
  it('format(Wh(100)) = "100 Wh"', () => expect(format(Wh(100))).toBe('100 Wh'));
  it('format(kWh(10)) = "10 kWh"', () => expect(format(kWh(10))).toBe('10 kWh'));
  it('format(eV(1)) = "1 eV"', () => expect(format(eV(1))).toBe('1 eV'));
  it('format(BTU(100)) = "100 BTU"', () => expect(format(BTU(100))).toBe('100 BTU'));
  it('format(pene(1)) = "1 pene"', () => expect(format(pene(1))).toBe('1 pene'));
  it('format with precision', () => {
    expect(format(J(4184.123), { precision: 0 })).toBe('4184 J');
    expect(format(kWh(3.6), { precision: 1 })).toBe('3.6 kWh');
  });
});

// ---------------------------------------------------------------------------
// SECTION F — Real-world reference values
// ---------------------------------------------------------------------------

describe('Energy — Real-world reference values', () => {
  it('1 thermochemical calorie = 4.184 J (exact)', () => {
    expect(cal._scale).toBe(4.184);
  });

  it('1 food Calorie (kcal) = 4184 J', () => {
    expect(valueOf(to(J, kcal(1)))).toBe(4184);
  });

  it('1 BTU = ~1055 J', () => {
    expect(valueOf(to(J, BTU(1)))).toBeCloseTo(1055, -1);
  });

  it('1 kWh = 3.6 MJ = 3600 kJ', () => {
    expect(valueOf(to(kJ, kWh(1)))).toBe(3600);
  });

  it('daily human calorie intake: 2000 kcal = ~8368 kJ', () => {
    expect(valueOf(to(kJ, kcal(2000)))).toBeCloseTo(8368, 0);
  });

  it('average US household electricity: ~30 kWh/day = 108000 kJ', () => {
    expect(valueOf(to(kJ, kWh(30)))).toBe(108000);
  });

  it('1 eV = 1.602176634e-19 J (CODATA exact)', () => {
    expect(eV._scale).toBe(1.602176634e-19);
  });

  it('TNT equivalent: 1 ton TNT = ~4.184e9 J = 4.184 GJ', () => {
    const tntKJ = 4184000; // kJ
    expect(valueOf(to(J, kJ(tntKJ)))).toBe(4184000 * 1000);
  });

  it('AA battery: ~5 Wh = 18000 J', () => {
    expect(valueOf(to(J, Wh(5)))).toBe(18000);
  });

  it('1 Wh = ~3.412 BTU', () => {
    expect(valueOf(to(BTU, Wh(1)))).toBeCloseTo(3.412, 1);
  });
});

// ---------------------------------------------------------------------------
// SECTION G — Boundary and edge cases
// ---------------------------------------------------------------------------

describe('Energy — Boundary and edge cases', () => {
  it('zero energy converts to zero', () => {
    expect(valueOf(to(J, kWh(0)))).toBe(0);
    expect(valueOf(to(eV, J(0)))).toBe(0);
  });

  it('negative energy converts correctly', () => {
    expect(valueOf(to(J, kJ(-5)))).toBe(-5000);
  });

  it('Infinity propagates', () => {
    expect(valueOf(to(J, kWh(Infinity)))).toBe(Infinity);
  });

  it('string throws on non-numeric', () => {
    expect(() => J('abc')).toThrow(TypeError);
    expect(() => kWh('')).toThrow(TypeError);
  });

  it('scalar mul/div works', () => {
    expect(valueOf(mul(scalar(2), J(500)))).toBe(1000);
    expect(valueOf(div(kJ(10), scalar(2)))).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// SECTION H — Scale metadata
// ---------------------------------------------------------------------------

describe('Energy — Scale metadata', () => {
  it('J._scale = 1', () => expect(J._scale).toBe(1));
  it('kJ._scale = 1000', () => expect(kJ._scale).toBe(1000));
  it('cal._scale = 4.184', () => expect(cal._scale).toBe(4.184));
  it('kcal._scale = 4184', () => expect(kcal._scale).toBe(4184));
  it('Wh._scale = 3600', () => expect(Wh._scale).toBe(3600));
  it('kWh._scale = 3600000', () => expect(kWh._scale).toBe(3600000));
  it('eV._scale = 1.602176634e-19', () => expect(eV._scale).toBe(1.602176634e-19));
  it('BTU._scale = 1055.06', () => expect(BTU._scale).toBe(1055.06));
  it('pene._scale = 1.9561e9', () => expect(pene._scale).toBe(1.9561e9));
});
