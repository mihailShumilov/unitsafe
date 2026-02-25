/**
 * PARANOIC ACCEPTANCE TESTS — LENGTH DIMENSION
 *
 * Units under test (17 total):
 *   m, km, cm, mm, nm, um, dm, inch (label 'in'), ft, yd, mi, nmi, mil, au, ly, pc, pl
 *
 * Coverage strategy:
 *   - Factory creation (numeric + string) for every unit
 *   - Conversion to/from SI base (m) for every unit
 *   - Roundtrip conversions (unit -> m -> unit)
 *   - Cross-unit conversions (inch/ft/yd/mi chain, metric prefix chain)
 *   - add/sub within each unit
 *   - format output for every unit
 *   - Real-world reference values (marathon, light-year, parsec, etc.)
 *   - Boundary: zero, negative, very large, very small values
 *   - String input edge cases
 */

import { describe, it, expect } from 'vitest';
import {
  m, km, cm, mm, nm, um, dm, inch, ft, yd, mi, nmi, mil, au, ly, pc, pl,
  add, sub, mul, div, to, valueOf, format, scalar,
} from '../../src/index.js';

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

/** Conversion formula: result = (value * scale + offset - targetOffset) / targetScale */
function conv(value: number, srcScale: number, tgtScale: number): number {
  return (value * srcScale) / tgtScale;
}

// ---------------------------------------------------------------------------
// SECTION A — Factory creation (numeric + string) for every unit
// ---------------------------------------------------------------------------

describe('Length — Factory creation', () => {
  const factories = [
    { name: 'm', fn: m, label: 'm' },
    { name: 'km', fn: km, label: 'km' },
    { name: 'cm', fn: cm, label: 'cm' },
    { name: 'mm', fn: mm, label: 'mm' },
    { name: 'nm', fn: nm, label: 'nm' },
    { name: 'um', fn: um, label: 'um' },
    { name: 'dm', fn: dm, label: 'dm' },
    { name: 'inch', fn: inch, label: 'in' },
    { name: 'ft', fn: ft, label: 'ft' },
    { name: 'yd', fn: yd, label: 'yd' },
    { name: 'mi', fn: mi, label: 'mi' },
    { name: 'nmi', fn: nmi, label: 'nmi' },
    { name: 'mil', fn: mil, label: 'mil' },
    { name: 'au', fn: au, label: 'au' },
    { name: 'ly', fn: ly, label: 'ly' },
    { name: 'pc', fn: pc, label: 'pc' },
    { name: 'pl', fn: pl, label: 'pl' },
  ] as const;

  for (const { name, fn, label } of factories) {
    it(`${name}(42) creates quantity with value 42 and label "${label}"`, () => {
      const q = fn(42);
      expect(valueOf(q)).toBe(42);
      expect(q._l).toBe(label);
      expect(q._o).toBe(0);
    });

    it(`${name}("3.14") creates quantity from string`, () => {
      const q = fn('3.14');
      expect(valueOf(q)).toBeCloseTo(3.14);
    });

    it(`${name}(0) handles zero`, () => {
      expect(valueOf(fn(0))).toBe(0);
    });

    it(`${name}(-7.5) handles negative values`, () => {
      expect(valueOf(fn(-7.5))).toBe(-7.5);
    });
  }

  it('all length factories share dimension [1,0,0,0,0,0,0,0]', () => {
    for (const { fn } of factories) {
      expect(fn._dim).toEqual([1, 0, 0, 0, 0, 0, 0, 0]);
    }
  });
});

// ---------------------------------------------------------------------------
// SECTION B — Every unit converts to m and back (roundtrip)
// ---------------------------------------------------------------------------

