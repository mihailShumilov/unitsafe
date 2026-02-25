/**
 * PARANOIC ACCEPTANCE TESTS — MASS DIMENSION
 *
 * Units under test (12 total):
 *   kg, g, lb, oz, ug, mg, t, st, ton, lton, dalton (label 'Da'), plm
 *
 * Coverage strategy:
 *   - Factory creation (numeric + string) for every unit
 *   - Conversion to/from SI base (kg) for every unit
 *   - Roundtrip conversions
 *   - Chain: ug -> mg -> g -> kg -> t
 *   - Imperial chain: oz -> lb -> st -> ton/lton
 *   - Cross-system conversions
 *   - add/sub for every unit
 *   - format for every unit
 *   - Real-world reference values
 */

import { describe, it, expect } from 'vitest';
import {
  kg, g, lb, oz, ug, mg, t, st, ton, lton, dalton, plm,
  add, sub, mul, div, to, valueOf, format, scalar,
} from '../../src/index.js';

// ---------------------------------------------------------------------------
// SECTION A — Factory creation for every unit
// ---------------------------------------------------------------------------

describe('Mass — Factory creation', () => {
  const factories = [
    { name: 'kg',     fn: kg,     label: 'kg' },
    { name: 'g',      fn: g,      label: 'g' },
    { name: 'lb',     fn: lb,     label: 'lb' },
    { name: 'oz',     fn: oz,     label: 'oz' },
    { name: 'ug',     fn: ug,     label: 'ug' },
    { name: 'mg',     fn: mg,     label: 'mg' },
    { name: 't',      fn: t,      label: 't' },
    { name: 'st',     fn: st,     label: 'st' },
    { name: 'ton',    fn: ton,    label: 'ton' },
    { name: 'lton',   fn: lton,   label: 'lton' },
    { name: 'dalton', fn: dalton, label: 'Da' },
    { name: 'plm',    fn: plm,    label: 'plm' },
  ] as const;

  for (const { name, fn, label } of factories) {
    it(`${name}(75) creates quantity with value 75 and label "${label}"`, () => {
      const q = fn(75);
      expect(valueOf(q)).toBe(75);
      expect(q._l).toBe(label);
      expect(q._o).toBe(0);
    });

    it(`${name}("2.5") creates quantity from string`, () => {
      expect(valueOf(fn('2.5'))).toBe(2.5);
    });

    it(`${name}(0) handles zero`, () => {
      expect(valueOf(fn(0))).toBe(0);
    });

    it(`${name}(-1) handles negative`, () => {
      expect(valueOf(fn(-1))).toBe(-1);
    });
  }

  it('all mass factories share dimension [0,1,0,0,0,0,0,0]', () => {
    for (const { fn } of factories) {
      expect(fn._dim).toEqual([0, 1, 0, 0, 0, 0, 0, 0]);
    }
  });
});

// ---------------------------------------------------------------------------
// SECTION B — Conversion to SI (kg) and roundtrip
// ---------------------------------------------------------------------------

describe('Mass — Conversion to SI (kg) and roundtrip', () => {
  const units = [
    { name: 'g',      fn: g,      scale: 0.001,               testVal: 1000 },
    { name: 'lb',     fn: lb,     scale: 0.45359237,           testVal: 150 },
    { name: 'oz',     fn: oz,     scale: 0.028349523125,       testVal: 16 },
    { name: 'ug',     fn: ug,     scale: 1e-9,                 testVal: 500 },
    { name: 'mg',     fn: mg,     scale: 1e-6,                 testVal: 250 },
    { name: 't',      fn: t,      scale: 1000,                 testVal: 2 },
    { name: 'st',     fn: st,     scale: 6.35029318,           testVal: 10 },
    { name: 'ton',    fn: ton,    scale: 907.18474,            testVal: 1 },
    { name: 'lton',   fn: lton,   scale: 1016.0469088,         testVal: 1 },
    { name: 'dalton', fn: dalton, scale: 1.6605390666e-27,     testVal: 12 },
    { name: 'plm',    fn: plm,    scale: 2.176434e-8,          testVal: 1 },
  ];

  for (const { name, fn, scale, testVal } of units) {
    it(`${name}(${testVal}) -> kg gives ${testVal} * ${scale}`, () => {
      const result = valueOf(to(kg, fn(testVal)));
      const expected = testVal * scale;
      if (Math.abs(expected) > 1e6 || Math.abs(expected) < 1e-6) {
        expect(result / expected).toBeCloseTo(1, 6);
      } else {
        expect(result).toBeCloseTo(expected, 6);
      }
    });

    it(`roundtrip: ${name} -> kg -> ${name} preserves value`, () => {
      const original = fn(testVal);
      const inKg = to(kg, original);
      const back = to(fn, inKg);
      expect(valueOf(back)).toBeCloseTo(testVal, 6);
    });
  }

  it('kg -> kg is identity', () => {
    expect(valueOf(to(kg, kg(75.5)))).toBe(75.5);
  });
});

