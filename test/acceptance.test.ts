import { describe, it, expect } from 'vitest';
import {
  m, km, cm, mm,
  s, ms, min, h,
  kg, g,
  scalar,
  add, sub, mul, div,
  to,
  eq, lt, lte, gt, gte,
  valueOf,
  format,
  createChecked,
} from '../src/index.js';

describe('unitsafe acceptance tests', () => {
  describe('unit factories', () => {
    it('creates quantities from unit factories', () => {
      expect(valueOf(m(5))).toBe(5);
      expect(valueOf(km(1))).toBe(1);
      expect(valueOf(s(10))).toBe(10);
      expect(valueOf(kg(2))).toBe(2);
      expect(valueOf(scalar(42))).toBe(42);
    });
  });

  describe('addition and subtraction', () => {
    it('adds same-unit quantities', () => {
      const result = add(m(1), m(2));
      expect(valueOf(result)).toBe(3);
    });

    it('subtracts same-unit quantities', () => {
      const result = sub(m(5), m(2));
      expect(valueOf(result)).toBe(3);
    });

    it('adds kilometers', () => {
      const result = add(km(1), km(2));
      expect(valueOf(result)).toBe(3);
    });
  });

  describe('multiplication and division', () => {
    it('multiplies quantities to produce composed dimensions', () => {
      const area = mul(m(3), m(4));
      expect(valueOf(area)).toBe(12);
    });

    it('divides quantities to produce composed dimensions', () => {
      const velocity = div(m(10), s(2));
      expect(valueOf(velocity)).toBe(5);
    });

    it('multiplies scalar by quantity', () => {
      const result = mul(scalar(2), m(3));
      expect(valueOf(result)).toBe(6);
    });

    it('divides quantity by scalar', () => {
      const result = div(m(6), scalar(2));
      expect(valueOf(result)).toBe(3);
    });
  });

  describe('conversions', () => {
    it('converts km to m', () => {
      const result = to(m, km(1));
      expect(valueOf(result)).toBe(1000);
    });

    it('converts m to km', () => {
      const result = to(km, m(1500));
      expect(valueOf(result)).toBeCloseTo(1.5);
    });

    it('converts cm to m', () => {
      const result = to(m, cm(100));
      expect(valueOf(result)).toBe(1);
    });

    it('converts mm to m', () => {
      const result = to(m, mm(1000));
      expect(valueOf(result)).toBe(1);
    });

    it('converts s to ms', () => {
      const result = to(ms, s(1));
      expect(valueOf(result)).toBe(1000);
    });

    it('converts h to min', () => {
      const result = to(min, h(1));
      expect(valueOf(result)).toBe(60);
    });

    it('converts kg to g', () => {
      const result = to(g, kg(1));
      expect(valueOf(result)).toBe(1000);
    });
  });

  describe('comparisons', () => {
    it('eq: equal quantities', () => {
      expect(eq(m(1), m(1))).toBe(true);
      expect(eq(m(1), m(2))).toBe(false);
    });

    it('lt: less than', () => {
      expect(lt(m(1), m(2))).toBe(true);
      expect(lt(m(2), m(1))).toBe(false);
      expect(lt(m(1), m(1))).toBe(false);
    });

    it('lte: less than or equal', () => {
      expect(lte(m(1), m(2))).toBe(true);
      expect(lte(m(1), m(1))).toBe(true);
      expect(lte(m(2), m(1))).toBe(false);
    });

    it('gt: greater than', () => {
      expect(gt(m(2), m(1))).toBe(true);
      expect(gt(m(1), m(2))).toBe(false);
    });

    it('gte: greater than or equal', () => {
      expect(gte(m(2), m(1))).toBe(true);
      expect(gte(m(1), m(1))).toBe(true);
      expect(gte(m(1), m(2))).toBe(false);
    });
  });

  describe('valueOf', () => {
    it('extracts raw number from quantity', () => {
      expect(valueOf(m(42))).toBe(42);
      expect(typeof valueOf(m(42))).toBe('number');
    });
  });

  describe('format', () => {
    it('formats quantity with unit label', () => {
      const formatted = format(m(5));
      expect(formatted).toContain('5');
      expect(formatted).toContain('m');
    });

    it('formats km quantity', () => {
      const formatted = format(km(1.5));
      expect(formatted).toContain('1.5');
      expect(formatted).toContain('km');
    });

    it('formats with precision option', () => {
      const formatted = format(m(3.14159), { precision: 2 });
      expect(formatted).toBe('3.14 m');
    });
  });

  describe('checked mode (dev runtime validation)', () => {
    it('createChecked returns factories and operations', () => {
      const checked = createChecked();
      expect(typeof checked.m).toBe('function');
      expect(typeof checked.km).toBe('function');
      expect(typeof checked.s).toBe('function');
      expect(typeof checked.add).toBe('function');
      expect(typeof checked.sub).toBe('function');
      expect(typeof checked.mul).toBe('function');
      expect(typeof checked.div).toBe('function');
      expect(typeof checked.to).toBe('function');
    });

    it('checked add works for same units', () => {
      const checked = createChecked();
      const result = checked.add(checked.m(1), checked.m(2));
      expect(checked.valueOf(result)).toBe(3);
    });

    it('checked add throws for mismatched units', () => {
      const checked = createChecked();
      expect(() => {
        checked.add(checked.m(1) as any, checked.s(1) as any);
      }).toThrow();
    });

    it('checked sub throws for mismatched units', () => {
      const checked = createChecked();
      expect(() => {
        checked.sub(checked.m(1) as any, checked.s(1) as any);
      }).toThrow();
    });

    it('checked conversion works for compatible units', () => {
      const checked = createChecked();
      const result = checked.to(checked.m, checked.km(1));
      expect(checked.valueOf(result)).toBe(1000);
    });

    it('checked conversion throws for incompatible units', () => {
      const checked = createChecked();
      expect(() => {
        checked.to(checked.s as any, checked.km(1) as any);
      }).toThrow();
    });
  });

  describe('zero-cost runtime representation', () => {
    it('quantity carries value and metadata as a tiny object', () => {
      const q = m(5);
      expect(valueOf(q)).toBe(5);
      expect(typeof valueOf(q)).toBe('number');
    });

    it('quantity object has minimal footprint', () => {
      const q = m(5);
      // Only 3 runtime properties + phantom brands (which are undefined)
      expect(q._v).toBe(5);
      expect(typeof q._s).toBe('number');
      expect(typeof q._l).toBe('string');
    });
  });
});