describe('Length — Conversion to SI (m) and roundtrip', () => {
  const units = [
    { name: 'km',   fn: km,   scale: 1000,                    testVal: 2.5 },
    { name: 'cm',   fn: cm,   scale: 0.01,                    testVal: 175 },
    { name: 'mm',   fn: mm,   scale: 0.001,                   testVal: 2500 },
    { name: 'nm',   fn: nm,   scale: 1e-9,                    testVal: 632.8 },
    { name: 'um',   fn: um,   scale: 1e-6,                    testVal: 10.5 },
    { name: 'dm',   fn: dm,   scale: 0.1,                     testVal: 15 },
    { name: 'inch', fn: inch, scale: 0.0254,                  testVal: 12 },
    { name: 'ft',   fn: ft,   scale: 0.3048,                  testVal: 6 },
    { name: 'yd',   fn: yd,   scale: 0.9144,                  testVal: 100 },
    { name: 'mi',   fn: mi,   scale: 1609.344,                testVal: 1 },
    { name: 'nmi',  fn: nmi,  scale: 1852,                    testVal: 1 },
    { name: 'mil',  fn: mil,  scale: 2.54e-5,                 testVal: 1000 },
    { name: 'au',   fn: au,   scale: 1.495978707e11,          testVal: 1 },
    { name: 'ly',   fn: ly,   scale: 9.4607304725808e15,      testVal: 1 },
    { name: 'pc',   fn: pc,   scale: 3.0856775814913673e16,   testVal: 1 },
    { name: 'pl',   fn: pl,   scale: 1.616255e-35,            testVal: 1 },
  ];

  for (const { name, fn, scale, testVal } of units) {
    it(`${name}(${testVal}) -> m gives ${testVal} * ${scale}`, () => {
      const result = valueOf(to(m, fn(testVal)));
      const expected = testVal * scale;
      if (Math.abs(expected) > 1e10 || Math.abs(expected) < 1e-10) {
        expect(result).toBeCloseTo(expected, -Math.floor(Math.log10(Math.abs(expected))) + 6);
      } else {
        expect(result).toBeCloseTo(expected, 6);
      }
    });

    it(`roundtrip: ${name} -> m -> ${name} preserves value within precision`, () => {
      const original = fn(testVal);
      const inMeters = to(m, original);
      const backToUnit = to(fn, inMeters);
      expect(valueOf(backToUnit)).toBeCloseTo(testVal, 8);
    });
  }

  it('m -> m is identity', () => {
    expect(valueOf(to(m, m(42.195)))).toBe(42.195);
  });
});

// ---------------------------------------------------------------------------
// SECTION C — Metric prefix chain conversions
// ---------------------------------------------------------------------------

describe('Length — Metric prefix chain (nm -> um -> mm -> cm -> dm -> m -> km)', () => {
  it('1000 nm = 1 um', () => {
    expect(valueOf(to(um, nm(1000)))).toBeCloseTo(1, 8);
  });

  it('1000 um = 1 mm', () => {
    expect(valueOf(to(mm, um(1000)))).toBeCloseTo(1, 8);
  });

  it('10 mm = 1 cm', () => {
    expect(valueOf(to(cm, mm(10)))).toBeCloseTo(1, 8);
  });

  it('10 cm = 1 dm', () => {
    expect(valueOf(to(dm, cm(10)))).toBeCloseTo(1, 8);
  });

  it('10 dm = 1 m', () => {
    expect(valueOf(to(m, dm(10)))).toBeCloseTo(1, 8);
  });

  it('1000 m = 1 km', () => {
    expect(valueOf(to(km, m(1000)))).toBe(1);
  });

  it('full chain: 1e12 nm = 1 km', () => {
    expect(valueOf(to(km, nm(1e12)))).toBeCloseTo(1, 4);
  });
});

// ---------------------------------------------------------------------------
// SECTION D — Imperial/US chain conversions
// ---------------------------------------------------------------------------

describe('Length — Imperial chain (mil -> inch -> ft -> yd -> mi)', () => {
  it('1000 mil = 1 inch', () => {
    expect(valueOf(to(inch, mil(1000)))).toBeCloseTo(1, 6);
  });

  it('12 inches = 1 foot', () => {
    expect(valueOf(to(ft, inch(12)))).toBeCloseTo(1, 8);
  });

  it('3 feet = 1 yard', () => {
    expect(valueOf(to(yd, ft(3)))).toBeCloseTo(1, 8);
  });

  it('1760 yards = 1 mile', () => {
    expect(valueOf(to(mi, yd(1760)))).toBeCloseTo(1, 6);
  });

  it('5280 feet = 1 mile', () => {
    expect(valueOf(to(mi, ft(5280)))).toBeCloseTo(1, 6);
  });

  it('63360 inches = 1 mile', () => {
    expect(valueOf(to(mi, inch(63360)))).toBeCloseTo(1, 4);
  });

  it('1 yard = 36 inches', () => {
    expect(valueOf(to(inch, yd(1)))).toBeCloseTo(36, 6);
  });

  it('1 mile = 5280 feet', () => {
    expect(valueOf(to(ft, mi(1)))).toBeCloseTo(5280, 4);
  });
});

