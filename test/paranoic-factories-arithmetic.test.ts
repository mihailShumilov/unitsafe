/**
 * PARANOIC ACCEPTANCE TESTS: Unit Factories, Arithmetic Operations, and String Coercion
 *
 * Coverage Summary:
 * - All 110 unit factories: scale factor, offset, dimension vector, label consistency
 * - String coercion: edge cases (empty, whitespace, NaN, Infinity strings, unicode digits, etc.)
 * - add/sub: offset propagation, identity element, negative results, Infinity arithmetic
 * - mul/div: composed labels, offset rejection for ALL affine units, division by zero, scale composition
 * - Numeric edge cases: Infinity, -Infinity, NaN propagation, MAX_SAFE_INTEGER, -0, subnormal
 * - Rapid sequential operations (stability under chaining)
 * - Immutability of input quantities
 *
 * These tests are IMMUTABLE CONTRACTS. If the implementation cannot pass them,
 * the implementation must be fixed, not these tests.
 */

import { describe, it, expect } from 'vitest';
import {
  // Length
  m, km, cm, mm, nm, um, dm, nmi, mil, au, ly, pc, pl,
  inch, ft, yd, mi,
  // Mass
  kg, g, lb, oz, ug, mg, t, st, ton, lton, dalton, plm,
  // Time
  s, ms, min, h, ns, us, d, week, month, yr, decade, century, plt,
  // Temperature
  K, C, F, R, pT,
  // Area
  mm2, cm2, m2, ha, km2, in2, ft2, yd2, ac, mi2, pla,
  // Volume
  ml, cl, l, m3, tsp, tbsp, floz, cup, pt_liq, qt, gal, plv,
  // Velocity
  mps, kmh, fps, mph, kn, pvel,
  // Force
  N, kN, lbf, dyn, pfo,
  // Energy
  J, kJ, cal, kcal, Wh, kWh, eV, BTU, pene,
  // Power
  W, kW, MW, hp, ppow,
  // Pressure
  Pa, kPa, bar, psi, atm, mmHg, ppre,
  // Data
  b, B, KB, MB, GB, TB, PB,
  // Scalar
  scalar,
  // Operations
  add, sub, mul, div,
  to,
  valueOf,
  format,
} from '../src/index.js';

// ═══════════════════════════════════════════════════════════════════════
// SECTION 1: EXHAUSTIVE UNIT FACTORY METADATA VERIFICATION
// All 110 factories checked for scale, offset, label, and dim consistency
// ═══════════════════════════════════════════════════════════════════════

