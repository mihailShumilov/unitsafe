/**
 * PARANOIC ACCEPTANCE TESTS — TEMPERATURE DIMENSION
 *
 * Units under test (5 total):
 *   K (Kelvin), C (Celsius), F (Fahrenheit), R (Rankine), pT (Planck temperature)
 *
 * Coverage strategy:
 *   - Factory creation for every unit
 *   - ALL pairwise conversions (K<->C, K<->F, K<->R, C<->F, C<->R, F<->R)
 *   - Reference points: absolute zero, water freeze, water boil, body temp, -40 crossover
 *   - pT conversion to K and back
 *   - mul/div offset rejection for C and F
 *   - mul/div success for K, R, pT (zero offset)
 *   - add/sub for every unit
 *   - format for every unit
 *   - Roundtrip conversions
 */

import { describe, it, expect } from 'vitest';
import {
  K, C, F, R, pT,
  add, sub, mul, div, to, valueOf, format, scalar,
} from '../../src/index.js';

// ---------------------------------------------------------------------------
// SECTION A — Factory creation
// ---------------------------------------------------------------------------

describe('Temperature — Factory creation', () => {
  const factories = [
    { name: 'K',  fn: K,  label: 'K',  offset: 0 },
    { name: 'C',  fn: C,  label: 'C',  offset: 273.15 },
    { name: 'F',  fn: F,  label: 'F',  offset: 255.3722222222222 },
    { name: 'R',  fn: R,  label: 'R',  offset: 0 },
    { name: 'pT', fn: pT, label: 'pT', offset: 0 },
  ] as const;

  for (const { name, fn, label, offset } of factories) {
    it(`${name}(100) creates quantity with value 100 and label "${label}"`, () => {
      const q = fn(100);
      expect(valueOf(q)).toBe(100);
      expect(q._l).toBe(label);
      expect(q._o).toBe(offset);
    });

    it(`${name}("37.5") creates quantity from string`, () => {
      expect(valueOf(fn('37.5'))).toBe(37.5);
    });

    it(`${name}(0) handles zero`, () => {
      expect(valueOf(fn(0))).toBe(0);
    });

    it(`${name}(-40) handles negative`, () => {
      expect(valueOf(fn(-40))).toBe(-40);
    });
  }

  it('all temperature factories share dimension [0,0,0,0,1,0,0,0]', () => {
    for (const { fn } of factories) {
      expect(fn._dim).toEqual([0, 0, 0, 0, 1, 0, 0, 0]);
    }
  });

  it('C has offset 273.15', () => expect(C._offset).toBe(273.15));
  it('F has offset 255.3722...', () => expect(F._offset).toBeCloseTo(255.3722222222222, 10));
  it('K has offset 0', () => expect(K._offset).toBe(0));
  it('R has offset 0', () => expect(R._offset).toBe(0));
  it('pT has offset 0', () => expect(pT._offset).toBe(0));
});

// ---------------------------------------------------------------------------
// SECTION B — Reference point: absolute zero
// ---------------------------------------------------------------------------

describe('Temperature — Absolute zero', () => {
  it('0 K = -273.15 C', () => {
    expect(valueOf(to(C, K(0)))).toBeCloseTo(-273.15, 6);
  });

  it('0 K = -459.67 F', () => {
    expect(valueOf(to(F, K(0)))).toBeCloseTo(-459.67, 2);
  });

  it('0 K = 0 R', () => {
    expect(valueOf(to(R, K(0)))).toBeCloseTo(0, 6);
  });

  it('-273.15 C = 0 K', () => {
    expect(valueOf(to(K, C(-273.15)))).toBeCloseTo(0, 6);
  });

  it('-459.67 F = 0 K', () => {
    expect(valueOf(to(K, F(-459.67)))).toBeCloseTo(0, 1);
  });

  it('0 R = 0 K', () => {
    expect(valueOf(to(K, R(0)))).toBeCloseTo(0, 6);
  });
});

// ---------------------------------------------------------------------------
// SECTION C — Reference point: water freezing (0 C)
// ---------------------------------------------------------------------------

describe('Temperature — Water freezing point (0 C)', () => {
  it('0 C = 273.15 K', () => {
    expect(valueOf(to(K, C(0)))).toBeCloseTo(273.15, 6);
  });

  it('0 C = 32 F', () => {
    expect(valueOf(to(F, C(0)))).toBeCloseTo(32, 2);
  });

  it('0 C = 491.67 R', () => {
    expect(valueOf(to(R, C(0)))).toBeCloseTo(491.67, 2);
  });

  it('32 F = 0 C', () => {
    expect(valueOf(to(C, F(32)))).toBeCloseTo(0, 4);
  });

  it('273.15 K = 0 C', () => {
    expect(valueOf(to(C, K(273.15)))).toBeCloseTo(0, 6);
  });

  it('491.67 R = 0 C', () => {
    expect(valueOf(to(C, R(491.67)))).toBeCloseTo(0, 2);
  });
});