// ---------------------------------------------------------------------------
// SECTION C — Metric prefix chain
// ---------------------------------------------------------------------------

describe('Mass — Metric prefix chain (ug -> mg -> g -> kg -> t)', () => {
  it('1000 ug = 1 mg', () => {
    expect(valueOf(to(mg, ug(1000)))).toBeCloseTo(1, 6);
  });

  it('1000 mg = 1 g', () => {
    expect(valueOf(to(g, mg(1000)))).toBeCloseTo(1, 6);
  });

  it('1000 g = 1 kg', () => {
    expect(valueOf(to(kg, g(1000)))).toBe(1);
  });

  it('1000 kg = 1 t', () => {
    expect(valueOf(to(t, kg(1000)))).toBe(1);
  });

  it('full chain: 1e9 ug = 1 kg (1 ug = 1e-9 kg)', () => {
    // ug._scale = 1e-9, so 1 ug = 1e-9 kg => 1e9 ug = 1 kg
    expect(valueOf(to(kg, ug(1e9)))).toBeCloseTo(1, 4);
  });
});

// ---------------------------------------------------------------------------
// SECTION D — Imperial chain
// ---------------------------------------------------------------------------

describe('Mass — Imperial chain (oz -> lb -> st)', () => {
  it('16 oz = 1 lb', () => {
    expect(valueOf(to(lb, oz(16)))).toBeCloseTo(1, 6);
  });

  it('1 lb = 16 oz', () => {
    expect(valueOf(to(oz, lb(1)))).toBeCloseTo(16, 6);
  });

  it('14 lb = 1 st', () => {
    expect(valueOf(to(st, lb(14)))).toBeCloseTo(1, 4);
  });

  it('1 st = 14 lb', () => {
    expect(valueOf(to(lb, st(1)))).toBeCloseTo(14, 4);
  });

  it('1 st = 224 oz', () => {
    expect(valueOf(to(oz, st(1)))).toBeCloseTo(224, 0);
  });
});

// ---------------------------------------------------------------------------
// SECTION E — Cross-system conversions
// ---------------------------------------------------------------------------

describe('Mass — Cross-system conversions', () => {
  it('1 kg = 2.20462 lb', () => {
    expect(valueOf(to(lb, kg(1)))).toBeCloseTo(2.20462, 4);
  });

  it('1 lb = 0.45359237 kg (exact)', () => {
    expect(valueOf(to(kg, lb(1)))).toBeCloseTo(0.45359237, 8);
  });

  it('1 oz = 28.3495 g', () => {
    expect(valueOf(to(g, oz(1)))).toBeCloseTo(28.3495, 3);
  });

  it('1 kg = 35.274 oz', () => {
    expect(valueOf(to(oz, kg(1)))).toBeCloseTo(35.274, 1);
  });

  it('1 ton (US short) = 2000 lb', () => {
    expect(valueOf(to(lb, ton(1)))).toBeCloseTo(2000, 0);
  });

  it('1 lton (UK long) = 2240 lb', () => {
    expect(valueOf(to(lb, lton(1)))).toBeCloseTo(2240, 0);
  });

  it('1 ton (US short) = 907.18474 kg', () => {
    expect(valueOf(to(kg, ton(1)))).toBeCloseTo(907.18474, 3);
  });

  it('1 lton = 1016.0469088 kg', () => {
    expect(valueOf(to(kg, lton(1)))).toBeCloseTo(1016.0469088, 3);
  });

  it('1 t (metric tonne) = 2204.62 lb', () => {
    expect(valueOf(to(lb, t(1)))).toBeCloseTo(2204.62, 0);
  });

  it('1 dalton (Da) = 1.6605390666e-27 kg', () => {
    const result = valueOf(to(kg, dalton(1)));
    expect(result).toBeCloseTo(1.6605390666e-27, 37);
  });

  it('carbon-12 atom: 12 Da in kg', () => {
    const result = valueOf(to(kg, dalton(12)));
    expect(result).toBeCloseTo(12 * 1.6605390666e-27, 37);
  });
});

