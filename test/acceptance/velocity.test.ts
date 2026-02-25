/**
 * PARANOIC ACCEPTANCE TESTS — VELOCITY DIMENSION
 *
 * Units under test (6 total):
 *   mps (label 'm/s'), kmh (label 'km/h'), fps (label 'ft/s'),
 *   mph (label 'mph'), kn (label 'kn'), pvel (label 'c')
 *
 * Coverage strategy:
 *   - Factory creation for every unit
 *   - Conversion to/from SI base (m/s) for every unit
 *   - All meaningful pairwise conversions
 *   - Roundtrip conversions
 *   - add/sub for every unit
 *   - format for every unit
 *   - Real-world: highway speed, knot = 1 nmi/h, speed of light
 */

import { describe, it, expect } from 'vitest';
import {
  mps, kmh, fps, mph, kn, pvel,
  add, sub, mul, div, to, valueOf, format, scalar,
} from '../../src/index.js';

// ---------------------------------------------------------------------------
// SECTION A — Factory creation
// ---------------------------------------------------------------------------

describe('Velocity — Factory creation', () => {
  const factories = [
    { name: 'mps',  fn: mps,  label: 'm/s' },
    { name: 'kmh',  fn: kmh,  label: 'km/h' },
    { name: 'fps',  fn: fps,  label: 'ft/s' },
    { name: 'mph',  fn: mph,  label: 'mph' },
    { name: 'kn',   fn: kn,   label: 'kn' },
    { name: 'pvel', fn: pvel, label: 'c' },
  ] as const;

  for (const { name, fn, label } of factories) {
    it(`${name}(60) creates quantity with value 60 and label "${label}"`, () => {
      const q = fn(60);
      expect(valueOf(q)).toBe(60);
      expect(q._l).toBe(label);
      expect(q._o).toBe(0);
    });

    it(`${name}("25.5") creates quantity from string`, () => {
      expect(valueOf(fn('25.5'))).toBe(25.5);
    });

    it(`${name}(0) handles zero`, () => {
      expect(valueOf(fn(0))).toBe(0);
    });

    it(`${name}(-10) handles negative`, () => {
      expect(valueOf(fn(-10))).toBe(-10);
    });
  }

  it('all velocity factories share dimension [1,0,-1,0,0,0,0,0]', () => {
    for (const { fn } of factories) {
      expect(fn._dim).toEqual([1, 0, -1, 0, 0, 0, 0, 0]);
    }
  });
});

// ---------------------------------------------------------------------------
// SECTION B — Conversion to SI (m/s) and roundtrip
// ---------------------------------------------------------------------------