describe('unit factory metadata — exhaustive verification of all 110 factories', () => {
  /**
   * Each entry: [factory, expectedLabel, expectedScale, expectedOffset, expectedDim]
   * This is the single source of truth for every factory's configuration.
   */
  const allFactories: [
    { (v: number | string): any; _scale: number; _label: string; _dim: readonly number[]; _offset: number },
    string,
    number,
    number,
    readonly number[],
  ][] = [
    // Length (17 units)
    [m,    'm',    1,                         0, [1,0,0,0,0,0,0,0]],
    [km,   'km',   1000,                      0, [1,0,0,0,0,0,0,0]],
    [cm,   'cm',   0.01,                      0, [1,0,0,0,0,0,0,0]],
    [mm,   'mm',   0.001,                     0, [1,0,0,0,0,0,0,0]],
    [nm,   'nm',   1e-9,                      0, [1,0,0,0,0,0,0,0]],
    [um,   'um',   1e-6,                      0, [1,0,0,0,0,0,0,0]],
    [dm,   'dm',   0.1,                       0, [1,0,0,0,0,0,0,0]],
    [nmi,  'nmi',  1852,                      0, [1,0,0,0,0,0,0,0]],
    [mil,  'mil',  2.54e-5,                   0, [1,0,0,0,0,0,0,0]],
    [au,   'au',   1.495978707e11,            0, [1,0,0,0,0,0,0,0]],
    [ly,   'ly',   9.4607304725808e15,        0, [1,0,0,0,0,0,0,0]],
    [pc,   'pc',   3.0856775814913673e16,     0, [1,0,0,0,0,0,0,0]],
    [pl,   'pl',   1.616255e-35,              0, [1,0,0,0,0,0,0,0]],
    [inch, 'in',   0.0254,                    0, [1,0,0,0,0,0,0,0]],
    [ft,   'ft',   0.3048,                    0, [1,0,0,0,0,0,0,0]],
    [yd,   'yd',   0.9144,                    0, [1,0,0,0,0,0,0,0]],
    [mi,   'mi',   1609.344,                  0, [1,0,0,0,0,0,0,0]],

    // Mass (12 units)
    [kg,     'kg',   1,                        0, [0,1,0,0,0,0,0,0]],
    [g,      'g',    0.001,                    0, [0,1,0,0,0,0,0,0]],
    [lb,     'lb',   0.45359237,               0, [0,1,0,0,0,0,0,0]],
    [oz,     'oz',   0.028349523125,           0, [0,1,0,0,0,0,0,0]],
    [ug,     'ug',   1e-9,                     0, [0,1,0,0,0,0,0,0]],
    [mg,     'mg',   1e-6,                     0, [0,1,0,0,0,0,0,0]],
    [t,      't',    1000,                     0, [0,1,0,0,0,0,0,0]],
    [st,     'st',   6.35029318,               0, [0,1,0,0,0,0,0,0]],
    [ton,    'ton',  907.18474,                0, [0,1,0,0,0,0,0,0]],
    [lton,   'lton', 1016.0469088,             0, [0,1,0,0,0,0,0,0]],
    [dalton, 'Da',   1.6605390666e-27,         0, [0,1,0,0,0,0,0,0]],
    [plm,    'plm',  2.176434e-8,              0, [0,1,0,0,0,0,0,0]],

    // Time (13 units)
    [s,       's',       1,                    0, [0,0,1,0,0,0,0,0]],
    [ms,      'ms',      0.001,                0, [0,0,1,0,0,0,0,0]],
    [min,     'min',     60,                   0, [0,0,1,0,0,0,0,0]],
    [h,       'h',       3600,                 0, [0,0,1,0,0,0,0,0]],
    [ns,      'ns',      1e-9,                 0, [0,0,1,0,0,0,0,0]],
    [us,      'us',      1e-6,                 0, [0,0,1,0,0,0,0,0]],
    [d,       'd',       86400,                0, [0,0,1,0,0,0,0,0]],
    [week,    'week',    604800,               0, [0,0,1,0,0,0,0,0]],
    [month,   'month',   2629800,              0, [0,0,1,0,0,0,0,0]],
    [yr,      'yr',      31557600,             0, [0,0,1,0,0,0,0,0]],
    [decade,  'decade',  315576000,            0, [0,0,1,0,0,0,0,0]],
    [century, 'century', 3155760000,           0, [0,0,1,0,0,0,0,0]],
    [plt,     'plt',     5.391247e-44,         0, [0,0,1,0,0,0,0,0]],

    // Temperature (5 units)
    [K,  'K',  1,               0,            [0,0,0,0,1,0,0,0]],
    [C,  'C',  1,               273.15,       [0,0,0,0,1,0,0,0]],
    [F,  'F',  5/9,             255.3722222222222, [0,0,0,0,1,0,0,0]],
    [R,  'R',  5/9,             0,            [0,0,0,0,1,0,0,0]],
    [pT, 'pT', 1.416784e32,    0,            [0,0,0,0,1,0,0,0]],

    // Area (11 units)
    [mm2, 'mm2', 1e-6,                        0, [2,0,0,0,0,0,0,0]],
    [cm2, 'cm2', 1e-4,                        0, [2,0,0,0,0,0,0,0]],
    [m2,  'm2',  1,                            0, [2,0,0,0,0,0,0,0]],
    [ha,  'ha',  10000,                        0, [2,0,0,0,0,0,0,0]],
    [km2, 'km2', 1e6,                          0, [2,0,0,0,0,0,0,0]],
    [in2, 'in2', 6.4516e-4,                    0, [2,0,0,0,0,0,0,0]],
    [ft2, 'ft2', 0.09290304,                   0, [2,0,0,0,0,0,0,0]],
    [yd2, 'yd2', 0.83612736,                   0, [2,0,0,0,0,0,0,0]],
    [ac,  'ac',  4046.8564224,                 0, [2,0,0,0,0,0,0,0]],
    [mi2, 'mi2', 2589988.110336,               0, [2,0,0,0,0,0,0,0]],
    [pla, 'pla', 2.61228e-70,                  0, [2,0,0,0,0,0,0,0]],

    // Volume (12 units)
    [ml,     'ml',     1e-6,                   0, [3,0,0,0,0,0,0,0]],
    [cl,     'cl',     1e-5,                   0, [3,0,0,0,0,0,0,0]],
    [l,      'l',      0.001,                  0, [3,0,0,0,0,0,0,0]],
    [m3,     'm3',     1,                      0, [3,0,0,0,0,0,0,0]],
    [tsp,    'tsp',    4.92892159375e-6,       0, [3,0,0,0,0,0,0,0]],
    [tbsp,   'tbsp',   1.478676478125e-5,      0, [3,0,0,0,0,0,0,0]],
    [floz,   'floz',   2.95735295625e-5,       0, [3,0,0,0,0,0,0,0]],
    [cup,    'cup',    2.365882365e-4,         0, [3,0,0,0,0,0,0,0]],
    [pt_liq, 'pt-liq', 4.73176473e-4,         0, [3,0,0,0,0,0,0,0]],
    [qt,     'qt',     9.46352946e-4,          0, [3,0,0,0,0,0,0,0]],
    [gal,    'gal',    3.785411784e-3,         0, [3,0,0,0,0,0,0,0]],
    [plv,    'plv',    4.22419e-105,           0, [3,0,0,0,0,0,0,0]],

    // Velocity (6 units)
    [mps,  'm/s',  1,            0, [1,0,-1,0,0,0,0,0]],
    [kmh,  'km/h', 5/18,         0, [1,0,-1,0,0,0,0,0]],
    [fps,  'ft/s', 0.3048,       0, [1,0,-1,0,0,0,0,0]],
    [mph,  'mph',  0.44704,      0, [1,0,-1,0,0,0,0,0]],
    [kn,   'kn',   1852/3600,    0, [1,0,-1,0,0,0,0,0]],
    [pvel, 'c',    299792458,    0, [1,0,-1,0,0,0,0,0]],

    // Force (5 units)
    [N,   'N',   1,                  0, [1,1,-2,0,0,0,0,0]],
    [kN,  'kN',  1000,               0, [1,1,-2,0,0,0,0,0]],
    [lbf, 'lbf', 4.4482216152605,    0, [1,1,-2,0,0,0,0,0]],
    [dyn, 'dyn', 1e-5,               0, [1,1,-2,0,0,0,0,0]],
    [pfo, 'pfo', 1.21027e44,         0, [1,1,-2,0,0,0,0,0]],

    // Energy (9 units)
    [J,    'J',    1,                  0, [2,1,-2,0,0,0,0,0]],
    [kJ,   'kJ',   1000,              0, [2,1,-2,0,0,0,0,0]],
    [cal,  'cal',  4.184,             0, [2,1,-2,0,0,0,0,0]],
    [kcal, 'kcal', 4184,              0, [2,1,-2,0,0,0,0,0]],
    [Wh,   'Wh',   3600,              0, [2,1,-2,0,0,0,0,0]],
    [kWh,  'kWh',  3600000,           0, [2,1,-2,0,0,0,0,0]],
    [eV,   'eV',   1.602176634e-19,   0, [2,1,-2,0,0,0,0,0]],
    [BTU,  'BTU',  1055.06,           0, [2,1,-2,0,0,0,0,0]],
    [pene, 'pene', 1.9561e9,          0, [2,1,-2,0,0,0,0,0]],

    // Power (5 units)
    [W,    'W',    1,                  0, [2,1,-3,0,0,0,0,0]],
    [kW,   'kW',   1000,              0, [2,1,-3,0,0,0,0,0]],
    [MW,   'MW',   1e6,               0, [2,1,-3,0,0,0,0,0]],
    [hp,   'hp',   745.69987158227,   0, [2,1,-3,0,0,0,0,0]],
    [ppow, 'ppow', 3.62831e52,        0, [2,1,-3,0,0,0,0,0]],

    // Pressure (7 units)
    [Pa,   'Pa',   1,                  0, [-1,1,-2,0,0,0,0,0]],
    [kPa,  'kPa',  1000,              0, [-1,1,-2,0,0,0,0,0]],
    [bar,  'bar',  100000,            0, [-1,1,-2,0,0,0,0,0]],
    [psi,  'psi',  6894.757293168361, 0, [-1,1,-2,0,0,0,0,0]],
    [atm,  'atm',  101325,            0, [-1,1,-2,0,0,0,0,0]],
    [mmHg, 'mmHg', 133.322387415,     0, [-1,1,-2,0,0,0,0,0]],
    [ppre, 'ppre', 4.63309e113,        0, [-1,1,-2,0,0,0,0,0]],

    // Digital Storage (7 units)
    [b,  'b',  1,                0, [0,0,0,0,0,0,0,1]],
    [B,  'B',  8,                0, [0,0,0,0,0,0,0,1]],
    [KB, 'KB', 8192,             0, [0,0,0,0,0,0,0,1]],
    [MB, 'MB', 8388608,          0, [0,0,0,0,0,0,0,1]],
    [GB, 'GB', 8589934592,       0, [0,0,0,0,0,0,0,1]],
    [TB, 'TB', 8796093022208,    0, [0,0,0,0,0,0,0,1]],
    [PB, 'PB', 9007199254740992, 0, [0,0,0,0,0,0,0,1]],

    // Scalar (1 unit)
    [scalar, 'scalar', 1,        0, [0,0,0,0,0,0,0,0]],
  ];

  it('verifies we have exactly 110 factory entries', () => {
    expect(allFactories.length).toBe(110);
  });

  describe('factory._scale matches factory._label for every unit', () => {
    for (const [factory, expectedLabel, expectedScale, _expectedOffset, _expectedDim] of allFactories) {
      it(`${expectedLabel}: _scale = ${expectedScale}`, () => {
        expect(factory._scale).toBe(expectedScale);
        expect(factory._label).toBe(expectedLabel);
      });
    }
  });

  describe('factory._offset matches expected for every unit', () => {
    for (const [factory, expectedLabel, _expectedScale, expectedOffset, _expectedDim] of allFactories) {
      it(`${expectedLabel}: _offset = ${expectedOffset}`, () => {
        expect(factory._offset).toBe(expectedOffset);
      });
    }
  });

  describe('factory._dim matches expected dimension vector for every unit', () => {
    for (const [factory, expectedLabel, _expectedScale, _expectedOffset, expectedDim] of allFactories) {
      it(`${expectedLabel}: _dim = [${expectedDim}]`, () => {
        expect([...factory._dim]).toEqual([...expectedDim]);
      });
    }
  });

  describe('quantity created by factory carries matching scale, label, and offset', () => {
    for (const [factory, expectedLabel, expectedScale, expectedOffset, _expectedDim] of allFactories) {
      it(`${expectedLabel}(42): _v=42, _s=${expectedScale}, _l="${expectedLabel}", _o=${expectedOffset}`, () => {
        const q = factory(42);
        expect(q._v).toBe(42);
        expect(q._s).toBe(expectedScale);
        expect(q._l).toBe(expectedLabel);
        expect(q._o).toBe(expectedOffset);
      });
    }
  });

  describe('factory created quantity is a plain object with exactly 4 properties', () => {
    it('meter quantity has _v, _s, _l, _o and no extra enumerable keys', () => {
      const q = m(1);
      const keys = Object.keys(q).sort();
      expect(keys).toEqual(['_l', '_o', '_s', '_v']);
    });

    it('celsius quantity (affine) has _v, _s, _l, _o and no extra enumerable keys', () => {
      const q = C(100);
      const keys = Object.keys(q).sort();
      expect(keys).toEqual(['_l', '_o', '_s', '_v']);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 2: STRING COERCION — ADVERSARIAL INPUTS FOR ALL FACTORIES
// ═══════════════════════════════════════════════════════════════════════

describe('string coercion — adversarial inputs via toNum()', () => {
  // We test a representative subset of factories since the toNum path is identical
  const representativeFactories = [
    { name: 'm', fn: m },
    { name: 'km', fn: km },
    { name: 'kg', fn: kg },
    { name: 's', fn: s },
    { name: 'C', fn: C },
    { name: 'F', fn: F },
    { name: 'K', fn: K },
    { name: 'B', fn: B },
    { name: 'Pa', fn: Pa },
    { name: 'scalar', fn: scalar },
    { name: 'pvel', fn: pvel },
    { name: 'pt_liq', fn: pt_liq },
    { name: 'dalton', fn: dalton },
  ];

  describe('valid string inputs that must succeed', () => {
    for (const { name, fn } of representativeFactories) {
      it(`${name}("0") returns 0`, () => {
        expect(valueOf(fn('0'))).toBe(0);
      });

      it(`${name}("-1") returns -1`, () => {
        expect(valueOf(fn('-1'))).toBe(-1);
      });

      it(`${name}("3.14159") returns 3.14159`, () => {
        expect(valueOf(fn('3.14159'))).toBeCloseTo(3.14159);
      });

      it(`${name}("  42  ") (whitespace-padded) returns 42`, () => {
        expect(valueOf(fn('  42  '))).toBe(42);
      });

      it(`${name}("1e10") (scientific notation) returns 1e10`, () => {
        expect(valueOf(fn('1e10'))).toBe(1e10);
      });

      it(`${name}("-2.5e-3") returns -0.0025`, () => {
        expect(valueOf(fn('-2.5e-3'))).toBe(-0.0025);
      });

      it(`${name}("Infinity") returns Infinity`, () => {
        expect(valueOf(fn('Infinity'))).toBe(Infinity);
      });

      it(`${name}("-Infinity") returns -Infinity`, () => {
        expect(valueOf(fn('-Infinity'))).toBe(-Infinity);
      });
    }
  });

  describe('invalid string inputs that must throw TypeError', () => {
    for (const { name, fn } of representativeFactories) {
      it(`${name}("") throws on empty string`, () => {
        expect(() => fn('')).toThrow(TypeError);
      });

      it(`${name}("   ") throws on whitespace-only string`, () => {
        expect(() => fn('   ')).toThrow(TypeError);
      });

      it(`${name}("\\t\\n") throws on tab+newline string`, () => {
        expect(() => fn('\t\n')).toThrow(TypeError);
      });

      it(`${name}("abc") throws on alphabetic string`, () => {
        expect(() => fn('abc')).toThrow(TypeError);
      });

      it(`${name}("NaN") throws (NaN is not valid)`, () => {
        expect(() => fn('NaN')).toThrow(TypeError);
      });

      it(`${name}("5 m") throws on string containing unit suffix`, () => {
        expect(() => fn('5 m')).toThrow(TypeError);
      });

      it(`${name}("5,000") throws on comma-separated number`, () => {
        expect(() => fn('5,000')).toThrow(TypeError);
      });

      it(`${name}("1_000") throws on underscore-separated number`, () => {
        expect(() => fn('1_000')).toThrow(TypeError);
      });

      it(`${name}("$100") throws on currency prefix`, () => {
        expect(() => fn('$100')).toThrow(TypeError);
      });

      it(`${name}("null") throws`, () => {
        expect(() => fn('null')).toThrow(TypeError);
      });

      it(`${name}("undefined") throws`, () => {
        expect(() => fn('undefined')).toThrow(TypeError);
      });

      it(`${name}("true") throws`, () => {
        expect(() => fn('true')).toThrow(TypeError);
      });

      it(`${name}("false") throws`, () => {
        expect(() => fn('false')).toThrow(TypeError);
      });
    }
  });

  describe('numeric edge cases that must be accepted', () => {
    it('m(-0) preserves negative zero', () => {
      const q = m(-0);
      expect(Object.is(valueOf(q), -0)).toBe(true);
    });

    it('m("-0") from string preserves negative zero', () => {
      const q = m('-0');
      expect(Object.is(valueOf(q), -0)).toBe(true);
    });

    it('m(Number.MAX_SAFE_INTEGER) preserves value', () => {
      const q = m(Number.MAX_SAFE_INTEGER);
      expect(valueOf(q)).toBe(9007199254740991);
    });

    it('m(Number.MIN_SAFE_INTEGER) preserves value', () => {
      const q = m(Number.MIN_SAFE_INTEGER);
      expect(valueOf(q)).toBe(-9007199254740991);
    });

    it('m(Number.MAX_VALUE) preserves value', () => {
      expect(valueOf(m(Number.MAX_VALUE))).toBe(Number.MAX_VALUE);
    });

    it('m(Number.MIN_VALUE) preserves value (smallest positive subnormal)', () => {
      expect(valueOf(m(Number.MIN_VALUE))).toBe(5e-324);
    });

    it('m(Number.EPSILON) preserves value', () => {
      expect(valueOf(m(Number.EPSILON))).toBe(Number.EPSILON);
    });

    it('factory accepts Infinity as a number argument', () => {
      expect(valueOf(m(Infinity))).toBe(Infinity);
      expect(valueOf(m(-Infinity))).toBe(-Infinity);
    });

    it('factory accepts NaN as a number argument (no guard)', () => {
      // NaN is a valid number type; toNum only rejects NaN from strings
      expect(Number.isNaN(valueOf(m(NaN)))).toBe(true);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 3: ADDITION AND SUBTRACTION — EXHAUSTIVE EDGE CASES
// ═══════════════════════════════════════════════════════════════════════

describe('add/sub — exhaustive edge cases', () => {
  describe('add preserves offset from the left operand', () => {
    it('add(C(10), C(20)) has _o equal to 273.15 (Celsius offset)', () => {
      const result = add(C(10), C(20));
      expect(result._o).toBe(273.15);
    });

    it('add(F(32), F(180)) has _o equal to F offset', () => {
      const result = add(F(32), F(180));
      expect(result._o).toBe(255.3722222222222);
    });

    it('add(K(100), K(200)) has _o equal to 0 (Kelvin offset)', () => {
      const result = add(K(100), K(200));
      expect(result._o).toBe(0);
    });
  });

  describe('add identity: adding zero does not change the value', () => {
    it('add(m(42), m(0)) = 42', () => {
      expect(valueOf(add(m(42), m(0)))).toBe(42);
    });

    it('add(m(0), m(42)) = 42', () => {
      expect(valueOf(add(m(0), m(42)))).toBe(42);
    });

    it('add(kg(0), kg(0)) = 0', () => {
      expect(valueOf(add(kg(0), kg(0)))).toBe(0);
    });
  });

  describe('add with negative results', () => {
    it('add(m(-5), m(-3)) = -8', () => {
      expect(valueOf(add(m(-5), m(-3)))).toBe(-8);
    });

    it('add(m(5), m(-10)) = -5', () => {
      expect(valueOf(add(m(5), m(-10)))).toBe(-5);
    });
  });

  describe('sub: subtraction from itself yields zero', () => {
    it('sub(m(42), m(42)) = 0', () => {
      expect(valueOf(sub(m(42), m(42)))).toBe(0);
    });

    it('sub(C(100), C(100)) = 0', () => {
      expect(valueOf(sub(C(100), C(100)))).toBe(0);
    });
  });

  describe('sub with negative results', () => {
    it('sub(m(3), m(10)) = -7', () => {
      expect(valueOf(sub(m(3), m(10)))).toBe(-7);
    });

    it('sub(kg(-5), kg(5)) = -10', () => {
      expect(valueOf(sub(kg(-5), kg(5)))).toBe(-10);
    });
  });

  describe('add/sub with Infinity', () => {
    it('add(m(Infinity), m(1)) = Infinity', () => {
      expect(valueOf(add(m(Infinity), m(1)))).toBe(Infinity);
    });

    it('add(m(-Infinity), m(-1)) = -Infinity', () => {
      expect(valueOf(add(m(-Infinity), m(-1)))).toBe(-Infinity);
    });

    it('add(m(Infinity), m(-Infinity)) = NaN', () => {
      expect(Number.isNaN(valueOf(add(m(Infinity), m(-Infinity))))).toBe(true);
    });

    it('sub(m(Infinity), m(Infinity)) = NaN', () => {
      expect(Number.isNaN(valueOf(sub(m(Infinity), m(Infinity))))).toBe(true);
    });
  });

  describe('add/sub with NaN propagation', () => {
    it('add(m(NaN), m(5)) = NaN', () => {
      expect(Number.isNaN(valueOf(add(m(NaN), m(5))))).toBe(true);
    });

    it('sub(m(5), m(NaN)) = NaN', () => {
      expect(Number.isNaN(valueOf(sub(m(5), m(NaN))))).toBe(true);
    });
  });

  describe('add/sub with -0', () => {
    it('add(m(0), m(-0)) = 0 (not -0)', () => {
      // IEEE 754: 0 + (-0) = 0
      expect(valueOf(add(m(0), m(-0)))).toBe(0);
    });

    it('sub(m(0), m(0)) = 0 (not -0)', () => {
      expect(valueOf(sub(m(0), m(0)))).toBe(0);
    });
  });

  describe('add/sub preserves _s and _l from left operand', () => {
    it('add(km(1), km(2)) preserves _s=1000 and _l="km"', () => {
      const result = add(km(1), km(2));
      expect(result._s).toBe(1000);
      expect(result._l).toBe('km');
    });

    it('sub(ft(10), ft(3)) preserves _s=0.3048 and _l="ft"', () => {
      const result = sub(ft(10), ft(3));
      expect(result._s).toBe(0.3048);
      expect(result._l).toBe('ft');
    });
  });

  describe('add/sub does not mutate input quantities', () => {
    it('add does not mutate operands', () => {
      const a = m(10);
      const b = m(20);
      const aValueBefore = a._v;
      const bValueBefore = b._v;
      add(a, b);
      expect(a._v).toBe(aValueBefore);
      expect(b._v).toBe(bValueBefore);
    });

    it('sub does not mutate operands', () => {
      const a = m(10);
      const b = m(3);
      sub(a, b);
      expect(a._v).toBe(10);
      expect(b._v).toBe(3);
    });
  });

  describe('rapid sequential add operations (stress test)', () => {
    it('chaining 1000 additions of m(1) yields m(1000)', () => {
      let result = m(0);
      for (let i = 0; i < 1000; i++) {
        result = add(result, m(1));
      }
      expect(valueOf(result)).toBe(1000);
    });

    it('chaining 1000 subtractions of m(1) from m(1000) yields m(0)', () => {
      let result = m(1000);
      for (let i = 0; i < 1000; i++) {
        result = sub(result, m(1));
      }
      expect(valueOf(result)).toBe(0);
    });
  });

  describe('add/sub with very large and very small numbers', () => {
    it('adding Number.MAX_SAFE_INTEGER + 1 loses precision (expected JS behavior)', () => {
      const result = add(m(Number.MAX_SAFE_INTEGER), m(1));
      // JavaScript loses precision here; the result may not be exactly MAX_SAFE_INTEGER + 1
      expect(valueOf(result)).toBe(Number.MAX_SAFE_INTEGER + 1);
    });

    it('adding two very small floats preserves approximate value', () => {
      const a = m(1e-15);
      const b = m(2e-15);
      expect(valueOf(add(a, b))).toBeCloseTo(3e-15);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 4: MULTIPLICATION AND DIVISION — EXHAUSTIVE EDGE CASES
// ═══════════════════════════════════════════════════════════════════════

describe('mul/div — exhaustive edge cases', () => {
  describe('mul: composed label format', () => {
    it('mul(m(3), m(4)) produces label "m*m"', () => {
      const result = mul(m(3), m(4));
      expect(result._l).toBe('m*m');
    });

    it('mul(kg(1), m(1)) produces label "kg*m"', () => {
      const result = mul(kg(1), m(1));
      expect(result._l).toBe('kg*m');
    });

    it('mul(scalar(2), km(5)) produces label "scalar*km"', () => {
      const result = mul(scalar(2), km(5));
      expect(result._l).toBe('scalar*km');
    });
  });

  describe('div: composed label format', () => {
    it('div(m(10), s(2)) produces label "m/s"', () => {
      const result = div(m(10), s(2));
      expect(result._l).toBe('m/s');
    });

    it('div(kg(100), m(10)) produces label "kg/m"', () => {
      const result = div(kg(100), m(10));
      expect(result._l).toBe('kg/m');
    });
  });

  describe('mul: scale composition', () => {
    it('mul(km(1), km(1))._s = 1000 * 1000 = 1e6', () => {
      const result = mul(km(1), km(1));
      expect(result._s).toBe(1e6);
    });

    it('mul(m(1), s(1))._s = 1 * 1 = 1', () => {
      const result = mul(m(1), s(1));
      expect(result._s).toBe(1);
    });

    it('mul(cm(1), cm(1))._s = 0.01 * 0.01 = 0.0001', () => {
      const result = mul(cm(1), cm(1));
      expect(result._s).toBeCloseTo(0.0001);
    });
  });

  describe('div: scale composition', () => {
    it('div(km(1), h(1))._s = 1000 / 3600', () => {
      const result = div(km(1), h(1));
      expect(result._s).toBeCloseTo(1000 / 3600);
    });

    it('div(m(1), s(1))._s = 1 / 1 = 1', () => {
      const result = div(m(1), s(1));
      expect(result._s).toBe(1);
    });
  });

  describe('mul: offset is always 0 in result', () => {
    it('mul(K(100), scalar(2))._o = 0', () => {
      const result = mul(K(100), scalar(2));
      expect(result._o).toBe(0);
    });

    it('mul(scalar(2), R(100))._o = 0', () => {
      const result = mul(scalar(2), R(100));
      expect(result._o).toBe(0);
    });
  });

  describe('div: offset is always 0 in result', () => {
    it('div(K(100), scalar(2))._o = 0', () => {
      const result = div(K(100), scalar(2));
      expect(result._o).toBe(0);
    });
  });

  describe('mul: identity with scalar(1)', () => {
    it('mul(scalar(1), m(42)) = 42 (value preserved)', () => {
      expect(valueOf(mul(scalar(1), m(42)))).toBe(42);
    });

    it('mul(m(42), scalar(1)) = 42 (commutative identity)', () => {
      expect(valueOf(mul(m(42), scalar(1)))).toBe(42);
    });
  });

  describe('mul: zero', () => {
    it('mul(scalar(0), m(42)) = 0', () => {
      expect(valueOf(mul(scalar(0), m(42)))).toBe(0);
    });

    it('mul(m(42), scalar(0)) = 0', () => {
      expect(valueOf(mul(m(42), scalar(0)))).toBe(0);
    });
  });

  describe('div: division by zero', () => {
    it('div(m(10), s(0)) = Infinity', () => {
      expect(valueOf(div(m(10), s(0)))).toBe(Infinity);
    });

    it('div(m(-10), s(0)) = -Infinity', () => {
      expect(valueOf(div(m(-10), s(0)))).toBe(-Infinity);
    });

    it('div(m(0), s(0)) = NaN', () => {
      expect(Number.isNaN(valueOf(div(m(0), s(0))))).toBe(true);
    });
  });

  describe('mul/div: Infinity propagation', () => {
    it('mul(m(Infinity), s(2)) = Infinity', () => {
      expect(valueOf(mul(m(Infinity), s(2)))).toBe(Infinity);
    });

    it('mul(m(Infinity), s(0)) = NaN', () => {
      expect(Number.isNaN(valueOf(mul(m(Infinity), s(0))))).toBe(true);
    });

    it('div(m(Infinity), s(Infinity)) = NaN', () => {
      expect(Number.isNaN(valueOf(div(m(Infinity), s(Infinity))))).toBe(true);
    });
  });

  describe('mul/div: NaN propagation', () => {
    it('mul(m(NaN), s(5)) = NaN', () => {
      expect(Number.isNaN(valueOf(mul(m(NaN), s(5))))).toBe(true);
    });

    it('div(m(NaN), s(5)) = NaN', () => {
      expect(Number.isNaN(valueOf(div(m(NaN), s(5))))).toBe(true);
    });
  });

  describe('mul/div: reject ALL affine-offset units (C and F)', () => {
    // Celsius
    it('mul(C(100), scalar(2)) throws TypeError', () => {
      expect(() => mul(C(100), scalar(2))).toThrow(TypeError);
    });

    it('mul(scalar(2), C(100)) throws TypeError', () => {
      expect(() => mul(scalar(2), C(100))).toThrow(TypeError);
    });

    it('mul(C(0), C(0)) throws TypeError', () => {
      expect(() => mul(C(0), C(0))).toThrow(TypeError);
    });

    it('div(C(100), scalar(2)) throws TypeError', () => {
      expect(() => div(C(100), scalar(2))).toThrow(TypeError);
    });

    it('div(scalar(200), C(100)) throws TypeError', () => {
      expect(() => div(scalar(200), C(100))).toThrow(TypeError);
    });

    it('div(C(100), C(50)) throws TypeError', () => {
      expect(() => div(C(100), C(50))).toThrow(TypeError);
    });

    // Fahrenheit
    it('mul(F(212), scalar(2)) throws TypeError', () => {
      expect(() => mul(F(212), scalar(2))).toThrow(TypeError);
    });

    it('mul(scalar(2), F(212)) throws TypeError', () => {
      expect(() => mul(scalar(2), F(212))).toThrow(TypeError);
    });

    it('div(F(212), scalar(2)) throws TypeError', () => {
      expect(() => div(F(212), scalar(2))).toThrow(TypeError);
    });

    it('div(scalar(424), F(212)) throws TypeError', () => {
      expect(() => div(scalar(424), F(212))).toThrow(TypeError);
    });

    // Cross: C with F
    it('mul(C(100), F(212)) throws TypeError (both offsets non-zero)', () => {
      expect(() => mul(C(100) as any, F(212) as any)).toThrow(TypeError);
    });

    it('div(C(100), F(212)) throws TypeError (both offsets non-zero)', () => {
      expect(() => div(C(100) as any, F(212) as any)).toThrow(TypeError);
    });

    // Error message quality check
    it('mul error message mentions convert to absolute unit', () => {
      try {
        mul(scalar(2), C(100));
        expect.unreachable('should have thrown');
      } catch (e: any) {
        expect(e.message).toMatch(/convert to an absolute unit/i);
        expect(e.message).toContain('C');
      }
    });

    it('div error message mentions both labels', () => {
      try {
        div(F(212), scalar(2));
        expect.unreachable('should have thrown');
      } catch (e: any) {
        expect(e.message).toContain('F');
      }
    });
  });

  describe('mul/div: Kelvin and Rankine work (zero offset)', () => {
    it('mul(K(273.15), scalar(2)) = 546.3', () => {
      expect(valueOf(mul(K(273.15), scalar(2)))).toBeCloseTo(546.3);
    });

    it('div(K(546.3), scalar(2)) = 273.15', () => {
      expect(valueOf(div(K(546.3), scalar(2)))).toBeCloseTo(273.15);
    });

    it('mul(R(491.67), scalar(0.5)) = 245.835', () => {
      expect(valueOf(mul(R(491.67), scalar(0.5)))).toBeCloseTo(245.835);
    });

    it('div(R(491.67), scalar(2)) = 245.835', () => {
      expect(valueOf(div(R(491.67), scalar(2)))).toBeCloseTo(245.835);
    });

    it('mul(pT(1), scalar(3)) = 3', () => {
      expect(valueOf(mul(pT(1), scalar(3)))).toBe(3);
    });
  });

  describe('mul/div: does not mutate input quantities', () => {
    it('mul does not mutate operands', () => {
      const a = m(10);
      const b = s(5);
      mul(a, b);
      expect(a._v).toBe(10);
      expect(b._v).toBe(5);
    });

    it('div does not mutate operands', () => {
      const a = m(100);
      const b = s(10);
      div(a, b);
      expect(a._v).toBe(100);
      expect(b._v).toBe(10);
    });
  });

  describe('mul: associativity of scalar multiplication', () => {
    it('mul(mul(scalar(2), scalar(3)), m(5)) = mul(scalar(2), mul(scalar(3), m(5)))', () => {
      const left = mul(mul(scalar(2), scalar(3)), m(5));
      const right = mul(scalar(2), mul(scalar(3), m(5)));
      expect(valueOf(left)).toBe(valueOf(right));
      expect(valueOf(left)).toBe(30);
    });
  });

  describe('mul/div: chaining produces correct multi-composed labels', () => {
    it('mul(mul(m(1), m(1)), m(1)) produces label "m*m*m"', () => {
      const result = mul(mul(m(1), m(1)), m(1));
      expect(result._l).toBe('m*m*m');
    });

    it('div(div(m(1), s(1)), s(1)) produces label "m/s/s"', () => {
      const result = div(div(m(1), s(1)), s(1));
      expect(result._l).toBe('m/s/s');
    });
  });

  describe('rapid sequential multiplications (stress test)', () => {
    it('multiplying scalar(2) ten times yields 1024', () => {
      let result = scalar(1);
      for (let i = 0; i < 10; i++) {
        result = mul(result, scalar(2));
      }
      expect(valueOf(result)).toBe(1024);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 5: FORMAT — EDGE CASES
// ═══════════════════════════════════════════════════════════════════════

describe('format — edge cases', () => {
  it('formats zero as "0 m"', () => {
    expect(format(m(0))).toBe('0 m');
  });

  it('formats negative zero as "0 m" (String(-0) = "0")', () => {
    expect(format(m(-0))).toBe('0 m');
  });

  it('formats Infinity as "Infinity m"', () => {
    expect(format(m(Infinity))).toBe('Infinity m');
  });

  it('formats -Infinity as "-Infinity m"', () => {
    expect(format(m(-Infinity))).toBe('-Infinity m');
  });

  it('formats NaN as "NaN m"', () => {
    expect(format(m(NaN))).toBe('NaN m');
  });

  it('formats very small number correctly', () => {
    expect(format(m(1e-20))).toBe('1e-20 m');
  });

  it('formats very large number correctly', () => {
    expect(format(m(1e20))).toBe('100000000000000000000 m');
  });

  it('format with precision=0 rounds to integer', () => {
    expect(format(m(3.7), { precision: 0 })).toBe('4 m');
  });

  it('format with precision=10 pads with zeros', () => {
    expect(format(m(1), { precision: 10 })).toBe('1.0000000000 m');
  });

  it('format with precision=2 on negative value', () => {
    expect(format(m(-3.14159), { precision: 2 })).toBe('-3.14 m');
  });

  it('format composed labels from mul', () => {
    expect(format(mul(m(3), m(4)))).toBe('12 m*m');
  });

  it('format composed labels from div', () => {
    expect(format(div(m(10), s(2)))).toBe('5 m/s');
  });

  it('format with special unit labels', () => {
    expect(format(pt_liq(2))).toBe('2 pt-liq');
    expect(format(dalton(1))).toBe('1 Da');
    expect(format(pvel(1))).toBe('1 c');
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 6: VALUEOF — EDGE CASES
// ═══════════════════════════════════════════════════════════════════════

describe('valueOf — edge cases', () => {
  it('always returns a number type', () => {
    expect(typeof valueOf(m(42))).toBe('number');
    expect(typeof valueOf(m(NaN))).toBe('number');
    expect(typeof valueOf(m(Infinity))).toBe('number');
  });

  it('returns exact value, not SI-converted value', () => {
    const q = km(1.5);
    expect(valueOf(q)).toBe(1.5);
    // Not 1500 (which would be the SI value in meters)
    expect(valueOf(q)).not.toBe(1500);
  });

  it('valueOf on result of add returns sum of operand values', () => {
    expect(valueOf(add(km(1), km(2)))).toBe(3);
    // Not 3000 (which would be km_value1 + km_value2 in meters)
  });

  it('valueOf on result of mul returns product of operand values', () => {
    expect(valueOf(mul(m(3), m(4)))).toBe(12);
  });

  it('valueOf on result of div returns quotient of operand values', () => {
    expect(valueOf(div(m(10), s(2)))).toBe(5);
  });
});