// ---------------------------------------------------------------------------
// SECTION E — Cross-system conversions (metric <-> imperial)
// ---------------------------------------------------------------------------

describe('Length — Cross-system conversions', () => {
  it('1 inch = 2.54 cm (exact by definition)', () => {
    expect(valueOf(to(cm, inch(1)))).toBeCloseTo(2.54, 8);
  });

  it('1 foot = 30.48 cm (exact by definition)', () => {
    expect(valueOf(to(cm, ft(1)))).toBeCloseTo(30.48, 8);
  });

  it('1 yard = 0.9144 m (exact by definition)', () => {
    expect(valueOf(to(m, yd(1)))).toBeCloseTo(0.9144, 8);
  });

  it('1 mile = 1.609344 km (exact by definition)', () => {
    expect(valueOf(to(km, mi(1)))).toBeCloseTo(1.609344, 6);
  });

  it('1 meter = 39.3701 inches', () => {
    expect(valueOf(to(inch, m(1)))).toBeCloseTo(39.3700787, 4);
  });

  it('1 km = 0.621371 miles', () => {
    expect(valueOf(to(mi, km(1)))).toBeCloseTo(0.621371, 4);
  });

  it('1 nmi = 1.852 km', () => {
    expect(valueOf(to(km, nmi(1)))).toBeCloseTo(1.852, 6);
  });

  it('1 nmi = 6076.115 feet', () => {
    expect(valueOf(to(ft, nmi(1)))).toBeCloseTo(6076.115, 0);
  });
});

// ---------------------------------------------------------------------------
// SECTION F — Astronomical and Planck conversions
// ---------------------------------------------------------------------------

describe('Length — Astronomical and Planck units', () => {
  it('1 au = 149,597,870.7 km', () => {
    expect(valueOf(to(km, au(1)))).toBeCloseTo(149597870.7, -1);
  });

  it('1 ly = 9.4607e15 m', () => {
    const result = valueOf(to(m, ly(1)));
    expect(result).toBeCloseTo(9.4607304725808e15, -9);
  });

  it('1 pc = 3.0857e16 m', () => {
    const result = valueOf(to(m, pc(1)));
    expect(result).toBeCloseTo(3.0856775814913673e16, -9);
  });

  it('1 pc approx 3.2616 ly', () => {
    const result = valueOf(to(ly, pc(1)));
    expect(result).toBeCloseTo(3.2616, 3);
  });

  it('1 ly approx 63241 au', () => {
    const result = valueOf(to(au, ly(1)));
    expect(result).toBeCloseTo(63241, -1);
  });

  it('1 au = 499.005 light-seconds => au in m / speed of light', () => {
    // au in meters / speed of light = ~499 seconds
    const auInMeters = valueOf(to(m, au(1)));
    expect(auInMeters / 299792458).toBeCloseTo(499.005, 0);
  });

  it('Planck length is extremely small: 1 pl = 1.616255e-35 m', () => {
    expect(valueOf(to(m, pl(1)))).toBeCloseTo(1.616255e-35, 40);
  });

  it('roundtrip: 1 pc -> ly -> pc preserves value', () => {
    const inLy = to(ly, pc(1));
    const backToPc = to(pc, inLy);
    expect(valueOf(backToPc)).toBeCloseTo(1, 8);
  });
});

// ---------------------------------------------------------------------------
// SECTION G — add/sub for every unit
// ---------------------------------------------------------------------------