describe('Velocity — Conversion to SI (m/s) and roundtrip', () => {
  const units = [
    { name: 'kmh',  fn: kmh,  scale: 5 / 18,   testVal: 100 },
    { name: 'fps',  fn: fps,  scale: 0.3048,    testVal: 100 },
    { name: 'mph',  fn: mph,  scale: 0.44704,   testVal: 60 },
    { name: 'kn',   fn: kn,   scale: 1852 / 3600, testVal: 10 },
    { name: 'pvel', fn: pvel, scale: 299792458,  testVal: 1 },
  ];

  for (const { name, fn, scale, testVal } of units) {
    it(`${name}(${testVal}) -> m/s gives ${testVal} * ${scale}`, () => {
      const result = valueOf(to(mps, fn(testVal)));
      const expected = testVal * scale;
      expect(result).toBeCloseTo(expected, 4);
    });

    it(`roundtrip: ${name} -> m/s -> ${name} preserves value`, () => {
      const original = fn(testVal);
      const inMps = to(mps, original);
      const back = to(fn, inMps);
      expect(valueOf(back)).toBeCloseTo(testVal, 6);
    });
  }

  it('mps -> mps is identity', () => {
    expect(valueOf(to(mps, mps(42)))).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// SECTION C — Pairwise conversions
// ---------------------------------------------------------------------------

describe('Velocity — Pairwise conversions', () => {
  // m/s <-> km/h
  it('1 m/s = 3.6 km/h', () => {
    expect(valueOf(to(kmh, mps(1)))).toBeCloseTo(3.6, 6);
  });

  it('100 km/h = 27.778 m/s', () => {
    expect(valueOf(to(mps, kmh(100)))).toBeCloseTo(27.778, 2);
  });

  // m/s <-> mph
  it('1 m/s = 2.23694 mph', () => {
    expect(valueOf(to(mph, mps(1)))).toBeCloseTo(2.23694, 3);
  });

  it('60 mph = 26.8224 m/s', () => {
    expect(valueOf(to(mps, mph(60)))).toBeCloseTo(26.8224, 3);
  });

  // m/s <-> ft/s
  it('1 m/s = 3.28084 ft/s', () => {
    expect(valueOf(to(fps, mps(1)))).toBeCloseTo(3.28084, 3);
  });

  it('1 ft/s = 0.3048 m/s', () => {
    expect(valueOf(to(mps, fps(1)))).toBeCloseTo(0.3048, 6);
  });

  // km/h <-> mph
  it('100 km/h = 62.137 mph', () => {
    expect(valueOf(to(mph, kmh(100)))).toBeCloseTo(62.137, 1);
  });

  it('60 mph = 96.5606 km/h', () => {
    expect(valueOf(to(kmh, mph(60)))).toBeCloseTo(96.5606, 2);
  });

  // kn <-> km/h
  it('1 kn = 1.852 km/h', () => {
    expect(valueOf(to(kmh, kn(1)))).toBeCloseTo(1.852, 4);
  });

  it('100 km/h = 53.9957 kn', () => {
    expect(valueOf(to(kn, kmh(100)))).toBeCloseTo(53.9957, 2);
  });

  // kn <-> mph
  it('1 kn = 1.15078 mph', () => {
    expect(valueOf(to(mph, kn(1)))).toBeCloseTo(1.15078, 3);
  });

  // fps <-> mph
  it('88 ft/s = 60 mph', () => {
    expect(valueOf(to(mph, fps(88)))).toBeCloseTo(60, 1);
  });

  it('60 mph = 88 ft/s', () => {
    expect(valueOf(to(fps, mph(60)))).toBeCloseTo(88, 1);
  });

  // fps <-> kmh
  it('1 ft/s = 1.09728 km/h', () => {
    expect(valueOf(to(kmh, fps(1)))).toBeCloseTo(1.09728, 3);
  });

  // pvel <-> all
  it('1 c = 299792458 m/s', () => {
    expect(valueOf(to(mps, pvel(1)))).toBe(299792458);
  });

  it('1 c = 1079252848.8 km/h', () => {
    expect(valueOf(to(kmh, pvel(1)))).toBeCloseTo(1079252848.8, -2);
  });

  it('1 c = 670616629.4 mph', () => {
    expect(valueOf(to(mph, pvel(1)))).toBeCloseTo(670616629.4, -2);
  });

  it('1 c = 582749918.4 kn', () => {
    expect(valueOf(to(kn, pvel(1)))).toBeCloseTo(582749918.4, -3);
  });
});

// ---------------------------------------------------------------------------
// SECTION D — add/sub for every unit
// ---------------------------------------------------------------------------

describe('Velocity — Arithmetic (add/sub)', () => {
  it('add: mps(10) + mps(5) = mps(15)', () => {
    expect(valueOf(add(mps(10), mps(5)))).toBe(15);
  });

  it('sub: kmh(120) - kmh(20) = kmh(100)', () => {
    expect(valueOf(sub(kmh(120), kmh(20)))).toBe(100);
  });

  it('add: fps(44) + fps(44) = fps(88)', () => {
    expect(valueOf(add(fps(44), fps(44)))).toBe(88);
  });

  it('sub: mph(65) - mph(5) = mph(60)', () => {
    expect(valueOf(sub(mph(65), mph(5)))).toBe(60);
  });

  it('add: kn(10) + kn(5) = kn(15)', () => {
    expect(valueOf(add(kn(10), kn(5)))).toBe(15);
  });

  it('sub: pvel(1) - pvel(0.5) = pvel(0.5)', () => {
    expect(valueOf(sub(pvel(1), pvel(0.5)))).toBeCloseTo(0.5);
  });
});

// ---------------------------------------------------------------------------
// SECTION E — format for every unit
// ---------------------------------------------------------------------------

describe('Velocity — format()', () => {
  it('format(mps(10)) = "10 m/s"', () => expect(format(mps(10))).toBe('10 m/s'));
  it('format(kmh(100)) = "100 km/h"', () => expect(format(kmh(100))).toBe('100 km/h'));
  it('format(fps(88)) = "88 ft/s"', () => expect(format(fps(88))).toBe('88 ft/s'));
  it('format(mph(60)) = "60 mph"', () => expect(format(mph(60))).toBe('60 mph'));
  it('format(kn(10)) = "10 kn"', () => expect(format(kn(10))).toBe('10 kn'));
  it('format(pvel(1)) = "1 c"', () => expect(format(pvel(1))).toBe('1 c'));
  it('format with precision', () => {
    expect(format(kmh(96.5606), { precision: 1 })).toBe('96.6 km/h');
    expect(format(mph(62.137), { precision: 0 })).toBe('62 mph');
  });
});

// ---------------------------------------------------------------------------
// SECTION F — Real-world reference values
// ---------------------------------------------------------------------------

describe('Velocity — Real-world reference values', () => {
  it('US highway speed: 65 mph = ~104.6 km/h', () => {
    expect(valueOf(to(kmh, mph(65)))).toBeCloseTo(104.6, 0);
  });

  it('sprinter: 10 m/s = 36 km/h', () => {
    expect(valueOf(to(kmh, mps(10)))).toBeCloseTo(36, 4);
  });

  it('1 knot = 1 nautical mile per hour (by definition)', () => {
    // 1 nmi = 1852 m, 1 h = 3600 s => 1 kn = 1852/3600 m/s
    expect(kn._scale).toBeCloseTo(1852 / 3600, 10);
  });

  it('speed of sound at sea level: ~343 m/s = ~767 mph', () => {
    expect(valueOf(to(mph, mps(343)))).toBeCloseTo(767, 0);
  });

  it('speed of light: 1 c = 299,792,458 m/s (exact)', () => {
    expect(valueOf(to(mps, pvel(1)))).toBe(299792458);
  });

  it('walking speed: ~5 km/h = ~1.389 m/s', () => {
    expect(valueOf(to(mps, kmh(5)))).toBeCloseTo(1.389, 2);
  });

  it('Mach 1 is ~340 m/s at sea level', () => {
    const mach1mps = 340;
    const mach1kmh = valueOf(to(kmh, mps(mach1mps)));
    expect(mach1kmh).toBeCloseTo(1224, 0);
  });

  it('commercial jet: ~900 km/h = ~486 kn', () => {
    expect(valueOf(to(kn, kmh(900)))).toBeCloseTo(486, 0);
  });

  it('bullet: ~1000 fps = ~682 mph', () => {
    expect(valueOf(to(mph, fps(1000)))).toBeCloseTo(682, 0);
  });
});

// ---------------------------------------------------------------------------
// SECTION G — Boundary and edge cases
// ---------------------------------------------------------------------------

describe('Velocity — Boundary and edge cases', () => {
  it('zero velocity converts to zero', () => {
    expect(valueOf(to(kmh, mps(0)))).toBe(0);
    expect(valueOf(to(mph, mps(0)))).toBe(0);
  });

  it('negative velocity converts correctly', () => {
    expect(valueOf(to(kmh, mps(-10)))).toBeCloseTo(-36, 4);
  });

  it('Infinity propagates', () => {
    expect(valueOf(to(mps, kmh(Infinity)))).toBe(Infinity);
  });

  it('string throws on non-numeric', () => {
    expect(() => mps('abc')).toThrow(TypeError);
    expect(() => mph('')).toThrow(TypeError);
  });

  it('scalar mul/div works', () => {
    expect(valueOf(mul(scalar(2), mps(10)))).toBe(20);
    expect(valueOf(div(kmh(100), scalar(2)))).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// SECTION H — Scale metadata
// ---------------------------------------------------------------------------

describe('Velocity — Scale metadata', () => {
  it('mps._scale = 1', () => expect(mps._scale).toBe(1));
  it('kmh._scale = 5/18', () => expect(kmh._scale).toBeCloseTo(5 / 18, 10));
  it('fps._scale = 0.3048', () => expect(fps._scale).toBe(0.3048));
  it('mph._scale = 0.44704', () => expect(mph._scale).toBe(0.44704));
  it('kn._scale = 1852/3600', () => expect(kn._scale).toBeCloseTo(1852 / 3600, 10));
  it('pvel._scale = 299792458', () => expect(pvel._scale).toBe(299792458));
});