// ---------------------------------------------------------------------------
// SECTION D — Reference point: water boiling (100 C)
// ---------------------------------------------------------------------------

describe('Temperature — Water boiling point (100 C)', () => {
  it('100 C = 373.15 K', () => {
    expect(valueOf(to(K, C(100)))).toBeCloseTo(373.15, 4);
  });

  it('100 C = 212 F', () => {
    expect(valueOf(to(F, C(100)))).toBeCloseTo(212, 2);
  });

  it('100 C = 671.67 R', () => {
    expect(valueOf(to(R, C(100)))).toBeCloseTo(671.67, 1);
  });

  it('212 F = 100 C', () => {
    expect(valueOf(to(C, F(212)))).toBeCloseTo(100, 2);
  });

  it('373.15 K = 100 C', () => {
    expect(valueOf(to(C, K(373.15)))).toBeCloseTo(100, 4);
  });

  it('212 F = 373.15 K', () => {
    expect(valueOf(to(K, F(212)))).toBeCloseTo(373.15, 1);
  });
});

// ---------------------------------------------------------------------------
// SECTION E — Reference point: body temperature (37 C)
// ---------------------------------------------------------------------------

describe('Temperature — Human body temperature (37 C)', () => {
  it('37 C = 310.15 K', () => {
    expect(valueOf(to(K, C(37)))).toBeCloseTo(310.15, 4);
  });

  it('37 C = 98.6 F', () => {
    expect(valueOf(to(F, C(37)))).toBeCloseTo(98.6, 1);
  });

  it('98.6 F = 37 C', () => {
    expect(valueOf(to(C, F(98.6)))).toBeCloseTo(37, 1);
  });

  it('310.15 K = 98.6 F', () => {
    expect(valueOf(to(F, K(310.15)))).toBeCloseTo(98.6, 0);
  });
});

// ---------------------------------------------------------------------------
// SECTION F — The -40 crossover (C = F)
// ---------------------------------------------------------------------------

describe('Temperature — The -40 crossover', () => {
  it('-40 C = -40 F', () => {
    expect(valueOf(to(F, C(-40)))).toBeCloseTo(-40, 2);
  });

  it('-40 F = -40 C', () => {
    expect(valueOf(to(C, F(-40)))).toBeCloseTo(-40, 2);
  });

  it('-40 C = 233.15 K', () => {
    expect(valueOf(to(K, C(-40)))).toBeCloseTo(233.15, 4);
  });

  it('-40 F = 233.15 K', () => {
    expect(valueOf(to(K, F(-40)))).toBeCloseTo(233.15, 1);
  });
});

// ---------------------------------------------------------------------------
// SECTION G — All pairwise conversions (K, C, F, R)
// ---------------------------------------------------------------------------

describe('Temperature — K <-> R conversions', () => {
  it('1 K = 1.8 R', () => {
    expect(valueOf(to(R, K(1)))).toBeCloseTo(1.8, 6);
  });

  it('1.8 R = 1 K', () => {
    expect(valueOf(to(K, R(1.8)))).toBeCloseTo(1, 6);
  });

  it('273.15 K = 491.67 R', () => {
    expect(valueOf(to(R, K(273.15)))).toBeCloseTo(491.67, 2);
  });

  it('491.67 R = 273.15 K', () => {
    expect(valueOf(to(K, R(491.67)))).toBeCloseTo(273.15, 2);
  });

  it('0 K = 0 R', () => {
    expect(valueOf(to(R, K(0)))).toBeCloseTo(0, 6);
  });
});

describe('Temperature — C <-> R conversions', () => {
  it('0 C = 491.67 R', () => {
    expect(valueOf(to(R, C(0)))).toBeCloseTo(491.67, 2);
  });

  it('100 C = 671.67 R', () => {
    expect(valueOf(to(R, C(100)))).toBeCloseTo(671.67, 1);
  });

  it('491.67 R = 0 C', () => {
    expect(valueOf(to(C, R(491.67)))).toBeCloseTo(0, 2);
  });
});

describe('Temperature — F <-> R conversions', () => {
  it('32 F = 491.67 R', () => {
    expect(valueOf(to(R, F(32)))).toBeCloseTo(491.67, 1);
  });

  it('212 F = 671.67 R', () => {
    expect(valueOf(to(R, F(212)))).toBeCloseTo(671.67, 1);
  });

  it('491.67 R = 32 F', () => {
    expect(valueOf(to(F, R(491.67)))).toBeCloseTo(32, 1);
  });

  it('0 R = -459.67 F', () => {
    expect(valueOf(to(F, R(0)))).toBeCloseTo(-459.67, 1);
  });
});

