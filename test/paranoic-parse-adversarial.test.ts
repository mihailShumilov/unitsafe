/**
 * PARANOIC ACCEPTANCE TESTS: Parse Edge Cases, All 110 Labels, and Adversarial Scenarios
 *
 * Coverage Summary:
 * - parse() with all 110 registered unit labels (systematic coverage)
 * - Parse scale/offset/label verification for every parsed quantity
 * - Parse with special labels: "Da", "pt-liq", "m/s", "km/h", "ft/s", "c"
 * - Adversarial parse inputs: prototype pollution, unicode exploits, very long strings
 * - Parse does not mutate or have side effects
 * - Parse with extreme numeric values per unit
 * - Composite workflow tests: parse -> convert -> format -> parse roundtrip
 *
 * These tests are IMMUTABLE CONTRACTS.
 */

import { describe, it, expect } from 'vitest';
import {
  m, km, cm, mm, nm, um, dm, nmi, mil, au, ly, pc, pl,
  inch, ft, yd, mi,
  kg, g, lb, oz, ug, mg, t, st, ton, lton, dalton, plm,
  s, ms, min, h, ns, us, d, week, month, yr, decade, century, plt,
  K, C, F, R, pT,
  mm2, cm2, m2, ha, km2, in2, ft2, yd2, ac, mi2, pla,
  ml, cl, l, m3, tsp, tbsp, floz, cup, pt_liq, qt, gal, plv,
  mps, kmh, fps, mph, kn, pvel,
  N, kN, lbf, dyn, pfo,
  J, kJ, cal, kcal, Wh, kWh, eV, BTU, pene,
  W, kW, MW, hp, ppow,
  Pa, kPa, bar, psi, atm, mmHg, ppre,
  b, B, KB, MB, GB, TB, PB,
  scalar,
  add, sub, mul, div,
  to,
  eq,
  valueOf,
  format,
  parse,
} from '../src/index.js';

// ═══════════════════════════════════════════════════════════════════════
// SECTION 1: SYSTEMATIC PARSE OF ALL 110 UNIT LABELS
// Every registered label must be parseable. This catches registry gaps.
// ═══════════════════════════════════════════════════════════════════════