// ---------------------------------------------------------------------------
// SECTION F — add/sub for every unit
// ---------------------------------------------------------------------------

describe('Mass — Arithmetic (add/sub)', () => {
  it('add: kg(70) + kg(5.5) = kg(75.5)', () => {
    expect(valueOf(add(kg(70), kg(5.5)))).toBeCloseTo(75.5);
  });

  it('sub: g(1000) - g(250) = g(750)', () => {
    expect(valueOf(sub(g(1000), g(250)))).toBe(750);
  });

  it('add: lb(100) + lb(50) = lb(150)', () => {
    expect(valueOf(add(lb(100), lb(50)))).toBe(150);
  });

  it('sub: oz(16) - oz(4) = oz(12)', () => {
    expect(valueOf(sub(oz(16), oz(4)))).toBe(12);
  });

  it('add: ug(500) + ug(500) = ug(1000)', () => {
    expect(valueOf(add(ug(500), ug(500)))).toBe(1000);
  });

  it('add: mg(125) + mg(125) = mg(250)', () => {
    expect(valueOf(add(mg(125), mg(125)))).toBe(250);
  });

  it('add: t(1) + t(1.5) = t(2.5)', () => {
    expect(valueOf(add(t(1), t(1.5)))).toBe(2.5);
  });

  it('sub: st(14) - st(4) = st(10)', () => {
    expect(valueOf(sub(st(14), st(4)))).toBe(10);
  });

  it('add: ton(1) + ton(1) = ton(2)', () => {
    expect(valueOf(add(ton(1), ton(1)))).toBe(2);
  });

  it('add: lton(1) + lton(0.5) = lton(1.5)', () => {
    expect(valueOf(add(lton(1), lton(0.5)))).toBe(1.5);
  });

  it('add: dalton(12) + dalton(4) = dalton(16) (carbon + helium)', () => {
    expect(valueOf(add(dalton(12), dalton(4)))).toBe(16);
  });

  it('sub: plm(10) - plm(3) = plm(7)', () => {
    expect(valueOf(sub(plm(10), plm(3)))).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// SECTION G — format for every unit
// ---------------------------------------------------------------------------

describe('Mass — format()', () => {
  it('format(kg(75.5)) = "75.5 kg"', () => {
    expect(format(kg(75.5))).toBe('75.5 kg');
  });

  it('format(g(250)) = "250 g"', () => {
    expect(format(g(250))).toBe('250 g');
  });

  it('format(lb(150)) = "150 lb"', () => {
    expect(format(lb(150))).toBe('150 lb');
  });

  it('format(oz(8)) = "8 oz"', () => {
    expect(format(oz(8))).toBe('8 oz');
  });

  it('format(ug(500)) = "500 ug"', () => {
    expect(format(ug(500))).toBe('500 ug');
  });

  it('format(mg(250)) = "250 mg"', () => {
    expect(format(mg(250))).toBe('250 mg');
  });

  it('format(t(2)) = "2 t"', () => {
    expect(format(t(2))).toBe('2 t');
  });

  it('format(st(10)) = "10 st"', () => {
    expect(format(st(10))).toBe('10 st');
  });

  it('format(ton(1)) = "1 ton"', () => {
    expect(format(ton(1))).toBe('1 ton');
  });

  it('format(lton(1)) = "1 lton"', () => {
    expect(format(lton(1))).toBe('1 lton');
  });

  it('format(dalton(12)) = "12 Da"', () => {
    expect(format(dalton(12))).toBe('12 Da');
  });

  it('format(plm(1)) = "1 plm"', () => {
    expect(format(plm(1))).toBe('1 plm');
  });

  it('format with precision', () => {
    expect(format(kg(2.20462), { precision: 2 })).toBe('2.20 kg');
    expect(format(lb(68.04), { precision: 1 })).toBe('68.0 lb');
  });
});

// ---------------------------------------------------------------------------
// SECTION H — Real-world reference values
// ---------------------------------------------------------------------------

describe('Mass — Real-world reference values', () => {
  it('average adult human: 70 kg = ~154.3 lb', () => {
    expect(valueOf(to(lb, kg(70)))).toBeCloseTo(154.3, 0);
  });

  it('human weight: 150 lb = ~68.04 kg', () => {
    expect(valueOf(to(kg, lb(150)))).toBeCloseTo(68.04, 1);
  });

  it('1 metric tonne = 1000 kg exactly', () => {
    expect(valueOf(to(kg, t(1)))).toBe(1000);
  });

  it('1 stone = ~6.35 kg (used in UK for body weight)', () => {
    expect(valueOf(to(kg, st(1)))).toBeCloseTo(6.35029, 3);
  });

  it('US short ton vs metric tonne: ton < t', () => {
    const tonInKg = valueOf(to(kg, ton(1)));
    const tInKg = valueOf(to(kg, t(1)));
    expect(tonInKg).toBeLessThan(tInKg);
    expect(tonInKg).toBeCloseTo(907.185, 0);
  });

  it('UK long ton vs metric tonne: lton > t', () => {
    const ltonInKg = valueOf(to(kg, lton(1)));
    const tInKg = valueOf(to(kg, t(1)));
    expect(ltonInKg).toBeGreaterThan(tInKg);
  });

  it('proton mass: ~1.00728 Da', () => {
    const protonKg = 1.67262192e-27;
    const protonDa = valueOf(to(dalton, kg(protonKg)));
    expect(protonDa).toBeCloseTo(1.00728, 3);
  });

  it('Planck mass: ~2.176e-8 kg', () => {
    expect(valueOf(to(kg, plm(1)))).toBeCloseTo(2.176434e-8, 14);
  });

  it('1 oz of gold: ~28.35 g', () => {
    expect(valueOf(to(g, oz(1)))).toBeCloseTo(28.3495, 3);
  });

  it('aspirin tablet: 500 mg = 0.5 g', () => {
    expect(valueOf(to(g, mg(500)))).toBeCloseTo(0.5, 6);
  });
});

// ---------------------------------------------------------------------------
// SECTION I — Boundary cases
// ---------------------------------------------------------------------------

describe('Mass — Boundary and edge cases', () => {
  it('zero kg converts to zero in any unit', () => {
    expect(valueOf(to(g, kg(0)))).toBe(0);
    expect(valueOf(to(lb, kg(0)))).toBe(0);
    expect(valueOf(to(dalton, kg(0)))).toBe(0);
  });

  it('negative mass converts correctly', () => {
    expect(valueOf(to(g, kg(-1)))).toBe(-1000);
  });

  it('Infinity propagates', () => {
    expect(valueOf(to(g, kg(Infinity)))).toBe(Infinity);
  });

  it('string throws on non-numeric', () => {
    expect(() => kg('abc')).toThrow(TypeError);
    expect(() => lb('')).toThrow(TypeError);
    expect(() => oz('   ')).toThrow(TypeError);
  });

  it('mul: kg * scalar works', () => {
    const result = mul(scalar(2), kg(5));
    expect(valueOf(result)).toBe(10);
  });

  it('div: kg / scalar works', () => {
    const result = div(kg(10), scalar(2));
    expect(valueOf(result)).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// SECTION J — Scale factor metadata
// ---------------------------------------------------------------------------

describe('Mass — Scale factor metadata', () => {
  it('kg._scale = 1 (SI base)', () => expect(kg._scale).toBe(1));
  it('g._scale = 0.001', () => expect(g._scale).toBe(0.001));
  it('lb._scale = 0.45359237', () => expect(lb._scale).toBe(0.45359237));
  it('oz._scale = 0.028349523125', () => expect(oz._scale).toBe(0.028349523125));
  it('ug._scale = 1e-9', () => expect(ug._scale).toBe(1e-9));
  it('mg._scale = 1e-6', () => expect(mg._scale).toBe(1e-6));
  it('t._scale = 1000', () => expect(t._scale).toBe(1000));
  it('st._scale = 6.35029318', () => expect(st._scale).toBe(6.35029318));
  it('ton._scale = 907.18474', () => expect(ton._scale).toBe(907.18474));
  it('lton._scale = 1016.0469088', () => expect(lton._scale).toBe(1016.0469088));
  it('dalton._scale = 1.6605390666e-27', () => expect(dalton._scale).toBe(1.6605390666e-27));
  it('plm._scale = 2.176434e-8', () => expect(plm._scale).toBe(2.176434e-8));
});