// ---------------------------------------------------------------------------
// SECTION H — Roundtrip conversions
// ---------------------------------------------------------------------------

describe('Temperature — Roundtrip conversions', () => {
  const testTemps = [-40, 0, 20, 37, 100, 451, 1000];

  for (const temp of testTemps) {
    it(`C(${temp}) -> K -> C roundtrip`, () => {
      const inK = to(K, C(temp));
      const back = to(C, inK);
      expect(valueOf(back)).toBeCloseTo(temp, 6);
    });

    it(`C(${temp}) -> F -> C roundtrip`, () => {
      const inF = to(F, C(temp));
      const back = to(C, inF);
      expect(valueOf(back)).toBeCloseTo(temp, 4);
    });

    it(`F(${temp}) -> K -> F roundtrip`, () => {
      const inK = to(K, F(temp));
      const back = to(F, inK);
      expect(valueOf(back)).toBeCloseTo(temp, 4);
    });

    it(`K(${temp + 273.15}) -> R -> K roundtrip`, () => {
      const kVal = temp + 273.15;
      const inR = to(R, K(kVal));
      const back = to(K, inR);
      expect(valueOf(back)).toBeCloseTo(kVal, 4);
    });
  }
});

// ---------------------------------------------------------------------------
// SECTION I — Planck temperature
// ---------------------------------------------------------------------------