describe('Length — Arithmetic (add/sub)', () => {
  it('add: m(100) + m(42.195) = m(142.195)', () => {
    expect(valueOf(add(m(100), m(42.195)))).toBeCloseTo(142.195);
  });

  it('sub: km(10) - km(3.5) = km(6.5)', () => {
    expect(valueOf(sub(km(10), km(3.5)))).toBeCloseTo(6.5);
  });

  it('add: cm(50) + cm(125) = cm(175)', () => {
    expect(valueOf(add(cm(50), cm(125)))).toBe(175);
  });

  it('add: mm(500) + mm(1500) = mm(2000)', () => {
    expect(valueOf(add(mm(500), mm(1500)))).toBe(2000);
  });

  it('add: nm(100) + nm(532.8) = nm(632.8)', () => {
    expect(valueOf(add(nm(100), nm(532.8)))).toBeCloseTo(632.8);
  });

  it('sub: um(50) - um(10.5) = um(39.5)', () => {
    expect(valueOf(sub(um(50), um(10.5)))).toBeCloseTo(39.5);
  });

  it('add: dm(10) + dm(5) = dm(15)', () => {
    expect(valueOf(add(dm(10), dm(5)))).toBe(15);
  });

  it('add: inch(6) + inch(6) = inch(12)', () => {
    expect(valueOf(add(inch(6), inch(6)))).toBe(12);
  });

  it('add: ft(3) + ft(4) = ft(7)', () => {
    expect(valueOf(add(ft(3), ft(4)))).toBe(7);
  });

  it('sub: yd(100) - yd(40) = yd(60)', () => {
    expect(valueOf(sub(yd(100), yd(40)))).toBe(60);
  });

  it('add: mi(13.1) + mi(13.1) = mi(26.2)', () => {
    expect(valueOf(add(mi(13.1), mi(13.1)))).toBeCloseTo(26.2);
  });

  it('add: nmi(5) + nmi(3) = nmi(8)', () => {
    expect(valueOf(add(nmi(5), nmi(3)))).toBe(8);
  });

  it('add: mil(500) + mil(500) = mil(1000)', () => {
    expect(valueOf(add(mil(500), mil(500)))).toBe(1000);
  });

  it('sub: au(2) - au(1) = au(1)', () => {
    expect(valueOf(sub(au(2), au(1)))).toBe(1);
  });

  it('add: ly(4.24) + ly(0.03) = ly(4.27) (Proxima + offset)', () => {
    expect(valueOf(add(ly(4.24), ly(0.03)))).toBeCloseTo(4.27);
  });

  it('sub: pc(1) - pc(0.5) = pc(0.5)', () => {
    expect(valueOf(sub(pc(1), pc(0.5)))).toBeCloseTo(0.5);
  });

  it('sub: pl(100) - pl(1) = pl(99)', () => {
    expect(valueOf(sub(pl(100), pl(1)))).toBe(99);
  });
});

// ---------------------------------------------------------------------------
// SECTION H — format for every unit
// ---------------------------------------------------------------------------

