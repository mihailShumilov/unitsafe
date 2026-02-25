/**
 * PARANOIC ACCEPTANCE TESTS — CORE OPERATIONS
 *
 * Operations under test:
 *   add, sub, mul, div, to, eq, lt, lte, gt, gte, valueOf, format, parse, scalar, createChecked
 *
 * Coverage strategy:
 *   - Arithmetic: add/sub with same units, mul/div cross-dimension
 *   - Scalar: multiplication/division of quantities by scalars
 *   - Conversion: `to` between same-dimension units, affine (temperature)
 *   - Comparisons: eq, lt, lte, gt, gte edge cases
 *   - valueOf: extraction of raw numbers
 *   - format: output formatting with and without precision
 *   - parse: all 110 unit labels, error handling, adversarial inputs
 *   - createChecked: dimension mismatch detection, label mismatch detection
 *   - Edge cases: NaN, Infinity, -0, very large/small values
 *   - IEEE 754 quirks
 */

import { describe, it, expect } from 'vitest';
import {
  m, km, cm, mm, ft, inch, mi, yd,
  kg, g, lb, oz,
  s, ms, min, h,
  K, C, F, R,
  m2, ft2,
  l, ml, gal,
  mps, kmh, mph,
  N, kN, lbf,
  J, kJ, cal, kcal, kWh,
  W, kW, hp,
  Pa, atm, psi, mmHg,
  b, B, KB, MB, GB,
  scalar,
  add, sub, mul, div,
  to,
  eq, lt, lte, gt, gte,
  valueOf,
  format,
  parse,
  createChecked,
} from '../../src/index.js';

// ═══════════════════════════════════════════════════════════════════════
// SECTION A — add / sub
// ═══════════════════════════════════════════════════════════════════════

describe('Core — add', () => {
  it('adds two same-unit quantities', () => {
    expect(valueOf(add(m(1), m(2)))).toBe(3);
  });

  it('preserves unit metadata (_s, _l, _o)', () => {
    const result = add(km(1), km(2));
    expect(result._s).toBe(1000);
    expect(result._l).toBe('km');
    expect(result._o).toBe(0);
  });

  it('add of zeros is zero', () => {
    expect(valueOf(add(m(0), m(0)))).toBe(0);
  });

  it('add negative values', () => {
    expect(valueOf(add(m(-5), m(-3)))).toBe(-8);
  });

  it('add with Infinity', () => {
    expect(valueOf(add(m(Infinity), m(1)))).toBe(Infinity);
  });

  it('add Infinity + -Infinity = NaN', () => {
    expect(valueOf(add(m(Infinity), m(-Infinity)))).toBeNaN();
  });

  it('add NaN propagates', () => {
    expect(valueOf(add(m(NaN), m(5)))).toBeNaN();
  });

  it('add preserves offset for temperature', () => {
    const result = add(C(20), C(17));
    expect(result._o).toBe(273.15);
    expect(valueOf(result)).toBe(37);
  });

  it('add works with scalar', () => {
    expect(valueOf(add(scalar(0.5), scalar(0.5)))).toBe(1);
  });

  it('add works with large values', () => {
    expect(valueOf(add(m(1e15), m(1e15)))).toBe(2e15);
  });

  it('add works with very small values', () => {
    expect(valueOf(add(m(1e-15), m(1e-15)))).toBeCloseTo(2e-15);
  });
});