describe('Temperature — Planck temperature', () => {
  it('1 pT = 1.416784e32 K', () => {
    expect(valueOf(to(K, pT(1)))).toBeCloseTo(1.416784e32, -26);
  });

  it('roundtrip: pT -> K -> pT', () => {
    const inK = to(K, pT(1));
    const back = to(pT, inK);
    expect(valueOf(back)).toBeCloseTo(1, 6);
  });

  it('pT._scale = 1.416784e32', () => {
    expect(pT._scale).toBe(1.416784e32);
  });

  it('pT has zero offset (absolute scale)', () => {
    expect(pT._offset).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// SECTION J — mul/div offset rejection
// ---------------------------------------------------------------------------

describe('Temperature — mul/div offset rejection', () => {
  it('mul(scalar(2), C(100)) throws TypeError', () => {
    expect(() => mul(scalar(2), C(100))).toThrow(TypeError);
  });

  it('mul(C(100), scalar(2)) throws TypeError', () => {
    expect(() => mul(C(100), scalar(2))).toThrow(TypeError);
  });

  it('mul(scalar(2), F(212)) throws TypeError', () => {
    expect(() => mul(scalar(2), F(212))).toThrow(TypeError);
  });

  it('mul(F(212), scalar(2)) throws TypeError', () => {
    expect(() => mul(F(212), scalar(2))).toThrow(TypeError);
  });

  it('div(C(100), scalar(2)) throws TypeError', () => {
    expect(() => div(C(100), scalar(2))).toThrow(TypeError);
  });

  it('div(scalar(200), C(100)) throws TypeError', () => {
    expect(() => div(scalar(200), C(100))).toThrow(TypeError);
  });

  it('div(F(212), scalar(2)) throws TypeError', () => {
    expect(() => div(F(212), scalar(2))).toThrow(TypeError);
  });

  it('div(scalar(424), F(212)) throws TypeError', () => {
    expect(() => div(scalar(424), F(212))).toThrow(TypeError);
  });

  it('mul(C(50), F(50)) throws TypeError (both affine)', () => {
    expect(() => mul(C(50) as any, F(50) as any)).toThrow(TypeError);
  });

  it('error message mentions "convert to an absolute unit"', () => {
    expect(() => mul(scalar(2), C(100))).toThrow(/convert to an absolute unit/);
    expect(() => div(F(100), scalar(2))).toThrow(/convert to an absolute unit/);
  });
});

// ---------------------------------------------------------------------------
// SECTION K — mul/div success with zero-offset temperature units
// ---------------------------------------------------------------------------

describe('Temperature — mul/div with zero-offset units (K, R, pT)', () => {
  it('mul(scalar(2), K(100)) = 200', () => {
    expect(valueOf(mul(scalar(2), K(100)))).toBe(200);
  });

  it('div(K(200), scalar(2)) = 100', () => {
    expect(valueOf(div(K(200), scalar(2)))).toBe(100);
  });

  it('mul(scalar(3), R(100)) = 300', () => {
    expect(valueOf(mul(scalar(3), R(100)))).toBe(300);
  });

  it('div(R(300), scalar(3)) = 100', () => {
    expect(valueOf(div(R(300), scalar(3)))).toBe(100);
  });

  it('mul(scalar(2), pT(1)) = 2', () => {
    expect(valueOf(mul(scalar(2), pT(1)))).toBe(2);
  });

  it('div(pT(4), scalar(2)) = 2', () => {
    expect(valueOf(div(pT(4), scalar(2)))).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// SECTION L — add/sub for every unit
// ---------------------------------------------------------------------------

describe('Temperature — Arithmetic (add/sub)', () => {
  it('add: K(273.15) + K(100) = K(373.15)', () => {
    expect(valueOf(add(K(273.15), K(100)))).toBeCloseTo(373.15);
  });

  it('sub: K(373.15) - K(273.15) = K(100)', () => {
    expect(valueOf(sub(K(373.15), K(273.15)))).toBeCloseTo(100);
  });

  it('add: C(20) + C(17) = C(37)', () => {
    expect(valueOf(add(C(20), C(17)))).toBe(37);
  });

  it('sub: C(100) - C(37) = C(63)', () => {
    expect(valueOf(sub(C(100), C(37)))).toBe(63);
  });

  it('add: F(72) + F(26.6) = F(98.6)', () => {
    expect(valueOf(add(F(72), F(26.6)))).toBeCloseTo(98.6);
  });

  it('sub: F(212) - F(32) = F(180)', () => {
    expect(valueOf(sub(F(212), F(32)))).toBe(180);
  });

  it('add: R(100) + R(391.67) = R(491.67)', () => {
    expect(valueOf(add(R(100), R(391.67)))).toBeCloseTo(491.67);
  });

  it('sub: R(671.67) - R(491.67) = R(180)', () => {
    expect(valueOf(sub(R(671.67), R(491.67)))).toBeCloseTo(180);
  });

  it('add: pT(0.5) + pT(0.5) = pT(1)', () => {
    expect(valueOf(add(pT(0.5), pT(0.5)))).toBe(1);
  });

  it('sub: pT(2) - pT(1) = pT(1)', () => {
    expect(valueOf(sub(pT(2), pT(1)))).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// SECTION M — format for every unit
// ---------------------------------------------------------------------------

describe('Temperature — format()', () => {
  it('format(K(273.15)) = "273.15 K"', () => {
    expect(format(K(273.15))).toBe('273.15 K');
  });

  it('format(C(100)) = "100 C"', () => {
    expect(format(C(100))).toBe('100 C');
  });

  it('format(F(98.6)) = "98.6 F"', () => {
    expect(format(F(98.6))).toBe('98.6 F');
  });

  it('format(R(491.67)) = "491.67 R"', () => {
    expect(format(R(491.67))).toBe('491.67 R');
  });

  it('format(pT(1)) = "1 pT"', () => {
    expect(format(pT(1))).toBe('1 pT');
  });

  it('format with precision', () => {
    expect(format(C(36.6667), { precision: 1 })).toBe('36.7 C');
    expect(format(F(98.6), { precision: 0 })).toBe('99 F');
  });
});

// ---------------------------------------------------------------------------
// SECTION N — Boundary and edge cases
// ---------------------------------------------------------------------------

describe('Temperature — Boundary and edge cases', () => {
  it('0 C conversion is not zero K (offset)', () => {
    expect(valueOf(to(K, C(0)))).toBeCloseTo(273.15);
    expect(valueOf(to(K, C(0)))).not.toBe(0);
  });

  it('0 F conversion is not zero K (offset)', () => {
    const kVal = valueOf(to(K, F(0)));
    expect(kVal).toBeCloseTo(255.3722, 2);
    expect(kVal).not.toBe(0);
  });

  it('very large temperature: C(1e6) -> K', () => {
    expect(valueOf(to(K, C(1e6)))).toBeCloseTo(1e6 + 273.15, 0);
  });

  it('very negative temperature: C(-1000) -> K', () => {
    expect(valueOf(to(K, C(-1000)))).toBeCloseTo(-1000 + 273.15, 4);
  });

  it('string throws on non-numeric', () => {
    expect(() => K('abc')).toThrow(TypeError);
    expect(() => C('')).toThrow(TypeError);
    expect(() => F('   ')).toThrow(TypeError);
  });

  it('Infinity propagates through conversion', () => {
    expect(valueOf(to(K, C(Infinity)))).toBe(Infinity);
    expect(valueOf(to(F, K(Infinity)))).toBe(Infinity);
  });
});

// ---------------------------------------------------------------------------
// SECTION O — Scale metadata
// ---------------------------------------------------------------------------

describe('Temperature — Scale metadata', () => {
  it('K._scale = 1', () => expect(K._scale).toBe(1));
  it('C._scale = 1', () => expect(C._scale).toBe(1));
  it('F._scale = 5/9', () => expect(F._scale).toBeCloseTo(5 / 9, 10));
  it('R._scale = 5/9', () => expect(R._scale).toBeCloseTo(5 / 9, 10));
  it('pT._scale = 1.416784e32', () => expect(pT._scale).toBe(1.416784e32));
});
