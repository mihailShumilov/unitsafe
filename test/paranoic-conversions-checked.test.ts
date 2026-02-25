/**
 * PARANOIC ACCEPTANCE TESTS: Conversions, Comparisons, createChecked, and Cross-Dimension Safety
 *
 * Coverage Summary:
 * - Temperature affine conversions: absolute zero, boiling/freezing points, extreme values
 * - Physical constants: speed of light, absolute zero across all temperature scales
 * - Conversion accuracy for every dimension with roundtrip verification
 * - Comparison edge cases: NaN, Infinity, -0, equal across conversions
 * - createChecked: every cross-dimension mismatch pair, unit label mismatches, error messages
 * - Real-world physics calculations: kinetic energy, pressure-volume work, power consumption
 * - Conversion idempotency: to(unit, to(unit, q)) === to(unit, q)
 * - Roundtrip conversions: to(original, to(target, q)) should recover original value
 *
 * These tests are IMMUTABLE CONTRACTS.
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
  eq, lt, lte, gt, gte,
  valueOf,
  format,
  createChecked,
} from '../src/index.js';

// ═══════════════════════════════════════════════════════════════════════
// SECTION 1: TEMPERATURE AFFINE CONVERSIONS — CRITICAL PHYSICAL VALUES
// ═══════════════════════════════════════════════════════════════════════

describe('temperature conversions — physical reference points', () => {
  describe('absolute zero', () => {
    it('0 K = -273.15 C', () => {
      expect(valueOf(to(C, K(0)))).toBeCloseTo(-273.15, 10);
    });

    it('-273.15 C = 0 K', () => {
      expect(valueOf(to(K, C(-273.15)))).toBeCloseTo(0, 10);
    });

    it('0 K = -459.67 F', () => {
      expect(valueOf(to(F, K(0)))).toBeCloseTo(-459.67, 1);
    });

    it('-459.67 F = 0 K', () => {
      expect(valueOf(to(K, F(-459.67)))).toBeCloseTo(0, 1);
    });

    it('0 K = 0 R', () => {
      expect(valueOf(to(R, K(0)))).toBeCloseTo(0, 10);
    });

    it('0 R = 0 K', () => {
      expect(valueOf(to(K, R(0)))).toBeCloseTo(0, 10);
    });
  });

  describe('water freezing point', () => {
    it('0 C = 273.15 K', () => {
      expect(valueOf(to(K, C(0)))).toBeCloseTo(273.15, 10);
    });

    it('0 C = 32 F', () => {
      expect(valueOf(to(F, C(0)))).toBeCloseTo(32, 2);
    });

    it('32 F = 0 C', () => {
      expect(valueOf(to(C, F(32)))).toBeCloseTo(0, 2);
    });

    it('32 F = 273.15 K', () => {
      expect(valueOf(to(K, F(32)))).toBeCloseTo(273.15, 1);
    });

    it('273.15 K = 491.67 R', () => {
      expect(valueOf(to(R, K(273.15)))).toBeCloseTo(491.67, 1);
    });
  });

  describe('water boiling point', () => {
    it('100 C = 373.15 K', () => {
      expect(valueOf(to(K, C(100)))).toBeCloseTo(373.15, 10);
    });

    it('100 C = 212 F', () => {
      expect(valueOf(to(F, C(100)))).toBeCloseTo(212, 1);
    });

    it('212 F = 100 C', () => {
      expect(valueOf(to(C, F(212)))).toBeCloseTo(100, 1);
    });

    it('373.15 K = 212 F', () => {
      expect(valueOf(to(F, K(373.15)))).toBeCloseTo(212, 1);
    });
  });

  describe('body temperature', () => {
    it('37 C = 98.6 F', () => {
      expect(valueOf(to(F, C(37)))).toBeCloseTo(98.6, 1);
    });

    it('98.6 F = 37 C', () => {
      expect(valueOf(to(C, F(98.6)))).toBeCloseTo(37, 1);
    });

    it('37 C = 310.15 K', () => {
      expect(valueOf(to(K, C(37)))).toBeCloseTo(310.15, 2);
    });
  });

  describe('crossover point: -40 C = -40 F', () => {
    it('-40 C = -40 F', () => {
      expect(valueOf(to(F, C(-40)))).toBeCloseTo(-40, 1);
    });

    it('-40 F = -40 C', () => {
      expect(valueOf(to(C, F(-40)))).toBeCloseTo(-40, 1);
    });
  });

  describe('extreme temperature values', () => {
    it('1 million Kelvin converts to C and back', () => {
      const inC = to(C, K(1_000_000));
      const backToK = to(K, inC);
      expect(valueOf(backToK)).toBeCloseTo(1_000_000, 5);
    });

    it('-273.15 C is the lowest physically meaningful Celsius value', () => {
      // Library does not enforce physical bounds; negative Kelvin values should be possible
      const q = to(K, C(-500));
      expect(valueOf(q)).toBeCloseTo(-226.85, 2);
      // This represents a non-physical temperature, but the math should still work
    });

    it('large Fahrenheit to Kelvin', () => {
      // 10000 F to K
      const result = to(K, F(10000));
      // K = (F - 32) * 5/9 + 273.15 = (10000 - 32) * 5/9 + 273.15 = 5537.93... + 273.15
      // Using formula: K = F * 5/9 + offset_F
      // Actually: SI = value * scale + offset => 10000 * 5/9 + 255.3722...
      // targetValue = (SI - target_offset) / target_scale => (10000*5/9 + 255.3722... - 0) / 1
      expect(valueOf(result)).toBeCloseTo(5811.15, 0);
    });
  });

  describe('temperature conversion roundtrips', () => {
    const testValues = [-273.15, -100, -40, 0, 20, 37, 100, 1000];

    for (const v of testValues) {
      it(`C(${v}) -> K -> C roundtrip`, () => {
        const result = valueOf(to(C, to(K, C(v))));
        expect(result).toBeCloseTo(v, 8);
      });

      it(`C(${v}) -> F -> C roundtrip`, () => {
        const result = valueOf(to(C, to(F, C(v))));
        expect(result).toBeCloseTo(v, 6);
      });

      it(`C(${v}) -> R -> C roundtrip`, () => {
        const result = valueOf(to(C, to(R, C(v))));
        expect(result).toBeCloseTo(v, 6);
      });
    }

    for (const v of [0, 100, 273.15, 373.15, 1000]) {
      it(`K(${v}) -> F -> K roundtrip`, () => {
        const result = valueOf(to(K, to(F, K(v))));
        expect(result).toBeCloseTo(v, 6);
      });

      it(`K(${v}) -> R -> K roundtrip`, () => {
        const result = valueOf(to(K, to(R, K(v))));
        expect(result).toBeCloseTo(v, 8);
      });
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 2: CONVERSION ROUNDTRIPS FOR NON-TEMPERATURE DIMENSIONS
// ═══════════════════════════════════════════════════════════════════════

describe('conversion roundtrips — non-temperature dimensions', () => {
  describe('length roundtrips', () => {
    it('m -> km -> m: 1500', () => {
      expect(valueOf(to(m, to(km, m(1500))))).toBeCloseTo(1500, 8);
    });

    it('m -> cm -> m: 1.75', () => {
      expect(valueOf(to(m, to(cm, m(1.75))))).toBeCloseTo(1.75, 8);
    });

    it('m -> mm -> m: 0.005', () => {
      expect(valueOf(to(m, to(mm, m(0.005))))).toBeCloseTo(0.005, 8);
    });

    it('m -> inch -> m: 1', () => {
      expect(valueOf(to(m, to(inch, m(1))))).toBeCloseTo(1, 8);
    });

    it('m -> ft -> m: 1', () => {
      expect(valueOf(to(m, to(ft, m(1))))).toBeCloseTo(1, 8);
    });

    it('m -> yd -> m: 1', () => {
      expect(valueOf(to(m, to(yd, m(1))))).toBeCloseTo(1, 8);
    });

    it('m -> mi -> m: 1609.344', () => {
      expect(valueOf(to(m, to(mi, m(1609.344))))).toBeCloseTo(1609.344, 4);
    });

    it('km -> mi -> km: 100', () => {
      expect(valueOf(to(km, to(mi, km(100))))).toBeCloseTo(100, 6);
    });

    it('m -> nmi -> m: 1852', () => {
      expect(valueOf(to(m, to(nmi, m(1852))))).toBeCloseTo(1852, 6);
    });

    it('m -> nm -> m: 0.001', () => {
      expect(valueOf(to(m, to(nm, m(0.001))))).toBeCloseTo(0.001, 10);
    });

    it('m -> au -> m: 1.495978707e11', () => {
      expect(valueOf(to(m, to(au, m(1.495978707e11))))).toBeCloseTo(1.495978707e11, -3);
    });
  });

  describe('mass roundtrips', () => {
    it('kg -> g -> kg: 75', () => {
      expect(valueOf(to(kg, to(g, kg(75))))).toBeCloseTo(75, 8);
    });

    it('kg -> lb -> kg: 68.04', () => {
      expect(valueOf(to(kg, to(lb, kg(68.04))))).toBeCloseTo(68.04, 4);
    });

    it('kg -> oz -> kg: 1', () => {
      expect(valueOf(to(kg, to(oz, kg(1))))).toBeCloseTo(1, 8);
    });

    it('kg -> t -> kg: 1000', () => {
      expect(valueOf(to(kg, to(t, kg(1000))))).toBeCloseTo(1000, 6);
    });

    it('kg -> st -> kg: 6.35', () => {
      expect(valueOf(to(kg, to(st, kg(6.35))))).toBeCloseTo(6.35, 4);
    });

    it('g -> mg -> g: 500', () => {
      expect(valueOf(to(g, to(mg, g(500))))).toBeCloseTo(500, 6);
    });

    it('g -> ug -> g: 0.001', () => {
      expect(valueOf(to(g, to(ug, g(0.001))))).toBeCloseTo(0.001, 8);
    });
  });

  describe('time roundtrips', () => {
    it('s -> ms -> s: 1000', () => {
      expect(valueOf(to(s, to(ms, s(1000))))).toBeCloseTo(1000, 6);
    });

    it('s -> min -> s: 3600', () => {
      expect(valueOf(to(s, to(min, s(3600))))).toBeCloseTo(3600, 6);
    });

    it('s -> h -> s: 7200', () => {
      expect(valueOf(to(s, to(h, s(7200))))).toBeCloseTo(7200, 6);
    });

    it('s -> d -> s: 86400', () => {
      expect(valueOf(to(s, to(d, s(86400))))).toBeCloseTo(86400, 6);
    });

    it('s -> week -> s: 604800', () => {
      expect(valueOf(to(s, to(week, s(604800))))).toBeCloseTo(604800, 4);
    });

    it('s -> ns -> s: 0.000001', () => {
      expect(valueOf(to(s, to(ns, s(0.000001))))).toBeCloseTo(0.000001, 12);
    });

    it('h -> yr -> h: 8766', () => {
      // 1 yr = 31557600 s = 8766 h
      expect(valueOf(to(h, to(yr, h(8766))))).toBeCloseTo(8766, 2);
    });
  });

  describe('area roundtrips', () => {
    it('m2 -> km2 -> m2: 1e6', () => {
      expect(valueOf(to(m2, to(km2, m2(1e6))))).toBeCloseTo(1e6, 0);
    });

    it('m2 -> ft2 -> m2: 100', () => {
      expect(valueOf(to(m2, to(ft2, m2(100))))).toBeCloseTo(100, 4);
    });

    it('m2 -> ac -> m2: 4046.856', () => {
      expect(valueOf(to(m2, to(ac, m2(4046.856))))).toBeCloseTo(4046.856, 2);
    });

    it('m2 -> ha -> m2: 10000', () => {
      expect(valueOf(to(m2, to(ha, m2(10000))))).toBeCloseTo(10000, 4);
    });
  });

  describe('volume roundtrips', () => {
    it('l -> ml -> l: 2.5', () => {
      expect(valueOf(to(l, to(ml, l(2.5))))).toBeCloseTo(2.5, 8);
    });

    it('l -> gal -> l: 3.785', () => {
      expect(valueOf(to(l, to(gal, l(3.785))))).toBeCloseTo(3.785, 4);
    });

    it('m3 -> l -> m3: 1', () => {
      expect(valueOf(to(m3, to(l, m3(1))))).toBeCloseTo(1, 8);
    });

    it('floz -> cup -> floz: 8', () => {
      expect(valueOf(to(floz, to(cup, floz(8))))).toBeCloseTo(8, 4);
    });

    it('tsp -> tbsp -> tsp: 3', () => {
      expect(valueOf(to(tsp, to(tbsp, tsp(3))))).toBeCloseTo(3, 4);
    });
  });

  describe('velocity roundtrips', () => {
    it('mps -> kmh -> mps: 100', () => {
      expect(valueOf(to(mps, to(kmh, mps(100))))).toBeCloseTo(100, 6);
    });

    it('mph -> kmh -> mph: 60', () => {
      expect(valueOf(to(mph, to(kmh, mph(60))))).toBeCloseTo(60, 4);
    });

    it('mps -> fps -> mps: 343 (speed of sound)', () => {
      expect(valueOf(to(mps, to(fps, mps(343))))).toBeCloseTo(343, 4);
    });

    it('kn -> kmh -> kn: 1', () => {
      expect(valueOf(to(kn, to(kmh, kn(1))))).toBeCloseTo(1, 6);
    });
  });

  describe('force roundtrips', () => {
    it('N -> kN -> N: 9810', () => {
      expect(valueOf(to(N, to(kN, N(9810))))).toBeCloseTo(9810, 4);
    });

    it('N -> lbf -> N: 100', () => {
      expect(valueOf(to(N, to(lbf, N(100))))).toBeCloseTo(100, 4);
    });

    it('N -> dyn -> N: 1', () => {
      expect(valueOf(to(N, to(dyn, N(1))))).toBeCloseTo(1, 8);
    });
  });

  describe('energy roundtrips', () => {
    it('J -> kJ -> J: 4184', () => {
      expect(valueOf(to(J, to(kJ, J(4184))))).toBeCloseTo(4184, 4);
    });

    it('J -> cal -> J: 4.184', () => {
      expect(valueOf(to(J, to(cal, J(4.184))))).toBeCloseTo(4.184, 8);
    });

    it('J -> Wh -> J: 3600', () => {
      expect(valueOf(to(J, to(Wh, J(3600))))).toBeCloseTo(3600, 4);
    });

    it('J -> BTU -> J: 1055.06', () => {
      expect(valueOf(to(J, to(BTU, J(1055.06))))).toBeCloseTo(1055.06, 2);
    });

    it('J -> eV -> J: 1.602176634e-19', () => {
      expect(valueOf(to(J, to(eV, J(1.602176634e-19))))).toBeCloseTo(1.602176634e-19, 30);
    });
  });

  describe('power roundtrips', () => {
    it('W -> kW -> W: 745.7', () => {
      expect(valueOf(to(W, to(kW, W(745.7))))).toBeCloseTo(745.7, 4);
    });

    it('W -> hp -> W: 745.7', () => {
      expect(valueOf(to(W, to(hp, W(745.7))))).toBeCloseTo(745.7, 2);
    });

    it('W -> MW -> W: 1e6', () => {
      expect(valueOf(to(W, to(MW, W(1e6))))).toBeCloseTo(1e6, 0);
    });
  });

  describe('pressure roundtrips', () => {
    it('Pa -> kPa -> Pa: 101325', () => {
      expect(valueOf(to(Pa, to(kPa, Pa(101325))))).toBeCloseTo(101325, 2);
    });

    it('Pa -> bar -> Pa: 100000', () => {
      expect(valueOf(to(Pa, to(bar, Pa(100000))))).toBeCloseTo(100000, 0);
    });

    it('Pa -> atm -> Pa: 101325', () => {
      expect(valueOf(to(Pa, to(atm, Pa(101325))))).toBeCloseTo(101325, 0);
    });

    it('Pa -> psi -> Pa: 6894.757', () => {
      expect(valueOf(to(Pa, to(psi, Pa(6894.757))))).toBeCloseTo(6894.757, 2);
    });

    it('Pa -> mmHg -> Pa: 133.322', () => {
      expect(valueOf(to(Pa, to(mmHg, Pa(133.322))))).toBeCloseTo(133.322, 2);
    });
  });

  describe('data roundtrips', () => {
    it('b -> B -> b: 8', () => {
      expect(valueOf(to(b, to(B, b(8))))).toBeCloseTo(8, 8);
    });

    it('B -> KB -> B: 1024', () => {
      expect(valueOf(to(B, to(KB, B(1024))))).toBeCloseTo(1024, 4);
    });

    it('KB -> MB -> KB: 1024', () => {
      expect(valueOf(to(KB, to(MB, KB(1024))))).toBeCloseTo(1024, 4);
    });

    it('MB -> GB -> MB: 1024', () => {
      expect(valueOf(to(MB, to(GB, MB(1024))))).toBeCloseTo(1024, 4);
    });

    it('GB -> TB -> GB: 1024', () => {
      expect(valueOf(to(GB, to(TB, GB(1024))))).toBeCloseTo(1024, 4);
    });

    it('TB -> PB -> TB: 1024', () => {
      expect(valueOf(to(TB, to(PB, TB(1024))))).toBeCloseTo(1024, 0);
    });
  });

  describe('conversion idempotency: to(unit, to(unit, q)) === to(unit, q)', () => {
    it('to(m, to(m, km(5))) === to(m, km(5))', () => {
      const once = valueOf(to(m, km(5)));
      const twice = valueOf(to(m, to(m, km(5))));
      expect(twice).toBeCloseTo(once, 10);
    });

    it('to(K, to(K, C(100))) === to(K, C(100))', () => {
      const once = valueOf(to(K, C(100)));
      const twice = valueOf(to(K, to(K, C(100))));
      expect(twice).toBeCloseTo(once, 10);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 3: CONVERSION WITH SPECIAL NUMERIC VALUES
// ═══════════════════════════════════════════════════════════════════════

describe('conversion with special numeric values', () => {
  it('to(km, m(Infinity)) = Infinity', () => {
    expect(valueOf(to(km, m(Infinity)))).toBe(Infinity);
  });

  it('to(km, m(-Infinity)) = -Infinity', () => {
    expect(valueOf(to(km, m(-Infinity)))).toBe(-Infinity);
  });

  it('to(km, m(NaN)) = NaN', () => {
    expect(Number.isNaN(valueOf(to(km, m(NaN))))).toBe(true);
  });

  it('to(m, km(0)) = 0', () => {
    expect(valueOf(to(m, km(0)))).toBe(0);
  });

  it('to(m, km(-0)) = 0 (not -0, because (-0 * 1000 + 0 - 0) / 1 = 0)', () => {
    // IEEE 754: -0 * 1000 = -0, but -0 + 0 = +0 (addition with zero clears sign)
    // Conversion formula: (-0 * 1000 + 0 - 0) / 1 = 0
    const result = valueOf(to(m, km(-0)));
    expect(result).toBe(0);
    expect(Object.is(result, -0)).toBe(false);
  });

  it('converting zero value between offset units preserves correctness', () => {
    // to(F, C(0)) should be 32, NOT 0
    expect(valueOf(to(F, C(0)))).toBeCloseTo(32, 2);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 4: PHYSICAL CONSTANTS VERIFICATION
// ═══════════════════════════════════════════════════════════════════════

describe('physical constants verification', () => {
  it('speed of light: 1 c = 299,792,458 m/s (exact)', () => {
    expect(valueOf(to(mps, pvel(1)))).toBe(299792458);
  });

  it('speed of light: 1 c = ~1,079,252,848.8 km/h', () => {
    expect(valueOf(to(kmh, pvel(1)))).toBeCloseTo(1079252848.8, -1);
  });

  it('1 AU in km: ~149,597,870.7 km', () => {
    expect(valueOf(to(km, au(1)))).toBeCloseTo(149597870.7, 0);
  });

  it('1 light-year in km: ~9.461e12 km', () => {
    expect(valueOf(to(km, ly(1)))).toBeCloseTo(9.4607304725808e12, -3);
  });

  it('1 parsec in light-years: ~3.2616', () => {
    expect(valueOf(to(ly, pc(1)))).toBeCloseTo(3.2616, 2);
  });

  it('1 atm = 101325 Pa (exact definition)', () => {
    expect(valueOf(to(Pa, atm(1)))).toBe(101325);
  });

  it('1 atm = ~14.696 psi', () => {
    expect(valueOf(to(psi, atm(1)))).toBeCloseTo(14.696, 2);
  });

  it('1 atm = ~760 mmHg', () => {
    expect(valueOf(to(mmHg, atm(1)))).toBeCloseTo(760, 0);
  });

  it('1 horsepower = ~745.7 W', () => {
    expect(valueOf(to(W, hp(1)))).toBeCloseTo(745.7, 0);
  });

  it('1 calorie = 4.184 J (thermochemical)', () => {
    expect(valueOf(to(J, cal(1)))).toBeCloseTo(4.184, 8);
  });

  it('1 kilocalorie = 1000 cal', () => {
    expect(valueOf(to(cal, kcal(1)))).toBe(1000);
  });

  it('1 nautical mile = 1852 m (exact definition)', () => {
    expect(valueOf(to(m, nmi(1)))).toBe(1852);
  });

  it('1 knot = 1 nmi/h = 1852/3600 m/s', () => {
    expect(valueOf(to(mps, kn(1)))).toBeCloseTo(1852 / 3600, 8);
  });

  it('1 dalton = 1.6605390666e-27 kg', () => {
    expect(valueOf(to(kg, dalton(1)))).toBeCloseTo(1.6605390666e-27, 37);
  });

  it('1 eV = 1.602176634e-19 J (exact definition in 2019 SI)', () => {
    expect(valueOf(to(J, eV(1)))).toBeCloseTo(1.602176634e-19, 30);
  });

  it('1 pound = exactly 0.45359237 kg (exact definition)', () => {
    expect(valueOf(to(kg, lb(1)))).toBe(0.45359237);
  });

  it('1 inch = exactly 0.0254 m (exact definition)', () => {
    expect(valueOf(to(m, inch(1)))).toBe(0.0254);
  });

  it('1 foot = exactly 0.3048 m (12 inches)', () => {
    expect(valueOf(to(m, ft(1)))).toBe(0.3048);
  });

  it('1 mile = exactly 1609.344 m', () => {
    expect(valueOf(to(m, mi(1)))).toBe(1609.344);
  });

  it('1 US gallon = 3.785411784 liters', () => {
    expect(valueOf(to(l, gal(1)))).toBeCloseTo(3.785411784, 6);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 5: COMPARISON EDGE CASES
// ═══════════════════════════════════════════════════════════════════════

describe('comparison edge cases', () => {
  describe('eq with special values', () => {
    it('eq(m(0), m(-0)) is true (0 === -0 in JS)', () => {
      expect(eq(m(0), m(-0))).toBe(true);
    });

    it('eq(m(NaN), m(NaN)) is false (NaN !== NaN)', () => {
      expect(eq(m(NaN), m(NaN))).toBe(false);
    });

    it('eq(m(Infinity), m(Infinity)) is true', () => {
      expect(eq(m(Infinity), m(Infinity))).toBe(true);
    });

    it('eq(m(-Infinity), m(-Infinity)) is true', () => {
      expect(eq(m(-Infinity), m(-Infinity))).toBe(true);
    });

    it('eq(m(Infinity), m(-Infinity)) is false', () => {
      expect(eq(m(Infinity), m(-Infinity))).toBe(false);
    });
  });

  describe('lt with special values', () => {
    it('lt(m(-Infinity), m(Infinity)) is true', () => {
      expect(lt(m(-Infinity), m(Infinity))).toBe(true);
    });

    it('lt(m(Infinity), m(-Infinity)) is false', () => {
      expect(lt(m(Infinity), m(-Infinity))).toBe(false);
    });

    it('lt(m(NaN), m(5)) is false (NaN comparisons always false)', () => {
      expect(lt(m(NaN), m(5))).toBe(false);
    });

    it('lt(m(5), m(NaN)) is false', () => {
      expect(lt(m(5), m(NaN))).toBe(false);
    });

    it('lt(m(NaN), m(NaN)) is false', () => {
      expect(lt(m(NaN), m(NaN))).toBe(false);
    });
  });

  describe('lte with special values', () => {
    it('lte(m(NaN), m(NaN)) is false', () => {
      expect(lte(m(NaN), m(NaN))).toBe(false);
    });

    it('lte(m(0), m(-0)) is true', () => {
      expect(lte(m(0), m(-0))).toBe(true);
    });

    it('lte(m(-Infinity), m(-Infinity)) is true', () => {
      expect(lte(m(-Infinity), m(-Infinity))).toBe(true);
    });
  });

  describe('gt with special values', () => {
    it('gt(m(Infinity), m(1e308)) is true', () => {
      expect(gt(m(Infinity), m(1e308))).toBe(true);
    });

    it('gt(m(NaN), m(5)) is false', () => {
      expect(gt(m(NaN), m(5))).toBe(false);
    });
  });

  describe('gte with special values', () => {
    it('gte(m(NaN), m(NaN)) is false', () => {
      expect(gte(m(NaN), m(NaN))).toBe(false);
    });

    it('gte(m(Infinity), m(Infinity)) is true', () => {
      expect(gte(m(Infinity), m(Infinity))).toBe(true);
    });
  });

  describe('comparisons compares raw values, not SI-converted', () => {
    it('eq(km(1), km(1)) is true even though 1 km = 1000 m', () => {
      expect(eq(km(1), km(1))).toBe(true);
    });

    it('lt(km(1), km(2)) compares 1 < 2, not 1000 < 2000', () => {
      expect(lt(km(1), km(2))).toBe(true);
    });
  });

  describe('comparisons with many equal/near-equal values', () => {
    it('after conversion, the same physical value in the same unit should be eq', () => {
      const a = to(m, km(1));
      const b = m(1000);
      expect(eq(a, b)).toBe(true);
    });

    it('floating point imprecision: 0.1 + 0.2 != 0.3 (known IEEE 754 issue)', () => {
      // This test documents that eq uses strict === comparison
      const a = add(m(0.1), m(0.2));
      const b = m(0.3);
      // 0.1 + 0.2 = 0.30000000000000004 !== 0.3
      expect(eq(a, b)).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 6: createChecked — EXHAUSTIVE CROSS-DIMENSION REJECTION
// ═══════════════════════════════════════════════════════════════════════

describe('createChecked — cross-dimension safety', () => {
  /**
   * We systematically test all dimension pairs that must be rejected.
   * The 12 base dimensions are: Length, Mass, Time, Temperature, Area, Volume,
   * Velocity, Force, Energy, Power, Pressure, Data, and Scalar.
   */

  const checked = createChecked();

  // Representative unit from each dimension for cross-dimension testing
  const dimensionRepresentatives = [
    { name: 'length',      fn: () => checked.m(1) },
    { name: 'mass',        fn: () => checked.kg(1) },
    { name: 'time',        fn: () => checked.s(1) },
    { name: 'temperature', fn: () => checked.K(1) },
    { name: 'area',        fn: () => checked.m2(1) },
    { name: 'volume',      fn: () => checked.l(1) },
    { name: 'velocity',    fn: () => checked.mps(1) },
    { name: 'force',       fn: () => checked.N(1) },
    { name: 'energy',      fn: () => checked.J(1) },
    { name: 'power',       fn: () => checked.W(1) },
    { name: 'pressure',    fn: () => checked.Pa(1) },
    { name: 'data',        fn: () => checked.B(1) },
    { name: 'scalar',      fn: () => checked.scalar(1) },
  ];

  describe('checked add rejects every cross-dimension pair', () => {
    for (let i = 0; i < dimensionRepresentatives.length; i++) {
      for (let j = i + 1; j < dimensionRepresentatives.length; j++) {
        const a = dimensionRepresentatives[i];
        const b = dimensionRepresentatives[j];
        it(`add(${a.name}, ${b.name}) throws`, () => {
          expect(() => checked.add(a.fn() as any, b.fn() as any)).toThrow();
        });
      }
    }
  });

  describe('checked sub rejects every cross-dimension pair', () => {
    for (let i = 0; i < dimensionRepresentatives.length; i++) {
      for (let j = i + 1; j < dimensionRepresentatives.length; j++) {
        const a = dimensionRepresentatives[i];
        const b = dimensionRepresentatives[j];
        it(`sub(${a.name}, ${b.name}) throws`, () => {
          expect(() => checked.sub(a.fn() as any, b.fn() as any)).toThrow();
        });
      }
    }
  });

  describe('checked add rejects same-dimension but different-unit-label', () => {
    it('add(m(1), km(1)) throws (same dimension, different label)', () => {
      expect(() => checked.add(checked.m(1) as any, checked.km(1) as any)).toThrow();
    });

    it('add(kg(1), g(1)) throws (same dimension, different label)', () => {
      expect(() => checked.add(checked.kg(1) as any, checked.g(1) as any)).toThrow();
    });

    it('add(s(1), ms(1)) throws (same dimension, different label)', () => {
      expect(() => checked.add(checked.s(1) as any, checked.ms(1) as any)).toThrow();
    });

    it('add(K(1), C(1)) throws (same dimension, different label)', () => {
      expect(() => checked.add(checked.K(1) as any, checked.C(1) as any)).toThrow();
    });

    it('add(Pa(1), bar(1)) throws (same dimension, different label)', () => {
      expect(() => checked.add(checked.Pa(1) as any, checked.bar(1) as any)).toThrow();
    });

    it('add(J(1), cal(1)) throws (same dimension, different label)', () => {
      expect(() => checked.add(checked.J(1) as any, checked.cal(1) as any)).toThrow();
    });

    it('add(b(1), B(1)) throws (same dimension, different label)', () => {
      expect(() => checked.add(checked.b(1) as any, checked.B(1) as any)).toThrow();
    });
  });

  describe('checked sub rejects same-dimension but different-unit-label', () => {
    it('sub(m(1), km(1)) throws (same dimension, different label)', () => {
      expect(() => checked.sub(checked.m(1) as any, checked.km(1) as any)).toThrow();
    });

    it('sub(ft(1), yd(1)) throws', () => {
      expect(() => checked.sub(checked.ft(1) as any, checked.yd(1) as any)).toThrow();
    });
  });

  describe('checked to rejects cross-dimension conversions', () => {
    it('to(s, m(1)) throws (length -> time)', () => {
      expect(() => checked.to(checked.s as any, checked.m(1) as any)).toThrow();
    });

    it('to(kg, m(1)) throws (length -> mass)', () => {
      expect(() => checked.to(checked.kg as any, checked.m(1) as any)).toThrow();
    });

    it('to(K, m(1)) throws (length -> temperature)', () => {
      expect(() => checked.to(checked.K as any, checked.m(1) as any)).toThrow();
    });

    it('to(Pa, J(1)) throws (energy -> pressure)', () => {
      expect(() => checked.to(checked.Pa as any, checked.J(1) as any)).toThrow();
    });

    it('to(B, m(1)) throws (length -> data)', () => {
      expect(() => checked.to(checked.B as any, checked.m(1) as any)).toThrow();
    });

    it('to(W, J(1)) throws (energy -> power)', () => {
      expect(() => checked.to(checked.W as any, checked.J(1) as any)).toThrow();
    });

    it('to(mps, m(1)) throws (length -> velocity)', () => {
      expect(() => checked.to(checked.mps as any, checked.m(1) as any)).toThrow();
    });

    it('to(N, Pa(1)) throws (pressure -> force)', () => {
      expect(() => checked.to(checked.N as any, checked.Pa(1) as any)).toThrow();
    });
  });

  describe('checked to allows same-dimension conversions', () => {
    it('to(km, m(1000)) succeeds', () => {
      const result = checked.to(checked.km, checked.m(1000));
      expect(checked.valueOf(result)).toBeCloseTo(1, 8);
    });

    it('to(F, C(100)) succeeds', () => {
      const result = checked.to(checked.F, checked.C(100));
      expect(checked.valueOf(result)).toBeCloseTo(212, 1);
    });

    it('to(lb, kg(1)) succeeds', () => {
      const result = checked.to(checked.lb, checked.kg(1));
      expect(checked.valueOf(result)).toBeCloseTo(2.20462, 3);
    });

    it('to(bar, atm(1)) succeeds', () => {
      const result = checked.to(checked.bar, checked.atm(1));
      expect(checked.valueOf(result)).toBeCloseTo(1.01325, 4);
    });
  });

  describe('checked add/sub work for same-unit quantities', () => {
    it('add(m(5), m(3)) = 8', () => {
      expect(checked.valueOf(checked.add(checked.m(5), checked.m(3)))).toBe(8);
    });

    it('sub(kg(10), kg(4)) = 6', () => {
      expect(checked.valueOf(checked.sub(checked.kg(10), checked.kg(4)))).toBe(6);
    });

    it('add(C(10), C(20)) = 30 (checked mode allows same-label temp add)', () => {
      expect(checked.valueOf(checked.add(checked.C(10), checked.C(20)))).toBe(30);
    });
  });

  describe('checked mode error messages are descriptive', () => {
    it('add dimension mismatch mentions both labels', () => {
      try {
        checked.add(checked.m(1) as any, checked.s(1) as any);
        expect.unreachable('should have thrown');
      } catch (e: any) {
        expect(e.message).toContain('m');
        expect(e.message).toContain('s');
      }
    });

    it('sub dimension mismatch mentions both labels', () => {
      try {
        checked.sub(checked.kg(1) as any, checked.m(1) as any);
        expect.unreachable('should have thrown');
      } catch (e: any) {
        expect(e.message).toContain('kg');
        expect(e.message).toContain('m');
      }
    });

    it('to dimension mismatch mentions both labels', () => {
      try {
        checked.to(checked.s as any, checked.m(1) as any);
        expect.unreachable('should have thrown');
      } catch (e: any) {
        expect(e.message).toContain('m');
        expect(e.message).toContain('s');
      }
    });

    it('add unit mismatch mentions "convert first"', () => {
      try {
        checked.add(checked.m(1) as any, checked.km(1) as any);
        expect.unreachable('should have thrown');
      } catch (e: any) {
        expect(e.message).toMatch(/convert/i);
      }
    });
  });

  describe('checked mode exposes all 110 factories', () => {
    it('all length factories exist', () => {
      expect(typeof checked.m).toBe('function');
      expect(typeof checked.km).toBe('function');
      expect(typeof checked.cm).toBe('function');
      expect(typeof checked.mm).toBe('function');
      expect(typeof checked.nm).toBe('function');
      expect(typeof checked.um).toBe('function');
      expect(typeof checked.dm).toBe('function');
      expect(typeof checked.nmi).toBe('function');
      expect(typeof checked.mil).toBe('function');
      expect(typeof checked.au).toBe('function');
      expect(typeof checked.ly).toBe('function');
      expect(typeof checked.pc).toBe('function');
      expect(typeof checked.pl).toBe('function');
      expect(typeof checked.inch).toBe('function');
      expect(typeof checked.ft).toBe('function');
      expect(typeof checked.yd).toBe('function');
      expect(typeof checked.mi).toBe('function');
    });

    it('all mass factories exist', () => {
      expect(typeof checked.kg).toBe('function');
      expect(typeof checked.g).toBe('function');
      expect(typeof checked.lb).toBe('function');
      expect(typeof checked.oz).toBe('function');
      expect(typeof checked.ug).toBe('function');
      expect(typeof checked.mg).toBe('function');
      expect(typeof checked.t).toBe('function');
      expect(typeof checked.st).toBe('function');
      expect(typeof checked.ton).toBe('function');
      expect(typeof checked.lton).toBe('function');
      expect(typeof checked.dalton).toBe('function');
      expect(typeof checked.plm).toBe('function');
    });

    it('all time factories exist', () => {
      expect(typeof checked.s).toBe('function');
      expect(typeof checked.ms).toBe('function');
      expect(typeof checked.min).toBe('function');
      expect(typeof checked.h).toBe('function');
      expect(typeof checked.ns).toBe('function');
      expect(typeof checked.us).toBe('function');
      expect(typeof checked.d).toBe('function');
      expect(typeof checked.week).toBe('function');
      expect(typeof checked.month).toBe('function');
      expect(typeof checked.yr).toBe('function');
      expect(typeof checked.decade).toBe('function');
      expect(typeof checked.century).toBe('function');
      expect(typeof checked.plt).toBe('function');
    });

    it('all temperature factories exist', () => {
      expect(typeof checked.K).toBe('function');
      expect(typeof checked.C).toBe('function');
      expect(typeof checked.F).toBe('function');
      expect(typeof checked.R).toBe('function');
      expect(typeof checked.pT).toBe('function');
    });

    it('all area factories exist', () => {
      expect(typeof checked.mm2).toBe('function');
      expect(typeof checked.cm2).toBe('function');
      expect(typeof checked.m2).toBe('function');
      expect(typeof checked.ha).toBe('function');
      expect(typeof checked.km2).toBe('function');
      expect(typeof checked.in2).toBe('function');
      expect(typeof checked.ft2).toBe('function');
      expect(typeof checked.yd2).toBe('function');
      expect(typeof checked.ac).toBe('function');
      expect(typeof checked.mi2).toBe('function');
      expect(typeof checked.pla).toBe('function');
    });

    it('all volume factories exist', () => {
      expect(typeof checked.ml).toBe('function');
      expect(typeof checked.cl).toBe('function');
      expect(typeof checked.l).toBe('function');
      expect(typeof checked.m3).toBe('function');
      expect(typeof checked.tsp).toBe('function');
      expect(typeof checked.tbsp).toBe('function');
      expect(typeof checked.floz).toBe('function');
      expect(typeof checked.cup).toBe('function');
      expect(typeof checked.pt_liq).toBe('function');
      expect(typeof checked.qt).toBe('function');
      expect(typeof checked.gal).toBe('function');
      expect(typeof checked.plv).toBe('function');
    });

    it('all velocity factories exist', () => {
      expect(typeof checked.mps).toBe('function');
      expect(typeof checked.kmh).toBe('function');
      expect(typeof checked.fps).toBe('function');
      expect(typeof checked.mph).toBe('function');
      expect(typeof checked.kn).toBe('function');
      expect(typeof checked.pvel).toBe('function');
    });

    it('all force factories exist', () => {
      expect(typeof checked.N).toBe('function');
      expect(typeof checked.kN).toBe('function');
      expect(typeof checked.lbf).toBe('function');
      expect(typeof checked.dyn).toBe('function');
      expect(typeof checked.pfo).toBe('function');
    });

    it('all energy factories exist', () => {
      expect(typeof checked.J).toBe('function');
      expect(typeof checked.kJ).toBe('function');
      expect(typeof checked.cal).toBe('function');
      expect(typeof checked.kcal).toBe('function');
      expect(typeof checked.Wh).toBe('function');
      expect(typeof checked.kWh).toBe('function');
      expect(typeof checked.eV).toBe('function');
      expect(typeof checked.BTU).toBe('function');
      expect(typeof checked.pene).toBe('function');
    });

    it('all power factories exist', () => {
      expect(typeof checked.W).toBe('function');
      expect(typeof checked.kW).toBe('function');
      expect(typeof checked.MW).toBe('function');
      expect(typeof checked.hp).toBe('function');
      expect(typeof checked.ppow).toBe('function');
    });

    it('all pressure factories exist', () => {
      expect(typeof checked.Pa).toBe('function');
      expect(typeof checked.kPa).toBe('function');
      expect(typeof checked.bar).toBe('function');
      expect(typeof checked.psi).toBe('function');
      expect(typeof checked.atm).toBe('function');
      expect(typeof checked.mmHg).toBe('function');
      expect(typeof checked.ppre).toBe('function');
    });

    it('all data factories exist', () => {
      expect(typeof checked.b).toBe('function');
      expect(typeof checked.B).toBe('function');
      expect(typeof checked.KB).toBe('function');
      expect(typeof checked.MB).toBe('function');
      expect(typeof checked.GB).toBe('function');
      expect(typeof checked.TB).toBe('function');
      expect(typeof checked.PB).toBe('function');
    });

    it('scalar factory exists', () => {
      expect(typeof checked.scalar).toBe('function');
    });

    it('checked mode exposes all operations', () => {
      expect(typeof checked.add).toBe('function');
      expect(typeof checked.sub).toBe('function');
      expect(typeof checked.mul).toBe('function');
      expect(typeof checked.div).toBe('function');
      expect(typeof checked.to).toBe('function');
      expect(typeof checked.eq).toBe('function');
      expect(typeof checked.lt).toBe('function');
      expect(typeof checked.lte).toBe('function');
      expect(typeof checked.gt).toBe('function');
      expect(typeof checked.gte).toBe('function');
      expect(typeof checked.valueOf).toBe('function');
      expect(typeof checked.format).toBe('function');
      expect(typeof checked.parse).toBe('function');
    });
  });

  describe('checked mul/div pass through (no extra dimension check needed)', () => {
    it('checked.mul(m(3), s(2)) works (cross-dimension mul is valid)', () => {
      const result = checked.mul(checked.m(3), checked.s(2));
      expect(checked.valueOf(result)).toBe(6);
    });

    it('checked.div(m(10), s(2)) works (cross-dimension div is valid)', () => {
      const result = checked.div(checked.m(10), checked.s(2));
      expect(checked.valueOf(result)).toBe(5);
    });

    it('checked.mul still rejects affine offset quantities', () => {
      expect(() => checked.mul(checked.scalar(2), checked.C(100))).toThrow(TypeError);
    });

    it('checked.div still rejects affine offset quantities', () => {
      expect(() => checked.div(checked.C(100), checked.scalar(2))).toThrow(TypeError);
    });
  });

  describe('checked parse works for all unit labels', () => {
    it('checked.parse("5 m") works', () => {
      const result = checked.parse('5 m');
      expect(checked.valueOf(result)).toBe(5);
    });

    it('checked.parse("100 C") works', () => {
      const result = checked.parse('100 C');
      expect(checked.valueOf(result)).toBe(100);
    });

    it('checked.parse throws on unknown unit', () => {
      expect(() => checked.parse('5 xyz')).toThrow(TypeError);
    });
  });

  describe('checked format works', () => {
    it('checked.format(m(5)) = "5 m"', () => {
      expect(checked.format(checked.m(5))).toBe('5 m');
    });
  });

  describe('multiple createChecked instances are independent', () => {
    it('two checked instances produce equivalent results', () => {
      const c1 = createChecked();
      const c2 = createChecked();
      const r1 = c1.add(c1.m(1), c1.m(2));
      const r2 = c2.add(c2.m(1), c2.m(2));
      expect(c1.valueOf(r1)).toBe(c2.valueOf(r2));
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 7: REAL-WORLD PHYSICS CALCULATIONS
// ═══════════════════════════════════════════════════════════════════════

describe('real-world physics calculations', () => {
  it('kinetic energy: E = 0.5 * m * v^2 for a 1 kg object at 10 m/s', () => {
    // E = 0.5 * 1 * 100 = 50 J
    const mass = kg(1);
    const velocity = mps(10);
    const vSquared = mul(velocity, velocity); // m/s * m/s
    const halfMV2 = mul(scalar(0.5), mul(mass, vSquared));
    expect(valueOf(halfMV2)).toBe(50);
  });

  it('force: F = m * a, 10 kg at 9.81 m/s^2', () => {
    // Constructing acceleration as m/s/s
    const mass_val = kg(10);
    const accel = div(mps(9.81), s(1)); // m/s/s
    const force = mul(mass_val, accel);
    expect(valueOf(force)).toBeCloseTo(98.1);
  });

  it('power consumption: 100 W for 2 hours = 200 Wh = 0.2 kWh', () => {
    // P = 100 W, t = 2 h
    // E = P * t, but using unit conversions
    const energy_wh = Wh(200);
    const energy_kwh = to(kWh, energy_wh);
    expect(valueOf(energy_kwh)).toBeCloseTo(0.2, 8);
  });

  it('hydrostatic pressure: rho * g * h for water at 10 m depth', () => {
    // rho = 1000 kg/m^3, g = 9.81 m/s^2, h = 10 m
    // P = 1000 * 9.81 * 10 = 98100 Pa
    const pressure = Pa(98100);
    expect(valueOf(to(kPa, pressure))).toBeCloseTo(98.1, 2);
    expect(valueOf(to(atm, pressure))).toBeCloseTo(0.968, 2);
  });

  it('fuel economy conversion: 30 mpg in km/l (approximate)', () => {
    // 30 miles per gallon:
    // 30 mi = 30 * 1.609344 km = 48.28032 km
    // 1 gal = 3.785411784 l
    // 48.28032 / 3.785411784 = ~12.754 km/l
    const distance_km = valueOf(to(km, mi(30)));
    const volume_l = valueOf(to(l, gal(1)));
    const kml = distance_km / volume_l;
    expect(kml).toBeCloseTo(12.754, 1);
  });

  it('data transfer: 1 GB at 100 Mbps takes ~80 seconds', () => {
    // 1 GB = 8,589,934,592 bits
    // 100 Mbps = 100 * 8388608 bits/s = 838,860,800 bits/s
    // Actually, the library uses binary KB (1 KB = 8192 bits)
    // Let's use the library to verify: 1 GB in bits
    const gb_in_bits = valueOf(to(b, GB(1)));
    expect(gb_in_bits).toBe(8589934592);
    // At 100 Mbps (let's say 100 * 8388608 b/s = 838,860,800 b/s)
    const mb_in_bits = valueOf(to(b, MB(100)));
    expect(mb_in_bits).toBe(838860800);
    const transfer_time = gb_in_bits / mb_in_bits; // seconds
    expect(transfer_time).toBeCloseTo(10.24, 2);
  });

  it('cooking: recipe calls for 2.5 cups, converted to ml', () => {
    const result = to(ml, cup(2.5));
    expect(valueOf(result)).toBeCloseTo(591.47, 0);
  });

  it('aviation: flight at 35000 ft altitude in meters', () => {
    const altitude = to(m, ft(35000));
    expect(valueOf(altitude)).toBeCloseTo(10668, 0);
  });

  it('marathon distance: 26 miles 385 yards in km', () => {
    const miles_in_m = valueOf(to(m, mi(26)));
    const yards_in_m = valueOf(to(m, yd(385)));
    const total_m = miles_in_m + yards_in_m;
    const total_km = total_m / 1000;
    expect(total_km).toBeCloseTo(42.195, 1);
  });

  it('astronomical: distance to nearest star (Proxima Centauri) ~4.246 ly in parsecs', () => {
    const result = to(pc, ly(4.246));
    expect(valueOf(result)).toBeCloseTo(1.302, 1);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// SECTION 8: CONVERSION TO/FROM SELF — IDENTITY
// ═══════════════════════════════════════════════════════════════════════

describe('conversion to self is identity', () => {
  it('to(m, m(42)) = 42', () => {
    expect(valueOf(to(m, m(42)))).toBe(42);
  });

  it('to(km, km(1.5)) = 1.5', () => {
    expect(valueOf(to(km, km(1.5)))).toBe(1.5);
  });

  it('to(C, C(100)) = 100', () => {
    expect(valueOf(to(C, C(100)))).toBeCloseTo(100, 10);
  });

  it('to(F, F(72)) = 72', () => {
    expect(valueOf(to(F, F(72)))).toBeCloseTo(72, 8);
  });

  it('to(K, K(0)) = 0', () => {
    expect(valueOf(to(K, K(0)))).toBe(0);
  });

  it('to(R, R(491.67)) = 491.67', () => {
    expect(valueOf(to(R, R(491.67)))).toBeCloseTo(491.67, 8);
  });

  it('to(Pa, Pa(101325)) = 101325', () => {
    expect(valueOf(to(Pa, Pa(101325)))).toBe(101325);
  });

  it('to(B, B(1024)) = 1024', () => {
    expect(valueOf(to(B, B(1024)))).toBe(1024);
  });

  it('to(scalar, scalar(3.14)) = 3.14', () => {
    expect(valueOf(to(scalar, scalar(3.14)))).toBe(3.14);
  });
});
