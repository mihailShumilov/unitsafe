/**
 * PARANOIC ACCEPTANCE TESTS — VOLUME DIMENSION
 *
 * Units under test (12 total):
 *   ml, cl, l, m3, tsp, tbsp, floz, cup, pt_liq (label 'pt-liq'), qt, gal, plv
 *
 * Coverage strategy:
 *   - Factory creation for every unit
 *   - Conversion to/from m3 or l for every unit
 *   - Roundtrip conversions
 *   - US customary chain: tsp -> tbsp -> floz -> cup -> pt_liq -> qt -> gal
 *   - Metric chain: ml -> cl -> l -> m3
 *   - Cross-system: gal -> l, floz -> ml, cup -> ml
 *   - add/sub for every unit
 *   - format for every unit
 *   - Real-world: cup of water, gallon in liters
 */

import { describe, it, expect } from 'vitest';
import {
  ml, cl, l, m3, tsp, tbsp, floz, cup, pt_liq, qt, gal, plv,
  add, sub, mul, div, to, valueOf, format, scalar,
} from '../../src/index.js';

// ---------------------------------------------------------------------------
// SECTION A — Factory creation
// ---------------------------------------------------------------------------

describe('Volume — Factory creation', () => {
  const factories = [
    { name: 'ml',     fn: ml,     label: 'ml' },
    { name: 'cl',     fn: cl,     label: 'cl' },
    { name: 'l',      fn: l,      label: 'l' },
    { name: 'm3',     fn: m3,     label: 'm3' },
    { name: 'tsp',    fn: tsp,    label: 'tsp' },
    { name: 'tbsp',   fn: tbsp,   label: 'tbsp' },
    { name: 'floz',   fn: floz,   label: 'floz' },
    { name: 'cup',    fn: cup,    label: 'cup' },
    { name: 'pt_liq', fn: pt_liq, label: 'pt-liq' },
    { name: 'qt',     fn: qt,     label: 'qt' },
    { name: 'gal',    fn: gal,    label: 'gal' },
    { name: 'plv',    fn: plv,    label: 'plv' },
  ] as const;

  for (const { name, fn, label } of factories) {
    it(`${name}(250) creates quantity with value 250 and label "${label}"`, () => {
      const q = fn(250);
      expect(valueOf(q)).toBe(250);
      expect(q._l).toBe(label);
      expect(q._o).toBe(0);
    });

    it(`${name}("3.5") creates quantity from string`, () => {
      expect(valueOf(fn('3.5'))).toBe(3.5);
    });

    it(`${name}(0) handles zero`, () => {
      expect(valueOf(fn(0))).toBe(0);
    });
  }

  it('all volume factories share dimension [3,0,0,0,0,0,0,0]', () => {
    for (const { fn } of factories) {
      expect(fn._dim).toEqual([3, 0, 0, 0, 0, 0, 0, 0]);
    }
  });
});

// ---------------------------------------------------------------------------
// SECTION B — Conversion to m3 and roundtrip
// ---------------------------------------------------------------------------

