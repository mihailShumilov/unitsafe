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
  parse,
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

  describe('raw string input', () => {
    describe('unit factories accept string values', () => {
      it('creates quantity from integer string', () => {
        expect(valueOf(m('5'))).toBe(5);
      });

      it('creates quantity from float string', () => {
        expect(valueOf(m('3.14'))).toBe(3.14);
      });

      it('creates quantity from negative string', () => {
        expect(valueOf(m('-10'))).toBe(-10);
      });

      it('creates quantity from string with leading/trailing whitespace', () => {
        expect(valueOf(m('  42  '))).toBe(42);
      });

      it('creates quantity from scientific notation string', () => {
        expect(valueOf(m('1e3'))).toBe(1000);
      });

      it('works with all unit factories', () => {
        expect(valueOf(km('2.5'))).toBe(2.5);
        expect(valueOf(cm('100'))).toBe(100);
        expect(valueOf(mm('500'))).toBe(500);
        expect(valueOf(s('30'))).toBe(30);
        expect(valueOf(ms('250'))).toBe(250);
        expect(valueOf(min('5'))).toBe(5);
        expect(valueOf(h('2'))).toBe(2);
        expect(valueOf(kg('75'))).toBe(75);
        expect(valueOf(g('250'))).toBe(250);
        expect(valueOf(scalar('1'))).toBe(1);
      });

      it('string-created quantities work with arithmetic', () => {
        expect(valueOf(add(m('1'), m('2')))).toBe(3);
        expect(valueOf(sub(m('5'), m('2')))).toBe(3);
        expect(valueOf(mul(m('3'), m('4')))).toBe(12);
        expect(valueOf(div(m('10'), s('2')))).toBe(5);
      });

      it('string-created quantities work with conversions', () => {
        const result = to(m, km('1.5'));
        expect(valueOf(result)).toBe(1500);
      });

      it('string-created quantities work with comparisons', () => {
        expect(eq(m('5'), m('5'))).toBe(true);
        expect(lt(m('1'), m('2'))).toBe(true);
        expect(gt(m('2'), m('1'))).toBe(true);
      });

      it('string-created quantities work with format', () => {
        expect(format(m('5'))).toBe('5 m');
        expect(format(km('1.5'))).toBe('1.5 km');
      });
    });

    describe('invalid string input throws', () => {
      it('throws on non-numeric string', () => {
        expect(() => m('abc')).toThrow();
      });

      it('throws on empty string', () => {
        expect(() => m('')).toThrow();
      });

      it('throws on whitespace-only string', () => {
        expect(() => m('   ')).toThrow();
      });

      it('throws on string with unit suffix', () => {
        expect(() => m('5 m')).toThrow();
      });
    });

    describe('parse function', () => {
      it('parses "5 m" into a meters quantity', () => {
        const result = parse('5 m');
        expect(valueOf(result)).toBe(5);
        expect(result._l).toBe('m');
      });

      it('parses "1.5 km" into a kilometers quantity', () => {
        const result = parse('1.5 km');
        expect(valueOf(result)).toBe(1.5);
        expect(result._l).toBe('km');
      });

      it('parses quantities for all built-in units', () => {
        expect(valueOf(parse('100 cm'))).toBe(100);
        expect(valueOf(parse('500 mm'))).toBe(500);
        expect(valueOf(parse('30 s'))).toBe(30);
        expect(valueOf(parse('250 ms'))).toBe(250);
        expect(valueOf(parse('5 min'))).toBe(5);
        expect(valueOf(parse('2 h'))).toBe(2);
        expect(valueOf(parse('75 kg'))).toBe(75);
        expect(valueOf(parse('250 g'))).toBe(250);
        expect(valueOf(parse('1 scalar'))).toBe(1);
      });

      it('handles negative values', () => {
        const result = parse('-10 m');
        expect(valueOf(result)).toBe(-10);
      });

      it('handles scientific notation', () => {
        const result = parse('1e3 m');
        expect(valueOf(result)).toBe(1000);
      });

      it('handles extra whitespace', () => {
        const result = parse('  5   m  ');
        expect(valueOf(result)).toBe(5);
        expect(result._l).toBe('m');
      });

      it('throws on unknown unit', () => {
        expect(() => parse('5 miles')).toThrow();
      });

      it('throws on missing value', () => {
        expect(() => parse('m')).toThrow();
      });

      it('throws on missing unit', () => {
        expect(() => parse('5')).toThrow();
      });

      it('throws on empty string', () => {
        expect(() => parse('')).toThrow();
      });

      it('throws on non-numeric value', () => {
        expect(() => parse('abc m')).toThrow();
      });
    });

    describe('checked mode with string input', () => {
      it('checked factories accept string values', () => {
        const checked = createChecked();
        expect(checked.valueOf(checked.m('5'))).toBe(5);
        expect(checked.valueOf(checked.km('2.5'))).toBe(2.5);
      });

      it('checked add works with string-created quantities', () => {
        const checked = createChecked();
        const result = checked.add(checked.m('1'), checked.m('2'));
        expect(checked.valueOf(result)).toBe(3);
      });

      it('checked parse works', () => {
        const checked = createChecked();
        const result = checked.parse('5 m');
        expect(checked.valueOf(result)).toBe(5);
        expect(result._l).toBe('m');
      });
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
