/**
 * PARANOIC ACCEPTANCE TESTS — DIGITAL STORAGE DIMENSION
 *
 * Units under test (7 total):
 *   b (bit), B (byte), KB, MB, GB, TB, PB
 *
 * Coverage strategy:
 *   - Factory creation for every unit
 *   - Conversion for every unit (uses binary: 1 KB = 1024 B)
 *   - Full chain: b -> B -> KB -> MB -> GB -> TB -> PB
 *   - Roundtrip conversions
 *   - add/sub for every unit
 *   - format for every unit
 *   - Real-world: file sizes, storage capacities
 *   - Note: This library uses binary (1024-based) definitions
 */

import { describe, it, expect } from 'vitest';
import {
  b, B, KB, MB, GB, TB, PB,
  add, sub, mul, div, to, valueOf, format, scalar,
} from '../../src/index.js';

// ---------------------------------------------------------------------------
// SECTION A — Factory creation
// ---------------------------------------------------------------------------

describe('Digital Storage — Factory creation', () => {
  const factories = [
    { name: 'b',  fn: b,  label: 'b' },
    { name: 'B',  fn: B,  label: 'B' },
    { name: 'KB', fn: KB, label: 'KB' },
    { name: 'MB', fn: MB, label: 'MB' },
    { name: 'GB', fn: GB, label: 'GB' },
    { name: 'TB', fn: TB, label: 'TB' },
    { name: 'PB', fn: PB, label: 'PB' },
  ] as const;

  for (const { name, fn, label } of factories) {
    it(`${name}(512) creates quantity with value 512 and label "${label}"`, () => {
      const q = fn(512);
      expect(valueOf(q)).toBe(512);
      expect(q._l).toBe(label);
      expect(q._o).toBe(0);
    });

    it(`${name}("1024") creates quantity from string`, () => {
      expect(valueOf(fn('1024'))).toBe(1024);
    });

    it(`${name}(0) handles zero`, () => {
      expect(valueOf(fn(0))).toBe(0);
    });
  }

  it('all data factories share dimension [0,0,0,0,0,0,0,1]', () => {
    for (const { fn } of factories) {
      expect(fn._dim).toEqual([0, 0, 0, 0, 0, 0, 0, 1]);
    }
  });
});

// ---------------------------------------------------------------------------
// SECTION B — Conversion to bits (b) and roundtrip
// ---------------------------------------------------------------------------