describe('Core — sub', () => {
  it('subtracts two same-unit quantities', () => {
    expect(valueOf(sub(m(5), m(2)))).toBe(3);
  });

  it('sub resulting in zero', () => {
    expect(valueOf(sub(m(5), m(5)))).toBe(0);
  });

  it('sub resulting in negative', () => {
    expect(valueOf(sub(m(2), m(5)))).toBe(-3);
  });

  it('preserves unit metadata', () => {
    const result = sub(km(10), km(3));
    expect(result._s).toBe(1000);
    expect(result._l).toBe('km');
  });

  it('sub NaN propagates', () => {
    expect(valueOf(sub(m(NaN), m(5)))).toBeNaN();
  });

  it('sub with Infinity', () => {
    expect(valueOf(sub(m(Infinity), m(Infinity)))).toBeNaN();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION B — mul / div
// ═══════════════════════════════════════════════════════════════════════

describe('Core — mul', () => {
  it('multiplies two quantities to produce composed dimension', () => {
    const area = mul(m(3), m(4));
    expect(valueOf(area)).toBe(12);
    expect(area._l).toBe('m*m');
    expect(area._s).toBe(1);
  });

  it('composes scale factors', () => {
    const result = mul(km(2), km(3));
    expect(valueOf(result)).toBe(6);
    expect(result._s).toBe(1000 * 1000); // km^2
  });

  it('mul by zero gives zero', () => {
    expect(valueOf(mul(m(0), m(5)))).toBe(0);
    expect(valueOf(mul(m(5), m(0)))).toBe(0);
  });

  it('mul by scalar leaves dimension unchanged (conceptually)', () => {
    const doubled = mul(scalar(2), m(5));
    expect(valueOf(doubled)).toBe(10);
    expect(doubled._l).toBe('scalar*m');
  });

  it('mul Infinity * 0 = NaN', () => {
    expect(valueOf(mul(m(Infinity), m(0)))).toBeNaN();
  });

  it('mul rejects C (non-zero offset)', () => {
    expect(() => mul(scalar(2), C(100))).toThrow(TypeError);
  });

  it('mul rejects F (non-zero offset)', () => {
    expect(() => mul(F(32), scalar(2))).toThrow(TypeError);
  });

  it('mul allows K (zero offset)', () => {
    expect(valueOf(mul(scalar(2), K(100)))).toBe(200);
  });

  it('mul allows R (zero offset)', () => {
    expect(valueOf(mul(scalar(2), R(100)))).toBe(200);
  });

  it('mul error message mentions affine', () => {
    expect(() => mul(scalar(1), C(0))).toThrow(/affine/i);
  });

  it('mul of negative values', () => {
    expect(valueOf(mul(m(-3), m(-4)))).toBe(12);
    expect(valueOf(mul(m(-3), m(4)))).toBe(-12);
  });

  it('composed label uses * separator', () => {
    expect(mul(kg(1), m(1))._l).toBe('kg*m');
    expect(mul(N(1), m(1))._l).toBe('N*m');
  });

  it('output offset is always 0', () => {
    expect(mul(m(1), m(1))._o).toBe(0);
    expect(mul(K(1), K(1))._o).toBe(0);
  });
});

describe('Core — div', () => {
  it('divides two quantities to produce composed dimension', () => {
    const velocity = div(m(100), s(10));
    expect(valueOf(velocity)).toBe(10);
    expect(velocity._l).toBe('m/s');
    expect(velocity._s).toBe(1);
  });

  it('composes scale factors', () => {
    const result = div(km(10), h(2));
    expect(valueOf(result)).toBe(5);
    expect(result._s).toBeCloseTo(1000 / 3600, 10);
  });

  it('div by zero gives Infinity', () => {
    expect(valueOf(div(m(5), s(0)))).toBe(Infinity);
  });

  it('0 / 0 gives NaN', () => {
    expect(valueOf(div(m(0), s(0)))).toBeNaN();
  });

  it('div by scalar', () => {
    expect(valueOf(div(m(10), scalar(2)))).toBe(5);
  });

  it('div rejects C (non-zero offset)', () => {
    expect(() => div(C(100), scalar(2))).toThrow(TypeError);
  });

  it('div rejects F (non-zero offset)', () => {
    expect(() => div(F(212), scalar(2))).toThrow(TypeError);
  });

  it('div allows K (zero offset)', () => {
    expect(valueOf(div(K(200), scalar(2)))).toBe(100);
  });

  it('composed label uses / separator', () => {
    expect(div(m(1), s(1))._l).toBe('m/s');
    expect(div(kg(1), m(1))._l).toBe('kg/m');
  });

  it('output offset is always 0', () => {
    expect(div(m(1), s(1))._o).toBe(0);
  });

  it('div of negative values', () => {
    expect(valueOf(div(m(-10), s(2)))).toBe(-5);
    expect(valueOf(div(m(-10), s(-2)))).toBe(5);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION C — to (conversion)
// ═══════════════════════════════════════════════════════════════════════

describe('Core — to (conversion)', () => {
  it('converts between same-dimension units', () => {
    expect(valueOf(to(m, km(1)))).toBe(1000);
    expect(valueOf(to(km, m(1500)))).toBe(1.5);
  });

  it('identity conversion (same unit)', () => {
    expect(valueOf(to(m, m(42)))).toBe(42);
    expect(valueOf(to(K, K(300)))).toBe(300);
  });

  it('affine conversion: C -> K', () => {
    expect(valueOf(to(K, C(0)))).toBeCloseTo(273.15, 6);
    expect(valueOf(to(K, C(100)))).toBeCloseTo(373.15, 4);
  });

  it('affine conversion: K -> C', () => {
    expect(valueOf(to(C, K(273.15)))).toBeCloseTo(0, 6);
    expect(valueOf(to(C, K(373.15)))).toBeCloseTo(100, 4);
  });

  it('affine conversion: C -> F', () => {
    expect(valueOf(to(F, C(0)))).toBeCloseTo(32, 2);
    expect(valueOf(to(F, C(100)))).toBeCloseTo(212, 2);
  });

  it('affine conversion: F -> C', () => {
    expect(valueOf(to(C, F(32)))).toBeCloseTo(0, 4);
    expect(valueOf(to(C, F(212)))).toBeCloseTo(100, 2);
  });

  it('conversion formula: result = (value * scale + offset - targetOffset) / targetScale', () => {
    // C(100) -> F: (100 * 1 + 273.15 - 255.3722...) / (5/9)
    const result = valueOf(to(F, C(100)));
    const expected = (100 * 1 + 273.15 - 255.3722222222222) / (5 / 9);
    expect(result).toBeCloseTo(expected, 4);
  });

  it('converts zero correctly', () => {
    expect(valueOf(to(m, km(0)))).toBe(0);
    expect(valueOf(to(km, m(0)))).toBe(0);
  });

  it('converts negative correctly', () => {
    expect(valueOf(to(m, km(-1)))).toBe(-1000);
  });

  it('Infinity propagates through conversion', () => {
    expect(valueOf(to(m, km(Infinity)))).toBe(Infinity);
    expect(valueOf(to(km, m(-Infinity)))).toBe(-Infinity);
  });

  it('NaN propagates through conversion', () => {
    expect(valueOf(to(m, km(NaN)))).toBeNaN();
  });

  it('conversion preserves target metadata', () => {
    const result = to(km, m(1500));
    expect(result._s).toBe(1000);
    expect(result._l).toBe('km');
    expect(result._o).toBe(0);
  });

  it('temperature conversion preserves target offset', () => {
    const result = to(C, K(300));
    expect(result._o).toBe(273.15);
    expect(result._l).toBe('C');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION D — Comparisons
// ═══════════════════════════════════════════════════════════════════════

describe('Core — eq', () => {
  it('equal values', () => {
    expect(eq(m(5), m(5))).toBe(true);
  });

  it('unequal values', () => {
    expect(eq(m(5), m(5.001))).toBe(false);
  });

  it('NaN !== NaN (IEEE 754)', () => {
    expect(eq(m(NaN), m(NaN))).toBe(false);
  });

  it('0 === -0 (IEEE 754)', () => {
    expect(eq(m(0), m(-0))).toBe(true);
  });

  it('Infinity === Infinity', () => {
    expect(eq(m(Infinity), m(Infinity))).toBe(true);
  });

  it('-Infinity === -Infinity', () => {
    expect(eq(m(-Infinity), m(-Infinity))).toBe(true);
  });

  it('Infinity !== -Infinity', () => {
    expect(eq(m(Infinity), m(-Infinity))).toBe(false);
  });
});

describe('Core — lt', () => {
  it('less than', () => {
    expect(lt(m(1), m(2))).toBe(true);
  });

  it('not less when equal', () => {
    expect(lt(m(2), m(2))).toBe(false);
  });

  it('not less when greater', () => {
    expect(lt(m(3), m(2))).toBe(false);
  });

  it('NaN comparisons always false', () => {
    expect(lt(m(NaN), m(5))).toBe(false);
    expect(lt(m(5), m(NaN))).toBe(false);
    expect(lt(m(NaN), m(NaN))).toBe(false);
  });

  it('negative values', () => {
    expect(lt(m(-5), m(-3))).toBe(true);
    expect(lt(m(-3), m(-5))).toBe(false);
  });

  it('Infinity ordering', () => {
    expect(lt(m(1e100), m(Infinity))).toBe(true);
    expect(lt(m(-Infinity), m(-1e100))).toBe(true);
  });
});

describe('Core — lte', () => {
  it('less than', () => expect(lte(m(1), m(2))).toBe(true));
  it('equal', () => expect(lte(m(2), m(2))).toBe(true));
  it('greater', () => expect(lte(m(3), m(2))).toBe(false));
  it('NaN always false', () => expect(lte(m(NaN), m(NaN))).toBe(false));
});

describe('Core — gt', () => {
  it('greater than', () => expect(gt(m(3), m(2))).toBe(true));
  it('not greater when equal', () => expect(gt(m(2), m(2))).toBe(false));
  it('not greater when less', () => expect(gt(m(1), m(2))).toBe(false));
  it('NaN always false', () => expect(gt(m(NaN), m(5))).toBe(false));
});

describe('Core — gte', () => {
  it('greater than', () => expect(gte(m(3), m(2))).toBe(true));
  it('equal', () => expect(gte(m(2), m(2))).toBe(true));
  it('less', () => expect(gte(m(1), m(2))).toBe(false));
  it('NaN always false', () => expect(gte(m(NaN), m(NaN))).toBe(false));
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION E — valueOf
// ═══════════════════════════════════════════════════════════════════════

describe('Core — valueOf', () => {
  it('extracts raw number', () => {
    expect(valueOf(m(42))).toBe(42);
    expect(typeof valueOf(m(42))).toBe('number');
  });

  it('extracts zero', () => {
    expect(valueOf(m(0))).toBe(0);
  });

  it('extracts negative', () => {
    expect(valueOf(m(-7.5))).toBe(-7.5);
  });

  it('extracts Infinity', () => {
    expect(valueOf(m(Infinity))).toBe(Infinity);
  });

  it('extracts NaN', () => {
    expect(valueOf(m(NaN))).toBeNaN();
  });

  it('extracts from converted quantity', () => {
    expect(valueOf(to(m, km(1.5)))).toBe(1500);
  });

  it('extracts from arithmetic result', () => {
    expect(valueOf(add(m(1), m(2)))).toBe(3);
    expect(valueOf(mul(m(3), m(4)))).toBe(12);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION F — format
// ═══════════════════════════════════════════════════════════════════════

describe('Core — format', () => {
  it('formats as "value label"', () => {
    expect(format(m(5))).toBe('5 m');
    expect(format(km(1.5))).toBe('1.5 km');
  });

  it('formats with precision (toFixed)', () => {
    expect(format(m(3.14159), { precision: 2 })).toBe('3.14 m');
    expect(format(m(3.14159), { precision: 0 })).toBe('3 m');
    expect(format(m(3.14159), { precision: 4 })).toBe('3.1416 m');
  });

  it('formats zero', () => {
    expect(format(m(0))).toBe('0 m');
  });

  it('formats negative', () => {
    expect(format(m(-5))).toBe('-5 m');
  });

  it('formats Infinity', () => {
    expect(format(m(Infinity))).toBe('Infinity m');
  });

  it('formats NaN', () => {
    expect(format(m(NaN))).toBe('NaN m');
  });

  it('formats composed labels from mul', () => {
    expect(format(mul(m(3), m(4)))).toBe('12 m*m');
  });

  it('formats composed labels from div', () => {
    expect(format(div(m(10), s(2)))).toBe('5 m/s');
  });

  it('formats with precision 0 on integer', () => {
    expect(format(m(42), { precision: 0 })).toBe('42 m');
  });

  it('precision undefined uses String() (full precision)', () => {
    expect(format(m(1 / 3))).toBe(`${1 / 3} m`);
  });

  it('precision null uses String() (full precision)', () => {
    expect(format(m(1 / 3), { precision: undefined })).toBe(`${1 / 3} m`);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION G — parse
// ═══════════════════════════════════════════════════════════════════════

describe('Core — parse', () => {
  describe('valid inputs', () => {
    it('parses "5 m" -> m(5)', () => {
      const q = parse('5 m');
      expect(valueOf(q)).toBe(5);
      expect(q._l).toBe('m');
      expect(q._s).toBe(1);
    });

    it('parses "1.5 km" -> km(1.5)', () => {
      const q = parse('1.5 km');
      expect(valueOf(q)).toBe(1.5);
      expect(q._l).toBe('km');
    });

    it('parses negative: "-10 s" -> s(-10)', () => {
      const q = parse('-10 s');
      expect(valueOf(q)).toBe(-10);
      expect(q._l).toBe('s');
    });

    it('parses scientific notation: "1e3 g" -> g(1000)', () => {
      const q = parse('1e3 g');
      expect(valueOf(q)).toBe(1000);
      expect(q._l).toBe('g');
    });

    it('parses with extra whitespace', () => {
      const q = parse('  5   m  ');
      expect(valueOf(q)).toBe(5);
      expect(q._l).toBe('m');
    });

    it('parses middle tokens ignored: "5 extra m" uses first and last', () => {
      const q = parse('5 extra m');
      expect(valueOf(q)).toBe(5);
      expect(q._l).toBe('m');
    });

    it('parses "0 m" -> m(0)', () => {
      const q = parse('0 m');
      expect(valueOf(q)).toBe(0);
    });

    it('parses all velocity labels correctly', () => {
      expect(parse('10 m/s')._l).toBe('m/s');
      expect(parse('100 km/h')._l).toBe('km/h');
      expect(parse('88 ft/s')._l).toBe('ft/s');
      expect(parse('60 mph')._l).toBe('mph');
      expect(parse('10 kn')._l).toBe('kn');
      expect(parse('1 c')._l).toBe('c');
    });

    it('parses temperature labels', () => {
      expect(parse('300 K')._l).toBe('K');
      expect(parse('100 C')._l).toBe('C');
      expect(parse('212 F')._l).toBe('F');
      expect(parse('491.67 R')._l).toBe('R');
      expect(parse('1 pT')._l).toBe('pT');
    });

    it('parses special labels: "in", "Da", "pt-liq"', () => {
      expect(parse('12 in')._l).toBe('in');
      expect(parse('12 Da')._l).toBe('Da');
      expect(parse('1 pt-liq')._l).toBe('pt-liq');
    });

    it('parses "0 scalar" -> scalar(0)', () => {
      const q = parse('0 scalar');
      expect(q._l).toBe('scalar');
      expect(valueOf(q)).toBe(0);
    });
  });

  describe('error handling', () => {
    it('throws TypeError on empty string', () => {
      expect(() => parse('')).toThrow(TypeError);
    });

    it('throws TypeError on whitespace-only', () => {
      expect(() => parse('   ')).toThrow(TypeError);
    });

    it('throws TypeError on missing unit (single token)', () => {
      expect(() => parse('5')).toThrow(TypeError);
    });

    it('throws TypeError on unknown unit', () => {
      expect(() => parse('5 miles')).toThrow(TypeError);
      expect(() => parse('5 meters')).toThrow(TypeError);
      expect(() => parse('5 kg/m')).toThrow(TypeError);
    });

    it('throws TypeError on non-numeric value', () => {
      expect(() => parse('abc m')).toThrow(TypeError);
    });

    it('throws on unit only (no value)', () => {
      expect(() => parse('m')).toThrow(TypeError);
    });
  });

  describe('adversarial inputs', () => {
    it('rejects __proto__ as unit', () => {
      expect(() => parse('5 __proto__')).toThrow(TypeError);
    });

    it('rejects constructor as unit', () => {
      expect(() => parse('5 constructor')).toThrow(TypeError);
    });

    it('rejects toString as unit', () => {
      expect(() => parse('5 toString')).toThrow(TypeError);
    });

    it('handles very long input gracefully', () => {
      const longStr = '42 ' + 'x'.repeat(10000);
      expect(() => parse(longStr)).toThrow(TypeError);
    });

    it('parses Infinity value: "Infinity m"', () => {
      const q = parse('Infinity m');
      expect(valueOf(q)).toBe(Infinity);
    });

    it('parses negative Infinity: "-Infinity m"', () => {
      const q = parse('-Infinity m');
      expect(valueOf(q)).toBe(-Infinity);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION H — scalar
// ═══════════════════════════════════════════════════════════════════════

describe('Core — scalar', () => {
  it('creates dimensionless quantity', () => {
    const q = scalar(42);
    expect(valueOf(q)).toBe(42);
    expect(q._l).toBe('scalar');
    expect(q._s).toBe(1);
    expect(q._o).toBe(0);
  });

  it('scalar dimension is all-zeros', () => {
    expect(scalar._dim).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('mul scalar * quantity preserves quantity dimension concept', () => {
    const doubled = mul(scalar(2), m(5));
    expect(valueOf(doubled)).toBe(10);
  });

  it('div quantity / scalar preserves quantity dimension concept', () => {
    const halved = div(m(10), scalar(2));
    expect(valueOf(halved)).toBe(5);
  });

  it('scalar + scalar works', () => {
    expect(valueOf(add(scalar(0.5), scalar(0.5)))).toBe(1);
  });

  it('scalar - scalar works', () => {
    expect(valueOf(sub(scalar(1), scalar(0.3)))).toBeCloseTo(0.7);
  });

  it('scalar from string', () => {
    expect(valueOf(scalar('3.14'))).toBe(3.14);
  });

  it('format scalar', () => {
    expect(format(scalar(42))).toBe('42 scalar');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION I — createChecked
// ═══════════════════════════════════════════════════════════════════════

describe('Core — createChecked', () => {
  it('returns all factories and operations', () => {
    const c = createChecked();
    expect(typeof c.m).toBe('function');
    expect(typeof c.km).toBe('function');
    expect(typeof c.s).toBe('function');
    expect(typeof c.add).toBe('function');
    expect(typeof c.sub).toBe('function');
    expect(typeof c.mul).toBe('function');
    expect(typeof c.div).toBe('function');
    expect(typeof c.to).toBe('function');
    expect(typeof c.eq).toBe('function');
    expect(typeof c.valueOf).toBe('function');
    expect(typeof c.format).toBe('function');
    expect(typeof c.parse).toBe('function');
  });

  describe('checked add', () => {
    it('works for same units', () => {
      const c = createChecked();
      expect(c.valueOf(c.add(c.m(1), c.m(2)))).toBe(3);
    });

    it('throws on dimension mismatch (m + s)', () => {
      const c = createChecked();
      expect(() => c.add(c.m(1) as any, c.s(1) as any)).toThrow(/[Dd]imension/);
    });

    it('throws on label mismatch same dimension (m + km)', () => {
      const c = createChecked();
      expect(() => c.add(c.m(1) as any, c.km(1) as any)).toThrow(/[Uu]nit/);
    });

    it('throws on cross-category (length + mass)', () => {
      const c = createChecked();
      expect(() => c.add(c.m(1) as any, c.kg(1) as any)).toThrow();
    });

    it('throws on cross-category (temperature + pressure)', () => {
      const c = createChecked();
      expect(() => c.add(c.K(1) as any, c.Pa(1) as any)).toThrow();
    });
  });

  describe('checked sub', () => {
    it('works for same units', () => {
      const c = createChecked();
      expect(c.valueOf(c.sub(c.m(5), c.m(2)))).toBe(3);
    });

    it('throws on dimension mismatch', () => {
      const c = createChecked();
      expect(() => c.sub(c.kg(1) as any, c.s(1) as any)).toThrow(/[Dd]imension/);
    });

    it('throws on label mismatch', () => {
      const c = createChecked();
      expect(() => c.sub(c.m(5) as any, c.cm(2) as any)).toThrow(/[Uu]nit/);
    });
  });

  describe('checked to', () => {
    it('works for compatible units', () => {
      const c = createChecked();
      expect(c.valueOf(c.to(c.m, c.km(1)))).toBe(1000);
    });

    it('throws on dimension mismatch', () => {
      const c = createChecked();
      expect(() => c.to(c.s as any, c.km(1) as any)).toThrow(/[Dd]imension/);
    });

    it('allows same-dimension different-unit conversion', () => {
      const c = createChecked();
      expect(c.valueOf(c.to(c.g, c.kg(1)))).toBe(1000);
    });

    it('works for temperature conversions', () => {
      const c = createChecked();
      expect(c.valueOf(c.to(c.F, c.C(100)))).toBeCloseTo(212, 2);
    });
  });

  describe('checked mul/div pass-through', () => {
    it('mul works through checked mode', () => {
      const c = createChecked();
      expect(c.valueOf(c.mul(c.m(3), c.m(4)))).toBe(12);
    });

    it('div works through checked mode', () => {
      const c = createChecked();
      expect(c.valueOf(c.div(c.m(10), c.s(2)))).toBe(5);
    });

    it('mul still rejects affine through checked mode', () => {
      const c = createChecked();
      expect(() => c.mul(c.scalar(2), c.C(100))).toThrow(TypeError);
    });
  });

  describe('checked comparisons pass-through', () => {
    it('eq works', () => {
      const c = createChecked();
      expect(c.eq(c.m(5), c.m(5))).toBe(true);
      expect(c.eq(c.m(5), c.m(6))).toBe(false);
    });

    it('lt works', () => {
      const c = createChecked();
      expect(c.lt(c.m(1), c.m(2))).toBe(true);
    });

    it('gt works', () => {
      const c = createChecked();
      expect(c.gt(c.m(2), c.m(1))).toBe(true);
    });
  });

  describe('checked helpers pass-through', () => {
    it('valueOf works', () => {
      const c = createChecked();
      expect(c.valueOf(c.m(42))).toBe(42);
    });

    it('format works', () => {
      const c = createChecked();
      expect(c.format(c.m(5))).toBe('5 m');
    });

    it('parse works', () => {
      const c = createChecked();
      const q = c.parse('5 m');
      expect(c.valueOf(q)).toBe(5);
      expect(q._l).toBe('m');
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION J — IEEE 754 edge cases
// ═══════════════════════════════════════════════════════════════════════

describe('Core — IEEE 754 edge cases', () => {
  it('NaN as number type is accepted by factory (no throw)', () => {
    const q = m(NaN);
    expect(valueOf(q)).toBeNaN();
  });

  it('NaN string is rejected by factory', () => {
    expect(() => m('NaN')).toThrow(TypeError);
  });

  it('-0 through conversion produces +0 (offset arithmetic)', () => {
    // -0 * 1 + 0 - 0 = +0 (IEEE 754: -0 + 0 = +0)
    const result = valueOf(to(m, m(-0)));
    expect(Object.is(result, 0)).toBe(true);
  });

  it('floating point precision: 0.1 + 0.2 !== 0.3', () => {
    const result = valueOf(add(m(0.1), m(0.2)));
    expect(result).not.toBe(0.3);
    expect(result).toBeCloseTo(0.3);
  });

  it('large integer precision near MAX_SAFE_INTEGER', () => {
    const big = 9007199254740991; // Number.MAX_SAFE_INTEGER
    const q = m(big);
    expect(valueOf(q)).toBe(big);
  });

  it('Infinity arithmetic', () => {
    expect(valueOf(add(m(Infinity), m(1)))).toBe(Infinity);
    expect(valueOf(sub(m(Infinity), m(1)))).toBe(Infinity);
    expect(valueOf(mul(m(Infinity), m(2)))).toBe(Infinity);
    expect(valueOf(div(m(1), m(0)))).toBe(Infinity);
  });

  it('Infinity - Infinity = NaN', () => {
    expect(valueOf(sub(m(Infinity), m(Infinity)))).toBeNaN();
  });

  it('0 * Infinity = NaN', () => {
    expect(valueOf(mul(m(0), m(Infinity)))).toBeNaN();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION K — Cross-dimension real-world workflows
// ═══════════════════════════════════════════════════════════════════════

describe('Core — Cross-dimension workflows', () => {
  it('speed = distance / time: 100 m / 10 s = 10 m/s', () => {
    const speed = div(m(100), s(10));
    expect(valueOf(speed)).toBe(10);
  });

  it('force = mass * acceleration (conceptual via mul)', () => {
    // F = m * a; 10 kg at 9.81 m/s^2 ~ 98.1 N
    const force = mul(kg(10), div(m(9.81), mul(s(1), s(1))));
    expect(valueOf(force)).toBeCloseTo(98.1);
  });

  it('energy = force * distance: 100 N * 10 m = 1000 N*m', () => {
    const energy = mul(N(100), m(10));
    expect(valueOf(energy)).toBe(1000);
  });

  it('power = energy / time: 1000 J / 10 s = 100 W equivalent', () => {
    const power = div(J(1000), s(10));
    expect(valueOf(power)).toBe(100);
  });

  it('convert then add: km to m then add', () => {
    const total = add(m(500), to(m, km(1)));
    expect(valueOf(total)).toBe(1500);
  });

  it('marathon pace: 42.195 km / 2 h = 21.0975 km/h', () => {
    const pace = div(km(42.195), h(2));
    expect(valueOf(pace)).toBeCloseTo(21.0975);
  });

  it('fuel efficiency: 100 km / 8 l', () => {
    const efficiency = div(km(100), l(8));
    expect(valueOf(efficiency)).toBe(12.5);
    expect(efficiency._l).toBe('km/l');
  });

  it('electricity cost: 30 kWh * $0.12/kWh (scalar)', () => {
    const totalEnergy = kWh(30);
    const costScalar = scalar(0.12);
    const cost = mul(totalEnergy, costScalar);
    expect(valueOf(cost)).toBeCloseTo(3.6);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION L — String input edge cases (toNum function)
// ═══════════════════════════════════════════════════════════════════════

describe('Core — String input edge cases', () => {
  it('integer string', () => expect(valueOf(m('42'))).toBe(42));
  it('float string', () => expect(valueOf(m('3.14'))).toBe(3.14));
  it('negative string', () => expect(valueOf(m('-10'))).toBe(-10));
  it('leading whitespace', () => expect(valueOf(m('  42'))).toBe(42));
  it('trailing whitespace', () => expect(valueOf(m('42  '))).toBe(42));
  it('both whitespace', () => expect(valueOf(m('  42  '))).toBe(42));
  it('scientific notation', () => expect(valueOf(m('1e3'))).toBe(1000));
  it('negative scientific', () => expect(valueOf(m('-1.5e2'))).toBe(-150));
  it('Infinity string is accepted by factory', () => expect(valueOf(m('Infinity'))).toBe(Infinity));
  it('-Infinity string is accepted', () => expect(valueOf(m('-Infinity'))).toBe(-Infinity));

  it('throws on empty string', () => expect(() => m('')).toThrow(TypeError));
  it('throws on whitespace-only', () => expect(() => m('   ')).toThrow(TypeError));
  it('throws on non-numeric', () => expect(() => m('abc')).toThrow(TypeError));
  it('throws on "5 m" (value with space)', () => expect(() => m('5 m')).toThrow(TypeError));
  it('throws on "NaN" string', () => expect(() => m('NaN')).toThrow(TypeError));
  it('throws on undefined-like', () => expect(() => m('undefined')).toThrow(TypeError));
  it('throws on null-like', () => expect(() => m('null')).toThrow(TypeError));
  it('throws on boolean-like', () => expect(() => m('true')).toThrow(TypeError));
});