describe('Volume — Conversion to SI (m3) and roundtrip', () => {
  const units = [
    { name: 'ml',     fn: ml,     scale: 1e-6,               testVal: 1000 },
    { name: 'cl',     fn: cl,     scale: 1e-5,               testVal: 100 },
    { name: 'l',      fn: l,      scale: 0.001,              testVal: 1 },
    { name: 'tsp',    fn: tsp,    scale: 4.92892159375e-6,   testVal: 48 },
    { name: 'tbsp',   fn: tbsp,   scale: 1.478676478125e-5,  testVal: 16 },
    { name: 'floz',   fn: floz,   scale: 2.95735295625e-5,   testVal: 8 },
    { name: 'cup',    fn: cup,    scale: 2.365882365e-4,     testVal: 4 },
    { name: 'pt_liq', fn: pt_liq, scale: 4.73176473e-4,      testVal: 2 },
    { name: 'qt',     fn: qt,     scale: 9.46352946e-4,      testVal: 1 },
    { name: 'gal',    fn: gal,    scale: 3.785411784e-3,     testVal: 1 },
    { name: 'plv',    fn: plv,    scale: 4.22419e-105,       testVal: 1 },
  ];

  for (const { name, fn, scale, testVal } of units) {
    it(`${name}(${testVal}) -> m3 gives ${testVal} * ${scale}`, () => {
      const result = valueOf(to(m3, fn(testVal)));
      const expected = testVal * scale;
      if (Math.abs(expected) > 1e3 || Math.abs(expected) < 1e-3) {
        expect(result / expected).toBeCloseTo(1, 5);
      } else {
        expect(result).toBeCloseTo(expected, 6);
      }
    });

    it(`roundtrip: ${name} -> m3 -> ${name} preserves value`, () => {
      const original = fn(testVal);
      const inM3 = to(m3, original);
      const back = to(fn, inM3);
      expect(valueOf(back)).toBeCloseTo(testVal, 4);
    });
  }

  it('m3 -> m3 is identity', () => {
    expect(valueOf(to(m3, m3(1)))).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// SECTION C — Metric chain: ml -> cl -> l -> m3
// ---------------------------------------------------------------------------

describe('Volume — Metric chain (ml -> cl -> l -> m3)', () => {
  it('10 ml = 1 cl', () => {
    expect(valueOf(to(cl, ml(10)))).toBeCloseTo(1, 6);
  });

  it('100 cl = 1 l', () => {
    expect(valueOf(to(l, cl(100)))).toBeCloseTo(1, 6);
  });

  it('1000 l = 1 m3', () => {
    expect(valueOf(to(m3, l(1000)))).toBe(1);
  });

  it('1 l = 1000 ml', () => {
    expect(valueOf(to(ml, l(1)))).toBeCloseTo(1000, 4);
  });

  it('1 m3 = 1000 l', () => {
    expect(valueOf(to(l, m3(1)))).toBe(1000);
  });

  it('1 m3 = 1000000 ml', () => {
    expect(valueOf(to(ml, m3(1)))).toBeCloseTo(1e6, 0);
  });
});

// ---------------------------------------------------------------------------
// SECTION D — US customary chain: tsp -> tbsp -> floz -> cup -> pt -> qt -> gal
// ---------------------------------------------------------------------------

describe('Volume — US customary chain', () => {
  it('3 tsp = 1 tbsp', () => {
    expect(valueOf(to(tbsp, tsp(3)))).toBeCloseTo(1, 4);
  });

  it('2 tbsp = 1 floz', () => {
    expect(valueOf(to(floz, tbsp(2)))).toBeCloseTo(1, 4);
  });

  it('8 floz = 1 cup', () => {
    expect(valueOf(to(cup, floz(8)))).toBeCloseTo(1, 4);
  });

  it('2 cups = 1 pt-liq', () => {
    expect(valueOf(to(pt_liq, cup(2)))).toBeCloseTo(1, 4);
  });

  it('2 pt-liq = 1 qt', () => {
    expect(valueOf(to(qt, pt_liq(2)))).toBeCloseTo(1, 4);
  });

  it('4 qt = 1 gal', () => {
    expect(valueOf(to(gal, qt(4)))).toBeCloseTo(1, 4);
  });

  it('full chain: 768 tsp = 1 gal', () => {
    // 3 tsp/tbsp * 2 tbsp/floz * 8 floz/cup * 2 cup/pt * 2 pt/qt * 4 qt/gal = 768
    expect(valueOf(to(gal, tsp(768)))).toBeCloseTo(1, 2);
  });

  it('reverse: 1 gal = 768 tsp', () => {
    expect(valueOf(to(tsp, gal(1)))).toBeCloseTo(768, 0);
  });

  it('1 gal = 16 cups', () => {
    expect(valueOf(to(cup, gal(1)))).toBeCloseTo(16, 2);
  });

  it('1 gal = 128 floz', () => {
    expect(valueOf(to(floz, gal(1)))).toBeCloseTo(128, 0);
  });

  it('1 qt = 32 floz', () => {
    expect(valueOf(to(floz, qt(1)))).toBeCloseTo(32, 2);
  });

  it('1 cup = 48 tsp', () => {
    expect(valueOf(to(tsp, cup(1)))).toBeCloseTo(48, 1);
  });
});

// ---------------------------------------------------------------------------
// SECTION E — Cross-system conversions
// ---------------------------------------------------------------------------

describe('Volume — Cross-system conversions', () => {
  it('1 gal = 3.78541 l', () => {
    expect(valueOf(to(l, gal(1)))).toBeCloseTo(3.78541, 3);
  });

  it('1 l = 0.264172 gal', () => {
    expect(valueOf(to(gal, l(1)))).toBeCloseTo(0.264172, 4);
  });

  it('1 floz = 29.5735 ml', () => {
    expect(valueOf(to(ml, floz(1)))).toBeCloseTo(29.5735, 2);
  });

  it('1 cup = 236.588 ml', () => {
    expect(valueOf(to(ml, cup(1)))).toBeCloseTo(236.588, 0);
  });

  it('1 l = 33.814 floz', () => {
    expect(valueOf(to(floz, l(1)))).toBeCloseTo(33.814, 1);
  });

  it('1 tsp = 4.929 ml', () => {
    expect(valueOf(to(ml, tsp(1)))).toBeCloseTo(4.929, 2);
  });

  it('1 tbsp = 14.787 ml', () => {
    expect(valueOf(to(ml, tbsp(1)))).toBeCloseTo(14.787, 1);
  });

  it('1 pt-liq = 473.176 ml', () => {
    expect(valueOf(to(ml, pt_liq(1)))).toBeCloseTo(473.176, 0);
  });

  it('1 qt = 946.353 ml', () => {
    expect(valueOf(to(ml, qt(1)))).toBeCloseTo(946.353, 0);
  });
});

// ---------------------------------------------------------------------------
// SECTION F — add/sub for every unit
// ---------------------------------------------------------------------------

describe('Volume — Arithmetic (add/sub)', () => {
  it('add: ml(250) + ml(250) = ml(500)', () => {
    expect(valueOf(add(ml(250), ml(250)))).toBe(500);
  });

  it('sub: cl(50) - cl(20) = cl(30)', () => {
    expect(valueOf(sub(cl(50), cl(20)))).toBe(30);
  });

  it('add: l(1) + l(1.5) = l(2.5)', () => {
    expect(valueOf(add(l(1), l(1.5)))).toBe(2.5);
  });

  it('sub: m3(2) - m3(0.5) = m3(1.5)', () => {
    expect(valueOf(sub(m3(2), m3(0.5)))).toBe(1.5);
  });

  it('add: tsp(2) + tsp(1) = tsp(3)', () => {
    expect(valueOf(add(tsp(2), tsp(1)))).toBe(3);
  });

  it('add: tbsp(1) + tbsp(1) = tbsp(2)', () => {
    expect(valueOf(add(tbsp(1), tbsp(1)))).toBe(2);
  });

  it('sub: floz(8) - floz(2) = floz(6)', () => {
    expect(valueOf(sub(floz(8), floz(2)))).toBe(6);
  });

  it('add: cup(1) + cup(1) = cup(2)', () => {
    expect(valueOf(add(cup(1), cup(1)))).toBe(2);
  });

  it('sub: pt_liq(4) - pt_liq(2) = pt_liq(2)', () => {
    expect(valueOf(sub(pt_liq(4), pt_liq(2)))).toBe(2);
  });

  it('add: qt(2) + qt(2) = qt(4)', () => {
    expect(valueOf(add(qt(2), qt(2)))).toBe(4);
  });

  it('sub: gal(5) - gal(2) = gal(3)', () => {
    expect(valueOf(sub(gal(5), gal(2)))).toBe(3);
  });

  it('add: plv(10) + plv(5) = plv(15)', () => {
    expect(valueOf(add(plv(10), plv(5)))).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// SECTION G — format for every unit
// ---------------------------------------------------------------------------

describe('Volume — format()', () => {
  it('format(ml(250)) = "250 ml"', () => expect(format(ml(250))).toBe('250 ml'));
  it('format(cl(33)) = "33 cl"', () => expect(format(cl(33))).toBe('33 cl'));
  it('format(l(2)) = "2 l"', () => expect(format(l(2))).toBe('2 l'));
  it('format(m3(1)) = "1 m3"', () => expect(format(m3(1))).toBe('1 m3'));
  it('format(tsp(3)) = "3 tsp"', () => expect(format(tsp(3))).toBe('3 tsp'));
  it('format(tbsp(2)) = "2 tbsp"', () => expect(format(tbsp(2))).toBe('2 tbsp'));
  it('format(floz(8)) = "8 floz"', () => expect(format(floz(8))).toBe('8 floz'));
  it('format(cup(1)) = "1 cup"', () => expect(format(cup(1))).toBe('1 cup'));
  it('format(pt_liq(1)) = "1 pt-liq"', () => expect(format(pt_liq(1))).toBe('1 pt-liq'));
  it('format(qt(1)) = "1 qt"', () => expect(format(qt(1))).toBe('1 qt'));
  it('format(gal(1)) = "1 gal"', () => expect(format(gal(1))).toBe('1 gal'));
  it('format(plv(1)) = "1 plv"', () => expect(format(plv(1))).toBe('1 plv'));
  it('format with precision', () => {
    expect(format(l(3.78541), { precision: 2 })).toBe('3.79 l');
    expect(format(gal(0.264172), { precision: 3 })).toBe('0.264 gal');
  });
});

// ---------------------------------------------------------------------------
// SECTION H — Real-world reference values
// ---------------------------------------------------------------------------

describe('Volume — Real-world reference values', () => {
  it('cup of water: 1 cup = ~236.6 ml', () => {
    expect(valueOf(to(ml, cup(1)))).toBeCloseTo(236.6, 0);
  });

  it('1 US gallon = ~3.785 liters', () => {
    expect(valueOf(to(l, gal(1)))).toBeCloseTo(3.785, 2);
  });

  it('standard soda can: 12 floz = ~355 ml', () => {
    expect(valueOf(to(ml, floz(12)))).toBeCloseTo(355, 0);
  });

  it('wine bottle: 750 ml = ~25.36 floz', () => {
    expect(valueOf(to(floz, ml(750)))).toBeCloseTo(25.36, 0);
  });

  it('bathtub: ~300 l = 0.3 m3', () => {
    expect(valueOf(to(m3, l(300)))).toBeCloseTo(0.3, 6);
  });

  it('Olympic swimming pool: 2500 m3 = 2500000 l', () => {
    expect(valueOf(to(l, m3(2500)))).toBe(2500000);
  });

  it('coffee mug: 12 floz = ~1.5 cups', () => {
    expect(valueOf(to(cup, floz(12)))).toBeCloseTo(1.5, 2);
  });

  it('cooking: 1 tbsp = 3 tsp', () => {
    expect(valueOf(to(tsp, tbsp(1)))).toBeCloseTo(3, 2);
  });

  it('2-liter bottle = ~0.5283 gal', () => {
    expect(valueOf(to(gal, l(2)))).toBeCloseTo(0.5283, 3);
  });
});

// ---------------------------------------------------------------------------
// SECTION I — Boundary and edge cases
// ---------------------------------------------------------------------------

describe('Volume — Boundary and edge cases', () => {
  it('zero converts to zero', () => {
    expect(valueOf(to(l, m3(0)))).toBe(0);
    expect(valueOf(to(gal, ml(0)))).toBe(0);
  });

  it('negative volume converts correctly', () => {
    expect(valueOf(to(ml, l(-1)))).toBeCloseTo(-1000, 2);
  });

  it('Infinity propagates', () => {
    expect(valueOf(to(l, m3(Infinity)))).toBe(Infinity);
  });

  it('string throws on non-numeric', () => {
    expect(() => ml('abc')).toThrow(TypeError);
    expect(() => gal('')).toThrow(TypeError);
  });

  it('scalar mul/div works', () => {
    expect(valueOf(mul(scalar(2), l(1.5)))).toBe(3);
    expect(valueOf(div(gal(2), scalar(4)))).toBe(0.5);
  });
});

// ---------------------------------------------------------------------------
// SECTION J — Scale metadata
// ---------------------------------------------------------------------------

describe('Volume — Scale metadata', () => {
  it('ml._scale = 1e-6', () => expect(ml._scale).toBe(1e-6));
  it('cl._scale = 1e-5', () => expect(cl._scale).toBe(1e-5));
  it('l._scale = 0.001', () => expect(l._scale).toBe(0.001));
  it('m3._scale = 1', () => expect(m3._scale).toBe(1));
  it('tsp._scale = 4.92892159375e-6', () => expect(tsp._scale).toBe(4.92892159375e-6));
  it('tbsp._scale = 1.478676478125e-5', () => expect(tbsp._scale).toBe(1.478676478125e-5));
  it('floz._scale = 2.95735295625e-5', () => expect(floz._scale).toBe(2.95735295625e-5));
  it('cup._scale = 2.365882365e-4', () => expect(cup._scale).toBe(2.365882365e-4));
  it('pt_liq._scale = 4.73176473e-4', () => expect(pt_liq._scale).toBe(4.73176473e-4));
  it('qt._scale = 9.46352946e-4', () => expect(qt._scale).toBe(9.46352946e-4));
  it('gal._scale = 3.785411784e-3', () => expect(gal._scale).toBe(3.785411784e-3));
  it('plv._scale = 4.22419e-105', () => expect(plv._scale).toBe(4.22419e-105));
});