describe('Digital Storage — Conversion to base (b) and roundtrip', () => {
  const units = [
    { name: 'B',  fn: B,  scaleBits: 8,                 testVal: 1 },
    { name: 'KB', fn: KB, scaleBits: 8192,              testVal: 1 },
    { name: 'MB', fn: MB, scaleBits: 8388608,           testVal: 1 },
    { name: 'GB', fn: GB, scaleBits: 8589934592,        testVal: 1 },
    { name: 'TB', fn: TB, scaleBits: 8796093022208,     testVal: 1 },
    { name: 'PB', fn: PB, scaleBits: 9007199254740992,  testVal: 1 },
  ];

  for (const { name, fn, scaleBits, testVal } of units) {
    it(`${name}(${testVal}) -> b gives ${scaleBits} bits`, () => {
      const result = valueOf(to(b, fn(testVal)));
      expect(result).toBe(scaleBits);
    });

    it(`roundtrip: ${name} -> b -> ${name} preserves value`, () => {
      const original = fn(testVal);
      const inBits = to(b, original);
      const back = to(fn, inBits);
      expect(valueOf(back)).toBeCloseTo(testVal, 8);
    });
  }

  it('b -> b is identity', () => {
    expect(valueOf(to(b, b(8)))).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// SECTION C — Full chain: b -> B -> KB -> MB -> GB -> TB -> PB
// ---------------------------------------------------------------------------

describe('Digital Storage — Full chain', () => {
  it('8 b = 1 B', () => {
    expect(valueOf(to(B, b(8)))).toBe(1);
  });

  it('1 B = 8 b', () => {
    expect(valueOf(to(b, B(1)))).toBe(8);
  });

  it('1024 B = 1 KB', () => {
    expect(valueOf(to(KB, B(1024)))).toBe(1);
  });

  it('1 KB = 1024 B', () => {
    expect(valueOf(to(B, KB(1)))).toBe(1024);
  });

  it('1024 KB = 1 MB', () => {
    expect(valueOf(to(MB, KB(1024)))).toBe(1);
  });

  it('1 MB = 1024 KB', () => {
    expect(valueOf(to(KB, MB(1)))).toBe(1024);
  });

  it('1024 MB = 1 GB', () => {
    expect(valueOf(to(GB, MB(1024)))).toBe(1);
  });

  it('1 GB = 1024 MB', () => {
    expect(valueOf(to(MB, GB(1)))).toBe(1024);
  });

  it('1024 GB = 1 TB', () => {
    expect(valueOf(to(TB, GB(1024)))).toBe(1);
  });

  it('1 TB = 1024 GB', () => {
    expect(valueOf(to(GB, TB(1)))).toBe(1024);
  });

  it('1024 TB = 1 PB', () => {
    expect(valueOf(to(PB, TB(1024)))).toBeCloseTo(1, 4);
  });

  it('1 PB = 1024 TB', () => {
    expect(valueOf(to(TB, PB(1)))).toBeCloseTo(1024, 0);
  });

  it('full chain: 8 * 1024^5 bits = 1 PB', () => {
    const totalBits = 8 * Math.pow(1024, 5);
    expect(valueOf(to(PB, b(totalBits)))).toBeCloseTo(1, 0);
  });
});

// ---------------------------------------------------------------------------
// SECTION D — Cross-level conversions
// ---------------------------------------------------------------------------

describe('Digital Storage — Cross-level conversions', () => {
  it('1 GB = 1048576 KB', () => {
    expect(valueOf(to(KB, GB(1)))).toBe(1048576);
  });

  it('1 TB = 1048576 MB', () => {
    expect(valueOf(to(MB, TB(1)))).toBe(1048576);
  });

  it('1 MB = 8388608 b', () => {
    expect(valueOf(to(b, MB(1)))).toBe(8388608);
  });

  it('1 GB = 1073741824 B', () => {
    expect(valueOf(to(B, GB(1)))).toBe(1073741824);
  });

  it('1 PB = 1048576 GB', () => {
    expect(valueOf(to(GB, PB(1)))).toBeCloseTo(1048576, -1);
  });

  it('1 KB = 8192 b', () => {
    expect(valueOf(to(b, KB(1)))).toBe(8192);
  });
});

// ---------------------------------------------------------------------------
// SECTION E — add/sub for every unit
// ---------------------------------------------------------------------------

describe('Digital Storage — Arithmetic (add/sub)', () => {
  it('add: b(4) + b(4) = b(8)', () => {
    expect(valueOf(add(b(4), b(4)))).toBe(8);
  });

  it('sub: B(1024) - B(512) = B(512)', () => {
    expect(valueOf(sub(B(1024), B(512)))).toBe(512);
  });

  it('add: KB(512) + KB(512) = KB(1024)', () => {
    expect(valueOf(add(KB(512), KB(512)))).toBe(1024);
  });

  it('sub: MB(2048) - MB(1024) = MB(1024)', () => {
    expect(valueOf(sub(MB(2048), MB(1024)))).toBe(1024);
  });

  it('add: GB(4) + GB(4) = GB(8)', () => {
    expect(valueOf(add(GB(4), GB(4)))).toBe(8);
  });

  it('sub: TB(2) - TB(0.5) = TB(1.5)', () => {
    expect(valueOf(sub(TB(2), TB(0.5)))).toBe(1.5);
  });

  it('add: PB(1) + PB(1) = PB(2)', () => {
    expect(valueOf(add(PB(1), PB(1)))).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// SECTION F — format for every unit
// ---------------------------------------------------------------------------

describe('Digital Storage — format()', () => {
  it('format(b(8)) = "8 b"', () => expect(format(b(8))).toBe('8 b'));
  it('format(B(512)) = "512 B"', () => expect(format(B(512))).toBe('512 B'));
  it('format(KB(1024)) = "1024 KB"', () => expect(format(KB(1024))).toBe('1024 KB'));
  it('format(MB(256)) = "256 MB"', () => expect(format(MB(256))).toBe('256 MB'));
  it('format(GB(16)) = "16 GB"', () => expect(format(GB(16))).toBe('16 GB'));
  it('format(TB(2)) = "2 TB"', () => expect(format(TB(2))).toBe('2 TB'));
  it('format(PB(1)) = "1 PB"', () => expect(format(PB(1))).toBe('1 PB'));
  it('format with precision', () => {
    expect(format(GB(1.5), { precision: 1 })).toBe('1.5 GB');
    expect(format(TB(0.5), { precision: 2 })).toBe('0.50 TB');
  });
});

// ---------------------------------------------------------------------------
// SECTION G — Real-world reference values
// ---------------------------------------------------------------------------

describe('Digital Storage — Real-world reference values', () => {
  it('1 byte = 8 bits (fundamental)', () => {
    expect(valueOf(to(b, B(1)))).toBe(8);
  });

  it('1 KB = 1024 bytes (binary definition)', () => {
    expect(valueOf(to(B, KB(1)))).toBe(1024);
    // Verify this is binary, not decimal (1000)
    expect(valueOf(to(B, KB(1)))).not.toBe(1000);
  });

  it('MP3 file: ~4 MB = 4096 KB', () => {
    expect(valueOf(to(KB, MB(4)))).toBe(4096);
  });

  it('HD movie: ~4 GB = 4096 MB', () => {
    expect(valueOf(to(MB, GB(4)))).toBe(4096);
  });

  it('hard drive: 1 TB = 1024 GB', () => {
    expect(valueOf(to(GB, TB(1)))).toBe(1024);
  });

  it('data center: 1 PB = 1024 TB', () => {
    expect(valueOf(to(TB, PB(1)))).toBeCloseTo(1024, 0);
  });

  it('floppy disk: 1440 KB = ~1.406 MB', () => {
    expect(valueOf(to(MB, KB(1440)))).toBeCloseTo(1.406, 2);
  });

  it('ASCII character: 1 B = 8 b', () => {
    expect(valueOf(to(b, B(1)))).toBe(8);
  });

  it('1 MB in bytes vs bits', () => {
    const bytes = valueOf(to(B, MB(1)));
    const bits = valueOf(to(b, MB(1)));
    expect(bits).toBe(bytes * 8);
  });

  it('USB drive: 64 GB = 65536 MB', () => {
    expect(valueOf(to(MB, GB(64)))).toBe(65536);
  });
});

// ---------------------------------------------------------------------------
// SECTION H — Boundary and edge cases
// ---------------------------------------------------------------------------

describe('Digital Storage — Boundary and edge cases', () => {
  it('zero data converts to zero', () => {
    expect(valueOf(to(B, KB(0)))).toBe(0);
    expect(valueOf(to(b, GB(0)))).toBe(0);
  });

  it('fractional values work', () => {
    expect(valueOf(to(B, KB(0.5)))).toBe(512);
    expect(valueOf(to(MB, GB(0.5)))).toBe(512);
  });

  it('negative values convert correctly (mathematical)', () => {
    expect(valueOf(to(B, KB(-1)))).toBe(-1024);
  });

  it('Infinity propagates', () => {
    expect(valueOf(to(b, GB(Infinity)))).toBe(Infinity);
  });

  it('string throws on non-numeric', () => {
    expect(() => B('abc')).toThrow(TypeError);
    expect(() => GB('')).toThrow(TypeError);
  });

  it('scalar mul/div works', () => {
    expect(valueOf(mul(scalar(2), GB(4)))).toBe(8);
    expect(valueOf(div(TB(4), scalar(2)))).toBe(2);
  });

  it('1 bit = 0.125 bytes', () => {
    expect(valueOf(to(B, b(1)))).toBe(0.125);
  });
});

// ---------------------------------------------------------------------------
// SECTION I — Scale metadata (in bits)
// ---------------------------------------------------------------------------

describe('Digital Storage — Scale metadata', () => {
  it('b._scale = 1', () => expect(b._scale).toBe(1));
  it('B._scale = 8', () => expect(B._scale).toBe(8));
  it('KB._scale = 8192 (8 * 1024)', () => expect(KB._scale).toBe(8192));
  it('MB._scale = 8388608 (8 * 1024^2)', () => expect(MB._scale).toBe(8388608));
  it('GB._scale = 8589934592 (8 * 1024^3)', () => expect(GB._scale).toBe(8589934592));
  it('TB._scale = 8796093022208 (8 * 1024^4)', () => expect(TB._scale).toBe(8796093022208));
  it('PB._scale = 9007199254740992 (8 * 1024^5)', () => expect(PB._scale).toBe(9007199254740992));

  it('scale ratios verify binary definitions', () => {
    expect(KB._scale / B._scale).toBe(1024);
    expect(MB._scale / KB._scale).toBe(1024);
    expect(GB._scale / MB._scale).toBe(1024);
    expect(TB._scale / GB._scale).toBe(1024);
    expect(PB._scale / TB._scale).toBe(1024);
  });
});