describe('Length — format()', () => {
  it('format(m(42.195)) = "42.195 m"', () => {
    expect(format(m(42.195))).toBe('42.195 m');
  });

  it('format(km(1.5)) = "1.5 km"', () => {
    expect(format(km(1.5))).toBe('1.5 km');
  });

  it('format(cm(175)) = "175 cm"', () => {
    expect(format(cm(175))).toBe('175 cm');
  });

  it('format(mm(2.5)) = "2.5 mm"', () => {
    expect(format(mm(2.5))).toBe('2.5 mm');
  });

  it('format(nm(632.8)) = "632.8 nm"', () => {
    expect(format(nm(632.8))).toBe('632.8 nm');
  });

  it('format(um(10)) = "10 um"', () => {
    expect(format(um(10))).toBe('10 um');
  });

  it('format(dm(5)) = "5 dm"', () => {
    expect(format(dm(5))).toBe('5 dm');
  });

  it('format(inch(12)) = "12 in"', () => {
    expect(format(inch(12))).toBe('12 in');
  });

  it('format(ft(6)) = "6 ft"', () => {
    expect(format(ft(6))).toBe('6 ft');
  });

  it('format(yd(100)) = "100 yd"', () => {
    expect(format(yd(100))).toBe('100 yd');
  });

  it('format(mi(26.2)) = "26.2 mi"', () => {
    expect(format(mi(26.2))).toBe('26.2 mi');
  });

  it('format(nmi(1)) = "1 nmi"', () => {
    expect(format(nmi(1))).toBe('1 nmi');
  });

  it('format(mil(500)) = "500 mil"', () => {
    expect(format(mil(500))).toBe('500 mil');
  });

  it('format(au(1)) = "1 au"', () => {
    expect(format(au(1))).toBe('1 au');
  });

  it('format(ly(4.24)) = "4.24 ly"', () => {
    expect(format(ly(4.24))).toBe('4.24 ly');
  });

  it('format(pc(3.086)) = "3.086 pc"', () => {
    expect(format(pc(3.086))).toBe('3.086 pc');
  });

  it('format(pl(1)) = "1 pl"', () => {
    expect(format(pl(1))).toBe('1 pl');
  });

  it('format with precision rounds correctly', () => {
    expect(format(m(3.14159), { precision: 2 })).toBe('3.14 m');
    expect(format(km(1.23456), { precision: 3 })).toBe('1.235 km');
    expect(format(mi(26.21875), { precision: 1 })).toBe('26.2 mi');
  });
});

// ---------------------------------------------------------------------------
// SECTION I — Real-world reference values
// ---------------------------------------------------------------------------

describe('Length — Real-world reference values', () => {
  it('marathon distance: 42.195 km = 26.2188 mi', () => {
    const result = valueOf(to(mi, km(42.195)));
    expect(result).toBeCloseTo(26.2188, 2);
  });

  it('marathon distance: 26.2 mi in km is approximately 42.165 km', () => {
    const result = valueOf(to(km, mi(26.2)));
    expect(result).toBeCloseTo(42.165, 0);
  });

  it('human height: 5 ft 10 in = 177.8 cm', () => {
    const totalInches = add(to(inch, ft(5)), inch(10));
    const inCm = to(cm, totalInches);
    expect(valueOf(inCm)).toBeCloseTo(177.8, 1);
  });

  it('1 light-year = approximately 9.461 trillion km', () => {
    const result = valueOf(to(km, ly(1)));
    expect(result).toBeCloseTo(9.4607304725808e12, -5);
  });

  it('Proxima Centauri: 4.24 light-years in parsecs', () => {
    const result = valueOf(to(pc, ly(4.24)));
    expect(result).toBeCloseTo(1.3, 1);
  });

  it('1 parsec = approximately 3.2616 light-years', () => {
    expect(valueOf(to(ly, pc(1)))).toBeCloseTo(3.2616, 3);
  });

  it('1 inch = exactly 2.54 cm', () => {
    expect(valueOf(to(cm, inch(1)))).toBeCloseTo(2.54, 10);
  });

  it('1 mile = exactly 1.609344 km', () => {
    expect(valueOf(to(km, mi(1)))).toBeCloseTo(1.609344, 6);
  });

  it('nautical mile relationship: 1 nmi = 1852 m exactly', () => {
    expect(valueOf(to(m, nmi(1)))).toBe(1852);
  });

  it('speed of light travels 1 AU in ~499 seconds', () => {
    const auInMeters = valueOf(to(m, au(1)));
    const lightSeconds = auInMeters / 299792458;
    expect(lightSeconds).toBeCloseTo(499.005, 0);
  });

  it('Earth-Sun distance: 1 AU = ~149.6 million km', () => {
    const result = valueOf(to(km, au(1)));
    expect(result / 1e6).toBeCloseTo(149.598, 0);
  });

  it('wavelength of red laser: 632.8 nm = 0.0006328 mm', () => {
    expect(valueOf(to(mm, nm(632.8)))).toBeCloseTo(0.0006328, 7);
  });

  it('human hair: ~75 um = 0.075 mm', () => {
    expect(valueOf(to(mm, um(75)))).toBeCloseTo(0.075, 6);
  });
});

// ---------------------------------------------------------------------------
// SECTION J — Boundary and edge cases
// ---------------------------------------------------------------------------