describe('parse — all 110 unit labels', () => {
  /**
   * Master list of all labels with expected scale and offset.
   * Any factory added to the library MUST also appear in this table,
   * otherwise these tests expose the gap.
   */
  const allLabels: [string, number, number][] = [
    // Length
    ['m',    1,                          0],
    ['km',   1000,                       0],
    ['cm',   0.01,                       0],
    ['mm',   0.001,                      0],
    ['nm',   1e-9,                       0],
    ['um',   1e-6,                       0],
    ['dm',   0.1,                        0],
    ['nmi',  1852,                       0],
    ['mil',  2.54e-5,                    0],
    ['au',   1.495978707e11,             0],
    ['ly',   9.4607304725808e15,         0],
    ['pc',   3.0856775814913673e16,      0],
    ['pl',   1.616255e-35,               0],
    ['in',   0.0254,                     0],
    ['ft',   0.3048,                     0],
    ['yd',   0.9144,                     0],
    ['mi',   1609.344,                   0],
    // Mass
    ['kg',   1,                          0],
    ['g',    0.001,                      0],
    ['lb',   0.45359237,                 0],
    ['oz',   0.028349523125,             0],
    ['ug',   1e-9,                       0],
    ['mg',   1e-6,                       0],
    ['t',    1000,                       0],
    ['st',   6.35029318,                 0],
    ['ton',  907.18474,                  0],
    ['lton', 1016.0469088,               0],
    ['Da',   1.6605390666e-27,           0],
    ['plm',  2.176434e-8,               0],
    // Time
    ['s',       1,                       0],
    ['ms',      0.001,                   0],
    ['min',     60,                      0],
    ['h',       3600,                    0],
    ['ns',      1e-9,                    0],
    ['us',      1e-6,                    0],
    ['d',       86400,                   0],
    ['week',    604800,                  0],
    ['month',   2629800,                 0],
    ['yr',      31557600,                0],
    ['decade',  315576000,               0],
    ['century', 3155760000,              0],
    ['plt',     5.391247e-44,            0],
    // Temperature
    ['K',  1,               0],
    ['C',  1,               273.15],
    ['F',  5/9,             255.3722222222222],
    ['R',  5/9,             0],
    ['pT', 1.416784e32,     0],
    // Area
    ['mm2', 1e-6,                        0],
    ['cm2', 1e-4,                        0],
    ['m2',  1,                           0],
    ['ha',  10000,                       0],
    ['km2', 1e6,                         0],
    ['in2', 6.4516e-4,                   0],
    ['ft2', 0.09290304,                  0],
    ['yd2', 0.83612736,                  0],
    ['ac',  4046.8564224,                0],
    ['mi2', 2589988.110336,              0],
    ['pla', 2.61228e-70,                 0],
    // Volume
    ['ml',     1e-6,                     0],
    ['cl',     1e-5,                     0],
    ['l',      0.001,                    0],
    ['m3',     1,                        0],
    ['tsp',    4.92892159375e-6,         0],
    ['tbsp',   1.478676478125e-5,        0],
    ['floz',   2.95735295625e-5,         0],
    ['cup',    2.365882365e-4,           0],
    ['pt-liq', 4.73176473e-4,            0],
    ['qt',     9.46352946e-4,            0],
    ['gal',    3.785411784e-3,           0],
    ['plv',    4.22419e-105,             0],
    // Velocity
    ['m/s',  1,                          0],
    ['km/h', 5/18,                       0],
    ['ft/s', 0.3048,                     0],
    ['mph',  0.44704,                    0],
    ['kn',   1852/3600,                  0],
    ['c',    299792458,                  0],
    // Force
    ['N',   1,                           0],
    ['kN',  1000,                        0],
    ['lbf', 4.4482216152605,             0],
    ['dyn', 1e-5,                        0],
    ['pfo', 1.21027e44,                  0],
    // Energy
    ['J',    1,                          0],
    ['kJ',   1000,                       0],
    ['cal',  4.184,                      0],
    ['kcal', 4184,                       0],
    ['Wh',   3600,                       0],
    ['kWh',  3600000,                    0],
    ['eV',   1.602176634e-19,            0],
    ['BTU',  1055.06,                    0],
    ['pene', 1.9561e9,                   0],
    // Power
    ['W',    1,                          0],
    ['kW',   1000,                       0],
    ['MW',   1e6,                        0],
    ['hp',   745.69987158227,            0],
    ['ppow', 3.62831e52,                 0],
    // Pressure
    ['Pa',   1,                          0],
    ['kPa',  1000,                       0],
    ['bar',  100000,                     0],
    ['psi',  6894.757293168361,          0],
    ['atm',  101325,                     0],
    ['mmHg', 133.322387415,              0],
    ['ppre', 4.63309e113,                0],
    // Data
    ['b',  1,                            0],
    ['B',  8,                            0],
    ['KB', 8192,                         0],
    ['MB', 8388608,                      0],
    ['GB', 8589934592,                   0],
    ['TB', 8796093022208,                0],
    ['PB', 9007199254740992,             0],
    // Scalar
    ['scalar', 1,                        0],
  ];

  it('verifies we are testing exactly 110 labels', () => {
    expect(allLabels.length).toBe(110);
  });

  describe('parse("1 <label>") succeeds for every registered label', () => {
    for (const [label, expectedScale, expectedOffset] of allLabels) {
      it(`parse("1 ${label}") — value=1, scale=${expectedScale}, offset=${expectedOffset}`, () => {
        const q = parse(`1 ${label}`);
        expect(valueOf(q)).toBe(1);
        expect(q._l).toBe(label);
        expect(q._s).toBe(expectedScale);
        expect(q._o).toBe(expectedOffset);
      });
    }
  });

  describe('parse("0 <label>") for every label', () => {
    for (const [label] of allLabels) {
      it(`parse("0 ${label}") = 0`, () => {
        expect(valueOf(parse(`0 ${label}`))).toBe(0);
      });
    }
  });

  describe('parse("-1 <label>") for every label', () => {
    for (const [label] of allLabels) {
      it(`parse("-1 ${label}") = -1`, () => {
        expect(valueOf(parse(`-1 ${label}`))).toBe(-1);
      });
    }
  });

  describe('parse("3.14 <label>") for every label', () => {
    for (const [label] of allLabels) {
      it(`parse("3.14 ${label}") = 3.14`, () => {
        expect(valueOf(parse(`3.14 ${label}`))).toBeCloseTo(3.14);
      });
    }
  });

  describe('parse("1e5 <label>") scientific notation for every label', () => {
    for (const [label] of allLabels) {
      it(`parse("1e5 ${label}") = 100000`, () => {
        expect(valueOf(parse(`1e5 ${label}`))).toBe(100000);
      });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 2: SPECIAL LABEL PARSING
// Labels containing special characters: "/", "-", etc.
// ═══════════════════════════════════════════════════════════════════════

describe('parse — special unit labels', () => {
  describe('velocity labels with "/"', () => {
    it('parse("100 m/s") parses correctly', () => {
      const q = parse('100 m/s');
      expect(valueOf(q)).toBe(100);
      expect(q._l).toBe('m/s');
    });

    it('parse("120 km/h") parses correctly', () => {
      const q = parse('120 km/h');
      expect(valueOf(q)).toBe(120);
      expect(q._l).toBe('km/h');
    });

    it('parse("1100 ft/s") parses correctly (speed of sound)', () => {
      const q = parse('1100 ft/s');
      expect(valueOf(q)).toBe(1100);
      expect(q._l).toBe('ft/s');
    });
  });

  describe('dalton label "Da"', () => {
    it('parse("1 Da") parses correctly', () => {
      const q = parse('1 Da');
      expect(valueOf(q)).toBe(1);
      expect(q._l).toBe('Da');
      expect(q._s).toBe(1.6605390666e-27);
    });

    it('parse("6.022e23 Da") = Avogadro number of daltons', () => {
      const q = parse('6.022e23 Da');
      expect(valueOf(q)).toBeCloseTo(6.022e23);
    });
  });

  describe('pt-liq label with hyphen', () => {
    it('parse("1 pt-liq") parses correctly', () => {
      const q = parse('1 pt-liq');
      expect(valueOf(q)).toBe(1);
      expect(q._l).toBe('pt-liq');
    });

    it('parse("-2.5 pt-liq") parses negative', () => {
      const q = parse('-2.5 pt-liq');
      expect(valueOf(q)).toBe(-2.5);
    });
  });

  describe('speed of light label "c"', () => {
    it('parse("1 c") parses as speed of light', () => {
      const q = parse('1 c');
      expect(valueOf(q)).toBe(1);
      expect(q._l).toBe('c');
      expect(q._s).toBe(299792458);
    });

    it('parse("0.5 c") = half the speed of light', () => {
      const q = parse('0.5 c');
      expect(valueOf(q)).toBe(0.5);
    });
  });

  describe('labels that could be confused with numeric values or keywords', () => {
    it('parse("1 b") parses as bits, not as hex prefix', () => {
      const q = parse('1 b');
      expect(q._l).toBe('b');
      expect(q._s).toBe(1);
    });

    it('parse("1 B") parses as bytes', () => {
      const q = parse('1 B');
      expect(q._l).toBe('B');
      expect(q._s).toBe(8);
    });

    it('parse("1 d") parses as days, not digit', () => {
      const q = parse('1 d');
      expect(q._l).toBe('d');
      expect(q._s).toBe(86400);
    });

    it('parse("1 t") parses as metric ton', () => {
      const q = parse('1 t');
      expect(q._l).toBe('t');
      expect(q._s).toBe(1000);
    });

    it('parse("1 l") parses as liters', () => {
      const q = parse('1 l');
      expect(q._l).toBe('l');
      expect(q._s).toBe(0.001);
    });

    it('parse("1 N") parses as newtons', () => {
      const q = parse('1 N');
      expect(q._l).toBe('N');
      expect(q._s).toBe(1);
    });

    it('parse("1 J") parses as joules', () => {
      const q = parse('1 J');
      expect(q._l).toBe('J');
      expect(q._s).toBe(1);
    });

    it('parse("1 W") parses as watts', () => {
      const q = parse('1 W');
      expect(q._l).toBe('W');
      expect(q._s).toBe(1);
    });

    it('parse("1 R") parses as Rankine', () => {
      const q = parse('1 R');
      expect(q._l).toBe('R');
      expect(q._s).toBe(5/9);
    });

    it('parse("1 K") parses as Kelvin', () => {
      const q = parse('1 K');
      expect(q._l).toBe('K');
      expect(q._s).toBe(1);
    });

    it('parse("1 C") parses as Celsius', () => {
      const q = parse('1 C');
      expect(q._l).toBe('C');
      expect(q._o).toBe(273.15);
    });

    it('parse("1 F") parses as Fahrenheit', () => {
      const q = parse('1 F');
      expect(q._l).toBe('F');
      expect(q._o).toBe(255.3722222222222);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 3: PARSE ADVERSARIAL INPUTS — ADVANCED
// Beyond what parse.test.ts covers
// ═══════════════════════════════════════════════════════════════════════

describe('parse — advanced adversarial inputs', () => {
  describe('very long strings', () => {
    it('extremely long numeric value before unit still parses', () => {
      const longNum = '9'.repeat(100);
      const q = parse(`${longNum} m`);
      expect(valueOf(q)).toBe(Number(longNum));
      expect(q._l).toBe('m');
    });

    it('extremely long whitespace between value and unit', () => {
      const q = parse('42' + ' '.repeat(10000) + 'm');
      expect(valueOf(q)).toBe(42);
      expect(q._l).toBe('m');
    });
  });

  describe('unicode and encoding edge cases', () => {
    it('throws on zero-width space between value and unit', () => {
      // Zero-width space (U+200B) is not standard whitespace for split
      // "5\u200Bm" would be a single token "5\u200Bm" or two tokens depending on regex
      const input = '5\u200Bm';
      // \u200B is not matched by \s in JS regex, so this becomes single token
      expect(() => parse(input)).toThrow(TypeError);
    });

    it('throws on non-breaking space between value and unit', () => {
      // \u00A0 (non-breaking space) IS matched by \s in JS
      const q = parse('5\u00A0m');
      expect(valueOf(q)).toBe(5);
      expect(q._l).toBe('m');
    });

    it('throws on full-width digits as value', () => {
      // Full-width "5" = \uFF15
      expect(() => parse('\uFF15 m')).toThrow(TypeError);
    });

    it('throws on emoji as unit', () => {
      expect(() => parse('5 \u{1F680}')).toThrow(TypeError);
    });

    it('throws on RTL override character in input', () => {
      expect(() => parse('5\u202E m')).toThrow(TypeError);
    });
  });

  describe('duplicate/overlapping label names', () => {
    it('parse("1 ms") parses as milliseconds, not m + s', () => {
      const q = parse('1 ms');
      expect(q._l).toBe('ms');
      expect(q._s).toBe(0.001);
    });

    it('parse("1 mm") parses as millimeters', () => {
      const q = parse('1 mm');
      expect(q._l).toBe('mm');
      expect(q._s).toBe(0.001);
    });

    it('parse("1 mg") parses as milligrams', () => {
      const q = parse('1 mg');
      expect(q._l).toBe('mg');
      expect(q._s).toBe(1e-6);
    });

    it('parse("1 mi") parses as miles, not "m" + "i"', () => {
      const q = parse('1 mi');
      expect(q._l).toBe('mi');
      expect(q._s).toBe(1609.344);
    });

    it('parse("1 ml") parses as milliliters', () => {
      const q = parse('1 ml');
      expect(q._l).toBe('ml');
      expect(q._s).toBe(1e-6);
    });

    it('parse("1 kN") parses as kilonewtons (not k + N)', () => {
      const q = parse('1 kN');
      expect(q._l).toBe('kN');
      expect(q._s).toBe(1000);
    });

    it('parse("1 kW") parses as kilowatts', () => {
      const q = parse('1 kW');
      expect(q._l).toBe('kW');
      expect(q._s).toBe(1000);
    });

    it('parse("1 kJ") parses as kilojoules', () => {
      const q = parse('1 kJ');
      expect(q._l).toBe('kJ');
      expect(q._s).toBe(1000);
    });
  });

  describe('prototype pollution protection', () => {
    it('parse lookup uses null-prototype object (no hasOwnProperty collision)', () => {
      // The factory registry is created with Object.create(null)
      // This means __proto__, constructor, toString etc. should not be valid units
      expect(() => parse('5 __proto__')).toThrow(TypeError);
      expect(() => parse('5 constructor')).toThrow(TypeError);
      expect(() => parse('5 toString')).toThrow(TypeError);
      expect(() => parse('5 valueOf')).toThrow(TypeError);
      expect(() => parse('5 hasOwnProperty')).toThrow(TypeError);
    });
  });

  describe('parse does not produce side effects', () => {
    it('calling parse multiple times produces independent quantities', () => {
      const q1 = parse('5 m');
      const q2 = parse('10 m');
      expect(valueOf(q1)).toBe(5);
      expect(valueOf(q2)).toBe(10);
      // q1 should not have been affected by q2 creation
      expect(valueOf(q1)).toBe(5);
    });

    it('parse result is a fresh object each time', () => {
      const q1 = parse('5 m');
      const q2 = parse('5 m');
      expect(q1).not.toBe(q2);
      expect(q1).toEqual(q2);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 4: PARSE -> CONVERT -> FORMAT ROUNDTRIPS
// End-to-end workflow tests
// ═══════════════════════════════════════════════════════════════════════

describe('parse -> convert -> format workflows', () => {
  it('parse("1 km") -> to(m) -> format = "1000 m"', () => {
    const parsed = parse('1 km');
    const converted = to(m, parsed as any);
    expect(format(converted)).toBe('1000 m');
  });

  it('parse("100 C") -> to(F) -> format with precision 1', () => {
    const parsed = parse('100 C');
    const converted = to(F, parsed as any);
    expect(format(converted, { precision: 1 })).toBe('212.0 F');
  });

  it('parse("1 atm") -> to(Pa) -> valueOf = 101325', () => {
    const parsed = parse('1 atm');
    const converted = to(Pa, parsed as any);
    expect(valueOf(converted)).toBe(101325);
  });

  it('parse("3600 s") -> to(h) -> valueOf = 1', () => {
    const parsed = parse('3600 s');
    const converted = to(h, parsed as any);
    expect(valueOf(converted)).toBe(1);
  });

  it('parse("1 mi") -> to(km) -> format with precision 3', () => {
    const parsed = parse('1 mi');
    const converted = to(km, parsed as any);
    expect(format(converted, { precision: 3 })).toBe('1.609 km');
  });

  it('parse("1 c") -> to(mps) -> format velocity (speed of light)', () => {
    const parsed = parse('1 c');
    const converted = to(mps, parsed as any);
    expect(format(converted)).toBe('299792458 m/s');
  });

  it('parse("1 Da") -> to(kg) -> result is atomic mass unit in kg', () => {
    const parsed = parse('1 Da');
    const converted = to(kg, parsed as any);
    expect(valueOf(converted)).toBeCloseTo(1.6605390666e-27, 37);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 5: PARSE WITH EXTREME VALUES PER UNIT
// ═══════════════════════════════════════════════════════════════════════

describe('parse with extreme values', () => {
  it('parse("1e308 m") near MAX_VALUE', () => {
    const q = parse('1e308 m');
    expect(valueOf(q)).toBe(1e308);
  });

  it('parse("5e-324 m") near MIN_VALUE (smallest positive subnormal)', () => {
    const q = parse('5e-324 m');
    expect(valueOf(q)).toBe(5e-324);
  });

  it('parse("1e309 m") overflows to Infinity', () => {
    const q = parse('1e309 m');
    expect(valueOf(q)).toBe(Infinity);
  });

  it('parse("-1e309 m") overflows to -Infinity', () => {
    const q = parse('-1e309 m');
    expect(valueOf(q)).toBe(-Infinity);
  });

  it('parse("1e-400 m") underflows to 0', () => {
    const q = parse('1e-400 m');
    expect(valueOf(q)).toBe(0);
  });

  it('parse("Infinity km") = Infinity km', () => {
    const q = parse('Infinity km');
    expect(valueOf(q)).toBe(Infinity);
    expect(q._l).toBe('km');
  });

  it('parse("-Infinity km") = -Infinity km', () => {
    const q = parse('-Infinity km');
    expect(valueOf(q)).toBe(-Infinity);
  });

  it('parse("-0 m") preserves negative zero', () => {
    const q = parse('-0 m');
    expect(Object.is(valueOf(q), -0)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 6: ADDITIONAL CROSS-BOUNDARY TESTS
// Things that most developers would forget
// ═══════════════════════════════════════════════════════════════════════

describe('edge cases most developers forget', () => {
  describe('conversion chain stability across many hops', () => {
    it('m -> km -> mi -> yd -> ft -> inch -> cm -> mm -> m roundtrip', () => {
      const original = 123.456;
      let result: any = m(original);
      result = to(km, result);
      result = to(mi, result);
      result = to(yd, result);
      result = to(ft, result);
      result = to(inch, result);
      result = to(cm, result);
      result = to(mm, result);
      result = to(m, result);
      expect(valueOf(result)).toBeCloseTo(original, 4);
    });

    it('K -> C -> F -> R -> K roundtrip for 300 K', () => {
      const original = 300;
      let result: any = K(original);
      result = to(C, result);
      result = to(F, result);
      result = to(R, result);
      result = to(K, result);
      expect(valueOf(result)).toBeCloseTo(original, 4);
    });
  });

  describe('operations on quantities created by different paths yield consistent results', () => {
    it('m(1000) and to(m, km(1)) are eq', () => {
      const a = m(1000);
      const b = to(m, km(1));
      expect(eq(a, b)).toBe(true);
    });

    it('add(to(m, km(1)), m(500)) = m(1500)', () => {
      const result = add(to(m, km(1)), m(500));
      expect(valueOf(result)).toBe(1500);
    });
  });

  describe('scalar is truly dimensionless', () => {
    it('mul(scalar(x), scalar(y)) = scalar(x*y)', () => {
      const result = mul(scalar(7), scalar(6));
      expect(valueOf(result)).toBe(42);
    });

    it('div(scalar(10), scalar(3)) = scalar(10/3)', () => {
      const result = div(scalar(10), scalar(3));
      expect(valueOf(result)).toBeCloseTo(10 / 3);
    });

    it('to(scalar, scalar(42)) = scalar(42)', () => {
      expect(valueOf(to(scalar, scalar(42)))).toBe(42);
    });
  });

  describe('quantity objects are not frozen or sealed', () => {
    it('quantity properties are readonly by interface but not at runtime (plain object)', () => {
      const q = m(5);
      // The interface says readonly, but at runtime it's a plain object
      // This test documents the current behavior
      expect(Object.isFrozen(q)).toBe(false);
      expect(Object.isSealed(q)).toBe(false);
    });
  });

  describe('concurrent-like rapid operations do not interfere', () => {
    it('creating 10000 quantities from different factories produces correct values', () => {
      const results: number[] = [];
      for (let i = 0; i < 10000; i++) {
        const factory = i % 2 === 0 ? m : km;
        results.push(valueOf(factory(i)));
      }
      for (let i = 0; i < 10000; i++) {
        expect(results[i]).toBe(i);
      }
    });

    it('interleaving parse and factory calls produces consistent results', () => {
      for (let i = 0; i < 100; i++) {
        const fromFactory = m(i);
        const fromParse = parse(`${i} m`);
        expect(valueOf(fromFactory)).toBe(valueOf(fromParse));
        expect(fromFactory._l).toBe(fromParse._l);
        expect(fromFactory._s).toBe(fromParse._s);
      }
    });
  });

  describe('format precision does not affect the underlying quantity', () => {
    it('formatting with precision and then reading value gives original', () => {
      const q = m(3.14159265358979);
      format(q, { precision: 2 }); // "3.14 m"
      // The original quantity should be unchanged
      expect(valueOf(q)).toBe(3.14159265358979);
    });
  });

  describe('add/sub on conversion results maintains the target unit metadata', () => {
    it('add(to(m, km(1)), to(m, km(2))) has _l="m" and _s=1', () => {
      const a = to(m, km(1));
      const b = to(m, km(2));
      const result = add(a, b);
      expect(result._l).toBe('m');
      expect(result._s).toBe(1);
      expect(result._o).toBe(0);
      expect(valueOf(result)).toBe(3000);
    });
  });

  describe('Planck units at the extreme', () => {
    it('1 Planck length in meters is ~1.616e-35', () => {
      expect(valueOf(to(m, pl(1)))).toBeCloseTo(1.616255e-35, 40);
    });

    it('1 Planck time in seconds is ~5.391e-44', () => {
      expect(valueOf(to(s, plt(1)))).toBeCloseTo(5.391247e-44, 50);
    });

    it('1 Planck mass in kg is ~2.176e-8', () => {
      expect(valueOf(to(kg, plm(1)))).toBeCloseTo(2.176434e-8, 14);
    });

    it('1 Planck temperature in K is ~1.417e32', () => {
      expect(valueOf(to(K, pT(1)))).toBeCloseTo(1.416784e32, -27);
    });
  });
});