describe('Length — Boundary and edge cases', () => {
  it('zero meters converts to zero in any unit', () => {
    expect(valueOf(to(km, m(0)))).toBe(0);
    expect(valueOf(to(mi, m(0)))).toBe(0);
    expect(valueOf(to(ly, m(0)))).toBe(0);
  });

  it('negative distances convert correctly', () => {
    expect(valueOf(to(m, km(-1)))).toBe(-1000);
    expect(valueOf(to(ft, inch(-12)))).toBeCloseTo(-1, 8);
  });

  it('Infinity propagates through conversion', () => {
    expect(valueOf(to(m, km(Infinity)))).toBe(Infinity);
    expect(valueOf(to(km, m(-Infinity)))).toBe(-Infinity);
  });

  it('very large value: 1e20 m in km', () => {
    expect(valueOf(to(km, m(1e20)))).toBeCloseTo(1e17, -10);
  });

  it('very small value: 1e-20 m in nm', () => {
    expect(valueOf(to(nm, m(1e-20)))).toBeCloseTo(1e-11, 15);
  });

  it('mul: m(3) * m(4) = 12 m*m', () => {
    const area = mul(m(3), m(4));
    expect(valueOf(area)).toBe(12);
    expect(area._l).toBe('m*m');
  });

  it('div: m(100) / scalar(4) = 25 m', () => {
    const result = div(m(100), scalar(4));
    expect(valueOf(result)).toBe(25);
  });

  it('string input with whitespace: m("  100  ") works', () => {
    expect(valueOf(m('  100  '))).toBe(100);
  });

  it('string input scientific notation: km("1.5e3") = 1500', () => {
    expect(valueOf(km('1.5e3'))).toBe(1500);
  });

  it('string input throws TypeError on non-numeric: m("abc")', () => {
    expect(() => m('abc')).toThrow(TypeError);
  });

  it('string input throws TypeError on empty: ft("")', () => {
    expect(() => ft('')).toThrow(TypeError);
  });

  it('string input throws TypeError on whitespace-only: km("   ")', () => {
    expect(() => km('   ')).toThrow(TypeError);
  });
});

// ---------------------------------------------------------------------------
// SECTION K — Scale factor metadata verification
// ---------------------------------------------------------------------------

describe('Length — Scale factor metadata', () => {
  it('m._scale = 1 (SI base)', () => expect(m._scale).toBe(1));
  it('km._scale = 1000', () => expect(km._scale).toBe(1000));
  it('cm._scale = 0.01', () => expect(cm._scale).toBe(0.01));
  it('mm._scale = 0.001', () => expect(mm._scale).toBe(0.001));
  it('nm._scale = 1e-9', () => expect(nm._scale).toBe(1e-9));
  it('um._scale = 1e-6', () => expect(um._scale).toBe(1e-6));
  it('dm._scale = 0.1', () => expect(dm._scale).toBe(0.1));
  it('inch._scale = 0.0254', () => expect(inch._scale).toBe(0.0254));
  it('ft._scale = 0.3048', () => expect(ft._scale).toBe(0.3048));
  it('yd._scale = 0.9144', () => expect(yd._scale).toBe(0.9144));
  it('mi._scale = 1609.344', () => expect(mi._scale).toBe(1609.344));
  it('nmi._scale = 1852', () => expect(nmi._scale).toBe(1852));
  it('mil._scale = 2.54e-5', () => expect(mil._scale).toBe(2.54e-5));
  it('au._scale = 1.495978707e11', () => expect(au._scale).toBe(1.495978707e11));
  it('ly._scale = 9.4607304725808e15', () => expect(ly._scale).toBe(9.4607304725808e15));
  it('pc._scale = 3.0856775814913673e16', () => expect(pc._scale).toBe(3.0856775814913673e16));
  it('pl._scale = 1.616255e-35', () => expect(pl._scale).toBe(1.616255e-35));
  it('all length offsets are 0', () => {
    const all = [m, km, cm, mm, nm, um, dm, inch, ft, yd, mi, nmi, mil, au, ly, pc, pl];
    for (const f of all) {
      expect(f._offset).toBe(0);
    }
  });
});
